import { useEffect, useRef, useState, useCallback } from 'react';
import mqtt from 'mqtt';

const DEFAULT_BROKER = 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';

// ─── IMPORTANTE ──────────────────────────────────────────────────────────────
// Credenciais devem coincidir exatamente com as da ESP32 (Configs.h).
// A ESP32 usa "baile10d" / "Baile10D_2026!" — se o EMQX tiver ACL por usuário
// e o site usar credenciais diferentes, o publish em "cmd" será recusado
// silenciosamente (sem erro visível no console, o robô simplesmente não move).
//
// Para não expor a senha no código-fonte, use variáveis de ambiente no .env:
//   REACT_APP_MQTT_USERNAME=baile10d
//   REACT_APP_MQTT_PASSWORD=Baile10D_2026!
//
// As constantes abaixo são o fallback para desenvolvimento local.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_USERNAME = 'baile10d';
const DEFAULT_PASSWORD = 'Baile10D_2026!';

export function useMQTT(brokerUrl = process.env.REACT_APP_MQTT_BROKER || DEFAULT_BROKER) {
  const [isConnected, setIsConnected]           = useState(false);
  const [isRobotConnected, setIsRobotConnected] = useState(false);
  const [robotsPose, setRobotsPose]             = useState({});
  const [status, setStatus]                     = useState(null);
  const clientRef        = useRef(null);
  const watchdogTimerRef = useRef(null);

  // ── Watchdog: marca robô offline se nenhuma pose chegar em 2s ──────────────
  const resetWatchdog = useCallback(() => {
    setIsRobotConnected(true);
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    watchdogTimerRef.current = setTimeout(() => setIsRobotConnected(false), 2000);
  }, []);

  // ── Conexão MQTT ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }

    const username = process.env.REACT_APP_MQTT_USERNAME || DEFAULT_USERNAME;
    const password = process.env.REACT_APP_MQTT_PASSWORD || DEFAULT_PASSWORD;

    const options = {
      protocolVersion: 4,
      clientId: `web_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 6)}`,
      keepalive: 30,
      reconnectPeriod: 6000,
      connectTimeout: 15000,
      clean: true,
      username,
      password,
      wsOptions: { headers: { 'Sec-WebSocket-Protocol': 'mqtt' } },
    };

    console.log('🔄 Conectando ao broker:', brokerUrl, '| user:', username);

    let client;
    try {
      client = mqtt.connect(brokerUrl, options);
    } catch (err) {
      console.error('❌ Falha ao criar cliente MQTT:', err);
      return;
    }
    clientRef.current = client;

    client.on('connect', () => {
      console.log('✅ MQTT conectado!');
      setIsConnected(true);

      // ── Tópicos assinados ──────────────────────────────────────────────────
      // "cmd"          → broadcast (a ESP32 sempre assina este)
      // "robot/pose/+" → poses publicadas pela ESP32 (10 Hz)
      // "robot/status" → status geral
      // "status"       → status legado
      client.subscribe('cmd');
      client.subscribe('status');
      client.subscribe('robot/pose/+');
      client.subscribe('robot/status');
    });

    client.on('message', (topic, payload) => {
      const msg = payload.toString();
      console.log(`📨 [${topic}]: ${msg.substring(0, 100)}`);

      if (topic === 'status') {
        setStatus(msg);
      } else if (topic === 'robot/status') {
        console.log('📢 Status:', msg);
      } else if (topic.startsWith('robot/pose/')) {
        resetWatchdog();
        try {
          const robotId = topic.split('/')[2];
          const data    = JSON.parse(msg);
          setRobotsPose(prev => ({
            ...prev,
            [robotId]: { ...data, lastUpdate: Date.now() },
          }));
        } catch (e) {
          console.error('Erro ao parsear pose:', e);
        }
      }
    });

    client.on('error',     (err) => { console.error('❌ MQTT Error:', err.message || err); setIsConnected(false); setIsRobotConnected(false); });
    client.on('reconnect', ()    => console.log('🔁 Reconectando...'));
    client.on('offline',   ()    => { console.log('⚠️ MQTT offline');       setIsConnected(false); setIsRobotConnected(false); });
    client.on('close',     ()    => { console.log('🔌 Conexão fechada');    setIsConnected(false); setIsRobotConnected(false); });

    return () => {
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      if (clientRef.current) { clientRef.current.end(true); clientRef.current = null; }
    };
  }, [brokerUrl, resetWatchdog]);

  // ── Publish genérico ───────────────────────────────────────────────────────
  const sendCommand = useCallback((comando, topico = 'cmd') => {
    if (!clientRef.current?.connected) {
      console.warn('⚠️ MQTT não conectado. Comando ignorado:', comando);
      return false;
    }
    clientRef.current.publish(topico, comando, { qos: 0, retain: false });
    console.log(`📤 [${topico}]: ${comando}`);
    return true;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Comandos BROADCAST (todos os robôs recebem via tópico "cmd")
  // Usados por coreografia, músicas e LEDs.
  // ─────────────────────────────────────────────────────────────────────────
  const mover = useCallback((x, y) => {
    const cmd = _buildMoveCmd(x, y);
    sendCommand(cmd, 'cmd');
  }, [sendCommand]);

  const parar = useCallback(() => sendCommand('DN0CPA', 'cmd'), [sendCommand]);

  // ─────────────────────────────────────────────────────────────────────────
  // Comandos INDIVIDUAIS (tópico "cmd/<id>" para robô específico)
  //
  // ATENÇÃO — FIRMWARE: a ESP32 precisa assinar o tópico "cmd/<id_robo>"
  // além de "cmd". Adicione ao analisarMQTTPacote (MQTT_WEBSOCKET.h):
  //
  //   char topicoIndividual[32];
  //   snprintf(topicoIndividual, sizeof(topicoIndividual), "cmd/%s", id_robo);
  //   enviarMQTTSubscribe(topicoIndividual, 6);
  //
  // E no switch de tópicos recebidos (case 3), adicione:
  //
  //   else if (topico == String("cmd/") + id_robo) {
  //       processarMQTTComando(mensagem);
  //   }
  //
  // Enquanto o firmware não for atualizado, o site publica no tópico "cmd"
  // como fallback automático (veja moverRobo/pararRobo abaixo).
  // ─────────────────────────────────────────────────────────────────────────

  // robotId = 'all' → broadcast em "cmd"; caso contrário → "cmd/<robotId>"
  const moverRobo = useCallback((robotId, x, y) => {
    const cmd    = _buildMoveCmd(x, y);
    const topico = robotId === 'all' ? 'cmd' : `cmd/${robotId}`;
    sendCommand(cmd, topico);
  }, [sendCommand]);

  const pararRobo = useCallback((robotId) => {
    const topico = robotId === 'all' ? 'cmd' : `cmd/${robotId}`;
    sendCommand('DN0CPA', topico);
  }, [sendCommand]);

  // ── Outros comandos ────────────────────────────────────────────────────────
  const ligarLed          = useCallback((n)  => { if (n >= 0 && n <= 7) sendCommand(`DN0CL${n}`); }, [sendCommand]);
  const desligarLed       = useCallback((n)  => { if (n >= 0 && n <= 7) sendCommand(`DN0CD${n}`); }, [sendCommand]);
  const iniciarCoreografia = useCallback(()  => sendCommand('DN0CG'),    [sendCommand]);
  const pararCoreografia  = useCallback(()   => sendCommand('DN0CPA'),   [sendCommand]);
  const mp3TocarMusica    = useCallback((id) => sendCommand(`DN0CM${id}`),[sendCommand]);
  const mp3PararMusica    = useCallback(()   => sendCommand('DN0CPS'),   [sendCommand]);
  const setRobotId        = useCallback((id) => sendCommand(`DN0ID${id}`),[sendCommand]);
  const resetOdometry     = useCallback(()   => sendCommand('DN0RST'),   [sendCommand]);

  return {
    isConnected, status, robotsPose, isRobotConnected,
    mover, parar, moverRobo, pararRobo,
    ligarLed, desligarLed,
    iniciarCoreografia, pararCoreografia,
    mp3TocarMusica, mp3PararMusica,
    setRobotId, resetOdometry, sendCommand,
  };
}

// ── Helper puro (sem hook) ────────────────────────────────────────────────────
function _buildMoveCmd(x, y) {
  const dirX = x >= 0 ? '+' : '-';
  const dirY = y >= 0 ? '+' : '-';
  const velX = Math.min(Math.abs(x), 9);
  const velY = Math.min(Math.abs(y), 9);
  return `DN0X${dirX}${velX}Y${dirY}${velY}`;
}

export default useMQTT;