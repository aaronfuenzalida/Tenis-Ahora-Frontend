import axios from 'axios';
import { getStoredToken } from '../utils/jwt';
import {
  INITIAL_COURTS,
  INITIAL_STOCK,
  INITIAL_RESERVATIONS,
  INITIAL_TOURNAMENTS,
  INITIAL_COACHES,
  INITIAL_CLASSES,
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
let coachesStore = [...INITIAL_COACHES];
let classesStore = [...INITIAL_CLASSES];
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
      bracket: []
    };
    tournamentsStore.push(newTrn);
    return { data: newTrn };
  },
  async enroll(trnId, participantData) {
    await delay();
    tournamentsStore = tournamentsStore.map(t => {
      if (t.id === trnId) {
        return {
          ...t,
          currentEnrolled: Math.min(t.maxParticipants, t.currentEnrolled + 1)
        };
      }
      return t;
    });
    return { success: true };
  }
};

export const coachesAndClassesService = {
  async getCoaches() {
    await delay();
    return { data: coachesStore };
  },
  async getClasses() {
    await delay();
    return { data: classesStore };
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
    if (!targetClass) throw new Error('Clase no encontrada');
    if ((targetClass.students?.length || 0) >= 30) {
      throw new Error('No se pueden inscribir más alumnos: cupo máximo de 30 alcanzado .');
    }
    const newStudent = {
      id: `std-${Date.now()}`,
      name: studentData.name,
      dni: studentData.dni,
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
  async addClass(classData) {
    await delay();
    const newClass = {
      ...classData,
      id: `cls-${Date.now()}`,
      currentEnrolled: 0,
      students: []
    };
    classesStore.push(newClass);
    return { data: newClass };
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
