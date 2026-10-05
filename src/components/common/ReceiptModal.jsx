import React from 'react';
import { Printer, CheckCircle2, QrCode, ShieldCheck, Download, X, Building2 } from 'lucide-react';
import Modal from './Modal';
import Logo from './Logo';

export default function ReceiptModal({ isOpen, onClose, receipt }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comprobante Oficial de Pago (RF045 / RF134)" maxWidth="max-w-xl">
      <div className="space-y-4">
        
        {/* Printable Area */}
        <div id="printable-receipt-area" className="bg-white p-4 rounded-xl text-slate-800 print:p-0">
          
          {/* Header with tennis club branding & fiscal data */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <div className="flex justify-center mb-1">
              <Logo variant="vertical" theme="light" size="md" />
            </div>
            <h2 className="text-sm font-black tracking-wider uppercase text-slate-900 mt-1">
              Club Tenis Ahora — Asociación Civil Deportiva
            </h2>
            <p className="text-[11px] text-slate-500">CUIT: 30-71889922-4 | IVA Exento / Entidad Deportiva Sin Fines de Lucro</p>
            <p className="text-[11px] text-slate-400">Sede Social: Av. San Martín 1420, Quilmes, Buenos Aires | Tel: +54 11 4892-1234</p>
            
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Recibo Oficial de Pago N°: <span className="font-mono">{receipt.id}</span>
            </div>
          </div>

          {/* Customer & Transaction Info */}
          <div className="grid grid-cols-2 gap-4 py-3.5 border-b border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Cliente / Socio Titular:</span>
              <span className="font-extrabold text-slate-900 text-sm block">{receipt.clientName}</span>
              <span className="text-slate-600 font-mono text-[11px]">DNI: <strong>{receipt.clientDni}</strong></span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Fecha y Hora de Emisión:</span>
              <span className="font-bold text-slate-900 block font-mono text-[11px]">{receipt.date || new Date().toLocaleString()}</span>
              <span className="text-slate-600 text-[11px]">Medio de Pago: <strong className="text-tennis-800">{receipt.paymentMethod}</strong></span>
            </div>
          </div>

          {/* Reservation / Service Details */}
          <div className="py-3">
            <div className="text-[11px] font-bold uppercase text-slate-500 mb-2">
              Concepto: <strong className="text-slate-800">{receipt.concept}</strong>
            </div>
            
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase bg-slate-50 text-[10px]">
                  <th className="py-2 px-3 border-r border-slate-200">Detalle del Concepto</th>
                  <th className="py-2 px-3 text-right">Importe (ARS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.items?.map((item, idx) => {
                  const isTotal = item.description.includes('Total');
                  const isDeposit = item.description.includes('50%') || item.description.includes('Seña');
                  const isFree = item.amount === 0 || item.description.includes('incluido');

                  return (
                    <tr 
                      key={idx} 
                      className={
                        isDeposit 
                          ? 'font-extrabold text-tennis-900 bg-tennis-50/50' 
                          : isTotal
                          ? 'font-bold text-slate-800 bg-slate-50/60'
                          : 'text-slate-700'
                      }
                    >
                      <td className="py-2 px-3 border-r border-slate-200">
                        {item.description}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {isFree ? (
                          <span className="text-emerald-700 font-bold">INCLUIDO ($0)</span>
                        ) : (
                          `$${item.amount?.toLocaleString('es-AR')}`
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Paid Box */}
          <div className="bg-slate-900 text-white rounded-xl p-4 my-3 flex items-center justify-between print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
            <div>
              <span className="text-[10px] text-slate-300 print:text-slate-600 block uppercase tracking-wider font-bold">
                Total Percibido en Esta Operación
              </span>
              <span className="text-xs text-emerald-400 print:text-emerald-700 flex items-center gap-1 font-bold mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Pago Acreditado en Sistema
              </span>
            </div>
            <div className="text-2xl font-black text-white print:text-slate-900">
              ${receipt.totalPaid?.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400 print:text-slate-600">ARS</span>
            </div>
          </div>

          {/* QR Code and Validation Footnote */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              {/* QR Code */}
              <div className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-300 shadow-sm flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                  <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM55 10h10v15H55zM40 40h20v20H40zM70 40h10v20H70zM85 45h15v15H85zM40 70h15v15H40zM60 70h15v30H60zM80 80h20v20H80z" />
                </svg>
              </div>
              <div className="text-[11px] text-slate-500">
                <p className="font-bold text-slate-800">Comprobante Fiscal Digital Oficial</p>
                <p>Verificación en línea por Mercado Pago QR y AFIP</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Operador / Cajero: <strong>{receipt.cashierName || 'Recepción General'}</strong>
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="text-right">
              <div className="w-28 border-b border-dashed border-slate-400 h-6 mb-1" />
              <span className="text-[9px] text-slate-400 block uppercase">Firma / Sello Recepción</span>
            </div>
          </div>

        </div>

        {/* Modal Actions (No Print) */}
        <div className="mt-4 flex items-center justify-end gap-2 no-print border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold text-white bg-tennis-600 hover:bg-tennis-700 rounded-xl shadow-md hover:shadow-glow-green inline-flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Comprobante (RF045)
          </button>
        </div>

      </div>
    </Modal>
  );
}
