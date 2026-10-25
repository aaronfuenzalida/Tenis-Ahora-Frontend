import React, { useState, useEffect } from 'react';
import { coachesAndClassesService } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../ui/FeedbackContext';
import PaymentFlowModal from '../caja/PaymentFlowModal';
import { isEnrolledByDni } from '../../utils/formatters';

/**
 * Clases y entrenamientos grupales. Inscribirse lleva al pago de la cuota; la inscripción se
 * registra cuando el pago queda acreditado.
 */
export default function ClientClassesPage() {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [classes, setClasses] = useState([]);
  const [kind, setKind] = useState('clase'); // 'clase' | 'entrenamiento'
  const [payment, setPayment] = useState(null); // { cls }

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await coachesAndClassesService.getClasses();
    setClasses(res.data);
  };

  // La API no le manda la lista de alumnos al socio, solo `enrolled`; el Modo Demo sí trae la lista.
  const alreadyIn = (cls) => !!cls?.enrolled || isEnrolledByDni(cls?.students, user?.dni);

  const startEnrollment = (cls) => {
    if (alreadyIn(cls)) {
      notify({ variant: 'warning', message: `Ya estás inscripto en "${cls.name}".` });
      return;
    }
    setPayment({ cls });
  };

  const settleAfterPayment = async () => {
    if (!payment) return null;
    if (alreadyIn(payment.cls)) throw new Error(`Ya estás inscripto en "${payment.cls.name}".`);
    await coachesAndClassesService.enrollStudent(payment.cls.id, { name: user?.name, dni: user?.dni, phone: user?.phone });
    return { relatedId: payment.cls.id };
  };

  const handlePaymentClosed = async (receipt) => {
    const paid = payment;
    setPayment(null);
    if (!receipt || !paid) return;
    await load();
    notify({ variant: 'success', title: 'Inscripción confirmada', message: `Quedaste inscripto en "${paid.cls.name}". El recibo ${receipt.id} ya figura en Mis Pagos y Recibos.` });
  };

  const visible = classes.filter(c => (c.kind || 'clase') === kind);
  const fee = Number(payment?.cls?.monthlyFee) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clases y Entrenamientos</h1>
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 self-start md:self-auto">
          {[['clase', 'Clases'], ['entrenamiento', 'Entrenamientos']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${kind === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          {kind === 'clase' ? 'No hay clases grupales abiertas.' : 'No hay entrenamientos grupales abiertos.'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map(cls => {
          const capacity = Math.min(Number(cls.maxCapacity) || 30, 30);
          const enrolled = cls.students?.length || cls.currentEnrolled || 0;
          const isFull = enrolled >= capacity;

          return (
            <div key={cls.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-semibold text-slate-600 uppercase text-[10px]">{kind === 'clase' ? 'Clase grupal' : 'Entrenamiento grupal'}</span>
                  <span className="font-semibold text-slate-800">{enrolled} / {capacity} alumnos</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-tight">{cls.name}</h3>

                <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600">
                  <div>Profesor: <strong className="text-slate-800">{cls.coachName}</strong></div>
                  <div>Días y horarios: <strong className="text-slate-800">{cls.scheduleDays} {cls.scheduleTime}</strong></div>
                  <div>Cancha: <strong className="text-slate-800">{cls.courtAssigned}</strong></div>
                  <div>Cuota mensual: <strong className="text-slate-900">${cls.monthlyFee?.toLocaleString('es-AR')}</strong></div>
                </div>
              </div>

              {alreadyIn(cls) ? (
                <div className="w-full py-2 px-3 rounded-xl bg-tennis-50 text-tennis-800 font-semibold text-xs text-center border border-tennis-200">
                  Ya estás inscripto
                </div>
              ) : isFull ? (
                <button type="button" disabled className="w-full py-2 px-3 rounded-xl bg-slate-200 text-slate-400 font-semibold text-xs cursor-not-allowed">
                  Cupo completo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startEnrollment(cls)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                >
                  Inscribirme y pagar la cuota
                </button>
              )}
            </div>
          );
        })}
      </div>

      <PaymentFlowModal
        isOpen={!!payment}
        onClose={handlePaymentClosed}
        title="Pago de la cuota"
        concept={payment ? `Cuota mensual - ${payment.cls.name}` : ''}
        summary={payment ? `${payment.cls.coachName} • ${payment.cls.scheduleDays} ${payment.cls.scheduleTime}` : ''}
        amount={fee}
        items={payment ? [{ description: `Cuota mensual - ${payment.cls.name}`, amount: fee }] : []}
        client={{ name: user?.name, dni: user?.dni }}
        relatedId={payment?.cls?.id}
        kind="inscripcion-clase"
        onPaid={settleAfterPayment}
      />
    </div>
  );
}
