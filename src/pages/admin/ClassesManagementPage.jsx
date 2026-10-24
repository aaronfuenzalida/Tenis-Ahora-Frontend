import React, { useState, useEffect } from 'react';
import { coachesAndClassesService, courtTypesService } from '../../services/api';
import { Trash2 } from 'lucide-react';
import { isEnrolledByDni, isValidDNI, formatDNI } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import { useFeedback } from '../../context/FeedbackContext';

export default function ClassesManagementPage() {
  const { notify, confirm } = useFeedback();
  const [coaches, setCoaches] = useState([]);

  const [classKindFilter, setClassKindFilter] = useState('clase'); // clase | entrenamiento (RF066-RF091)

  const [classes, setClasses] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);

  // Modals for Group Classes
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);

  // Forms for Group Classes
  const [classToEdit, setClassToEdit] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [classToStudents, setClassToStudents] = useState(null);
  const [newStudentForm, setNewStudentForm] = useState({ name: '', dni: '', phone: '' });

  const [newClassForm, setNewClassForm] = useState({
    kind: 'clase',
    name: '',
    coachId: '',
    coachName: '',
    scheduleDays: 'Martes y Jueves',
    scheduleTime: '18:00 - 19:30',
    courtAssigned: 'Cancha 1 (Ladrillo)',
    maxCapacity: 30, // Max 30 limit
    monthlyFee: 16000
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const [cRes, clRes, ctRes] = await Promise.all([
      coachesAndClassesService.getCoaches(),
      coachesAndClassesService.getClasses(),
      courtTypesService.getAll()
    ]);
    setCoaches(cRes.data);
    setClasses(clRes.data);
    setCourtTypes(ctRes.data);

    if (cRes.data.length > 0 && !newClassForm.coachId) {
      setNewClassForm(prev => ({
        ...prev,
        coachId: cRes.data[0].id,
        coachName: cRes.data[0].name
      }));
    }
  };

  // ==========================================
  // HANDLERS: GROUP CLASSES
  // ==========================================
  // RD10: el cupo lo fija el tipo de cancha (la superficie va entre paréntesis en courtAssigned),
  // sin pasar nunca el tope de 30 de RD07.
  const capacityLimitFor = (courtAssigned) => {
    const surface = /\(([^)]+)\)/.exec(courtAssigned || '')?.[1];
    const type = courtTypes.find(t => t.name === surface);
    return Math.min(Number(type?.maxStudentsPerClass) || 30, 30);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const limit = capacityLimitFor(newClassForm.courtAssigned);
    if (newClassForm.maxCapacity > limit) {
      notify({ message: `El cupo máximo para ${newClassForm.courtAssigned} es de ${limit} alumnos.`, variant: 'warning' });
      return;
    }
    const coachObj = coaches.find(c => c.id === newClassForm.coachId);
    try {
      await coachesAndClassesService.addClass({
        ...newClassForm,
        coachName: coachObj ? coachObj.name : 'Profesor Asignado'
      });
    } catch (err) {
      notify({ title: 'Error al registrar clase', message: err.message || 'No se pudo registrar la clase.', variant: 'error' });
      return;
    }
    setShowAddClassModal(false);
    await loadClasses();
  };

  const handleOpenEditClass = (cls) => {
    setClassToEdit({
      id: cls.id,
      kind: cls.kind || 'clase',
      name: cls.name,
      coachId: cls.coachId,
      coachName: cls.coachName,
      scheduleDays: cls.scheduleDays,
      scheduleTime: cls.scheduleTime,
      courtAssigned: cls.courtAssigned,
      maxCapacity: cls.maxCapacity || 30,
      monthlyFee: cls.monthlyFee
    });
    setShowEditClassModal(true);
  };

  const handleSaveEditClass = async (e) => {
    e.preventDefault();
    if (!classToEdit) return;
    const limit = capacityLimitFor(classToEdit.courtAssigned);
    if (classToEdit.maxCapacity > limit) {
      notify({ message: `El cupo máximo para ${classToEdit.courtAssigned} es de ${limit} alumnos.`, variant: 'warning' });
      return;
    }
    const coachObj = coaches.find(c => c.id === classToEdit.coachId);
    try {
      await coachesAndClassesService.updateClass(classToEdit.id, {
        ...classToEdit,
        coachName: coachObj ? coachObj.name : classToEdit.coachName
      });
    } catch (err) {
      notify({ title: 'Error al modificar clase', message: err.message || 'No se pudo modificar la clase.', variant: 'error' });
      return;
    }
    setShowEditClassModal(false);
    setClassToEdit(null);
    await loadClasses();
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    await coachesAndClassesService.deleteClass(classToDelete.id);
    setShowDeleteClassModal(false);
    setClassToDelete(null);
    await loadClasses();
  };

  const handleOpenStudentsModal = (cls) => {
    setClassToStudents(cls);
    setNewStudentForm({ name: '', dni: '', phone: '' });
    setShowStudentsModal(true);
  };

  // Cupo de la clase, sin pasar nunca el tope de 30.
  const classCapacity = (cls) => Math.min(Number(cls?.maxCapacity) || 30, 30);

  const handleEnrollStudentModal = async (e) => {
    e.preventDefault();
    if (!classToStudents) return;
    if (!isValidDNI(newStudentForm.dni)) {
      notify({ variant: 'warning', message: 'Ingresá un DNI válido de 7 u 8 dígitos.' });
      return;
    }
    // Un alumno no puede inscribirse dos veces en la misma clase.
    if (isEnrolledByDni(classToStudents.students, newStudentForm.dni)) {
      notify({ variant: 'warning', message: `Ese DNI ya está inscripto en "${classToStudents.name}".` });
      return;
    }
    if ((classToStudents.students?.length || 0) >= classCapacity(classToStudents)) {
      notify({ variant: 'warning', message: `No es posible agregar más alumnos: el cupo de ${classCapacity(classToStudents)} está completo.` });
      return;
    }
    try {
      await coachesAndClassesService.enrollStudent(classToStudents.id, { ...newStudentForm, dni: formatDNI(newStudentForm.dni) });
      setNewStudentForm({ name: '', dni: '', phone: '' });
      const clRes = await coachesAndClassesService.getClasses();
      setClasses(clRes.data);
      const updated = clRes.data.find(c => c.id === classToStudents.id);
      if (updated) setClassToStudents(updated);
    } catch (err) {
      notify({ title: 'Error al inscribir alumno', message: err.message || 'Error al inscribir alumno.', variant: 'error' });
    }
  };

  const handleRemoveStudentModal = async (studentId) => {
    if (!classToStudents) return;
    if (await confirm({ title: 'Baja de alumno', message: 'Confirma la baja del alumno en esta clase?', confirmLabel: 'Dar de baja', danger: true })) {
      await coachesAndClassesService.removeStudent(classToStudents.id, studentId);
      const clRes = await coachesAndClassesService.getClasses();
      setClasses(clRes.data);
      const updated = clRes.data.find(c => c.id === classToStudents.id);
      if (updated) setClassToStudents(updated);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clases y Entrenamientos
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
                <h2 className="text-base font-bold text-slate-900">
                  {classKindFilter === 'entrenamiento' ? 'Programación de Entrenamientos Grupales' : 'Programación de Clases Grupales y Escuela'}
                </h2>
                <p className="text-xs text-slate-500">Cupo máximo configurable por comisión; límite reglamentario de 30 alumnos.</p>
              </div>
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
                {[['clase', 'Clases'], ['entrenamiento', 'Entrenamientos']].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setClassKindFilter(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      classKindFilter === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label} ({classes.filter(c => (c.kind || 'clase') === k).length})
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewClassForm(prev => ({ ...prev, kind: classKindFilter }));
                setShowAddClassModal(true);
              }}
              className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              {classKindFilter === 'entrenamiento' ? 'Programar Nuevo Entrenamiento' : 'Programar Nueva Clase'}
            </button>
          </div>

          {/* Classes Grid */}
          <div id="printable-area" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="hidden print:block col-span-full text-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                TENIS AHORA — REPORTE DE {classKindFilter === 'entrenamiento' ? 'ENTRENAMIENTOS' : 'CLASES'} E INSCRIPCIONES
              </h2>
              <p className="text-xs text-slate-500">Emitido: {new Date().toLocaleString('es-AR')}</p>
            </div>
            {classes.filter(c => (c.kind || 'clase') === classKindFilter).length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No hay {classKindFilter === 'entrenamiento' ? 'entrenamientos' : 'clases'} programados.
              </div>
            )}
            {classes.filter(c => (c.kind || 'clase') === classKindFilter).map(cls => {
              const studentsList = cls.students || [];
              const enrolledCount = studentsList.length;
              const capacity = Math.min(cls.maxCapacity || 30, 30);
              const isFull = enrolledCount >= capacity;

              // Regularity count (presents >= 75%)
              const regularCount = studentsList.filter(st => {
                const att = st.attendance || [];
                const p = att.filter(a => a === 'P').length;
                const evalCount = att.filter(a => a === 'P' || a === 'A' || a === 'J').length;
                return evalCount > 0 ? (p / evalCount) >= 0.75 : true;
              }).length;

              const regularityPct = enrolledCount > 0 ? Math.round((regularCount / enrolledCount) * 100) : 100;

              return (
                <div key={cls.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                      <span className="font-semibold text-slate-600 uppercase text-[10px]">
                        {(cls.kind || 'clase') === 'entrenamiento' ? 'Entrenamiento Grupal' : 'Escuela Oficial'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {enrolledCount} / {cls.maxCapacity || 30} Alumnos
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 leading-tight">{cls.name}</h3>

                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>{(cls.kind || 'clase') === 'entrenamiento' ? 'Entrenador' : 'Profesor'}: <strong className="text-slate-800">{cls.coachName}</strong></div>
                      <div>Días y Horarios: <strong className="text-slate-800">{cls.scheduleDays} {cls.scheduleTime}</strong></div>
                      <div>Cancha: <strong className="text-slate-800">{cls.courtAssigned}</strong></div>
                      <div>Cuota Mensual: <strong className="text-slate-900">${cls.monthlyFee?.toLocaleString('es-AR')}</strong></div>
                    </div>

                    {isFull ? (
                      <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold text-center">
                        Cupo completo ({enrolledCount}/{capacity} alumnos). Nuevas inscripciones inhabilitadas.
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center justify-between border border-slate-100">
                        <span>Alumnos Regulares (≥75%):</span>
                        <strong className="text-slate-800">{regularCount} de {enrolledCount} ({regularityPct}%)</strong>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 space-y-2 no-print">
                    <button
                      type="button"
                      onClick={() => handleOpenStudentsModal(cls)}
                      className="w-full py-2 px-3 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      Nómina de Alumnos
                    </button>


                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditClass(cls)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                      >
                        Modificar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setClassToDelete(cls);
                          setShowDeleteClassModal(true);
                        }}
                        className="text-xs text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                        Eliminar
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      {/* ======================================================== */}
      {/* MODALS: GROUP CLASSES */}
      {/* ======================================================== */}

      {/* 1. Add Class Modal */}
      <Modal
        isOpen={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
        title={newClassForm.kind === 'entrenamiento' ? 'Programar Nuevo Entrenamiento Grupal' : 'Programar Nueva Clase Grupal'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Tipo de Actividad *</label>
            <select
              value={newClassForm.kind}
              onChange={(e) => setNewClassForm({ ...newClassForm, kind: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
            >
              <option value="clase">Clase</option>
              <option value="entrenamiento">Entrenamiento</option>
            </select>
          </div>
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre *</label>
            <input
              type="text"
              required
              placeholder="Escuela Juvenil Avanzada"
              value={newClassForm.name}
              onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Profesional Habilitado *</label>
              <select
                value={newClassForm.coachId}
                onChange={(e) => {
                  const sel = coaches.find(c => c.id === e.target.value);
                  setNewClassForm({
                    ...newClassForm,
                    coachId: e.target.value,
                    coachName: sel ? sel.name : ''
                  });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type || 'Profesor'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Cupo Máximo (≤{capacityLimitFor(newClassForm.courtAssigned)}) *</label>
              <input
                type="number"
                min={1}
                max={capacityLimitFor(newClassForm.courtAssigned)}
                required
                value={newClassForm.maxCapacity}
                onChange={(e) => setNewClassForm({ ...newClassForm, maxCapacity: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Días de Cursada *</label>
              <input
                type="text"
                required
                placeholder="Lunes y Miércoles"
                value={newClassForm.scheduleDays}
                onChange={(e) => setNewClassForm({ ...newClassForm, scheduleDays: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Horario *</label>
              <input
                type="text"
                required
                placeholder="18:00 - 19:30"
                value={newClassForm.scheduleTime}
                onChange={(e) => setNewClassForm({ ...newClassForm, scheduleTime: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Cancha Asignada *</label>
              <select
                value={newClassForm.courtAssigned}
                onChange={(e) => setNewClassForm({ ...newClassForm, courtAssigned: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Cancha 1 (Ladrillo)">Cancha 1 (Ladrillo)</option>
                <option value="Cancha 2 (Ladrillo)">Cancha 2 (Ladrillo)</option>
                <option value="Cancha 3 (Cemento)">Cancha 3 (Cemento)</option>
                <option value="Cancha 4 (Cemento)">Cancha 4 (Cemento)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Cuota Mensual (ARS) *</label>
              <input
                type="number"
                required
                value={newClassForm.monthlyFee}
                onChange={(e) => setNewClassForm({ ...newClassForm, monthlyFee: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddClassModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Programar Clase
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Class Modal */}
      <Modal
        isOpen={showEditClassModal}
        onClose={() => setShowEditClassModal(false)}
        title={`Modificar Clase: ${classToEdit?.name}`}
        maxWidth="max-w-lg"
      >
        {classToEdit && (
          <form onSubmit={handleSaveEditClass} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Tipo de Actividad *</label>
              <select
                value={classToEdit.kind}
                onChange={(e) => setClassToEdit({ ...classToEdit, kind: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="clase">Clase</option>
                <option value="entrenamiento">Entrenamiento</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={classToEdit.name}
                onChange={(e) => setClassToEdit({ ...classToEdit, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Profesional Asignado *</label>
                <select
                  value={classToEdit.coachId}
                  onChange={(e) => setClassToEdit({ ...classToEdit, coachId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Cupo Máximo (≤{capacityLimitFor(classToEdit.courtAssigned)}) *</label>
                <input
                  type="number"
                  min={1}
                  max={capacityLimitFor(classToEdit.courtAssigned)}
                  required
                  value={classToEdit.maxCapacity}
                  onChange={(e) => setClassToEdit({ ...classToEdit, maxCapacity: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Días *</label>
                <input
                  type="text"
                  required
                  value={classToEdit.scheduleDays}
                  onChange={(e) => setClassToEdit({ ...classToEdit, scheduleDays: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Horarios *</label>
                <input
                  type="text"
                  required
                  value={classToEdit.scheduleTime}
                  onChange={(e) => setClassToEdit({ ...classToEdit, scheduleTime: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Cancha *</label>
                <input
                  type="text"
                  required
                  value={classToEdit.courtAssigned}
                  onChange={(e) => setClassToEdit({ ...classToEdit, courtAssigned: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Cuota Mensual (ARS) *</label>
                <input
                  type="number"
                  required
                  value={classToEdit.monthlyFee}
                  onChange={(e) => setClassToEdit({ ...classToEdit, monthlyFee: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditClassModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
              >
                Guardar Modificaciones
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 3. Delete Class Modal */}
      <Modal
        isOpen={showDeleteClassModal}
        onClose={() => setShowDeleteClassModal(false)}
        title="Confirmar Eliminación de Clase"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            ¿Está seguro de que desea eliminar la clase <strong className="text-slate-900">{classToDelete?.name}</strong>?
          </p>
          <p className="text-slate-500">
            Se eliminarán la nómina de alumnos y los registros de asistencia asociados.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDeleteClassModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteClass}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Eliminar Clase
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Manage Students Modal */}
      <Modal
        isOpen={showStudentsModal}
        onClose={() => setShowStudentsModal(false)}
        title={`Nómina de Alumnos: ${classToStudents?.name}`}
        maxWidth="max-w-2xl"
      >
        {classToStudents && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">
                Alumnos Inscriptos: <strong className="text-slate-900">{classToStudents.students?.length || 0} / {classToStudents.maxCapacity || 30}</strong>
              </span>
              <span className="text-[11px] text-slate-500">Cupo: {classCapacity(classToStudents)} alumnos</span>
            </div>

            {/* Enroll Form */}
            {(classToStudents.students?.length || 0) < classCapacity(classToStudents) ? (
              <form onSubmit={handleEnrollStudentModal} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 uppercase block text-[11px]">Inscribir Nuevo Alumno</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre y Apellido"
                    value={newStudentForm.name}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    className="p-2 rounded-lg border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="DNI"
                    value={newStudentForm.dni}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, dni: e.target.value })}
                    className="p-2 rounded-lg border border-slate-200 bg-white"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Inscribir Alumno
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-xs text-center font-medium">
                Cupo de {classCapacity(classToStudents)} alumnos completo. No se permiten nuevas inscripciones en esta comisión.
              </div>
            )}

            {/* Students List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Nombre y Apellido</th>
                    <th className="p-2.5">DNI</th>
                    <th className="p-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!classToStudents.students || classToStudents.students.length === 0) ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400">
                        No hay alumnos inscriptos en esta clase.
                      </td>
                    </tr>
                  ) : (
                    classToStudents.students.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-900">{st.name}</td>
                        <td className="p-2.5 text-slate-600">{st.dni}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveStudentModal(st.id)}
                            className="text-slate-600 hover:text-slate-800 font-semibold"
                          >
                            Dar de baja
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStudentsModal(false)}
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
