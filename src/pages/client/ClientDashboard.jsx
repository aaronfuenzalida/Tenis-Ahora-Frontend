import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import usePortalPaths from '../../hooks/usePortalPaths';
import { reservationsService, courtsService, tournamentsService, clubConfigService, DEFAULT_CLUB_CONFIG } from '../../services/api';
import ReceiptModal from '../../components/common/ReceiptModal';
import MemberCardModal from '../../components/common/MemberCardModal';
import Modal from '../../components/common/Modal';
import { calculateHoursUntil, formatHoursMinutes } from '../../utils/formatters';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const paths = usePortalPaths();
  const [reservations, setReservations] = useState([]);
  const [courts, setCourts] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [clubConfig, setClubConfig] = useState(DEFAULT_CLUB_CONFIG);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    reservationsService.getAll().then(res => setReservations(res.data));
    courtsService.getAll().then(res => setCourts(res.data));
    tournamentsService.getAll().then(res => setTournaments(res.data));
    clubConfigService.get().then(res => setClubConfig(res.data));
  };

  const upcomingBooking = reservations.find(r => r.status === 'confirmada');

  const handleConfirmCancel = async () => {
    if (!upcomingBooking) return;
    const result = await reservationsService.cancel(upcomingBooking.id);
    setShowCancelModal(false);
    loadData();
    if (result.isWithinFreeWindow) {
      notify({ variant: 'success', title: 'Reserva cancelada', message: `Cancelaste con ${clubConfig.freeCancellationHours} horas o más de antelación. Se gestionó el reintegro de la seña.` });
    } else {
      notify({ variant: 'warning', title: 'Reserva cancelada', message: `Cancelaste con menos de ${clubConfig.freeCancellationHours} horas de antelación. Se aplicó la retención del ${clubConfig.lateCancellationRetentionPercent}% de la seña.` });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-tennis-800 via-tennis-700 to-tennis-900 text-white p-6 sm:p-8 overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-tennis-200">
              Socio N° {user?.memberNumber || '—'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ¡Hola, {user?.name?.split(' ')[0] || 'Socio'}!
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowCardModal(true)}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
            >
              Mi Carnet de Socio 
            </button>
            <Link
              to={paths.appReservas}
              className="px-5 py-3 rounded-2xl bg-white text-tennis-800 hover:bg-tennis-50 font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
            >
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
            <span className="text-xs text-tennis-600 font-semibold flex items-center gap-1">
              Clasificado a Semis
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clase Semanal</span>
            <div className="text-lg font-black text-slate-800 mt-1">Martes 19:00 hs</div>
            <span className="text-xs text-slate-500 font-medium">Prof. Álvarez</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estado de Saldo</span>
            <div className="text-lg font-black text-tennis-700 mt-1">Al día</div>
          </div>
        </div>

      </div>

      {/* Main Content Grid: Upcoming Reservation Card + Courts Availability Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active Reservation Detail & Receipt */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">Tu Próxima Reserva Confirmada</h2>
            </div>

            {upcomingBooking ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-tennis-700 block">{upcomingBooking.surfaceType}</span>
                    <h3 className="text-base font-bold text-slate-900">{upcomingBooking.courtName}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">{upcomingBooking.date} • {upcomingBooking.startTime} a {upcomingBooking.endTime} hs ({upcomingBooking.durationHours} hs)</span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:pl-4 sm:border-slate-200">
                    <div className="text-xs text-slate-400">Total Reserva: ${upcomingBooking.totalCost?.toLocaleString('es-AR')}</div>
                    <div className="text-sm font-extrabold text-slate-900">
                      Saldo al finalizar: <span className="text-slate-600">${upcomingBooking.remainingBalance?.toLocaleString('es-AR')}</span>
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
                        <span className="font-semibold text-slate-800">{p.name}{p.isLead && ', titular'}</span>
                        <span className="text-slate-400">{p.dni}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned equipment & Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-500">
                    Equipamiento asignado: <strong>1 Red</strong>, <strong>Pelotas</strong>, <strong>{upcomingBooking.equipmentAssigned?.rackets} Raquetas</strong> (Sin costo extra)
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1 transition-colors"
                      title="Cancelar turno"
                    >
                      Cancelar Turno
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt({
                        id: upcomingBooking.depositReceiptNumber,
                        clientName: user?.name,
                        clientDni: user?.dni,
                        concept: `Seña 50% Alquiler - ${upcomingBooking.courtName}`,
                        items: [
                          { description: `Alquiler cancha, ${upcomingBooking.durationHours} hs`, amount: upcomingBooking.courtCost },
                          { description: 'Equipamiento incluido: red, pelotas y raquetas', amount: 0 },
                          { description: `Total Turno`, amount: upcomingBooking.totalCost },
                          { description: `Seña 50% Abonada`, amount: upcomingBooking.depositPaid }
                        ],
                        totalPaid: upcomingBooking.depositPaid,
                        paymentMethod: upcomingBooking.depositPaymentMethod,
                        date: upcomingBooking.date + ' ' + upcomingBooking.startTime
                      })}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-bold text-xs border border-tennis-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      Ver comprobante
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mb-3">No tenés reservas pendientes para hoy.</p>
                <Link
                  to={paths.appReservas}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tennis-600 text-white font-bold text-xs hover:bg-tennis-700"
                >
                  Buscar Canchas Disponibles
                </Link>
              </div>
            )}
          </div>

          {/* Cancellation Policy Banner */}
          <div className="p-4 bg-tennis-50/70 border border-tennis-200 rounded-2xl flex items-start gap-3 text-xs text-tennis-900">
            <div>
              <strong className="block font-bold">Política de Reserva y Cancelación:</strong>
              Para confirmar una cancha se abona el 50% de seña. Las cancelaciones efectuadas con un mínimo de <strong>{clubConfig.freeCancellationHours} horas de antelación</strong> contemplan reembolso conforme al reglamento del club.
            </div>
          </div>

        </div>

        {/* Right Column: Court Surfaces status overview */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">Nuestras Canchas</h2>
              <Link to={paths.appReservas} className="text-xs font-bold text-tennis-600 hover:underline">
                Ver todas
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {courts.slice(0, 4).map(court => (
                <div key={court.id} className="py-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500">
                        {court.surfaceType}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{court.name.split('-')[0]}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Capacidad: {court.capacity} jugadores ({court.capacity === 4 ? 'Dobles' : 'Singles'})
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] font-bold ${
                      court.status === 'disponible' 
                        ? 'text-tennis-700' 
                        : court.status === 'mantenimiento'
                        ? 'text-slate-700'
                        : 'text-slate-600'
                    }`}>
                      {court.status === 'disponible' ? 'Libre' : court.status === 'mantenimiento' ? 'Mantenimiento' : 'Ocupada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <Link
                to={paths.appReservas}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-700 font-bold text-xs transition-colors flex items-center justify-center gap-1"
              >
                Consultar Grilla de Horarios
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

      {/* Cancellation Modal: antelación en tiempo real contra el plazo del club */}
      {showCancelModal && upcomingBooking && (() => {
        const hoursLeft = calculateHoursUntil(upcomingBooking.date, upcomingBooking.startTime);
        const isEligibleForRefund = hoursLeft >= clubConfig.freeCancellationHours;

        return (
          <Modal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            title="Cancelar Reserva de Cancha"
            maxWidth="max-w-md"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">{upcomingBooking.courtName}</div>
                <div className="text-slate-600">Fecha y Horario: <strong>{upcomingBooking.date} a las {upcomingBooking.startTime} hs</strong></div>
                <div className="text-slate-600">Seña abonada: <strong>${upcomingBooking.depositPaid?.toLocaleString('es-AR')}</strong></div>
              </div>

              {/* Real-time hours indicator */}
              <div className="p-3 rounded-xl border space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-500">Antelación al inicio del partido:</span>
                  <span className={`text-[11px] ${
                    isEligibleForRefund ? 'text-tennis-800' : 'text-slate-800'
                  }`}>
                    {formatHoursMinutes(hoursLeft)}
                  </span>
                </div>

                {isEligibleForRefund ? (
                  <div className="p-2.5 bg-tennis-50 rounded-lg border border-tennis-200 text-tennis-800 space-y-1">
                    <strong className="flex items-center gap-1 font-bold">
                      Cancelación dentro del plazo (&ge; {clubConfig.freeCancellationHours} hs)
                    </strong>
                    <p className="text-[11px]">
                      Corresponde el <strong>reintegro total del 100%</strong> de la seña abonada (${upcomingBooking.depositPaid?.toLocaleString('es-AR')}) conforme a la política del club.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 space-y-1">
                    <strong className="flex items-center gap-1 font-bold">
                      Cancelación fuera de término (&lt; {clubConfig.freeCancellationHours} hs)
                    </strong>
                    <p className="text-[11px]">
                      Se aplicará la <strong>retención del {clubConfig.lateCancellationRetentionPercent}% de la seña</strong> (${Math.round((upcomingBooking.depositPaid || 0) * clubConfig.lateCancellationRetentionPercent / 100).toLocaleString('es-AR')}) en concepto de costos operativos y penalidad por falta de preaviso.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Volver atrás
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl"
                >
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Official Member Card Modal  */}
      <MemberCardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        member={user}
      />

    </div>
  );
}
