// Print-shop helpers for the CMS orders area: artwork (print files) per line, proof approval, production lead
// times and net/VAT money views. Pure — every field they read is optional on older orders, so missing data
// degrades to a sensible derived state instead of breaking a screen.
import { orderLineInstallation } from '@/lib/orders';
import type { ArtworkRef, ArtworkStatus, Lang, Order, OrderEvent, OrderLine, OrderProof, OrderStatus, Product, ProofStatus } from '@/lib/types';

const r2 = (n: number) => Math.round(n * 100) / 100;
const DAY = 86_400_000;

/* ------------------------------------------------------------------ */
/* Artwork (print files)                                               */
/* ------------------------------------------------------------------ */
export const ARTWORK_STATUSES: ArtworkStatus[] = ['uploaded', 'later', 'design'];

/** Artwork as stored by the prepress card: the shared ArtworkRef plus an internal prepress note (persisted with the line). */
export type PrepressArtwork = ArtworkRef & { prepressNote?: string };
export const prepressNoteOf = (a: ArtworkRef | null | undefined) => (a as PrepressArtwork | null | undefined)?.prepressNote ?? '';

/** A line needs a print file when it carries artwork data or its product asks for one. Custom lines never do. */
export function lineNeedsArtwork(l: OrderLine, products?: Product[]): boolean {
  if (l.custom || !l.productId) return false;
  if (l.artwork) return true;
  return !!products?.find((p) => p.id === l.productId)?.artwork;
}

/** The line's artwork, or "file to follow" when the product needs one and nothing was supplied. */
export function artworkOf(l: OrderLine, products?: Product[]): ArtworkRef | null {
  if (l.artwork) return l.artwork;
  return lineNeedsArtwork(l, products) ? { status: 'later' } : null;
}

export interface ArtworkSummary {
  /** lines that need a print file */
  total: number;
  /** file uploaded / received */
  uploaded: number;
  /** PrintWorks designs it (design service) — nothing to wait for */
  design: number;
  /** file still expected from the customer */
  missing: number;
  /** uploaded + design */
  ready: number;
}

export function artworkSummary(o: Pick<Order, 'items'>, products?: Product[]): ArtworkSummary {
  const s: ArtworkSummary = { total: 0, uploaded: 0, design: 0, missing: 0, ready: 0 };
  for (const l of o.items) {
    const a = artworkOf(l, products);
    if (!a) continue;
    s.total++;
    if (a.status === 'uploaded') s.uploaded++;
    else if (a.status === 'design') s.design++;
    else s.missing++;
  }
  s.ready = s.uploaded + s.design;
  return s;
}

/** 1 234 567 → "1,2 MB" */
export function fileSize(bytes: number | undefined, lang: Lang) {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const n = new Intl.NumberFormat(lang === 'en' ? 'en-IE' : 'de-DE', { maximumFractionDigits: i >= 2 ? 1 : 0 }).format(v);
  return `${n} ${units[i]}`;
}

/** File extension in caps, e.g. "PDF" */
export const fileExt = (name?: string) => (name && name.includes('.') ? name.split('.').pop()!.toUpperCase().slice(0, 4) : '');

/* ------------------------------------------------------------------ */
/* Proof approval                                                      */
/* ------------------------------------------------------------------ */
/** Display order of proof states (state machine: awaiting_files → checking → sent → approved | changes → sent v+1). */
export const PROOF_STATUSES: ProofStatus[] = ['awaiting_files', 'checking', 'sent', 'changes', 'approved'];

const PRE_PRODUCTION: OrderStatus[] = ['new', 'confirmed', 'proof'];

/**
 * The order's proof state. Stored `order.proof` wins; older orders without one get a state derived from the
 * order status and the artwork lines. Orders with nothing to print (e.g. only the sample kit) return null.
 */
export function proofOf(o: Order, products?: Product[]): OrderProof | null {
  if (o.proof) return o.proof;
  const art = artworkSummary(o, products);
  if (!art.total) return null;
  if (PRE_PRODUCTION.includes(o.status) || o.status === 'cancelled') return { status: art.missing ? 'awaiting_files' : 'checking', version: 0 };
  // in production or later: the proof was approved
  const at = o.timeline.find((e) => e.status === 'processing')?.at;
  return { status: 'approved', version: 1, ...(at ? { approvedAt: at } : {}) };
}

const isOpen = (o: Pick<Order, 'status'>) => PRE_PRODUCTION.includes(o.status);

/** Open order (before production) still waiting for at least one print file. */
export function waitingForFiles(o: Order, products?: Product[]): boolean {
  if (!isOpen(o)) return false;
  const art = artworkSummary(o, products);
  if (art.total) return art.missing > 0;
  return o.proof?.status === 'awaiting_files';
}

/** The customer asked for changes on the last proof — prepress must act. */
export const proofChangesRequested = (o: Order, products?: Product[]) => isOpen(o) && proofOf(o, products)?.status === 'changes';

/** Proof sent, waiting for the customer's approval. */
export const proofAwaitingApproval = (o: Order, products?: Product[]) => isOpen(o) && proofOf(o, products)?.status === 'sent';

/** Timeline notes written by the prepress card start with this marker (the timeline shows them as "Prepress & provë"). */
export const PREPRESS_NOTE = 'Prepress · ';
export const isPrepressNote = (e: Pick<OrderEvent, 'status' | 'note'>) => e.status === 'note' && !!e.note?.startsWith(PREPRESS_NOTE);

/* ------------------------------------------------------------------ */
/* Production lead time                                                */
/* ------------------------------------------------------------------ */
/** Adds working days (Mon–Fri). */
export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = Math.max(0, Math.round(days));
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  return d;
}

/** Longest lead time (working days) over the order's catalogue lines; default 7. */
export function orderLeadDays(o: Pick<Order, 'items'>, products: Product[]): number {
  let max = 0;
  for (const l of o.items) {
    const p = products.find((x) => x.id === l.productId);
    if (p?.leadDays) max = Math.max(max, p.leadDays);
  }
  return max || 7;
}

/** When production started (last move to "processing"), if it did. */
export const productionStartedAt = (o: Pick<Order, 'timeline'>) => [...o.timeline].reverse().find((e) => e.status === 'processing')?.at;

/** Planned ready date: production start + lead time in working days (null before production). */
export function productionDue(o: Order, products: Product[]): Date | null {
  const start = productionStartedAt(o);
  if (!start || o.status === 'cancelled') return null;
  return addWorkingDays(new Date(start), orderLeadDays(o, products));
}

/** In production past the planned ready date. */
export function productionOverdue(o: Order, products: Product[], now: Date = new Date()): boolean {
  if (o.status !== 'processing') return false;
  const due = productionDue(o, products);
  return !!due && due.getTime() < now.getTime();
}

/** Whole days late (≥ 1) for an overdue order. */
export function daysLate(o: Order, products: Product[], now: Date = new Date()) {
  const due = productionDue(o, products);
  return due ? Math.max(1, Math.ceil((now.getTime() - due.getTime()) / DAY)) : 0;
}

/* ------------------------------------------------------------------ */
/* Money (prices are net; VAT 18% added on top)                         */
/* ------------------------------------------------------------------ */
/**
 * Design & prepress amount of a line. PrintWorks charges a flat fee per line (`installationPer: 'line'`);
 * older lines without the flag fall back to the product's setting.
 */
export function designAmount(l: OrderLine, products?: Product[]): number {
  if (!l.installation || !l.installationPrice) return 0;
  if (l.installationPer) return orderLineInstallation(l);
  const per = products?.find((p) => p.id === l.productId)?.installation?.per;
  return per === 'line' ? r2(l.installationPrice) : orderLineInstallation(l);
}

/** true when the line's design fee is a flat amount for the whole line. */
export function isFlatDesign(l: OrderLine, products?: Product[]) {
  return l.installationPer ? l.installationPer === 'line' : products?.find((p) => p.id === l.productId)?.installation?.per === 'line';
}

/** Unit price with 2–3 decimals (print tiers go down to €0,055 / copë). */
export function unitMoney(v: number, lang: Lang) {
  return new Intl.NumberFormat(lang === 'en' ? 'en-IE' : 'de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(v);
}

/** "NUI 81…" stays as typed; a bare number gets its label (settings and customers store both forms). */
export const withLabel = (value: string | undefined, label: string) => (!value ? '' : value.toLowerCase().startsWith(label.toLowerCase()) ? value : `${label} ${value}`);

/** Order total excl. VAT. */
export const orderNet = (o: Pick<Order, 'total' | 'vat'>) => r2(o.total - o.vat);
