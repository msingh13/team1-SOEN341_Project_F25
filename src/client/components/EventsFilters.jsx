import { useMemo } from 'react';

export default function EventsFilters({ params, onChange, options }) {
  const categories = options?.categories ?? [];
  const orgs = options?.orgs ?? [];


  const selectedCategories = Array.isArray(params.category) ? params.category : (params.category ? [params.category] : []);
  const q = params.q ?? '';
  const org = params.org ?? '';
  const from = params.from ?? '';
  const to = params.to ?? '';

  function update(field, value) {
    onChange({ ...params, [field]: value, page: 1 });
  }

  function toggleCategory(cat) {
    const set = new Set(selectedCategories);
    set.has(cat) ? set.delete(cat) : set.add(cat);
    update('category', Array.from(set));
  }

  return (
    <form className="filters" onSubmit={e => e.preventDefault()} aria-label="Event filters">
      <div>
        <label htmlFor="q">Keyword</label>
        <input id="q" value={q} onChange={e => update('q', e.target.value)} placeholder="e.g. hackathon" />
      </div>

      <div>
        <label htmlFor="org">Organization</label>
        <select id="org" value={org} onChange={e => update('org', e.target.value)}>
          <option value="">All organizations</option>
          {orgs.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <fieldset>
        <legend>Categories</legend>
        <div role="group" aria-label="Categories">
          {categories.map(cat => (
            <label key={cat} style={{ marginRight: 12 }}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="from">From</label>
        <input id="from" type="date" value={from} onChange={e => update('from', e.target.value)} />
      </div>

      <div>
        <label htmlFor="to">To</label>
        <input id="to" type="date" value={to} onChange={e => update('to', e.target.value)} />
      </div>

      <button type="button" onClick={() => onChange({ page: 1, limit: params.limit ?? 20 })}>
        Clear
      </button>
    </form>
  );
}
