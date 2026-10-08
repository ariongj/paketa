import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Clock, Layers, LayoutGrid, Percent, Stamp, Tag } from 'lucide-react';
import type { Category, Product } from '@/lib/types';
import { Accent, Img } from '@/components/ui/misc';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { basePrice, discountPct, isOnSale, piecePrice, tiersOf } from '@/lib/pricing';
import { money, moneyPiece } from '@/lib/format';
import { cn } from '@/lib/utils';
import { T, countLabel } from './dict';

/** Link to a category (or the all-products view) keeping ?akcija / ?sort. */
export function shopHref(slug: string | null, params: URLSearchParams, patch: Record<string, string | null> = {}) {
  const next = new URLSearchParams();
  for (const k of ['akcija', 'sort']) {
    const v = k in patch ? patch[k] : params.get(k);
    if (v) next.set(k, v);
  }
  const qs = next.toString();
  return `/produktet${slug ? `/${slug}` : ''}${qs ? `?${qs}` : ''}`;
}

/** Cheapest priced product (per pack) and the lowest per-piece price in a list. */
function useFromPrices(products: Product[]) {
  return useMemo(() => {
    const priced = products.filter((p) => !p.quoteOnly);
    const cheapest = [...priced].sort((a, b) => basePrice(a) - basePrice(b))[0];
    const piece = priced.filter((p) => p.unit === 'pack' && p.packSize).map((p) => piecePrice(p));
    const maxTier = Math.max(0, ...priced.flatMap((p) => tiersOf(p).map((x) => x.pct)));
    return { cheapest, minPiece: piece.length ? Math.min(...piece) : 0, maxTier };
  }, [products]);
}

/* ------------------------------------------------------------------ */
/* Category header: text + framed photo (photos vary — keep them boxed) */
/* ------------------------------------------------------------------ */
export function CategoryBanner({ category, products, sale }: { category: Category; products: Product[]; sale: boolean }) {
  const t = useDict(T);
  const ts = useDict(site);
  const l = useL();
  const lang = useLang();
  const { cheapest, minPiece, maxTier } = useFromPrices(products);
  const logo = products.some((p) => p.installation?.available);
  const custom = products.length > 0 && products.every((p) => p.quoteOnly);
  const maxPct = Math.max(0, ...products.map(discountPct));
  const pill = 'inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft ring-1 ring-inset ring-line';

  return (
    <section className="relative overflow-hidden border-b border-line bg-paper">
      <div className="bg-grain pointer-events-none absolute inset-0 opacity-70" />
      <div className="container-x relative pb-10 pt-7 sm:pb-14 sm:pt-9">
        <Breadcrumbs items={[{ label: ts('nav_products'), to: '/produktet' }, { label: l(category.name) }]} />
        <div className="mt-6 grid items-center gap-7 sm:mt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="order-2 animate-fade-up lg:order-1">
            <div className="eyebrow">{l(category.tagline)}</div>
            <h1 className="display mt-3 text-[48px] leading-[0.95] text-ink sm:text-[72px]">{l(category.name)}</h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">{l(category.description)}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {category.soon ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-bold text-lime">
                  <Clock className="h-3.5 w-3.5" /> {t('soonBadge')}
                </span>
              ) : (
                <span className={pill}>
                  <LayoutGrid className="h-3.5 w-3.5 text-brand-600" /> {countLabel(t, lang, products.length)}
                </span>
              )}
              {cheapest && (
                <span className={pill}>
                  <Tag className="h-3.5 w-3.5 text-brand-600" />
                  {t('fromPrice', { price: money(basePrice(cheapest), lang) })}
                </span>
              )}
              {maxTier > 0 && (
                <span className={cn(pill, 'max-sm:hidden')}>
                  <Layers className="h-3.5 w-3.5 text-brand-600" /> {t('tierPill', { pct: maxTier })}
                </span>
              )}
              {(logo || custom) && (
                <span className={pill}>
                  <Stamp className="h-3.5 w-3.5 text-brand-600" /> {custom ? t('customPill') : t('logoAvail')}
                </span>
              )}
              {sale && (
                <span className="inline-flex items-center gap-2 rounded-full bg-pink px-3.5 py-1.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-14px_var(--color-pink-ink)]">
                  <Percent className="h-3.5 w-3.5" /> {ts('sale')}
                  {maxPct > 0 && ` · ${t('upTo')} −${maxPct}%`}
                </span>
              )}
            </div>
          </div>
          <div className="relative order-1 animate-fade-up [animation-delay:100ms] lg:order-2">
            <div className="relative aspect-[2/1] overflow-hidden rounded-[24px] bg-sand shadow-[0_40px_80px_-44px_rgb(15_29_22/0.55)] ring-1 ring-ink/5 sm:aspect-[16/9] lg:aspect-[5/4] lg:rounded-[30px]">
              <Img src={category.image} eager alt={l(category.name)} className="absolute inset-0 h-full w-full object-cover" style={{ animation: 'kenburns 2.6s cubic-bezier(.16,1,.3,1) both' }} />
            </div>
            {minPiece > 0 && !category.soon && (
              <div
                className={cn(
                  'absolute -bottom-4 right-4 grid h-[104px] w-[104px] rotate-[8deg] place-items-center rounded-full text-center shadow-[0_18px_36px_-16px_rgb(15_29_22/0.5)] max-lg:hidden sm:-bottom-6 lg:-left-6 lg:right-auto lg:h-[124px] lg:w-[124px]',
                  category.soon ? 'bg-ink text-lime' : 'bg-lime text-ink',
                )}
              >
                {category.soon ? (
                  <span className="display px-3 text-[20px] leading-[1]">{t('soonBadge')}</span>
                ) : (
                  <span className="px-2">
                    <span className="block text-[10.5px] font-bold uppercase tracking-[0.14em] opacity-70">{t('stickerFrom')}</span>
                    <span className="display block text-[22px] leading-none lg:text-[26px]">{moneyPiece(minPiece, lang)}</span>
                    <span className="mt-0.5 block text-[11px] font-bold">/ {t('stickerUnit')}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Header for the all-products / sale view                             */
/* ------------------------------------------------------------------ */
export function AllHeader({ products, categories, sale, params }: { products: Product[]; categories: Category[]; sale: boolean; params: URLSearchParams }) {
  const t = useDict(T);
  const ts = useDict(site);
  const l = useL();
  const lang = useLang();
  const onSale = useMemo(() => products.filter(isOnSale), [products]);
  const maxPct = Math.max(0, ...products.map(discountPct));
  const maxTier = Math.max(0, ...products.flatMap((p) => tiersOf(p).map((x) => x.pct)));
  const shown = sale ? onSale : products;
  const tiles = categories.filter((c) => c.featured && !c.soon).slice(0, 8);

  return (
    <section className="relative overflow-hidden border-b border-line bg-paper">
      <div className="bg-grain pointer-events-none absolute inset-0 opacity-70" />
      <div className="container-x relative pb-10 pt-7 sm:pb-12 sm:pt-9">
        <Breadcrumbs items={sale ? [{ label: ts('nav_products'), to: '/produktet' }, { label: ts('sale') }] : [{ label: ts('nav_products') }]} />
        <div className="mt-8 grid animate-fade-up gap-8 sm:mt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="eyebrow">{sale ? t('saleEyebrow') : t('catalog')}</div>
            <h1 className="display mt-3 text-[46px] leading-[1] text-ink sm:text-[68px]">
              <Accent text={sale ? t('saleTitle') : t('allTitle')} />
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted sm:text-[17px]">{sale ? t('saleSubtitle', { pct: maxPct }) : t('allSubtitle')}</p>
          </div>
          {sale ? (
            <div className="hidden h-36 w-36 rotate-[-8deg] place-items-center rounded-full bg-pink text-center text-white shadow-[0_24px_50px_-20px_var(--color-pink-ink)] lg:grid">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">{t('upTo')}</div>
                <div className="display text-[44px] leading-none">−{maxPct}%</div>
              </div>
            </div>
          ) : (
            <dl className="hidden gap-10 lg:flex">
              {[
                [String(products.length), t('statProducts')],
                [String(categories.filter((c) => !c.soon).length), t('statCategories')],
                ...(maxTier > 0 ? [[`−${maxTier}%`, t('statCarton')]] : []),
              ].map(([v, label]) => (
                <div key={label} className="text-right">
                  <dt className="sr-only">{label}</dt>
                  <dd className="display text-[44px] leading-none text-ink">{v}</dd>
                  <dd className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Category tiles */}
        <div className="mt-10 hidden gap-3 sm:grid sm:grid-cols-4 lg:grid-cols-8">
          {tiles.map((c, i) => {
            const n = shown.filter((p) => p.categoryId === c.id).length;
            return (
              <Link
                key={c.id}
                to={shopHref(c.slug, params)}
                className={cn('group relative block aspect-[4/5] animate-fade-up overflow-hidden rounded-2xl bg-ink', sale && n === 0 && 'opacity-50')}
                style={{ animationDelay: `${120 + i * 50}ms` }}
              >
                <Img src={c.image} small alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
                <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="text-[14px] font-semibold leading-tight text-white">{l(c.name)}</div>
                  <div className="mt-0.5 text-[11.5px] text-white/65">{sale ? t('saleCount', { n }) : countLabel(t, lang, n)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Chip row: all categories (soon ones tagged) + Ofertë                */
/* ------------------------------------------------------------------ */
export function CategoryChips({
  categories,
  products,
  active,
  sale,
  params,
  onToggleSale,
}: {
  categories: Category[];
  products: Product[];
  active: string | null;
  sale: boolean;
  params: URLSearchParams;
  onToggleSale: () => void;
}) {
  const t = useDict(T);
  const ts = useDict(site);
  const l = useL();
  const counted = sale ? products.filter(isOnSale) : products;
  const saleN = products.filter((p) => isOnSale(p) && (!active || p.categoryId === active)).length;
  const chip = (on: boolean) =>
    cn(
      'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border text-[14px] font-semibold transition-all duration-200',
      on ? 'border-ink bg-ink text-paper shadow-[0_8px_20px_-12px_rgb(15_29_22/0.7)]' : 'border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink',
    );

  return (
    <div className="border-b border-line bg-paper">
      <div className="container-x">
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <Link to={shopHref(null, params)} className={cn(chip(!active), 'px-4')} aria-current={!active ? 'page' : undefined}>
            <LayoutGrid className="h-4 w-4 opacity-70" />
            {t('all')}
            <span className={cn('text-[12px] font-medium tabular-nums', !active ? 'text-paper/55' : 'text-muted')}>{counted.length}</span>
          </Link>
          {categories.map((c) => {
            const on = active === c.id;
            const n = counted.filter((p) => p.categoryId === c.id).length;
            return (
              <Link key={c.id} to={shopHref(c.slug, params)} className={cn(chip(on), 'pl-1.5 pr-4', c.soon && !on && 'border-dashed')} aria-current={on ? 'page' : undefined}>
                <Img src={c.image} small alt="" className={cn('h-8 w-8 rounded-full object-cover', on && 'ring-2 ring-white/25', c.soon && !on && 'opacity-70')} />
                {l(c.name)}
                {c.soon ? (
                  <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]', on ? 'bg-lime text-ink' : 'bg-ink text-lime')}>{t('soon')}</span>
                ) : (
                  <span className={cn('text-[12px] font-medium tabular-nums', on ? 'text-paper/55' : 'text-muted')}>{n}</span>
                )}
              </Link>
            );
          })}
          <span className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden />
          <button
            type="button"
            onClick={onToggleSale}
            aria-pressed={sale}
            className={cn(
              'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-bold transition-all duration-200',
              sale ? 'border-pink bg-pink text-white shadow-[0_10px_24px_-12px_var(--color-pink-ink)]' : 'border-pink/30 bg-pink-soft text-pink-ink hover:border-pink/60',
            )}
          >
            <Percent className="h-4 w-4" />
            {ts('sale')}
            <span className={cn('text-[12px] font-semibold tabular-nums', sale ? 'text-white/75' : 'text-pink-ink/70')}>{saleN}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
