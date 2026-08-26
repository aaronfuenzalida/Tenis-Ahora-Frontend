import React from 'react';
import { Printer, CheckCircle2, QrCode, ShieldCheck, Download, X } from 'lucide-react';
import Modal from './Modal';

import Logo from './Logo';

export default function ReceiptModal({ isOpen, onClose, receipt }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comprobante Oficial de Pago" maxWidth="max-w-xl">
      <div id="printable-area" className="bg-white p-2">
        {/* Header with tennis club branding */}
        <div className="text-center pb-4 border-b border-dashed border-slate-300">
          <div className="flex justify-center mb-1">
            <Logo variant="vertical" theme="light" size="md" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Sistema de Alquiler de Canchas y Complejo Deportivo</p>
          <p className="text-[11px] text-slate-400">CUIT: 30-71889922-4 | Av. San Martín 1420, Bs. As.</p>
          
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Recibo Oficial N°: {receipt.id}
          </div>
        </div>

        {/* Customer & Date Info */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block uppercase font-medium">Cliente / Socio:</span>
            <span className="font-bold text-slate-800 text-sm block">{receipt.clientName}</span>
            <span className="text-slate-600">DNI: {receipt.clientDni}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block uppercase font-medium">Fecha y Hora:</span>
            <span className="font-bold text-slate-800 text-sm block">{receipt.date || new Date().toLocaleString()}</span>
            <span className="text-slate-600">Medio: <strong className="text-tennis-700">{receipt.paymentMethod}</strong></span>
          </div>
        </div>

        {/* Reservation Details */}
        <div className="py-3">
          <div className="text-xs font-bold uppercase text-slate-500 mb-2">Concepto: {receipt.concept}</div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-2 px-2">Descripción del Servicio</th>
                <th className="py-2 px-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipt.items?.map((item, idx) => (
                <tr key={idx} className={item.description.includes('Total') || item.description.includes('50%') ? 'font-semibold text-tennis-900 bg-tennis-50/40' : 'text-slate-700'}>
                  <td className="py-2 px-2">{item.description}</td>
                  <td className="py-2 px-2 text-right">${item.amount?.toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Box */}
        <div className="bg-slate-900 text-white rounded-xl p-4 my-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-300 block uppercase tracking-wider">Total Cobrado</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Pago Validado en Sistema
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            ${receipt.totalPaid?.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
          </div>
        </div>

        {/* QR Code and Validation Footnote */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            {/* SVG QR Code Simulation */}
            <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-300 shadow-sm flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM55 10h10v15H55zM40 40h20v20H40zM70 40h10v20H70zM85 45h15v15H85zM40 70h15v15H40zM60 70h15v30H60zM80 80h20v20H80z" />
              </svg>
            </div>
            <div className="text-[11px] text-slate-500">
              <p className="font-semibold text-slate-700">Comprobante Digital Fiscal con QR</p>
              <p>Escanee para validar la autenticidad con AFIP / Mercado Pago</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Emisor: {receipt.cashierName || 'Recepción'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-end gap-3 no-print border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="px-5 py-2.5 text-sm font-bold text-white bg-tennis-600 hover:bg-tennis-700 rounded-xl shadow-md hover:shadow-glow-green inline-flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4" />
          Imprimir Recibo
        </button>
      </div>
    </Modal>
  );
}
