import { AlertTriangle, Boxes, Layers, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Card } from '@/admin/components/kit';
import { useDict, useLang } from '@/i18n';
import { money, moneyPiece, num } from '@/lib/format';
import type { Unit } from '@/lib/types';
import { cn, round2, uid } from '@/lib/utils';
import { pd } from './dict';
import { IconBtn, NumInput } from './parts';
import { cleanTiers, suggestedTiers, tierIssues, tiersOutOfOrder, type TierRow } from './model';
import { piecesPer, unitWord } from './units';

/**
 * Çmime shumice — volume tiers per cart line: "from N packs → −X %". Rows can be added, removed and edited;
 * invalid rows are flagged (and never stored), and every row previews the resulting price per pack and per piece.
 */
export function TiersCard({
  rows,
  onRows,
  price,
  onSale,
  unit,
  packSize,
  cartonPacks,
}: {
  rows: TierRow[];
  onRows: (rows: TierRow[]) => void;
  /** Active selling price per unit (sale price when on sale), null = not set yet */
  price: number | null;
  onSale: boolean;
  unit: Unit;
  packSize: number | null;
  cartonPacks: number | null;
}) {
  const t = useDict(pd, 'admin');
  const lang = useLang('admin');
  const issues = tierIssues(rows);
  const valid = cleanTiers(rows);
  const outOfOrder = tiersOutOfOrder(valid);
  const per = piecesPer({ unit, packSize });
  const showPiece = unit === 'pack' && per > 1;
  const carton = unit === 'pack' && cartonPacks && cartonPacks > 1 ? cartonPacks : null;
  const p = price && price > 0 ? price : null;
  const word = unitWord(unit, 2, lang);

  const set = (id: string, patch: Partial<TierRow>) => onRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const add = (minQty?: number, pct?: number) => {
    const last = valid[valid.length - 1];
    const nextMin = minQty ?? (last ? last.minQty * 2 : 10);
    const nextPct = pct ?? (last ? Math.min(90, last.pct + 5) : 5);
    onRows([...rows, { id: uid('tier'), minQty: nextMin, pct: nextPct }]);
  };
  const suggest = () => onRows(suggestedTiers(carton).map((x) => ({ id: uid('tier'), ...x })));
  const hasCartonTier = !!carton && rows.some((r) => r.minQty === carton);
  const tierPrice = (pct: number | null) => (p && pct != null && pct > 0 && pct < 100 ? round2(p * (1 - pct / 100)) : null);

  return (
    <Card
      title={t('c_tiers')}
      description={t('c_tiers_d')}
      actions={valid.length > 0 && <span className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[11.5px] font-bold tabular-nums text-ink-soft">{valid.length}</span>}
      padded={false}
    >
      <div className="p-4 sm:p-5">
        {rows.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-4 text-[13px] text-muted sm:flex-row sm:items-center">
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-ink-soft ring-1 ring-line">
                <Layers className="h-4 w-4" />
              </span>
              {t('tier_none')}
            </span>
            <span className="flex shrink-0 gap-2">
              <button type="button" onClick={suggest} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[12.5px] font-semibold text-ink transition hover:border-ink/30">
                <Sparkles className="h-3.5 w-3.5" /> {t('tier_suggest')}
              </button>
              <button type="button" onClick={() => add()} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-2.5 text-[12.5px] font-semibold text-paper transition hover:bg-ink-soft">
                <Plus className="h-3.5 w-3.5" /> {t('tier_add')}
              </button>
            </span>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            {/* head */}
            <div className="flex items-center gap-3 border-b border-line/70 bg-canvas/50 px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted max-sm:hidden">
              <span className="w-[150px] shrink-0">{t('tier_from')}</span>
              <span className="w-[112px] shrink-0">{t('tier_pct')}</span>
              <span className="min-w-0 flex-1 text-right">{t('tier_price')}</span>
              <span className="w-8 shrink-0" />
            </div>
            {/* base price row */}
            <div className="flex items-center gap-3 border-b border-line/60 bg-canvas/30 px-3 py-2.5 text-[13px]">
              <span className="w-[150px] shrink-0 font-medium text-ink-soft max-sm:flex-1">
                1+ {word}
                <span className="ml-1.5 text-[11.5px] font-normal text-muted">{t('tier_base')}</span>
              </span>
              <span className="w-[112px] shrink-0 text-muted max-sm:hidden">—</span>
              <PricePreview price={p} per={showPiece ? per : 0} lang={lang} unit={unit} />
              <span className="w-8 shrink-0" />
            </div>
            <ul className="divide-y divide-line/60">
              {rows.map((r) => {
                const issue = issues[r.id];
                const tp = tierPrice(issue === 'min' ? null : r.pct);
                return (
                  <li key={r.id} className={cn('px-3 py-2.5', issue && 'bg-red-50/40')}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap">
                      <div className="flex w-[150px] shrink-0 items-center gap-1.5">
                        <span className="text-[12.5px] font-semibold text-muted">{t('tier_from')}</span>
                        <NumInput
                          size="sm"
                          integer
                          value={r.minQty}
                          onChange={(v) => set(r.id, { minQty: v })}
                          suffix={word}
                          placeholder="10"
                          invalid={issue === 'min' || issue === 'dup'}
                          aria-label={t('tier_from')}
                          wrapClassName="flex-1"
                        />
                      </div>
                      <div className="w-[112px] shrink-0">
                        <NumInput size="sm" value={r.pct} onChange={(v) => set(r.id, { pct: v })} prefix="−" suffix="%" placeholder="5" invalid={issue === 'pct'} aria-label={t('tier_pct')} />
                      </div>
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 max-sm:order-last max-sm:basis-full">
                        {carton && r.minQty === carton && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft">
                            <Boxes className="h-3 w-3" /> {t('tier_isCarton')}
                          </span>
                        )}
                        <PricePreview price={issue ? null : tp} per={showPiece ? per : 0} lang={lang} unit={unit} strong />
                      </div>
                      <IconBtn label={t('tier_remove')} onClick={() => onRows(rows.filter((x) => x.id !== r.id))} danger className="max-sm:ml-auto">
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                    </div>
                    {issue && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {t(issue === 'min' ? 'tier_e_min' : issue === 'pct' ? 'tier_e_pct' : 'tier_e_dup')} {t('tier_invalid')}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => add()} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-[12.5px] font-semibold text-paper transition hover:bg-ink-soft">
              <Plus className="h-3.5 w-3.5" /> {t('tier_add')}
            </button>
            {carton && !hasCartonTier && (
              <button
                type="button"
                onClick={() => add(carton, Math.min(90, (valid[valid.length - 1]?.pct ?? 5) + 5))}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[12.5px] font-semibold text-ink-soft transition hover:border-ink/30 hover:text-ink"
              >
                <Boxes className="h-3.5 w-3.5" /> {t('tier_addCarton')} · {num(carton, lang)} {word}
              </button>
            )}
          </div>
        )}

        {(outOfOrder || (onSale && valid.length > 0)) && (
          <div className="mt-3 space-y-1.5">
            {outOfOrder && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] font-medium text-amber-900 ring-1 ring-inset ring-amber-600/20">
                <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" /> {t('tier_w_order')}
              </p>
            )}
            {onSale && valid.length > 0 && <p className="text-[12.5px] text-muted">{t('tier_onSale')}</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function PricePreview({ price, per, lang, unit, strong }: { price: number | null; per: number; lang: 'me' | 'sq' | 'en'; unit: Unit; strong?: boolean }) {
  if (price == null) return <span className="min-w-0 flex-1 text-right text-[13px] text-muted">—</span>;
  return (
    <span className="min-w-0 flex-1 text-right tabular-nums">
      <span className={cn('text-[13px]', strong ? 'font-semibold text-ink' : 'text-ink-soft')}>
        {money(price, lang)} <span className="text-[12px] font-normal text-muted">/ {unitWord(unit, 1, lang)}</span>
      </span>
      {per > 1 && <span className="block text-[11.5px] text-muted">{moneyPiece(price / per, lang)} / {unitWord('kom', 1, lang)}</span>}
    </span>
  );
}
