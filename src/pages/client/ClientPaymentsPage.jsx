import React, { useState, useEffect } from 'react';
import { receiptsService, reservationsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Receipt, 
  Printer, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Search, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function ClientPaymentsPage() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    receiptsService.getAll().then(res => setReceipts(res.data));
    reservationsService.getAll().then(res => setReservations(res.data));
  }, []);

  const pendingReservation = reservations.find(r => r.status === 'confirmada' && !r.remainingPaid);

  const filteredReceipts = receipts.filter(r => 
    r.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Mis Pagos, Señas & Recibos Oficiales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historial de transacciones de alquiler de canchas, señas del 50%, torneos y comprobantes digitales con código QR.
          </p>
        </div>
      </div>

      {/* Pending balance banner if any */}
      {pendingReservation && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 rounded-3xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 uppercase">Saldo Pendiente de Turno:</span>
              <div className="font-extrabold text-sm text-slate-900">
                {pendingReservation.courtName} ({pendingReservation.date} {pendingReservation.startTime} hs)
              </div>
              <p className="text-xs text-slate-600">
                Seña del 50% abonada (${pendingReservation.depositPaid?.toLocaleString('es-AR')}). Resta abonar el 50% (${pendingReservation.remainingBalance?.toLocaleString('es-AR')}) al concluir el partido.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full shrink-0">
            A liquidar en cancha
          </span>
        </div>
      )}

      {/* Receipts Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-tennis-600" />
            <h2 className="text-base font-extrabold text-slate-900">Comprobantes Electrónicos Emitidos</h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por concepto o N°..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-tennis-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-slate-50/50">
                <th className="py-3 px-3">N° Comprobante</th>
                <th className="py-3 px-3">Fecha y Hora</th>
                <th className="py-3 px-3">Concepto</th>
                <th className="py-3 px-3">Medio de Pago</th>
                <th className="py-3 px-3 text-right">Monto Cobrado</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-tennis-800">
                    {rec.id}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {rec.date}
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-medium">
                    {rec.concept}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      <CreditCard className="w-3 h-3 text-tennis-600" />
                      {rec.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    ${rec.totalPaid?.toLocaleString('es-AR')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(rec)}
                      className="px-3 py-1.5 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-bold text-xs border border-tennis-200 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Ver Recibo & QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receipt={selectedReceipt}
        />
      )}

    </div>
  );
}
