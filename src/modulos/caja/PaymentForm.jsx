import React, { useMemo, useState } from 'react';
import QRCode, { qrPayloads } from '../../ui/QRCode';
import { paymentsService } from '../../api';

export const PAYMENT_METHODS = [
  { id: 'Mercado Pago (QR)', label: 'Billetera virtual QR' },
  { id: 'Tarjeta de Débito', label: 'Tarjeta de débito' },
  { id: 'Tarjeta de Crédito', label: 'Tarjeta de crédito' }
];

const EMPTY_CARD = { number: '', holder: '', expiry: '', cvv: '' };

// 4509953566233704 -> 4509 9535 6623 3704
const formatCardNumber = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

// 1130 -> 11/30
const formatExpiry = (v) => {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

/**
 * Cobro con tarjeta de débito, tarjeta de crédito o billetera virtual con QR (RD11).
 * Autoriza el pago contra la pasarela simulada, que solo acepta tarjetas de prueba (ficticias), y
 * entrega la transacción aprobada con `onApproved(tx)`. Los rechazos se muestran acá mismo.
 */
export default function PaymentForm({ amount, concept, onApproved, onCancel, onProcessingChange, cancelLabel = 'Cancelar' }) {
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id);
  const [card, setCard] = useState(EMPTY_CARD);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const isCard = method !== 'Mercado Pago (QR)';
  const reference = useMemo(() => `TA-${Date.now()}`, []);
  const qrPayload = useMemo(() => qrPayloads.payment({ concept, amount, reference }), [concept, amount, reference]);
  const money = `$${Number(amount || 0).toLocaleString('es-AR')}`;

  const setField = (patch) => setCard(prev => ({ ...prev, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (processing) return;
    setError('');
    setProcessing(true);
    onProcessingChange?.(true);
    try {
      const tx = await paymentsService.create({
        paymentMethod: method,
        amount,
        concept,
        ...(isCard ? { card } : {})
      });
      setCard(EMPTY_CARD);
      await onApproved(tx);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'No se pudo procesar el pago.');
    } finally {
      setProcessing(false);
      onProcessingChange?.(false);
    }
  };

  const input = 'w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div>
        <label className="font-bold text-slate-700 uppercase block mb-2">Medio de pago</label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(m => (
            <button
              key={m.id}
              type="button"
              disabled={processing}
              onClick={() => { setMethod(m.id); setError(''); }}
              className={`p-2.5 rounded-xl border text-center font-bold ${
                method === m.id
                  ? 'bg-tennis-50 text-tennis-900 border-tennis-600 ring-1 ring-tennis-500'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {isCard ? (
        <div className="space-y-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Número de tarjeta</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              required
              placeholder="0000 0000 0000 0000"
              value={card.number}
              onChange={(e) => setField({ number: formatCardNumber(e.target.value) })}
              className={`${input} font-mono`}
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Titular (como figura en la tarjeta)</label>
            <input
              type="text"
              autoComplete="off"
              required
              value={card.holder}
              onChange={(e) => setField({ holder: e.target.value })}
              className={input}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Vencimiento</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                required
                placeholder="MM/AA"
                value={card.expiry}
                onChange={(e) => setField({ expiry: formatExpiry(e.target.value) })}
                className={`${input} font-mono`}
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Código de seguridad</label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                required
                maxLength={4}
                value={card.cvv}
                onChange={(e) => setField({ cvv: e.target.value.replace(/\D/g, '') })}
                className={`${input} font-mono`}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Entorno de prueba: solo se aceptan tarjetas ficticias de Mercado Pago, por ejemplo Visa crédito
            4509 9535 6623 3704 o Visa débito 4002 7686 9439 5619 (vencimiento 11/30, código 123).
          </p>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <p className="text-slate-600">Escaneá el código con tu billetera virtual y confirmá cuando la app apruebe el pago.</p>
          <div className="inline-block p-3 bg-white rounded-2xl border border-slate-200">
            <div className="w-44 h-44">
              <QRCode value={qrPayload} size={176} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 font-semibold">{error}</div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={processing}
          className="px-5 py-2 bg-tennis-600 hover:bg-tennis-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm"
        >
          {processing ? 'Procesando pago...' : isCard ? `Pagar ${money}` : `Ya pagué ${money}: confirmar acreditación`}
        </button>
      </div>
    </form>
  );
}
