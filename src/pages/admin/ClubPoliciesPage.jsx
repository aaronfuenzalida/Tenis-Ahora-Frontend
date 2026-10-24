import React, { useState, useEffect } from 'react';
import { clubConfigService, DEFAULT_CLUB_CONFIG } from '../../services/api';
import { useFeedback } from '../../context/FeedbackContext';

/**
 * Políticas del club: plazos de cancelación, retención fuera de plazo y antelación máxima de reserva.
 */
export default function ClubPoliciesPage() {
  const { notify } = useFeedback();
  const [config, setConfig] = useState(DEFAULT_CLUB_CONFIG);
  const [form, setForm] = useState(DEFAULT_CLUB_CONFIG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    clubConfigService.get().then(res => {
      setConfig(res.data);
      setForm(res.data);
    });
  }, []);

  const isDirty =
    Number(form.freeCancellationHours) !== Number(config.freeCancellationHours) ||
    Number(form.lateCancellationRetentionPercent) !== Number(config.lateCancellationRetentionPercent) ||
    Number(form.maxAdvanceBookingDays) !== Number(config.maxAdvanceBookingDays);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await clubConfigService.update({
        freeCancellationHours: Number(form.freeCancellationHours),
        lateCancellationRetentionPercent: Number(form.lateCancellationRetentionPercent),
        maxAdvanceBookingDays: Number(form.maxAdvanceBookingDays)
      });
      setConfig(res.data);
      setForm(res.data);
      notify({ variant: 'success', title: 'Políticas actualizadas', message: 'Los nuevos plazos rigen para las próximas reservas y cancelaciones.' });
    } catch (err) {
      notify({ variant: 'error', title: 'No se pudo guardar', message: err.message || 'Revisá los valores ingresados.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Políticas de Reserva y Cancelación
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Valores vigentes */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            Políticas Vigentes
          </span>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 text-xs">
            <div className="p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cancelación sin cargo</span>
              <span className="font-bold text-slate-900 text-base">{config.freeCancellationHours} hs</span>
              <span className="text-slate-500 block mt-0.5">de antelación o más</span>
            </div>
            <div className="p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Retención fuera de plazo</span>
              <span className="font-bold text-slate-900 text-base">{config.lateCancellationRetentionPercent}%</span>
              <span className="text-slate-500 block mt-0.5">de la seña</span>
            </div>
            <div className="p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Antelación máxima de reserva</span>
              <span className="font-bold text-slate-900 text-base">{config.maxAdvanceBookingDays} días</span>
              <span className="text-slate-500 block mt-0.5">hacia adelante</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Estos valores se aplican en la reserva de canchas del socio, en el control de reservas y en el cálculo de reembolsos.
          </p>
        </div>

        {/* Formulario */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 text-xs">
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Antelación mínima para cancelar sin cargo, en horas *</label>
              <input
                type="number"
                required
                min="0.5"
                step="0.5"
                value={form.freeCancellationHours}
                onChange={(e) => setForm({ ...form, freeCancellationHours: e.target.value })}
                className="w-full sm:w-64 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
              <span className="text-[11px] text-slate-500 block mt-1">Con esta antelación o más se reembolsa la seña completa.</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Retención por cancelación fuera de plazo, en porcentaje *</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={form.lateCancellationRetentionPercent}
                onChange={(e) => setForm({ ...form, lateCancellationRetentionPercent: e.target.value })}
                className="w-full sm:w-64 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
              <span className="text-[11px] text-slate-500 block mt-1">Porcentaje de la seña que se cobra como cargo. El resto vuelve al socio como crédito.</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Antelación máxima de reserva, en días *</label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={form.maxAdvanceBookingDays}
                onChange={(e) => setForm({ ...form, maxAdvanceBookingDays: e.target.value })}
                className="w-full sm:w-64 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
              <span className="text-[11px] text-slate-500 block mt-1">Hasta cuántos días hacia adelante se puede reservar una cancha.</span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={!isDirty || saving}
                onClick={() => setForm(config)}
                className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Descartar Cambios
              </button>
              <button
                type="submit"
                disabled={!isDirty || saving}
                className="px-4 py-2 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-semibold disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Políticas'}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
