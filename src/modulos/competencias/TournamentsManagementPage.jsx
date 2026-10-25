import React, { useState, useEffect } from 'react';
import { tournamentsService, competitionTypesService, documentsService } from '../../api';
import { Trash2 } from 'lucide-react';
import Modal from '../../ui/Modal';
import { RulesDocumentInput, RulesDocumentLink } from './RulesDocument';
import TournamentBracketTree from './TournamentBracketTree';
import { useFeedback } from '../../ui/FeedbackContext';

// Sube el archivo elegido y devuelve el valor de internalRulesDocument: undefined no lo cambia, null lo quita.
const rulesDocumentFor = async (file, remove) => {
  if (file) return (await documentsService.upload(file)).data;
  return remove ? null : undefined;
};

export default function TournamentsManagementPage() {
  const { notify, confirm } = useFeedback();
  const [competitionTypes, setCompetitionTypes] = useState([]);

  // ==========================================
  // TOURNAMENTS STATE
  // ==========================================
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentSubTab, setTournamentSubTab] = useState('bracket'); // 'bracket' | 'participants' | 'rules'

  // Modals for Tournaments
  const [showCreateTrnModal, setShowCreateTrnModal] = useState(false);
  const [showEditTrnModal, setShowEditTrnModal] = useState(false);
  const [showDeleteTrnModal, setShowDeleteTrnModal] = useState(false);
  const [showRulesTrnModal, setShowRulesTrnModal] = useState(false);
  const [showEnrollTrnModal, setShowEnrollTrnModal] = useState(false);

  // Tournament Forms
  const [newTrnForm, setNewTrnForm] = useState({
    competitionTypeId: '',
    name: '',
    category: 'Masculino',
    modality: 'Singles',
    surfaceRequired: 'Ladrillo',
    startDate: '2026-09-01',
    endDate: '2026-09-10',
    registrationFee: 7500,
    maxParticipants: 16,
    description: '',
    internalRules: 'Reglamento Interno Oficial: Partidos a eliminación directa al mejor de 3 sets con tie-break en todos los sets. Presentación con 15 minutos de tolerancia. Es obligatorio el calzado reglamentario para polvo de ladrillo.'
  });

  const [editTrnForm, setEditTrnForm] = useState(null);
  const [rulesTrnText, setRulesTrnText] = useState('');
  const [rulesTrnFile, setRulesTrnFile] = useState(null);
  const [rulesTrnRemove, setRulesTrnRemove] = useState(false);
  const [newTrnFile, setNewTrnFile] = useState(null);
  const [enrollTrnForm, setEnrollTrnForm] = useState({
    name: '',
    dni: '',
    phone: '',
    partnerName: '',
    partnerDni: ''
  });

  useEffect(() => {
    loadTournaments();
    loadCompetitionTypes();
  }, []);

  const loadCompetitionTypes = async () => {
    const res = await competitionTypesService.getAll();
    setCompetitionTypes(res.data || []);
  };

  const competitionTypeName = (id) => competitionTypes.find(t => t.id === id)?.name || 'Sin tipo asignado';
  const typesFor = (scope) => competitionTypes.filter(t => t.active !== false && (t.appliesTo === scope || t.appliesTo === 'Ambos'));

  const loadTournaments = async () => {
    const res = await tournamentsService.getAll();
    setTournaments(res.data);
    if (res.data.length > 0) {
      if (!selectedTournament) {
        setSelectedTournament(res.data[0]);
      } else {
        const found = res.data.find(t => t.id === selectedTournament.id);
        setSelectedTournament(found || res.data[0]);
      }
    } else {
      setSelectedTournament(null);
    }
  };

  // ==========================================
  // TOURNAMENT HANDLERS
  // ==========================================
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    let res;
    try {
      // El documento se sube primero: si falla, no queda un torneo creado a medias.
      const rulesDocument = await rulesDocumentFor(newTrnFile, false);
      res = await tournamentsService.create(newTrnForm);
      if (rulesDocument) res = await tournamentsService.updateInternalRules(res.data.id, undefined, rulesDocument);
    } catch (err) {
      notify({ title: 'Error al registrar torneo', message: err.message || 'No se pudo registrar el torneo.', variant: 'error' });
      return;
    }
    setShowCreateTrnModal(false);
    setNewTrnFile(null);
    setNewTrnForm({
      competitionTypeId: '',
      name: '',
      category: 'Masculino',
      modality: 'Singles',
      surfaceRequired: 'Ladrillo',
      startDate: '2026-09-01',
      endDate: '2026-09-10',
      registrationFee: 7500,
      maxParticipants: 16,
      description: '',
      internalRules: 'Reglamento Interno Oficial: Partidos a eliminación directa al mejor de 3 sets.'
    });
    await loadTournaments();
    if (res.data) setSelectedTournament(res.data);
  };

  const handleOpenEditTournament = () => {
    if (!selectedTournament) return;
    setEditTrnForm({
      competitionTypeId: selectedTournament.competitionTypeId || '',
      name: selectedTournament.name,
      category: selectedTournament.category,
      modality: selectedTournament.modality,
      surfaceRequired: selectedTournament.surfaceRequired,
      startDate: selectedTournament.startDate,
      endDate: selectedTournament.endDate,
      registrationFee: selectedTournament.registrationFee,
      maxParticipants: selectedTournament.maxParticipants,
      status: selectedTournament.status,
      description: selectedTournament.description || ''
    });
    setShowEditTrnModal(true);
  };

  const handleSaveEditTournament = async (e) => {
    e.preventDefault();
    if (!selectedTournament || !editTrnForm) return;
    await tournamentsService.update(selectedTournament.id, editTrnForm);
    setShowEditTrnModal(false);
    await loadTournaments();
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournament) return;
    await tournamentsService.delete(selectedTournament.id);
    setShowDeleteTrnModal(false);
    setSelectedTournament(null);
    await loadTournaments();
  };

  const handleOpenRulesTournament = () => {
    if (!selectedTournament) return;
    setRulesTrnText(selectedTournament.internalRules || '');
    setRulesTrnFile(null);
    setRulesTrnRemove(false);
    setShowRulesTrnModal(true);
  };

  const handleSaveRulesTournament = async (e) => {
    e.preventDefault();
    if (!selectedTournament) return;
    try {
      const rulesDocument = await rulesDocumentFor(rulesTrnFile, rulesTrnRemove);
      await tournamentsService.updateInternalRules(selectedTournament.id, rulesTrnText, rulesDocument);
    } catch (err) {
      notify({ title: 'Error al guardar reglamento', message: err.message || 'No se pudo guardar el reglamento.', variant: 'error' });
      return;
    }
    setShowRulesTrnModal(false);
    await loadTournaments();
  };

  const handleEnrollTournament = async (e) => {
    e.preventDefault();
    if (!selectedTournament) return;
    try {
      await tournamentsService.enroll(selectedTournament.id, enrollTrnForm);
    } catch (err) {
      notify({ variant: 'warning', title: 'No se pudo inscribir', message: err.message || 'Intentá nuevamente.' });
      return;
    }
    setEnrollTrnForm({
      name: '',
      dni: '',
      phone: '',
      partnerName: '',
      partnerDni: ''
    });
    setShowEnrollTrnModal(false);
    await loadTournaments();
  };

  const handleRemoveParticipantTrn = async (participantId) => {
    if (!selectedTournament) return;
    if (await confirm({ title: 'Baja de participante', message: 'Confirma la baja del participante en este torneo?', confirmLabel: 'Dar de baja', danger: true })) {
      await tournamentsService.removeParticipant(selectedTournament.id, participantId);
      await loadTournaments();
    }
  };

  const handleBracketUpdate = async (updatedTrn) => {
    setSelectedTournament(updatedTrn);
    setTournaments(tournaments.map(t => t.id === updatedTrn.id ? updatedTrn : t));
    try {
      await tournamentsService.update(updatedTrn.id, { bracket: updatedTrn.bracket });
    } catch (err) {
      notify({ variant: 'error', title: 'No se pudo guardar el cuadro', message: err.message || 'Intentá nuevamente.' });
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Torneos
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Tournaments List (4 cols) */}
          <div className="lg:col-span-4 space-y-3 no-print">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Torneos Registrados
              </span>
              <button
                type="button"
                onClick={() => setShowCreateTrnModal(true)}
                className="px-3 py-1.5 rounded-lg bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1"
              >
                Nuevo Torneo
              </button>
            </div>

            {tournaments.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No hay torneos registrados en el sistema.
              </div>
            ) : (
              tournaments.map(trn => {
                const isSelected = selectedTournament?.id === trn.id;
                return (
                  <div
                    key={trn.id}
                    onClick={() => setSelectedTournament(trn)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-tennis-600 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-600 pb-1">
                      <span className="font-semibold text-slate-800">
                        {trn.category} • {trn.modality}
                      </span>
                      <span className="text-slate-500">
                        {trn.surfaceRequired}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 mt-1">{trn.name}</h3>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                      <span>Inscriptos: <strong className="text-slate-800">{trn.currentEnrolled || 0}/{trn.maxParticipants}</strong></span>
                      <span>Arancel: <strong className="text-slate-800">${trn.registrationFee?.toLocaleString('es-AR')}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Tournament Workspace (8 cols) */}
          <div className="lg:col-span-8">
            {selectedTournament ? (
              <div id="printable-area" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                
                {/* Tournament Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-tennis-700 uppercase tracking-wider block">
                      Torneo Oficial de Eliminación Directa
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      {selectedTournament.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                      <span>Categoría: <strong className="text-slate-700">{selectedTournament.category}</strong></span>
                      <span>Modalidad: <strong className="text-slate-700">{selectedTournament.modality}</strong></span>
                      <span>Superficie: <strong className="text-slate-700">{selectedTournament.surfaceRequired}</strong></span>
                      <span>Tipo: <strong className="text-slate-700">{competitionTypeName(selectedTournament.competitionTypeId)}</strong></span>
                      <span>Fechas: <strong className="text-slate-700">{selectedTournament.startDate} al {selectedTournament.endDate}</strong></span>
                    </div>
                  </div>

                  {/* Action Buttons for Tournament */}
                  <div className="flex items-center gap-2 no-print flex-wrap">
                    <button
                      type="button"
                      onClick={handleOpenEditTournament}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                    >
                      Modificar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteTrnModal(true)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-600" />
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Tournament Sub-Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 no-print">
                  <button
                    type="button"
                    onClick={() => setTournamentSubTab('bracket')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tournamentSubTab === 'bracket'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Cuadro Eliminatorio (Fixture)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTournamentSubTab('participants')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tournamentSubTab === 'participants'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Padrón de Inscriptos ({selectedTournament.participants?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTournamentSubTab('rules')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tournamentSubTab === 'rules'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Reglamento Interno
                  </button>
                </div>

                {/* SubTab 1: Bracket */}
                {tournamentSubTab === 'bracket' && (
                  <div className="space-y-4">
                    <TournamentBracketTree
                      tournament={selectedTournament}
                      isAdmin={true}
                      onUpdateTournament={handleBracketUpdate}
                    />
                  </div>
                )}

                {/* SubTab 2: Participants */}
                {tournamentSubTab === 'participants' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between no-print">
                      <span className="text-xs font-bold text-slate-700">
                        Nómina de Inscriptos Oficiales ({selectedTournament.participants?.length || 0} / {selectedTournament.maxParticipants})
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEnrollTrnModal(true)}
                        className="px-3 py-1.5 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5"
                      >
                        Inscribir Participante
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                          <tr>
                            <th className="p-3">Nombre del Jugador</th>
                            <th className="p-3">Documento (DNI)</th>
                            <th className="p-3">Teléfono</th>
                            {selectedTournament.modality === 'Pareja' && (
                              <th className="p-3">Pareja / Compañero</th>
                            )}
                            <th className="p-3">Fecha Inscripción</th>
                            <th className="p-3 text-right no-print">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(!selectedTournament.participants || selectedTournament.participants.length === 0) ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-400">
                                No se registran inscriptos en este torneo aún.
                              </td>
                            </tr>
                          ) : (
                            selectedTournament.participants.map((p, idx) => (
                              <tr key={p.id || idx} className="hover:bg-slate-50">
                                <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                                <td className="p-3 text-slate-600">{p.dni}</td>
                                <td className="p-3 text-slate-600">{p.phone || '-'}</td>
                                {selectedTournament.modality === 'Pareja' && (
                                  <td className="p-3 text-slate-700">
                                    {p.partnerName ? `${p.partnerName} (${p.partnerDni || '-'})` : '-'}
                                  </td>
                                )}
                                <td className="p-3 text-slate-500">{p.enrolledAt || '2026-08-20'}</td>
                                <td className="p-3 text-right no-print">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveParticipantTrn(p.id)}
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
                  </div>
                )}

                {/* SubTab 3: Internal Rules */}
                {tournamentSubTab === 'rules' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Documento de Reglamento Interno Específico
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenRulesTournament}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                      >
                        Editar Reglamento
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedTournament.internalRules || 'No se ha cargado reglamento interno específico para este torneo.'}
                    </div>
                    <RulesDocumentLink document={selectedTournament.internalRulesDocument} />
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Seleccione un torneo del menú lateral para gestionar fixtures, resultados y reglamentos.
              </div>
            )}
          </div>

        </div>

      {/* ======================================================== */}
      {/* MODALS: TOURNAMENTS */}
      {/* ======================================================== */}

      {/* 1. Create Tournament Modal */}
      <Modal
        isOpen={showCreateTrnModal}
        onClose={() => setShowCreateTrnModal(false)}
        title="Crear Nuevo Torneo Oficial"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTournament} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre del Torneo *</label>
            <input
              type="text"
              required
              placeholder="Copa Master Tenis Ahora 2026"
              value={newTrnForm.name}
              onChange={(e) => setNewTrnForm({ ...newTrnForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Tipo de Competencia *</label>
            <select
              required
              value={newTrnForm.competitionTypeId}
              onChange={(e) => setNewTrnForm({ ...newTrnForm, competitionTypeId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
            >
              <option value="">Seleccione un tipo...</option>
              {typesFor('Torneo').map(t => (
                <option key={t.id} value={t.id}>{t.name} — {t.format}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Categoría *</label>
              <select
                value={newTrnForm.category}
                onChange={(e) => setNewTrnForm({ ...newTrnForm, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Modalidad *</label>
              <select
                value={newTrnForm.modality}
                onChange={(e) => setNewTrnForm({ ...newTrnForm, modality: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Singles">Singles</option>
                <option value="Pareja">Dobles</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Superficie Requerida *</label>
              <select
                value={newTrnForm.surfaceRequired}
                onChange={(e) => setNewTrnForm({ ...newTrnForm, surfaceRequired: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Ladrillo">Polvo de Ladrillo</option>
                <option value="Cemento">Cemento</option>
                <option value="Pasto">Pasto</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Arancel de Inscripción (ARS) *</label>
              <input
                type="number"
                required
                value={newTrnForm.registrationFee}
                onChange={(e) => setNewTrnForm({ ...newTrnForm, registrationFee: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha de Inicio *</label>
              <input
                type="date"
                required
                value={newTrnForm.startDate}
                onChange={(e) => setNewTrnForm({ ...newTrnForm, startDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha de Finalización *</label>
              <input
                type="date"
                required
                value={newTrnForm.endDate}
                onChange={(e) => setNewTrnForm({ ...newTrnForm, endDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Reglamento Interno Inicial</label>
            <textarea
              rows={3}
              value={newTrnForm.internalRules}
              onChange={(e) => setNewTrnForm({ ...newTrnForm, internalRules: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <RulesDocumentInput onFileChange={setNewTrnFile} />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateTrnModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Guardar Torneo
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Tournament Modal */}
      <Modal
        isOpen={showEditTrnModal}
        onClose={() => setShowEditTrnModal(false)}
        title={`Modificar Torneo: ${selectedTournament?.name}`}
        maxWidth="max-w-lg"
      >
        {editTrnForm && (
          <form onSubmit={handleSaveEditTournament} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre del Torneo *</label>
              <input
                type="text"
                required
                value={editTrnForm.name}
                onChange={(e) => setEditTrnForm({ ...editTrnForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Tipo de Competencia *</label>
              <select
                required
                value={editTrnForm.competitionTypeId}
                onChange={(e) => setEditTrnForm({ ...editTrnForm, competitionTypeId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="">Seleccione un tipo...</option>
                {typesFor('Torneo').map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.format}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Categoría *</label>
                <select
                  value={editTrnForm.category}
                  onChange={(e) => setEditTrnForm({ ...editTrnForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Modalidad *</label>
                <select
                  value={editTrnForm.modality}
                  onChange={(e) => setEditTrnForm({ ...editTrnForm, modality: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  <option value="Singles">Singles</option>
                  <option value="Pareja">Dobles</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Superficie *</label>
                <select
                  value={editTrnForm.surfaceRequired}
                  onChange={(e) => setEditTrnForm({ ...editTrnForm, surfaceRequired: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  <option value="Ladrillo">Polvo de Ladrillo</option>
                  <option value="Cemento">Cemento</option>
                  <option value="Pasto">Pasto</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Arancel (ARS) *</label>
                <input
                  type="number"
                  required
                  value={editTrnForm.registrationFee}
                  onChange={(e) => setEditTrnForm({ ...editTrnForm, registrationFee: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Cupo Máximo *</label>
                <input
                  type="number"
                  required
                  value={editTrnForm.maxParticipants}
                  onChange={(e) => setEditTrnForm({ ...editTrnForm, maxParticipants: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Estado *</label>
                <select
                  value={editTrnForm.status}
                  onChange={(e) => setEditTrnForm({ ...editTrnForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  <option value="inscripcion_abierta">Inscripción Abierta</option>
                  <option value="en_curso">En Curso</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha Inicio *</label>
                <input
                  type="date"
                  required
                  value={editTrnForm.startDate}
                  onChange={(e) => setEditTrnForm({ ...editTrnForm, startDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha Fin *</label>
                <input
                  type="date"
                  required
                  value={editTrnForm.endDate}
                  onChange={(e) => setEditTrnForm({ ...editTrnForm, endDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Descripción</label>
              <textarea
                rows={2}
                value={editTrnForm.description}
                onChange={(e) => setEditTrnForm({ ...editTrnForm, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditTrnModal(false)}
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

      {/* 3. Delete Tournament Modal */}
      <Modal
        isOpen={showDeleteTrnModal}
        onClose={() => setShowDeleteTrnModal(false)}
        title="Confirmar Eliminación de Torneo"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            ¿Está seguro de que desea eliminar el torneo <strong className="text-slate-900">{selectedTournament?.name}</strong>?
          </p>
          <p className="text-slate-500">
            Esta acción eliminará los fixtures, cuadros de juego y nómina de participantes asociados a este torneo.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDeleteTrnModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteTournament}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Eliminar Torneo
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Internal Rules Tournament Modal */}
      <Modal
        isOpen={showRulesTrnModal}
        onClose={() => setShowRulesTrnModal(false)}
        title={`Reglamento Interno: ${selectedTournament?.name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveRulesTournament} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">
              Texto del Reglamento Interno Específico *
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Detalle las reglas internas, tolerancia horaria, sistema de juego, vestimenta reglamentaria y desempates.
            </p>
            <textarea
              required
              rows={8}
              value={rulesTrnText}
              onChange={(e) => setRulesTrnText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-mono text-[11px] leading-relaxed"
            />
          </div>

          <RulesDocumentInput
            current={selectedTournament?.internalRulesDocument}
            onFileChange={setRulesTrnFile}
            removed={rulesTrnRemove}
            onToggleRemove={() => setRulesTrnRemove(!rulesTrnRemove)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRulesTrnModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Guardar Reglamento
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Enroll Tournament Participant Modal */}
      <Modal
        isOpen={showEnrollTrnModal}
        onClose={() => setShowEnrollTrnModal(false)}
        title={`Inscribir Participante: ${selectedTournament?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEnrollTournament} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre y Apellido del Jugador *</label>
            <input
              type="text"
              required
              placeholder="Juan Pérez"
              value={enrollTrnForm.name}
              onChange={(e) => setEnrollTrnForm({ ...enrollTrnForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">DNI del Jugador *</label>
            <input
              type="text"
              required
              placeholder="35.123.456"
              value={enrollTrnForm.dni}
              onChange={(e) => setEnrollTrnForm({ ...enrollTrnForm, dni: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Teléfono de Contacto</label>
            <input
              type="text"
              placeholder="11-4455-6677"
              value={enrollTrnForm.phone}
              onChange={(e) => setEnrollTrnForm({ ...enrollTrnForm, phone: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          {selectedTournament?.modality === 'Pareja' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-800 uppercase block">Datos de la Pareja</span>
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre Pareja *</label>
                <input
                  type="text"
                  required
                  placeholder="Pedro González"
                  value={enrollTrnForm.partnerName}
                  onChange={(e) => setEnrollTrnForm({ ...enrollTrnForm, partnerName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">DNI Pareja *</label>
                <input
                  type="text"
                  required
                  placeholder="36.987.654"
                  value={enrollTrnForm.partnerDni}
                  onChange={(e) => setEnrollTrnForm({ ...enrollTrnForm, partnerDni: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEnrollTrnModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Confirmar Inscripción
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
