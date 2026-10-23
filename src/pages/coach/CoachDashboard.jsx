import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coachesAndClassesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AttendanceMatrixModal from '../../components/common/AttendanceMatrixModal';
import AttendanceSheetModal from '../../components/common/AttendanceSheetModal';
import CoachCredentialsModal from '../../components/common/CoachCredentialsModal';

export default function CoachDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [privateLessons, setPrivateLessons] = useState([]);
  const [coachProfile, setCoachProfile] = useState(null);

  // Modal states
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [selectedClassForSheet, setSelectedClassForSheet] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  useEffect(() => {
    loadCoachData();
  }, [user]);

  const loadCoachData = async () => {
    const [clRes, prvRes, cRes] = await Promise.all([
      coachesAndClassesService.getClasses(),
      coachesAndClassesService.getPrivateClasses(),
      coachesAndClassesService.getCoaches()
    ]);

    // Match coach by name or ID (fallback to first coach)
    const currentCoach = cRes.data.find(c => c.name === user?.name || c.id === 'coach-01') || cRes.data[0];
    setCoachProfile(currentCoach);

    // Classes assigned to this coach
    const myClasses = clRes.data.filter(c => c.coachId === currentCoach?.id || c.coachName === currentCoach?.name);
    setClasses(myClasses.length > 0 ? myClasses : clRes.data);

    // Private lessons for this coach
    const myLessons = prvRes.data.filter(p => p.coachId === currentCoach?.id || p.coachName === currentCoach?.name);
    setPrivateLessons(myLessons.length > 0 ? myLessons : prvRes.data);
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

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-tennis-700 uppercase tracking-wider block">
            Bienvenido, {coachProfile?.name || user?.name || 'Prof. Santiago Álvarez'}
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Agenda del Día y Panel de Clases
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCredentialsModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            Ver Mi Título Habilitante
          </button>
          <Link
            to="/coach/reservas"
            className="px-3.5 py-2 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            Reservar Cancha
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Comisiones a Cargo</span>
          <div className="text-2xl font-bold text-slate-900">{classes.length}</div>
          <span className="text-[11px] text-slate-500">Escuela oficial del club</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Turnos Particulares</span>
          <div className="text-2xl font-bold text-slate-900">{privateLessons.length}</div>
          <span className="text-[11px] text-slate-500">Agendados en la semana</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Alumnos Activos</span>
          <div className="text-2xl font-bold text-slate-900">
            {classes.reduce((acc, c) => acc + (c.students?.length || 0), 0)}
          </div>
          <span className="text-[11px] text-slate-500">En comisiones grupales</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Certificación Oficial</span>
          <div className="text-sm font-bold text-tennis-700 flex items-center gap-1 pt-1">
            Habilitado AAT
          </div>
          <span className="text-[11px] text-slate-500">Matrícula vigente 2029</span>
        </div>

      </div>

      {/* Main Grid: My Group Classes & Today's Private Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Group Classes (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Mis Clases Grupales y Escuela</h2>
            </div>
            <Link
              to="/coach/clases"
              className="text-xs font-semibold text-tennis-700 hover:text-tennis-800 flex items-center gap-1"
            >
              Ver todas
            </Link>
          </div>

          <div className="space-y-4">
            {classes.map(cls => {
              const students = cls.students || [];
              const count = students.length;
              const isFull = count >= 30;

              return (
                <div key={cls.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {cls.courtAssigned}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{cls.name}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {cls.scheduleDays} • {cls.scheduleTime}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800">
                        {count} / {cls.maxCapacity || 30} Alumnos
                      </span>
                      {isFull && (
                        <span className="text-[10px] text-slate-500 block font-medium">Cupo lleno</span>
                      )}
                    </div>
                  </div>

                  {/* Actions for class */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedClassForAttendance(cls)}
                      className="flex-1 py-2 px-3 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      Tomar Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedClassForSheet(cls)}
                      className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      Planilla A4
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Private Lessons & Quick Hours (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Private Lessons Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Turnos Particulares</h2>
              </div>
              <Link
                to="/coach/particulares"
                className="text-xs font-semibold text-tennis-700 hover:text-tennis-800 flex items-center gap-1"
              >
                Agenda
              </Link>
            </div>

            <div className="space-y-3">
              {privateLessons.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  No se registran turnos particulares para los próximos días.
                </div>
              ) : (
                privateLessons.map(prv => (
                  <div key={prv.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">{prv.studentName}</span>
                      <span className="text-[11px] font-medium text-slate-600">
                        ${prv.hourlyRate?.toLocaleString('es-AR')}/h
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center justify-between">
                      <span>{prv.date} • {prv.time}</span>
                      <span className="font-medium text-slate-700">{prv.courtAssigned}</span>
                    </div>

                    {prv.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {prv.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Availability Summary Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Disponibilidad Horaria Semanal
              </span>
              <Link
                to="/coach/perfil"
                className="text-xs font-semibold text-tennis-700 hover:underline"
              >
                Modificar
              </Link>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              {coachProfile?.availableHours || 'Lunes a Viernes 08:00 - 13:00, 16:00 - 21:00'}
            </p>
          </div>

        </div>

      </div>

      {/* Attendance Matrix Modal */}
      <AttendanceMatrixModal
        isOpen={!!selectedClassForAttendance}
        onClose={() => setSelectedClassForAttendance(null)}
        classItem={selectedClassForAttendance}
        onToggleAttendance={handleToggleAttendance}
        onBulkMark={handleBulkMark}
        onEnrollStudent={async (classId, studentData) => {
          await coachesAndClassesService.enrollStudent(classId, studentData);
          const clRes = await coachesAndClassesService.getClasses();
          setClasses(clRes.data);
          const updated = clRes.data.find(c => c.id === classId);
          if (updated) setSelectedClassForAttendance(updated);
        }}
        onOpenPrintSheet={(cls) => setSelectedClassForSheet(cls)}
      />

      {/* Printable Sheet Modal */}
      <AttendanceSheetModal
        isOpen={!!selectedClassForSheet}
        onClose={() => setSelectedClassForSheet(null)}
        classItem={selectedClassForSheet}
      />

      {/* Coach Credentials Modal */}
      <CoachCredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        coach={coachProfile}
      />

    </div>
  );
}
