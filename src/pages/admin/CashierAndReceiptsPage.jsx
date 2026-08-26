import React, { useState, useEffect } from 'react';
import { receiptsService } from '../../services/api';
import { 
  DollarSign, 
  Receipt, 
  Printer, 
  QrCode, 
  Percent, 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  Search, 
  Tag, 
  ShieldCheck 
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';
import Modal from '../../components/common/Modal';

export default function CashierAndReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Register New Charge Modal
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeData, setChargeData] = useState({
    clientName: '',
    clientDni: '',
    concept: 'Inscripción a Torneo de Tenis',
    amount: 7500,
    paymentMethod: 'Mercado Pago (QR)',
    discountApplied: 'NONE'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [rRes, dRes] = await Promise.all([
      receiptsService.getAll(),
      receiptsService.getDiscounts()
    ]);
    setReceipts(rRes.data);
    setDiscounts(dRes.data);
  };

  const handleRegisterCharge = (e) => {
    e.preventDefault();
    const discountObj = discounts.find(d => d.code === chargeData.discountApplied);
    const discountPercent = discountObj ? discountObj.discountPercent : 0;
    const finalAmount = chargeData.amount - (chargeData.amount * (discountPercent / 100));

    const newRec = {
      id: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: chargeData.clientName,
      clientDni: chargeData.clientDni,
      concept: chargeData.concept,
      items: [
        { description: chargeData.concept, amount: chargeData.amount },
        ...(discountObj ? [{ description: `Descuento ${discountObj.name} (${discountPercent}%)`, amount: -(chargeData.amount * (discountPercent / 100)) }] : [])
      ],
      totalPaid: finalAmount,
      paymentMethod: chargeData.paymentMethod,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      cashierName: 'Administración General'
    };

    setReceipts([newRec, ...receipts]);
    setShowChargeModal(false);
    setSelectedReceipt(newRec);
  };

  const filteredReceipts = receipts.filter(r => 
    r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.concept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Caja, Cobros, Descuentos y Recibos Fiscales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Recepción y registro de cobros (alquileres, torneos, clases). Medios de pago: Débito, Crédito, Mercado Pago (QR) y Efectivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Libro de Caja
          </button>
          <button
            type="button"
            onClick={() => setShowChargeModal(true)}
            className="px-4 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-md hover:shadow-glow-green flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar Nuevo Cobro
          </button>
        </div>
      </div>

      {/* Discounts Management Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-tennis-600" />
            <h2 className="text-sm font-extrabold text-slate-900">Políticas de Descuentos Activas en el Club</h2>
          </div>
          <span className="text-xs text-slate-400">Gestionado por Personal Autorizado</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {discounts.map(d => (
            <div key={d.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-800">{d.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-xs">
                  {d.discountPercent}% OFF
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Aplica a: <strong>{d.applicableTo}</strong></p>
              <div className="text-[10px] text-slate-400">Código interno: <code className="font-mono bg-white px-1.5 py-0.5 rounded border">{d.code}</code></div>
            </div>
          ))}
        </div>
      </div>

      {/* Receipts History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-tennis-600" />
            <h2 className="text-base font-extrabold text-slate-900">Registro General de Recibos y Cobros</h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por socio, DNI o N°..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-tennis-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-slate-50/50">
                <th className="py-3 px-3">Recibo N°</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Cliente / DNI</th>
                <th className="py-3 px-3">Concepto Cobrado</th>
                <th className="py-3 px-3">Medio de Pago</th>
                <th className="py-3 px-3 text-right">Monto</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-tennis-800">
                    {rec.id}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {rec.date}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{rec.clientName}</div>
                    <div className="text-[10px] text-slate-400">DNI: {rec.clientDni}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {rec.concept}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-tennis-600" />
                      {rec.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                    ${rec.totalPaid?.toLocaleString('es-AR')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(rec)}
                      className="px-3 py-1.5 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-bold text-xs border border-tennis-200 inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Ver y Imprimir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to register new POS charge */}
      <Modal
        isOpen={showChargeModal}
        onClose={() => setShowChargeModal(false)}
        title="Registrar Nuevo Cobro en Caja"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRegisterCharge} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Nombre del Socio / Cliente *</label>
            <input
              type="text"
              required
              placeholder="Juan Martín del Potro"
              value={chargeData.clientName}
              onChange={(e) => setChargeData({ ...chargeData, clientName: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">DNI *</label>
              <input
                type="text"
                required
                placeholder="30.123.456"
                value={chargeData.clientDni}
                onChange={(e) => setChargeData({ ...chargeData, clientDni: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Monto Base (ARS) *</label>
              <input
                type="number"
                required
                value={chargeData.amount}
                onChange={(e) => setChargeData({ ...chargeData, amount: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Concepto *</label>
            <input
              type="text"
              required
              placeholder="Inscripción Torneo / Alquiler / Clase"
              value={chargeData.concept}
              onChange={(e) => setChargeData({ ...chargeData, concept: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Medio de Pago *</label>
              <select
                value={chargeData.paymentMethod}
                onChange={(e) => setChargeData({ ...chargeData, paymentMethod: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white font-bold"
              >
                <option value="Mercado Pago (QR)">Mercado Pago (QR)</option>
                <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="Efectivo">Efectivo en Caja</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Descuento Club</label>
              <select
                value={chargeData.discountApplied}
                onChange={(e) => setChargeData({ ...chargeData, discountApplied: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white font-bold"
              >
                <option value="NONE">Sin Descuento (0%)</option>
                {discounts.map(d => (
                  <option key={d.id} value={d.code}>{d.name} ({d.discountPercent}%)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowChargeModal(false)}
              className="px-3 py-2 text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl shadow-md"
            >
              Procesar Cobro y Emitir Recibo
            </button>
          </div>
        </form>
      </Modal>

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
