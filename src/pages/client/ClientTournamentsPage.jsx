import React, { useState, useEffect } from 'react';
import { tournamentsService, leaguesService } from '../../services/api';
import { 
  Trophy, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Swords, 
  FileText, 
  Printer 
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import TournamentBracketTree from '../../components/common/TournamentBracketTree';

export default function ClientTournamentsPage() {
  const [activeTab, setActiveTab] = useState('tournaments'); // 'tournaments' | 'leagues'

  // Tournaments
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showEnrollTrnModal, setShowEnrollTrnModal] = useState(false);
  const [enrollingTrn, setEnrollingTrn] = useState(false);
  const [partnerNameTrn, setPartnerNameTrn] = useState('');
  const [partnerDniTrn, setPartnerDniTrn] = useState('');
  const [trnSubView, setTrnSubView] = useState('bracket'); // 'bracket' | 'rules'

  // Leagues
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [showEnrollLeagueModal, setShowEnrollLeagueModal] = useState(false);
  const [enrollingLeague, setEnrollingLeague] = useState(false);
  const [leagueSubView, setLeagueSubView] = useState('standings'); // 'standings' | 'fixtures' | 'rules'
  const [leagueEnrollForm, setLeagueEnrollForm] = useState({
    name: 'Federico Gómez',
    dni: '38.452.129',
    phone: '11-4892-1234',
    partnerName: '',
    partnerDni: ''
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [trnRes, leagueRes] = await Promise.all([
      tournamentsService.getAll(),
      leaguesService.getAll()
    ]);
    setTournaments(trnRes.data);
    if (trnRes.data.length > 0) setSelectedTournament(trnRes.data[0]);

    setLeagues(leagueRes.data);
    if (leagueRes.data.length > 0) setSelectedLeague(leagueRes.data[0]);
  };

  const handleEnrollTournament = async (e) => {
    e.preventDefault();
    setEnrollingTrn(true);
    await tournamentsService.enroll(selectedTournament.id, {
      name: 'Federico Gómez',
      dni: '38.452.129',
      partnerName: partnerNameTrn,
      partnerDni: partnerDniTrn
    });
    setEnrollingTrn(false);
    setShowEnrollTrnModal(false);
    setPartnerNameTrn('');
    setPartnerDniTrn('');
    alert('Inscripción al torneo completada exitosamente. Se ha registrado en la nómina oficial.');
    const res = await tournamentsService.getAll();
    setTournaments(res.data);
    if (selectedTournament) {
      const found = res.data.find(t => t.id === selectedTournament.id);
      setSelectedTournament(found || res.data[0]);
    }
  };

  const handleEnrollLeague = async (e) => {
    e.preventDefault();
    setEnrollingLeague(true);
    await leaguesService.enroll(selectedLeague.id, leagueEnrollForm);
    setEnrollingLeague(false);
    setShowEnrollLeagueModal(false);
    alert('Inscripción a la liga completada exitosamente. Se ha sumado a la nómina de participantes.');
    const res = await leaguesService.getAll();
    setLeagues(res.data);
    if (selectedLeague) {
      const found = res.data.find(l => l.id === selectedLeague.id);
      setSelectedLeague(found || res.data[0]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Torneos y Ligas del Club
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Participe en las competencias oficiales de tenis en modalidades Singles y Dobles sobre Polvo de Ladrillo, Cemento y Césped.
          </p>
        </div>

        {/* Switcher Tab */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tournaments')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'tournaments'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Torneos Oficiales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leagues')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'leagues'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ligas Regulares
          </button>
        </div>
      </div>

      {/* =================================================== */}
      {/* SECTION: TOURNAMENTS */}
      {/* =================================================== */}
      {activeTab === 'tournaments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Tournaments List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <span className="block text-xs font-semibold uppercase text-slate-500">
              Torneos Disponibles:
            </span>

            {tournaments.map(trn => {
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
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="font-semibold text-slate-800">
                      {trn.category} • {trn.modality}
                    </span>
                    <span className="text-slate-500">
                      Superficie: {trn.surfaceRequired}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1">{trn.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{trn.description}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Inscripción: <strong className="text-slate-900">${trn.registrationFee?.toLocaleString('es-AR')}</strong></span>
                    <span>Cupos: <strong className="text-tennis-700">{trn.currentEnrolled || 0} / {trn.maxParticipants}</strong></span>
                  </div>

                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTournament(trn);
                        setShowEnrollTrnModal(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-semibold text-xs border border-tennis-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5 text-tennis-600" />
                      Inscribirme a este Torneo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Tournament Details & Bracket (8 cols) */}
          <div className="lg:col-span-8">
            {selectedTournament ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                
                {/* Header of selected tournament */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-tennis-700 uppercase tracking-wider block">
                      Cuadro Oficial / Eliminación Directa
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedTournament.name}</h2>
                    <div className="text-xs text-slate-500 mt-1">
                      {selectedTournament.category} • {selectedTournament.modality} • Cancha: {selectedTournament.surfaceRequired}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTrnSubView('bracket')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        trnSubView === 'bracket' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Cuadro (Fixture)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrnSubView('rules')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        trnSubView === 'rules' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Reglamento Interno
                    </button>
                  </div>
                </div>

                {/* SubView: Bracket */}
                {trnSubView === 'bracket' && (
                  <div className="space-y-4">
                    <TournamentBracketTree
                      tournament={selectedTournament}
                      isAdmin={false}
                    />

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                      <strong className="block font-semibold text-slate-800 mb-0.5">Sistema Oficial de Competencia:</strong>
                      Partidos al mejor de 3 sets con tie-break oficial. Los horarios de juego son coordinados por la dirección del torneo.
                    </div>
                  </div>
                )}

                {/* SubView: Rules */}
                {trnSubView === 'rules' && (
                  <div className="space-y-4">
                    <span className="text-xs font-semibold uppercase text-slate-800 block">
                      Bases y Reglamento Interno del Torneo
                    </span>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedTournament.internalRules || 'No se ha cargado reglamento interno específico para este torneo.'}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Seleccione un torneo para ver el cuadro de partidos.
              </div>
            )}
          </div>

        </div>
      )}

      {/* =================================================== */}
      {/* SECTION: LEAGUES */}
      {/* =================================================== */}
      {activeTab === 'leagues' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Leagues List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <span className="block text-xs font-semibold uppercase text-slate-500">
              Ligas Disponibles:
            </span>

            {leagues.map(liga => {
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
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="font-semibold text-slate-800">
                      {liga.category} • {liga.modality}
                    </span>
                    <span className="text-slate-500">
                      Superficie: {liga.surfaceRequired}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1">{liga.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{liga.description}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Inscripción: <strong className="text-slate-900">${liga.registrationFee?.toLocaleString('es-AR')}</strong></span>
                    <span>Cupos: <strong className="text-tennis-700">{liga.currentEnrolled || 0} / {liga.maxParticipants}</strong></span>
                  </div>

                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLeague(liga);
                        setShowEnrollLeagueModal(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-semibold text-xs border border-tennis-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5 text-tennis-600" />
                      Inscribirme a esta Liga
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected League Workspace (8 cols) */}
          <div className="lg:col-span-8">
            {selectedLeague ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-tennis-700 uppercase tracking-wider block">
                      Liga Regular Todos contra Todos
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedLeague.name}</h2>
                    <div className="text-xs text-slate-500 mt-1">
                      {selectedLeague.category} • {selectedLeague.modality} • Superficie: {selectedLeague.surfaceRequired} • {selectedLeague.startDate} al {selectedLeague.endDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setLeagueSubView('standings')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        leagueSubView === 'standings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Posiciones
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeagueSubView('fixtures')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        leagueSubView === 'fixtures' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Jornadas y Partidos
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeagueSubView('rules')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        leagueSubView === 'rules' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Reglamento Interno
                    </button>
                  </div>
                </div>

                {/* SubView 1: Standings */}
                {leagueSubView === 'standings' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">Tabla de Clasificación Oficial</span>
                      <span className="text-slate-500">Puntos: PG (3 pts) • PP (0 pts)</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                          <tr>
                            <th className="p-3 text-center w-12">Pos</th>
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
                                No se registran posiciones aún en esta liga.
                              </td>
                            </tr>
                          ) : (
                            selectedLeague.standings.map((s, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-3 text-center font-bold text-slate-700">{s.rank || idx + 1}</td>
                                <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                                <td className="p-3 text-center text-slate-600">{s.pj || 0}</td>
                                <td className="p-3 text-center text-slate-600">{s.pg || 0}</td>
                                <td className="p-3 text-center text-slate-600">{s.pp || 0}</td>
                                <td className="p-3 text-center text-slate-600">{s.sf || 0}</td>
                                <td className="p-3 text-center text-slate-600">{s.sc || 0}</td>
                                <td className="p-3 text-center font-medium text-slate-700">{s.dif > 0 ? `+${s.dif}` : s.dif}</td>
                                <td className="p-3 text-center font-bold text-slate-900 bg-slate-50/50">{s.points || 0}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SubView 2: Fixtures */}
                {leagueSubView === 'fixtures' && (
                  <div className="space-y-4">
                    {(!selectedLeague.fixtures || selectedLeague.fixtures.length === 0) ? (
                      <div className="p-6 text-center text-slate-400 text-xs border border-slate-200 rounded-xl">
                        No hay jornadas programadas aún.
                      </div>
                    ) : (
                      selectedLeague.fixtures.map((jornada, jIdx) => (
                        <div key={jIdx} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-xs text-slate-800">
                            {jornada.round}
                          </div>
                          <div className="divide-y divide-slate-100">
                            {jornada.matches?.map((m) => (
                              <div key={m.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {m.p1} vs {m.p2}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {m.court} • {m.date}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-slate-800">
                                    {m.status === 'finalizado' ? m.score : 'Programado'}
                                  </div>
                                  {m.winner && (
                                    <div className="text-[11px] text-slate-500">
                                      Ganador: {m.winner}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* SubView 3: Rules */}
                {leagueSubView === 'rules' && (
                  <div className="space-y-4">
                    <span className="text-xs font-semibold uppercase text-slate-800 block">
                      Reglamento Oficial de la Liga
                    </span>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedLeague.internalRules || 'No se ha cargado reglamento interno para esta liga.'}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Seleccione una liga para ver las posiciones y partidos.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal Enroll Tournament */}
      <Modal
        isOpen={showEnrollTrnModal}
        onClose={() => setShowEnrollTrnModal(false)}
        title={`Inscripción a Torneo: ${selectedTournament?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEnrollTournament} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-800">
              Modalidad: {selectedTournament?.modality} • {selectedTournament?.category}
            </div>
            <div className="text-slate-500 mt-1">
              Arancel Oficial: <strong className="text-slate-900">${selectedTournament?.registrationFee?.toLocaleString('es-AR')}</strong>
            </div>
          </div>

          {selectedTournament?.modality === 'Pareja' && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <label className="font-semibold text-slate-700 uppercase block">Datos de la Pareja / Compañero(a) *</label>
              <input
                type="text"
                required
                placeholder="Nombre y Apellido de la Pareja"
                value={partnerNameTrn}
                onChange={(e) => setPartnerNameTrn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
              <input
                type="text"
                required
                placeholder="DNI de la Pareja"
                value={partnerDniTrn}
                onChange={(e) => setPartnerDniTrn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          )}

          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-200">
            Al confirmar la inscripción quedará registrado en el padrón de participantes para el sorteo del fixture oficial.
          </div>

          <button
            type="submit"
            disabled={enrollingTrn}
            className="w-full py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm"
          >
            {enrollingTrn ? 'Procesando...' : 'Confirmar Inscripción'}
          </button>
        </form>
      </Modal>

      {/* Modal Enroll League */}
      <Modal
        isOpen={showEnrollLeagueModal}
        onClose={() => setShowEnrollLeagueModal(false)}
        title={`Inscripción a Liga: ${selectedLeague?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEnrollLeague} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-800">
              Modalidad: {selectedLeague?.modality} • {selectedLeague?.category}
            </div>
            <div className="text-slate-500 mt-1">
              Arancel Oficial: <strong className="text-slate-900">${selectedLeague?.registrationFee?.toLocaleString('es-AR')}</strong>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre y Apellido *</label>
            <input
              type="text"
              required
              value={leagueEnrollForm.name}
              onChange={(e) => setLeagueEnrollForm({ ...leagueEnrollForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">DNI *</label>
            <input
              type="text"
              required
              value={leagueEnrollForm.dni}
              onChange={(e) => setLeagueEnrollForm({ ...leagueEnrollForm, dni: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          {selectedLeague?.modality === 'Pareja' && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <label className="font-semibold text-slate-700 uppercase block">Datos de la Pareja *</label>
              <input
                type="text"
                required
                placeholder="Nombre de la Pareja"
                value={leagueEnrollForm.partnerName}
                onChange={(e) => setLeagueEnrollForm({ ...leagueEnrollForm, partnerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
              <input
                type="text"
                required
                placeholder="DNI de la Pareja"
                value={leagueEnrollForm.partnerDni}
                onChange={(e) => setLeagueEnrollForm({ ...leagueEnrollForm, partnerDni: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={enrollingLeague}
            className="w-full py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm"
          >
            {enrollingLeague ? 'Procesando...' : 'Confirmar Inscripción a Liga'}
          </button>
        </form>
      </Modal>

    </div>
  );
}
