import React, { useState, useEffect } from 'react';
import { coachesAndClassesService } from '../../services/api';
import { 
  GraduationCap, 
  Award, 
  Users, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  UserCheck, 
  Star 
} from 'lucide-react';
import CoachCredentialsModal from '../../components/common/CoachCredentialsModal';
import Modal from '../../components/common/Modal';

export default function ClientClassesPage() {
  const [coaches, setCoaches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCoachForModal, setSelectedCoachForModal] = useState(null);
  
  // Private lesson request modal
  const [privateLessonCoach, setPrivateLessonCoach] = useState(null);
  const [privateLessonNotes, setPrivateLessonNotes] = useState('');
  const [privateSuccess, setPrivateSuccess] = useState(false);

  useEffect(() => {
    coachesAndClassesService.getCoaches().then(res => setCoaches(res.data));
    coachesAndClassesService.getClasses().then(res => setClasses(res.data));
  }, []);

  const handleRequestPrivateLesson = (e) => {
    e.preventDefault();
    setPrivateSuccess(true);
    setTimeout(() => {
      setPrivateSuccess(false);
      setPrivateLessonCoach(null);
      alert('¡Solicitud de clase particular enviada! El profesor se comunicará para coordinar el horario en cancha.');
    }, 1000);
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Clases, Entrenamientos & Profesores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Escuela de tenis para adultos y menores. Todos los profesores cuentan con <strong>Título Habilitante AAT / ITF</strong> verificado. Cupo máximo de 30 alumnos por clase.
          </p>
        </div>
      </div>

      {/* Staff de Profesores & Entrenadores Habilitados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-tennis-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Staff de Profesores Habilitados</h2>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Certificaciones 100% Verificadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coaches.map(coach => (
            <div key={coach.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-4">
                <img
                  src={coach.photo}
                  alt={coach.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-tennis-500 shadow-sm shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">{coach.name}</h3>
                  </div>
                  <p className="text-xs text-tennis-700 font-semibold">{coach.specialty}</p>
                  <p className="text-xs text-slate-500 mt-1">{coach.bio}</p>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {coach.experienceYears} años exp.
                    </span>
                    <span className="text-[11px] font-bold text-tennis-800 bg-tennis-50 px-2 py-0.5 rounded-md border border-tennis-200">
                      ${coach.hourlyRatePrivate?.toLocaleString('es-AR')}/h clase particular
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & License highlight pill */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-800 block">{coach.licenseDetails?.titleName}</span>
                    <span className="text-[10px] text-slate-400">Matrícula: {coach.licenseDetails?.licenseNumber}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCoachForModal(coach)}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-tennis-50 text-tennis-700 font-bold text-xs border border-slate-200 transition-colors shrink-0"
                >
                  Ver Título Habilitante
                </button>
              </div>

              {/* Actions */}
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPrivateLessonCoach(coach)}
                  className="w-full py-2.5 px-3 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Solicitar Clase Particular
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
            <GraduationCap className="w-5 h-5 text-tennis-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Clases Grupales Regulares</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Cupo máximo configurable: 30 alumnos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map(cls => (
            <div key={cls.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-tennis-100 text-tennis-800">
                    Clase Grupal
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">{cls.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Cuota Mensual</span>
                  <span className="text-base font-black text-slate-900">${cls.monthlyFee?.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Profesor a Cargo:</span>
                  <span className="font-bold text-slate-800">{cls.coachName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cancha Asignada:</span>
                  <span className="font-bold text-slate-800">{cls.courtAssigned}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Días y Horarios:</span>
                  <span className="font-bold text-slate-800">{cls.scheduleDays} • {cls.scheduleTime}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cupo de Alumnos:</span>
                  <span className="font-bold text-tennis-700">{cls.currentEnrolled} de {cls.maxCapacity} máx.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert(`Inscripción registrada a ${cls.name}. La cuota mensual se registrará en tu cuenta.`)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Inscribirme a esta Clase
              </button>
            </div>
          ))}
        </div>
      </div>

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
        title={`Solicitud de Clase Particular con ${privateLessonCoach?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRequestPrivateLesson} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800">Tarifa por Hora: ${privateLessonCoach?.hourlyRatePrivate?.toLocaleString('es-AR')}</div>
            <div className="text-slate-500 mt-1">Incluye profesor con Título Habilitante y canchas exclusivas del club.</div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">
              Preferencias de Días y Horarios o Nivel Actual *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ej: Lunes o Miércoles a partir de las 18 hs. Busco mejorar mi revés con top-spin..."
              value={privateLessonNotes}
              onChange={(e) => setPrivateLessonNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={privateSuccess}
            className="w-full py-3 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-sm shadow-md"
          >
            {privateSuccess ? 'Enviando solicitud...' : 'Enviar Solicitud al Profesor'}
          </button>
        </form>
      </Modal>

    </div>
  );
}
