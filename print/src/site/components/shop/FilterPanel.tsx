import { useState, type ReactNode } from 'react';
import { Check, ChevronDown, FileText, ShoppingCart } from 'lucide-react';
import type { Category } from '@/lib/types';
import { useDict, useL, useLang } from '@/i18n';
import { cn } from '@/lib/utils';
import { qtyText } from '@/site/components/product/print';
import { T } from './dict';
import type { FacetData, Filters } from './filters';

function toggle<V>(list: V[], v: V) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-5 last:border-b-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink">{title}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-[grid-template-rows,opacity] duration-300 ease-out', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        <div className="-mx-1.5 min-h-0 overflow-hidden px-1.5">
          <div className="pb-1 pt-3.5">{children}</div>
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
      className="group flex w-full items-center gap-3 rounded-lg py-[7px] text-left text-[14px] disabled:cursor-default disabled:opacity-40"
    >
      <span className={cn('grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors', checked ? 'border-ink bg-ink text-paper' : 'border-ink/25 bg-white group-hover:border-ink/60')}>
        <Check className={cn('h-3 w-3 transition-transform duration-200', checked ? 'scale-100' : 'scale-0')} strokeWidth={3.2} />
      </span>
      {icon && <span className="-mx-0.5 text-muted">{icon}</span>}
      <span className={cn('min-w-0 flex-1 truncate transition-colors', checked ? 'font-semibold text-ink' : 'text-ink-soft group-hover:text-ink')}>{label}</span>
      <span className={cn('font-mono text-[11px] tabular-nums', checked ? 'text-ink' : 'text-muted')}>{count}</span>
    </button>
  );
}

function Chip({ on, onClick, count, children }: { on: boolean; onClick: () => void; count: number; children: ReactNode }) {
  const disabled = count === 0 && !on;
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-all disabled:cursor-default disabled:opacity-40',
        on ? 'border-ink bg-ink font-semibold text-paper' : 'border-line bg-white text-ink-soft enabled:hover:border-ink/35 enabled:hover:text-ink',
      )}
    >
      {children}
      <span className={cn('font-mono text-[10.5px] tabular-nums', on ? 'text-paper/60' : 'text-muted')}>{count}</span>
    </button>
  );
}

export interface FilterPanelProps {
  filters: Filters;
  setFilters: (f: Filters) => void;
  facets: FacetData;
  categories: Category[];
  /** Category facet is only offered on the all-products view */
  showCategories: boolean;
}

export function FilterPanel({ filters, setFilters, facets, categories, showCategories }: FilterPanelProps) {
  const t = useDict(T);
  const l = useL();
  const lang = useLang();
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });
  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div>
      <Section title={t('modes')}>
        <div className="flex flex-col">
          {facets.modes.map(({ id, count }) => (
            <CheckRow
              key={id}
              checked={filters.modes.includes(id)}
              onChange={() => set({ modes: toggle(filters.modes, id) })}
              label={t(`m_${id}`)}
              count={count}
              icon={id === 'online' ? <ShoppingCart className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            />
          ))}
        </div>
      </Section>

      {showCategories && (
        <Section title={t('category')}>
          <div className="flex flex-col">
            {facets.cats.map(({ id, count }) => {
              const c = catById.get(id);
              if (!c) return null;
              return <CheckRow key={id} checked={filters.cats.includes(id)} onChange={() => set({ cats: toggle(filters.cats, id) })} label={l(c.name)} count={count} />;
            })}
          </div>
        </Section>
      )}

      <Section title={t('price')}>
        <div className="flex flex-wrap gap-2">
          {facets.price.map(({ id, count }) => (
            <Chip key={id} on={filters.price.includes(id)} count={count} onClick={() => set({ price: toggle(filters.price, id) })}>
              {t(`b_${id}`)}
            </Chip>
          ))}
        </div>
        <p className="mt-2.5 text-[11.5px] leading-snug text-muted">{t('priceNote')}</p>
      </Section>

      <Section title={t('lead')}>
        <div className="flex flex-wrap gap-2">
          {facets.lead.map(({ value, count }) => (
            <Chip key={value} on={filters.lead === value} count={count} onClick={() => set({ lead: filters.lead === value ? null : value })}>
              {t('leadUpTo', { n: value })}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t('moq')}>
        <div className="flex flex-wrap gap-2">
          {facets.moq.map(({ value, count }) => (
            <Chip key={value} on={filters.moq === value} count={count} onClick={() => set({ moq: filters.moq === value ? null : value })}>
              {t('moqUpTo', { n: qtyText(value, lang) })}
            </Chip>
          ))}
        </div>
      </Section>

      {facets.features.length > 1 && (
        <Section title={t('features')}>
          <div className="flex flex-wrap gap-2">
            {facets.features.map(({ id, count }) => (
              <Chip key={id} on={filters.features.includes(id)} count={count} onClick={() => set({ features: toggle(filters.features, id) })}>
                {t(`f_${id}`)}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {facets.badges.length > 0 && (
        <Section title={t('badges')}>
          <div className="flex flex-col">
            {facets.badges.map(({ id, count }) => (
              <CheckRow key={id} checked={filters.badges.includes(id)} onChange={() => set({ badges: toggle(filters.badges, id) })} label={t(`bd_${id}`)} count={count} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
