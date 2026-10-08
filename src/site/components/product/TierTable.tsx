import { Layers, Sparkles, TrendingDown } from 'lucide-react';
import { useDict, useLang } from '@/i18n';
import { cartonLabel, money, moneyPiece } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PD, pctOff } from './dict';
import type { Configurator } from './useConfigurator';

/** "Çmime shumice" — volume tiers for one cart line; the active row follows the quantity. */
export function TierTable({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  if (!cfg.tierRows.length) return null;
  const activeIdx = cfg.tierRows.reduce((acc, r, i) => (cfg.qty >= r.min ? i : acc), 0);
  const next = cfg.nextTier;
  const missing = next ? next.minQty - cfg.qty : 0;
  const top = cfg.tierRows[cfg.tierRows.length - 1];

  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
      <div className="flex items-start gap-3 px-4 pb-3 pt-4 sm:px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Layers className="h-[17px] w-[17px]" />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-ink">{t('tiersTitle')}</div>
          <div className="text-[12.5px] leading-snug text-muted">{t('tiersText')}</div>
        </div>
      </div>

      <div role="table" className="px-2 pb-2 sm:px-2.5">
        <div role="row" className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 px-2.5 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted sm:px-3">
          <span role="columnheader">{t('tierQty')}</span>
          <span role="columnheader" className="text-right">{t('tierPrice')}</span>
          <span role="columnheader" className="text-right">{cfg.isPack ? t('tierPiece') : ''}</span>
        </div>
        {cfg.tierRows.map((r, i) => {
          const on = i === activeIdx;
          const cartons = cfg.cartonPacks && r.min > 1 && r.min % cfg.cartonPacks === 0 ? r.min / cfg.cartonPacks : 0;
          return (
            <button
              key={r.min}
              type="button"
              role="row"
              onClick={() => cfg.setQty(Math.max(r.min, cfg.minQty))}
              aria-current={on}
              className={cn(
                'relative grid w-full grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left text-[13.5px] transition-colors sm:px-3',
                on ? 'bg-lime-soft ring-1 ring-inset ring-lime-ink/15' : 'hover:bg-paper',
              )}
            >
              <span role="cell" className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className={cn('font-semibold tabular-nums', on ? 'text-ink' : 'text-ink-soft')}>
                  {r.max == null ? t('tierFrom', { a: r.min }) : r.max === r.min ? t('tierFrom', { a: r.min }).replace('+', '') : t('tierRange', { a: r.min, b: r.max })}
                </span>
                {cartons > 0 && <span className="text-[11.5px] font-semibold text-muted">· {t('tierCarton', { n: cartons, cw: cartonLabel(cartons, lang) })}</span>}
              </span>
              <span role="cell" className="flex items-center justify-end gap-1.5">
                {r.pct > 0 ? (
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums', on ? 'bg-pink text-white' : 'bg-pink-soft text-pink-ink')}>{pctOff(r.pct, lang)}</span>
                ) : (
                  <span className="text-[11px] font-medium text-muted max-sm:hidden">{t('tierBase')}</span>
                )}
                <span className={cn('font-bold tabular-nums', on ? 'text-ink' : 'text-ink-soft')}>{money(r.price, lang)}</span>
              </span>
              <span role="cell" className={cn('text-right text-[12.5px] font-semibold tabular-nums', on ? 'text-lime-ink' : 'text-muted')}>
                {cfg.isPack ? moneyPiece(r.piece, lang) : ''}
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-dashed border-line px-4 py-3 sm:px-5">
        {next ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
              <TrendingDown className="h-4 w-4 text-pink-ink" />
              {t('nextTier', { n: missing, pct: pctOff(next.pct, lang) })}
            </span>
            <button
              type="button"
              onClick={() => cfg.setQty(next.minQty)}
              disabled={next.minQty > cfg.maxQty}
              className="inline-flex h-8 items-center rounded-full bg-ink px-3.5 text-[12.5px] font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
            >
              {t('nextTierAdd', { n: missing })}
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-700">
            <Sparkles className="h-4 w-4" /> {t('tierReached', { pct: pctOff(top.pct, lang) })}
          </span>
        )}
      </div>
    </div>
  );
}
