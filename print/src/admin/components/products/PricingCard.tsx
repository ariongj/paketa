import { useState } from 'react';
import { AlertTriangle, Info, Layers, Lock, Percent, Tag } from 'lucide-react';
import { Card } from '@/admin/components/kit';
import { useDict, useLang } from '@/i18n';
import { money, num, perUnit, unitLabel } from '@/lib/format';
import type { PriceTier, Unit } from '@/lib/types';
import { cn, round2 } from '@/lib/utils';
import { pd } from './dict';
import { qtyLabel, unitMoney } from './model';
import { FormField, NumInput, SelectInput, TextInput } from './parts';

/** Print units: pieces and sets. Legacy area/length units stay selectable only on products that already use them. */
const UNITS: Unit[] = ['kom', 'set'];

/**
 * "Çmimi & kosto": the base price per piece (= first quantity tier when tiers are on, otherwise a single
 * price with an optional compare-at), the internal cost and the margin at a chosen run — cost and margin
 * only with the `viewCost` permission (PDF p.10, p.11, p.13).
 */
export function PricingCard({
  tiered,
  tiers,
  price,
  compareAt,
  cost,
  unit,
  vat,
  net,
  showCost,
  priceError,
  onPrice,
  onCompareAt,
  onCost,
  onUnit,
}: {
  /** quantity pricing is on (the base price comes from the first tier) */
  tiered: boolean;
  /** complete quantity tiers */
  tiers: PriceTier[];
  price: number | null;
  compareAt: number | null;
  cost: number | null;
  unit: Unit;
  vat: number;
  /** catalogue prices are net (VAT added at checkout) */
  net: boolean;
  showCost: boolean;
  priceError?: string;
  onPrice: (v: number | null) => void;
  onCompareAt: (v: number | null) => void;
  onCost: (v: number | null) => void;
  onUnit: (u: Unit) => void;
}) {
  const t = useDict(pd, 'admin');
  const lang = useLang('admin');
  const ph = lang === 'en' ? '0.00' : '0,00';
  const p = tiered ? tiers[0]?.price ?? 0 : price ?? 0;
  const firstQty = tiers[0]?.qty;
  const hasCompare = !tiered && compareAt != null && compareAt > 0;
  const discount = hasCompare && p > 0 && (compareAt as number) > p;
  const compareLow = hasCompare && p > 0 && !discount;
  const pct = discount ? Math.round((1 - p / (compareAt as number)) * 100) : 0;
  const units = UNITS.includes(unit) ? UNITS : [...UNITS, unit];

  return (
    <Card title={t('c_price')} description={net ? t('c_price_d_net', { vat }) : t('c_price_d_gross', { vat })}>
      <div className={cn('grid gap-4', showCost ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {tiered ? (
          <FormField label={t('f_basePrice')} hint={firstQty ? t('f_basePrice_h', { qty: qtyLabel(firstQty, unit, lang) }) : t('f_basePrice_h_empty')} className={showCost ? 'sm:col-span-2' : undefined} error={priceError}>
            <TextInput value={p > 0 ? unitMoney(p, lang) : '—'} readOnly disabled suffix={<Lock className="h-3.5 w-3.5" />} className="font-semibold" aria-label={t('f_basePrice')} />
          </FormField>
        ) : (
          <>
            <FormField label={t('f_price')} required error={priceError}>
              <NumInput money zeroAsEmpty value={price} onChange={onPrice} prefix="€" suffix={perUnit(unit, lang)} placeholder={ph} invalid={!!priceError} className="font-semibold" aria-label={t('f_price')} />
            </FormField>
            <FormField label={t('f_compareAt')} hint={compareLow ? undefined : t('f_compareAt_h')} error={compareLow ? t('price_compareLow') : undefined}>
              <NumInput money value={compareAt} onChange={onCompareAt} prefix="€" placeholder="—" invalid={compareLow} aria-label={t('f_compareAt')} />
            </FormField>
          </>
        )}
        {showCost && (
          <FormField label={t('f_cost')} hint={t('f_cost_h')}>
            <NumInput money value={cost} onChange={onCost} prefix="€" suffix={perUnit(unit, lang)} placeholder="—" aria-label={t('f_cost')} />
          </FormField>
        )}
      </div>

      {/* live summary */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-canvas/80 px-3.5 py-2.5 text-[13px]">
        <span className={cn('flex items-center gap-2 font-medium', compareLow ? 'text-amber-800' : 'text-ink-soft')}>
          {tiered ? <Layers className="h-4 w-4 text-muted" /> : compareLow ? <AlertTriangle className="h-4 w-4" /> : discount ? <Percent className="h-4 w-4" /> : <Tag className="h-4 w-4 text-muted" />}
          {tiered
            ? tiers.length
              ? t('price_tiered', { from: unitMoney(tiers[0].price, lang), to: unitMoney(tiers[tiers.length - 1].price, lang) })
              : t('c_tiers_d')
            : compareLow
              ? t('price_compareLow')
              : discount
                ? t('price_discount', { pct, amount: unitMoney(round2((compareAt as number) - p), lang) })
                : t('price_regular')}
        </span>
      </div>

      {showCost && <MarginPanel tiers={tiers} price={p} cost={cost} unit={unit} />}

      <div className="mt-5 grid gap-4 border-t border-line/70 pt-5 sm:grid-cols-2">
        <FormField label={t('f_unit')}>
          <SelectInput value={unit} onChange={(e) => onUnit(e.target.value as Unit)} aria-label={t('f_unit')}>
            {units.map((u) => (
              <option key={u} value={u}>
                {u === 'kom' ? t('unit_kom') : u === 'set' ? t('unit_set') : unitLabel(u, lang)}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <p className="flex items-start gap-2 self-end pb-1 text-[12.5px] leading-snug text-muted">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          {tiered ? t('price_noteTiers') : t('price_note')}
        </p>
      </div>
    </Card>
  );
}

/** Cost, profit and margin per piece at a chosen run (tiers) or at the single price. */
function MarginPanel({ tiers, price, cost, unit }: { tiers: PriceTier[]; price: number; cost: number | null; unit: Unit }) {
  const t = useDict(pd, 'admin');
  const lang = useLang('admin');
  const [atQty, setAtQty] = useState<number | null>(null);
  const tier = tiers.find((x) => x.qty === atQty) ?? tiers[0];
  const unitPrice = tier ? tier.price : price;
  const runQty = tier?.qty ?? null;
  if (cost == null) return <p className="mt-3 text-[12.5px] text-muted">{t('m_noCost')}</p>;
  if (!(unitPrice > 0)) return null;
  const profit = unitPrice - cost;
  const margin = Math.round((profit / unitPrice) * 1000) / 10;
  const neg = profit < 0;
  const stat = (label: string, value: string, strong?: boolean) => (
    <div className="min-w-0">
      <div className="text-[11.5px] font-medium text-muted">{label}</div>
      <div className={cn('mt-0.5 truncate text-[14px] tabular-nums', strong ? 'font-bold' : 'font-semibold', neg && strong ? 'text-red-700' : 'text-ink')}>{value}</div>
    </div>
  );
  return (
    <div className={cn('mt-3 rounded-lg border px-3.5 py-3', neg ? 'border-red-200 bg-red-50/40' : 'border-line')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12.5px] font-semibold text-ink-soft">{t('margin')}</span>
        {tiers.length > 1 && (
          <label className="flex items-center gap-2 text-[12.5px] text-muted">
            {t('marginAt')}
            <SelectInput size="sm" value={String(tier?.qty ?? '')} onChange={(e) => setAtQty(Number(e.target.value))} className="w-36" aria-label={t('marginAt')}>
              {tiers.map((x) => (
                <option key={x.qty} value={x.qty}>
                  {qtyLabel(x.qty, unit, lang)}
                </option>
              ))}
            </SelectInput>
          </label>
        )}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {stat(t('m_price'), unitMoney(unitPrice, lang))}
        {stat(t('m_profitUnit'), unitMoney(profit, lang))}
        {stat(t('margin'), `${num(margin, lang, 1)}%`, true)}
        {runQty != null ? stat(t('m_profitRun'), money(profit * runQty, lang)) : stat(t('profit'), unitMoney(profit, lang))}
      </div>
      {neg && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-red-700">
          <AlertTriangle className="h-3.5 w-3.5" /> {t('m_negative')}
        </p>
      )}
    </div>
  );
}
