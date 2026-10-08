import { Fragment, useCallback, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { AlertCircle, Check, ChevronDown, Package, Receipt, ShieldCheck, Stamp, TicketPercent, Truck, X } from 'lucide-react';
import { Img } from '@/components/ui/misc';
import { useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useUi } from '@/store/ui';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { money, moneyPiece, pieces } from '@/lib/format';
import { piecesFor, piecesPerUnit, type PricedLine, type Totals } from '@/lib/pricing';
import { discountState, normalizeCode, type RejectedDiscount } from '@/lib/discounts';
import type { AppliedDiscount, Order } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ck, packsKey, pluralKey } from './dict';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** "4 produkte" / "4 products" / "4 proizvoda" — number of cart lines */
export function useItemsLabel() {
  const t = useDict(ck);
  const lang = useLang();
  return useCallback((n: number) => t(pluralKey(n, lang), { n }), [t, lang]);
}

/** "20 pako" / "20 packs" / "20 pakovanja" */
export function usePacksLabel() {
  const t = useDict(ck);
  const lang = useLang();
  return useCallback((n: number) => t(packsKey(n, lang), { n: n.toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE') }), [t, lang]);
}

/** Zone delivery time ("1" / "1–3") → "1 ditë pune" / "1 working day" / "1–3 radna dana". */
export function useWorkDays() {
  const t = useDict(ck);
  return useCallback((days: string | number) => t(String(days).trim() === '1' ? 'workDays_one' : 'workDays_many', { days }), [t]);
}

/** Total packs in a priced cart (lines sold by the pack). */
export function packsIn(lines: PricedLine[]) {
  return lines.reduce((s, l) => s + (l.product.unit === 'pack' ? l.item.qty : 0), 0);
}

export function useCopy() {
  const t = useDict(ck);
  return async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable — still confirm, the value is visible on screen */
    }
    toast.success(t('copied'), { description: text });
  };
}

/** Shopper-facing title of a discount rule (public title from the CMS, falls back to the stored title). */
export function useDiscountTitle() {
  const discounts = useDb((s) => s.discounts);
  const l = useL();
  const t = useDict(ck);
  return useCallback(
    (id?: string, fallback?: string) => {
      const d = id ? discounts.find((x) => x.id === id) : undefined;
      return (d && l(d.publicTitle)) || fallback || t('discountFallback');
    },
    [discounts, l, t],
  );
}

/* ------------------------------------------------------------------ */
/* Stepper: Shporta → Të dhënat → Pagesa → Konfirmimi                   */
/* ------------------------------------------------------------------ */
/** current = index of the active step; 4 = every step completed. */
export function CheckoutSteps({ current, className }: { current: 0 | 1 | 2 | 3 | 4; className?: string }) {
  const t = useDict(ck);
  const steps = [t('step_cart'), t('step_details'), t('step_payment'), t('step_done')];
  return (
    <nav aria-label={t('stepsLabel')} className={className}>
      <ol className="flex items-center gap-1.5 sm:gap-2.5">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const dot = (
            <span
              className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors duration-300',
                done && 'bg-brand-600 text-white',
                active && 'bg-ink text-lime ring-4 ring-lime/60',
                !done && !active && 'border border-ink/20 bg-white text-muted',
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
            </span>
          );
          const text = <span className={cn('text-[12px] font-semibold sm:text-[13px]', active ? 'text-ink' : done ? 'text-ink-soft' : 'text-muted', !active && 'max-sm:hidden')}>{label}</span>;
          return (
            <Fragment key={label}>
              {i > 0 && <li aria-hidden className={cn('h-px w-4 shrink border-t border-dashed sm:w-8', i <= current ? 'border-ink/50' : 'border-ink/20')} />}
              <li aria-current={active ? 'step' : undefined} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                {done && i === 0 ? (
                  <Link to="/shporta" className="flex items-center gap-1.5 hover:opacity-75 sm:gap-2">
                    {dot}
                    {text}
                  </Link>
                ) : (
                  <>
                    {dot}
                    {text}
                  </>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Free-delivery progress                                              */
/* ------------------------------------------------------------------ */
export function FreeShippingBar({ totals, className }: { totals: Totals; className?: string }) {
  const t = useDict(ck);
  const lang = useLang();
  const threshold = totals.freeShippingThreshold;
  if (threshold == null || !totals.lines.length) return null;
  const reached = totals.freeShippingReason === 'threshold' || totals.freeShippingRemaining <= 0;
  const pct = threshold > 0 ? Math.min(100, Math.max(4, ((threshold - totals.freeShippingRemaining) / threshold) * 100)) : 100;
  return (
    <div className={cn('rounded-2xl bg-white p-4 ring-1 ring-line', className)}>
      <div className="flex items-start gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors', reached ? 'bg-lime text-ink' : 'bg-brand-50 text-brand-600')}>
          {reached ? <Check className="h-4 w-4" strokeWidth={3} /> : <Truck className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className="text-[13.5px] font-semibold text-ink">{reached ? t('shipReached') : t('shipLeft', { amount: money(totals.freeShippingRemaining, lang) })}</p>
            <p className="text-[11.5px] font-medium text-muted">{t('shipPromise')}</p>
          </div>
          <div className="relative mt-2.5 h-2 overflow-hidden rounded-full bg-sand">
            <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', reached ? 'bg-signal' : 'bg-brand-600')} style={{ width: `${pct}%` }} />
          </div>
          {!reached && <p className="mt-1.5 text-[11.5px] text-muted">{t('shipRule', { amount: money(threshold, lang, { decimals: false }) })}</p>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Discount codes (several codes per order)                            */
/* ------------------------------------------------------------------ */
function useRejectText() {
  const t = useDict(ck);
  const l = useL();
  const lang = useLang();
  const discounts = useDb((s) => s.discounts);
  const collections = useDb((s) => s.collections);
  const products = useDb((s) => s.products);
  return (r: RejectedDiscount) => {
    const d = r.id ? discounts.find((x) => x.id === r.id) : undefined;
    switch (r.reason) {
      case 'minimum':
        return r.minimumType === 'qty'
          ? t('err_minQty', { amount: d?.minimum.value ?? 0, left: r.missing ?? 0 })
          : t('err_min', { amount: money(d?.minimum.value ?? 0, lang, { decimals: false }), left: money(r.missing ?? 0, lang) });
      case 'notCombinable': {
        const other = r.conflictsWith ? discounts.find((x) => x.id === r.conflictsWith) : undefined;
        return other ? t('err_notCombinable', { other: l(other.publicTitle) || other.title }) : t('err_notEligible', { code: r.code });
      }
      case 'notEligible': {
        const target = d?.appliesTo;
        const names =
          target?.scope === 'collections'
            ? target.ids.map((id) => collections.find((c) => c.id === id)).filter(Boolean).map((c) => l(c!.title))
            : target?.scope === 'products'
              ? target.ids.slice(0, 2).map((id) => products.find((p) => p.id === id)).filter(Boolean).map((p) => l(p!.name))
              : [];
        return names.length ? t('err_notEligibleFor', { what: names.join(', ') }) : t('err_notEligible', { code: r.code });
      }
      default:
        return t(`err_${r.reason}`, { code: r.code });
    }
  };
}

export function CouponBox({ totals, collapsible, className }: { totals: Totals; collapsible?: boolean; className?: string }) {
  const t = useDict(ck);
  const l = useL();
  const lang = useLang();
  const codes = useUi((s) => s.codes);
  const addCode = useUi((s) => s.addCode);
  const removeCode = useUi((s) => s.removeCode);
  const discounts = useDb((s) => s.discounts);
  const title = useDiscountTitle();
  const rejectText = useRejectText();
  const [code, setCode] = useState('');
  const [dup, setDup] = useState<string | null>(null);
  const [open, setOpen] = useState(!collapsible || codes.length > 0);

  const apply = (value = code) => {
    const v = normalizeCode(value);
    if (!v) return;
    if (codes.includes(v)) {
      setDup(v);
      return;
    }
    setDup(null);
    addCode(v);
    setCode('');
  };

  // public codes that are live right now and not entered yet → one-click suggestions
  const suggestions = discounts
    .filter((d) => d.method === 'code' && d.code && d.audience.type === 'all' && discountState(d) === 'active' && !codes.includes(normalizeCode(d.code)))
    .slice(0, 3);

  const entered = codes.map((c) => {
    const applied = totals.applied.find((a) => a.code === c);
    const rejected = applied ? undefined : totals.rejected.find((r) => !r.auto && r.code === c);
    return { code: c, applied, rejected };
  });

  const body = (
    <div className={cn(collapsible && 'pt-3')}>
      {entered.length > 0 && (
        <ul className="mb-3 space-y-2">
          {entered.map(({ code: c, applied, rejected }) => (
            <li
              key={c}
              className={cn(
                'flex animate-fade-in items-start gap-3 rounded-xl px-3 py-2.5 ring-1 ring-inset',
                applied ? 'bg-lime-soft/70 ring-lime-ink/15' : 'bg-red-50/80 ring-red-600/15',
              )}
            >
              <span className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white shadow-sm', applied ? 'text-brand-600' : 'text-red-600')}>
                {applied ? <TicketPercent className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className={cn('text-[13px] font-extrabold tracking-[0.06em]', applied ? 'text-ink' : 'text-red-800')}>{c}</span>
                  {applied && <span className="text-[12px] font-semibold text-brand-700">{t('couponApplied')}</span>}
                </div>
                <p className={cn('text-[12.5px] leading-snug', applied ? 'text-ink-soft' : 'text-red-700')} role={rejected ? 'alert' : undefined}>
                  {applied ? title(applied.id, applied.title) : rejected ? rejectText(rejected) : t('err_notfound', { code: c })}
                </p>
              </div>
              {applied && applied.amount > 0 && applied.kind !== 'shipping' && <span className="mt-0.5 shrink-0 text-[13px] font-bold tabular-nums text-brand-700">−{money(applied.amount, lang)}</span>}
              <button
                type="button"
                onClick={() => removeCode(c)}
                className="-mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-white hover:text-ink"
                aria-label={t('couponRemove', { code: c })}
                title={t('couponRemove', { code: c })}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setDup(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            }
          }}
          placeholder={t('couponPh')}
          autoComplete="off"
          spellCheck={false}
          aria-label={t('couponLabel')}
          aria-invalid={!!dup || undefined}
          className="h-11 min-w-0 flex-1 rounded-xl border border-dashed border-ink/25 bg-white px-3.5 text-[14px] font-bold uppercase tracking-[0.08em] text-ink outline-none transition-colors placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/70 focus:border-solid focus:border-ink/40 focus:ring-4 focus:ring-ink/5 aria-[invalid=true]:border-red-500"
        />
        <button
          type="button"
          onClick={() => apply()}
          disabled={!code.trim()}
          className="h-11 shrink-0 rounded-xl bg-ink px-4 text-[13.5px] font-semibold text-paper transition-colors hover:bg-ink-soft disabled:opacity-40"
        >
          {t('couponApply')}
        </button>
      </div>
      {dup ? (
        <p className="mt-2 text-[12.5px] font-medium text-red-600" role="alert">
          {t('couponDup', { code: dup })}
        </p>
      ) : (
        suggestions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
            <span>{t('couponTry')}</span>
            {suggestions.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => apply(d.code)}
                title={l(d.publicTitle)}
                className="rounded-md border border-dashed border-ink/25 bg-white px-2 py-0.5 text-[11.5px] font-bold tracking-[0.08em] text-ink-soft transition-colors hover:border-brand-600 hover:text-brand-700"
              >
                {d.code}
              </button>
            ))}
          </div>
        )
      )}
      {codes.length > 0 && <p className="mt-2 text-[11.5px] leading-snug text-muted/90">{t('couponMulti')}</p>}
    </div>
  );

  return (
    <div className={className}>
      {collapsible ? (
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left text-[13.5px] font-semibold text-ink hover:text-brand-700" aria-expanded={open}>
          <span className="flex items-center gap-2">
            <TicketPercent className="h-4 w-4 text-brand-600" />
            {t('couponHave')}
            {codes.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-bold text-paper">{codes.length}</span>}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-muted transition-transform duration-300', open && 'rotate-180')} />
        </button>
      ) : (
        <label htmlFor="coupon-code" className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
          <TicketPercent className="h-4 w-4 text-brand-600" />
          {t('couponLabel')}
        </label>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {body}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Totals                                                              */
/* ------------------------------------------------------------------ */
function Row({ label, value, sub, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <span className="min-w-0 text-muted">
        {label}
        {sub && <span className="block text-[11.5px] leading-snug text-muted/80">{sub}</span>}
      </span>
      <span className="shrink-0 text-right font-medium tabular-nums text-ink">{value}</span>
    </div>
  );
}

export interface DiscountRow {
  key: string;
  label: string;
  code?: string;
  amount: number;
}

export interface TotalsView {
  subtotal: number;
  /** Logo print add-on total (installationTotal) */
  logoTotal: number;
  discounts: DiscountRow[];
  shipping: number;
  /** show "nga 2,00 €" (no city yet) */
  shippingFrom?: boolean;
  /** free delivery / pickup */
  shippingFree?: boolean;
  shippingNote?: string;
  shippingLabel?: string;
  total: number;
  vat: number;
  /** total pieces (packs × pack size) */
  pieces?: number;
}

export function TotalsRows({ v, className, big }: { v: TotalsView; className?: string; big?: boolean }) {
  const t = useDict(ck);
  const tc = useDict(common);
  const lang = useLang();
  const settings = useSettings();
  return (
    <div className={cn('text-[14px]', className)}>
      <div className="space-y-2.5">
        <Row label={tc('subtotal')} value={money(v.subtotal, lang)} />
        {v.logoTotal > 0 && (
          <Row
            label={
              <span className="inline-flex items-center gap-1.5">
                <Stamp className="h-3.5 w-3.5 text-pink-ink" />
                {tc('installation')}
              </span>
            }
            value={money(v.logoTotal, lang)}
          />
        )}
        {v.discounts.map((d) => (
          <Row
            key={d.key}
            label={
              <span className="inline-flex flex-wrap items-center gap-1.5">
                {d.label}
                {d.code && <span className="rounded-md border border-dashed border-brand-600/40 bg-lime-soft px-1.5 py-px text-[10.5px] font-extrabold tracking-[0.08em] text-brand-700">{d.code}</span>}
              </span>
            }
            value={<span className="font-semibold text-brand-700">−{money(d.amount, lang)}</span>}
          />
        ))}
        <Row
          label={v.shippingLabel ?? tc('shipping')}
          sub={v.shippingNote}
          value={
            v.shippingFree || v.shipping === 0 ? (
              <span className="font-semibold text-brand-700">{t('free')}</span>
            ) : v.shippingFrom ? (
              t('from', { amount: money(v.shipping, lang) })
            ) : (
              money(v.shipping, lang)
            )
          }
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-dashed border-ink/20 pt-4">
        <span className="text-[15px] font-bold text-ink">{tc('total')}</span>
        <span className={cn('display tabular-nums text-ink', big ? 'text-[30px] leading-none' : 'text-[23px] leading-none')}>{money(v.total, lang)}</span>
      </div>
      <p className="mt-1.5 text-right text-[11.5px] text-muted">{t('vatNote', { rate: settings.vatRate, amount: money(v.vat, lang) })}</p>
      {!!v.pieces && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-sand/60 px-3 py-2 text-[12.5px]">
          <span className="inline-flex items-center gap-1.5 font-medium text-ink-soft">
            <Package className="h-3.5 w-3.5 text-kraft" />
            {t('piecesTotal')}
          </span>
          <span className="font-bold tabular-nums text-ink">{pieces(v.pieces, lang)}</span>
        </div>
      )}
    </div>
  );
}

/** Discount rows (products / order / BXGY) — shipping discounts show in the delivery row instead. */
function useDiscountRows() {
  const title = useDiscountTitle();
  return useCallback(
    (applied: AppliedDiscount[] | undefined, total: number, fallbackCode?: string | null): DiscountRow[] => {
      const rows = (applied ?? []).filter((a) => a.kind !== 'shipping' && a.amount > 0).map((a) => ({ key: a.id, label: title(a.id, a.title), code: a.code, amount: a.amount }));
      if (!rows.length && total > 0) return [{ key: 'discount', label: title(undefined), code: fallbackCode ?? undefined, amount: total }];
      return rows;
    },
    [title],
  );
}

/** Maps a priced cart (useCart) to the totals view. */
export function useTotalsView(totals: Totals, opts: { showEstimateHint?: boolean; zoneNote?: string } = {}): TotalsView {
  const t = useDict(ck);
  const tc = useDict(common);
  const lang = useLang();
  const settings = useSettings();
  const rows = useDiscountRows();
  const r = totals.freeShippingReason;
  const threshold = totals.freeShippingThreshold ?? settings.freeShippingThreshold;
  const note =
    r === 'threshold'
      ? t('free_threshold', { amount: money(threshold, lang, { decimals: false }) })
      : r === 'pickup'
        ? undefined
        : totals.shippingEstimate && opts.showEstimateHint
          ? t('shippingCalc')
          : opts.zoneNote;
  return {
    subtotal: totals.subtotal,
    logoTotal: totals.installationTotal,
    discounts: rows(totals.applied, totals.discount, totals.coupon?.code),
    shipping: totals.shipping,
    shippingFrom: totals.shippingEstimate,
    shippingFree: r === 'threshold' || r === 'pickup',
    shippingNote: note,
    shippingLabel: r === 'pickup' ? tc('delivery_pickup') : tc('shipping'),
    total: totals.total,
    vat: totals.vat,
    pieces: totals.pieces,
  };
}

/** Totals view of a placed order. */
export function useOrderTotalsView(order: Order): TotalsView {
  const t = useDict(ck);
  const tc = useDict(common);
  const lang = useLang();
  const rows = useDiscountRows();
  const pickup = order.delivery.method === 'pickup';
  const shipRule = (order.discounts ?? []).find((a) => a.kind === 'shipping');
  const pcs = order.items.reduce((s, i) => s + (i.unit === 'pack' && i.packSize ? i.qty * i.packSize : i.qty), 0);
  return {
    subtotal: order.subtotal,
    logoTotal: order.installationTotal,
    discounts: rows(order.discounts, order.discount, order.coupon?.code),
    shipping: order.shipping,
    shippingFree: order.shipping === 0,
    shippingNote: !pickup && shipRule && order.shippingBeforeDiscount ? `${money(order.shippingBeforeDiscount, lang)} → ${t('free').toLowerCase()}` : undefined,
    shippingLabel: pickup ? tc('delivery_pickup') : tc('shipping'),
    total: order.total,
    vat: order.vat,
    pieces: pcs,
  };
}

/* ------------------------------------------------------------------ */
/* Trust notes                                                         */
/* ------------------------------------------------------------------ */
export function TrustNotes({ className, compact }: { className?: string; compact?: boolean }) {
  const t = useDict(ck);
  const items = [
    { icon: ShieldCheck, title: t('trust_secure'), text: t('trust_secureText') },
    { icon: Truck, title: t('trust_fast'), text: t('trust_fastText') },
    { icon: Receipt, title: t('trust_invoice'), text: t('trust_invoiceText') },
  ];
  return (
    <ul className={cn('space-y-3.5', className)}>
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-3">
          <span className={cn('grid shrink-0 place-items-center rounded-xl bg-white text-brand-600 ring-1 ring-line', compact ? 'h-8 w-8' : 'h-10 w-10')}>
            <Icon className={compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />
          </span>
          <span className="min-w-0 pt-0.5">
            <span className="block text-[13.5px] font-semibold text-ink">{title}</span>
            {!compact && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{text}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Compact summary line (checkout sidebar)                             */
/* ------------------------------------------------------------------ */
export function CompactLine({ line }: { line: PricedLine }) {
  const t = useDict(ck);
  const l = useL();
  const lang = useLang();
  const packs = usePacksLabel();
  const p = line.product;
  const isPack = p.unit === 'pack' && !!p.packSize;
  return (
    <div className="flex gap-3.5 py-3.5">
      <div className="relative shrink-0">
        <div className="h-16 w-16 overflow-hidden rounded-xl bg-sand ring-1 ring-line">
          <Img src={p.images[0]} small alt="" className="h-full w-full object-cover" />
        </div>
        <span className="absolute -right-2 -top-2 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-ink px-1.5 text-[11px] font-bold tabular-nums text-paper ring-2 ring-white">{line.item.qty}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">{l(p.name)}</p>
          <span className="shrink-0 text-[13.5px] font-semibold tabular-nums text-ink">{money(line.lineTotal, lang)}</span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted">
          {isPack ? `${packs(line.item.qty)} · ${pieces(piecesFor(p, line.item.qty), lang)}` : `${line.item.qty} × ${money(line.unitPrice, lang)}`}
          {isPack && <span className="text-muted/80"> · {t('perPiece', { price: moneyPiece(line.unitPrice / piecesPerUnit(p), lang) })}</span>}
        </p>
        {line.optionsLabel && <p className="truncate text-[12px] text-muted">{line.optionsLabel}</p>}
        {(line.tierPct > 0 || line.installationTotal > 0) && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {line.tierPct > 0 && <span className="rounded-md bg-lime px-1.5 py-0.5 text-[11px] font-bold text-ink">{t('tierBadge', { pct: line.tierPct })}</span>}
            {line.installationTotal > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-pink-soft px-1.5 py-0.5 text-[11px] font-bold text-pink-ink">
                <Stamp className="h-3 w-3" />
                {t('plusLogo', { amount: money(line.installationTotal, lang) })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
