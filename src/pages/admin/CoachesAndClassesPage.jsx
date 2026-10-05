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
import AttendanceSheetModal from '../../components/common/AttendanceSheetModal';
import AttendanceMatrixModal from '../../components/common/AttendanceMatrixModal';
import Modal from '../../components/common/Modal';

export default function CoachesAndClassesPage() {
  const [coaches, setCoaches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCoachForModal, setSelectedCoachForModal] = useState(null);
  
  // Attendance taker state
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [selectedClassForSheet, setSelectedClassForSheet] = useState(null);

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

  const handleToggleAttendance = async (classId, studentId, sessionIndex) => {
    await coachesAndClassesService.toggleStudentAttendance(classId, studentId, sessionIndex);
    const clRes = await coachesAndClassesService.getClasses();
    setClasses(clRes.data);
    const updated = clRes.data.find(c => c.id === classId);
    if (updated) setSelectedClassForAttendance(updated);
  };

  const handleBulkMark = async (classId, sessionIndex, status) => {
    await coachesAndClassesService.bulkMarkSession(classId, sessionIndex, status);
    const clRes = await coachesAndClassesService.getClasses();
    setClasses(clRes.data);
    const updated = clRes.data.find(c => c.id === classId);
    if (updated) setSelectedClassForAttendance(updated);
  };

  const handleEnrollStudent = async (classId, studentData) => {
    try {
      await coachesAndClassesService.enrollStudent(classId, studentData);
      const clRes = await coachesAndClassesService.getClasses();
      setClasses(clRes.data);
      const updated = clRes.data.find(c => c.id === classId);
      if (updated) setSelectedClassForAttendance(updated);
      alert(`¡Alumno ${studentData.name} inscripto exitosamente!`);
    } catch (err) {
      alert(err.message || 'Error al inscribir alumno.');
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (newClass.maxCapacity > 30) {
      alert('Por reglamento del club (RF067), el cupo no puede superar los 30 alumnos.');
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => {
            const isFull = (cls.currentEnrolled || cls.students?.length || 0) >= 30;
            const studentsList = cls.students || [];
            const regularCount = studentsList.filter(st => {
              const att = st.attendance || [];
              const p = att.filter(a => a === 'P').length;
              const evalCount = att.filter(a => a === 'P' || a === 'A' || a === 'J').length;
              return evalCount > 0 ? (p / evalCount) >= 0.75 : true;
            }).length;

            return (
              <div key={cls.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-tennis-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-tennis-100 text-tennis-900">
                      Escuela Oficial
                    </span>
                    {isFull ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                        ⚠️ Cupo Lleno (30/30)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-tennis-800 bg-tennis-50 px-2 py-0.5 rounded-md border border-tennis-200">
                        {cls.currentEnrolled || studentsList.length} / {cls.maxCapacity || 30} Alumnos
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-sm text-slate-900 line-clamp-1">{cls.name}</h3>

                  <div className="text-xs text-slate-500 space-y-1 pt-1">
                    <div>Profesor: <strong className="text-slate-800">{cls.coachName}</strong></div>
                    <div>Horarios: <strong className="text-slate-800">{cls.scheduleDays} {cls.scheduleTime}</strong></div>
                    <div>Cancha: <strong className="text-slate-800">{cls.courtAssigned}</strong></div>
                  </div>

                  {/* Attendance quick KPI */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Regularidad:</span>
                    <strong className="text-emerald-700">
                      {regularCount}/{studentsList.length} Regulares ({studentsList.length > 0 ? Math.round((regularCount / studentsList.length) * 100) : 100}%)
                    </strong>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedClassForAttendance(cls)}
                    className="w-full py-2.5 px-3 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Abrir Matriz de Asistencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClassForSheet(cls)}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    Imprimir Planilla A4
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Visual Attendance Matrix Modal (RF078 a RF085 & RF067) */}
      <AttendanceMatrixModal
        isOpen={!!selectedClassForAttendance}
        onClose={() => setSelectedClassForAttendance(null)}
        classItem={selectedClassForAttendance}
        onToggleAttendance={handleToggleAttendance}
        onBulkMark={handleBulkMark}
        onEnrollStudent={handleEnrollStudent}
        onOpenPrintSheet={(cls) => setSelectedClassForSheet(cls)}
      />

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

      {/* Printable Attendance Sheet Modal */}
      <AttendanceSheetModal
        isOpen={!!selectedClassForSheet}
        onClose={() => setSelectedClassForSheet(null)}
        classItem={selectedClassForSheet}
      />

    </div>
  );
}
