import React, { useState, useEffect } from 'react';
import { coachesAndClassesService } from '../../services/api';
import AttendanceSheetModal from '../../components/common/AttendanceSheetModal';
import AttendanceMatrixModal from '../../components/common/AttendanceMatrixModal';

export default function AttendanceManagementPage() {
  const [classes, setClasses] = useState([]);
  const [kindFilter, setKindFilter] = useState('ALL'); // ALL | clase | entrenamiento
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [selectedClassForSheet, setSelectedClassForSheet] = useState(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const res = await coachesAndClassesService.getClasses();
    setClasses(res.data);
    return res.data;
  };

  // Tras cada cambio se recarga la clase abierta en la matriz para que refleje el estado guardado.
  const refreshOpenClass = async (classId) => {
    const data = await loadClasses();
    const updated = data.find(c => c.id === classId);
    if (updated) setSelectedClassForAttendance(updated);
  };

  const handleToggleAttendance = async (classId, studentId, sessionIndex) => {
    await coachesAndClassesService.toggleStudentAttendance(classId, studentId, sessionIndex);
    await refreshOpenClass(classId);
  };

  const handleBulkMark = async (classId, sessionIndex, status) => {
    await coachesAndClassesService.bulkMarkSession(classId, sessionIndex, status);
    await refreshOpenClass(classId);
  };

  const visibleClasses = classes.filter(c => kindFilter === 'ALL' || (c.kind || 'clase') === kindFilter);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Asistencia
          </h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5"
        >
          Imprimir
        </button>
      </div>

      <div className="flex items-center gap-2 no-print">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtrar por:</span>
        <div className="flex items-center gap-1">
          {[['ALL', 'Todos'], ['clase', 'Clases'], ['entrenamiento', 'Entrenamientos']].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                kindFilter === k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden print:block text-center border-b p-4">
          <h2 className="text-lg font-bold text-slate-900">TENIS AHORA — RESUMEN DE ASISTENCIA</h2>
          <p className="text-xs text-slate-500">Emitido: {new Date().toLocaleString('es-AR')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="p-3">Actividad</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Profesional</th>
                <th className="p-3">Días y Horario</th>
                <th className="p-3 text-center">Inscriptos</th>
                <th className="p-3 text-right no-print">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleClasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No hay clases ni entrenamientos para tomar asistencia.
                  </td>
                </tr>
              ) : (
                visibleClasses.map(cls => {
                  const students = cls.students || [];
                  const isTraining = (cls.kind || 'clase') === 'entrenamiento';
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{cls.name}</td>
                      <td className="p-3 text-slate-700">{isTraining ? 'Entrenamiento' : 'Clase'}</td>
                      <td className="p-3 text-slate-700">{cls.coachName}</td>
                      <td className="p-3 text-slate-600">{cls.scheduleDays} {cls.scheduleTime}</td>
                      <td className="p-3 text-center font-semibold text-slate-800">
                        {students.length} / {Math.min(cls.maxCapacity || 30, 30)}
                      </td>
                      <td className="p-3 text-right no-print space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedClassForAttendance(cls)}
                          className="px-3 py-1.5 rounded-lg bg-tennis-600 hover:bg-tennis-700 text-white font-semibold"
                        >
                          Tomar Asistencia
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedClassForSheet(cls)}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200"
                        >
                          Planilla A4
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AttendanceSheetModal
        isOpen={!!selectedClassForSheet}
        onClose={() => setSelectedClassForSheet(null)}
        classItem={selectedClassForSheet}
      />

      <AttendanceMatrixModal
        isOpen={!!selectedClassForAttendance}
        onClose={() => setSelectedClassForAttendance(null)}
        classItem={selectedClassForAttendance}
        onToggleAttendance={handleToggleAttendance}
        onBulkMark={handleBulkMark}
        onOpenPrintSheet={(cls) => setSelectedClassForSheet(cls)}
      />

    </div>
  );
}
