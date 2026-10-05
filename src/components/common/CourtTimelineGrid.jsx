import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Lock, 
  Wrench, 
  Sparkles, 
  Info,
  Check
} from 'lucide-react';

export default function CourtTimelineGrid({
  courts = [],
  selectedCourt,
  selectedTimeSlot,
  selectedDate,
  onSelectSlot,
  onDateChange,
  reservations = []
}) {
  const [surfaceFilter, setSurfaceFilter] = useState('ALL');
  const [slotDuration, setSlotDuration] = useState(2); // 1 or 2 hours

  // 2-hour slots from 08:00 to 22:00
  const twoHourSlots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00',
    '20:00 - 22:00'
  ];

  // 1-hour slots from 08:00 to 22:00
  const oneHourSlots = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
    '17:00 - 18:00',
    '18:00 - 19:00',
    '19:00 - 20:00',
    '20:00 - 21:00',
    '21:00 - 22:00'
  ];

  const activeSlots = slotDuration === 1 ? oneHourSlots : twoHourSlots;

  // Filter courts by surface
  const filteredCourts = courts.filter(c => {
    if (surfaceFilter === 'ALL') return true;
    return c.surfaceType.toLowerCase() === surfaceFilter.toLowerCase();
  });

  // Date calculation boundaries (RF032: Max 30 days)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handlePrevDay = () => {
    const cur = new Date(selectedDate + 'T00:00:00');
    cur.setDate(cur.getDate() - 1);
    const nextStr = cur.toISOString().split('T')[0];
    if (nextStr >= todayStr) {
      onDateChange(nextStr);
    }
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate + 'T00:00:00');
    cur.setDate(cur.getDate() + 1);
    const nextStr = cur.toISOString().split('T')[0];
    if (nextStr <= maxDateStr) {
      onDateChange(nextStr);
    }
  };

  const handleToday = () => {
    onDateChange(todayStr);
  };

  // Helper to get formatted date string: e.g. "Sábado 10 de Octubre"
  const formattedDateTitle = (() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return selectedDate;
    }
  })();

  // Deterministic status evaluator for slots
  const getSlotStatus = (court, slot) => {
    // 1. Maintenance check
    if (court.status === 'mantenimiento') {
      return {
        type: 'MAINTENANCE',
        label: 'Mantenimiento',
        detail: court.maintenanceNotes || 'Cuidado de superficie'
      };
    }

    // Specific scheduled maintenance slots (e.g. Cancha 1 maintenance 12:00-14:00 on Ladrillo)
    if (court.surfaceType === 'Ladrillo' && slot.startsWith('12:00')) {
      return {
        type: 'MAINTENANCE',
        label: 'Mantenimiento',
        detail: 'Riego y rolado reglamentario'
      };
    }

    // 2. Real reservations from reservations store
    const startHour = slot.split(' - ')[0];
    const matchRes = reservations.find(r => 
      (r.courtId === court.id || r.courtName === court.name) && 
      r.date === selectedDate &&
      r.startTime === startHour
    );
    if (matchRes) {
      return {
        type: 'BOOKED',
        label: 'Reservado',
        detail: `Turno Confirmado (${matchRes.status})`
      };
    }

    // 3. Demo booked slots (deterministic based on court id and hour string)
    const hash = (court.id.charCodeAt(court.id.length - 1) + parseInt(slot, 10) + selectedDate.charCodeAt(selectedDate.length - 1)) % 7;
    if (hash === 1 || hash === 3) {
      return {
        type: 'BOOKED',
        label: 'Reservado',
        detail: 'Alquiler Socio'
      };
    }

    // 4. Otherwise Libre
    return {
      type: 'FREE',
      label: 'Libre',
      detail: `$${court.pricePerHour?.toLocaleString('es-AR')}/h`
    };
  };

  return (
    <div className="space-y-4">
      
      {/* Date & Toolbar Controls */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          
          {/* Day Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              disabled={selectedDate <= todayStr}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
              title="Día Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-2xl border border-slate-200">
              <CalendarIcon className="w-4 h-4 text-tennis-600 shrink-0" />
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-none">
                  Fecha del Cronograma
                </span>
                <span className="text-xs font-black text-slate-900 capitalize block mt-0.5">
                  {formattedDateTitle}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              disabled={selectedDate >= maxDateStr}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
              title="Día Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-2 text-xs font-bold text-tennis-800 bg-tennis-50 hover:bg-tennis-100 rounded-xl border border-tennis-200 transition-colors"
            >
              Hoy
            </button>
          </div>

          {/* Duration & Surface Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Duration switch */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSlotDuration(2)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  slotDuration === 2 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bloques 2hs (Máx)
              </button>
              <button
                type="button"
                onClick={() => setSlotDuration(1)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  slotDuration === 1 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bloques 1h
              </button>
            </div>

            {/* Surface buttons */}
            <div className="flex items-center gap-1 text-xs">
              {[
                { id: 'ALL', label: 'Todas' },
                { id: 'Ladrillo', label: 'Ladrillo' },
                { id: 'Cemento', label: 'Cemento' },
                { id: 'Pasto', label: 'Pasto' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSurfaceFilter(s.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    surfaceFilter === s.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <span className="text-slate-400 uppercase text-[10px]">Referencias:</span>
            
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600" />
              <span className="text-emerald-900 font-extrabold">Verde = Libre (Clic para reservar)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-300 border border-slate-400" />
              <span className="text-slate-600">Gris = Ocupado / Reservado</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-400 border border-amber-500" />
              <span className="text-amber-800">Amarillo = Bloqueado por Mantenimiento</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            Horario: <strong>08:00 a 22:00 hs</strong>
          </div>
        </div>
      </div>

      {/* Grid Timeline Table */}
      <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[760px]">
          {/* Header Row: Courts on horizontal axis */}
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="py-3 px-3 text-center w-28 uppercase text-[10px] font-black tracking-wider border-r border-slate-800">
                Horario
              </th>
              {filteredCourts.map(court => (
                <th key={court.id} className="py-3 px-3 border-r border-slate-800 last:border-r-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-xs text-white tracking-tight">{court.name}</div>
                      <div className="text-[10px] text-slate-300 font-normal">
                        {court.surfaceType} • {court.capacity === 4 ? 'Dobles' : 'Singles'}
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10 text-tennis-300">
                      ${court.pricePerHour?.toLocaleString('es-AR')}/h
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Rows: Time slots on vertical axis */}
          <tbody className="divide-y divide-slate-100 text-xs">
            {activeSlots.map((slot, sIdx) => (
              <tr key={sIdx} className="hover:bg-slate-50/50 transition-colors">
                
                {/* Time slot header cell */}
                <td className="py-3 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50/70 border-r border-slate-200 select-none">
                  <div className="flex items-center justify-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{slot}</span>
                  </div>
                </td>

                {/* Court Cells */}
                {filteredCourts.map(court => {
                  const status = getSlotStatus(court, slot);
                  const isSelected = selectedCourt?.id === court.id && selectedTimeSlot === slot;

                  if (status.type === 'MAINTENANCE') {
                    return (
                      <td key={court.id} className="p-1.5 border-r border-slate-100 last:border-r-0">
                        <div 
                          className="h-16 p-2 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col justify-between select-none opacity-85"
                          title="Cancha bloqueada por mantenimiento y acondicionamiento reglamentario."
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                            <span className="flex items-center gap-1">
                              <Wrench className="w-3 h-3 text-amber-600" />
                              Mantenimiento
                            </span>
                          </div>
                          <p className="text-[9px] text-amber-800 line-clamp-1">{status.detail}</p>
                        </div>
                      </td>
                    );
                  }

                  if (status.type === 'BOOKED') {
                    return (
                      <td key={court.id} className="p-1.5 border-r border-slate-100 last:border-r-0">
                        <div 
                          className="h-16 p-2 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col justify-between select-none text-slate-400"
                          title="Horario reservado por otro socio."
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-400" />
                              Ocupado
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 truncate">{status.detail}</span>
                        </div>
                      </td>
                    );
                  }

                  // FREE (Verde)
                  return (
                    <td key={court.id} className="p-1.5 border-r border-slate-100 last:border-r-0">
                      <button
                        type="button"
                        onClick={() => onSelectSlot(court, slot, selectedDate)}
                        className={`w-full h-16 p-2 rounded-2xl text-left flex flex-col justify-between transition-all group ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500 scale-[0.98]'
                            : 'bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-950 border border-emerald-300/80 hover:border-emerald-400 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded ${
                            isSelected ? 'bg-white text-emerald-800' : 'bg-emerald-200/60 text-emerald-900'
                          }`}>
                            Libre
                          </span>
                          
                          {isSelected ? (
                            <span className="text-[10px] font-black flex items-center gap-0.5 text-white">
                              <Check className="w-3 h-3" /> Elegido
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-800">
                              {status.detail}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between w-full mt-1">
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                            {slotDuration}h de turno
                          </span>
                          <span className={`text-[10px] font-extrabold ${isSelected ? 'text-white underline' : 'text-emerald-800 group-hover:underline'}`}>
                            {isSelected ? 'Confirmando...' : 'Reservar →'}
                          </span>
                        </div>
                      </button>
                    </td>
                  );
                })}

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Slot Notice Footer */}
      {selectedCourt && selectedTimeSlot && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700">Turno Seleccionado en Grilla</span>
              <div className="font-black text-sm text-emerald-950">
                {selectedCourt.name} ({selectedCourt.surfaceType}) • {selectedTimeSlot}
              </div>
              <p className="text-xs text-emerald-800">
                Fecha: {formattedDateTitle} • Costo Cancha: ${(selectedCourt.pricePerHour * slotDuration).toLocaleString('es-AR')}
              </p>
            </div>
          </div>

          <a
            href="#booking-players-form"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs text-center shadow-md transition-all shrink-0"
          >
            Continuar con Jugadores y Seña 50% ↓
          </a>
        </div>
      )}

    </div>
  );
}
