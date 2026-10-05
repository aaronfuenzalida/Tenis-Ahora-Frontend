import React, { useState, useEffect } from 'react';
import { courtsService } from '../../services/api';
import { 
  Layers, 
  Plus, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Edit3, 
  Clock, 
  Sliders, 
  ShieldAlert,
  Calendar
} from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function CourtsManagementPage() {
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  
  // Add court modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourt, setNewCourt] = useState({
    name: '',
    surfaceType: 'Ladrillo',
    capacity: 4,
    pricePerHour: 4800,
    description: '',
    status: 'disponible'
  });

  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async () => {
    const res = await courtsService.getAll();
    setCourts(res.data);
  };

  const handleToggleMaintenance = async (court) => {
    const nextStatus = court.status === 'mantenimiento' ? 'disponible' : 'mantenimiento';
    await courtsService.updateStatus(court.id, nextStatus, maintenanceNotes || 'Mantenimiento preventivo de superficie');
    setShowMaintModal(false);
    setMaintenanceNotes('');
    loadCourts();
  };

  const handleCreateCourt = async (e) => {
    e.preventDefault();
    const surfaceColors = {
      Ladrillo: { surfaceColor: 'bg-orange-50 text-orange-800 border-orange-200', badgeColor: 'bg-orange-100 text-orange-800' },
      Cemento: { surfaceColor: 'bg-sky-50 text-sky-800 border-sky-200', badgeColor: 'bg-sky-100 text-sky-800' },
      Pasto: { surfaceColor: 'bg-emerald-50 text-emerald-800 border-emerald-200', badgeColor: 'bg-emerald-100 text-emerald-800' }
    };

    const payload = {
      ...newCourt,
      ...surfaceColors[newCourt.surfaceType],
      photo: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80'
    };

    await courtsService.create(payload);
    setShowAddModal(false);
    loadCourts();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestión de Canchas y Tipos de Superficie
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administración de canchas (Ladrillo, Cemento, Pasto), características de superficie, capacidad y bloqueo por mantenimiento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Reporte de Canchas
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-md hover:shadow-glow-green flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva Cancha
          </button>
        </div>
      </div>

      {/* Printable Area Report */}
      <div id="printable-area" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        
        {/* Printable Header only on paper */}
        <div className="hidden print:block text-center border-b pb-4">
          <h2 className="text-xl font-bold text-tennis-900">TENIS AHORA CLUB — REPORTE OFICIAL DE CANCHAS</h2>
          <p className="text-xs text-slate-500">Superficies, Capacidades, Iluminación y Estado Operativo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map(court => {
            const isMaint = court.status === 'mantenimiento';

            return (
              <div
                key={court.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 shadow-sm flex flex-col justify-between ${
                  isMaint ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md ${court.badgeColor}`}>
                      {court.surfaceType}
                    </span>
                    
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isMaint 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isMaint ? <Wrench className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {isMaint ? 'Bloqueada p/ Mantenimiento' : 'Habilitada'}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mt-3">{court.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{court.description}</p>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Capacidad:</span>
                      <span className="font-bold text-slate-800">{court.capacity} Jugadores ({court.capacity === 4 ? 'Dobles' : 'Singles'})</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Tarifa por Hora:</span>
                      <span className="font-black text-tennis-700 text-sm">${court.pricePerHour?.toLocaleString('es-AR')} ARS</span>
                    </div>
                  </div>

                  {isMaint && court.maintenanceNotes && (
                    <div className="mt-3 p-2.5 bg-amber-100/70 text-amber-900 rounded-xl text-xs flex items-start gap-1.5">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <span><strong>Detalle Mantenimiento:</strong> {court.maintenanceNotes}</span>
                    </div>
                  )}
                </div>

                {/* Maintenance Toggle Action (No-print) */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between no-print">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourt(court);
                      setMaintenanceNotes(court.maintenanceNotes || '');
                      setShowMaintModal(true);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isMaint 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    {isMaint ? 'Desbloquear y Habilitar Cancha' : 'Bloquear por Mantenimiento'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maintenance Modal */}
      <Modal
        isOpen={showMaintModal}
        onClose={() => setShowMaintModal(false)}
        title={`Control de Mantenimiento: ${selectedCourt?.name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Al bloquear una cancha por mantenimiento, el sistema <strong>impedirá automáticamente cualquier reserva</strong> en los horarios afectados.
          </p>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">
              Motivo o Tareas a Realizar:
            </label>
            <textarea
              rows={3}
              placeholder="Ej: Nivelación de polvo de ladrillo, tensado de red y calibrado de luminarias..."
              value={maintenanceNotes}
              onChange={(e) => setMaintenanceNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowMaintModal(false)}
              className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleToggleMaintenance(selectedCourt)}
              className="px-4 py-2 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold"
            >
              Guardar Estado
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Court Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Registrar Nueva Cancha de Tenis"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateCourt} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Nombre / Número de Cancha *</label>
            <input
              type="text"
              required
              placeholder="Cancha 6 - Juan Ignacio Chela"
              value={newCourt.name}
              onChange={(e) => setNewCourt({ ...newCourt, name: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Tipo de Superficie *</label>
              <select
                value={newCourt.surfaceType}
                onChange={(e) => setNewCourt({ ...newCourt, surfaceType: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Ladrillo">Polvo de Ladrillo (Clay)</option>
                <option value="Cemento">Cemento (Hard Court)</option>
                <option value="Pasto">Césped / Pasto (Grass)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Capacidad *</label>
              <select
                value={newCourt.capacity}
                onChange={(e) => setNewCourt({ ...newCourt, capacity: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value={2}>2 Jugadores (Singles)</option>
                <option value={4}>4 Jugadores (Dobles / Singles)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Precio por Hora (ARS) *</label>
              <input
                type="number"
                required
                value={newCourt.pricePerHour}
                onChange={(e) => setNewCourt({ ...newCourt, pricePerHour: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Descripción / Características</label>
            <input
              type="text"
              placeholder="Superficie rápida homologada..."
              value={newCourt.description}
              onChange={(e) => setNewCourt({ ...newCourt, description: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold"
            >
              Crear Cancha
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
