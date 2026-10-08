import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { useDict, useL } from '@/i18n';
import { useActiveProducts, useCategories } from '@/store/hooks';
import type { Category, Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { H } from './dict';

/* ------------------------------------------------------------------ */
/* Catalogue helpers                                                   */
/* ------------------------------------------------------------------ */
export interface CatInfo {
  cat: Category;
  /** Products that can be bought straight away (not quote-only) */
  count: number;
  /** Only made-to-order (quote) products — e.g. custom-print paper & labels */
  quote: boolean;
}

/** Categories split into stocked, made-to-order and "coming soon". */
export function useCatalog() {
  const cats = useCategories();
  const products = useActiveProducts();
  return useMemo(() => {
    const info: CatInfo[] = cats.map((cat) => {
      const own = products.filter((p) => p.categoryId === cat.id);
      const count = own.filter((p) => !p.quoteOnly).length;
      return { cat, count, quote: own.length > 0 && count === 0 };
    });
    return {
      stocked: info.filter((x) => !x.cat.soon && !x.quote),
      quote: info.filter((x) => !x.cat.soon && x.quote),
      soon: info.filter((x) => x.cat.soon),
      products,
    };
  }, [cats, products]);
}

/** Category slug from a CTA link like "/produktet/gota". */
export const catSlugOf = (href: string) => /^\/produktet\/([^/?#]+)/.exec(href)?.[1];

/** Best-selling buyable product of a list. */
export const topSeller = (list: Product[]) => [...list].filter((p) => !p.quoteOnly).sort((a, b) => b.sold - a.sold)[0];

/* ------------------------------------------------------------------ */
/* Sticker — rotated round label (price, deal, brand)                   */
/* ------------------------------------------------------------------ */
/** `className` positions / sizes / rotates the sticker (e.g. "absolute right-4 top-4 w-28 rotate-6"). */
export function Sticker({ children, tone = 'lime', className }: { children: ReactNode; tone?: 'lime' | 'pink' | 'white'; className?: string }) {
  return (
    <div className={className}>
      <div
        className={cn(
          'relative grid aspect-square w-full place-items-center rounded-full text-center text-ink shadow-[0_18px_40px_-18px_rgba(15,29,22,0.6)]',
          tone === 'lime' ? 'bg-lime' : tone === 'pink' ? 'bg-pink' : 'bg-white',
        )}
      >
        <span aria-hidden className="pointer-events-none absolute inset-[6px] rounded-full border border-dashed border-ink/30" />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Packing-tape marquee                                                 */
/* ------------------------------------------------------------------ */
export function TapeMarquee({ className }: { className?: string }) {
  const { stocked } = useCatalog();
  const l = useL();
  const h = useDict(H);
  const words = useMemo(() => [h('tapeLine'), ...stocked.map((x) => l(x.cat.name))], [stocked, l, h]);
  const run = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key !== 'a'}>
      {words.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className={cn('whitespace-nowrap px-6 font-display text-[22px] font-bold tracking-[-0.02em] sm:text-[28px]', i === 0 ? 'text-white' : 'text-lime')}>{w}</span>
          <LogoMark className="h-6 sm:h-7" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="-mx-4 rotate-[-1.4deg] border-y-2 border-dashed border-white/20 bg-brand-700 py-3 shadow-[0_18px_40px_-24px_rgba(15,29,22,0.7)] sm:py-4">
        <div className="flex w-max animate-marquee">
          {run('a')}
          {run('b')}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal rail with external arrows                                 */
/* ------------------------------------------------------------------ */
export function useRail() {
  const ref = useRef<HTMLDivElement>(null);
  const by = useCallback((dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' }), []);
  return { ref, by };
}

export function Rail({ rail, children, className }: { rail: ReturnType<typeof useRail>; children: ReactNode; className?: string }) {
  return (
    <div ref={rail.ref} className={cn('no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:gap-6 lg:px-0', className)}>
      {children}
    </div>
  );
}

export function RailArrows({ rail, tone = 'dark', className }: { rail: ReturnType<typeof useRail>; tone?: 'dark' | 'light'; className?: string }) {
  const h = useDict(H);
  const cls =
    tone === 'light'
      ? 'border-white/25 text-white hover:border-lime hover:bg-lime hover:text-ink'
      : 'border-ink/15 bg-white text-ink hover:border-ink hover:bg-ink hover:text-white';
  return (
    <div className={cn('hidden gap-2 lg:flex', className)}>
      <button type="button" onClick={() => rail.by(-1)} className={cn('grid h-11 w-11 place-items-center rounded-full border transition', cls)} aria-label={h('prev')}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => rail.by(1)} className={cn('grid h-11 w-11 place-items-center rounded-full border transition', cls)} aria-label={h('next')}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
