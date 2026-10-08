// Paketoje selling units for the CMS commerce screens (products, inventory, orders, returns, discounts).
// Products are sold per PACK (`unit: 'pack'`, `packSize` pieces per pack, `cartonPacks` packs per carton);
// prices and stock are per selling unit, pieces are derived. Everything here is pure formatting.
import { moneyPiece, num, unitLabel } from '@/lib/format';
import type { Lang, Unit } from '@/lib/types';

type UnitLike = { unit: Unit; packSize?: number | null };

/** Units the CMS offers in the product editor and the CSV importer, in display order. */
export const UNITS: Unit[] = ['pack', 'kom', 'set', 'm'];

/** Pieces in one selling unit — packSize for packs, otherwise 1. */
export const piecesPer = (x: UnitLike) => (x.unit === 'pack' && x.packSize && x.packSize > 0 ? x.packSize : 1);

/** True when the unit is a pack with a known pack size (pieces are worth showing). */
export const isPack = (x: UnitLike) => x.unit === 'pack' && !!x.packSize && x.packSize > 0;

/** Plural-aware unit word: "1 pack" / "20 packs" in English; SQ "pako/copë" and SR "pak./kom" do not change. */
export function unitWord(unit: Unit, n: number, lang: Lang) {
  if (lang === 'en' && Math.abs(n) !== 1) return ({ pack: 'packs', kom: 'pcs', set: 'sets', m: 'm' } as const)[unit];
  return unitLabel(unit, lang);
}

/** "20 pako" · "3 copë" · "2 sets" */
export const unitsText = (n: number, unit: Unit, lang: Lang) => `${num(n, lang)} ${unitWord(unit, n, lang)}`;

const PCS: Record<Lang, string> = { me: 'kom', sq: 'copë', en: 'pcs' };
const PC1: Record<Lang, string> = { me: 'kom', sq: 'copë', en: 'pc' };

/** "1.000 copë" / "1,000 pcs" */
export const piecesText = (n: number, lang: Lang) => `${num(n, lang, 0)} ${Math.abs(n) === 1 ? PC1[lang] : PCS[lang]}`;

/** Total pieces for a quantity of selling units. */
export const piecesOf = (x: UnitLike, qty: number) => qty * piecesPer(x);

/** "50 copë/pako" — the pack size chip; '' for non-pack units. */
export function packSizeText(x: UnitLike, lang: Lang) {
  if (!isPack(x)) return '';
  return `${num(x.packSize as number, lang)} ${PCS[lang]}/${unitLabel('pack', lang)}`;
}

/**
 * Quantity of an order/cart line: "20 pako × 50 copë = 1.000 copë" for packs, "3 copë" otherwise.
 * `short` drops the multiplication: "20 pako · 1.000 copë".
 */
export function qtyText(x: UnitLike, qty: number, lang: Lang, opts: { short?: boolean } = {}) {
  if (!isPack(x)) return unitsText(qty, x.unit, lang);
  const total = piecesText(piecesOf(x, qty), lang);
  if (opts.short) return `${unitsText(qty, 'pack', lang)} · ${total}`;
  return `${unitsText(qty, 'pack', lang)} × ${num(x.packSize as number, lang)} ${PCS[lang]} = ${total}`;
}

/** Secondary stock/quantity note in pieces ("6.000 copë"), '' when the unit has no pieces. */
export const piecesNote = (x: UnitLike, qty: number, lang: Lang) => (isPack(x) ? piecesText(piecesOf(x, qty), lang) : '');

/** Per-piece price ("0,05 €/copë"), '' for non-pack units or no price. */
export function piecePriceText(x: UnitLike, unitPrice: number, lang: Lang) {
  if (!isPack(x) || !(unitPrice > 0)) return '';
  return `${moneyPiece(unitPrice / (x.packSize as number), lang)}/${PC1[lang]}`;
}

/** "Karton: 20 pako · 1.000 copë" (label word localised by the caller), '' without carton data. */
export function cartonText(x: UnitLike & { cartonPacks?: number | null }, lang: Lang) {
  if (!x.cartonPacks || x.cartonPacks <= 0) return '';
  const packs = unitsText(x.cartonPacks, x.unit === 'pack' ? 'pack' : x.unit, lang);
  return isPack(x) ? `${packs} · ${piecesText(x.cartonPacks * (x.packSize as number), lang)}` : packs;
}
