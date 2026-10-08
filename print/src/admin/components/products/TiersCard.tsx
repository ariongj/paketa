import { AlertTriangle, ArrowDownWideNarrow, Layers, Plus, Store, X, XCircle } from 'lucide-react';
import { Card } from '@/admin/components/kit';
import { Switch } from '@/components/ui/Field';
import { useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { money, num, perUnit } from '@/lib/format';
import type { Unit } from '@/lib/types';
import { cn, uid } from '@/lib/utils';
import { pd, type PdKey } from './dict';
import { FormField, IconBtn, NumInput } from './parts';
import { checkTiers, cleanTiers, nextRun, qtyLabel, roundUnit, unitMoney, unitWord, type TierIssue, type TierRow } from './model';

const ORDER_ISSUES: TierIssue[] = ['qtyOrder', 'priceOrder'];
const GRID = 'grid grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-x-2 gap-y-1.5 sm:grid-cols-[24px_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1.6fr)_60px_32px]';

/**
 * "Çmimet sipas sasisë" — print runs are priced per piece in quantity breaks (ascending quantity,
 * non-increasing unit price). Each row previews the run value; MOQ and the quantity step drive the
 * storefront configurator. The first tier is the product's base price (`price`).
 */
export function TiersCard({
  rows,
  onRows,
  onEnable,
  onDisable,
  moq,
  onMoq,
  step,
  onStep,
  unit,
  price,
  optionsFrom,
  leadDays,
  quote,
  showMissing,
  focusId,
  onFocusId,
}: {
  rows: TierRow[];
  onRows: (rows: TierRow[]) => void;
  onEnable: () => void;
  onDisable: () => void;
  moq: number | null;
  onMoq: (v: number | null) => void;
  step: number | null;
  onStep: (v: number | null) => void;
  unit: Unit;
  /** single price (no tiers) */
  price: number | null;
  /** cheapest option surcharges (can be negative) — the storefront "from" price includes them */
  optionsFrom: number;
  leadDays: number | null;
  /** quote-only template: the storefront hides prices */
  quote: boolean;
  /** show "missing value" errors (after a save attempt) */
  showMissing: boolean;
  /** price input to focus (a freshly added row) */
  focusId: string | null;
  onFocusId: (id: string | null) => void;
}) {
  const t = useDict(pd, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const on = rows.length > 0;
  const issues = checkTiers(rows);
  const shown = issues.map((i) => (i && (ORDER_ISSUES.includes(i) || showMissing) ? i : null));
  const clean = cleanTiers(rows);
  const first = clean[0];
  const last = clean[clean.length - 1];
  const hasQtyOrder = issues.includes('qtyOrder');
  const moqAbove = !!first && moq != null && moq > first.qty;
  const startQty = moq ?? first?.qty ?? step ?? 1;

  const patch = (id: string, p: Partial<TierRow>) => onRows(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const add = () => {
    const maxQty = Math.max(0, ...rows.map((r) => r.qty ?? 0));
    const row: TierRow = { id: uid('tier'), qty: nextRun(maxQty), price: null };
    onFocusId(row.id);
    onRows([...rows, row]);
  };
  const sort = () => onRows([...rows].sort((a, b) => (a.qty ?? Infinity) - (b.qty ?? Infinity)));

  const priceText = first ? `${t('fromPrice', { price: unitMoney(roundUnit(last.price + optionsFrom), lang) })} ${perUnit(unit, lang)}` : price ? `${unitMoney(price, lang)} ${perUnit(unit, lang)}` : null;
  const storefront = quote
    ? t('quoteBadge_h')
    : [
        priceText,
        priceText ? tc('exclVat') : null,
        minQtyText(),
        leadDays ? t('leadShort', { n: leadDays }) : null,
      ]
        .filter(Boolean)
        .join(' · ');

  function minQtyText() {
    const m = moq ?? first?.qty ?? 1;
    return m > 1 ? t('moqShort', { qty: qtyLabel(m, unit, lang) }) : null;
  }

  return (
    <Card
      title={t('c_tiers')}
      description={t('c_tiers_d')}
      padded={false}
      actions={<Switch size="sm" checked={on} onChange={(v) => (v ? onEnable() : onDisable())} label={<span className="text-[12.5px] font-semibold text-ink-soft max-sm:sr-only">{t('tiers_switch')}</span>} />}
    >
      <div className="p-4 sm:p-5">
        {on ? (
          <div className="overflow-hidden rounded-xl border border-line">
            {/* head */}
            <div className={cn(GRID, 'border-b border-line/70 bg-canvas/60 px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted max-sm:hidden')}>
              <span>#</span>
              <span>{t('t_qty')}</span>
              <span>{t('t_price')}</span>
              <span>{t('t_value')}</span>
              <span className="text-right">{t('t_saving')}</span>
              <span />
            </div>
            <ol className="divide-y divide-line/60">
              {rows.map((r, i) => {
                const issue = shown[i];
                const valid = r.qty != null && r.qty >= 1 && r.price != null && r.price > 0;
                const saving = valid && i > 0 && first && first.price > 0 ? Math.round((1 - (r.price as number) / first.price) * 100) : 0;
                const qtyBad = issue === 'qtyMissing' || issue === 'qtyOrder';
                const priceBad = issue === 'priceMissing' || issue === 'priceOrder';
                return (
                  <li key={r.id} className={cn('px-3 py-2.5', issue && 'bg-red-50/40')}>
                    <div className={GRID}>
                      <span className={cn('grid h-6 w-6 place-items-center rounded-md text-[11px] font-bold tabular-nums', i === 0 ? 'bg-ink text-paper' : 'bg-ink/[0.06] text-ink-soft')} title={i === 0 ? t('tiers_baseNote') : undefined}>
                        {i + 1}
                      </span>
                      <NumInput
                        size="sm"
                        integer
                        grouped
                        value={r.qty}
                        onChange={(qty) => patch(r.id, { qty })}
                        suffix={unitWord(unit, lang)}
                        placeholder={num(nextRun(rows[i - 1]?.qty ?? 0), lang)}
                        invalid={qtyBad}
                        className="tabular-nums"
                        aria-label={`${t('t_qty')} ${i + 1}`}
                      />
                      <NumInput
                        size="sm"
                        money
                        value={r.price}
                        onChange={(price) => patch(r.id, { price })}
                        prefix="€"
                        placeholder={rows[i - 1]?.price != null ? String(rows[i - 1].price).replace('.', lang === 'en' ? '.' : ',') : lang === 'en' ? '0.00' : '0,00'}
                        invalid={priceBad}
                        className="font-semibold tabular-nums"
                        autoFocus={focusId === r.id}
                        onBlur={() => focusId === r.id && onFocusId(null)}
                        aria-label={`${t('t_price')} ${i + 1}`}
                      />
                      <div className="min-w-0 truncate text-[12.5px] tabular-nums text-ink-soft max-sm:order-last max-sm:col-span-3 max-sm:col-start-2">
                        {valid ? (
                          <>
                            {qtyLabel(r.qty as number, unit, lang)} × {unitMoney(r.price as number, lang)} = <b className="font-semibold text-ink">{money((r.qty as number) * (r.price as number), lang)}</b>
                            {saving > 0 && <span className="ml-1.5 text-muted sm:hidden">(−{saving}%)</span>}
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </div>
                      <span className="text-right max-sm:hidden">
                        {i === 0 ? (
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t('t_base')}</span>
                        ) : saving > 0 ? (
                          <span className="inline-flex rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums text-ink">−{saving}%</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </span>
                      <IconBtn label={t('removeTier')} onClick={() => onRows(rows.filter((x) => x.id !== r.id))} disabled={rows.length <= 1} danger>
                        <X className="h-4 w-4" />
                      </IconBtn>
                    </div>
                    {issue && (
                      <p className="mt-1.5 flex items-start gap-1.5 pl-8 text-[12px] font-medium text-red-700" role="alert">
                        <XCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                        {t(`tier_${issue}` as PdKey)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap items-center gap-2 border-t border-line/70 bg-canvas/40 px-3 py-2.5">
              <button type="button" onClick={add} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-[12.5px] font-semibold text-paper transition hover:bg-ink-soft">
                <Plus className="h-3.5 w-3.5" /> {t('addTier')}
              </button>
              {hasQtyOrder && (
                <button type="button" onClick={sort} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[12.5px] font-semibold text-ink hover:border-ink/30">
                  <ArrowDownWideNarrow className="h-3.5 w-3.5" /> {t('sortTiers')}
                </button>
              )}
              <span className="text-[12px] text-muted sm:ml-auto">{t('tiers_baseNote')}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-4 sm:flex-row sm:items-center">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-ink-soft ring-1 ring-line">
              <Layers className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-ink">{t('tiers_off_title')}</div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{quote ? t('tiers_off_quote') : t('tiers_off_text')}</p>
            </div>
            <button type="button" onClick={onEnable} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 text-[12.5px] font-semibold text-paper transition hover:bg-ink-soft">
              <Plus className="h-3.5 w-3.5" /> {t('tiers_enable')}
            </button>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FormField
            label={t('f_moq')}
            hint={
              moqAbove ? (
                <span className="flex items-start gap-1.5 font-medium text-amber-800">
                  <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" /> {t('moq_aboveTier', { qty: qtyLabel(moq as number, unit, lang) })}
                </span>
              ) : first ? (
                t('f_moq_h', { qty: qtyLabel(first.qty, unit, lang) })
              ) : (
                t('f_moq_h_none')
              )
            }
          >
            <NumInput integer grouped zeroAsEmpty value={moq} onChange={onMoq} suffix={unitWord(unit, lang)} placeholder={first ? num(first.qty, lang) : '—'} aria-label={t('f_moq')} />
          </FormField>
          <FormField
            label={t('f_step')}
            hint={step && step > 1 ? t('f_step_h', { seq: [0, 1, 2].map((k) => num(startQty + k * step, lang)).join(' → ') }) : t('f_step_h_none')}
          >
            <NumInput integer grouped zeroAsEmpty value={step} onChange={onStep} suffix={unitWord(unit, lang)} placeholder="1" aria-label={t('f_step')} />
          </FormField>
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-lg bg-canvas/80 px-3.5 py-2.5 text-[12.5px] text-ink-soft">
          <Store className="mt-px h-3.5 w-3.5 shrink-0 text-muted" />
          <span>
            <span className="font-semibold text-ink">{t('storefront')}:</span> {storefront}
          </span>
        </p>
      </div>
    </Card>
  );
}
