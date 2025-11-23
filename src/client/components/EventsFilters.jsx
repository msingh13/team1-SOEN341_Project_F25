import { useEffect, useMemo, useState } from "react";

export default function EventsFilters({ params, onChange, options }) {
  const categories = options?.categories ?? [];
  const orgOptions = useMemo(
    () =>
      (options?.orgs ?? []).map((o) =>
        typeof o === "string" ? { id: o, name: o } : o
      ),
    [options?.orgs]
  );

  const selectedCategories = Array.isArray(params.category)
    ? params.category
    : params.category
    ? [params.category]
    : [];

  const [qInput, setQInput] = useState(params.q ?? "");
  const org = params.org ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";

  function update(field, value) {
    onChange({ ...params, [field]: value, page: 1 });
  }

  function toggleCategory(cat) {
    const set = new Set(selectedCategories);
    set.has(cat) ? set.delete(cat) : set.add(cat);
    update("category", Array.from(set));
  }

  function clearAll() {
    onChange({
      ...params,
      q: "",
      org: "",
      category: [],
      from: "",
      to: "",
      page: 1,
      limit: params.limit ?? 20,
    });
    setQInput("");
  }

  // debounce keyword input
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.q ?? "") !== qInput) update("q", qInput);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  // optional: guard against invalid date range
  useEffect(() => {
    if (from && to && from > to) {
      onChange({ ...params, from: to, to: from, page: 1 });
    }
  }, [from, to]);

  return (
    <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Event filters">
      <div className="filter-row">
        <label htmlFor="q" className="filter-label">Keyword</label>
        <input
          id="q"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="e.g. hackathon"
          className="filter-input"
          inputMode="search"
        />
      </div>

      <div className="filter-row">
        <label htmlFor="org" className="filter-label">Organization</label>
        <select
          id="org"
          value={org}
          onChange={(e) => update("org", e.target.value)}
          className="filter-input"
        >
          <option value="">All organizations</option>
          {orgOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="filter-fieldset">
        <legend className="filter-legend">Categories</legend>
        <div role="group" aria-label="Categories" className="chips">
          {categories.map((cat) => {
            const checked = selectedCategories.includes(cat);
            return (
              <label key={cat} className={`chip ${checked ? "chip--on" : ""}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(cat)}
                  className="chip-input"
                />
                <span className="chip-label">{cat}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="filter-row">
        <label htmlFor="from" className="filter-label">From</label>
        <input
          id="from"
          type="date"
          value={from}
          onChange={(e) => update("from", e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-row">
        <label htmlFor="to" className="filter-label">To</label>
        <input
          id="to"
          type="date"
          value={to}
          onChange={(e) => update("to", e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-actions">
        <button type="button" className="btn btn-muted" onClick={clearAll}>
          Clear
        </button>
      </div>
    </form>
  );
}
