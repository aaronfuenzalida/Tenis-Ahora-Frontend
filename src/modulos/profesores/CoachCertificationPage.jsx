import React, { useState, useEffect } from 'react';
import { coachesAndClassesService, documentsService } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../ui/FeedbackContext';

export default function CoachCertificationPage() {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [coachProfile, setCoachProfile] = useState(null);

  useEffect(() => {
    coachesAndClassesService.getCoaches().then(cRes => {
      setCoachProfile(cRes.data.find(c => c.id === user?.coachId) || null);
    });
  }, [user]);

  const license = coachProfile?.licenseDetails;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certificación</h1>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto"
        >
          Imprimir Ficha Oficial
        </button>
      </div>

      {/* Ficha: lo único que sale impreso */}
      <div id="printable-area" className="max-w-2xl bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Certificación Oficial y Título Habilitante</h2>
            <p className="text-xs text-slate-500 mt-0.5">{coachProfile?.name} • DNI {coachProfile?.dni}</p>
          </div>
          <span className="text-xs font-semibold text-tennis-700">Habilitado</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Denominación Oficial:</span>
          <div className="font-bold text-sm text-slate-900 mt-0.5">
            {license?.titleName || 'Profesor Nacional de Tenis'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Entidad Emisora:</span>
            <strong className="text-slate-800 block mt-0.5">{license?.institution}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">N° de Matrícula:</span>
            <strong className="text-tennis-700 block mt-0.5">{license?.licenseNumber}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Emisión:</span>
            <strong className="text-slate-800 block mt-0.5">{license?.issueDate}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Vencimiento Vigencia:</span>
            <strong className="text-slate-800 block mt-0.5">{license?.expiryDate}</strong>
          </div>
        </div>

        {/* Título digitalizado */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-800 block">{license?.document?.name || 'Sin documento adjunto'}</span>
            <span className="text-[11px] text-slate-500">Título habilitante digitalizado</span>
          </div>
          <button
            type="button"
            disabled={!license?.document}
            onClick={() => documentsService.download(license.document).catch(err => notify({ variant: 'error', message: err.message || 'No se pudo descargar el documento.' }))}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed no-print"
          >
            Descargar
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
          Este certificado avala la habilitación oficial para dictar clases grupales de escuela y entrenamientos de competición en las canchas del club.
        </div>
      </div>

    </div>
  );
}
