import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  FlaskConical,
  Leaf,
  Package,
  PenTool,
  Search,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { ResourceCard } from '../components/ResourceCard';
import type { ImpactStats, ItemCategory, ResourceItem } from '../types/campuscycle';

const CATEGORIES: {
  name: ItemCategory;
  subtitle: string;
  icon: typeof BookOpen;
}[] = [
  {
    name: 'Textbooks',
    subtitle: 'DSA, Maths, DBMS, Mechanics & core references',
    icon: BookOpen,
  },
  {
    name: 'Lab Equipment',
    subtitle: 'Cotton lab coats, safety goggles, Arduino kits',
    icon: FlaskConical,
  },
  {
    name: 'Engineering Tools',
    subtitle: 'Mini-drafters, scientific calculators, calipers',
    icon: Wrench,
  },
  {
    name: 'Stationery',
    subtitle: 'Graph pads, set squares, scales & drafting pens',
    icon: PenTool,
  },
  {
    name: 'Other',
    subtitle: 'Workshop aprons, project enclosures & manuals',
    icon: Package,
  },
];

export function HomePage() {
  const { navigate } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [featured, setFeatured] = useState<ResourceItem[]>([]);
  const [impact, setImpact] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.listItems({ sort: 'newest' }), api.getImpact()])
      .then(([itemsRes, impactRes]) => {
        if (!mounted) return;
        setFeatured(itemsRes.items.slice(0, 6));
        setImpact(impactRes);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="sky-glass-hero rounded-2xl p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wide text-sky-700">
                College Peer-to-Peer Academic Exchange
              </p>
              <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight text-[#0F172A] leading-[1.1] [text-wrap:balance]">
                Exchange Resources. Save Money. Reduce Waste.
              </h1>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
                Buy, sell, borrow, lend, or donate used semester textbooks,
                lab coats, engineering drafters, and scientific calculators
                directly with verified students on your campus.
              </p>

              {/* Hero Search */}
              <form
                onSubmit={handleHeroSearch}
                className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-xl"
              >
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-700/70"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search CLRS, lab coat, Casio fx-991EX, drafter..."
                    aria-label="Search campus academic resources"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-white/85 border border-sky-200 rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 sky-btn-lift whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Search Catalog
                </button>
              </form>

              {/* Primary CTAs */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/catalog')}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-sky-950 rounded-lg sky-btn-lift cursor-pointer"
                >
                  <span>Browse Resources</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/items/new')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0F172A] bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg sky-btn-lift cursor-pointer"
                >
                  <span>List an Item</span>
                </button>
              </div>
            </div>

            {/* Hero Editorial Photo */}
            <div className="lg:col-span-6">
              <div className="group relative h-64 sm:h-80 lg:h-full min-h-[300px] w-full overflow-hidden rounded-xl border border-sky-200/80 bg-sky-100/70">
                <img
                  src="/src/assets/images/hero_campus_exchange_1795440583178.jpg"
                  alt="Engineering textbooks, white lab coat, and steel mini-drafter ready for campus peer exchange"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-xs font-medium text-sky-300">
                    Campus-Verified Pickup &amp; Dual-Confirmation Handover
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    Coordinate exchanges at your college library, canteen, or
                    department office.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0F172A]">
              Browse by Resource Category
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Jump directly to textbooks, lab wear, or precision tools needed
              for your semester.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() =>
                  navigate(`/catalog?category=${encodeURIComponent(cat.name)}`)
                }
                className="text-left p-5 sky-glass-tile rounded-2xl cursor-pointer group"
              >
                <span className="h-10 w-10 rounded-xl bg-sky-100/85 border border-sky-200/80 flex items-center justify-center text-sky-700 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 group-hover:scale-105 transition-all duration-150">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-3.5 font-display text-base font-semibold text-[#0F172A] group-hover:text-sky-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {cat.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0F172A]">
              Featured Campus Listings
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Recent textbooks and engineering tools shared across CSE, IT, ECE,
              EEE, ME, and CE batches.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="text-sm font-semibold text-sky-700 hover:text-sky-900 hover:translate-x-0.5 transition-all duration-150 whitespace-nowrap cursor-pointer"
          >
            View all listings →
          </button>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl border border-sky-200/70 bg-white/50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((item) => (
              <ResourceCard
                key={item.id}
                item={item}
                onSelect={(id) => navigate(`/items/${id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-sky-100/40 backdrop-blur-sm border-y border-sky-200/75 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-[#0F172A]">
              How CampusCycle Works
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              A transparent, conflict-free exchange workflow built for campus
              safety and accountability.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Filter by Branch & Sem',
                body: 'Search textbooks, drafters, and lab equipment tailored to your exact engineering semester and condition preference.',
              },
              {
                step: '02',
                title: 'Request & Reserve',
                body: 'Send a request message to the senior owner. Once accepted, the item is locked so no conflicting reservations occur.',
              },
              {
                step: '03',
                title: 'Coordinate Pickup Hub',
                body: 'Agree on a shared campus spot—College Library, Canteen, Department Office, or Main Gate—with date and time.',
              },
              {
                step: '04',
                title: 'Dual-Confirm Handover',
                body: 'Owner confirms handing over the item and borrower confirms receipt before the exchange is marked Completed.',
              },
            ].map((card) => (
              <div
                key={card.step}
                className="group sky-glass-tile rounded-2xl p-6"
              >
                <span className="font-mono text-xs font-semibold text-sky-700 group-hover:text-sky-600 tabular-nums transition-colors">
                  {card.step}
                </span>
                <h3 className="mt-2 font-display text-base font-bold text-[#0F172A] group-hover:text-sky-800 transition-colors">
                  {card.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability & Impact Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="sky-glass-hero rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sky-700 text-xs font-semibold">
            <Leaf className="h-4 w-4 text-emerald-700" />
            <span>Campus Sustainability Impact</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold text-[#0F172A]">
            Measurable Reuse Across Batches
          </h2>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-sky-200/75">
            <div className="rounded-xl p-3 hover:bg-white/60 transition-colors duration-150">
              <p className="text-xs text-slate-600">Completed Exchanges</p>
              <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-[#0F172A] tabular-nums">
                {impact ? impact.completedExchanges : '—'}
              </p>
            </div>
            <div className="rounded-xl p-3 hover:bg-white/60 transition-colors duration-150">
              <p className="text-xs text-slate-600">Resources Reused</p>
              <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-[#0F172A] tabular-nums">
                {impact ? impact.resourcesReused : '—'}
              </p>
            </div>
            <div className="rounded-xl p-3 hover:bg-white/60 transition-colors duration-150">
              <p className="text-xs text-slate-600">
                Estimated Student Savings
              </p>
              <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-sky-700 tabular-nums">
                {impact
                  ? `₹${impact.estimatedSavingsInr.toLocaleString('en-IN')}`
                  : '—'}
              </p>
            </div>
            <div className="rounded-xl p-3 hover:bg-white/60 transition-colors duration-150">
              <p className="text-xs text-slate-600">Active Available Listings</p>
              <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-[#0F172A] tabular-nums">
                {impact ? impact.activeListings : '—'}
              </p>
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-600">
            {impact?.disclaimer ||
              'Estimated savings are calculated from recorded listing retail reference prices minus peer exchange amounts, not verified financial outcomes.'}
          </p>
        </div>
      </section>
    </div>
  );
}
