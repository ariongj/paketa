import type { Category, L10n, Lang, Product } from '@/lib/types';
import { basePrice, isOnSale } from '@/lib/pricing';

/* ------------------------------------------------------------------ */
/* Sorting (synced to ?sort=…)                                         */
/* ------------------------------------------------------------------ */
export type SortKey = 'popular' | 'new' | 'priceAsc' | 'priceDesc' | 'name';

export const SORTS: { key: SortKey; param: string | null }[] = [
  { key: 'popular', param: null },
  { key: 'new', param: 'me-te-rejat' },
  { key: 'priceAsc', param: 'cmimi-rritje' },
  { key: 'priceDesc', param: 'cmimi-zbritje' },
  { key: 'name', param: 'emri' },
];

export const sortFromParam = (v: string | null): SortKey => SORTS.find((s) => s.param === v)?.key ?? 'popular';
export const sortToParam = (k: SortKey) => SORTS.find((s) => s.key === k)?.param ?? null;

const COLLATOR: Record<Lang, string> = { me: 'sr-Latn', sq: 'sq', en: 'en' };

/** Quote-only items have no shelf price — they always go after priced products in price sorts. */
const priced = (p: Product) => (p.quoteOnly ? 0 : 1);

export function sortProducts(list: Product[], sort: SortKey, name: (v: L10n) => string, lang: Lang) {
  const out = [...list];
  switch (sort) {
    case 'new':
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'priceAsc':
      return out.sort((a, b) => priced(b) - priced(a) || basePrice(a) - basePrice(b));
    case 'priceDesc':
      return out.sort((a, b) => priced(b) - priced(a) || basePrice(b) - basePrice(a));
    case 'name': {
      const coll = new Intl.Collator(COLLATOR[lang], { sensitivity: 'base' });
      return out.sort((a, b) => coll.compare(name(a.name), name(b.name)));
    }
    default:
      // bestselling; sold-out items sink so the first row is always buyable
      return out.sort((a, b) => Number(b.stock > 0 || !!b.quoteOnly) - Number(a.stock > 0 || !!a.quoteOnly) || b.sold - a.sold || Number(b.featured) - Number(a.featured));
  }
}

/* ------------------------------------------------------------------ */
/* Product facets                                                      */
/* ------------------------------------------------------------------ */
/** Ready to ship from stock (quote-only custom print is made to order). */
export const inStockOf = (p: Product) => !p.quoteOnly && p.stock > 0;
/** Can carry the customer's logo: logo-print add-on, or a custom-print (quote) item. */
export const hasLogo = (p: Product) => !!p.installation?.available || !!p.quoteOnly;

/* ------------------------------------------------------------------ */
/* Filter state + matching                                             */
/* ------------------------------------------------------------------ */
export interface Filters {
  /** Category ids — only used on the all-products view */
  cats: string[];
  /** [min, max] in EUR per pack; null = full range */
  price: [number, number] | null;
  stock: boolean;
  logo: boolean;
}

export const EMPTY_FILTERS: Filters = { cats: [], price: null, stock: false, logo: false };

export type Facet = 'cats' | 'price' | 'sale' | 'stock' | 'logo';

export interface MatchCtx {
  sale: boolean;
}

export function passes(p: Product, f: Filters, ctx: MatchCtx, skip?: Facet) {
  if (skip !== 'cats' && f.cats.length && !f.cats.includes(p.categoryId)) return false;
  if (skip !== 'sale' && ctx.sale && !isOnSale(p)) return false;
  if (skip !== 'price' && f.price) {
    if (p.quoteOnly) return false;
    const v = basePrice(p);
    if (v < f.price[0] - 1e-9 || v > f.price[1] + 1e-9) return false;
  }
  if (skip !== 'stock' && f.stock && !inStockOf(p)) return false;
  if (skip !== 'logo' && f.logo && !hasLogo(p)) return false;
  return true;
}

export function activeCount(f: Filters, sale: boolean) {
  return f.cats.length + (f.price ? 1 : 0) + (f.stock ? 1 : 0) + (f.logo ? 1 : 0) + (sale ? 1 : 0);
}

export interface FacetData {
  cats: { id: string; count: number }[];
  sale: number;
  stock: number;
  logo: number;
  /** Prices (per pack) of products matching every filter except price — feeds the histogram */
  prices: number[];
  bounds: [number, number];
}

/**
 * Facet counts, each computed against every *other* active filter — so a
 * count always tells the shopper how many results that choice would give.
 */
export function computeFacets(scope: Product[], f: Filters, ctx: MatchCtx, categories: Category[]): FacetData {
  const count = (skip: Facet, pred: (p: Product) => boolean) => scope.reduce((n, p) => (passes(p, f, ctx, skip) && pred(p) ? n + 1 : n), 0);
  const pricedScope = (ctx.sale ? scope.filter(isOnSale) : scope).filter((p) => !p.quoteOnly).map(basePrice);
  const lo = pricedScope.length ? Math.floor(Math.min(...pricedScope)) : 0;
  const hi = pricedScope.length ? Math.ceil(Math.max(...pricedScope)) : 0;

  return {
    cats: categories.map((c) => ({ id: c.id, count: count('cats', (p) => p.categoryId === c.id) })),
    sale: count('sale', isOnSale),
    stock: count('stock', inStockOf),
    logo: count('logo', hasLogo),
    prices: scope.filter((p) => !p.quoteOnly && passes(p, f, ctx, 'price')).map(basePrice),
    bounds: [lo, Math.max(hi, lo + 1)],
  };
}

/* ------------------------------------------------------------------ */
/* Price slider scale — packs cost from 0,50 € (cutlery) to ~12 €      */
/* (premium sets); a power curve gives the cheap end more travel.      */
/* ------------------------------------------------------------------ */
export function priceScale(lo: number, hi: number) {
  const span = Math.max(1, hi - lo);
  const ratio = hi / Math.max(lo, 0.5);
  const k = ratio > 12 ? 1.8 : ratio > 4 ? 1.4 : 1;
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
  return {
    toValue: (pos: number) => lo + span * Math.pow(clamp01(pos), k),
    toPos: (v: number) => Math.pow(clamp01((v - lo) / span), 1 / k),
  };
}

/** Round slider values to steps a buyer would type: 0,50 € → 1 € → 5 €. */
export function nicePrice(v: number) {
  if (v < 20) return Math.round(v * 2) / 2;
  if (v < 100) return Math.round(v);
  return Math.round(v / 5) * 5;
}
