import React, { useState, useEffect } from 'react';
import { tournamentsService } from '../../services/api';
import { Trophy, Users, Calendar, Award, CheckCircle2, ChevronRight, Swords, ShieldCheck } from 'lucide-react';
import Modal from '../../components/common/Modal';
import TournamentBracketTree from '../../components/common/TournamentBracketTree';

export default function ClientTournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerDni, setPartnerDni] = useState('');

  useEffect(() => {
    tournamentsService.getAll().then(res => {
      setTournaments(res.data);
      if (res.data.length > 0) setSelectedTournament(res.data[0]);
    });
  }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrolling(true);
    await tournamentsService.enroll(selectedTournament.id, { partnerName, partnerDni });
    setEnrolling(false);
    setShowEnrollModal(false);
    alert('¡Inscripción completada exitosamente! Recibirás los detalles del fixture por email.');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Torneos y Cuadros de Juego (Fixtures)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Competencias oficiales del club: Masculinos, Femeninos, Singles y Dobles en todas las superficies (Ladrillo, Cemento, Pasto).
          </p>
        </div>
      </div>

      {/* Tournaments List & Bracket Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Tournament Cards (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <label className="block text-xs font-bold uppercase text-slate-500">
            Torneos Disponibles:
          </label>

          {tournaments.map(trn => {
            const isSelected = selectedTournament?.id === trn.id;

            return (
              <div
                key={trn.id}
                onClick={() => setSelectedTournament(trn)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white border-tennis-600 ring-2 ring-tennis-500/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      {trn.category} • {trn.modality}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Cancha: {trn.surfaceRequired}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {trn.status === 'inscripcion_abierta' ? 'Inscripción Abierta' : 'En Curso'}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mt-2">{trn.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{trn.description}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Inscripción:</span>
                    <span className="font-bold text-slate-800">${trn.registrationFee?.toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cupos:</span>
                    <span className="font-bold text-tennis-700">{trn.currentEnrolled} / {trn.maxParticipants}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Superficie:</span>
                    <span className="font-bold text-slate-800">{trn.surfaceRequired}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTournament(trn);
                      setShowEnrollModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-bold text-xs border border-tennis-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5 text-tennis-600" />
                    Inscribirme a este Torneo
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Tournament Bracket Viewer (8 Cols) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-extrabold text-tennis-700 uppercase">Cuadro Oficial / Fixture AAT</span>
                <h2 className="text-lg font-black text-slate-900">{selectedTournament?.name}</h2>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                <Swords className="w-3.5 h-3.5" /> Eliminación Directa
              </div>
            </div>

            {/* Elimination Bracket Tree (Cuartos -> Semis -> Final) */}
            <TournamentBracketTree
              tournament={selectedTournament}
              isAdmin={false}
            />

            {/* Official Rules Note */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <strong className="block font-bold text-slate-800">Reglamento Oficial:</strong>
              <p className="text-[11px]">
                Todos los torneos se rigen por las reglas oficiales de la Asociación de Tenis (AAT/ITF). Se juega al mejor de 3 sets con Tie-break a 7 puntos en todos los sets.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title={`Inscripción a: ${selectedTournament?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEnroll} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800">Modalidad: {selectedTournament?.modality} • {selectedTournament?.category}</div>
            <div className="text-slate-500 mt-1">Costo de Inscripción: <strong>${selectedTournament?.registrationFee?.toLocaleString('es-AR')}</strong></div>
          </div>

          {selectedTournament?.modality === 'Pareja' && (
            <div className="space-y-2 border-t border-slate-100 pt-2">
              <label className="font-bold text-slate-700 uppercase block">Datos de la Pareja / Compañero(a) *</label>
              <input
                type="text"
                required
                placeholder="Nombre y Apellido de la Pareja"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
              <input
                type="text"
                required
                placeholder="DNI de la Pareja"
                value={partnerDni}
                onChange={(e) => setPartnerDni(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          )}

          <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
            Al inscribirte quedarás registrado en el sorteo del fixture oficial.
          </div>

          <button
            type="submit"
            disabled={enrolling}
            className="w-full py-3 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-sm shadow-md"
          >
            {enrolling ? 'Procesando inscripción...' : 'Confirmar Inscripción'}
          </button>
        </form>
      </Modal>

    </div>
  );
}
