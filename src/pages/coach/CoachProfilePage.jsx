import React, { useState, useEffect } from 'react';
import { coachesAndClassesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CoachCredentialsModal from '../../components/common/CoachCredentialsModal';
import ProfileModal from '../../components/common/ProfileModal';
import Avatar from '../../components/common/Avatar';
import { useFeedback } from '../../context/FeedbackContext';

export default function CoachProfilePage() {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [coachProfile, setCoachProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form states
  const [availableHoursInput, setAvailableHoursInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user, showProfileModal]);

  const loadProfile = async () => {
    const cRes = await coachesAndClassesService.getCoaches();
    const currentCoach = cRes.data.find(c => c.id === user?.coachId);
    if (currentCoach) {
      setCoachProfile(currentCoach);
      setAvailableHoursInput(currentCoach.availableHours || 'Lunes a Viernes 08:00 - 13:00, 16:00 - 21:00');
      setPhoneInput(currentCoach.phone || '');
      setEmailInput(currentCoach.email || '');
    }
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    if (!coachProfile) return;
    setSavingAvail(true);
    await coachesAndClassesService.updateCoachAvailability(coachProfile.id, availableHoursInput);
    setSavingAvail(false);
    notify({ variant: 'success', title: 'Datos guardados', message: 'Disponibilidad horaria actualizada con éxito.' });
    await loadProfile();
  };

  const handleSaveContactInfo = async (e) => {
    e.preventDefault();
    if (!coachProfile) return;
    setSavingProfile(true);
    await coachesAndClassesService.updateCoach(coachProfile.id, {
      phone: phoneInput,
      email: emailInput
    });
    setSavingProfile(false);
    notify({ variant: 'success', title: 'Datos guardados', message: 'Información de contacto actualizada con éxito.' });
    await loadProfile();
  };

  const license = coachProfile?.licenseDetails;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Mi Perfil, Horarios y Título Habilitante
          </h1>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          Imprimir Ficha Oficial
        </button>
      </div>

      {/* Identidad: nombre, teléfono y foto (editables desde Mi Perfil) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Avatar user={user} size="w-16 h-16" rounded="rounded-2xl" textClass="text-xl" />
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.rolBackend || 'Profesor'} • N° {user?.memberNumber || '—'}</p>
            <p className="text-xs text-slate-500 mt-0.5">Tel.: {user?.phone || 'sin cargar'} • {user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowProfileModal(true)}
          className="px-3.5 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs rounded-xl shadow-sm self-start sm:self-auto"
        >
          Editar nombre, teléfono y foto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Título Habilitante y Certificación Deportiva (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Certificación Oficial y Título Habilitante</h2>
              </div>
              <span className="text-xs font-semibold text-tennis-700 flex items-center gap-1">
                Habilitado
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Denominación Oficial:</span>
                <div className="font-bold text-sm text-slate-900 mt-0.5">
                  {license?.titleName || 'Profesor Nacional de Tenis de Alta Competencia'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Entidad Emisora:</span>
                  <strong className="text-slate-800 block mt-0.5">{license?.institution}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">N° de Matrícula:</span>
                  <strong className="text-tennis-700 block mt-0.5">{license?.licenseNumber}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Emisión:</span>
                  <strong className="text-slate-800 block mt-0.5">{license?.issueDate}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vencimiento Vigencia:</span>
                  <strong className="text-slate-800 block mt-0.5">{license?.expiryDate}</strong>
                </div>
              </div>

              {/* Digital Attachment Preview */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div>
                    <span className="font-semibold text-slate-800 block">{license?.document?.name || 'Sin documento adjunto'}</span>
                    <span className="text-[11px] text-slate-500">Título habilitante digitalizado</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCredentialsModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 shadow-sm"
                >
                  Ver Ficha Oficial
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                Este certificado avala la habilitación oficial para dictar clases grupales de escuela y entrenamientos de competición en las canchas del club.
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Horarios Disponibles (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Horarios Disponibles</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina los días y franjas horarias en las que los socios pueden agendar turnos particulares con usted.
              </p>
            </div>

            <form onSubmit={handleSaveAvailability} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">
                  Franja Horaria y Días Disponibles *
                </label>
                <textarea
                  required
                  rows={3}
                  value={availableHoursInput}
                  onChange={(e) => setAvailableHoursInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={savingAvail}
                className="w-full py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                {savingAvail ? 'Guardando...' : 'Guardar Horarios'}
              </button>
            </form>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Datos de Contacto</h2>
              <p className="text-xs text-slate-500 mt-0.5">Información visible para la administración del club.</p>
            </div>

            <form onSubmit={handleSaveContactInfo} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 uppercase block mb-1">Teléfono *</label>
                  <input
                    type="text"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 uppercase block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                {savingProfile ? 'Actualizando...' : 'Actualizar Información de Contacto'}
              </button>
            </form>
          </div>

        </div>

      </div>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* Credentials Modal */}
      <CoachCredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        coach={coachProfile}
      />

    </div>
  );
}
