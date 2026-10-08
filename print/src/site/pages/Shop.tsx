import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { ArrowRight, Compass, FileText, RotateCcw, SearchX } from 'lucide-react';
import { ProductCard } from '@/site/components/ProductCard';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Overlay';
import { EmptyState } from '@/components/ui/misc';
import { useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useActiveProducts, useCategories } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { qtyText } from '@/site/components/product/print';
import { T, countLabel } from '@/site/components/shop/dict';
import {
  EMPTY_FILTERS,
  activeCount,
  computeFacets,
  filtersFromParams,
  filtersToPatch,
  passes,
  productFeatures,
  sortFromParam,
  sortProducts,
  sortToParam,
  type Filters,
  type MatchCtx,
  type SortKey,
} from '@/site/components/shop/filters';
import { AllHeader, CategoryBanner, CategoryChips } from '@/site/components/shop/ShopHeader';
import { FilterPanel } from '@/site/components/shop/FilterPanel';
import { DensityToggle, FilterButton, FilterPills, SortSelect, type Pill } from '@/site/components/shop/Toolbar';
import { HelpBand } from '@/site/components/shop/HelpBand';

const PAGE = 24;
const DENSITY_KEY = 'pw-shop-cols';

function readDensity(): 3 | 4 {
  try {
    return localStorage.getItem(DENSITY_KEY) === '3' ? 3 : 4;
  } catch {
    return 4;
  }
}

export default function Shop() {
  const { category } = useParams();
  return <ShopView key={category ?? '*'} slug={category} />;
}

function ShopView({ slug }: { slug?: string }) {
  const t = useDict(T);
  const ts = useDict(site);
  const l = useL();
  const lang = useLang();
  const categories = useCategories();
  const products = useActiveProducts();
  const [params, setParams] = useSearchParams();

  const category = slug ? categories.find((c) => c.slug === slug) : undefined;
  const sort = sortFromParam(params.get('sort'));
  const filters = useMemo(() => {
    const f = filtersFromParams(params, categories);
    return category ? { ...f, cats: [] } : f;
  }, [params, categories, category]);

  usePageTitle(category ? l(category.name) : slug ? t('notFoundTitle') : ts('allProducts'));

  const [drawer, setDrawer] = useState(false);
  const [density, setDensityState] = useState<3 | 4>(readDensity);
  const setDensity = (v: 3 | 4) => {
    setDensityState(v);
    try {
      localStorage.setItem(DENSITY_KEY, String(v));
    } catch {
      /* private mode — keep it in memory */
    }
  };

  /* --------------------------- URL state ---------------------------- */
  const patchParams = useCallback(
    (patch: Record<string, string | null>, replace = true) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
          return next;
        },
        { replace, preventScrollReset: true },
      ),
    [setParams],
  );
  const setFilters = (f: Filters) => patchParams(filtersToPatch(f, categories));
  const setSort = (v: SortKey) => patchParams({ sort: sortToParam(v) });
  const clearAll = () => setFilters(EMPTY_FILTERS);

  /* ---------------------------- Derived ----------------------------- */
  const scope = useMemo(() => (category ? products.filter((p) => p.categoryId === category.id) : products), [products, category]);
  const ctx: MatchCtx = useMemo(() => ({ features: new Map(scope.map((p) => [p.id, productFeatures(p)])) }), [scope]);
  const results = useMemo(() => sortProducts(scope.filter((p) => passes(p, filters, ctx)), sort, l, lang), [scope, filters, ctx, sort, l, lang]);
  const facets = useMemo(() => computeFacets(scope, filters, ctx, categories), [scope, filters, ctx, categories]);
  const nActive = activeCount(filters);

  // "Show more" pagination — resets whenever the result set changes
  const sig = `${JSON.stringify(filters)}|${sort}`;
  const [paging, setPaging] = useState({ sig, n: PAGE });
  const limit = paging.sig === sig ? paging.n : PAGE;
  const shown = results.slice(0, limit);

  // Close the drawer when the layout switches to desktop
  useEffect(() => {
    if (!drawer) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const fn = () => mq.matches && setDrawer(false);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [drawer]);

  /* ------------------------- Active pills --------------------------- */
  const without = <K extends keyof Filters>(k: K, v: Filters[K]) => () => setFilters({ ...filters, [k]: v });
  const pills: Pill[] = [
    ...filters.modes.map((m) => ({ key: `m-${m}`, label: t(`m_${m}`), onRemove: without('modes', filters.modes.filter((x) => x !== m)) })),
    ...filters.cats.flatMap((id) => {
      const c = categories.find((x) => x.id === id);
      return c ? [{ key: `c-${id}`, label: l(c.name), onRemove: without('cats', filters.cats.filter((x) => x !== id)) }] : [];
    }),
    ...filters.price.map((b) => ({ key: `p-${b}`, label: t(`b_${b}`), onRemove: without('price', filters.price.filter((x) => x !== b)) })),
    ...(filters.lead ? [{ key: 'lead', label: t('leadPill', { n: filters.lead }), onRemove: without('lead', null) }] : []),
    ...(filters.moq ? [{ key: 'moq', label: t('moqPill', { n: qtyText(filters.moq, lang) }), onRemove: without('moq', null) }] : []),
    ...filters.features.map((f) => ({ key: `f-${f}`, label: t(`f_${f}`), onRemove: without('features', filters.features.filter((x) => x !== f)) })),
    ...filters.badges.map((b) => ({ key: `b-${b}`, label: t(`bd_${b}`), tone: b === 'sale' ? ('brand' as const) : undefined, onRemove: without('badges', filters.badges.filter((x) => x !== b)) })),
  ];

  /* --------------------------- Not found ---------------------------- */
  if (slug && !category) {
    return (
      <div className="container-x py-24">
        <EmptyState
          icon={<Compass className="h-6 w-6" />}
          title={t('notFoundTitle')}
          text={t('notFoundText')}
          action={
            <ButtonLink to="/produktet" variant="dark" iconRight={<ArrowRight className="h-4 w-4" />}>
              {ts('allProducts')}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const panel = <FilterPanel filters={filters} setFilters={setFilters} facets={facets} categories={categories} showCategories={!category} />;

  return (
    <>
      {category ? <CategoryBanner category={category} products={scope} /> : <AllHeader products={products} categories={categories} params={params} />}
      <CategoryChips categories={categories} products={products} active={category?.id ?? null} params={params} />

      <section className="container-x pt-6 lg:pt-10">
        <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-12 xl:gap-14">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block" aria-label={t('filters')}>
            <div className="sticky top-[96px] -mr-4 max-h-[calc(100vh-112px)] overflow-y-auto overscroll-contain pb-6 pr-4 [scrollbar-color:var(--color-sand-2)_transparent] [scrollbar-width:thin]">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h2 className="text-[15px] font-semibold text-ink">{t('filters')}</h2>
                {nActive > 0 && (
                  <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft hover:text-brand-700">
                    <RotateCcw className="h-3.5 w-3.5" /> {t('clear')}
                  </button>
                )}
              </div>
              {panel}
            </div>
          </aside>

          <div className="min-w-0">
            {/* Mobile: sticky filter + sort bar */}
            <div className="sticky top-[76px] z-30 -mx-4 mb-4 flex gap-2 border-b border-line/70 bg-paper/92 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:hidden">
              <FilterButton count={nActive} onClick={() => setDrawer(true)} />
              <SortSelect value={sort} onChange={setSort} compact className="flex-1" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <p className="text-[15px] text-muted" aria-live="polite">
                <span className="font-semibold text-ink">{countLabel(t, lang, results.length)}</span>
                {nActive > 0 && scope.length !== results.length && <span className="font-mono text-[12px] max-sm:hidden"> / {scope.length}</span>}
              </p>
              <div className="hidden items-center gap-2 lg:flex">
                <SortSelect value={sort} onChange={setSort} />
                <DensityToggle value={density} onChange={setDensity} />
              </div>
            </div>
            <FilterPills pills={pills} onClear={clearAll} className="mt-3" />

            {/* Grid */}
            {results.length > 0 ? (
              <>
                <div key={`${sort}-${density}`} className={cn('mt-6 grid grid-cols-2 gap-x-3.5 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:mt-7 lg:gap-x-6 lg:gap-y-12', density === 4 && 'xl:grid-cols-4 xl:gap-x-5')}>
                  {shown.map((p, i) => (
                    <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i % PAGE, 11) * 45}ms` }}>
                      <ProductCard product={p} priority={i < 8} />
                    </div>
                  ))}
                </div>
                {results.length > shown.length && (
                  <div className="mt-14 flex flex-col items-center">
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">{t('shownOf', { a: shown.length, b: results.length })}</p>
                    <div className="mt-3 h-[3px] w-52 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${(shown.length / results.length) * 100}%` }} />
                    </div>
                    <Button variant="outline" size="lg" className="mt-6" onClick={() => setPaging({ sig, n: limit + PAGE })}>
                      {t('loadMore', { n: Math.min(PAGE, results.length - shown.length) })}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                className="mt-6 rounded-3xl border border-dashed border-line bg-white/50"
                icon={<SearchX className="h-6 w-6" />}
                title={t('emptyTitle')}
                text={t('emptyText')}
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="dark" icon={<RotateCcw className="h-4 w-4" />} onClick={clearAll}>
                      {t('resetFilters')}
                    </Button>
                    <ButtonLink to="/kerko-oferte" variant="outline" icon={<FileText className="h-4 w-4" />}>
                      {t('askQuote')}
                    </ButtonLink>
                  </div>
                }
              />
            )}
          </div>
        </div>
      </section>

      <HelpBand />

      {/* Mobile filter drawer */}
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        side="right"
        width="max-w-[420px]"
        title={
          <span className="inline-flex items-center gap-2.5">
            {t('filters')}
            {nActive > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-brand-600 px-1.5 text-[12px] font-bold text-white">{nActive}</span>}
          </span>
        }
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" size="lg" onClick={clearAll} disabled={nActive === 0} className="px-5">
              {t('clear')}
            </Button>
            <Button variant="dark" size="lg" className="flex-1" onClick={() => setDrawer(false)}>
              {t('showResults', { what: countLabel(t, lang, results.length) })}
            </Button>
          </div>
        }
      >
        <div className="px-5 pb-4 sm:px-6">{panel}</div>
      </Drawer>
    </>
  );
}
