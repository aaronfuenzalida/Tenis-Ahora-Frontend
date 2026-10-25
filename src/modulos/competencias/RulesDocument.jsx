import React from 'react';
import { documentsService } from '../../api';
import { useFeedback } from '../../ui/FeedbackContext';

/**
 * RF041 / RF048: documento del reglamento interno de cada torneo o liga.
 */
export function RulesDocumentLink({ document }) {
  const { notify } = useFeedback();
  if (!document) return null;
  return (
    <button
      type="button"
      onClick={() => documentsService.download(document).catch(err => notify({ variant: 'error', message: err.message || 'No se pudo descargar el documento.' }))}
      className="text-xs font-semibold text-tennis-800 hover:underline text-left"
    >
      Descargar reglamento: {document.name}
    </button>
  );
}

export function RulesDocumentInput({ current, onFileChange, removed = false, onToggleRemove }) {
  return (
    <div className="space-y-1.5">
      <label className="font-semibold text-slate-700 uppercase block">Documento del Reglamento (PDF, JPG o PNG, máx. 5 MB)</label>
      {current && (
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
          <span className={removed ? 'line-through text-slate-400' : ''}>Actual: {current.name}</span>
          {onToggleRemove && (
            <button type="button" onClick={onToggleRemove} className="font-semibold text-slate-700 hover:text-slate-900">
              {removed ? 'Conservar' : 'Quitar'}
            </button>
          )}
        </div>
      )}
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        className="w-full text-xs"
      />
    </div>
  );
}
