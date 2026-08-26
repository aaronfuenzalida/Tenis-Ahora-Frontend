import React, { useState, useEffect } from 'react';
import { coachesAndClassesService } from '../../services/api';
import { 
  GraduationCap, 
  Award, 
  Users, 
  CheckCircle2, 
  Plus, 
  Printer, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Edit3,
  UserCheck,
  Clock
} from 'lucide-react';
import CoachCredentialsModal from '../../components/common/CoachCredentialsModal';
import Modal from '../../components/common/Modal';

export default function CoachesAndClassesPage() {
  const [coaches, setCoaches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCoachForModal, setSelectedCoachForModal] = useState(null);
  
  // Attendance taker state
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);

  // Add Class Modal
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    coachId: '',
    coachName: '',
    scheduleDays: 'Martes y Jueves',
    scheduleTime: '18:00 - 19:30',
    courtAssigned: 'Cancha 1 (Ladrillo)',
    maxCapacity: 30, // Max 30 students limit requirement
    monthlyFee: 16000
  });

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
    if (cRes.data.length > 0 && !newClass.coachId) {
      setNewClass(prev => ({
        ...prev,
        coachId: cRes.data[0].id,
        coachName: cRes.data[0].name
      }));
    }
  };

  const handleRecordAttendance = async (studentId, status) => {
    await coachesAndClassesService.recordAttendance(selectedClassForAttendance.id, studentId, status);
    loadData();
    // Update local modal state
    setSelectedClassForAttendance(prev => ({
      ...prev,
      students: prev.students.map(st => st.id === studentId ? { ...st, attendance: [...st.attendance, status] } : st)
    }));
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (newClass.maxCapacity > 30) {
      alert('Por reglamento del club, el cupo no puede superar los 30 alumnos.');
      return;
    }
    const coachObj = coaches.find(c => c.id === newClass.coachId);
    await coachesAndClassesService.addClass({
      ...newClass,
      coachName: coachObj ? coachObj.name : 'Profesor Asignado'
    });
    setShowAddClassModal(false);
    loadData();
    alert('¡Clase programada exitosamente!');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Profesores, Título Habilitante y Asistencia
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Validación obligatoria de certificaciones deportivas AAT, programación de clases (máx 30 alumnos) y planilla de asistencias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Planilla
          </button>
          <button
            type="button"
            onClick={() => setShowAddClassModal(true)}
            className="px-4 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-md hover:shadow-glow-green flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Programar Clase
          </button>
        </div>
      </div>

      {/* Mandatory Title Banner */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <strong>Requisito Obligatorio del Club:</strong> Todos los profesores registrados deben poseer el Título Habilitante y Certificación Deportiva verificado en el sistema antes de impartir clases o entrenamientos.
        </div>
      </div>

      {/* Coaches Management Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900">Padrón de Profesores y Entrenadores</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coaches.map(coach => (
            <div key={coach.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start gap-4">
                <img
                  src={coach.photo}
                  alt={coach.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-tennis-500 shadow-sm shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">{coach.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Habilitado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">DNI: {coach.dni} • Tel: {coach.phone}</p>
                  <p className="text-xs text-tennis-700 font-semibold mt-1">{coach.specialty}</p>
                </div>
              </div>

              {/* License box */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{coach.licenseDetails?.titleName}</span>
                  <span className="text-[10px] text-slate-400">
                    {coach.licenseDetails?.institution} • Reg: <strong>{coach.licenseDetails?.licenseNumber}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCoachForModal(coach)}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-tennis-50 text-tennis-800 font-bold text-xs border border-slate-200 shrink-0"
                >
                  Ver Ficha Oficial
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Classes & Attendance Sheet */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Clases Grupales & Toma de Asistencias</h2>
            <p className="text-xs text-slate-500">Límite reglamentario: hasta 30 alumnos por clase</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">{cls.name}</h3>
                <span className="text-xs font-bold text-tennis-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {cls.currentEnrolled} / {cls.maxCapacity} Alumnos
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>Profesor: <strong className="text-slate-800">{cls.coachName}</strong></div>
                <div>Horarios: <strong className="text-slate-800">{cls.scheduleDays} {cls.scheduleTime}</strong></div>
                <div>Cancha: <strong className="text-slate-800">{cls.courtAssigned}</strong></div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClassForAttendance(cls)}
                  className="w-full py-2 px-3 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Abrir Planilla de Asistencia
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Modal */}
      <Modal
        isOpen={!!selectedClassForAttendance}
        onClose={() => setSelectedClassForAttendance(null)}
        title={`Planilla de Asistencia: ${selectedClassForAttendance?.name}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
            <div>
              <div className="font-bold text-slate-800">Profesor: {selectedClassForAttendance?.coachName}</div>
              <div className="text-slate-500">Cancha: {selectedClassForAttendance?.courtAssigned}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-tennis-700">{selectedClassForAttendance?.scheduleDays}</div>
              <div className="text-slate-400">{selectedClassForAttendance?.scheduleTime}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                  <th className="py-2 px-2">Alumno</th>
                  <th className="py-2 px-2">DNI</th>
                  <th className="py-2 px-2 text-center">Historial</th>
                  <th className="py-2 px-2 text-right">Tomar Asistencia Hoy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedClassForAttendance?.students?.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2 font-bold text-slate-800">{st.name}</td>
                    <td className="py-2 px-2 text-slate-500">{st.dni}</td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {st.attendance.map((att, aIdx) => (
                          <span
                            key={aIdx}
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              att === 'P' ? 'bg-emerald-100 text-emerald-800' : att === 'A' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {att}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRecordAttendance(st.id, 'P')}
                          className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700"
                        >
                          P (Presente)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRecordAttendance(st.id, 'A')}
                          className="px-2 py-1 rounded bg-red-500 text-white font-bold text-[10px] hover:bg-red-600"
                        >
                          A (Ausente)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRecordAttendance(st.id, 'J')}
                          className="px-2 py-1 rounded bg-amber-500 text-white font-bold text-[10px] hover:bg-amber-600"
                        >
                          J (Justif.)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setSelectedClassForAttendance(null)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
            >
              Guardar y Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Class Modal */}
      <Modal
        isOpen={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
        title="Programar Nueva Clase Grupal"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Nombre de la Clase *</label>
            <input
              type="text"
              required
              placeholder="Escuela Juvenil Avanzada"
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Profesor Habilitado *</label>
              <select
                value={newClass.coachId}
                onChange={(e) => {
                  const sel = coaches.find(c => c.id === e.target.value);
                  setNewClass({
                    ...newClass,
                    coachId: e.target.value,
                    coachName: sel ? sel.name : ''
                  });
                }}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white font-bold"
              >
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Cupo Máximo (≤30) *</label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={newClass.maxCapacity}
                onChange={(e) => setNewClass({ ...newClass, maxCapacity: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Días de Cursada *</label>
              <input
                type="text"
                placeholder="Lunes y Miércoles"
                value={newClass.scheduleDays}
                onChange={(e) => setNewClass({ ...newClass, scheduleDays: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Horario *</label>
              <input
                type="text"
                placeholder="18:00 - 19:30"
                value={newClass.scheduleTime}
                onChange={(e) => setNewClass({ ...newClass, scheduleTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Cuota Mensual (ARS) *</label>
            <input
              type="number"
              required
              value={newClass.monthlyFee}
              onChange={(e) => setNewClass({ ...newClass, monthlyFee: Number(e.target.value) })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddClassModal(false)}
              className="px-3 py-2 text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl"
            >
              Crear Clase
            </button>
          </div>
        </form>
      </Modal>

      {/* Teacher Title Modal */}
      <CoachCredentialsModal
        isOpen={!!selectedCoachForModal}
        onClose={() => setSelectedCoachForModal(null)}
        coach={selectedCoachForModal}
      />

    </div>
  );
}
