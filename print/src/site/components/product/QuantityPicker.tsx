import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Info, Minus, PencilLine, Plus } from 'lucide-react';
import { QtyStepper } from '@/components/ui/misc';
import { useDict, useLang } from '@/i18n';
import { cn } from '@/lib/utils';
import { PD } from './dict';
import { defaultQty, qtyText, unitMoney } from './print';
import type { Configurator } from './useConfigurator';
import { TierTable } from './TierTable';

const reveal = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
};

/** Tier chips (quantity → price per piece), a custom quantity that respects MOQ & step, and the full table. */
export function QuantityPicker({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const p = cfg.product;
  const onTier = cfg.tiers.some((x) => x.qty === cfg.qty);
  const [custom, setCustom] = useState(!onTier);
  const [table, setTable] = useState(false);
  const popular = defaultQty(p);

  if (!cfg.run) {
    const stock = p.stock > 0 && p.stock < 999;
    return (
      <div className="flex flex-wrap items-center gap-3">
        <QtyStepper value={cfg.qty} onChange={(n) => cfg.setQty(n)} max={cfg.rules.max} />
        {stock && <span className="text-[13px] font-medium text-emerald-700">{p.stock <= 10 ? t('lowStock', { n: p.stock }) : t('inStock')}</span>}
      </div>
    );
  }

  const customActive = custom || !onTier;

  return (
    <div>
      {cfg.tiers.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {cfg.tiers.map((row) => {
            const on = !custom && row.qty === cfg.qty;
            return (
              <button
                key={row.qty}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setCustom(false);
                  cfg.setQty(row.qty);
                }}
                className={cn(
                  'relative flex flex-col items-start rounded-xl border px-3 pb-2.5 pt-3 text-left transition-all duration-200',
                  on ? 'border-ink bg-ink text-paper shadow-[0_14px_26px_-16px_rgb(18_16_20/0.9)]' : 'border-line bg-white hover:border-ink/35',
                )}
              >
                {row.qty === popular && (
                  <span className={cn('absolute -top-2 right-2 rounded-full px-1.5 py-px font-mono text-[9px] font-medium uppercase tracking-[0.08em]', on ? 'bg-brand-500 text-white' : 'bg-brand-600 text-white')}>
                    {t('popular')}
                  </span>
                )}
                <span className="font-mono text-[15px] font-medium tabular-nums leading-none">{qtyText(row.qty, lang)}</span>
                <span className={cn('mt-1.5 text-[12px] font-semibold tabular-nums', on ? 'text-paper' : 'text-ink')}>
                  {unitMoney(row.unit, lang)}
                  <span className={cn('font-medium', on ? 'text-paper/55' : 'text-muted')}> {t('perPiece')}</span>
                </span>
                <span className={cn('mt-0.5 font-mono text-[10px] tabular-nums', row.save ? (on ? 'text-brand-200' : 'text-brand-700') : 'opacity-0')}>−{row.save}%</span>
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={customActive}
            onClick={() => setCustom(true)}
            className={cn(
              'flex flex-col items-start justify-center gap-1 rounded-xl border border-dashed px-3 py-2.5 text-left transition-all duration-200',
              customActive ? 'border-ink bg-white shadow-[0_0_0_1px_var(--color-ink)]' : 'border-ink/25 bg-white/60 hover:border-ink/50',
            )}
          >
            <PencilLine className="h-4 w-4 text-ink-soft" />
            <span className="text-[12.5px] font-semibold leading-tight text-ink">{t('customQty')}</span>
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {(customActive || !cfg.tiers.length) && (
          <motion.div {...reveal} className="overflow-hidden">
            <CustomQty cfg={cfg} />
          </motion.div>
        )}
      </AnimatePresence>

      {cfg.tiers.length > 1 && (
        <div className="mt-3">
          <button type="button" onClick={() => setTable((v) => !v)} aria-expanded={table} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft hover:text-ink">
            {t('showTable')}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', table && 'rotate-180')} />
          </button>
          <AnimatePresence initial={false}>
            {table && (
              <motion.div {...reveal} className="overflow-hidden">
                <TierTable
                  cfg={cfg}
                  compact
                  className="mt-3"
                  onPick={(q) => {
                    setCustom(false);
                    cfg.setQty(q);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/** Free quantity entry — stepper by the product's step, snapped to MOQ / step on blur. */
function CustomQty({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const { min, step, max } = cfg.rules;
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = parseInt(draft.replace(/[^\d]/g, ''), 10);
    cfg.setQty(Number.isNaN(n) ? min : n);
    setDraft(null);
  };
  const n = cfg.qtyNotice;
  const notice = n ? (n.kind === 'min' ? t('qtyMin', { n: qtyText(n.n, lang) }) : n.kind === 'max' ? t('qtyMaxStock', { n: qtyText(n.n, lang) }) : t('qtySnapped', { n: qtyText(n.n, lang), step: qtyText(step, lang) })) : null;

  return (
    <div className="pt-3">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-2 pr-4 ring-1 ring-line">
        <div className="flex h-11 items-center rounded-xl bg-paper ring-1 ring-inset ring-line">
          <button type="button" aria-label="−" disabled={cfg.qty <= min} onClick={() => cfg.setQty(cfg.qty - step)} className="grid h-full w-10 place-items-center text-ink-soft hover:text-ink disabled:opacity-30">
            <Minus className="h-4 w-4" />
          </button>
          <input
            inputMode="numeric"
            aria-label={t('customQtyLabel')}
            value={draft ?? qtyText(cfg.qty, lang)}
            onFocus={(e) => {
              setDraft(String(cfg.qty));
              requestAnimationFrame(() => e.target.select());
            }}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
            className="h-full w-24 bg-transparent text-center font-mono text-[16px] font-medium tabular-nums text-ink outline-none"
          />
          <button type="button" aria-label="+" disabled={cfg.qty >= max} onClick={() => cfg.setQty(cfg.qty + step)} className="grid h-full w-10 place-items-center text-ink-soft hover:text-ink disabled:opacity-30">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-0 text-[12.5px] leading-snug">
          <div className="font-semibold text-ink">
            {t('pcsValue', { n: qtyText(cfg.qty, lang) })} × {unitMoney(cfg.unitPrice, lang)}
          </div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">{t('qtyRule', { min: qtyText(min, lang), step: qtyText(step, lang) })}</div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {notice && (
          <motion.p {...reveal} className="overflow-hidden">
            <span className="mt-2 flex items-start gap-1.5 text-[12.5px] font-medium text-amber-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {notice}
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
