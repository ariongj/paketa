import { useState, type ReactNode } from 'react';
import { Check, ChevronDown, Percent, Stamp } from 'lucide-react';
import type { Category } from '@/lib/types';
import { useDict, useL } from '@/i18n';
import { cn } from '@/lib/utils';
import { T } from './dict';
import { PriceRange } from './PriceRange';
import type { FacetData, Filters } from './filters';

function toggle<V>(list: V[], v: V) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Section({ title, children, defaultOpen = true, aside }: { title: string; children: ReactNode; defaultOpen?: boolean; aside?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-5 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex flex-1 items-center justify-between gap-3 text-left">
          <span className="text-[14.5px] font-bold text-ink">{title}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted transition-transform duration-300', open && 'rotate-180')} />
        </button>
        {aside}
      </div>
      <div className={cn('grid transition-[grid-template-rows,opacity] duration-300 ease-out', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        <div className="-mx-1.5 min-h-0 overflow-hidden px-1.5">
          <div className="pb-1 pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ checked, onChange, label, count, icon }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; count: number; icon?: ReactNode }) {
  const disabled = count === 0 && !checked;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center gap-3 rounded-lg py-[7px] text-left text-[14.5px] disabled:cursor-default disabled:opacity-40"
    >
      <span
        className={cn(
          'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors',
          checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink/25 bg-white group-hover:border-ink/60',
        )}
      >
        <Check className={cn('h-3 w-3 transition-transform duration-200', checked ? 'scale-100' : 'scale-0')} strokeWidth={3.2} />
      </span>
      {icon && <span className="-mx-0.5 text-muted">{icon}</span>}
      <span className={cn('min-w-0 flex-1 truncate transition-colors', checked ? 'font-semibold text-ink' : 'text-ink-soft group-hover:text-ink')}>{label}</span>
      <span className={cn('text-[12.5px] tabular-nums', checked ? 'font-semibold text-ink' : 'text-muted')}>{count}</span>
    </button>
  );
}

export interface FilterPanelProps {
  filters: Filters;
  setFilters: (f: Filters) => void;
  sale: boolean;
  setSale: (v: boolean) => void;
  facets: FacetData;
  categories: Category[];
  /** Category facet is only offered on the all-products view */
  showCategories: boolean;
}

export function FilterPanel({ filters, setFilters, sale, setSale, facets, categories, showCategories }: FilterPanelProps) {
  const t = useDict(T);
  const l = useL();
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });
  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div>
      {showCategories && (
        <Section title={t('category')}>
          <div className="flex flex-col">
            {facets.cats.map(({ id, count }) => {
              const c = catById.get(id);
              if (!c || c.soon) return null;
              return <CheckRow key={id} checked={filters.cats.includes(id)} onChange={() => set({ cats: toggle(filters.cats, id) })} label={l(c.name)} count={count} />;
            })}
          </div>
        </Section>
      )}

      {facets.prices.length > 0 && (
        <Section title={t('price')}>
          <PriceRange bounds={facets.bounds} value={filters.price} onChange={(price) => set({ price })} prices={facets.prices} />
          <p className="mt-3 text-[12px] leading-snug text-muted">{t('priceNote')}</p>
        </Section>
      )}

      <Section title={t('offer')}>
        <div className="flex flex-col">
          <CheckRow checked={sale} onChange={setSale} label={t('onSale')} count={facets.sale} icon={<Percent className="h-3.5 w-3.5 text-pink-ink" />} />
          <CheckRow checked={filters.logo} onChange={(logo) => set({ logo })} label={t('withLogo')} count={facets.logo} icon={<Stamp className="h-3.5 w-3.5 text-brand-600" />} />
        </div>
      </Section>

      <Section title={t('availability')}>
        <CheckRow
          checked={filters.stock}
          onChange={(stock) => set({ stock })}
          label={
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t('inStock')}
            </span>
          }
          count={facets.stock}
        />
      </Section>
    </div>
  );
}
