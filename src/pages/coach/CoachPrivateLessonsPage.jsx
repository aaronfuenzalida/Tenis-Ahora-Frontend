import React, { useState, useEffect } from 'react';
import { coachesAndClassesService, clubConfigService, usersService, DEFAULT_CLUB_CONFIG } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { Edit } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { findPrivateLessonConflict } from '../../utils/formatters';

export default function CoachPrivateLessonsPage() {
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const [lessons, setLessons] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [coachProfile, setCoachProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [clubConfig, setClubConfig] = useState(DEFAULT_CLUB_CONFIG);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState(null);

  const [newLessonForm, setNewLessonForm] = useState({
    studentName: '',
    studentDni: '',
    studentPhone: '',
    date: '2026-10-22',
    time: '11:00 - 12:00',
    courtAssigned: 'Cancha 1 (Ladrillo)',
    hourlyRate: 6500,
    notes: 'Perfeccionamiento de saque y derecha invertida.'
  });

  useEffect(() => {
    loadLessons();
  }, [user]);

  const loadLessons = async () => {
    const [prvRes, cRes, cfgRes, mRes] = await Promise.all([
      coachesAndClassesService.getPrivateClasses(),
      coachesAndClassesService.getCoaches(),
      clubConfigService.get(),
      usersService.getMembers()
    ]);
    setClubConfig(cfgRes.data);
    setMembers(mRes.data);
const currentCoach = cRes.data.find(c => c.id === user?.coachId);
    setCoachProfile(currentCoach);

    setAllLessons(prvRes.data || []);
    const myLessons = prvRes.data.filter(p => p.coachId === currentCoach?.id || p.coachName === currentCoach?.name);
    setLessons(myLessons);

    setNewLessonForm(prev => ({ ...prev, hourlyRate: cfgRes.data.privateLessonHourlyRate }));
  };

  // Turno repetido: mismo día y horario, del profesor con otro alumno o del alumno con cualquier profesor.
  const conflictMessage = ({ studentDni, studentName, date, time }, excludeId) => {
    const clash = findPrivateLessonConflict(allLessons, { coachId: coachProfile?.id, studentDni, date, time, excludeId });
    if (!clash) return null;
    const mine = clash.coachId === coachProfile?.id || clash.coachName === coachProfile?.name;
    return mine
      ? `Ya tenés un turno el ${clash.date} a las ${clash.time} con ${clash.studentName}.`
      : `${studentName || 'El alumno'} ya tiene un turno el ${clash.date} a las ${clash.time} con ${clash.coachName}.`;
  };

  const handleSelectStudent = (memberId) => {
    const member = members.find(m => String(m.id) === memberId);
    setNewLessonForm({ ...newLessonForm, studentName: member?.name || '', studentDni: member?.dni || '' });
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
const clash = conflictMessage(newLessonForm);
    if (clash) {
      notify({ variant: 'warning', message: clash });
      return;
    }
    try {
      await coachesAndClassesService.createPrivateClass({
        ...newLessonForm,
        coachId: coachProfile?.id,
        coachName: coachProfile?.name,
        // Un profesor da clases y un entrenador, entrenamientos.
        kind: coachProfile?.type === 'Entrenador' ? 'entrenamiento' : 'clase'
      });
    } catch (err) {
      notify({ variant: 'error', title: 'Error al registrar', message: err.message || 'No se pudo registrar el turno.' });
      return;
    }
    setShowAddModal(false);
    setNewLessonForm({
      studentName: '',
      studentDni: '',
      studentPhone: '',
      date: '2026-10-22',
      time: '11:00 - 12:00',
      courtAssigned: 'Cancha 1 (Ladrillo)',
      hourlyRate: clubConfig.privateLessonHourlyRate,
      notes: ''
    });
    await loadLessons();
  };

  const handleOpenEdit = (lesson) => {
    setLessonToEdit({ ...lesson });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!lessonToEdit) return;
    if (lessonToEdit.status !== 'cancelada') {
      const clash = conflictMessage(lessonToEdit, lessonToEdit.id);
      if (clash) {
        notify({ variant: 'warning', message: clash });
        return;
      }
    }
    try {
      await coachesAndClassesService.updatePrivateClass(lessonToEdit.id, lessonToEdit);
    } catch (err) {
      notify({ variant: 'error', title: 'Error al modificar', message: err.message || 'No se pudo modificar el turno.' });
      return;
    }
    setShowEditModal(false);
    setLessonToEdit(null);
    await loadLessons();
  };

  const handleCancelLesson = async (id) => {
    if (await confirm({ title: 'Cancelar clase particular', message: 'Confirma la cancelación de esta clase particular?', confirmLabel: 'Cancelar clase', danger: true })) {
      await coachesAndClassesService.cancelPrivateClass(id);
      await loadLessons();
    }
  };

  const handleDeleteLesson = async (id) => {
    if (await confirm({ title: 'Eliminar turno', message: 'Confirma la eliminación del registro de este turno?', confirmLabel: 'Eliminar', danger: true })) {
      await coachesAndClassesService.deletePrivateClass(id);
      await loadLessons();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Agenda de Turnos Particulares
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5"
          >
            Imprimir Agenda
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            Agendar Turno
          </button>
        </div>
      </div>

      {/* Table */}
      <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <h2 className="hidden print:block p-3 text-sm font-bold text-slate-900">
          Agenda de Turnos Particulares • {coachProfile?.name}
        </h2>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="p-3">Fecha y Horario</th>
              <th className="p-3">Alumno / Socio</th>
              <th className="p-3">Cancha</th>
              <th className="p-3">Arancel</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Objetivo Técnico / Observaciones</th>
              <th className="p-3 text-right no-print">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lessons.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No se registran turnos particulares agendados en su perfil.
                </td>
              </tr>
            ) : (
              lessons.map(lesson => {
                const isCancelled = lesson.status === 'cancelada';
                return (
                  <tr key={lesson.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{lesson.date}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{lesson.time}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{lesson.studentName}</div>
                      <div className="text-[11px] text-slate-500">DNI: {lesson.studentDni} • Tel: {lesson.studentPhone || '-'}</div>
                    </td>
                    <td className="p-3 text-slate-600">{lesson.courtAssigned}</td>
                    <td className="p-3 font-bold text-slate-900">${lesson.hourlyRate?.toLocaleString('es-AR')}</td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold ${
                        isCancelled ? 'text-slate-700' : 'text-slate-800'
                      }`}>
                        {lesson.status === 'confirmada' ? 'Confirmada' : isCancelled ? 'Cancelada' : 'Programada'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate">{lesson.notes || '-'}</td>
                    <td className="p-3 text-right no-print space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(lesson)}
                        className="text-slate-700 hover:text-slate-900 font-semibold"
                      >
                        Modificar
                      </button>
                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleCancelLesson(lesson.id)}
                          className="text-slate-500 hover:text-slate-700 font-semibold"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-slate-600 hover:text-slate-800 font-semibold"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 1. Add Lesson Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agendar Nuevo Turno de Clase Particular"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Alumno *</label>
            <select
              required
              value={members.find(m => m.dni === newLessonForm.studentDni)?.id ?? ''}
              onChange={(e) => handleSelectStudent(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
            >
              <option value="">Seleccionar alumno</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} • DNI {m.dni}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Teléfono</label>
              <input
                type="text"
                placeholder="11-4455-6677"
                value={newLessonForm.studentPhone}
                onChange={(e) => setNewLessonForm({ ...newLessonForm, studentPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={newLessonForm.date}
                onChange={(e) => setNewLessonForm({ ...newLessonForm, date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Horario *</label>
              <input
                type="text"
                required
                placeholder="11:00 - 12:00"
                value={newLessonForm.time}
                onChange={(e) => setNewLessonForm({ ...newLessonForm, time: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Cancha *</label>
              <select
                value={newLessonForm.courtAssigned}
                onChange={(e) => setNewLessonForm({ ...newLessonForm, courtAssigned: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Cancha 1 (Ladrillo)">Cancha 1 (Ladrillo)</option>
                <option value="Cancha 2 (Ladrillo)">Cancha 2 (Ladrillo)</option>
                <option value="Cancha 3 (Cemento)">Cancha 3 (Cemento)</option>
                <option value="Cancha 4 (Cemento)">Cancha 4 (Cemento)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Arancel Hora (ARS) *</label>
              <input
                type="number"
                required
                value={newLessonForm.hourlyRate}
                onChange={(e) => setNewLessonForm({ ...newLessonForm, hourlyRate: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Objetivo Técnico o Observaciones</label>
            <textarea
              rows={2}
              placeholder="Ej: Ajuste de empuñadura y trabajo de volea..."
              value={newLessonForm.notes}
              onChange={(e) => setNewLessonForm({ ...newLessonForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Agendar Turno
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Lesson Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modificar Turno Particular"
        maxWidth="max-w-md"
      >
        {lessonToEdit && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  value={lessonToEdit.date}
                  onChange={(e) => setLessonToEdit({ ...lessonToEdit, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Horario *</label>
                <input
                  type="text"
                  required
                  value={lessonToEdit.time}
                  onChange={(e) => setLessonToEdit({ ...lessonToEdit, time: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Cancha *</label>
                <input
                  type="text"
                  required
                  value={lessonToEdit.courtAssigned}
                  onChange={(e) => setLessonToEdit({ ...lessonToEdit, courtAssigned: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Estado *</label>
                <select
                  value={lessonToEdit.status}
                  onChange={(e) => setLessonToEdit({ ...lessonToEdit, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  <option value="programada">Programada</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Observaciones</label>
              <textarea
                rows={2}
                value={lessonToEdit.notes}
                onChange={(e) => setLessonToEdit({ ...lessonToEdit, notes: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
