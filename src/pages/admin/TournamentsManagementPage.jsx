import React, { useState, useEffect } from 'react';
import { tournamentsService } from '../../services/api';
import { 
  Trophy, 
  Plus, 
  Users, 
  CheckCircle2, 
  Award, 
  Calendar, 
  Swords, 
  Edit, 
  Printer, 
  Save, 
  X 
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import TournamentBracketTree from '../../components/common/TournamentBracketTree';

export default function TournamentsManagementPage() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  
  // Create Tournament Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTrn, setNewTrn] = useState({
    name: '',
    category: 'Masculino',
    modality: 'Singles',
    surfaceRequired: 'Ladrillo',
    startDate: '2026-09-01',
    endDate: '2026-09-10',
    registrationFee: 7500,
    maxParticipants: 16,
    description: ''
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    const res = await tournamentsService.getAll();
    setTournaments(res.data);
    if (res.data.length > 0 && !selectedTournament) {
      setSelectedTournament(res.data[0]);
    }
  };

  const handleUpdateTournament = (updatedTrn) => {
    setSelectedTournament(updatedTrn);
    setTournaments(tournaments.map(t => t.id === updatedTrn.id ? updatedTrn : t));
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    await tournamentsService.create(newTrn);
    setShowCreateModal(false);
    loadTournaments();
    alert('¡Torneo creado exitosamente!');
  };

  const handleSaveMatchScore = (e) => {
    e.preventDefault();
    if (!editingMatch) return;

    // Update match in local tournament bracket
    const updatedBracket = selectedTournament.bracket.map(round => ({
      ...round,
      matches: round.matches.map(m => {
        if (m.id === editingMatch.id) {
          return {
            ...m,
            score: matchScoreInput,
            winner: matchWinnerInput,
            status: 'finalizado'
          };
        }
        return m;
      })
    }));

    const updatedTrn = { ...selectedTournament, bracket: updatedBracket };
    setSelectedTournament(updatedTrn);
    setTournaments(tournaments.map(t => t.id === updatedTrn.id ? updatedTrn : t));
    setEditingMatch(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Organización de Torneos, Fixtures y Resultados
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Categorías Masculino y Femenino, Singles y Parejas en Ladrillo, Cemento y Pasto. Conforme a las reglas de la Asociación de Tenis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Fixture
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-md hover:shadow-glow-green flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Torneo
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Tournaments Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3 no-print">
          <label className="block text-xs font-bold uppercase text-slate-500">
            Torneos Registrados:
          </label>
          
          {tournaments.map(trn => {
            const isSelected = selectedTournament?.id === trn.id;

            return (
              <div
                key={trn.id}
                onClick={() => setSelectedTournament(trn)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-white border-tennis-600 ring-2 ring-tennis-500/20 shadow-md' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    {trn.category} • {trn.modality}
                  </span>
                  <span className="font-bold text-tennis-700 bg-tennis-50 px-2 py-0.5 rounded-full">
                    {trn.surfaceRequired}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 mt-2">{trn.name}</h3>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                  <span>Inscriptos: <strong>{trn.currentEnrolled}/{trn.maxParticipants}</strong></span>
                  <span>Inscripción: <strong>${trn.registrationFee?.toLocaleString('es-AR')}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Bracket Tree Visualizer & Interactive Match Score Recording (8 cols) */}
        <div className="lg:col-span-8">
          <div id="printable-area" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-tennis-700 tracking-wider">
                  Cuadro Oficial del Torneo / Fixture AAT
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">{selectedTournament?.name}</h2>
                <p className="text-xs text-slate-500">
                  {selectedTournament?.category} • {selectedTournament?.modality} • Superficie: {selectedTournament?.surfaceRequired}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Inscripción Oficial</span>
                <span className="text-xs font-black text-tennis-700">${selectedTournament?.registrationFee?.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* Interactive Elimination Bracket Tree (Cuartos -> Semis -> Final) */}
            <TournamentBracketTree
              tournament={selectedTournament}
              isAdmin={true}
              onUpdateTournament={handleUpdateTournament}
            />

          </div>
        </div>

      </div>

      {/* Create Tournament Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Torneo Oficial"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTournament} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Nombre del Torneo *</label>
            <input
              type="text"
              required
              placeholder="Copa Master Tenis Ahora 2026"
              value={newTrn.name}
              onChange={(e) => setNewTrn({ ...newTrn, name: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Categoría *</label>
              <select
                value={newTrn.category}
                onChange={(e) => setNewTrn({ ...newTrn, category: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white font-bold"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Modalidad *</label>
              <select
                value={newTrn.modality}
                onChange={(e) => setNewTrn({ ...newTrn, modality: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white font-bold"
              >
                <option value="Singles">Single (Individual)</option>
                <option value="Pareja">Pareja (Dobles)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Superficie de Cancha *</label>
              <select
                value={newTrn.surfaceRequired}
                onChange={(e) => setNewTrn({ ...newTrn, surfaceRequired: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white font-bold"
              >
                <option value="Ladrillo">Polvo de Ladrillo</option>
                <option value="Cemento">Cemento / Hard Court</option>
                <option value="Pasto">Césped / Pasto</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Costo de Inscripción (ARS) *</label>
              <input
                type="number"
                required
                value={newTrn.registrationFee}
                onChange={(e) => setNewTrn({ ...newTrn, registrationFee: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-2 text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl"
            >
              Crear Torneo
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
