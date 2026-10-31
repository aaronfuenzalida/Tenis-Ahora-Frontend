// Recibo digital en PDF (TC_005): número de recibo, datos del cobro y desglose de importes.
// jsPDF se carga recién al generar el archivo, así no pesa en la carga inicial de la app.

const money = (n) => {
  const value = Number(n) || 0;
  return `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('es-AR')}`;
};

export function paymentMethodLabel(receipt) {
  if (!receipt?.cardLast4) return receipt?.paymentMethod || '';
  return `${receipt.paymentMethod} (${receipt.cardBrand} terminada en ${receipt.cardLast4})`;
}

export async function downloadReceiptPdf(receipt) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const left = 20;
  const right = 190;
  let y = 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Club Tenis Ahora', 105, y, { align: 'center' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Asociación Civil Deportiva - CUIT 30-71889922-4', 105, y, { align: 'center' });
  y += 4.5;
  doc.text('Av. San Martín 1420, Quilmes, Buenos Aires - Tel. +54 11 4892-1234', 105, y, { align: 'center' });
  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Recibo oficial de pago N° ${receipt.id}`, 105, y, { align: 'center' });
  y += 4;
  doc.setLineWidth(0.4);
  doc.line(left, y, right, y);
  y += 8;

  const rows = [
    ['Cliente / socio titular', receipt.clientName],
    ['DNI', receipt.clientDni],
    ['Fecha y hora de emisión', receipt.date],
    ['Medio de pago', paymentMethodLabel(receipt)],
    receipt.transactionId && ['Operación', receipt.transactionId],
    receipt.reservationId && ['Reserva', receipt.reservationId],
    ['Concepto', receipt.concept]
  ].filter(Boolean);
  doc.setFontSize(10);
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, left, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(String(value ?? ''), right - 75);
    doc.text(lines, 75, y);
    y += 6 * lines.length;
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle', left, y);
  doc.text('Importe (ARS)', right, y, { align: 'right' });
  y += 2;
  doc.setLineWidth(0.2);
  doc.line(left, y, right, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  for (const item of receipt.items || []) {
    const lines = doc.splitTextToSize(String(item.description ?? ''), 130);
    doc.text(lines, left, y);
    doc.text(Number(item.amount) === 0 ? 'Incluido' : money(item.amount), right, y, { align: 'right' });
    y += 5.5 * lines.length + 1;
  }
  doc.line(left, y - 2, right, y - 2);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total percibido en esta operación', left, y);
  doc.text(`${money(receipt.totalPaid)} ARS`, right, y, { align: 'right' });
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Operador / cajero: ${receipt.cashierName || 'Recepción general'}`, left, y);

  doc.save(`recibo-${receipt.id}.pdf`);
}
