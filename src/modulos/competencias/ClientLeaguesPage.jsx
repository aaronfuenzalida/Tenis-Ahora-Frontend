import React, { useState, useEffect } from 'react';
import { leaguesService } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../ui/FeedbackContext';
import Modal from '../../ui/Modal';
import { RulesDocumentLink } from './RulesDocument';
import PaymentFlowModal from '../caja/PaymentFlowModal';
import { isEnrolledByDni } from '../../utils/formatters';

export default function ClientLeaguesPage() {
  const { user } = useAuth();
  const { notify } = useFeedback();

  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [subView, setSubView] = useState('standings'); // 'standings' | 'fixtures' | 'rules'

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    name: user?.name || '',
    dni: user?.dni || '',
    phone: user?.phone || '',
    partnerName: '',
    partnerDni: ''
  });
  // Pago de la inscripción: { target, participantData }
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async (keepId) => {
    const res = await leaguesService.getAll();
    setLeagues(res.data);
    setSelectedLeague(res.data.find(l => l.id === keepId) || res.data[0] || null);
  };

  const alreadyEnrolled = (liga) => isEnrolledByDni(liga?.participants, user?.dni);
  const isFull = (liga) => (liga?.participants?.length || liga?.currentEnrolled || 0) >= (Number(liga?.maxParticipants) || Infinity);

  const openEnroll = (liga) => {
    setSelectedLeague(liga);
    if (alreadyEnrolled(liga)) {
      notify({ variant: 'warning', message: `Ya estás inscripto en "${liga.name}".` });
      return;
    }
    if (isFull(liga)) {
      notify({ variant: 'warning', message: `"${liga.name}" no tiene cupos disponibles.` });
      return;
    }
    setShowEnrollModal(true);
  };

  // La inscripción se concreta al acreditarse el pago del arancel.
  const handleEnroll = (e) => {
    e.preventDefault();
    if (alreadyEnrolled(selectedLeague) || isEnrolledByDni(selectedLeague?.participants, enrollForm.dni)) {
      setShowEnrollModal(false);
      notify({ variant: 'warning', message: `Ya hay una inscripción a "${selectedLeague.name}" con ese DNI.` });
      return;
    }
    if (enrollForm.partnerDni && enrollForm.partnerDni.replace(/\D/g, '') === String(enrollForm.dni).replace(/\D/g, '')) {
      notify({ variant: 'warning', message: 'El DNI de tu pareja no puede ser el tuyo.' });
      return;
    }
    setShowEnrollModal(false);
    setPayment({ target: selectedLeague, participantData: { ...enrollForm } });
  };

  const enrollAfterPayment = async () => {
    if (!payment) return null;
    await leaguesService.enroll(payment.target.id, payment.participantData);
    return { relatedId: payment.target.id };
  };

  const handlePaymentClosed = async (receipt) => {
    const paid = payment;
    setPayment(null);
    if (!receipt || !paid) return;
    setEnrollForm(f => ({ ...f, partnerName: '', partnerDni: '' }));
    await load(paid.target.id);
    notify({ variant: 'success', title: 'Inscripción confirmada', message: `Quedaste inscripto en "${paid.target.name}". El recibo ${receipt.id} ya figura en Mis Pagos y Recibos.` });
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ligas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de ligas */}
        <div className="lg:col-span-4 space-y-4">
          {leagues.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">No hay ligas con inscripción abierta.</div>
          )}
          {leagues.map(liga => {
            const isSelected = selectedLeague?.id === liga.id;
            return (
              <div
                key={liga.id}
                onClick={() => setSelectedLeague(liga)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-white border-tennis-600 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="font-semibold text-slate-800">{liga.category} • {liga.modality}</span>
                  <span className="text-slate-500">{liga.surfaceRequired}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{liga.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{liga.description}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Inscripción: <strong className="text-slate-900">${liga.registrationFee?.toLocaleString('es-AR')}</strong></span>
                  <span>Cupos: <strong className="text-tennis-700">{liga.currentEnrolled || 0} / {liga.maxParticipants}</strong></span>
                </div>
                <div className="mt-3 pt-2">
                  {alreadyEnrolled(liga) ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-tennis-50 text-tennis-800 font-semibold text-xs text-center border border-tennis-200">
                      Ya estás inscripto
                    </div>
                  ) : isFull(liga) ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs text-center border border-slate-200">
                      Sin cupos
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEnroll(liga); }}
                      className="w-full py-2 px-3 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-semibold text-xs border border-tennis-200 transition-colors"
                    >
                      Inscribirme
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detalle: posiciones, partidos y reglamento */}
        <div className="lg:col-span-8">
          {selectedLeague ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedLeague.name}</h2>
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedLeague.category} • {selectedLeague.modality} • {selectedLeague.surfaceRequired} • {selectedLeague.startDate} al {selectedLeague.endDate}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[['standings', 'Posiciones'], ['fixtures', 'Partidos'], ['rules', 'Reglamento']].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSubView(id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${subView === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {subView === 'standings' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Tabla de posiciones</span>
                    <span className="text-slate-500">Partido ganado: 3 puntos</span>
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
                            <td colSpan={9} className="p-6 text-center text-slate-400">Todavía no hay posiciones en esta liga.</td>
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

              {subView === 'fixtures' && (
                <div className="space-y-4">
                  {(!selectedLeague.fixtures || selectedLeague.fixtures.length === 0) ? (
                    <div className="p-6 text-center text-slate-400 text-xs border border-slate-200 rounded-xl">Todavía no hay jornadas programadas.</div>
                  ) : (
                    selectedLeague.fixtures.map((jornada, jIdx) => (
                      <div key={jIdx} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-xs text-slate-800">{jornada.round}</div>
                        <div className="divide-y divide-slate-100">
                          {jornada.matches?.map((m) => (
                            <div key={m.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                              <div>
                                <div className="font-semibold text-slate-900">{m.p1} vs {m.p2}</div>
                                <div className="text-[11px] text-slate-500">{m.court} • {m.date}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-slate-800">{m.status === 'finalizado' ? m.score : 'Programado'}</div>
                                {m.winner && <div className="text-[11px] text-slate-500">Ganador: {m.winner}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {subView === 'rules' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedLeague.internalRules || 'Esta liga no tiene reglamento interno cargado.'}
                  </div>
                  <RulesDocumentLink document={selectedLeague.internalRulesDocument} />
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Seleccioná una liga para ver las posiciones y los partidos.
            </div>
          )}
        </div>
      </div>

      {/* Pago del arancel */}
      <PaymentFlowModal
        isOpen={!!payment}
        onClose={handlePaymentClosed}
        title="Pago de inscripción a la liga"
        concept={`Inscripción Liga - ${payment?.target?.name || ''}`}
        summary={payment ? `${payment.target.category} • ${payment.target.modality}${payment.participantData?.partnerName ? ` • Pareja: ${payment.participantData.partnerName}` : ''}` : ''}
        amount={Number(payment?.target?.registrationFee) || 0}
        items={payment ? [{ description: `Arancel de inscripción - ${payment.target.name}`, amount: Number(payment.target.registrationFee) || 0 }] : []}
        client={{ name: user?.name, dni: user?.dni }}
        relatedId={payment?.target?.id}
        kind="inscripcion-liga"
        onPaid={enrollAfterPayment}
      />

      {/* Inscripción */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title={`Inscripción: ${selectedLeague?.name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEnroll} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-800">{selectedLeague?.modality} • {selectedLeague?.category}</div>
            <div className="text-slate-500 mt-1">
              Arancel: <strong className="text-slate-900">${selectedLeague?.registrationFee?.toLocaleString('es-AR')}</strong>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">Nombre y apellido</label>
            <input
              type="text"
              required
              value={enrollForm.name}
              onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 uppercase block mb-1">DNI</label>
            <input
              type="text"
              required
              value={enrollForm.dni}
              onChange={(e) => setEnrollForm({ ...enrollForm, dni: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          {selectedLeague?.modality === 'Pareja' && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <label className="font-semibold text-slate-700 uppercase block">Datos de tu pareja</label>
              <input
                type="text"
                required
                placeholder="Nombre y apellido"
                value={enrollForm.partnerName}
                onChange={(e) => setEnrollForm({ ...enrollForm, partnerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
              <input
                type="text"
                required
                placeholder="DNI"
                value={enrollForm.partnerDni}
                onChange={(e) => setEnrollForm({ ...enrollForm, partnerDni: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          )}

          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-200">
            La inscripción queda confirmada al acreditarse el pago del arancel.
          </div>

          <button
            type="submit"
            disabled={!!payment}
            className="w-full py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-semibold text-xs shadow-sm"
          >
            Continuar al pago
          </button>
        </form>
      </Modal>
    </div>
  );
}
