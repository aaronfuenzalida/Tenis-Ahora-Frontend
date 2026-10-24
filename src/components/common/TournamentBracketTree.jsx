import React, { useState } from 'react';
import Modal from './Modal';

const ROUND_NAMES = ['Cuartos de final', 'Semifinales', 'Final'];

/** Arma un cuadro de 8 lugares a partir de los inscriptos (los lugares vacíos quedan "A definir"). */
export function buildBracketFromParticipants(participants = []) {
  const names = participants.slice(0, 8).map(p => (p.partnerName ? `${p.name} / ${p.partnerName}` : p.name));
  while (names.length < 8) names.push('A definir');
  const qf = [0, 1, 2, 3].map(i => ({
    id: `m${i + 1}`,
    p1: names[i * 2],
    p2: names[i * 2 + 1],
    score: '',
    winner: null,
    status: 'programado'
  }));
  return [
    { round: ROUND_NAMES[0], matches: qf },
    {
      round: ROUND_NAMES[1],
      matches: [
        { id: 'm5', p1: 'Ganador partido 1', p2: 'Ganador partido 2', score: '', winner: null, status: 'pendiente' },
        { id: 'm6', p1: 'Ganador partido 3', p2: 'Ganador partido 4', score: '', winner: null, status: 'pendiente' }
      ]
    },
    {
      round: ROUND_NAMES[2],
      matches: [{ id: 'm7', p1: 'Ganador semifinal 1', p2: 'Ganador semifinal 2', score: '', winner: null, status: 'pendiente' }]
    }
  ];
}

/**
 * Cuadro de eliminación directa a 8 (cuartos, semis y final). Las columnas comparten la misma altura
 * y cada partido se centra en su franja, así los conectores caen siempre en el medio de cada par.
 */
export default function TournamentBracketTree({ tournament, isAdmin = false, onUpdateTournament }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [set1, setSet1] = useState('');
  const [set2, setSet2] = useState('');
  const [set3, setSet3] = useState('');
  const [selectedWinner, setSelectedWinner] = useState('');

  if (!tournament) return null;

  const bracket = Array.isArray(tournament.bracket) && tournament.bracket.length === 3 ? tournament.bracket : null;

  const update = (newBracket) => {
    onUpdateTournament?.({ ...tournament, bracket: newBracket });
  };

  // Sin cuadro todavía
  if (!bracket) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800">El cuadro todavía no fue sorteado.</p>
        <p className="text-xs text-slate-500">
          Inscriptos: {tournament.participants?.length || 0} de {tournament.maxParticipants || 8}. El fixture se define al cerrar la inscripción.
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={() => update(buildBracketFromParticipants(tournament.participants))}
            className="px-4 py-2 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-sm"
          >
            Generar cuadro con los inscriptos
          </button>
        )}
      </div>
    );
  }

  const quarters = bracket[0].matches || [];
  const semis = bracket[1].matches || [];
  const finalMatch = bracket[2].matches?.[0] || null;
  const champion = finalMatch?.winner;

  const handleOpenEditMatch = (match) => {
    setSelectedMatch(match);
    setSelectedWinner(match.winner || match.p1);
    const parts = (match.score || '').split(',').map(s => s.trim()).filter(s => /\d+-\d+/.test(s));
    setSet1(parts[0] || '');
    setSet2(parts[1] || '');
    setSet3(parts[2] || '');
  };

  // Guarda el resultado y avanza al ganador a la ronda siguiente.
  const handleSaveResult = (e) => {
    e.preventDefault();
    if (!selectedMatch) return;
    const fullScore = [set1, set2, set3].map(s => s.trim()).filter(Boolean).join(', ');
    const winnerName = selectedWinner;
    const next = JSON.parse(JSON.stringify(bracket));

    let rIdx = -1;
    let mIdx = -1;
    next.forEach((r, ri) => r.matches.forEach((m, mi) => {
      if (m.id === selectedMatch.id) {
        rIdx = ri;
        mIdx = mi;
        m.score = fullScore;
        m.winner = winnerName;
        m.status = 'finalizado';
      }
    }));

    if (rIdx === 0) {
      const target = next[1].matches[Math.floor(mIdx / 2)];
      if (mIdx % 2 === 0) target.p1 = winnerName; else target.p2 = winnerName;
      target.status = target.status === 'finalizado' ? target.status : 'programado';
    } else if (rIdx === 1) {
      const target = next[2].matches[0];
      if (mIdx === 0) target.p1 = winnerName; else target.p2 = winnerName;
      target.status = target.status === 'finalizado' ? target.status : 'programado';
    }

    update(next);
    setSelectedMatch(null);
  };

  const handleResetBracket = () => update(buildBracketFromParticipants(tournament.participants));

  const canEdit = (m) => isAdmin && !/^(Ganador|A definir)/.test(m.p1) && !/^(Ganador|A definir)/.test(m.p2);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Eliminación directa a 8. {tournament.modality} • {tournament.surfaceRequired}
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={handleResetBracket}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 self-start sm:self-auto"
          >
            Rehacer cuadro con los inscriptos
          </button>
        )}
      </div>

      {champion && (
        <div className="p-4 bg-tennis-50 rounded-2xl border border-tennis-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-tennis-700">Campeón</span>
          <div className="text-lg font-black text-tennis-950">{champion}</div>
          {finalMatch?.score && <div className="text-xs text-tennis-800">Final: {finalMatch.score}</div>}
        </div>
      )}

      {/* Cuadro: cabeceras y cuerpo comparten la misma grilla de columnas */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1fr_2.5rem_1fr_2.5rem_1fr] gap-x-0">
            {ROUND_NAMES.map((name, i) => (
              <React.Fragment key={name}>
                {i > 0 && <div />}
                <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200">
                  {name}
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_2.5rem_1fr_2.5rem_1fr] items-stretch">
            {/* Cuartos */}
            <div className="flex flex-col">
              {quarters.map((m, idx) => (
                <div key={m.id || idx} className="flex-1 flex items-center py-2">
                  <MatchCard match={m} index={idx + 1} editable={canEdit(m)} onEdit={() => handleOpenEditMatch(m)} />
                </div>
              ))}
            </div>

            {/* Conectores cuartos → semis: dos llaves, cada una cubre la mitad de la altura */}
            <div className="flex flex-col">
              <Connector />
              <Connector />
            </div>

            {/* Semis */}
            <div className="flex flex-col">
              {semis.map((m, idx) => (
                <div key={m.id || idx} className="flex-1 flex items-center py-2">
                  <MatchCard match={m} index={idx + 5} editable={canEdit(m)} onEdit={() => handleOpenEditMatch(m)} />
                </div>
              ))}
            </div>

            {/* Conector semis → final */}
            <div className="flex flex-col">
              <Connector />
            </div>

            {/* Final */}
            <div className="flex flex-col">
              {finalMatch && (
                <div className="flex-1 flex items-center py-2">
                  <MatchCard match={finalMatch} index={7} isFinal editable={canEdit(finalMatch)} onEdit={() => handleOpenEditMatch(finalMatch)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Carga de resultado */}
      <Modal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title="Cargar resultado"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveResult} className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-extrabold text-sm text-slate-900">{selectedMatch?.p1} vs {selectedMatch?.p2}</div>
            <div className="text-[11px] text-slate-500 mt-1">El ganador pasa automáticamente a la ronda siguiente.</div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase text-slate-700">Sets, en formato 6-4</label>
            <div className="grid grid-cols-3 gap-2">
              {[['Set 1', set1, setSet1, true], ['Set 2', set2, setSet2, true], ['Set 3', set3, setSet3, false]].map(([label, val, setter, req]) => (
                <div key={label}>
                  <span className="text-[10px] text-slate-400 block mb-1">{label}</span>
                  <input
                    type="text"
                    required={req}
                    pattern="[0-9]{1,2}-[0-9]{1,2}"
                    placeholder="6-4"
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full p-2 bg-white rounded-xl border border-slate-300 text-center font-bold text-xs focus:border-tennis-600 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Ganador</label>
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
            <button type="button" onClick={() => setSelectedMatch(null)} className="px-3.5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl text-xs shadow-sm">
              Guardar resultado
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/**
 * Llave entre dos partidos y el siguiente: ocupa su franja completa; la caja interior va del centro del
 * partido de arriba (25%) al de abajo (75%) y el trazo de salida sale del medio (50%).
 */
function Connector() {
  return (
    <div className="flex-1 relative">
      <div className="absolute left-0 w-1/2 top-1/4 bottom-1/4 border-t-2 border-b-2 border-r-2 border-slate-300 rounded-r-md" />
      <div className="absolute left-1/2 right-0 top-1/2 border-t-2 border-slate-300" />
    </div>
  );
}

function MatchCard({ match, index, isFinal = false, editable, onEdit }) {
  const finished = match.status === 'finalizado';
  const placeholder = (name) => /^(Ganador|A definir)/.test(name || '');

  const row = (name) => {
    const isWinner = finished && match.winner === name;
    return (
      <div className={`px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 ${
        isWinner ? 'bg-tennis-50 text-tennis-900 font-black' : placeholder(name) ? 'bg-slate-50 text-slate-400 italic' : 'bg-slate-50 text-slate-700'
      }`}>
        <span className="text-xs truncate">{name}</span>
        {isWinner && <span className="text-[10px] font-bold text-tennis-700 shrink-0">Ganó</span>}
      </div>
    );
  };

  return (
    <div className={`w-full p-3 bg-white rounded-2xl border shadow-sm ${isFinal ? 'border-slate-400' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pb-1.5 border-b border-slate-100">
        <span className="uppercase">{isFinal ? 'Final' : `Partido ${index}`}</span>
        <span className={finished ? 'text-tennis-700' : 'text-slate-500'}>
          {finished ? 'Finalizado' : match.date || 'A programar'}
        </span>
      </div>

      <div className="space-y-1.5 pt-2">
        {row(match.p1)}
        {row(match.p2)}
      </div>

      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[11px]">
        <span className="font-bold text-slate-900">{finished && match.score ? match.score : 'Sin resultado'}</span>
        {editable && (
          <button
            type="button"
            onClick={onEdit}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-tennis-100 text-slate-700 hover:text-tennis-900 font-bold text-[10px] border border-slate-200"
          >
            {finished ? 'Editar' : 'Cargar'}
          </button>
        )}
      </div>
    </div>
  );
}
