import React, { useState } from 'react';
import useMQTT from '../hooks/useMQTT';

const musicasDisponiveis = [
    { nome: 'Billie Jean',      id: 1, emoji: '🎤', cor: 'from-blue-400 to-purple-500' },
    { nome: 'Thriller',         id: 2, emoji: '🧟', cor: 'from-red-400 to-orange-500' },
    { nome: 'Beat It',          id: 3, emoji: '🎸', cor: 'from-green-400 to-emerald-500' },
    { nome: 'Smooth Criminal',  id: 4, emoji: '🕺', cor: 'from-pink-400 to-rose-500' }
];

function Musicas() {
    const [musicaSelecionada, setMusicaSelecionada] = useState(null);
    const [mensagem, setMensagem] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);

    // useMQTT publica:
    //   mp3TocarMusica(id)  ->  "DN0CM{id}"
    //   mp3PararMusica()    ->  "DN0CPS"
    const { mp3TocarMusica, mp3PararMusica, isConnected } = useMQTT();

    const aviso = (texto, tempo = 1800) => {
        setMensagem(texto);
        setTimeout(() => setMensagem(''), tempo);
    };

    const selecionarMusica = (musica) => {
        if (!isConnected) return aviso('⚠️ Sistema desconectado!', 2000);
        setMusicaSelecionada(musica.id);
        aviso(`📀 ${musica.nome} selecionada`, 1500);
    };

    const mp3TocarMusicaSelecionada = () => {
        if (!isConnected) return aviso('⚠️ Sistema desconectado!', 2000);
        if (!musicaSelecionada) return aviso('⚠️ Selecione uma música!', 1500);

        const musica = musicasDisponiveis.find(m => m.id === musicaSelecionada);
        if (!musica) return aviso('⚠️ Música inválida!', 1500);

        mp3TocarMusica(musica.id); // publica "DN0CM{id}"
        setIsPlaying(true);
        aviso(`🎶 Tocando: ${musica.nome}`, 2500);
    };

    const mp3PararMusicaAtual = () => {
        if (!isConnected) return aviso('⚠️ Sistema desconectado!', 2000);

        mp3PararMusica(); // publica "DN0CPS"
        setIsPlaying(false);
        aviso('⏹️ Música parada', 1500);
    };

    return (
        <div className="flex flex-col items-center p-6 w-full bg-gradient-to-br from-white/95 to-amber-50/80 backdrop-blur-sm rounded-2xl border border-amber-200/30 shadow-xl shadow-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎵</span>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#f62681] to-[#F68621] bg-clip-text text-transparent">
                    Músicas
                </h3>
            </div>

            <div className="flex items-center gap-2 text-xs mb-3">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className={isConnected ? 'text-emerald-600' : 'text-rose-600'}>
                    {isConnected ? 'Áudio pronto' : 'Áudio off'}
                </span>
                {isPlaying && (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                        <span className="animate-pulse">●</span> Tocando
                    </span>
                )}
            </div>

            {mensagem && (
                <div className={`text-xs mb-3 font-medium ${
                    mensagem.includes('⚠️') ? 'text-rose-500'
                    : mensagem.includes('⏹️') ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                    {mensagem}
                </div>
            )}

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

            <div className="flex gap-3 w-full max-w-xs">
                <button
                    onClick={mp3TocarMusicaSelecionada}
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
                    onClick={mp3PararMusicaAtual}
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
                Selecione uma música, depois PLAY
            </div>
        </div>
    );
}

export default Musicas;