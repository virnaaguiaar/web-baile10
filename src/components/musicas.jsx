import React, { useState, useCallback } from 'react';
import useMQTT from '../hooks/useMQTT';

const musicasDisponiveis = [
    { nome: 'Música 1', id: 1, emoji: '🎤', cor: 'from-blue-400 to-purple-500' },
    { nome: 'Música 2', id: 2, emoji: '🧟', cor: 'from-red-400 to-orange-500' },
    { nome: 'Música 3', id: 3, emoji: '🎸', cor: 'from-green-400 to-emerald-500' },
    { nome: 'Música 4', id: 4, emoji: '🕺', cor: 'from-pink-400 to-rose-500' },
];

function Musicas() {
    const [musicaSelecionada, setMusicaSelecionada] = useState(null);
    const [mensagem,          setMensagem]          = useState('');
    const [isPlaying,         setIsPlaying]         = useState(false);
    const [volume,            setVolume]            = useState(20); // 0-30

    const { mp3TocarMusica, mp3PararMusica, sendCommand, isConnected } = useMQTT();

    const aviso = useCallback((texto, tempo = 1800) => {
        setMensagem(texto);
        setTimeout(() => setMensagem(''), tempo);
    }, []);

    // Publica volume: "DN0CVxx" onde xx é 0-30
    const aplicarVolume = useCallback((vol) => {
        if (!isConnected) return;
        sendCommand(`DN0VOL${vol}`, 'cmd');
    }, [isConnected, sendCommand]);

    const handleVolume = (e) => {
        const vol = Number(e.target.value);
        setVolume(vol);
        aplicarVolume(vol);
    };

    const selecionarMusica = (musica) => {
        if (!isConnected) return aviso('⚠️ Sistema desconectado!', 2000);
        setMusicaSelecionada(musica.id);
        aviso(`📀 ${musica.nome} selecionada`, 1500);
    };

    const tocarSelecionada = () => {
        if (!isConnected)      return aviso('⚠️ Sistema desconectado!', 2000);
        if (!musicaSelecionada) return aviso('⚠️ Selecione uma música!', 1500);
        const musica = musicasDisponiveis.find(m => m.id === musicaSelecionada);
        if (!musica) return aviso('⚠️ Música inválida!', 1500);

        aplicarVolume(volume);          // garante volume antes de tocar
        mp3TocarMusica(musica.id);      // DN0CM{id}
        setIsPlaying(true);
        aviso(`🎶 Tocando: ${musica.nome}`, 2500);
    };

    const pararAtual = () => {
        if (!isConnected) return aviso('⚠️ Sistema desconectado!', 2000);
        mp3PararMusica();               // DN0CPS
        setIsPlaying(false);
        aviso('⏹️ Música parada', 1500);
    };

    const volumeLabel = volume === 0 ? '🔇' : volume < 10 ? '🔈' : volume < 22 ? '🔉' : '🔊';

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
            <div className="flex items-center gap-2 text-xs mb-3">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className={isConnected ? 'text-emerald-600' : 'text-rose-600'}>
                    {isConnected ? 'Áudio pronto' : 'Áudio off'}
                </span>
                {isPlaying && (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                        <span className="animate-pulse">●</span> Tocando
                    </span>
                )}
            </div>

            {/* Aviso temporário */}
            {mensagem && (
                <div className={`text-xs mb-3 font-medium ${
                    mensagem.includes('⚠️') ? 'text-rose-500'
                    : mensagem.includes('⏹️') ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                    {mensagem}
                </div>
            )}

            {/* Seleção de músicas */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs mb-4">
                {musicasDisponiveis.map(musica => (
                    <button
                        key={musica.id}
                        onClick={() => selecionarMusica(musica)}
                        disabled={!isConnected}
                        className={`
                            flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold
                            transition-all duration-300
                            ${musicaSelecionada === musica.id
                                ? `bg-gradient-to-r ${musica.cor} text-white shadow-lg scale-[1.02]`
                                : 'bg-white/80 hover:bg-amber-50/80 border-2 border-amber-200/40 text-amber-800 hover:border-amber-300'
                            }
                            ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <span className="text-lg">{musica.emoji}</span>
                        <span className="truncate">{musica.nome}</span>
                    </button>
                ))}
            </div>

            {/* Controle de volume */}
            <div className="w-full max-w-xs mb-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-amber-800">
                        {volumeLabel} Volume
                    </span>
                    <span className="text-xs font-bold text-pink-600">{volume}/30</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={volume}
                    onChange={handleVolume}
                    disabled={!isConnected}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-opacity ${
                        !isConnected ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>Mudo</span>
                    <span>Máximo</span>
                </div>
            </div>

            {/* PLAY / STOP */}
            <div className="flex gap-3 w-full max-w-xs">
                <button
                    onClick={tocarSelecionada}
                    disabled={!isConnected || !musicaSelecionada || isPlaying}
                    className={`
                        flex-1 py-2.5 rounded-xl font-bold text-white text-sm
                        transition-all duration-300 flex items-center justify-center gap-2
                        ${(!isConnected || !musicaSelecionada || isPlaying)
                            ? 'bg-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:scale-95'
                        }
                    `}
                >
                    <span>▶</span> PLAY
                </button>
                <button
                    onClick={pararAtual}
                    disabled={!isConnected || !isPlaying}
                    className={`
                        flex-1 py-2.5 rounded-xl font-bold text-white text-sm
                        transition-all duration-300 flex items-center justify-center gap-2
                        ${(!isConnected || !isPlaying)
                            ? 'bg-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-lg hover:shadow-rose-500/25 hover:-translate-y-0.5 active:scale-95'
                        }
                    `}
                >
                    <span>⏹</span> STOP
                </button>
            </div>

            <div className="mt-3 text-[10px] text-amber-400/60 text-center">
                Selecione uma música, ajuste o volume, depois PLAY
            </div>
        </div>
    );
}

export default Musicas;