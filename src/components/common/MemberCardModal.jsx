import React from 'react';
import { Printer, ShieldCheck, QrCode, CheckCircle2, Award, Sparkles, X } from 'lucide-react';
import Modal from './Modal';
import Logo from './Logo';

export default function MemberCardModal({ isOpen, onClose, member }) {
  if (!member) return null;

  const handlePrint = () => {
    window.print();
  };

  const memberNumber = member.memberNumber || `TA-${String(member.id).replace(/\D/g, '').padStart(4, '0') || '8840'}`;
  const memberSince = member.memberSince || '2024-03-01';
  const roleLabel = member.role === 'admin' ? 'Comisión Directiva / Admin' : 'Socio Pleno';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Carnet Oficial de Socio" maxWidth="max-w-2xl">
      <div className="space-y-6">
        
        {/* Instruction Banner (Hidden on Print) */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Credencial lista para imprimir y plastificar en tamaño tarjeta estándar (85mm × 54mm).</span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Carnet
          </button>
        </div>

        {/* Printable Area: Front and Back of the Card */}
        <div id="printable-card-area" className="flex flex-col items-center gap-6 py-2">
          
          <div className="text-center no-print">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vista Previa de Impresión (Frente y Dorso)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl mx-auto print:max-w-none print:w-full print:grid-cols-2 print:gap-4">
            
            {/* FRONT OF THE CARD */}
            <div className="relative aspect-[1.586/1] w-full rounded-2xl overflow-hidden shadow-xl border border-slate-700/30 bg-gradient-to-br from-slate-900 via-tennis-900 to-tennis-950 text-white p-4 flex flex-col justify-between select-none print:shadow-none print:border-slate-800">
              {/* Subtle background tennis pattern */}
              <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full border-4 border-white/5 pointer-events-none" />
              <div className="absolute right-6 -bottom-16 w-36 h-36 rounded-full border-4 border-tennis-400/10 pointer-events-none" />
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-tennis-500 via-emerald-400 to-amber-400" />

              {/* Card Header */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-tennis-500/20 border border-tennis-400/40 flex items-center justify-center text-tennis-400 font-black text-sm">
                    TA
                  </div>
                  <div>
                    <div className="text-xs font-black tracking-wider uppercase text-white leading-none">Club Tenis Ahora</div>
                    <div className="text-[9px] text-emerald-300 font-medium">Asociación Civil Deportiva</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-tennis-500/30 text-tennis-200 border border-tennis-400/30">
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Card Body: Photo & Info */}
              <div className="flex items-center gap-3.5 my-auto z-10 pt-1">
                {/* Photo / Avatar */}
                <div className="w-16 h-16 rounded-xl border-2 border-tennis-400/60 overflow-hidden shadow-md shrink-0 bg-slate-800 flex items-center justify-center">
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}&backgroundColor=0f291e&textColor=ffffff`}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-sm text-white tracking-wide truncate">{member.name}</h3>
                  <div className="text-[11px] text-tennis-200 font-mono mt-0.5">DNI: <strong className="text-white font-bold">{member.dni}</strong></div>
                  <div className="text-[10px] text-slate-300 truncate mt-0.5">N° Socio: <strong className="text-amber-300 font-mono">{memberNumber}</strong></div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Alta: {memberSince}</div>
                </div>

                {/* QR Code */}
                <div className="w-12 h-12 bg-white p-1 rounded-lg shrink-0 shadow-md flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                    <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM55 10h10v15H55zM40 40h20v20H40zM70 40h10v20H70zM85 45h15v15H85zM40 70h15v15H40zM60 70h15v30H60zM80 80h20v20H80z" />
                  </svg>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-[8px] text-tennis-300/80 pt-1 border-t border-white/10 z-10">
                <span>Válido para reservas y torneos oficiales</span>
                <span className="font-mono">AFIP/AAT OK</span>
              </div>
            </div>

            {/* BACK OF THE CARD */}
            <div className="relative aspect-[1.586/1] w-full rounded-2xl overflow-hidden shadow-xl border border-slate-700/30 bg-slate-900 text-white p-4 flex flex-col justify-between select-none print:shadow-none print:border-slate-800">
              <div className="absolute top-0 right-0 left-0 h-6 bg-slate-950 flex items-center px-4">
                <span className="text-[8px] text-slate-500 font-mono tracking-widest">MAGNETIC STRIPE // CLUB TENIS AHORA</span>
              </div>

              <div className="pt-6 space-y-2 text-[9px] text-slate-300">
                <p className="leading-tight">
                  <strong className="text-white">Reglamento:</strong> Esta credencial es personal e intransferible. Acredita condición de socio para alquiler de canchas, escuela de tenis y torneos.
                </p>
                <div className="p-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-[8px] text-slate-300 space-y-0.5">
                  <div><strong>Domicilio:</strong> {member.address || 'Av. San Martín 1420, Quilmes'}</div>
                  <div><strong>Teléfono:</strong> {member.phone || '+54 11 4892-1234'}</div>
                  <div><strong>Email:</strong> {member.email}</div>
                </div>
              </div>

              {/* Signature area & CUIT */}
              <div className="flex items-end justify-between pt-2 border-t border-slate-800">
                <div>
                  <div className="text-[7px] text-slate-500">CUIT 30-71889922-4</div>
                  <div className="text-[7px] text-slate-500">Personería Jurídica N° 9812/2020</div>
                </div>
                <div className="text-center">
                  <div className="w-28 border-b border-dashed border-slate-500 mb-0.5 h-4 flex items-end justify-center">
                    <span className="text-[8px] italic text-tennis-300 font-serif">{member.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-[7px] text-slate-400 block uppercase">Firma del Titular</span>
                </div>
              </div>
            </div>

          </div>

          {/* Cutting Guides note for printing */}
          <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5 print:mt-4">
            <span className="border-t border-dashed border-slate-300 w-12" />
            <span>Líneas de recorte para plastificado y credencial física</span>
            <span className="border-t border-dashed border-slate-300 w-12" />
          </div>

        </div>

        {/* Modal Actions (No Print) */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-glow-green transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Credencial
          </button>
        </div>

      </div>
    </Modal>
  );
}
