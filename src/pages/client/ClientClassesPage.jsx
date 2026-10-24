import React, { useState, useEffect } from 'react';
import { coachesAndClassesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CoachCredentialsModal from '../../components/common/CoachCredentialsModal';
import Modal from '../../components/common/Modal';
import PaymentFlowModal from '../../components/common/PaymentFlowModal';
import { useFeedback } from '../../context/FeedbackContext';

export default function ClientClassesPage() {
  const { user } = useAuth();
  const { notify } = useFeedback();
  // Pago pendiente: { kind: 'clase' | 'particular', ... }
  const [payment, setPayment] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCoachForModal, setSelectedCoachForModal] = useState(null);
  
  // Private lesson request modal
  const [privateLessonCoach, setPrivateLessonCoach] = useState(null);
  const [privateLessonDate, setPrivateLessonDate] = useState('2026-10-22');
  const [privateLessonTime, setPrivateLessonTime] = useState('11:00 - 12:00');
  const [privateLessonNotes, setPrivateLessonNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [cRes, clRes] = await Promise.all([
      coachesAndClassesService.getCoaches(),
      coachesAndClassesService.getClasses()
    ]);
    setCoaches(cRes.data);
    setClasses(clRes.data);
  };

  // Inscribirse a una clase o entrenamiento grupal lleva al pago de la cuota; la inscripción se
  // registra cuando el pago queda acreditado.
  const handleEnrollGroupClass = (cls) => {
    setPayment({ kind: 'clase', cls });
  };

  const handleRequestPrivateLesson = (e) => {
    e.preventDefault();
    if (!privateLessonCoach) return;
    setPayment({
      kind: 'particular',
      coach: privateLessonCoach,
      date: privateLessonDate,
      time: privateLessonTime,
      notes: privateLessonNotes
    });
    setPrivateLessonCoach(null);
  };

  const settleAfterPayment = async () => {
    if (!payment) return null;
    if (payment.kind === 'clase') {
      await coachesAndClassesService.enrollStudent(payment.cls.id, {
        name: user?.name,
        dni: user?.dni,
        phone: user?.phone
      });
      return { relatedId: payment.cls.id };
    }
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
    if (paid.kind === 'clase') {
      await loadData();
      notify({ variant: 'success', title: 'Inscripción confirmada', message: `Quedaste inscripto en "${paid.cls.name}". El recibo ${receipt.id} ya figura en Mis Pagos y Recibos.` });
    } else {
      setPrivateLessonNotes('');
      notify({ variant: 'success', title: 'Turno particular reservado', message: `Tu turno con ${paid.coach.name} quedó registrado para el ${paid.date} (${paid.time}). El docente coordinará los detalles en cancha.` });
    }
  };

  const paymentProps = (() => {
    if (!payment) return { concept: '', amount: 0, items: [] };
    if (payment.kind === 'clase') {
      const fee = Number(payment.cls.monthlyFee) || 0;
      return {
        title: 'Pago de cuota de la clase',
        concept: `Cuota mensual - ${payment.cls.name}`,
        summary: `${payment.cls.coachName} • ${payment.cls.scheduleDays} ${payment.cls.scheduleTime}`,
        amount: fee,
        items: [{ description: `Cuota mensual - ${payment.cls.name}`, amount: fee }],
        relatedId: payment.cls.id,
        kind: 'inscripcion-clase'
      };
    }
    const rate = Number(payment.coach.hourlyRatePrivate) || 6000;
    const label = payment.coach.type === 'Entrenador' ? 'Entrenamiento particular' : 'Clase particular';
    return {
      title: `Pago de ${label.toLowerCase()}`,
      concept: `${label} con ${payment.coach.name}`,
      summary: `${payment.date} • ${payment.time}`,
      amount: rate,
      items: [{ description: `${label} (1 hora) - ${payment.coach.name}`, amount: rate }],
      relatedId: payment.coach.id,
      kind: 'turno-particular'
    };
  })();

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clases, Entrenamientos y Profesores
          </h1>
        </div>
      </div>

      {/* Staff de Profesores & Entrenadores Habilitados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Staff de Profesores y Entrenadores Habilitados</h2>
          </div>
          <span className="text-xs text-slate-600 font-semibold">
            Certificaciones Oficiales Verificadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map(coach => (
            <div key={coach.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <img
                    src={coach.photo}
                    alt={coach.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      {coach.type || 'Profesor'}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{coach.name}</h3>
                    <p className="text-xs text-tennis-700 font-medium">{coach.specialty}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{coach.experienceYears} años de trayectoria</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{coach.bio}</p>

                {/* Title & License pill */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Título Oficial</span>
                    <span className="text-xs font-semibold text-tennis-700 flex items-center gap-1">
                      Habilitado
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 line-clamp-1">{coach.licenseDetails?.titleName}</div>
                  <div className="text-[11px] text-slate-500">
                    Matrícula: {coach.licenseDetails?.licenseNumber}
                  </div>
                </div>

                <div className="text-xs text-slate-600 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Clase Particular:</span>
                  <strong className="text-slate-900">${coach.hourlyRatePrivate?.toLocaleString('es-AR')}/h</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedCoachForModal(coach)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 text-center transition-colors"
                >
                  Ver Ficha y Certificación
                </button>
                <button
                  type="button"
                  onClick={() => setPrivateLessonCoach(coach)}
                  className="w-full py-2 px-3 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  Solicitar Turno Particular
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clases y Entrenamientos Grupales */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Clases Grupales y Escuela del Club</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Tope reglamentario: 30 alumnos por clase</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(cls => {
            const enrolled = cls.students?.length || cls.currentEnrolled || 0;
            const isFull = enrolled >= 30;

            return (
              <div key={cls.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600 uppercase text-[10px]">
                      Escuela Oficial
                    </span>
                    <span className="font-semibold text-slate-800">
                      {enrolled} / {cls.maxCapacity || 30} Alumnos
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{cls.name}</h3>

                  <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600">
                    <div>Docente a Cargo: <strong className="text-slate-800">{cls.coachName}</strong></div>
                    <div>Días y Horarios: <strong className="text-slate-800">{cls.scheduleDays} {cls.scheduleTime}</strong></div>
                    <div>Cancha Asignada: <strong className="text-slate-800">{cls.courtAssigned}</strong></div>
                    <div>Cuota Mensual: <strong className="text-slate-900">${cls.monthlyFee?.toLocaleString('es-AR')}</strong></div>
                  </div>

                  {isFull && (
                    <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold text-center">
                      Cupo completo (30/30 alumnos). Inscripciones inhabilitadas.
                    </div>
                  )}
                </div>

                {isFull ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 px-3 rounded-xl bg-slate-200 text-slate-400 font-semibold text-xs cursor-not-allowed text-center"
                  >
                    Inscripción Inhabilitada (Cupo Lleno)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEnrollGroupClass(cls)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    Inscribirme y pagar la cuota
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pago de cuota o turno particular */}
      <PaymentFlowModal
        isOpen={!!payment}
        onClose={handlePaymentClosed}
        title={paymentProps.title}
        concept={paymentProps.concept}
        summary={paymentProps.summary}
        amount={paymentProps.amount}
        items={paymentProps.items}
        client={{ name: user?.name, dni: user?.dni }}
        relatedId={paymentProps.relatedId}
        kind={paymentProps.kind}
        onPaid={settleAfterPayment}
      />

      {/* Coach Certificate Viewer Modal */}
      <CoachCredentialsModal
        isOpen={!!selectedCoachForModal}
        onClose={() => setSelectedCoachForModal(null)}
        coach={selectedCoachForModal}
      />

      {/* Private Lesson Modal */}
      <Modal
        isOpen={!!privateLessonCoach}
        onClose={() => setPrivateLessonCoach(null)}
        title={`Solicitar Clase Particular con ${privateLessonCoach?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRequestPrivateLesson} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-800">
              Arancel Oficial: ${privateLessonCoach?.hourlyRatePrivate?.toLocaleString('es-AR')}/hora
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Docente con Título Habilitante y uso de canchas del complejo.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha Deseada *</label>
              <input
                type="date"
                required
                value={privateLessonDate}
                onChange={(e) => setPrivateLessonDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Horario Preferido *</label>
              <input
                type="text"
                required
                placeholder="10:00 - 11:00"
                value={privateLessonTime}
                onChange={(e) => setPrivateLessonTime(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">
              Objetivo Técnico o Nivel de Juego *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ej: Trabajo de revés y saque con top-spin..."
              value={privateLessonNotes}
              onChange={(e) => setPrivateLessonNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={!!payment}
            className="w-full py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm"
          >
            Continuar al pago del turno
          </button>
        </form>
      </Modal>

    </div>
  );
}
