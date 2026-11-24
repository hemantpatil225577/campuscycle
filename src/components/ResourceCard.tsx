import { ArrowUpRight } from 'lucide-react';
import type { ResourceItem } from '../types/campuscycle';
import { ResourceImage } from './ResourceImage';

interface ResourceCardProps {
  item: ResourceItem;
  onSelect: (id: string) => void;
}

export function ResourceCard({ item, onSelect }: ResourceCardProps) {
  const savings = Math.max(0, item.estimatedRetailPrice - item.price);

  const priceDisplay =
    item.exchangeType === 'Donate'
      ? 'Free Donation'
      : item.exchangeType === 'Lend'
        ? item.price === 0
          ? 'Free Lend'
          : `₹${item.price} Deposit`
        : `₹${item.price}`;

  return (
    <article
      onClick={() => onSelect(item.id)}
      className="group flex flex-col sky-glass-tile rounded-2xl overflow-hidden cursor-pointer focus-within:ring-2 focus-within:ring-sky-600 focus-within:ring-offset-2"
    >
      <div className="aspect-[4/3] w-full bg-sky-50/80 border-b border-sky-200/70 overflow-hidden">
        <ResourceImage
          src={item.imageUrl}
          alt={item.title}
          category={item.category}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex-1 p-5 flex flex-col">
        {/* Unboxed 1-line metadata kicker (zero pill spam) */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
          <span className="truncate font-medium">
            {item.branch} · Sem {item.semester} · {item.condition}
          </span>
          <span
            className={`shrink-0 font-semibold ${
              item.isAvailable ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {item.isAvailable ? 'Available' : 'Reserved'}
          </span>
        </div>

        <h3 className="mt-2 font-display text-base font-semibold text-[#0F172A] leading-snug line-clamp-2 group-hover:text-sky-700 transition-colors duration-150">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item.id);
            }}
            className="text-left focus:outline-none cursor-pointer"
          >
            {item.title}
          </button>
        </h3>

        <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        <div className="mt-auto pt-4">
          <div className="pt-3 border-t border-sky-200/60 flex items-center justify-between text-xs text-slate-600">
            <span className="truncate max-w-[180px]">{item.ownerName}</span>
            <span>{item.exchangeType}</span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-[#0F172A] tabular-nums">
                {priceDisplay}
              </p>
              <p className="font-mono text-[11px] text-emerald-700 tabular-nums">
                Est. save ₹{savings.toLocaleString('en-IN')}
              </p>
            </div>

            <button
              type="button"
              aria-label={`Inspect ${item.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item.id);
              }}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-sky-900 bg-sky-100/85 border border-sky-200/80 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 group-hover:shadow-sm group-hover:shadow-sky-600/25 rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <span>Inspect</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
