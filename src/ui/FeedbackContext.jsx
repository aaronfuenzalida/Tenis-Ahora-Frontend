import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from './Modal';

/**
 * Reemplazo de window.alert / window.confirm por modales propios.
 *
 *   const { notify, confirm } = useFeedback();
 *   notify('Reserva guardada.');                       // aviso simple
 *   notify({ title: 'Error', message: '...', variant: 'error' });
 *   if (await confirm('¿Eliminar el registro?')) { ... }
 */
const FeedbackContext = createContext(null);

const VARIANTS = {
  info: { title: 'Aviso' },
  success: { title: 'Operación exitosa' },
  warning: { title: 'Atención' },
  error: { title: 'No se pudo completar' }
};

export function FeedbackProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const close = useCallback((result) => {
    setDialog(null);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const notify = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : options || {};
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        kind: 'notify',
        variant: opts.variant || 'info',
        title: opts.title,
        message: opts.message,
        okLabel: opts.okLabel || 'Entendido'
      });
    });
  }, []);

  const confirm = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : options || {};
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        kind: 'confirm',
        variant: opts.variant || 'warning',
        title: opts.title || 'Confirmar operación',
        message: opts.message,
        confirmLabel: opts.confirmLabel || 'Confirmar',
        cancelLabel: opts.cancelLabel || 'Volver',
        danger: !!opts.danger
      });
    });
  }, []);

  const variant = dialog ? VARIANTS[dialog.variant] || VARIANTS.info : VARIANTS.info;

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}

      <Modal
        isOpen={!!dialog}
        onClose={() => close(dialog?.kind === 'confirm' ? false : undefined)}
        title={dialog?.title || variant.title}
        maxWidth="max-w-md"
      >
        {dialog && (
          <div className="space-y-5">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {dialog.message}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {dialog.kind === 'confirm' && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {dialog.cancelLabel}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => close(dialog.kind === 'confirm' ? true : undefined)}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-colors ${
                  dialog.kind === 'confirm' && dialog.danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-tennis-600 hover:bg-tennis-700'
                }`}
              >
                {dialog.kind === 'confirm' ? dialog.confirmLabel : dialog.okLabel}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return ctx;
}
