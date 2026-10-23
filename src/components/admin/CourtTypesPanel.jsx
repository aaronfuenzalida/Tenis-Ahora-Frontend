import React, { useEffect, useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import { courtTypesService } from '../../services/api';

const EMPTY_FORM = {
  name: '',
  label: '',
  description: '',
  speed: 'Media',
  basePricePerHour: 4500,
  maintenanceFrequency: '',
  maxStudentsPerClass: 30,
  active: true
};

/**
 * RF011 - RF015: ABM de tipos de cancha (superficies) con reporte imprimible.
 */
export default function CourtTypesPanel({ courts = [], onChange }) {
  const [types, setTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toDelete, setToDelete] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await courtTypesService.getAll();
    setTypes(res.data || []);
  };

  const notify = () => {
    if (onChange) onChange();
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (type) => {
    setEditing(type);
    setForm({
      name: type.name,
      label: type.label || type.name,
      description: type.description || '',
      speed: type.speed || 'Media',
      basePricePerHour: type.basePricePerHour || 0,
      maintenanceFrequency: type.maintenanceFrequency || '',
      maxStudentsPerClass: type.maxStudentsPerClass || 30,
      active: type.active !== false
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.maxStudentsPerClass) > 30) {
      setError('El cupo máximo por clase no puede superar los 30 alumnos (RD07).');
      return;
    }
    try {
      if (editing) {
        await courtTypesService.update(editing.id, form);
      } else {
        await courtTypesService.create(form);
      }
      setShowForm(false);
      setEditing(null);
      await load();
      notify();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el tipo de cancha.');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await courtTypesService.delete(toDelete.id);
      setToDelete(null);
      await load();
      notify();
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el tipo de cancha.');
      setToDelete(null);
    }
  };

  const countCourts = (typeName) => courts.filter(c => c.surfaceType === typeName).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">Tipos de Cancha y Superficies</h2>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          Nuevo Tipo de Cancha
        </button>
      </div>

      <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden print:block text-center border-b p-4">
          <h2 className="text-lg font-bold text-slate-900">TENIS AHORA — REPORTE DE TIPOS DE CANCHA</h2>
          <p className="text-xs text-slate-500">Superficies habilitadas, tarifas base y parámetros de mantenimiento • Emitido: {new Date().toLocaleString('es-AR')}</p>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="p-3">Tipo / Superficie</th>
              <th className="p-3">Velocidad</th>
              <th className="p-3">Tarifa Base</th>
              <th className="p-3">Mantenimiento</th>
              <th className="p-3 text-center">Cupo Máx. Clase</th>
              <th className="p-3 text-center">Canchas</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-right no-print">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {types.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">No hay tipos de cancha registrados.</td>
              </tr>
            ) : (
              types.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {t.label || t.name}
                    </div>
                    <div className="text-[11px] text-slate-500">{t.description || 'Sin descripción'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Clave: {t.name}</div>
                  </td>
                  <td className="p-3 text-slate-700">{t.speed}</td>
                  <td className="p-3 font-bold text-slate-900">${Number(t.basePricePerHour || 0).toLocaleString('es-AR')} / h</td>
                  <td className="p-3 text-slate-600">{t.maintenanceFrequency || '-'}</td>
                  <td className="p-3 text-center font-semibold text-slate-800">{t.maxStudentsPerClass} alumnos</td>
                  <td className="p-3 text-center text-slate-700">{countCourts(t.name)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold ${
                      t.active !== false ? 'text-tennis-800' : 'text-slate-600'
                    }`}>
                      {t.active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-3 text-right no-print">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-800"
                        title="Modificar tipo de cancha"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(t)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-50 text-slate-700 hover:text-slate-600"
                        title="Eliminar tipo de cancha"
                      >
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? `Modificar Tipo de Cancha: ${editing.label || editing.name}` : 'Registrar Nuevo Tipo de Cancha'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl flex items-center gap-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Clave / Nombre Corto *</label>
              <input
                type="text"
                required
                placeholder="Ladrillo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nombre Comercial *</label>
              <input
                type="text"
                required
                placeholder="Polvo de Ladrillo"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Velocidad de Juego</label>
              <select
                value={form.speed}
                onChange={(e) => setForm({ ...form, speed: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Lenta">Lenta</option>
                <option value="Media">Media</option>
                <option value="Media-Rápida">Media-Rápida</option>
                <option value="Rápida">Rápida</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tarifa Base (ARS/h) *</label>
              <input
                type="number"
                min="0"
                required
                value={form.basePricePerHour}
                onChange={(e) => setForm({ ...form, basePricePerHour: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Cupo Máx. por Clase *</label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={form.maxStudentsPerClass}
                onChange={(e) => setForm({ ...form, maxStudentsPerClass: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Frecuencia de Mantenimiento</label>
            <input
              type="text"
              placeholder="Diaria (riego y pasada de alfombra)"
              value={form.maintenanceFrequency}
              onChange={(e) => setForm({ ...form, maintenanceFrequency: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <label className="flex items-center gap-2 text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="rounded border-slate-300 text-tennis-600"
            />
            Tipo activo y disponible para asignar a canchas
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

      {/* Delete Modal */}
      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Confirmar Eliminación de Tipo de Cancha" maxWidth="max-w-md">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            ¿Desea eliminar el tipo <strong>{toDelete?.label || toDelete?.name}</strong>? Solo es posible si no existen canchas registradas con esta superficie.
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
