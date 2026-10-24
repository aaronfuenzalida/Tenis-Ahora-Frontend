import React, { useMemo, useState } from 'react';
import Modal from './Modal';
import QRCode, { qrPayloads } from './QRCode';

/**
 * Cobro con billetera virtual: muestra un QR real con el importe y el concepto.
 * El pago se acredita al confirmar (la pasarela real no forma parte de este sistema).
 */
export default function QRModal({ isOpen, onClose, amount, concept, reference, onPaymentSuccess }) {
  const [processing, setProcessing] = useState(false);

  const payload = useMemo(
    () => qrPayloads.payment({ concept, amount, reference }),
    [concept, amount, reference]
  );

  const handleConfirmPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess();
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pago con Billetera Virtual (QR)" maxWidth="max-w-md">
      <div className="text-center">
        <h4 className="text-lg font-bold text-slate-800">Escaneá el código con tu app</h4>
        <p className="text-xs text-slate-500 mt-1">
          Acepta Mercado Pago, Cuenta DNI, BNA+, MODO y cualquier billetera interoperable.
        </p>

        {/* Concepto e importe */}
        <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
          <div className="text-xs text-slate-500">Concepto a cobrar:</div>
          <div className="font-semibold text-sm text-slate-800">{concept || 'Pago Club Tenis Ahora'}</div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-xs font-bold text-slate-600">Importe a pagar:</span>
            <span className="text-xl font-extrabold text-tennis-700">${Number(amount || 0).toLocaleString('es-AR')} ARS</span>
          </div>
        </div>

        {/* QR real */}
        <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-sm my-2">
          <div className="w-52 h-52">
            <QRCode value={payload} size={208} level="M" />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 break-all px-4">{payload}</p>

        <div className="mt-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={processing}
            onClick={handleConfirmPayment}
            className="w-full py-3 px-4 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {processing ? 'Validando acreditación...' : 'Ya pagué: confirmar acreditación'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
