import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { discountsService, usersService } from '../../services/api';

/**
 * RF138 - RF141: registrar, modificar, consultar y eliminar descuentos de un usuario.
 */
export default function UserDiscountsModal({ isOpen, onClose, user, onSaved }) {
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    discountsService.getAll().then(res => setCatalog(res.data || []));
    setSelected([...(user?.activeDiscounts || [])]);
  }, [isOpen, user]);

  const toggle = (code) => {
    setSelected(prev => (prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    await usersService.updateDiscounts(user.id, selected);
    if (onSaved) onSaved();
    onClose();
  };

  const totalPercent = Math.min(100, selected.reduce((acc, code) => acc + (catalog.find(d => d.code === code)?.discountPercent || 0), 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Descuentos de ${user?.name || ''}`} maxWidth="max-w-md">
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <p className="text-slate-500">Seleccione las políticas de descuento que aplican a este usuario. Se aplican automáticamente en caja.</p>

        <div className="space-y-2">
          {catalog.length === 0 ? (
            <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">No hay descuentos en el catálogo del club.</div>
          ) : (
            catalog.map(d => {
              const checked = selected.includes(d.code);
              return (
                <label
                  key={d.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    checked ? 'bg-tennis-50 border-tennis-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                  } ${d.active === false ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={checked} onChange={() => toggle(d.code)} className="rounded border-slate-300" />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {d.name}
                        {d.active === false && <span className="text-[10px] text-slate-400">(inactivo)</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">{d.applicableTo} • <code className="font-mono">{d.code}</code></div>
                    </div>
                  </div>
                  <span className="text-tennis-800 font-black whitespace-nowrap">{d.discountPercent}%</span>
                </label>
              );
            })
          )}
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <span className="text-slate-600 inline-flex items-center gap-1.5">Beneficio acumulado</span>
          <strong className="text-slate-900 text-sm">{totalPercent}%</strong>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm">Guardar Descuentos</button>
        </div>
      </form>
    </Modal>
  );
}
