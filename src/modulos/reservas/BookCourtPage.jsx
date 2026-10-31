import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../ui/FeedbackContext';
import { courtsService, stockService, reservationsService, clubConfigService, usersService, DEFAULT_CLUB_CONFIG, maxBookingDate } from '../../api';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import ReceiptModal from '../caja/ReceiptModal';
import PaymentFlowModal from '../caja/PaymentFlowModal';
import CourtTimelineGrid from '../canchas/CourtTimelineGrid';
import Stepper from '../../ui/Stepper';
import { buildSlots, getSlotBlock } from '../canchas/CourtAvailabilityPanel';
import { calculateHoursUntil, cleanDNI, findReservationConflict } from '../../utils/formatters';

const STEPS = [
  { id: 'schedule', label: 'Cronograma' },
  { id: 'players', label: 'Jugadores' },
  { id: 'payment', label: 'Pago de seña' }
];

/**
 * Reserva de cancha en pasos: 1) cronograma  2) jugadores  3) pago de la seña.
 * Cada paso es una pantalla; "Continuar" valida y avanza, "Volver" retrocede sin perder lo cargado.
 */
export default function BookCourtPage() {
  const { user } = useAuth();
  const { notify } = useFeedback();

  // Datos
  const [courts, setCourts] = useState([]);
  const [stock, setStock] = useState([]);
  const [reservations, setReservations] = useState([]); // ocupación del club
  const [myReservations, setMyReservations] = useState([]); // reservas propias, con jugadores
  const [loading, setLoading] = useState(true);
  const [clubConfig, setClubConfig] = useState(DEFAULT_CLUB_CONFIG);
  const [members, setMembers] = useState([]);

  // Paso actual (0: cronograma, 1: jugadores, 2: pago)
  const [step, setStep] = useState(0);

  // Paso 1: cronograma
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'cards'
  const [selectedSurface, setSelectedSurface] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(() => maxBookingDate(0));
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [durationHours, setDurationHours] = useState(2);

  // Paso 2: jugadores
  const [playersType, setPlayersType] = useState('singles');
  const [players, setPlayers] = useState([
    { name: user?.name || '', dni: user?.dni || '', phone: user?.phone || '', isLead: true },
    { name: '', dni: '', phone: '' }
  ]);

  // Paso 3: pago. La reserva se registra pendiente de pago y se confirma al abonar la seña (RD01).
  const [pendingReservation, setPendingReservation] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null); // reserva cuya seña se está pagando
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);
  const [confirmedReservation, setConfirmedReservation] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [cRes, sRes, rRes, cfgRes, mRes, mineRes] = await Promise.all([
      courtsService.getAll(),
      stockService.getAll(),
      reservationsService.getOccupancy(),
      clubConfigService.get(),
      usersService.getMembers(),
      reservationsService.getAll().catch(() => ({ data: [] }))
    ]);
    setClubConfig(cfgRes.data);
    setMembers(mRes.data || []);
    setCourts(cRes.data);
    setStock(sRes.data);
    setReservations(rRes.data || []);
    setMyReservations(mineRes.data || []);
    if (cRes.data.length > 0) setSelectedCourt(cRes.data[0]);
    setLoading(false);
  };

  // ---- Paso 1 ----
  const handleSelectTimelineSlot = (court, slot, date) => {
    setSelectedCourt(court);
    setSelectedTimeSlot(slot);
    if (date) setSelectedDate(date);
    setDurationHours(slot.includes(' - ') && slotHours(slot) === 1 ? 1 : 2);
  };

  // ---- Paso 2 ----
  const handlePlayerTypeChange = (type) => {
    setPlayersType(type);
    if (type === 'singles') {
      setPlayers(prev => prev.slice(0, 2).concat(prev.length < 2 ? [{ name: '', dni: '', phone: '' }] : []));
    } else {
      setPlayers(prev => {
        const copy = [...prev];
        while (copy.length < 4) copy.push({ name: '', dni: '', phone: '' });
        return copy.slice(0, 4);
      });
    }
  };

  const handleSelectPlayer = (index, member) => {
    const updated = [...players];
    updated[index] = member
      ? { name: member.name, dni: member.dni, phone: '', memberNumber: member.memberNumber }
      : { name: '', dni: '', phone: '' };
    setPlayers(updated);
  };

  // Un socio no puede ocupar dos lugares del mismo partido.
  const takenDnisFor = (index) =>
    players.filter((_, i) => i !== index).map(p => cleanDNI(p.dni)).filter(Boolean);

  // ---- Precios ----
  const courtPricePerHour = selectedCourt ? selectedCourt.pricePerHour : 0;
  const courtTotal = courtPricePerHour * durationHours;
  const totalReservation = courtTotal;
  const deposit50 = Math.round(totalReservation / 2);
  const remaining50 = totalReservation - deposit50;

  // ---- Stock ----
  const ballStock = stock.find(s => s.category === 'Pelotas');
  const racketStock = stock.find(s => s.category === 'Raquetas');
  const netStock = stock.find(s => s.category === 'Redes');
  const requiredRackets = playersType === 'singles' ? 2 : 4;
  const requiredBalls = 1;
  const requiredNets = 1;
  const hasNetStock = netStock ? netStock.availableStock >= requiredNets : false;
  const hasBallStock = ballStock ? ballStock.availableStock >= requiredBalls : false;
  const hasRacketStock = racketStock ? racketStock.availableStock >= requiredRackets : false;
  const canBookWithStock = hasNetStock && hasBallStock && hasRacketStock;

  // Antelación máxima que fija el club
  const maxDays = clubConfig.maxAdvanceBookingDays;
  const maxDateStr = maxBookingDate(maxDays);
  const minDateStr = maxBookingDate(0);

  // Reservas propias registradas que todavía no tienen la seña abonada
  // (la API ya devuelve solo las del socio; en la demo se filtran por el DNI del titular)
  const myPending = myReservations.filter(r =>
    r.status === 'pendiente_pago' &&
    r.id !== pendingReservation?.id &&
    (!user?.dni || cleanDNI(r.participants?.[0]?.dni || '') === cleanDNI(user.dni))
  );

  // Reserva repetida: misma cancha en la misma franja, o un jugador que ya tiene reserva a esa hora.
  const conflictMessage = (withPlayers) => {
    const [startTime, endTime] = (selectedTimeSlot || '').split(' - ');
    if (!selectedCourt || !startTime || !endTime) return null;
    const known = [...reservations, ...myReservations.filter(m => !reservations.some(r => r.id === m.id))];
    const clash = findReservationConflict(known, {
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      date: selectedDate,
      startTime,
      endTime,
      participantDnis: withPlayers ? players.map(p => p.dni) : []
    });
    if (!clash) return null;
    const sameCourt = clash.courtId === selectedCourt.id || clash.courtName === selectedCourt.name;
    if (sameCourt) return `${selectedCourt.name} ya está reservada el ${clash.date} de ${clash.startTime} a ${clash.endTime}. Elegí otro turno.`;
    const dnis = players.map(p => cleanDNI(p.dni));
    const busy = (clash.participants || []).find(p => dnis.includes(cleanDNI(p.dni || '')));
    return `${busy?.name || 'Un jugador'} ya tiene una reserva el ${clash.date} de ${clash.startTime} a ${clash.endTime} en ${clash.courtName}.`;
  };

  // Motivo por el que una franja no se puede elegir: horario de la cancha (RD06) o turno que ya empezó.
  const slotUnavailableReason = (court, slot) =>
    getSlotBlock(court, selectedDate, slot) ||
    (calculateHoursUntil(selectedDate, slot.split(' - ')[0]) <= 0 ? 'El horario ya pasó' : null);

  // ---- Navegación entre pasos ----
  const goToPlayers = () => {
    if (selectedDate < minDateStr || selectedDate > maxDateStr) {
      notify({ variant: 'warning', message: `Las reservas se pueden hacer con hasta ${maxDays} días de anticipación, es decir hasta el ${maxDateStr}.` });
      return;
    }
    if (!selectedCourt || !selectedTimeSlot) {
      notify({ variant: 'warning', message: 'Elegí una cancha y un horario disponible para continuar.' });
      return;
    }
    const blockReason = slotUnavailableReason(selectedCourt, selectedTimeSlot);
    if (blockReason) {
      notify({ variant: 'warning', message: `El turno elegido no está disponible: ${blockReason}.` });
      return;
    }
    const clash = conflictMessage(false);
    if (clash) {
      notify({ variant: 'warning', message: clash });
      return;
    }
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPayment = () => {
    if (players.some(p => !p.dni)) {
      notify({ variant: 'warning', message: 'Seleccioná a todos los participantes del partido para continuar.' });
      return;
    }
    const clash = conflictMessage(true);
    if (clash) {
      notify({ variant: 'warning', message: clash });
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Registra la reserva (queda pendiente de pago) y abre el cobro de la seña.
  const handleProceedPayment = async () => {
    if (pendingReservation) {
      setPaymentTarget(pendingReservation);
      return;
    }
    if (!canBookWithStock) {
      notify({ variant: 'warning', message: 'No se puede reservar la cancha: no hay disponibilidad de red, pelotas o raquetas en stock.' });
      return;
    }
    const clash = conflictMessage(true);
    if (clash) {
      notify({ variant: 'warning', message: clash });
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const res = await reservationsService.create({
        courtId: selectedCourt.id,
        date: selectedDate,
        startTime: selectedTimeSlot.split(' - ')[0],
        durationHours,
        playersType,
        participants: players
      });
      setPendingReservation(res.data);
      setPaymentTarget(res.data);
    } catch (err) {
      notify({ variant: 'error', title: 'No se pudo registrar la reserva', message: err?.response?.data?.error || err.message || 'Intentá nuevamente.' });
    } finally {
      setSaving(false);
    }
  };

  // Cobra la seña de la reserva pendiente: el backend la confirma y emite el recibo.
  const settleDeposit = async (transaction) => {
    const res = await reservationsService.payDeposit(paymentTarget.id, transaction.id);
    setConfirmedReservation(res.data);
    setGeneratedReceipt(res.receipt);
    return res.receipt;
  };

  const handlePaymentClosed = (receipt) => {
    setPaymentTarget(null);
    if (receipt) {
      setPendingReservation(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelPending = async (reservation) => {
    try {
      await reservationsService.cancel(reservation.id);
    } catch (err) {
      notify({ variant: 'error', title: 'No se pudo cancelar la reserva', message: err?.response?.data?.error || err.message });
      return;
    }
    if (reservation.id === pendingReservation?.id) setPendingReservation(null);
    notify({ variant: 'success', title: 'Reserva cancelada', message: `La reserva ${reservation.id} se anuló sin cargo: no tenía la seña abonada.` });
    loadData();
  };

  const resetFlow = () => {
    setConfirmedReservation(null);
    setGeneratedReceipt(null);
    setSelectedTimeSlot('');
    setStep(0);
    loadData();
  };

  const filteredCourts = courts.filter(c => selectedSurface === 'ALL' || c.surfaceType.toLowerCase() === selectedSurface.toLowerCase());

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-400">Cargando disponibilidad de canchas...</div>;
  }

  // ======================= Pantalla de éxito =======================
  if (confirmedReservation && !paymentTarget) {
    const done = confirmedReservation;
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-extrabold text-slate-900">Reserva confirmada</h2>
          <p className="text-sm text-slate-600">
            Se registró el pago de la seña del 50%: <strong>${done.depositPaid?.toLocaleString('es-AR')}</strong>. El saldo de ${done.remainingBalance?.toLocaleString('es-AR')} se abona en administración al terminar el partido.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between font-bold text-slate-800"><span>Reserva:</span> <span>{done.id}</span></div>
            <div className="flex justify-between text-slate-800"><span>Cancha:</span> <span>{done.courtName}</span></div>
            <div className="flex justify-between text-slate-600"><span>Fecha y horario:</span> <span>{done.date} • {done.startTime} a {done.endTime} ({done.durationHours} hs)</span></div>
            <div className="flex justify-between text-slate-600"><span>Jugadores:</span> <span className="text-right">{(done.participants || []).map(p => p.name).join(', ')}</span></div>
            <div className="flex justify-between font-bold text-tennis-700 pt-2 border-t border-slate-200"><span>Comprobante:</span> <span>{generatedReceipt?.id}</span></div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-sm shadow-md"
            >
              Ver comprobante
            </button>
            <button
              type="button"
              onClick={resetFlow}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
            >
              Hacer otra reserva
            </button>
          </div>
        </div>

        <ReceiptModal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} receipt={generatedReceipt} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      {myPending.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Reservas pendientes de pago</h2>
            <p className="text-[11px] text-slate-500">No están confirmadas hasta abonar la seña del 50%.</p>
          </div>
          {myPending.map(r => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <div className="font-bold text-slate-900">{r.id} • {r.courtName}</div>
                <div className="text-slate-500">{r.date} • {r.startTime} a {r.endTime} • Seña ${r.depositAmount?.toLocaleString('es-AR')}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => handleCancelPending(r)} className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200">
                  Cancelar
                </button>
                <button type="button" onClick={() => setPaymentTarget(r)} className="px-3 py-2 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold">
                  Pagar seña
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indicador de pasos: con una reserva ya registrada no se vuelve atrás */}
      <Stepper steps={STEPS} current={step} onStepClick={(idx) => { if (!pendingReservation) setStep(idx); }} />

      {/* ======================= PASO 1: CRONOGRAMA ======================= */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Fecha + modo de vista */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Vista:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'timeline' ? 'bg-tennis-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Grilla horaria
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'cards' ? 'bg-tennis-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Por cancha
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Fecha:</span>
                <input
                  type="date"
                  min={minDateStr}
                  max={maxDateStr}
                  value={selectedDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val < minDateStr || val > maxDateStr) {
                      notify({ variant: 'warning', message: `Las reservas se pueden hacer con hasta ${maxDays} días de anticipación, es decir hasta el ${maxDateStr}.` });
                      return;
                    }
                    setSelectedDate(val);
                    setSelectedTimeSlot('');
                  }}
                  className="font-bold text-slate-800 bg-transparent outline-none cursor-pointer text-xs"
                />
              </div>
            </div>
          </div>

          {viewMode === 'timeline' ? (
            <CourtTimelineGrid
              courts={courts}
              selectedCourt={selectedCourt}
              selectedTimeSlot={selectedTimeSlot}
              selectedDate={selectedDate}
              onSelectSlot={handleSelectTimelineSlot}
              onDateChange={(d) => { setSelectedDate(d); setSelectedTimeSlot(''); }}
              reservations={reservations}
              maxAdvanceBookingDays={maxDays}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Superficie + canchas */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo de superficie</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'ALL', label: 'Todas', badge: `${courts.length} canchas` },
                      ...['Ladrillo', 'Cemento', 'Pasto'].map(surface => ({
                        id: surface,
                        label: surface,
                        badge: `${courts.filter(c => c.surfaceType === surface).length} canchas`
                      }))
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedSurface(tab.id)}
                        className={`p-3 rounded-2xl text-left border transition-all ${selectedSurface === tab.id ? 'bg-tennis-600 text-white border-tennis-700 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-tennis-300'}`}
                      >
                        <div className="font-extrabold text-xs">{tab.label}</div>
                        <div className={`text-[10px] mt-0.5 truncate ${selectedSurface === tab.id ? 'text-tennis-100' : 'text-slate-400'}`}>{tab.badge}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase text-slate-500">Cancha</label>
                  {filteredCourts.map(court => {
                    const isSelected = selectedCourt?.id === court.id;
                    const isMaint = court.status === 'mantenimiento';
                    return (
                      <div
                        key={court.id}
                        onClick={() => { if (!isMaint) { setSelectedCourt(court); setSelectedTimeSlot(''); } }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${isMaint ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' : isSelected ? 'bg-white border-tennis-600 ring-2 ring-tennis-500/20 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img src={court.photo} alt={court.name} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase text-slate-500">{court.surfaceType}</span>
                                <h3 className="text-sm font-bold text-slate-900">{court.name}</h3>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{court.description}</p>
                              <div className="text-[11px] text-slate-400 mt-1">Capacidad: hasta {court.capacity} personas ({court.capacity === 4 ? 'Dobles' : 'Singles'})</div>
                            </div>
                          </div>
                          <div className="text-right sm:border-l sm:pl-4 sm:border-slate-100 flex sm:flex-col justify-between items-end">
                            <div className="text-base font-extrabold text-slate-900">${court.pricePerHour?.toLocaleString('es-AR')} <span className="text-[10px] font-normal text-slate-500">/hora</span></div>
                            <span className={`text-[10px] font-bold mt-1 ${isMaint ? 'text-slate-800' : 'text-tennis-800'}`}>{isMaint ? 'En mantenimiento' : 'Disponible'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Horarios */}
              <div className="lg:col-span-5">
                {selectedCourt && selectedCourt.status !== 'mantenimiento' ? (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 sticky top-20">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase text-slate-700">Horarios del {selectedDate}</label>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Duración:</span>
                        <select
                          value={durationHours}
                          onChange={(e) => { setDurationHours(Number(e.target.value)); setSelectedTimeSlot(''); }}
                          className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg outline-none"
                        >
                          <option value={1}>1 hora</option>
                          <option value={2}>2 horas</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {buildSlots(durationHours).map((slot) => {
                        const blockReason = slotUnavailableReason(selectedCourt, slot);
                        const [startHour, endHour] = slot.split(' - ');
                        const taken = Boolean(findReservationConflict(reservations, { courtId: selectedCourt.id, date: selectedDate, startTime: startHour, endTime: endHour }));
                        const isBooked = taken || Boolean(blockReason);
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            title={blockReason || (taken ? 'Turno ocupado' : undefined)}
                            disabled={isBooked}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all ${isBooked ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through' : isSelected ? 'bg-tennis-600 text-white border-tennis-700 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-tennis-400'}`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">Seleccioná una cancha disponible para ver sus horarios.</div>
                )}
              </div>
            </div>
          )}

          {/* Resumen del turno + Continuar */}
          <div className="p-4 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="text-[10px] font-black uppercase text-tennis-400">Turno seleccionado</span>
              <div className="text-base font-extrabold text-white mt-0.5">
                {selectedCourt ? selectedCourt.name : 'Elegí una cancha'} • {selectedTimeSlot || 'elegí un horario'}
              </div>
              <div className="text-xs text-slate-300">
                Fecha: {selectedDate} • {selectedCourt?.surfaceType} • Duración: {durationHours} hs • Total cancha: <strong className="text-tennis-400">${courtTotal.toLocaleString('es-AR')}</strong>
              </div>
            </div>
            <button
              type="button"
              disabled={!selectedTimeSlot}
              onClick={goToPlayers}
              className="px-5 py-3 rounded-xl bg-tennis-500 hover:bg-tennis-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shrink-0"
            >
              Continuar: elegir jugadores
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================= PASO 2: JUGADORES ======================= */}
      {step === 1 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <SelectionSummary court={selectedCourt} date={selectedDate} slot={selectedTimeSlot} hours={durationHours} onEdit={() => setStep(0)} />

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">¿Quiénes juegan?</h3>
                <p className="text-[11px] text-slate-500">Deben quedar registrados los datos de los 2 o 4 participantes del partido.</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => handlePlayerTypeChange('singles')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${playersType === 'singles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Singles (2)
                </button>
                <button
                  type="button"
                  onClick={() => handlePlayerTypeChange('dobles')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${playersType === 'dobles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Dobles (4)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((p, idx) => (
                <div key={idx} className="p-3 rounded-xl border bg-slate-50 border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-tennis-800 uppercase block">
                    Jugador {idx + 1}{idx === 0 && ', titular'}
                  </span>
                  {idx === 0 ? (
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">DNI {p.dni}</div>
                    </div>
                  ) : (
                    <PlayerSelect members={members} value={p} takenDnis={takenDnisFor(idx)} onSelect={(member) => handleSelectPlayer(idx, member)} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <StepActions
            onBack={() => setStep(0)}
            backLabel="Volver al cronograma"
            onNext={goToPayment}
            nextLabel="Continuar: pagar la seña"
            nextDisabled={players.some(p => !p.dni)}
          />
        </div>
      )}

      {/* ======================= PASO 3: PAGO ======================= */}
      {step === 2 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <SelectionSummary court={selectedCourt} date={selectedDate} slot={selectedTimeSlot} hours={durationHours} players={players} onEdit={pendingReservation ? null : () => setStep(0)} onEditPlayers={pendingReservation ? null : () => setStep(1)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Equipamiento */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-700">Equipamiento incluido</h3>
                  <p className="text-[11px] text-slate-400">Red, pelotas y raquetas sin costo extra.</p>
                </div>
              </div>

              {!canBookWithStock && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong>Sin stock suficiente:</strong> falta red, pelotas o raquetas ({requiredRackets} requeridas) para este turno.
                </div>
              )}

              {[
                { label: '1 red reglamentaria', stock: netStock?.availableStock ?? 0, ok: hasNetStock, unit: 'u.' },
                { label: 'Pelotas reglamentarias', stock: ballStock?.availableStock ?? 0, ok: hasBallStock, unit: 'pelotas' },
                { label: `${requiredRackets} raquetas`, stock: racketStock?.availableStock ?? 0, ok: hasRacketStock, unit: 'u.' }
              ].map(item => (
                <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{item.label}</div>
                    <div className="text-[11px] text-slate-400">Stock: {item.stock} {item.unit}</div>
                  </div>
                  <span className={`text-xs font-bold ${item.ok ? 'text-tennis-700' : 'text-slate-700'}`}>{item.ok ? 'Asignado' : 'Sin stock'}</span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-700">Seña del 50%</h3>
                <p className="text-[11px] text-slate-400">Se paga con tarjeta de débito, de crédito o con QR de billetera virtual.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
                <div className="flex justify-between text-slate-600"><span>Alquiler cancha, {durationHours} hs:</span><span className="font-semibold">${courtTotal.toLocaleString('es-AR')}</span></div>
                <div className="flex justify-between text-slate-600"><span>Equipamiento:</span><span className="font-semibold text-tennis-700">Incluido</span></div>
                <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-100"><span>Total de la reserva:</span><span>${totalReservation.toLocaleString('es-AR')}</span></div>
                <div className="p-3 bg-tennis-50 rounded-xl border border-tennis-200 space-y-1">
                  <div className="flex justify-between items-center text-tennis-900 font-extrabold text-sm"><span>Seña del 50% a abonar ahora:</span><span>${deposit50.toLocaleString('es-AR')}</span></div>
                  <div className="text-[11px] text-tennis-700 flex items-center justify-between"><span>Saldo al finalizar el partido:</span><span className="font-bold">${remaining50.toLocaleString('es-AR')}</span></div>
                </div>
              </div>

            </div>
          </div>

          {pendingReservation ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <p className="text-slate-700">
                La reserva <strong>{pendingReservation.id}</strong> quedó registrada como <strong>pendiente de pago</strong>: no se confirma hasta abonar la seña de ${pendingReservation.depositAmount?.toLocaleString('es-AR')}.
              </p>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button type="button" onClick={() => handleCancelPending(pendingReservation)} className="px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200">
                  Cancelar reserva
                </button>
                <button type="button" onClick={handleProceedPayment} className="px-6 py-3 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-extrabold text-sm shadow-md">
                  Pagar seña de ${pendingReservation.depositAmount?.toLocaleString('es-AR')}
                </button>
              </div>
            </div>
          ) : (
            <StepActions
              onBack={() => setStep(1)}
              backLabel="Volver a jugadores"
              onNext={handleProceedPayment}
              nextLabel={saving ? 'Registrando reserva...' : canBookWithStock ? `Pagar seña de $${deposit50.toLocaleString('es-AR')}` : 'Sin stock de equipamiento'}
              nextDisabled={!canBookWithStock || saving}
            />
          )}
        </div>
      )}

      {/* Cobro de la seña: confirma la reserva y emite el recibo */}
      <PaymentFlowModal
        isOpen={!!paymentTarget}
        onClose={handlePaymentClosed}
        title="Pago de la seña"
        kind="reserva"
        concept={paymentTarget ? `Seña 50% - ${paymentTarget.courtName}` : ''}
        summary={paymentTarget ? `${paymentTarget.id} • ${paymentTarget.date} de ${paymentTarget.startTime} a ${paymentTarget.endTime}` : ''}
        amount={paymentTarget?.depositAmount || 0}
        settle={settleDeposit}
      />
    </div>
  );
}

function slotHours(slot) {
  const [a, b] = slot.split(' - ');
  if (!a || !b) return 2;
  return Number(b.split(':')[0]) - Number(a.split(':')[0]);
}

function PageHeader() {
  return (
    <div className="pb-4 border-b border-slate-200">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reserva de Canchas de Tenis</h1>
    </div>
  );
}

function SelectionSummary({ court, date, slot, hours, players, onEdit, onEditPlayers }) {
  return (
    <div className="p-4 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase text-tennis-400">Tu turno</span>
        <div className="text-base font-extrabold">{court?.name} • {slot}</div>
        <div className="text-xs text-slate-300">Fecha: {date} • {court?.surfaceType} • {hours} hs</div>
        {players && (
          <div className="text-xs text-slate-300">
            Jugadores: <span className="text-white font-semibold">{players.map(p => p.name).filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onEdit && (
          <button type="button" onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/20">Cambiar turno</button>
        )}
        {onEditPlayers && (
          <button type="button" onClick={onEditPlayers} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/20">Cambiar jugadores</button>
        )}
      </div>
    </div>
  );
}

function StepActions({ onBack, backLabel, onNext, nextLabel, nextDisabled }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
      <button
        type="button"
        onClick={onBack}
        className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 flex items-center justify-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        {backLabel}
      </button>
      <button
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-tennis-600 hover:bg-tennis-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
      >
        {nextLabel}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function PlayerSelect({ members, value, takenDnis, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  if (value.dni) {
    return (
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-slate-900">{value.name}</div>
          <div className="text-[11px] text-slate-500">
            DNI {value.dni}{value.memberNumber && ` • N° ${value.memberNumber}`}
          </div>
        </div>
        <button type="button" onClick={() => onSelect(null)} className="text-[11px] font-bold text-tennis-700 hover:text-tennis-900">
          Cambiar
        </button>
      </div>
    );
  }

  const text = query.trim().toLowerCase();
  const digits = cleanDNI(query);
  const options = members
    .filter(m => !takenDnis.includes(cleanDNI(m.dni)))
    .filter(m =>
      !text ||
      m.name.toLowerCase().includes(text) ||
      (m.memberNumber || '').toLowerCase().includes(text) ||
      (digits && cleanDNI(m.dni).includes(digits))
    );

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Buscar socio por nombre, DNI o N° de socio"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-tennis-500 outline-none"
      />
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-sm">
          {options.length === 0 ? (
            <li className="px-2.5 py-2 text-xs text-slate-400">Sin resultados</li>
          ) : options.map(m => (
            <li key={m.id}>
              <button
                type="button"
                // mousedown en vez de click: el blur del input cierra la lista antes de que llegue el click.
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(m);
                  setQuery('');
                  setOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50"
              >
                <span className="block text-xs font-semibold text-slate-800">{m.name}</span>
                <span className="block text-[10px] text-slate-500">DNI {m.dni} • N° {m.memberNumber}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
