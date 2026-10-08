import type { Badge, Category, L10n, Lang, Product } from '@/lib/types';
import { basePrice, isOnSale } from '@/lib/pricing';
import { fromUnitPrice, isRun, qtyRules } from '@/site/components/product/print';

/* ------------------------------------------------------------------ */
/* Sorting (synced to ?sort=…)                                         */
/* ------------------------------------------------------------------ */
export type SortKey = 'popular' | 'priceAsc' | 'priceDesc' | 'new' | 'fastest';

export const SORTS: { key: SortKey; param: string | null }[] = [
  { key: 'popular', param: null },
  { key: 'priceAsc', param: 'cmimi-rritje' },
  { key: 'priceDesc', param: 'cmimi-zbritje' },
  { key: 'new', param: 'te-rejat' },
  { key: 'fastest', param: 'me-shpejt' },
];

export const sortFromParam = (v: string | null): SortKey => SORTS.find((s) => s.param === v)?.key ?? 'popular';
export const sortToParam = (k: SortKey) => SORTS.find((s) => s.key === k)?.param ?? null;

/** Price used for sorting & the price facet: lowest per-piece price for runs, list price otherwise; null = quote-only. */
export const piecePrice = (p: Product): number | null => (p.quoteOnly ? null : isRun(p) ? fromUnitPrice(p) : basePrice(p));

export function sortProducts(list: Product[], sort: SortKey, name: (v: L10n) => string, lang: Lang) {
  const out = [...list];
  const price = (p: Product, dir: 1 | -1) => piecePrice(p) ?? (dir === 1 ? Infinity : -Infinity);
  switch (sort) {
    case 'new':
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'priceAsc':
      return out.sort((a, b) => price(a, 1) - price(b, 1));
    case 'priceDesc':
      return out.sort((a, b) => price(b, -1) - price(a, -1));
    case 'fastest': {
      const coll = new Intl.Collator(lang, { sensitivity: 'base' });
      return out.sort((a, b) => (a.leadDays ?? 99) - (b.leadDays ?? 99) || coll.compare(name(a.name), name(b.name)));
    }
    default:
      return out.sort((a, b) => Number(b.featured) - Number(a.featured) || b.sold - a.sold);
  }
}

/* ------------------------------------------------------------------ */
/* Facets                                                              */
/* ------------------------------------------------------------------ */
/** Per-piece price buckets (EUR, excl. VAT). */
export type PriceBucket = 'u010' | '010-050' | '050-1' | 'o1';
export const PRICE_BUCKETS: { id: PriceBucket; min: number; max: number }[] = [
  { id: 'u010', min: 0, max: 0.1 },
  { id: '010-050', min: 0.1, max: 0.5 },
  { id: '050-1', min: 0.5, max: 1 },
  { id: 'o1', min: 1, max: Infinity },
];
export const bucketOf = (v: number): PriceBucket => PRICE_BUCKETS.find((b) => v >= b.min && v < b.max)?.id ?? 'o1';

/** Max lead time (working days) */
export const LEAD_STEPS = [3, 7, 10, 14] as const;
/** Max minimum-order quantity */
export const MOQ_STEPS = [100, 250, 500, 1000] as const;

export type Mode = 'online' | 'quote';
export const MODES: Mode[] = ['online', 'quote'];
export const modeOf = (p: Product): Mode => (p.quoteOnly ? 'quote' : 'online');

export type BadgeFacet = Badge;
export const BADGES: BadgeFacet[] = ['bestseller', 'new', 'premium', 'sale'];
export const hasBadge = (p: Product, b: BadgeFacet) => (b === 'sale' ? isOnSale(p) || p.badges.includes('sale') : p.badges.includes(b));

/** Material & finishing keywords, read from option labels, specs and the product copy. */
export type Feature = 'matte' | 'gloss' | 'softtouch' | 'spotuv' | 'foil' | 'emboss' | 'kraft' | 'eflute' | 'film' | 'food';
const FEATURE_RULES: [Feature, RegExp][] = [
  ['matte', /\bmat\b|matte/],
  ['gloss', /shkëlqim|\bgloss/],
  ['softtouch', /soft-touch|soft touch/],
  ['spotuv', /uv selektiv|spot uv/],
  ['foil', /folje|\bfoil/],
  ['emboss', /reliev|emboss/],
  ['kraft', /kraft/],
  ['eflute', /mikrovalë|e-flute|valëzuar|corrugated/],
  ['film', /\bpp\b|transparent|\bclear\b|metalik/],
  ['food', /ushqim|food/],
];
export const FEATURES: Feature[] = FEATURE_RULES.map(([f]) => f);

export function productFeatures(p: Product): Feature[] {
  const text = [
    p.name.sq,
    p.name.en,
    p.short.sq,
    p.short.en,
    ...p.options.flatMap((o) => o.values.flatMap((v) => [v.label.sq, v.label.en])),
    ...p.specs.flatMap((s) => [s.value.sq, s.value.en]),
  ]
    .join(' | ')
    .toLowerCase();
  return FEATURE_RULES.filter(([, re]) => re.test(text)).map(([f]) => f);
}

/* ------------------------------------------------------------------ */
/* Filter state (lives in the URL)                                     */
/* ------------------------------------------------------------------ */
export interface Filters {
  /** Category ids — only on the all-products view */
  cats: string[];
  price: PriceBucket[];
  /** max lead time in working days */
  lead: number | null;
  /** max MOQ */
  moq: number | null;
  features: Feature[];
  badges: BadgeFacet[];
  modes: Mode[];
}

export const EMPTY_FILTERS: Filters = { cats: [], price: [], lead: null, moq: null, features: [], badges: [], modes: [] };

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);
const numOrNull = (v: string | null) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** URL → filters (`?kategori=…&cmimi=…&afati=7&moq=500&finish=foil,matte&badge=new&menyra=online`; legacy `akcija=1`). */
export function filtersFromParams(params: URLSearchParams, categories: Category[]): Filters {
  const badges = list(params.get('badge')).filter((b): b is BadgeFacet => (BADGES as string[]).includes(b));
  if (params.get('akcija') === '1' && !badges.includes('sale')) badges.push('sale');
  return {
    cats: list(params.get('kategori'))
      .map((s) => categories.find((c) => c.slug === s)?.id)
      .filter((x): x is string => !!x),
    price: list(params.get('cmimi')).filter((b): b is PriceBucket => PRICE_BUCKETS.some((x) => x.id === b)),
    lead: numOrNull(params.get('afati')),
    moq: numOrNull(params.get('moq')),
    features: list(params.get('finish')).filter((f): f is Feature => (FEATURES as string[]).includes(f)),
    badges,
    modes: list(params.get('menyra')).filter((m): m is Mode => (MODES as string[]).includes(m)),
  };
}

/** Filters → URL patch (null removes a param). */
export function filtersToPatch(f: Filters, categories: Category[]): Record<string, string | null> {
  const join = (a: string[]) => (a.length ? a.join(',') : null);
  return {
    kategori: join(f.cats.map((id) => categories.find((c) => c.id === id)?.slug ?? '').filter(Boolean)),
    cmimi: join(f.price),
    afati: f.lead ? String(f.lead) : null,
    moq: f.moq ? String(f.moq) : null,
    finish: join(f.features),
    badge: join(f.badges),
    menyra: join(f.modes),
    akcija: null,
  };
}

export type Facet = 'cats' | 'price' | 'lead' | 'moq' | 'features' | 'badges' | 'modes';

export interface MatchCtx {
  features: Map<string, Feature[]>;
}

export function passes(p: Product, f: Filters, ctx: MatchCtx, skip?: Facet) {
  if (skip !== 'cats' && f.cats.length && !f.cats.includes(p.categoryId)) return false;
  if (skip !== 'price' && f.price.length) {
    const v = piecePrice(p);
    if (v == null || !f.price.includes(bucketOf(v))) return false;
  }
  if (skip !== 'lead' && f.lead && (p.leadDays ?? 99) > f.lead) return false;
  if (skip !== 'moq' && f.moq && qtyRules(p).min > f.moq) return false;
  if (skip !== 'features' && f.features.length && !f.features.every((x) => (ctx.features.get(p.id) ?? []).includes(x))) return false;
  if (skip !== 'badges' && f.badges.length && !f.badges.some((b) => hasBadge(p, b))) return false;
  if (skip !== 'modes' && f.modes.length && !f.modes.includes(modeOf(p))) return false;
  return true;
}

export function activeCount(f: Filters) {
  return f.cats.length + f.price.length + (f.lead ? 1 : 0) + (f.moq ? 1 : 0) + f.features.length + f.badges.length + f.modes.length;
}

export interface FacetData {
  cats: { id: string; count: number }[];
  price: { id: PriceBucket; count: number }[];
  lead: { value: number; count: number }[];
  moq: { value: number; count: number }[];
  features: { id: Feature; count: number }[];
  badges: { id: BadgeFacet; count: number }[];
  modes: { id: Mode; count: number }[];
}

/**
 * Facet counts, each computed against every *other* active filter — so a
 * count always tells the shopper how many results that choice would give.
 */
export function computeFacets(scope: Product[], f: Filters, ctx: MatchCtx, categories: Category[]): FacetData {
  const count = (skip: Facet, pred: (p: Product) => boolean) => scope.reduce((n, p) => (passes(p, f, ctx, skip) && pred(p) ? n + 1 : n), 0);
  const present = new Set<Feature>();
  for (const p of scope) (ctx.features.get(p.id) ?? []).forEach((x) => present.add(x));
  return {
    cats: categories.map((c) => ({ id: c.id, count: count('cats', (p) => p.categoryId === c.id) })),
    price: PRICE_BUCKETS.map((b) => ({ id: b.id, count: count('price', (p) => piecePrice(p) != null && bucketOf(piecePrice(p)!) === b.id) })),
    lead: LEAD_STEPS.map((d) => ({ value: d, count: count('lead', (p) => (p.leadDays ?? 99) <= d) })),
    moq: MOQ_STEPS.map((m) => ({ value: m, count: count('moq', (p) => qtyRules(p).min <= m) })),
    features: FEATURES.filter((x) => present.has(x)).map((x) => ({ id: x, count: count('features', (p) => (ctx.features.get(p.id) ?? []).includes(x)) })),
    badges: BADGES.map((b) => ({ id: b, count: count('badges', (p) => hasBadge(p, b)) })).filter((b) => b.count > 0 || f.badges.includes(b.id)),
    modes: MODES.map((m) => ({ id: m, count: count('modes', (p) => modeOf(p) === m) })),
  };
}
