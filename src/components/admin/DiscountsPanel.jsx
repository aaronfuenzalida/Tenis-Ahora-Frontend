import React, { useEffect, useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import { discountsService, usersService } from '../../services/api';

const EMPTY_FORM = {
  name: '',
  code: '',
  discountPercent: 10,
  applicableTo: 'Alquiler de Canchas',
  active: true
};

/**
 * RF138 - RF142: políticas de descuento del club y reporte de descuentos por usuario.
 */
export default function DiscountsPanel({ onChange }) {
  const [discounts, setDiscounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toDelete, setToDelete] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [dRes, uRes] = await Promise.all([discountsService.getAll(), usersService.getAll()]);
    setDiscounts(dRes.data || []);
    setUsers(uRes.data || []);
  };

  const usersWithCode = (code) => users.filter(u => (u.activeDiscounts || []).includes(code));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name, code: d.code, discountPercent: d.discountPercent, applicableTo: d.applicableTo, active: d.active !== false });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await discountsService.update(editing.id, form);
      } else {
        await discountsService.create(form);
      }
      setShowForm(false);
      await load();
      if (onChange) onChange();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el descuento.');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await discountsService.delete(toDelete.id);
    setToDelete(null);
    await load();
    if (onChange) onChange();
  };

  const usersWithDiscounts = users.filter(u => (u.activeDiscounts || []).length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">Políticas de Descuento del Club</h2>
          <p className="text-xs text-slate-500">Catálogo de descuentos aplicables en caja y asignación por usuario (gestionada desde el Padrón de Usuarios).</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          Nuevo Descuento
        </button>
      </div>

      <div id="printable-area" className="space-y-4">
        <div className="hidden print:block text-center border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900">TENIS AHORA — REPORTE DE DESCUENTOS</h2>
          <p className="text-xs text-slate-500">Políticas vigentes y asignaciones por usuario • Emitido: {new Date().toLocaleString('es-AR')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="p-3">Descuento</th>
                <th className="p-3">Código</th>
                <th className="p-3 text-center">Porcentaje</th>
                <th className="p-3">Aplica a</th>
                <th className="p-3 text-center">Usuarios Beneficiados</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-right no-print">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No hay descuentos registrados.</td>
                </tr>
              ) : (
                discounts.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                      {d.name}
                    </td>
                    <td className="p-3"><code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border">{d.code}</code></td>
                    <td className="p-3 text-center">
                      <span className="text-tennis-800 font-black">{d.discountPercent}% OFF</span>
                    </td>
                    <td className="p-3 text-slate-700">{d.applicableTo}</td>
                    <td className="p-3 text-center font-semibold text-slate-800">{usersWithCode(d.code).length}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold ${d.active !== false ? 'text-tennis-800' : 'text-slate-600'}`}>
                        {d.active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-3 text-right no-print">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => openEdit(d)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-800" title="Modificar">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => setToDelete(d)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-50 text-slate-700 hover:text-slate-600" title="Eliminar">
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-200 flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Descuentos Asignados por Usuario</h3>
            <span className="text-xs text-slate-400">({usersWithDiscounts.length} usuarios con beneficios)</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="p-3">Usuario</th>
                <th className="p-3">N° Socio</th>
                <th className="p-3">Descuentos Activos</th>
                <th className="p-3 text-right">Beneficio Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersWithDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">Ningún usuario tiene descuentos asignados.</td>
                </tr>
              ) : (
                usersWithDiscounts.map(u => {
                  const codes = u.activeDiscounts || [];
                  const total = codes.reduce((acc, code) => acc + (discounts.find(d => d.code === code)?.discountPercent || 0), 0);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">DNI {u.dni}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-700">{u.memberNumber}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {codes.map(code => {
                            const d = discounts.find(x => x.code === code);
                            return (
                              <span key={code} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {code}{d ? ` (${d.discountPercent}%)` : ''}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-tennis-700">{Math.min(total, 100)}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? `Modificar Descuento: ${editing.name}` : 'Registrar Nuevo Descuento'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && <div className="p-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl">{error}</div>}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Código *</label>
              <input type="text" required placeholder="PROMO15" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-mono" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Porcentaje (%) *</label>
              <input type="number" min="1" max="100" required value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-bold" />
            </div>
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Aplica a *</label>
            <select value={form.applicableTo} onChange={(e) => setForm({ ...form, applicableTo: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
              <option>Alquiler de Canchas</option>
              <option>Torneos y Alquiler</option>
              <option>Alquiler de Canchas y Clases</option>
              <option>Clases y Entrenamientos</option>
              <option>Inscripciones a Competencias</option>
              <option>Todos los Servicios</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-slate-700 font-semibold">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Descuento activo
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm">{editing ? 'Guardar Cambios' : 'Registrar Descuento'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Confirmar Eliminación de Descuento" maxWidth="max-w-md">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            ¿Eliminar el descuento <strong>{toDelete?.name}</strong> ({toDelete?.code})? Se quitará automáticamente de los {toDelete ? usersWithCode(toDelete.code).length : 0} usuarios que lo tienen asignado.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setToDelete(null)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="button" onClick={handleDelete} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
