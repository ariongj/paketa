import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Clock, FileText, Layers, LayoutGrid, Tag } from 'lucide-react';
import type { Category, Product } from '@/lib/types';
import { Accent, Img } from '@/components/ui/misc';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { CmykBar, CropMarks, Eyebrow } from '@/site/components/company/Print';
import { useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { cn } from '@/lib/utils';
import { isRun, qtyRules, qtyText, unitMoney } from '@/site/components/product/print';
import { T, countLabel } from './dict';
import { piecePrice } from './filters';

/** 2:1 banners that exist for some categories (`/images/banner/<slug>.webp`). */
const BANNERS = new Set(['kuti-produktesh', 'kuti-ushqimore', 'etiketa']);

/** Link to a category (or the all-products view) keeping sort & filters, dropping the category facet. */
export function shopHref(slug: string | null, params: URLSearchParams) {
  const next = new URLSearchParams(params);
  next.delete('kategori');
  const qs = next.toString();
  return `/produktet${slug ? `/${slug}` : ''}${qs ? `?${qs}` : ''}`;
}

function useStats(products: Product[]) {
  return useMemo(() => {
    const runs = products.filter(isRun);
    const prices = runs.map((p) => piecePrice(p)!).filter((v) => v != null);
    const moqs = runs.map((p) => qtyRules(p).min);
    const leads = products.map((p) => p.leadDays ?? 0).filter((d) => d > 0);
    return {
      from: prices.length ? Math.min(...prices) : null,
      moq: moqs.length ? Math.min(...moqs) : null,
      fastest: runs.length ? Math.min(...runs.map((p) => p.leadDays ?? 99)) : leads.length ? Math.min(...leads) : null,
      quote: products.filter((p) => p.quoteOnly).length,
    };
  }, [products]);
}

/* ------------------------------------------------------------------ */
/* Category header: copy left, banner / category photo right            */
/* ------------------------------------------------------------------ */
export function CategoryBanner({ category, products }: { category: Category; products: Product[] }) {
  const t = useDict(T);
  const ts = useDict(site);
  const l = useL();
  const lang = useLang();
  const s = useStats(products);
  const banner = BANNERS.has(category.slug);
  const pill = 'inline-flex h-9 items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-medium text-ink-soft ring-1 ring-line';

  return (
    <section className="relative overflow-hidden border-b border-line bg-paper">
      <CmykBar className="opacity-80" />
      <div className="container-x pb-10 pt-6 sm:pb-14 sm:pt-8">
        <Breadcrumbs items={[{ label: ts('nav_products'), to: '/produktet' }, { label: l(category.name) }]} />
        <div className={cn('mt-8 grid items-center gap-10 lg:gap-14', banner ? 'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]' : 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]')}>
          <div className="animate-fade-up">
            <Eyebrow>{l(category.tagline)}</Eyebrow>
            <h1 className="display mt-4 text-[44px] leading-[0.98] text-ink sm:text-[64px]">{l(category.name)}</h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]">{l(category.description)}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              <span className={pill}>
                <LayoutGrid className="h-3.5 w-3.5 text-brand-600" /> {countLabel(t, lang, products.length)}
              </span>
              {s.from != null && (
                <span className={pill}>
                  <Tag className="h-3.5 w-3.5 text-brand-600" /> {t('fromPrice', { price: unitMoney(s.from, lang) })}
                </span>
              )}
              {s.moq != null && (
                <span className={pill}>
                  <Layers className="h-3.5 w-3.5 text-brand-600" /> {t('fromMoq', { n: qtyText(s.moq, lang) })}
                </span>
              )}
              {s.fastest != null && s.fastest < 99 && (
                <span className={cn(pill, 'max-sm:hidden')}>
                  <Clock className="h-3.5 w-3.5 text-brand-600" /> {t('fastest', { n: s.fastest })}
                </span>
              )}
            </div>
          </div>
          <div className="relative animate-fade-up [animation-delay:120ms] max-lg:-order-1">
            <CropMarks />
            <div className={cn('relative overflow-hidden rounded-3xl bg-white ring-1 ring-line', banner ? 'aspect-[2/1]' : 'aspect-[4/3] lg:aspect-square')}>
              <Img
                src={banner ? `/images/banner/${category.slug}.webp` : category.image}
                eager
                alt={l(category.name)}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ animation: 'kenburns 2.6s cubic-bezier(.16,1,.3,1) both' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* All-products header                                                  */
/* ------------------------------------------------------------------ */
export function AllHeader({ products, categories, params }: { products: Product[]; categories: Category[]; params: URLSearchParams }) {
  const t = useDict(T);
  const ts = useDict(site);
  const l = useL();

  return (
    <section className="relative overflow-hidden border-b border-line bg-paper">
      <CmykBar className="opacity-80" />
      <div className="container-x relative pb-10 pt-6 sm:pb-12 sm:pt-8">
        <Breadcrumbs items={[{ label: ts('nav_products') }]} />
        <div className="mt-8 grid gap-8 animate-fade-up sm:mt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Eyebrow>{t('catalog')}</Eyebrow>
            <h1 className="display mt-4 text-[42px] leading-[1] text-ink sm:text-[64px]">
              <Accent text={t('allTitle')} />
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted sm:text-[17px]">{t('allSubtitle')}</p>
          </div>
          <dl className="hidden gap-10 lg:flex">
            {[
              [String(products.length), t('statProducts')],
              [String(categories.length), t('statCategories')],
              [t('statProofValue'), t('statProof')],
            ].map(([v, label]) => (
              <div key={label} className="text-right">
                <dt className="sr-only">{label}</dt>
                <dd className="display text-[44px] leading-none text-ink">{v}</dd>
                <dd className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Category tiles */}
        <div className="mt-10 hidden gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => {
            const n = products.filter((p) => p.categoryId === c.id).length;
            return (
              <Link key={c.id} to={shopHref(c.slug, params)} className="group relative block animate-fade-up overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow hover:shadow-[0_24px_50px_-30px_rgb(18_16_20/0.5)]" style={{ animationDelay: `${120 + i * 60}ms` }}>
                <div className="relative aspect-square overflow-hidden">
                  <Img src={c.image} small alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110" />
                  <span className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2 px-3.5 py-3">
                  <span className="truncate text-[14px] font-semibold leading-tight text-ink">{l(c.name)}</span>
                  <span className="shrink-0 font-mono text-[10.5px] text-muted">{n}</span>
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
/* Chip row: all categories + custom packaging                          */
/* ------------------------------------------------------------------ */
export function CategoryChips({ categories, products, active, params }: { categories: Category[]; products: Product[]; active: string | null; params: URLSearchParams }) {
  const t = useDict(T);
  const l = useL();
  const chip = (on: boolean) =>
    cn(
      'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border text-[14px] font-semibold transition-all duration-200',
      on ? 'border-ink bg-ink text-paper shadow-[0_8px_20px_-12px_rgb(18_16_20/0.7)]' : 'border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink',
    );

  return (
    <div className="border-b border-line bg-paper">
      <div className="container-x">
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <Link to={shopHref(null, params)} className={cn(chip(!active), 'px-4')} aria-current={!active ? 'page' : undefined}>
            <LayoutGrid className="h-4 w-4 opacity-70" />
            {t('all')}
            <span className={cn('font-mono text-[11px] font-medium tabular-nums', !active ? 'text-paper/55' : 'text-muted')}>{products.length}</span>
          </Link>
          {categories.map((c) => {
            const on = active === c.id;
            const n = products.filter((p) => p.categoryId === c.id).length;
            return (
              <Link key={c.id} to={shopHref(c.slug, params)} className={cn(chip(on), 'pl-1.5 pr-4')} aria-current={on ? 'page' : undefined}>
                <Img src={c.image} small alt="" className={cn('h-8 w-8 rounded-full bg-white object-cover', on && 'ring-2 ring-white/25')} />
                {l(c.name)}
                <span className={cn('font-mono text-[11px] font-medium tabular-nums', on ? 'text-paper/55' : 'text-muted')}>{n}</span>
              </Link>
            );
          })}
          <span className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden />
          <Link to="/kerko-oferte" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 text-[14px] font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-100">
            <FileText className="h-4 w-4" />
            {t('customCta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
