import React, { useState, useEffect } from 'react';
import { stockService } from '../../api';
import { Edit3, Trash2, Search } from 'lucide-react';
import Modal from '../../ui/Modal';

export default function StockManagementPage() {
  const [stock, setStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Pelotas',
    description: '',
    totalStock: 10,
    inUseStock: 0,
    unit: 'unidades'
  });

  // Edit Item Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Quick Adjust Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [itemToAdjust, setItemToAdjust] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);

  // Delete Item Modal
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    const res = await stockService.getAll();
    setStock(res.data || []);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    await stockService.create(newItem);
    setShowAddModal(false);
    setNewItem({
      name: '',
      category: 'Pelotas',
      description: '',
      totalStock: 10,
      inUseStock: 0,
      unit: 'unidades'
    });
    loadStock();
  };

  const handleOpenEdit = (item) => {
    setItemToEdit({
      ...item,
      totalStock: item.totalStock,
      inUseStock: item.inUseStock,
      unit: item.unit || 'unidades'
    });
    setShowEditModal(true);
  };

  const handleSaveEditItem = async (e) => {
    e.preventDefault();
    if (!itemToEdit) return;
    await stockService.update(itemToEdit.id, itemToEdit);
    setShowEditModal(false);
    setItemToEdit(null);
    loadStock();
  };

  const handleOpenAdjust = (item) => {
    setItemToAdjust(item);
    setAdjustQuantity(item.totalStock);
    setShowAdjustModal(true);
  };

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    if (!itemToAdjust) return;
    await stockService.updateStock(itemToAdjust.id, Number(adjustQuantity));
    setShowAdjustModal(false);
    setItemToAdjust(null);
    loadStock();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await stockService.delete(itemToDelete.id);
    setItemToDelete(null);
    loadStock();
  };

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(stock.map(s => s.category).filter(Boolean)))];

  const filteredStock = stock.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (categoryFilter === 'ALL') return matchesSearch;
    return matchesSearch && item.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestión de Stock e Inventario
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            Imprimir Inventario
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar material o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-tennis-600"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'Todos los rubros' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div id="printable-area" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        
        {/* Printable Header on paper */}
        <div className="hidden print:block text-center border-b pb-4">
          <h2 className="text-lg font-bold text-slate-900">TENIS AHORA CLUB — PLANILLA DE INVENTARIO Y STOCK</h2>
          <p className="text-xs text-slate-500">Control de Existencias Físicas y Equipamiento</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-3 px-3">Producto / Material</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-center">Stock Total</th>
                <th className="py-3 px-3 text-center">En Uso</th>
                <th className="py-3 px-3 text-center">Disponible</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-right no-print">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No se encontraron productos de stock con el criterio ingresado.
                  </td>
                </tr>
              ) : (
                filteredStock.map(item => {
                  const isOut = item.availableStock <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.description || 'Sin descripción'}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {item.category}
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {item.totalStock} {item.unit}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600">
                        {item.inUseStock} {item.unit}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        <span className={isOut ? 'text-slate-700' : 'text-slate-900'}>
                          {item.availableStock} {item.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-medium">
                        <span className={isOut ? 'text-slate-700' : 'text-slate-600'}>
                          {isOut ? 'Agotado' : 'Disponible'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right no-print">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjust(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                            title="Ajustar cantidad física"
                          >
                            Ajustar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
                            title="Modificar producto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-50 text-slate-700 hover:text-slate-700 text-xs transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Registrar Nuevo Producto en Stock"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre del Producto *</label>
            <input
              type="text"
              required
              placeholder="Pelotas Penn Championship (Tubo x3)"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Categoría *</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 bg-white text-xs"
              >
                <option value="Pelotas">Pelotas</option>
                <option value="Redes">Redes</option>
                <option value="Raquetas">Raquetas</option>
                <option value="Accesorios">Accesorios</option>
                <option value="Equipamiento">Equipamiento</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unidad de Medida *</label>
              <input
                type="text"
                required
                placeholder="unidades, tubos..."
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Stock Total Inicial *</label>
              <input
                type="number"
                min="0"
                required
                value={newItem.totalStock}
                onChange={(e) => setNewItem({ ...newItem, totalStock: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descripción / Detalles</label>
            <textarea
              rows={2}
              placeholder="Especificaciones o proveedor..."
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-tennis-600 hover:bg-tennis-700 text-white font-semibold"
            >
              Guardar Producto
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setItemToEdit(null);
        }}
        title={`Modificar Producto: ${itemToEdit?.name || ''}`}
        maxWidth="max-w-md"
      >
        {itemToEdit && (
          <form onSubmit={handleSaveEditItem} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nombre del Producto *</label>
              <input
                type="text"
                required
                value={itemToEdit.name}
                onChange={(e) => setItemToEdit({ ...itemToEdit, name: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Categoría *</label>
                <select
                  value={itemToEdit.category}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, category: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 bg-white text-xs"
                >
                  <option value="Pelotas">Pelotas</option>
                  <option value="Redes">Redes</option>
                  <option value="Raquetas">Raquetas</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Equipamiento">Equipamiento</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Unidad de Medida *</label>
                <input
                  type="text"
                  required
                  value={itemToEdit.unit}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, unit: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Stock Físico Total *</label>
                <input
                  type="number"
                  min={itemToEdit.inUseStock || 0}
                  required
                  value={itemToEdit.totalStock}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, totalStock: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Descripción</label>
              <textarea
                rows={2}
                value={itemToEdit.description}
                onChange={(e) => setItemToEdit({ ...itemToEdit, description: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setItemToEdit(null);
                }}
                className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-tennis-600 hover:bg-tennis-700 text-white font-semibold"
              >
                Guardar Modificaciones
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Quick Adjust Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false);
          setItemToAdjust(null);
        }}
        title={`Ajuste de Stock: ${itemToAdjust?.name || ''}`}
        maxWidth="max-w-md"
      >
        {itemToAdjust && (
          <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="text-slate-600">Stock actualmente en canchas: <strong>{itemToAdjust.inUseStock} {itemToAdjust.unit}</strong></div>
              <div className="text-slate-600">Stock disponible actual: <strong>{itemToAdjust.availableStock} {itemToAdjust.unit}</strong></div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nuevo Stock Físico Total ({itemToAdjust.unit}) *
              </label>
              <input
                type="number"
                min={itemToAdjust.inUseStock || 0}
                required
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold outline-none focus:border-tennis-600"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                No puede ser menor al stock que está actualmente prestado en canchas ({itemToAdjust.inUseStock}).
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAdjustModal(false);
                  setItemToAdjust(null);
                }}
                className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-tennis-600 hover:bg-tennis-700 text-white font-semibold"
              >
                Actualizar Cantidad
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Confirmar Eliminación de Producto"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            ¿Está seguro de que desea eliminar <strong>{itemToDelete?.name}</strong> del inventario? Esta acción quitará el ítem de la lista de equipamiento.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setItemToDelete(null)}
              className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-semibold"
            >
              Confirmar Eliminación
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
