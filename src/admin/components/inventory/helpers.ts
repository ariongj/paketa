// Inventory / purchasing helpers shared by the Inventory and PurchaseOrders screens (PDF pp.15–16).
// Paketoje stocks and buys in selling units (packs); pieces are always derived from the pack size.
import type { Lang, MovementReason, Order, Product, PurchaseOrder, PurchaseOrderStatus, ReturnRequest, Settings, Staff, Unit } from '@/lib/types';
import type { StockLevels } from '@/lib/inventory';
import type { Module } from '@/lib/permissions';
import { num } from '@/lib/format';
import { isPack, piecesPer, piecesText, unitsText } from '@/admin/components/products/units';

/** Available ≤ this (and > 0) counts as low stock — same threshold as the product list (10 packs). */
export const LOW_STOCK = 10;

/** Anything with a selling unit (product, order line). */
export type UnitLike = Pick<Product, 'unit' | 'packSize'>;

/** Total of quantities that may belong to different products. `unit` is null when the units are mixed. */
export interface QtySum {
  qty: number;
  unit: Unit | null;
  /** total pieces — only when every part is a pack product, otherwise 0 */
  pieces: number;
}

export function sumQty(parts: { of?: UnitLike | null; qty: number }[]): QtySum {
  let qty = 0;
  let pieces = 0;
  let allPacks = parts.length > 0;
  let unit: Unit | null | undefined;
  for (const x of parts) {
    qty += x.qty;
    if (x.of && isPack(x.of)) pieces += x.qty * piecesPer(x.of);
    else allPacks = false;
    const u = x.of?.unit ?? null;
    unit = unit === undefined ? u : unit === u ? unit : null;
  }
  return { qty, unit: unit ?? null, pieces: allPacks ? pieces : 0 };
}

/** "120 pako" (or a plain number for mixed units). */
export const sumUnitsText = (s: QtySum, lang: Lang) => (s.unit ? unitsText(s.qty, s.unit, lang) : num(s.qty, lang));
/** "6.000 copë", '' when the total has no pieces. */
export const sumPiecesText = (s: QtySum, lang: Lang) => (s.pieces ? piecesText(s.pieces, lang) : '');
/** "120 pako · 6.000 copë" */
export const sumText = (s: QtySum, lang: Lang) => [sumUnitsText(s, lang), sumPiecesText(s, lang)].filter(Boolean).join(' · ');

/** "5 pako" for a product quantity; a plain number when the product is unknown. */
export const qtyOf = (of: UnitLike | null | undefined, n: number, lang: Lang) => (of ? unitsText(n, of.unit, lang) : num(n, lang));

export type StockState = 'ok' | 'low' | 'out' | 'untracked';

export function stockState(lv: StockLevels): StockState {
  if (!lv.tracked) return 'untracked';
  if (lv.available <= 0) return 'out';
  if (lv.available <= LOW_STOCK) return 'low';
  return 'ok';
}

/** Number of sellable variants (product of option value counts), 0 = no options. */
export function variantCount(p: Pick<Product, 'options'>): number {
  const withValues = p.options.filter((o) => o.values.length > 0);
  if (!withValues.length) return 0;
  return withValues.reduce((n, o) => n * o.values.length, 1);
}

/**
 * Where a product is stocked: the destination of its latest purchase order, else the default location
 * (Depo Suhodoll, Mitrovicë — everything is kept in the one warehouse).
 */
export function locationIdFor(p: Product, pos: PurchaseOrder[], locations: Settings['locations']): string | undefined {
  const ids = new Set(locations.map((l) => l.id));
  const latest = pos
    .filter((po) => po.lines.some((l) => l.productId === p.id) && ids.has(po.location))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (latest) return latest.location;
  return (locations.find((l) => l.isDefault) ?? locations[0])?.id;
}

/** Staff name for a movement / audit actor; 'web' = storefront checkout. */
export function actorName(id: string, staff: Staff[], webLabel: string) {
  if (id === 'web') return webLabel;
  return staff.find((s) => s.id === id)?.name ?? id;
}

/** Link + permission module for a source document number (order, purchase order, return). */
export function docTarget(
  ref: string | undefined,
  ctx: { orders: Order[]; purchaseOrders: PurchaseOrder[]; returns: ReturnRequest[] },
): { to: string; module: Module } | null {
  if (!ref) return null;
  const order = ctx.orders.find((o) => o.number === ref);
  if (order) return { to: `/admin/narudzbe/${order.id}`, module: 'orders' };
  const po = ctx.purchaseOrders.find((x) => x.number === ref);
  if (po) return { to: `/admin/nabavke?id=${po.id}`, module: 'purchasing' };
  if (ctx.returns.some((r) => r.number === ref)) return { to: '/admin/povrati', module: 'returns' };
  return null;
}

/** Next purchase order number: PO-<year>-<NNN>. */
export function nextPoNumber(pos: PurchaseOrder[], now = new Date()): string {
  const max = pos.reduce((m, po) => Math.max(m, Number(po.number.match(/(\d+)$/)?.[1] ?? 0)), 0);
  return `PO-${now.getFullYear()}-${String(max + 1).padStart(3, '0')}`;
}

export const PO_STATUSES: PurchaseOrderStatus[] = ['draft', 'sent', 'partial', 'closed'];
export const isOpenPo = (po: Pick<PurchaseOrder, 'status'>) => po.status === 'sent' || po.status === 'partial';

/** Units (packs) still expected on a purchase order line. */
export const lineLeft = (l: PurchaseOrder['lines'][number]) => Math.max(0, l.ordered - l.received - l.rejected);

/** A PO is overdue when it is still open and the expected date has passed (end of that day). */
export function isOverdue(po: PurchaseOrder, now = Date.now()) {
  if (!isOpenPo(po) || !po.expectedAt) return false;
  const d = new Date(po.expectedAt);
  d.setHours(23, 59, 59, 999);
  return d.getTime() < now;
}

/** Reasons offered in the "Adjust stock" dialog ('sale' only comes from orders). */
export const ADJUST_REASONS: MovementReason[] = ['correction', 'count', 'damaged', 'return', 'received'];

/** yyyy-mm-dd for <input type="date"> (local time). */
export function toDateInput(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function fromDateInput(v: string) {
  if (!v) return undefined;
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** CSV with ; separators (Excel with Albanian / regional locales) and quoted cells. */
export function toCsv(rows: (string | number)[][]) {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\n');
}
