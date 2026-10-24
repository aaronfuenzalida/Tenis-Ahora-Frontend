import React, { useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import { courtsService, DEFAULT_COURT_AVAILABILITY } from '../../services/api';

const ALL_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const toMinutes = (hhmm = '00:00') => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function getAvailability(court) {
  return { ...DEFAULT_COURT_AVAILABILITY, ...(court?.availability || {}) };
}

// RD06: devuelve el motivo por el que el turno ("HH:MM - HH:MM") no se puede reservar, o null si está libre de bloqueos.
export function getSlotBlock(court, dateStr, slot) {
  if (court?.status === 'mantenimiento') return court.maintenanceNotes || 'Cancha en mantenimiento';
  const av = getAvailability(court);
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const day = ALL_DAYS[(new Date(y, m - 1, d).getDay() + 6) % 7];
  if (!av.days.includes(day)) return `Sin atención el día ${day}`;
  const [from, to] = String(slot).split(' - ').map(toMinutes);
  if (from < toMinutes(av.openTime) || to > toMinutes(av.closeTime)) {
    return `Fuera de horario (${av.openTime} a ${av.closeTime})`;
  }
  const block = (av.blockedRanges || []).find(b =>
    b.day === day && from < toMinutes(b.to) && to > toMinutes(b.from)
  );
  if (block) return block.reason || `Bloqueada de ${block.from} a ${block.to}`;
  return null;
}

// Minutos reservables de la cancha en una fecha: horario de atención menos los bloqueos de ese día.
export function availableMinutesOn(court, dateStr) {
  const av = getAvailability(court);
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const day = ALL_DAYS[(new Date(y, m - 1, d).getDay() + 6) % 7];
  if (!av.days.includes(day)) return 0;
  const open = toMinutes(av.openTime);
  const close = toMinutes(av.closeTime);
  const blocked = (av.blockedRanges || [])
    .filter(b => b.day === day)
    .reduce((sum, b) => sum + Math.max(0, Math.min(close, toMinutes(b.to)) - Math.max(open, toMinutes(b.from))), 0);
  return Math.max(0, close - open - blocked);
}

export function slotsPerDay(av) {
  const span = toMinutes(av.closeTime) - toMinutes(av.openTime);
  const slot = Number(av.slotMinutes) || 60;
  return span > 0 ? Math.floor(span / slot) : 0;
}

/**
 * RF016 - RF019: horarios disponibles de las canchas (registro, modificación, consulta e impresión).
 */
export default function CourtAvailabilityPanel({ courts = [], onUpdated }) {
  const [editingCourt, setEditingCourt] = useState(null);
  const [form, setForm] = useState(null);
  const [newBlock, setNewBlock] = useState({ day: 'Lunes', from: '12:00', to: '14:00', reason: '' });

  const openEdit = (court) => {
    const av = getAvailability(court);
    setEditingCourt(court);
    setForm({
      days: [...av.days],
      openTime: av.openTime,
      closeTime: av.closeTime,
      slotMinutes: av.slotMinutes,
      blockedRanges: [...(av.blockedRanges || [])],
      notes: av.notes || ''
    });
    setNewBlock({ day: 'Lunes', from: '12:00', to: '14:00', reason: '' });
  };

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const addBlock = () => {
    if (toMinutes(newBlock.to) <= toMinutes(newBlock.from)) {
      alert('El horario de fin del bloqueo debe ser posterior al de inicio.');
      return;
    }
    setForm(prev => ({
      ...prev,
      blockedRanges: [...prev.blockedRanges, { ...newBlock, id: `blk-${Date.now()}` }]
    }));
    setNewBlock({ day: 'Lunes', from: '12:00', to: '14:00', reason: '' });
  };

  const removeBlock = (idx) => {
    setForm(prev => ({ ...prev, blockedRanges: prev.blockedRanges.filter((_, i) => i !== idx) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingCourt || !form) return;
    if (form.days.length === 0) {
      alert('Seleccione al menos un día de atención.');
      return;
    }
    if (toMinutes(form.closeTime) <= toMinutes(form.openTime)) {
      alert('El horario de cierre debe ser posterior al de apertura.');
      return;
    }
    await courtsService.updateAvailability(editingCourt.id, form);
    setEditingCourt(null);
    setForm(null);
    if (onUpdated) onUpdated();
  };

  const sortedDays = (days) => ALL_DAYS.filter(d => days.includes(d));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">Horarios Disponibles de las Canchas</h2>
          <p className="text-xs text-slate-500">
            Días y franjas de atención por cancha, duración del turno y bloqueos programados. Las canchas en mantenimiento no admiten reservas (RD06).
          </p>
        </div>
      </div>

      <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden print:block text-center border-b p-4">
          <h2 className="text-lg font-bold text-slate-900">TENIS AHORA — REPORTE DE HORARIOS DISPONIBLES DE CANCHAS</h2>
          <p className="text-xs text-slate-500">Franjas de atención, turnos diarios y bloqueos • Emitido: {new Date().toLocaleString('es-AR')}</p>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="p-3">Cancha</th>
              <th className="p-3">Días de Atención</th>
              <th className="p-3">Franja Horaria</th>
              <th className="p-3 text-center">Turno</th>
              <th className="p-3 text-center">Turnos / Día</th>
              <th className="p-3">Bloqueos Programados</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-right no-print">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">No hay canchas registradas.</td>
              </tr>
            ) : (
              courts.map(court => {
                const av = getAvailability(court);
                const isMaint = court.status === 'mantenimiento';
                return (
                  <tr key={court.id} className={`hover:bg-slate-50/60 ${isMaint ? 'bg-slate-50/40' : ''}`}>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{court.name}</div>
                      <div className="text-[11px] text-slate-500">{court.surfaceType} • ${court.pricePerHour?.toLocaleString('es-AR')}/h</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {sortedDays(av.days).map(d => (
                          <span key={d} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {d.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        {av.openTime} - {av.closeTime}
                      </span>
                    </td>
                    <td className="p-3 text-center text-slate-700">{av.slotMinutes} min</td>
                    <td className="p-3 text-center font-bold text-slate-900">{slotsPerDay(av)}</td>
                    <td className="p-3 text-slate-600">
                      {(av.blockedRanges || []).length === 0 ? (
                        <span className="text-slate-400">Sin bloqueos</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {av.blockedRanges.map((b, i) => (
                            <li key={b.id || i} className="text-[11px]">
                              <strong>{b.day}</strong> {b.from}-{b.to}{b.reason ? ` · ${b.reason}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {isMaint ? (
                        <span className="text-[10px] font-bold text-slate-800 inline-flex items-center gap-1">
                          Mantenimiento
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-tennis-800">Habilitada</span>
                      )}
                    </td>
                    <td className="p-3 text-right no-print">
                      <button
                        type="button"
                        onClick={() => openEdit(court)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-800 text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Horarios
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Availability Modal */}
      <Modal
        isOpen={!!editingCourt}
        onClose={() => { setEditingCourt(null); setForm(null); }}
        title={`Horarios Disponibles: ${editingCourt?.name || ''}`}
        maxWidth="max-w-xl"
      >
        {form && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">Días de Atención *</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_DAYS.map(day => {
                  const active = form.days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                        active ? 'bg-tennis-600 text-white border-tennis-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Apertura *</label>
                <input
                  type="time"
                  required
                  value={form.openTime}
                  onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cierre *</label>
                <input
                  type="time"
                  required
                  value={form.closeTime}
                  onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Duración del Turno</label>
                <select
                  value={form.slotMinutes}
                  onChange={(e) => setForm({ ...form, slotMinutes: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  <option value={60}>60 minutos</option>
                  <option value={90}>90 minutos</option>
                  <option value={120}>120 minutos</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 flex items-center gap-2">
              <span>
                Se generan <strong className="text-slate-900">{slotsPerDay(form)}</strong> turnos por día en{' '}
                <strong className="text-slate-900">{form.days.length}</strong> día(s) de atención.
              </span>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Bloqueos Programados (sin disponibilidad)</label>
              {form.blockedRanges.length > 0 && (
                <ul className="space-y-1">
                  {form.blockedRanges.map((b, idx) => (
                    <li key={b.id || idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-900">
                        <strong>{b.day}</strong> {b.from} - {b.to}{b.reason ? ` · ${b.reason}` : ''}
                      </span>
                      <button type="button" onClick={() => removeBlock(idx)} className="p-1 rounded text-slate-700 hover:bg-slate-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <select
                    value={newBlock.day}
                    onChange={(e) => setNewBlock({ ...newBlock, day: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white outline-none"
                  >
                    {ALL_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="time" value={newBlock.from} onChange={(e) => setNewBlock({ ...newBlock, from: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                </div>
                <div className="col-span-2">
                  <input type="time" value={newBlock.to} onChange={(e) => setNewBlock({ ...newBlock, to: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Motivo (riego, escuela, torneo...)"
                    value={newBlock.reason}
                    onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <button type="button" onClick={addBlock} className="w-full p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center" title="Agregar bloqueo">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Observaciones</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => { setEditingCourt(null); setForm(null); }} className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-tennis-600 hover:bg-tennis-700 text-white font-semibold">
                Guardar Horarios
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
