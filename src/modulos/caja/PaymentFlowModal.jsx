import React, { useEffect, useState } from 'react';
import Modal from '../../ui/Modal';
import ReceiptModal from './ReceiptModal';
import PaymentForm from './PaymentForm';
import { receiptsService } from '../../api';

export { PAYMENT_METHODS } from './PaymentForm';

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function newReceiptId() {
  return `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Arma el recibo oficial de un pago hecho desde el portal (inscripciones, clases, turnos).
 * El medio de pago y la transacción los completa el backend con los datos del pago aprobado.
 */
export function buildReceipt({ concept, items, amount, transaction, client, relatedId, kind, cashierName }) {
  const id = newReceiptId();
  return {
    id,
    reservationId: null,
    relatedId: relatedId || null,
    kind: kind || 'inscripcion',
    clientName: client?.name || 'Socio',
    clientDni: client?.dni || '',
    concept,
    items: items && items.length ? items : [{ description: concept, amount }],
    totalPaid: amount,
    paymentMethod: transaction.paymentMethod,
    transactionId: transaction.id,
    status: 'completado',
    date: nowStamp(),
    cashierName: cashierName || 'Portal del socio'
  };
}

/**
 * Flujo de pago: 1) pagar con tarjeta o QR (PaymentForm)  2) comprobante emitido.
 *
 * Sin `settle`, sirve para inscripciones a torneos, ligas, clases, turnos y cobros en mostrador:
 * `onPaid(paymentMethod, transaction)` se ejecuta con el pago aprobado, antes de emitir el recibo (ahí
 * el padre hace la inscripción); si lanza un error, no se emite recibo y se muestra el mensaje.
 * Con `settle(transaction)`, el padre registra el cobro (por ejemplo la seña de una reserva) y
 * devuelve el recibo que emitió el backend.
 * `onCompleted(receipt)` se llama cuando el recibo quedó registrado.
 */
export default function PaymentFlowModal({
  isOpen,
  onClose,
  title = 'Pago de inscripción',
  concept,
  items,
  amount,
  client,
  relatedId,
  kind,
  summary,
  cashierName,
  onPaid,
  settle,
  onCompleted
}) {
  const [receipt, setReceipt] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReceipt(null);
      setShowReceipt(false);
      setProcessing(false);
    }
  }, [isOpen]);

  // Si falla, el error sube a PaymentForm, que lo muestra y permite volver a pagar.
  const handleApproved = async (transaction) => {
    let rec;
    if (settle) {
      rec = await settle(transaction);
    } else {
      const extra = await onPaid?.(transaction.paymentMethod, transaction);
      const draft = buildReceipt({
        concept,
        items,
        amount,
        transaction,
        client,
        relatedId: extra?.relatedId || relatedId,
        kind,
        cashierName
      });
      const res = await receiptsService.create(draft);
      rec = res?.data || draft;
    }
    setReceipt(rec);
    onCompleted?.(rec);
  };

  // Mientras se procesa el pago no se cierra: el cobro ya está en curso.
  const handleClose = () => {
    if (processing) return;
    onClose(receipt);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="max-w-md">
        <div className="space-y-5 text-xs">
          {/* Resumen */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-800">{concept}</div>
            {summary && <div className="text-slate-500">{summary}</div>}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
              <span className="font-bold text-slate-600">Total a pagar:</span>
              <span className="text-lg font-extrabold text-tennis-700">${Number(amount || 0).toLocaleString('es-AR')} ARS</span>
            </div>
          </div>

          {!receipt && (
            <PaymentForm amount={amount} concept={concept} onApproved={handleApproved} onCancel={handleClose} onProcessingChange={setProcessing} />
          )}

          {receipt && (
            <div className="space-y-4 text-center">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Pago acreditado</h4>
                <p className="text-slate-600 mt-1">
                  Se emitió el recibo <strong className="font-mono">{receipt.id}</strong> (operación {receipt.transactionId}).{' '}
                  {kind === 'mostrador'
                    ? <>Quedó registrado en <strong>Recibos y Cobros</strong>.</>
                    : <>Lo vas a encontrar en <strong>Mis Pagos y Recibos</strong>.</>}
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceipt(true)}
                  className="px-4 py-2 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-bold border border-tennis-200"
                >
                  Ver recibo
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm"
                >
                  Listo
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} receipt={receipt} />
    </>
  );
}
