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
    lighting: true,
    pricePerHour: 4800,
    status: 'disponible', // disponible, ocupada, mantenimiento
    description: 'Polvo de ladrillo profesional con drenaje rápido e iluminación LED nocturna.',
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
    lighting: true,
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
    lighting: true,
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
    lighting: false,
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
    lighting: true,
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
    name: 'Redes Reglamentarias de Tenis',
    category: 'Redes',
    totalStock: 10,
    inUseStock: 4,
    availableStock: 6,
    unit: 'unidades',
    itemPrice: 0, // Incluida con la cancha pero descontada del stock
    minAlertThreshold: 2,
    status: 'normal',
    description: 'Redes de poliéster reforzadas de 3.5mm con cable de acero y faja central'
  },
  {
    id: 'item-pelotas',
    name: 'Tubos de Pelotas Wilson US Open (x3)',
    category: 'Pelotas',
    totalStock: 50,
    inUseStock: 18,
    availableStock: 32,
    unit: 'tubos',
    itemPrice: 1200,
    minAlertThreshold: 10,
    status: 'normal',
    description: 'Pelotas presurizadas para todas las superficies de alta durabilidad'
  },
  {
    id: 'item-pelotas-pasto',
    name: 'Tubos de Pelotas Slazenger Wimbledon (x4)',
    category: 'Pelotas',
    totalStock: 25,
    inUseStock: 22,
    availableStock: 3,
    unit: 'tubos',
    itemPrice: 1800,
    minAlertThreshold: 5,
    status: 'alerta_baja',
    description: 'Pelotas premium hidroguard especiales para césped natural'
  },
  {
    id: 'item-raquetas',
    name: 'Raquetas Head / Babolat para Alquiler',
    category: 'Raquetas',
    totalStock: 20,
    inUseStock: 8,
    availableStock: 12,
    unit: 'unidades',
    itemPrice: 800,
    minAlertThreshold: 4,
    status: 'normal',
    description: 'Raquetas de grafito encordadas a 52 lbs con grip sintético'
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
      ballTubes: 2,
      rackets: 2
    },
    courtCost: 9600, // 4800 x 2hs
    equipmentCost: 4000, // 2 tubos + 2 raquetas
    totalCost: 13600,
    depositPaid: 6800, // 50% de seña
    depositReceiptNumber: 'REC-50-8910',
    depositPaymentMethod: 'Mercado Pago (QR)',
    remainingBalance: 6800, // 50% al finalizar
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
      rackets: 0
    },
    courtCost: 9600,
    equipmentCost: 1200,
    totalCost: 10800,
    depositPaid: 5400,
    depositReceiptNumber: 'REC-50-8912',
    depositPaymentMethod: 'Tarjeta de Débito',
    remainingBalance: 5400,
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
      ballTubes: 2,
      rackets: 0
    },
    courtCost: 11000,
    equipmentCost: 3600,
    totalCost: 14600,
    depositPaid: 7300,
    depositReceiptNumber: 'REC-50-8870',
    depositPaymentMethod: 'Tarjeta de Crédito',
    remainingBalance: 0,
    remainingPaid: true,
    finalReceiptNumber: 'REC-FINAL-8875',
    status: 'finalizada',
    createdAt: '2026-08-18T10:00:00Z',
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
    prizePool: '$ 150.000 + Trofeo y Raqueta Pro',
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
    prizePool: '$ 120.000 + Equipamiento Babolat',
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
    maxCapacity: 30, // Requerimiento: Máximo 30 alumnos
    currentEnrolled: 18,
    monthlyFee: 16000,
    students: [
      { id: 'std-1', name: 'Federico Gómez', dni: '38.452.129', attendance: ['P', 'P', 'P', 'A'] },
      { id: 'std-2', name: 'Romina Varela', dni: '36.992.100', attendance: ['P', 'P', 'J', 'P'] },
      { id: 'std-3', name: 'Agustín Pereyra', dni: '39.441.800', attendance: ['P', 'A', 'P', 'P'] },
      { id: 'std-4', name: 'Sofía Rossi', dni: '40.229.412', attendance: ['P', 'P', 'P', 'P'] },
      { id: 'std-5', name: 'Martín Lanata', dni: '37.114.990', attendance: ['A', 'P', 'P', 'P'] }
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
    currentEnrolled: 14,
    monthlyFee: 14500,
    students: [
      { id: 'std-6', name: 'Claudio Bustos', dni: '34.881.002', attendance: ['P', 'P', 'P', 'P'] },
      { id: 'std-7', name: 'Marcela Díaz', dni: '35.401.993', attendance: ['P', 'J', 'P', 'P'] },
      { id: 'std-8', name: 'Gonzalo Vega', dni: '42.110.450', attendance: ['P', 'P', 'P', 'P'] }
    ]
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
    concept: 'Seña 50% - Alquiler Cancha 1 (Ladrillo) + Equipamiento',
    items: [
      { description: 'Alquiler 2 Horas Cancha 1 (Polvo de Ladrillo)', amount: 9600 },
      { description: 'Alquiler 2 Raquetas Grafito', amount: 1600 },
      { description: '2 Tubos Pelotas Wilson US Open', amount: 2400 },
      { description: 'Subtotal Total Reserva', amount: 13600 },
      { description: 'Pago correspondiente al 50% de Seña Obligatoria', amount: 6800 }
    ],
    totalPaid: 6800,
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
      { description: 'Saldo 50% Restante Cancha Césped Natural', amount: 5500 },
      { description: 'Saldo 50% Restante Equipamiento Slazenger', amount: 1800 }
    ],
    totalPaid: 7300,
    paymentMethod: 'Tarjeta de Crédito Visa Débito',
    status: 'completado',
    date: '2026-08-25 18:05',
    qrData: 'https://mpago.la/pos/tenisahora/rec_2026_1048_carlos_alcaraz',
    cashierName: 'Mariana López (Cajera Turno Tarde)'
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
  }
];
