import React, { useState, useMemo, useEffect } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { useAuth } from '../../context/AuthContext';
import { courtsService, coachesAndClassesService, tournamentsService, leaguesService } from '../../services/api';
import QRCode, { qrPayloads } from '../common/QRCode';

// Cada categoría arma sus conceptos a partir de las tarifas cargadas en el sistema.
const CATEGORIES = [
  { id: 'alquiler', label: 'Alquiler de Cancha' },
  { id: 'clases', label: 'Cuota de Clase' },
  { id: 'particulares', label: 'Clase Particular' },
  { id: 'torneos', label: 'Inscripción a Torneo' },
  { id: 'ligas', label: 'Inscripción a Liga' },
  { id: 'otro', label: 'Otro Concepto' }
];

const money = (n) => '$' + Number(n || 0).toLocaleString('es-AR');

// Conceptos cobrables de una categoría: { id, label, detail, amount, concept }.
function conceptsFor(category, catalog, hours) {
  switch (category) {
    case 'alquiler':
      return catalog.courts
        .filter(c => c.status !== 'mantenimiento')
        .map(c => ({
          id: c.id,
          label: c.name,
          detail: `${c.surfaceType} · ${money(c.pricePerHour)}/h`,
          amount: (c.pricePerHour || 0) * hours,
          concept: `Alquiler ${c.name} (${hours} ${hours === 1 ? 'h' : 'hs'})`
        }));
    case 'clases':
      return catalog.classes.map(c => ({
        id: c.id,
        label: c.name,
        detail: `${c.coachName} · ${c.scheduleDays} ${c.scheduleTime}`,
        amount: c.monthlyFee || 0,
        concept: `Cuota mensual: ${c.name}`
      }));
    case 'particulares':
      return catalog.coaches.map(c => ({
        id: c.id,
        label: c.name,
        detail: `${c.type || 'Profesor'} · ${money(c.hourlyRatePrivate)}/h`,
        amount: (c.hourlyRatePrivate || 0) * hours,
        concept: `Clase particular con ${c.name} (${hours} ${hours === 1 ? 'h' : 'hs'})`
      }));
    case 'torneos':
      return catalog.tournaments
        .filter(t => t.status === 'inscripcion_abierta')
        .map(t => ({
          id: t.id,
          label: t.name,
          detail: `${t.category} · ${t.modality}`,
          amount: t.registrationFee || 0,
          concept: `Inscripción a torneo: ${t.name}`
        }));
    case 'ligas':
      return catalog.leagues
        .filter(l => l.status === 'inscripcion_abierta')
        .map(l => ({
          id: l.id,
          label: l.name,
          detail: `${l.category} · ${l.modality}`,
          amount: l.registrationFee || 0,
          concept: `Inscripción a liga: ${l.name}`
        }));
    default:
      return [];
  }
}

// Opción fija para cobrar a tarifa regular; el resto sale de los descuentos vigentes del club.
const NO_DISCOUNT = {
  code: 'NONE',
  name: 'Sin Descuento',
  discountPercent: 0
};

export default function POSDiscountCalculator({ discounts = [], onChargeComplete }) {
  const { notify } = useFeedback();
  const { user } = useAuth();
  const [catalog, setCatalog] = useState({ courts: [], classes: [], coaches: [], tournaments: [], leagues: [] });
  const [category, setCategory] = useState('alquiler');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [hours, setHours] = useState(1);
  const [customConceptTitle, setCustomConceptTitle] = useState('');
  const [baseAmount, setBaseAmount] = useState(0);

  useEffect(() => {
    Promise.all([
      courtsService.getAll(),
      coachesAndClassesService.getClasses(),
      coachesAndClassesService.getCoaches(),
      tournamentsService.getAll(),
      leaguesService.getAll()
    ]).then(([courts, classes, coaches, tournaments, leagues]) => {
      setCatalog({
        courts: courts.data || [],
        classes: classes.data || [],
        coaches: coaches.data || [],
        tournaments: tournaments.data || [],
        leagues: leagues.data || []
      });
    });
  }, []);

  const concepts = useMemo(() => conceptsFor(category, catalog, hours), [category, catalog, hours]);
  const withHours = category === 'alquiler' || category === 'particulares';

  // Al cambiar de categoría, catálogo o duración se toma el ítem elegido (o el primero) y su tarifa.
  const selectedItem = useMemo(
    () => concepts.find(i => i.id === selectedItemId) || concepts[0] || null,
    [concepts, selectedItemId]
  );

  useEffect(() => {
    if (category === 'otro') return;
    setSelectedItemId(selectedItem ? selectedItem.id : '');
    setBaseAmount(selectedItem ? selectedItem.amount : 0);
  }, [category, selectedItem]);
  
  const [clientName, setClientName] = useState('');
  const [clientDni, setClientDni] = useState('');
  
  const [selectedDiscountCode, setSelectedDiscountCode] = useState('NONE');
  const [paymentMethod, setPaymentMethod] = useState('Mercado Pago (QR)');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const activeConceptName = useMemo(() => {
    if (category === 'otro') return customConceptTitle || 'Concepto Personalizado';
    return selectedItem ? selectedItem.concept : CATEGORIES.find(c => c.id === category)?.label || '';
  }, [category, customConceptTitle, selectedItem]);

  // Descuentos vigentes del club (los inactivos no se pueden aplicar en mostrador).
  const discountOptions = useMemo(() => [
    NO_DISCOUNT,
    ...discounts
      .filter(d => d.active !== false)
      .map(d => ({ code: d.code, name: d.name, discountPercent: d.discountPercent }))
  ], [discounts]);

  const activeDiscount = useMemo(() => {
    return discountOptions.find(d => d.code === selectedDiscountCode) || NO_DISCOUNT;
  }, [discountOptions, selectedDiscountCode]);

  const discountAmountPesos = useMemo(() => {
    return Math.round(baseAmount * (activeDiscount.discountPercent / 100));
  }, [baseAmount, activeDiscount]);

  const finalAmountToCharge = useMemo(() => {
    return Math.max(0, baseAmount - discountAmountPesos);
  }, [baseAmount, discountAmountPesos]);

  const handleCategoryChange = (id) => {
    setCategory(id);
    setSelectedItemId('');
    if (id === 'otro') setBaseAmount(0);
  };

  const handleProcessCharge = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientDni.trim()) {
      notify({ variant: 'warning', message: 'Por favor complete el nombre y DNI del socio o cliente.' });
      return;
    }
    if (category !== 'otro' && !selectedItem) {
      notify({ variant: 'warning', message: 'No hay conceptos disponibles en esta categoría para cobrar.' });
      return;
    }
    if (baseAmount <= 0) {
      notify({ variant: 'warning', message: 'El monto a cobrar debe ser mayor a $0.' });
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
      cashierName: user?.name || 'Administración',
      qrData: `https://mpago.la/pos/tenisahora/${receiptId.toLowerCase()}`
    };

    if (onChargeComplete) {
      await onChargeComplete(newReceipt);
    }

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden space-y-6">

      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          Cobro en Mostrador
        </h2>
      </div>

      <form onSubmit={handleProcessCharge} className="space-y-6">
        
        {/* Row 1: Concept & Client */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Concept selector  */}
          <div className="md:col-span-7 space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
              1. Seleccionar Concepto a Cobrar *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    category === cat.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {category !== 'otro' && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                <select
                  value={selectedItem ? selectedItem.id : ''}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  disabled={concepts.length === 0}
                  className={`p-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-tennis-600 font-medium ${withHours ? 'sm:col-span-8' : 'sm:col-span-12'}`}
                >
                  {concepts.length === 0 ? (
                    <option value="">Sin conceptos disponibles</option>
                  ) : (
                    concepts.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.label} — {item.detail}
                      </option>
                    ))
                  )}
                </select>
                {withHours && (
                  <div className="sm:col-span-4 flex items-center gap-1">
                    {[1, 2].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHours(h)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                          hours === h
                            ? 'bg-tennis-50 border-tennis-600 text-tennis-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {h} {h === 1 ? 'hora' : 'horas'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {category === 'otro' && (
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
                    placeholder="Sin puntos ni guiones"
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

        {/* Row 2: Discounts Policy Selection */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
            2. Aplicar Descuento
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {discountOptions.map((disc) => {
              const isSelected = selectedDiscountCode === disc.code;
              return (
                <div
                  key={disc.code}
                  onClick={() => setSelectedDiscountCode(disc.code)}
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all relative ${
                    isSelected
                      ? 'bg-tennis-900 text-white border-tennis-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono font-black ${
                      isSelected ? 'text-tennis-200' : 'text-slate-600'
                    }`}>
                      {disc.code}
                    </span>
                    <span className={`text-xs font-black ${
                      disc.discountPercent === 0 
                        ? (isSelected ? 'text-slate-300' : 'text-slate-500')
                        : (isSelected ? 'text-slate-950 font-black' : 'text-tennis-800')
                    }`}>
                      {disc.discountPercent > 0 ? `${disc.discountPercent}% OFF` : '0%'}
                    </span>
                  </div>
                  
                  <div className={`font-extrabold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {disc.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 3: DYNAMIC BREAKDOWN DIAGRAM (Subtotal -> Descuento en pesos -> Total final) */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-tennis-400 tracking-wider flex items-center gap-1.5">
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
            </div>

            {/* Step 2: Descuento en Pesos */}
            <div className={`p-3.5 rounded-2xl border relative ${
              discountAmountPesos > 0 
                ? 'bg-tennis-950/60 border-tennis-500/50 text-tennis-200' 
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
            }`}>
              <span className="text-[10px] font-bold uppercase text-tennis-400 block mb-1">
                Paso 2: Descuento Aplicado ({activeDiscount.discountPercent}%)
              </span>
              <div className="text-2xl font-black font-mono text-tennis-400">
                {discountAmountPesos > 0 ? `-$${discountAmountPesos.toLocaleString('es-AR')}` : '$0'}
              </div>
              <span className="text-[10px] text-slate-300 truncate block">
                {activeDiscount.name}
              </span>
            </div>

            {/* Step 3: Total Final */}
            <div className="p-4 bg-tennis-600 rounded-2xl border border-tennis-400 shadow-md text-white">
              <span className="text-[10px] font-black uppercase text-tennis-100 tracking-wider block mb-1">
                Paso 3: Total Final a Cobrar
              </span>
              <div className="text-3xl font-black tracking-tight font-mono">
                ${finalAmountToCharge.toLocaleString('es-AR')}
              </div>
            </div>

          </div>
        </div>

        {/* Row 4: Payment Method Selection & Cash Change */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          <div className="md:col-span-8 space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
              3. Selección del Medio de Pago
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'Mercado Pago (QR)', label: 'Billetera virtual QR' },
                { id: 'Tarjeta de Débito', label: 'Débito Bancario' },
                { id: 'Tarjeta de Crédito', label: 'Tarjeta Crédito' },
              ].map(method => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-tennis-600 text-white border-tennis-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[11px] font-bold leading-tight">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QR preview or card terminal */}
          <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center">
            {paymentMethod === 'Mercado Pago (QR)' ? (
              <div className="flex items-center gap-3 text-xs">
                <div className="w-32 h-32 bg-white p-1.5 rounded-lg border border-slate-200 shrink-0">
                  <QRCode value={qrPayloads.payment({ concept: activeConceptName, amount: finalAmountToCharge, reference: 'POS' })} />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">QR Dinámico MP</span>
                  <span className="text-[10px] text-slate-400">Acreditación automática e instantánea al escanear.</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">Terminal POS Bancario</span>
                  <span className="text-[10px] text-slate-400">Pase o inserte la tarjeta en la terminal de cobro.</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Row 5: Action Button & Feedback */}
        <div className="flex justify-end pt-3 border-t border-slate-200">

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-tennis-600 hover:bg-tennis-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2"
          >
            <span>Procesar Cobro (${finalAmountToCharge.toLocaleString('es-AR')}) y Emitir Recibo Oficial</span>
          </button>
        </div>

      </form>

      {/* Floating Success Toast */}
      {showSuccessToast && (
        <div className="absolute bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold">
          <span>¡Cobro registrado exitosamente! Comprobante emitido.</span>
        </div>
      )}

    </div>
  );
}
