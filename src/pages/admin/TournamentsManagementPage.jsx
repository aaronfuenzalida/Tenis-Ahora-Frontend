import React, { useState, useEffect } from 'react';
import { tournamentsService, leaguesService, competitionTypesService, documentsService } from '../../services/api';
import { Edit, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { RulesDocumentInput, RulesDocumentLink } from '../../components/common/RulesDocument';

// Sube el archivo elegido y devuelve el valor de internalRulesDocument: undefined no lo cambia, null lo quita.
const rulesDocumentFor = async (file, remove) => {
  if (file) return (await documentsService.upload(file)).data;
  return remove ? null : undefined;
};
import MatchesPanel from '../../components/admin/MatchesPanel';
import CompetitionTypesPanel from '../../components/admin/CompetitionTypesPanel';
import TournamentBracketTree from '../../components/common/TournamentBracketTree';

export default function TournamentsManagementPage() {
  // Main Tab: 'tournaments' | 'leagues'
  const [activeMainTab, setActiveMainTab] = useState('tournaments'); // tournaments | leagues | matches | competition-types
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

  // ==========================================
  // LEAGUES STATE
  // ==========================================
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leagueSubTab, setLeagueSubTab] = useState('standings'); // 'standings' | 'fixtures' | 'participants' | 'rules'

  // Modals for Leagues
  const [showCreateLeagueModal, setShowCreateLeagueModal] = useState(false);
  const [showEditLeagueModal, setShowEditLeagueModal] = useState(false);
  const [showDeleteLeagueModal, setShowDeleteLeagueModal] = useState(false);
  const [showRulesLeagueModal, setShowRulesLeagueModal] = useState(false);
  const [showEnrollLeagueModal, setShowEnrollLeagueModal] = useState(false);
  const [showMatchScoreModal, setShowMatchScoreModal] = useState(false);
  const [showAddMatchModal, setShowAddMatchModal] = useState(false);

  // League Forms
  const [newLeagueForm, setNewLeagueForm] = useState({
    competitionTypeId: '',
    name: '',
    category: 'Masculino',
    modality: 'Singles',
    surfaceRequired: 'Ladrillo',
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    registrationFee: 15000,
    maxParticipants: 8,
    description: '',
    internalRules: 'Reglamento Interno de Liga: Sistema todos contra todos por puntos. Se otorgan 3 puntos por partido ganado y 0 puntos por partido perdido. Criterios de desempate en la tabla: 1) Diferencia de sets, 2) Diferencia de games, 3) Enfrentamiento directo.'
  });

  const [editLeagueForm, setEditLeagueForm] = useState(null);
  const [rulesLeagueText, setRulesLeagueText] = useState('');
  const [rulesLeagueFile, setRulesLeagueFile] = useState(null);
  const [rulesLeagueRemove, setRulesLeagueRemove] = useState(false);
  const [newLeagueFile, setNewLeagueFile] = useState(null);
  const [enrollLeagueForm, setEnrollLeagueForm] = useState({
    name: '',
    dni: '',
    phone: '',
    partnerName: '',
    partnerDni: ''
  });

  // League Match Score Form
  const [selectedLeagueMatch, setSelectedLeagueMatch] = useState(null);
  const [matchSet1, setMatchSet1] = useState('6-4');
  const [matchSet2, setMatchSet2] = useState('6-3');
  const [matchSet3, setMatchSet3] = useState('');
  const [matchWinner, setMatchWinner] = useState('');

  // League Add Match Form
  const [addMatchForm, setAddMatchForm] = useState({
    round: 'Jornada 1',
    p1: '',
    p2: '',
    court: 'Cancha 1',
    date: '2026-09-25 15:00'
  });

  // ==========================================
  // INITIAL DATA LOADING
  // ==========================================
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([loadTournaments(), loadLeagues(), loadCompetitionTypes()]);
  };

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

  const loadLeagues = async () => {
    const res = await leaguesService.getAll();
    setLeagues(res.data);
    if (res.data.length > 0) {
      if (!selectedLeague) {
        setSelectedLeague(res.data[0]);
      } else {
        const found = res.data.find(l => l.id === selectedLeague.id);
        setSelectedLeague(found || res.data[0]);
      }
    } else {
      setSelectedLeague(null);
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
      alert(err.message || 'No se pudo registrar el torneo.');
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
      alert(err.message || 'No se pudo guardar el reglamento.');
      return;
    }
    setShowRulesTrnModal(false);
    await loadTournaments();
  };

  const handleEnrollTournament = async (e) => {
    e.preventDefault();
    if (!selectedTournament) return;
    await tournamentsService.enroll(selectedTournament.id, enrollTrnForm);
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
    if (window.confirm('Confirma la baja del participante en este torneo?')) {
      await tournamentsService.removeParticipant(selectedTournament.id, participantId);
      await loadTournaments();
    }
  };

  const handleBracketUpdate = (updatedTrn) => {
    setSelectedTournament(updatedTrn);
    setTournaments(tournaments.map(t => t.id === updatedTrn.id ? updatedTrn : t));
  };

  // ==========================================
  // LEAGUE HANDLERS
  // ==========================================
  const handleCreateLeague = async (e) => {
    e.preventDefault();
    let res;
    try {
      // El documento se sube primero: si falla, no queda una liga creada a medias.
      const rulesDocument = await rulesDocumentFor(newLeagueFile, false);
      res = await leaguesService.create(newLeagueForm);
      if (rulesDocument) res = await leaguesService.updateInternalRules(res.data.id, undefined, rulesDocument);
    } catch (err) {
      alert(err.message || 'No se pudo registrar la liga.');
      return;
    }
    setShowCreateLeagueModal(false);
    setNewLeagueFile(null);
    setNewLeagueForm({
      competitionTypeId: '',
      name: '',
      category: 'Masculino',
      modality: 'Singles',
      surfaceRequired: 'Ladrillo',
      startDate: '2026-09-01',
      endDate: '2026-11-30',
      registrationFee: 15000,
      maxParticipants: 8,
      description: '',
      internalRules: 'Reglamento Interno de Liga: Sistema todos contra todos por puntos. Se otorgan 3 puntos por partido ganado y 0 puntos por partido perdido.'
    });
    await loadLeagues();
    if (res.data) setSelectedLeague(res.data);
  };

  const handleOpenEditLeague = () => {
    if (!selectedLeague) return;
    setEditLeagueForm({
      competitionTypeId: selectedLeague.competitionTypeId || '',
      name: selectedLeague.name,
      category: selectedLeague.category,
      modality: selectedLeague.modality,
      surfaceRequired: selectedLeague.surfaceRequired,
      startDate: selectedLeague.startDate,
      endDate: selectedLeague.endDate,
      registrationFee: selectedLeague.registrationFee,
      maxParticipants: selectedLeague.maxParticipants,
      status: selectedLeague.status,
      description: selectedLeague.description || ''
    });
    setShowEditLeagueModal(true);
  };

  const handleSaveEditLeague = async (e) => {
    e.preventDefault();
    if (!selectedLeague || !editLeagueForm) return;
    await leaguesService.update(selectedLeague.id, editLeagueForm);
    setShowEditLeagueModal(false);
    await loadLeagues();
  };

  const handleDeleteLeague = async () => {
    if (!selectedLeague) return;
    await leaguesService.delete(selectedLeague.id);
    setShowDeleteLeagueModal(false);
    setSelectedLeague(null);
    await loadLeagues();
  };

  const handleOpenRulesLeague = () => {
    if (!selectedLeague) return;
    setRulesLeagueText(selectedLeague.internalRules || '');
    setRulesLeagueFile(null);
    setRulesLeagueRemove(false);
    setShowRulesLeagueModal(true);
  };

  const handleSaveRulesLeague = async (e) => {
    e.preventDefault();
    if (!selectedLeague) return;
    try {
      const rulesDocument = await rulesDocumentFor(rulesLeagueFile, rulesLeagueRemove);
      await leaguesService.updateInternalRules(selectedLeague.id, rulesLeagueText, rulesDocument);
    } catch (err) {
      alert(err.message || 'No se pudo guardar el reglamento.');
      return;
    }
    setShowRulesLeagueModal(false);
    await loadLeagues();
  };

  const handleEnrollLeague = async (e) => {
    e.preventDefault();
    if (!selectedLeague) return;
    await leaguesService.enroll(selectedLeague.id, enrollLeagueForm);
    setEnrollLeagueForm({
      name: '',
      dni: '',
      phone: '',
      partnerName: '',
      partnerDni: ''
    });
    setShowEnrollLeagueModal(false);
    await loadLeagues();
  };

  const handleRemoveParticipantLeague = async (participantId) => {
    if (!selectedLeague) return;
    if (window.confirm('Confirma la baja del participante en esta liga?')) {
      await leaguesService.removeParticipant(selectedLeague.id, participantId);
      await loadLeagues();
    }
  };

  const handleOpenMatchScore = (match) => {
    setSelectedLeagueMatch(match);
    setMatchWinner(match.winner || match.p1);
    if (match.score && match.score.includes(',')) {
      const parts = match.score.split(',').map(s => s.trim());
      setMatchSet1(parts[0] || '6-4');
      setMatchSet2(parts[1] || '6-3');
      setMatchSet3(parts[2] || '');
    } else {
      setMatchSet1('6-4');
      setMatchSet2('6-3');
      setMatchSet3('');
    }
    setShowMatchScoreModal(true);
  };

  const handleSaveMatchScore = async (e) => {
    e.preventDefault();
    if (!selectedLeague || !selectedLeagueMatch) return;
    const fullScore = [matchSet1, matchSet2, matchSet3].filter(Boolean).join(', ');
    await leaguesService.updateMatchScore(
      selectedLeague.id,
      selectedLeagueMatch.id,
      fullScore,
      matchWinner
    );
    setShowMatchScoreModal(false);
    setSelectedLeagueMatch(null);
    await loadLeagues();
  };

  const handleAddMatch = async (e) => {
    e.preventDefault();
    if (!selectedLeague) return;
    await leaguesService.addMatch(selectedLeague.id, addMatchForm.round, {
      p1: addMatchForm.p1,
      p2: addMatchForm.p2,
      court: addMatchForm.court,
      date: addMatchForm.date
    });
    setShowAddMatchModal(false);
    setAddMatchForm({
      round: 'Jornada 1',
      p1: '',
      p2: '',
      court: 'Cancha 1',
      date: '2026-09-25 15:00'
    });
    await loadLeagues();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestión de Torneos, Ligas y Competencias
          </h1>
        </div>

        {/* Main Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMainTab('tournaments')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeMainTab === 'tournaments'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Torneos Oficiales
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('leagues')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeMainTab === 'leagues'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ligas del Club
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('matches')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeMainTab === 'matches'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Enfrentamientos
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('competition-types')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeMainTab === 'competition-types'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tipos de Competencia
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

      {/* ======================================================== */}
      {/* MAIN SECTION: MATCHES (RF057 - RF060) */}
      {/* ======================================================== */}
      {activeMainTab === 'matches' && (
        <MatchesPanel onChanged={loadAllData} />
      )}

      {/* ======================================================== */}
      {/* MAIN SECTION: COMPETITION TYPES (RF061 - RF065) */}
      {/* ======================================================== */}
      {activeMainTab === 'competition-types' && (
        <CompetitionTypesPanel tournaments={tournaments} leagues={leagues} onChange={loadCompetitionTypes} />
      )}

      {/* ======================================================== */}
      {/* MAIN SECTION: TOURNAMENTS */}
      {/* ======================================================== */}
      {activeMainTab === 'tournaments' && (
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
                      onClick={handleOpenRulesTournament}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                    >
                      Reglamento Interno
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
      )}

      {/* ======================================================== */}
      {/* MAIN SECTION: LEAGUES */}
      {/* ======================================================== */}
      {activeMainTab === 'leagues' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Leagues List (4 cols) */}
          <div className="lg:col-span-4 space-y-3 no-print">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ligas Registradas
              </span>
              <button
                type="button"
                onClick={() => setShowCreateLeagueModal(true)}
                className="px-3 py-1.5 rounded-lg bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1"
              >
                Nueva Liga
              </button>
            </div>

            {leagues.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No hay ligas registradas en el club.
              </div>
            ) : (
              leagues.map(liga => {
                const isSelected = selectedLeague?.id === liga.id;
                return (
                  <div
                    key={liga.id}
                    onClick={() => setSelectedLeague(liga)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-tennis-600 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-600 pb-1">
                      <span className="font-semibold text-slate-800">
                        {liga.category} • {liga.modality}
                      </span>
                      <span className="text-slate-500">
                        {liga.surfaceRequired}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 mt-1">{liga.name}</h3>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                      <span>Inscriptos: <strong className="text-slate-800">{liga.currentEnrolled || 0}/{liga.maxParticipants}</strong></span>
                      <span>Arancel: <strong className="text-slate-800">${liga.registrationFee?.toLocaleString('es-AR')}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected League Workspace (8 cols) */}
          <div className="lg:col-span-8">
            {selectedLeague ? (
              <div id="printable-area" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                
                {/* League Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-tennis-700 uppercase tracking-wider block">
                      Liga Regular del Club (Todos contra Todos)
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      {selectedLeague.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                      <span>Categoría: <strong className="text-slate-700">{selectedLeague.category}</strong></span>
                      <span>Modalidad: <strong className="text-slate-700">{selectedLeague.modality}</strong></span>
                      <span>Superficie: <strong className="text-slate-700">{selectedLeague.surfaceRequired}</strong></span>
                      <span>Tipo: <strong className="text-slate-700">{competitionTypeName(selectedLeague.competitionTypeId)}</strong></span>
                      <span>Período: <strong className="text-slate-700">{selectedLeague.startDate} al {selectedLeague.endDate}</strong></span>
                    </div>
                  </div>

                  {/* Action Buttons for League */}
                  <div className="flex items-center gap-2 no-print flex-wrap">
                    <button
                      type="button"
                      onClick={handleOpenEditLeague}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                    >
                      Modificar
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenRulesLeague}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                    >
                      Reglamento Interno
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteLeagueModal(true)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-600" />
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* League Sub-Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 no-print">
                  <button
                    type="button"
                    onClick={() => setLeagueSubTab('standings')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      leagueSubTab === 'standings'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tabla de Posiciones
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeagueSubTab('fixtures')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      leagueSubTab === 'fixtures'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Jornadas y Fixture ({selectedLeague.fixtures?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeagueSubTab('participants')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      leagueSubTab === 'participants'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Padrón de Inscriptos ({selectedLeague.participants?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeagueSubTab('rules')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      leagueSubTab === 'rules'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Reglamento Interno
                  </button>
                </div>

                {/* SubTab 1: Standings */}
                {leagueSubTab === 'standings' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        Clasificación General Oficial
                      </span>
                      <span className="text-slate-500">
                        Puntuación: PG (3 pts) • PP (0 pts) • Criterio: Mayor puntaje y diferencia de sets
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                          <tr>
                            <th className="p-3 w-12 text-center">Pos</th>
                            <th className="p-3">Jugador / Pareja</th>
                            <th className="p-3 text-center">PJ</th>
                            <th className="p-3 text-center">PG</th>
                            <th className="p-3 text-center">PP</th>
                            <th className="p-3 text-center">SF</th>
                            <th className="p-3 text-center">SC</th>
                            <th className="p-3 text-center">DIF</th>
                            <th className="p-3 text-center font-bold text-slate-900">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(!selectedLeague.standings || selectedLeague.standings.length === 0) ? (
                            <tr>
                              <td colSpan={9} className="p-6 text-center text-slate-400">
                                No hay posiciones registradas todavía en esta liga.
                              </td>
                            </tr>
                          ) : (
                            selectedLeague.standings.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-3 text-center font-bold text-slate-700">
                                  {row.rank || idx + 1}
                                </td>
                                <td className="p-3 font-semibold text-slate-900">
                                  {row.name}
                                </td>
                                <td className="p-3 text-center text-slate-600">{row.pj || 0}</td>
                                <td className="p-3 text-center text-slate-600">{row.pg || 0}</td>
                                <td className="p-3 text-center text-slate-600">{row.pp || 0}</td>
                                <td className="p-3 text-center text-slate-600">{row.sf || 0}</td>
                                <td className="p-3 text-center text-slate-600">{row.sc || 0}</td>
                                <td className="p-3 text-center font-medium text-slate-700">
                                  {row.dif > 0 ? `+${row.dif}` : row.dif}
                                </td>
                                <td className="p-3 text-center font-bold text-slate-900 bg-slate-50/50">
                                  {row.points || 0}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SubTab 2: Fixtures */}
                {leagueSubTab === 'fixtures' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between no-print">
                      <span className="text-xs font-bold text-slate-800">
                        Rol de Partidos y Resultados por Jornada
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddMatchModal(true)}
                        className="px-3 py-1.5 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5"
                      >
                        Programar Partido
                      </button>
                    </div>

                    {(!selectedLeague.fixtures || selectedLeague.fixtures.length === 0) ? (
                      <div className="p-8 text-center border border-slate-200 rounded-xl text-slate-400 text-xs">
                        No hay jornadas programadas en esta liga. Presione 'Programar Partido' para agendar los primeros encuentros.
                      </div>
                    ) : (
                      selectedLeague.fixtures.map((jornada, jIdx) => (
                        <div key={jIdx} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              {jornada.round}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {jornada.matches?.length || 0} partidos
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {jornada.matches?.map((match) => {
                              const isFinished = match.status === 'finalizado';
                              return (
                                <div key={match.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className={`font-semibold ${match.winner === match.p1 ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                                        {match.p1}
                                      </span>
                                      <span className="text-slate-400 text-[11px]">vs</span>
                                      <span className={`font-semibold ${match.winner === match.p2 ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                                        {match.p2}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                                      <span>Cancha: {match.court}</span>
                                      <span>Fecha: {match.date}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-xs font-bold text-slate-800">
                                        {isFinished ? match.score : 'Pendiente'}
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        {isFinished ? `Ganador: ${match.winner}` : 'Por disputarse'}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenMatchScore(match)}
                                      className="no-print px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 font-semibold text-xs flex items-center gap-1 shadow-sm"
                                    >
                                      {isFinished ? 'Modificar Resultado' : 'Cargar Resultado'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* SubTab 3: Participants */}
                {leagueSubTab === 'participants' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between no-print">
                      <span className="text-xs font-bold text-slate-700">
                        Padrón Oficial de Jugadores ({selectedLeague.participants?.length || 0} / {selectedLeague.maxParticipants})
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEnrollLeagueModal(true)}
                        className="px-3 py-1.5 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5"
                      >
                        Inscribir Jugador
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                          <tr>
                            <th className="p-3">Nombre del Jugador</th>
                            <th className="p-3">Documento (DNI)</th>
                            <th className="p-3">Teléfono</th>
                            {selectedLeague.modality === 'Pareja' && (
                              <th className="p-3">Pareja / Compañera</th>
                            )}
                            <th className="p-3">Fecha Inscripción</th>
                            <th className="p-3 text-right no-print">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(!selectedLeague.participants || selectedLeague.participants.length === 0) ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-400">
                                No se registran inscriptos en esta liga aún.
                              </td>
                            </tr>
                          ) : (
                            selectedLeague.participants.map((p, idx) => (
                              <tr key={p.id || idx} className="hover:bg-slate-50">
                                <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                                <td className="p-3 text-slate-600">{p.dni}</td>
                                <td className="p-3 text-slate-600">{p.phone || '-'}</td>
                                {selectedLeague.modality === 'Pareja' && (
                                  <td className="p-3 text-slate-700">
                                    {p.partnerName ? `${p.partnerName} (${p.partnerDni || '-'})` : '-'}
                                  </td>
                                )}
                                <td className="p-3 text-slate-500">{p.enrolledAt || '2026-08-20'}</td>
                                <td className="p-3 text-right no-print">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveParticipantLeague(p.id)}
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

                {/* SubTab 4: Internal Rules */}
                {leagueSubTab === 'rules' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Documento de Reglamento Interno de la Liga
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenRulesLeague}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                      >
                        Editar Reglamento
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedLeague.internalRules || 'No se ha cargado reglamento interno para esta liga.'}
                    </div>
                    <RulesDocumentLink document={selectedLeague.internalRulesDocument} />
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Seleccione una liga del menú lateral para gestionar fixtures, resultados y reglamentos.
              </div>
            )}
          </div>

        </div>
      )}

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
                <option value="Singles">Singles (Individual)</option>
                <option value="Pareja">Parejas (Dobles)</option>
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
                  <option value="Singles">Singles (Individual)</option>
                  <option value="Pareja">Parejas (Dobles)</option>
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

      {/* ======================================================== */}
      {/* MODALS: LEAGUES */}
      {/* ======================================================== */}

      {/* 1. Create League Modal */}
      <Modal
        isOpen={showCreateLeagueModal}
        onClose={() => setShowCreateLeagueModal(false)}
        title="Crear Nueva Liga del Club"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateLeague} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre de la Liga *</label>
            <input
              type="text"
              required
              placeholder="Liga Clausura Primera Caballeros"
              value={newLeagueForm.name}
              onChange={(e) => setNewLeagueForm({ ...newLeagueForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Tipo de Competencia *</label>
            <select
              required
              value={newLeagueForm.competitionTypeId}
              onChange={(e) => setNewLeagueForm({ ...newLeagueForm, competitionTypeId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
            >
              <option value="">Seleccione un tipo...</option>
              {typesFor('Liga').map(t => (
                <option key={t.id} value={t.id}>{t.name} — {t.format}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Categoría *</label>
              <select
                value={newLeagueForm.category}
                onChange={(e) => setNewLeagueForm({ ...newLeagueForm, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Modalidad *</label>
              <select
                value={newLeagueForm.modality}
                onChange={(e) => setNewLeagueForm({ ...newLeagueForm, modality: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Singles">Singles (Individual)</option>
                <option value="Pareja">Parejas (Dobles)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Superficie Requerida *</label>
              <select
                value={newLeagueForm.surfaceRequired}
                onChange={(e) => setNewLeagueForm({ ...newLeagueForm, surfaceRequired: e.target.value })}
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
                value={newLeagueForm.registrationFee}
                onChange={(e) => setNewLeagueForm({ ...newLeagueForm, registrationFee: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha de Inicio *</label>
              <input
                type="date"
                required
                value={newLeagueForm.startDate}
                onChange={(e) => setNewLeagueForm({ ...newLeagueForm, startDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha de Finalización *</label>
              <input
                type="date"
                required
                value={newLeagueForm.endDate}
                onChange={(e) => setNewLeagueForm({ ...newLeagueForm, endDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Reglamento Interno de Liga</label>
            <textarea
              rows={3}
              value={newLeagueForm.internalRules}
              onChange={(e) => setNewLeagueForm({ ...newLeagueForm, internalRules: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <RulesDocumentInput onFileChange={setNewLeagueFile} />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateLeagueModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Guardar Liga
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit League Modal */}
      <Modal
        isOpen={showEditLeagueModal}
        onClose={() => setShowEditLeagueModal(false)}
        title={`Modificar Liga: ${selectedLeague?.name}`}
        maxWidth="max-w-lg"
      >
        {editLeagueForm && (
          <form onSubmit={handleSaveEditLeague} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre de la Liga *</label>
              <input
                type="text"
                required
                value={editLeagueForm.name}
                onChange={(e) => setEditLeagueForm({ ...editLeagueForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Tipo de Competencia *</label>
              <select
                required
                value={editLeagueForm.competitionTypeId}
                onChange={(e) => setEditLeagueForm({ ...editLeagueForm, competitionTypeId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="">Seleccione un tipo...</option>
                {typesFor('Liga').map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.format}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Categoría *</label>
                <select
                  value={editLeagueForm.category}
                  onChange={(e) => setEditLeagueForm({ ...editLeagueForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Mixto">Mixto</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Modalidad *</label>
                <select
                  value={editLeagueForm.modality}
                  onChange={(e) => setEditLeagueForm({ ...editLeagueForm, modality: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  <option value="Singles">Singles (Individual)</option>
                  <option value="Pareja">Parejas (Dobles)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Superficie *</label>
                <select
                  value={editLeagueForm.surfaceRequired}
                  onChange={(e) => setEditLeagueForm({ ...editLeagueForm, surfaceRequired: e.target.value })}
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
                  value={editLeagueForm.registrationFee}
                  onChange={(e) => setEditLeagueForm({ ...editLeagueForm, registrationFee: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Cupo Máximo *</label>
                <input
                  type="number"
                  required
                  value={editLeagueForm.maxParticipants}
                  onChange={(e) => setEditLeagueForm({ ...editLeagueForm, maxParticipants: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Estado *</label>
                <select
                  value={editLeagueForm.status}
                  onChange={(e) => setEditLeagueForm({ ...editLeagueForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
                >
                  <option value="inscripcion_abierta">Inscripción Abierta</option>
                  <option value="en_curso">En Curso</option>
                  <option value="finalizada">Finalizada</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha Inicio *</label>
                <input
                  type="date"
                  required
                  value={editLeagueForm.startDate}
                  onChange={(e) => setEditLeagueForm({ ...editLeagueForm, startDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha Fin *</label>
                <input
                  type="date"
                  required
                  value={editLeagueForm.endDate}
                  onChange={(e) => setEditLeagueForm({ ...editLeagueForm, endDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Descripción</label>
              <textarea
                rows={2}
                value={editLeagueForm.description}
                onChange={(e) => setEditLeagueForm({ ...editLeagueForm, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditLeagueModal(false)}
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

      {/* 3. Delete League Modal */}
      <Modal
        isOpen={showDeleteLeagueModal}
        onClose={() => setShowDeleteLeagueModal(false)}
        title="Confirmar Eliminación de Liga"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            ¿Está seguro de que desea eliminar la liga <strong className="text-slate-900">{selectedLeague?.name}</strong>?
          </p>
          <p className="text-slate-500">
            Esta acción eliminará la tabla de posiciones, las jornadas, los partidos y los participantes registrados en esta liga.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDeleteLeagueModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteLeague}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Eliminar Liga
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Internal Rules League Modal */}
      <Modal
        isOpen={showRulesLeagueModal}
        onClose={() => setShowRulesLeagueModal(false)}
        title={`Reglamento Interno: ${selectedLeague?.name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveRulesLeague} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">
              Reglamento Interno Específico de la Liga *
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Defina el sistema de puntuación (puntos por victoria/derrota), criterios de desempate, reprogramación de partidos y sanciones.
            </p>
            <textarea
              required
              rows={8}
              value={rulesLeagueText}
              onChange={(e) => setRulesLeagueText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-mono text-[11px] leading-relaxed"
            />
          </div>

          <RulesDocumentInput
            current={selectedLeague?.internalRulesDocument}
            onFileChange={setRulesLeagueFile}
            removed={rulesLeagueRemove}
            onToggleRemove={() => setRulesLeagueRemove(!rulesLeagueRemove)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRulesLeagueModal(false)}
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

      {/* 5. Enroll League Participant Modal */}
      <Modal
        isOpen={showEnrollLeagueModal}
        onClose={() => setShowEnrollLeagueModal(false)}
        title={`Inscribir Jugador en Liga: ${selectedLeague?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEnrollLeague} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre y Apellido del Jugador *</label>
            <input
              type="text"
              required
              placeholder="Carlos Alcaraz"
              value={enrollLeagueForm.name}
              onChange={(e) => setEnrollLeagueForm({ ...enrollLeagueForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">DNI del Jugador *</label>
            <input
              type="text"
              required
              placeholder="38.765.432"
              value={enrollLeagueForm.dni}
              onChange={(e) => setEnrollLeagueForm({ ...enrollLeagueForm, dni: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Teléfono</label>
            <input
              type="text"
              placeholder="11-7788-9900"
              value={enrollLeagueForm.phone}
              onChange={(e) => setEnrollLeagueForm({ ...enrollLeagueForm, phone: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          {selectedLeague?.modality === 'Pareja' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-800 uppercase block">Datos de la Pareja</span>
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre Pareja *</label>
                <input
                  type="text"
                  required
                  placeholder="Rafael Nadal"
                  value={enrollLeagueForm.partnerName}
                  onChange={(e) => setEnrollLeagueForm({ ...enrollLeagueForm, partnerName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 uppercase block mb-1">DNI Pareja *</label>
                <input
                  type="text"
                  required
                  placeholder="34.567.890"
                  value={enrollLeagueForm.partnerDni}
                  onChange={(e) => setEnrollLeagueForm({ ...enrollLeagueForm, partnerDni: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEnrollLeagueModal(false)}
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

      {/* 6. Match Score Modal for League */}
      <Modal
        isOpen={showMatchScoreModal}
        onClose={() => setShowMatchScoreModal(false)}
        title="Registrar Resultado de Partido de Liga"
        maxWidth="max-w-md"
      >
        {selectedLeagueMatch && (
          <form onSubmit={handleSaveMatchScore} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 text-sm">
                {selectedLeagueMatch.p1} vs {selectedLeagueMatch.p2}
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                {selectedLeagueMatch.court} • {selectedLeagueMatch.date}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Puntuación por Sets *</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Set 1 *</span>
                  <input
                    type="text"
                    required
                    placeholder="6-4"
                    value={matchSet1}
                    onChange={(e) => setMatchSet1(e.target.value)}
                    className="w-full p-2 text-center rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Set 2 *</span>
                  <input
                    type="text"
                    required
                    placeholder="6-3"
                    value={matchSet2}
                    onChange={(e) => setMatchSet2(e.target.value)}
                    className="w-full p-2 text-center rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Set 3 (Opcional)</span>
                  <input
                    type="text"
                    placeholder="7-6"
                    value={matchSet3}
                    onChange={(e) => setMatchSet3(e.target.value)}
                    className="w-full p-2 text-center rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Ganador Oficial del Partido *</label>
              <select
                required
                value={matchWinner}
                onChange={(e) => setMatchWinner(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
              >
                <option value={selectedLeagueMatch.p1}>{selectedLeagueMatch.p1}</option>
                <option value={selectedLeagueMatch.p2}>{selectedLeagueMatch.p2}</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMatchScoreModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
              >
                Guardar Resultado
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 7. Add Scheduled Match Modal */}
      <Modal
        isOpen={showAddMatchModal}
        onClose={() => setShowAddMatchModal(false)}
        title="Programar Partido en Liga"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddMatch} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Jornada / Ronda *</label>
            <input
              type="text"
              required
              placeholder="Jornada 3"
              value={addMatchForm.round}
              onChange={(e) => setAddMatchForm({ ...addMatchForm, round: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Jugador 1 *</label>
              <input
                type="text"
                required
                placeholder="Nombre Jugador 1"
                value={addMatchForm.p1}
                onChange={(e) => setAddMatchForm({ ...addMatchForm, p1: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Jugador 2 *</label>
              <input
                type="text"
                required
                placeholder="Nombre Jugador 2"
                value={addMatchForm.p2}
                onChange={(e) => setAddMatchForm({ ...addMatchForm, p2: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Cancha Asignada *</label>
              <select
                value={addMatchForm.court}
                onChange={(e) => setAddMatchForm({ ...addMatchForm, court: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                <option value="Cancha 1">Cancha 1</option>
                <option value="Cancha 2">Cancha 2</option>
                <option value="Cancha 3">Cancha 3</option>
                <option value="Cancha 4">Cancha 4</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase block mb-1">Fecha y Hora *</label>
              <input
                type="text"
                required
                placeholder="2026-09-25 16:00"
                value={addMatchForm.date}
                onChange={(e) => setAddMatchForm({ ...addMatchForm, date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddMatchModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Programar Partido
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
