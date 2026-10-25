import React, { useState, useEffect } from 'react';
import { coachesAndClassesService, documentsService } from '../../services/api';
import { Trash2 } from 'lucide-react';
import CoachCredentialsModal from '../../components/common/CoachCredentialsModal';
import Modal from '../../components/common/Modal';
import CoachCertificationsReport from '../../components/admin/CoachCertificationsReport';
import Avatar from '../../components/common/Avatar';
import { useFeedback } from '../../context/FeedbackContext';

export default function CoachesManagementPage() {
  const { notify } = useFeedback();

  const [coaches, setCoaches] = useState([]);
  const [coachRoleFilter, setCoachRoleFilter] = useState('ALL'); // ALL | Profesor | Entrenador
  const [showCertReport, setShowCertReport] = useState(false);
  const [selectedCoachForModal, setSelectedCoachForModal] = useState(null);

  // Modals for Coaches
  const [showCreateCoachModal, setShowCreateCoachModal] = useState(false);
  const [showEditCoachModal, setShowEditCoachModal] = useState(false);
  const [showDeleteCoachModal, setShowDeleteCoachModal] = useState(false);

  // Forms for Coaches
  const [coachToEdit, setCoachToEdit] = useState(null);
  // RD08: archivo del título habilitante (obligatorio en el alta, opcional para reemplazarlo)
  const [newCoachFile, setNewCoachFile] = useState(null);
  const [editCoachFile, setEditCoachFile] = useState(null);
  const [coachToDelete, setCoachToDelete] = useState(null);

  const [newCoachForm, setNewCoachForm] = useState({
    name: '',
    type: 'Profesor',
    dni: '',
    phone: '',
    email: '',
    availableHours: 'Lunes a Viernes 08:00 - 13:00, 16:00 - 20:00',
    titleName: 'Profesor Nacional de Tenis AAT',
    institution: 'Asociación Argentina de Tenis (AAT)',
    licenseNumber: '',
    issueDate: '2020-05-15',
    expiryDate: '2029-12-31'
  });

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    const res = await coachesAndClassesService.getCoaches();
    setCoaches(res.data);
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
        availableHours: newCoachForm.availableHours,
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
      notify({ title: 'Error al registrar profesional', message: err.message || 'No se pudo registrar al profesional.', variant: 'error' });
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
      availableHours: 'Lunes a Viernes 08:00 - 13:00, 16:00 - 20:00',
      titleName: 'Profesor Nacional de Tenis AAT',
      institution: 'Asociación Argentina de Tenis (AAT)',
      licenseNumber: '',
      issueDate: '2020-05-15',
      expiryDate: '2029-12-31'
    });
    await loadCoaches();
  };

  const handleOpenEditCoach = (coach) => {
    setCoachToEdit({
      id: coach.id,
      name: coach.name,
      type: coach.type || 'Profesor',
      dni: coach.dni,
      phone: coach.phone,
      email: coach.email,
      availableHours: coach.availableHours || '',
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
        availableHours: coachToEdit.availableHours,
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
      notify({ title: 'Error al modificar profesional', message: err.message || 'No se pudo modificar al profesional.', variant: 'error' });
      return;
    }
    setShowEditCoachModal(false);
    setCoachToEdit(null);
    await loadCoaches();
  };

  const handleDeleteCoach = async () => {
    if (!coachToDelete) return;
    await coachesAndClassesService.deleteCoach(coachToDelete.id);
    setShowDeleteCoachModal(false);
    setCoachToDelete(null);
    await loadCoaches();
  };

  // Filter coaches
  const filteredCoaches = coaches.filter(c => {
    if (coachRoleFilter === 'ALL') return true;
    return c.type === coachRoleFilter;
  });

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Profesionales
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
                {showCertReport ? 'Ver Fichas de Profesionales' : 'Reporte de Certificaciones'}
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
                    <Avatar user={{ name: coach.name }} size="w-12 h-12" rounded="rounded-xl" textClass="text-base" />
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                        {coach.type || 'Profesor'}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{coach.name}</h3>
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
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 space-y-2 no-print">
                  <button
                    type="button"
                    onClick={() => setSelectedCoachForModal(coach)}
                    className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 text-center"
                  >
                    Ficha y Título
                  </button>

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
        title="Confirmar Baja de Profesional"
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

      {/* External Modal: Teacher Title & Certificate */}
      <CoachCredentialsModal
        isOpen={!!selectedCoachForModal}
        onClose={() => setSelectedCoachForModal(null)}
        coach={selectedCoachForModal}
      />

    </div>
  );
}
