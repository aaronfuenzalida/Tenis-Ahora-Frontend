import axios from 'axios';
import { getStoredToken, getStoredUser } from '../utils/jwt';
import {
  INITIAL_COURTS,
  INITIAL_STOCK,
  INITIAL_RESERVATIONS,
  INITIAL_TOURNAMENTS,
  INITIAL_LEAGUES,
  INITIAL_COACHES,
  INITIAL_CLASSES,
  INITIAL_PRIVATE_CLASSES,
  INITIAL_DISCOUNTS,
  INITIAL_RECEIPTS,
  INITIAL_USERS,
  INITIAL_COURT_TYPES,
  INITIAL_COMPETITION_TYPES,
  INITIAL_INVOICES,
  INITIAL_REFUNDS
} from '../utils/mockData';

// Create base Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5090/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Axios Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios Response Interceptor: Handle auth expired errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized token.');
    }
    // Las pantallas muestran err.message (como con los errores del mock); usamos el del backend.
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }
    return Promise.reject(error);
  }
);

/**
 * Traduce un error de axios al mensaje que mostramos en pantalla.
 * El backend responde { "error": "..." } desde ManejoErroresMiddleware.
 */
export function mensajeDeError(err, fallback = 'Ocurrió un error inesperado.') {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.response?.status === 401) return 'Credenciales inválidas.';
  if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') {
    return 'No se pudo conectar con el servidor. Verificá que la API esté levantada.';
  }
  return fallback;
}

// ---- Auth: único módulo conectado al backend real (TenisAhora.API) ----
export const authService = {
  // POST /api/auth/login -> AuthResponseDto
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  // POST /api/auth/registrar -> AuthResponseDto
  async registrar({ nombre, apellido, direccion, email, numeroTelefono, password }) {
    const { data } = await api.post('/auth/registrar', {
      nombre,
      apellido,
      direccion,
      email,
      numeroTelefono,
      password
    });
    return data;
  }
};

// Local State Store for Mocking CRUD operations in memory
let courtsStore = [...INITIAL_COURTS];
let stockStore = [...INITIAL_STOCK];
let reservationsStore = [...INITIAL_RESERVATIONS];
let tournamentsStore = [...INITIAL_TOURNAMENTS];
let leaguesStore = [...INITIAL_LEAGUES];
let coachesStore = [...INITIAL_COACHES];
let classesStore = [...INITIAL_CLASSES];
let privateClassesStore = [...INITIAL_PRIVATE_CLASSES];
let discountsStore = [...INITIAL_DISCOUNTS];
let receiptsStore = [...INITIAL_RECEIPTS];
let usersStore = [...INITIAL_USERS];
let courtTypesStore = [...INITIAL_COURT_TYPES];
let competitionTypesStore = [...INITIAL_COMPETITION_TYPES];
let invoicesStore = [...INITIAL_INVOICES];
let refundsStore = [...INITIAL_REFUNDS];

const nowStamp = () => new Date().toISOString().replace('T', ' ').substring(0, 16);

export const DEFAULT_COURT_AVAILABILITY = {
  days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  openTime: '08:00',
  closeTime: '22:00',
  slotMinutes: 60,
  blockedRanges: [],
  notes: ''
};

// Simulated delay helper
const delay = (ms = 150) => new Promise(res => setTimeout(res, ms));

const courtsMock = {
  async getAll() {
    await delay();
    return { data: courtsStore };
  },
  async updateStatus(courtId, status, maintenanceNotes = '') {
    await delay();
    courtsStore = courtsStore.map(c => 
      c.id === courtId ? { ...c, status, maintenanceNotes } : c
    );
    return { data: courtsStore.find(c => c.id === courtId) };
  },
  async update(courtId, updatedData) {
    await delay();
    courtsStore = courtsStore.map(c => 
      c.id === courtId ? { ...c, ...updatedData } : c
    );
    return { data: courtsStore.find(c => c.id === courtId) };
  },
  async delete(courtId) {
    await delay();
    courtsStore = courtsStore.filter(c => c.id !== courtId);
    return { success: true };
  },
  async create(courtData) {
    await delay();
    const newCourt = {
      ...courtData,
      id: `cancha-${Date.now()}`,
      schedule: [],
      availability: courtData.availability || { ...DEFAULT_COURT_AVAILABILITY, blockedRanges: [] }
    };
    courtsStore.push(newCourt);
    return { data: newCourt };
  },
  // RF016 / RF017: registrar y modificar horarios disponibles de una cancha
  async updateAvailability(courtId, availability) {
    await delay();
    courtsStore = courtsStore.map(c =>
      c.id === courtId
        ? { ...c, availability: { ...DEFAULT_COURT_AVAILABILITY, ...(c.availability || {}), ...availability } }
        : c
    );
    return { data: courtsStore.find(c => c.id === courtId) };
  }
};

// ---- Tipos de Cancha (RF011 - RF015) ----
const courtTypesMock = {
  async getAll() {
    await delay();
    return { data: courtTypesStore };
  },
  async create(typeData) {
    await delay();
    const name = (typeData.name || '').trim();
    if (!name) throw new Error('El nombre del tipo de cancha es obligatorio.');
    if (courtTypesStore.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Ya existe un tipo de cancha con ese nombre.');
    }
    const newType = {
      id: `ct-${Date.now()}`,
      name,
      label: typeData.label || name,
      description: typeData.description || '',
      speed: typeData.speed || 'Media',
      basePricePerHour: Number(typeData.basePricePerHour) || 0,
      maintenanceFrequency: typeData.maintenanceFrequency || '',
      maxStudentsPerClass: Math.min(Number(typeData.maxStudentsPerClass) || 30, 30),
      active: typeData.active !== false
    };
    courtTypesStore.push(newType);
    return { data: newType };
  },
  async update(typeId, updatedData) {
    await delay();
    courtTypesStore = courtTypesStore.map(t =>
      t.id === typeId
        ? {
            ...t,
            ...updatedData,
            basePricePerHour: Number(updatedData.basePricePerHour ?? t.basePricePerHour) || 0,
            maxStudentsPerClass: Math.min(Number(updatedData.maxStudentsPerClass ?? t.maxStudentsPerClass) || 30, 30)
          }
        : t
    );
    return { data: courtTypesStore.find(t => t.id === typeId) };
  },
  async delete(typeId) {
    await delay();
    const target = courtTypesStore.find(t => t.id === typeId);
    if (target && courtsStore.some(c => c.surfaceType === target.name)) {
      throw new Error(`No se puede eliminar: existen canchas registradas con superficie "${target.name}".`);
    }
    courtTypesStore = courtTypesStore.filter(t => t.id !== typeId);
    return { success: true };
  }
};

const stockMock = {
  async getAll() {
    await delay();
    return { data: stockStore };
  },
  async create(itemData) {
    await delay();
    const total = Number(itemData.totalStock) || 0;
    const inUse = Number(itemData.inUseStock) || 0;
    const available = Math.max(0, total - inUse);
    const minAlertThreshold = Number(itemData.minAlertThreshold) || 1;
    const newItem = {
      id: `stock-${Date.now()}`,
      name: itemData.name,
      category: itemData.category || 'Equipamiento',
      description: itemData.description || '',
      totalStock: total,
      availableStock: available,
      inUseStock: inUse,
      minAlertThreshold,
      unit: itemData.unit || 'unidades',
      status: available <= minAlertThreshold ? 'alerta_baja' : 'normal'
    };
    stockStore.push(newItem);
    return { data: newItem };
  },
  async update(itemId, updatedData) {
    await delay();
    stockStore = stockStore.map(item => {
      if (item.id === itemId) {
        const total = Number(updatedData.totalStock !== undefined ? updatedData.totalStock : item.totalStock);
        const inUse = Number(updatedData.inUseStock !== undefined ? updatedData.inUseStock : item.inUseStock);
        const available = Math.max(0, total - inUse);
        const minThreshold = Number(updatedData.minAlertThreshold !== undefined ? updatedData.minAlertThreshold : item.minAlertThreshold);
        return {
          ...item,
          ...updatedData,
          totalStock: total,
          inUseStock: inUse,
          availableStock: available,
          minAlertThreshold: minThreshold,
          status: available <= minThreshold ? 'alerta_baja' : 'normal'
        };
      }
      return item;
    });
    return { data: stockStore.find(i => i.id === itemId) };
  },
  async delete(itemId) {
    await delay();
    stockStore = stockStore.filter(i => i.id !== itemId);
    return { success: true };
  },
  async updateStock(itemId, totalStock) {
    await delay();
    stockStore = stockStore.map(item => {
      if (item.id === itemId) {
        const available = Math.max(0, totalStock - item.inUseStock);
        return {
          ...item,
          totalStock,
          availableStock: available,
          status: available <= item.minAlertThreshold ? 'alerta_baja' : 'normal'
        };
      }
      return item;
    });
    return { data: stockStore.find(i => i.id === itemId) };
  }
};

const reservationsMock = {
  async getAll() {
    await delay();
    return { data: reservationsStore };
  },
  async create(bookingData) {
    await delay();
    const newId = `RES-${new Date().getFullYear()}-${String(reservationsStore.length + 1).padStart(3, '0')}`;
    const newRecId = `REC-50-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReservation = {
      ...bookingData,
      id: newId,
      depositReceiptNumber: newRecId,
      remainingPaid: false,
      finalReceiptNumber: null,
      status: 'confirmada',
      createdAt: new Date().toISOString()
    };

    reservationsStore.unshift(newReservation);

    // Auto-generate deposit receipt
    const depositReceipt = {
      id: newRecId,
      reservationId: newId,
      clientName: bookingData.participants[0]?.name || 'Socio Tenis Ahora',
      clientDni: bookingData.participants[0]?.dni || '00.000.000',
      concept: `Seña 50% Obligatoria - ${bookingData.courtName}`,
      items: [
        { description: `Alquiler ${bookingData.durationHours}hs ${bookingData.courtName}`, amount: bookingData.courtCost },
        { description: `Equipamiento incluido (Red, Pelotas, Raquetas)`, amount: 0 },
        { description: `Total Turno`, amount: bookingData.totalCost },
        { description: `Cobro de Seña 50% para Confirmación`, amount: bookingData.depositPaid }
      ],
      totalPaid: bookingData.depositPaid,
      paymentMethod: bookingData.depositPaymentMethod || 'Mercado Pago (QR)',
      status: 'completado',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      qrData: `https://mpago.la/pos/tenisahora/${newRecId.toLowerCase()}`,
      cashierName: 'Cobro Digital Online'
    };
    receiptsStore.unshift(depositReceipt);

    return { data: newReservation, receipt: depositReceipt };
  },
  async payRemainingBalance(reservationId, paymentMethod = 'Efectivo') {
    await delay();
    const finalRecId = `REC-FINAL-${Math.floor(1000 + Math.random() * 9000)}`;
    let target = null;
    
    reservationsStore = reservationsStore.map(res => {
      if (res.id === reservationId) {
        target = {
          ...res,
          remainingPaid: true,
          status: 'finalizada',
          finalReceiptNumber: finalRecId
        };
        return target;
      }
      return res;
    });

    if (target) {
      const finalReceipt = {
        id: finalRecId,
        reservationId: target.id,
        clientName: target.participants[0]?.name || 'Socio Tenis Ahora',
        clientDni: target.participants[0]?.dni || '00.000.000',
        concept: `Liquidación Final 50% Saldo - ${target.courtName}`,
        items: [
          { description: `Saldo restante 50% de turno finalizado`, amount: target.remainingBalance }
        ],
        totalPaid: target.remainingBalance,
        paymentMethod,
        status: 'completado',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        qrData: `https://mpago.la/pos/tenisahora/${finalRecId.toLowerCase()}`,
        cashierName: 'Recepción del Club'
      };
      receiptsStore.unshift(finalReceipt);
    }

    return { data: target };
  },
  // RF021: modificar reserva (fecha, horario, cancha, jugadores)
  async update(reservationId, updatedData) {
    await delay();
    reservationsStore = reservationsStore.map(res => {
      if (res.id !== reservationId) return res;
      const next = { ...res, ...updatedData };
      const dur = Number(next.durationHours) || 1;
      if (updatedData.startTime || updatedData.durationHours) {
        const [h, m] = String(next.startTime || '08:00').split(':').map(Number);
        const totalMin = h * 60 + (m || 0) + Math.round(dur * 60);
        next.endTime = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
      }
      const court = courtsStore.find(c => c.id === next.courtId);
      if (court && (updatedData.courtId || updatedData.durationHours)) {
        if (updatedData.courtId) {
          next.courtName = `${court.name} (${court.surfaceType})`;
          next.surfaceType = court.surfaceType;
        }
        next.courtCost = court.pricePerHour * dur;
        next.totalCost = next.courtCost + (next.equipmentCost || 0);
        next.remainingBalance = Math.max(0, next.totalCost - (next.depositPaid || 0));
      }
      next.updatedAt = new Date().toISOString();
      return next;
    });
    return { data: reservationsStore.find(r => r.id === reservationId) };
  },
  // RF023: eliminar reserva del registro
  async delete(reservationId) {
    await delay();
    reservationsStore = reservationsStore.filter(r => r.id !== reservationId);
    return { success: true };
  },
  async cancel(reservationId, hoursInAdvance) {
    await delay();
    // RD02/RD03/RD04: con >= 6hs de antelación corresponde reembolso;
    // fuera de plazo se aplica un cargo (retención del 50% de la seña).
    const isWithinFreeWindow = hoursInAdvance >= 6;
    let cancelledRes = null;

    reservationsStore = reservationsStore.map(res => {
      if (res.id === reservationId) {
        cancelledRes = {
          ...res,
          status: 'cancelada',
          cancellationDetails: {
            cancelledAt: new Date().toISOString(),
            hoursInAdvance,
            policyApplied: isWithinFreeWindow 
              ? 'Cancelación anticipada (>6hs): Reembolso de seña según política.'
              : 'Cancelación tardía (<6hs): Se aplica retención del 50% de seña por costo operativo.'
          }
        };
        return cancelledRes;
      }
      return res;
    });

    let refund = null;
    let penaltyReceipt = null;
    if (cancelledRes) {
      const lead = cancelledRes.participants?.[0] || {};
      const deposit = Number(cancelledRes.depositPaid) || 0;
      const refundId = `RMB-${new Date().getFullYear()}-${String(refundsStore.length + 9).padStart(4, '0')}`;
      if (isWithinFreeWindow) {
        refund = {
          id: refundId,
          clientName: lead.name || 'Socio Tenis Ahora',
          clientDni: lead.dni || '00.000.000',
          relatedReservationId: cancelledRes.id,
          relatedReceiptId: cancelledRes.depositReceiptNumber || null,
          reason: `Cancelación de reserva ${cancelledRes.id} con ${hoursInAdvance} hs de antelación (dentro del plazo reglamentario).`,
          refundType: 'total',
          originalAmount: deposit,
          refundAmount: deposit,
          refundMethod: `Devolución a ${cancelledRes.depositPaymentMethod || 'medio de pago original'}`,
          status: 'pendiente',
          date: nowStamp(),
          processedBy: 'Sistema de Reservas'
        };
      } else {
        const retained = Math.round(deposit * 0.5);
        penaltyReceipt = {
          id: `REC-CARGO-${Math.floor(1000 + Math.random() * 9000)}`,
          reservationId: cancelledRes.id,
          clientName: lead.name || 'Socio Tenis Ahora',
          clientDni: lead.dni || '00.000.000',
          concept: `Cargo por cancelación fuera de plazo - ${cancelledRes.courtName}`,
          items: [
            { description: `Seña abonada (${cancelledRes.id})`, amount: deposit },
            { description: 'Retención 50% por cancelación con menos de 6 hs', amount: retained },
            { description: 'Saldo reintegrado como crédito en cuenta', amount: deposit - retained }
          ],
          totalPaid: retained,
          paymentMethod: 'Retención sobre seña',
          status: 'completado',
          date: nowStamp(),
          cashierName: 'Sistema de Reservas'
        };
        receiptsStore.unshift(penaltyReceipt);
        refund = {
          id: refundId,
          clientName: lead.name || 'Socio Tenis Ahora',
          clientDni: lead.dni || '00.000.000',
          relatedReservationId: cancelledRes.id,
          relatedReceiptId: cancelledRes.depositReceiptNumber || null,
          reason: `Cancelación fuera de plazo (${hoursInAdvance} hs). Se retiene el 50% de la seña y se reintegra el resto.`,
          refundType: 'parcial',
          originalAmount: deposit,
          refundAmount: deposit - retained,
          refundMethod: 'Crédito en cuenta de socio',
          status: 'pendiente',
          date: nowStamp(),
          processedBy: 'Sistema de Reservas'
        };
      }
      refundsStore.unshift(refund);
    }

    return { data: cancelledRes, isWithinFreeWindow, refund, penaltyReceipt };
  }
};

const tournamentsMock = {
  async getAll() {
    await delay();
    return { data: tournamentsStore };
  },
  async create(trnData) {
    await delay();
    const newTrn = {
      ...trnData,
      id: `trn-${Date.now()}`,
      currentEnrolled: 0,
      status: 'inscripcion_abierta',
      internalRules: trnData.internalRules || 'Reglamento Interno: Partidos al mejor de 3 sets con tie-break oficial.',
      participants: [],
      bracket: []
    };
    tournamentsStore.push(newTrn);
    return { data: newTrn };
  },
  async update(trnId, updatedData) {
    await delay();
    tournamentsStore = tournamentsStore.map(t =>
      t.id === trnId ? { ...t, ...updatedData } : t
    );
    return { data: tournamentsStore.find(t => t.id === trnId) };
  },
  async delete(trnId) {
    await delay();
    tournamentsStore = tournamentsStore.filter(t => t.id !== trnId);
    return { success: true };
  },
  async updateInternalRules(trnId, internalRules) {
    await delay();
    tournamentsStore = tournamentsStore.map(t =>
      t.id === trnId ? { ...t, internalRules } : t
    );
    return { data: tournamentsStore.find(t => t.id === trnId) };
  },
  async enroll(trnId, participantData) {
    await delay();
    const newParticipant = {
      id: `p-${Date.now()}`,
      name: participantData.name || participantData.partnerName || 'Participante Inscripto',
      dni: participantData.dni || participantData.partnerDni || '00.000.000',
      phone: participantData.phone || '',
      partnerName: participantData.partnerName || '',
      partnerDni: participantData.partnerDni || '',
      enrolledAt: new Date().toISOString().split('T')[0]
    };
    tournamentsStore = tournamentsStore.map(t => {
      if (t.id === trnId) {
        const nextList = [...(t.participants || []), newParticipant];
        return {
          ...t,
          participants: nextList,
          currentEnrolled: nextList.length
        };
      }
      return t;
    });
    return { success: true, participant: newParticipant };
  },
  async removeParticipant(trnId, participantId) {
    await delay();
    tournamentsStore = tournamentsStore.map(t => {
      if (t.id === trnId) {
        const nextList = (t.participants || []).filter(p => p.id !== participantId);
        return {
          ...t,
          participants: nextList,
          currentEnrolled: nextList.length
        };
      }
      return t;
    });
    return { success: true };
  },
  // RF057: registrar enfrentamiento en una ronda del torneo
  async addMatch(trnId, roundName, matchData) {
    await delay();
    tournamentsStore = tournamentsStore.map(t => {
      if (t.id !== trnId) return t;
      const bracket = JSON.parse(JSON.stringify(t.bracket || []));
      const newMatch = {
        id: `tm-${Date.now()}`,
        p1: matchData.p1,
        p2: matchData.p2,
        score: 'Pendiente',
        winner: null,
        status: 'programado',
        court: matchData.court || 'Cancha 1',
        date: matchData.date || new Date().toISOString().split('T')[0]
      };
      const target = bracket.find(r => r.round === roundName);
      if (target) {
        target.matches = [...(target.matches || []), newMatch];
      } else {
        bracket.push({ round: roundName || `Ronda ${bracket.length + 1}`, matches: [newMatch] });
      }
      return { ...t, bracket };
    });
    return { success: true };
  },
  // RF058: modificar datos o resultado de un enfrentamiento
  async updateMatch(trnId, matchId, updatedData) {
    await delay();
    tournamentsStore = tournamentsStore.map(t => {
      if (t.id !== trnId) return t;
      const bracket = (t.bracket || []).map(r => ({
        ...r,
        matches: (r.matches || []).map(m => (m.id === matchId ? { ...m, ...updatedData } : m))
      }));
      return { ...t, bracket };
    });
    return { success: true };
  }
};

// ---- Tipos de Competencia (RF061 - RF065) ----
const competitionTypesMock = {
  async getAll() {
    await delay();
    return { data: competitionTypesStore };
  },
  async create(typeData) {
    await delay();
    const newType = {
      id: `cmp-${Date.now()}`,
      name: typeData.name,
      format: typeData.format || '',
      appliesTo: typeData.appliesTo || 'Torneo',
      scoringSystem: typeData.scoringSystem || '',
      minParticipants: Number(typeData.minParticipants) || 2,
      maxParticipants: Number(typeData.maxParticipants) || 32,
      description: typeData.description || '',
      active: typeData.active !== false
    };
    competitionTypesStore.push(newType);
    return { data: newType };
  },
  async update(typeId, updatedData) {
    await delay();
    competitionTypesStore = competitionTypesStore.map(t =>
      t.id === typeId ? { ...t, ...updatedData } : t
    );
    return { data: competitionTypesStore.find(t => t.id === typeId) };
  },
  async delete(typeId) {
    await delay();
    competitionTypesStore = competitionTypesStore.filter(t => t.id !== typeId);
    return { success: true };
  }
};

const leaguesMock = {
  async getAll() {
    await delay();
    return { data: leaguesStore };
  },
  async create(leagueData) {
    await delay();
    const newLeague = {
      ...leagueData,
      id: `liga-${Date.now()}`,
      currentEnrolled: 0,
      status: 'inscripcion_abierta',
      internalRules: leagueData.internalRules || 'Reglamento Interno: Sistema todos contra todos por puntos.',
      standings: [],
      fixtures: [],
      participants: []
    };
    leaguesStore.push(newLeague);
    return { data: newLeague };
  },
  async update(leagueId, updatedData) {
    await delay();
    leaguesStore = leaguesStore.map(l =>
      l.id === leagueId ? { ...l, ...updatedData } : l
    );
    return { data: leaguesStore.find(l => l.id === leagueId) };
  },
  async delete(leagueId) {
    await delay();
    leaguesStore = leaguesStore.filter(l => l.id !== leagueId);
    return { success: true };
  },
  async updateInternalRules(leagueId, internalRules) {
    await delay();
    leaguesStore = leaguesStore.map(l =>
      l.id === leagueId ? { ...l, internalRules } : l
    );
    return { data: leaguesStore.find(l => l.id === leagueId) };
  },
  async enroll(leagueId, participantData) {
    await delay();
    const newParticipant = {
      id: `lp-${Date.now()}`,
      name: participantData.name,
      dni: participantData.dni || '00.000.000',
      phone: participantData.phone || '',
      partnerName: participantData.partnerName || '',
      partnerDni: participantData.partnerDni || '',
      enrolledAt: new Date().toISOString().split('T')[0]
    };
    leaguesStore = leaguesStore.map(l => {
      if (l.id === leagueId) {
        const nextList = [...(l.participants || []), newParticipant];
        const nextStandings = [...(l.standings || [])];
        if (!nextStandings.some(s => s.name === newParticipant.name)) {
          nextStandings.push({
            rank: nextStandings.length + 1,
            name: newParticipant.name,
            pj: 0,
            pg: 0,
            pp: 0,
            sf: 0,
            sc: 0,
            dif: 0,
            points: 0
          });
        }
        return {
          ...l,
          participants: nextList,
          standings: nextStandings,
          currentEnrolled: nextList.length
        };
      }
      return l;
    });
    return { success: true, participant: newParticipant };
  },
  async removeParticipant(leagueId, participantId) {
    await delay();
    let removedName = null;
    leaguesStore = leaguesStore.map(l => {
      if (l.id === leagueId) {
        const target = (l.participants || []).find(p => p.id === participantId);
        if (target) removedName = target.name;
        const nextList = (l.participants || []).filter(p => p.id !== participantId);
        const nextStandings = (l.standings || []).filter(s => s.name !== removedName)
          .map((s, idx) => ({ ...s, rank: idx + 1 }));
        return {
          ...l,
          participants: nextList,
          standings: nextStandings,
          currentEnrolled: nextList.length
        };
      }
      return l;
    });
    return { success: true };
  },
  async updateMatchScore(leagueId, matchId, score, winner) {
    await delay();
    leaguesStore = leaguesStore.map(l => {
      if (l.id === leagueId) {
        let p1Name = null;
        let p2Name = null;
        const nextFixtures = (l.fixtures || []).map(f => ({
          ...f,
          matches: (f.matches || []).map(m => {
            if (m.id === matchId) {
              p1Name = m.p1;
              p2Name = m.p2;
              return { ...m, score, winner, status: 'finalizado' };
            }
            return m;
          })
        }));

        let nextStandings = [...(l.standings || [])];
        if (winner && (p1Name || p2Name)) {
          const loser = (winner === p1Name) ? p2Name : p1Name;
          nextStandings = nextStandings.map(s => {
            if (s.name === winner) {
              return {
                ...s,
                pj: (s.pj || 0) + 1,
                pg: (s.pg || 0) + 1,
                points: (s.points || 0) + 3,
                sf: (s.sf || 0) + 2,
                dif: (s.dif || 0) + 2
              };
            }
            if (s.name === loser) {
              return {
                ...s,
                pj: (s.pj || 0) + 1,
                pp: (s.pp || 0) + 1,
                sc: (s.sc || 0) + 2,
                dif: (s.dif || 0) - 2
              };
            }
            return s;
          });
          nextStandings.sort((a, b) => (b.points - a.points) || (b.dif - a.dif));
          nextStandings = nextStandings.map((s, idx) => ({ ...s, rank: idx + 1 }));
        }

        return { ...l, fixtures: nextFixtures, standings: nextStandings };
      }
      return l;
    });
    return { success: true };
  },
  async updateMatch(leagueId, matchId, updatedData) {
    await delay();
    leaguesStore = leaguesStore.map(l => {
      if (l.id !== leagueId) return l;
      const fixtures = (l.fixtures || []).map(f => ({
        ...f,
        matches: (f.matches || []).map(m => (m.id === matchId ? { ...m, ...updatedData } : m))
      }));
      return { ...l, fixtures };
    });
    return { success: true };
  },
  async addMatch(leagueId, roundName, matchData) {
    await delay();
    leaguesStore = leaguesStore.map(l => {
      if (l.id === leagueId) {
        const fixtures = [...(l.fixtures || [])];
        let targetRound = fixtures.find(f => f.round === roundName);
        const newMatch = {
          id: `lm-${Date.now()}`,
          p1: matchData.p1,
          p2: matchData.p2,
          score: 'Pendiente',
          winner: null,
          status: 'programado',
          court: matchData.court || 'Cancha 1',
          date: matchData.date || new Date().toISOString().split('T')[0]
        };
        if (targetRound) {
          targetRound.matches = [...(targetRound.matches || []), newMatch];
        } else {
          fixtures.push({
            round: roundName || `Jornada ${fixtures.length + 1}`,
            matches: [newMatch]
          });
        }
        return { ...l, fixtures };
      }
      return l;
    });
    return { success: true };
  }
};

const coachesAndClassesMock = {
  // ---- Coaches / Professors ----
  async getCoaches() {
    await delay();
    return { data: coachesStore };
  },
  async createCoach(coachData) {
    await delay();
    const newCoach = {
      ...coachData,
      id: `coach-${Date.now()}`,
      hasOfficialLicense: true,
      licenseDetails: {
        titleName: coachData.licenseDetails?.titleName || 'Profesor de Tenis Certificado',
        institution: coachData.licenseDetails?.institution || 'Asociación Argentina de Tenis (AAT)',
        licenseNumber: coachData.licenseDetails?.licenseNumber || `AAT-LIC-${Math.floor(10000 + Math.random() * 90000)}`,
        issueDate: coachData.licenseDetails?.issueDate || new Date().toISOString().split('T')[0],
        expiryDate: coachData.licenseDetails?.expiryDate || '2029-12-31',
        status: 'habilitado',
        digitalDocumentUrl: coachData.licenseDetails?.digitalDocumentUrl || 'Certificado_Oficial_AAT_Registrado.pdf'
      },
      photo: coachData.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    };
    coachesStore.push(newCoach);
    return { data: newCoach };
  },
  async updateCoach(coachId, updatedData) {
    await delay();
    coachesStore = coachesStore.map(c =>
      c.id === coachId ? { ...c, ...updatedData } : c
    );
    return { data: coachesStore.find(c => c.id === coachId) };
  },
  async deleteCoach(coachId) {
    await delay();
    coachesStore = coachesStore.filter(c => c.id !== coachId);
    return { success: true };
  },
  async updateCoachAvailability(coachId, availableHours) {
    await delay();
    coachesStore = coachesStore.map(c =>
      c.id === coachId ? { ...c, availableHours } : c
    );
    return { data: coachesStore.find(c => c.id === coachId) };
  },
  async updateCoachLicense(coachId, licenseDetails) {
    await delay();
    coachesStore = coachesStore.map(c =>
      c.id === coachId ? { ...c, licenseDetails: { ...c.licenseDetails, ...licenseDetails } } : c
    );
    return { data: coachesStore.find(c => c.id === coachId) };
  },

  // ---- Group Classes ----
  async getClasses() {
    await delay();
    return { data: classesStore };
  },
  async addClass(classData) {
    await delay();
    if (classData.maxCapacity > 30) {
      throw new Error('El cupo reglamentario máximo es de hasta 30 alumnos.');
    }
    const newClass = {
      ...classData,
      kind: classData.kind || 'clase',
      id: `cls-${Date.now()}`,
      maxCapacity: Math.min(Number(classData.maxCapacity) || 30, 30),
      currentEnrolled: 0,
      students: [],
      sessions: classData.sessions || ['02/10', '04/10', '09/10', '11/10', '16/10', '18/10', '23/10', '25/10']
    };
    classesStore.push(newClass);
    return { data: newClass };
  },
  async updateClass(classId, updatedData) {
    await delay();
    if (updatedData.maxCapacity && updatedData.maxCapacity > 30) {
      throw new Error('El cupo reglamentario máximo es de hasta 30 alumnos.');
    }
    classesStore = classesStore.map(c =>
      c.id === classId ? {
        ...c,
        ...updatedData,
        maxCapacity: updatedData.maxCapacity ? Math.min(Number(updatedData.maxCapacity), 30) : c.maxCapacity
      } : c
    );
    return { data: classesStore.find(c => c.id === classId) };
  },
  async deleteClass(classId) {
    await delay();
    classesStore = classesStore.filter(c => c.id !== classId);
    return { success: true };
  },
  async toggleStudentAttendance(classId, studentId, sessionIndex) {
    await delay();
    const cycle = { 'P': 'A', 'A': 'J', 'J': 'P', '-': 'P' };
    classesStore = classesStore.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: cls.students.map(st => {
            if (st.id === studentId) {
              const currentAtt = [...(st.attendance || [])];
              while (currentAtt.length <= sessionIndex) {
                currentAtt.push('-');
              }
              const currentVal = currentAtt[sessionIndex] || '-';
              currentAtt[sessionIndex] = cycle[currentVal] || 'P';
              return { ...st, attendance: currentAtt };
            }
            return st;
          })
        };
      }
      return cls;
    });
    return { success: true, classes: classesStore };
  },
  async bulkMarkSession(classId, sessionIndex, status = 'P') {
    await delay();
    classesStore = classesStore.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: cls.students.map(st => {
            const currentAtt = [...(st.attendance || [])];
            while (currentAtt.length <= sessionIndex) {
              currentAtt.push('-');
            }
            currentAtt[sessionIndex] = status;
            return { ...st, attendance: currentAtt };
          })
        };
      }
      return cls;
    });
    return { success: true, classes: classesStore };
  },
  async enrollStudent(classId, studentData) {
    await delay();
    const targetClass = classesStore.find(c => c.id === classId);
    if (!targetClass) throw new Error('Clase no encontrada.');
    const capacity = Math.min(Number(targetClass.maxCapacity) || 30, 30);
    if ((targetClass.students?.length || 0) >= capacity) {
      throw new Error(`No es posible agregar más alumnos: el cupo de ${capacity} está completo.`);
    }
    const newStudent = {
      id: `std-${Date.now()}`,
      name: studentData.name,
      dni: studentData.dni,
      phone: studentData.phone || '',
      enrolledAt: new Date().toISOString().split('T')[0],
      attendance: Array(targetClass.sessions?.length || 8).fill('P')
    };
    classesStore = classesStore.map(cls => {
      if (cls.id === classId) {
        const nextStudents = [...(cls.students || []), newStudent];
        return {
          ...cls,
          students: nextStudents,
          currentEnrolled: nextStudents.length
        };
      }
      return cls;
    });
    return { success: true, student: newStudent };
  },
  async removeStudent(classId, studentId) {
    await delay();
    classesStore = classesStore.map(cls => {
      if (cls.id === classId) {
        const nextStudents = (cls.students || []).filter(st => st.id !== studentId);
        return {
          ...cls,
          students: nextStudents,
          currentEnrolled: nextStudents.length
        };
      }
      return cls;
    });
    return { success: true };
  },
  async recordAttendance(classId, studentId, status) {
    await delay();
    classesStore = classesStore.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: cls.students.map(st => {
            if (st.id === studentId) {
              return {
                ...st,
                attendance: [...st.attendance, status]
              };
            }
            return st;
          })
        };
      }
      return cls;
    });
    return { success: true };
  },

  // ---- Private Classes ----
  async getPrivateClasses() {
    await delay();
    return { data: privateClassesStore };
  },
  async createPrivateClass(data) {
    await delay();
    const newPrv = {
      ...data,
      kind: data.kind || 'clase',
      id: `prv-${Date.now()}`,
      status: 'programada'
    };
    privateClassesStore = [newPrv, ...privateClassesStore];
    return { data: newPrv };
  },
  async updatePrivateClass(id, updatedData) {
    await delay();
    privateClassesStore = privateClassesStore.map(p =>
      p.id === id ? { ...p, ...updatedData } : p
    );
    return { data: privateClassesStore.find(p => p.id === id) };
  },
  async cancelPrivateClass(id) {
    await delay();
    privateClassesStore = privateClassesStore.map(p =>
      p.id === id ? { ...p, status: 'cancelada' } : p
    );
    return { success: true };
  },
  async deletePrivateClass(id) {
    await delay();
    privateClassesStore = privateClassesStore.filter(p => p.id !== id);
    return { success: true };
  }
};

const receiptsMock = {
  async getAll() {
    await delay();
    return { data: receiptsStore };
  },
  async getDiscounts() {
    await delay();
    return { data: discountsStore };
  },
  async create(receiptData) {
    await delay();
    receiptsStore = [receiptData, ...receiptsStore];
    return { data: receiptData };
  }
};

// ---- Descuentos (RF138 - RF142) ----
const discountsMock = {
  async getAll() {
    await delay();
    return { data: discountsStore };
  },
  async create(discountData) {
    await delay();
    const code = (discountData.code || '').trim().toUpperCase();
    if (!code) throw new Error('El código del descuento es obligatorio.');
    if (discountsStore.some(d => d.code === code)) throw new Error('Ya existe un descuento con ese código.');
    const newDiscount = {
      id: `disc-${Date.now()}`,
      name: discountData.name,
      code,
      discountPercent: Math.max(0, Math.min(100, Number(discountData.discountPercent) || 0)),
      applicableTo: discountData.applicableTo || 'Alquiler de Canchas',
      active: discountData.active !== false
    };
    discountsStore.push(newDiscount);
    return { data: newDiscount };
  },
  async update(discountId, updatedData) {
    await delay();
    discountsStore = discountsStore.map(d =>
      d.id === discountId
        ? {
            ...d,
            ...updatedData,
            code: (updatedData.code || d.code).toUpperCase(),
            discountPercent: Math.max(0, Math.min(100, Number(updatedData.discountPercent ?? d.discountPercent) || 0))
          }
        : d
    );
    return { data: discountsStore.find(d => d.id === discountId) };
  },
  async delete(discountId) {
    await delay();
    const target = discountsStore.find(d => d.id === discountId);
    discountsStore = discountsStore.filter(d => d.id !== discountId);
    if (target) {
      usersStore = usersStore.map(u => ({
        ...u,
        activeDiscounts: (u.activeDiscounts || []).filter(code => code !== target.code)
      }));
    }
    return { success: true };
  }
};

// ---- Facturas (RF125 - RF127) ----
const invoicesMock = {
  async getAll() {
    await delay();
    return { data: invoicesStore };
  },
  async create(invoiceData) {
    await delay();
    const items = (invoiceData.items || []).map(it => ({
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0
    }));
    const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const taxRate = Number(invoiceData.taxRate ?? 21);
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const seq = String(412 + invoicesStore.length + 1).padStart(8, '0');
    const newInvoice = {
      id: `FC-${invoiceData.type || 'B'}-0001-${seq}`,
      type: invoiceData.type || 'B',
      clientName: invoiceData.clientName,
      clientDni: invoiceData.clientDni,
      clientAddress: invoiceData.clientAddress || '',
      concept: invoiceData.concept || items[0]?.description || 'Servicios del club',
      items,
      subtotal,
      taxRate,
      taxAmount,
      total: subtotal + taxAmount,
      paymentMethod: invoiceData.paymentMethod || 'Efectivo',
      relatedReceiptId: invoiceData.relatedReceiptId || null,
      status: 'emitida',
      date: nowStamp(),
      issuedBy: invoiceData.issuedBy || 'Administración General'
    };
    invoicesStore = [newInvoice, ...invoicesStore];
    return { data: newInvoice };
  },
  async annul(invoiceId) {
    await delay();
    invoicesStore = invoicesStore.map(i => (i.id === invoiceId ? { ...i, status: 'anulada' } : i));
    return { data: invoicesStore.find(i => i.id === invoiceId) };
  }
};

// ---- Reembolsos (RF131 - RF133) ----
const refundsMock = {
  async getAll() {
    await delay();
    return { data: refundsStore };
  },
  async create(refundData) {
    await delay();
    const originalAmount = Number(refundData.originalAmount) || 0;
    const refundAmount = Math.min(originalAmount, Number(refundData.refundAmount) || 0);
    const newRefund = {
      id: `RMB-${new Date().getFullYear()}-${String(refundsStore.length + 9).padStart(4, '0')}`,
      clientName: refundData.clientName,
      clientDni: refundData.clientDni,
      relatedReservationId: refundData.relatedReservationId || null,
      relatedReceiptId: refundData.relatedReceiptId || null,
      reason: refundData.reason || '',
      refundType: refundAmount >= originalAmount ? 'total' : 'parcial',
      originalAmount,
      refundAmount,
      refundMethod: refundData.refundMethod || 'Crédito en cuenta de socio',
      status: refundData.status || 'pendiente',
      date: nowStamp(),
      processedBy: refundData.processedBy || 'Administración General'
    };
    refundsStore = [newRefund, ...refundsStore];
    return { data: newRefund };
  },
  async updateStatus(refundId, status) {
    await delay();
    refundsStore = refundsStore.map(r => (r.id === refundId ? { ...r, status } : r));
    return { data: refundsStore.find(r => r.id === refundId) };
  }
};

const usersMock = {
  async getAll() {
    await delay();
    return { data: usersStore };
  },
  // RF001: registrar usuario desde administración
  async create(userData) {
    await delay();
    const email = (userData.email || '').trim().toLowerCase();
    if (usersStore.some(u => (u.email || '').toLowerCase() === email)) {
      throw new Error('Ya existe un usuario registrado con ese email.');
    }
    const isAdmin = userData.role === 'admin';
    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.name,
      dni: userData.dni || '',
      phone: userData.phone || '',
      email,
      address: userData.address || '',
      role: userData.role || 'client',
      memberNumber: isAdmin
        ? `ADM-${String(usersStore.filter(u => u.role === 'admin').length + 1).padStart(3, '0')}`
        : `TA-${Math.floor(1000 + Math.random() * 9000)}`,
      memberSince: new Date().toISOString().split('T')[0],
      activeDiscounts: userData.activeDiscounts || [],
      totalBookings: 0
    };
    usersStore.push(newUser);
    return { data: newUser };
  },
  async update(userId, updatedData) {
    await delay();
    usersStore = usersStore.map(u => u.id === userId ? { ...u, ...updatedData } : u);
    return { data: usersStore.find(u => u.id === userId) };
  },
  // RF004: eliminar usuario
  async delete(userId) {
    await delay();
    usersStore = usersStore.filter(u => u.id !== userId);
    return { success: true };
  },
  // RF138 - RF141: descuentos asignados a un usuario
  async updateDiscounts(userId, activeDiscounts) {
    await delay();
    usersStore = usersStore.map(u => u.id === userId ? { ...u, activeDiscounts: [...activeDiscounts] } : u);
    return { data: usersStore.find(u => u.id === userId) };
  }
};

// ---- Servicios contra la API (mismas firmas y formas de respuesta que el mock) ----
// Cuando el backend devuelve el documento, la respuesta de axios ya lo expone en `.data`
// igual que el mock. Cuando devuelve su propio sobre ({ success, ... } o { data, ... }),
// hay que desenvolverlo con `body`.
const body = (request) => request.then(res => res.data);

const crud = (path) => ({
  getAll: () => api.get(path),
  create: (data) => api.post(path, data),
  update: (id, data) => api.put(`${path}/${id}`, data),
  delete: (id) => body(api.delete(`${path}/${id}`))
});

const courtsHttp = {
  ...crud('/canchas'),
  updateStatus: (courtId, status, maintenanceNotes = '') =>
    api.patch(`/canchas/${courtId}/estado`, { status, maintenanceNotes }),
  updateAvailability: (courtId, availability) =>
    api.put(`/canchas/${courtId}/disponibilidad`, availability)
};

const courtTypesHttp = crud('/tipos-cancha');

const stockHttp = {
  ...crud('/stock'),
  updateStock: (itemId, totalStock) => api.patch(`/stock/${itemId}/ajuste`, { totalStock })
};

const reservationsHttp = {
  ...crud('/reservas'),
  create: (bookingData) => body(api.post('/reservas', bookingData)),
  payRemainingBalance: (reservationId, paymentMethod = 'Efectivo') =>
    api.post(`/reservas/${reservationId}/pagar-saldo`, { paymentMethod }),
  cancel: (reservationId, hoursInAdvance) =>
    body(api.post(`/reservas/${reservationId}/cancelar`, { hoursInAdvance }))
};

// Torneos y ligas comparten las rutas de reglamento, inscripciones y enfrentamientos.
const competitionHttp = (path) => ({
  ...crud(path),
  updateInternalRules: (id, internalRules) => api.put(`${path}/${id}/reglamento`, { internalRules }),
  enroll: (id, participantData) => body(api.post(`${path}/${id}/inscripciones`, participantData)),
  removeParticipant: (id, participantId) => body(api.delete(`${path}/${id}/inscripciones/${participantId}`)),
  addMatch: (id, round, matchData) => body(api.post(`${path}/${id}/enfrentamientos`, { ...matchData, round })),
  updateMatch: (id, matchId, updatedData) => body(api.put(`${path}/${id}/enfrentamientos/${matchId}`, updatedData))
});

const tournamentsHttp = competitionHttp('/torneos');

const competitionTypesHttp = crud('/tipos-competencia');

const leaguesHttp = {
  ...competitionHttp('/ligas'),
  updateMatchScore: (leagueId, matchId, score, winner) =>
    body(api.post(`/ligas/${leagueId}/enfrentamientos/${matchId}/resultado`, { score, winner }))
};

const coaches = crud('/profesores');
const classes = crud('/clases');
const privateClasses = crud('/clases-particulares');

const coachesAndClassesHttp = {
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
  bulkMarkSession: (classId, sessionIndex, status = 'P') =>
    body(api.post(`/clases/${classId}/asistencia/sesion`, { sessionIndex, status })),
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

const receiptsHttp = {
  getAll: () => api.get('/recibos'),
  getDiscounts: () => api.get('/descuentos'),
  create: (receiptData) => api.post('/recibos', receiptData)
};

const discountsHttp = crud('/descuentos');

const invoicesHttp = {
  getAll: () => api.get('/facturas'),
  create: (invoiceData) => api.post('/facturas', invoiceData),
  annul: (invoiceId) => api.post(`/facturas/${invoiceId}/anular`)
};

const refundsHttp = {
  getAll: () => api.get('/reembolsos'),
  create: (refundData) => api.post('/reembolsos', refundData),
  updateStatus: (refundId, status) => api.patch(`/reembolsos/${refundId}/estado`, { status })
};

const usersHttp = {
  ...crud('/usuarios'),
  updateDiscounts: (userId, activeDiscounts) => api.put(`/usuarios/${userId}/descuentos`, { activeDiscounts })
};

// El Modo Demo usa un token que el backend no acepta, así que esas sesiones siguen con los mocks.
// Se decide en cada llamada porque la sesión puede cambiar sin recargar la página.
function withBackend(mock, http) {
  return Object.fromEntries(
    Object.keys(mock).map(name => [
      name,
      (...args) => (getStoredUser()?.isDemo ? mock : http)[name](...args)
    ])
  );
}

export const courtsService = withBackend(courtsMock, courtsHttp);
export const courtTypesService = withBackend(courtTypesMock, courtTypesHttp);
export const stockService = withBackend(stockMock, stockHttp);
export const reservationsService = withBackend(reservationsMock, reservationsHttp);
export const tournamentsService = withBackend(tournamentsMock, tournamentsHttp);
export const competitionTypesService = withBackend(competitionTypesMock, competitionTypesHttp);
export const leaguesService = withBackend(leaguesMock, leaguesHttp);
export const coachesAndClassesService = withBackend(coachesAndClassesMock, coachesAndClassesHttp);
export const receiptsService = withBackend(receiptsMock, receiptsHttp);
export const discountsService = withBackend(discountsMock, discountsHttp);
export const invoicesService = withBackend(invoicesMock, invoicesHttp);
export const refundsService = withBackend(refundsMock, refundsHttp);
export const usersService = withBackend(usersMock, usersHttp);

export default api;
