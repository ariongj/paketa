// Contacts inbox & B2B quotes — pure helpers (CMS proposal pp.43–44).
import type { Booking, DraftOrder, Inquiry, InquiryStatus, Lang, Order, Quote, Service, Staff } from '@/lib/types';
import { fold } from '@/lib/search';
import { can } from '@/lib/permissions';
import { round2 } from '@/lib/utils';
import { aggregateCustomers, type CustomerRow } from '@/admin/components/crm/customers';

/* ------------------------------------------------------------------ */
/* Local data extensions                                               */
/* ------------------------------------------------------------------ */
/** A reply sent to the customer from the CMS — kept apart from private notes (p.43). */
export interface Reply {
  id: string;
  at: string;
  /** Staff id */
  by: string;
  channel: 'email';
  to: string;
  text: string;
  status: 'sent' | 'failed';
  error?: 'invalidEmail' | 'noEmail';
}

/**
 * Fields the inbox stores on an inquiry beyond the shared `Inquiry` type (additive, persisted with it):
 * replies, an explicit customer-profile link (null = unlinked on purpose) and an explicit kind for
 * manually created meetings.
 */
export interface InquiryExtra {
  replies?: Reply[];
  customerKey?: string | null;
  kind?: ContactKind;
}
export type InquiryX = Inquiry & InquiryExtra;

/* ------------------------------------------------------------------ */
/* Kind · status tab · source                                          */
/* ------------------------------------------------------------------ */
/** b2b = request for quote (RFQ) · contact = message · meeting = consultation / factory visit / press check. */
export type ContactKind = 'b2b' | 'contact' | 'meeting';
export const KINDS: ContactKind[] = ['b2b', 'contact', 'meeting'];

/**
 * Kërkesë për ofertë / Mesazh / Takim. The legacy inquiry type `measurement` is a meeting request; a
 * message that asks for (or got) an appointment is a meeting too.
 */
export function kindOf(q: InquiryX, linkedBooking?: boolean): ContactKind {
  const k = q.kind as string | undefined;
  if (k === 'b2b' || k === 'contact' || k === 'meeting') return k;
  if (k === 'measurement') return 'meeting';
  if (q.type === 'quote' || q.specs) return 'b2b';
  if (q.type === 'measurement') return 'meeting';
  return q.preferredDate || q.scheduledAt || linkedBooking ? 'meeting' : 'contact';
}

export type ContactTab = 'all' | 'new' | 'open' | 'closed';
export const TABS: ContactTab[] = ['all', 'new', 'open', 'closed'];
export const tabOf = (s: InquiryStatus): Exclude<ContactTab, 'all'> => (s === 'new' ? 'new' : s === 'done' ? 'closed' : 'open');
export const STATUSES: InquiryStatus[] = ['new', 'contacted', 'scheduled', 'done'];

export type SourceId = 'web-form' | 'measurement' | 'quote' | 'phone' | 'manual';
export const SOURCES: SourceId[] = ['web-form', 'measurement', 'quote', 'phone', 'manual'];
export const sourceOf = (q: Inquiry): SourceId => q.source ?? (q.type === 'measurement' ? 'measurement' : q.type === 'quote' ? 'quote' : 'web-form');
export const sourceKey = (s: SourceId) => `src_${s.replace('-', '_')}` as 'src_web_form' | 'src_measurement' | 'src_quote' | 'src_phone' | 'src_manual';

/** Storefront page the form was sent from (null for phone / manual entries). */
export function sourcePath(q: Inquiry, productSlug?: string): string | null {
  const s = sourceOf(q);
  if (s === 'phone' || s === 'manual') return null;
  if (productSlug) return `/produkt/${productSlug}`;
  if (s === 'quote' || q.specs) return '/kerko-oferte';
  if (s === 'measurement') return '/teknologjia';
  return '/kontakt';
}

/* ------------------------------------------------------------------ */
/* Due (Afati)                                                         */
/* ------------------------------------------------------------------ */
const HOUR = 3600000;
const DAY = 24 * HOUR;
export const REPLY_SLA_H = 24;

export interface Due {
  at: string;
  /** followUp = set by staff · reply = new contact, answer within 24 h · visit = booked appointment */
  kind: 'followUp' | 'reply' | 'visit';
}

export function dueOf(q: Inquiry): Due | null {
  if (q.status === 'done') return null;
  if (q.followUpAt) return { at: q.followUpAt, kind: 'followUp' };
  if (q.status === 'new') return { at: new Date(new Date(q.createdAt).getTime() + REPLY_SLA_H * HOUR).toISOString(), kind: 'reply' };
  if (q.status === 'scheduled' && q.scheduledAt) return { at: q.scheduledAt, kind: 'visit' };
  return null;
}

export type DueState = 'overdue' | 'today' | 'tomorrow' | 'later';
export function dueState(at: string, now: number): DueState {
  const t = new Date(at).getTime();
  if (t < now) return 'overdue';
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const days = Math.floor((t - start.getTime()) / DAY);
  return days <= 0 ? 'today' : days === 1 ? 'tomorrow' : 'later';
}

export const isOverdue = (q: Inquiry, now: number) => {
  const d = dueOf(q);
  return !!d && new Date(d.at).getTime() < now;
};

/* ------------------------------------------------------------------ */
/* Spam / duplicate protection                                         */
/* ------------------------------------------------------------------ */
/** Last 8 digits — "+383 49 732 700" and "049 732 700" are the same phone. */
export const phoneKey = (p: string | undefined) => (p ?? '').replace(/\D/g, '').slice(-8);
export const DUP_WINDOW_DAYS = 7;

/** id → id of the earlier inquiry it probably duplicates (same phone or e-mail within 7 days). */
export function duplicateIndex(list: Inquiry[]): Map<string, string> {
  const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const out = new Map<string, string>();
  for (let i = 0; i < sorted.length; i++) {
    const q = sorted[i];
    const pk = phoneKey(q.phone);
    const em = q.email?.trim().toLowerCase();
    const t = new Date(q.createdAt).getTime();
    for (let j = 0; j < i; j++) {
      const p = sorted[j];
      if (t - new Date(p.createdAt).getTime() > DUP_WINDOW_DAYS * DAY) continue;
      if ((pk.length >= 6 && phoneKey(p.phone) === pk) || (em && p.email?.trim().toLowerCase() === em)) {
        out.set(q.id, out.get(p.id) ?? p.id);
        break;
      }
    }
  }
  return out;
}

/** Open inquiries with the same phone / e-mail — used to warn before a manual entry is created. */
export function findExisting(list: Inquiry[], phone: string, email: string) {
  const pk = phoneKey(phone);
  const em = email.trim().toLowerCase();
  return list.filter((q) => q.status !== 'done' && ((pk.length >= 6 && phoneKey(q.phone) === pk) || (em && q.email?.trim().toLowerCase() === em)));
}

/* ------------------------------------------------------------------ */
/* Customer profiles (derived from orders, see crm/customers.ts)       */
/* ------------------------------------------------------------------ */
export interface CustomerIndex {
  rows: CustomerRow[];
  byKey: Map<string, CustomerRow>;
  byEmail: Map<string, CustomerRow>;
  byPhone: Map<string, CustomerRow>;
}

export function customerIndex(orders: Order[]): CustomerIndex {
  const rows = aggregateCustomers(orders).sort((a, b) => b.last.localeCompare(a.last));
  const byKey = new Map<string, CustomerRow>();
  const byEmail = new Map<string, CustomerRow>();
  const byPhone = new Map<string, CustomerRow>();
  for (const r of rows) {
    byKey.set(r.key, r);
    if (r.email) byEmail.set(r.email.toLowerCase(), r);
    for (const o of r.orders) {
      const pk = phoneKey(o.customer.phone);
      if (pk.length >= 6 && !byPhone.has(pk)) byPhone.set(pk, r);
    }
  }
  return { rows, byKey, byEmail, byPhone };
}

/** Linked profile: an explicit link wins, otherwise match by e-mail or phone. `auto` tells which. */
export function customerFor(q: InquiryX, idx: CustomerIndex): { row: CustomerRow; auto: boolean } | null {
  if (q.customerKey === null) return null;
  if (q.customerKey) {
    const row = idx.byKey.get(q.customerKey);
    return row ? { row, auto: false } : null;
  }
  const row = (q.email && idx.byEmail.get(q.email.trim().toLowerCase())) || idx.byPhone.get(phoneKey(q.phone));
  return row ? { row, auto: true } : null;
}

/* ------------------------------------------------------------------ */
/* Staff                                                               */
/* ------------------------------------------------------------------ */
/** Staff who may own a contact: active and allowed to edit contacts. */
export const assignableStaff = (staff: Staff[]) => staff.filter((m) => m.active && can(m.role, 'contacts', 'edit'));
export const quoteOwners = (staff: Staff[]) => staff.filter((m) => m.active && can(m.role, 'quotes', 'edit'));

/* ------------------------------------------------------------------ */
/* Bookings linked to an inquiry                                       */
/* ------------------------------------------------------------------ */
export function bookingsFor(id: string, bookings: Booking[]) {
  return bookings.filter((b) => b.inquiryId === id).sort((a, b) => b.start.localeCompare(a.start));
}

/** Default service for a meeting booked from the inbox: a consultation-type service first, else the first one. */
export function defaultServiceFor(services: Service[]): Service | undefined {
  const score = (s: Service) => {
    const k = fold(`${s.id} ${s.name?.sq ?? ''} ${s.name?.en ?? ''}`);
    return /konsult|consult/.test(k) ? 3 : /takim|meeting|vizit|visit/.test(k) ? 2 : 0;
  };
  return [...services].sort((a, b) => score(b) - score(a))[0];
}

/** Default slot for "Krijo termin": the customer's preferred day if still ahead, else the next working day — 10:00. */
export function defaultSlot(q: Inquiry, now = Date.now()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const m = q.preferredDate ? /^(\d{4})-(\d{2})-(\d{2})/.exec(q.preferredDate) : null;
  let d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  if (!d || d <= today) {
    d = new Date(today);
    d.setDate(d.getDate() + 1);
  }
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

/* ------------------------------------------------------------------ */
/* B2B quotes                                                          */
/* ------------------------------------------------------------------ */
export type QuoteState = Quote['status'] | 'expired';
export const QUOTE_STATES: QuoteState[] = ['draft', 'sent', 'accepted', 'declined', 'converted', 'expired'];

/** Payment terms offered on a quote. */
export type PaymentTerm = 'advance100' | 'advance50' | 'net15' | 'net30';
export const PAYMENT_TERMS: PaymentTerm[] = ['advance50', 'advance100', 'net15', 'net30'];
/** Delivery terms: delivered to the customer · collected at the factory (Prishtinë). */
export type DeliveryTerm = 'delivered' | 'pickup';
export const DELIVERY_TERMS: DeliveryTerm[] = ['delivered', 'pickup'];

/**
 * Commercial terms the quote editor keeps next to the shared `Quote` fields (additive, persisted with it):
 * payment, production lead time after proof approval, the ± quantity tolerance customary in print and delivery.
 * `terms` (L10n) stays the free-text "additional notes".
 */
export interface QuoteExtra {
  payment?: PaymentTerm;
  /** Working days of production after the proof is approved */
  leadDays?: number;
  /** ± over/under-run tolerance on the ordered quantity, % */
  tolerance?: number;
  delivery?: DeliveryTerm;
}
/** + the customer's business number (NUI) for the letterhead. */
export type QuoteX = Quote & QuoteExtra & { nui?: string };
export const QUOTE_DEFAULTS: Required<QuoteExtra> = { payment: 'advance50', leadDays: 10, tolerance: 5, delivery: 'delivered' };

/** Quote with every commercial term filled in (defaults for quotes created before the terms existed). */
export function withTerms<Q extends QuoteX>(q: Q): Q & Required<QuoteExtra> {
  return {
    ...q,
    payment: q.payment ?? QUOTE_DEFAULTS.payment,
    leadDays: q.leadDays ?? QUOTE_DEFAULTS.leadDays,
    tolerance: q.tolerance ?? QUOTE_DEFAULTS.tolerance,
    delivery: q.delivery ?? QUOTE_DEFAULTS.delivery,
  };
}

/** Per-piece prices in print need more than cents (€0,0450 / copë). */
export const round4 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

const NUM_LOCALE: Record<Lang, string> = { sq: 'de-DE', en: 'en-IE' };
/** Unit price with 2–4 decimals: 0,045 → "0,0450 €", 1,2 → "1,20 €". */
export function unitMoney(v: number, lang: Lang) {
  const x = round4(v);
  const decimals = Math.abs(x * 100 - Math.round(x * 100)) > 1e-9 ? 4 : 2;
  return new Intl.NumberFormat(NUM_LOCALE[lang], { style: 'currency', currency: 'EUR', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(x);
}

/** Line amount: quantity × unit price, rounded to cents. */
export const lineAmount = (l: Pick<Quote['lines'][number], 'qty' | 'price'>) => round2((Number(l.qty) || 0) * (Number(l.price) || 0));

export interface QuoteTotals {
  /** Sum of the lines excl. VAT */
  net: number;
  vat: number;
  /** Amount payable incl. VAT */
  total: number;
  /** true = line prices are net and VAT is added on top (B2B, `settings.pricesIncludeVat === false`) */
  netPricing: boolean;
}

/**
 * Quote totals. With `pricesIncludeVat === false` (PrintWorks) the line prices are NET:
 * subtotal (net) → VAT on top → total. Otherwise line prices include VAT and it is extracted.
 */
export function quoteTotals(lines: Quote['lines'], opts: { vatRate?: number; pricesIncludeVat?: boolean } = {}): QuoteTotals {
  const rate = (opts.vatRate ?? 18) / 100;
  const sum = round2(lines.reduce((s, l) => s + lineAmount(l), 0));
  if (opts.pricesIncludeVat === false) {
    const vat = round2(sum * rate);
    return { net: sum, vat, total: round2(sum + vat), netPricing: true };
  }
  const vat = round2(sum - sum / (1 + rate));
  return { net: round2(sum - vat), vat, total: sum, netPricing: false };
}

/** Validity ends at the end of `validUntil`'s day. */
export function isExpired(q: Pick<Quote, 'validUntil'>, now: number) {
  const d = new Date(q.validUntil);
  d.setHours(23, 59, 59, 999);
  return d.getTime() < now;
}

export function quoteState(q: Quote, now: number): QuoteState {
  return q.status === 'sent' && isExpired(q, now) ? 'expired' : q.status;
}

/** Next number in the series of the newest quote ("OF-2026-031" → "OF-2026-032"); "OF-<year>-001" for the first one. */
export function nextQuoteNumber(quotes: Quote[], now = new Date()) {
  const year = now.getFullYear();
  const max = quotes.reduce((m, q) => {
    const mm = /(\d+)$/.exec(q.number);
    return Math.max(m, mm ? Number(mm[1]) : 0);
  }, 0);
  const latest = [...quotes].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];
  const pattern = latest ? /^(.*?)(\d+)$/.exec(latest.number) : null;
  const prefix = pattern ? pattern[1].replace(/\b(20\d{2})\b/, String(year)) : `OF-${year}-`;
  const width = pattern ? Math.max(3, pattern[2].length) : 3;
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
}

/** Days until a quote's validity ends (negative = expired). */
export function daysLeft(validUntil: string, now: number) {
  const d = new Date(validUntil);
  d.setHours(23, 59, 59, 999);
  return Math.floor((d.getTime() - now) / DAY);
}

/** ISO date (YYYY-MM-DD, local) `days` from today — for validity / follow-up quick picks. */
export function isoDayFromNow(days: number, now = Date.now()) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Accepted quote → draft order (p.43: conversion is a separate action). Every line keeps the agreed
 * quote price as a custom line, so the draft total equals the quote total (no automatic discounts).
 * Unit prices keep 4 decimals (€0,0450 / copë × 5.000) — the order rounds the line amount, not the unit price.
 */
export function draftFromQuote(
  q: Quote,
  ctx: { drafts: DraftOrder[]; by: string; lang: Lang; note: string; city?: string; skuOf: (productId: string) => string | undefined },
): DraftOrder {
  const max = ctx.drafts.reduce((m, d) => Math.max(m, Number(d.number.replace(/\D/g, '')) || 0), 1000);
  const [firstName, ...rest] = q.customer.name.trim().split(/\s+/);
  return {
    id: `dr-${q.id}-${Date.now().toString(36).slice(-4)}`,
    number: `D-${max + 1}`,
    createdAt: new Date().toISOString(),
    customer: {
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      email: q.customer.email,
      phone: q.customer.phone,
      ...(q.customer.company ? { company: q.customer.company } : {}),
      ...(ctx.city ? { city: ctx.city } : {}),
    },
    items: [],
    customLines: q.lines
      .filter((l) => l.title.trim() && l.qty > 0)
      .map((l) => {
        const sku = l.productId ? ctx.skuOf(l.productId) : undefined;
        return { title: sku ? `${l.title} · ${sku}` : l.title, price: round4(l.price), qty: l.qty };
      }),
    discountCodes: [],
    delivery: 'delivery',
    payment: 'bank',
    note: ctx.note,
    tags: ['b2b', q.number],
    status: 'open',
    createdBy: ctx.by,
    lang: ctx.lang,
  };
}

/* ------------------------------------------------------------------ */
/* CSV export (permission: contacts · export)                          */
/* ------------------------------------------------------------------ */
export function inquiriesCsv(rows: { q: InquiryX; kind: string; source: string; status: string; assignee: string }[]) {
  const esc = (v: string | number | undefined) => {
    const s = String(v ?? '');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ['id', 'created', 'name', 'company', 'phone', 'email', 'city', 'type', 'source', 'status', 'assignee', 'follow_up', 'tags', 'rfq_product', 'rfq_size', 'rfq_material', 'rfq_quantity', 'rfq_colours', 'rfq_finishes', 'rfq_deadline', 'message'];
  const lines = rows.map(({ q, kind, source, status, assignee }) => {
    const s = q.specs;
    return [
      q.id, q.createdAt.slice(0, 16).replace('T', ' '), q.name, q.company, q.phone, q.email, q.city, kind, source, status, assignee, q.followUpAt?.slice(0, 16).replace('T', ' '), (q.tags ?? []).join(' '),
      s?.product, s?.size, s?.material, s?.quantity, s?.colours, (s?.finishes ?? []).join(' + '), s?.deadline?.slice(0, 10), (q.message ?? '').replace(/\s+/g, ' '),
    ]
      .map(esc)
      .join(',');
  });
  return [head.join(','), ...lines].join('\n');
}
