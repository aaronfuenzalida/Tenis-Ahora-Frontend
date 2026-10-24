import React, { useState, useEffect, useMemo } from 'react';
import { courtsService, reservationsService, stockService, coachesAndClassesService, receiptsService } from '../../services/api';
import { availableMinutesOn } from '../../components/admin/CourtAvailabilityPanel';

// Date filter options
const DATE_FILTERS = [
  { id: 'semana', label: 'Semana Actual' },
  { id: 'mes', label: 'Mes Actual' },
  { id: 'año', label: 'Año Actual' },
  { id: 'todo', label: 'Todo el Histórico' },
];

const PAYMENT_COLORS = ['#15803d', '#4ade80', '#64748b', '#cbd5e1', '#166534', '#94a3b8'];

// La semana arranca el lunes; 'todo' no tiene fecha de inicio.
function periodStart(filterId, now = new Date()) {
  switch (filterId) {
    case 'semana': {
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      return monday;
    }
    case 'mes':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'año':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}

function periodEnd(filterId, now = new Date()) {
  switch (filterId) {
    case 'semana': {
      const sunday = periodStart(filterId, now);
      sunday.setDate(sunday.getDate() + 6);
      return sunday;
    }
    case 'mes':
      return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    case 'año':
      return new Date(now.getFullYear(), 11, 31);
    default:
      return null;
  }
}

const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function periodText(filterId, now = new Date()) {
  const start = periodStart(filterId, now);
  switch (filterId) {
    case 'semana':
      return `${start.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} - ${now.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    case 'mes': {
      const month = now.toLocaleDateString('es-AR', { month: 'long' });
      return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${now.getFullYear()}`;
    }
    case 'año':
      return `Enero - Diciembre ${now.getFullYear()}`;
    default:
      return 'Histórico Acumulado';
  }
}

// Los recibos guardan la fecha como 'YYYY-MM-DD HH:mm' en hora local.
const receiptDate = (r) => new Date(String(r.date || '').replace(' ', 'T'));

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('ingresos'); // ingresos, reservas, canchas, asistencia
  const [dateFilter, setDateFilter] = useState('mes');
  const [courts, setCourts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    Promise.all([
      courtsService.getAll(),
      reservationsService.getAll(),
      coachesAndClassesService.getClasses(),
      receiptsService.getAll()
    ]).then(([cRes, rRes, clRes, recRes]) => {
      setCourts(cRes.data);
      setReservations(rRes.data);
      setClasses(clRes.data);
      setReceipts(recRes.data);
    });
  }, []);

  // RF137: ingresos del período a partir de los recibos emitidos.
  const income = useMemo(() => {
    const start = periodStart(dateFilter);
    const inPeriod = receipts.filter(r => r.status !== 'anulado' && (!start || receiptDate(r) >= start));
    const total = inPeriod.reduce((sum, r) => sum + (Number(r.totalPaid) || 0), 0);
    const byMethod = {};
    inPeriod.forEach(r => {
      const name = r.paymentMethod || 'Sin especificar';
      byMethod[name] = byMethod[name] || { name, amount: 0, count: 0 };
      byMethod[name].amount += Number(r.totalPaid) || 0;
      byMethod[name].count += 1;
    });
    const paymentStats = Object.values(byMethod)
      .sort((a, b) => b.amount - a.amount)
      .map((m, i) => ({
        ...m,
        share: total ? m.amount / total : 0,
        percent: total ? Math.round((m.amount / total) * 100) : 0,
        color: PAYMENT_COLORS[i % PAYMENT_COLORS.length]
      }));
    return { receipts: inPeriod, total, paymentStats };
  }, [receipts, dateFilter]);

  // Ocupación del período: horas reservadas (sin canceladas) sobre horas habilitadas de cada cancha.
  const occupancy = useMemo(() => {
    const active = reservations.filter(r => r.status !== 'cancelada' && r.date);
    const start = periodStart(dateFilter);
    const end = periodEnd(dateFilter);
    const dates = active.map(r => r.date).sort();
    const from = start ? toISODate(start) : dates[0];
    const to = end ? toISODate(end) : dates[dates.length - 1];
    const inPeriod = from ? active.filter(r => r.date >= from && r.date <= to) : [];

    const days = [];
    if (from) {
      const [y, m, d] = from.split('-').map(Number);
      for (let day = new Date(y, m - 1, d); toISODate(day) <= to; day.setDate(day.getDate() + 1)) {
        days.push(toISODate(day));
      }
    }

    const bySurface = {};
    courts.forEach(c => {
      bySurface[c.surfaceType] = bySurface[c.surfaceType] || { surface: c.surfaceType, courts: [], availableMinutes: 0, bookedMinutes: 0, revenue: 0 };
      const s = bySurface[c.surfaceType];
      s.courts.push(c.name);
      s.availableMinutes += days.reduce((sum, day) => sum + availableMinutesOn(c, day), 0);
    });
    inPeriod.forEach(r => {
      const court = courts.find(c => c.id === r.courtId);
      const s = bySurface[court?.surfaceType || r.surfaceType];
      if (!s) return;
      s.bookedMinutes += (Number(r.durationHours) || 1) * 60;
      s.revenue += Number(r.totalCost) || 0;
    });

    const toPercent = (booked, available) => (available ? Math.min(100, Math.round((booked / available) * 100)) : 0);
    const surfaceStats = Object.values(bySurface).map(s => ({
      ...s,
      hoursBooked: Math.round(s.bookedMinutes / 6) / 10,
      totalHours: Math.round(s.availableMinutes / 6) / 10,
      percent: toPercent(s.bookedMinutes, s.availableMinutes),
      revenuePerHour: s.bookedMinutes ? Math.round(s.revenue / (s.bookedMinutes / 60)) : 0
    }));
    const booked = surfaceStats.reduce((sum, s) => sum + s.bookedMinutes, 0);
    const available = surfaceStats.reduce((sum, s) => sum + s.availableMinutes, 0);
    return {
      reservations: inPeriod,
      surfaceStats,
      totalBookings: inPeriod.length,
      avgOccupancy: toPercent(booked, available)
    };
  }, [reservations, courts, dateFilter]);

  const occupancySummary = useMemo(() => {
    const used = occupancy.surfaceStats.filter(s => s.bookedMinutes > 0);
    if (used.length === 0) return 'No hay reservas en el período seleccionado.';
    const busiest = used.reduce((a, b) => (b.percent > a.percent ? b : a));
    const mostProfitable = used.reduce((a, b) => (b.revenuePerHour > a.revenuePerHour ? b : a));
    return `${busiest.surface} tiene la mayor ocupación del período (${busiest.percent}%); ${mostProfitable.surface} rinde el mayor ingreso por hora reservada ($${mostProfitable.revenuePerHour.toLocaleString('es-AR')}/h).`;
  }, [occupancy]);

  // Donut SVG circumference calculation for r=70
  // C = 2 * PI * 70 = 439.82297
  const CIRCUMFERENCE = 439.82;
  const donutSlices = useMemo(() => {
    let accumulatedShare = 0;
    return income.paymentStats.map((stat) => {
      const sliceLength = stat.share * CIRCUMFERENCE;
      const strokeDashoffset = -(accumulatedShare * CIRCUMFERENCE);
      accumulatedShare += stat.share;
      return {
        ...stat,
        strokeDasharray: `${sliceLength} ${CIRCUMFERENCE - sliceLength}`,
        strokeDashoffset
      };
    });
  }, [income.paymentStats]);

  const leadingMethod = income.paymentStats[0];

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
                  {periodText(filter.id)}
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
            ${income.total.toLocaleString('es-AR')}
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ocupación Promedio</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {occupancy.avgOccupancy}%
          </div>
          <span className="text-[11px] text-slate-600 font-semibold">
            Horas reservadas sobre horas habilitadas de {courts.length} canchas
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reservas & Turnos</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {occupancy.totalBookings} turnos
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Canal de Pago Líder</span>
          </div>
          <div className="text-2xl font-black text-slate-900 truncate">
            {leadingMethod ? leadingMethod.name : 'Sin cobros'}
          </div>
          {leadingMethod && (
            <span className="text-[11px] text-slate-600 font-semibold">
              {leadingMethod.percent}% del volumen cobrado
            </span>
          )}
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
            <span>Período evaluado: {DATE_FILTERS.find(fl => fl.id === dateFilter).label} ({periodText(dateFilter)})</span>
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
                      ${income.total.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Detail & Progress Bars */}
              <div className="lg:col-span-7 space-y-3.5">
                {income.paymentStats.map((item) => {
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
                Detalle de Recibos Cobrados en el Período
              </h4>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Concepto</th>
                    <th className="py-2.5 px-3">Cliente / DNI</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Medio de Pago</th>
                    <th className="py-2.5 px-3 text-right">Importe Cobrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {income.receipts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 px-3 text-center text-slate-400">No hay recibos en el período seleccionado.</td>
                    </tr>
                  )}
                  {income.receipts.map(r => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{r.concept}</td>
                      <td className="py-2.5 px-3">{r.clientName} ({r.clientDni})</td>
                      <td className="py-2.5 px-3 font-mono">{r.date}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {r.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 font-mono">
                        ${(Number(r.totalPaid) || 0).toLocaleString('es-AR')}
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
              {occupancy.surfaceStats.map((item) => (
                <div key={item.surface} className="p-4 bg-slate-50/80 rounded-3xl border border-slate-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{item.surface}</h4>
                      <span className="text-[11px] text-slate-500">{item.courts.join(', ')}</span>
                    </div>

                    <div className="flex items-center gap-3">
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
                  {occupancySummary}
                </span>
              </div>
            </div>

            {/* Reservations Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Listado de Reservas del Período
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
                  {occupancy.reservations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 px-3 text-center text-slate-400">No hay reservas en el período seleccionado.</td>
                    </tr>
                  )}
                  {occupancy.reservations.map(r => (
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
