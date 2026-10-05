import React, { useState, useEffect } from 'react';
import { stockService } from '../../services/api';
import { Package, AlertTriangle, CheckCircle2, Plus, Edit, RefreshCw, Layers, ShieldCheck, Printer } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function StockManagementPage() {
  const [stock, setStock] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newTotalStock, setNewTotalStock] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    const res = await stockService.getAll();
    setStock(res.data);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    await stockService.updateStock(selectedItem.id, Number(newTotalStock));
    setShowEditModal(false);
    loadStock();
    alert('¡Stock actualizado correctamente!');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Control de Stock y Equipamiento de Canchas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestión en tiempo real de los 3 ítems oficiales (RD05): <strong>Redes de tenis, Pelotas de tenis y Raquetas</strong>. Sin costo extra para reservas (RD06).
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors no-print"
        >
          <Printer className="w-3.5 h-3.5" />
          Imprimir Planilla de Stock
        </button>
      </div>

      {/* Stock Rule Banner */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Reglas de Negocio de Stock (RD05, RD06, RD07, RD08):</strong>
          El stock cuenta únicamente con tres tipos de ítems: redes, pelotas y raquetas. No tienen costo extra. Si no hay stock disponible, la cancha no puede reservarse (RD07). Al concluir el alquiler se devuelven al inventario (RD08).
        </div>
      </div>

      {/* Stock Cards Grid (3 Items) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stock.map(item => {
          const isLow = item.status === 'alerta_baja';

          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between space-y-4 ${
                isLow ? 'border-amber-300 ring-2 ring-amber-500/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {item.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isLow ? 'bg-amber-100 text-amber-800 flex items-center gap-1' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isLow && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                    {isLow ? 'Stock Bajo' : 'Normal'}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 mt-2">{item.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>

                {/* Big numbers */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Disponible</span>
                    <span className="text-xl font-black text-tennis-700">{item.availableStock}</span>
                    <span className="text-[10px] text-slate-400"> {item.unit}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">En Canchas</span>
                    <span className="text-xl font-black text-amber-600">{item.inUseStock}</span>
                    <span className="text-[10px] text-slate-400"> {item.unit}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isLow ? 'bg-amber-500' : 'bg-tennis-600'}`}
                      style={{ width: `${Math.min(100, (item.availableStock / item.totalStock) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Mínimo seguro: {item.minAlertThreshold}</span>
                    <span>Total: {item.totalStock} {item.unit}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(item);
                  setNewTotalStock(item.totalStock);
                  setShowEditModal(true);
                }}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-tennis-50 text-slate-700 hover:text-tennis-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors no-print"
              >
                <Edit className="w-3.5 h-3.5" />
                Ajustar / Reponer Stock
              </button>
            </div>
          );
        })}
      </div>

      {/* Edit/Restock Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Ajuste de Stock: ${selectedItem?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateStock} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-slate-500">Stock actualmente en uso en canchas: <strong>{selectedItem?.inUseStock} {selectedItem?.unit}</strong></div>
            <div className="text-slate-500">Stock disponible actual: <strong>{selectedItem?.availableStock} {selectedItem?.unit}</strong></div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">
              Nuevo Stock Físico Total ({selectedItem?.unit}) *
            </label>
            <input
              type="number"
              min={selectedItem?.inUseStock || 0}
              required
              value={newTotalStock}
              onChange={(e) => setNewTotalStock(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-tennis-600"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              No puede ser menor al stock que está actualmente prestado en canchas ({selectedItem?.inUseStock}).
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-3 py-2 text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl"
            >
              Guardar Cambios de Inventario
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
