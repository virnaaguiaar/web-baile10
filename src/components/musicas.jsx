import React, { useState, useCallback } from 'react';
import useMQTT from '../hooks/useMQTT';

const BROKER = process.env.REACT_APP_MQTT_BROKER
    || 'wss://e2792d91.ala.us-east-1.emqxsl.com:8084/mqtt';

const musicasDisponiveis = [
    { nome: 'Música 1', id: 1, emoji: '🎤', cor: 'from-[#f62681] to-[#be185d]'   },
    { nome: 'Música 2', id: 2, emoji: '🧟', cor: 'from-[#e8197a] to-[#9d174d]'   },
    { nome: 'Música 3', id: 3, emoji: '🎸', cor: 'from-[#f43f8a] to-[#db2777]'   },
];

function Musicas({ robotLigado = true, topico = 'cmd' }) {
    const [musicaSelecionada, setMusicaSelecionada] = useState(null);
    const [mensagem,          setMensagem]          = useState('');
    const [isPlaying,         setIsPlaying]         = useState(false);
    const [volume,            setVolume]            = useState(25);

    const { sendCommand, isConnected } = useMQTT(BROKER);
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
        sendCommand(`DN0VOL${volume}`, topico);
        sendCommand(`DN0CM${musica.id}`, topico);
        setIsPlaying(true);
        aviso(`🎶 Tocando: ${musica.nome}`, 2500);
    }, [habilitado, musicaSelecionada, volume, sendCommand, topico, aviso]);

    const parar = useCallback(() => {
        if (!isConnected) return aviso('⚠️ Sistema desconectado!', 2000);
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
        <div className="flex flex-col items-center p-5 w-full bg-white rounded-2xl border border-[#f62681]/15 shadow-lg shadow-[#f62681]/8">

            {/* Cabeçalho */}
            <div className="flex items-center gap-2 mb-3 w-full justify-center">
                <span className="text-xl">🎵</span>
                <h3 className="text-xl font-bold text-[#f62681]">Músicas</h3>
                {isPlaying && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Tocando
                    </span>
                )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5 text-xs mb-3">
                <span className={`w-1.5 h-1.5 rounded-full ${habilitado ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                <span className={habilitado ? 'text-emerald-600' : 'text-rose-500'}>
                    {!isConnected ? 'Desconectado' : !robotLigado ? 'Robô desligado' : 'Pronto'}
                </span>
            </div>

            {/* Aviso robô desligado */}
            {!robotLigado && isConnected && (
                <div className="text-xs mb-3 text-[#f62681]/80 bg-[#fdf2f8] border border-[#f62681]/20 rounded-lg px-3 py-1.5 text-center w-full">
                    🔴 Ligue o robô para controlar o áudio
                </div>
            )}

            {/* Aviso temporário */}
            {mensagem && (
                <div className={`text-xs mb-3 font-medium text-center ${
                    mensagem.includes('⚠️') ? 'text-rose-500' : 'text-[#f62681]'
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
                            'flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-semibold transition-all duration-300',
                            musicaSelecionada === musica.id
                                ? `bg-gradient-to-br ${musica.cor} text-white shadow-lg shadow-[#f62681]/25 scale-[1.04]`
                                : 'bg-[#fdf2f8] hover:bg-[#fce7f3] border border-[#f62681]/20 text-[#f62681]/80 hover:border-[#f62681]/40',
                            !habilitado ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                        ].join(' ')}
                    >
                        <span className="text-xl">{musica.emoji}</span>
                        <span className="truncate w-full text-center">{musica.nome}</span>
                    </button>
                ))}
            </div>

            {/* PLAY / STOP */}
            <div className="flex gap-2 w-full max-w-xs mb-5">
                <button
                    onClick={tocar}
                    disabled={!habilitado || !musicaSelecionada || isPlaying}
                    className={[
                        'flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300',
                        (!habilitado || !musicaSelecionada || isPlaying)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#11813a] text-white hover:bg-[#e8197a] hover:shadow-lg hover:shadow-[#f62681]/30 hover:-translate-y-0.5 active:scale-95',
                    ].join(' ')}
                >
                    ▶ PLAY
                </button>
                <button
                    onClick={parar}
                    disabled={!isConnected || !isPlaying}
                    className={[
                        'flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300',
                        (!isConnected || !isPlaying)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#9d174d] text-white hover:bg-[#cd01919] hover:shadow-lg hover:shadow-[#9d174d]/30 hover:-translate-y-0.5 active:scale-95',
                    ].join(' ')}
                >
                    ⏹ STOP
                </button>
            </div>

            {/* Volume */}
            <div className={`w-full max-w-xs transition-opacity duration-300 ${!robotLigado ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-[#f62681]/80">🔊 Volume</span>
                    <span className="text-xs font-bold text-[#f62681] bg-[#fdf2f8] px-2 py-0.5 rounded-full border border-[#f62681]/20">
                        {volume === 0 ? '🔇 Mudo' : `${volume}/30`}
                    </span>
                </div>

                <input
                    type="range" min={0} max={30} step={1} value={volume}
                    onChange={handleVolume}
                    disabled={!habilitado}
                    className="w-full disabled:opacity-40 disabled:cursor-not-allowed"
                />

                <div className="flex justify-between mt-2 gap-1">
                    {[0, 10, 20, 25, 30].map(v => (
                        <button
                            key={v}
                            onClick={() => { setVolume(v); if (habilitado) sendCommand(`DN0VOL${v}`, topico); }}
                            disabled={!habilitado}
                            className={[
                                'flex-1 py-1 rounded-lg text-[10px] font-bold transition-all',
                                volume === v
                                    ? 'bg-[#f62681] text-white'
                                    : 'bg-[#fdf2f8] text-[#f62681]/70 hover:bg-[#fce7f3] border border-[#f62681]/15',
                                !habilitado ? 'opacity-40 cursor-not-allowed' : '',
                            ].join(' ')}
                        >
                            {v === 0 ? '🔇' : v}
                        </button>
                    ))}
                </div>
                <div className="flex justify-between text-[9px] text-[#f62681]/40 mt-1 px-0.5">
                    <span>Mudo</span><span>Máximo</span>
                </div>
            </div>

            <p className="mt-4 text-[10px] text-[#f62681]/40 text-center">
                Selecione uma música e pressione PLAY
            </p>
        </div>
    );
}

export default Musicas;