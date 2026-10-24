import React, { useState, useEffect } from 'react';
import { tournamentsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import Modal from '../../components/common/Modal';
import { RulesDocumentLink } from '../../components/common/RulesDocument';
import TournamentBracketTree from '../../components/common/TournamentBracketTree';
import PaymentFlowModal from '../../components/common/PaymentFlowModal';
import { isEnrolledByDni } from '../../utils/formatters';

export default function ClientTournamentsPage() {
  const { user } = useAuth();
  const { notify } = useFeedback();

  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [subView, setSubView] = useState('bracket'); // 'bracket' | 'rules'

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerDni, setPartnerDni] = useState('');
  // Pago de la inscripción: { target, participantData }
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async (keepId) => {
    const res = await tournamentsService.getAll();
    setTournaments(res.data);
    setSelectedTournament(res.data.find(t => t.id === keepId) || res.data[0] || null);
  };

  const alreadyEnrolled = (trn) => isEnrolledByDni(trn?.participants, user?.dni);
  const isFull = (trn) => (trn?.participants?.length || trn?.currentEnrolled || 0) >= (Number(trn?.maxParticipants) || Infinity);

  const openEnroll = (trn) => {
    setSelectedTournament(trn);
    if (alreadyEnrolled(trn)) {
      notify({ variant: 'warning', message: `Ya estás inscripto en "${trn.name}".` });
      return;
    }
    if (isFull(trn)) {
      notify({ variant: 'warning', message: `"${trn.name}" no tiene cupos disponibles.` });
      return;
    }
    setShowEnrollModal(true);
  };

  // La inscripción se concreta al acreditarse el pago del arancel.
  const handleEnroll = (e) => {
    e.preventDefault();
    if (alreadyEnrolled(selectedTournament)) {
      setShowEnrollModal(false);
      notify({ variant: 'warning', message: `Ya estás inscripto en "${selectedTournament.name}".` });
      return;
    }
    if (partnerDni && user?.dni && partnerDni.replace(/\D/g, '') === String(user.dni).replace(/\D/g, '')) {
      notify({ variant: 'warning', message: 'El DNI de tu pareja no puede ser el tuyo.' });
      return;
    }
    setShowEnrollModal(false);
    setPayment({
      target: selectedTournament,
      participantData: { name: user?.name, dni: user?.dni, phone: user?.phone, partnerName, partnerDni }
    });
  };

  const enrollAfterPayment = async () => {
    if (!payment) return null;
    await tournamentsService.enroll(payment.target.id, payment.participantData);
    return { relatedId: payment.target.id };
  };

  const handlePaymentClosed = async (receipt) => {
    const paid = payment;
    setPayment(null);
    if (!receipt || !paid) return;
    setPartnerName('');
    setPartnerDni('');
    await load(paid.target.id);
    notify({ variant: 'success', title: 'Inscripción confirmada', message: `Quedaste inscripto en "${paid.target.name}". El recibo ${receipt.id} ya figura en Mis Pagos y Recibos.` });
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Torneos</h1>
      </div>

      {/* Lista de torneos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tournaments.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3 p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">No hay torneos con inscripción abierta.</div>
          )}
          {tournaments.map(trn => {
            const isSelected = selectedTournament?.id === trn.id;
            return (
              <div
                key={trn.id}
                onClick={() => setSelectedTournament(trn)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-white border-tennis-600 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="font-semibold text-slate-800">{trn.category} • {trn.modality}</span>
                  <span className="text-slate-500">{trn.surfaceRequired}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{trn.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{trn.description}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Inscripción: <strong className="text-slate-900">${trn.registrationFee?.toLocaleString('es-AR')}</strong></span>
                  <span>Cupos: <strong className="text-tennis-700">{trn.currentEnrolled || 0} / {trn.maxParticipants}</strong></span>
                </div>
                <div className="mt-3 pt-2">
                  {alreadyEnrolled(trn) ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-tennis-50 text-tennis-800 font-semibold text-xs text-center border border-tennis-200">
                      Ya estás inscripto
                    </div>
                  ) : isFull(trn) ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs text-center border border-slate-200">
                      Sin cupos
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEnroll(trn); }}
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

      {/* Detalle: cuadro y reglamento */}
      <div>
          {selectedTournament ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedTournament.name}</h2>
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedTournament.category} • {selectedTournament.modality} • {selectedTournament.surfaceRequired}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {[['bracket', 'Cuadro'], ['rules', 'Reglamento']].map(([id, label]) => (
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

              {subView === 'bracket' && (
                <TournamentBracketTree tournament={selectedTournament} isAdmin={false} />
              )}

              {subView === 'rules' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedTournament.internalRules || 'Este torneo no tiene reglamento interno cargado.'}
                  </div>
                  <RulesDocumentLink document={selectedTournament.internalRulesDocument} />
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Seleccioná un torneo para ver el cuadro.
            </div>
          )}
      </div>

      {/* Pago del arancel */}
      <PaymentFlowModal
        isOpen={!!payment}
        onClose={handlePaymentClosed}
        title="Pago de inscripción al torneo"
        concept={`Inscripción Torneo - ${payment?.target?.name || ''}`}
        summary={payment ? `${payment.target.category} • ${payment.target.modality}${payment.participantData?.partnerName ? ` • Pareja: ${payment.participantData.partnerName}` : ''}` : ''}
        amount={Number(payment?.target?.registrationFee) || 0}
        items={payment ? [{ description: `Arancel de inscripción - ${payment.target.name}`, amount: Number(payment.target.registrationFee) || 0 }] : []}
        client={{ name: user?.name, dni: user?.dni }}
        relatedId={payment?.target?.id}
        kind="inscripcion-torneo"
        onPaid={enrollAfterPayment}
      />

      {/* Inscripción */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title={`Inscripción: ${selectedTournament?.name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEnroll} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-800">{selectedTournament?.modality} • {selectedTournament?.category}</div>
            <div className="text-slate-500 mt-1">
              Arancel: <strong className="text-slate-900">${selectedTournament?.registrationFee?.toLocaleString('es-AR')}</strong>
            </div>
          </div>

          {selectedTournament?.modality === 'Pareja' && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <label className="font-semibold text-slate-700 uppercase block">Datos de tu pareja</label>
              <input
                type="text"
                required
                placeholder="Nombre y apellido"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
              <input
                type="text"
                required
                placeholder="DNI"
                value={partnerDni}
                onChange={(e) => setPartnerDni(e.target.value)}
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
