import React, { useState, useCallback } from 'react';
import useMQTT from '../hooks/useMQTT';

const BROKER = process.env.REACT_APP_MQTT_BROKER
    || 'wss://e2792d91.ala.us-east-1.emqxsl.com:8084/mqtt';

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
        <div className="flex flex-col items-center px-5 py-6 w-full bg-white rounded-2xl border border-[#f62681]/15 shadow-lg shadow-[#f62681]/8">

            <h3 className="text-xl font-bold text-[#f62681] mb-2">🎬 Coreografia</h3>

            <div className={`text-xs mb-4 font-medium ${habilitado ? 'text-emerald-600' : 'text-rose-500'}`}>
                {!isConnected
                    ? '⚠️ Desconectado'
                    : !robotLigado
                    ? '🔴 Ligue o robô para usar'
                    : isRunning
                    ? '🎬 Executando…'
                    : '⚪ Pronta para iniciar'}
            </div>

            {mensagem && (
                <div className="text-xs text-[#f62681] mb-4 font-medium animate-pulse text-center">
                    {mensagem}
                </div>
            )}

            <div className={`flex gap-3 w-full max-w-sm transition-opacity duration-300 ${!robotLigado ? 'opacity-40' : ''}`}>
                <button
                    onClick={handleClick}
                    disabled={!habilitado || isRunning}
                    className={`flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2
                        ${(!habilitado || isRunning)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#f62681] hover:bg-[#e8197a] hover:scale-105 hover:shadow-lg hover:shadow-[#f62681]/30 active:scale-95'
                        }`}
                >
                    🎬 INICIAR
                </button>

                <button
                    onClick={handleStop}
                    disabled={!isConnected || !isRunning}
                    className={`flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2
                        ${(!isConnected || !isRunning)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#9d174d] hover:bg-[#be185d] hover:scale-105 hover:shadow-lg hover:shadow-[#9d174d]/30 active:scale-95'
                        }`}
                >
                    ⏹️ PARAR
                </button>
            </div>

            <p className="mt-5 text-[10px] text-[#f62681]/40 text-center">
                Pressione INICIAR para executar · PARAR para interromper
            </p>
        </div>
    );
}

export default Coreografia;