import React, { useState, useCallback } from 'react';
import useMQTT from '../hooks/useMQTT';

const BROKER = process.env.REACT_APP_MQTT_BROKER
    || 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';

// Cartão SD tem 3 músicas — ajuste os nomes conforme os arquivos reais no SD
const musicasDisponiveis = [
    { nome: 'Música 1', id: 1, emoji: '🎤', cor: 'from-blue-400 to-purple-500'   },
    { nome: 'Música 2', id: 2, emoji: '🧟', cor: 'from-red-400 to-orange-500'    },
    { nome: 'Música 3', id: 3, emoji: '🎸', cor: 'from-green-400 to-emerald-500' },
];

function Musicas() {
    const [musicaSelecionada, setMusicaSelecionada] = useState(null);
    const [mensagem,          setMensagem]          = useState('');
    const [isPlaying,         setIsPlaying]         = useState(false);
    const [volume,            setVolume]            = useState(25); // 0–30

    const { sendCommand, isConnected } = useMQTT(BROKER);

    const aviso = useCallback((texto, tempo = 1800) => {
        setMensagem(texto);
        setTimeout(() => setMensagem(''), tempo);
    }, []);

    // ── Selecionar música ────────────────────────────────────────────────────
    const selecionarMusica = useCallback((musica) => {
        if (!isConnected) return aviso('⚠️ Sistema desconectado!', 2000);
        setMusicaSelecionada(musica.id);
        aviso(`📀 ${musica.nome} selecionada`, 1200);
    }, [isConnected, aviso]);

    // ── Play ─────────────────────────────────────────────────────────────────
    // Ordem: volume primeiro, depois play.
    // O firmware agora reconhece DN0VOL (corrigido no MQTT_WEBSOCKET.h).
    const tocar = useCallback(() => {
        if (!isConnected)       return aviso('⚠️ Sistema desconectado!', 2000);
        if (!musicaSelecionada) return aviso('⚠️ Selecione uma música!', 1500);

        const musica = musicasDisponiveis.find(m => m.id === musicaSelecionada);
        if (!musica) return;

        // 1. Ajusta volume antes de tocar
        sendCommand(`DN0VOL${volume}`, 'cmd');
        // 2. Toca a música pelo ID do arquivo no SD (001.mp3, 002.mp3, 003.mp3)
        sendCommand(`DN0CM${musica.id}`, 'cmd');

        setIsPlaying(true);
        aviso(`🎶 Tocando: ${musica.nome}`, 2500);
    }, [isConnected, musicaSelecionada, volume, sendCommand, aviso]);

    // ── Stop ─────────────────────────────────────────────────────────────────
    const parar = useCallback(() => {
        if (!isConnected) return aviso('⚠️ Sistema desconectado!', 2000);
        sendCommand('DN0CPS', 'cmd');
        setIsPlaying(false);
        aviso('⏹️ Música parada', 1500);
    }, [isConnected, sendCommand, aviso]);

    // ── Mudança de volume em tempo real ──────────────────────────────────────
    // Envia DN0VOL imediatamente ao mover o cursor;
    // o firmware aplica via mp3SetVolume() (DFPlayer volume 0–30).
    const handleVolume = useCallback((e) => {
        const val = Number(e.target.value);
        setVolume(val);
        if (isConnected) sendCommand(`DN0VOL${val}`, 'cmd');
    }, [isConnected, sendCommand]);

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
                    <i className={`inline-block w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className={isConnected ? 'text-emerald-600' : 'text-rose-600'}>
                        {isConnected ? 'Áudio pronto' : 'Áudio off'}
                    </span>
                </span>
                {isPlaying && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <span className="animate-pulse">●</span> Tocando
                    </span>
                )}
            </div>

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

            {/* Grade de músicas — 3 músicas (cartão SD) */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-4">
                {musicasDisponiveis.map(musica => (
                    <button
                        key={musica.id}
                        onClick={() => selecionarMusica(musica)}
                        disabled={!isConnected}
                        className={[
                            'flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-semibold',
                            'transition-all duration-300',
                            musicaSelecionada === musica.id
                                ? `bg-gradient-to-r ${musica.cor} text-white shadow-lg scale-[1.04]`
                                : 'bg-white/80 hover:bg-amber-50/80 border-2 border-amber-200/40 text-amber-800 hover:border-amber-300',
                            !isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
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
                    disabled={!isConnected || !musicaSelecionada || isPlaying}
                    className={[
                        'flex-1 py-2.5 rounded-xl font-bold text-white text-sm',
                        'transition-all duration-300 flex items-center justify-center gap-2',
                        (!isConnected || !musicaSelecionada || isPlaying)
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

            {/* ── Cursor de volume ─────────────────────────────────────────── */}
            <div className="w-full max-w-xs">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                        🔊 Volume
                    </span>
                    <span className={[
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        volume === 0
                            ? 'bg-gray-100 text-gray-400'
                            : volume < 10
                            ? 'bg-blue-50 text-blue-600'
                            : volume < 20
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-rose-50 text-rose-600',
                    ].join(' ')}>
                        {volume === 0 ? '🔇 Mudo' : `${volume}/30`}
                    </span>
                </div>

                {/* Cursor principal */}
                <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={volume}
                    onChange={handleVolume}
                    disabled={!isConnected}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                />

                {/* Atalhos de volume */}
                <div className="flex justify-between mt-2 gap-1">
                    {[0, 10, 20, 25, 30].map(v => (
                        <button
                            key={v}
                            onClick={() => {
                                setVolume(v);
                                if (isConnected) sendCommand(`DN0VOL${v}`, 'cmd');
                            }}
                            disabled={!isConnected}
                            className={[
                                'flex-1 py-1 rounded-lg text-[10px] font-bold transition-all',
                                volume === v
                                    ? 'bg-gradient-to-r from-[#f62681] to-[#F68621] text-white'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                                !isConnected ? 'opacity-40 cursor-not-allowed' : '',
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