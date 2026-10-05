import React, { useState } from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  Swords, 
  Edit3, 
  RotateCcw, 
  Zap, 
  Printer, 
  Award, 
  Calendar,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Modal from './Modal';

export default function TournamentBracketTree({ 
  tournament, 
  isAdmin = false, 
  onUpdateTournament 
}) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [set1, setSet1] = useState('6-4');
  const [set2, setSet2] = useState('6-3');
  const [set3, setSet3] = useState('');
  const [selectedWinner, setSelectedWinner] = useState('');

  if (!tournament) return null;

  // Initial bracket fallback if empty
  const defaultBracket = [
    {
      round: 'Cuartos de Final',
      matches: [
        { id: 'm1', p1: 'F. Gómez (1)', p2: 'L. Mayer', score: '6-4, 7-5', winner: 'F. Gómez (1)', status: 'finalizado' },
        { id: 'm2', p1: 'J. M. del Potro (3)', p2: 'D. Schwartzman', score: '6-3, 3-6, 6-4', winner: 'J. M. del Potro (3)', status: 'finalizado' },
        { id: 'm3', p1: 'M. Zabaleta', p2: 'G. Gaudio (4)', score: '4-6, 6-2, 7-6', winner: 'M. Zabaleta', status: 'finalizado' },
        { id: 'm4', p1: 'G. Coria (2)', p2: 'J. I. Chela', score: '6-2, 6-1', winner: 'G. Coria (2)', status: 'finalizado' }
      ]
    },
    {
      round: 'Semifinales',
      matches: [
        { id: 'm5', p1: 'F. Gómez (1)', p2: 'J. M. del Potro (3)', score: 'Pendiente', winner: null, status: 'programado', date: '2026-09-10 16:00', court: 'Cancha 1' },
        { id: 'm6', p1: 'M. Zabaleta', p2: 'G. Coria (2)', score: 'Pendiente', winner: null, status: 'programado', date: '2026-09-10 18:00', court: 'Cancha 2' }
      ]
    },
    {
      round: 'Gran Final',
      matches: [
        { id: 'm7', p1: 'Ganador SF 1', p2: 'Ganador SF 2', score: 'A disputarse', winner: null, status: 'pendiente', date: '2026-09-12 17:00', court: 'Cancha 1' }
      ]
    }
  ];

  const currentBracket = (tournament.bracket && tournament.bracket.length === 3) 
    ? tournament.bracket 
    : defaultBracket;

  const quarters = currentBracket[0]?.matches || [];
  const semis = currentBracket[1]?.matches || [];
  const finalMatch = currentBracket[2]?.matches[0] || null;
  const champion = finalMatch?.winner;

  // Open modal for editing
  const handleOpenEditMatch = (match) => {
    setSelectedMatch(match);
    setSelectedWinner(match.winner || match.p1);
    
    // Parse existing score if available
    if (match.score && match.score.includes(',')) {
      const parts = match.score.split(',').map(s => s.trim());
      setSet1(parts[0] || '6-4');
      setSet2(parts[1] || '6-3');
      setSet3(parts[2] || '');
    } else {
      setSet1('6-4');
      setSet2('6-3');
      setSet3('');
    }
  };

  // Advance winner in bracket
  const handleSaveResult = (e) => {
    e.preventDefault();
    if (!selectedMatch) return;

    const fullScore = [set1, set2, set3].filter(Boolean).join(', ');
    const winnerName = selectedWinner;

    const newBracket = JSON.parse(JSON.stringify(currentBracket));

    // Update the selected match
    let updatedRoundIdx = -1;
    let updatedMatchIdx = -1;

    newBracket.forEach((r, rIdx) => {
      r.matches.forEach((m, mIdx) => {
        if (m.id === selectedMatch.id) {
          updatedRoundIdx = rIdx;
          updatedMatchIdx = mIdx;
          m.score = fullScore;
          m.winner = winnerName;
          m.status = 'finalizado';
        }
      });
    });

    // Advance winner to the next round!
    if (updatedRoundIdx === 0) {
      // Quarter Finals: m1 and m2 advance to m5; m3 and m4 advance to m6
      if (updatedMatchIdx === 0) {
        newBracket[1].matches[0].p1 = winnerName;
      } else if (updatedMatchIdx === 1) {
        newBracket[1].matches[0].p2 = winnerName;
      } else if (updatedMatchIdx === 2) {
        newBracket[1].matches[1].p1 = winnerName;
      } else if (updatedMatchIdx === 3) {
        newBracket[1].matches[1].p2 = winnerName;
      }
    } else if (updatedRoundIdx === 1) {
      // Semifinals: m5 winner goes to Final p1; m6 winner goes to Final p2
      if (updatedMatchIdx === 0) {
        newBracket[2].matches[0].p1 = winnerName;
      } else if (updatedMatchIdx === 1) {
        newBracket[2].matches[0].p2 = winnerName;
      }
    }

    const updatedTrn = {
      ...tournament,
      bracket: newBracket
    };

    if (onUpdateTournament) {
      onUpdateTournament(updatedTrn);
    }

    setSelectedMatch(null);
  };

  // Simulate an entire tournament step-by-step or automatically
  const handleSimulateTournament = () => {
    const newBracket = JSON.parse(JSON.stringify(currentBracket));

    // Simulate Semis if not played
    newBracket[1].matches.forEach((m, idx) => {
      if (m.status !== 'finalizado') {
        const randWinner = Math.random() > 0.5 ? m.p1 : m.p2;
        const s1 = Math.random() > 0.3 ? '6-4' : '7-6';
        const s2 = Math.random() > 0.4 ? '6-3' : '4-6, 6-4';
        m.score = `${s1}, ${s2}`;
        m.winner = randWinner;
        m.status = 'finalizado';
        if (idx === 0) newBracket[2].matches[0].p1 = randWinner;
        else newBracket[2].matches[0].p2 = randWinner;
      }
    });

    // Simulate Final
    const fin = newBracket[2].matches[0];
    if (fin.status !== 'finalizado') {
      const champ = Math.random() > 0.5 ? fin.p1 : fin.p2;
      fin.score = '7-5, 4-6, 6-3';
      fin.winner = champ;
      fin.status = 'finalizado';
    }

    const updatedTrn = {
      ...tournament,
      bracket: newBracket
    };

    if (onUpdateTournament) {
      onUpdateTournament(updatedTrn);
    }
  };

  // Reset bracket
  const handleResetBracket = () => {
    const updatedTrn = {
      ...tournament,
      bracket: defaultBracket
    };
    if (onUpdateTournament) {
      onUpdateTournament(updatedTrn);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Bracket Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-tennis-500 text-slate-950 flex items-center gap-1">
              <Swords className="w-3 h-3" /> Cuadro Eliminatorio Oficial
            </span>
            <span className="text-slate-400 text-xs">
              Superficie: <strong className="text-white">{tournament.surfaceRequired}</strong> • {tournament.modality}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black mt-1 text-white tracking-tight">
            Árbol de Llaves — Eliminación Directa
          </h3>
          <p className="text-slate-400 text-xs">
            Cuartos de Final → Semifinales → Gran Final. Partidos oficiales al mejor de 3 sets (RF105 a RF115).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={handleSimulateTournament}
                className="px-3.5 py-2 rounded-xl bg-tennis-500 hover:bg-tennis-400 text-slate-950 font-black text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Simular Resultados
              </button>
              <button
                type="button"
                onClick={handleResetBracket}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Champion Podium Banner if crowned */}
      {champion && (
        <div className="p-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 rounded-2xl shadow-md flex items-center justify-between border-2 border-amber-300 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/90 text-amber-600 flex items-center justify-center shadow-md shrink-0">
              <Trophy className="w-7 h-7 fill-amber-500" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 text-white">
                Campeón Oficial del Torneo
              </span>
              <h4 className="text-lg font-black tracking-tight mt-0.5">{champion}</h4>
              <p className="text-xs font-semibold text-slate-900/80">
                Ganador de la Gran Final ({finalMatch?.score}) • Trofeo y Puntos de Ranking AAT
              </p>
            </div>
          </div>
          <Sparkles className="w-8 h-8 text-white shrink-0 hidden sm:block" />
        </div>
      )}

      {/* Interactive Bracket Graphic with Connector Lines */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[860px] grid grid-cols-12 gap-4 items-stretch">
          
          {/* COLUMN 1: Cuartos de Final (4 matches) - 4 cols */}
          <div className="col-span-4 space-y-4">
            <div className="text-center pb-2 border-b border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ronda 1</span>
              <h4 className="text-xs font-black uppercase text-slate-800">Cuartos de Final</h4>
            </div>

            <div className="space-y-6 pt-2">
              {quarters.map((match, idx) => (
                <div key={match.id || idx} className="relative group">
                  <MatchCard
                    match={match}
                    roundName="Cuartos de Final"
                    isAdmin={isAdmin}
                    onEdit={() => handleOpenEditMatch(match)}
                  />
                  
                  {/* Right connector line leading towards Semis */}
                  <div className="hidden lg:block absolute -right-4 top-1/2 w-4 h-0.5 bg-slate-300 group-hover:bg-tennis-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Connectors Branch 1: QF -> Semis (1 col) */}
          <div className="col-span-1 hidden lg:flex flex-col justify-around py-12 relative">
            {/* Top branch for QF1 & QF2 merging to SF1 */}
            <div className="h-44 border-r-2 border-t-2 border-b-2 border-slate-300 rounded-r-xl relative">
              <div className="absolute -right-4 top-1/2 w-4 h-0.5 bg-slate-300" />
            </div>

            {/* Bottom branch for QF3 & QF4 merging to SF2 */}
            <div className="h-44 border-r-2 border-t-2 border-b-2 border-slate-300 rounded-r-xl relative">
              <div className="absolute -right-4 top-1/2 w-4 h-0.5 bg-slate-300" />
            </div>
          </div>

          {/* COLUMN 2: Semifinales (2 matches) - 3 cols */}
          <div className="col-span-3 space-y-4 flex flex-col justify-around">
            <div className="text-center pb-2 border-b border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ronda 2</span>
              <h4 className="text-xs font-black uppercase text-slate-800">Semifinales</h4>
            </div>

            <div className="space-y-16 py-6">
              {semis.map((match, idx) => (
                <div key={match.id || idx} className="relative group">
                  <MatchCard
                    match={match}
                    roundName="Semifinal"
                    isAdmin={isAdmin}
                    onEdit={() => handleOpenEditMatch(match)}
                  />
                  {/* Right connector */}
                  <div className="hidden lg:block absolute -right-4 top-1/2 w-4 h-0.5 bg-slate-300 group-hover:bg-tennis-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Connectors Branch 2: Semis -> Final (1 col) */}
          <div className="col-span-1 hidden lg:flex flex-col justify-center py-16 relative">
            <div className="h-60 border-r-2 border-t-2 border-b-2 border-slate-300 rounded-r-xl relative">
              <div className="absolute -right-4 top-1/2 w-4 h-0.5 bg-slate-300" />
            </div>
          </div>

          {/* COLUMN 3: Gran Final & Campeón - 3 cols */}
          <div className="col-span-3 space-y-4 flex flex-col justify-center">
            <div className="text-center pb-2 border-b border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 font-bold">Definición de Campeonato</span>
              <h4 className="text-xs font-black uppercase text-slate-900">Gran Final</h4>
            </div>

            <div className="py-8">
              {finalMatch && (
                <div className="relative group">
                  <MatchCard
                    match={finalMatch}
                    roundName="Gran Final"
                    isAdmin={isAdmin}
                    isFinal={true}
                    onEdit={() => handleOpenEditMatch(finalMatch)}
                  />
                </div>
              )}
            </div>

            {/* Trophy Podium Box */}
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-center space-y-1">
              <Trophy className="w-8 h-8 text-amber-500 mx-auto fill-amber-400" />
              <div className="text-[10px] font-black uppercase text-amber-800">Copa Tenis Ahora</div>
              <div className="text-xs font-black text-slate-900">
                {champion || 'Por definirse'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Match Score Modal */}
      <Modal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title={`Cargar Resultado: ${selectedMatch?.p1} vs ${selectedMatch?.p2}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveResult} className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Partido Seleccionado:</span>
            <div className="font-extrabold text-sm text-slate-900 mt-0.5">
              {selectedMatch?.p1} vs {selectedMatch?.p2}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              El ganador avanzará automáticamente a la siguiente ronda del fixture.
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase text-slate-700">
              Marcador por Sets (Formato: Games-Games, ej. 6-4) *
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Set 1 *</span>
                <input
                  type="text"
                  required
                  placeholder="6-4"
                  value={set1}
                  onChange={(e) => setSet1(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-slate-300 text-center font-bold text-xs focus:border-tennis-600 outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Set 2 *</span>
                <input
                  type="text"
                  required
                  placeholder="6-3"
                  value={set2}
                  onChange={(e) => setSet2(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-slate-300 text-center font-bold text-xs focus:border-tennis-600 outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Set 3 (opcional)</span>
                <input
                  type="text"
                  placeholder="7-5"
                  value={set3}
                  onChange={(e) => setSet3(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-slate-300 text-center font-bold text-xs focus:border-tennis-600 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Jugador / Pareja Ganador(a) *
            </label>
            <select
              value={selectedWinner}
              onChange={(e) => setSelectedWinner(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-xs bg-white focus:border-tennis-600 outline-none"
            >
              <option value={selectedMatch?.p1}>{selectedMatch?.p1}</option>
              <option value={selectedMatch?.p2}>{selectedMatch?.p2}</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedMatch(null)}
              className="px-3.5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Guardar y Avanzar en Cuadro
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

// Single Match Box in the Elimination Bracket
function MatchCard({ match, roundName, isAdmin, isFinal = false, onEdit }) {
  const isFinished = match.status === 'finalizado';
  const hasWinner = !!match.winner;

  return (
    <div className={`p-3 bg-white rounded-2xl border transition-all shadow-sm ${
      isFinal 
        ? 'border-amber-400 ring-2 ring-amber-400/20' 
        : 'border-slate-200 hover:border-tennis-400'
    }`}>
      {/* Header bar of the match */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pb-1.5 border-b border-slate-100">
        <span className="uppercase">Partido #{match.id}</span>
        <span className={isFinished ? 'text-emerald-600 font-black' : 'text-amber-600'}>
          {isFinished ? '✓ Finalizado' : match.date || 'Programado'}
        </span>
      </div>

      {/* Players list */}
      <div className="space-y-1.5 pt-2">
        {/* Player 1 */}
        <div className={`p-1.5 rounded-xl flex items-center justify-between transition-colors ${
          hasWinner && match.winner === match.p1 
            ? 'bg-tennis-50 text-tennis-900 border border-tennis-300 font-black shadow-xs' 
            : 'text-slate-700 bg-slate-50'
        }`}>
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs truncate">{match.p1}</span>
            {hasWinner && match.winner === match.p1 && (
              <CheckCircle2 className="w-3.5 h-3.5 text-tennis-700 shrink-0" />
            )}
          </div>
        </div>

        {/* Player 2 */}
        <div className={`p-1.5 rounded-xl flex items-center justify-between transition-colors ${
          hasWinner && match.winner === match.p2 
            ? 'bg-tennis-50 text-tennis-900 border border-tennis-300 font-black shadow-xs' 
            : 'text-slate-700 bg-slate-50'
        }`}>
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs truncate">{match.p2}</span>
            {hasWinner && match.winner === match.p2 && (
              <CheckCircle2 className="w-3.5 h-3.5 text-tennis-700 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Score and actions footer */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[11px]">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Marcador:</span>
          <span className="font-extrabold text-slate-900">
            {match.score || 'Pendiente'}
          </span>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={onEdit}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-tennis-100 text-slate-700 hover:text-tennis-900 font-bold text-[10px] border border-slate-200 flex items-center gap-1 transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            Cargar
          </button>
        ) : (
          isFinished && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Oficial
            </span>
          )
        )}
      </div>
    </div>
  );
}
