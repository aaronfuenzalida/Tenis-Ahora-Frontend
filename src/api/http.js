// Capa HTTP: cliente axios y servicios que hablan con la API real en C# .NET 8 (TenisAhora.Api).
// Inyecta automáticamente el JWT de Supabase Auth como Authorization: Bearer <token>.
import axios from 'axios';
import { getStoredToken, getStoredRefreshToken } from '../auth/jwt';
import {
  isSupabaseAuthConfigured,
  signInWithSupabasePassword,
  signUpWithSupabase,
  refreshSupabaseSession
} from '../auth/supabaseClient';
import { checkFile, fileToBase64, saveBlob } from '../utils/files';

// Create base Axios instance pointing to TenisAhora.Api (.NET 8)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5090/api',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Axios Request Interceptor: Inyecta automáticamente Authorization: Bearer <Supabase_JWT>
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios Response Interceptor: Maneja refresh de sesión Supabase en 401 y normaliza errores del backend C#
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      getStoredRefreshToken()
    ) {
      originalRequest._retry = true;
      const newToken = await refreshSupabaseSession();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    const backendErrorMsg =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.response?.data?.title;

    if (backendErrorMsg) {
      error.message = backendErrorMsg;
    }

    return Promise.reject(error);
  }
);

/**
 * Traduce un error de axios o de Supabase Auth al mensaje que mostramos en pantalla.
 * El backend C# (.NET 8) responde { "error": "..." } o ProblemDetails.
 */
export function mensajeDeError(err, fallback = 'Ocurrió un error inesperado.') {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.response?.data?.detail) return err.response.data.detail;
  if (err?.response?.status === 401) return 'Credenciales inválidas o sesión expirada.';
  if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') {
    return 'No se pudo conectar con el servidor. Verificá que la API (.NET 8) esté levantada.';
  }
  if (err?.message && err.message !== 'Network Error') return err.message;
  return fallback;
}

// ---- Auth: soporta Supabase Auth directo (JWT Bearer) o fallback al endpoint del backend ----
export const authService = {
  async login(email, password) {
    if (isSupabaseAuthConfigured()) {
      return signInWithSupabasePassword(email, password);
    }
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async registrar({ nombre, apellido, direccion, email, numeroTelefono, dni, password }) {
    if (isSupabaseAuthConfigured()) {
      return signUpWithSupabase({
        nombre,
        apellido,
        direccion,
        email,
        numeroTelefono,
        dni,
        password
      });
    }
    const { data } = await api.post('/auth/registrar', {
      nombre,
      apellido,
      direccion,
      email,
      numeroTelefono,
      dni,
      password
    });
    return data;
  }
};

// ---- Servicios contra la API en C# (.NET 8) ----
const body = (request) => request.then(res => res.data);

/**
 * Normaliza la respuesta de creación de reserva desde ReservasController (.NET 8)
 * asegurando que `receipt` y `paymentPreference` expongan `qrData`, `paymentUrl` y `preferenceId`.
 */
function normalizeReservationCreateResponse(payload) {
  if (!payload) return payload;
  const pref = payload.paymentPreference || null;
  const receipt = payload.receipt
    ? {
        ...payload.receipt,
        qrData:
          payload.receipt.qrData ||
          pref?.qrData ||
          pref?.sandboxInitPoint ||
          pref?.initPoint ||
          '',
        paymentUrl:
          payload.receipt.paymentUrl ||
          pref?.sandboxInitPoint ||
          pref?.initPoint ||
          '',
        mpPreferenceId:
          payload.receipt.mpPreferenceId ||
          pref?.preferenceId ||
          null
      }
    : null;

  return {
    ...payload,
    receipt,
    paymentPreference: pref
      ? {
          ...pref,
          paymentUrl: pref.sandboxInitPoint || pref.initPoint || pref.qrData || ''
        }
      : receipt
      ? {
          preferenceId: receipt.mpPreferenceId || `MP-PREF-${receipt.id}`,
          initPoint: receipt.paymentUrl || receipt.qrData || '',
          sandboxInitPoint: receipt.paymentUrl || receipt.qrData || '',
          qrData: receipt.qrData || '',
          paymentUrl: receipt.paymentUrl || receipt.qrData || '',
          amount: receipt.totalPaid,
          status: 'created'
        }
      : null
  };
}

const crud = (path) => ({
  getAll: () => api.get(path),
  create: (data) => api.post(path, data),
  update: (id, data) => api.put(`${path}/${id}`, data),
  delete: (id) => body(api.delete(`${path}/${id}`))
});

export const courtsHttp = {
  ...crud('/canchas'),
  updateStatus: (courtId, status, maintenanceNotes = '') =>
    api.patch(`/canchas/${courtId}/estado`, { status, maintenanceNotes }),
  updateAvailability: (courtId, availability) =>
    api.put(`/canchas/${courtId}/disponibilidad`, availability)
};

export const courtTypesHttp = crud('/tipos-cancha');

export const stockHttp = {
  ...crud('/stock'),
  updateStock: (itemId, totalStock) => api.patch(`/stock/${itemId}/ajuste`, { totalStock })
};

export const reservationsHttp = {
  ...crud('/reservas'),
  getOccupancy: () => api.get('/reservas/ocupacion'),
  create: (bookingData) =>
    api.post('/reservas', bookingData).then((res) => normalizeReservationCreateResponse(res.data)),
  payRemainingBalance: (reservationId, paymentMethod = 'Mercado Pago (QR)') =>
    api.post(`/reservas/${reservationId}/pagar-saldo`, { paymentMethod }),
  cancel: (reservationId) => body(api.post(`/reservas/${reservationId}/cancelar`))
};

const competitionHttp = (path) => ({
  ...crud(path),
  updateInternalRules: (id, internalRules, internalRulesDocument) =>
    api.put(`${path}/${id}/reglamento`, { internalRules, internalRulesDocument }),
  enroll: (id, participantData) => body(api.post(`${path}/${id}/inscripciones`, participantData)),
  removeParticipant: (id, participantId) => body(api.delete(`${path}/${id}/inscripciones/${participantId}`)),
  addMatch: (id, round, matchData) => body(api.post(`${path}/${id}/enfrentamientos`, { ...matchData, round })),
  updateMatch: (id, matchId, updatedData) => body(api.put(`${path}/${id}/enfrentamientos/${matchId}`, updatedData))
});

export const tournamentsHttp = competitionHttp('/torneos');

export const competitionTypesHttp = crud('/tipos-competencia');

export const leaguesHttp = {
  ...competitionHttp('/ligas'),
  updateMatchScore: (leagueId, matchId, score, winner) =>
    body(api.post(`/ligas/${leagueId}/enfrentamientos/${matchId}/resultado`, { score, winner }))
};

const coaches = crud('/profesores');
const classes = crud('/clases');
const privateClasses = crud('/clases-particulares');

export const coachesAndClassesHttp = {
  getCoaches: coaches.getAll,
  createCoach: coaches.create,
  updateCoach: coaches.update,
  deleteCoach: coaches.delete,
  updateCoachAvailability: (coachId, availableHours) =>
    api.put(`/profesores/${coachId}/disponibilidad`, { availableHours }),
  updateCoachLicense: (coachId, licenseDetails) =>
    api.put(`/profesores/${coachId}/certificacion`, licenseDetails),

  getClasses: classes.getAll,
  addClass: classes.create,
  updateClass: classes.update,
  deleteClass: classes.delete,
  toggleStudentAttendance: (classId, studentId, sessionIndex) =>
    body(api.post(`/clases/${classId}/asistencia/alternar`, { studentId, sessionIndex })),
  enrollStudent: (classId, studentData) => body(api.post(`/clases/${classId}/alumnos`, studentData)),
  removeStudent: (classId, studentId) => body(api.delete(`/clases/${classId}/alumnos/${studentId}`)),
  recordAttendance: (classId, studentId, status) =>
    body(api.post(`/clases/${classId}/asistencia/registrar`, { studentId, status })),

  getPrivateClasses: privateClasses.getAll,
  createPrivateClass: privateClasses.create,
  updatePrivateClass: privateClasses.update,
  cancelPrivateClass: (id) => body(api.post(`/clases-particulares/${id}/cancelar`)),
  deletePrivateClass: privateClasses.delete
};

export const receiptsHttp = {
  getAll: () => api.get('/recibos'),
  getDiscounts: () => api.get('/descuentos'),
  create: (receiptData) => api.post('/recibos', receiptData)
};

export const discountsHttp = crud('/descuentos');

export const documentsHttp = {
  async upload(file) {
    checkFile(file);
    const data = await fileToBase64(file);
    return api.post('/documentos', { name: file.name, data });
  },
  async download(ref) {
    const res = await api.get(`/documentos/${ref.id}`, { responseType: 'blob' });
    saveBlob(res.data, ref.name);
  }
};

export const clubConfigHttp = {
  get: () => api.get('/configuracion')
};

export const invoicesHttp = {
  getAll: () => api.get('/facturas'),
  create: (invoiceData) => api.post('/facturas', invoiceData)
};

export const refundsHttp = {
  getAll: () => api.get('/reembolsos'),
  create: (refundData) => api.post('/reembolsos', refundData)
};

export const usersHttp = {
  ...crud('/usuarios'),
  getMembers: () => api.get('/socios'),
  updateDiscounts: (userId, activeDiscounts) => api.put(`/usuarios/${userId}/descuentos`, { activeDiscounts })
};

export default api;
