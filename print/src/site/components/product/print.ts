// Print-commerce helpers shared by the product card, configurator, cart and checkout:
// "from" prices, quantity bounds/snapping (MOQ + step), tier rows, unit-price formatting with
// sub-cent precision, lead-time dates and artwork file handling (metadata + a tiny preview).
import type { ArtworkRef, Lang, Product } from '@/lib/types';
import { minQty, unitPrice } from '@/lib/pricing';
import { round2 } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */
const LOCALE: Record<Lang, string> = { sq: 'de-DE', en: 'en-IE' };

/** Unit price with 2–3 decimals: label tiers go below a cent (0,075 €). */
export function unitMoney(v: number, lang: Lang) {
  return new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(v);
}

/** 1.000 / 1,000 */
export function qtyText(n: number, lang: Lang) {
  return new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 0 }).format(n);
}

/** Signed per-piece delta: "+0,03 €", "−0,08 €" */
export function deltaMoney(v: number, lang: Lang) {
  return `${v > 0 ? '+' : '−'}${unitMoney(Math.abs(v), lang)}`;
}

/* ------------------------------------------------------------------ */
/* Product kind                                                        */
/* ------------------------------------------------------------------ */
/** Print product sold in runs (tiers / MOQ) — everything but sample kits and quote-only items. */
export const isRun = (p: Product) => !p.quoteOnly && (!!p.tiers?.length || (p.moq ?? 1) > 1);

/** The paid design / prepress add-on is offered (field name is legacy: `installation`). */
export const hasDesign = (p: Product) => !!p.installation?.available;

/** Cheapest value of every option group — the basis of a "from" price. */
export function cheapestOptions(p: Product) {
  const out: Record<string, string> = {};
  for (const o of p.options) {
    const best = [...o.values].sort((a, b) => (a.priceDelta ?? 0) - (b.priceDelta ?? 0))[0];
    if (best) out[o.id] = best.id;
  }
  return out;
}

/** Lowest per-piece price a shopper can reach (largest tier, cheapest options). */
export function fromUnitPrice(p: Product) {
  const top = p.tiers?.length ? Math.max(...p.tiers.map((t) => t.qty)) : undefined;
  return unitPrice(p, cheapestOptions(p), top);
}

/* ------------------------------------------------------------------ */
/* Quantity                                                            */
/* ------------------------------------------------------------------ */
/** Products with stock ≥ 999 are produced on demand. */
const ON_DEMAND = 999;
const RUN_MAX = 1_000_000;

export interface QtyRules {
  min: number;
  step: number;
  max: number;
}

export function qtyRules(p: Product): QtyRules {
  const min = minQty(p);
  const step = Math.max(1, p.qtyStep ?? (isRun(p) ? min : 1));
  const max = p.stock > 0 && p.stock < ON_DEMAND ? Math.max(min, p.stock) : isRun(p) ? RUN_MAX : ON_DEMAND;
  return { min, step, max };
}

/** Snap to the order grid: ≥ MOQ, MOQ + k × step, ≤ max. */
export function snapQty(n: number, r: QtyRules) {
  if (!Number.isFinite(n) || n <= r.min) return r.min;
  const k = Math.round((n - r.min) / r.step);
  return Math.min(r.max, r.min + k * r.step);
}

export interface TierRow {
  qty: number;
  unit: number;
  total: number;
  /** % saved per piece vs. the smallest run */
  save: number;
}

/** Quantity break table for the chosen options. */
export function tierRows(p: Product, options: Record<string, string>): TierRow[] {
  const list = [...(p.tiers ?? [])].sort((a, b) => a.qty - b.qty);
  if (!list.length) return [];
  const first = unitPrice(p, options, list[0].qty);
  return list.map((t) => {
    const unit = unitPrice(p, options, t.qty);
    return { qty: t.qty, unit, total: round2(unit * t.qty), save: first > 0 ? Math.max(0, Math.round((1 - unit / first) * 100)) : 0 };
  });
}

/** Tier the configurator opens on: a mid-size run (the most ordered) when there are enough breaks. */
export function defaultQty(p: Product) {
  const t = [...(p.tiers ?? [])].sort((a, b) => a.qty - b.qty);
  if (t.length >= 4) return t[2].qty;
  if (t.length >= 2) return t[1].qty;
  return qtyRules(p).min;
}

/* ------------------------------------------------------------------ */
/* Lead time                                                           */
/* ------------------------------------------------------------------ */
/** Date `days` working days from `from` (Mon–Fri). */
export function addWorkingDays(days: number, from = new Date()) {
  const d = new Date(from);
  let left = Math.max(0, Math.round(days));
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

const SQ_MONTHS = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'kor', 'gus', 'sht', 'tet', 'nën', 'dhj'];
const SQ_DAYS = ['diel', 'hënë', 'martë', 'mërkurë', 'enjte', 'premte', 'shtunë'];
const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "e enjte, 23 tet" / "Thu, 23 Oct" — spelled out because Chrome ships without Albanian Intl data. */
export function shortDay(d: Date, lang: Lang) {
  if (lang === 'sq') return `e ${SQ_DAYS[d.getDay()]}, ${d.getDate()} ${SQ_MONTHS[d.getMonth()]}`;
  return `${EN_DAYS[d.getDay()]}, ${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
}

/* ------------------------------------------------------------------ */
/* Artwork files                                                       */
/* ------------------------------------------------------------------ */
export const ARTWORK_ACCEPT = '.pdf,.ai,.eps,.svg,.png,.jpg,.jpeg,.tif,.tiff,application/pdf,image/png,image/jpeg,image/svg+xml,image/tiff';
export const ARTWORK_EXT = ['pdf', 'ai', 'eps', 'svg', 'png', 'jpg', 'jpeg', 'tif', 'tiff'];
/** Real files are not uploaded in the demo — only name, size and a preview are kept. */
export const ARTWORK_MAX_BYTES = 500 * 1024 * 1024;

export const fileExt = (name: string) => (name.split('.').pop() ?? '').toLowerCase();
export const isArtworkFile = (name: string) => ARTWORK_EXT.includes(fileExt(name));

export function fileSize(bytes: number | undefined, lang: Lang) {
  if (!bytes) return '';
  const fmt = (v: number, d = 1) => new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: d }).format(v);
  if (bytes < 1024 * 1024) return `${fmt(Math.max(1, Math.round(bytes / 1024)), 0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${fmt(bytes / 1024 / 1024)} MB`;
  return `${fmt(bytes / 1024 / 1024 / 1024)} GB`;
}

/** Small JPEG data-URL preview (≤ ~40 KB) for raster / SVG artwork; null for PDF, AI, EPS, TIFF. */
export async function makeThumb(file: File, maxSide = 220, maxBytes = 40_000): Promise<string | null> {
  const ext = fileExt(file.name);
  if (!['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext) || file.size > 40 * 1024 * 1024) return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const w0 = img.naturalWidth || 600;
    const h0 = img.naturalHeight || 600;
    for (const side of [maxSide, 160, 110]) {
      const k = Math.min(1, side / Math.max(w0, h0));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w0 * k));
      canvas.height = Math.max(1, Math.round(h0 * k));
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      for (const q of [0.78, 0.6]) {
        const data = canvas.toDataURL('image/jpeg', q);
        if (data.length <= maxBytes) return data;
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** File → ArtworkRef (metadata + preview). */
export async function artworkFromFile(file: File, note?: string): Promise<ArtworkRef> {
  const thumb = await makeThumb(file);
  return { status: 'uploaded', name: file.name, size: file.size, ...(thumb ? { thumb } : {}), ...(note ? { note } : {}) };
}
