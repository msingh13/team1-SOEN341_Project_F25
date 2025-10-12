export default function Pagination({ page, limit, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 20)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button disabled={!canPrev} onClick={() => onPage(page - 1)}>Previous</button>
      <span aria-live="polite" style={{ padding: '0 8px' }}>
        Page {page} of {totalPages} — {total ?? 0} results
      </span>
      <button disabled={!canNext} onClick={() => onPage(page + 1)}>Next</button>
    </nav>
  );
}
