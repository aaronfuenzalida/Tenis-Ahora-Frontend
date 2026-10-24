import React, { useState, useEffect } from 'react';
import { courtsService } from '../../services/api';
import CourtTypesPanel from '../../components/admin/CourtTypesPanel';

export default function CourtTypesPage() {
  const [courts, setCourts] = useState([]);

  useEffect(() => {
    loadCourts();
  }, []);

  // Las canchas se usan para saber qué tipos están asignados.
  const loadCourts = async () => {
    const res = await courtsService.getAll();
    setCourts(res.data || []);
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tipos de Cancha
          </h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
        >
          Reporte de Tipos de Cancha
        </button>
      </div>

      <CourtTypesPanel courts={courts} onChange={loadCourts} />

    </div>
  );
}
