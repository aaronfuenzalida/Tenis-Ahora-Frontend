import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { tournamentsService, leaguesService } from '../../api';

export default function MatchesManagementPage() {
  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Enfrentamientos
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

      <MatchesPanel />

    </div>
  );
}

const STATUS_LABEL = {
  programado: 'Programado',
  pendiente: 'Pendiente',
  finalizado: 'Finalizado',
  suspendido: 'Suspendido'
};

/**
 * Agenda de enfrentamientos de torneos y ligas: consulta e impresión.
 * Los partidos se programan y los resultados se cargan desde cada torneo o liga.
 */
function MatchesPanel() {
  const [tournaments, setTournaments] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [tRes, lRes] = await Promise.all([tournamentsService.getAll(), leaguesService.getAll()]);
    setTournaments(tRes.data || []);
    setLeagues(lRes.data || []);
  };

  const rows = useMemo(() => {
    const out = [];
    tournaments.forEach(t => {
      (t.bracket || []).forEach(r => {
        (r.matches || []).forEach(m => out.push({ ...m, source: 'Torneo', competitionId: t.id, competitionName: t.name, round: r.round }));
      });
    });
    leagues.forEach(l => {
      (l.fixtures || []).forEach(f => {
        (f.matches || []).forEach(m => out.push({ ...m, source: 'Liga', competitionId: l.id, competitionName: l.name, round: f.round }));
      });
    });
    return out;
  }, [tournaments, leagues]);

  const filtered = rows.filter(r => {
    if (sourceFilter !== 'ALL' && r.source !== sourceFilter) return false;
    if (statusFilter !== 'ALL' && (r.status || 'pendiente') !== statusFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return [r.p1, r.p2, r.competitionName, r.round, r.court].some(v => String(v || '').toLowerCase().includes(q));
  });

  const statusBadge = (status) => {
    const map = {
      finalizado: 'text-slate-500',
      programado: 'text-tennis-700',
      pendiente: 'text-slate-700',
      suspendido: 'text-slate-500'
    };
    return map[status] || map.pendiente;
  };

  return (
    <div className="space-y-4">
      <div className="no-print">
        <h2 className="text-base font-bold text-slate-900">Enfrentamientos de Torneos y Ligas</h2>
        <p className="text-xs text-slate-500">Los partidos se programan y los resultados se cargan desde cada torneo o liga.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 no-print">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar jugador, competencia, ronda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-tennis-600"
          />
        </div>
        <div className="flex items-center gap-1">
          {['ALL', 'Torneo', 'Liga'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSourceFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${sourceFilter === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s === 'ALL' ? 'Todas' : `${s}s`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {['ALL', 'programado', 'pendiente', 'finalizado'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === s ? 'bg-tennis-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s === 'ALL' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden print:block text-center border-b p-4">
          <h2 className="text-lg font-bold text-slate-900">TENIS AHORA — REPORTE DE ENFRENTAMIENTOS</h2>
          <p className="text-xs text-slate-500">Partidos programados y resultados de torneos y ligas • Emitido: {new Date().toLocaleString('es-AR')}</p>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="p-3">Competencia</th>
              <th className="p-3">Ronda / Jornada</th>
              <th className="p-3">Enfrentamiento</th>
              <th className="p-3">Fecha y Cancha</th>
              <th className="p-3">Resultado</th>
              <th className="p-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">No se registran enfrentamientos para los filtros seleccionados.</td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={`${r.source}-${r.competitionId}-${r.id}`} className="hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{r.competitionName}</div>
                    <span className="text-[10px] font-bold text-slate-800">{r.source}</span>
                  </td>
                  <td className="p-3 text-slate-700">{r.round}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <span className={r.winner === r.p1 ? 'text-tennis-700' : ''}>{r.p1}</span>
                      <span className="text-slate-400">vs</span>
                      <span className={r.winner === r.p2 ? 'text-tennis-700' : ''}>{r.p2}</span>
                    </div>
                    {r.winner && <div className="text-[10px] text-tennis-700">Ganador: {r.winner}</div>}
                  </td>
                  <td className="p-3 text-slate-600">
                    <div>{r.date || '-'}</div>
                    <div className="text-[11px] text-slate-400">{r.court || '-'}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">{r.score || 'Pendiente'}</td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold ${statusBadge(r.status || 'pendiente')}`}>
                      {STATUS_LABEL[r.status] || 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
