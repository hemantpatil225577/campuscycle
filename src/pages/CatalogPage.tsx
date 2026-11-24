import { useCallback, useEffect, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { ResourceCard } from '../components/ResourceCard';
import type {
  Branch,
  ExchangeType,
  ItemCategory,
  ItemCondition,
  ResourceItem,
  Semester,
} from '../types/campuscycle';

const BRANCHES: (Branch | 'ALL')[] = [
  'ALL',
  'CSE',
  'IT',
  'ECE',
  'EEE',
  'ME',
  'CE',
  'Other',
];

const CATEGORIES: (ItemCategory | 'ALL')[] = [
  'ALL',
  'Textbooks',
  'Lab Equipment',
  'Engineering Tools',
  'Stationery',
  'Other',
];

export function CatalogPage() {
  const { path, navigate } = useApp();
  const initialParams = new URLSearchParams(path.split('?')[1] || '');

  const [q, setQ] = useState(initialParams.get('q') || '');
  const [branch, setBranch] = useState<Branch | 'ALL'>(
    (initialParams.get('branch') as Branch) || 'ALL'
  );
  const [semester, setSemester] = useState<Semester | 'ALL'>(
    initialParams.get('semester')
      ? (Number(initialParams.get('semester')) as Semester)
      : 'ALL'
  );
  const [category, setCategory] = useState<ItemCategory | 'ALL'>(
    (initialParams.get('category') as ItemCategory) || 'ALL'
  );
  const [condition, setCondition] = useState<ItemCondition | 'ALL'>('ALL');
  const [exchangeType, setExchangeType] = useState<ExchangeType | 'ALL'>('ALL');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');

  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sp = new URLSearchParams(path.split('?')[1] || '');
    setQ(sp.get('q') || '');
    setBranch((sp.get('branch') as Branch) || 'ALL');
    setSemester(sp.get('semester') ? (Number(sp.get('semester')) as Semester) : 'ALL');
    setCategory((sp.get('category') as ItemCategory) || 'ALL');
  }, [path]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.listItems({
        q,
        branch,
        semester: semester === 'ALL' ? 'ALL' : String(semester),
        category,
        condition,
        exchangeType,
        availableOnly,
        sort,
      });
      setItems(res.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load catalog listings.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    q,
    branch,
    semester,
    category,
    condition,
    exchangeType,
    availableOnly,
    sort,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchItems();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [fetchItems]);

  const resetAll = () => {
    setQ('');
    setBranch('ALL');
    setSemester('ALL');
    setCategory('ALL');
    setCondition('ALL');
    setExchangeType('ALL');
    setAvailableOnly(false);
    setSort('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0F172A]">
            Browse Campus Resources
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Search and filter textbooks, lab equipment, engineering tools, and
            stationery across branches and semesters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/items/new')}
          className="px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 sky-btn-lift whitespace-nowrap shrink-0 self-start cursor-pointer"
        >
          List an Item
        </button>
      </div>

      {/* Search & Filter Panel */}
      <div className="mt-6 sky-glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-700/70"
              aria-hidden="true"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search item title or description..."
              aria-label="Search item title or description"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 hover:bg-white/95 border border-sky-200 hover:border-sky-300 rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 transition-colors"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filter by branch"
            className="flex items-center gap-1 p-1 bg-sky-100/80 border border-sky-200/75 rounded-lg overflow-x-auto"
          >
            {BRANCHES.map((b) => (
              <button
                key={b}
                type="button"
                role="tab"
                aria-selected={branch === b}
                onClick={() => setBranch(b)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer transition-all duration-150 ${
                  branch === b
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-slate-600 hover:text-sky-900 hover:bg-white/60'
                }`}
              >
                {b === 'ALL' ? 'All Branches' : b}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-sky-200/70 flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by semester"
            value={semester}
            onChange={(e) =>
              setSemester(
                e.target.value === 'ALL'
                  ? 'ALL'
                  : (Number(e.target.value) as Semester)
              )
            }
            className="px-3 py-2 text-xs font-medium bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory | 'ALL')}
            className="px-3 py-2 text-xs font-medium bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by condition"
            value={condition}
            onChange={(e) =>
              setCondition(e.target.value as ItemCondition | 'ALL')
            }
            className="px-3 py-2 text-xs font-medium bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
          >
            <option value="ALL">Any Condition</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>

          <select
            aria-label="Filter by exchange type"
            value={exchangeType}
            onChange={(e) =>
              setExchangeType(e.target.value as ExchangeType | 'ALL')
            }
            className="px-3 py-2 text-xs font-medium bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
          >
            <option value="ALL">All Exchange Types</option>
            <option value="Sell">Sell</option>
            <option value="Lend">Lend</option>
            <option value="Donate">Donate</option>
          </select>

          <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white/75 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-sky-300 text-sky-600 focus:ring-sky-600"
            />
            <span>Available only</span>
          </label>

          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-800 hover:text-[#0F172A] hover:bg-sky-100/75 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-xs text-slate-600 tabular-nums">
              {items.length} results
            </span>
            <select
              aria-label="Sort results"
              value={sort}
              onChange={(e) =>
                setSort(
                  e.target.value as 'newest' | 'price-asc' | 'price-desc'
                )
              }
              className="px-3 py-2 text-xs font-medium bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Sort: Price Low → High</option>
              <option value="price-desc">Sort: Price High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Area */}
      {error && (
        <div className="mt-6 p-4 bg-red-50/90 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl border border-sky-200/70 bg-white/50 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 sky-glass-panel rounded-2xl p-12 text-center">
          <p className="font-display text-lg font-bold text-[#0F172A]">
            No matching resources found
          </p>
          <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
            No items match your current branch, semester, or search filters.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="mt-5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ResourceCard
              key={item.id}
              item={item}
              onSelect={(id) => navigate(`/items/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
