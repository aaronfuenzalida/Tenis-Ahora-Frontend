import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { courtsService, stockService, reservationsService } from '../../services/api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Package, 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  ChevronRight,
  Printer
} from 'lucide-react';
import QRModal from '../../components/common/QRModal';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function BookCourtPage() {
  const { user } = useAuth();

  // State
  const [courts, setCourts] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSurface, setSelectedSurface] = useState('ALL'); // ALL, Ladrillo, Cemento, Pasto
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  // Selection
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [durationHours, setDurationHours] = useState(2); // 1 or 2 hours max
  const [playersType, setPlayersType] = useState('singles'); // singles (2) or dobles (4)
  
  // Players registration list (2 or 4 players)
  const [players, setPlayers] = useState([
    { name: user?.name || 'Federico Gómez', dni: user?.dni || '38.452.129', phone: user?.phone || '+54 11 4892-1234', isLead: true },
    { name: '', dni: '', phone: '' }
  ]);

  // Equipment assigned automatically without extra charge (RD05, RD06, RD07, RD08)

  // Payment & Modals
  const [paymentMethod, setPaymentMethod] = useState('Mercado Pago (QR)');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([courtsService.getAll(), stockService.getAll()]);
    setCourts(cRes.data);
    setStock(sRes.data);
    if (cRes.data.length > 0) {
      setSelectedCourt(cRes.data[0]);
    }
    setLoading(false);
  };

  // Adjust player inputs when switching singles vs dobles
  const handlePlayerTypeChange = (type) => {
    setPlayersType(type);
    if (type === 'singles') {
      setPlayers(prev => prev.slice(0, 2).concat(prev.length < 2 ? [{ name: '', dni: '', phone: '' }] : []));
    } else {
      // 4 players for doubles
      setPlayers(prev => {
        const copy = [...prev];
        while (copy.length < 4) {
          copy.push({ name: '', dni: '', phone: '' });
        }
        return copy.slice(0, 4);
      });
    }
  };

  const handlePlayerChange = (index, field, value) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
  };

  // Pricing calculations (RD03, RD04, RD06)
  const courtPricePerHour = selectedCourt ? selectedCourt.pricePerHour : 4800;
  const courtTotal = courtPricePerHour * durationHours;
  const equipmentTotal = 0; // RD06: Los ítems de stock no tienen costo extra para la reserva
  const totalReservation = courtTotal;
  const deposit50 = totalReservation * 0.5; // RD03: 50% de seña para confirmar
  const remaining50 = totalReservation * 0.5; // RD04: 50% al finalizar el tiempo de alquiler

  // Stock items helpers (RD05: solo redes, pelotas y raquetas; RD06/RD07: bloqueo si no hay stock)
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

  // Max 30 days date limit validation (RF032)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];
  const minDateStr = new Date().toISOString().split('T')[0];

  const handleProceedPayment = (e) => {
    e.preventDefault();
    if (!selectedTimeSlot) {
      alert('Por favor seleccione un horario disponible.');
      return;
    }
    if (players.some(p => !p.name || !p.dni)) {
      alert('Por favor complete los datos (Nombre y DNI) de todos los jugadores que intervienen en el juego.');
      return;
    }
    if (!canBookWithStock) {
      alert('No se puede reservar la cancha: no hay disponibilidad de red, pelotas o raquetas en stock (RD06/RD07).');
      return;
    }

    if (paymentMethod === 'Mercado Pago (QR)') {
      setShowQRModal(true);
    } else {
      executeReservation();
    }
  };

  const executeReservation = async () => {
    const bookingPayload = {
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      surfaceType: selectedCourt.surfaceType,
      date: selectedDate,
      startTime: selectedTimeSlot.split(' - ')[0] || '10:00',
      endTime: selectedTimeSlot.split(' - ')[1] || '12:00',
      durationHours,
      playersType,
      participants: players,
      equipmentAssigned: {
        nets: requiredNets,
        ballTubes: requiredBalls,
        rackets: requiredRackets
      },
      courtCost: courtTotal,
      equipmentCost: 0,
      totalCost: totalReservation,
      depositPaid: deposit50,
      depositPaymentMethod: paymentMethod,
      remainingBalance: remaining50
    };

    const res = await reservationsService.create(bookingPayload);
    setGeneratedReceipt(res.receipt);
    setBookingSuccess(true);
  };

  const filteredCourts = courts.filter(c => {
    if (selectedSurface === 'ALL') return true;
    return c.surfaceType.toLowerCase() === selectedSurface.toLowerCase();
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reserva de Canchas de Tenis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Elegí superficie (Ladrillo, Cemento, Pasto), equipamiento con stock garantizado y aboná el 50% de seña para confirmar tu turno.
          </p>
        </div>

        {/* Date Selector (up to 30 days) */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <CalendarIcon className="w-4 h-4 text-tennis-600" />
          <div className="text-xs">
            <span className="text-slate-400 block font-medium">Fecha de Turno:</span>
            <input
              type="date"
              min={minDateStr}
              max={maxDateStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-slate-800 bg-transparent outline-none cursor-pointer text-xs"
            />
          </div>
        </div>
      </div>

      {bookingSuccess ? (
        /* Success Screen */
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-slate-900">¡Reserva Confirmada Exitosamente!</h2>
          <p className="text-sm text-slate-600">
            Se ha registrado el pago de la seña del <strong>50% (${deposit50.toLocaleString('es-AR')})</strong>. Recordá que el 50% restante (${remaining50.toLocaleString('es-AR')}) se abona en administración al terminar el partido.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Cancha:</span> <span>{selectedCourt?.name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Fecha y Horario:</span> <span>{selectedDate} • {selectedTimeSlot} ({durationHours} hs)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Jugadores registrados:</span> <span>{players.map(p => p.name).join(', ')}</span>
            </div>
            <div className="flex justify-between font-bold text-tennis-700 pt-2 border-t border-slate-200">
              <span>Comprobante Oficial:</span> <span>{generatedReceipt?.id}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-glow-green"
            >
              <Printer className="w-4 h-4" />
              Imprimir Comprobante con QR
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingSuccess(false);
                setSelectedTimeSlot('');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
            >
              Hacer Otra Reserva
            </button>
          </div>
        </div>
      ) : (
        /* Reservation Wizard Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Surface & Court Selector (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Surface filter tabs */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                1. Seleccioná el Tipo de Superficie:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'ALL', label: 'Todas', badge: '5 Canchas' },
                  { id: 'Ladrillo', label: 'Ladrillo', badge: 'Polvo tradicional' },
                  { id: 'Cemento', label: 'Cemento', badge: 'Hard Court rápida' },
                  { id: 'Pasto', label: 'Pasto', badge: 'Césped Célebre' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedSurface(tab.id)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      selectedSurface === tab.id
                        ? 'bg-tennis-600 text-white border-tennis-700 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-tennis-300'
                    }`}
                  >
                    <div className="font-extrabold text-xs">{tab.label}</div>
                    <div className={`text-[10px] mt-0.5 truncate ${selectedSurface === tab.id ? 'text-tennis-100' : 'text-slate-400'}`}>
                      {tab.badge}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Courts list */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-500">
                2. Elegí la Cancha Deseada:
              </label>
              <div className="space-y-3">
                {filteredCourts.map(court => {
                  const isSelected = selectedCourt?.id === court.id;
                  const isMaint = court.status === 'mantenimiento';

                  return (
                    <div
                      key={court.id}
                      onClick={() => !isMaint && setSelectedCourt(court)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isMaint 
                          ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-white border-tennis-600 ring-2 ring-tennis-500/20 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={court.photo}
                            alt={court.name}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${court.badgeColor}`}>
                                {court.surfaceType}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900">{court.name}</h3>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{court.description}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                              <span>Capacidad: hasta {court.capacity} personas ({court.capacity === 4 ? 'Dobles' : 'Singles'})</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right sm:border-l sm:pl-4 sm:border-slate-100 flex sm:flex-col justify-between items-end">
                          <div className="text-base font-extrabold text-slate-900">
                            ${court.pricePerHour?.toLocaleString('es-AR')} <span className="text-[10px] font-normal text-slate-500">/hora</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                            isMaint ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isMaint ? 'En Mantenimiento' : 'Disponible'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Picker (Max 2 hours per turn) */}
            {selectedCourt && selectedCourt.status !== 'mantenimiento' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    3. Horarios Disponibles ({selectedDate})
                  </label>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Duración:</span>
                    <select
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg outline-none"
                    >
                      <option value={1}>1 Hora</option>
                      <option value={2}>2 Horas (max)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    '08:00 - 10:00',
                    '10:00 - 12:00',
                    '14:00 - 16:00',
                    '16:00 - 18:00',
                    '18:00 - 20:00',
                    '20:00 - 22:00'
                  ].map((slot, sIdx) => {
                    const isBooked = sIdx === 1; // Example booked slot
                    const isSelected = selectedTimeSlot === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all ${
                          isBooked
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-tennis-600 text-white border-tennis-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-tennis-400'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 mx-auto mb-1 opacity-80" />
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Players Registration Form (Singles: 2 / Doubles: 4) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-700">
                    4. Registro Obligatorio de Jugadores
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Requerimiento: deben quedar registrados los datos de los 2 o 4 participantes que intervienen en el juego.
                  </p>
                </div>

                {/* Modality selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handlePlayerTypeChange('singles')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      playersType === 'singles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Singles (2)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlayerTypeChange('dobles')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      playersType === 'dobles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Dobles (4)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-tennis-800 uppercase block">
                      Jugador {idx + 1} {idx === 0 && '(Titular / Socio)'}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Nombre y Apellido *"
                      value={p.name}
                      onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-tennis-500 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="DNI *"
                        value={p.dni}
                        onChange={(e) => handlePlayerChange(idx, 'dni', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-tennis-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Teléfono"
                        value={p.phone}
                        onChange={(e) => handlePlayerChange(idx, 'phone', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-tennis-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Equipment Rental & Checkout Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Equipment Stock assignment (RD05, RD06, RD07, RD08) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-700">
                    5. Asignación de Equipamiento Reglamentario
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    RD05/RD06: Incluye Red, Pelotas y Raquetas sin costo extra.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Sin costo extra ($0)
                </span>
              </div>

              {!canBookWithStock && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Bloqueo por falta de stock (RD07):</strong>
                    <p className="text-[11px] mt-0.5">
                      No es posible reservar la cancha porque no hay stock suficiente de red, pelotas o raquetas ({requiredRackets} requeridas).
                    </p>
                  </div>
                </div>
              )}

              {/* Red de Tenis */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">1 Red Reglamentaria de Tenis</div>
                  <div className="text-[11px] text-slate-400">Stock disponible: {netStock?.availableStock ?? 0} u.</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                  hasNetStock 
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}>
                  {hasNetStock ? '✓ Asignada ($0)' : 'Sin Stock'}
                </span>
              </div>

              {/* Pelotas de Tenis */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">Pelotas Reglamentarias de Tenis</div>
                  <div className="text-[11px] text-slate-400">Stock disponible: {ballStock?.availableStock ?? 0} pelotas</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                  hasBallStock 
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}>
                  {hasBallStock ? '✓ Asignadas ($0)' : 'Sin Stock'}
                </span>
              </div>

              {/* Raquetas de Tenis */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">
                    {requiredRackets} Raquetas de Tenis ({playersType === 'singles' ? 'Singles: 2 raquetas' : 'Dobles: 4 raquetas'})
                  </div>
                  <div className="text-[11px] text-slate-400">Stock disponible: {racketStock?.availableStock ?? 0} u.</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                  hasRacketStock 
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}>
                  {hasRacketStock ? `✓ Asignadas (${requiredRackets} u.) ($0)` : 'Sin Stock'}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                RD08: El equipamiento debe ser devuelto en recepción al finalizar el tiempo de juego.
              </div>
            </div>

            {/* Payment Method & Total Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-700">
                6. Medio de Pago y Seña Obligatoria del 50%
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Mercado Pago (QR)', label: 'QR MP', icon: QrCode },
                  { id: 'Tarjeta de Débito', label: 'Débito', icon: CreditCard },
                  { id: 'Tarjeta de Crédito', label: 'Crédito', icon: CreditCard }
                ].map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-2.5 rounded-xl text-center border text-xs font-bold transition-all ${
                        paymentMethod === method.id
                          ? 'bg-tennis-50 text-tennis-800 border-tennis-600 ring-1 ring-tennis-500'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1 text-tennis-600" />
                      {method.label}
                    </button>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Alquiler Cancha ({durationHours} hs):</span>
                  <span className="font-semibold">${courtTotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Equipamiento (Red, Pelotas, {requiredRackets} Raquetas):</span>
                  <span className="font-semibold text-emerald-700">Incluido ($0)</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-100">
                  <span>Costo Total de la Reserva:</span>
                  <span>${totalReservation.toLocaleString('es-AR')}</span>
                </div>

                {/* 50% Deposit highlight box (RD03 & RD04) */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <div className="flex justify-between items-center text-emerald-900 font-extrabold text-sm">
                    <span>Abonar Ahora (Seña 50%):</span>
                    <span>${deposit50.toLocaleString('es-AR')} ARS</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 flex items-center justify-between">
                    <span>Saldo al finalizar el partido (50%):</span>
                    <span className="font-bold">${remaining50.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={!canBookWithStock}
                onClick={handleProceedPayment}
                className="w-full py-3.5 px-4 rounded-xl bg-tennis-600 hover:bg-tennis-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md hover:shadow-glow-green flex items-center justify-center gap-2 transition-all"
              >
                {canBookWithStock ? 'Pagar seña y confirmar reserva' : 'Sin stock de equipamiento'}
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Se emitirá automáticamente el recibo oficial con código QR
              </div>
            </div>

          </div>

        </div>
      )}

      {/* QR Modal for Mercado Pago */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        amount={deposit50}
        concept={`Seña 50% - ${selectedCourt?.name} (${selectedDate} ${selectedTimeSlot})`}
        onPaymentSuccess={executeReservation}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receipt={generatedReceipt}
      />

    </div>
  );
}
