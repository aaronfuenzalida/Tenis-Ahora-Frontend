import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { clubConfigService } from '../../services/api';

/**
 * RD02 - RD05: plazos de cancelación y antelación máxima de reserva que fija el club.
 */
export default function ClubPolicyModal({ isOpen, config, onClose, onSaved }) {
  const [form, setForm] = useState(config);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(config);
      setError('');
    }
  }, [isOpen, config]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await clubConfigService.update({
        freeCancellationHours: Number(form.freeCancellationHours),
        lateCancellationRetentionPercent: Number(form.lateCancellationRetentionPercent),
        maxAdvanceBookingDays: Number(form.maxAdvanceBookingDays)
      });
      onSaved(res.data);
    } catch (err) {
      setError(err.message || 'No se pudo guardar la configuración.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Políticas de Reserva y Cancelación" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="font-bold text-slate-700 uppercase block mb-1">Antelación mínima para cancelar sin cargo (hs) *</label>
          <input
            type="number"
            required
            min="0.5"
            step="0.5"
            value={form.freeCancellationHours}
            onChange={(e) => setForm({ ...form, freeCancellationHours: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
          />
          <span className="text-[10px] text-slate-400 block mt-1">Con esta antelación o más se reembolsa la seña completa (RD02, RD04).</span>
        </div>

        <div>
          <label className="font-bold text-slate-700 uppercase block mb-1">Retención por cancelación fuera de plazo (%) *</label>
          <input
            type="number"
            required
            min="0"
            max="100"
            value={form.lateCancellationRetentionPercent}
            onChange={(e) => setForm({ ...form, lateCancellationRetentionPercent: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
          />
          <span className="text-[10px] text-slate-400 block mt-1">Porcentaje de la seña que se cobra como cargo; el resto vuelve como crédito (RD03).</span>
        </div>

        <div>
          <label className="font-bold text-slate-700 uppercase block mb-1">Antelación máxima de reserva (días) *</label>
          <input
            type="number"
            required
            min="1"
            step="1"
            value={form.maxAdvanceBookingDays}
            onChange={(e) => setForm({ ...form, maxAdvanceBookingDays: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
          />
          <span className="text-[10px] text-slate-400 block mt-1">Hasta cuántos días hacia adelante se puede reservar una cancha (RD05).</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">
            Volver
          </button>
          <button type="submit" className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl">
            Guardar Políticas
          </button>
        </div>
      </form>
    </Modal>
  );
}
