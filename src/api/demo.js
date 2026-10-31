// Demo sin backend: los mismos servicios que http.js, pero sobre datos en memoria.
// Las validaciones (RD01-RD12) replican las de la API para que la demo se comporte igual.
import { calculateHoursUntil, isEnrolledByDni, findPrivateLessonConflict, findReservationConflict, cleanDNI } from '../utils/formatters';
import { checkFile, fileToBase64, saveBlob } from '../utils/files';
import { DEFAULT_CLUB_CONFIG, DEFAULT_COURT_AVAILABILITY, maxBookingDate } from './club';
import { getSlotBlock } from '../modulos/canchas/CourtAvailabilityPanel';
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
  INITIAL_REFUNDS,
  INITIAL_DOCUMENTS
} from './demoData';

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
const clubConfigStore = { id: 'club', ...DEFAULT_CLUB_CONFIG };
let documentsStore = [...INITIAL_DOCUMENTS];

const documentRef = ({ id, name, mimeType, size }) => ({ id, name, mimeType, size });

// Una cancha no se reserva dos veces en la misma franja, y un jugador no puede estar en dos reservas a la vez.
function checkReservationConflict(data, excludeId) {
  const participantDnis = (data.participants || []).map(p => p.dni);
  const clash = findReservationConflict(reservationsStore, { ...data, participantDnis, excludeId });
  if (!clash) return;
  const sameCourt = (data.courtId && clash.courtId === data.courtId) || (data.courtName && clash.courtName === data.courtName);
  if (sameCourt) {
    throw new Error(`${clash.courtName} ya está reservada el ${clash.date} de ${clash.startTime} a ${clash.endTime}.`);
  }
  const dnis = participantDnis.map(cleanDNI);
  const busy = (clash.participants || []).find(p => dnis.includes(cleanDNI(p.dni || '')));
  throw new Error(`${busy?.name || 'Un jugador'} ya tiene una reserva el ${clash.date} de ${clash.startTime} a ${clash.endTime} en ${clash.courtName}.`);
}

// Un alumno no puede tener dos turnos particulares en el mismo día y horario, ni un profesor dos alumnos a la vez.
function checkPrivateLessonConflict({ coachId, studentDni, date, time, excludeId }) {
  const clash = findPrivateLessonConflict(privateClassesStore, { coachId, studentDni, date, time, excludeId });
  if (!clash) return;
  const sameStudent = clash.studentDni && studentDni && clash.studentDni.replace(/\D/g, '') === String(studentDni).replace(/\D/g, '');
  throw new Error(sameStudent
    ? `Ya hay un turno particular para ese alumno el ${clash.date} a las ${clash.time}, con ${clash.coachName}.`
    : `${clash.coachName} ya tiene un turno el ${clash.date} a las ${clash.time}.`);
}

// RD08: título habilitante completo y con documento; no se completa con datos inventados.
function normalizeLicense(lic = {}) {
  const required = [
    ['titleName', 'la denominación del título'],
    ['institution', 'la institución emisora'],
    ['licenseNumber', 'el número de matrícula o licencia'],
    ['expiryDate', 'la fecha de vencimiento']
  ];
  for (const [key, label] of required) {
    if (!String(lic[key] || '').trim()) throw new Error(`Falta ${label} del título habilitante.`);
  }
  if (!lic.document?.id) throw new Error('Falta adjuntar el documento del título habilitante.');
  const stored = documentsStore.find(d => d.id === lic.document.id);
  if (!stored) throw new Error(`El documento ${lic.document.id} no existe.`);
  const { digitalDocumentUrl, ...rest } = lic;
  return { ...rest, status: rest.status || 'habilitado', document: documentRef(stored) };
}

// RD09: un profesor sin título vigente no puede tener clases ni turnos a cargo.
function checkCoachQualified(coachId) {
  const coach = coachesStore.find(c => c.id === coachId);
  if (!coach) return;
  const lic = coach.licenseDetails || {};
  const today = maxBookingDate(0);
  if (!lic.document?.id) throw new Error(`${coach.name} no tiene cargado el documento del título habilitante.`);
  if (lic.status !== 'habilitado') throw new Error(`El título habilitante de ${coach.name} no está habilitado.`);
  if ((lic.expiryDate || '') < today) throw new Error(`El título habilitante de ${coach.name} venció el ${lic.expiryDate}.`);
}

// internalRulesDocument: undefined no lo cambia, null lo quita.
function applyRules(item, internalRules, internalRulesDocument) {
  const next = { ...item };
  if (internalRules !== undefined) next.internalRules = internalRules;
  if (internalRulesDocument === null) {
    delete next.internalRulesDocument;
  } else if (internalRulesDocument) {
    const stored = documentsStore.find(d => d.id === internalRulesDocument.id);
    if (!stored) throw new Error(`El documento ${internalRulesDocument.id} no existe.`);
    next.internalRulesDocument = documentRef(stored);
  }
  return next;
}

function checkBookingWindow(date) {
  const { maxAdvanceBookingDays } = clubConfigStore;
  const limit = maxBookingDate(maxAdvanceBookingDays);
  if (date && date > limit) {
    throw new Error(`Las reservas se pueden hacer con hasta ${maxAdvanceBookingDays} días de antelación (hasta el ${limit}).`);
  }
}

// Fecha y hora local (AAAA-MM-DD HH:MM), igual que la API.
const nowStamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Simulated delay helper
const delay = (ms = 150) => new Promise(res => setTimeout(res, ms));

export const courtsMock = {
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
export const courtTypesMock = {
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

export const stockMock = {
  async getAll() {
    await delay();
    return { data: stockStore };
  },
  async create(itemData) {
    await delay();
    const total = Number(itemData.totalStock) || 0;
    const inUse = Number(itemData.inUseStock) || 0;
    const available = Math.max(0, total - inUse);
    const newItem = {
      id: `stock-${Date.now()}`,
      name: itemData.name,
      category: itemData.category || 'Equipamiento',
      description: itemData.description || '',
      totalStock: total,
      availableStock: available,
      inUseStock: inUse,
      unit: itemData.unit || 'unidades',
      status: available <= 0 ? 'agotado' : 'disponible'
    };
    stockStore.push(newItem);
    return { data: newItem };
  },
  async update(itemId, updatedData) {
    await delay();
    const current = stockStore.find(i => i.id === itemId);
    const nextTotal = Number(updatedData.totalStock ?? current?.totalStock);
    const nextInUse = Number(updatedData.inUseStock ?? current?.inUseStock);
    if (current && nextTotal < nextInUse) {
      throw new Error(`El stock total no puede ser menor a lo que está prestado en canchas (${nextInUse}).`);
    }
    stockStore = stockStore.map(item => {
      if (item.id === itemId) {
        const total = Number(updatedData.totalStock !== undefined ? updatedData.totalStock : item.totalStock);
        const inUse = Number(updatedData.inUseStock !== undefined ? updatedData.inUseStock : item.inUseStock);
        const available = Math.max(0, total - inUse);
        return {
          ...item,
          ...updatedData,
          totalStock: total,
          inUseStock: inUse,
          availableStock: available,
          status: available <= 0 ? 'agotado' : 'disponible'
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
    const current = stockStore.find(i => i.id === itemId);
    if (current && totalStock < (Number(current.inUseStock) || 0)) {
      throw new Error(`El stock total no puede ser menor a lo que está prestado en canchas (${current.inUseStock}).`);
    }
    stockStore = stockStore.map(item => {
      if (item.id === itemId) {
        const available = Math.max(0, totalStock - item.inUseStock);
        return {
          ...item,
          totalStock,
          availableStock: available,
          status: available <= 0 ? 'agotado' : 'disponible'
        };
      }
      return item;
    });
    return { data: stockStore.find(i => i.id === itemId) };
  }
};

// ---- Pagos: pasarela simulada, misma regla que la API (payments.go) ----
// Solo tarjetas de prueba de Mercado Pago; el nombre del titular define el resultado.
const TEST_CARDS = [
  { number: '5031755734530604', brand: 'Mastercard', method: 'Tarjeta de Crédito', cvv: '123' },
  { number: '4509953566233704', brand: 'Visa', method: 'Tarjeta de Crédito', cvv: '123' },
  { number: '371180303257522', brand: 'American Express', method: 'Tarjeta de Crédito', cvv: '1234' },
  { number: '5287338310253304', brand: 'Mastercard', method: 'Tarjeta de Débito', cvv: '123' },
  { number: '4002768694395619', brand: 'Visa', method: 'Tarjeta de Débito', cvv: '123' }
];

const HOLDER_SCENARIOS = {
  OTHE: 'Pago rechazado por error general.',
  CALL: 'Pago rechazado: el titular tiene que autorizarlo con el emisor de la tarjeta.',
  FUND: 'Pago rechazado por saldo insuficiente.',
  SECU: 'Pago rechazado: el código de seguridad es inválido.',
  EXPI: 'Pago rechazado por un problema con la fecha de vencimiento.',
  FORM: 'Pago rechazado: los datos de la tarjeta son inválidos.',
  CONT: 'El pago quedó pendiente de acreditación y la operación no se confirma (RD01).'
};

let paymentsStore = [];

function authorizeCard(method, card = {}) {
  const number = String(card.number || '').replace(/\D/g, '');
  const test = TEST_CARDS.find(c => c.number === number);
  if (!test) {
    throw new Error('Solo se aceptan tarjetas de prueba (ficticias), por ejemplo Visa crédito 4509 9535 6623 3704 o Visa débito 4002 7686 9439 5619.');
  }
  if (test.method !== method) {
    throw new Error(`La tarjeta ingresada es ${test.method.replace('Tarjeta ', '').toLowerCase()}: elegí ${test.method} como medio de pago.`);
  }
  const holder = String(card.holder || '').trim().toUpperCase();
  if (!holder) throw new Error('Falta el nombre del titular de la tarjeta.');
  const [mm, yy] = String(card.expiry || '').split('/').map(v => Number(v.trim()));
  if (!mm || mm > 12 || Number.isNaN(yy)) throw new Error('El vencimiento de la tarjeta debe tener el formato MM/AA.');
  const year = yy < 100 ? 2000 + yy : yy;
  if (new Date() >= new Date(year, mm, 1)) throw new Error('Pago rechazado: la tarjeta está vencida.');
  if (String(card.cvv || '').replace(/\D/g, '') !== test.cvv) throw new Error(HOLDER_SCENARIOS.SECU);
  if (HOLDER_SCENARIOS[holder]) throw new Error(HOLDER_SCENARIOS[holder]);
  return { cardBrand: test.brand, cardLast4: number.slice(-4) };
}

export const paymentsMock = {
  async create({ paymentMethod, amount, concept, card } = {}) {
    await delay();
    const total = Math.round((Number(amount) || 0) * 100) / 100;
    if (total <= 0) throw new Error('El importe a pagar debe ser mayor a cero.');
    let cardData = {};
    if (paymentMethod === 'Tarjeta de Débito' || paymentMethod === 'Tarjeta de Crédito') {
      cardData = authorizeCard(paymentMethod, card);
    } else if (paymentMethod !== 'Mercado Pago (QR)') {
      throw new Error('El medio de pago debe ser Tarjeta de Débito, Tarjeta de Crédito o Mercado Pago (QR).');
    }
    let id;
    do { id = `MP-${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`; } while (paymentsStore.some(p => p.id === id));
    const tx = { id, status: 'approved', paymentMethod, amount: total, concept: concept || '', createdAt: new Date().toISOString(), usedBy: null, ...cardData };
    paymentsStore = [tx, ...paymentsStore];
    return tx;
  }
};

// Un pago aprobado se usa una sola vez y tiene que cubrir el importe a cobrar.
function consumePayment(transactionId, amount, ref) {
  if (!transactionId) throw new Error('Falta el pago: primero hay que abonar con tarjeta o billetera virtual (RD01).');
  const tx = paymentsStore.find(p => p.id === transactionId);
  if (!tx) throw new Error(`El pago ${transactionId} no existe.`);
  if (tx.status !== 'approved') throw new Error(`El pago ${transactionId} no está aprobado.`);
  if (tx.usedBy) throw new Error(`El pago ${transactionId} ya se usó en ${tx.usedBy}.`);
  if (Math.abs(tx.amount - amount) >= 0.01) throw new Error(`El pago ${transactionId} es por $${tx.amount} y el importe a cobrar es $${amount}.`);
  tx.usedBy = ref;
  tx.usedAt = new Date().toISOString();
  return tx;
}

const paymentFields = (tx) => ({
  paymentMethod: tx.paymentMethod,
  transactionId: tx.id,
  ...(tx.cardLast4 ? { cardBrand: tx.cardBrand, cardLast4: tx.cardLast4 } : {})
});

const nextReceiptId = () => {
  let id;
  do { id = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`; } while (receiptsStore.some(r => r.id === id));
  return id;
};

// ---- Reservas: mismas reglas que la API (business.go) ----
// pendiente de pago -> confirmada (seña) -> en juego (equipamiento fuera del stock) -> finalizada (saldo).
const MAX_RENTAL_HOURS = 2;

const EQUIPMENT = [
  { key: 'nets', category: 'Redes', label: 'redes' },
  { key: 'ballTubes', category: 'Pelotas', label: 'pelotas' },
  { key: 'rackets', category: 'Raquetas', label: 'raquetas' }
];

const equipmentFor = (playersType) => ({ nets: 1, ballTubes: 1, rackets: playersType === 'dobles' ? 4 : 2 });

const withStockLevels = (item, inUse) => {
  const available = Math.max(0, (Number(item.totalStock) || 0) - inUse);
  return { ...item, inUseStock: inUse, availableStock: available, status: available <= 0 ? 'agotado' : 'disponible' };
};

// No se alquila una cancha sin red, pelotas y raquetas disponibles (TC_001).
function checkEquipment(eq = {}) {
  const missing = EQUIPMENT.flatMap(({ key, category, label }) => {
    const have = stockStore.filter(i => i.category === category).reduce((acc, i) => acc + (Number(i.availableStock) || 0), 0);
    return have < (eq[key] || 0) ? [`${label} (hay ${have}, se necesitan ${eq[key]})`] : [];
  });
  if (missing.length) throw new Error(`No hay stock suficiente para el alquiler: faltan ${missing.join(', ')}.`);
}

function takeEquipment(eq = {}) {
  checkEquipment(eq);
  const taken = [];
  for (const { key, category } of EQUIPMENT) {
    let need = eq[key] || 0;
    stockStore = stockStore.map(item => {
      if (need <= 0 || item.category !== category || item.availableStock <= 0) return item;
      const qty = Math.min(need, item.availableStock);
      need -= qty;
      taken.push({ itemId: item.id, category, quantity: qty });
      return withStockLevels(item, (Number(item.inUseStock) || 0) + qty);
    });
  }
  return taken;
}

function returnEquipment(taken = []) {
  for (const t of taken) {
    stockStore = stockStore.map(item =>
      item.id === t.itemId ? withStockLevels(item, Math.max(0, (Number(item.inUseStock) || 0) - t.quantity)) : item
    );
  }
}

const addHours = (start, hours) => {
  const [h, m] = String(start).split(':').map(Number);
  const total = h * 60 + (m || 0) + Math.round(hours * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

function checkSchedule(date, startTime, hours) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('La fecha de la reserva no es válida (formato AAAA-MM-DD).');
  if (!/^\d{1,2}:\d{2}$/.test(startTime || '')) throw new Error('El horario de inicio no es válido (formato HH:MM).');
  if (!(hours > 0 && hours <= MAX_RENTAL_HOURS)) throw new Error(`La duración de un alquiler es de hasta ${MAX_RENTAL_HOURS} horas.`);
  if (date < maxBookingDate(0)) throw new Error('La fecha de la reserva ya pasó.');
  if (calculateHoursUntil(date, startTime) <= 0) throw new Error('El horario de la reserva ya pasó.');
  checkBookingWindow(date);
}

function checkParticipants(res, court) {
  const want = res.playersType === 'singles' ? 2 : res.playersType === 'dobles' ? 4 : 0;
  if (!want) throw new Error('La modalidad debe ser singles (2 jugadores) o dobles (4 jugadores).');
  const players = res.participants || [];
  if (players.length !== want) throw new Error(`Una reserva de ${res.playersType} lleva los datos de ${want} jugadores (se cargaron ${players.length}).`);
  const seen = new Set();
  players.forEach((p, i) => {
    const dni = cleanDNI(p.dni || '');
    if (!String(p.name || '').trim() || !dni) throw new Error(`Falta el nombre o el DNI del jugador ${i + 1}.`);
    if (seen.has(dni)) throw new Error(`El DNI ${p.dni} está repetido entre los jugadores.`);
    seen.add(dni);
  });
  if (court?.capacity && want > court.capacity) throw new Error(`${court.name} admite hasta ${court.capacity} jugadores.`);
}

function checkCourt(res) {
  const court = courtsStore.find(c => c.id === res.courtId);
  if (!court) throw new Error('Falta elegir la cancha.');
  if (court.status === 'mantenimiento') throw new Error('La cancha está bloqueada por mantenimiento y no admite reservas (RD06).');
  return court;
}

// Costo con la tarifa de la cancha y seña del 50 %; una reserva confirmada conserva la seña pagada.
function setCosts(res, court) {
  const courtCost = (Number(court.pricePerHour) || 0) * res.durationHours;
  let deposit = Number(res.depositPaid) || 0;
  res.courtCost = courtCost;
  res.equipmentCost = 0;
  res.totalCost = courtCost;
  if (res.status === 'pendiente_pago') {
    deposit = Math.round(courtCost / 2);
    res.depositAmount = deposit;
  }
  res.remainingBalance = Math.max(0, courtCost - deposit);
}

const rentalLine = (res) => `Alquiler ${res.durationHours} hs - ${res.courtName} - ${res.date} de ${res.startTime} a ${res.endTime}`;

function addReservationReceipt(res, tx, concept, cashierName, items, total) {
  const lead = res.participants?.[0] || {};
  const receipt = {
    id: nextReceiptId(),
    reservationId: res.id,
    clientName: lead.name || 'Socio Tenis Ahora',
    clientDni: lead.dni || '00.000.000',
    concept,
    items,
    totalPaid: total,
    status: 'completado',
    date: nowStamp(),
    cashierName,
    ...paymentFields(tx)
  };
  receiptsStore.unshift(receipt);
  return receipt;
}

const RESERVATION_READ_ONLY = [
  'status', 'depositAmount', 'depositPaid', 'depositPaymentMethod', 'depositTransactionId', 'depositReceiptNumber',
  'remainingPaid', 'finalReceiptNumber', 'finalPaymentMethod', 'finalTransactionId', 'cancellationDetails',
  'equipmentAssigned', 'equipmentTaken', 'courtName', 'surfaceType', 'courtCost', 'equipmentCost', 'totalCost',
  'remainingBalance', 'endTime', 'createdAt', 'confirmedAt', 'startedAt', 'finishedAt'
];

function findReservation(reservationId) {
  const res = reservationsStore.find(r => r.id === reservationId);
  if (!res) throw new Error(`No existe la reserva ${reservationId}.`);
  return res;
}

function saveReservation(next) {
  reservationsStore = reservationsStore.map(r => (r.id === next.id ? next : r));
  return next;
}

export const reservationsMock = {
  async getAll() {
    await delay();
    return { data: reservationsStore };
  },
  async getOccupancy() {
    await delay();
    return { data: reservationsStore.filter(r => r.status !== 'cancelada') };
  },
  // RF020: la reserva queda pendiente de pago hasta abonar la seña (RD01).
  async create(bookingData) {
    await delay();
    const res = {
      courtId: bookingData.courtId,
      date: bookingData.date,
      startTime: bookingData.startTime,
      durationHours: Number(bookingData.durationHours) || 0,
      playersType: bookingData.playersType,
      participants: bookingData.participants || [],
      notes: bookingData.notes || ''
    };
    checkSchedule(res.date, res.startTime, res.durationHours);
    res.endTime = addHours(res.startTime, res.durationHours);
    const court = checkCourt(res);
    const blockReason = getSlotBlock(court, res.date, `${res.startTime} - ${res.endTime}`);
    if (blockReason) throw new Error(`La cancha no admite reservas en ese turno: ${blockReason} (RD06).`);
    checkParticipants(res, court);
    checkReservationConflict(res);
    res.equipmentAssigned = equipmentFor(res.playersType);
    checkEquipment(res.equipmentAssigned);

    let n = reservationsStore.length + 1;
    const idFor = (k) => `RES-${new Date().getFullYear()}-${String(k).padStart(3, '0')}`;
    while (reservationsStore.some(r => r.id === idFor(n))) n++;
    Object.assign(res, {
      id: idFor(n),
      courtName: `${court.name} (${court.surfaceType})`,
      surfaceType: court.surfaceType,
      status: 'pendiente_pago',
      depositPaid: 0,
      depositReceiptNumber: null,
      remainingPaid: false,
      finalReceiptNumber: null,
      cancellationDetails: null,
      createdAt: new Date().toISOString()
    });
    setCosts(res, court);
    reservationsStore.unshift(res);
    return { data: res };
  },
  // Seña del 50 %: confirma la reserva y emite el recibo (RD01).
  async payDeposit(reservationId, transactionId) {
    await delay();
    const res = findReservation(reservationId);
    if (res.status === 'cancelada') throw new Error('La reserva está cancelada.');
    if (res.status !== 'pendiente_pago') throw new Error('La seña de esta reserva ya fue abonada.');
    checkEquipment(res.equipmentAssigned);
    const tx = consumePayment(transactionId, res.depositAmount, `reservas/${res.id}`);
    const receipt = addReservationReceipt(res, tx, `Seña 50 % - ${res.courtName}`, 'Cobro digital online', [
      { description: rentalLine(res), amount: res.courtCost },
      { description: 'Equipamiento incluido (red, pelotas y raquetas)', amount: 0 },
      { description: 'Total del turno', amount: res.totalCost },
      { description: 'Seña 50 % para confirmar la reserva', amount: res.depositAmount }
    ], res.depositAmount);
    const next = saveReservation({
      ...res,
      status: 'confirmada',
      depositPaid: res.depositAmount,
      depositPaymentMethod: tx.paymentMethod,
      depositTransactionId: tx.id,
      depositReceiptNumber: receipt.id,
      confirmedAt: new Date().toISOString()
    });
    return { data: next, receipt };
  },
  // Inicio del alquiler: descuenta el equipamiento del stock (TC_002).
  async startRental(reservationId) {
    await delay();
    const res = findReservation(reservationId);
    if (res.status === 'pendiente_pago') throw new Error('La reserva no tiene la seña abonada: no está confirmada (RD01).');
    if (res.status !== 'confirmada') throw new Error('Solo se inicia el alquiler de una reserva confirmada.');
    if (courtsStore.find(c => c.id === res.courtId)?.status === 'mantenimiento') {
      throw new Error('La cancha está bloqueada por mantenimiento (RD06).');
    }
    const taken = takeEquipment(res.equipmentAssigned);
    return { data: saveReservation({ ...res, status: 'en_juego', equipmentTaken: taken, startedAt: new Date().toISOString() }) };
  },
  // Fin del alquiler: cobra el saldo, emite el recibo final y devuelve el equipamiento (TC_002).
  async payRemainingBalance(reservationId, transactionId) {
    await delay();
    const res = findReservation(reservationId);
    if (res.status === 'finalizada') throw new Error('El saldo de esta reserva ya fue liquidado.');
    if (res.status === 'cancelada') throw new Error('La reserva está cancelada.');
    if (res.status !== 'en_juego') throw new Error('Primero hay que registrar el inicio del alquiler.');
    const tx = consumePayment(transactionId, res.remainingBalance, `reservas/${res.id}`);
    returnEquipment(res.equipmentTaken);
    const receipt = addReservationReceipt(res, tx, `Saldo 50 % - ${res.courtName}`, 'Recepción del club', [
      { description: rentalLine(res), amount: res.totalCost },
      { description: `Seña abonada (recibo ${res.depositReceiptNumber})`, amount: res.depositPaid },
      { description: 'Saldo restante al finalizar el partido', amount: res.remainingBalance }
    ], res.remainingBalance);
    const next = saveReservation({
      ...res,
      status: 'finalizada',
      remainingPaid: true,
      finalPaymentMethod: tx.paymentMethod,
      finalTransactionId: tx.id,
      finalReceiptNumber: receipt.id,
      finishedAt: new Date().toISOString()
    });
    return { data: next, receipt };
  },
  // RF021: modificar reserva (fecha, horario, cancha, jugadores) antes de jugarse
  async update(reservationId, updatedData) {
    await delay();
    const current = findReservation(reservationId);
    if (current.status !== 'pendiente_pago' && current.status !== 'confirmada') {
      throw new Error('Solo se modifican reservas pendientes de pago o confirmadas.');
    }
    const patch = { ...updatedData };
    RESERVATION_READ_ONLY.forEach(k => delete patch[k]);
    const changed = (...keys) => keys.some(k => k in patch && JSON.stringify(patch[k]) !== JSON.stringify(current[k]));
    const next = { ...current, ...patch };
    const scheduleChanged = changed('date', 'startTime', 'durationHours');
    const courtChanged = changed('courtId');
    const playersChanged = changed('participants', 'playersType');
    if (scheduleChanged) {
      next.durationHours = Number(next.durationHours) || 0;
      checkSchedule(next.date, next.startTime, next.durationHours);
      next.endTime = addHours(next.startTime, next.durationHours);
    }
    const court = courtsStore.find(c => c.id === next.courtId);
    if (!court) throw new Error(`La cancha ${next.courtId} no existe.`);
    if (scheduleChanged || courtChanged) {
      checkCourt(next);
      const blockReason = getSlotBlock(court, next.date, `${next.startTime} - ${next.endTime}`);
      if (blockReason) throw new Error(`La cancha no admite reservas en ese turno: ${blockReason} (RD06).`);
    }
    if (playersChanged || courtChanged) {
      checkParticipants(next, court);
      next.equipmentAssigned = equipmentFor(next.playersType);
    }
    if (scheduleChanged || courtChanged || playersChanged) checkReservationConflict(next, reservationId);
    if (courtChanged) {
      next.courtName = `${court.name} (${court.surfaceType})`;
      next.surfaceType = court.surfaceType;
    }
    if (courtChanged || scheduleChanged) setCosts(next, court);
    next.updatedAt = new Date().toISOString();
    return { data: saveReservation(next) };
  },
  // RF023: eliminar reserva del registro
  async delete(reservationId) {
    await delay();
    if (reservationsStore.find(r => r.id === reservationId)?.status === 'en_juego') {
      throw new Error('No se puede eliminar una reserva en juego: primero hay que finalizar el alquiler.');
    }
    reservationsStore = reservationsStore.filter(r => r.id !== reservationId);
    return { success: true };
  },
  async cancel(reservationId) {
    await delay();
    // RD02/RD03/RD04: con la antelación mínima del club corresponde reembolso; fuera de plazo se
    // aplica un cargo (retención de la seña). Las horas salen del inicio de la reserva, como en la API.
    // Una reserva pendiente de pago se anula sin cargo porque no se abonó nada.
    const { freeCancellationHours, lateCancellationRetentionPercent } = clubConfigStore;
    const target = findReservation(reservationId);
    if (target.status === 'cancelada') throw new Error('La reserva ya está cancelada.');
    if (target.status !== 'pendiente_pago' && target.status !== 'confirmada') {
      throw new Error('No se puede cancelar una reserva en juego o finalizada.');
    }
    const hoursInAdvance = Math.round(calculateHoursUntil(target.date, target.startTime) * 10) / 10;
    if (target.status === 'pendiente_pago') {
      const cancelled = saveReservation({
        ...target,
        status: 'cancelada',
        cancellationDetails: { cancelledAt: new Date().toISOString(), hoursInAdvance, policyApplied: 'Reserva sin seña abonada: se anula sin cargo ni reembolso.' }
      });
      return { data: cancelled, isWithinFreeWindow: true, refund: null, penaltyReceipt: null };
    }
    const isWithinFreeWindow = hoursInAdvance >= freeCancellationHours;
    const cancelledRes = saveReservation({
      ...target,
      status: 'cancelada',
      cancellationDetails: {
        cancelledAt: new Date().toISOString(),
        hoursInAdvance,
        policyApplied: isWithinFreeWindow
          ? `Cancelación anticipada (>=${freeCancellationHours}hs): Reembolso de seña según política.`
          : `Cancelación tardía (<${freeCancellationHours}hs): Se aplica retención del ${lateCancellationRetentionPercent}% de seña por costo operativo.`
      }
    });

    let refund = null;
    let penaltyReceipt = null;
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
        date: nowStamp(),
        processedBy: 'Sistema de Reservas'
      };
    } else {
      const retained = Math.round(deposit * lateCancellationRetentionPercent / 100);
      penaltyReceipt = {
        id: nextReceiptId(),
        reservationId: cancelledRes.id,
        clientName: lead.name || 'Socio Tenis Ahora',
        clientDni: lead.dni || '00.000.000',
        concept: `Cargo por cancelación fuera de plazo - ${cancelledRes.courtName}`,
        items: [
          { description: `Seña abonada (${cancelledRes.id})`, amount: deposit },
          { description: `Retención ${lateCancellationRetentionPercent}% por cancelación con menos de ${freeCancellationHours} hs`, amount: retained },
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
        reason: `Cancelación fuera de plazo (${hoursInAdvance} hs). Se retiene el ${lateCancellationRetentionPercent}% de la seña y se reintegra el resto.`,
        refundType: 'parcial',
        originalAmount: deposit,
        refundAmount: deposit - retained,
        refundMethod: 'Crédito en cuenta de socio',
        date: nowStamp(),
        processedBy: 'Sistema de Reservas'
      };
    }
    refundsStore.unshift(refund);

    return { data: cancelledRes, isWithinFreeWindow, refund, penaltyReceipt };
  }
};

export const tournamentsMock = {
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
  async updateInternalRules(trnId, internalRules, internalRulesDocument) {
    await delay();
    tournamentsStore = tournamentsStore.map(t =>
      t.id === trnId ? applyRules(t, internalRules, internalRulesDocument) : t
    );
    return { data: tournamentsStore.find(t => t.id === trnId) };
  },
  async enroll(trnId, participantData) {
    await delay();
    const trn = tournamentsStore.find(t => t.id === trnId);
    if (!trn) throw new Error('El torneo no existe.');
    if (isEnrolledByDni(trn.participants, participantData.dni) || isEnrolledByDni(trn.participants, participantData.partnerDni)) {
      throw new Error('Ya hay una inscripción a este torneo con ese DNI.');
    }
    if ((trn.participants || []).length >= (Number(trn.maxParticipants) || Infinity)) {
      throw new Error('El torneo no tiene cupos disponibles.');
    }
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
export const competitionTypesMock = {
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

export const leaguesMock = {
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
  async updateInternalRules(leagueId, internalRules, internalRulesDocument) {
    await delay();
    leaguesStore = leaguesStore.map(l =>
      l.id === leagueId ? applyRules(l, internalRules, internalRulesDocument) : l
    );
    return { data: leaguesStore.find(l => l.id === leagueId) };
  },
  async enroll(leagueId, participantData) {
    await delay();
    const league = leaguesStore.find(l => l.id === leagueId);
    if (!league) throw new Error('La liga no existe.');
    if (isEnrolledByDni(league.participants, participantData.dni) || isEnrolledByDni(league.participants, participantData.partnerDni)) {
      throw new Error('Ya hay una inscripción a esta liga con ese DNI.');
    }
    if ((league.participants || []).length >= (Number(league.maxParticipants) || Infinity)) {
      throw new Error('La liga no tiene cupos disponibles.');
    }
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

export const coachesAndClassesMock = {
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
      licenseDetails: normalizeLicense(coachData.licenseDetails)
    };
    coachesStore.push(newCoach);
    return { data: newCoach };
  },
  async updateCoach(coachId, updatedData) {
    await delay();
    const patch = updatedData.licenseDetails
      ? { ...updatedData, licenseDetails: normalizeLicense(updatedData.licenseDetails), hasOfficialLicense: true }
      : updatedData;
    coachesStore = coachesStore.map(c =>
      c.id === coachId ? { ...c, ...patch } : c
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
      c.id === coachId ? { ...c, licenseDetails: normalizeLicense({ ...c.licenseDetails, ...licenseDetails }), hasOfficialLicense: true } : c
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
    checkCoachQualified(classData.coachId);
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
    const currentClass = classesStore.find(c => c.id === classId);
    if (currentClass && updatedData.coachId && updatedData.coachId !== currentClass.coachId) {
      checkCoachQualified(updatedData.coachId);
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
    const cycle = { 'P': 'A', 'A': 'P', '-': 'P' };
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
  async enrollStudent(classId, studentData) {
    await delay();
    const targetClass = classesStore.find(c => c.id === classId);
    if (!targetClass) throw new Error('Clase no encontrada.');
    const capacity = Math.min(Number(targetClass.maxCapacity) || 30, 30);
    if ((targetClass.students?.length || 0) >= capacity) {
      throw new Error(`No es posible agregar más alumnos: el cupo de ${capacity} está completo.`);
    }
    if (isEnrolledByDni(targetClass.students, studentData.dni)) {
      throw new Error(`Ya hay un alumno inscripto en "${targetClass.name}" con ese DNI.`);
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
    checkCoachQualified(data.coachId);
    checkPrivateLessonConflict(data);
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
    const current = privateClassesStore.find(p => p.id === id);
    if (current && updatedData.coachId && updatedData.coachId !== current.coachId) {
      checkCoachQualified(updatedData.coachId);
    }
    if (current && (updatedData.status || current.status) !== 'cancelada') {
      checkPrivateLessonConflict({ ...current, ...updatedData, excludeId: id });
    }
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

export const receiptsMock = {
  async getAll() {
    await delay();
    return { data: receiptsStore };
  },
  async getDiscounts() {
    await delay();
    return { data: discountsStore };
  },
  // Todo recibo corresponde a un cobro electrónico aprobado (RD11).
  async create(receiptData) {
    await delay();
    if (!(Number(receiptData.totalPaid) > 0)) throw new Error('El importe del recibo debe ser mayor a cero.');
    const id = receiptsStore.some(r => r.id === receiptData.id) ? nextReceiptId() : receiptData.id;
    const tx = consumePayment(receiptData.transactionId, Number(receiptData.totalPaid), `recibos/${id}`);
    const receipt = { ...receiptData, id, ...paymentFields(tx) };
    receiptsStore = [receipt, ...receiptsStore];
    return { data: receipt };
  }
};

// ---- Documentos adjuntos (RF041, RF048, RD08) ----
export const documentsMock = {
  async upload(file) {
    checkFile(file);
    const data = await fileToBase64(file);
    await delay();
    const stored = { id: `doc-${Date.now()}`, name: file.name, mimeType: file.type, size: file.size, data };
    documentsStore = [stored, ...documentsStore];
    return { data: documentRef(stored) };
  },
  async download(ref) {
    await delay();
    const stored = documentsStore.find(d => d.id === ref?.id);
    if (!stored) throw new Error('El documento no existe.');
    const bytes = Uint8Array.from(atob(stored.data), ch => ch.charCodeAt(0));
    saveBlob(new Blob([bytes], { type: stored.mimeType }), stored.name);
  }
};

// ---- Configuración del club (RD02 - RD05): solo consulta ----
export const clubConfigMock = {
  async get() {
    await delay();
    return { data: clubConfigStore };
  }
};

// ---- Descuentos (RF138 - RF142) ----
export const discountsMock = {
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
export const invoicesMock = {
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
    const seq = String(412 + invoicesStore.length + 1).padStart(8, '0');
    const newInvoice = {
      id: `FC-0001-${seq}`,
      clientName: invoiceData.clientName,
      clientDni: invoiceData.clientDni,
      clientAddress: invoiceData.clientAddress || '',
      concept: invoiceData.concept || items[0]?.description || 'Servicios del club',
      items,
      subtotal,
      total: subtotal,
      paymentMethod: invoiceData.paymentMethod || 'Tarjeta de Débito',
      relatedReceiptId: invoiceData.relatedReceiptId || null,
      status: 'emitida',
      date: nowStamp(),
      issuedBy: invoiceData.issuedBy || 'Administración General'
    };
    invoicesStore = [newInvoice, ...invoicesStore];
    return { data: newInvoice };
  }
};

// ---- Reembolsos (RF131 - RF133) ----
export const refundsMock = {
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
      date: nowStamp(),
      processedBy: refundData.processedBy || 'Administración General'
    };
    refundsStore = [newRefund, ...refundsStore];
    return { data: newRefund };
  }
};

export const usersMock = {
  async getAll() {
    await delay();
    return { data: usersStore };
  },
  async getMembers() {
    await delay();
    return {
      data: usersStore
        .filter(u => u.role === 'client')
        .map(({ id, name, dni, memberNumber }) => ({ id, name, dni, memberNumber }))
    };
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
