// Catalogue picker for draft orders: price hint "nga €x / copë", minimum order and a quote-only marker.
import { useCallback, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Thumb } from '@/admin/components/kit';
import { useDismiss } from '@/admin/layout/popover';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { useCategories } from '@/store/hooks';
import { searchProducts } from '@/lib/search';
import { minQty } from '@/lib/pricing';
import { isTracked } from '@/lib/inventory';
import { num } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { fromPrice, unitMoney } from './drafts';

const T = defineDict({
  sq: {
    placeholder: 'Kërko në katalog — emri, SKU ose kategoria',
    popular: 'Më të porositurat',
    results: 'Rezultatet',
    none: 'Nuk ka produkte për „{q}“',
    stock: 'Stoku: {n}',
    moq: 'Min. {n} copë',
    quote: 'Me ofertë',
    quoteHint: 'Shtohet si artikull custom — çmimin e vendos ekipi',
    from: 'nga',
    perPc: '/ copë',
    perSet: '/ set',
  },
  en: {
    placeholder: 'Search the catalogue — name, SKU or category',
    popular: 'Most ordered',
    results: 'Results',
    none: 'No products for “{q}”',
    stock: 'Stock: {n}',
    moq: 'Min. {n} pcs',
    quote: 'Quote only',
    quoteHint: 'Added as a custom item — the team sets the price',
    from: 'from',
    perPc: '/ pc',
    perSet: '/ set',
  },
});

/** Catalogue search with a results dropdown (keyboard: ↑ ↓ Enter, Esc). */
export function ProductSearch({ onPick, disabled }: { onPick: (p: Product) => void; disabled?: boolean }) {
  const t = useDict(T, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const products = useDb((s) => s.products);
  const categories = useCategories();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  const sellable = useMemo(() => products.filter((p) => p.status === 'active'), [products]);
  const list = useMemo(() => (q.trim() ? searchProducts(sellable, categories, q, lang).slice(0, 8) : [...sellable].sort((a, b) => b.sold - a.sold).slice(0, 6)), [q, sellable, categories, lang]);
  const catName = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? l(c.name) : '';
  };

  const pick = (p: Product) => {
    onPick(p);
    setQ('');
    setOpen(false);
    setActive(0);
  };

  return (
    <div ref={ref} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={q}
        disabled={disabled}
        aria-label={t('placeholder')}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') return setOpen(false);
          if (!open) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(list.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === 'Enter' && list[active]) {
            e.preventDefault();
            pick(list[active]);
          }
        }}
        placeholder={t('placeholder')}
        className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13.5px] outline-none transition placeholder:text-muted/70 focus:border-ink/40 focus:ring-4 focus:ring-ink/5 disabled:bg-canvas"
      />
      {open && !disabled && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_12px_40px_-12px_rgb(0_0_0/0.35)]">
          <p className="border-b border-line/70 px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">{q.trim() ? t('results') : t('popular')}</p>
          {list.length === 0 ? (
            <p className="px-3 py-4 text-[13px] text-muted">{t('none', { q })}</p>
          ) : (
            <ul className="max-h-[340px] overflow-y-auto py-1">
              {list.map((p, i) => {
                const tiered = !!p.tiers?.length;
                const moq = minQty(p);
                const meta = [p.sku, catName(p.categoryId), moq > 1 ? t('moq', { n: num(moq, lang) }) : null, isTracked(p) ? t('stock', { n: num(p.stock, lang) }) : null].filter(Boolean).join(' · ');
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(p)}
                      title={p.quoteOnly ? t('quoteHint') : undefined}
                      className={cn('flex w-full items-center gap-3 px-3 py-2 text-left', i === active && 'bg-ink/[0.05]')}
                    >
                      <Thumb src={p.images[0]} className="h-10 w-10 rounded-md" />
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-medium text-ink">{l(p.name)}</span>
                          {p.quoteOnly && <span className="inline-flex h-[18px] shrink-0 items-center rounded border border-ink/20 px-1.5 text-[11px] font-semibold text-ink-soft">{t('quote')}</span>}
                        </span>
                        <span className="block truncate text-[12px] text-muted">{meta}</span>
                      </span>
                      <span className="shrink-0 text-right text-[13px] tabular-nums text-ink">
                        {(tiered || p.quoteOnly) && <span className="mr-1 text-[11.5px] text-muted">{t('from')}</span>}
                        <span className="font-semibold">{unitMoney(fromPrice(p), lang)}</span>
                        <span className="block text-[11.5px] text-muted">{p.unit === 'set' ? t('perSet') : t('perPc')}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
