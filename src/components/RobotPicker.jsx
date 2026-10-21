import React, { useCallback } from 'react';

export default function RobotPicker({
  id_robo         = 'robo1',
  onRobotIdChange = () => {},
  maxRobos        = 5,
  robotsPose      = {},
}) {
  const handleSelect = useCallback((id) => onRobotIdChange(id), [onRobotIdChange]);
  const isAll = id_robo === 'Todos';

  return (
    <div className="w-full max-w-xs mx-auto mt-3 mb-1 px-2 sm:px-0 select-none">
      {/* Título */}
      <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2">
        <span className="text-[#f62681]/70">🤖 Robô selecionado</span>
        <span className="text-[#f62681] font-extrabold">{isAll ? 'Todos' : id_robo}</span>
      </div>

      {/* Botões */}
      <div className="flex gap-1.5 justify-center flex-wrap">
        {Array.from({ length: maxRobos }, (_, i) => {
          const n      = i + 1;
          const id     = `robo${n}`;
          const online = Boolean(robotsPose[id]);
          const active = id_robo === id;

          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              title={online ? `${id} — online` : `${id} — offline`}
              className={`
                relative flex flex-col items-center justify-center
                w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 font-bold text-sm
                transition-all duration-200 focus:outline-none
                focus-visible:ring-2 focus-visible:ring-[#f62681]
                ${active
                  ? 'bg-[#f62681] text-white border-[#f62681] shadow-lg shadow-[#f62681]/30 scale-105'
                  : 'bg-white text-[#f62681]/80 border-[#f62681]/25 hover:border-[#f62681]/60 hover:bg-[#fdf2f8] hover:scale-105'
                }
              `}
            >
              {n}
              <span
                aria-label={online ? 'online' : 'offline'}
                className={`absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white ${online ? 'bg-emerald-400' : 'bg-gray-300'}`}
              />
            </button>
          );
        })}

        {/* Botão "Todos" */}
        <button
          onClick={() => handleSelect('Todos')}
          title="Enviar comandos para todos os robôs ao mesmo tempo"
          className={`
            relative flex flex-col items-center justify-center
            w-16 h-12 sm:w-20 sm:h-14 rounded-xl border-2 font-bold text-xs
            transition-all duration-200 focus:outline-none
            focus-visible:ring-2 focus-visible:ring-[#f62681]
            ${isAll
              ? 'bg-[#11813a] text-white border-[#11813a] shadow-lg shadow-[#11813a]/30 scale-105'
              : 'bg-white text-[#f62681]/70 border-[#f62681]/25 hover:border-[#f62681]/60 hover:bg-[#fdf2f8] hover:scale-105'
            }
          `}
        >
          <span className="text-base leading-none">📡</span>
          <span className="mt-0.5">Todos</span>
        </button>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-3 mt-2 justify-center text-[10px] text-[#f62681]/50">
        <span className="flex items-center gap-1">
          <i className="inline-block w-2 h-2 rounded-full bg-emerald-400" /> online
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block w-2 h-2 rounded-full bg-gray-300" /> offline
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block w-2 h-2 rounded-full bg-[#f62681]" /> selecionado
        </span>
      </div>
    </div>
  );
}