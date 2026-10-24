import React from 'react';
import DiscountsPanel from '../../components/admin/DiscountsPanel';

export default function DiscountsPage() {
  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Descuentos
          </h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
        >
          Imprimir Descuentos
        </button>
      </div>

      <DiscountsPanel />

    </div>
  );
}
