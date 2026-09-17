import React, { useState, useCallback, useEffect, useRef } from 'react';
import useMQTT from '../hooks/useMQTT';
import RobotPicker from './RobotPicker';

// ─── Configurações das formas ────────────────────────────────────────────────
const FORMAS = [
  {
    id: 'quadrado',
    label: 'Quadrado',
    cmd: (lado) => `DN0QUADRD${lado.toFixed(2)}`,
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <rect x="4" y="4" width="32" height="32" stroke="currentColor" strokeWidth="3" fill="none" />
      </svg>
    ),
    cor: 'from-blue-500 to-blue-700',
    corBg: 'bg-blue-50',
    corBorda: 'border-blue-400',
    ladoPadrao: 0.8,
    ladoMin: 0.3,
    ladoMax: 2.0,
    info: {
      titulo: 'Quadrado',
      descricao: 'O robô percorre 4 lados iguais girando 90° em cada canto.',
      passos: [
        'Posicione o robô no centro da área livre, voltado para frente.',
        'Garanta pelo menos (lado × 1.5) metros de espaço em todas as direções.',
        'Para lado = 0.8 m, a área mínima recomendada é 1.5 m × 1.5 m.',
        'Superfície plana e sem obstáculos.',
      ],
      tempoEstimado: (lado) => `~${Math.round(lado * 4 / 0.3)} s`,
    },
  },
  {
    id: 'triangulo',
    label: 'Triângulo',
    cmd: (lado) => `DN0TRIANG${lado.toFixed(2)}`,
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <polygon points="20,4 36,36 4,36" stroke="currentColor" strokeWidth="3" fill="none" />
      </svg>
    ),
    cor: 'from-emerald-500 to-emerald-700',
    corBg: 'bg-emerald-50',
    corBorda: 'border-emerald-400',
    ladoPadrao: 0.8,
    ladoMin: 0.3,
    ladoMax: 2.0,
    info: {
      titulo: 'Triângulo Equilátero',
      descricao: 'O robô percorre 3 lados iguais girando 120° em cada vértice.',
      passos: [
        'Posicione o robô na base do triângulo, voltado para a frente.',
        'A altura do triângulo é ≈ lado × 0.87 — reserve esse espaço à frente.',
        'Para lado = 0.8 m, a área necessária é ~1.2 m × 0.9 m.',
        'Superfície plana, sem obstáculos.',
      ],
      tempoEstimado: (lado) => `~${Math.round(lado * 3 / 0.3)} s`,
    },
  },
  {
    id: 'coracao',
    label: 'Coração',
    cmd: (lado) => `DN0COR${lado.toFixed(2)}`,
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <path
          d="M20 34 C20 34 4 24 4 14 C4 9 8 6 12 6 C15.5 6 18 8 20 11 C22 8 24.5 6 28 6 C32 6 36 9 36 14 C36 24 20 34 20 34Z"
          stroke="currentColor" strokeWidth="3" fill="none"
        />
      </svg>
    ),
    cor: 'from-rose-500 to-pink-700',
    corBg: 'bg-rose-50',
    corBorda: 'border-rose-400',
    ladoPadrao: 0.8,
    ladoMin: 0.3,
    ladoMax: 1.5,
    info: {
      titulo: 'Coração',
      descricao: 'Sequência de segmentos e curvas aproximadas que formam um coração simétrico.',
      passos: [
        'Posicione o robô na ponta inferior do coração, voltado para cima.',
        'Reserve uma área de (tamanho × 2) m de largura e (tamanho × 2) m de altura.',
        'Para tamanho = 0.8 m, use pelo menos 2 m × 2 m de área livre.',
        'É a forma mais sensível a erros de odometria — use em superfície lisa.',
      ],
      tempoEstimado: (lado) => `~${Math.round(lado * 10 / 0.3)} s`,
    },
  },
];

// ─── Mapa de piso (RobotFloorMap embutido) ──────────────────────────────────
const ARENA_W = 5.0;
const ARENA_H = 5.0;
const CORES_ROBO = ['#f62681', '#2563eb', '#db2777', '#7c3aed', '#0891b2', '#ea580c', '#ca8a04', '#16a34a'];

function FloorMap({ robotsPose, mqttOnline, selectedRobotId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Fundo
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, W, H);

    // Grade
    ctx.strokeStyle = 'rgba(246,38,129,0.08)';
    ctx.lineWidth = 1;
    const cols = 10;
    const rows = 10;
    for (let i = 0; i <= cols; i++) {
      const x = (i / cols) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      const y = (j / rows) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Centro
    const cx = W / 2, cy = H / 2;
    ctx.strokeStyle = 'rgba(246,38,129,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.setLineDash([]);

    // Escala
    const escalaX = W / ARENA_W;
    const escalaY = H / ARENA_H;

    const toCanvas = (x, y) => ({
      px: cx + x * escalaX,
      py: cy - y * escalaY,
    });

    // Robôs
    const robos = Object.entries(robotsPose);
    robos.forEach(([id, pose], idx) => {
      const { px, py } = toCanvas(pose.x || 0, pose.y || 0);
      const cor = CORES_ROBO[idx % CORES_ROBO.length];
      const isSelected = id === selectedRobotId;
      const stale = (Date.now() - (pose.lastUpdate || 0)) > 3000;

      // Sombra/destaque para o selecionado
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle = cor + '30';
        ctx.fill();
      }

      // Direção (theta)
      const theta = pose.theta || 0;
      const dirLen = isSelected ? 18 : 14;
      ctx.strokeStyle = stale ? '#ccc' : cor;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(theta) * dirLen, py - Math.sin(theta) * dirLen);
      ctx.stroke();

      // Corpo
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 10 : 7, 0, Math.PI * 2);
      ctx.fillStyle = stale ? '#ccc' : cor;
      ctx.fill();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${isSelected ? 9 : 8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(id.replace('robo', ''), px, py);
    });

    // Status offline
    if (!mqttOnline) {
      ctx.fillStyle = 'rgba(239,68,68,0.08)';
      ctx.fillRect(0, 0, W, H);
    }
  }, [robotsPose, mqttOnline, selectedRobotId]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-pink-200 shadow-inner bg-gray-50">
      <canvas ref={canvasRef} width={340} height={260} className="w-full h-auto" />
      {!mqttOnline && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-red-400 bg-white/80 px-3 py-1 rounded-full">
            ⚠️ Sem conexão MQTT
          </span>
        </div>
      )}
      {/* Legenda */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-0.5">
        {Object.keys(robotsPose).slice(0, 4).map((id, idx) => (
          <div key={id} className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded text-[9px] font-bold">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: CORES_ROBO[idx % CORES_ROBO.length] }} />
            {id}
          </div>
        ))}
      </div>
      {/* Escala */}
      <div className="absolute bottom-2 left-2 text-[9px] text-gray-400 bg-white/70 px-1.5 py-0.5 rounded">
        {ARENA_W} m × {ARENA_H} m
      </div>
    </div>
  );
}

// ─── Modal de informações ────────────────────────────────────────────────────
function ModalInfo({ forma, lado, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!forma) return null;
  const { info } = forma;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className={`bg-gradient-to-r ${forma.cor} p-5 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                {forma.icon}
              </div>
              <div>
                <div className="text-xs font-semibold opacity-75 uppercase tracking-wider">
                  Coreografia
                </div>
                <div className="text-xl font-bold">{info.titulo}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{info.descricao}</p>

          {/* Tempo estimado */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-lg">⏱️</span>
            <div>
              <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                Tempo estimado
              </div>
              <div className="text-sm font-bold text-amber-900">
                {info.tempoEstimado(lado)} para lado = {lado.toFixed(1)} m
              </div>
            </div>
          </div>

          {/* Passos */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Como posicionar
            </div>
            {info.passos.map((passo, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className={`
                  flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                  text-[10px] font-black text-white mt-0.5
                  bg-gradient-to-br ${forma.cor}
                `}>
                  {i + 1}
                </span>
                <p className="text-xs text-gray-600 leading-relaxed">{passo}</p>
              </div>
            ))}
          </div>

          {/* Aviso */}
          <div className="flex gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 items-start">
            <span className="text-base mt-0.5">⚠️</span>
            <p className="text-xs text-rose-700 leading-relaxed">
              Certifique-se de que nenhuma pessoa ou objeto esteja na área de movimento
              antes de iniciar a coreografia.
            </p>
          </div>

          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r ${forma.cor} transition-all hover:opacity-90 active:scale-95`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function CoreografiaFormas({ robotsPose = {}, id_robo = 'robo1', onRobotIdChange = () => {} }) {
  const brokerUrl = process.env.REACT_APP_MQTT_BROKER
    || 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';

  const { sendCommand, isConnected } = useMQTT(brokerUrl);

  const [formaSelecionada, setFormaSelecionada] = useState(FORMAS[0]);
  const [lado,             setLado]             = useState(FORMAS[0].ladoPadrao);
  const [executando,       setExecutando]       = useState(false);
  const [mensagem,         setMensagem]         = useState('');
  const [modalAberto,      setModalAberto]      = useState(false);

  // Resolve tópico: individual ou broadcast
  const topico = useCallback(
    () => (id_robo === 'Todos' ? 'cmd' : `cmd/${id_robo}`),
    [id_robo]
  );

  const aviso = useCallback((txt, ms = 2500) => {
    setMensagem(txt);
    setTimeout(() => setMensagem(''), ms);
  }, []);

  const iniciar = useCallback(() => {
    if (!isConnected) return aviso('⚠️ Sem conexão MQTT.');
    if (executando)   return aviso('⚠️ Já em execução.');
    const cmd = formaSelecionada.cmd(lado);
    sendCommand(cmd, topico());
    setExecutando(true);
    aviso(`🔷 ${formaSelecionada.label} iniciado — lado ${lado.toFixed(1)} m`, 3000);
    // O firmware não retorna confirmação de término, então simulamos um
    // timeout proporcional ao tamanho para liberar o botão
    const ms = Math.round(lado * formaSelecionada.info.passos.length * 4000);
    setTimeout(() => setExecutando(false), Math.max(ms, 4000));
  }, [isConnected, executando, formaSelecionada, lado, sendCommand, topico, aviso]);

  const parar = useCallback(() => {
    // Envia em broadcast E no tópico individual: as funções de forma
    // geométrica no firmware são bloqueantes (while + delay), o ESP32
    // só processa o próximo pacote MQTT ao terminar cada iteração.
    // Mandando nos dois tópicos garantimos que o DN0CPA entre no buffer.
    sendCommand('DN0CPA', 'cmd');
    if (id_robo !== 'Todos') sendCommand('DN0CPA', `cmd/${id_robo}`);
    setExecutando(false);
    aviso('🛑 Parado.');
  }, [sendCommand, id_robo, aviso]);

  // Ao trocar forma, volta ao lado padrão dela
  const selecionarForma = useCallback((forma) => {
    setFormaSelecionada(forma);
    setLado(forma.ladoPadrao);
    setExecutando(false);
  }, []);

  return (
    <>
      {modalAberto && (
        <ModalInfo
          forma={formaSelecionada}
          lado={lado}
          onClose={() => setModalAberto(false)}
        />
      )}

      <div className="flex flex-col items-center w-full max-w-[1100px] mx-auto gap-6 py-4">

        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <div className="w-full bg-white/95 backdrop-blur-sm border-2 border-amber-200/50 rounded-3xl shadow-xl shadow-amber-500/10 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-pink-950 tracking-tight">
                Coreografia Geométrica
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                O robô desenha a forma escolhida no chão com movimentos precisos.
              </p>
            </div>
            <div className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 ${
              isConnected
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
              {isConnected ? 'Conectado' : 'Offline'}
            </div>
          </div>
        </div>

        {/* ── Grid principal ─────────────────────────────────────────────── */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Coluna esquerda: seletor + controles */}
          <div className="flex flex-col gap-4">

            {/* Seleção de robô */}
            <div className="bg-white/95 border-2 border-amber-200/50 rounded-2xl shadow-lg p-4">
              <RobotPicker
                id_robo={id_robo}
                onRobotIdChange={onRobotIdChange}
                robotsPose={robotsPose}
                maxRobos={5}
              />
              <div className="mt-2 text-center text-xs text-gray-400 font-mono">
                Tópico: <span className="text-pink-500">{topico()}</span>
              </div>
            </div>

            {/* Seletor de forma */}
            <div className="bg-white/95 border-2 border-amber-200/50 rounded-2xl shadow-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-pink-950">Escolha a forma</h2>
                <button
                  onClick={() => setModalAberto(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all"
                >
                  <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current">
                    <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a1 1 0 110 2 1 1 0 010-2zm0 3a1 1 0 011 1v4a1 1 0 11-2 0V9a1 1 0 011-1z" />
                  </svg>
                  Como posicionar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {FORMAS.map((forma) => {
                  const ativa = formaSelecionada.id === forma.id;
                  return (
                    <button
                      key={forma.id}
                      onClick={() => selecionarForma(forma)}
                      className={`
                        relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2
                        transition-all duration-200 focus:outline-none
                        focus-visible:ring-2 focus-visible:ring-pink-400
                        ${ativa
                          ? `bg-gradient-to-br ${forma.cor} text-white border-transparent shadow-lg scale-[1.03]`
                          : `${forma.corBg} ${forma.corBorda} text-gray-700 hover:scale-[1.02] hover:shadow-md`
                        }
                      `}
                    >
                      <div className={ativa ? 'text-white' : 'text-gray-600'}>
                        {forma.icon}
                      </div>
                      <span className="text-xs font-bold leading-tight text-center">
                        {forma.label}
                      </span>
                      {ativa && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white/80" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ajuste do lado */}
            <div className="bg-white/95 border-2 border-amber-200/50 rounded-2xl shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black text-pink-950">Tamanho do lado</h2>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f62681] to-[#F68621]">
                  {lado.toFixed(1)} m
                </span>
              </div>

              <input
                type="range"
                min={formaSelecionada.ladoMin}
                max={formaSelecionada.ladoMax}
                step={0.1}
                value={lado}
                onChange={(e) => setLado(parseFloat(e.target.value))}
                disabled={executando}
                className="w-full disabled:opacity-40"
              />

              <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                <span>{formaSelecionada.ladoMin} m</span>
                <span>{formaSelecionada.ladoMax} m</span>
              </div>

              {/* Atalhos rápidos */}
              <div className="flex gap-2 mt-3">
                {[0.5, 0.8, 1.0, 1.5].filter(v =>
                  v >= formaSelecionada.ladoMin && v <= formaSelecionada.ladoMax
                ).map((v) => (
                  <button
                    key={v}
                    onClick={() => setLado(v)}
                    disabled={executando}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${
                      Math.abs(lado - v) < 0.05
                        ? 'bg-gradient-to-r from-[#f62681] to-[#F68621] text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    {v.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col gap-3">
              {mensagem && (
                <div className={`text-center text-sm font-bold py-2 px-4 rounded-xl transition-all ${
                  mensagem.startsWith('⚠️') || mensagem.startsWith('🛑')
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {mensagem}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={iniciar}
                  disabled={!isConnected || executando}
                  className={`
                    flex-1 py-4 rounded-2xl font-black text-white text-base
                    transition-all duration-200 flex items-center justify-center gap-2
                    ${(!isConnected || executando)
                      ? 'bg-gray-300 cursor-not-allowed opacity-50'
                      : `bg-gradient-to-r ${formaSelecionada.cor} hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg`
                    }
                  `}
                >
                  {executando ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Executando…
                    </>
                  ) : (
                    <>
                      {formaSelecionada.icon}
                      Iniciar {formaSelecionada.label}
                    </>
                  )}
                </button>

                <button
                  onClick={parar}
                  disabled={!isConnected}
                  className="px-6 py-4 rounded-2xl font-black text-white text-sm bg-gradient-to-br from-rose-600 to-red-700 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <svg viewBox="0 0 20 20" className="w-4 h-4 fill-white flex-shrink-0">
                    <rect x="4" y="4" width="12" height="12" rx="2" />
                  </svg>
                  STOP
                </button>
              </div>

              {executando && (
                <p className="text-center text-xs text-gray-500">
                  O robô está desenhando — aguarde a conclusão ou pressione 🛑 para interromper.
                </p>
              )}
            </div>
          </div>

          {/* Coluna direita: mapa + preview */}
          <div className="flex flex-col gap-4">

            {/* Mapa de piso */}
            <div className="bg-white/95 border-2 border-amber-200/50 rounded-2xl shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black text-pink-950">Posição dos robôs</h2>
                <span className="text-xs text-gray-400 font-mono">
                  {Object.keys(robotsPose).length} robô(s) visível(is)
                </span>
              </div>
              <FloorMap
                robotsPose={robotsPose}
                mqttOnline={isConnected}
                selectedRobotId={id_robo}
              />
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Seta = direção do robô · Círculo maior = robô selecionado
              </p>
            </div>

            {/* Card de prévia da forma */}
            <div className={`bg-white/95 border-2 ${formaSelecionada.corBorda} rounded-2xl shadow-lg p-5`}>
              <h2 className="text-base font-black text-pink-950 mb-1">Prévia da trajetória</h2>
              <p className="text-xs text-gray-500 mb-4">
                {formaSelecionada.info.descricao}
              </p>

              {/* SVG de preview */}
              <div className={`${formaSelecionada.corBg} rounded-2xl p-6 flex items-center justify-center`}>
                <TrajetoriaPreview forma={formaSelecionada} lado={lado} />
              </div>

              {/* Dimensões */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Lado</div>
                  <div className="text-lg font-black text-amber-900">{lado.toFixed(1)} m</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Tempo est.</div>
                  <div className="text-lg font-black text-amber-900">
                    {formaSelecionada.info.tempoEstimado(lado)}
                  </div>
                </div>
              </div>

              {/* Botão info inline */}
              <button
                onClick={() => setModalAberto(true)}
                className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold border-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current">
                  <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a1 1 0 110 2 1 1 0 010-2zm0 3a1 1 0 011 1v4a1 1 0 11-2 0V9a1 1 0 011-1z" />
                </svg>
                Ver instruções de posicionamento
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Preview SVG animado da trajetória ──────────────────────────────────────
function TrajetoriaPreview({ forma, lado }) {
  const size = 160;
  const pad  = 24;
  const area = size - pad * 2;

  // Normaliza para o SVG
  const max = forma.ladoMax;
  const s   = (area / max) * lado;

  let pontos = [];

  if (forma.id === 'quadrado') {
    const x0 = (size - s) / 2;
    const y0 = (size - s) / 2;
    pontos = [
      [x0,     y0],
      [x0 + s, y0],
      [x0 + s, y0 + s],
      [x0,     y0 + s],
      [x0,     y0],
    ];
  } else if (forma.id === 'triangulo') {
    const h = s * Math.sqrt(3) / 2;
    const cx = size / 2;
    const cy = size / 2;
    pontos = [
      [cx,         cy - h * 2 / 3],
      [cx + s / 2, cy + h / 3],
      [cx - s / 2, cy + h / 3],
      [cx,         cy - h * 2 / 3],
    ];
  } else if (forma.id === 'coracao') {
    // Aproximação do coração com curvas de Bézier
    const cx = size / 2;
    const cy = size / 2 + s * 0.1;
    const sc = s * 0.55;
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[160px]">
        <path
          d={`M ${cx} ${cy + sc * 0.6}
              C ${cx - sc * 0.05} ${cy + sc * 0.3},
                ${cx - sc * 0.8} ${cy},
                ${cx - sc * 0.6} ${cy - sc * 0.4}
              C ${cx - sc * 0.4} ${cy - sc * 0.8},
                ${cx} ${cy - sc * 0.5},
                ${cx} ${cy - sc * 0.15}
              C ${cx} ${cy - sc * 0.5},
                ${cx + sc * 0.4} ${cy - sc * 0.8},
                ${cx + sc * 0.6} ${cy - sc * 0.4}
              C ${cx + sc * 0.8} ${cy},
                ${cx + sc * 0.05} ${cy + sc * 0.3},
                ${cx} ${cy + sc * 0.6} Z`}
          fill="none"
          stroke="url(#gradCoracao)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeDasharray="400"
          strokeDashoffset="0"
        />
        <defs>
          <linearGradient id="gradCoracao" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f62681" />
            <stop offset="100%" stopColor="#F68621" />
          </linearGradient>
        </defs>
        {/* Ponto de início */}
        <circle cx={cx} cy={cy + sc * 0.6} r="4" fill="#f62681" />
        <circle cx={cx} cy={cy + sc * 0.6} r="8" fill="#f62681" fillOpacity="0.2" />
      </svg>
    );
  }

  const d = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const gradId = `grad_${forma.id}`;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[160px]">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f62681" />
          <stop offset="100%" stopColor="#F68621" />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Ponto de início */}
      {pontos[0] && (
        <>
          <circle cx={pontos[0][0]} cy={pontos[0][1]} r="4" fill="#f62681" />
          <circle cx={pontos[0][0]} cy={pontos[0][1]} r="8" fill="#f62681" fillOpacity="0.2" />
        </>
      )}
    </svg>
  );
}