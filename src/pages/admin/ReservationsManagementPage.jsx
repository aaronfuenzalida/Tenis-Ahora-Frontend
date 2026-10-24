import React, { useState, useEffect } from 'react';
import { reservationsService, courtsService, clubConfigService, DEFAULT_CLUB_CONFIG, maxBookingDate } from '../../services/api';
import { Search, Edit3, Trash2 } from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';
import Modal from '../../components/common/Modal';
import ClubPolicyModal from '../../components/admin/ClubPolicyModal';
import TablePaginationBar, { TableSortHeader } from '../../components/common/TablePaginationBar';
import { useTablePagination } from '../../hooks/useTablePagination';
import { calculateHoursUntil, formatHoursMinutes } from '../../utils/formatters';

export default function ReservationsManagementPage() {
  const [reservations, setReservations] = useState([]);
  const [courts, setCourts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit / delete reservation (RF021 / RF023)
  const [resToEdit, setResToEdit] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [resToDelete, setResToDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Remaining balance payment modal
  const [selectedResForPayment, setSelectedResForPayment] = useState(null);
  const [remainingPaymentMethod, setRemainingPaymentMethod] = useState('Mercado Pago (QR)');
  
  // Cancellation modal: las horas de antelación salen del inicio del turno (RD02)
  const [selectedResForCancel, setSelectedResForCancel] = useState(null);
  const [hoursInAdvance, setHoursInAdvance] = useState(0);

  // RD02 - RD05: políticas del club
  const [clubConfig, setClubConfig] = useState(DEFAULT_CLUB_CONFIG);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    const [res, cRes, cfgRes] = await Promise.all([reservationsService.getAll(), courtsService.getAll(), clubConfigService.get()]);
    setReservations(res.data);
    setCourts(cRes.data || []);
    setClubConfig(cfgRes.data);
  };

  const handleOpenEdit = (res) => {
    setResToEdit(res);
    setEditForm({
      courtId: res.courtId,
      date: res.date,
      startTime: res.startTime,
      durationHours: res.durationHours,
      playersType: res.playersType,
      leadName: res.participants?.[0]?.name || '',
      leadPhone: res.participants?.[0]?.phone || '',
      notes: res.notes || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!resToEdit || !editForm) return;
    const court = courts.find(c => c.id === editForm.courtId);
    if (court && court.status === 'mantenimiento') {
      alert('La cancha seleccionada está bloqueada por mantenimiento y no admite reservas (RD06).');
      return;
    }
    const participants = [...(resToEdit.participants || [])];
    if (participants.length > 0) {
      participants[0] = { ...participants[0], name: editForm.leadName, phone: editForm.leadPhone };
    }
    await reservationsService.update(resToEdit.id, {
      courtId: editForm.courtId,
      date: editForm.date,
      startTime: editForm.startTime,
      durationHours: Number(editForm.durationHours),
      playersType: editForm.playersType,
      participants,
      notes: editForm.notes
    });
    setResToEdit(null);
    setEditForm(null);
    loadReservations();
    alert('Reserva modificada correctamente.');
  };

  const handleConfirmDelete = async () => {
    if (!resToDelete) return;
    await reservationsService.delete(resToDelete.id);
    setResToDelete(null);
    loadReservations();
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
    const result = await reservationsService.cancel(selectedResForCancel.id);
    setSelectedResForCancel(null);
    loadReservations();
    
    if (result.isWithinFreeWindow) {
      alert(`Cancelación procesada (>= ${clubConfig.freeCancellationHours} hs de antelación). Se generó el reembolso ${result.refund?.id || ''} por $${(result.refund?.refundAmount || 0).toLocaleString('es-AR')} (pendiente de proceso en Caja > Reembolsos).`);
    } else {
      alert(`Cancelación procesada (< ${clubConfig.freeCancellationHours} hs de antelación): fuera de plazo reglamentario. Se aplicó el cargo ${result.penaltyReceipt?.id || ''} por $${(result.penaltyReceipt?.totalPaid || 0).toLocaleString('es-AR')} y se reintegra el resto como crédito (${result.refund?.id || ''}).`);
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
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors no-print"
        >
          Imprimir Reporte de Reservas
        </button>
      </div>

      {/* Rules Pill */}
      <div className="p-4 bg-tennis-50 rounded-2xl border border-tennis-200 text-xs text-tennis-900 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span><strong>Reglamento de Cobro:</strong> 50% de Seña Obligatoria al reservar + 50% de Saldo Final al terminar el partido en recepción.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-tennis-800">
            Cancelación sin cargo: ≥ {clubConfig.freeCancellationHours} hs · Retención fuera de plazo: {clubConfig.lateCancellationRetentionPercent}% · Reservas hasta {clubConfig.maxAdvanceBookingDays} días
          </span>
          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-tennis-100 text-tennis-800 font-bold border border-tennis-200 no-print"
          >
            Modificar Políticas
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div id="printable-area" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="hidden print:block text-center border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900">TENIS AHORA — REPORTE DE RESERVAS</h2>
          <p className="text-xs text-slate-500">Estado de reservas, señas y saldos • Emitido: {new Date().toLocaleString('es-AR')}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          
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
                <th className="py-3 px-3 text-right no-print">Acciones</th>
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
                      <div className="font-black text-tennis-700">${res.depositPaid?.toLocaleString('es-AR')}</div>
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
                        Recibo #{res.depositReceiptNumber}
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      {res.remainingPaid ? (
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          Liquidado
                        </span>
                      ) : res.status === 'cancelada' ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        <div className="font-black text-slate-600 text-sm">
                          ${res.remainingBalance?.toLocaleString('es-AR')}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-bold ${
                        res.status === 'finalizada'
                          ? 'text-slate-700'
                          : res.status === 'cancelada'
                          ? 'text-slate-700'
                          : 'text-tennis-800'
                      }`}>
                        {res.status === 'finalizada' ? 'Finalizada' : res.status === 'cancelada' ? 'Cancelada' : 'Confirmada'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right no-print">
                      <div className="flex items-center justify-end gap-1.5">
                        {res.status === 'confirmada' && !res.remainingPaid && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(res)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-800"
                            title="Modificar reserva"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(res.status === 'cancelada' || res.status === 'finalizada') && (
                          <button
                            type="button"
                            onClick={() => setResToDelete(res)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-50 text-slate-700 hover:text-slate-600"
                            title="Eliminar reserva del registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {res.status === 'confirmada' && !res.remainingPaid && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedResForPayment(res)}
                              className="px-2.5 py-1 rounded-lg bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                            >
                              Cobrar 50%
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedResForCancel(res);
                                const autoH = Math.max(0, Math.round(calculateHoursUntil(res.date, res.startTime) * 10) / 10);
                                setHoursInAdvance(autoH);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-50 text-slate-600 hover:text-slate-700 text-xs font-semibold"
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

      <ClubPolicyModal
        isOpen={showPolicyModal}
        config={clubConfig}
        onClose={() => setShowPolicyModal(false)}
        onSaved={(cfg) => { setClubConfig(cfg); setShowPolicyModal(false); }}
      />

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
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase">Antelación al Turno:</span>
              <span className="font-bold text-slate-900 font-mono">
                {hoursInAdvance > 0 ? `${formatHoursMinutes(hoursInAdvance)} restantes` : 'El turno ya comenzó'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Calculada respecto a la fecha y hora de inicio del turno.
            </span>
          </div>

          {hoursInAdvance >= clubConfig.freeCancellationHours ? (
            <div className="p-3 bg-tennis-50 text-tennis-900 rounded-xl border border-tennis-200 space-y-1">
              <div className="font-bold flex items-center gap-1 text-tennis-800">
                Cancelación dentro del plazo (&ge; {clubConfig.freeCancellationHours} hs)
              </div>
              <p className="text-[11px] text-tennis-700">
                Corresponde <strong>reembolso total</strong> de la seña abonada (${selectedResForCancel?.depositPaid?.toLocaleString('es-AR')}) al socio.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold flex items-center gap-1 text-slate-800">
                Cancelación fuera de término (&lt; {clubConfig.freeCancellationHours} hs)
              </div>
              <p className="text-[11px] text-slate-700">
                Se aplicará la <strong>retención del {clubConfig.lateCancellationRetentionPercent}% de la seña</strong> (${Math.round((selectedResForCancel?.depositPaid || 0) * clubConfig.lateCancellationRetentionPercent / 100).toLocaleString('es-AR')}) por costo operativo y lucro cesante.
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
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl"
            >
              Confirmar Cancelación
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Reservation Modal (RF021) */}
      <Modal
        isOpen={!!resToEdit}
        onClose={() => { setResToEdit(null); setEditForm(null); }}
        title={`Modificar Reserva ${resToEdit?.id || ''}`}
        maxWidth="max-w-lg"
      >
        {editForm && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Cancha *</label>
              <select
                value={editForm.courtId}
                onChange={(e) => setEditForm({ ...editForm, courtId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white"
              >
                {courts.map(c => (
                  <option key={c.id} value={c.id} disabled={c.status === 'mantenimiento'}>
                    {c.name} ({c.surfaceType}) — ${c.pricePerHour?.toLocaleString('es-AR')}/h{c.status === 'mantenimiento' ? ' — EN MANTENIMIENTO' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Fecha *</label>
                <input type="date" required max={maxBookingDate(clubConfig.maxAdvanceBookingDays)} value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
              </div>
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Inicio *</label>
                <input type="time" required value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
              </div>
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Duración (hs) *</label>
                <select value={editForm.durationHours} onChange={(e) => setEditForm({ ...editForm, durationHours: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
                  <option value={1}>1 hora</option>
                  <option value={1.5}>1,5 horas</option>
                  <option value={2}>2 horas</option>
                  <option value={3}>3 horas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Titular *</label>
                <input type="text" required value={editForm.leadName} onChange={(e) => setEditForm({ ...editForm, leadName: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
              </div>
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Teléfono</label>
                <input type="text" value={editForm.leadPhone} onChange={(e) => setEditForm({ ...editForm, leadPhone: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600" />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Modalidad</label>
              <select value={editForm.playersType} onChange={(e) => setEditForm({ ...editForm, playersType: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white">
                <option value="singles">Singles (2 jugadores)</option>
                <option value="dobles">Dobles (4 jugadores)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
              La seña abonada (${resToEdit?.depositPaid?.toLocaleString('es-AR')}) se mantiene. El saldo final se recalcula según la cancha y duración elegidas.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setResToEdit(null); setEditForm(null); }} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl">Guardar Cambios</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Reservation Modal (RF023) */}
      <Modal isOpen={!!resToDelete} onClose={() => setResToDelete(null)} title="Eliminar Reserva del Registro" maxWidth="max-w-md">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            ¿Desea eliminar definitivamente la reserva <strong>{resToDelete?.id}</strong> ({resToDelete?.courtName}, {resToDelete?.date})? Esta acción no puede deshacerse.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setResToDelete(null)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
            <button type="button" onClick={handleConfirmDelete} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl">Eliminar</button>
          </div>
        </div>
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
