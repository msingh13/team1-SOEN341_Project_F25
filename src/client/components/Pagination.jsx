export default function Pagination({ page, limit, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 20)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="page-btn"
        disabled={!canPrev}
        onClick={() => onPage(page - 1)}
      >
        ← Prev
      </button>

      <span className="page-info" aria-live="polite">
        Page <strong>{page}</strong> of {totalPages}{" "}
        <span className="page-results">({total ?? 0} results)</span>
      </span>

      <button
        className="page-btn"
        disabled={!canNext}
        onClick={() => onPage(page + 1)}
      >
        Next →
      </button>
    </nav>
  );
}
