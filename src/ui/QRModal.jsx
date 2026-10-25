import React, { useMemo, useState } from 'react';
import { ExternalLink, QrCode as QrCodeIcon } from 'lucide-react';
import Modal from './Modal';
import QRCode, { qrPayloads } from './QRCode';

/**
 * Modal de cobro con Mercado Pago / billetera virtual (RD01 — IEEE SRS-830).
 * Renderiza el Código QR de Mercado Pago (`qrData` devuelto por el backend C# o payload interoperable)
 * y el botón de enlace externo (`paymentUrl` / `sandboxInitPoint`) hacia el Checkout de Mercado Pago.
 */
export default function QRModal({
  isOpen,
  onClose,
  amount,
  concept,
  reference,
  qrData,
  paymentUrl,
  sandboxInitPoint,
  preferenceId,
  onPaymentSuccess
}) {
  const [processing, setProcessing] = useState(false);

  const fallbackPayload = useMemo(
    () => qrPayloads.payment({ concept, amount, reference }),
    [concept, amount, reference]
  );

  const effectiveQrValue = qrData || paymentUrl || sandboxInitPoint || fallbackPayload;
  const effectivePaymentLink =
    paymentUrl ||
    sandboxInitPoint ||
    (reference
      ? `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${encodeURIComponent(preferenceId || reference)}`
      : '');

  const handleConfirmPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess?.();
      onClose?.();
    }, 800);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pago con Mercado Pago (QR / Link)" maxWidth="max-w-md">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-extrabold mb-2">
          <QrCodeIcon className="w-3.5 h-3.5" />
          Checkout Oficial Mercado Pago • Seña 50%
        </div>

        <h4 className="text-lg font-bold text-slate-800">Escaneá el QR o abrí el Link de Pago</h4>
        <p className="text-xs text-slate-500 mt-1">
          Acepta Mercado Pago, Cuenta DNI, BNA+, MODO y cualquier billetera interoperable.
        </p>

        {/* Concepto e importe */}
        <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
          <div className="text-xs text-slate-500">Concepto a cobrar:</div>
          <div className="font-semibold text-sm text-slate-800">{concept || 'Pago Club Tenis Ahora'}</div>
          {(preferenceId || reference) && (
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Preferencia MP: <span className="font-bold text-slate-700">{preferenceId || reference}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-xs font-bold text-slate-600">Importe a pagar:</span>
            <span className="text-xl font-extrabold text-tennis-700">
              ${Number(amount || 0).toLocaleString('es-AR')} ARS
            </span>
          </div>
        </div>

        {/* QR real */}
        <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-sky-300 shadow-sm my-2">
          <div className="w-52 h-52">
            <QRCode value={effectiveQrValue} size={208} level="M" />
          </div>
        </div>

        {/* Link de Pago de Mercado Pago */}
        {effectivePaymentLink && (
          <div className="mt-3">
            <a
              href={effectivePaymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir Link de Pago en Mercado Pago
            </a>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={processing}
            onClick={handleConfirmPayment}
            className="w-full py-3 px-4 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {processing ? 'Validando acreditación en Mercado Pago...' : 'Ya pagué: confirmar acreditación'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
