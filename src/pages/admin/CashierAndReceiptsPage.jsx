import React, { useState, useEffect } from 'react';
import { receiptsService } from '../../services/api';
import { Receipt, Search, ChevronDown, ChevronUp } from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';
import POSDiscountCalculator from '../../components/admin/POSDiscountCalculator';
import TablePaginationBar, { TableSortHeader } from '../../components/common/TablePaginationBar';
import { useTablePagination } from '../../hooks/useTablePagination';

export default function CashierAndReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSimulator, setShowSimulator] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [rRes, dRes] = await Promise.all([
      receiptsService.getAll(),
      receiptsService.getDiscounts()
    ]);
    setReceipts(rRes.data);
    setDiscounts(dRes.data);
  };

  const handleChargeCompleted = async (newReceipt) => {
    const res = await receiptsService.create(newReceipt);
    setReceipts(prev => [res.data, ...prev]);
    setSelectedReceipt(res.data);
  };

  const filteredReceipts = receipts.filter(r => 
    r.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.concept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Table pagination and sorting
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
  } = useTablePagination(filteredReceipts, {
    defaultSortKey: 'date',
    defaultSortOrder: 'desc',
    defaultPageSize: 10
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Recibos y Cobros
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSimulator(prev => !prev)}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs border shadow-sm flex items-center gap-1.5 transition-all ${
              showSimulator 
                ? 'bg-tennis-50 text-tennis-900 border-tennis-300' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{showSimulator ? 'Ocultar Cobro en Mostrador' : 'Abrir Cobro en Mostrador'}</span>
            {showSimulator ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            Imprimir Libro de Recibos
          </button>
        </div>
      </div>

      {/* Cobro en mostrador */}
      {showSimulator && (
        <div className="no-print">
          <POSDiscountCalculator discounts={discounts} onChargeComplete={handleChargeCompleted} />
        </div>
      )}

      {/* Receipts History Table */}
      <div id="printable-area" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Registro General de Recibos y Cobros</h2>
              <span className="text-xs text-slate-400">Haz clic en los encabezados para ordenar</span>
            </div>
          </div>

          <div className="relative w-full sm:w-72 no-print">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por socio, DNI o N°..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-tennis-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-slate-50/50">
                <TableSortHeader
                  label="Recibo N°"
                  sortField="id"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Fecha y Hora"
                  sortField="date"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Cliente / DNI"
                  sortField="clientName"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Concepto Cobrado"
                  sortField="concept"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Medio de Pago"
                  sortField="paymentMethod"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Monto Cobrado"
                  sortField="totalPaid"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                  align="right"
                />
                <th className="py-3 px-3 text-center no-print">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No se encontraron registros de cobros con el filtro actual.
                  </td>
                </tr>
              ) : (
                paginatedData.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-tennis-800">
                      {rec.id}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {rec.date}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{rec.clientName}</div>
                      <div className="text-[10px] text-slate-400">DNI: {rec.clientDni}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {rec.concept}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700 inline-flex items-center gap-1 text-[11px]">
                        {rec.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 text-sm font-mono">
                      ${rec.totalPaid?.toLocaleString('es-AR')}
                    </td>
                    <td className="py-3 px-3 text-center no-print">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(rec)}
                        className="px-3 py-1.5 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-bold text-xs border border-tennis-200 inline-flex items-center gap-1 transition-colors"
                      >
                        Ver Recibo
                      </button>
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
