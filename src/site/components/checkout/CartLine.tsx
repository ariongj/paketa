import { Link } from 'react-router';
import { BadgePercent, Boxes, Package, Plus, Stamp, Trash2 } from 'lucide-react';
import { Img, QtyStepper } from '@/components/ui/misc';
import { Switch } from '@/components/ui/Field';
import { useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useUi } from '@/store/ui';
import { money, moneyPiece, pieces, unitLabel } from '@/lib/format';
import { nextTier, piecesFor, piecesPerUnit, type PricedLine } from '@/lib/pricing';
import { cn, round2 } from '@/lib/utils';
import { ck } from './dict';
import { usePacksLabel } from './parts';

/**
 * One cart line: packs × pack size = pieces, per-piece + per-pack price, volume tier badge and
 * next-tier nudge, "+1 karton" shortcut and the logo-print add-on. `compact` = cart drawer.
 */
export function CartLine({ line, compact }: { line: PricedLine; compact?: boolean }) {
  const t = useDict(ck);
  const tc = useDict(common);
  const l = useL();
  const lang = useLang();
  const packs = usePacksLabel();
  const setQty = useUi((s) => s.setQty);
  const remove = useUi((s) => s.removeFromCart);
  const setInstallation = useUi((s) => s.setInstallation);
  const setCartOpen = useUi((s) => s.setCartOpen);

  const p = line.product;
  const qty = line.item.qty;
  const key = line.item.key;
  const isPack = p.unit === 'pack' && !!p.packSize;
  const ppu = piecesPerUnit(p);
  const carton = p.cartonPacks && p.cartonPacks > 1 ? p.cartonPacks : 0;
  const lineRegular = round2(line.regularUnitPrice * qty);
  const next = nextTier(p, qty);
  const addForNext = next ? next.minQty - qty : 0;
  const logo = p.installation?.available ? p.installation : null;
  const logoOn = line.item.installation && !!logo;
  const logoShort = logoOn && carton > 0 && qty < carton;
  const close = () => setCartOpen(false);

  const qtyText = isPack ? `${packs(qty)} · ${pieces(piecesFor(p, qty), lang)}` : `${qty} ${unitLabel(p.unit, lang)}`;

  return (
    <div className={compact ? 'py-4' : 'py-5 sm:py-6'}>
      <div className="flex gap-3.5 sm:gap-5">
        <Link
          to={`/produkt/${p.slug}`}
          onClick={close}
          className={cn('shrink-0 overflow-hidden rounded-2xl bg-sand ring-1 ring-line', compact ? 'h-[72px] w-[72px]' : 'h-20 w-20 sm:h-28 sm:w-28')}
        >
          <Img src={p.images[0]} small alt="" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/produkt/${p.slug}`}
                onClick={close}
                className={cn('line-clamp-2 font-semibold leading-snug text-ink transition-colors hover:text-brand-700', compact ? 'text-[14px]' : 'text-[15px] sm:text-[16px]')}
              >
                {l(p.name)}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12.5px]">
                <Package className="h-3.5 w-3.5 shrink-0 text-kraft" />
                <span className="font-semibold text-ink-soft tabular-nums">{qtyText}</span>
                {!compact && isPack && <span className="text-muted">· {t('packSize', { n: p.packSize! })}</span>}
                {!compact && <span className="text-muted/80 max-sm:hidden">· {p.sku}</span>}
              </p>
              {line.optionsLabel && <p className="mt-0.5 text-[12px] leading-snug text-muted">{line.optionsLabel}</p>}
            </div>
            <button
              type="button"
              onClick={() => remove(key)}
              className="-mr-1.5 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label={t('removeLine')}
              title={t('removeLine')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* prices */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {isPack && (
              <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold tabular-nums text-paper">{t('perPiece', { price: moneyPiece(line.unitPrice / ppu, lang) })}</span>
            )}
            <span className="text-[12.5px] tabular-nums text-muted">
              {isPack ? t('perPack', { price: money(line.unitPrice, lang) }) : `${money(line.unitPrice, lang)} / ${unitLabel(p.unit, lang)}`}
              {line.regularUnitPrice > line.unitPrice && <s className="ml-1.5 text-muted/60">{money(line.regularUnitPrice, lang)}</s>}
            </span>
            {line.tierPct > 0 && (
              <span className="inline-flex -rotate-2 items-center gap-1 rounded-md bg-lime px-1.5 py-0.5 text-[11px] font-extrabold text-ink shadow-[0_1px_0_rgb(15_29_22/0.12)]">
                <BadgePercent className="h-3 w-3" />
                {t('tierBadge', { pct: line.tierPct })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* controls span the full width on phones, align with the text column from sm up */}
      <div className={cn('min-w-0', compact ? 'sm:pl-[92px]' : 'sm:pl-[132px]')}>
        {/* quantity + total */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2">
            <QtyStepper size="sm" value={qty} onChange={(v) => setQty(key, v)} />
            {carton > 0 && (
              <button
                type="button"
                onClick={() => setQty(key, qty + carton)}
                title={t('addCartonTitle', { packs: packs(carton), pieces: pieces(carton * ppu, lang) })}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-ink/25 bg-white px-3 text-[12px] font-bold text-ink-soft transition-colors hover:border-brand-600 hover:text-brand-700"
              >
                <Boxes className="h-3.5 w-3.5" />
                {t('addCarton')}
              </button>
            )}
          </div>
          <div className="text-right leading-tight">
            <div className={cn('font-bold tabular-nums text-ink', compact ? 'text-[15px]' : 'text-[16.5px]')}>{money(line.lineTotal, lang)}</div>
            {lineRegular > line.lineTotal && <s className="text-[11.5px] tabular-nums text-muted/70">{money(lineRegular, lang)}</s>}
          </div>
        </div>

        {/* next volume tier */}
        {next && addForNext > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-brand-600/30 bg-brand-50/70 py-1.5 pl-3 pr-1.5">
            <span className="flex min-w-0 items-center gap-2 text-[12.5px] font-medium leading-snug text-brand-800">
              <BadgePercent className="h-3.5 w-3.5 shrink-0 text-brand-600" />
              {t(carton && next.minQty === carton ? 'nudgeCarton' : 'nudge', { packs: packs(addForNext), pct: next.pct })}
            </span>
            <button
              type="button"
              onClick={() => setQty(key, next.minQty)}
              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-brand-600 px-3 text-[11.5px] font-bold text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="h-3 w-3" strokeWidth={3} />
              {t('nudgeBtn')}
            </button>
          </div>
        )}

        {/* logo print */}
        {logoOn && logo && (
          <div className="mt-3 rounded-xl bg-pink-soft/70 px-3 py-2.5 ring-1 ring-inset ring-pink/25">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] font-semibold text-ink">
                <Stamp className="h-3.5 w-3.5 shrink-0 text-pink-ink" />
                {tc('installation')}
                <span className="font-medium tabular-nums text-pink-ink">{t('logoPerPack', { price: money(logo.price, lang) })}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2.5">
                <span className="text-[12.5px] font-bold tabular-nums text-ink">{money(line.installationTotal, lang)}</span>
                <Switch size="sm" checked onChange={(v) => setInstallation(key, v)} />
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-snug text-ink-soft/85">{t('logoNote')}</p>
            {logoShort && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-pink/40 pt-2 text-[11.5px] font-semibold text-pink-ink">
                <span>{t('logoMin', { packs: packs(carton) })}</span>
                <button type="button" onClick={() => setQty(key, carton)} className="underline decoration-pink-ink/40 underline-offset-2 hover:decoration-pink-ink">
                  {t('logoFill')}
                </button>
              </div>
            )}
          </div>
        )}
        {!logoOn && logo && !compact && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-sand/50 px-3 py-2">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-[12.5px] font-medium text-ink-soft">
              <Stamp className="h-3.5 w-3.5 shrink-0 text-muted" />
              {t('logoAdd')}
              <span className="tabular-nums text-muted">({t('logoPerPack', { price: money(logo.price, lang) })})</span>
            </span>
            <Switch size="sm" checked={false} onChange={(v) => setInstallation(key, v)} />
          </div>
        )}
      </div>
    </div>
  );
}
