import React, { useState, useEffect } from 'react';
import { courtsService } from '../../services/api';
import CourtAvailabilityPanel from '../../components/admin/CourtAvailabilityPanel';

export default function CourtAvailabilityPage() {
  const [courts, setCourts] = useState([]);

  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async () => {
    const res = await courtsService.getAll();
    setCourts(res.data || []);
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Horarios Disponibles
          </h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
        >
          Reporte de Horarios
        </button>
      </div>

      <CourtAvailabilityPanel courts={courts} onUpdated={loadCourts} />

    </div>
  );
}
