import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Código QR real (escaneable) para carnets, recibos y cobros.
 * `value` es el texto codificado; `size` el lado en px. Se adapta al contenedor con `className`.
 */
export default function QRCode({ value, size = 128, className = '', level = 'M', fg = '#0f172a', bg = '#ffffff' }) {
  const text = String(value || 'https://tenisahora.app');
  return (
    <QRCodeSVG
      value={text}
      size={size}
      level={level}
      fgColor={fg}
      bgColor={bg}
      marginSize={1}
      className={className}
      style={{ width: '100%', height: '100%' }}
      title={text}
    />
  );
}

/** Textos codificados en los QR de la app (una sola fuente para que el formato sea consistente). */
export const qrPayloads = {
  member: (member) =>
    `https://tenisahora.app/socios/${encodeURIComponent(member?.memberNumber || member?.id || 'socio')}?dni=${encodeURIComponent(member?.dni || '')}`,
  receipt: (receipt) =>
    receipt?.qrData ||
    `https://tenisahora.app/recibos/${encodeURIComponent(receipt?.id || '')}?monto=${receipt?.totalPaid ?? 0}`,
  payment: ({ concept, amount, reference }) =>
    `https://tenisahora.app/pagar?ref=${encodeURIComponent(reference || `TA-${Date.now()}`)}&monto=${Number(amount) || 0}&concepto=${encodeURIComponent(concept || 'Pago Club Tenis Ahora')}`
};
