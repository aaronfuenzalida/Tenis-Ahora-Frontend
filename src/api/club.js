// Valores fijos del club que usan las pantallas, la demo y la API real.

// RD02-RD05: plazos de reserva y cancelación fijados por el club (los mismos que usa la API).
export const DEFAULT_CLUB_CONFIG = {
  freeCancellationHours: 6,
  lateCancellationRetentionPercent: 50,
  maxAdvanceBookingDays: 30,
  privateLessonHourlyRate: 6000
};

// Último día reservable (AAAA-MM-DD en hora local) según la antelación máxima del club.
export function maxBookingDate(maxAdvanceBookingDays) {
  const limit = new Date();
  limit.setDate(limit.getDate() + Number(maxAdvanceBookingDays));
  return `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, '0')}-${String(limit.getDate()).padStart(2, '0')}`;
}

export const DEFAULT_COURT_AVAILABILITY = {
  days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  openTime: '08:00',
  closeTime: '22:00',
  slotMinutes: 60,
  blockedRanges: [],
  notes: ''
};
