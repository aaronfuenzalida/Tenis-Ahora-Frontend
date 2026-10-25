import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Modal from '../common/Modal';
import { refundsService, reservationsService, receiptsService, clubConfigService, DEFAULT_CLUB_CONFIG } from '../../services/api';
import { useFeedback } from '../../context/FeedbackContext';

const REFUND_METHODS = [
  'Devolución a Tarjeta de Débito',
  'Devolución a Tarjeta de Crédito',
  'Devolución a Billetera Virtual',
  'Crédito en cuenta de socio'
];

const EMPTY_FORM = {
  clientName: '',
  clientDni: '',
  relatedReservationId: '',
  relatedReceiptId: '',
  reason: '',
  originalAmount: 0,
  refundAmount: 0,
  refundMethod: REFUND_METHODS[0]
};

const money = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

/**
 * RF131 - RF133: registro, consulta e impresión de reembolsos (RD03 / RD04).
 */
export default function RefundsPanel() {
  const { notify } = useFeedback();
  const [refunds, setRefunds] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [clubConfig, setClubConfig] = useState(DEFAULT_CLUB_CONFIG);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [rfRes, rsRes, rcRes, cfgRes] = await Promise.all([
      refundsService.getAll(),
      reservationsService.getAll(),
      receiptsService.getAll(),
      clubConfigService.get()
    ]);
    setClubConfig(cfgRes.data);
    setRefunds(rfRes.data || []);
    setReservations(rsRes.data || []);
    setReceipts(rcRes.data || []);
  };

  const fillFromReservation = (resId) => {
    const r = reservations.find(x => x.id === resId);
    if (!r) {
      setForm(prev => ({ ...prev, relatedReservationId: resId }));
      return;
    }
    const lead = r.participants?.[0] || {};
    setForm(prev => ({
      ...prev,
      relatedReservationId: resId,
      relatedReceiptId: r.depositReceiptNumber || prev.relatedReceiptId,
      clientName: lead.name || prev.clientName,
      clientDni: lead.dni || prev.clientDni,
      originalAmount: Number(r.depositPaid) || 0,
      refundAmount: Number(r.depositPaid) || 0,
      reason: prev.reason || `Reintegro de seña por cancelación de reserva ${r.id} (${r.courtName}, ${r.date}).`
    }));
  };

  const fillFromReceipt = (recId) => {
    const rec = receipts.find(x => x.id === recId);
    if (!rec) {
      setForm(prev => ({ ...prev, relatedReceiptId: recId }));
      return;
    }
    setForm(prev => ({
      ...prev,
      relatedReceiptId: recId,
      clientName: rec.clientName || prev.clientName,
      clientDni: rec.clientDni || prev.clientDni,
      originalAmount: Number(rec.totalPaid) || 0,
      refundAmount: Number(rec.totalPaid) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.refundAmount) <= 0) {
      notify({ variant: 'warning', message: 'El importe a reembolsar debe ser mayor a cero.' });
      return;
    }
    if (Number(form.refundAmount) > Number(form.originalAmount)) {
      notify({ variant: 'warning', message: 'El reembolso no puede superar el importe original abonado.' });
      return;
    }
    await refundsService.create(form);
    setShowForm(false);
    setForm(EMPTY_FORM);
    await load();
  };

  const filtered = refunds.filter(r => {
    const q = search.toLowerCase();
    return !q || [r.id, r.clientName, r.clientDni, r.reason, r.relatedReservationId, r.relatedReceiptId].some(v => String(v || '').toLowerCase().includes(q));
  });

  const totalRefunded = filtered.reduce((acc, r) => acc + r.refundAmount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">Reembolsos y Devoluciones</h2>
          <p className="text-xs text-slate-500">
            Cancelaciones dentro del plazo (≥ {clubConfig.freeCancellationHours} hs) generan reembolso total de la seña; fuera de plazo se retiene el {clubConfig.lateCancellationRetentionPercent}% como cargo y el resto vuelve como crédito.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}
          className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          Registrar Reembolso
        </button>
      </div>

      <div className="no-print">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por socio, DNI, reserva o recibo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-tennis-600"
          />
        </div>
      </div>

      <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden print:block text-center border-b p-4">
          <h2 className="text-lg font-bold text-slate-900">TENIS AHORA — REPORTE DE REEMBOLSOS</h2>
          <p className="text-xs text-slate-500">Devoluciones registradas • Emitido: {new Date().toLocaleString('es-AR')}</p>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="p-3">N° Reembolso</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Socio</th>
              <th className="p-3">Origen</th>
              <th className="p-3">Motivo</th>
              <th className="p-3 text-right">Abonado</th>
              <th className="p-3 text-right">Reintegro</th>
              <th className="p-3">Medio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">No se registran reembolsos.</td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-tennis-800">{r.id}</td>
                  <td className="p-3 text-slate-600">{r.date}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{r.clientName}</div>
                    <div className="text-[11px] text-slate-500">DNI {r.clientDni}</div>
                  </td>
                  <td className="p-3 text-slate-600 text-[11px]">
                    {r.relatedReservationId && <div>Reserva {r.relatedReservationId}</div>}
                    {r.relatedReceiptId && <div>Recibo {r.relatedReceiptId}</div>}
                    {!r.relatedReservationId && !r.relatedReceiptId && '-'}
                  </td>
                  <td className="p-3 text-slate-700 max-w-xs">{r.reason}</td>
                  <td className="p-3 text-right text-slate-600">{money(r.originalAmount)}</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {money(r.refundAmount)}
                    <span className={`block text-[10px] font-bold ${r.refundType === 'total' ? 'text-tennis-700' : 'text-slate-700'}`}>{r.refundType === 'total' ? 'Total' : 'Parcial'}</span>
                  </td>
                  <td className="p-3 text-slate-600">{r.refundMethod}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
              <td colSpan={6} className="p-3 text-right">Total reintegrado</td>
              <td className="p-3 text-right">{money(totalRefunded)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Registrar Reembolso" maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reserva Asociada</label>
              <select value={form.relatedReservationId} onChange={(e) => fillFromReservation(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
                <option value="">Sin reserva</option>
                {reservations.map(r => (
                  <option key={r.id} value={r.id}>{r.id} — {r.participants?.[0]?.name} — {r.status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Recibo Asociado</label>
              <select value={form.relatedReceiptId} onChange={(e) => fillFromReceipt(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
                <option value="">Sin recibo</option>
                {receipts.map(r => (
                  <option key={r.id} value={r.id}>{r.id} — {r.clientName} — {money(r.totalPaid)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Socio *</label>
              <input type="text" required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">DNI *</label>
              <input type="text" required value={form.clientDni} onChange={(e) => setForm({ ...form, clientDni: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Motivo *</label>
            <textarea rows={2} required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Importe Abonado *</label>
              <input type="number" min="0" required value={form.originalAmount} onChange={(e) => setForm({ ...form, originalAmount: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Importe a Reintegrar *</label>
              <input type="number" min="0" required value={form.refundAmount} onChange={(e) => setForm({ ...form, refundAmount: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-bold" />
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex gap-1">
                <button type="button" onClick={() => setForm({ ...form, refundAmount: form.originalAmount })} className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold">100%</button>
                <button type="button" onClick={() => setForm({ ...form, refundAmount: Math.round(form.originalAmount * 0.5) })} className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold">50%</button>
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Medio de Devolución *</label>
            <select value={form.refundMethod} onChange={(e) => setForm({ ...form, refundMethod: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
              {REFUND_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm inline-flex items-center gap-1.5">
              Registrar Reembolso
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
