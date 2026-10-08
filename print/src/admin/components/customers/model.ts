// Customer model for the CMS (PDF p.19): one record per person, built from web orders + the profile layer
// (store.ts), with linked enquiries / bookings / B2B quotes, duplicate detection, segment subjects and CSV.
import type { Booking, Inquiry, Lang, Order, Quote, Segment } from '@/lib/types';
import { matchesSegment, type SegmentSubject } from '@/lib/crm';
import { fold } from '@/lib/search';
import { round2, slugify } from '@/lib/utils';
import { customerKey } from '@/admin/components/crm/customers';
import { CHANNELS, pairKey, type Channel, type Consent, type CustomerData, type CustomerNote, type CustomerSource, type ManualCustomer, type Marketing } from './store';

export interface CustomerAddress {
  address: string;
  city: string;
  /** Orders delivered to this address */
  orders: number;
  last: string;
}

export interface CustomerRecord {
  key: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Every e-mail / phone known for this person (merged records included) */
  emails: string[];
  phones: string[];
  city: string;
  address: string;
  addresses: CustomerAddress[];
  company?: string;
  pib?: string;
  lang: Lang;
  /** Newest first, cancelled included */
  orders: Order[];
  count: number;
  /** Orders that count (not cancelled) */
  valid: number;
  cancelled: number;
  /** Lifetime spend EUR incl. VAT, cancelled excluded */
  spent: number;
  /** Lifetime spend excl. VAT (B2B view) */
  spentNet: number;
  first?: string;
  last?: string;
  /** Customer since (first order or when the record was created) */
  since: string;
  source: CustomerSource;
  /** Staff tags (+ automatic ones) */
  tags: string[];
  autoTags: string[];
  notes: CustomerNote[];
  marketing: Marketing;
  /** Keys of records merged into this one */
  mergedKeys: string[];
  /** Has a staff-created record (deletable when there are no orders) */
  manual: boolean;
  inquiries: Inquiry[];
  bookings: Booking[];
  quotes: Quote[];
}

const NONE: Consent = { status: 'none' };

/** B2B-first: the company is the customer's primary name when there is one. */
export const primaryName = (c: Pick<CustomerRecord, 'company' | 'name'>) => c.company?.trim() || c.name || '—';
/** Second line under the primary name: the contact person for companies, else e-mail / phone. */
export const secondaryName = (c: Pick<CustomerRecord, 'company' | 'name' | 'email' | 'phone'>) => (c.company?.trim() ? c.name : c.email || c.phone);
export const emptyMarketing = (): Marketing => ({ email: NONE, sms: NONE, whatsapp: NONE, viber: NONE });

/** Last 8 digits — "+383 49 732 700" and "049 732 700" are the same phone. */
export const phone8 = (p?: string) => {
  const d = (p ?? '').replace(/\D/g, '');
  return d.length >= 6 ? d.slice(-8) : '';
};
const low = (s?: string) => (s ?? '').trim().toLowerCase();

/** Follow the merge chain to the primary key. */
export function resolveKey(key: string, merges: Record<string, string>) {
  let k = key;
  for (let i = 0; i < 10 && merges[k]; i++) k = merges[k];
  return k;
}

export function manualKey(email: string, phone: string, name: string) {
  return low(email) || (phone8(phone) ? `tel-${phone8(phone)}` : `m-${slugify(name) || Date.now().toString(36)}`);
}

interface Group {
  orders: Order[];
  manual: ManualCustomer[];
  keys: Set<string>;
}

export function buildCustomers(input: { orders: Order[]; inquiries: Inquiry[]; bookings: Booking[]; quotes: Quote[]; data: CustomerData }): CustomerRecord[] {
  const { orders, inquiries, bookings, quotes, data } = input;
  const groups = new Map<string, Group>();
  const groupOf = (raw: string) => {
    const k = resolveKey(raw, data.merges);
    let g = groups.get(k);
    if (!g) groups.set(k, (g = { orders: [], manual: [], keys: new Set() }));
    g.keys.add(raw);
    return g;
  };
  for (const o of orders) groupOf(customerKey(o)).orders.push(o);
  for (const m of data.manual) groupOf(m.key).manual.push(m);

  // contact lookups for linking enquiries / bookings / quotes
  const byEmail = <T>(items: T[], get: (x: T) => string | undefined) => {
    const m = new Map<string, T[]>();
    for (const x of items) {
      const e = low(get(x));
      if (e) m.set(e, [...(m.get(e) ?? []), x]);
    }
    return m;
  };
  const byPhone = <T>(items: T[], get: (x: T) => string | undefined) => {
    const m = new Map<string, T[]>();
    for (const x of items) {
      const p = phone8(get(x));
      if (p) m.set(p, [...(m.get(p) ?? []), x]);
    }
    return m;
  };
  const inqE = byEmail(inquiries, (i) => i.email);
  const inqP = byPhone(inquiries, (i) => i.phone);
  const bkE = byEmail(bookings, (b) => b.email);
  const bkP = byPhone(bookings, (b) => b.phone);
  const qE = byEmail(quotes, (q) => q.customer.email);
  const qP = byPhone(quotes, (q) => q.customer.phone);
  const linked = <T extends { id: string }>(emails: string[], phones: string[], e: Map<string, T[]>, p: Map<string, T[]>) => {
    const out = new Map<string, T>();
    for (const x of emails) for (const it of e.get(low(x)) ?? []) out.set(it.id, it);
    for (const x of phones) for (const it of p.get(phone8(x)) ?? []) out.set(it.id, it);
    return [...out.values()];
  };

  const rows: CustomerRecord[] = [];
  for (const [key, g] of groups) {
    const sorted = [...g.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const valid = sorted.filter((o) => o.status !== 'cancelled');
    const latest = sorted[0]?.customer;
    // the primary's own manual record first, then the others (oldest first)
    const manual = [...g.manual].sort((a, b) => (a.key === key ? -1 : b.key === key ? 1 : a.createdAt.localeCompare(b.createdAt)));
    const m0 = manual[0];
    const base = latest ?? m0;
    if (!base) continue;

    const emails = [...new Set([...sorted.map((o) => o.customer.email), ...manual.map((m) => m.email)].map(low).filter(Boolean))];
    const phones: string[] = [];
    for (const p of [...sorted.map((o) => o.customer.phone), ...manual.map((m) => m.phone)]) {
      if (p && !phones.some((x) => phone8(x) === phone8(p))) phones.push(p);
    }

    const addr = new Map<string, CustomerAddress>();
    for (const o of sorted) {
      const k = fold(`${o.customer.address}|${o.customer.city}`);
      const a = addr.get(k);
      if (a) a.orders++;
      else if (o.customer.address || o.customer.city) addr.set(k, { address: o.customer.address, city: o.customer.city, orders: 1, last: o.createdAt });
    }
    for (const m of manual) {
      const k = fold(`${m.address}|${m.city}`);
      if (!addr.has(k) && (m.address || m.city)) addr.set(k, { address: m.address, city: m.city, orders: 0, last: m.createdAt });
    }

    const profile = data.profiles[key];
    const company = sorted.find((o) => o.customer.company)?.customer.company ?? manual.find((m) => m.company)?.company;
    const autoTags = company ? ['b2b'] : [];
    const orderTags = sorted.flatMap((o) => o.tags ?? []);
    const tags = [...new Set([...(profile?.tags ?? []), ...orderTags, ...autoTags])].filter((x): x is string => typeof x === 'string' && x.trim() !== '');
    const createdAt = [sorted[sorted.length - 1]?.createdAt, ...manual.map((m) => m.createdAt)].filter(Boolean).sort()[0] as string;

    rows.push({
      key,
      name: `${base.firstName} ${base.lastName}`.trim(),
      firstName: base.firstName,
      lastName: base.lastName,
      email: low(base.email) || emails[0] || '',
      phone: base.phone || phones[0] || '',
      emails,
      phones,
      city: base.city,
      address: base.address,
      addresses: [...addr.values()],
      company,
      pib: sorted.find((o) => o.customer.pib)?.customer.pib ?? manual.find((m) => m.pib)?.pib,
      lang: sorted[0]?.lang ?? m0?.lang ?? 'sq',
      orders: sorted,
      count: sorted.length,
      valid: valid.length,
      cancelled: sorted.length - valid.length,
      spent: round2(valid.reduce((s, o) => s + o.total, 0)),
      spentNet: round2(valid.reduce((s, o) => s + o.total - (o.vat ?? 0), 0)),
      first: sorted[sorted.length - 1]?.createdAt,
      last: sorted[0]?.createdAt,
      since: createdAt,
      source: sorted.length ? 'web' : (m0?.source ?? 'manual'),
      tags,
      autoTags,
      notes: profile?.notes ?? [],
      marketing: { ...emptyMarketing(), ...(profile?.marketing ?? {}) },
      mergedKeys: [...g.keys].filter((k) => k !== key),
      manual: manual.length > 0,
      inquiries: linked(emails, phones, inqE, inqP).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      bookings: linked(emails, phones, bkE, bkP).sort((a, b) => b.start.localeCompare(a.start)),
      quotes: linked(emails, phones, qE, qP).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Segments                                                            */
/* ------------------------------------------------------------------ */
/** Subject for lib/crm `matchesSegment` — includes staff tags and customers without orders. */
export function subjectOf(c: CustomerRecord, now: number): SegmentSubject {
  return {
    key: c.key,
    name: c.name,
    email: c.email,
    phone: c.phone,
    orders: c.valid,
    spent: c.spent,
    city: c.city,
    lastOrderDays: c.last ? Math.floor((now - new Date(c.last).getTime()) / 86400000) : Number.POSITIVE_INFINITY,
    lang: c.lang,
    tags: c.tags,
  };
}

export function membersOf(seg: Pick<Segment, 'match' | 'rules'>, customers: CustomerRecord[], now: number) {
  return customers.filter((c) => matchesSegment(subjectOf(c, now), seg));
}

export const isSubscribed = (c: Pick<CustomerRecord, 'marketing'>, ch?: Channel) =>
  ch ? c.marketing[ch].status === 'subscribed' : CHANNELS.some((x) => c.marketing[x].status === 'subscribed');

/* ------------------------------------------------------------------ */
/* Duplicates (same phone, same name in the same city, same company)   */
/* ------------------------------------------------------------------ */
export interface DuplicatePair {
  id: string;
  a: CustomerRecord;
  b: CustomerRecord;
  reason: 'phone' | 'name';
}

/** `a` is the suggested primary: more orders, then higher spend, then the older record. */
export function findDuplicates(customers: CustomerRecord[], dismissed: string[]): DuplicatePair[] {
  const out: DuplicatePair[] = [];
  const skip = new Set(dismissed);
  for (let i = 0; i < customers.length; i++) {
    for (let j = i + 1; j < customers.length; j++) {
      const x = customers[i];
      const y = customers[j];
      if (skip.has(pairKey(x.key, y.key))) continue;
      const p = x.phones.map(phone8).filter(Boolean);
      const samePhone = y.phones.some((ph) => p.includes(phone8(ph)));
      const sameName = (!!x.name && fold(x.name) === fold(y.name) && !!x.city && fold(x.city) === fold(y.city)) || (!!x.company && !!y.company && fold(x.company) === fold(y.company));
      if (!samePhone && !sameName) continue;
      const [a, b] = rank(x, y);
      out.push({ id: pairKey(x.key, y.key), a, b, reason: samePhone ? 'phone' : 'name' });
    }
  }
  return out;
}

export function rank(x: CustomerRecord, y: CustomerRecord): [CustomerRecord, CustomerRecord] {
  const score = (c: CustomerRecord) => [c.valid, c.spent, -new Date(c.since).getTime()];
  const sx = score(x);
  const sy = score(y);
  for (let i = 0; i < sx.length; i++) {
    if (sx[i] !== sy[i]) return sx[i] > sy[i] ? [x, y] : [y, x];
  }
  return [x, y];
}

/* ------------------------------------------------------------------ */
/* Demo profile layer — deterministic, generated once per db seed      */
/* ------------------------------------------------------------------ */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const addDays = (iso: string, d: number) => new Date(new Date(iso).getTime() + d * 86400000).toISOString();
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Industry tags derived from what a customer buys (product ids of the PrintWorks catalogue). */
const INDUSTRY_TAGS: [RegExp, string][] = [
  [/pice|takeaway|sushi|hot-dog|sanduic|makarona|donut|patat|tabaka|menu|gable|katrore/, 'HoReCa'],
  [/torte|embelsir|cokollat|caji/, 'ushqim'],
  [/kozmet/, 'kozmetikë'],
  [/farmaceut/, 'farmaci'],
  [/vere|vaj|shrink/, 'pije'],
  [/detergjent|letra-lagura/, 'higjienë'],
  [/katalog|fletepalosje|kartevizita|dosje|blloqe/, 'marketing'],
  [/qese/, 'retail'],
];
const EXTRA_TAGS = ['eksport', 'rekomandim', 'panair-2026', 'agjenci'];

/** Staff notes on the best customers (private — staff only). */
const NOTES: string[] = [
  'Kërkon provë fizike (mostër) para çdo tirazhi të ri. Fatura gjithmonë me NUI dhe numër porosie (PO).',
  'Porosi sezonale para festave — rezervoni kapacitet në Manroland për nëntor. Pantone i markës: 2685 C.',
  'Skedarët vijnë nga agjencia e tyre; kontrolloni bleed-in 3 mm dhe shkronjat e konvertuara para provës.',
  'Klient besnik që nga 2023. Na rekomandoi te dy prodhues kozmetike — ofroni 5% në porosinë e ardhshme.',
];

export function seedCustomerData(orders: Order[], bookings: Booking[], inquiries: Inquiry[], seededAt: string): CustomerData {
  const profiles: CustomerData['profiles'] = {};
  const manual: ManualCustomer[] = [];
  const base = buildCustomers({ orders, inquiries: [], bookings: [], quotes: [], data: { profiles: {}, manual: [], merges: {}, dismissed: [] } });
  const bySpend = [...base].sort((a, b) => b.spent - a.spent);
  const byOrders = [...base].sort((a, b) => b.valid - a.valid || b.spent - a.spent);

  for (const c of base) {
    const h = hash(c.key);
    const at = c.first ?? seededAt;
    const consent = (on: boolean, off = false): Consent => (on ? { status: 'subscribed', at, source: 'checkout' } : off ? { status: 'unsubscribed', at: addDays(at, 12 + (h % 20)), source: 'form' } : NONE);
    const bought = c.orders.flatMap((o) => (o.items ?? []).map((l) => l.productId ?? '')).join(' ');
    const tags = INDUSTRY_TAGS.filter(([re]) => re.test(bought)).map(([, tag]) => tag).slice(0, 2);
    if (h % 9 === 0) tags.push(EXTRA_TAGS[(h >>> 4) % EXTRA_TAGS.length]);
    if (c.lang === 'en' && !tags.includes('eksport')) tags.push('eksport');
    profiles[c.key] = {
      tags: [...new Set(tags)],
      notes: [],
      marketing: {
        email: consent(h % 10 < 6, h % 10 === 9),
        sms: consent((h >>> 3) % 10 < 3),
        whatsapp: consent((h >>> 6) % 10 < 4 || !!c.company),
        viber: consent((h >>> 9) % 10 < 3),
      },
    };
  }

  const staffOf = (o?: Order) => o?.timeline?.find((e) => e.by && e.by !== 'web' && e.by !== 'admin')?.by ?? 'admin';
  bySpend.slice(0, 4).forEach((c, i) => {
    const at = addDays(c.last ?? seededAt, i % 2 ? 1 : 0.2);
    profiles[c.key].notes.push({ id: `cn-seed-${i}`, at: at > seededAt ? seededAt : at, by: staffOf(c.orders[0]), text: NOTES[i] });
  });
  if (bySpend[0]) profiles[bySpend[0].key].tags = [...new Set([...profiles[bySpend[0].key].tags, 'rekomandim'])];

  // Customers met at a meeting / factory visit (no web order yet)
  const known = new Set(base.flatMap((c) => c.phones.map(phone8)));
  const seen = new Set<string>();
  for (const b of bookings) {
    if (manual.length >= 2) break;
    const p = phone8(b.phone);
    if (!p || known.has(p) || seen.has(p) || b.status === 'cancelled' || b.inquiryId) continue;
    seen.add(p);
    const [firstName, ...rest] = (b.customerName ?? '').split(' ');
    const key = manualKey(b.email ?? '', b.phone, b.customerName ?? '');
    manual.push({ key, firstName, lastName: rest.join(' '), email: b.email ?? '', phone: b.phone, city: b.city ?? '', address: b.address ?? '', lang: 'sq', source: 'appointment', createdAt: b.createdAt });
    profiles[key] = {
      tags: ['takim-në-fabrikë'],
      notes: [],
      marketing: { ...emptyMarketing(), whatsapp: { status: 'subscribed', at: b.createdAt, source: 'staff' } },
    };
  }

  // A B2B lead from the contacts inbox (quote request from a company that has not ordered yet)
  const lead = inquiries.find((i) => (i.type === 'quote' || !!i.specs) && !!i.company && !known.has(phone8(i.phone)) && !seen.has(phone8(i.phone)));
  if (lead) {
    const [firstName, ...rest] = lead.name.split(' ');
    const key = manualKey(lead.email ?? '', lead.phone, lead.name);
    const product = lead.specs?.product;
    manual.push({ key, firstName, lastName: rest.join(' '), email: lead.email ?? '', phone: lead.phone, city: lead.city ?? '', address: '', company: lead.company, lang: 'sq', source: 'contact', createdAt: lead.createdAt });
    profiles[key] = {
      tags: [product === 'label' || product === 'sleeve' ? 'pije' : product === 'food' ? 'HoReCa' : 'kozmetikë', 'lead'],
      notes: [{ id: 'cn-seed-lead', at: addDays(lead.createdAt, 0.3), by: lead.assignee ?? 'admin', text: 'Linjë e re produktesh — kërkojnë paketim me folje dhe reliev. Oferta u përgatit; presin aprovimin e mostrës fizike nga menaxhmenti.' }],
      marketing: { ...emptyMarketing(), email: { status: 'subscribed', at: lead.createdAt, source: 'form' } },
    };
  }

  // Two records imported from the old customer list that duplicate existing customers
  const old = addDays(seededAt, -420);
  const [d1, d2] = byOrders.filter((c) => c.phone && c.email);
  if (d1) {
    const first = fold(d1.firstName).replace(/[^a-z]/g, '');
    const last = fold(d1.lastName).replace(/[^a-z]/g, '');
    const email = `${first[0] ?? 'k'}${last}@example.com`;
    const local = d1.phone.replace(/^\+383\s?/, '0');
    manual.push({ key: email, firstName: cap(first), lastName: cap(last), email, phone: local, city: d1.city, address: d1.address, company: d1.company, lang: d1.lang, source: 'import', createdAt: old });
    profiles[email] = { tags: ['lista-e-vjetër'], notes: [], marketing: { ...emptyMarketing(), email: { status: 'subscribed', at: old, source: 'import' } } };
  }
  if (d2) {
    const email = `${fold(d2.firstName).replace(/[^a-z]/g, '')}.${fold(d2.lastName).replace(/[^a-z]/g, '')}@example.com`;
    manual.push({ key: email, firstName: d2.firstName, lastName: d2.lastName, email, phone: '', city: d2.city, address: '', lang: d2.lang, source: 'import', createdAt: old });
    profiles[email] = { tags: ['lista-e-vjetër'], notes: [], marketing: { ...emptyMarketing(), email: { status: 'unsubscribed', at: addDays(old, 40), source: 'import' } } };
  }

  return { profiles, manual, merges: {}, dismissed: [] };
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */
const esc = (v: string | number | undefined) => {
  const s = String(v ?? '');
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const consentCell = (c: Consent) => (c.status === 'subscribed' ? 'yes' : c.status === 'unsubscribed' ? 'unsubscribed' : 'no');

/** Export — private notes are never exported (PDF p.19 acceptance). */
export function exportCsv(rows: CustomerRecord[]) {
  const head = ['company', 'nui', 'first_name', 'last_name', 'email', 'phone', 'city', 'address', 'language', 'orders', 'spent_net_eur', 'spent_gross_eur', 'last_order', 'customer_since', 'tags', 'email_marketing', 'sms_marketing', 'whatsapp_marketing', 'viber_marketing'];
  const lines = rows.map((r) =>
    [
      r.company ?? '', r.pib ?? '', r.firstName, r.lastName, r.email, r.phone, r.city, r.address, r.lang, r.valid, r.spentNet.toFixed(2), r.spent.toFixed(2), r.last?.slice(0, 10) ?? '', r.since.slice(0, 10), r.tags.join(';'),
      consentCell(r.marketing.email), consentCell(r.marketing.sms), consentCell(r.marketing.whatsapp), consentCell(r.marketing.viber),
    ].map(esc).join(','),
  );
  return '﻿' + [head.join(','), ...lines].join('\n');
}

export const IMPORT_TEMPLATE_HEAD = ['company', 'nui', 'first_name', 'last_name', 'email', 'phone', 'city', 'address', 'language', 'tags', 'email_marketing', 'sms_marketing'];

/** RFC-4180-ish parser: quotes, escaped quotes, CRLF, BOM; delimiter `,` or `;` (detected from the header). */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

type ImportField = 'firstName' | 'lastName' | 'name' | 'email' | 'phone' | 'city' | 'address' | 'company' | 'nui' | 'lang' | 'tags' | 'emailMarketing' | 'smsMarketing' | 'whatsappMarketing' | 'viberMarketing';
const ALIASES: Record<ImportField, string[]> = {
  firstName: ['first_name', 'firstname', 'first name', 'given name', 'emri', 'contact_first_name'],
  lastName: ['last_name', 'lastname', 'last name', 'surname', 'mbiemri', 'contact_last_name'],
  name: ['name', 'full_name', 'full name', 'contact', 'contact_person', 'customer', 'klienti', 'personi i kontaktit', 'emri i plote', 'emri dhe mbiemri'],
  email: ['email', 'e-mail', 'e_mail', 'mail', 'email address'],
  phone: ['phone', 'telefon', 'telefoni', 'tel', 'mobile', 'celular'],
  city: ['city', 'qyteti', 'town', 'komuna'],
  address: ['address', 'address1', 'adresa', 'street', 'rruga'],
  company: ['company', 'company_name', 'firma', 'kompania', 'biznesi', 'organization'],
  nui: ['nui', 'business_number', 'business no', 'vat', 'vat_number', 'tax_id', 'nipt', 'nrb', 'pib'],
  lang: ['language', 'lang', 'gjuha', 'locale'],
  tags: ['tags', 'tag', 'etiketat', 'etiketa'],
  emailMarketing: ['email_marketing', 'accepts_email_marketing', 'accepts_marketing', 'newsletter', 'marketing'],
  smsMarketing: ['sms_marketing', 'accepts_sms_marketing', 'sms'],
  whatsappMarketing: ['whatsapp_marketing', 'whatsapp'],
  viberMarketing: ['viber_marketing', 'viber'],
};
const norm = (s: string) => fold(s).replace(/[^a-z0-9]+/g, ' ').trim();

export type ImportStatus = 'new' | 'update' | 'error';
export type ImportError = 'noName' | 'noContact' | 'badEmail' | 'dupInFile';
export interface ImportRow {
  line: number;
  status: ImportStatus;
  error?: ImportError;
  customer: ManualCustomer;
  tags: string[];
  marketing: Partial<Marketing>;
  /** Existing customer this row updates */
  match?: CustomerRecord;
}

const YES = new Set(['yes', 'y', 'true', '1', 'po', 'subscribed', 'x']);
const LANGS: Record<string, Lang> = { sq: 'sq', al: 'sq', shqip: 'sq', albanian: 'sq', en: 'en', english: 'en', anglisht: 'en' };

export function analyseImport(text: string, existing: CustomerRecord[], now: string): { rows: ImportRow[]; columns: ImportField[]; unknown: string[] } {
  const table = parseCsv(text);
  if (!table.length) return { rows: [], columns: [], unknown: [] };
  const header = table[0].map(norm);
  const colOf = {} as Partial<Record<ImportField, number>>;
  const unknown: string[] = [];
  header.forEach((h, i) => {
    const f = (Object.keys(ALIASES) as ImportField[]).find((k) => ALIASES[k].map(norm).includes(h));
    if (f && colOf[f] === undefined) colOf[f] = i;
    else if (!f && table[0][i]?.trim()) unknown.push(table[0][i].trim());
  });
  const byEmail = new Map<string, CustomerRecord>();
  const byPhone = new Map<string, CustomerRecord>();
  for (const c of existing) {
    for (const e of c.emails) byEmail.set(e, c);
    for (const p of c.phones) if (phone8(p)) byPhone.set(phone8(p), c);
  }
  const seenKeys = new Set<string>();
  const rows: ImportRow[] = table.slice(1).map((cells, idx) => {
    const get = (f: ImportField) => (colOf[f] !== undefined ? (cells[colOf[f]!] ?? '').trim() : '');
    let firstName = get('firstName');
    let lastName = get('lastName');
    if (!firstName && !lastName && get('name')) {
      const parts = get('name').split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }
    const email = low(get('email'));
    const phone = get('phone');
    const consent = (v: string): Consent | undefined => {
      const x = low(v);
      if (!x) return undefined;
      if (YES.has(x)) return { status: 'subscribed', at: now, source: 'import' };
      if (x.startsWith('unsub') || x === 'cabonuar' || x === 'çabonuar') return { status: 'unsubscribed', at: now, source: 'import' };
      return undefined;
    };
    const marketing: Partial<Marketing> = {};
    const mk: [Channel, ImportField][] = [['email', 'emailMarketing'], ['sms', 'smsMarketing'], ['whatsapp', 'whatsappMarketing'], ['viber', 'viberMarketing']];
    for (const [ch, f] of mk) {
      const c = consent(get(f));
      if (c) marketing[ch] = c;
    }
    const match = (email && byEmail.get(email)) || (phone8(phone) ? byPhone.get(phone8(phone)) : undefined) || undefined;
    const key = match?.key ?? manualKey(email, phone, `${firstName} ${lastName}`);
    const customer: ManualCustomer = {
      key,
      firstName,
      lastName,
      email,
      phone,
      city: get('city'),
      address: get('address'),
      company: get('company') || undefined,
      pib: get('nui') || undefined,
      lang: LANGS[low(get('lang'))] ?? 'sq',
      source: 'import',
      createdAt: now,
    };
    const tags = get('tags').split(/[;|,]/).map((x) => x.trim().toLowerCase()).filter(Boolean);
    let error: ImportError | undefined;
    if (!firstName && !lastName && !get('company')) error = 'noName';
    else if (!email && !phone8(phone)) error = 'noContact';
    else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = 'badEmail';
    else if (seenKeys.has(key)) error = 'dupInFile';
    if (!error) seenKeys.add(key);
    return { line: idx + 2, status: error ? 'error' : match ? 'update' : 'new', error, customer, tags, marketing, match };
  });
  return { rows, columns: Object.keys(colOf) as ImportField[], unknown };
}
