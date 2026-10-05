/**
 * Comprehensive Mock Data for "Tenis Ahora"
 * Covers all requirements from TP Integral
 */

export const INITIAL_COURTS = [
  {
    id: 'cancha-1',
    name: 'Cancha 1 - Guillermo Vilas',
    surfaceType: 'Ladrillo', // Ladrillo, Cemento, Pasto
    surfaceColor: 'bg-orange-50 text-orange-800 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-800',
    capacity: 4, // 2 o 4 personas
    pricePerHour: 4800,
    status: 'disponible', // disponible, ocupada, mantenimiento
    description: 'Polvo de ladrillo profesional con drenaje rápido.',
    maintenanceNotes: '',
    photo: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
    schedule: [
      { time: '08:00 - 09:00', status: 'libre' },
      { time: '09:00 - 10:00', status: 'libre' },
      { time: '10:00 - 11:00', status: 'reservado', reservedBy: 'Federico Gómez' },
      { time: '11:00 - 12:00', status: 'reservado', reservedBy: 'Federico Gómez' },
      { time: '14:00 - 15:00', status: 'libre' },
      { time: '15:00 - 16:00', status: 'libre' },
      { time: '16:00 - 17:00', status: 'reservado', reservedBy: 'Martín Palermo' },
      { time: '17:00 - 18:00', status: 'libre' },
      { time: '18:00 - 19:00', status: 'libre' },
      { time: '19:00 - 20:00', status: 'libre' },
      { time: '20:00 - 21:00', status: 'libre' }
    ]
  },
  {
    id: 'cancha-2',
    name: 'Cancha 2 - Gabriela Sabatini',
    surfaceType: 'Ladrillo',
    surfaceColor: 'bg-orange-50 text-orange-800 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-800',
    capacity: 4,
    pricePerHour: 4800,
    status: 'disponible',
    description: 'Polvo de ladrillo tradicional ideal para singles y dobles de alta competencia.',
    maintenanceNotes: '',
    photo: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=600&q=80',
    schedule: [
      { time: '08:00 - 09:00', status: 'libre' },
      { time: '09:00 - 10:00', status: 'libre' },
      { time: '10:00 - 11:00', status: 'libre' },
      { time: '11:00 - 12:00', status: 'libre' },
      { time: '14:00 - 15:00', status: 'reservado', reservedBy: 'Lucía Benítez' },
      { time: '15:00 - 16:00', status: 'reservado', reservedBy: 'Lucía Benítez' },
      { time: '16:00 - 17:00', status: 'libre' },
      { time: '17:00 - 18:00', status: 'libre' },
      { time: '18:00 - 19:00', status: 'libre' },
      { time: '19:00 - 20:00', status: 'libre' },
      { time: '20:00 - 21:00', status: 'libre' }
    ]
  },
  {
    id: 'cancha-3',
    name: 'Cancha 3 - Juan Martín del Potro',
    surfaceType: 'Cemento', // Hard court
    surfaceColor: 'bg-sky-50 text-sky-800 border-sky-200',
    badgeColor: 'bg-sky-100 text-sky-800',
    capacity: 4,
    pricePerHour: 4500,
    status: 'disponible',
    description: 'Superficie dura acrílica tipo US Open, bote rápido y uniforme.',
    maintenanceNotes: '',
    photo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=600&q=80',
    schedule: [
      { time: '08:00 - 09:00', status: 'libre' },
      { time: '09:00 - 10:00', status: 'libre' },
      { time: '10:00 - 11:00', status: 'libre' },
      { time: '11:00 - 12:00', status: 'libre' },
      { time: '14:00 - 15:00', status: 'libre' },
      { time: '15:00 - 16:00', status: 'libre' },
      { time: '16:00 - 17:00', status: 'libre' },
      { time: '17:00 - 18:00', status: 'libre' },
      { time: '18:00 - 19:00', status: 'reservado', reservedBy: 'Torneo Apertura Masculino' },
      { time: '19:00 - 20:00', status: 'reservado', reservedBy: 'Torneo Apertura Masculino' },
      { time: '20:00 - 21:00', status: 'libre' }
    ]
  },
  {
    id: 'cancha-4',
    name: 'Cancha 4 - David Nalbandian',
    surfaceType: 'Cemento',
    surfaceColor: 'bg-sky-50 text-sky-800 border-sky-200',
    badgeColor: 'bg-sky-100 text-sky-800',
    capacity: 2, // Singles
    pricePerHour: 4200,
    status: 'mantenimiento',
    description: 'Cancha rápida para singles. Actualmente en repintado de líneas reglamentarias.',
    maintenanceNotes: 'Repintado de superficie y nivelación de postes hasta 28/08.',
    photo: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?auto=format&fit=crop&w=600&q=80',
    schedule: [
      { time: '08:00 - 09:00', status: 'mantenimiento' },
      { time: '09:00 - 10:00', status: 'mantenimiento' },
      { time: '10:00 - 11:00', status: 'mantenimiento' },
      { time: '11:00 - 12:00', status: 'mantenimiento' },
      { time: '14:00 - 15:00', status: 'mantenimiento' },
      { time: '15:00 - 16:00', status: 'mantenimiento' },
      { time: '16:00 - 17:00', status: 'mantenimiento' },
      { time: '17:00 - 18:00', status: 'mantenimiento' },
      { time: '18:00 - 19:00', status: 'mantenimiento' },
      { time: '19:00 - 20:00', status: 'mantenimiento' },
      { time: '20:00 - 21:00', status: 'mantenimiento' }
    ]
  },
  {
    id: 'cancha-5',
    name: 'Cancha 5 - Wimbledon Grass Court',
    surfaceType: 'Pasto', // Grass
    surfaceColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    capacity: 4,
    pricePerHour: 5500,
    status: 'disponible',
    description: 'Césped natural de competición, corte rasante y superficie premium.',
    maintenanceNotes: '',
    photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    schedule: [
      { time: '08:00 - 09:00', status: 'libre' },
      { time: '09:00 - 10:00', status: 'libre' },
      { time: '10:00 - 11:00', status: 'libre' },
      { time: '11:00 - 12:00', status: 'libre' },
      { time: '14:00 - 15:00', status: 'libre' },
      { time: '15:00 - 16:00', status: 'libre' },
      { time: '16:00 - 17:00', status: 'libre' },
      { time: '17:00 - 18:00', status: 'reservado', reservedBy: 'Clase Particular - Prof. Álvarez' },
      { time: '18:00 - 19:00', status: 'libre' },
      { time: '19:00 - 20:00', status: 'libre' },
      { time: '20:00 - 21:00', status: 'libre' }
    ]
  }
];

export const INITIAL_STOCK = [
  {
    id: 'item-redes',
    name: 'Redes de Tenis',
    category: 'Redes',
    totalStock: 10,
    inUseStock: 4,
    availableStock: 6,
    unit: 'unidades',
    itemPrice: 0, // RD06: Sin costo extra para la reserva de canchas
    minAlertThreshold: 2,
    status: 'normal',
    description: 'Redes reglamentarias de tenis (se asigna 1 por cancha reservada).'
  },
  {
    id: 'item-pelotas',
    name: 'Pelotas de Tenis',
    category: 'Pelotas',
    totalStock: 60,
    inUseStock: 20,
    availableStock: 40,
    unit: 'pelotas',
    itemPrice: 0, // RD06: Sin costo extra para la reserva de canchas
    minAlertThreshold: 10,
    status: 'normal',
    description: 'Pelotas reglamentarias presurizadas asignadas para el uso en cancha.'
  },
  {
    id: 'item-raquetas',
    name: 'Raquetas de Tenis',
    category: 'Raquetas',
    totalStock: 24,
    inUseStock: 8,
    availableStock: 16,
    unit: 'raquetas',
    itemPrice: 0, // RD06: Sin costo extra para la reserva de canchas
    minAlertThreshold: 4,
    status: 'normal',
    description: 'Raquetas reglamentarias para los participantes del partido.'
  }
];

export const INITIAL_RESERVATIONS = [
  {
    id: 'RES-2026-001',
    courtId: 'cancha-1',
    courtName: 'Cancha 1 - Guillermo Vilas (Ladrillo)',
    surfaceType: 'Ladrillo',
    date: '2026-08-26',
    startTime: '10:00',
    endTime: '12:00',
    durationHours: 2,
    playersType: 'dobles', // singles (2) o dobles (4)
    participants: [
      { name: 'Federico Gómez', dni: '38.452.129', phone: '11-4892-1234', isLead: true },
      { name: 'Mariano Zabaleta', dni: '35.123.890', phone: '11-4455-6677' },
      { name: 'Gastón Gaudio', dni: '33.987.654', phone: '11-2233-4455' },
      { name: 'Juan Ignacio Chela', dni: '34.567.890', phone: '11-9988-7766' }
    ],
    equipmentAssigned: {
      nets: 1,
      ballTubes: 1,
      rackets: 4
    },
    courtCost: 9600, // 4800 x 2hs
    equipmentCost: 0, // RD06: Sin costo extra
    totalCost: 9600,
    depositPaid: 4800, // 50% de seña
    depositReceiptNumber: 'REC-50-8910',
    depositPaymentMethod: 'Mercado Pago (QR)',
    remainingBalance: 4800, // 50% al finalizar
    remainingPaid: false,
    finalReceiptNumber: null,
    status: 'confirmada', // confirmada, en_curso, finalizada, cancelada
    createdAt: '2026-08-20T14:30:00Z',
    cancellationDetails: null
  },
  {
    id: 'RES-2026-002',
    courtId: 'cancha-2',
    courtName: 'Cancha 2 - Gabriela Sabatini (Ladrillo)',
    surfaceType: 'Ladrillo',
    date: '2026-08-26',
    startTime: '14:00',
    endTime: '16:00',
    durationHours: 2,
    playersType: 'singles',
    participants: [
      { name: 'Lucía Benítez', dni: '40.112.334', phone: '11-6677-8899', isLead: true },
      { name: 'Camila Osorio', dni: '41.223.445', phone: '11-3322-1100' }
    ],
    equipmentAssigned: {
      nets: 1,
      ballTubes: 1,
      rackets: 2
    },
    courtCost: 9600,
    equipmentCost: 0,
    totalCost: 9600,
    depositPaid: 4800,
    depositReceiptNumber: 'REC-50-8912',
    depositPaymentMethod: 'Tarjeta de Débito',
    remainingBalance: 4800,
    remainingPaid: false,
    finalReceiptNumber: null,
    status: 'confirmada',
    createdAt: '2026-08-22T09:15:00Z',
    cancellationDetails: null
  },
  {
    id: 'RES-2026-003',
    courtId: 'cancha-5',
    courtName: 'Cancha 5 - Wimbledon Grass Court (Pasto)',
    surfaceType: 'Pasto',
    date: '2026-08-25',
    startTime: '16:00',
    endTime: '18:00',
    durationHours: 2,
    playersType: 'singles',
    participants: [
      { name: 'Carlos Alcaraz', dni: '95.441.228', phone: '11-5544-3322', isLead: true },
      { name: 'Jannik Sinner', dni: '95.882.119', phone: '11-2211-9988' }
    ],
    equipmentAssigned: {
      nets: 1,
      ballTubes: 1,
      rackets: 2
    },
    courtCost: 11000,
    equipmentCost: 0,
    totalCost: 11000,
    depositPaid: 5500,
    depositReceiptNumber: 'REC-50-8870',
    depositPaymentMethod: 'Tarjeta de Crédito',
    remainingBalance: 0,
    remainingPaid: true,
    finalReceiptNumber: 'REC-FINAL-8875',
    status: 'finalizada',
    createdAt: '2026-08-18T10:00:00Z',
    cancellationDetails: null
  },
  {
    id: 'RES-2026-004',
    courtId: 'cancha-3',
    courtName: 'Cancha 3 - David Nalbandian (Cemento)',
    surfaceType: 'Cemento',
    date: '2026-08-27',
    startTime: '09:00',
    endTime: '11:00',
    durationHours: 2,
    playersType: 'singles',
    participants: [
      { name: 'David Nalbandian', dni: '31.223.990', phone: '11-4433-2211', isLead: true },
      { name: 'Juan Mónaco', dni: '32.445.667', phone: '11-5566-7788' }
    ],
    equipmentAssigned: { nets: 1, ballTubes: 1, rackets: 2 },
    courtCost: 9600,
    equipmentCost: 0,
    totalCost: 9600,
    depositPaid: 4800,
    depositReceiptNumber: 'REC-50-8915',
    depositPaymentMethod: 'Mercado Pago (QR)',
    remainingBalance: 4800,
    remainingPaid: false,
    finalReceiptNumber: null,
    status: 'confirmada',
    createdAt: '2026-08-23T11:00:00Z',
    cancellationDetails: null
  },
  {
    id: 'RES-2026-005',
    courtId: 'cancha-4',
    courtName: 'Cancha 4 - Juan Martín del Potro (Cemento)',
    surfaceType: 'Cemento',
    date: '2026-08-27',
    startTime: '16:00',
    endTime: '18:00',
    durationHours: 2,
    playersType: 'dobles',
    participants: [
      { name: 'Diego Schwartzman', dni: '36.889.001', phone: '11-7788-9900', isLead: true },
      { name: 'Francisco Cerúndolo', dni: '42.112.909', phone: '11-3344-5566' },
      { name: 'Tomás Etcheverry', dni: '41.900.223', phone: '11-8899-0011' },
      { name: 'Sebastián Báez', dni: '43.200.114', phone: '11-6677-8800' }
    ],
    equipmentAssigned: { nets: 1, ballTubes: 2, rackets: 4 },
    courtCost: 9600,
    equipmentCost: 0,
    totalCost: 9600,
    depositPaid: 4800,
    depositReceiptNumber: 'REC-50-8918',
    depositPaymentMethod: 'Tarjeta de Débito',
    remainingBalance: 4800,
    remainingPaid: false,
    finalReceiptNumber: null,
    status: 'confirmada',
    createdAt: '2026-08-24T15:20:00Z',
    cancellationDetails: null
  },
  {
    id: 'RES-2026-006',
    courtId: 'cancha-1',
    courtName: 'Cancha 1 - Guillermo Vilas (Ladrillo)',
    surfaceType: 'Ladrillo',
    date: '2026-08-28',
    startTime: '18:00',
    endTime: '20:00',
    durationHours: 2,
    playersType: 'singles',
    participants: [
      { name: 'Guillermo Coria', dni: '32.119.882', phone: '11-9900-1122', isLead: true },
      { name: 'Gastón Gaudio', dni: '33.987.654', phone: '11-2233-4455' }
    ],
    equipmentAssigned: { nets: 1, ballTubes: 1, rackets: 2 },
    courtCost: 9600,
    equipmentCost: 0,
    totalCost: 9600,
    depositPaid: 4800,
    depositReceiptNumber: 'REC-50-8922',
    depositPaymentMethod: 'Mercado Pago (QR)',
    remainingBalance: 4800,
    remainingPaid: false,
    finalReceiptNumber: null,
    status: 'confirmada',
    createdAt: '2026-08-25T08:00:00Z',
    cancellationDetails: null
  },
  {
    id: 'RES-2026-007',
    courtId: 'cancha-2',
    courtName: 'Cancha 2 - Gabriela Sabatini (Ladrillo)',
    surfaceType: 'Ladrillo',
    date: '2026-08-29',
    startTime: '10:00',
    endTime: '12:00',
    durationHours: 2,
    playersType: 'singles',
    participants: [
      { name: 'Paola Suárez', dni: '30.876.543', phone: '11-4455-1122', isLead: true },
      { name: 'Gisela Dulko', dni: '35.654.321', phone: '11-3322-9988' }
    ],
    equipmentAssigned: { nets: 1, ballTubes: 1, rackets: 2 },
    courtCost: 9600,
    equipmentCost: 0,
    totalCost: 9600,
    depositPaid: 4800,
    depositReceiptNumber: 'REC-50-8930',
    depositPaymentMethod: 'Tarjeta de Crédito',
    remainingBalance: 0,
    remainingPaid: true,
    finalReceiptNumber: 'REC-FINAL-8935',
    status: 'finalizada',
    createdAt: '2026-08-26T12:00:00Z',
    cancellationDetails: null
  },
  {
    id: 'RES-2026-008',
    courtId: 'cancha-5',
    courtName: 'Cancha 5 - Wimbledon Grass Court (Pasto)',
    surfaceType: 'Pasto',
    date: '2026-08-30',
    startTime: '14:00',
    endTime: '16:00',
    durationHours: 2,
    playersType: 'singles',
    participants: [
      { name: 'Federico Gómez', dni: '38.452.129', phone: '11-4892-1234', isLead: true },
      { name: 'Mariano Zabaleta', dni: '35.123.890', phone: '11-4455-6677' }
    ],
    equipmentAssigned: { nets: 1, ballTubes: 1, rackets: 2 },
    courtCost: 11000,
    equipmentCost: 0,
    totalCost: 11000,
    depositPaid: 5500,
    depositReceiptNumber: 'REC-50-8940',
    depositPaymentMethod: 'Mercado Pago (QR)',
    remainingBalance: 5500,
    remainingPaid: false,
    finalReceiptNumber: null,
    status: 'cancelada',
    createdAt: '2026-08-27T10:30:00Z',
    cancellationDetails: {
      cancelledAt: '2026-08-28T10:00:00Z',
      hoursInAdvance: 52,
      refundApplicable: true,
      reason: 'Cancelado con aviso previo reglamentario (>6hs)'
    }
  },
  {
    id: 'RES-2026-009',
    courtId: 'cancha-3',
    courtName: 'Cancha 3 - David Nalbandian (Cemento)',
    surfaceType: 'Cemento',
    date: '2026-09-01',
    startTime: '11:00',
    endTime: '13:00',
    durationHours: 2,
    playersType: 'singles',
    participants: [
      { name: 'Martín Jaite', dni: '22.334.455', phone: '11-5544-2211', isLead: true },
      { name: 'Alberto Mancini', dni: '23.445.566', phone: '11-6655-3322' }
    ],
    equipmentAssigned: { nets: 1, ballTubes: 1, rackets: 2 },
    courtCost: 9600,
    equipmentCost: 0,
    totalCost: 9600,
    depositPaid: 4800,
    depositReceiptNumber: 'REC-50-8950',
    depositPaymentMethod: 'Efectivo',
    remainingBalance: 4800,
    remainingPaid: false,
    finalReceiptNumber: null,
    status: 'confirmada',
    createdAt: '2026-08-28T16:00:00Z',
    cancellationDetails: null
  },
  {
    id: 'RES-2026-010',
    courtId: 'cancha-1',
    courtName: 'Cancha 1 - Guillermo Vilas (Ladrillo)',
    surfaceType: 'Ladrillo',
    date: '2026-09-02',
    startTime: '15:00',
    endTime: '17:00',
    durationHours: 2,
    playersType: 'dobles',
    participants: [
      { name: 'Franco Davín', dni: '24.556.677', phone: '11-7766-4433', isLead: true },
      { name: 'Hernán Gumy', dni: '25.667.788', phone: '11-8877-5544' },
      { name: 'Mariano Hood', dni: '26.778.899', phone: '11-9988-6655' },
      { name: 'Sebastián Prieto', dni: '27.889.900', phone: '11-0099-7766' }
    ],
    equipmentAssigned: { nets: 1, ballTubes: 2, rackets: 4 },
    courtCost: 9600,
    equipmentCost: 0,
    totalCost: 9600,
    depositPaid: 4800,
    depositReceiptNumber: 'REC-50-8960',
    depositPaymentMethod: 'Mercado Pago (QR)',
    remainingBalance: 0,
    remainingPaid: true,
    finalReceiptNumber: 'REC-FINAL-8965',
    status: 'finalizada',
    createdAt: '2026-08-29T11:20:00Z',
    cancellationDetails: null
  },
  {
    id: 'RES-2026-011',
    courtId: 'cancha-4',
    courtName: 'Cancha 4 - Juan Martín del Potro (Cemento)',
    surfaceType: 'Cemento',
    date: '2026-09-03',
    startTime: '17:00',
    endTime: '19:00',
    durationHours: 2,
    playersType: 'singles',
    participants: [
      { name: 'Guillermo Pérez Roldán', dni: '23.112.233', phone: '11-3322-1144', isLead: true },
      { name: 'Horacio de la Peña', dni: '22.998.877', phone: '11-4433-2255' }
    ],
    equipmentAssigned: { nets: 1, ballTubes: 1, rackets: 2 },
    courtCost: 9600,
    equipmentCost: 0,
    totalCost: 9600,
    depositPaid: 4800,
    depositReceiptNumber: 'REC-50-8970',
    depositPaymentMethod: 'Tarjeta de Débito',
    remainingBalance: 4800,
    remainingPaid: false,
    finalReceiptNumber: null,
    status: 'confirmada',
    createdAt: '2026-08-30T14:00:00Z',
    cancellationDetails: null
  },
  {
    id: 'RES-2026-012',
    courtId: 'cancha-2',
    courtName: 'Cancha 2 - Gabriela Sabatini (Ladrillo)',
    surfaceType: 'Ladrillo',
    date: '2026-09-04',
    startTime: '19:00',
    endTime: '21:00',
    durationHours: 2,
    playersType: 'singles',
    participants: [
      { name: 'Florencia Labat', dni: '25.334.455', phone: '11-5544-3366', isLead: true },
      { name: 'Patricia Tarabini', dni: '24.223.344', phone: '11-6655-4477' }
    ],
    equipmentAssigned: { nets: 1, ballTubes: 1, rackets: 2 },
    courtCost: 9600,
    equipmentCost: 0,
    totalCost: 9600,
    depositPaid: 4800,
    depositReceiptNumber: 'REC-50-8980',
    depositPaymentMethod: 'Efectivo',
    remainingBalance: 4800,
    remainingPaid: false,
    finalReceiptNumber: null,
    status: 'confirmada',
    createdAt: '2026-08-31T09:30:00Z',
    cancellationDetails: null
  }
];

export const INITIAL_TOURNAMENTS = [
  {
    id: 'trn-01',
    name: 'Gran Torneo Abierto de Primavera 2026',
    category: 'Masculino', // Masculino, Femenino
    modality: 'Singles', // Singles, Dobles / Pareja
    surfaceRequired: 'Ladrillo',
    startDate: '2026-09-05',
    endDate: '2026-09-12',
    registrationFee: 7500,
    maxParticipants: 16,
    currentEnrolled: 12,
    status: 'inscripcion_abierta', // inscripcion_abierta, en_curso, finalizado
    description: 'Torneo oficial del club avalado por la Asociación de Tenis. Modalidad eliminación directa con partidos al mejor de 3 sets.',
    bracket: [
      {
        round: 'Cuartos de Final',
        matches: [
          { id: 'm1', p1: 'F. Gómez (1)', p2: 'L. Mayer', score: '6-4, 7-5', winner: 'F. Gómez (1)', status: 'finalizado' },
          { id: 'm2', p1: 'J. M. del Potro (3)', p2: 'D. Schwartzman', score: '6-3, 3-6, 6-4', winner: 'J. M. del Potro (3)', status: 'finalizado' },
          { id: 'm3', p1: 'M. Zabaleta', p2: 'G. Gaudio (4)', score: '4-6, 6-2, 7-6', winner: 'M. Zabaleta', status: 'finalizado' },
          { id: 'm4', p1: 'G. Coria (2)', p2: 'J. I. Chela', score: '6-2, 6-1', winner: 'G. Coria (2)', status: 'finalizado' }
        ]
      },
      {
        round: 'Semifinales',
        matches: [
          { id: 'm5', p1: 'F. Gómez (1)', p2: 'J. M. del Potro (3)', score: 'Pendiente', winner: null, status: 'programado', date: '2026-09-10 16:00', court: 'Cancha 1' },
          { id: 'm6', p1: 'M. Zabaleta', p2: 'G. Coria (2)', score: 'Pendiente', winner: null, status: 'programado', date: '2026-09-10 18:00', court: 'Cancha 2' }
        ]
      },
      {
        round: 'Gran Final',
        matches: [
          { id: 'm7', p1: 'Ganador SF 1', p2: 'Ganador SF 2', score: 'A disputarse', winner: null, status: 'pendiente', date: '2026-09-12 17:00', court: 'Cancha 1' }
        ]
      }
    ]
  },
  {
    id: 'trn-02',
    name: 'Copa Damas Sabatini - Dobles',
    category: 'Femenino',
    modality: 'Pareja',
    surfaceRequired: 'Cemento',
    startDate: '2026-09-15',
    endDate: '2026-09-20',
    registrationFee: 12000, // Por pareja
    maxParticipants: 8,
    currentEnrolled: 6,
    status: 'inscripcion_abierta',
    description: 'Torneo femenino por parejas en canchas de cemento. Ambiente competitivo y distendido con tercer tiempo incluido.',
    bracket: []
  }
];

export const INITIAL_COACHES = [
  {
    id: 'coach-01',
    name: 'Prof. Santiago Álvarez',
    dni: '27.890.123',
    phone: '+54 11 5566-7788',
    email: 'santiago.alvarez@tenisahora.com',
    specialty: 'Alto Rendimiento & Técnica Avanzada',
    experienceYears: 14,
    hasOfficialLicense: true,
    licenseDetails: {
      titleName: 'Profesor Nacional de Tenis de Alta Competencia',
      institution: 'Asociación Argentina de Tenis (AAT) / ITF Nivel 2',
      licenseNumber: 'AAT-LIC-77492',
      issueDate: '2015-11-20',
      expiryDate: '2028-12-31',
      status: 'habilitado',
      digitalDocumentUrl: 'Certificado_Oficial_AAT_Alvarez_77492.pdf'
    },
    hourlyRatePrivate: 6500,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Ex-jugador profesional ATP, especialista en desarrollo de saque, derecha y estrategia táctica.'
  },
  {
    id: 'coach-02',
    name: 'Entrenadora Valeria Morales',
    dni: '32.145.678',
    phone: '+54 11 4433-2211',
    email: 'valeria.morales@tenisahora.com',
    specialty: 'Escuela de Menores & Formación Inicial',
    experienceYears: 9,
    hasOfficialLicense: true,
    licenseDetails: {
      titleName: 'Licenciada en Educación Física y Entrenadora de Tenis Nivel 1',
      institution: 'Instituto Nacional de Educación Física & AAT',
      licenseNumber: 'AAT-LIC-90114',
      issueDate: '2018-04-15',
      expiryDate: '2029-06-30',
      status: 'habilitado',
      digitalDocumentUrl: 'Titulo_Habilitante_Morales_90114.pdf'
    },
    hourlyRatePrivate: 5800,
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    bio: 'Especialista en pedagogía deportiva, biomecánica del golpe y clínicas de tenis infantil y adultos principiantes.'
  }
];

export const INITIAL_CLASSES = [
  {
    id: 'cls-01',
    name: 'Escuela de Adultos - Nivel Intermedio',
    type: 'grupal',
    coachId: 'coach-01',
    coachName: 'Prof. Santiago Álvarez',
    scheduleDays: 'Martes y Jueves',
    scheduleTime: '19:00 - 20:30',
    courtAssigned: 'Cancha 1 (Ladrillo)',
    maxCapacity: 30, // Requerimiento: Máximo 30 alumnos (RF067)
    currentEnrolled: 6,
    monthlyFee: 16000,
    monthName: 'Octubre 2026',
    sessions: ['03/10', '05/10', '10/10', '12/10', '17/10', '19/10', '24/10', '26/10'],
    students: [
      { id: 'std-1', name: 'Federico Gómez', dni: '38.452.129', attendance: ['P', 'P', 'P', 'A', 'P', 'P', 'P', 'P'] }, // 7/8 = 88% Regular
      { id: 'std-2', name: 'Romina Varela', dni: '36.992.100', attendance: ['P', 'P', 'J', 'P', 'P', 'P', 'P', 'J'] }, // 6/8 = 75% Regular
      { id: 'std-3', name: 'Agustín Pereyra', dni: '39.441.800', attendance: ['P', 'A', 'P', 'A', 'A', 'P', 'A', 'P'] }, // 4/8 = 50% En riesgo (< 75%)
      { id: 'std-4', name: 'Sofía Rossi', dni: '40.229.412', attendance: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] }, // 8/8 = 100% Regular
      { id: 'std-5', name: 'Martín Lanata', dni: '37.114.990', attendance: ['A', 'P', 'A', 'A', 'P', 'A', 'P', 'P'] }, // 4/8 = 50% En riesgo (< 75%)
      { id: 'std-6', name: 'Camila Solís', dni: '41.200.334', attendance: ['P', 'P', 'P', 'P', 'P', 'J', 'P', 'P'] }  // 7/8 = 88% Regular
    ]
  },
  {
    id: 'cls-02',
    name: 'Clínica de Iniciación y Fundamentos',
    type: 'grupal',
    coachId: 'coach-02',
    coachName: 'Entrenadora Valeria Morales',
    scheduleDays: 'Lunes y Miércoles',
    scheduleTime: '18:00 - 19:30',
    courtAssigned: 'Cancha 3 (Cemento)',
    maxCapacity: 25, // Configurable hasta 30
    currentEnrolled: 4,
    monthlyFee: 14500,
    monthName: 'Octubre 2026',
    sessions: ['02/10', '04/10', '09/10', '11/10', '16/10', '18/10', '23/10', '25/10'],
    students: [
      { id: 'std-7', name: 'Claudio Bustos', dni: '34.881.002', attendance: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] },
      { id: 'std-8', name: 'Marcela Díaz', dni: '35.401.993', attendance: ['P', 'J', 'P', 'P', 'P', 'A', 'P', 'P'] },
      { id: 'std-9', name: 'Gonzalo Vega', dni: '42.110.450', attendance: ['P', 'A', 'A', 'A', 'P', 'A', 'P', 'A'] }, // 3/8 = 38% En riesgo
      { id: 'std-10', name: 'Lucía Benítez', dni: '39.811.234', attendance: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] }
    ]
  },
  {
    id: 'cls-03',
    name: 'Escuela de Competición y Alto Rendimiento (Cupo Lleno)',
    type: 'grupal',
    coachId: 'coach-01',
    coachName: 'Prof. Santiago Álvarez',
    scheduleDays: 'Viernes y Sábados',
    scheduleTime: '17:00 - 19:00',
    courtAssigned: 'Cancha 2 (Ladrillo)',
    maxCapacity: 30, // Tope estricto de 30 alumnos (RF067)
    currentEnrolled: 30, // Cupo alcanzado para demostrar inhabilitación de inscripción
    monthlyFee: 22000,
    monthName: 'Octubre 2026',
    sessions: ['04/10', '05/10', '11/10', '12/10', '18/10', '19/10', '25/10', '26/10'],
    students: Array.from({ length: 30 }, (_, i) => ({
      id: `std-full-${i + 1}`,
      name: `Alumno Competición #${i + 1}`,
      dni: `3${i + 5}.120.${100 + i}`,
      attendance: ['P', 'P', (i % 3 === 0 ? 'A' : 'P'), 'P', (i % 4 === 0 ? 'J' : 'P'), 'P', 'P', 'P']
    }))
  }
];

export const INITIAL_DISCOUNTS = [
  {
    id: 'disc-01',
    name: 'Paquete 10 Horas Mensuales',
    discountPercent: 15,
    code: 'PAQ10',
    applicableTo: 'Alquiler de Canchas',
    active: true
  },
  {
    id: 'disc-02',
    name: 'Socio Liga Regular Tenis Ahora',
    discountPercent: 20,
    code: 'LIGA20',
    applicableTo: 'Torneos y Alquiler',
    active: true
  },
  {
    id: 'disc-03',
    name: 'Convenio Escuela de Fútbol Afiliada',
    discountPercent: 10,
    code: 'FUTBOL10',
    applicableTo: 'Alquiler de Canchas y Clases',
    active: true
  }
];

export const INITIAL_RECEIPTS = [
  {
    id: 'REC-2026-1049',
    reservationId: 'RES-2026-001',
    clientName: 'Federico Gómez',
    clientDni: '38.452.129',
    concept: 'Seña 50% - Alquiler Cancha 1 (Ladrillo)',
    items: [
      { description: 'Alquiler 2 Horas Cancha 1 (Polvo de Ladrillo)', amount: 9600 },
      { description: 'Equipamiento incluido (Red, Pelotas, Raquetas)', amount: 0 },
      { description: 'Subtotal Total Reserva', amount: 9600 },
      { description: 'Pago correspondiente al 50% de Seña Obligatoria', amount: 4800 }
    ],
    totalPaid: 4800,
    paymentMethod: 'Mercado Pago QR',
    status: 'completado',
    date: '2026-08-20 14:30',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1049_fede_gomez',
    cashierName: 'Sistema Automático / Recepción'
  },
  {
    id: 'REC-2026-1048',
    reservationId: 'RES-2026-003',
    clientName: 'Carlos Alcaraz',
    clientDni: '95.441.228',
    concept: 'Liquidación Final 50% Restante - Cancha 5 Pasto',
    items: [
      { description: 'Saldo 50% Restante Cancha Césped Natural (2hs)', amount: 5500 }
    ],
    totalPaid: 5500,
    paymentMethod: 'Tarjeta de Crédito Visa Débito',
    status: 'completado',
    date: '2026-08-25 18:05',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1048_carlos_alcaraz',
    cashierName: 'Mariana López (Cajera Turno Tarde)'
  },
  {
    id: 'REC-2026-1047',
    reservationId: 'RES-2026-004',
    clientName: 'David Nalbandian',
    clientDni: '31.223.990',
    concept: 'Seña 50% - Alquiler Cancha 3 (Cemento)',
    items: [
      { description: 'Alquiler Cancha 3 Cemento (2hs)', amount: 9600 },
      { description: 'Seña 50% Abonada', amount: 4800 }
    ],
    totalPaid: 4800,
    paymentMethod: 'Mercado Pago (QR)',
    status: 'completado',
    date: '2026-08-23 11:05',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1047',
    cashierName: 'Recepción Central'
  },
  {
    id: 'REC-2026-1046',
    reservationId: 'RES-2026-007',
    clientName: 'Paola Suárez',
    clientDni: '30.876.543',
    concept: 'Liquidación Final Saldo 50% - Cancha 2 Ladrillo',
    items: [
      { description: 'Saldo 50% Turno Cancha 2', amount: 4800 }
    ],
    totalPaid: 4800,
    paymentMethod: 'Tarjeta de Crédito',
    status: 'completado',
    date: '2026-08-26 12:10',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1046',
    cashierName: 'Administración General'
  },
  {
    id: 'REC-2026-1045',
    reservationId: 'RES-POS-301',
    clientName: 'Juan Martín del Potro',
    clientDni: '34.120.443',
    concept: 'Inscripción a Torneo Apertura (Singles)',
    items: [
      { description: 'Inscripción a Torneo Apertura (Singles)', amount: 7500 },
      { description: 'Descuento Socio Liga Regular (20%)', amount: -1500 }
    ],
    totalPaid: 6000,
    paymentMethod: 'Mercado Pago (QR)',
    status: 'completado',
    date: '2026-08-28 17:30',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1045',
    cashierName: 'Caja Torneos'
  },
  {
    id: 'REC-2026-1044',
    reservationId: 'RES-POS-302',
    clientName: 'Martín Jaite',
    clientDni: '22.334.455',
    concept: 'Cuota de Clase (Escuela de Tenis Mensual)',
    items: [
      { description: 'Cuota Escuela de Tenis (Nivel Intermedio)', amount: 16000 },
      { description: 'Descuento Convenio Escuela de Fútbol (10%)', amount: -1600 }
    ],
    totalPaid: 14400,
    paymentMethod: 'Tarjeta de Débito',
    status: 'completado',
    date: '2026-08-29 09:45',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1044',
    cashierName: 'Administración General'
  },
  {
    id: 'REC-2026-1043',
    reservationId: 'RES-2026-010',
    clientName: 'Franco Davín',
    clientDni: '24.556.677',
    concept: 'Liquidación Final Saldo 50% - Cancha 1 Ladrillo',
    items: [
      { description: 'Saldo 50% Dobles Cancha 1', amount: 4800 }
    ],
    totalPaid: 4800,
    paymentMethod: 'Efectivo',
    status: 'completado',
    date: '2026-09-02 17:05',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1043',
    cashierName: 'Recepción Central'
  },
  {
    id: 'REC-2026-1042',
    reservationId: 'RES-POS-303',
    clientName: 'Diego Schwartzman',
    clientDni: '36.889.001',
    concept: 'Alquiler Cancha Rápida (Turno 1 h)',
    items: [
      { description: 'Alquiler Cancha Rápida 1 h', amount: 4800 },
      { description: 'Descuento Paquete 10 Horas Mensuales (15%)', amount: -720 }
    ],
    totalPaid: 4080,
    paymentMethod: 'Mercado Pago (QR)',
    status: 'completado',
    date: '2026-09-03 14:15',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1042',
    cashierName: 'Caja Principal'
  },
  {
    id: 'REC-2026-1041',
    reservationId: 'RES-POS-304',
    clientName: 'Gisela Dulko',
    clientDni: '35.654.321',
    concept: 'Inscripción a Torneo Oficial (Dobles)',
    items: [
      { description: 'Inscripción a Torneo Oficial (Dobles)', amount: 12000 },
      { description: 'Descuento Socio Liga Regular (20%)', amount: -2400 }
    ],
    totalPaid: 9600,
    paymentMethod: 'Tarjeta de Débito',
    status: 'completado',
    date: '2026-09-04 11:00',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1041',
    cashierName: 'Caja Torneos'
  },
  {
    id: 'REC-2026-1040',
    reservationId: 'RES-2026-012',
    clientName: 'Florencia Labat',
    clientDni: '25.334.455',
    concept: 'Seña 50% - Cancha 2 Ladrillo',
    items: [
      { description: 'Seña 50% Turno Noche Cancha 2', amount: 4800 }
    ],
    totalPaid: 4800,
    paymentMethod: 'Efectivo',
    status: 'completado',
    date: '2026-09-04 18:30',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1040',
    cashierName: 'Recepción Central'
  }
];

export const INITIAL_USERS = [
  {
    id: 'usr-01',
    name: 'Federico Gómez',
    dni: '38.452.129',
    phone: '+54 11 4892-1234',
    email: 'socio@tenisahora.com',
    address: 'Av. San Martín 1420, Quilmes, Buenos Aires',
    role: 'client',
    memberNumber: 'TA-8821',
    memberSince: '2024-03-10',
    activeDiscounts: ['PAQ10', 'LIGA20'],
    totalBookings: 14
  },
  {
    id: 'usr-02',
    name: 'Administrador General',
    dni: '30.123.456',
    phone: '+54 11 9988-1122',
    email: 'admin@tenisahora.com',
    address: 'Sede Central Club Tenis Ahora, Buenos Aires',
    role: 'admin',
    memberNumber: 'ADM-001',
    memberSince: '2022-01-01',
    activeDiscounts: [],
    totalBookings: 0
  },
  {
    id: 'usr-03',
    name: 'Lucía Benítez',
    dni: '40.112.334',
    phone: '+54 11 6677-8899',
    email: 'lucia.benitez@gmail.com',
    address: 'Calle Mitre 845, Florencio Varela',
    role: 'client',
    memberNumber: 'TA-9044',
    memberSince: '2025-01-15',
    activeDiscounts: ['FUTBOL10'],
    totalBookings: 8
  },
  {
    id: 'usr-04',
    name: 'Mariano Zabaleta',
    dni: '35.123.890',
    phone: '+54 11 4455-6677',
    email: 'mariano.zabaleta@tennis.com',
    address: 'Av. Libertador 3200, CABA',
    role: 'client',
    memberNumber: 'TA-7612',
    memberSince: '2023-08-01',
    activeDiscounts: ['LIGA20'],
    totalBookings: 22
  },
  {
    id: 'usr-05',
    name: 'David Nalbandian',
    dni: '31.223.990',
    phone: '+54 11 4433-2211',
    email: 'david.nalbandian@cordoba.com',
    address: 'Av. Colón 1500, Unquillo, Córdoba',
    role: 'client',
    memberNumber: 'TA-8822',
    memberSince: '2023-04-12',
    activeDiscounts: ['PAQ10'],
    totalBookings: 19
  },
  {
    id: 'usr-06',
    name: 'Guillermo Coria',
    dni: '32.119.882',
    phone: '+54 11 9900-1122',
    email: 'guille.coria@santafe.com',
    address: 'Bv. Oroño 450, Rosario, Santa Fe',
    role: 'client',
    memberNumber: 'TA-8823',
    memberSince: '2023-06-20',
    activeDiscounts: ['LIGA20'],
    totalBookings: 31
  },
  {
    id: 'usr-07',
    name: 'Gastón Gaudio',
    dni: '33.987.654',
    phone: '+54 11 2233-4455',
    email: 'gaston.gaudio@adrogue.com',
    address: 'Calle Amenedo 120, Adrogué, Buenos Aires',
    role: 'client',
    memberNumber: 'TA-8824',
    memberSince: '2022-11-10',
    activeDiscounts: ['PAQ10', 'LIGA20'],
    totalBookings: 27
  },
  {
    id: 'usr-08',
    name: 'Gabriela Sabatini',
    dni: '21.445.678',
    phone: '+54 11 1122-3344',
    email: 'gaby.sabatini@tennislegend.com',
    address: 'Av. Alvear 1900, Recoleta, CABA',
    role: 'client',
    memberNumber: 'TA-0010',
    memberSince: '2021-01-01',
    activeDiscounts: ['LIGA20'],
    totalBookings: 45
  },
  {
    id: 'usr-09',
    name: 'Paola Suárez',
    dni: '30.876.543',
    phone: '+54 11 4455-1122',
    email: 'paola.suarez@pergamino.com',
    address: 'Av. de Mayo 800, Pergamino, Buenos Aires',
    role: 'client',
    memberNumber: 'TA-8825',
    memberSince: '2024-02-14',
    activeDiscounts: ['FUTBOL10'],
    totalBookings: 11
  },
  {
    id: 'usr-10',
    name: 'Gisela Dulko',
    dni: '35.654.321',
    phone: '+54 11 3322-9988',
    email: 'gisela.dulko@tigre.com',
    address: 'Av. Cazón 1250, Tigre, Buenos Aires',
    role: 'client',
    memberNumber: 'TA-8826',
    memberSince: '2024-05-18',
    activeDiscounts: ['LIGA20'],
    totalBookings: 16
  },
  {
    id: 'usr-11',
    name: 'Diego Schwartzman',
    dni: '36.889.001',
    phone: '+54 11 7788-9900',
    email: 'peque.schwartzman@hacoaj.com',
    address: 'Av. Estado de Israel 4200, CABA',
    role: 'client',
    memberNumber: 'TA-8827',
    memberSince: '2024-07-01',
    activeDiscounts: ['PAQ10'],
    totalBookings: 18
  },
  {
    id: 'usr-12',
    name: 'Francisco Cerúndolo',
    dni: '42.112.909',
    phone: '+54 11 3344-5566',
    email: 'fran.cerundolo@belgrano.com',
    address: 'Calle Juramento 2100, Belgrano, CABA',
    role: 'client',
    memberNumber: 'TA-8828',
    memberSince: '2024-09-15',
    activeDiscounts: ['LIGA20'],
    totalBookings: 12
  },
  {
    id: 'usr-13',
    name: 'Tomás Etcheverry',
    dni: '41.900.223',
    phone: '+54 11 8899-0011',
    email: 'tomy.etcheverry@laplata.com',
    address: 'Calle 7 N° 450, La Plata, Buenos Aires',
    role: 'client',
    memberNumber: 'TA-8829',
    memberSince: '2024-10-02',
    activeDiscounts: ['FUTBOL10'],
    totalBookings: 9
  },
  {
    id: 'usr-14',
    name: 'Sebastián Báez',
    dni: '43.200.114',
    phone: '+54 11 6677-8800',
    email: 'seba.baez@sanmartin.com',
    address: 'Av. Rodríguez Peña 890, San Martín',
    role: 'client',
    memberNumber: 'TA-8830',
    memberSince: '2025-01-20',
    activeDiscounts: ['PAQ10', 'LIGA20'],
    totalBookings: 15
  }
];
