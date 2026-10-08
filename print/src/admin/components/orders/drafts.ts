// Draft orders (PDF p.17 "Drafti ka klient, artikuj katalogu ose artikull custom, zbritje, dërgesë, taksa, tags dhe shënime").
// PrintWorks: B2B print jobs — quantity price tiers, MOQ + quantity step, a flat design & prepress fee per line,
// custom lines entered net, a pro-forma instead of an invoice. Totals use the SAME path as convertDraft → buildOrder
// (priceCart + custom lines, VAT added on top for net prices), so the editor shows exactly what the order will be.
import { createElement } from 'react';
import { defineDict, lt, useDict } from '@/i18n';
import { basePrice, minQty, priceCart, tierPrice, type Totals } from '@/lib/pricing';
import { customerKeyOf } from '@/lib/crm';
import { round2 } from '@/lib/utils';
import type { CartItem, Collection, Customer, Discount, DraftOrder, Lang, Order, PriceTier, Product, ReturnRequest, Settings } from '@/lib/types';
import { StatusPill, type Glyph, type PillTone } from './status';

/* ------------------------------------------------------------------ */
/* Local extension fields                                              */
/* ------------------------------------------------------------------ */
/**
 * DraftOrder has no PO-number or reprint link yet, so the drafts screens keep them next to the draft (persisted like
 * any other field, same pattern as `archivedAt` on orders). On conversion the PO number is copied onto `order.poNumber`.
 */
export type DraftExt = DraftOrder & {
  /** Customer purchase-order / reference number (B2B) */
  poNumber?: string;
  /** Complaint (return request) id this draft reprints */
  reprintOf?: string;
};
export const poNumberOf = (d: DraftOrder) => (d as DraftExt).poNumber ?? '';
export const reprintOf = (d: DraftOrder) => (d as DraftExt).reprintOf;

/* ------------------------------------------------------------------ */
/* Totals                                                              */
/* ------------------------------------------------------------------ */
export interface DraftTotals extends Totals {
  /** Custom lines, net (entered excl. VAT when catalogue prices are net) */
  customTotal: number;
  /** Custom lines incl. VAT */
  customGross: number;
  /** Catalogue + custom lines before discounts (net) */
  grandSubtotal: number;
  /** Order total excl. VAT */
  grandNet: number;
  /** VAT of the whole order */
  grandVat: number;
  /** Order total incl. VAT — what the converted order will show */
  grandTotal: number;
}

export function draftTotals(d: DraftOrder, ctx: { products: Product[]; settings: Settings; discounts: Discount[]; collections: Collection[] }): DraftTotals {
  const totals = priceCart(d.items, ctx.products, ctx.settings, {
    lang: d.lang ?? 'sq',
    codes: d.discountCodes,
    discounts: ctx.discounts,
    collections: ctx.collections,
    delivery: d.delivery,
    city: d.customer.city,
  });
  // mirrors buildOrder() in store/db.ts: custom lines are entered in catalogue terms (net when prices are net)
  const rate = ctx.settings.vatRate / 100;
  const customTotal = round2(validCustomLines(d).reduce((s, c) => s + c.price * c.qty, 0));
  const customGross = totals.netPricing ? round2(customTotal * (1 + rate)) : customTotal;
  const grandTotal = round2(totals.total + customGross);
  const grandVat = totals.netPricing ? round2(totals.vat + customGross - customTotal) : round2(grandTotal - grandTotal / (1 + rate));
  return {
    ...totals,
    customTotal,
    customGross,
    grandSubtotal: round2(totals.subtotal + customTotal),
    grandNet: round2(grandTotal - grandVat),
    grandVat,
    grandTotal,
  };
}

export const validCustomLines = (d: Pick<DraftOrder, 'customLines'>) => d.customLines.filter((c) => c.title.trim() && c.qty > 0);

/* ------------------------------------------------------------------ */
/* Print quantities & tiers                                            */
/* ------------------------------------------------------------------ */
/** Quantity step of a product (1 when not set). */
export const qtyStepOf = (p: Product) => Math.max(1, Math.round(p.qtyStep ?? 1));

/** Valid quantity: at least the MOQ, then MOQ + k × step (rounded UP). */
export function clampQty(p: Product, qty: number) {
  const min = minQty(p);
  const step = qtyStepOf(p);
  if (!Number.isFinite(qty) || qty <= min) return min;
  return min + Math.ceil((Math.round(qty) - min) / step - 1e-9) * step;
}

export const sortedTiers = (p: Product): PriceTier[] => [...(p.tiers ?? [])].sort((a, b) => a.qty - b.qty);

/** Index of the tier that applies to `qty` (-1 when the product has no tiers). */
export function tierIndex(p: Product, qty: number) {
  const list = sortedTiers(p);
  let idx = list.length ? 0 : -1;
  list.forEach((t, i) => {
    if (t.qty <= qty) idx = i;
  });
  return idx;
}

/** The next quantity break above `qty`, if any. */
export function nextTier(p: Product, qty: number): PriceTier | null {
  return sortedTiers(p).find((t) => t.qty > qty) ?? null;
}

/** Unit prices can have a third decimal (€0,085 / copë) — line totals keep using money(). */
export function unitMoney(v: number, lang: Lang) {
  return new Intl.NumberFormat(lang === 'en' ? 'en-IE' : 'de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(v);
}

/** Lowest unit price the product can reach (largest tier), excl. options — the "nga €x / copë" hint. */
export function fromPrice(p: Product) {
  const list = sortedTiers(p);
  return list.length ? tierPrice(p, list[list.length - 1].qty) : basePrice(p);
}

/* ------------------------------------------------------------------ */
/* Lines                                                               */
/* ------------------------------------------------------------------ */
/** Stable cart-line key (same format as the seed): product | sorted options | design flag. */
export function lineKey(productId: string, options: Record<string, string>, installation: boolean) {
  const opts = Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join('&');
  return `${productId}|${opts}|${installation ? 'i' : ''}`;
}

/** Merge lines that ended up with the same key (same product, options and design service). */
export function normalizeItems(items: CartItem[]): CartItem[] {
  const out: CartItem[] = [];
  for (const it of items) {
    const key = lineKey(it.productId, it.options, it.installation);
    const same = out.find((x) => x.key === key);
    if (same) same.qty += it.qty;
    else out.push({ ...it, key });
  }
  return out;
}

export function nextDraftNumber(drafts: DraftOrder[]) {
  const max = drafts.reduce((m, d) => Math.max(m, Number(d.number.replace(/\D/g, '')) || 0), 1000);
  return `D-${max + 1}`;
}

/** New B2B draft: delivery to the address, paid by bank transfer against the pro-forma. */
export function blankDraft(lang: Lang, createdBy?: string): DraftExt {
  return {
    id: '',
    number: '',
    createdAt: new Date().toISOString(),
    customer: { firstName: '', lastName: '', email: '', phone: '', city: '', address: '' },
    items: [],
    customLines: [],
    discountCodes: [],
    delivery: 'delivery',
    payment: 'bank',
    note: '',
    tags: [],
    status: 'open',
    ...(createdBy ? { createdBy } : {}),
    lang,
  };
}

export const draftCustomerName = (d: Pick<DraftOrder, 'customer'>) => `${d.customer.firstName ?? ''} ${d.customer.lastName ?? ''}`.trim();

/** Company first (B2B), else the contact person. */
export const draftDisplayName = (d: Pick<DraftOrder, 'customer'>) => d.customer.company?.trim() || draftCustomerName(d);

/** Known customers (from orders, newest data wins) for the draft customer picker. */
export interface KnownCustomer {
  key: string;
  customer: Customer;
  lang: Lang;
  orders: number;
}
export function knownCustomers(orders: Order[]): KnownCustomer[] {
  const map = new Map<string, KnownCustomer>();
  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const o of sorted) {
    if (!o.customer) continue;
    const key = customerKeyOf(o);
    const hit = map.get(key);
    if (hit) hit.orders++;
    else map.set(key, { key, customer: o.customer, lang: o.lang ?? 'sq', orders: 1 });
  }
  return [...map.values()];
}

/** What is missing before a draft can be converted / its pro-forma sent. */
export function draftProblems(d: DraftOrder, opts: { needEmail?: boolean } = {}) {
  const p: ('lines' | 'name' | 'contact' | 'email' | 'city' | 'address')[] = [];
  if (!d.items.length && !validCustomLines(d).length) p.push('lines');
  if (!d.customer.firstName?.trim() && !d.customer.company?.trim()) p.push('name');
  if (!d.customer.phone?.trim() && !d.customer.email?.trim()) p.push('contact');
  if (opts.needEmail && !d.customer.email?.trim()) p.push('email');
  if (d.delivery === 'delivery') {
    if (!d.customer.city?.trim()) p.push('city');
    if (!d.customer.address?.trim()) p.push('address');
  }
  return p;
}

/* ------------------------------------------------------------------ */
/* Reprint from a complaint                                            */
/* ------------------------------------------------------------------ */
/**
 * Prefilled draft for reprinting the complained lines of an order at no charge. The reprint lines are custom lines
 * at €0 (the catalogue price engine cannot zero a catalogue line), named after the original job so prepress and
 * production see what to print again; the customer, delivery and language come from the original order.
 */
export function reprintDraft(ret: ReturnRequest, order: Order, products: Product[], ctx: { lang: Lang; createdBy?: string; note: string; titleOf: (name: string, options: string, number: string) => string }): DraftExt {
  const base = blankDraft(order.lang ?? ctx.lang, ctx.createdBy);
  const customLines: DraftOrder['customLines'] = [];
  for (const want of ret.lines) {
    const line = order.items.find((l) => l.productId === want.productId);
    const p = products.find((x) => x.id === want.productId);
    const name = p ? lt(p.name, order.lang ?? ctx.lang) : (line?.name ?? want.productId);
    customLines.push({ title: ctx.titleOf(name, line?.options ?? '', ret.number), price: 0, qty: want.qty });
  }
  const c = order.customer;
  return {
    ...base,
    customer: {
      firstName: c.firstName ?? '',
      lastName: c.lastName ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      city: c.city ?? '',
      address: c.address ?? '',
      ...(c.company ? { company: c.company } : {}),
      ...(c.pib ? { pib: c.pib } : {}),
    },
    customLines,
    delivery: order.delivery?.method ?? 'delivery',
    note: ctx.note,
    tags: ['ribotim'],
    reprintOf: ret.id,
    ...(order.poNumber ? { poNumber: order.poNumber } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Status pill (pro-forma wording)                                     */
/* ------------------------------------------------------------------ */
export const draftDict = defineDict({
  sq: {
    draft_open: 'I hapur',
    draft_invoice_sent: 'Pro-forma u dërgua',
    draft_converted: 'U konvertua',
  },
  en: {
    draft_open: 'Open',
    draft_invoice_sent: 'Pro-forma sent',
    draft_converted: 'Converted',
  },
});

const DRAFT_PILL: Record<DraftOrder['status'], [PillTone, Glyph]> = {
  open: ['attention', 'ring'],
  invoice_sent: ['outline', 'half'],
  converted: ['neutral', 'check'],
};

/** Neutral draft status with a symbol (text + glyph, never colour alone). */
export function DraftPill({ status, className }: { status: DraftOrder['status']; className?: string }) {
  const t = useDict(draftDict, 'admin');
  const [tone, glyph] = DRAFT_PILL[status] ?? DRAFT_PILL.open;
  return createElement(StatusPill, { tone, glyph, className, children: t(`draft_${status}`) });
}
