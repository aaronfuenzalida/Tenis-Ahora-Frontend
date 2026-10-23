import React from 'react';

const isExpired = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T23:59:59`);
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
};

/**
 * RF119 / RF124: reporte imprimible de certificaciones deportivas de profesores y entrenadores.
 */
export default function CoachCertificationsReport({ coaches = [], roleFilter = 'ALL' }) {
  const list = coaches.filter(c => roleFilter === 'ALL' || c.type === roleFilter);
  const valid = list.filter(c => c.licenseDetails?.status === 'habilitado' && !isExpired(c.licenseDetails?.expiryDate)).length;

  return (
    <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">Reporte de Certificaciones Deportivas y Títulos Habilitantes</h2>
          <p className="text-xs text-slate-500">
            {roleFilter === 'ALL' ? 'Profesores y entrenadores' : `${roleFilter}es`} • Todos los docentes deben acreditar título habilitante y certificación vigente (RD08 / RD09).
          </p>
        </div>
        <div className="text-xs text-slate-600">
          <span className="font-bold text-tennis-700">{valid}</span> de <span className="font-bold">{list.length}</span> con certificación vigente
          <span className="block text-[10px] text-slate-400 print:block">Emitido: {new Date().toLocaleString('es-AR')}</span>
        </div>
      </div>

      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
          <tr>
            <th className="p-3">Docente</th>
            <th className="p-3">Rol</th>
            <th className="p-3">Título Habilitante</th>
            <th className="p-3">Institución Emisora</th>
            <th className="p-3">Matrícula</th>
            <th className="p-3">Emisión</th>
            <th className="p-3">Vencimiento</th>
            <th className="p-3 text-center">Estado</th>
            <th className="p-3">Documento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.length === 0 ? (
            <tr>
              <td colSpan={9} className="p-8 text-center text-slate-400">No hay docentes registrados.</td>
            </tr>
          ) : (
            list.map(c => {
              const lic = c.licenseDetails || {};
              const expired = isExpired(lic.expiryDate);
              const ok = lic.status === 'habilitado' && !expired;
              return (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-[11px] text-slate-500">DNI {c.dni} • {c.specialty}</div>
                  </td>
                  <td className="p-3 text-slate-700">{c.type || 'Profesor'}</td>
                  <td className="p-3 font-semibold text-slate-800">{lic.titleName || '-'}</td>
                  <td className="p-3 text-slate-600">{lic.institution || '-'}</td>
                  <td className="p-3 font-mono text-slate-800">{lic.licenseNumber || '-'}</td>
                  <td className="p-3 text-slate-600">{lic.issueDate || '-'}</td>
                  <td className={`p-3 ${expired ? 'text-slate-700 font-bold' : 'text-slate-600'}`}>{lic.expiryDate || '-'}</td>
                  <td className="p-3 text-center">
                    {ok ? (
                      <span className="text-[10px] font-bold text-tennis-800 inline-flex items-center gap-1">
                        Vigente
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-700 inline-flex items-center gap-1">
                        {expired ? 'Vencida' : 'No habilitado'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600">
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      {lic.digitalDocumentUrl || 'Sin documento adjunto'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
