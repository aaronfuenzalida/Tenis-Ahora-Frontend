import React from 'react';
import Modal from './Modal';
import Avatar from './Avatar';
import { documentsService } from '../../services/api';
import { useFeedback } from '../../context/FeedbackContext';

export default function CoachCredentialsModal({ isOpen, onClose, coach }) {
  const { notify } = useFeedback();
  if (!coach) return null;

  const license = coach.licenseDetails;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Título Habilitante y Certificación Oficial" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Coach Header */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <Avatar user={{ name: coach.name }} size="w-14 h-14" rounded="rounded-xl" textClass="text-lg" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base text-slate-900">{coach.name}</h4>
              <span className="text-xs font-semibold text-tennis-700 flex items-center gap-1">
                Habilitado
              </span>
            </div>
            <p className="text-xs text-slate-500">{coach.type || 'Profesor'}</p>
            <p className="text-xs text-slate-400">DNI: {coach.dni}</p>
          </div>
        </div>

        {/* Certificate Card */}
        <div className="border-2 border-tennis-500/40 rounded-2xl p-5 bg-white relative overflow-hidden shadow-sm">

          <div className="flex items-center gap-2 text-tennis-800 font-bold text-xs uppercase tracking-wider mb-2">
            Certificado Registrado y Verificado por el Club
          </div>

          <h3 className="text-base font-extrabold text-slate-900 leading-tight">
            {license?.titleName || 'Profesor Nacional de Tenis'}
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium flex items-center gap-1">
                Institución Emisora:
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{license?.institution}</span>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium flex items-center gap-1">
                N° de Matrícula / Registro:
              </span>
              <span className="font-bold text-tennis-700 mt-0.5 block">{license?.licenseNumber}</span>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium flex items-center gap-1">
                Fecha de Emisión:
              </span>
              <span className="font-semibold text-slate-700 mt-0.5 block">{license?.issueDate}</span>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium flex items-center gap-1">
                Vigencia Habilitación:
              </span>
              <span className="font-bold text-tennis-700 mt-0.5 block">{license?.expiryDate}</span>
            </div>
          </div>

          {/* Digital File Attachment */}
          <div className="mt-4 flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div>
                <div className="text-xs font-semibold text-slate-800">{license?.document?.name || 'Sin documento adjunto'}</div>
                <div className="text-[10px] text-slate-400">Título habilitante digitalizado</div>
              </div>
            </div>
            <button
              type="button"
              disabled={!license?.document}
              onClick={() => documentsService.download(license.document).catch(err => notify({ variant: 'error', message: err.message || 'No se pudo descargar el documento.' }))}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed no-print"
            >
              Descargar
            </button>
          </div>
        </div>

        {/* Requirements footer */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 flex items-start gap-2">
          <span>
            <strong>Validación Reglamentaria:</strong> Conforme al reglamento del Club Tenis Ahora y la AAT, ningún instructor puede dictar clases grupales ni particulares sin la validación previa de su título habilitante.
          </span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            Imprimir Ficha Oficial
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </Modal>
  );
}
