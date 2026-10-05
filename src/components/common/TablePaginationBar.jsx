import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';

/**
 * Reusable sortable table header component
 */
export function TableSortHeader({ 
  label, 
  sortField, 
  currentSortKey, 
  currentSortOrder, 
  onSort, 
  align = 'left', 
  className = '' 
}) {
  const isActive = currentSortKey === sortField;
  
  return (
    <th 
      onClick={() => onSort(sortField)}
      className={`py-3 px-3 select-none cursor-pointer transition-colors hover:text-slate-900 group ${className} ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
    >
      <div className={`inline-flex items-center gap-1.5 ${
        align === 'right' ? 'justify-end w-full' : align === 'center' ? 'justify-center w-full' : ''
      }`}>
        <span className={isActive ? 'text-slate-900 font-extrabold' : ''}>{label}</span>
        <span className={`transition-all inline-flex items-center ${
          isActive ? 'text-tennis-600 scale-110 font-black' : 'text-slate-300 group-hover:text-slate-500'
        }`}>
          {isActive ? (
            currentSortOrder === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100" />
          )}
        </span>
      </div>
    </th>
  );
}

/**
 * Reusable pagination bar for tables
 */
export default function TablePaginationBar({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalRecords,
  startRecord,
  endRecord,
  pageSizeOptions = [10, 20, 50]
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs no-print">
      
      {/* Records info and page size selector */}
      <div className="flex items-center gap-4 text-slate-500">
        <div>
          Mostrando <strong className="text-slate-800">{startRecord}</strong> a <strong className="text-slate-800">{endRecord}</strong> de <strong className="text-slate-800">{totalRecords}</strong> registros
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Filas:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="py-1 px-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 outline-none focus:border-tennis-600"
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Page navigation controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
          title="Página anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="px-3 py-1 font-bold text-slate-700 bg-slate-50 rounded-lg border border-slate-200">
          Pág. <span className="text-tennis-700">{page}</span> de <span>{totalPages}</span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
          title="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
