import React, { useState, useEffect } from 'react';
import { leaguesService, competitionTypesService, documentsService } from '../../services/api';
import { Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { RulesDocumentInput, RulesDocumentLink } from '../../components/common/RulesDocument';
import { useFeedback } from '../../context/FeedbackContext';

// Sube el archivo elegido y devuelve el valor de internalRulesDocument: undefined no lo cambia, null lo quita.
const rulesDocumentFor = async (file, remove) => {
  if (file) return (await documentsService.upload(file)).data;
  return remove ? null : undefined;
};

export default function LeaguesManagementPage() {
  const { notify, confirm } = useFeedback();
  const [competitionTypes, setCompetitionTypes] = useState([]);

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

  useEffect(() => {
    loadLeagues();
    loadCompetitionTypes();
  }, []);

  const loadCompetitionTypes = async () => {
    const res = await competitionTypesService.getAll();
    setCompetitionTypes(res.data || []);
  };

  const competitionTypeName = (id) => competitionTypes.find(t => t.id === id)?.name || 'Sin tipo asignado';
  const typesFor = (scope) => competitionTypes.filter(t => t.active !== false && (t.appliesTo === scope || t.appliesTo === 'Ambos'));

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
      notify({ title: 'Error al registrar liga', message: err.message || 'No se pudo registrar la liga.', variant: 'error' });
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
      notify({ title: 'Error al guardar reglamento', message: err.message || 'No se pudo guardar el reglamento.', variant: 'error' });
      return;
    }
    setShowRulesLeagueModal(false);
    await loadLeagues();
  };

  const handleEnrollLeague = async (e) => {
    e.preventDefault();
    if (!selectedLeague) return;
    try {
      await leaguesService.enroll(selectedLeague.id, enrollLeagueForm);
    } catch (err) {
      notify({ variant: 'warning', title: 'No se pudo inscribir', message: err.message || 'Intentá nuevamente.' });
      return;
    }
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
    if (await confirm({ title: 'Baja de participante', message: 'Confirma la baja del participante en esta liga?', confirmLabel: 'Dar de baja', danger: true })) {
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ligas
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
                <option value="Singles">Singles</option>
                <option value="Pareja">Dobles</option>
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
                  <option value="Singles">Singles</option>
                  <option value="Pareja">Dobles</option>
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
                  <span className="text-[11px] text-slate-500 block mb-1">Set 3, opcional</span>
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
