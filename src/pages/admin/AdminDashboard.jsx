import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courtsService, reservationsService, stockService, tournamentsService } from '../../services/api';
import { 
  DollarSign, 
  Layers, 
  Calendar, 
  Package, 
  Trophy, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function AdminDashboard() {
  const [courts, setCourts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [stock, setStock] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    courtsService.getAll().then(res => setCourts(res.data));
    reservationsService.getAll().then(res => setReservations(res.data));
    stockService.getAll().then(res => setStock(res.data));
    tournamentsService.getAll().then(res => setTournaments(res.data));
  }, []);

  const totalDailyRevenue = reservations.reduce((acc, r) => acc + (r.depositPaid || 0) + (r.remainingPaid ? r.remainingBalance : 0), 0);
  const activeCourtsCount = courts.filter(c => c.status === 'disponible').length;
  const lowStockAlerts = stock.filter(s => s.status === 'alerta_baja');

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Mosaic Dashboard Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Panel de Control General
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoreo en tiempo real de canchas, turnos, stock de materiales, torneos y caja del club.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/reservas"
            className="px-4 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-md hover:shadow-glow-green transition-all flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Gestionar Reservas
          </Link>
          <Link
            to="/admin/reportes"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Reportes
          </Link>
        </div>
      </div>

      {/* Low Stock Alert if any */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Alerta de Stock Crítico:</strong> {lowStockAlerts.map(s => s.name).join(', ')} por debajo del nivel mínimo.
            </span>
          </div>
          <Link
            to="/admin/stock"
            className="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg text-xs hover:bg-amber-700 shrink-0"
          >
            Reponer Stock
          </Link>
        </div>
      )}

      {/* KPI Metrics Cards Grid (Mosaic 4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Recaudación */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ingresos del Día</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ${totalDailyRevenue.toLocaleString('es-AR')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs semana anterior
          </div>
        </div>

        {/* Canchas Activas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Canchas Habilitadas</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {activeCourtsCount} <span className="text-sm font-semibold text-slate-400">/ {courts.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            1 en mantenimiento (Cancha 4 Cemento)
          </div>
        </div>

        {/* Reservas Hoy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reservas Activas</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {reservations.length}
          </div>
          <div className="text-[11px] text-tennis-700 font-semibold mt-1">
            100% con seña del 50% validada
          </div>
        </div>

        {/* Torneos en curso */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Torneos y Fixtures</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {tournaments.length}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            Abierto Primavera en Semifinales
          </div>
        </div>

      </div>

      {/* Courts Status Grid (Mosaic Court Cards) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Estado de Canchas y Disponibilidad</h2>
            <p className="text-xs text-slate-500">Ladrillo, Cemento y Pasto con control de mantenimiento</p>
          </div>
          <Link to="/admin/canchas" className="text-xs font-bold text-tennis-700 hover:underline flex items-center gap-1">
            Administrar Canchas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {courts.map(court => {
            const isMaint = court.status === 'mantenimiento';

            return (
              <div 
                key={court.id} 
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                  isMaint 
                    ? 'bg-amber-50/60 border-amber-200' 
                    : 'bg-slate-50 border-slate-200 hover:border-tennis-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${court.badgeColor}`}>
                      {court.surfaceType}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isMaint ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                  <h3 className="font-extrabold text-xs text-slate-900 mt-2">{court.name.split('-')[0]}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{court.name.split('-')[1]}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-[11px] flex items-center justify-between">
                  <span className="text-slate-400">Cap: {court.capacity}p • {court.lighting ? 'LED' : 'Nat'}</span>
                  <span className="font-bold text-slate-800">${court.pricePerHour}/h</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Recent Bookings & Equipment Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Reservations Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Reservas Recientes y Liquidación</h2>
              <p className="text-xs text-slate-500">Control de seña del 50% y cobro de saldo final</p>
            </div>
            <Link to="/admin/reservas" className="text-xs font-bold text-tennis-700 hover:underline">
              Ver todas
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-slate-50/50">
                  <th className="py-2.5 px-3">Cancha / Turno</th>
                  <th className="py-2.5 px-3">Titular y Jugadores</th>
                  <th className="py-2.5 px-3">Seña 50%</th>
                  <th className="py-2.5 px-3">Saldo 50%</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{res.courtName.split('-')[0]}</div>
                      <div className="text-[11px] text-slate-400">{res.date} • {res.startTime}-{res.endTime}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{res.participants[0]?.name}</div>
                      <div className="text-[11px] text-slate-400">{res.playersType === 'dobles' ? '4 Jugadores (Dobles)' : '2 Jugadores (Singles)'}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-emerald-700">${res.depositPaid?.toLocaleString('es-AR')}</span>
                      <div className="text-[10px] text-slate-400">{res.depositPaymentMethod}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${res.remainingPaid ? 'text-slate-400 line-through' : 'text-amber-600'}`}>
                        ${res.remainingBalance?.toLocaleString('es-AR')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        res.status === 'finalizada' 
                          ? 'bg-slate-100 text-slate-700' 
                          : res.status === 'cancelada'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {res.status === 'finalizada' ? 'Finalizada' : res.status === 'cancelada' ? 'Cancelada' : 'Confirmada'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt({
                          id: res.depositReceiptNumber,
                          clientName: res.participants[0]?.name,
                          clientDni: res.participants[0]?.dni,
                          concept: `Reserva - ${res.courtName}`,
                          items: [
                            { description: `Alquiler Cancha ${res.courtName}`, amount: res.courtCost },
                            { description: `Equipamiento asignado`, amount: res.equipmentCost },
                            { description: `Seña 50% Abonada`, amount: res.depositPaid }
                          ],
                          totalPaid: res.depositPaid,
                          paymentMethod: res.depositPaymentMethod,
                          date: res.date
                        })}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-700 text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Equipment & Stock Summary (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Stock de Equipamiento</h2>
            <Link to="/admin/stock" className="text-xs font-bold text-tennis-700 hover:underline">
              Gestionar
            </Link>
          </div>

          <div className="space-y-3">
            {stock.map(item => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    item.status === 'alerta_baja' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.availableStock} Disp.
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.status === 'alerta_baja' ? 'bg-amber-500' : 'bg-tennis-600'}`}
                    style={{ width: `${Math.min(100, (item.availableStock / item.totalStock) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>En uso en canchas: {item.inUseStock}</span>
                  <span>Total stock: {item.totalStock} {item.unit}</span>
                </div>
              </div>
            ))}
          </div>
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
