import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import Modal from '../../ui/Modal';
import QRCode, { qrPayloads } from '../../ui/QRCode';
import ReceiptModal from './ReceiptModal';
import { receiptsService } from '../../api';

export const PAYMENT_METHODS = [
  { id: 'Mercado Pago (QR)', label: 'Billetera virtual QR' },
  { id: 'Tarjeta de Débito', label: 'Tarjeta de débito' },
  { id: 'Tarjeta de Crédito', label: 'Tarjeta de crédito' }
];

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function newReceiptId() {
  return `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Arma el recibo oficial de un pago hecho desde el portal (inscripciones, clases, turnos).
 */
export function buildReceipt({
  concept,
  items,
  amount,
  paymentMethod,
  client,
  relatedId,
  kind,
  cashierName,
  qrData,
  paymentUrl,
  mpPreferenceId
}) {
  const id = newReceiptId();
  const defaultPrefId = mpPreferenceId || `MP-PREF-${id}`;
  const defaultPayUrl =
    paymentUrl || `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${encodeURIComponent(defaultPrefId)}`;
  const defaultQrData =
    qrData || `https://mpago.la/pos/tenisahora/${id.toLowerCase()}?pref_id=${encodeURIComponent(defaultPrefId)}`;

  return {
    id,
    reservationId: null,
    relatedId: relatedId || null,
    kind: kind || 'inscripcion',
    clientName: client?.name || 'Socio',
    clientDni: client?.dni || '',
    concept,
    items: items && items.length ? items : [{ description: concept, amount }],
    totalPaid: amount,
    paymentMethod,
    status: 'completado',
    date: nowStamp(),
    qrData: defaultQrData,
    paymentUrl: defaultPayUrl,
    mpPreferenceId: defaultPrefId,
    cashierName: cashierName || 'Portal del socio'
  };
}

/**
 * Flujo de pago en pasos para inscripciones a torneos, ligas, clases y turnos particulares:
 *   1) elegir medio de pago  2) pagar (QR Mercado Pago / Link de Pago o tarjeta)  3) comprobante emitido.
 */
export default function PaymentFlowModal({
  isOpen,
  onClose,
  title = 'Pago de inscripción',
  concept,
  items,
  amount,
  client,
  relatedId,
  kind,
  summary,
  cashierName,
  qrData,
  paymentUrl,
  preferenceId,
  onPaid,
  onCompleted
}) {
  const [step, setStep] = useState('method'); // method | qr | processing | done
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setError('');
      setReceipt(null);
      setShowReceipt(false);
    }
  }, [isOpen]);

  const reference = useMemo(
    () => preferenceId || `${(kind || 'PAGO').toUpperCase()}-${Date.now()}`,
    [isOpen, kind, preferenceId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const qrPayload = useMemo(
    () => qrData || paymentUrl || qrPayloads.payment({ concept, amount, reference }),
    [qrData, paymentUrl, concept, amount, reference]
  );

  const mpCheckoutLink = useMemo(
    () =>
      paymentUrl ||
      `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${encodeURIComponent(reference)}`,
    [paymentUrl, reference]
  );

  const settle = async () => {
    setStep('processing');
    setError('');
    try {
      const extra = await onPaid?.(paymentMethod);
      const rec = buildReceipt({
        concept,
        items,
        amount,
        paymentMethod,
        client,
        relatedId: extra?.relatedId || relatedId,
        kind,
        cashierName,
        qrData: extra?.qrData || qrData,
        paymentUrl: extra?.paymentUrl || paymentUrl || mpCheckoutLink,
        mpPreferenceId: extra?.preferenceId || preferenceId || reference
      });
      await receiptsService.create(rec);
      setReceipt(rec);
      setStep('done');
      onCompleted?.(rec);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'No se pudo completar el pago.');
      setStep('method');
    }
  };

  const handlePay = () => {
    if (paymentMethod === 'Mercado Pago (QR)') {
      setStep('qr');
    } else {
      settle();
    }
  };

  const handleClose = () => {
    if (step === 'processing') return;
    onClose(step === 'done' ? receipt : null);
  };

  const steps = [
    { id: 'method', label: 'Medio de pago' },
    { id: 'qr', label: 'Pago' },
    { id: 'done', label: 'Comprobante' }
  ];
  const stepIndex = step === 'method' ? 0 : step === 'done' ? 2 : 1;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="max-w-md">
        <div className="space-y-5 text-xs">
          {/* Indicador de pasos */}
          <ol className="flex items-center gap-2">
            {steps.map((s, idx) => (
              <li key={s.id} className="flex items-center gap-2 flex-1">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                    idx < stepIndex
                      ? 'bg-tennis-600 text-white'
                      : idx === stepIndex
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className={`font-bold truncate ${idx === stepIndex ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s.label}
                </span>
                {idx < steps.length - 1 && <span className="flex-1 border-t border-slate-200" />}
              </li>
            ))}
          </ol>

          {/* Resumen */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-800">{concept}</div>
            {summary && <div className="text-slate-500">{summary}</div>}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
              <span className="font-bold text-slate-600">Total a pagar:</span>
              <span className="text-lg font-extrabold text-tennis-700">
                ${Number(amount || 0).toLocaleString('es-AR')} ARS
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 font-semibold">{error}</div>
          )}

          {/* Paso 1: medio de pago */}
          {(step === 'method' || step === 'processing') && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-2">Elegí cómo pagar</label>
                <div className="grid grid-cols-1 gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const active = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={step === 'processing'}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3 rounded-xl border text-left font-bold flex items-center gap-3 transition-all ${
                          active
                            ? 'bg-tennis-50 text-tennis-900 border-tennis-600 ring-1 ring-tennis-500'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={step === 'processing'}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={step === 'processing'}
                  className="px-5 py-2 bg-tennis-600 hover:bg-tennis-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-colors"
                >
                  {step === 'processing'
                    ? 'Procesando pago...'
                    : paymentMethod === 'Mercado Pago (QR)'
                    ? 'Continuar al QR'
                    : `Pagar $${Number(amount || 0).toLocaleString('es-AR')}`}
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: QR real + Link de Pago de Mercado Pago */}
          {step === 'qr' && (
            <div className="text-center space-y-3">
              <p className="text-slate-600">
                Escaneá el código QR con tu app de Mercado Pago o abrí el link de pago directo.
              </p>
              <div className="inline-block p-3 bg-white rounded-2xl border-2 border-dashed border-sky-300">
                <div className="w-48 h-48">
                  <QRCode value={qrPayload} size={192} />
                </div>
              </div>

              {mpCheckoutLink && (
                <div>
                  <a
                    href={mpCheckoutLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir Link de Pago en Mercado Pago
                  </a>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={settle}
                  className="px-5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                >
                  Ya pagué: confirmar acreditación
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: comprobante */}
          {step === 'done' && receipt && (
            <div className="space-y-4 text-center">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Pago acreditado</h4>
                <p className="text-slate-600 mt-1">
                  Se emitió el recibo <strong className="font-mono">{receipt.id}</strong>.{' '}
                  {kind === 'mostrador' ? (
                    <>
                      Quedó registrado en <strong>Recibos y Cobros</strong>.
                    </>
                  ) : (
                    <>
                      Lo vas a encontrar en <strong>Mis Pagos y Recibos</strong>.
                    </>
                  )}
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceipt(true)}
                  className="px-4 py-2 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-bold border border-tennis-200 transition-colors"
                >
                  Ver recibo
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-colors"
                >
                  Listo
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} receipt={receipt} />
    </>
  );
}
