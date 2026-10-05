import React, { useState, useEffect } from 'react';
import { reservationsService } from '../../services/api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Search, 
  DollarSign, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  CreditCard,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';
import Modal from '../../components/common/Modal';
import TablePaginationBar, { TableSortHeader } from '../../components/common/TablePaginationBar';
import { useTablePagination } from '../../hooks/useTablePagination';
import { calculateHoursUntil, formatHoursMinutes } from '../../utils/formatters';

export default function ReservationsManagementPage() {
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Remaining balance payment modal
  const [selectedResForPayment, setSelectedResForPayment] = useState(null);
  const [remainingPaymentMethod, setRemainingPaymentMethod] = useState('Efectivo');
  
  // Cancellation modal with 6-hour advance policy
  const [selectedResForCancel, setSelectedResForCancel] = useState(null);
  const [hoursInAdvance, setHoursInAdvance] = useState(8);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    const res = await reservationsService.getAll();
    setReservations(res.data);
  };

  const handlePayRemaining = async (e) => {
    e.preventDefault();
    await reservationsService.payRemainingBalance(selectedResForPayment.id, remainingPaymentMethod);
    setSelectedResForPayment(null);
    loadReservations();
    alert('¡Cobro del 50% restante liquidado y registrado en caja!');
  };

  const handleCancelReservation = async (e) => {
    e.preventDefault();
    const result = await reservationsService.cancel(selectedResForCancel.id, Number(hoursInAdvance));
    setSelectedResForCancel(null);
    loadReservations();
    
    if (result.isWithinFreeWindow) {
      alert('Cancelación procesada (>6hs de antelación): Se gestiona reembolso conforme a las políticas del club.');
    } else {
      alert('Cancelación procesada (<6hs de antelación): Fuera de plazo reglamentario. Se aplica retención de la seña.');
    }
  };

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = 
      r.courtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  // Client-side pagination and column sorting (Point 8)
  const keyExtractors = {
    courtName: (r) => r.courtName,
    date: (r) => `${r.date} ${r.startTime}`,
    titular: (r) => r.participants?.[0]?.name || '',
    depositPaid: (r) => r.depositPaid,
    remainingBalance: (r) => r.remainingBalance,
    status: (r) => r.status
  };

  const {
    paginatedData,
    sortKey,
    sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalRecords,
    startRecord,
    endRecord
  } = useTablePagination(filteredReservations, {
    defaultSortKey: 'date',
    defaultSortOrder: 'desc',
    defaultPageSize: 10,
    keyExtractors
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Control de Reservas y Liquidación de Saldos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestión de señas del 50%, cobro del 50% al finalizar partido, y aplicación de política de cancelación (mínimo 6hs de antelación).
          </p>
        </div>
      </div>

      {/* Rules Pill */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span><strong>Reglamento de Cobro:</strong> 50% de Seña Obligatoria al reservar + 50% de Saldo Final al terminar el partido en recepción.</span>
        </div>
        <span className="font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-800">
          Cancelaciones: ≥ 6 hs
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cancha, socio, DNI o N°..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-tennis-600"
            />
          </div>

          <div className="flex items-center gap-2">
            {['ALL', 'confirmada', 'finalizada', 'cancelada'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === status
                    ? 'bg-tennis-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' ? 'Todas' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Reservations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-slate-50/50">
                <TableSortHeader
                  label="Código"
                  sortField="id"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Cancha y Horario"
                  sortField="date"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Titular y Jugadores"
                  sortField="titular"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Seña 50% (Cobrada)"
                  sortField="depositPaid"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Saldo 50% (Pendiente)"
                  sortField="remainingBalance"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Estado"
                  sortField="status"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                  align="center"
                />
                <th className="py-3 px-3 text-right">Acciones de Caja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No se encontraron reservas registradas para esta búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedData.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-tennis-800">
                      {res.id}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900">{res.courtName}</div>
                      <div className="text-[11px] text-slate-500">{res.date} • {res.startTime} a {res.endTime} ({res.durationHours} hs)</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{res.participants[0]?.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {res.participants?.length} Jugadores ({res.playersType})
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-black text-emerald-700">${res.depositPaid?.toLocaleString('es-AR')}</div>
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt({
                          id: res.depositReceiptNumber,
                          clientName: res.participants[0]?.name,
                          clientDni: res.participants[0]?.dni,
                          concept: `Seña 50% - ${res.courtName}`,
                          items: [
                            { description: `Alquiler ${res.courtName}`, amount: res.courtCost },
                            { description: `Equipamiento incluido (Red, Pelotas, Raquetas)`, amount: 0 },
                            { description: `Seña 50% Abonada`, amount: res.depositPaid }
                          ],
                          totalPaid: res.depositPaid,
                          paymentMethod: res.depositPaymentMethod,
                          date: res.date
                        })}
                        className="text-[10px] text-tennis-700 hover:underline flex items-center gap-0.5 mt-0.5"
                      >
                        <Printer className="w-3 h-3" /> Recibo #{res.depositReceiptNumber}
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      {res.remainingPaid ? (
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Liquidado
                        </span>
                      ) : res.status === 'cancelada' ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        <div className="font-black text-amber-600 text-sm">
                          ${res.remainingBalance?.toLocaleString('es-AR')}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        res.status === 'finalizada'
                          ? 'bg-slate-100 text-slate-700'
                          : res.status === 'cancelada'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {res.status === 'finalizada' ? 'Finalizada' : res.status === 'cancelada' ? 'Cancelada' : 'Confirmada'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {res.status === 'confirmada' && !res.remainingPaid && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedResForPayment(res)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" /> Cobrar 50%
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedResForCancel(res);
                                const autoH = Math.max(0, Math.round(calculateHoursUntil(res.date, res.startTime) * 10) / 10);
                                setHoursInAdvance(autoH);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-semibold"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Bar */}
        <TablePaginationBar
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          totalRecords={totalRecords}
          startRecord={startRecord}
          endRecord={endRecord}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      {/* Pay Remaining Balance Modal */}
      <Modal
        isOpen={!!selectedResForPayment}
        onClose={() => setSelectedResForPayment(null)}
        title={`Cobro de Saldo Restante (50%): ${selectedResForPayment?.id}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePayRemaining} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500">Cancha: <strong>{selectedResForPayment?.courtName}</strong></div>
            <div className="text-slate-500">Socio: <strong>{selectedResForPayment?.participants[0]?.name}</strong></div>
            <div className="text-slate-500">Seña 50% ya acreditada: <strong>${selectedResForPayment?.depositPaid?.toLocaleString('es-AR')}</strong></div>
            <div className="mt-2 text-base font-extrabold text-slate-900 border-t pt-2 flex justify-between">
              <span>Saldo Final a Cobrar (50%):</span>
              <span className="text-tennis-700">${selectedResForPayment?.remainingBalance?.toLocaleString('es-AR')} ARS</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Medio de Pago en Recepción:</label>
            <select
              value={remainingPaymentMethod}
              onChange={(e) => setRemainingPaymentMethod(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none bg-white font-bold text-slate-800"
            >
              <option value="Efectivo">Efectivo en Caja</option>
              <option value="Mercado Pago (QR)">Mercado Pago (QR)</option>
              <option value="Tarjeta de Débito">Tarjeta de Débito</option>
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-sm shadow-md"
          >
            Confirmar Cobro y Emitir Recibo Final
          </button>
        </form>
      </Modal>

      {/* Cancellation Policy Modal */}
      <Modal
        isOpen={!!selectedResForCancel}
        onClose={() => setSelectedResForCancel(null)}
        title={`Cancelar Reserva ${selectedResForCancel?.id}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCancelReservation} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800">{selectedResForCancel?.courtName}</div>
            <div className="text-slate-600">Fecha y Turno: <strong>{selectedResForCancel?.date} ({selectedResForCancel?.startTime} hs)</strong></div>
            <div className="text-slate-600">Seña 50% Abonada: <strong>${selectedResForCancel?.depositPaid?.toLocaleString('es-AR')}</strong></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 uppercase block">
                Horas de Antelación al Turno:
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatHoursMinutes(Number(hoursInAdvance))} restantes
              </span>
            </div>
            <input
              type="number"
              step="0.5"
              min="0"
              max="720"
              value={hoursInAdvance}
              onChange={(e) => setHoursInAdvance(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold outline-none focus:border-tennis-600"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Calculado automáticamente respecto a la fecha y hora de inicio del turno.
            </span>
          </div>

          {Number(hoursInAdvance) >= 6 ? (
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 space-y-1">
              <div className="font-bold flex items-center gap-1 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Cancelación dentro del plazo (&ge; 6 hs)
              </div>
              <p className="text-[11px] text-emerald-700">
                Corresponde <strong>reembolso total</strong> de la seña abonada (${selectedResForCancel?.depositPaid?.toLocaleString('es-AR')}) al socio.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200 space-y-1">
              <div className="font-bold flex items-center gap-1 text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Cancelación fuera de término (&lt; 6 hs)
              </div>
              <p className="text-[11px] text-red-700">
                Se aplicará la <strong>retención del 50% de la seña</strong> (${selectedResForCancel?.depositPaid?.toLocaleString('es-AR')}) por costo operativo y lucro cesante.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedResForCancel(null)}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Volver
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
            >
              Confirmar Cancelación
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receipt={selectedReceipt}
        />
      )}

    </div>
  );
}
