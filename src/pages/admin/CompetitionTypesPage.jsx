import React, { useState, useEffect } from 'react';
import { tournamentsService, leaguesService } from '../../services/api';
import CompetitionTypesPanel from '../../components/admin/CompetitionTypesPanel';

export default function CompetitionTypesPage() {
  const [tournaments, setTournaments] = useState([]);
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    loadCompetitions();
  }, []);

  // Torneos y ligas se usan para saber qué tipos están en uso.
  const loadCompetitions = async () => {
    const [tRes, lRes] = await Promise.all([tournamentsService.getAll(), leaguesService.getAll()]);
    setTournaments(tRes.data || []);
    setLeagues(lRes.data || []);
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tipos de Competencia
          </h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5"
        >
          Imprimir
        </button>
      </div>

      <CompetitionTypesPanel tournaments={tournaments} leagues={leagues} />

    </div>
  );
}
