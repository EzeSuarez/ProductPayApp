import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage = 1,
  totalPages = 3,
  totalItems = 18,
  itemsPerPage = 6,
  onPageChange,
}) => {
  const { t } = useTranslation();

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      {/* Products Counter */}
      <div className="text-xs text-zinc-400 font-mono">
        <span>{t.showingProducts(startItem, endItem, totalItems)}</span>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Previous Button */}
        <button
          type="button"
          id="pagination-prev-btn"
          aria-label={t.prevPage}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono flex items-center space-x-1 transition-all duration-200 border ${
            currentPage <= 1
              ? 'border-zinc-800/40 text-zinc-600 bg-zinc-950/40 cursor-not-allowed'
              : 'border-zinc-800 text-zinc-300 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white active:scale-95'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden xs:inline">{t.prevPage}</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {pages.map((page) => {
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                id={`pagination-page-${page}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${page}`}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-xl text-xs font-mono font-medium transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-md shadow-zinc-100/10 scale-105'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-zinc-800/80'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          id="pagination-next-btn"
          aria-label={t.nextPage}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono flex items-center space-x-1 transition-all duration-200 border ${
            currentPage >= totalPages
              ? 'border-zinc-800/40 text-zinc-600 bg-zinc-950/40 cursor-not-allowed'
              : 'border-zinc-800 text-zinc-300 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white active:scale-95'
          }`}
        >
          <span className="hidden xs:inline">{t.nextPage}</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </nav>
  );
};
