import { AlertTriangle, Calculator, PackagePlus } from 'lucide-react';
import { QtyStepper } from '@/components/ui/misc';
import { useDict, useLang } from '@/i18n';
import { cartonLabel, num, pieces, piecesLabel, unitLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PD } from './dict';
import { cartonSplit, type Configurator } from './useConfigurator';

/** Quantity in packs with a "+ 1 karton" shortcut, the pieces → packs calculator and stock limits. */
export function QuantityPicker({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const p = cfg.product;
  const split = cartonSplit(cfg.qty, cfg.cartonPacks);
  const atMax = cfg.maxQty < 999 && cfg.qty >= cfg.maxQty;

  const breakdown =
    cfg.cartonPacks && split.full > 0
      ? split.rest > 0
        ? t('breakdown', { full: split.full, cw: cartonLabel(split.full, lang), rest: split.rest })
        : t('breakdownFull', { full: split.full, cw: cartonLabel(split.full, lang) })
      : '';

  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-[14px] font-bold text-ink">{t('qtyLabel')}</span>
          {cfg.isPack && cfg.cartonPacks > 0 && (
            <span className="text-[12.5px] font-medium tabular-nums text-muted">{t('cartonInfo', { packs: cfg.cartonPacks, pieces: pieces(cfg.cartonPacks * cfg.packSize, lang) })}</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <QtyStepper value={cfg.qty} onChange={cfg.setQty} min={cfg.minQty} max={cfg.maxQty} className="h-12! bg-paper/40 [&_input]:w-12 [&_input]:text-[15px]" />
          <span className="text-[14px] font-semibold text-ink-soft">{cfg.isPack ? t('qtyPacks') : unitLabel(p.unit, lang)}</span>
          {cfg.cartonPacks > 0 && (
            <button
              type="button"
              onClick={cfg.addCarton}
              disabled={atMax}
              title={t('addCartonHint', { packs: cfg.cartonPacks })}
              className="ml-auto inline-flex h-12 items-center gap-2 rounded-full border border-dashed border-brand-600/45 bg-brand-50 px-4 text-[13.5px] font-bold text-brand-700 transition-colors hover:border-brand-600 hover:bg-brand-100 disabled:opacity-40 max-[380px]:ml-0"
            >
              <PackagePlus className="h-4 w-4" />
              {t('addCarton')}
            </button>
          )}
        </div>
        {cfg.isPack && (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] tabular-nums text-muted">
            <span className="font-semibold text-ink">{t('equals', { pieces: pieces(cfg.totalPieces, lang) })}</span>
            {breakdown && <span>· {breakdown}</span>}
          </div>
        )}
        {atMax && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" /> {t('maxStock', { n: cfg.maxQty })}
          </div>
        )}
      </div>

      {cfg.isPack && <PiecesCalculator cfg={cfg} />}
    </div>
  );
}

function PiecesCalculator({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const suggested = cfg.suggestedPacks;
  const covered = suggested * cfg.packSize;
  const spare = covered - cfg.piecesNum;
  const manual = cfg.piecesNum > 0 && cfg.qty !== suggested;

  return (
    <div className="border-t border-dashed border-line bg-paper/60 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime text-ink">
          <Calculator className="h-[17px] w-[17px]" />
        </span>
        <div className="min-w-0">
          <label htmlFor="pieces-calc" className="block text-[14px] font-bold text-ink">
            {t('calcTitle')}
          </label>
          <span className="block text-[12.5px] leading-snug text-muted">{t('calcText')}</span>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <span className="relative block w-[170px]">
          <input
            id="pieces-calc"
            inputMode="numeric"
            autoComplete="off"
            value={cfg.pieces ? num(Number(cfg.pieces), lang, 0) : ''}
            placeholder={t('calcPh')}
            onChange={(e) => cfg.setPieces(e.target.value)}
            className="h-11 w-full rounded-full border border-line bg-white pl-4 pr-14 text-[15px] font-semibold tabular-nums text-ink outline-none transition placeholder:font-medium placeholder:text-muted/60 focus:border-brand-600/50 focus:ring-4 focus:ring-brand-600/10"
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[13px] font-semibold text-muted">{piecesLabel(lang)}</span>
        </span>
        {cfg.piecesNum > 0 && (
          <div className="min-w-0 animate-fade-in">
            <div className="text-[15px] font-bold tabular-nums text-ink">→ {t('calcResult', { packs: suggested, pieces: pieces(covered, lang) })}</div>
            <div className={cn('text-[12.5px] font-medium tabular-nums', spare > 0 ? 'text-muted' : 'text-brand-700')}>
              {spare > 0 ? t('calcExtra', { n: num(spare, lang, 0) }) : t('calcExact')}
              {manual && (
                <button type="button" onClick={() => cfg.setQty(suggested)} className="ml-2 font-bold text-brand-700 underline decoration-brand-600/30 underline-offset-2 hover:decoration-brand-600">
                  {t('calcUse', { packs: suggested })}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
