import type { AppliedDiscount, CartItem, Collection, Coupon, DeliveryMethod, Discount, Lang, PriceTier, Product, Settings } from './types';
import { lt } from '@/i18n';
import { round2 } from './utils';
import { applyDiscounts, discountState, normalizeCode, type DiscountCustomer, type RejectedDiscount, type RejectReason } from './discounts';
import { collectionIdsFor } from './collections';

/** Packs needed for a number of pieces ("I need 1.200 cups" → 24 packs of 50). */
export function packsForPieces(pieces: number, packSize: number) {
  if (!pieces || pieces <= 0 || !packSize) return 0;
  return Math.ceil(pieces / packSize - 1e-9);
}

/** Pieces in one selling unit: packSize for packs, 1 otherwise. */
export function piecesPerUnit(p: Product) {
  return p.unit === 'pack' && p.packSize ? p.packSize : 1;
}

/** Total pieces represented by a quantity of selling units. */
export function piecesFor(p: Product, qty: number) {
  return qty * piecesPerUnit(p);
}

/** Price of a single piece (unit price / pieces per unit) — may be a fraction of a cent. */
export function piecePrice(p: Product, options: Record<string, string> = {}, qty = 1) {
  return unitPrice(p, options, qty) / piecesPerUnit(p);
}

/** Volume tiers sorted ascending; invalid rows dropped. */
export function tiersOf(p: Product): PriceTier[] {
  return (p.tiers ?? []).filter((t) => t.minQty > 1 && t.pct > 0 && t.pct < 100).slice().sort((a, b) => a.minQty - b.minQty);
}

/** Volume discount (%) for a line of `qty` units — the highest tier reached, 0 if none. */
export function tierPct(p: Product, qty: number) {
  let pct = 0;
  for (const t of tiersOf(p)) if (qty >= t.minQty) pct = t.pct;
  return pct;
}

/** The next tier above `qty` (for "add 3 more packs to save 5 %" hints). */
export function nextTier(p: Product, qty: number): PriceTier | null {
  return tiersOf(p).find((t) => t.minQty > qty) ?? null;
}

export function basePrice(p: Product) {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

export function isOnSale(p: Product) {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price;
}

export function discountPct(p: Product) {
  return isOnSale(p) ? Math.round((1 - (p.salePrice as number) / p.price) * 100) : 0;
}

export function optionsDelta(p: Product, options: Record<string, string>) {
  let delta = 0;
  for (const o of p.options) {
    const v = o.values.find((x) => x.id === options[o.id]);
    if (v?.priceDelta) delta += v.priceDelta;
  }
  return delta;
}

/**
 * Unit price (VAT incl.) for the chosen options — per pack, piece, set or metre.
 * With `qty`, the product's volume tier for that line quantity is applied.
 */
export function unitPrice(p: Product, options: Record<string, string> = {}, qty = 1) {
  const pct = tierPct(p, qty);
  const base = basePrice(p) + optionsDelta(p, options);
  return round2(pct ? base * (1 - pct / 100) : base);
}

export function regularUnitPrice(p: Product, options: Record<string, string> = {}) {
  return round2(p.price + optionsDelta(p, options));
}

/** Priced units the line represents — prices are per selling unit, so this is the quantity itself. */
export function qtyUnits(_p: Product, qty: number) {
  return qty;
}

export function optionsLabel(p: Product, options: Record<string, string>, lang: Lang) {
  return p.options
    .map((o) => {
      const v = o.values.find((x) => x.id === options[o.id]);
      return v ? `${lt(o.name, lang)}: ${lt(v.label, lang)}` : null;
    })
    .filter(Boolean)
    .join(' · ');
}

export function defaultOptions(p: Product) {
  const out: Record<string, string> = {};
  for (const o of p.options) if (o.values[0]) out[o.id] = o.values[0].id;
  return out;
}

export interface PricedLine {
  item: CartItem;
  product: Product;
  unitPrice: number;
  regularUnitPrice: number;
  units: number;
  lineTotal: number;
  /** Volume-tier discount (%) applied to unitPrice, 0 if none */
  tierPct: number;
  installationUnitPrice: number;
  installationTotal: number;
  optionsLabel: string;
  /** CMS v2: product + order discounts allocated to this line (EUR) */
  discount: number;
  /** CMS v2: allocation per discount rule */
  allocations: { discountId: string; amount: number }[];
}

/**
 * Why the (first) entered code did not apply. 'min' is kept for older screens; the other values
 * mirror the engine's RejectReason.
 */
export type CouponError = 'notfound' | 'inactive' | 'expired' | 'min' | 'scheduled' | 'notCombinable' | 'notEligible' | 'usageLimit' | 'audience';

const toCouponError = (r: RejectReason): CouponError => (r === 'minimum' ? 'min' : r);

/** Legacy v1 lookup — kept for the old Coupons screen. The cart now uses the discount engine. */
export function validateCoupon(code: string | null | undefined, coupons: Coupon[], subtotal: number): { coupon: Coupon | null; error?: CouponError } {
  if (!code) return { coupon: null };
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c) return { coupon: null, error: 'notfound' };
  if (!c.active) return { coupon: null, error: 'inactive' };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { coupon: null, error: 'expired' };
  if (c.minTotal && subtotal < c.minTotal) return { coupon: null, error: 'min' };
  return { coupon: c };
}

export function couponDiscount(c: Coupon | null, subtotal: number) {
  if (!c) return 0;
  const d = c.type === 'percent' ? (subtotal * c.value) / 100 : c.value;
  return round2(Math.min(d, subtotal));
}

/** Adapter: a v1 coupon expressed as an order discount (used only when no `discounts` are passed). */
export function couponToDiscount(c: Coupon): Discount {
  return {
    id: c.id,
    title: c.description || c.code,
    publicTitle: { me: c.code, sq: c.code, en: c.code },
    kind: 'order',
    method: 'code',
    code: normalizeCode(c.code),
    valueType: c.type,
    value: c.value,
    appliesTo: { scope: 'all', ids: [] },
    minimum: c.minTotal ? { type: 'amount', value: c.minTotal } : { type: 'none', value: 0 },
    audience: { type: 'all' },
    combines: { products: true, order: false, shipping: true },
    startsAt: '2000-01-01T00:00:00.000Z',
    endsAt: c.expiresAt,
    status: c.active ? 'active' : 'paused',
    uses: c.uses,
    createdAt: '2000-01-01T00:00:00.000Z',
  };
}

/** Coupon-shaped view of an applied code discount, for screens written against v1 coupons. */
function couponView(d: Discount, applied: AppliedDiscount): Coupon {
  return {
    id: d.id,
    code: applied.code ?? normalizeCode(d.code),
    type: d.kind === 'bxgy' ? 'fixed' : d.valueType,
    value: d.kind === 'bxgy' ? applied.amount : d.value,
    minTotal: d.minimum.type === 'amount' ? d.minimum.value : undefined,
    active: true,
    uses: d.uses,
    expiresAt: d.endsAt,
    description: d.title,
  };
}

export function zoneForCity(settings: Settings, city?: string) {
  if (!city) return null;
  return settings.shippingZones.find((z) => z.cities.some((c) => c.toLowerCase() === city.toLowerCase())) ?? null;
}

export function allCities(settings: Settings) {
  return settings.shippingZones.flatMap((z) => z.cities).sort((a, b) => a.localeCompare(b, 'sq'));
}

/** The live automatic free-shipping rule (lowest amount threshold wins), if any. */
export function activeShippingRule(discounts: Discount[] | undefined, now?: Date | string | number): Discount | null {
  const list = (discounts ?? []).filter((d) => d.kind === 'shipping' && d.method === 'auto' && d.audience?.type !== 'segment' && discountState(d, now) === 'active');
  list.sort((a, b) => (a.minimum.type === 'amount' ? a.minimum.value : 0) - (b.minimum.type === 'amount' ? b.minimum.value : 0));
  return list[0] ?? null;
}

export interface Totals {
  lines: PricedLine[];
  count: number;
  subtotal: number;
  installationTotal: number;
  /** Product + order discounts (EUR). Shipping discounts are already reflected in `shipping`. */
  discount: number;
  shipping: number;
  /** true when no city chosen yet and shipping is an estimate ("from") */
  shippingEstimate: boolean;
  /** 'installation' is no longer produced (Paketoje's logo print does not include delivery) — kept for older screens */
  freeShippingReason: 'threshold' | 'installation' | 'pickup' | null;
  freeShippingRemaining: number;
  total: number;
  vat: number;
  /** true when any line has the custom logo print add-on */
  hasInstallation: boolean;
  /** Total pieces in the cart (packs × pack size) */
  pieces: number;
  /** Legacy: the first entered code, when it applied (Coupon-shaped view of the discount) */
  coupon: Coupon | null;
  /** Legacy: why the first entered code did not apply */
  couponError?: CouponError;

  /* ---- CMS v2 ---- */
  /** Normalised codes that were evaluated */
  codes: string[];
  /** Every rule that applied, in calculation order (products → order → shipping) */
  applied: AppliedDiscount[];
  /** Every entered code / automatic rule that did not apply, with a reason */
  rejected: RejectedDiscount[];
  productDiscount: number;
  orderDiscount: number;
  shippingDiscount: number;
  /** Shipping fee before the shipping discount (0 for pickup) */
  shippingBeforeDiscount: number;
  /** Minimum of the active automatic free-shipping rule (null = no such rule) */
  freeShippingThreshold: number | null;
  /** For couponError 'min': the minimum of the first code (EUR) and how much is missing */
  couponMinimum?: { value: number; missing: number; type: 'amount' | 'qty' };
}

export interface PriceCartOptions {
  lang: Lang;
  /** Entered discount codes (any case/spacing) */
  codes?: string[];
  /** Legacy single code — treated as the first code */
  couponCode?: string | null;
  /** Discount rules (db.discounts). When omitted, legacy `coupons` are adapted. */
  discounts?: Discount[];
  /** Collections, needed for rules scoped to collections */
  collections?: Collection[];
  /** @deprecated v1 coupons — used only when `discounts` is not given */
  coupons?: Coupon[];
  delivery?: DeliveryMethod;
  city?: string;
  /** Evaluation time for schedules (default: now) — demo data passes the order date */
  now?: Date | string | number;
  customer?: DiscountCustomer | null;
}

export function priceCart(cart: CartItem[], products: Product[], settings: Settings, opts: PriceCartOptions): Totals {
  const lines: Omit<PricedLine, 'discount' | 'allocations'>[] = [];
  for (const item of cart) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    const up = unitPrice(product, item.options, item.qty);
    const units = qtyUnits(product, item.qty);
    const instUnit = item.installation && product.installation?.available ? product.installation.price : 0;
    lines.push({
      item,
      product,
      unitPrice: up,
      regularUnitPrice: regularUnitPrice(product, item.options),
      units,
      lineTotal: round2(up * units),
      tierPct: tierPct(product, item.qty),
      installationUnitPrice: instUnit,
      installationTotal: round2(instUnit * units),
      optionsLabel: optionsLabel(product, item.options, opts.lang),
    });
  }
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const installationTotal = round2(lines.reduce((s, l) => s + l.installationTotal, 0));
  const hasInstallation = installationTotal > 0;

  /* ---------- shipping fee before discounts (business rules first) ---------- */
  let fee = 0;
  let shippingEstimate = false;
  const zone = zoneForCity(settings, opts.city);
  if (lines.length && opts.delivery !== 'pickup') {
    if (zone) fee = zone.fee;
    else {
      fee = settings.shippingZones.length ? Math.min(...settings.shippingZones.map((z) => z.fee)) : 0;
      shippingEstimate = true;
    }
  }

  /* ---------- discount engine ---------- */
  const discounts = opts.discounts ?? (opts.coupons ?? []).map(couponToDiscount);
  const collections = opts.collections ?? [];
  const codes = [opts.couponCode, ...(opts.codes ?? [])].map(normalizeCode).filter((c, i, a) => !!c && a.indexOf(c) === i);
  const res = applyDiscounts({
    lines: lines.map((l) => ({
      id: l.item.key || l.product.id,
      productId: l.product.id,
      qty: l.item.qty,
      unitPrice: l.item.qty ? l.lineTotal / l.item.qty : 0,
      total: l.lineTotal,
      collectionIds: collections.length ? collectionIdsFor(l.product, collections) : [],
    })),
    discounts,
    codes,
    shipping: fee,
    shippingZoneId: zone?.id ?? null,
    customer: opts.customer,
    now: opts.now,
  });
  const priced: PricedLine[] = lines.map((l, i) => ({ ...l, discount: res.lines[i]?.discount ?? 0, allocations: res.lines[i]?.allocations ?? [] }));
  const discount = res.discountTotal;
  const shipping = res.shipping;

  /* ---------- free shipping reason & progress ---------- */
  let freeShippingReason: Totals['freeShippingReason'] = null;
  if (lines.length) {
    if (opts.delivery === 'pickup') freeShippingReason = 'pickup';
    else if (fee > 0 && shipping === 0 && res.applied.some((a) => a.kind === 'shipping')) freeShippingReason = 'threshold';
  }
  const rule = activeShippingRule(discounts, opts.now);
  const freeShippingThreshold = rule && rule.minimum.type === 'amount' ? rule.minimum.value : rule ? 0 : null;
  // threshold base = subtotal after product discounts (same as the engine)
  const freeShippingRemaining = freeShippingThreshold != null ? Math.max(0, round2(freeShippingThreshold - (subtotal - res.productDiscount))) : 0;

  /* ---------- legacy single-coupon view ---------- */
  const first = codes[0];
  const firstApplied = first ? res.applied.find((a) => a.code === first) : undefined;
  const firstRule = firstApplied ? discounts.find((d) => d.id === firstApplied.id) : undefined;
  const coupon = firstApplied && firstRule ? couponView(firstRule, firstApplied) : null;
  const firstRejected = first && !coupon ? res.rejected.find((r) => r.code === first) : undefined;
  let couponMinimum: Totals['couponMinimum'];
  if (firstRejected?.reason === 'minimum') {
    const d = discounts.find((x) => x.id === firstRejected.id);
    couponMinimum = { value: d?.minimum.value ?? 0, missing: firstRejected.missing ?? 0, type: firstRejected.minimumType ?? 'amount' };
  }

  const total = round2(subtotal + installationTotal - discount + shipping);
  const vat = round2(total - total / (1 + settings.vatRate / 100));
  return {
    lines: priced,
    count: priced.reduce((s, l) => s + (l.product.unit === 'm' ? 1 : l.item.qty), 0),
    pieces: priced.reduce((s, l) => s + piecesFor(l.product, l.item.qty), 0),
    subtotal,
    installationTotal,
    discount,
    shipping,
    shippingEstimate: shippingEstimate && shipping > 0,
    freeShippingReason,
    freeShippingRemaining,
    total,
    vat,
    hasInstallation,
    coupon,
    couponError: firstRejected ? toCouponError(firstRejected.reason) : undefined,
    codes,
    applied: res.applied,
    rejected: res.rejected,
    productDiscount: res.productDiscount,
    orderDiscount: res.orderDiscount,
    shippingDiscount: res.shippingDiscount,
    shippingBeforeDiscount: fee,
    freeShippingThreshold,
    couponMinimum,
  };
}
