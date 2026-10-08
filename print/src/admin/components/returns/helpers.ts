// Reklamacione — complaints on printed orders (the store's return flow: requested → approved → received →
// refunded | rejected). PDF p.24: the refund uses the NET paid amount of the lines, never the current offer;
// PrintWorks prices are net, so the money returned to the customer adds the VAT they paid on top.
import { fold } from '@/lib/search';
import { orderLineInstallation, refundForLines, refundedOf } from '@/lib/orders';
import { lt } from '@/i18n';
import type { Lang, Order, OrderLine, Product, ReturnRequest, ReturnStatus } from '@/lib/types';

const r2 = (n: number) => Math.round(n * 100) / 100;

export const RETURN_FLOW: ReturnStatus[] = ['requested', 'approved', 'received', 'refunded'];
export const RETURN_STATUSES: ReturnStatus[] = [...RETURN_FLOW, 'rejected'];

/* ------------------------------------------------------------------ */
/* Complaint extension fields                                          */
/* ------------------------------------------------------------------ */
/** How the complaint is settled. The store flow is unchanged — the last step ("refunded") closes all three. */
export const RESOLUTIONS = ['reprint', 'refund', 'credit'] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

/**
 * ReturnRequest has no resolution field yet, so the complaints screens keep it next to the request (persisted via
 * upsert, same pattern as `archivedAt` on orders). `reprintDraftId` links the free reprint draft.
 */
export type Complaint = ReturnRequest & { resolution?: Resolution; reprintDraftId?: string };
/** Older requests without a resolution were plain refunds. */
export const resolutionOf = (r: ReturnRequest): Resolution => (r as Complaint).resolution ?? 'refund';
export const reprintDraftOf = (r: ReturnRequest) => (r as Complaint).reprintDraftId;

/* ------------------------------------------------------------------ */
/* Reasons (print)                                                      */
/* ------------------------------------------------------------------ */
export const REASONS = ['colour', 'cutting', 'short', 'transit', 'defect', 'file', 'customer', 'other'] as const;
export type ReasonKey = (typeof REASONS)[number];

/** Best-effort reason category from free text (seeded/imported reasons are written by people). */
export function reasonKey(text: string): ReasonKey {
  const f = fold(text);
  if (/ndryshoi|ndryshim|changed (the|their|his|her)|change after/.test(f)) return 'customer';
  if (/skedar|wrong file|file printed|version/.test(f)) return 'file';
  if (/ngjyr|colou?r|nuanc|shade|nijans|pantone|prov[ae]n|proof/.test(f)) return 'colour';
  if (/prerj|die-?cut|cutting|matric|stanc|bigim|crease/.test(f)) return 'cutting';
  if (/sasi|short|mungo|missing|less than|me pak/.test(f)) return 'short';
  if (/transport|transit|damag|demtu|ostecen|broken|thyer|lagu|wet/.test(f)) return 'transit';
  if (/njoll|defekt|defect|smudg|stain|mrazi|regjist|register|print/.test(f)) return 'defect';
  return 'other';
}

/* ------------------------------------------------------------------ */
/* Lines                                                               */
/* ------------------------------------------------------------------ */
/** Order lines grouped by product (a return line references a product, an order may list it twice with other options). */
export interface ReturnableGroup {
  productId: string;
  lines: { line: OrderLine; index: number }[];
  qty: number;
  /** net paid per unit (after discounts, excl. VAT), EUR */
  unitNet: number;
}

export function returnableGroups(order: Order): ReturnableGroup[] {
  const map = new Map<string, ReturnableGroup>();
  order.items.forEach((line, index) => {
    if (!line.productId || line.custom || !line.qty) return;
    const g = map.get(line.productId) ?? { productId: line.productId, lines: [], qty: 0, unitNet: 0 };
    g.lines.push({ line, index });
    g.qty += line.qty;
    map.set(line.productId, g);
  });
  for (const g of map.values()) g.unitNet = g.qty ? refundForLines(order, [{ productId: g.productId, qty: g.qty }]) / g.qty : 0;
  return [...map.values()];
}

/** Units already in non-rejected complaints of an order, per product (optionally ignoring one). */
export function returnedQty(returns: ReturnRequest[], orderId: string, ignoreId?: string) {
  const map = new Map<string, number>();
  for (const r of returns) {
    if (r.orderId !== orderId || r.status === 'rejected' || r.id === ignoreId) continue;
    for (const l of r.lines) map.set(l.productId, (map.get(l.productId) ?? 0) + l.qty);
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */
/**
 * 1 + VAT rate when the order was priced net (VAT added on top: total > net base), else 1 (VAT already inside the
 * line amounts). Works for any order without needing the settings at the time it was placed.
 */
export function vatFactor(order: Pick<Order, 'subtotal' | 'installationTotal' | 'discount' | 'shipping' | 'total'>, vatRate: number) {
  const base = (order.subtotal ?? 0) + (order.installationTotal ?? 0) - (order.discount ?? 0) + (order.shipping ?? 0);
  return base > 0 && order.total > base + 0.01 ? 1 + vatRate / 100 : 1;
}

/** Amount to give back for complained quantities: net paid (after discounts) + the VAT on it. */
export function refundGross(order: Order, lines: { productId: string; qty: number }[], vatRate: number) {
  return r2(refundForLines(order, lines) * vatFactor(order, vatRate));
}

/**
 * Value / discount / net / VAT / gross for complained quantities — walks the order lines exactly like
 * refundForLines, so the breakdown always adds up to the computed amount.
 */
export function refundBreakdown(order: Order, lines: { productId: string; qty: number }[], vatRate: number) {
  let value = 0;
  for (const want of lines) {
    let left = want.qty;
    order.items.forEach((l) => {
      if (left <= 0 || l.productId !== want.productId || !l.qty) return;
      const take = Math.min(left, l.qty);
      value += ((l.lineTotal + orderLineInstallation(l)) / l.qty) * take;
      left -= take;
    });
  }
  const net = refundForLines(order, lines);
  const gross = refundGross(order, lines, vatRate);
  return { value: r2(value), discount: r2(Math.max(0, r2(value) - net)), net, vat: r2(gross - net), gross, netPriced: gross > net };
}

/** What may still be paid back on this complaint: the computed gross, capped by the order's remaining paid amount. */
export function refundCap(order: Order, ret: ReturnRequest, vatRate: number) {
  const computed = refundGross(order, ret.lines, vatRate);
  const remaining = Math.max(0, r2(order.total - refundedOf(order)));
  return { computed, remaining, max: Math.min(computed, remaining), capped: remaining < computed };
}

/** Amount shown for a complaint: what was settled once closed, otherwise what would be paid back now. */
export function complaintAmount(ret: ReturnRequest, order: Order | undefined, vatRate: number) {
  if (ret.status === 'refunded' || ret.status === 'rejected' || !order) return ret.refundAmount;
  return refundCap(order, ret, vatRate).max;
}

/* ------------------------------------------------------------------ */
/* Display                                                             */
/* ------------------------------------------------------------------ */
/** Product name in the admin language (falls back to the order snapshot). */
export function lineName(productId: string, order: Order | undefined, products: Product[], lang: Lang) {
  const p = products.find((x) => x.id === productId);
  if (p) return lt(p.name, lang);
  return order?.items.find((l) => l.productId === productId)?.name ?? productId;
}

export const lineImage = (productId: string, order: Order | undefined, products: Product[]) =>
  order?.items.find((l) => l.productId === productId)?.image ?? products.find((x) => x.id === productId)?.images[0];

/** A product made to the customer's design cannot go back on the shelf. */
export function isPrintedLine(productId: string, order: Order | undefined, products: Product[]) {
  const line = order?.items.find((l) => l.productId === productId);
  if (line?.artwork) return true;
  const p = products.find((x) => x.id === productId);
  return p ? !!p.artwork || p.stock >= 999 : true;
}

/** Moment a complaint reached a status (latest entry). */
export const reachedAt = (r: ReturnRequest, s: ReturnStatus) => [...r.timeline].reverse().find((e) => e.status === s)?.at;
