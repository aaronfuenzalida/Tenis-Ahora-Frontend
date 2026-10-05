import { useState, useMemo } from 'react';

/**
 * Custom hook for client-side sorting and pagination
 * @param {Array} data - Raw array of objects
 * @param {Object} options - Configuration options
 */
export function useTablePagination(data = [], {
  defaultSortKey = '',
  defaultSortOrder = 'asc',
  defaultPageSize = 10,
  keyExtractors = {}
} = {}) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !Array.isArray(data)) return data;
    return [...data].sort((a, b) => {
      let valA = keyExtractors[sortKey] ? keyExtractors[sortKey](a) : a[sortKey];
      let valB = keyExtractors[sortKey] ? keyExtractors[sortKey](b) : b[sortKey];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Number comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      // Check if both are numeric strings
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      // String comparison (case-insensitive)
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder, keyExtractors]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safePage, pageSize]);

  const startRecord = sortedData.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRecord = Math.min(safePage * pageSize, sortedData.length);

  return {
    sortedData,
    paginatedData,
    sortKey,
    sortOrder,
    handleSort,
    page: safePage,
    setPage,
    pageSize,
    setPageSize: (size) => {
      setPageSize(Number(size));
      setPage(1);
    },
    totalPages,
    totalRecords: sortedData.length,
    startRecord,
    endRecord
  };
}
