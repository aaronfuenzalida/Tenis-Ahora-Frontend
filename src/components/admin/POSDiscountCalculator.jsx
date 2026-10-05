import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  DollarSign, 
  ArrowRight, 
  Percent, 
  CreditCard, 
  QrCode, 
  Banknote, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Receipt,
  User,
  Tag,
  AlertCircle
} from 'lucide-react';

const CONCEPT_PRESETS = [
  { id: 'court_rental_2h', label: 'Alquiler de Cancha (Turno 2 hs)', defaultAmount: 9600, category: 'Alquiler' },
  { id: 'class_monthly_fee', label: 'Cuota de Clase (Escuela de Tenis Mensual)', defaultAmount: 16000, category: 'Clases' },
  { id: 'tournament_singles', label: 'Inscripción a Torneo Apertura (Singles)', defaultAmount: 7500, category: 'Torneos' },
  { id: 'tournament_doubles', label: 'Inscripción a Torneo Oficial (Dobles)', defaultAmount: 12000, category: 'Torneos' },
  { id: 'court_rental_1h', label: 'Alquiler Cancha Rápida (Turno 1 h)', defaultAmount: 4800, category: 'Alquiler' },
  { id: 'custom', label: 'Concepto Personalizado...', defaultAmount: 5000, category: 'Otro' },
];

const TP_DISCOUNTS = [
  {
    code: 'NONE',
    name: 'Sin Descuento',
    discountPercent: 0,
    description: 'Tarifa regular estándar sin bonificación.',
    color: 'slate'
  },
  {
    code: 'PAQ10',
    name: 'Paquete de 10 Horas Mensuales',
    discountPercent: 15,
    description: 'RF129 - Aplicable a socios con paquete de horas acumuladas contratado.',
    color: 'emerald'
  },
  {
    code: 'LIGA20',
    name: 'Socio Liga Regular Tenis Ahora',
    discountPercent: 20,
    description: 'RF130 - Bonificación especial socios activos en liga interna oficial.',
    color: 'tennis'
  },
  {
    code: 'FUTBOL10',
    name: 'Convenio Escuela de Fútbol Afiliada',
    discountPercent: 10,
    description: 'RF131 - Convenio interclubes para socios y familiares directos.',
    color: 'sky'
  }
];

export default function POSDiscountCalculator({ onChargeComplete }) {
  const [selectedConceptPreset, setSelectedConceptPreset] = useState('court_rental_2h');
  const [customConceptTitle, setCustomConceptTitle] = useState('');
  const [baseAmount, setBaseAmount] = useState(9600);
  
  const [clientName, setClientName] = useState('Federico Gómez');
  const [clientDni, setClientDni] = useState('38.452.129');
  
  const [selectedDiscountCode, setSelectedDiscountCode] = useState('LIGA20');
  const [paymentMethod, setPaymentMethod] = useState('Mercado Pago (QR)');
  const [cashTendered, setCashTendered] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Concept name display
  const activeConceptName = useMemo(() => {
    if (selectedConceptPreset === 'custom') {
      return customConceptTitle || 'Concepto Personalizado';
    }
    const preset = CONCEPT_PRESETS.find(p => p.id === selectedConceptPreset);
    return preset ? preset.label : 'Alquiler de Cancha';
  }, [selectedConceptPreset, customConceptTitle]);

  // Discount calculation
  const activeDiscount = useMemo(() => {
    return TP_DISCOUNTS.find(d => d.code === selectedDiscountCode) || TP_DISCOUNTS[0];
  }, [selectedDiscountCode]);

  const discountAmountPesos = useMemo(() => {
    return Math.round(baseAmount * (activeDiscount.discountPercent / 100));
  }, [baseAmount, activeDiscount]);

  const finalAmountToCharge = useMemo(() => {
    return Math.max(0, baseAmount - discountAmountPesos);
  }, [baseAmount, discountAmountPesos]);

  // Cash change calculation
  const cashChange = useMemo(() => {
    if (paymentMethod !== 'Efectivo') return 0;
    const tendered = Number(cashTendered) || 0;
    return Math.max(0, tendered - finalAmountToCharge);
  }, [paymentMethod, cashTendered, finalAmountToCharge]);

  const handleConceptChange = (presetId) => {
    setSelectedConceptPreset(presetId);
    const preset = CONCEPT_PRESETS.find(p => p.id === presetId);
    if (preset && preset.id !== 'custom') {
      setBaseAmount(preset.defaultAmount);
    }
  };

  const handleProcessCharge = (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientDni.trim()) {
      alert('Por favor complete el nombre y DNI del socio o cliente.');
      return;
    }
    if (baseAmount <= 0) {
      alert('El monto a cobrar debe ser mayor a $0.');
      return;
    }

    const receiptId = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReceipt = {
      id: receiptId,
      reservationId: `RES-POS-${Math.floor(100 + Math.random() * 900)}`,
      clientName: clientName.trim(),
      clientDni: clientDni.trim(),
      concept: activeConceptName,
      items: [
        { description: `${activeConceptName} (Tarifa Base)`, amount: baseAmount },
        ...(activeDiscount.discountPercent > 0 ? [{
          description: `Descuento: ${activeDiscount.name} (${activeDiscount.discountPercent}%)`,
          amount: -discountAmountPesos
        }] : [])
      ],
      totalPaid: finalAmountToCharge,
      paymentMethod,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completado',
      cashierName: 'Caja Principal (Turno Mañana)',
      qrData: `https://mpago.la/pos/tenisahora/${receiptId.toLowerCase()}`
    };

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);

    if (onChargeComplete) {
      onChargeComplete(newReceipt);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/70 to-emerald-50/30 rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden space-y-6">
      
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-tennis-500 via-emerald-500 to-amber-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-tennis-600 text-white flex items-center justify-center shadow-md shadow-tennis-600/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Simulador y Cotizador de Descuentos en Caja
              </h2>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-tennis-100 text-tennis-900 border border-tennis-300">
                RF128 a RF133
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Calculadora de cobro en tiempo real con políticas de beneficios y emisión fiscal de recibo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Caja Abierta • Operador Activo
        </div>
      </div>

      <form onSubmit={handleProcessCharge} className="space-y-6">
        
        {/* Row 1: Concept & Client */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Concept selector (RF128) */}
          <div className="md:col-span-7 space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-tennis-600" />
              1. Seleccionar Concepto a Cobrar *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONCEPT_PRESETS.map((preset) => {
                const isSelected = selectedConceptPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleConceptChange(preset.id)}
                    className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-tennis-50/80 border-tennis-600 text-tennis-950 shadow-sm ring-1 ring-tennis-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold leading-snug">{preset.label}</span>
                    <span className="text-[11px] font-black text-tennis-800 mt-1">
                      {preset.id === 'custom' ? 'Manual' : `$${preset.defaultAmount.toLocaleString('es-AR')}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedConceptPreset === 'custom' && (
              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Detalle del concepto personalizado..."
                  value={customConceptTitle}
                  onChange={(e) => setCustomConceptTitle(e.target.value)}
                  className="p-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-tennis-600 font-medium"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-tennis-600 font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Client & DNI */}
          <div className="md:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <label className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-tennis-600" />
              Datos del Socio / Cliente *
            </label>
            
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Nombre y Apellido</span>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Martín del Potro"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 outline-none focus:border-tennis-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">DNI</span>
                  <input
                    type="text"
                    required
                    placeholder="38.452.129"
                    value={clientDni}
                    onChange={(e) => setClientDni(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 outline-none focus:border-tennis-600 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Monto Base</span>
                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-900 text-right">
                    ${baseAmount.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Row 2: Discounts Policy Selection (RF128 a RF133) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-tennis-600" />
              2. Aplicar Política de Descuento Reglamentaria (TP)
            </label>
            <span className="text-[11px] text-slate-400 font-medium">Bonificación automática al instante</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TP_DISCOUNTS.map((disc) => {
              const isSelected = selectedDiscountCode === disc.code;
              return (
                <div
                  key={disc.code}
                  onClick={() => setSelectedDiscountCode(disc.code)}
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all relative ${
                    isSelected
                      ? 'bg-tennis-900 text-white border-tennis-800 shadow-md ring-2 ring-tennis-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-black ${
                      isSelected ? 'bg-tennis-800 text-tennis-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {disc.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                      disc.discountPercent === 0 
                        ? (isSelected ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500')
                        : (isSelected ? 'bg-tennis-400 text-slate-950 font-black' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {disc.discountPercent > 0 ? `${disc.discountPercent}% OFF` : '0%'}
                    </span>
                  </div>
                  
                  <div className={`font-extrabold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {disc.name}
                  </div>
                  
                  <p className={`text-[10px] mt-1 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {disc.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 3: DYNAMIC BREAKDOWN DIAGRAM (Subtotal -> Descuento en pesos -> Total final) */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-tennis-400 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-tennis-400" />
              Desglose Dinámico de Cobro en Tiempo Real
            </span>
            <span className="text-[11px] text-slate-400">Concepto: {activeConceptName}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            
            {/* Step 1: Subtotal */}
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Paso 1: Subtotal Base
              </span>
              <div className="text-2xl font-black text-white font-mono">
                ${baseAmount.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-400">Sin descuentos previos</span>
            </div>

            {/* Step 2: Descuento en Pesos */}
            <div className={`p-3.5 rounded-2xl border relative ${
              discountAmountPesos > 0 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
            }`}>
              <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">
                Paso 2: Descuento Aplicado ({activeDiscount.discountPercent}%)
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {discountAmountPesos > 0 ? `-$${discountAmountPesos.toLocaleString('es-AR')}` : '$0'}
              </div>
              <span className="text-[10px] text-slate-300 truncate block">
                {activeDiscount.name}
              </span>
            </div>

            {/* Step 3: Total Final */}
            <div className="p-4 bg-gradient-to-br from-tennis-600 to-emerald-600 rounded-2xl border border-tennis-400 shadow-md text-white">
              <span className="text-[10px] font-black uppercase text-tennis-100 tracking-wider block mb-1">
                Paso 3: Total Final a Cobrar
              </span>
              <div className="text-3xl font-black tracking-tight font-mono">
                ${finalAmountToCharge.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-white/90 font-medium">Importe final liquidado</span>
            </div>

          </div>
        </div>

        {/* Row 4: Payment Method Selection & Cash Change */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          <div className="md:col-span-8 space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-tennis-600" />
              3. Selección del Medio de Pago
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Mercado Pago (QR)', label: 'Mercado Pago (QR)', icon: QrCode, highlight: true },
                { id: 'Tarjeta de Débito', label: 'Débito Bancario', icon: CreditCard },
                { id: 'Tarjeta de Crédito', label: 'Tarjeta Crédito', icon: CreditCard },
                { id: 'Efectivo', label: 'Efectivo en Caja', icon: Banknote },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-tennis-600 text-white border-tennis-600 shadow-md shadow-tennis-600/20 ring-2 ring-tennis-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span className="text-[11px] font-bold leading-tight">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash calculator or QR preview */}
          <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center">
            {paymentMethod === 'Efectivo' ? (
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Calculadora de Vuelto</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold">Paga con $:</span>
                  <input
                    type="number"
                    placeholder="Ej. 10000"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-tennis-600"
                  />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-bold">
                  <span className="text-slate-600">Vuelto a entregar:</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    ${cashChange.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ) : paymentMethod === 'Mercado Pago (QR)' ? (
              <div className="flex items-center gap-3 text-xs">
                <div className="w-12 h-12 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-center shrink-0">
                  <QrCode className="w-7 h-7 text-sky-600" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">QR Dinámico MP</span>
                  <span className="text-[10px] text-slate-400">Acreditación automática e instantánea al escanear.</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs">
                <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">Terminal POS Bancario</span>
                  <span className="text-[10px] text-slate-400">Pase o inserte la tarjeta en la terminal de cobro.</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Row 5: Action Button & Feedback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Al procesar se creará el recibo fiscal formal con número único correlativo y código QR.
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-tennis-600 to-emerald-600 hover:from-tennis-700 hover:to-emerald-700 text-white font-black text-xs shadow-md hover:shadow-glow-green flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            <Receipt className="w-4 h-4" />
            <span>Procesar Cobro (${finalAmountToCharge.toLocaleString('es-AR')}) y Emitir Recibo Oficial</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>

      {/* Floating Success Toast */}
      {showSuccessToast && (
        <div className="absolute bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-tennis-400" />
          <span>¡Cobro registrado exitosamente! Comprobante emitido.</span>
        </div>
      )}

    </div>
  );
}
