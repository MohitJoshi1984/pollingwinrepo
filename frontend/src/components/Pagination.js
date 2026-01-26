import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }} data-testid="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          background: currentPage === 1 ? '#f9fafb' : 'white',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          color: currentPage === 1 ? '#9ca3af' : '#374151'
        }}
        data-testid="pagination-prev"
      >
        <ChevronLeft size={18} />
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => page !== '...' && onPageChange(page)}
          disabled={page === '...'}
          style={{
            minWidth: '36px',
            height: '36px',
            padding: '0 12px',
            borderRadius: '8px',
            border: page === currentPage ? 'none' : '1px solid #e5e7eb',
            background: page === currentPage ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
            color: page === currentPage ? 'white' : page === '...' ? '#9ca3af' : '#374151',
            fontWeight: page === currentPage ? '600' : '500',
            fontSize: '14px',
            cursor: page === '...' ? 'default' : 'pointer'
          }}
          data-testid={`pagination-page-${page}`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          background: currentPage === totalPages ? '#f9fafb' : 'white',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          color: currentPage === totalPages ? '#9ca3af' : '#374151'
        }}
        data-testid="pagination-next"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
