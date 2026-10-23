import React, { useState } from 'react';
import Modal from './Modal';

export default function QRModal({ isOpen, onClose, amount, concept, onPaymentSuccess }) {
  const [processing, setProcessing] = useState(false);

  const handleSimulateAppPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess();
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cobro con Billetera Virtual (QR Mercado Pago)" maxWidth="max-w-md">
      <div className="text-center">
        
        <h4 className="text-lg font-bold text-slate-800">Escaneá el código con tu App</h4>
        <p className="text-xs text-slate-500 mt-1">
          Acepta Mercado Pago, Cuenta DNI, BNA+, MODO y cualquier billetera interoperable.
        </p>

        {/* Concept & Amount */}
        <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
          <div className="text-xs text-slate-500">Concepto a cobrar:</div>
          <div className="font-semibold text-sm text-slate-800">{concept || 'Seña 50% Cancha de Tenis'}</div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-xs font-bold text-slate-600">Importe a Pagar:</span>
            <span className="text-xl font-extrabold text-tennis-700">${amount?.toLocaleString('es-AR')} ARS</span>
          </div>
        </div>

        {/* QR Simulation Box */}
        <div className="relative inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-sm my-2">
          <div className="w-48 h-48 bg-slate-900 rounded-xl p-3 flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
              <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 0h20v10H40zM35 15h10v10H35zM40 30h30v10H40zM40 45h20v20H40zM70 45h10v20H70zM85 45h15v15H85zM40 70h15v15H40zM60 70h15v30H60zM80 80h20v20H80z" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 bg-white rounded-lg p-1 shadow-md flex items-center justify-center">
                <span className="font-black text-slate-600 text-xs">MP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation button */}
        <div className="mt-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={processing}
            onClick={handleSimulateAppPayment}
            className="w-full py-3 px-4 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {processing ? 'Validando pago bancario...' : 'Simular Pago Acreditado (Demo)'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
