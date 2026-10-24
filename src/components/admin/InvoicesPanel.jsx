import React, { useEffect, useState } from 'react';
import { Search, Trash2, Ban } from 'lucide-react';
import Modal from '../common/Modal';
import { invoicesService, receiptsService } from '../../services/api';
import { useFeedback } from '../../context/FeedbackContext';

const PAYMENT_METHODS = ['Tarjeta de Débito', 'Tarjeta de Crédito', 'Billetera Virtual (Mercado Pago / MODO / Cuenta DNI)'];

const EMPTY_FORM = {
  type: 'B',
  clientName: '',
  clientDni: '',
  clientAddress: '',
  concept: '',
  paymentMethod: 'Tarjeta de Débito',
  taxRate: 21,
  relatedReceiptId: '',
  items: [{ description: '', quantity: 1, unitPrice: 0 }]
};

const money = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

/**
 * RF125 - RF127: registro, consulta e impresión de facturas.
 */
export default function InvoicesPanel() {
  const { notify, confirm } = useFeedback();
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [iRes, rRes] = await Promise.all([invoicesService.getAll(), receiptsService.getAll()]);
    setInvoices(iRes.data || []);
    setReceipts(rRes.data || []);
  };

  const subtotal = form.items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const tax = Math.round(subtotal * (Number(form.taxRate) / 100));

  const updateItem = (idx, patch) => {
    setForm(prev => ({ ...prev, items: prev.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));
  };

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }] }));
  const removeItem = (idx) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const fillFromReceipt = (receiptId) => {
    const rec = receipts.find(r => r.id === receiptId);
    if (!rec) {
      setForm(prev => ({ ...prev, relatedReceiptId: receiptId }));
      return;
    }
    setForm(prev => ({
      ...prev,
      relatedReceiptId: receiptId,
      clientName: rec.clientName || prev.clientName,
      clientDni: rec.clientDni || prev.clientDni,
      concept: rec.concept || prev.concept,
      paymentMethod: PAYMENT_METHODS.includes(rec.paymentMethod) ? rec.paymentMethod : prev.paymentMethod,
      items: [{ description: rec.concept || 'Servicio', quantity: 1, unitPrice: Number(rec.totalPaid) || 0 }]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0 || form.items.some(it => !it.description.trim())) {
      notify({ variant: 'warning', message: 'Cada ítem de la factura debe tener una descripción.' });
      return;
    }
    if (subtotal <= 0) {
      notify({ variant: 'warning', message: 'El importe de la factura debe ser mayor a cero.' });
      return;
    }
    const res = await invoicesService.create({ ...form, relatedReceiptId: form.relatedReceiptId || null });
    setShowForm(false);
    setForm(EMPTY_FORM);
    await load();
    setSelected(res.data);
  };

  const handleAnnul = async (inv) => {
    if (await confirm({ title: 'Anular factura', message: `¿Anular la factura ${inv.id}? La operación queda registrada como anulada.`, confirmLabel: 'Anular', danger: true })) {
      await invoicesService.annul(inv.id);
      await load();
    }
  };

  const filtered = invoices.filter(i => {
    const q = search.toLowerCase();
    return !q || [i.id, i.clientName, i.clientDni, i.concept, i.paymentMethod].some(v => String(v || '').toLowerCase().includes(q));
  });

  const totalIssued = filtered.filter(i => i.status !== 'anulada').reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">Facturación</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar factura, cliente, DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-tennis-600"
            />
          </div>
          <button
            type="button"
            onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}
            className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            Nueva Factura
          </button>
        </div>
      </div>

      <div id={selected ? undefined : 'printable-area'} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden print:block text-center border-b p-4">
          <h2 className="text-lg font-bold text-slate-900">TENIS AHORA — REPORTE DE FACTURAS EMITIDAS</h2>
          <p className="text-xs text-slate-500">Libro de ventas • Emitido: {new Date().toLocaleString('es-AR')}</p>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="p-3">N° Factura</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Concepto</th>
              <th className="p-3">Medio de Pago</th>
              <th className="p-3 text-right">Neto</th>
              <th className="p-3 text-right">IVA</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-right no-print">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400">No se registran facturas.</td>
              </tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.id} className={`hover:bg-slate-50/60 ${inv.status === 'anulada' ? 'opacity-60' : ''}`}>
                  <td className="p-3 font-mono font-bold text-tennis-800">{inv.id}</td>
                  <td className="p-3 text-slate-600">{inv.date}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{inv.clientName}</div>
                    <div className="text-[11px] text-slate-500">DNI {inv.clientDni}</div>
                  </td>
                  <td className="p-3 text-slate-700 max-w-xs truncate">{inv.concept}</td>
                  <td className="p-3 text-slate-600">{inv.paymentMethod}</td>
                  <td className="p-3 text-right text-slate-700">{money(inv.subtotal)}</td>
                  <td className="p-3 text-right text-slate-500">{money(inv.taxAmount)}</td>
                  <td className="p-3 text-right font-bold text-slate-900">{money(inv.total)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold ${inv.status === 'anulada' ? 'text-slate-700' : 'text-tennis-800'}`}>
                      {inv.status === 'anulada' ? 'Anulada' : 'Emitida'}
                    </span>
                  </td>
                  <td className="p-3 text-right no-print">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => setSelected(inv)} className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-800 text-[11px] font-bold inline-flex items-center gap-1" title="Ver / Imprimir factura">
                        Ver
                      </button>
                      {inv.status !== 'anulada' && (
                        <button type="button" onClick={() => handleAnnul(inv)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-50 text-slate-700 hover:text-slate-600" title="Anular factura">
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
              <td colSpan={7} className="p-3 text-right">Total facturado vigente</td>
              <td className="p-3 text-right">{money(totalIssued)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Create Invoice */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Registrar Nueva Factura" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tipo *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
                <option value="A">Factura A</option>
                <option value="B">Factura B</option>
                <option value="C">Factura C</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Recibo asociado</label>
              <select value={form.relatedReceiptId} onChange={(e) => fillFromReceipt(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
                <option value="">Sin recibo asociado</option>
                {receipts.map(r => (
                  <option key={r.id} value={r.id}>{r.id} — {r.clientName} — {money(r.totalPaid)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Cliente *</label>
              <input type="text" required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">DNI / CUIT *</label>
              <input type="text" required value={form.clientDni} onChange={(e) => setForm({ ...form, clientDni: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Domicilio</label>
            <input type="text" value={form.clientAddress} onChange={(e) => setForm({ ...form, clientAddress: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Concepto General *</label>
            <input type="text" required placeholder="Alquiler de cancha / Inscripción / Cuota mensual" value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">Ítems Facturados *</label>
              <button type="button" onClick={addItem} className="text-tennis-700 font-bold inline-flex items-center gap-1 hover:underline">
                Agregar ítem
              </button>
            </div>
            {form.items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <input type="text" placeholder="Descripción" value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} className="col-span-6 p-2 rounded-lg border border-slate-200 outline-none focus:border-tennis-600" />
                <input type="number" min="1" placeholder="Cant." value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="col-span-2 p-2 rounded-lg border border-slate-200 outline-none focus:border-tennis-600" />
                <input type="number" min="0" placeholder="Precio unit." value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })} className="col-span-3 p-2 rounded-lg border border-slate-200 outline-none focus:border-tennis-600" />
                <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length === 1} className="col-span-1 p-2 rounded-lg bg-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-600 disabled:opacity-40 flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Medio de Pago *</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Alícuota IVA</label>
              <select value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
                <option value={21}>21%</option>
                <option value={10.5}>10,5%</option>
                <option value={0}>Exento (0%)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-3 text-center">
            <div><span className="block text-[10px] uppercase text-slate-400 font-bold">Neto</span><span className="font-bold text-slate-800">{money(subtotal)}</span></div>
            <div><span className="block text-[10px] uppercase text-slate-400 font-bold">IVA</span><span className="font-bold text-slate-800">{money(tax)}</span></div>
            <div><span className="block text-[10px] uppercase text-slate-400 font-bold">Total</span><span className="font-black text-tennis-800 text-sm">{money(subtotal + tax)}</span></div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm">Emitir Factura</button>
          </div>
        </form>
      </Modal>

      {/* Invoice detail / print */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Factura ${selected?.id || ''}`} maxWidth="max-w-xl">
        {selected && (
          <div className="space-y-4 text-xs">
            <div id="printable-receipt-area" className="border border-slate-300 rounded-xl p-5 space-y-4 bg-white">
              <div className="flex items-start justify-between border-b border-dashed border-slate-300 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">CLUB TENIS AHORA</h3>
                  <p className="text-[11px] text-slate-500">Sede Central • CUIT 30-00000000-0 • IVA Responsable Inscripto</p>
                </div>
                <div className="text-right">
                  <div className="inline-block border-2 border-slate-900 px-2 py-0.5 font-black text-base">{selected.type}</div>
                  <div className="font-mono font-bold text-slate-900 mt-1">{selected.id}</div>
                  <div className="text-[11px] text-slate-500">{selected.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-400 block">Cliente</span><strong className="text-slate-900">{selected.clientName}</strong></div>
                <div><span className="text-slate-400 block">DNI / CUIT</span><strong className="text-slate-900">{selected.clientDni}</strong></div>
                <div><span className="text-slate-400 block">Domicilio</span><span className="text-slate-800">{selected.clientAddress || '-'}</span></div>
                <div><span className="text-slate-400 block">Medio de Pago</span><span className="text-slate-800">{selected.paymentMethod}</span></div>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500">
                    <th className="py-1.5">Descripción</th>
                    <th className="py-1.5 text-center">Cant.</th>
                    <th className="py-1.5 text-right">P. Unit.</th>
                    <th className="py-1.5 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((it, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-800">{it.description}</td>
                      <td className="py-1.5 text-center">{it.quantity}</td>
                      <td className="py-1.5 text-right">{money(it.unitPrice)}</td>
                      <td className="py-1.5 text-right font-semibold">{money(it.quantity * it.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-56 space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Neto</span><span>{money(selected.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">IVA {selected.taxRate}%</span><span>{money(selected.taxAmount)}</span></div>
                  <div className="flex justify-between border-t border-slate-300 pt-1 font-black text-sm text-slate-900"><span>TOTAL</span><span>{money(selected.total)}</span></div>
                </div>
              </div>

              {selected.status === 'anulada' && (
                <div className="text-center font-black text-slate-600 border-2 border-slate-500 rounded-lg py-1 tracking-widest">FACTURA ANULADA</div>
              )}
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Emitida por: {selected.issuedBy}</span>
                {selected.relatedReceiptId && <span>Recibo asociado: {selected.relatedReceiptId}</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2 no-print">
              <button type="button" onClick={() => setSelected(null)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cerrar</button>
              <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm inline-flex items-center gap-1.5">
                Imprimir Factura
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
