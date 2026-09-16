import React, { useState, useEffect, useCallback, useRef } from 'react';
import useMQTT from '../hooks/useMQTT';
import RobotPicker   from './RobotPicker';
import RobotFloorMap from './RobotFloorMap';

function ControleGiroscopio({ robotsPose = {}, id_robo = 'robo1', onRobotIdChange = () => {} }) {
    const brokerUrl = process.env.REACT_APP_MQTT_BROKER
        || 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';

    const { sendCommand, isConnected } = useMQTT(brokerUrl);

    const [gyroActive,   setGyroActive]   = useState(false);
    const [calibration,  setCalibration]  = useState({ beta: 0, gamma: 0 });
    const [sensitivity,  setSensitivity]  = useState(0.5);
    const [lastCommand,  setLastCommand]  = useState('');

    const lastSendRef    = useRef(0);
    const lastCommandRef = useRef('');

    // Círculo verde: pose do robô selecionado chegou nos últimos 3s
    const poseDoRobo = robotsPose[id_robo];
    const isRobotConnected = poseDoRobo
        && (Date.now() - (poseDoRobo.lastUpdate || 0)) < 3000;

    // Publica sempre em "cmd" (broadcast) para funcionar com firmware atual
    const publicar = useCallback((comando) => {
        sendCommand(comando, 'cmd/${id_robo}');
    }, [sendCommand]);

    const mapAngleToSpeed = (angle, center, sens) => {
        let speed = (angle - center) * sens;
        speed = Math.max(-9, Math.min(9, speed));
        return Math.round(speed);
    };

    const handleOrientation = useCallback((event) => {
        if (!gyroActive) return;

        const now = Date.now();
        if (now - lastSendRef.current < 50) return; // throttle 20 Hz
        lastSendRef.current = now;

        let speedY = mapAngleToSpeed(event.beta  || 0, calibration.beta,  sensitivity);
        let speedX = mapAngleToSpeed(event.gamma || 0, calibration.gamma, sensitivity);

        if (Math.abs(speedY) < 1) speedY = 0;
        if (Math.abs(speedX) < 1) speedX = 0;

        const command = `${speedX},${-speedY}`;
        if (command === lastCommandRef.current) return;
        lastCommandRef.current = command;

        if (speedX !== 0 || speedY !== 0) {
            const dirX = speedX >= 0 ? '+' : '-';
            const dirY = (-speedY) >= 0 ? '+' : '-';
            publicar(`DN0X${dirX}${Math.abs(speedX)}Y${dirY}${Math.abs(-speedY)}`);
            setLastCommand(`X=${speedX}, Y=${-speedY}`);
        } else {
            publicar('DN0CPA');
            setLastCommand('Parado');
        }
    }, [gyroActive, calibration, sensitivity, publicar]);

    const calibrate = () => {
        if (!window.DeviceOrientationEvent) return;
        window.addEventListener('deviceorientation', (e) => {
            setCalibration({ beta: e.beta || 0, gamma: e.gamma || 0 });
            setGyroActive(true);
        }, { once: true });
    };

    useEffect(() => {
        if (!gyroActive) return;
        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [gyroActive, handleOrientation]);

    const requestPermission = () => {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(state => { if (state === 'granted') calibrate(); })
                .catch(console.error);
        } else {
            calibrate();
        }
    };

    return (
        <div className="flex flex-col items-center p-3 sm:p-6 mt-4 sm:mt-8 w-full max-w-[1099px] mx-auto bg-white border-pink-400 border-solid border-4 sm:border-[10px] rounded-2xl sm:rounded-[32px]">
            <section className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-pink-950 mb-4">
                🎮 Controle por Giroscópio
            </section>

            <div className={`text-sm mb-2 font-bold ${isRobotConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isRobotConnected ? `✅ ${id_robo} conectado` : `❌ ${id_robo} desconectado`}
            </div>

            <div className={`text-sm mb-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                {isConnected ? '🌐 MQTT conectado' : '❌ MQTT desconectado'}
            </div>

            {!isConnected && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 w-full max-w-md text-center">
                    ⚠️ Aguardando conexão com o robô...
                </div>
            )}

            <RobotPicker id_robo={id_robo} onRobotIdChange={onRobotIdChange} robotsPose={robotsPose} />

            {!gyroActive ? (
                <button
                    onClick={requestPermission}
                    disabled={!isConnected}
                    className={`bg-[#F68621] text-white py-3 px-8 rounded-xl transition-colors text-lg font-semibold mt-4 ${
                        !isConnected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f47902]'
                    }`}
                >
                    📱 Ativar Controle por Giroscópio
                </button>
            ) : (
                <div className="w-full max-w-md space-y-4 mt-4">
                    <div className="bg-green-100 p-4 rounded-lg text-center">
                        <div className="text-2xl mb-2">🎯 Giroscópio Ativo!</div>
                        <div className="text-sm text-gray-600">Incline o celular para controlar o robô</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Sensibilidade: {sensitivity.toFixed(1)}
                        </label>
                        <input
                            type="range" min="0.1" max="1.0" step="0.05"
                            value={sensitivity}
                            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Menos sensível</span><span>Mais sensível</span>
                        </div>
                    </div>

                    <div className="bg-gray-100 p-3 rounded-lg text-center text-sm">
                        <span className="font-bold">🎯 Posição neutra:</span><br/>
                        β: {calibration.beta.toFixed(1)}° | γ: {calibration.gamma.toFixed(1)}°
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg text-center text-xs text-gray-600">
                        📡 Último comando: {lastCommand || '—'}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => { calibrate(); setLastCommand('Recalibrado'); }}
                            className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600"
                        >
                            🔄 Recalibrar
                        </button>
                        <button
                            onClick={() => { setGyroActive(false); publicar('DN0CPA'); setLastCommand('Desativado'); }}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                        >
                            ⏹️ Desativar
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-8 text-sm text-gray-400 text-center px-2">
                <p>📱 Como usar:</p>
                <p>1. Mantenha o celular na posição neutra (reto)</p>
                <p>2. Incline para frente/trás → move frente/trás</p>
                <p>3. Incline para esquerda/direita → vira</p>
                <p>4. Volte à posição neutra para parar</p>
            </div>

            <RobotFloorMap
                robotsPose={robotsPose}
                mqttOnline={isConnected}
                selectedRobotId={id_robo}
                title="Onde estão os robôs"
            />
        </div>
    );
}

export default ControleGiroscopio;