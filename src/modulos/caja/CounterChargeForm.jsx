import React, { useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../ui/FeedbackContext';
import PaymentFlowModal from './PaymentFlowModal';
import MemberSelect from '../../ui/MemberSelect';

const EMPTY_FORM = { clientName: '', clientDni: '', concept: '', amount: '', discountCode: '' };

const money = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

/**
 * RF128 - RF130 y RF134: cobro en mostrador con tarjeta de débito, tarjeta de crédito o billetera
 * virtual. El pago y el recibo los resuelve el mismo flujo que usa el portal del socio.
 */
export default function CounterChargeForm({ discounts = [], onChargeComplete }) {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [form, setForm] = useState(EMPTY_FORM);
  const [payment, setPayment] = useState(null);

  const activeDiscounts = useMemo(() => discounts.filter(d => d.active !== false), [discounts]);
  const discount = activeDiscounts.find(d => d.code === form.discountCode) || null;
  const base = Number(form.amount) || 0;
  const discountAmount = discount ? Math.round(base * discount.discountPercent / 100) : 0;
  const total = Math.max(0, base - discountAmount);

  const set = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.clientDni) {
      notify({ variant: 'warning', message: 'Seleccioná el socio al que se le cobra.' });
      return;
    }
    if (!form.concept.trim()) {
      notify({ variant: 'warning', message: 'Indicá el concepto a cobrar.' });
      return;
    }
    if (base <= 0) {
      notify({ variant: 'warning', message: 'El importe a cobrar debe ser mayor a cero.' });
      return;
    }
    const concept = form.concept.trim();
    setPayment({
      concept,
      amount: total,
      items: [
        { description: concept, amount: base },
        ...(discount ? [{ description: `Descuento ${discount.name} (${discount.discountPercent}%)`, amount: -discountAmount }] : [])
      ],
      client: { name: form.clientName, dni: form.clientDni }
    });
  };

  const handlePaymentClosed = (receipt) => {
    setPayment(null);
    if (!receipt) return;
    setForm(EMPTY_FORM);
    onChargeComplete?.(receipt);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Cobro en Mostrador</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Socio *</label>
          <MemberSelect
            value={form.clientDni}
            onSelect={(m) => set({ clientName: m?.name || '', clientDni: m?.dni || '' })}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Concepto *</label>
          <input
            type="text"
            required
            placeholder="Alquiler de cancha / Cuota mensual / Inscripción"
            value={form.concept}
            onChange={(e) => set({ concept: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Importe (ARS) *</label>
            <input
              type="number"
              min="1"
              required
              value={form.amount}
              onChange={(e) => set({ amount: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-bold"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descuento</label>
            <select
              value={form.discountCode}
              onChange={(e) => set({ discountCode: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
            >
              <option value="">Sin descuento</option>
              {activeDiscounts.map(d => (
                <option key={d.code} value={d.code}>{d.name} ({d.discountPercent}%)</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="text-slate-600">
            {discount && <span className="block">Descuento: -{money(discountAmount)}</span>}
            <span className="font-bold text-slate-900">Total a cobrar: <span className="text-base font-black text-tennis-800">{money(total)}</span></span>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold shadow-sm"
          >
            Cobrar
          </button>
        </div>
      </form>

      <PaymentFlowModal
        isOpen={!!payment}
        onClose={handlePaymentClosed}
        title="Cobro en mostrador"
        concept={payment?.concept || ''}
        items={payment?.items || []}
        amount={payment?.amount || 0}
        client={payment?.client}
        kind="mostrador"
        cashierName={user?.name || 'Administración'}
      />
    </div>
  );
}
