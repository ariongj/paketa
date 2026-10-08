// Pure overview maths for the print-shop back office: period windows, revenue (excl. / incl. VAT), chart
// buckets, top products, the prepress pipeline (files, proofs, production) and the "Kërkojnë vëmendje"
// queues. Everything is derived from raw store slices inside `useMemo` (see Dashboard.tsx).
import type { Booking, Inquiry, Offer, Order, OrderStatus, Product, Quote, ReturnRequest, Unit } from '@/lib/types';
import { fulfillmentOf, orderLineNet, orderLineUnits, paymentOf, refundedOf } from '@/lib/orders';
import { isTracked } from '@/lib/inventory';
import { offerState } from '@/lib/offers';
import { artworkSummary, daysLate, orderNet, productionOverdue, proofAwaitingApproval, proofChangesRequested, proofOf, waitingForFiles } from '@/admin/components/orders/print';

export type Period = 'today' | '7' | '30' | '90';
export const PERIODS: Period[] = ['today', '7', '30', '90'];
export const isPeriod = (v: unknown): v is Period => PERIODS.includes(v as Period);
export const periodDays = (p: Period) => (p === 'today' ? 1 : Number(p));

/** Pipeline order of order statuses (new → confirmed → prepress & proof → production → shipped → completed). */
export const STATUS_ORDER: OrderStatus[] = ['new', 'confirmed', 'proof', 'processing', 'shipped', 'completed', 'cancelled'];

/** "Low stock" = stock-tracked product (stock < 999) with this many units or fewer — same as the products list (?zalihe=low). */
export const LOW_STOCK = 5;
/** Promotional offers that end within this many days are flagged. */
export const OFFER_WARN_DAYS = 14;

const DAY = 86_400_000;
const r2 = (n: number) => Math.round(n * 100) / 100;

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Whole calendar days from today to `d` (0 = today, 1 = tomorrow…). */
export function daysUntil(d: Date, now: Date) {
  return Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / DAY);
}

/* ------------------------------------------------------------------ */
/* Revenue — one definition for the KPIs, the chart and the tooltips   */
/* ------------------------------------------------------------------ */
export const isCounted = (o: Pick<Order, 'status'>) => o.status !== 'cancelled';

/**
 * Revenue incl. VAT: what the customer is invoiced (products + design & prepress + delivery − discounts,
 * VAT 18% on top) minus refunds. Cancelled orders count 0.
 */
export function grossRevenue(o: Order): number {
  if (!isCounted(o)) return 0;
  return Math.max(0, r2(o.total - refundedOf(o)));
}

/**
 * Revenue excl. VAT ("Totali pa TVSH" of the invoice, delivery included) minus refunds — a refund reduces
 * the net amount in the same proportion as the invoiced total. Cancelled orders count 0.
 */
export function netRevenue(o: Order): number {
  if (!isCounted(o)) return 0;
  const net = orderNet(o);
  if (!o.total) return Math.max(0, net);
  const kept = Math.max(0, 1 - refundedOf(o) / o.total);
  return Math.max(0, r2(net * kept));
}

/* ------------------------------------------------------------------ */
/* Period windows                                                       */
/* ------------------------------------------------------------------ */
export interface Range {
  start: Date;
  /** exclusive */
  end: Date;
}

/**
 * Current window = the last N calendar days (today included, so far). The comparison window has exactly the
 * same length one period earlier ("today until 12:14" vs "yesterday until 12:14").
 */
export function periodRanges(p: Period, now: Date) {
  const days = periodDays(p);
  const start = addDays(startOfDay(now), -(days - 1));
  const elapsed = now.getTime() - start.getTime();
  const prevStart = addDays(start, -days);
  return {
    days,
    current: { start, end: new Date(now.getTime() + 1) } as Range,
    previous: { start: prevStart, end: new Date(prevStart.getTime() + elapsed + 1) } as Range,
  };
}

const inRange = (iso: string, r: Range) => {
  const t = new Date(iso).getTime();
  return t >= r.start.getTime() && t < r.end.getTime();
};

/* ------------------------------------------------------------------ */
/* Window stats                                                        */
/* ------------------------------------------------------------------ */
export interface TopProduct {
  productId: string;
  name: string;
  image: string;
  unit: Unit;
  /** pieces (or sets for the sample kit) */
  units: number;
  /** line value excl. VAT: products + design & prepress − discounts */
  net: number;
}

export interface WindowStats {
  /** revenue excl. VAT */
  net: number;
  /** revenue incl. VAT */
  gross: number;
  /** every order placed in the window, cancelled included */
  orders: number;
  /** orders that count for revenue (not cancelled) */
  counted: number;
  /** average order value excl. VAT (revenue ÷ counted orders) */
  aov: number;
  byStatus: Record<OrderStatus, number>;
  top: TopProduct[];
  /** contacts (inquiries) received in the window */
  contacts: number;
}

export function windowStats(orders: Order[], inquiries: Inquiry[], r: Range): WindowStats {
  const byStatus = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<OrderStatus, number>;
  const top = new Map<string, TopProduct>();
  let net = 0;
  let gross = 0;
  let count = 0;
  let counted = 0;
  for (const o of orders) {
    if (!inRange(o.createdAt, r)) continue;
    count++;
    if (o.status in byStatus) byStatus[o.status]++;
    if (!isCounted(o)) continue;
    counted++;
    net += netRevenue(o);
    gross += grossRevenue(o);
    o.items.forEach((l, i) => {
      if (!l.productId || l.custom) return;
      const row = top.get(l.productId) ?? { productId: l.productId, name: l.name, image: l.image, unit: l.unit, units: 0, net: 0 };
      row.units += orderLineUnits(l);
      row.net = r2(row.net + orderLineNet(o, i));
      top.set(l.productId, row);
    });
  }
  return {
    net: r2(net),
    gross: r2(gross),
    orders: count,
    counted,
    aov: counted ? r2(net / counted) : 0,
    byStatus,
    top: [...top.values()].sort((a, b) => b.net - a.net).slice(0, 5),
    contacts: inquiries.filter((q) => inRange(q.createdAt, r)).length,
  };
}

/** % change, or null when there is nothing to compare against. */
export function pctChange(cur: number, prev: number, comparable: boolean) {
  if (!comparable || prev <= 0) return null;
  return ((cur - prev) / prev) * 100;
}

/** The comparison window only means something if the shop already had orders back then. */
export function isComparable(orders: Order[], previous: Range) {
  let first = Infinity;
  for (const o of orders) first = Math.min(first, new Date(o.createdAt).getTime());
  return first <= previous.start.getTime() + DAY;
}

/* ------------------------------------------------------------------ */
/* Chart buckets                                                       */
/* ------------------------------------------------------------------ */
export type Step = 'hour' | 'day' | 'week';

export interface Bucket {
  start: Date;
  /** exclusive */
  end: Date;
  /** revenue excl. VAT */
  net: number;
  /** non-cancelled orders behind `net` */
  orders: number;
  /** bucket containing "now" — still in progress */
  current: boolean;
  /** starts after "now" (later hours of today) */
  future: boolean;
}

/** Today → 24 hourly buckets; 7/30 days → daily; 90 days → weekly buckets anchored on today. Oldest first. */
export function buildBuckets(orders: Order[], now: Date, p: Period): { buckets: Bucket[]; step: Step } {
  const today = startOfDay(now);
  const buckets: Bucket[] = [];
  let step: Step;
  if (p === 'today') {
    step = 'hour';
    for (let h = 0; h < 24; h++) {
      const start = new Date(today);
      start.setHours(h);
      const end = new Date(today);
      end.setHours(h + 1);
      buckets.push({ start, end, net: 0, orders: 0, current: now >= start && now < end, future: start > now });
    }
  } else {
    const days = periodDays(p);
    const size = p === '90' ? 7 : 1;
    step = size === 7 ? 'week' : 'day';
    const windowStart = addDays(today, -(days - 1));
    let end = addDays(today, 1);
    while (end > windowStart) {
      let start = addDays(end, -size);
      if (start < windowStart) start = windowStart;
      buckets.unshift({ start, end, net: 0, orders: 0, current: buckets.length === 0, future: false });
      end = start;
    }
  }
  const first = buckets[0].start.getTime();
  const last = buckets[buckets.length - 1].end.getTime();
  for (const o of orders) {
    if (!isCounted(o)) continue;
    const t = new Date(o.createdAt).getTime();
    if (t < first || t >= last) continue;
    const b = buckets.find((x) => t >= x.start.getTime() && t < x.end.getTime());
    if (!b) continue;
    b.net = r2(b.net + netRevenue(o));
    b.orders += 1;
  }
  return { buckets, step };
}

/** Clean y-axis ticks (0 … niceMax) for roughly `count` intervals. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 250, 500, 750, 1000];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v));
  return ticks;
}

/* ------------------------------------------------------------------ */
/* Prepress & production pipeline (live — not scoped by the period)    */
/* ------------------------------------------------------------------ */
export interface Pipeline {
  /** open orders still waiting for at least one print file, oldest first */
  files: Order[];
  /** print files still missing across those orders */
  missingFiles: number;
  /** customer asked for changes on the last proof, oldest first */
  changes: Order[];
  /** proof sent, waiting for the customer's approval, longest waiting first */
  awaiting: Order[];
  /** in production past the planned ready date (lead time in working days), most late first */
  overdue: { order: Order; late: number }[];
}

const byCreated = (a: Order, b: Order) => a.createdAt.localeCompare(b.createdAt);

/** When the current proof went out (falls back to the order date on older data). */
export const proofSentAt = (o: Order, products: Product[]) => proofOf(o, products)?.sentAt ?? o.createdAt;

export function printPipeline(orders: Order[], products: Product[], now: Date): Pipeline {
  const files: Order[] = [];
  const changes: Order[] = [];
  const awaiting: Order[] = [];
  const overdue: Pipeline['overdue'] = [];
  let missingFiles = 0;
  for (const o of orders) {
    if (waitingForFiles(o, products)) {
      files.push(o);
      missingFiles += Math.max(1, artworkSummary(o, products).missing);
    }
    if (proofChangesRequested(o, products)) changes.push(o);
    else if (proofAwaitingApproval(o, products)) awaiting.push(o);
    if (productionOverdue(o, products, now)) overdue.push({ order: o, late: daysLate(o, products, now) });
  }
  files.sort(byCreated);
  changes.sort(byCreated);
  awaiting.sort((a, b) => proofSentAt(a, products).localeCompare(proofSentAt(b, products)));
  overdue.sort((a, b) => b.late - a.late || byCreated(a.order, b.order));
  return { files, missingFiles, changes, awaiting, overdue };
}

/* ------------------------------------------------------------------ */
/* B2B quotes                                                          */
/* ------------------------------------------------------------------ */
/** Quote value: Σ qty × price over its lines (catalogue prices are net, so this is excl. VAT). */
export const quoteValue = (q: Pick<Quote, 'lines'>) => r2(q.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0));

/** Validity ends at the end of `validUntil`'s day. */
export function quoteExpired(q: Pick<Quote, 'validUntil'>, now: Date) {
  const d = new Date(q.validUntil);
  if (Number.isNaN(d.getTime())) return false;
  d.setHours(23, 59, 59, 999);
  return d.getTime() < now.getTime();
}

export type OpenQuoteState = 'draft' | 'sent' | 'expired';
export const openQuoteState = (q: Quote, now: Date): OpenQuoteState => (q.status === 'draft' ? 'draft' : quoteExpired(q, now) ? 'expired' : 'sent');

export interface OpenQuotes {
  /** drafts + sent quotes (expired ones included until someone closes them): sent first by validity, then drafts */
  list: Quote[];
  value: number;
  sent: number;
  drafts: number;
  expired: number;
}

export function openQuotes(quotes: Quote[], now: Date): OpenQuotes {
  const list = quotes.filter((q) => q.status === 'draft' || q.status === 'sent');
  const rank: Record<OpenQuoteState, number> = { sent: 0, expired: 1, draft: 2 };
  list.sort((a, b) => {
    const sa = openQuoteState(a, now);
    const sb = openQuoteState(b, now);
    if (sa !== sb) return rank[sa] - rank[sb];
    return sa === 'draft' ? b.createdAt.localeCompare(a.createdAt) : a.validUntil.localeCompare(b.validUntil);
  });
  let value = 0;
  let sent = 0;
  let drafts = 0;
  let expired = 0;
  for (const q of list) {
    value += quoteValue(q);
    const s = openQuoteState(q, now);
    if (s === 'draft') drafts++;
    else if (s === 'expired') expired++;
    else sent++;
  }
  return { list, value: r2(value), sent, drafts, expired };
}

/* ------------------------------------------------------------------ */
/* "Kërkojnë vëmendje" queues                                           */
/* ------------------------------------------------------------------ */
/** Stock-tracked, non-archived products at or below LOW_STOCK, lowest first (print runs are made to order). */
export function lowStockProducts(products: Product[]) {
  return products
    .filter((p) => p.status !== 'archived' && isTracked(p) && p.stock <= LOW_STOCK)
    .sort((a, b) => a.stock - b.stock || a.sku.localeCompare(b.sku));
}

/** Open (not cancelled) orders whose payment is still outstanding. */
export function pendingPayments(orders: Order[]) {
  return orders.filter((o) => {
    if (!isCounted(o)) return false;
    const s = paymentOf(o);
    return s === 'pending' || s === 'authorized' || s === 'failed';
  });
}

/** Not-cancelled orders that have not (fully) left the factory, oldest first. */
export function unfulfilledOrders(orders: Order[]) {
  return orders
    .filter((o) => isCounted(o) && (fulfillmentOf(o) === 'unfulfilled' || fulfillmentOf(o) === 'partial'))
    .sort(byCreated);
}

/** Meetings / consultations the customer asked for that nobody confirmed yet, soonest first. */
export function pendingBookings(bookings: Booking[]) {
  return bookings.filter((b) => b.status === 'pending').sort((a, b) => a.start.localeCompare(b.start));
}

/** Open contacts and quote requests with no one responsible, newest first. */
export function unassignedContacts(inquiries: Inquiry[]) {
  return inquiries.filter((q) => q.status !== 'done' && !q.assignee).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Running promotional offers that end within OFFER_WARN_DAYS, soonest first. */
export function expiringOffers(offers: Offer[], now: Date) {
  const limit = now.getTime() + OFFER_WARN_DAYS * DAY;
  return offers
    .filter((o) => o.endsAt && offerState(o, now) === 'active' && new Date(o.endsAt).getTime() <= limit)
    .sort((a, b) => (a.endsAt ?? '').localeCompare(b.endsAt ?? ''));
}

/** Complaints / returns waiting for a decision or for the goods, oldest first. */
export function openReturns(returns: ReturnRequest[]) {
  return returns.filter((r) => r.status === 'requested' || r.status === 'approved').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */
export function campaignSummary(offers: Offer[], now: Date) {
  const active: Offer[] = [];
  let scheduled = 0;
  let drafts = 0;
  for (const o of offers) {
    const s = offerState(o, now);
    if (s === 'active') active.push(o);
    else if (s === 'scheduled') scheduled++;
    else if (s === 'draft') drafts++;
  }
  active.sort((a, b) => b.metrics.revenue - a.metrics.revenue);
  return { active, scheduled, drafts };
}
