import React, { useState, useCallback } from 'react';
import useMQTT from '../hooks/useMQTT';

const BROKER = process.env.REACT_APP_MQTT_BROKER
    || 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';

// ─── Props ────────────────────────────────────────────────────────────────────
// robotLigado : boolean  — estado do interruptor ON/OFF do Controle
// topico      : string   — "cmd/<id_robo>" ou "cmd" (broadcast)
function Coreografia({ robotLigado = true, topico = 'cmd' }) {
    const [isRunning, setIsRunning] = useState(false);
    const [mensagem,  setMensagem]  = useState('');

    const { sendCommand, isConnected } = useMQTT(BROKER);

    const habilitado = isConnected && robotLigado;

    const aviso = useCallback((texto, tempo = 2000) => {
        setMensagem(texto);
        setTimeout(() => setMensagem(''), tempo);
    }, []);

    const handleClick = useCallback(() => {
        if (!habilitado) return aviso('⚠️ Robô desligado ou desconectado!');
        if (isRunning)   return aviso('⚠️ Coreografia já está em execução!');
        sendCommand('DN0CG', topico);
        setIsRunning(true);
        aviso('🎬 Coreografia iniciada!', 3000);
    }, [habilitado, isRunning, sendCommand, topico, aviso]);

    const handleStop = useCallback(() => {
        if (!isConnected) return aviso('⚠️ Sistema desconectado!');
        if (!isRunning)   return aviso('⚠️ Nenhuma coreografia em execução!');
        sendCommand('DN0CPA', topico);
        setIsRunning(false);
        aviso('⏹️ Coreografia parada!');
    }, [isConnected, isRunning, sendCommand, topico, aviso]);

    return (
        <div className="flex flex-col items-center px-3 py-6 sm:px-6 sm:py-8 w-full font-bold bg-white border-pink-400 border-solid border-4 sm:border-[10px] rounded-2xl sm:rounded-[32px] text-amber-950">
            <section className="text-3xl sm:text-4xl md:text-5xl mb-2">
                Coreografia
            </section>

            <div className={`text-sm mb-4 ${habilitado ? 'text-green-500' : 'text-red-500'}`}>
                {!isConnected
                    ? '⚠️ Coreografia desconectada'
                    : !robotLigado
                    ? '🔴 Ligue o robô para usar a coreografia'
                    : '🎬 Sistema de coreografia pronto'}
            </div>

            {isRunning && (
                <div className="text-sm text-green-500 animate-pulse mb-4">
                    🎬 Executando coreografia…
                </div>
            )}

            {mensagem && (
                <div className="text-sm text-pink-600 mb-4 animate-pulse">
                    {mensagem}
                </div>
            )}

            <div className="text-sm text-gray-500 mb-6">
                {isRunning
                    ? <span>✅ Coreografia em execução</span>
                    : <span>⚪ Nenhuma coreografia em execução</span>}
            </div>

            <div className={`flex gap-3 sm:gap-6 w-full max-w-md transition-opacity duration-300 ${!robotLigado ? 'opacity-40' : ''}`}>
                <button
                    onClick={handleClick}
                    disabled={!habilitado || isRunning}
                    className={`
                        flex-1 py-3 sm:py-4 rounded-xl font-bold text-white text-base sm:text-xl
                        transition-all duration-200 transform flex items-center justify-center gap-2 sm:gap-3
                        ${(!habilitado || isRunning)
                            ? 'bg-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95'
                        }
                    `}
                >
                    <span>🎬</span> INICIAR
                </button>

                <button
                    onClick={handleStop}
                    disabled={!isConnected || !isRunning}
                    className={`
                        flex-1 py-3 sm:py-4 rounded-xl font-bold text-white text-base sm:text-xl
                        transition-all duration-200 transform flex items-center justify-center gap-2 sm:gap-3
                        ${(!isConnected || !isRunning)
                            ? 'bg-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95'
                        }
                    `}
                >
                    <span>⏹️</span> PARAR
                </button>
            </div>

            <div className="mt-6 text-xs text-gray-400 text-center">
                <p>💡 Clique em INICIAR para executar a coreografia &nbsp;&nbsp; Use PARAR para interromper</p>
            </div>
        </div>
    );
}

export default Coreografia;