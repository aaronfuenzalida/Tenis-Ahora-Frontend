import React, { useState, useEffect } from 'react';
import { tournamentsService, leaguesService, competitionTypesService } from '../../api';
import { Edit3, Trash2 } from 'lucide-react';
import Modal from '../../ui/Modal';
import { useFeedback } from '../../ui/FeedbackContext';

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

const EMPTY_FORM = {
  name: '',
  format: '',
  appliesTo: 'Torneo',
  scoringSystem: '',
  minParticipants: 4,
  maxParticipants: 16,
  description: '',
  active: true
};

/**
 * RF061 - RF065: ABM de tipos de competencias organizadas por el club.
 */
function CompetitionTypesPanel({ tournaments = [], leagues = [], onChange }) {
  const { notify } = useFeedback();
  const [types, setTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await competitionTypesService.getAll();
    setTypes(res.data || []);
  };

  const usageCount = (typeId) =>
    tournaments.filter(t => t.competitionTypeId === typeId).length +
    leagues.filter(l => l.competitionTypeId === typeId).length;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name,
      format: t.format || '',
      appliesTo: t.appliesTo || 'Torneo',
      scoringSystem: t.scoringSystem || '',
      minParticipants: t.minParticipants || 2,
      maxParticipants: t.maxParticipants || 32,
      description: t.description || '',
      active: t.active !== false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.minParticipants) > Number(form.maxParticipants)) {
      notify({ variant: 'warning', message: 'El mínimo de participantes no puede superar al máximo.' });
      return;
    }
    if (editing) {
      await competitionTypesService.update(editing.id, {
        ...form,
        minParticipants: Number(form.minParticipants),
        maxParticipants: Number(form.maxParticipants)
      });
    } else {
      await competitionTypesService.create(form);
    }
    setShowForm(false);
    setEditing(null);
    await load();
    if (onChange) onChange();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await competitionTypesService.delete(toDelete.id);
    setToDelete(null);
    await load();
    if (onChange) onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">Tipos de Competencias Organizadas</h2>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          Nuevo Tipo de Competencia
        </button>
      </div>

      <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden print:block text-center border-b p-4">
          <h2 className="text-lg font-bold text-slate-900">TENIS AHORA — REPORTE DE TIPOS DE COMPETENCIAS</h2>
          <p className="text-xs text-slate-500">Formatos oficiales, sistemas de puntuación y cupos • Emitido: {new Date().toLocaleString('es-AR')}</p>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="p-3">Tipo de Competencia</th>
              <th className="p-3">Formato</th>
              <th className="p-3">Aplica a</th>
              <th className="p-3">Sistema de Puntuación</th>
              <th className="p-3 text-center">Participantes</th>
              <th className="p-3 text-center">En uso</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-right no-print">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {types.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">No hay tipos de competencia registrados.</td>
              </tr>
            ) : (
              types.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-slate-500">{t.description || 'Sin descripción'}</div>
                  </td>
                  <td className="p-3 text-slate-700">{t.format || '-'}</td>
                  <td className="p-3">
                    <span className="text-slate-700 text-[10px] font-bold">{t.appliesTo}</span>
                  </td>
                  <td className="p-3 text-slate-600">{t.scoringSystem || '-'}</td>
                  <td className="p-3 text-center font-semibold text-slate-800">{t.minParticipants} - {t.maxParticipants}</td>
                  <td className="p-3 text-center text-slate-700">{usageCount(t.id)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold ${
                      t.active !== false ? 'text-tennis-800' : 'text-slate-600'
                    }`}>
                      {t.active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-3 text-right no-print">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => openEdit(t)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-800" title="Modificar">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setToDelete(t)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-50 text-slate-700 hover:text-slate-600" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? `Modificar Tipo: ${editing.name}` : 'Registrar Tipo de Competencia'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre *</label>
            <input
              type="text"
              required
              placeholder="Torneo de Eliminación Directa"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Formato *</label>
              <input
                type="text"
                required
                placeholder="Cuadro eliminatorio / Round Robin"
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Aplica a *</label>
              <select
                value={form.appliesTo}
                onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Torneo">Torneos</option>
                <option value="Liga">Ligas</option>
                <option value="Ambos">Torneos y Ligas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Sistema de Puntuación</label>
            <input
              type="text"
              placeholder="Al mejor de 3 sets con tie-break"
              value={form.scoringSystem}
              onChange={(e) => setForm({ ...form, scoringSystem: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mín. Participantes *</label>
              <input
                type="number"
                min="2"
                required
                value={form.minParticipants}
                onChange={(e) => setForm({ ...form, minParticipants: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Máx. Participantes *</label>
              <input
                type="number"
                min="2"
                required
                value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descripción</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <label className="flex items-center gap-2 text-slate-700 font-semibold">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Tipo activo (disponible al crear torneos o ligas)
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-tennis-600 hover:bg-tennis-700 text-white font-semibold">
              {editing ? 'Guardar Modificaciones' : 'Registrar Tipo'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Confirmar Eliminación" maxWidth="max-w-md">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            ¿Desea eliminar el tipo de competencia <strong>{toDelete?.name}</strong>?
            {toDelete && usageCount(toDelete.id) > 0 && (
              <span className="block mt-1 text-slate-700">Atención: hay {usageCount(toDelete.id)} competencia(s) asociadas a este tipo.</span>
            )}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setToDelete(null)} className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium">
              Cancelar
            </button>
            <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-semibold">
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
