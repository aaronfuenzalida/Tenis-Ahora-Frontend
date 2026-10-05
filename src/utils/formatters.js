/**
 * Input formatters, masks and business-rule validation helpers
 * Aligned with TP Integral Tenis Ahora rules
 */

/**
 * Format string as Argentinian DNI: XX.XXX.XXX or X.XXX.XXX
 */
export function formatDNI(val = '') {
  const digits = String(val).replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, digits.length - 3)}.${digits.slice(-3)}`;
  if (digits.length <= 8) {
    const last3 = digits.slice(-3);
    const mid3 = digits.slice(-6, -3);
    const first = digits.slice(0, -6);
    return `${first}.${mid3}.${last3}`;
  }
  return digits;
}

/**
 * Clean DNI to digits only
 */
export function cleanDNI(val = '') {
  return String(val).replace(/\D/g, '');
}

/**
 * Validate DNI length (7 or 8 digits)
 */
export function isValidDNI(val = '') {
  const cleaned = cleanDNI(val);
  return cleaned.length >= 7 && cleaned.length <= 8;
}

/**
 * Format phone number: +54 9 11 1234-5678 or local format
 */
export function formatPhone(val = '') {
  if (!val) return '';
  // If already starts with +, clean non-digits except +
  let cleaned = String(val).trim();
  if (!cleaned.startsWith('+')) {
    // If user enters 1148921234 or similar
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length === 10) {
      // e.g. 11 4892-1234
      return `+54 9 ${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
  }
  return cleaned;
}

/**
 * Validate email address
 */
export function isValidEmail(email = '') {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim().toLowerCase());
}

/**
 * Calculates hours until a given reservation (dateStr: 'YYYY-MM-DD', timeStr: 'HH:mm')
 * Returns positive number of hours in advance, or negative if already passed.
 */
export function calculateHoursUntil(dateStr, timeStr = '00:00') {
  if (!dateStr) return 0;
  // Handle start time if given as range '10:00 - 12:00'
  const startPart = timeStr.includes(' - ') ? timeStr.split(' - ')[0] : timeStr;
  const isoString = `${dateStr}T${startPart.trim()}:00`;
  const targetDate = new Date(isoString);
  const now = new Date();
  
  if (isNaN(targetDate.getTime())) return 0;
  
  const diffMs = targetDate.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Format hours to human readable string, e.g. "8 hs 30 min"
 */
export function formatHoursMinutes(hoursDecimal = 0) {
  if (hoursDecimal <= 0) return '0 min (turno ya iniciado o vencido)';
  const totalMinutes = Math.floor(hoursDecimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hs`;
  return `${hours} hs ${minutes} min`;
}
