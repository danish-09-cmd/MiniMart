function pageRange(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  if (currentPage <= 4) return [1, 2, 3, 4, 5, 'right-gap', totalPages];
  if (currentPage >= totalPages - 3) {
    return [1, 'left-gap', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'left-gap', currentPage - 1, currentPage, currentPage + 1, 'right-gap', totalPages];
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Product pages" className="catalog-pagination">
      <ul className="pagination justify-content-center mb-0">
        <li className={`page-item${currentPage <= 1 ? ' disabled' : ''}`}>
          <button className="page-link" type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} aria-label="Previous page">
            <span aria-hidden="true">‹</span><span className="pagination-word">Previous</span>
          </button>
        </li>
        {pageRange(currentPage, totalPages).map((page) => (
          typeof page === 'string'
            ? <li className="page-item disabled" key={page}><span className="page-link" aria-hidden="true">…</span></li>
            : <li className={`page-item${page === currentPage ? ' active' : ''}`} key={page}>
              <button className="page-link" type="button" onClick={() => onPageChange(page)} aria-current={page === currentPage ? 'page' : undefined}>
                {page}
              </button>
            </li>
        ))}
        <li className={`page-item${currentPage >= totalPages ? ' disabled' : ''}`}>
          <button className="page-link" type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} aria-label="Next page">
            <span className="pagination-word">Next</span><span aria-hidden="true">›</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
