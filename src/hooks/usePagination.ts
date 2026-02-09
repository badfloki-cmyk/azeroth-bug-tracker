import { useState, useMemo, useCallback, useEffect } from "react";

interface UsePaginationOptions<T> {
  items: T[];
  itemsPerPage?: number;
  sortFn?: (a: T, b: T) => number;
}

interface UsePaginationResult<T> {
  currentItems: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function usePagination<T>({
  items,
  itemsPerPage = 5,
  sortFn,
}: UsePaginationOptions<T>): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedItems = useMemo(() => {
    if (!sortFn) return items;
    return [...items].sort(sortFn);
  }, [items, sortFn]);

  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Auto-clamp page when items change (e.g. ticket deleted on last page)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const safePage = Math.min(currentPage, totalPages);

  const currentItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, safePage, itemsPerPage]);

  const hasNextPage = safePage < totalPages;
  const hasPrevPage = safePage > 1;

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const goToNextPage = useCallback(() => {
    if (hasNextPage) setCurrentPage((p) => p + 1);
  }, [hasNextPage]);

  const goToPrevPage = useCallback(() => {
    if (hasPrevPage) setCurrentPage((p) => p - 1);
  }, [hasPrevPage]);

  return {
    currentItems,
    currentPage: safePage,
    totalPages,
    totalItems,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
  };
}
