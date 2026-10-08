import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';
import type { PriceTier, Product } from '@/lib/types';
import { defaultOptions, nextTier, packsForPieces, piecesFor, piecesPerUnit, regularUnitPrice, tierPct, tiersOf, unitPrice } from '@/lib/pricing';
import { round2 } from '@/lib/utils';

/** Stock at or below this many selling units shows the "only N left" warning. */
export const LOW_STOCK = 10;

export interface TierRow {
  /** first quantity of the row */
  min: number;
  /** last quantity of the row (null = open-ended) */
  max: number | null;
  pct: number;
  /** price per selling unit for that row (options + sale included) */
  price: number;
  piece: number;
}

export interface Configurator {
  product: Product;
  options: Record<string, string>;
  setOption: (optionId: string, valueId: string) => void;
  /** Selling units (packs for 'pack' products) — exactly what goes into the cart */
  qty: number;
  setQty: (n: number) => void;
  minQty: number;
  maxQty: number;
  soldOut: boolean;
  lowStock: boolean;
  /** Sold per pack with a known pack size → per-piece prices, pieces calculator */
  isPack: boolean;
  packSize: number;
  /** Packs per carton (0 = no carton info) */
  cartonPacks: number;
  addCarton: () => void;
  /** Pieces calculator ("Sa copë ju duhen?") */
  pieces: string;
  setPieces: (v: string) => void;
  piecesNum: number;
  suggestedPacks: number;
  /** Custom logo print add-on (field `installation`) */
  installation: boolean;
  setInstallation: (v: boolean) => void;
  canInstall: boolean;
  /** Minimum order with logo print (1 carton) */
  printMinQty: number;
  /** true right after ticking logo print raised the quantity to a carton */
  printRaised: boolean;
  /* ---- derived ---- */
  tiers: PriceTier[];
  tierRows: TierRow[];
  tierPct: number;
  nextTier: PriceTier | null;
  /** price per unit before the volume tier (options + sale) */
  baseUnitPrice: number;
  /** price per unit for this quantity (tier applied) */
  unitPrice: number;
  regularUnitPrice: number;
  /** price per piece for this quantity (tier applied) */
  piecePrice: number;
  basePiecePrice: number;
  totalPieces: number;
  goodsTotal: number;
  tierSaving: number;
  installationUnit: number;
  installationTotal: number;
  total: number;
}

const parsePieces = (v: string) => {
  const n = parseInt(v.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function useConfigurator(product: Product): Configurator {
  const isPack = product.unit === 'pack' && !!product.packSize;
  const packSize = piecesPerUnit(product);
  const cartonPacks = product.cartonPacks && product.cartonPacks > 0 ? product.cartonPacks : 0;
  const soldOut = !product.quoteOnly && product.stock <= 0;
  const maxQty = product.stock > 0 && product.stock < 999 ? product.stock : 999;
  const lowStock = !soldOut && product.stock < 999 && product.stock <= LOW_STOCK;
  const canInstall = !!product.installation?.available;
  const printMinQty = Math.min(maxQty, Math.max(1, cartonPacks || 1));

  const [options, setOptions] = useState<Record<string, string>>(() => defaultOptions(product));
  const [qty, setQtyState] = useState(1);
  const [pieces, setPiecesState] = useState('');
  const [installation, setInstallationState] = useState(false);
  const [printRaised, setPrintRaised] = useState(false);

  const minQty = installation && canInstall ? printMinQty : 1;
  const clamp = (n: number, min = minQty) => Math.min(maxQty, Math.max(min, Math.round(n) || min));

  const setQty = (n: number) => {
    setQtyState(clamp(n));
    setPrintRaised(false);
  };

  const piecesNum = parsePieces(pieces);
  const suggestedPacks = piecesNum > 0 ? packsForPieces(piecesNum, packSize) : 0;

  const setPieces = (v: string) => {
    const clean = v.replace(/[^\d]/g, '').slice(0, 7);
    setPiecesState(clean);
    const n = parsePieces(clean);
    if (n > 0) {
      setQtyState(clamp(packsForPieces(n, packSize)));
      setPrintRaised(false);
    }
  };

  const setInstallation = (on: boolean) => {
    setInstallationState(on);
    if (on && qty < printMinQty) {
      setQtyState(printMinQty);
      setPrintRaised(true);
    } else setPrintRaised(false);
  };

  const tiers = tiersOf(product);
  const baseUnitPrice = unitPrice(product, options, 1);
  const tierRows: TierRow[] = [];
  if (tiers.length) {
    const rows = [{ minQty: 1, pct: 0 }, ...tiers];
    rows.forEach((t, i) => {
      const next = rows[i + 1];
      const price = round2(t.pct ? baseUnitPrice * (1 - t.pct / 100) : baseUnitPrice);
      tierRows.push({ min: t.minQty, max: next ? next.minQty - 1 : null, pct: t.pct, price, piece: price / packSize });
    });
  }

  const up = unitPrice(product, options, qty);
  const goodsTotal = round2(up * qty);
  const installationUnit = installation && canInstall ? product.installation!.price : 0;
  const installationTotal = round2(installationUnit * qty);

  return {
    product,
    options,
    setOption: (id, v) => setOptions((o) => ({ ...o, [id]: v })),
    qty,
    setQty,
    minQty,
    maxQty,
    soldOut,
    lowStock,
    isPack,
    packSize,
    cartonPacks,
    addCarton: () => setQty(qty + (cartonPacks || 1)),
    pieces,
    setPieces,
    piecesNum,
    suggestedPacks,
    installation: installation && canInstall,
    setInstallation,
    canInstall,
    printMinQty,
    printRaised: printRaised && installation,
    tiers,
    tierRows,
    tierPct: tierPct(product, qty),
    nextTier: nextTier(product, qty),
    baseUnitPrice,
    unitPrice: up,
    regularUnitPrice: regularUnitPrice(product, options),
    piecePrice: up / packSize,
    basePiecePrice: baseUnitPrice / packSize,
    totalPieces: piecesFor(product, qty),
    goodsTotal,
    tierSaving: round2(baseUnitPrice * qty - goodsTotal),
    installationUnit,
    installationTotal,
    total: round2(goodsTotal + installationTotal),
  };
}

/** Full cartons + loose packs in a quantity ("1 karton + 4 pako"). */
export function cartonSplit(qty: number, cartonPacks: number) {
  if (!cartonPacks) return { full: 0, rest: qty };
  return { full: Math.floor(qty / cartonPacks), rest: qty % cartonPacks };
}

/** Smoothly tweens a number towards `value` (used for live prices). */
export function useTweenedNumber(value: number, duration = 0.5) {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    if (current.current === value) return;
    const controls = animate(current.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        current.current = v;
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [value, duration]);
  return display;
}
