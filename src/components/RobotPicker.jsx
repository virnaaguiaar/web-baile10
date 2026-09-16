import React, { useCallback } from 'react';

/**
 * Seletor do robô a ser controlado.
 *
 * Props
 * ─────
 * robotId          string   — ID atual, ex. "robo1" ou "all" (todos)
 * onRobotIdChange  fn       — chamada com o novo ID ao clicar
 * maxRobos         number   — quantos botões de robô individual gerar (default 5)
 * robotsPose       object   — mapa { robo1: {...}, robo2: {...} } para indicar quem está online
 */
export default function RobotPicker({
  robotId          = 'robo1',
  onRobotIdChange  = () => {},
  maxRobos         = 5,
  robotsPose       = {},
}) {
  const handleSelect = useCallback((id) => {
    onRobotIdChange(id);
  }, [onRobotIdChange]);

  const isAll = robotId === 'all';

  return (
    <div className="w-full max-w-xs mx-auto mt-3 mb-1 px-2 sm:px-0 select-none">
      {/* Título */}
      <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-amber-900 mb-2">
        <span>🤖 Robô selecionado</span>
        <span className="text-pink-600 text-sm sm:text-base font-extrabold">
          {isAll ? 'Todos' : robotId}
        </span>
      </div>

      {/* Botões individuais */}
      <div className="flex gap-1.5 justify-center flex-wrap">
        {Array.from({ length: maxRobos }, (_, i) => {
          const n      = i + 1;
          const id     = `robo${n}`;
          const online = Boolean(robotsPose[id]);
          const active = robotId === id;

          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              title={online ? `${id} — online` : `${id} — offline`}
              className={`
                relative flex flex-col items-center justify-center
                w-12 h-12 sm:w-14 sm:h-14
                rounded-xl border-2 font-bold text-sm
                transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400
                ${active
                  ? 'bg-gradient-to-br from-[#f62681] to-[#F68621] text-white border-transparent shadow-lg shadow-pink-300/40 scale-105'
                  : 'bg-white text-amber-900 border-amber-200 hover:border-pink-300 hover:bg-pink-50 hover:scale-105'
                }
              `}
            >
              {n}
              {/* Indicador de status online */}
              <span
                aria-label={online ? 'online' : 'offline'}
                className={`
                  absolute bottom-1.5 right-1.5
                  w-2 h-2 rounded-full border border-white
                  ${online ? 'bg-emerald-400' : 'bg-gray-300'}
                `}
              />
            </button>
          );
        })}

        {/* Botão "Todos" — publica em "cmd" (broadcast) */}
        <button
          onClick={() => handleSelect('all')}
          title="Enviar comandos para todos os robôs ao mesmo tempo"
          className={`
            relative flex flex-col items-center justify-center
            w-16 h-12 sm:w-20 sm:h-14
            rounded-xl border-2 font-bold text-xs
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
            ${isAll
              ? 'bg-gradient-to-br from-[#F68621] to-[#f62681] text-white border-transparent shadow-lg shadow-orange-300/40 scale-105'
              : 'bg-white text-amber-900 border-amber-200 hover:border-orange-300 hover:bg-orange-50 hover:scale-105'
            }
          `}
        >
          <span className="text-base leading-none">📡</span>
          <span className="mt-0.5">Todos</span>
        </button>
      </div>

      {/* Legenda rápida */}
      <div className="flex items-center gap-3 mt-2 justify-center text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <i className="inline-block w-2 h-2 rounded-full bg-emerald-400" /> online
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block w-2 h-2 rounded-full bg-gray-300" /> offline
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-[#f62681] to-[#F68621]" /> selecionado
        </span>
      </div>
    </div>
  );
}