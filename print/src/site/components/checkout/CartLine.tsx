import { useState } from 'react';
import { Link } from 'react-router';
import { Minus, Plus, Trash2, TrendingDown } from 'lucide-react';
import { Img, QtyStepper } from '@/components/ui/misc';
import { useDict, useL, useLang } from '@/i18n';
import { useUi } from '@/store/ui';
import { money } from '@/lib/format';
import { unitPrice, type PricedLine } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { isRun, qtyRules, qtyText, snapQty, unitMoney } from '@/site/components/product/print';
import { ck } from './dict';
import { LineArtwork } from './artwork';

/** Quantity control that respects the product's MOQ and step (re-priced by tier in the cart). */
export function LineQty({ line, size = 'md' }: { line: PricedLine; size?: 'sm' | 'md' }) {
  const t = useDict(ck);
  const lang = useLang();
  const setQty = useUi((s) => s.setQty);
  const p = line.product;
  const r = qtyRules(p);
  const qty = line.item.qty;
  const [draft, setDraft] = useState<string | null>(null);

  if (!isRun(p)) return <QtyStepper size="sm" value={qty} max={r.max} onChange={(v) => setQty(line.item.key, v)} />;

  const commit = () => {
    if (draft === null) return;
    const n = parseInt(draft.replace(/[^\d]/g, ''), 10);
    setQty(line.item.key, snapQty(Number.isNaN(n) ? r.min : n, r));
    setDraft(null);
  };
  const h = size === 'sm' ? 'h-9' : 'h-10';
  return (
    <div className={cn('inline-flex items-center rounded-full border border-line bg-white', h)} title={`${t('qtyMin', { n: qtyText(r.min, lang) })} · ${t('qtyStep', { n: qtyText(r.step, lang) })}`}>
      <button type="button" aria-label="−" disabled={qty <= r.min} onClick={() => setQty(line.item.key, snapQty(qty - r.step, r))} className="grid h-full w-8 place-items-center rounded-l-full text-ink-soft hover:text-ink disabled:opacity-30">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        inputMode="numeric"
        aria-label={t('pcs')}
        value={draft ?? qtyText(qty, lang)}
        onFocus={(e) => {
          setDraft(String(qty));
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
        className="h-full w-[68px] bg-transparent text-center font-mono text-[13px] font-medium tabular-nums text-ink outline-none"
      />
      <button type="button" aria-label="+" disabled={qty >= r.max} onClick={() => setQty(line.item.key, snapQty(qty + r.step, r))} className="grid h-full w-8 place-items-center rounded-r-full text-ink-soft hover:text-ink disabled:opacity-30">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Next quantity break above the current qty — "add 1.500 pcs and save 18%". */
function useNextTier(line: PricedLine) {
  const p = line.product;
  const next = [...(p.tiers ?? [])].sort((a, b) => a.qty - b.qty).find((x) => x.qty > line.item.qty);
  if (!next) return null;
  const nextUnit = unitPrice(p, line.item.options, next.qty);
  const pct = line.unitPrice > 0 ? Math.round((1 - nextUnit / line.unitPrice) * 100) : 0;
  return pct >= 5 ? { qty: next.qty, unit: nextUnit, pct, add: next.qty - line.item.qty } : null;
}

/** One cart line: thumb, name, options, artwork, quantity (MOQ/step), unit price, line total, design fee. */
export function CartLine({ line, compact, onNavigate }: { line: PricedLine; compact?: boolean; onNavigate?: () => void }) {
  const t = useDict(ck);
  const l = useL();
  const lang = useLang();
  const remove = useUi((s) => s.removeFromCart);
  const setQty = useUi((s) => s.setQty);
  const p = line.product;
  const run = isRun(p);
  const next = useNextTier(line);
  const to = `/produkt/${p.slug}`;

  return (
    <div className="flex gap-3.5 py-5 sm:gap-4">
      <Link to={to} onClick={onNavigate} className={cn('shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line', compact ? 'h-[72px] w-[72px]' : 'h-24 w-24 sm:h-28 sm:w-28')}>
        <Img src={p.images[0]} small alt="" className="h-full w-full object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={to} onClick={onNavigate} className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-ink hover:text-brand-700">
              {l(p.name)}
            </Link>
            {line.optionsLabel && <p className={cn('mt-1 text-[12.5px] leading-snug text-muted', compact && 'line-clamp-2')}>{line.optionsLabel}</p>}
          </div>
          <button onClick={() => remove(line.item.key)} className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink" aria-label={t('remove')} title={t('remove')}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5">
          <LineArtwork itemKey={line.item.key} art={line.item.artwork} product={p} compact={compact} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2.5">
            <LineQty line={line} size={compact ? 'sm' : 'md'} />
            <span className="font-mono text-[11.5px] tabular-nums text-muted">
              × {run ? unitMoney(line.unitPrice, lang) : money(line.unitPrice, lang)}
              {run && <span className="max-sm:hidden"> {t('perPiece')}</span>}
            </span>
          </div>
          <span className="text-[15px] font-semibold tabular-nums text-ink">{money(line.lineTotal, lang)}</span>
        </div>

        {line.installationTotal > 0 && (
          <div className="mt-1.5 flex justify-between gap-3 text-[12.5px] text-muted">
            <span>{t('design')}</span>
            <span className="font-mono tabular-nums text-ink-soft">+{money(line.installationTotal, lang)}</span>
          </div>
        )}

        {next && !compact && (
          <button
            type="button"
            onClick={() => setQty(line.item.key, next.qty)}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-medium text-brand-700 ring-1 ring-inset ring-brand-100 transition-colors hover:bg-brand-100"
            title={t('nextTier', { qty: qtyText(next.qty, lang), price: unitMoney(next.unit, lang) })}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            {t('nextTierCta', { n: qtyText(next.add, lang), pct: next.pct })}
          </button>
        )}
      </div>
    </div>
  );
}
