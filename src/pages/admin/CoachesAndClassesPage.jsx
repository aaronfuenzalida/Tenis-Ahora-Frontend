import React, { useState, useEffect } from 'react';
import { coachesAndClassesService, courtTypesService, documentsService } from '../../services/api';
import { Edit, Trash2 } from 'lucide-react';
import CoachCredentialsModal from '../../components/common/CoachCredentialsModal';
import AttendanceSheetModal from '../../components/common/AttendanceSheetModal';
import AttendanceMatrixModal from '../../components/common/AttendanceMatrixModal';
import { isEnrolledByDni, isValidDNI, formatDNI } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import CoachCertificationsReport from '../../components/admin/CoachCertificationsReport';
import { useFeedback } from '../../context/FeedbackContext';

export default function CoachesAndClassesPage() {
  const { notify, confirm } = useFeedback();
  // Main Tab: 'coaches' | 'group-classes' | 'private-classes'
  const [activeMainTab, setActiveMainTab] = useState('coaches');

  // ==========================================
  // STATE: COACHES
  // ==========================================
  const [coaches, setCoaches] = useState([]);
  const [coachRoleFilter, setCoachRoleFilter] = useState('ALL'); // ALL | Profesor | Entrenador
  const [showCertReport, setShowCertReport] = useState(false);
  const [classKindFilter, setClassKindFilter] = useState('clase'); // clase | entrenamiento (RF066-RF091)
  const [privateKindFilter, setPrivateKindFilter] = useState('ALL'); // ALL | clase | entrenamiento
  const [selectedCoachForModal, setSelectedCoachForModal] = useState(null);

  // Modals for Coaches
  const [showCreateCoachModal, setShowCreateCoachModal] = useState(false);
  const [showEditCoachModal, setShowEditCoachModal] = useState(false);
  const [showDeleteCoachModal, setShowDeleteCoachModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  // Forms for Coaches
  const [coachToEdit, setCoachToEdit] = useState(null);
  // RD08: archivo del título habilitante (obligatorio en el alta, opcional para reemplazarlo)
  const [newCoachFile, setNewCoachFile] = useState(null);
  const [editCoachFile, setEditCoachFile] = useState(null);
  const [coachToDelete, setCoachToDelete] = useState(null);
  const [coachToAvail, setCoachToAvail] = useState(null);
  const [availHoursInput, setAvailHoursInput] = useState('');

  const [newCoachForm, setNewCoachForm] = useState({
    name: '',
    type: 'Profesor',
    dni: '',
    phone: '',
    email: '',
    specialty: 'Alto Rendimiento & Técnica',
    experienceYears: 5,
    hourlyRatePrivate: 6000,
    availableHours: 'Lunes a Viernes 08:00 - 13:00, 16:00 - 20:00',
    bio: '',
    titleName: 'Profesor Nacional de Tenis AAT',
    institution: 'Asociación Argentina de Tenis (AAT)',
    licenseNumber: '',
    issueDate: '2020-05-15',
    expiryDate: '2029-12-31'
  });

  // ==========================================
  // STATE: GROUP CLASSES
  // ==========================================
  const [classes, setClasses] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [selectedClassForSheet, setSelectedClassForSheet] = useState(null);

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

  // ==========================================
  // STATE: PRIVATE CLASSES
  // ==========================================
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

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const [cRes, clRes, prvRes, ctRes] = await Promise.all([
      coachesAndClassesService.getCoaches(),
      coachesAndClassesService.getClasses(),
      coachesAndClassesService.getPrivateClasses(),
      courtTypesService.getAll()
    ]);
    setCoaches(cRes.data);
    setClasses(clRes.data);
    setPrivateClasses(prvRes.data);
    setCourtTypes(ctRes.data);

    if (cRes.data.length > 0) {
      if (!newClassForm.coachId) {
        setNewClassForm(prev => ({
          ...prev,
          coachId: cRes.data[0].id,
          coachName: cRes.data[0].name
        }));
      }
      if (!newPrivateForm.coachId) {
        setNewPrivateForm(prev => ({
          ...prev,
          coachId: cRes.data[0].id,
          coachName: cRes.data[0].name,
          hourlyRate: cRes.data[0].hourlyRatePrivate || 6000
        }));
      }
    }
  };

  // ==========================================
  // HANDLERS: COACHES
  // ==========================================
  const handleCreateCoach = async (e) => {
    e.preventDefault();
    if (!newCoachForm.licenseNumber.trim()) {
      notify({ message: 'Debe ingresar el número de matrícula o licencia deportiva oficial.', variant: 'warning' });
      return;
    }
    if (!newCoachFile) {
      notify({ message: 'Debe adjuntar el documento del título habilitante.', variant: 'warning' });
      return;
    }
    try {
      const docRes = await documentsService.upload(newCoachFile);
      await coachesAndClassesService.createCoach({
        name: newCoachForm.name,
        type: newCoachForm.type,
        dni: newCoachForm.dni,
        phone: newCoachForm.phone,
        email: newCoachForm.email,
        specialty: newCoachForm.specialty,
        experienceYears: Number(newCoachForm.experienceYears) || 1,
        hourlyRatePrivate: Number(newCoachForm.hourlyRatePrivate) || 5000,
        availableHours: newCoachForm.availableHours,
        bio: newCoachForm.bio || 'Profesor oficial habilitado por la institución.',
        licenseDetails: {
          titleName: newCoachForm.titleName,
          institution: newCoachForm.institution,
          licenseNumber: newCoachForm.licenseNumber,
          issueDate: newCoachForm.issueDate,
          expiryDate: newCoachForm.expiryDate,
          status: 'habilitado',
          document: docRes.data
        }
      });
    } catch (err) {
      notify({ title: 'Error al registrar profesor', message: err.message || 'No se pudo registrar al profesor.', variant: 'error' });
      return;
    }

    setShowCreateCoachModal(false);
    setNewCoachFile(null);
    setNewCoachForm({
      name: '',
      type: 'Profesor',
      dni: '',
      phone: '',
      email: '',
      specialty: 'Alto Rendimiento & Técnica',
      experienceYears: 5,
      hourlyRatePrivate: 6000,
      availableHours: 'Lunes a Viernes 08:00 - 13:00, 16:00 - 20:00',
      bio: '',
      titleName: 'Profesor Nacional de Tenis AAT',
      institution: 'Asociación Argentina de Tenis (AAT)',
      licenseNumber: '',
      issueDate: '2020-05-15',
      expiryDate: '2029-12-31'
    });
    await loadAllData();
  };

  const handleOpenEditCoach = (coach) => {
    setCoachToEdit({
      id: coach.id,
      name: coach.name,
      type: coach.type || 'Profesor',
      dni: coach.dni,
      phone: coach.phone,
      email: coach.email,
      specialty: coach.specialty,
      experienceYears: coach.experienceYears,
      hourlyRatePrivate: coach.hourlyRatePrivate,
      availableHours: coach.availableHours || '',
      bio: coach.bio || '',
      titleName: coach.licenseDetails?.titleName || '',
      institution: coach.licenseDetails?.institution || '',
      licenseNumber: coach.licenseDetails?.licenseNumber || '',
      issueDate: coach.licenseDetails?.issueDate || '',
      expiryDate: coach.licenseDetails?.expiryDate || '',
      status: coach.licenseDetails?.status || 'habilitado',
      document: coach.licenseDetails?.document || null
    });
    setEditCoachFile(null);
    setShowEditCoachModal(true);
  };

  const handleSaveEditCoach = async (e) => {
    e.preventDefault();
    if (!coachToEdit) return;
    try {
      const licenseDocument = editCoachFile ? (await documentsService.upload(editCoachFile)).data : coachToEdit.document;
      await coachesAndClassesService.updateCoach(coachToEdit.id, {
        name: coachToEdit.name,
        type: coachToEdit.type,
        dni: coachToEdit.dni,
        phone: coachToEdit.phone,
        email: coachToEdit.email,
        specialty: coachToEdit.specialty,
        experienceYears: Number(coachToEdit.experienceYears),
        hourlyRatePrivate: Number(coachToEdit.hourlyRatePrivate),
        availableHours: coachToEdit.availableHours,
        bio: coachToEdit.bio,
        licenseDetails: {
          titleName: coachToEdit.titleName,
          institution: coachToEdit.institution,
          licenseNumber: coachToEdit.licenseNumber,
          issueDate: coachToEdit.issueDate,
          expiryDate: coachToEdit.expiryDate,
          status: coachToEdit.status,
          document: licenseDocument
        }
      });
    } catch (err) {
      notify({ title: 'Error al modificar profesor', message: err.message || 'No se pudo modificar al profesor.', variant: 'error' });
      return;
    }
    setShowEditCoachModal(false);
    setCoachToEdit(null);
    await loadAllData();
  };

  const handleDeleteCoach = async () => {
    if (!coachToDelete) return;
    await coachesAndClassesService.deleteCoach(coachToDelete.id);
    setShowDeleteCoachModal(false);
    setCoachToDelete(null);
    await loadAllData();
  };

  const handleOpenAvailModal = (coach) => {
    setCoachToAvail(coach);
    setAvailHoursInput(coach.availableHours || 'Lunes a Viernes 08:00 - 13:00, 16:00 - 20:00');
    setShowAvailabilityModal(true);
  };

  const handleSaveAvailHours = async (e) => {
    e.preventDefault();
    if (!coachToAvail) return;
    await coachesAndClassesService.updateCoachAvailability(coachToAvail.id, availHoursInput);
    setShowAvailabilityModal(false);
    setCoachToAvail(null);
    await loadAllData();
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
    await loadAllData();
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
    await loadAllData();
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    await coachesAndClassesService.deleteClass(classToDelete.id);
    setShowDeleteClassModal(false);
    setClassToDelete(null);
    await loadAllData();
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

  const handleToggleAttendance = async (classId, studentId, sessionIndex) => {
    await coachesAndClassesService.toggleStudentAttendance(classId, studentId, sessionIndex);
    const clRes = await coachesAndClassesService.getClasses();
    setClasses(clRes.data);
    const updated = clRes.data.find(c => c.id === classId);
    if (updated) setSelectedClassForAttendance(updated);
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
      hourlyRate: coaches[0]?.hourlyRatePrivate || 6500,
      notes: ''
    });
    await loadAllData();
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
    await loadAllData();
  };

  const handleCancelPrivate = async (id) => {
    if (await confirm({ title: 'Cancelar clase particular', message: 'Confirma la cancelación de esta clase particular?', confirmLabel: 'Cancelar clase', danger: true })) {
      await coachesAndClassesService.cancelPrivateClass(id);
      await loadAllData();
    }
  };

  const handleDeletePrivate = async (id) => {
    if (await confirm({ title: 'Eliminar clase particular', message: 'Confirma la eliminación del registro de esta clase particular?', confirmLabel: 'Eliminar', danger: true })) {
      await coachesAndClassesService.deletePrivateClass(id);
      await loadAllData();
    }
  };

  // Filter coaches
  const filteredCoaches = coaches.filter(c => {
    if (coachRoleFilter === 'ALL') return true;
    return c.type === coachRoleFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Main Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestión de Profesores, Entrenadores, Clases y Entrenamientos
          </h1>
        </div>

        {/* Switcher Tab */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMainTab('coaches')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeMainTab === 'coaches'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profesores y Entrenadores
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('group-classes')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeMainTab === 'group-classes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clases, Entrenamientos y Asistencia
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('private-classes')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeMainTab === 'private-classes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Turnos Particulares
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5"
          >
            Imprimir
          </button>
        </div>
      </div>

      {/* Mandatory Official Certification Banner */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-3 no-print">
        <div>
          <strong className="text-slate-900">Normativa Institucional Obligatoria:</strong> Todos los profesores y entrenadores registrados deben contar con su Título Habilitante y Certificación Deportiva oficial acreditada (AAT / ITF / Educación Física) vigente antes de impartir clases o entrenamientos en las instalaciones del club.
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: COACHES & TRAINERS */}
      {/* ======================================================== */}
      {activeMainTab === 'coaches' && (
        <div className="space-y-4">
          
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtrar por rol:</span>
              <div className="flex items-center gap-1">
                {['ALL', 'Profesor', 'Entrenador'].map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setCoachRoleFilter(role)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      coachRoleFilter === role
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {role === 'ALL' ? 'Todos' : `${role}es`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCertReport(prev => !prev)}
                className={`px-3.5 py-2 font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 border ${
                  showCertReport ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {showCertReport ? 'Ver Fichas de Profesores' : 'Reporte de Certificaciones'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateCoachModal(true)}
                className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                Nuevo Profesional
              </button>
            </div>
          </div>

          {showCertReport && (
            <CoachCertificationsReport coaches={coaches} roleFilter={coachRoleFilter} />
          )}

          {/* Coaches Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${showCertReport ? 'hidden' : ''}`}>
            {filteredCoaches.map(coach => (
              <div key={coach.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={coach.photo}
                      alt={coach.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                        {coach.type || 'Profesor'}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{coach.name}</h3>
                      <p className="text-xs text-tennis-700 font-medium mt-0.5">{coach.specialty}</p>
                      <p className="text-[11px] text-slate-400 mt-1">DNI: {coach.dni} • Tel: {coach.phone}</p>
                    </div>
                  </div>

                  {/* License Info Box */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Título Habilitante</span>
                      <span className="text-xs font-semibold text-tennis-700 flex items-center gap-1">
                        Habilitado
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 line-clamp-1">{coach.licenseDetails?.titleName}</div>
                    <div className="text-[11px] text-slate-500">
                      Matrícula: <strong className="text-slate-700">{coach.licenseDetails?.licenseNumber}</strong> • Emisión: {coach.licenseDetails?.issueDate}
                    </div>
                  </div>

                  {/* Availability Hours */}
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Disponibilidad Horaria:</span>
                    <span className="font-medium text-slate-700">{coach.availableHours || 'A convenir con administración'}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>Trayectoria: <strong className="text-slate-800">{coach.experienceYears} años</strong></span>
                    <span>Tarifa particular: <strong className="text-slate-900">${coach.hourlyRatePrivate?.toLocaleString('es-AR')}/h</strong></span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 space-y-2 no-print">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCoachForModal(coach)}
                      className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 text-center"
                    >
                      Ficha y Título
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAvailModal(coach)}
                      className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 text-center"
                    >
                      Horarios
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCoach(coach)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                    >
                      Modificar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCoachToDelete(coach);
                        setShowDeleteCoachModal(true);
                      }}
                      className="text-xs text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                      Dar de baja
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: GROUP CLASSES */}
      {/* ======================================================== */}
      {activeMainTab === 'group-classes' && (
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
                      onClick={() => setSelectedClassForAttendance(cls)}
                      className="w-full py-2 px-3 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      Tomar Asistencia
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedClassForSheet(cls)}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1"
                      >
                        Planilla A4
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenStudentsModal(cls)}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1"
                      >
                        Nómina Alumnos
                      </button>
                    </div>

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
      )}

      {/* ======================================================== */}
      {/* SECTION 3: PRIVATE CLASSES */}
      {/* ======================================================== */}
      {activeMainTab === 'private-classes' && (
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
                  <th className="p-3">Profesor Asignado</th>
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
      )}

      {/* ======================================================== */}
      {/* MODALS: COACHES */}
      {/* ======================================================== */}

      {/* 1. Create Coach Modal */}
      <Modal
        isOpen={showCreateCoachModal}
        onClose={() => setShowCreateCoachModal(false)}
        title="Registrar Nuevo Profesor o Entrenador"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateCoach} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre y Apellido *</label>
              <input
                type="text"
                required
                placeholder="Lic. Martín Palermo"
                value={newCoachForm.name}
                onChange={(e) => setNewCoachForm({ ...newCoachForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Rol / Tipo de Profesional *</label>
              <select
                value={newCoachForm.type}
                onChange={(e) => setNewCoachForm({ ...newCoachForm, type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Profesor">Profesor de Tenis</option>
                <option value="Entrenador">Entrenador Deportivo</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Documento (DNI) *</label>
              <input
                type="text"
                required
                placeholder="28.990.123"
                value={newCoachForm.dni}
                onChange={(e) => setNewCoachForm({ ...newCoachForm, dni: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Teléfono *</label>
              <input
                type="text"
                required
                placeholder="+54 11 4455-6677"
                value={newCoachForm.phone}
                onChange={(e) => setNewCoachForm({ ...newCoachForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Correo Electrónico *</label>
              <input
                type="email"
                required
                placeholder="profesor@tenisahora.com"
                value={newCoachForm.email}
                onChange={(e) => setNewCoachForm({ ...newCoachForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Años de Trayectoria *</label>
              <input
                type="number"
                min={1}
                required
                value={newCoachForm.experienceYears}
                onChange={(e) => setNewCoachForm({ ...newCoachForm, experienceYears: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Especialidad Principal *</label>
              <input
                type="text"
                required
                placeholder="Alto Rendimiento & Técnica"
                value={newCoachForm.specialty}
                onChange={(e) => setNewCoachForm({ ...newCoachForm, specialty: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Tarifa Hora Particular (ARS) *</label>
              <input
                type="number"
                required
                value={newCoachForm.hourlyRatePrivate}
                onChange={(e) => setNewCoachForm({ ...newCoachForm, hourlyRatePrivate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Horarios Disponibles Semanales *</label>
            <input
              type="text"
              required
              placeholder="Lunes a Viernes 08:00 - 13:00, 16:00 - 20:00"
              value={newCoachForm.availableHours}
              onChange={(e) => setNewCoachForm({ ...newCoachForm, availableHours: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          {/* Mandatory Certification Group */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-900 uppercase block text-[11px]">
              Certificación Deportiva / Título Habilitante (Excluyente)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Denominación del Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Profesor Nacional de Tenis AAT"
                  value={newCoachForm.titleName}
                  onChange={(e) => setNewCoachForm({ ...newCoachForm, titleName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Institución Emisora *</label>
                <input
                  type="text"
                  required
                  placeholder="Asociación Argentina de Tenis (AAT)"
                  value={newCoachForm.institution}
                  onChange={(e) => setNewCoachForm({ ...newCoachForm, institution: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">N° de Matrícula / Licencia *</label>
                <input
                  type="text"
                  required
                  placeholder="AAT-LIC-77492"
                  value={newCoachForm.licenseNumber}
                  onChange={(e) => setNewCoachForm({ ...newCoachForm, licenseNumber: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vigencia / Vencimiento *</label>
                <input
                  type="date"
                  required
                  value={newCoachForm.expiryDate}
                  onChange={(e) => setNewCoachForm({ ...newCoachForm, expiryDate: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Documento del Título (PDF, JPG o PNG, máx. 5 MB) *</label>
              <input
                type="file"
                required
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setNewCoachFile(e.target.files?.[0] || null)}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateCoachModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Guardar y Habilitar
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Coach Modal */}
      <Modal
        isOpen={showEditCoachModal}
        onClose={() => setShowEditCoachModal(false)}
        title={`Modificar Profesional: ${coachToEdit?.name}`}
        maxWidth="max-w-xl"
      >
        {coachToEdit && (
          <form onSubmit={handleSaveEditCoach} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  value={coachToEdit.name}
                  onChange={(e) => setCoachToEdit({ ...coachToEdit, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Rol *</label>
                <select
                  value={coachToEdit.type}
                  onChange={(e) => setCoachToEdit({ ...coachToEdit, type: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  <option value="Profesor">Profesor</option>
                  <option value="Entrenador">Entrenador</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">DNI *</label>
                <input
                  type="text"
                  required
                  value={coachToEdit.dni}
                  onChange={(e) => setCoachToEdit({ ...coachToEdit, dni: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Teléfono *</label>
                <input
                  type="text"
                  required
                  value={coachToEdit.phone}
                  onChange={(e) => setCoachToEdit({ ...coachToEdit, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={coachToEdit.email}
                  onChange={(e) => setCoachToEdit({ ...coachToEdit, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Tarifa Particular (ARS) *</label>
                <input
                  type="number"
                  required
                  value={coachToEdit.hourlyRatePrivate}
                  onChange={(e) => setCoachToEdit({ ...coachToEdit, hourlyRatePrivate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Horarios Disponibles *</label>
              <input
                type="text"
                required
                value={coachToEdit.availableHours}
                onChange={(e) => setCoachToEdit({ ...coachToEdit, availableHours: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-900 uppercase block text-[11px]">
                Datos de Certificación Deportiva
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Denominación del Título *</label>
                  <input
                    type="text"
                    required
                    value={coachToEdit.titleName}
                    onChange={(e) => setCoachToEdit({ ...coachToEdit, titleName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Matrícula / Registro *</label>
                  <input
                    type="text"
                    required
                    value={coachToEdit.licenseNumber}
                    onChange={(e) => setCoachToEdit({ ...coachToEdit, licenseNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vigencia / Vencimiento *</label>
                  <input
                    type="date"
                    required
                    value={coachToEdit.expiryDate}
                    onChange={(e) => setCoachToEdit({ ...coachToEdit, expiryDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Documento del Título {coachToEdit.document ? `· actual: ${coachToEdit.document.name}` : '· obligatorio'}
                </label>
                <input
                  type="file"
                  required={!coachToEdit.document}
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => setEditCoachFile(e.target.files?.[0] || null)}
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditCoachModal(false)}
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

      {/* 3. Delete Coach Modal */}
      <Modal
        isOpen={showDeleteCoachModal}
        onClose={() => setShowDeleteCoachModal(false)}
        title="Confirmar Baja de Profesor"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            ¿Está seguro de que desea dar de baja al profesional <strong className="text-slate-900">{coachToDelete?.name}</strong>?
          </p>
          <p className="text-slate-500">
            Se desvinculará de las clases y turnos asignados en el complejo deportivo.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDeleteCoachModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteCoach}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Confirmar Baja
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Availability Modal */}
      <Modal
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        title={`Disponibilidad Horaria: ${coachToAvail?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAvailHours} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Franja Horaria y Días Disponibles *</label>
            <textarea
              required
              rows={4}
              value={availHoursInput}
              onChange={(e) => setAvailHoursInput(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAvailabilityModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Actualizar Disponibilidad
            </button>
          </div>
        </form>
      </Modal>

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
              <label className="font-semibold text-slate-700 uppercase block mb-1">Profesor Habilitado *</label>
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
                <label className="font-semibold text-slate-700 uppercase block mb-1">Profesor Asignado *</label>
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
                    coachName: sel ? sel.name : '',
                    hourlyRate: sel?.hourlyRatePrivate || 6000
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
                <label className="font-semibold text-slate-700 uppercase block mb-1">Profesor Asignado *</label>
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

      {/* External Modal: Teacher Title & Certificate */}
      <CoachCredentialsModal
        isOpen={!!selectedCoachForModal}
        onClose={() => setSelectedCoachForModal(null)}
        coach={selectedCoachForModal}
      />

      {/* External Modal: Printable Attendance Sheet */}
      <AttendanceSheetModal
        isOpen={!!selectedClassForSheet}
        onClose={() => setSelectedClassForSheet(null)}
        classItem={selectedClassForSheet}
      />

      {/* External Modal: Interactive Visual Attendance Matrix */}
      <AttendanceMatrixModal
        isOpen={!!selectedClassForAttendance}
        onClose={() => setSelectedClassForAttendance(null)}
        classItem={selectedClassForAttendance}
        onToggleAttendance={handleToggleAttendance}
onEnrollStudent={async (classId, studentData) => {
          await coachesAndClassesService.enrollStudent(classId, studentData);
          const clRes = await coachesAndClassesService.getClasses();
          setClasses(clRes.data);
          const updated = clRes.data.find(c => c.id === classId);
          if (updated) setSelectedClassForAttendance(updated);
        }}
        onOpenPrintSheet={(cls) => setSelectedClassForSheet(cls)}
      />

    </div>
  );
}
