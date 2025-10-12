import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EventsFilters from '../components/EventsFilters.jsx';
import Pagination from '../components/Pagination.jsx';
import EventCard from '../components/EventCard.jsx';
import { getEvents } from '../lib/api.js';

const DEFAULT_LIMIT = 20;

export default function EventsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [options, setOptions] = useState({ categories: [], orgs: [] });
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || DEFAULT_LIMIT);

  const params = useMemo(() => {
    const obj = Object.fromEntries(searchParams.entries());

    const multiCats = searchParams.getAll('category');
    if (multiCats.length) obj.category = multiCats;
    obj.page = Number(obj.page || 1);
    obj.limit = Number(obj.limit || DEFAULT_LIMIT);
    return obj;
  }, [searchParams]);

  function updateParams(next) {
    const merged = { ...params, ...next };
    const sp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return;
      if (Array.isArray(v)) v.forEach(val => sp.append(k, String(val)));
      else sp.set(k, String(v));
    });
    setSearchParams(sp, { replace: true });
  }

  useEffect(() => {
    setOptions({
      categories: ['Academic', 'Sports', 'Club', 'Career', 'Social'],
      orgs: ['CSU', 'ECA', 'IEEE', 'CASA', 'Sports Union']
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getEvents({
          q: params.q,
          org: params.org,
          from: params.from,
          to: params.to,
          page: params.page,
          limit: params.limit,
          category: params.category
        });
        if (!cancelled) {
          setItems(data.items || []);
          setTotal(data.total ?? 0);
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.q, params.org, params.from, params.to, params.page, params.limit, params.category]);

  return (
    <section>
      <h2>Events</h2>

      <EventsFilters
        params={params}
        options={options}
        onChange={updateParams}
      />

      {loading ? (
        <div role="status" aria-live="polite">
          <div className="skeleton" style={{ height: 120, margin: '12px 0' }} />
          <div className="skeleton" style={{ height: 120, margin: '12px 0' }} />
          <div className="skeleton" style={{ height: 120, margin: '12px 0' }} />
          <span className="sr-only">Loading events…</span>
        </div>
      ) : items.length === 0 ? (
        <p role="status" aria-live="polite">No events match your filters.</p>
      ) : (
        <>
          <div
            className="grid"
            role="region"
            aria-live="polite"
            aria-label="Event results"
            style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
          >
            {items.map(ev => <EventCard key={ev.id} event={ev} />)}
          </div>

          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPage={(p) => updateParams({ page: p })}
          />
        </>
      )}
    </section>
  );
}
