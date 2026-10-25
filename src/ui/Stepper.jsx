import React from 'react';

/**
 * Indicador de pasos para flujos en pantallas sucesivas (reserva, inscripción, pago).
 * `steps`: [{ id, label }], `current`: índice del paso activo (0-based).
 * `onStepClick(index)` permite volver a un paso ya completado.
 */
export default function Stepper({ steps, current, onStepClick }) {
  return (
    <ol className="flex items-stretch gap-2 sm:gap-3">
      {steps.map((s, idx) => {
        const done = idx < current;
        const active = idx === current;
        const clickable = done && onStepClick;
        return (
          <li key={s.id} className="flex-1 min-w-0">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(idx)}
              className={`w-full h-full text-left p-3 rounded-2xl border transition-all ${
                active
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : done
                  ? 'bg-tennis-50 border-tennis-200 text-tennis-900 hover:bg-tennis-100 cursor-pointer'
                  : 'bg-white border-slate-200 text-slate-400 cursor-default'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  active ? 'bg-tennis-500 text-white' : done ? 'bg-tennis-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">{s.label}</div>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
