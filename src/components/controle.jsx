import React, { useState, useCallback } from 'react';
import useMQTT from '../hooks/useMQTT';
import Cima     from '../assets/seta_up.png';
import Esquerda from '../assets/seta_left.png';
import Direita  from '../assets/seta_rigth.jpg';
import Baixo    from '../assets/seta_down.png';
import RobotPicker   from './RobotPicker';
import RobotFloorMap from './RobotFloorMap';
import Musicas    from './musicas';
import Coreografia from './coreografia';

function Controle({ robotsPose = {}, id_robo = 'robo1', onRobotIdChange = () => {} }) {
    const brokerUrl = process.env.REACT_APP_MQTT_BROKER
        || 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';

    const { sendCommand, isConnected } = useMQTT(brokerUrl);
    const [activeDir,   setActiveDir]   = useState(null);
    const [robotLigado, setRobotLigado] = useState(true);

    const poseDoRobo = robotsPose[id_robo];
    const isRobotConnected = poseDoRobo && (Date.now() - (poseDoRobo.lastUpdate || 0)) < 3000;

    const resolverTopico = useCallback(() =>
        id_robo === 'all' ? 'cmd' : `cmd/${id_robo}`, [id_robo]);

    const publicar = useCallback((cmd) =>
        sendCommand(cmd, resolverTopico()), [sendCommand, resolverTopico]);

    const handleInterruptor = useCallback(() => {
        if (!isConnected) return;
        if (robotLigado) {
            publicar('DN0CPA');
            sendCommand('DN0CPS', resolverTopico());
            setRobotLigado(false);
        } else {
            setRobotLigado(true);
        }
    }, [isConnected, robotLigado, publicar, sendCommand, resolverTopico]);

    const handleStart = useCallback((x, y, dir) => {
        if (!robotLigado || !isConnected) return;
        publicar(`DN0X${x >= 0 ? '+' : '-'}${Math.abs(x)}Y${y >= 0 ? '+' : '-'}${Math.abs(y)}`);
        setActiveDir(dir);
    }, [robotLigado, isConnected, publicar]);

    const handleStop = useCallback(() => {
        publicar('DN0CPA');
        setActiveDir(null);
    }, [publicar]);

    return (
        <div className="flex flex-col items-center w-full gap-6">

            {/* ── Painel principal ────────────────────────────────────────────── */}
            <div className="flex flex-col items-center w-full">

                {/* Status do robô */}
                <div className={`text-sm mb-1 font-bold ${isRobotConnected ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isRobotConnected ? `✅ ${id_robo} conectado` : `❌ ${id_robo} desconectado`}
                </div>

                <div className="text-xs text-[#f62681]/50 mb-1">
                    Tópico: <span className="font-mono text-[#f62681]">{resolverTopico()}</span>
                </div>

                {!isConnected && (
                    <div className="text-xs text-rose-500 mb-2 font-bold text-center animate-pulse px-4">
                        ⚠️ Sem conexão com o Servidor em Nuvem (EMQX)
                    </div>
                )}

                <h1 className="py-2 text-3xl sm:text-4xl md:text-5xl font-bold text-center text-[#9d174d]">
                    Controle Manual
                </h1>

                <RobotPicker id_robo={id_robo} onRobotIdChange={onRobotIdChange} robotsPose={robotsPose} />

                {/* Interruptor */}
                <div className="mt-5 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-[#f62681]/60 uppercase tracking-widest">
                        Interruptor do Robô
                    </span>
                    <button
                        onClick={handleInterruptor}
                        disabled={!isConnected}
                        aria-pressed={robotLigado}
                        className={[
                            'relative inline-flex items-center w-20 h-10 rounded-full border-2 transition-all duration-300 focus:outline-none',
                            'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#f62681]',
                            !isConnected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                            robotLigado
                                ? 'bg-[#f62681] border-[#f62681] shadow-lg shadow-[#f62681]/30'
                                : 'bg-gray-200 border-gray-300',
                        ].join(' ')}
                    >
                        <span className={[
                            'absolute w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300',
                            robotLigado ? 'left-[calc(100%-30px)]' : 'left-1',
                        ].join(' ')} />
                        <span className={`absolute text-[10px] font-black tracking-wider transition-opacity ${robotLigado ? 'left-2.5 text-white opacity-100' : 'opacity-0'}`}>ON</span>
                        <span className={`absolute text-[10px] font-black tracking-wider text-gray-400 transition-opacity ${!robotLigado ? 'right-2 opacity-100' : 'opacity-0'}`}>OFF</span>
                    </button>
                    <span className={`text-xs font-bold ${robotLigado ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {robotLigado ? '🟢 Robô ligado' : '⚫ Robô desligado'}
                    </span>
                </div>

                {/* Direcionais */}
                <div className={`flex flex-row mt-6 gap-3 sm:gap-4 transition-opacity duration-300 ${!robotLigado ? 'opacity-40 pointer-events-none' : ''}`}>

                    {/* ESQUERDA */}
                    <div className="flex flex-col justify-center items-center">
                        <button
                            onMouseDown={() => handleStart(0, -5, 'esquerda')}
                            onMouseUp={handleStop}
                            onTouchStart={(e) => { e.preventDefault(); handleStart(0, -5, 'esquerda'); }}
                            onTouchEnd={handleStop}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl transition-all duration-100 border-2 ${
                                activeDir === 'esquerda'
                                    ? 'scale-110 border-[#f62681] bg-[#fdf2f8]'
                                    : 'border-transparent hover:scale-105 hover:bg-[#fdf2f8]'
                            }`}
                        >
                            <img src={Esquerda} alt="esquerda" className="w-9 h-9 sm:w-11 sm:h-11" />
                        </button>
                        <span className="text-[10px] mt-1 text-[#f62681]/60 font-medium">Girar Esq.</span>
                    </div>

                    {/* CIMA / BAIXO */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onMouseDown={() => handleStart(5, 0, 'cima')}
                            onMouseUp={handleStop}
                            onTouchStart={(e) => { e.preventDefault(); handleStart(5, 0, 'cima'); }}
                            onTouchEnd={handleStop}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl transition-all duration-100 border-2 ${
                                activeDir === 'cima'
                                    ? 'scale-110 border-[#f62681] bg-[#fdf2f8]'
                                    : 'border-transparent hover:scale-105 hover:bg-[#fdf2f8]'
                            }`}
                        >
                            <img src={Cima} alt="cima" className="w-9 h-9 sm:w-11 sm:h-11" />
                        </button>
                        <span className="text-[10px] text-[#f62681]/60 font-medium">Frente</span>

                        <div className="h-2" />

                        <button
                            onMouseDown={() => handleStart(-5, 0, 'baixo')}
                            onMouseUp={handleStop}
                            onTouchStart={(e) => { e.preventDefault(); handleStart(-5, 0, 'baixo'); }}
                            onTouchEnd={handleStop}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl transition-all duration-100 border-2 ${
                                activeDir === 'baixo'
                                    ? 'scale-110 border-[#f62681] bg-[#fdf2f8]'
                                    : 'border-transparent hover:scale-105 hover:bg-[#fdf2f8]'
                            }`}
                        >
                            <img src={Baixo} alt="baixo" className="w-9 h-9 sm:w-11 sm:h-11" />
                        </button>
                        <span className="text-[10px] text-[#f62681]/60 font-medium">Trás</span>
                    </div>

                    {/* DIREITA */}
                    <div className="flex flex-col justify-center items-center">
                        <button
                            onMouseDown={() => handleStart(0, 5, 'direita')}
                            onMouseUp={handleStop}
                            onTouchStart={(e) => { e.preventDefault(); handleStart(0, 5, 'direita'); }}
                            onTouchEnd={handleStop}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl transition-all duration-100 border-2 ${
                                activeDir === 'direita'
                                    ? 'scale-110 border-[#f62681] bg-[#fdf2f8]'
                                    : 'border-transparent hover:scale-105 hover:bg-[#fdf2f8]'
                            }`}
                        >
                            <img src={Direita} alt="direita" className="w-9 h-9 sm:w-11 sm:h-11" />
                        </button>
                        <span className="text-[10px] mt-1 text-[#f62681]/60 font-medium">Girar Dir.</span>
                    </div>
                </div>

                <RobotFloorMap
                    robotsPose={robotsPose}
                    mqttOnline={isConnected}
                    selectedRobotId={id_robo}
                    title="Onde estão os robôs"
                />
            </div>

            {/* ── Música + Coreografia herdam estado do interruptor ─────────── */}
            <div className="flex w-full max-w-[1100px] gap-4 max-md:flex-col">
                <div className="flex-1">
                    <Musicas robotLigado={robotLigado} topico={resolverTopico()} />
                </div>
                <div className="flex-1">
                    <Coreografia robotLigado={robotLigado} topico={resolverTopico()} />
                </div>
            </div>
        </div>
    );
}

export default Controle;