import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Printer, 
  UserPlus, 
  ShieldAlert, 
  Search, 
  Filter, 
  Sparkles,
  Info,
  Calendar,
  X,
  Clock
} from 'lucide-react';
import Modal from './Modal';
import { formatDNI, isValidDNI } from '../../utils/formatters';

export default function AttendanceMatrixModal({ 
  isOpen, 
  onClose, 
  classItem, 
  onToggleAttendance, 
  onBulkMark, 
  onEnrollStudent,
  onOpenPrintSheet 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState('ALL'); // ALL, REGULAR, RIESGO
  
  // New student form
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentDni, setNewStudentDni] = useState('');
  const [enrollError, setEnrollError] = useState('');

  if (!classItem) return null;

  const sessions = classItem.sessions || ['03/10', '05/10', '10/10', '12/10', '17/10', '19/10', '24/10', '26/10'];
  const students = classItem.students || [];
  const maxCapacity = 30; // Tope estricto de 30 alumnos
  const isCupoLleno = students.length >= maxCapacity;

  // Filter students
  const filteredStudents = students.filter(st => {
    const matchesSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          st.dni.includes(searchTerm);
    if (!matchesSearch) return false;

    // Calculate condition
    const attList = st.attendance || [];
    const pCount = attList.filter(a => a === 'P').length;
    const evaluated = attList.filter(a => a === 'P' || a === 'A' || a === 'J').length;
    const percent = evaluated > 0 ? Math.round((pCount / evaluated) * 100) : 100;
    const isRegular = percent >= 75;

    if (filterCondition === 'REGULAR') return isRegular;
    if (filterCondition === 'RIESGO') return !isRegular;
    return true;
  });

  // Global class stats
  const totalStudents = students.length;
  let overallPresents = 0;
  let overallEvaluated = 0;
  let regularCount = 0;
  let riesgoCount = 0;

  students.forEach(st => {
    const attList = st.attendance || [];
    const pCount = attList.filter(a => a === 'P').length;
    const evaluated = attList.filter(a => a === 'P' || a === 'A' || a === 'J').length;
    overallPresents += pCount;
    overallEvaluated += evaluated;
    const pct = evaluated > 0 ? Math.round((pCount / evaluated) * 100) : 100;
    if (pct >= 75) regularCount++;
    else riesgoCount++;
  });

  const averageAttendance = overallEvaluated > 0 
    ? Math.round((overallPresents / overallEvaluated) * 100) 
    : 100;

  const handleCreateStudent = (e) => {
    e.preventDefault();
    setEnrollError('');

    if (isCupoLleno) {
      setEnrollError('No es posible agregar más alumnos: el cupo reglamentario de 30 está completo.');
      return;
    }

    if (!newStudentName.trim() || newStudentName.trim().split(/\s+/).length < 2) {
      setEnrollError('Ingrese Nombre y Apellido completo.');
      return;
    }

    if (!isValidDNI(newStudentDni)) {
      setEnrollError('El DNI debe tener entre 7 y 8 dígitos válidos.');
      return;
    }

    // Check duplicate DNI in this class
    if (students.some(s => s.dni.replace(/\D/g, '') === newStudentDni.replace(/\D/g, ''))) {
      setEnrollError('Este DNI ya se encuentra inscripto en esta clase.');
      return;
    }

    onEnrollStudent(classItem.id, {
      name: newStudentName.trim(),
      dni: formatDNI(newStudentDni)
    });

    setNewStudentName('');
    setNewStudentDni('');
    setShowAddStudentForm(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Matriz Visual de Asistencia: ${classItem.name}`}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-5 text-xs text-slate-700">
        
        {/* Class Overview Header */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-tennis-500 text-slate-950">
                Escuela de Tenis • {classItem.monthName || 'Octubre 2026'}
              </span>
              <span className="text-slate-400 font-medium text-[11px]">
                Profesor: <strong className="text-white">{classItem.coachName}</strong>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black mt-1 text-white tracking-tight">
              {classItem.name}
            </h3>
            <p className="text-slate-300 text-xs mt-0.5">
              {classItem.scheduleDays} • {classItem.scheduleTime} • {classItem.courtAssigned}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPrintSheet(classItem)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-tennis-400" />
              Imprimir Planilla A4
            </button>
            <button
              type="button"
              onClick={() => onBulkMark(classItem.id, sessions.length - 1, 'P')}
              className="px-3.5 py-2 rounded-xl bg-tennis-500 hover:bg-tennis-400 text-slate-950 font-black text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Todos Presentes Hoy
            </button>
          </div>
        </div>

        {/* Cupo Maximo Control Alert  */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-tennis-600" />
              Control de Cupo Máximo Reglamentario
            </span>
            <span className={`text-xs font-black ${isCupoLleno ? 'text-rose-600' : 'text-slate-700'}`}>
              {totalStudents} / {maxCapacity} Alumnos ({Math.round((totalStudents / maxCapacity) * 100)}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                isCupoLleno 
                  ? 'bg-rose-500 animate-pulse' 
                  : totalStudents >= 25 
                  ? 'bg-amber-500' 
                  : 'bg-tennis-500'
              }`}
              style={{ width: `${Math.min(100, (totalStudents / maxCapacity) * 100)}%` }}
            />
          </div>

          {/* Full capacity warning banner */}
          {isCupoLleno ? (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 flex items-start gap-3 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black text-xs uppercase tracking-tight text-rose-800">
                  ⚠️ ALERTA DE CUPO COMPLETO — Límite de 30 Alumnos Alcanzado
                </strong>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Por reglamento oficial de seguridad y calidad pedagógica del club, se inhabilitan nuevas inscripciones en esta clase. Para sumar más participantes, debe abrirse una nueva comisión o grupo horario.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Cupos disponibles para inscripción: <strong>{maxCapacity - totalStudents} lugares</strong>.</span>
              <button
                type="button"
                onClick={() => setShowAddStudentForm(!showAddStudentForm)}
                className="text-tennis-700 font-bold hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showAddStudentForm ? 'Ocultar Formulario' : 'Inscribir Nuevo Alumno'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Student Enrollment Form */}
        {showAddStudentForm && !isCupoLleno && (
          <form onSubmit={handleCreateStudent} className="p-4 bg-tennis-50/60 rounded-2xl border border-tennis-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs uppercase text-tennis-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-tennis-700" />
                Inscribir Alumno a la Clase
              </h4>
              <span className="text-[10px] text-tennis-700 font-semibold">
                Cupo restante: {maxCapacity - totalStudents}
              </span>
            </div>

            {enrollError && (
              <div className="p-2 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-[11px] font-bold">
                {enrollError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lucas Martínez"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-slate-300 outline-none focus:border-tennis-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  DNI del Alumno *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 39.811.234"
                  value={newStudentDni}
                  onChange={(e) => setNewStudentDni(formatDNI(e.target.value))}
                  className="w-full p-2 bg-white rounded-xl border border-slate-300 outline-none focus:border-tennis-600 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddStudentForm(false)}
                className="px-3 py-1.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-sm"
              >
                Confirmar Inscripción
              </button>
            </div>
          </form>
        )}

        {/* KPI Mini-Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Inscriptos</span>
            <span className="text-lg font-black text-slate-900">{totalStudents} alumnos</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">Alumnos Regulares (≥75%)</span>
            <span className="text-lg font-black text-emerald-800">{regularCount} alumnos</span>
          </div>

          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-center">
            <span className="text-[10px] font-bold uppercase text-rose-700 block">En Riesgo (&lt;75%)</span>
            <span className="text-lg font-black text-rose-800">{riesgoCount} alumnos</span>
          </div>

          <div className="p-3 bg-tennis-50 rounded-2xl border border-tennis-200 text-center">
            <span className="text-[10px] font-bold uppercase text-tennis-800 block">Asistencia Promedio</span>
            <span className="text-lg font-black text-tennis-900">{averageAttendance}%</span>
          </div>
        </div>

        {/* Search, Filter & Legend Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 flex-1 max-w-sm bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar alumno por nombre o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none text-xs"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')}>
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Condition Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Filtrar:</span>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'REGULAR', label: 'Regulares (≥75%)' },
              { id: 'RIESGO', label: 'En Riesgo (<75%)' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCondition(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filterCondition === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Cell Toggle Legend */}
          <div className="flex items-center gap-2 text-[10px] font-bold border-l pl-3 border-slate-200">
            <span className="text-slate-400 uppercase">1-Clic:</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black">P: Presente</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black">A: Ausente</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-black">J: Justificado</span>
          </div>
        </div>

        {/* Interactive Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm max-h-[480px]">
          <table className="w-full text-left text-xs border-collapse bg-white">
            <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] sticky top-0 z-10 shadow-sm">
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[170px]">Alumno / DNI</th>
                
                {/* Session columns */}
                {sessions.map((sess, sIdx) => (
                  <th key={sIdx} className="py-2 px-1 text-center w-12 border-l border-slate-200">
                    <div className="font-mono text-[10px] text-slate-800">C{sIdx + 1}</div>
                    <div className="text-[9px] font-normal text-slate-400">{sess}</div>
                  </th>
                ))}

                <th className="py-2.5 px-2 text-center w-14 border-l border-slate-200 text-emerald-700">P</th>
                <th className="py-2.5 px-2 text-center w-14 text-rose-700">A</th>
                <th className="py-2.5 px-2 text-center w-14 text-amber-700">J</th>
                <th className="py-2.5 px-3 text-center min-w-[90px] border-l border-slate-200">% Asistencia</th>
                <th className="py-2.5 px-3 text-center min-w-[120px]">Estado / Condición</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={sessions.length + 7} className="py-8 text-center text-slate-400">
                    No se encontraron alumnos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const attList = student.attendance || [];
                  const pCount = attList.filter(a => a === 'P').length;
                  const aCount = attList.filter(a => a === 'A').length;
                  const jCount = attList.filter(a => a === 'J').length;
                  const evaluated = pCount + aCount + jCount;
                  const percentage = evaluated > 0 ? Math.round((pCount / evaluated) * 100) : 100;
                  const isRegular = percentage >= 75;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900">{student.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{student.dni}</div>
                      </td>

                      {/* Interactive Session Cells */}
                      {sessions.map((_, sIdx) => {
                        const status = attList[sIdx] || '-';

                        let cellClass = 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200';
                        if (status === 'P') {
                          cellClass = 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600/30 font-black';
                        } else if (status === 'A') {
                          cellClass = 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm ring-1 ring-rose-600/30 font-black';
                        } else if (status === 'J') {
                          cellClass = 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-sm ring-1 ring-amber-500/30 font-black';
                        }

                        return (
                          <td key={sIdx} className="py-1 px-1 text-center border-l border-slate-100">
                            <button
                              type="button"
                              title={`Clic para alternar (Actual: ${status === 'P' ? 'Presente' : status === 'A' ? 'Ausente' : status === 'J' ? 'Justificado' : 'Sin registrar'})`}
                              onClick={() => onToggleAttendance(classItem.id, student.id, sIdx)}
                              className={`w-7 h-7 rounded-lg text-xs font-mono flex items-center justify-center mx-auto transition-transform active:scale-90 ${cellClass}`}
                            >
                              {status}
                            </button>
                          </td>
                        );
                      })}

                      {/* Counts */}
                      <td className="py-2.5 px-2 text-center font-black text-emerald-700 border-l border-slate-100">
                        {pCount}
                      </td>
                      <td className="py-2.5 px-2 text-center font-black text-rose-700">
                        {aCount}
                      </td>
                      <td className="py-2.5 px-2 text-center font-black text-amber-700">
                        {jCount}
                      </td>

                      {/* Percentage */}
                      <td className="py-2.5 px-3 text-center border-l border-slate-100">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`font-black text-xs ${isRegular ? 'text-emerald-700' : 'text-rose-600 font-black'}`}>
                            {percentage}%
                          </span>
                        </div>
                      </td>

                      {/* Condition Badge */}
                      <td className="py-2.5 px-3 text-center">
                        {isRegular ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Regular
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            En riesgo (&lt;75%)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & close */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-tennis-600 shrink-0" />
            <span>Los cambios de estado se guardan en tiempo real al hacer clic en cada celda.</span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => onOpenPrintSheet(classItem)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Vista de Impresión
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              Cerrar Matriz
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
