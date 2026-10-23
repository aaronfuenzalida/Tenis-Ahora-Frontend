import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Search } from 'lucide-react';
import Modal from '../common/Modal';
import { tournamentsService, leaguesService } from '../../services/api';

const STATUS_LABEL = {
  programado: 'Programado',
  pendiente: 'Pendiente',
  finalizado: 'Finalizado',
  suspendido: 'Suspendido'
};

/**
 * RF057 - RF060: enfrentamientos de torneos y ligas (registro, modificación, consulta e impresión).
 */
export default function MatchesPanel({ onChanged }) {
  const [tournaments, setTournaments] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    competitionKey: '',
    round: '',
    p1: '',
    p2: '',
    court: 'Cancha 1',
    date: new Date().toISOString().split('T')[0],
    time: '16:00'
  });

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [tRes, lRes] = await Promise.all([tournamentsService.getAll(), leaguesService.getAll()]);
    setTournaments(tRes.data || []);
    setLeagues(lRes.data || []);
  };

  const competitions = useMemo(() => [
    ...tournaments.map(t => ({ key: `trn:${t.id}`, source: 'Torneo', id: t.id, name: t.name, rounds: (t.bracket || []).map(r => r.round), participants: t.participants || [] })),
    ...leagues.map(l => ({ key: `lg:${l.id}`, source: 'Liga', id: l.id, name: l.name, rounds: (l.fixtures || []).map(f => f.round), participants: l.participants || [] }))
  ], [tournaments, leagues]);

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

  const selectedCompetition = competitions.find(c => c.key === createForm.competitionKey);

  const openCreate = () => {
    const first = competitions[0];
    setCreateForm({
      competitionKey: first?.key || '',
      round: first?.rounds?.[0] || (first?.source === 'Liga' ? 'Jornada 1' : 'Primera Ronda'),
      p1: '',
      p2: '',
      court: 'Cancha 1',
      date: new Date().toISOString().split('T')[0],
      time: '16:00'
    });
    setShowCreate(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedCompetition) return;
    if (createForm.p1.trim() === createForm.p2.trim()) {
      alert('Los dos jugadores del enfrentamiento deben ser distintos.');
      return;
    }
    const payload = {
      p1: createForm.p1.trim(),
      p2: createForm.p2.trim(),
      court: createForm.court,
      date: `${createForm.date} ${createForm.time}`
    };
    if (selectedCompetition.source === 'Torneo') {
      await tournamentsService.addMatch(selectedCompetition.id, createForm.round || 'Primera Ronda', payload);
    } else {
      await leaguesService.addMatch(selectedCompetition.id, createForm.round || 'Jornada 1', payload);
    }
    setShowCreate(false);
    await load();
    if (onChanged) onChanged();
  };

  const openEdit = (row) => {
    const parts = row.score && row.score.includes(',') ? row.score.split(',').map(s => s.trim()) : [];
    setEditing(row);
    setEditForm({
      p1: row.p1,
      p2: row.p2,
      court: row.court || '',
      date: row.date || '',
      status: row.status || 'pendiente',
      set1: parts[0] || '',
      set2: parts[1] || '',
      set3: parts[2] || '',
      winner: row.winner || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editing || !editForm) return;
    const score = [editForm.set1, editForm.set2, editForm.set3].filter(Boolean).join(', ');
    const finishing = editForm.status === 'finalizado';
    if (finishing && !editForm.winner) {
      alert('Para finalizar el enfrentamiento debe indicar el ganador.');
      return;
    }
    const base = {
      p1: editForm.p1,
      p2: editForm.p2,
      court: editForm.court,
      date: editForm.date,
      status: editForm.status
    };
    if (editing.source === 'Torneo') {
      await tournamentsService.updateMatch(editing.competitionId, editing.id, {
        ...base,
        score: finishing ? (score || editing.score) : (score || 'Pendiente'),
        winner: finishing ? editForm.winner : null
      });
    } else {
      await leaguesService.updateMatch(editing.competitionId, editing.id, base);
      if (finishing && editing.status !== 'finalizado') {
        // Primera carga de resultado: actualiza la tabla de posiciones
        await leaguesService.updateMatchScore(editing.competitionId, editing.id, score || '6-0, 6-0', editForm.winner);
      } else if (finishing) {
        await leaguesService.updateMatch(editing.competitionId, editing.id, { score: score || editing.score, winner: editForm.winner });
      } else {
        await leaguesService.updateMatch(editing.competitionId, editing.id, { score: score || 'Pendiente', winner: null });
      }
    }
    setEditing(null);
    setEditForm(null);
    await load();
    if (onChanged) onChanged();
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">Enfrentamientos de Torneos y Ligas</h2>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={competitions.length === 0}
          className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          Registrar Enfrentamiento
        </button>
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
              <th className="p-3 text-right no-print">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">No se registran enfrentamientos para los filtros seleccionados.</td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={`${r.source}-${r.competitionId}-${r.id}`} className="hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{r.competitionName}</div>
                    <span className={`text-[10px] font-bold ${r.source === 'Torneo' ? 'text-slate-800' : 'text-slate-800'}`}>
                      {r.source}
                    </span>
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
                  <td className="p-3 text-right no-print">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-800 text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Modificar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Match */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Registrar Nuevo Enfrentamiento" maxWidth="max-w-lg">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Competencia *</label>
            <select
              value={createForm.competitionKey}
              onChange={(e) => {
                const comp = competitions.find(c => c.key === e.target.value);
                setCreateForm({
                  ...createForm,
                  competitionKey: e.target.value,
                  round: comp?.rounds?.[0] || (comp?.source === 'Liga' ? 'Jornada 1' : 'Primera Ronda')
                });
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
            >
              {competitions.map(c => (
                <option key={c.key} value={c.key}>[{c.source}] {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Ronda / Jornada *</label>
            <input
              type="text"
              required
              list="rounds-list"
              value={createForm.round}
              onChange={(e) => setCreateForm({ ...createForm, round: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
            <datalist id="rounds-list">
              {(selectedCompetition?.rounds || []).map(r => <option key={r} value={r} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Jugador / Pareja 1 *</label>
              <input
                type="text"
                required
                list="players-list"
                value={createForm.p1}
                onChange={(e) => setCreateForm({ ...createForm, p1: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Jugador / Pareja 2 *</label>
              <input
                type="text"
                required
                list="players-list"
                value={createForm.p2}
                onChange={(e) => setCreateForm({ ...createForm, p2: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
            <datalist id="players-list">
              {(selectedCompetition?.participants || []).map(p => <option key={p.id} value={p.name} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fecha *</label>
              <input type="date" required value={createForm.date} onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hora *</label>
              <input type="time" required value={createForm.time} onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Cancha *</label>
              <input type="text" required value={createForm.court} onChange={(e) => setCreateForm({ ...createForm, court: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm">Programar Enfrentamiento</button>
          </div>
        </form>
      </Modal>

      {/* Edit Match */}
      <Modal isOpen={!!editing} onClose={() => { setEditing(null); setEditForm(null); }} title={`Modificar Enfrentamiento: ${editing?.competitionName || ''}`} maxWidth="max-w-lg">
        {editForm && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jugador / Pareja 1 *</label>
                <input type="text" required value={editForm.p1} onChange={(e) => setEditForm({ ...editForm, p1: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jugador / Pareja 2 *</label>
                <input type="text" required value={editForm.p2} onChange={(e) => setEditForm({ ...editForm, p2: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Fecha y Hora</label>
                <input type="text" placeholder="2026-09-10 16:00" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cancha</label>
                <input type="text" value={editForm.court} onChange={(e) => setEditForm({ ...editForm, court: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estado</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
                  <option value="programado">Programado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="font-semibold text-slate-700">Resultado (sets)</div>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" placeholder="Set 1 (6-4)" value={editForm.set1} onChange={(e) => setEditForm({ ...editForm, set1: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-mono" />
                <input type="text" placeholder="Set 2 (6-3)" value={editForm.set2} onChange={(e) => setEditForm({ ...editForm, set2: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-mono" />
                <input type="text" placeholder="Set 3 (opcional)" value={editForm.set3} onChange={(e) => setEditForm({ ...editForm, set3: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-mono" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ganador</label>
                <select value={editForm.winner} onChange={(e) => setEditForm({ ...editForm, winner: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
                  <option value="">Sin definir</option>
                  <option value={editForm.p1}>{editForm.p1}</option>
                  <option value={editForm.p2}>{editForm.p2}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => { setEditing(null); setEditForm(null); }} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm">Guardar Enfrentamiento</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
