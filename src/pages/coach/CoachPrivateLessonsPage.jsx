import React, { useState, useEffect } from 'react';
import { coachesAndClassesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Edit } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function CoachPrivateLessonsPage() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [coachProfile, setCoachProfile] = useState(null);

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
    const [prvRes, cRes] = await Promise.all([
      coachesAndClassesService.getPrivateClasses(),
      coachesAndClassesService.getCoaches()
    ]);
    const currentCoach = cRes.data.find(c => c.name === user?.name || c.id === 'coach-01') || cRes.data[0];
    setCoachProfile(currentCoach);

    const myLessons = prvRes.data.filter(p => p.coachId === currentCoach?.id || p.coachName === currentCoach?.name);
    setLessons(myLessons.length > 0 ? myLessons : prvRes.data);

    if (currentCoach) {
      setNewLessonForm(prev => ({
        ...prev,
        hourlyRate: currentCoach.hourlyRatePrivate || 6500
      }));
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    await coachesAndClassesService.createPrivateClass({
      ...newLessonForm,
      coachId: coachProfile?.id || 'coach-01',
      coachName: coachProfile?.name || 'Prof. Santiago Álvarez'
    });
    setShowAddModal(false);
    setNewLessonForm({
      studentName: '',
      studentDni: '',
      studentPhone: '',
      date: '2026-10-22',
      time: '11:00 - 12:00',
      courtAssigned: 'Cancha 1 (Ladrillo)',
      hourlyRate: coachProfile?.hourlyRatePrivate || 6500,
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
    await coachesAndClassesService.updatePrivateClass(lessonToEdit.id, lessonToEdit);
    setShowEditModal(false);
    setLessonToEdit(null);
    await loadLessons();
  };

  const handleCancelLesson = async (id) => {
    if (window.confirm('Confirma la cancelación de esta clase particular?')) {
      await coachesAndClassesService.cancelPrivateClass(id);
      await loadLessons();
    }
  };

  const handleDeleteLesson = async (id) => {
    if (window.confirm('Confirma la eliminación del registro de este turno?')) {
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
            <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre del Alumno *</label>
            <input
              type="text"
              required
              placeholder="Nombre y Apellido"
              value={newLessonForm.studentName}
              onChange={(e) => setNewLessonForm({ ...newLessonForm, studentName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">DNI del Alumno *</label>
              <input
                type="text"
                required
                placeholder="38.452.129"
                value={newLessonForm.studentDni}
                onChange={(e) => setNewLessonForm({ ...newLessonForm, studentDni: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

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
