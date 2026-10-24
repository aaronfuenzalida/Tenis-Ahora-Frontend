import React, { useState, useEffect } from 'react';
import { coachesAndClassesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AttendanceMatrixModal from '../../components/common/AttendanceMatrixModal';
import AttendanceSheetModal from '../../components/common/AttendanceSheetModal';
import Modal from '../../components/common/Modal';

export default function CoachClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [selectedClassForSheet, setSelectedClassForSheet] = useState(null);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState(null);

  useEffect(() => {
    loadClasses();
  }, [user]);

  const loadClasses = async () => {
    const clRes = await coachesAndClassesService.getClasses();
    const cRes = await coachesAndClassesService.getCoaches();
    const currentCoach = cRes.data.find(c => c.id === user?.coachId);

    const myClasses = clRes.data.filter(c => c.coachId === currentCoach?.id || c.coachName === currentCoach?.name);
    setClasses(myClasses.length > 0 ? myClasses : clRes.data);
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {user?.rolBackend === 'Entrenador' ? 'Mis Entrenamientos Asignados' : 'Mis Clases Asignadas'} y Control de Asistencia
          </h1>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          Imprimir Reporte
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => {
          const students = cls.students || [];
          const enrolledCount = students.length;
          const isFull = enrolledCount >= 30;

          // Regularity calculation (>= 75% presents)
          const regularCount = students.filter(st => {
            const att = st.attendance || [];
            const p = att.filter(a => a === 'P').length;
            const evalCount = att.filter(a => a === 'P' || a === 'A' || a === 'J').length;
            return evalCount > 0 ? (p / evalCount) >= 0.75 : true;
          }).length;

          const regularityPct = enrolledCount > 0 ? Math.round((regularCount / enrolledCount) * 100) : 100;

          return (
            <div key={cls.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">
                    Comisión Oficial
                  </span>
                  <span className="font-semibold text-slate-800">
                    {enrolledCount} / {cls.maxCapacity || 30} Alumnos
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-tight">{cls.name}</h3>

                <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600">
                  <div>Días y Horarios: <strong className="text-slate-800">{cls.scheduleDays} • {cls.scheduleTime}</strong></div>
                  <div>Cancha Asignada: <strong className="text-slate-800">{cls.courtAssigned}</strong></div>
                  <div>Cuota Mensual: <strong className="text-slate-900">${cls.monthlyFee?.toLocaleString('es-AR')}</strong></div>
                </div>

                {/* Regularity indicator */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-500">Regularidad (≥75%):</span>
                  <strong className="text-slate-800">{regularCount} de {enrolledCount} ({regularityPct}%)</strong>
                </div>

                {isFull && (
                  <div className="p-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold text-center">
                    Cupo completo (30/30 alumnos).
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-2 no-print">
                <button
                  type="button"
                  onClick={() => setSelectedClassForAttendance(cls)}
                  className="w-full py-2.5 px-3 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  Tomar Asistencia (Matriz)
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedClassForSheet(cls)}
                    className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1 transition-colors"
                  >
                    Planilla A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClassForRoster(cls)}
                    className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1 transition-colors"
                  >
                    Ver Alumnos
                  </button>
                </div>
              </div>

            </div>
          );
        })}
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

      {/* Class Roster View Modal */}
      <Modal
        isOpen={!!selectedClassForRoster}
        onClose={() => setSelectedClassForRoster(null)}
        title={`Nómina de Alumnos: ${selectedClassForRoster?.name}`}
        maxWidth="max-w-lg"
      >
        {selectedClassForRoster && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">
                Total de Alumnos: <strong className="text-slate-900">{selectedClassForRoster.students?.length || 0} de {selectedClassForRoster.maxCapacity || 30}</strong>
              </span>
              <span className="text-[11px] text-slate-500">Criterio regular: ≥75%</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Nombre y Apellido</th>
                    <th className="p-2.5">DNI</th>
                    <th className="p-2.5 text-center">Asistencias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!selectedClassForRoster.students || selectedClassForRoster.students.length === 0) ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400">
                        No hay alumnos inscriptos en esta comisión.
                      </td>
                    </tr>
                  ) : (
                    selectedClassForRoster.students.map((st) => {
                      const att = st.attendance || [];
                      const p = att.filter(a => a === 'P').length;
                      const tot = att.filter(a => a === 'P' || a === 'A' || a === 'J').length;
                      const pct = tot > 0 ? Math.round((p / tot) * 100) : 100;
                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold text-slate-900">{st.name}</td>
                          <td className="p-2.5 text-slate-600">{st.dni}</td>
                          <td className="p-2.5 text-center font-medium text-slate-700">
                            {p}/{tot} ({pct}%)
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedClassForRoster(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
