import React, { useState, useCallback } from 'react';
import { useMQTT } from '../hooks/useMQTT';
import Cima from '../assets/seta_up.png';
import Esquerda from '../assets/seta_left.png';
import Direita from '../assets/seta_rigth.jpg';
import Baixo from '../assets/seta_down.png';
import RobotPicker from './RobotPicker';
import RobotFloorMap from './RobotFloorMap';

function Controle({ robotsPose = {}, robotId = 'robo1', onRobotIdChange = () => {} }) {
    const brokerUrl = process.env.REACT_APP_MQTT_BROKER || 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';
    const { moverRobo, pararRobo, isConnected, isRobotConnected } = useMQTT(brokerUrl);
    const [activeDir, setActiveDir] = useState(null);

    const handleStart = useCallback((x, y, dir) => {
        moverRobo(robotId, x, y);
        setActiveDir(dir);
    }, [moverRobo, robotId]);

    const handleStop = useCallback(() => {
        pararRobo(robotId);
        setActiveDir(null);
    }, [pararRobo, robotId]);

    return (
        <div className="flex flex-col items-center w-full">
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
            
            <div className="flex flex-row mt-6 gap-3 sm:gap-4">
                {/* ESQUERDA - Gira Esquerda */}
                <div className="flex flex-col justify-center items-center">
                    <button
                        onMouseDown={() => handleStart(0, -5, 'esquerda')}
                        onMouseUp={handleStop}
                        onTouchStart={() => handleStart(0, -5, 'esquerda')}
                        onTouchEnd={handleStop}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 transition-transform duration-100 ${
                            activeDir === 'esquerda' ? 'scale-110' : 'hover:scale-105'
                        }`}
                    >
                        <img src={Esquerda} alt="seta esquerda" className="w-9 h-9 sm:w-12 sm:h-12" />
                    </button>
                    <span className="text-xs mt-1 text-gray-600">Girar Esquerda</span>
                </div>
                
                {/* CIMA/BAIXO - Movimento frente/trás */}
                <div className="flex flex-col items-center space-y-4">
                    <button
                        onMouseDown={() => handleStart(5, 0, 'cima')}
                        onMouseUp={handleStop}
                        onTouchStart={() => handleStart(5, 0, 'cima')}
                        onTouchEnd={handleStop}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 transition-transform duration-100 ${
                            activeDir === 'cima' ? 'scale-110' : 'hover:scale-105'
                        }`}
                    >
                        <img src={Cima} alt="seta cima" className="w-9 h-9 sm:w-12 sm:h-12" />
                    </button>
                    <span className="text-xs -mt-2 text-gray-600">Frente</span>
                    <button
                        onMouseDown={() => handleStart(-5, 0, 'baixo')}
                        onMouseUp={handleStop}
                        onTouchStart={() => handleStart(-5, 0, 'baixo')}
                        onTouchEnd={handleStop}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 transition-transform duration-100 ${
                            activeDir === 'baixo' ? 'scale-110' : 'hover:scale-105'
                        }`}
                    >
                        <img src={Baixo} alt="seta baixo" className="w-9 h-9 sm:w-12 sm:h-12" />
                    </button>
                    <span className="text-xs -mt-2 text-gray-600">Trás</span>
                </div>
                
                {/* DIREITA - Gira Direita */}
                <div className="flex flex-col justify-center items-center">
                    <button
                        onMouseDown={() => handleStart(0, 5, 'direita')}
                        onMouseUp={handleStop}
                        onTouchStart={() => handleStart(0, 5, 'direita')}
                        onTouchEnd={handleStop}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 pl-[10%] transition-transform duration-100 ${
                            activeDir === 'direita' ? 'scale-110' : 'hover:scale-105'
                        }`}
                    >
                        <img src={Direita} alt="seta direita" className="w-9 h-9 sm:w-12 sm:h-12" />
                    </button>
                    <span className="text-xs mt-1 text-gray-600">Girar Direita</span>
                </div>
            </div>

            {/* Instruções dos LEDs automáticos */}
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center max-w-md w-full">
                <p className="text-sm text-gray-600 font-medium">🎨 Efeitos de LEDs Automáticos:</p>
                <div className="flex justify-center flex-wrap gap-4 mt-2 text-xs">
                    <div><span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span> Frente</div>
                    <div><span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span> Trás</div>
                    <div><span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span> Gira Esq</div>
                    <div><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span> Gira Dir</div>
                </div>
            </div>

            <RobotFloorMap robotsPose={robotsPose} mqttOnline={isConnected} selectedRobotId={robotId} title="Onde estão os robôs" />
        </div>
    );
}

export default Controle;