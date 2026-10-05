import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Users, 
  Printer, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  Filter,
  CreditCard,
  QrCode,
  Banknote,
  Clock,
  Sparkles,
  PieChart,
  Award
} from 'lucide-react';
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
              gradient: 'from-amber-600 to-orange-600',
              bgColor: 'bg-amber-500',
              badgeColor: 'bg-orange-100 text-orange-900 border-orange-200',
              status: 'Alta Demanda'
            },
            {
              surface: 'Cemento / Hard Court',
              courts: 'Canchas 3 y 4',
              percent: 70,
              hoursBooked: 28,
              totalHours: 40,
              revenue: 134400,
              gradient: 'from-sky-500 to-blue-600',
              bgColor: 'bg-sky-500',
              badgeColor: 'bg-sky-100 text-sky-900 border-sky-200',
              status: 'Torneo Activo'
            },
            {
              surface: 'Césped / Pasto Natural',
              courts: 'Cancha 5',
              percent: 80,
              hoursBooked: 16,
              totalHours: 20,
              revenue: 88000,
              gradient: 'from-emerald-500 to-tennis-600',
              bgColor: 'bg-emerald-500',
              badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
              status: 'Premium'
            }
          ],
          paymentStats: [
            { name: 'Mercado Pago (QR)', amount: 18432, percent: 48, count: 4, color: '#009ee3', icon: QrCode },
            { name: 'Tarjeta de Débito', amount: 9216, percent: 24, count: 2, color: '#10b981', icon: CreditCard },
            { name: 'Tarjeta de Crédito', amount: 6912, percent: 18, count: 1, color: '#8b5cf6', icon: CreditCard },
            { name: 'Efectivo en Caja', amount: 3840, percent: 10, count: 1, color: '#f59e0b', icon: Banknote },
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
              gradient: 'from-amber-600 to-orange-600',
              bgColor: 'bg-amber-500',
              badgeColor: 'bg-orange-100 text-orange-900 border-orange-200',
              status: 'Favorita Socios'
            },
            {
              surface: 'Cemento / Hard Court',
              courts: 'Canchas 3 y 4',
              percent: 67,
              hoursBooked: 536,
              totalHours: 800,
              revenue: 2572800,
              gradient: 'from-sky-500 to-blue-600',
              bgColor: 'bg-sky-500',
              badgeColor: 'bg-sky-100 text-sky-900 border-sky-200',
              status: 'Liga & Escuela'
            },
            {
              surface: 'Césped / Pasto Natural',
              courts: 'Cancha 5',
              percent: 73,
              hoursBooked: 292,
              totalHours: 400,
              revenue: 1606000,
              gradient: 'from-emerald-500 to-tennis-600',
              bgColor: 'bg-emerald-500',
              badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
              status: 'Cancha Estrella'
            }
          ],
          paymentStats: [
            { name: 'Mercado Pago (QR)', amount: 445200, percent: 50, count: 93, color: '#009ee3', icon: QrCode },
            { name: 'Tarjeta de Débito', amount: 204792, percent: 23, count: 43, color: '#10b981', icon: CreditCard },
            { name: 'Tarjeta de Crédito', amount: 160272, percent: 18, count: 33, color: '#8b5cf6', icon: CreditCard },
            { name: 'Efectivo en Caja', amount: 80136, percent: 9, count: 17, color: '#f59e0b', icon: Banknote },
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
              gradient: 'from-amber-600 to-orange-600',
              bgColor: 'bg-amber-500',
              badgeColor: 'bg-orange-100 text-orange-900 border-orange-200',
              status: 'Histórico Top'
            },
            {
              surface: 'Cemento / Hard Court',
              courts: 'Canchas 3 y 4',
              percent: 68,
              hoursBooked: 890,
              totalHours: 1320,
              revenue: 4272000,
              gradient: 'from-sky-500 to-blue-600',
              bgColor: 'bg-sky-500',
              badgeColor: 'bg-sky-100 text-sky-900 border-sky-200',
              status: 'Estable'
            },
            {
              surface: 'Césped / Pasto Natural',
              courts: 'Cancha 5',
              percent: 75,
              hoursBooked: 495,
              totalHours: 660,
              revenue: 2722500,
              gradient: 'from-emerald-500 to-tennis-600',
              bgColor: 'bg-emerald-500',
              badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
              status: 'Alta Rentabilidad'
            }
          ],
          paymentStats: [
            { name: 'Mercado Pago (QR)', amount: 710500, percent: 49, count: 152, color: '#009ee3', icon: QrCode },
            { name: 'Tarjeta de Débito', amount: 362500, percent: 25, count: 77, color: '#10b981', icon: CreditCard },
            { name: 'Tarjeta de Crédito', amount: 246500, percent: 17, count: 53, color: '#8b5cf6', icon: CreditCard },
            { name: 'Efectivo en Caja', amount: 130500, percent: 9, count: 28, color: '#f59e0b', icon: Banknote },
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
              gradient: 'from-amber-600 to-orange-600',
              bgColor: 'bg-amber-500',
              badgeColor: 'bg-orange-100 text-orange-900 border-orange-200',
              status: 'Superficie más solicitada'
            },
            {
              surface: 'Cemento / Hard Court',
              courts: 'Canchas 3 y 4',
              percent: 65,
              hoursBooked: 65,
              totalHours: 100,
              revenue: 312000,
              gradient: 'from-sky-500 to-blue-600',
              bgColor: 'bg-sky-500',
              badgeColor: 'bg-sky-100 text-sky-900 border-sky-200',
              status: 'Torneo Apertura en juego'
            },
            {
              surface: 'Césped / Pasto Natural',
              courts: 'Cancha 5',
              percent: 74,
              hoursBooked: 37,
              totalHours: 50,
              revenue: 203500,
              gradient: 'from-emerald-500 to-tennis-600',
              bgColor: 'bg-emerald-500',
              badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
              status: 'Cancha Premium'
            }
          ],
          paymentStats: [
            { name: 'Mercado Pago (QR)', amount: 56064, percent: 48, count: 12, color: '#009ee3', icon: QrCode },
            { name: 'Tarjeta de Débito', amount: 28032, percent: 24, count: 6, color: '#10b981', icon: CreditCard },
            { name: 'Tarjeta de Crédito', amount: 21024, percent: 18, count: 4, color: '#8b5cf6', icon: CreditCard },
            { name: 'Efectivo en Caja', amount: 11680, percent: 10, count: 2, color: '#f59e0b', icon: Banknote },
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
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visualización analítica oficial (RF138 a RF142): <strong>Ocupación por superficie, distribución de ingresos y filtros por período</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-md hover:shadow-glow-green flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4" />
          Imprimir Reporte
        </button>
      </div>

      {/* QUICK DATE RANGE FILTERS (RF138 / RF142) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-tennis-600" />
            <h2 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
              Filtro Rápido por Rango de Fechas
            </h2>
          </div>
          <span className="text-xs text-tennis-800 font-bold bg-tennis-50 px-3 py-1 rounded-full border border-tennis-200">
            Período Activo: <strong>{reportData.label}</strong>
          </span>
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
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-tennis-400'
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
            <DollarSign className="w-4 h-4 text-tennis-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${reportData.totalRevenue.toLocaleString('es-AR')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Liquidación al día
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ocupación Promedio</span>
            <Calendar className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {reportData.avgOccupancy}%
          </div>
          <span className="text-[11px] text-sky-600 font-semibold">
            5 Canchas activas (08 a 22 hs)
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reservas & Turnos</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {reportData.totalBookings} turnos
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Señas 50% cobradas
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Canal de Pago Líder</span>
            <QrCode className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 truncate">
            Mercado Pago
          </div>
          <span className="text-[11px] text-sky-600 font-semibold">
            48% del volumen cobrado
          </span>
        </div>
      </div>

      {/* Tabs Selector (No-print) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
        {[
          { id: 'ingresos', label: '1. Distribución de Ingresos y Medios de Pago', icon: DollarSign },
          { id: 'reservas', label: '2. Ocupación Comparativa por Superficie', icon: Layers },
          { id: 'canchas', label: '3. Ficha Técnica de Canchas', icon: Calendar },
          { id: 'asistencia', label: '4. Asistencia a Clases', icon: Users }
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
          <h2 className="text-xl font-black text-tennis-900 uppercase">CLUB TENIS AHORA — ESTADÍSTICAS OFICIALES</h2>
          <p className="text-xs text-slate-500">Informe Oficial Emitido para Dirección y Auditoría Contable (RF138 - RF142)</p>
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
            <span>Período evaluado: {reportData.label}</span>
            <span>•</span>
            <span>Fecha de emisión: {new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* TAB 1: Distribución de Ingresos y Gráfico Circular por Medio de Pago (RF138 a RF142) */}
        {activeTab === 'ingresos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Distribución Porcentual de Ingresos por Medio de Pago
                </h3>
                <p className="text-xs text-slate-500">
                  Gráfico circular y comparativa financiera: Mercado Pago QR vs Débito vs Crédito vs Efectivo.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Recaudado</span>
                <span className="text-lg font-black text-tennis-800 font-mono">
                  ${reportData.totalRevenue.toLocaleString('es-AR')} ARS
                </span>
              </div>
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
                        className="transition-all duration-700 ease-out hover:opacity-85"
                      />
                    ))}
                  </svg>

                  {/* Centered Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ingresos</span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      ${reportData.totalRevenue.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5 border border-emerald-200">
                      100% Cobrado
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 mt-2 font-medium">
                  Gráfico circular de recaudación por canal
                </span>
              </div>

              {/* Payment Methods Detail & Progress Bars */}
              <div className="lg:col-span-7 space-y-3.5">
                {reportData.paymentStats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: item.color }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block leading-tight">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.count} transacciones registradas</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-sm text-slate-900 font-mono block">
                            ${item.amount.toLocaleString('es-AR')}
                          </span>
                          <span className="text-xs font-black px-2 py-0.5 rounded-full text-slate-800 bg-slate-100">
                            {item.percent}%
                          </span>
                        </div>
                      </div>

                      {/* Percentage progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700"
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
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[11px]">
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

        {/* TAB 2: Ocupación por Superficie (RF138 a RF142) */}
        {activeTab === 'reservas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Ocupación Comparativa por Tipo de Superficie
                </h3>
                <p className="text-xs text-slate-500">
                  Barras de porcentaje comparativas: Polvo de Ladrillo vs Cemento vs Pasto Natural.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasa Global de Uso</span>
                <span className="text-lg font-black text-tennis-800 font-mono">
                  {reportData.avgOccupancy}% de Capacidad
                </span>
              </div>
            </div>

            {/* COMPARATIVE PERCENTAGE BARS */}
            <div className="space-y-4">
              {reportData.surfaceStats.map((item, index) => (
                <div key={item.surface} className="p-4 bg-slate-50/80 rounded-3xl border border-slate-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">{item.surface}</h4>
                        <span className="text-[11px] text-slate-500">{item.courts}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.badgeColor}`}>
                        {item.status}
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-black text-slate-900 font-mono">{item.percent}%</span>
                        <span className="text-[10px] text-slate-400 block">de ocupación</span>
                      </div>
                    </div>
                  </div>

                  {/* Comparative Progress Bar with gradient */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${item.gradient} transition-all duration-700 relative`}
                        style={{ width: `${item.percent}%` }}
                      >
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-white">
                          {item.percent}%
                        </span>
                      </div>
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
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-tennis-700 shrink-0" />
                <div>
                  <span className="font-extrabold text-tennis-950 block">Conclusión Técnica de Uso de Canchas</span>
                  <span className="text-tennis-800 text-[11px]">
                    El Polvo de Ladrillo presenta la mayor preferencia de los socios (82%), mientras que la Cancha 5 (Pasto) rinde el mayor ingreso unitario por hora.
                  </span>
                </div>
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.badgeColor}`}>
                        {c.surfaceType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{c.capacity} Jugadores ({c.capacity === 4 ? 'Dobles' : 'Singles'})</td>
                    <td className="py-2.5 px-3 font-bold text-tennis-700 font-mono">${c.pricePerHour?.toLocaleString('es-AR')}</td>
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

        {/* TAB 4: Asistencia */}
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
                            <td className="py-2 px-3 text-slate-500 font-mono">{st.dni}</td>
                            <td className="py-2 px-3 text-center">{present} / {total} Clases</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700 font-mono">{percent}%</td>
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
