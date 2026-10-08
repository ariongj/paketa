import { AlertTriangle, Boxes, Info, Percent, Tag } from 'lucide-react';
import { Card } from '@/admin/components/kit';
import { useDict, useLang } from '@/i18n';
import { money, moneyPiece, num, perUnit, piecesLabel } from '@/lib/format';
import type { Unit } from '@/lib/types';
import { cn, round2 } from '@/lib/utils';
import { pd } from './dict';
import { FormField, NumInput, SelectInput } from './parts';
import { UNITS, cartonText, unitWord } from './units';

/**
 * Njësia & paketimi (pack / piece / set / metre, pieces per pack, packs per carton) · Çmimi per selling unit
 * (what the customer pays) · Çmimi referues (compare-at, must be higher to show a discount — empty is not zero) ·
 * Kosto with margin and profit, visible only with the `viewCost` permission (PDF p.10, p.11, p.13).
 * Live readout: per-piece price and the price of a full carton.
 */
export function PricingCard({
  price,
  compareAt,
  cost,
  unit,
  packSize,
  cartonPacks,
  vat,
  showCost,
  priceError,
  onPrice,
  onCompareAt,
  onCost,
  onUnit,
  onPackSize,
  onCartonPacks,
}: {
  price: number | null;
  compareAt: number | null;
  cost: number | null;
  unit: Unit;
  packSize: number | null;
  cartonPacks: number | null;
  vat: number;
  showCost: boolean;
  priceError?: string;
  onPrice: (v: number | null) => void;
  onCompareAt: (v: number | null) => void;
  onCost: (v: number | null) => void;
  onUnit: (u: Unit) => void;
  onPackSize: (v: number | null) => void;
  onCartonPacks: (v: number | null) => void;
}) {
  const t = useDict(pd, 'admin');
  const lang = useLang('admin');
  const fmt = (v: number) => money(v, lang);
  const ph = lang === 'en' ? '0.00' : '0,00';
  const pack = unit === 'pack';
  const suffix = perUnit(unit, lang);
  const p = price ?? 0;
  const hasCompare = compareAt != null && compareAt > 0;
  const discount = hasCompare && p > 0 && (compareAt as number) > p;
  const compareLow = hasCompare && p > 0 && !discount;
  const pct = discount ? Math.round((1 - p / (compareAt as number)) * 100) : 0;
  const profit = cost != null && p > 0 ? round2(p - cost) : null;
  const margin = profit != null && p > 0 ? Math.round((profit / p) * 1000) / 10 : null;
  const size = pack && packSize && packSize > 0 ? packSize : null;
  const carton = pack && cartonPacks && cartonPacks > 0 ? cartonPacks : null;

  return (
    <Card title={t('c_price')} description={t('c_price_d', { vat })}>
      {/* unit & packing */}
      <div className={cn('grid gap-4', pack ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        <FormField label={t('f_unit')}>
          <SelectInput value={unit} onChange={(e) => onUnit(e.target.value as Unit)} aria-label={t('f_unit')}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`unit_${u}`)}
              </option>
            ))}
          </SelectInput>
        </FormField>
        {pack && (
          <FormField label={t('f_pack')} hint={t('f_pack_h')}>
            <NumInput integer value={packSize} onChange={onPackSize} suffix={piecesLabel(lang)} placeholder="50" aria-label={t('f_pack')} />
          </FormField>
        )}
        {pack && (
          <FormField label={t('f_carton')} hint={t('f_carton_h')}>
            <NumInput integer value={cartonPacks} onChange={onCartonPacks} suffix={unitWord('pack', 2, lang)} placeholder="20" aria-label={t('f_carton')} />
          </FormField>
        )}
      </div>

      {/* prices */}
      <div className={cn('mt-5 grid gap-4 border-t border-line/70 pt-5', showCost ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        <FormField label={t('f_price')} required error={priceError}>
          <NumInput money zeroAsEmpty value={price} onChange={onPrice} prefix="€" suffix={suffix} placeholder={ph} invalid={!!priceError} className="font-semibold" aria-label={t('f_price')} />
        </FormField>
        <FormField label={t('f_compareAt')} hint={compareLow ? undefined : t('f_compareAt_h')} error={compareLow ? t('price_compareLow') : undefined}>
          <NumInput money value={compareAt} onChange={onCompareAt} prefix="€" suffix={suffix} placeholder="—" invalid={compareLow} aria-label={t('f_compareAt')} />
        </FormField>
        {showCost && (
          <FormField label={t('f_cost')} hint={t('f_cost_h')}>
            <NumInput money value={cost} onChange={onCost} prefix="€" suffix={suffix} placeholder="—" aria-label={t('f_cost')} />
          </FormField>
        )}
      </div>

      {/* live readout: per piece + carton */}
      {pack && (
        <div className="mt-4 grid gap-px overflow-hidden rounded-lg bg-line/70 ring-1 ring-line/70 sm:grid-cols-2">
          <div className="bg-white px-3.5 py-3">
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">{t('perPiece')}</div>
            {size && p > 0 ? (
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                <span className="text-[18px] font-bold tabular-nums text-ink">{moneyPiece(p / size, lang)}</span>
                <span className="text-[12.5px] tabular-nums text-muted">
                  {fmt(p)} / {num(size, lang)} {piecesLabel(lang)}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-[12.5px] leading-snug text-muted">{t('perPieceNone')}</p>
            )}
          </div>
          <div className="bg-white px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted">
              <Boxes className="h-3.5 w-3.5" /> {t('cartonSum')}
            </div>
            {carton ? (
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                <span className="text-[18px] font-bold tabular-nums text-ink">{p > 0 ? fmt(round2(p * carton)) : '—'}</span>
                <span className="text-[12.5px] tabular-nums text-muted">{cartonText({ unit, packSize: size, cartonPacks: carton }, lang)}</span>
              </div>
            ) : (
              <p className="mt-1 text-[12.5px] leading-snug text-muted">{t('f_carton_h')}</p>
            )}
          </div>
        </div>
      )}

      {/* discount + margin summary */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-canvas/80 px-3.5 py-2.5 text-[13px]">
        <span className={cn('flex items-center gap-2 font-medium', compareLow ? 'text-amber-800' : 'text-ink-soft')}>
          {compareLow ? <AlertTriangle className="h-4 w-4" /> : discount ? <Percent className="h-4 w-4" /> : <Tag className="h-4 w-4 text-muted" />}
          {compareLow ? t('price_compareLow') : discount ? t('price_discount', { pct, amount: fmt(round2((compareAt as number) - p)) }) : t('price_regular')}
        </span>
        {showCost && profit != null && (
          <span className="flex items-center gap-4 tabular-nums sm:ml-auto">
            <span>
              <span className="text-muted">{t('margin')}</span> <b className={cn('font-semibold', margin! < 0 ? 'text-red-700' : 'text-ink')}>{num(margin!, lang, 1)}%</b>
            </span>
            <span>
              <span className="text-muted">{t('profit')}</span> <b className={cn('font-semibold', profit < 0 ? 'text-red-700' : 'text-ink')}>{fmt(profit)}</b>
            </span>
          </span>
        )}
      </div>
      <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-snug text-muted">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
        {t('price_note')}
      </p>
    </Card>
  );
}
