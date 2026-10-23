import React, { useState, useEffect, useMemo } from 'react';
import { courtsService, reservationsService, stockService, coachesAndClassesService } from '../../services/api';

// Date filter options
const DATE_FILTERS = [
  { id: 'semana', label: 'Semana Actual', rangeText: '29 Sep - 05 Oct 2026' },
  { id: 'mes', label: 'Mes Actual', rangeText: 'Octubre 2026' },
  { id: 'año', label: 'Año 2026', rangeText: 'Enero - Diciembre 2026' },
  { id: 'todo', label: 'Todo el Histórico', rangeText: 'Histórico Acumulado' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('ingresos'); // ingresos, reservas, canchas, asistencia
  const [dateFilter, setDateFilter] = useState('mes');
  const [courts, setCourts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    Promise.all([
      courtsService.getAll(),
      reservationsService.getAll(),
      coachesAndClassesService.getClasses()
    ]).then(([cRes, rRes, clRes]) => {
      setCourts(cRes.data);
      setReservations(rRes.data);
      setClasses(clRes.data);
    });
  }, []);

  // Filter-dependent analytics dataset
  const reportData = useMemo(() => {
    switch (dateFilter) {
      case 'semana':
        return {
          label: 'Semana Actual (29 Sep - 05 Oct 2026)',
          totalRevenue: 38400,
          totalBookings: 8,
          avgOccupancy: 78,
          surfaceStats: [
            {
              surface: 'Polvo de Ladrillo',
              courts: 'Canchas 1 y 2',
              percent: 85,
              hoursBooked: 34,
              totalHours: 40,
              revenue: 163200,
              bgColor: 'bg-slate-500',
              status: 'Alta Demanda'
            },
            {
              surface: 'Cemento / Hard Court',
              courts: 'Canchas 3 y 4',
              percent: 70,
              hoursBooked: 28,
              totalHours: 40,
              revenue: 134400,
              bgColor: 'bg-slate-500',
              status: 'Torneo Activo'
            },
            {
              surface: 'Césped / Pasto Natural',
              courts: 'Cancha 5',
              percent: 80,
              hoursBooked: 16,
              totalHours: 20,
              revenue: 88000,
              bgColor: 'bg-tennis-500',
              status: 'Premium'
            }
          ],
          paymentStats: [
            { name: 'Mercado Pago (QR)', amount: 18432, percent: 48, count: 4, color: '#15803d' },
            { name: 'Tarjeta de Débito', amount: 9216, percent: 24, count: 2, color: '#4ade80' },
            { name: 'Tarjeta de Crédito', amount: 6912, percent: 18, count: 1, color: '#64748b' },
            { name: 'Efectivo en Caja', amount: 3840, percent: 10, count: 1, color: '#cbd5e1' },
          ]
        };

      case 'año':
        return {
          label: 'Año Completo 2026',
          totalRevenue: 890400,
          totalBookings: 186,
          avgOccupancy: 74,
          surfaceStats: [
            {
              surface: 'Polvo de Ladrillo',
              courts: 'Canchas 1 y 2',
              percent: 81,
              hoursBooked: 648,
              totalHours: 800,
              revenue: 3110400,
              bgColor: 'bg-slate-500',
              status: 'Favorita Socios'
            },
            {
              surface: 'Cemento / Hard Court',
              courts: 'Canchas 3 y 4',
              percent: 67,
              hoursBooked: 536,
              totalHours: 800,
              revenue: 2572800,
              bgColor: 'bg-slate-500',
              status: 'Liga & Escuela'
            },
            {
              surface: 'Césped / Pasto Natural',
              courts: 'Cancha 5',
              percent: 73,
              hoursBooked: 292,
              totalHours: 400,
              revenue: 1606000,
              bgColor: 'bg-tennis-500',
              status: 'Cancha Estrella'
            }
          ],
          paymentStats: [
            { name: 'Mercado Pago (QR)', amount: 445200, percent: 50, count: 93, color: '#15803d' },
            { name: 'Tarjeta de Débito', amount: 204792, percent: 23, count: 43, color: '#4ade80' },
            { name: 'Tarjeta de Crédito', amount: 160272, percent: 18, count: 33, color: '#64748b' },
            { name: 'Efectivo en Caja', amount: 80136, percent: 9, count: 17, color: '#cbd5e1' },
          ]
        };

      case 'todo':
        return {
          label: 'Histórico General Acumulado',
          totalRevenue: 1450000,
          totalBookings: 310,
          avgOccupancy: 75,
          surfaceStats: [
            {
              surface: 'Polvo de Ladrillo',
              courts: 'Canchas 1 y 2',
              percent: 83,
              hoursBooked: 1100,
              totalHours: 1320,
              revenue: 5280000,
              bgColor: 'bg-slate-500',
              status: 'Histórico Top'
            },
            {
              surface: 'Cemento / Hard Court',
              courts: 'Canchas 3 y 4',
              percent: 68,
              hoursBooked: 890,
              totalHours: 1320,
              revenue: 4272000,
              bgColor: 'bg-slate-500',
              status: 'Estable'
            },
            {
              surface: 'Césped / Pasto Natural',
              courts: 'Cancha 5',
              percent: 75,
              hoursBooked: 495,
              totalHours: 660,
              revenue: 2722500,
              bgColor: 'bg-tennis-500',
              status: 'Alta Rentabilidad'
            }
          ],
          paymentStats: [
            { name: 'Mercado Pago (QR)', amount: 710500, percent: 49, count: 152, color: '#15803d' },
            { name: 'Tarjeta de Débito', amount: 362500, percent: 25, count: 77, color: '#4ade80' },
            { name: 'Tarjeta de Crédito', amount: 246500, percent: 17, count: 53, color: '#64748b' },
            { name: 'Efectivo en Caja', amount: 130500, percent: 9, count: 28, color: '#cbd5e1' },
          ]
        };

      case 'mes':
      default:
        return {
          label: 'Mes Actual (Octubre 2026)',
          totalRevenue: 116800,
          totalBookings: 24,
          avgOccupancy: 76,
          surfaceStats: [
            {
              surface: 'Polvo de Ladrillo',
              courts: 'Canchas 1 y 2',
              percent: 82,
              hoursBooked: 82,
              totalHours: 100,
              revenue: 393600,
              bgColor: 'bg-slate-500',
              status: 'Superficie más solicitada'
            },
            {
              surface: 'Cemento / Hard Court',
              courts: 'Canchas 3 y 4',
              percent: 65,
              hoursBooked: 65,
              totalHours: 100,
              revenue: 312000,
              bgColor: 'bg-slate-500',
              status: 'Torneo Apertura en juego'
            },
            {
              surface: 'Césped / Pasto Natural',
              courts: 'Cancha 5',
              percent: 74,
              hoursBooked: 37,
              totalHours: 50,
              revenue: 203500,
              bgColor: 'bg-tennis-500',
              status: 'Cancha Premium'
            }
          ],
          paymentStats: [
            { name: 'Mercado Pago (QR)', amount: 56064, percent: 48, count: 12, color: '#15803d' },
            { name: 'Tarjeta de Débito', amount: 28032, percent: 24, count: 6, color: '#4ade80' },
            { name: 'Tarjeta de Crédito', amount: 21024, percent: 18, count: 4, color: '#64748b' },
            { name: 'Efectivo en Caja', amount: 11680, percent: 10, count: 2, color: '#cbd5e1' },
          ]
        };
    }
  }, [dateFilter]);

  // Donut SVG circumference calculation for r=70
  // C = 2 * PI * 70 = 439.82297
  const CIRCUMFERENCE = 439.82;
  const donutSlices = useMemo(() => {
    let accumulatedPercent = 0;
    return reportData.paymentStats.map((stat) => {
      const sliceLength = (stat.percent / 100) * CIRCUMFERENCE;
      const strokeDashoffset = -((accumulatedPercent / 100) * CIRCUMFERENCE);
      accumulatedPercent += stat.percent;
      return {
        ...stat,
        strokeDasharray: `${sliceLength} ${CIRCUMFERENCE - sliceLength}`,
        strokeDashoffset
      };
    });
  }, [reportData.paymentStats]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reportes, Estadísticas y Gráficos Visuales
          </h1>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
        >
          Imprimir Reporte
        </button>
      </div>

      {/* QUICK DATE RANGE FILTERS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
            Filtro Rápido por Rango de Fechas
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DATE_FILTERS.map(filter => {
            const isSelected = dateFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setDateFilter(filter.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="font-extrabold text-xs">{filter.label}</div>
                <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-tennis-300' : 'text-slate-400'}`}>
                  {filter.rangeText}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ingresos Totales</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${reportData.totalRevenue.toLocaleString('es-AR')}
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ocupación Promedio</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {reportData.avgOccupancy}%
          </div>
          <span className="text-[11px] text-slate-600 font-semibold">
            5 Canchas activas (08 a 22 hs)
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reservas & Turnos</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {reportData.totalBookings} turnos
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Canal de Pago Líder</span>
          </div>
          <div className="text-2xl font-black text-slate-900 truncate">
            Mercado Pago
          </div>
          <span className="text-[11px] text-slate-600 font-semibold">
            48% del volumen cobrado
          </span>
        </div>
      </div>

      {/* Tabs Selector (No-print) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
        {[
          { id: 'ingresos', label: '1. Distribución de Ingresos y Medios de Pago' },
          { id: 'reservas', label: '2. Ocupación Comparativa por Superficie' },
          { id: 'canchas', label: '3. Ficha Técnica de Canchas' },
          { id: 'asistencia', label: '4. Asistencia a Clases' }
        ].map(tab => {
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
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Printable Report Document */}
      <div id="printable-area" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        
        {/* Printable Official Header */}
        <div className="text-center border-b border-dashed border-slate-300 pb-4">
          <h2 className="text-xl font-black text-tennis-900 uppercase">CLUB TENIS AHORA — ESTADÍSTICAS OFICIALES</h2>
          <p className="text-xs text-slate-500">Informe Oficial Emitido para Dirección y Auditoría Contable</p>
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
            <span>Período evaluado: {reportData.label}</span>
            <span>•</span>
            <span>Fecha de emisión: {new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* TAB 1: Distribución de Ingresos y Gráfico Circular por Medio de Pago */}
        {activeTab === 'ingresos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Distribución Porcentual de Ingresos por Medio de Pago
              </h3>
            </div>

            {/* Visual Circular Chart (SVG Donut) + Method Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50/70 p-6 rounded-3xl border border-slate-200">
              
              {/* Circular Donut Chart */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                    {/* Background circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="#e2e8f0"
                      strokeWidth="24"
                    />
                    {/* Slices */}
                    {donutSlices.map((slice, i) => (
                      <circle
                        key={slice.name}
                        cx="100"
                        cy="100"
                        r="70"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="24"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className=" hover:opacity-85"
                      />
                    ))}
                  </svg>

                  {/* Centered Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ingresos</span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      ${reportData.totalRevenue.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Detail & Progress Bars */}
              <div className="lg:col-span-7 space-y-3.5">
                {reportData.paymentStats.map((item) => {
                  return (
                    <div key={item.name} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block leading-tight">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.count} transacciones registradas</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-sm text-slate-900 font-mono block">
                            ${item.amount.toLocaleString('es-AR')}
                          </span>
                          <span className="text-xs font-black text-slate-800">
                            {item.percent}%
                          </span>
                        </div>
                      </div>

                      {/* Percentage progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Transaction Ledger Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Detalle de Reservas Abonadas en el Período
              </h4>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Concepto</th>
                    <th className="py-2.5 px-3">Cliente / DNI</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Medio de Pago</th>
                    <th className="py-2.5 px-3 text-right">Seña Abonada (50%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.map(r => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{r.courtName}</td>
                      <td className="py-2.5 px-3">{r.participants[0]?.name} ({r.participants[0]?.dni})</td>
                      <td className="py-2.5 px-3 font-mono">{r.date}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {r.depositPaymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 font-mono">
                        ${r.depositPaid?.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: Ocupación por Superficie */}
        {activeTab === 'reservas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Ocupación Comparativa por Tipo de Superficie
              </h3>
            </div>

            {/* COMPARATIVE PERCENTAGE BARS */}
            <div className="space-y-4">
              {reportData.surfaceStats.map((item) => (
                <div key={item.surface} className="p-4 bg-slate-50/80 rounded-3xl border border-slate-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{item.surface}</h4>
                      <span className="text-[11px] text-slate-500">{item.courts}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        {item.status}
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-black text-slate-900 font-mono">{item.percent}%</span>
                        <span className="text-[10px] text-slate-400 block">de ocupación</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-tennis-600"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                      <span>Horas utilizadas: <strong>{item.hoursBooked} hs</strong> de {item.totalHours} hs disponibles</span>
                      <span>Ingresos generados: <strong className="text-slate-800 font-mono">${item.revenue.toLocaleString('es-AR')}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Benchmark Comparison Summary */}
            <div className="p-4 bg-tennis-50/70 border border-tennis-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-extrabold text-tennis-950 block">Conclusión Técnica de Uso de Canchas</span>
                <span className="text-tennis-800 text-[11px]">
                  El Polvo de Ladrillo presenta la mayor preferencia de los socios (82%), mientras que la Cancha 5 (Pasto) rinde el mayor ingreso unitario por hora.
                </span>
              </div>
            </div>

            {/* Reservations Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Listado de Reservas Realizadas
              </h4>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Reserva N°</th>
                    <th className="py-2.5 px-3">Cancha</th>
                    <th className="py-2.5 px-3">Superficie</th>
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
                      <td className="py-2.5 px-3">{r.surfaceType}</td>
                      <td className="py-2.5 px-3 font-mono">{r.date} ({r.startTime} a {r.endTime} hs)</td>
                      <td className="py-2.5 px-3 capitalize">{r.playersType}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-bold text-tennis-800">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 3: Canchas y Superficies */}
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
                      <span className="text-[11px] text-slate-600">
                        {c.surfaceType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{c.capacity} Jugadores ({c.capacity === 4 ? 'Dobles' : 'Singles'})</td>
                    <td className="py-2.5 px-3 font-bold text-tennis-700 font-mono">${c.pricePerHour?.toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold ${
                        c.status === 'disponible' ? 'text-tennis-800' : 'text-slate-800'
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

        {/* TAB 4: Asistencia */}
        {activeTab === 'asistencia' && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900">Reporte de Asistencia a Clases y Entrenamientos</h3>
            
            <div className="space-y-4">
              {classes.map(cls => (
                <div key={cls.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        <span className={`mr-2 text-[10px] font-bold uppercase ${(cls.kind || 'clase') === 'entrenamiento' ? 'text-slate-800' : 'text-tennis-800'}`}>
                          {(cls.kind || 'clase') === 'entrenamiento' ? 'Entrenamiento' : 'Clase'}
                        </span>
                        {cls.name}
                      </h4>
                      <p className="text-xs text-slate-500">{(cls.kind || 'clase') === 'entrenamiento' ? 'Entrenador' : 'Profesor'}: {cls.coachName} • Cancha: {cls.courtAssigned}</p>
                    </div>
                    <span className="text-xs font-bold text-tennis-700">
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
                            <td className="py-2 px-3 text-slate-500 font-mono">{st.dni}</td>
                            <td className="py-2 px-3 text-center">{present} / {total} Clases</td>
                            <td className="py-2 px-3 text-right font-bold text-tennis-700 font-mono">{percent}%</td>
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

      </div>

    </div>
  );
}
