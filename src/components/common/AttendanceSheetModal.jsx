import React from 'react';
import { Printer, Users, Calendar, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import Modal from './Modal';
import Logo from './Logo';

export default function AttendanceSheetModal({ isOpen, onClose, classItem }) {
  if (!classItem) return null;

  const handlePrint = () => {
    window.print();
  };

  const students = classItem.students || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Planilla Oficial de Asistencia (Imprimible)" maxWidth="max-w-4xl">
      <div className="space-y-4">
        
        {/* Print Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Formato oficial A4 apaisado para toma manual de asistencia en cancha o archivo administrativo.</span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Planilla A4
          </button>
        </div>

        {/* Printable Sheet */}
        <div id="printable-attendance-area" className="bg-white p-6 rounded-2xl border border-slate-200 text-slate-800 print:border-none print:p-0">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-tennis-700 text-white flex items-center justify-center font-black text-lg">
                TA
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight uppercase text-slate-900 leading-tight">
                  Club Tenis Ahora — Escuela de Tenis
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Planilla Oficial de Control y Registro de Asistencias a Clases
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="font-mono text-[11px] text-slate-400 block">DOCUMENTO OFICIAL AAT</span>
              <span className="font-bold text-slate-800">Mes: {new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Class metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 my-2 bg-slate-50 rounded-xl p-3 text-xs border border-slate-200 print:bg-white print:border-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Clase:</span>
              <strong className="text-slate-900 block truncate">{classItem.name}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Profesor a Cargo:</span>
              <strong className="text-slate-900 block truncate">{classItem.coachName}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Días y Horarios:</span>
              <strong className="text-slate-900 block">{classItem.scheduleDays} • {classItem.scheduleTime}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Inscriptos / Cupo Máx:</span>
              <strong className="text-tennis-800 block">{students.length} / {classItem.maxCapacity || 30} alumnos (máx 30)</strong>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                  <th className="py-2 px-2 border-r border-slate-300 w-8 text-center">N°</th>
                  <th className="py-2 px-3 border-r border-slate-300">Alumno (Nombre y Apellido)</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-24">DNI</th>
                  {/* 8 Attendance Session Columns */}
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <th key={s} className="py-2 px-1 border-r border-slate-300 w-8 text-center">
                      C{s}
                    </th>
                  ))}
                  <th className="py-2 px-2 border-r border-slate-300 w-16 text-center">% Asist.</th>
                  <th className="py-2 px-3">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((st, idx) => {
                  const presents = st.attendance?.filter(a => a === 'P').length || 0;
                  const total = st.attendance?.length || 1;
                  const pct = Math.round((presents / total) * 100);

                  return (
                    <tr key={st.id || idx} className="hover:bg-slate-50 print:hover:bg-transparent">
                      <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-bold text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-900">
                        {st.name}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-slate-600 font-mono">
                        {st.dni}
                      </td>
                      {/* Attendance blocks */}
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(sIdx => {
                        const val = st.attendance?.[sIdx];
                        return (
                          <td key={sIdx} className="py-2 px-1 border-r border-slate-300 text-center font-bold">
                            {val ? (
                              <span className={`inline-block w-4 h-4 rounded text-[9px] leading-4 ${
                                val === 'P' ? 'bg-emerald-100 text-emerald-800' : val === 'A' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {val}
                              </span>
                            ) : (
                              <span className="text-slate-300">·</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 border-r border-slate-300 text-center font-bold text-tennis-800">
                        {pct}%
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[10px]">
                        {pct >= 75 ? 'Alumno Regular' : 'Seguimiento pedagógico'}
                      </td>
                    </tr>
                  );
                })}

                {/* Fill empty rows up to 10 for physical notes */}
                {Array.from({ length: Math.max(0, 10 - students.length) }).map((_, emptyIdx) => (
                  <tr key={`empty-${emptyIdx}`} className="h-7 text-slate-300">
                    <td className="border-r border-slate-300 text-center font-mono text-[10px]">{students.length + emptyIdx + 1}</td>
                    <td className="border-r border-slate-300"></td>
                    <td className="border-r border-slate-300"></td>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(s => (
                      <td key={s} className="border-r border-slate-300"></td>
                    ))}
                    <td className="border-r border-slate-300"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reference and Signature footer */}
          <div className="grid grid-cols-2 gap-6 pt-6 mt-4 border-t border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-700 block mb-1">Referencias de Asistencia:</span>
              <div className="flex items-center gap-3 text-[10px] text-slate-600">
                <span className="flex items-center gap-1">
                  <strong className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">P</strong> Presente
                </span>
                <span className="flex items-center gap-1">
                  <strong className="px-1.5 py-0.5 rounded bg-red-100 text-red-800">A</strong> Ausente
                </span>
                <span className="flex items-center gap-1">
                  <strong className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">J</strong> Justificado
                </span>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="w-48 border-b border-dashed border-slate-400 h-8" />
              <span className="text-[10px] font-bold text-slate-700 mt-1 block">Firma del Profesor Responsable</span>
              <span className="text-[9px] text-slate-400">Título Habilitante AAT / ITF</span>
            </div>
          </div>

        </div>

        {/* Modal footer (No Print) */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-glow-green transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Planilla A4
          </button>
        </div>

      </div>
    </Modal>
  );
}
