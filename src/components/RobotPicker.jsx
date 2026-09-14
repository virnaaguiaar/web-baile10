import React, { useCallback } from 'react';

/**
 * Seletor do robô a ser controlado. Reutilizável em qualquer tela de controle
 * (controle manual, giroscópio, etc). Totalmente fluido (w-full), então se
 * adapta à largura do container pai em qualquer tamanho de tela.
 */
export default function RobotPicker({ robotId = 'robo1', onRobotIdChange = () => {}, maxRobos = 5, robotsPose = {} }) {
    const selectedNumber = Number(String(robotId).replace(/\D/g, '')) || 1;

    const handleChange = useCallback((event) => {
        const n = Number(event.target.value);
        onRobotIdChange(`robo${n}`);
    }, [onRobotIdChange]);

    return (
        <div className="w-full max-w-xs mx-auto mt-3 mb-1 px-2 sm:px-0">
            <label htmlFor="robot-range" className="flex justify-between items-center text-xs sm:text-sm font-bold text-amber-900 mb-1">
                <span>🤖 Robô selecionado</span>
                <span className="text-pink-600 text-sm sm:text-base">{robotId}</span>
            </label>
            <input
                id="robot-range"
                type="range"
                min={1}
                max={maxRobos}
                step={1}
                value={selectedNumber}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-1 px-1">
                {Array.from({ length: maxRobos }, (_, i) => i + 1).map((n) => {
                    const id = `robo${n}`;
                    const online = Boolean(robotsPose[id]);
                    return (
                        <span
                            key={n}
                            className={`flex flex-col items-center gap-0.5 ${n === selectedNumber ? 'font-bold text-pink-600' : ''}`}
                        >
                            {n}
                            <i
                                aria-hidden="true"
                                className="block w-1.5 h-1.5 rounded-full"
                                style={{ background: online ? '#22c55e' : '#d1d5db' }}
                            />
                        </span>
                    );
                })}
            </div>
        </div>
    );
}