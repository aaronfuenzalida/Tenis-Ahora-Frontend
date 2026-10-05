import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reservationsService, courtsService, tournamentsService } from '../../services/api';
import { 
  Calendar, 
  Trophy, 
  GraduationCap, 
  CreditCard, 
  ArrowRight, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  Printer
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [courts, setCourts] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    reservationsService.getAll().then(res => setReservations(res.data));
    courtsService.getAll().then(res => setCourts(res.data));
    tournamentsService.getAll().then(res => setTournaments(res.data));
  }, []);

  const upcomingBooking = reservations.find(r => r.status === 'confirmada');

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-tennis-800 via-tennis-700 to-tennis-900 text-white p-6 sm:p-8 overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_center,#fff_0,transparent_70%)] opacity-10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tennis-600/60 text-tennis-100 text-xs font-bold border border-tennis-500/30">
              <span className="w-2 h-2 rounded-full bg-tennis-300 animate-pulse" />
              Socio N° {user?.memberNumber || 'TA-8821'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ¡Hola, {user?.name?.split(' ')[0] || 'Socio'}!
            </h1>
            <p className="text-tennis-100 text-xs sm:text-sm max-w-xl">
              Bienvenido al portal de Tenis Ahora. Podés reservar canchas de polvo de ladrillo, cemento o pasto, consultar tus torneos y ver tus comprobantes con QR.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/app/reservas"
              className="px-5 py-3 rounded-2xl bg-white text-tennis-800 hover:bg-tennis-50 font-extrabold text-sm shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <Calendar className="w-4 h-4 text-tennis-600" />
              Reservar cancha ahora
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Próximo Partido</span>
            <div className="text-lg font-black text-slate-800 mt-1">
              {upcomingBooking ? upcomingBooking.date : 'Sin turnos'}
            </div>
            <span className="text-xs text-tennis-600 font-medium">
              {upcomingBooking ? `${upcomingBooking.startTime} hs (${upcomingBooking.surfaceType})` : 'Disponibilidad abierta'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Torneo Activo</span>
            <div className="text-lg font-black text-slate-800 mt-1">Abierto Primavera</div>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              Clasificado a Semis
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clase Semanal</span>
            <div className="text-lg font-black text-slate-800 mt-1">Martes 19:00 hs</div>
            <span className="text-xs text-slate-500 font-medium">Prof. Álvarez (AAT Lic)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estado de Saldo</span>
            <div className="text-lg font-black text-tennis-700 mt-1">Al día</div>
            <span className="text-xs text-slate-500">Seña 50% cubierta</span>
          </div>
        </div>

      </div>

      {/* Main Content Grid: Upcoming Reservation Card + Courts Availability Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active Reservation Detail & Receipt */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Tu Próxima Reserva Confirmada</h2>
                <p className="text-xs text-slate-500">Regla: El 50% restante se liquida al concluir el turno</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Seña 50% Abonada
              </span>
            </div>

            {upcomingBooking ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-tennis-700 block">{upcomingBooking.surfaceType}</span>
                    <h3 className="text-base font-bold text-slate-900">{upcomingBooking.courtName}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {upcomingBooking.date} • {upcomingBooking.startTime} a {upcomingBooking.endTime} hs ({upcomingBooking.durationHours} hs)</span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:pl-4 sm:border-slate-200">
                    <div className="text-xs text-slate-400">Total Reserva: ${upcomingBooking.totalCost?.toLocaleString('es-AR')}</div>
                    <div className="text-sm font-extrabold text-slate-900">
                      Saldo al finalizar: <span className="text-amber-600">${upcomingBooking.remainingBalance?.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                {/* Players registered (2 to 4) */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold uppercase text-slate-500 block mb-2">
                    Jugadores Registrados ({upcomingBooking.participants?.length} / {upcomingBooking.playersType === 'dobles' ? '4 Dobles' : '2 Singles'}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {upcomingBooking.participants?.map((p, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{p.name} {p.isLead && '(Titular)'}</span>
                        <span className="text-slate-400">{p.dni}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned equipment & Receipt action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-500">
                    Equipamiento asignado: <strong>1 Red</strong>, <strong>Pelotas</strong>, <strong>{upcomingBooking.equipmentAssigned?.rackets} Raquetas</strong> (Sin costo extra)
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReceipt({
                      id: upcomingBooking.depositReceiptNumber,
                      clientName: user?.name || 'Federico Gómez',
                      clientDni: user?.dni || '38.452.129',
                      concept: `Seña 50% Alquiler - ${upcomingBooking.courtName}`,
                      items: [
                        { description: `Alquiler Cancha (${upcomingBooking.durationHours} hs)`, amount: upcomingBooking.courtCost },
                        { description: `Equipamiento incluido (Red, Pelotas, Raquetas)`, amount: 0 },
                        { description: `Total Turno`, amount: upcomingBooking.totalCost },
                        { description: `Seña 50% Abonada`, amount: upcomingBooking.depositPaid }
                      ],
                      totalPaid: upcomingBooking.depositPaid,
                      paymentMethod: upcomingBooking.depositPaymentMethod,
                      date: upcomingBooking.date + ' ' + upcomingBooking.startTime
                    })}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-bold text-xs border border-tennis-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Ver Comprobante de Seña (QR)
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mb-3">No tenés reservas pendientes para hoy.</p>
                <Link
                  to="/app/reservas"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tennis-600 text-white font-bold text-xs hover:bg-tennis-700"
                >
                  Buscar Canchas Disponibles <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Cancellation Policy Banner */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Política de Reserva y Cancelación:</strong>
              Para confirmar una cancha se abona el 50% de seña. Las cancelaciones efectuadas con un mínimo de <strong>6 horas de antelación</strong> contemplan reembolso conforme al reglamento del club.
            </div>
          </div>

        </div>

        {/* Right Column: Court Surfaces status overview */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">Nuestras Canchas</h2>
              <Link to="/app/reservas" className="text-xs font-bold text-tennis-600 hover:underline">
                Ver todas
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {courts.slice(0, 4).map(court => (
                <div key={court.id} className="py-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${court.badgeColor}`}>
                        {court.surfaceType}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{court.name.split('-')[0]}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Capacidad: {court.capacity} jugadores ({court.capacity === 4 ? 'Dobles' : 'Singles'})
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      court.status === 'disponible' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : court.status === 'mantenimiento'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {court.status === 'disponible' ? 'Libre' : court.status === 'mantenimiento' ? 'Mantenimiento' : 'Ocupada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <Link
                to="/app/reservas"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-700 font-bold text-xs transition-colors flex items-center justify-center gap-1"
              >
                Consultar Grilla de Horarios <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
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
