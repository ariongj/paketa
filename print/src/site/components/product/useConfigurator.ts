import { useEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'motion/react';
import type { ArtworkRef, Product } from '@/lib/types';
import { addonTotal, defaultOptions, regularUnitPrice, unitPrice } from '@/lib/pricing';
import { round2 } from '@/lib/utils';
import { defaultQty, hasDesign, isRun, qtyRules, snapQty, tierRows, type QtyRules, type TierRow } from './print';

export type ArtMode = 'upload' | 'later' | 'design';

/** Why the last quantity entry was adjusted (shown under the custom input). */
export type QtyNotice = { kind: 'min' | 'step' | 'max'; n: number } | null;

export interface Configurator {
  product: Product;
  /** sold in print runs (tiers / MOQ) */
  run: boolean;
  options: Record<string, string>;
  setOption: (optionId: string, valueId: string) => void;
  qty: number;
  /** set and snap to MOQ / step / max; returns the applied value */
  setQty: (n: number) => number;
  rules: QtyRules;
  qtyNotice: QtyNotice;
  tiers: TierRow[];
  /** index of the tier the current quantity falls in (−1 without tiers) */
  tierIndex: number;
  /* artwork */
  needsArtwork: boolean;
  artMode: ArtMode;
  setArtMode: (m: ArtMode) => void;
  file: ArtworkRef | null;
  setFile: (f: ArtworkRef | null) => void;
  note: string;
  setNote: (v: string) => void;
  /** upload chosen but no file yet */
  missingFile: boolean;
  canDesign: boolean;
  designFeeUnit: number;
  /* prices */
  unitPrice: number;
  regularUnitPrice: number;
  /** unit price at the smallest run, for "you save X%" */
  firstUnitPrice: number;
  savePct: number;
  goodsTotal: number;
  designTotal: number;
  /** net total (goods + design) */
  total: number;
  /** cart payload helpers */
  installation: boolean;
  artwork: () => ArtworkRef | undefined;
}

export function useConfigurator(product: Product): Configurator {
  const run = isRun(product);
  const rules = useMemo(() => qtyRules(product), [product]);
  const [options, setOptions] = useState<Record<string, string>>(() => defaultOptions(product));
  const [qty, setQtyState] = useState(() => snapQty(defaultQty(product), rules));
  const [qtyNotice, setQtyNotice] = useState<QtyNotice>(null);
  const canDesign = hasDesign(product);
  const needsArtwork = !!product.artwork;
  const [artMode, setArtMode] = useState<ArtMode>('upload');
  const [file, setFile] = useState<ArtworkRef | null>(null);
  const [note, setNote] = useState('');

  const setQty = (n: number) => {
    const raw = Math.round(n);
    const v = snapQty(raw, rules);
    setQtyState(v);
    if (!Number.isFinite(raw) || raw < rules.min) setQtyNotice({ kind: 'min', n: rules.min });
    else if (raw > rules.max) setQtyNotice({ kind: 'max', n: rules.max });
    else if (v !== raw) setQtyNotice({ kind: 'step', n: v });
    else setQtyNotice(null);
    return v;
  };

  const tiers = useMemo(() => tierRows(product, options), [product, options]);
  let tierIndex = -1;
  tiers.forEach((t, i) => {
    if (t.qty <= qty) tierIndex = i;
  });

  const up = unitPrice(product, options, qty);
  const first = tiers.length ? tiers[0].unit : up;
  const goodsTotal = round2(up * qty);
  const design = artMode === 'design' && canDesign;
  const designTotal = design ? addonTotal(product, qty) : 0;

  return {
    product,
    run,
    options,
    setOption: (id, v) => setOptions((o) => ({ ...o, [id]: v })),
    qty,
    setQty,
    rules,
    qtyNotice,
    tiers,
    tierIndex,
    needsArtwork,
    artMode: !canDesign && artMode === 'design' ? 'upload' : artMode,
    setArtMode,
    file,
    setFile,
    note,
    setNote,
    missingFile: needsArtwork && artMode === 'upload' && !file,
    canDesign,
    designFeeUnit: canDesign ? product.installation!.price : 0,
    unitPrice: up,
    regularUnitPrice: regularUnitPrice(product, options, qty),
    firstUnitPrice: first,
    savePct: first > 0 ? Math.max(0, Math.round((1 - up / first) * 100)) : 0,
    goodsTotal,
    designTotal,
    total: round2(goodsTotal + designTotal),
    installation: design,
    artwork: () => {
      if (!needsArtwork && !design) return undefined;
      const n = note.trim() ? { note: note.trim() } : {};
      if (design) return { status: 'design', ...n };
      if (artMode === 'upload' && file) return { ...file, ...n };
      return { status: 'later', ...n };
    },
  };
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
