import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Users, 
  Printer, 
  Download, 
  TrendingUp, 
  Layers, 
  Package, 
  CheckCircle2, 
  Filter 
} from 'lucide-react';
import { courtsService, reservationsService, stockService, coachesAndClassesService } from '../../services/api';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('ingresos'); // ingresos, asistencia, reservas, canchas
  const [courts, setCourts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [stock, setStock] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    Promise.all([
      courtsService.getAll(),
      reservationsService.getAll(),
      stockService.getAll(),
      coachesAndClassesService.getClasses()
    ]).then(([cRes, rRes, sRes, clRes]) => {
      setCourts(cRes.data);
      setReservations(rRes.data);
      setStock(sRes.data);
      setClasses(clRes.data);
    });
  }, []);

  const totalRevenue = reservations.reduce((acc, r) => acc + (r.depositPaid || 0) + (r.remainingPaid ? r.remainingBalance : 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Generador de Reportes y Estadísticas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reportes oficiales del club: <strong>Ingresos financieros, Asistencias, Reservas y Tipos de Canchas</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-md hover:shadow-glow-green flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4" />
          Imprimir Reporte Activo
        </button>
      </div>

      {/* Tabs Selector (No-print) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
        {[
          { id: 'ingresos', label: '1. Reporte de Ingresos', icon: DollarSign },
          { id: 'asistencia', label: '2. Reporte de Asistencia', icon: Users },
          { id: 'reservas', label: '3. Reporte de Reservas y Ocupación', icon: Calendar },
          { id: 'canchas', label: '4. Reporte de Canchas y Superficies', icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-tennis-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Printable Report Document */}
      <div id="printable-area" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        
        {/* Printable Official Header */}
        <div className="text-center border-b border-dashed border-slate-300 pb-4">
          <h2 className="text-xl font-black text-tennis-900 uppercase">CLUB TENIS AHORA</h2>
          <p className="text-xs text-slate-500">Informe Oficial Emitido para Dirección y Auditoría</p>
          <p className="text-[10px] text-slate-400">Fecha de emisión: {new Date().toLocaleString()}</p>
        </div>

        {/* TAB 1: Reporte de Ingresos */}
        {activeTab === 'ingresos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Reporte de Recaudación Financiera</h3>
              <span className="text-xs font-black text-tennis-700 bg-tennis-50 px-3 py-1 rounded-full border border-tennis-200">
                Total Recaudado: ${totalRevenue.toLocaleString('es-AR')} ARS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Alquiler de Canchas (50% Señas):</span>
                <div className="text-lg font-black text-slate-800 mt-1">$19.500 ARS</div>
                <span className="text-[11px] text-emerald-600 font-semibold">100% Cobranza bancarizada</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Liquidación Final en Cancha:</span>
                <div className="text-lg font-black text-slate-800 mt-1">$7.300 ARS</div>
                <span className="text-[11px] text-slate-500 font-semibold">Pendiente a liquidar: $12.200</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cuotas Clases y Torneos:</span>
                <div className="text-lg font-black text-slate-800 mt-1">$90.000 ARS</div>
                <span className="text-[11px] text-tennis-700 font-semibold">12 Socios inscriptos</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                  <th className="py-2.5 px-3">Concepto</th>
                  <th className="py-2.5 px-3">Cliente / DNI</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Medio de Pago</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map(r => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{r.courtName}</td>
                    <td className="py-2.5 px-3">{r.participants[0]?.name} ({r.participants[0]?.dni})</td>
                    <td className="py-2.5 px-3">{r.date}</td>
                    <td className="py-2.5 px-3">{r.depositPaymentMethod}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">${r.depositPaid?.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Reporte de Asistencia */}
        {activeTab === 'asistencia' && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900">Reporte de Asistencia a Clases y Entrenamientos</h3>
            
            <div className="space-y-4">
              {classes.map(cls => (
                <div key={cls.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{cls.name}</h4>
                      <p className="text-xs text-slate-500">Profesor: {cls.coachName} • Cancha: {cls.courtAssigned}</p>
                    </div>
                    <span className="text-xs font-bold text-tennis-700 bg-white px-3 py-1 rounded-full border">
                      {cls.currentEnrolled} Alumnos Registrados
                    </span>
                  </div>

                  <table className="w-full text-left text-xs bg-white rounded-xl overflow-hidden border">
                    <thead>
                      <tr className="bg-slate-100/70 text-slate-500 font-bold border-b">
                        <th className="py-2 px-3">Alumno</th>
                        <th className="py-2 px-3">DNI</th>
                        <th className="py-2 px-3 text-center">Clases Dictadas</th>
                        <th className="py-2 px-3 text-right">Tasa de Asistencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cls.students.map(st => {
                        const total = st.attendance.length;
                        const present = st.attendance.filter(a => a === 'P').length;
                        const percent = total > 0 ? Math.round((present / total) * 100) : 100;

                        return (
                          <tr key={st.id}>
                            <td className="py-2 px-3 font-semibold text-slate-800">{st.name}</td>
                            <td className="py-2 px-3 text-slate-500">{st.dni}</td>
                            <td className="py-2 px-3 text-center">{present} / {total} Clases</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">{percent}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Reporte de Reservas & Ocupación */}
        {activeTab === 'reservas' && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900">Reporte de Reservas y Ocupación por Cancha</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl">
                <span className="text-xs font-bold text-orange-900 uppercase">Polvo de Ladrillo (Canchas 1 y 2)</span>
                <div className="text-xl font-black text-slate-900 mt-1">82% Ocupación</div>
                <span className="text-[11px] text-slate-600">Superficie más solicitada</span>
              </div>

              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl">
                <span className="text-xs font-bold text-sky-900 uppercase">Cemento / Hard Court (Canchas 3 y 4)</span>
                <div className="text-xl font-black text-slate-900 mt-1">65% Ocupación</div>
                <span className="text-[11px] text-slate-600">Torneo Apertura en juego</span>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <span className="text-xs font-bold text-emerald-900 uppercase">Césped / Pasto (Cancha 5)</span>
                <div className="text-xl font-black text-slate-900 mt-1">74% Ocupación</div>
                <span className="text-[11px] text-slate-600">Cancha premium</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                  <th className="py-2.5 px-3">Reserva N°</th>
                  <th className="py-2.5 px-3">Cancha</th>
                  <th className="py-2.5 px-3">Fecha y Turno</th>
                  <th className="py-2.5 px-3">Modalidad</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map(r => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-3 font-bold text-tennis-800">{r.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{r.courtName}</td>
                    <td className="py-2.5 px-3">{r.date} ({r.startTime} a {r.endTime} hs)</td>
                    <td className="py-2.5 px-3 capitalize">{r.playersType}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: Reporte de Canchas y Superficies */}
        {activeTab === 'canchas' && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900">Reporte de Tipos de Canchas y Características</h3>
            
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                  <th className="py-2.5 px-3">Cancha</th>
                  <th className="py-2.5 px-3">Tipo de Superficie</th>
                  <th className="py-2.5 px-3">Capacidad</th>
                  <th className="py-2.5 px-3">Precio / Hora</th>
                  <th className="py-2.5 px-3 text-center">Estado Operativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courts.map(c => (
                  <tr key={c.id}>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.badgeColor}`}>
                        {c.surfaceType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{c.capacity} Jugadores ({c.capacity === 4 ? 'Dobles' : 'Singles'})</td>
                    <td className="py-2.5 px-3 font-bold text-tennis-700">${c.pricePerHour?.toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'disponible' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
