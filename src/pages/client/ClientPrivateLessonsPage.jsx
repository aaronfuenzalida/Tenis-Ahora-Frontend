import React, { useState, useEffect } from 'react';
import { coachesAndClassesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import CoachCredentialsModal from '../../components/common/CoachCredentialsModal';
import Modal from '../../components/common/Modal';
import PaymentFlowModal from '../../components/common/PaymentFlowModal';
import { findPrivateLessonConflict } from '../../utils/formatters';

/**
 * Clases particulares con profesores y entrenamientos particulares con entrenadores.
 * El turno se registra cuando el pago queda acreditado.
 */
export default function ClientPrivateLessonsPage() {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [coaches, setCoaches] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [myLessons, setMyLessons] = useState([]);
  const [coachForCredentials, setCoachForCredentials] = useState(null);

  const [requestCoach, setRequestCoach] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('11:00 - 12:00');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState(null); // { coach, date, time, notes }

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [cRes, pRes] = await Promise.all([
      coachesAndClassesService.getCoaches(),
      coachesAndClassesService.getPrivateClasses()
    ]);
    setCoaches(cRes.data);
    setAllLessons(pRes.data || []);
    setMyLessons((pRes.data || []).filter(p => !user?.dni || p.studentDni === user.dni));
  };

  // Un turno repetido es el mismo día y horario: del socio con cualquier docente, o del docente con otro socio.
  const conflictMessage = ({ coach, date: d, time: t }) => {
    const clash = findPrivateLessonConflict(allLessons, { coachId: coach?.id, studentDni: user?.dni, date: d, time: t });
    if (!clash) return null;
    const mine = user?.dni && (clash.studentDni || '').replace(/\D/g, '') === String(user.dni).replace(/\D/g, '');
    return mine
      ? `Ya tenés un turno el ${clash.date} a las ${clash.time} con ${clash.coachName}.`
      : `${coach.name} ya tiene un turno el ${clash.date} a las ${clash.time}. Elegí otro horario.`;
  };

  const handleRequest = (e) => {
    e.preventDefault();
    if (!requestCoach) return;
    const msg = conflictMessage({ coach: requestCoach, date, time });
    if (msg) {
      notify({ variant: 'warning', message: msg });
      return;
    }
    setPayment({ coach: requestCoach, date, time, notes });
    setRequestCoach(null);
  };

  const settleAfterPayment = async () => {
    if (!payment) return null;
    const msg = conflictMessage(payment);
    if (msg) throw new Error(msg);
    const coach = payment.coach;
    const res = await coachesAndClassesService.createPrivateClass({
      coachId: coach.id,
      coachName: coach.name,
      // Un profesor da clases y un entrenador, entrenamientos.
      kind: coach.type === 'Entrenador' ? 'entrenamiento' : 'clase',
      studentName: user?.name,
      studentDni: user?.dni,
      studentPhone: user?.phone,
      date: payment.date,
      time: payment.time,
      courtAssigned: 'Cancha 1 (Ladrillo)',
      hourlyRate: coach.hourlyRatePrivate || 6000,
      notes: payment.notes,
      status: 'programada'
    });
    return { relatedId: res?.data?.id || coach.id };
  };

  const handlePaymentClosed = async (receipt) => {
    const paid = payment;
    setPayment(null);
    if (!receipt || !paid) return;
    setNotes('');
    await load();
    notify({ variant: 'success', title: 'Turno confirmado', message: `Tu turno con ${paid.coach.name} quedó registrado para el ${paid.date} a las ${paid.time}.` });
  };

  const labelFor = (coach) => (coach?.type === 'Entrenador' ? 'Entrenamiento particular' : 'Clase particular');
  const rate = Number(payment?.coach?.hourlyRatePrivate) || 6000;

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clases Particulares</h1>
      </div>

      {/* Mis turnos */}
      {myLessons.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 text-sm font-bold text-slate-900">Mis turnos</div>
          <div className="divide-y divide-slate-100">
            {myLessons.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{p.coachName}</div>
                  <div className="text-slate-500">{p.date} • {p.time} • {p.courtAssigned}</div>
                </div>
                <span className={`font-semibold ${p.status === 'cancelada' ? 'text-slate-400' : 'text-tennis-700'}`}>
                  {p.status === 'cancelada' ? 'Cancelada' : p.status === 'finalizada' ? 'Finalizada' : p.status === 'confirmada' ? 'Confirmada' : 'Programada'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profesores y entrenadores */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Profesores y entrenadores</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map(coach => (
            <div key={coach.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <img src={coach.photo} alt={coach.name} className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">{coach.type || 'Profesor'}</span>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{coach.name}</h3>
                    <p className="text-xs text-tennis-700 font-medium">{coach.specialty}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{coach.experienceYears} años de trayectoria</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{coach.bio}</p>

                <div className="text-xs text-slate-600 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>{labelFor(coach)}:</span>
                  <strong className="text-slate-900">${coach.hourlyRatePrivate?.toLocaleString('es-AR')}/h</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => setCoachForCredentials(coach)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors"
                >
                  Ver certificación
                </button>
                <button
                  type="button"
                  onClick={() => setRequestCoach(coach)}
                  className="w-full py-2 px-3 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  Pedir turno
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CoachCredentialsModal isOpen={!!coachForCredentials} onClose={() => setCoachForCredentials(null)} coach={coachForCredentials} />

      <PaymentFlowModal
        isOpen={!!payment}
        onClose={handlePaymentClosed}
        title={`Pago de ${labelFor(payment?.coach).toLowerCase()}`}
        concept={payment ? `${labelFor(payment.coach)} con ${payment.coach.name}` : ''}
        summary={payment ? `${payment.date} • ${payment.time}` : ''}
        amount={rate}
        items={payment ? [{ description: `${labelFor(payment.coach)}, 1 hora - ${payment.coach.name}`, amount: rate }] : []}
        client={{ name: user?.name, dni: user?.dni }}
        relatedId={payment?.coach?.id}
        kind="turno-particular"
        onPaid={settleAfterPayment}
      />

      {/* Pedido de turno */}
      <Modal
        isOpen={!!requestCoach}
        onClose={() => setRequestCoach(null)}
        title={`${labelFor(requestCoach)} con ${requestCoach?.name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRequest} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-800">
              Arancel: ${requestCoach?.hourlyRatePrivate?.toLocaleString('es-AR')} por hora
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Horario</label>
              <input
                type="text"
                required
                placeholder="10:00 - 11:00"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Objetivo o nivel de juego</label>
            <textarea
              required
              rows={3}
              placeholder="Ej.: trabajar el revés y el saque"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={!!payment}
            className="w-full py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm"
          >
            Continuar al pago
          </button>
        </form>
      </Modal>
    </div>
  );
}
