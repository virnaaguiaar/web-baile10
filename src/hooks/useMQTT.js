import { useEffect, useRef, useState, useCallback } from 'react';
import mqtt from 'mqtt';

const DEFAULT_BROKER   = 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';
const DEFAULT_USERNAME = 'baile10d';
const DEFAULT_PASSWORD = 'Baile10D_2026!';

// ─── CREDENCIAIS ─────────────────────────────────────────────────────────────
// Devem coincidir com as do Configs.h (ESP32).
// Prefira definir via .env:
//   REACT_APP_MQTT_USERNAME=baile10d
//   REACT_APP_MQTT_PASSWORD=Baile10D_2026!
// ─────────────────────────────────────────────────────────────────────────────

export function useMQTT(
  brokerUrl = process.env.REACT_APP_MQTT_BROKER || DEFAULT_BROKER,
  watchedRobotId = null   // robô a observar para isRobotConnected (opcional)
) {
  const [isConnected,      setIsConnected]      = useState(false);
  const [isRobotConnected, setIsRobotConnected] = useState(false);
  const [robotsPose,       setRobotsPose]       = useState({});
  const [status,           setStatus]           = useState(null);

  const clientRef         = useRef(null);
  const watchdogTimerRef  = useRef(null);
  const watchedRobotIdRef = useRef(watchedRobotId);

  useEffect(() => { watchedRobotIdRef.current = watchedRobotId; }, [watchedRobotId]);

  // ── Watchdog filtrado pelo robô selecionado ────────────────────────────────
  // isRobotConnected só fica verde se a pose do robô SELECIONADO chegar.
  // Se nenhum robô específico for observado, qualquer pose serve.
  const resetWatchdog = useCallback((id_robo) => {
    const watched = watchedRobotIdRef.current;
    if (watched && id_robo !== watched) return;

    setIsRobotConnected(true);
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    watchdogTimerRef.current = setTimeout(() => setIsRobotConnected(false), 3000);
  }, []);

  // ── Conexão MQTT ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (clientRef.current) { clientRef.current.end(true); clientRef.current = null; }

    const username = process.env.REACT_APP_MQTT_USERNAME || DEFAULT_USERNAME;
    const password = process.env.REACT_APP_MQTT_PASSWORD || DEFAULT_PASSWORD;

    const options = {
      protocolVersion: 4,
      clientId: `web_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 6)}`,
      keepalive:       30,
      reconnectPeriod: 6000,
      connectTimeout:  15000,
      clean:           true,
      username,
      password,
      wsOptions: { headers: { 'Sec-WebSocket-Protocol': 'mqtt' } },
    };

    console.log('🔄 Conectando ao broker:', brokerUrl, '| user:', username);

    let client;
    try { client = mqtt.connect(brokerUrl, options); }
    catch (err) { console.error('❌ Falha ao criar cliente MQTT:', err); return; }
    clientRef.current = client;

    client.on('connect', () => {
      console.log('✅ MQTT conectado!');
      setIsConnected(true);
      client.subscribe('cmd');
      client.subscribe('status');
      client.subscribe('robo/pose/+');  // alimenta o mapa com todos os robôs
      client.subscribe('robo/status');
    });

    client.on('message', (topic, payload) => {
      const msg = payload.toString();

      if (topic === 'status') {
        setStatus(msg);
      } else if (topic === 'robo/status') {
        console.log('📢 Status:', msg);
      } else if (topic.startsWith('robo/pose/')) {
        const id_robo = topic.split('/')[2];
        resetWatchdog(id_robo);
        try {
          const data = JSON.parse(msg);
          setRobotsPose(prev => ({
            ...prev,
            [id_robo]: { ...data, lastUpdate: Date.now() },
          }));
          console.log(`📍 Pose [${id_robo}]: x=${data.x?.toFixed(2)} y=${data.y?.toFixed(2)}`);
        } catch (e) { console.error('Erro ao parsear pose:', e); }
      }
    });

    client.on('error',     (err) => { console.error('❌ MQTT Error:', err.message || err); setIsConnected(false); setIsRobotConnected(false); });
    client.on('reconnect', ()    => console.log('🔁 Reconectando...'));
    client.on('offline',   ()    => { setIsConnected(false); setIsRobotConnected(false); });
    client.on('close',     ()    => { setIsConnected(false); setIsRobotConnected(false); });

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

  const mover     = useCallback((x, y) => sendCommand(_buildMoveCmd(x, y), 'cmd'), [sendCommand]);
  const parar     = useCallback(()      => sendCommand('DN0CPA', 'cmd'),            [sendCommand]);

  const moverRobo = useCallback((id_robo, x, y) => {
    sendCommand(_buildMoveCmd(x, y), id_robo === 'all' ? 'cmd' : `cmd/${id_robo}`);
  }, [sendCommand]);

  const pararRobo = useCallback((id_robo) => {
    sendCommand('DN0CPA', id_robo === 'all' ? 'cmd' : `cmd/${id_robo}`);
  }, [sendCommand]);

  const ligarLed           = useCallback((n)  => { if (n >= 0 && n <= 7) sendCommand(`DN0CL${n}`); },  [sendCommand]);
  const desligarLed        = useCallback((n)  => { if (n >= 0 && n <= 7) sendCommand(`DN0CD${n}`); },  [sendCommand]);
  const iniciarCoreografia = useCallback(()   => sendCommand('DN0CG'),                                  [sendCommand]);
  const pararCoreografia   = useCallback(()   => sendCommand('DN0CPA'),                                 [sendCommand]);
  const mp3TocarMusica     = useCallback((id) => sendCommand(`DN0CM${id}`),                             [sendCommand]);
  const mp3PararMusica     = useCallback(()   => sendCommand('DN0CPS'),                                 [sendCommand]);
  const setRobotId         = useCallback((id) => sendCommand(`DN0ID${id}`),                             [sendCommand]);
  const resetOdometry      = useCallback(()   => sendCommand('DN0RSTODO'),                              [sendCommand]);

  return {
    isConnected, status, robotsPose, isRobotConnected,
    mover, parar, moverRobo, pararRobo,
    ligarLed, desligarLed,
    iniciarCoreografia, pararCoreografia,
    mp3TocarMusica, mp3PararMusica,
    setRobotId, resetOdometry, sendCommand,
  };
}

function _buildMoveCmd(x, y) {
  const dirX = x >= 0 ? '+' : '-';
  const dirY = y >= 0 ? '+' : '-';
  return `DN0X${dirX}${Math.min(Math.abs(x), 9)}Y${dirY}${Math.min(Math.abs(y), 9)}`;
}

export default useMQTT;