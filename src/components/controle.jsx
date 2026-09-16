import React, { useState, useCallback } from 'react';
import { useMQTT } from '../hooks/useMQTT';
import Cima     from '../assets/seta_up.png';
import Esquerda from '../assets/seta_left.png';
import Direita  from '../assets/seta_rigth.jpg';
import Baixo    from '../assets/seta_down.png';
import RobotPicker   from './RobotPicker';
import RobotFloorMap from './RobotFloorMap';

function Controle({ robotsPose = {}, robotId = 'robo1', onRobotIdChange = () => {} }) {
    const brokerUrl = process.env.REACT_APP_MQTT_BROKER || 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';

    // Passa robotId para o watchdog — isRobotConnected fica verde só quando
    // a pose DESTE robô chegar, não de qualquer outro.
    const { moverRobo, pararRobo, sendCommand, isConnected, isRobotConnected } =
        useMQTT(brokerUrl, robotId === 'all' ? null : robotId);

    const [activeDir,   setActiveDir]   = useState(null);
    // Interruptor físico: true = robô habilitado; false = parado
    const [robotLigado, setRobotLigado] = useState(true);

    // ── Interruptor ────────────────────────────────────────────────────────
    const handleInterruptor = useCallback(() => {
        if (!isConnected) return;
        if (robotLigado) {
            const topico = robotId === 'all' ? 'cmd' : `cmd/${robotId}`;
            sendCommand('DN0CPA', topico);
            setRobotLigado(false);
        } else {
            setRobotLigado(true);
        }
    }, [isConnected, robotLigado, robotId, sendCommand]);

    const handleStart = useCallback((x, y, dir) => {
        if (!robotLigado) return;
        moverRobo(robotId, x, y);
        setActiveDir(dir);
    }, [moverRobo, robotId, robotLigado]);

    const handleStop = useCallback(() => {
        pararRobo(robotId);
        setActiveDir(null);
    }, [pararRobo, robotId]);

    return (
        <div className="flex flex-col items-center w-full">

            {/* Status de conexão */}
            <div className={`text-sm mb-1 font-bold ${isRobotConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isRobotConnected ? '✅ Robô Conectado' : '❌ Robô Desconectado'}
            </div>

            {!isConnected && (
                <div className="text-xs text-red-500 mb-2 font-bold text-center animate-pulse px-4">
                    ⚠️ Sem conexão com o Servidor em Nuvem (EMQX)
                </div>
            )}

            <section className="p-2.5 text-3xl sm:text-4xl md:text-5xl font-bold text-center text-pink-950">
                Controle Manual
            </section>

            <RobotPicker robotId={robotId} onRobotIdChange={onRobotIdChange} robotsPose={robotsPose} />

            {/* ── INTERRUPTOR FÍSICO ──────────────────────────────────────── */}
            <div className="mt-5 flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Interruptor do Robô
                </span>
                <button
                    onClick={handleInterruptor}
                    disabled={!isConnected}
                    aria-pressed={robotLigado}
                    title={robotLigado ? 'Clique para DESLIGAR' : 'Clique para LIGAR'}
                    className={[
                        'relative inline-flex items-center w-20 h-10 rounded-full border-2',
                        'transition-all duration-300 focus:outline-none',
                        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400',
                        !isConnected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                        robotLigado
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 border-emerald-500 shadow-lg shadow-emerald-300/40'
                            : 'bg-gray-200 border-gray-300',
                    ].join(' ')}
                >
                    <span className={[
                        'absolute w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300',
                        robotLigado ? 'left-[calc(100%-30px)]' : 'left-1',
                    ].join(' ')} />
                    <span className={`absolute text-[10px] font-black tracking-wider transition-opacity duration-200 ${robotLigado ? 'left-2.5 text-white opacity-100' : 'opacity-0'}`}>ON</span>
                    <span className={`absolute text-[10px] font-black tracking-wider text-gray-400 transition-opacity duration-200 ${!robotLigado ? 'right-2 opacity-100' : 'opacity-0'}`}>OFF</span>
                </button>
                <span className={`text-xs font-bold ${robotLigado ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {robotLigado ? '🟢 Robô ligado' : '⚫ Robô desligado'}
                </span>
            </div>
            {/* ───────────────────────────────────────────────────────────── */}

            {/* Controles direcionais */}
            <div className={`flex flex-row mt-6 gap-3 sm:gap-4 transition-opacity duration-300 ${!robotLigado ? 'opacity-40 pointer-events-none' : ''}`}>

                {/* ESQUERDA */}
                <div className="flex flex-col justify-center items-center">
                    <button
                        onMouseDown={() => handleStart(0, -5, 'esquerda')}
                        onMouseUp={handleStop}
                        onTouchStart={(e) => { e.preventDefault(); handleStart(0, -5, 'esquerda'); }}
                        onTouchEnd={handleStop}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 transition-transform duration-100 ${activeDir === 'esquerda' ? 'scale-110' : 'hover:scale-105'}`}
                    >
                        <img src={Esquerda} alt="seta esquerda" className="w-9 h-9 sm:w-12 sm:h-12" />
                    </button>
                    <span className="text-xs mt-1 text-gray-600">Girar Esquerda</span>
                </div>

                {/* CIMA / BAIXO */}
                <div className="flex flex-col items-center space-y-4">
                    <button
                        onMouseDown={() => handleStart(5, 0, 'cima')}
                        onMouseUp={handleStop}
                        onTouchStart={(e) => { e.preventDefault(); handleStart(5, 0, 'cima'); }}
                        onTouchEnd={handleStop}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 transition-transform duration-100 ${activeDir === 'cima' ? 'scale-110' : 'hover:scale-105'}`}
                    >
                        <img src={Cima} alt="seta cima" className="w-9 h-9 sm:w-12 sm:h-12" />
                    </button>
                    <span className="text-xs -mt-2 text-gray-600">Frente</span>
                    <button
                        onMouseDown={() => handleStart(-5, 0, 'baixo')}
                        onMouseUp={handleStop}
                        onTouchStart={(e) => { e.preventDefault(); handleStart(-5, 0, 'baixo'); }}
                        onTouchEnd={handleStop}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 transition-transform duration-100 ${activeDir === 'baixo' ? 'scale-110' : 'hover:scale-105'}`}
                    >
                        <img src={Baixo} alt="seta baixo" className="w-9 h-9 sm:w-12 sm:h-12" />
                    </button>
                    <span className="text-xs -mt-2 text-gray-600">Trás</span>
                </div>

                {/* DIREITA */}
                <div className="flex flex-col justify-center items-center">
                    <button
                        onMouseDown={() => handleStart(0, 5, 'direita')}
                        onMouseUp={handleStop}
                        onTouchStart={(e) => { e.preventDefault(); handleStart(0, 5, 'direita'); }}
                        onTouchEnd={handleStop}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 pl-[10%] transition-transform duration-100 ${activeDir === 'direita' ? 'scale-110' : 'hover:scale-105'}`}
                    >
                        <img src={Direita} alt="seta direita" className="w-9 h-9 sm:w-12 sm:h-12" />
                    </button>
                    <span className="text-xs mt-1 text-gray-600">Girar Direita</span>
                </div>
            </div>

            <RobotFloorMap
                robotsPose={robotsPose}
                mqttOnline={isConnected}
                selectedRobotId={robotId}
                title="Onde estão os robôs"
            />
        </div>
    );
}

export default Controle;