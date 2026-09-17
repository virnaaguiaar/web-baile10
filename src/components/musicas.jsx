import React, { useState, useCallback } from 'react';
import useMQTT from '../hooks/useMQTT';

const BROKER = process.env.REACT_APP_MQTT_BROKER
    || 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';

const musicasDisponiveis = [
    { nome: 'Música 1', id: 1, emoji: '🎤', cor: 'from-blue-400 to-purple-500'   },
    { nome: 'Música 2', id: 2, emoji: '🧟', cor: 'from-red-400 to-orange-500'    },
    { nome: 'Música 3', id: 3, emoji: '🎸', cor: 'from-green-400 to-emerald-500' },
];

// ─── Props ────────────────────────────────────────────────────────────────────
// robotLigado : boolean   — estado do interruptor ON/OFF do Controle
// topico      : string    — "cmd/<id_robo>" ou "cmd" (broadcast)
//               Se não informado, publica em broadcast ("cmd") como antes.
function Musicas({ robotLigado = true, topico = 'cmd' }) {
    const [musicaSelecionada, setMusicaSelecionada] = useState(null);
    const [mensagem,          setMensagem]          = useState('');
    const [isPlaying,         setIsPlaying]         = useState(false);
    const [volume,            setVolume]            = useState(25);

    const { sendCommand, isConnected } = useMQTT(BROKER);

    // O painel de áudio fica desabilitado se o robô estiver desligado
    const habilitado = isConnected && robotLigado;

    const aviso = useCallback((texto, tempo = 1800) => {
        setMensagem(texto);
        setTimeout(() => setMensagem(''), tempo);
    }, []);

    const selecionarMusica = useCallback((musica) => {
        if (!habilitado) return aviso('⚠️ Robô desligado ou desconectado!', 2000);
        setMusicaSelecionada(musica.id);
        aviso(`📀 ${musica.nome} selecionada`, 1200);
    }, [habilitado, aviso]);

    const tocar = useCallback(() => {
        if (!habilitado)        return aviso('⚠️ Robô desligado ou desconectado!', 2000);
        if (!musicaSelecionada) return aviso('⚠️ Selecione uma música!', 1500);

        const musica = musicasDisponiveis.find(m => m.id === musicaSelecionada);
        if (!musica) return;

        // 1. Ajusta volume, 2. Toca — ambos no tópico do robô selecionado
        sendCommand(`DN0VOL${volume}`, topico);
        sendCommand(`DN0CM${musica.id}`, topico);

        setIsPlaying(true);
        aviso(`🎶 Tocando: ${musica.nome}`, 2500);
    }, [habilitado, musicaSelecionada, volume, sendCommand, topico, aviso]);

    const parar = useCallback(() => {
        if (!isConnected) return aviso('⚠️ Sistema desconectado!', 2000);
        // Para a música mesmo com o robô "desligado" — comportamento seguro
        sendCommand('DN0CPS', topico);
        setIsPlaying(false);
        aviso('⏹️ Música parada', 1500);
    }, [isConnected, sendCommand, topico, aviso]);

    const handleVolume = useCallback((e) => {
        const val = Number(e.target.value);
        setVolume(val);
        if (habilitado) sendCommand(`DN0VOL${val}`, topico);
    }, [habilitado, sendCommand, topico]);

    return (
        <div className="flex flex-col items-center p-6 w-full bg-gradient-to-br from-white/95 to-amber-50/80 backdrop-blur-sm rounded-2xl border border-amber-200/30 shadow-xl shadow-amber-500/5">

            {/* Cabeçalho */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎵</span>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#f62681] to-[#F68621] bg-clip-text text-transparent">
                    Músicas
                </h3>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 text-xs mb-3">
                <span className="flex items-center gap-1">
                    <i className={`inline-block w-1.5 h-1.5 rounded-full ${habilitado ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className={habilitado ? 'text-emerald-600' : 'text-rose-600'}>
                        {!isConnected ? 'Áudio off' : !robotLigado ? 'Robô desligado' : 'Áudio pronto'}
                    </span>
                </span>
                {isPlaying && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <span className="animate-pulse">●</span> Tocando
                    </span>
                )}
            </div>

            {/* Aviso de robô desligado */}
            {!robotLigado && isConnected && (
                <div className="text-xs mb-3 font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-center">
                    🔴 Ligue o robô para controlar o áudio
                </div>
            )}

            {/* Aviso temporário */}
            {mensagem && (
                <div className={`text-xs mb-3 font-medium transition-opacity ${
                    mensagem.includes('⚠️') ? 'text-rose-500'
                    : mensagem.includes('⏹️') ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                    {mensagem}
                </div>
            )}

            {/* Grade de músicas */}
            <div className={`grid grid-cols-3 gap-2 w-full max-w-xs mb-4 transition-opacity duration-300 ${!robotLigado ? 'opacity-40 pointer-events-none' : ''}`}>
                {musicasDisponiveis.map(musica => (
                    <button
                        key={musica.id}
                        onClick={() => selecionarMusica(musica)}
                        disabled={!habilitado}
                        className={[
                            'flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-semibold',
                            'transition-all duration-300',
                            musicaSelecionada === musica.id
                                ? `bg-gradient-to-r ${musica.cor} text-white shadow-lg scale-[1.04]`
                                : 'bg-white/80 hover:bg-amber-50/80 border-2 border-amber-200/40 text-amber-800 hover:border-amber-300',
                            !habilitado ? 'cursor-not-allowed' : 'cursor-pointer',
                        ].join(' ')}
                    >
                        <span className="text-xl">{musica.emoji}</span>
                        <span className="truncate w-full text-center">{musica.nome}</span>
                    </button>
                ))}
            </div>

            {/* Botões PLAY / STOP */}
            <div className="flex gap-3 w-full max-w-xs mb-5">
                <button
                    onClick={tocar}
                    disabled={!habilitado || !musicaSelecionada || isPlaying}
                    className={[
                        'flex-1 py-2.5 rounded-xl font-bold text-white text-sm',
                        'transition-all duration-300 flex items-center justify-center gap-2',
                        (!habilitado || !musicaSelecionada || isPlaying)
                            ? 'bg-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:scale-95',
                    ].join(' ')}
                >
                    <span>▶</span> PLAY
                </button>
                <button
                    onClick={parar}
                    disabled={!isConnected || !isPlaying}
                    className={[
                        'flex-1 py-2.5 rounded-xl font-bold text-white text-sm',
                        'transition-all duration-300 flex items-center justify-center gap-2',
                        (!isConnected || !isPlaying)
                            ? 'bg-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-lg hover:shadow-rose-500/25 hover:-translate-y-0.5 active:scale-95',
                    ].join(' ')}
                >
                    <span>⏹</span> STOP
                </button>
            </div>

            {/* Cursor de volume */}
            <div className={`w-full max-w-xs transition-opacity duration-300 ${!robotLigado ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                        🔊 Volume
                    </span>
                    <span className={[
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        volume === 0  ? 'bg-gray-100 text-gray-400'
                        : volume < 10 ? 'bg-blue-50 text-blue-600'
                        : volume < 20 ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600',
                    ].join(' ')}>
                        {volume === 0 ? '🔇 Mudo' : `${volume}/30`}
                    </span>
                </div>

                <input
                    type="range"
                    min={0} max={30} step={1}
                    value={volume}
                    onChange={handleVolume}
                    disabled={!habilitado}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                />

                <div className="flex justify-between mt-2 gap-1">
                    {[0, 10, 20, 25, 30].map(v => (
                        <button
                            key={v}
                            onClick={() => {
                                setVolume(v);
                                if (habilitado) sendCommand(`DN0VOL${v}`, topico);
                            }}
                            disabled={!habilitado}
                            className={[
                                'flex-1 py-1 rounded-lg text-[10px] font-bold transition-all',
                                volume === v
                                    ? 'bg-gradient-to-r from-[#f62681] to-[#F68621] text-white'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                                !habilitado ? 'opacity-40 cursor-not-allowed' : '',
                            ].join(' ')}
                        >
                            {v === 0 ? '🔇' : v}
                        </button>
                    ))}
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 mt-1 px-0.5">
                    <span>Mudo</span>
                    <span>Máximo</span>
                </div>
            </div>

            <div className="mt-4 text-[10px] text-amber-400/60 text-center">
                Selecione uma música e pressione PLAY
            </div>
        </div>
    );
}

export default Musicas;