import React, { useState, useEffect } from 'react';
import { coachesAndClassesService, clubConfigService, DEFAULT_CLUB_CONFIG } from '../../api';
import Modal from '../../ui/Modal';
import { useFeedback } from '../../ui/FeedbackContext';

export default function PrivateLessonsManagementPage() {
  const { notify, confirm } = useFeedback();
  const [coaches, setCoaches] = useState([]);
  const [clubConfig, setClubConfig] = useState(DEFAULT_CLUB_CONFIG);

  const [privateKindFilter, setPrivateKindFilter] = useState('ALL'); // ALL | clase | entrenamiento

  const [privateClasses, setPrivateClasses] = useState([]);
  const [showAddPrivateModal, setShowAddPrivateModal] = useState(false);
  const [showEditPrivateModal, setShowEditPrivateModal] = useState(false);
  const [privateToEdit, setPrivateToEdit] = useState(null);

  const [newPrivateForm, setNewPrivateForm] = useState({
    kind: 'clase',
    coachId: '',
    coachName: '',
    studentName: '',
    studentDni: '',
    studentPhone: '',
    date: '2026-10-20',
    time: '11:00 - 12:00',
    courtAssigned: 'Cancha 1 (Ladrillo)',
    hourlyRate: 6500,
    notes: 'Perfeccionamiento de revés y desplazamiento.'
  });

  useEffect(() => {
    loadPrivateClasses();
  }, []);

  const loadPrivateClasses = async () => {
    const [cRes, prvRes, cfgRes] = await Promise.all([
      coachesAndClassesService.getCoaches(),
      coachesAndClassesService.getPrivateClasses(),
      clubConfigService.get()
    ]);
    setClubConfig(cfgRes.data);
    setCoaches(cRes.data);
    setPrivateClasses(prvRes.data);

    if (cRes.data.length > 0 && !newPrivateForm.coachId) {
      setNewPrivateForm(prev => ({
        ...prev,
        coachId: cRes.data[0].id,
        coachName: cRes.data[0].name,
        hourlyRate: cfgRes.data.privateLessonHourlyRate
      }));
    }
  };

  // ==========================================
  // HANDLERS: PRIVATE CLASSES
  // ==========================================
  const handleCreatePrivate = async (e) => {
    e.preventDefault();
    const coachObj = coaches.find(c => c.id === newPrivateForm.coachId);
    try {
      await coachesAndClassesService.createPrivateClass({
        ...newPrivateForm,
        coachName: coachObj ? coachObj.name : 'Profesor Asignado'
      });
    } catch (err) {
      notify({ title: 'Error al registrar turno', message: err.message || 'No se pudo registrar el turno particular.', variant: 'error' });
      return;
    }
    setShowAddPrivateModal(false);
    setNewPrivateForm({
      kind: 'clase',
      coachId: coaches[0]?.id || '',
      coachName: coaches[0]?.name || '',
      studentName: '',
      studentDni: '',
      studentPhone: '',
      date: '2026-10-20',
      time: '11:00 - 12:00',
      courtAssigned: 'Cancha 1 (Ladrillo)',
      hourlyRate: clubConfig.privateLessonHourlyRate,
      notes: ''
    });
    await loadPrivateClasses();
  };

  const handleOpenEditPrivate = (prv) => {
    setPrivateToEdit({ ...prv });
    setShowEditPrivateModal(true);
  };

  const handleSaveEditPrivate = async (e) => {
    e.preventDefault();
    if (!privateToEdit) return;
    const coachObj = coaches.find(c => c.id === privateToEdit.coachId);
    try {
      await coachesAndClassesService.updatePrivateClass(privateToEdit.id, {
        ...privateToEdit,
        coachName: coachObj ? coachObj.name : privateToEdit.coachName
      });
    } catch (err) {
      notify({ title: 'Error al modificar turno', message: err.message || 'No se pudo modificar el turno particular.', variant: 'error' });
      return;
    }
    setShowEditPrivateModal(false);
    setPrivateToEdit(null);
    await loadPrivateClasses();
  };

  const handleCancelPrivate = async (id) => {
    if (await confirm({ title: 'Cancelar clase particular', message: 'Confirma la cancelación de esta clase particular?', confirmLabel: 'Cancelar clase', danger: true })) {
      await coachesAndClassesService.cancelPrivateClass(id);
      await loadPrivateClasses();
    }
  };

  const handleDeletePrivate = async (id) => {
    if (await confirm({ title: 'Eliminar clase particular', message: 'Confirma la eliminación del registro de esta clase particular?', confirmLabel: 'Eliminar', danger: true })) {
      await coachesAndClassesService.deletePrivateClass(id);
      await loadPrivateClasses();
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Turnos Particulares
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

        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 no-print">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-slate-900">Turnos de Clases y Entrenamientos Particulares</h2>
              </div>
              <div className="flex items-center gap-1">
                {[['ALL', 'Todos'], ['clase', 'Clases'], ['entrenamiento', 'Entrenamientos']].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPrivateKindFilter(k)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      privateKindFilter === k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPrivateModal(true)}
              className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              Agendar Clase Particular
            </button>
          </div>

          {/* Private Classes Table */}
          <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="hidden print:block text-center border-b p-4">
              <h2 className="text-lg font-bold text-slate-900">TENIS AHORA — REPORTE DE TURNOS PARTICULARES</h2>
              <p className="text-xs text-slate-500">Clases y entrenamientos particulares • Emitido: {new Date().toLocaleString('es-AR')}</p>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">Fecha y Horario</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Alumno / Socio</th>
                  <th className="p-3">Profesional Asignado</th>
                  <th className="p-3">Cancha</th>
                  <th className="p-3">Arancel</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Observaciones</th>
                  <th className="p-3 text-right no-print">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {privateClasses.filter(p => privateKindFilter === 'ALL' || (p.kind || 'clase') === privateKindFilter).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No se registran turnos particulares agendados.
                    </td>
                  </tr>
                ) : (
                  privateClasses.filter(p => privateKindFilter === 'ALL' || (p.kind || 'clase') === privateKindFilter).map(prv => {
                    const isCancelled = prv.status === 'cancelada';
                    const isTraining = (prv.kind || 'clase') === 'entrenamiento';
                    return (
                      <tr key={prv.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{prv.date}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{prv.time}</div>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold ${isTraining ? 'text-slate-800' : 'text-tennis-800'}`}>
                            {isTraining ? 'Entrenamiento' : 'Clase'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{prv.studentName}</div>
                          <div className="text-[11px] text-slate-500">DNI: {prv.studentDni}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{prv.coachName}</td>
                        <td className="p-3 text-slate-600">{prv.courtAssigned}</td>
                        <td className="p-3 font-bold text-slate-900">${prv.hourlyRate?.toLocaleString('es-AR')}</td>
                        <td className="p-3">
                          <span className={`text-xs font-semibold ${
                            isCancelled ? 'text-slate-700' : 'text-slate-800'
                          }`}>
                            {prv.status === 'confirmada' ? 'Confirmada' : prv.status === 'cancelada' ? 'Cancelada' : 'Programada'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate">{prv.notes || '-'}</td>
                        <td className="p-3 text-right no-print space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPrivate(prv)}
                            className="text-slate-700 hover:text-slate-900 font-semibold"
                          >
                            Modificar
                          </button>
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleCancelPrivate(prv.id)}
                              className="text-slate-500 hover:text-slate-700 font-semibold"
                            >
                              Cancelar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePrivate(prv.id)}
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

        </div>

      {/* ======================================================== */}
      {/* MODALS: PRIVATE CLASSES */}
      {/* ======================================================== */}

      {/* 1. Add Private Modal */}
      <Modal
        isOpen={showAddPrivateModal}
        onClose={() => setShowAddPrivateModal(false)}
        title="Agendar Turno Particular"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreatePrivate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Tipo de Turno *</label>
            <select
              value={newPrivateForm.kind}
              onChange={(e) => setNewPrivateForm({ ...newPrivateForm, kind: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
            >
              <option value="clase">Clase Particular</option>
              <option value="entrenamiento">Entrenamiento Particular</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Profesor / Entrenador *</label>
              <select
                value={newPrivateForm.coachId}
                onChange={(e) => {
                  const sel = coaches.find(c => c.id === e.target.value);
                  setNewPrivateForm({
                    ...newPrivateForm,
                    coachId: e.target.value,
                    coachName: sel ? sel.name : ''
                  });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Arancel Hora (ARS) *</label>
              <input
                type="number"
                required
                value={newPrivateForm.hourlyRate}
                onChange={(e) => setNewPrivateForm({ ...newPrivateForm, hourlyRate: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre del Alumno *</label>
              <input
                type="text"
                required
                placeholder="Nombre y Apellido"
                value={newPrivateForm.studentName}
                onChange={(e) => setNewPrivateForm({ ...newPrivateForm, studentName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">DNI del Alumno *</label>
              <input
                type="text"
                required
                placeholder="38.452.129"
                value={newPrivateForm.studentDni}
                onChange={(e) => setNewPrivateForm({ ...newPrivateForm, studentDni: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={newPrivateForm.date}
                onChange={(e) => setNewPrivateForm({ ...newPrivateForm, date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Horario *</label>
              <input
                type="text"
                required
                placeholder="10:00 - 11:00"
                value={newPrivateForm.time}
                onChange={(e) => setNewPrivateForm({ ...newPrivateForm, time: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Cancha Asignada *</label>
              <select
                value={newPrivateForm.courtAssigned}
                onChange={(e) => setNewPrivateForm({ ...newPrivateForm, courtAssigned: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Cancha 1 (Ladrillo)">Cancha 1 (Ladrillo)</option>
                <option value="Cancha 2 (Ladrillo)">Cancha 2 (Ladrillo)</option>
                <option value="Cancha 3 (Cemento)">Cancha 3 (Cemento)</option>
                <option value="Cancha 4 (Cemento)">Cancha 4 (Cemento)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Teléfono Alumno</label>
              <input
                type="text"
                placeholder="11-4455-6677"
                value={newPrivateForm.studentPhone}
                onChange={(e) => setNewPrivateForm({ ...newPrivateForm, studentPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Observaciones u Objetivo Técnico</label>
            <textarea
              rows={2}
              placeholder="Ej: Trabajo de volea y saque..."
              value={newPrivateForm.notes}
              onChange={(e) => setNewPrivateForm({ ...newPrivateForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddPrivateModal(false)}
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

      {/* 2. Edit Private Modal */}
      <Modal
        isOpen={showEditPrivateModal}
        onClose={() => setShowEditPrivateModal(false)}
        title="Modificar Turno Particular"
        maxWidth="max-w-lg"
      >
        {privateToEdit && (
          <form onSubmit={handleSaveEditPrivate} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Tipo de Turno *</label>
              <select
                value={privateToEdit.kind || 'clase'}
                onChange={(e) => setPrivateToEdit({ ...privateToEdit, kind: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="clase">Clase Particular</option>
                <option value="entrenamiento">Entrenamiento Particular</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Profesional Asignado *</label>
                <select
                  value={privateToEdit.coachId}
                  onChange={(e) => setPrivateToEdit({ ...privateToEdit, coachId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Arancel (ARS) *</label>
                <input
                  type="number"
                  required
                  value={privateToEdit.hourlyRate}
                  onChange={(e) => setPrivateToEdit({ ...privateToEdit, hourlyRate: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  value={privateToEdit.date}
                  onChange={(e) => setPrivateToEdit({ ...privateToEdit, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Horario *</label>
                <input
                  type="text"
                  required
                  value={privateToEdit.time}
                  onChange={(e) => setPrivateToEdit({ ...privateToEdit, time: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Cancha *</label>
                <input
                  type="text"
                  required
                  value={privateToEdit.courtAssigned}
                  onChange={(e) => setPrivateToEdit({ ...privateToEdit, courtAssigned: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Estado *</label>
                <select
                  value={privateToEdit.status}
                  onChange={(e) => setPrivateToEdit({ ...privateToEdit, status: e.target.value })}
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
                value={privateToEdit.notes}
                onChange={(e) => setPrivateToEdit({ ...privateToEdit, notes: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditPrivateModal(false)}
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
