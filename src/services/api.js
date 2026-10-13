import axios from 'axios';
import { getStoredToken } from '../utils/jwt';
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
  INITIAL_USERS
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

// Simulated delay helper
const delay = (ms = 150) => new Promise(res => setTimeout(res, ms));

export const courtsService = {
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
      schedule: []
    };
    courtsStore.push(newCourt);
    return { data: newCourt };
  }
};

export const stockService = {
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

export const reservationsService = {
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
  async cancel(reservationId, hoursInAdvance) {
    await delay();
    // Rule: Cancellations with min 6 hours advance receive refund/free cancellation.
    // If less than 6 hours, charge/fee applied.
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

    return { data: cancelledRes, isWithinFreeWindow };
  }
};

export const tournamentsService = {
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
  }
};

export const leaguesService = {
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

export const coachesAndClassesService = {
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
    if ((targetClass.students?.length || 0) >= 30) {
      throw new Error('No es posible agregar más alumnos: el cupo reglamentario de 30 está completo.');
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

export const receiptsService = {
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

export const usersService = {
  async getAll() {
    await delay();
    return { data: usersStore };
  },
  async update(userId, updatedData) {
    await delay();
    usersStore = usersStore.map(u => u.id === userId ? { ...u, ...updatedData } : u);
    return { data: usersStore.find(u => u.id === userId) };
  }
};

export default api;
