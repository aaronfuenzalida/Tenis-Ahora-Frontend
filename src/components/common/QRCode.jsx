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

/** Texto codificado en el QR de cobro con billetera virtual (RF130). */
export const qrPayloads = {
  payment: ({ concept, amount, reference }) =>
    `https://tenisahora.app/pagar?ref=${encodeURIComponent(reference || `TA-${Date.now()}`)}&monto=${Number(amount) || 0}&concepto=${encodeURIComponent(concept || 'Pago Club Tenis Ahora')}`
};
