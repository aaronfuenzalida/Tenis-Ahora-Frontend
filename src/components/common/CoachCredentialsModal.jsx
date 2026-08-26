import React from 'react';
import { Award, CheckCircle2, FileText, Calendar, Building, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import Modal from './Modal';

export default function CoachCredentialsModal({ isOpen, onClose, coach }) {
  if (!coach) return null;

  const license = coach.licenseDetails;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Título Habilitante y Certificación Oficial" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Coach Header */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <img
            src={coach.photo}
            alt={coach.name}
            className="w-16 h-16 rounded-xl object-cover border-2 border-tennis-500 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base text-slate-900">{coach.name}</h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> Habilitado
              </span>
            </div>
            <p className="text-xs text-slate-500">{coach.specialty}</p>
            <p className="text-xs text-slate-400">DNI: {coach.dni} | {coach.experienceYears} años de trayectoria</p>
          </div>
        </div>

        {/* Certificate Card */}
        <div className="border-2 border-emerald-500/40 rounded-2xl p-5 bg-gradient-to-br from-emerald-50/50 via-white to-tennis-50/30 relative overflow-hidden shadow-sm">
          <div className="absolute top-2 right-2 text-tennis-200 opacity-20">
            <Award className="w-28 h-28" />
          </div>

          <div className="flex items-center gap-2 text-tennis-800 font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-tennis-600" />
            Certificado Registrado y Verificado por el Club
          </div>

          <h3 className="text-base font-extrabold text-slate-900 leading-tight">
            {license?.titleName || 'Profesor Nacional de Tenis'}
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Institución Emisora:
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{license?.institution}</span>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> N° de Matrícula / Registro:
              </span>
              <span className="font-bold text-tennis-700 mt-0.5 block">{license?.licenseNumber}</span>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Fecha de Emisión:
              </span>
              <span className="font-semibold text-slate-700 mt-0.5 block">{license?.issueDate}</span>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vigencia Habilitación:
              </span>
              <span className="font-bold text-emerald-700 mt-0.5 block">{license?.expiryDate}</span>
            </div>
          </div>

          {/* Digital File Attachment */}
          <div className="mt-4 flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-xs font-semibold text-slate-800">{license?.digitalDocumentUrl}</div>
                <div className="text-[10px] text-slate-400">Documento PDF digitalizado firmado</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert(`Descargando copia legalizada de: ${license?.digitalDocumentUrl}`)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Ver PDF
            </button>
          </div>
        </div>

        {/* Requirements footer */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Validación Reglamentaria:</strong> Conforme al reglamento del Club Tenis Ahora y la AAT, ningún instructor puede dictar clases grupales ni particulares sin la validación previa de su título habilitante.
          </span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </Modal>
  );
}
