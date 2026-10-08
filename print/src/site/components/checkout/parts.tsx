import { Fragment, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Check, ChevronDown, FileCheck2, ReceiptText, ShieldCheck, TicketPercent, X } from 'lucide-react';
import { Img } from '@/components/ui/misc';
import { useDict, useL, useLang } from '@/i18n';
import { useUi } from '@/store/ui';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { money } from '@/lib/format';
import type { Order } from '@/lib/types';
import type { PricedLine, Totals } from '@/lib/pricing';
import { discountState } from '@/lib/discounts';
import { cn, round2 } from '@/lib/utils';
import { isRun, qtyText, unitMoney } from '@/site/components/product/print';
import { ck, pluralKey } from './dict';
import { ArtworkChip } from './artwork';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** "5 artikuj" / "5 items" */
export function useItemsLabel() {
  const t = useDict(ck);
  const lang = useLang();
  return (n: number) => t(pluralKey(n, lang), { n });
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
                'grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[10.5px] font-medium transition-colors duration-300',
                done && 'bg-ink text-paper',
                active && 'bg-brand-600 text-white ring-4 ring-brand-600/15',
                !done && !active && 'border border-ink/20 bg-white text-muted',
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : `0${i + 1}`}
            </span>
          );
          const text = <span className={cn('text-[12px] font-semibold sm:text-[13px]', active ? 'text-ink' : done ? 'text-ink-soft' : 'text-muted', !active && 'max-sm:hidden')}>{label}</span>;
          return (
            <Fragment key={label}>
              {i > 0 && <li aria-hidden className={cn('h-px w-4 shrink sm:w-8', i <= current ? 'bg-ink/50' : 'bg-ink/15')} />}
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
/* Coupon box (discount engine codes)                                  */
/* ------------------------------------------------------------------ */
export function CouponBox({ totals, collapsible, className }: { totals: Totals; collapsible?: boolean; className?: string }) {
  const t = useDict(ck);
  const lang = useLang();
  const applied = useUi((s) => s.coupon);
  const setCoupon = useUi((s) => s.setCoupon);
  const discounts = useDb((s) => s.discounts);
  const [code, setCode] = useState(applied ?? '');
  const [open, setOpen] = useState(!collapsible || !!applied);

  const apply = (value = code) => {
    const v = value.trim().toUpperCase();
    setCode(v);
    setCoupon(v || null);
  };

  if (totals.coupon) {
    const c = totals.coupon;
    return (
      <div className={cn('flex animate-fade-in items-center gap-3 rounded-xl bg-emerald-50 px-3.5 py-3 ring-1 ring-inset ring-emerald-600/15', className)}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 shadow-sm">
          <TicketPercent className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[13px] font-medium tracking-wide text-emerald-800">
            {c.code}
            <span className="ml-1.5 font-sans font-semibold tracking-normal text-emerald-700">· {c.type === 'percent' ? `−${c.value}%` : `−${money(c.value, lang, { decimals: c.value % 1 !== 0 })}`}</span>
          </div>
          <div className="text-[12.5px] leading-snug text-emerald-700">{t('couponSaving', { amount: money(totals.discount, lang) })}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            setCoupon(null);
            setCode('');
          }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-emerald-700 transition-colors hover:bg-white hover:text-ink"
          aria-label={t('couponRemove')}
          title={t('couponRemove')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const showError = !!applied && !!totals.couponError && code.trim().toUpperCase() === applied.toUpperCase();
  let error = '';
  if (showError && applied) {
    if (totals.couponError === 'min') {
      const m = totals.couponMinimum;
      error = m?.type === 'qty' ? t('err_minQty', { amount: m.value, left: m.missing }) : t('err_min', { amount: money(m?.value ?? 0, lang, { decimals: false }), left: money(m?.missing ?? 0, lang) });
    } else error = t(`err_${totals.couponError ?? 'notfound'}`, { code: applied });
  }
  // suggest a live public code the cart already qualifies for
  const demo = discounts.find(
    (d) => d.method === 'code' && d.code && d.audience.type === 'all' && discountState(d) === 'active' && (d.minimum.type !== 'amount' || d.minimum.value <= totals.subtotal - totals.productDiscount),
  );

  return (
    <div className={className}>
      {collapsible ? (
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left text-[13.5px] font-semibold text-ink hover:text-brand-700" aria-expanded={open}>
          <span className="flex items-center gap-2">
            <TicketPercent className="h-4 w-4 text-brand-600" />
            {t('couponHave')}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-muted transition-transform duration-300', open && 'rotate-180')} />
        </button>
      ) : (
        <label htmlFor="coupon-code" className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
          <TicketPercent className="h-4 w-4 text-brand-600" />
          {t('couponLabel')}
        </label>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={collapsible ? { height: 0, opacity: 0 } : false} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <div className={cn(collapsible && 'pt-3')}>
              <div className="flex gap-2">
                <input
                  id="coupon-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      apply();
                    }
                  }}
                  placeholder={t('couponPh')}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!error || undefined}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 font-mono text-[14px] uppercase tracking-wider text-ink outline-none transition-colors placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/70 focus:border-ink/40 focus:ring-4 focus:ring-ink/5 aria-[invalid=true]:border-red-500"
                />
                <button type="button" onClick={() => apply()} disabled={!code.trim()} className="h-11 shrink-0 rounded-xl bg-ink px-4 text-[13.5px] font-semibold text-paper transition-colors hover:bg-ink-soft disabled:opacity-40">
                  {t('couponApply')}
                </button>
              </div>
              {error ? (
                <p className="mt-2 text-[12.5px] font-medium leading-snug text-red-600" role="alert">
                  {error}
                </p>
              ) : (
                demo && (
                  <p className="mt-2 text-[12px] text-muted">
                    {t('couponDemo')}{' '}
                    <button type="button" onClick={() => apply(demo.code)} className="font-mono font-medium tracking-wide text-ink-soft underline decoration-dotted underline-offset-2 hover:text-brand-700">
                      {demo.code}
                    </button>
                  </p>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Totals: Subtotal → Design → Discounts → Delivery → Net → VAT → Total */
/* ------------------------------------------------------------------ */
function Row({ label, value, sub, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <span className="text-muted">
        {label}
        {sub && <span className="block text-[11.5px] leading-snug text-muted/80">{sub}</span>}
      </span>
      <span className="shrink-0 text-right font-mono text-[13.5px] tabular-nums text-ink">{value}</span>
    </div>
  );
}

export interface TotalsView {
  subtotal: number;
  installationTotal: number;
  discount: number;
  couponCode?: string | null;
  shipping: number;
  /** show "nga 5 €" */
  shippingFrom?: boolean;
  shippingFree?: boolean;
  shippingNote?: string;
  shippingLabel?: string;
  /** total excl. VAT */
  net: number;
  vat: number;
  total: number;
  /** VAT added on top of net prices (B2B) */
  netPricing: boolean;
}

export function TotalsRows({ v, className, big }: { v: TotalsView; className?: string; big?: boolean }) {
  const t = useDict(ck);
  const lang = useLang();
  const settings = useSettings();
  return (
    <div className={cn('text-[14px]', className)}>
      <div className="space-y-2.5">
        <Row label={t('subtotal')} value={money(v.subtotal, lang)} />
        {v.installationTotal > 0 && <Row label={t('design')} value={money(v.installationTotal, lang)} />}
        {v.discount > 0 && (
          <Row
            label={
              <span className="inline-flex flex-wrap items-center gap-1.5">
                {t('discounts')}
                {v.couponCode && <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[10.5px] tracking-wide text-emerald-700">{v.couponCode}</span>}
              </span>
            }
            value={<span className="text-emerald-700">−{money(v.discount, lang)}</span>}
          />
        )}
        <Row
          label={v.shippingLabel ?? t('delivery')}
          sub={v.shippingNote}
          value={v.shippingFree || v.shipping === 0 ? <span className="font-sans font-semibold text-emerald-700">{t('free')}</span> : v.shippingFrom ? t('from', { amount: money(v.shipping, lang) }) : money(v.shipping, lang)}
        />
      </div>
      {v.netPricing ? (
        <>
          <div className="mt-3.5 space-y-2.5 border-t border-dashed border-line pt-3.5">
            <Row label={<span className="font-semibold text-ink">{t('netTotal')}</span>} value={<span className="font-medium">{money(v.net, lang)}</span>} />
            <Row label={t('vat', { rate: settings.vatRate })} value={money(v.vat, lang)} />
          </div>
          <div className="mt-3.5 flex items-baseline justify-between gap-4 border-t border-line pt-3.5">
            <span className="text-[15px] font-semibold text-ink">{t('total')}</span>
            <span className={cn('font-semibold tracking-tight tabular-nums text-ink', big ? 'text-[28px] leading-none' : 'text-[22px] leading-none')}>{money(v.total, lang)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
            <span className="text-[15px] font-semibold text-ink">{t('total')}</span>
            <span className={cn('font-semibold tracking-tight tabular-nums text-ink', big ? 'text-[28px] leading-none' : 'text-[22px] leading-none')}>{money(v.total, lang)}</span>
          </div>
          <p className="mt-1.5 text-right text-[11.5px] text-muted">{t('vatIncluded', { rate: settings.vatRate, amount: money(v.vat, lang) })}</p>
        </>
      )}
    </div>
  );
}

/** Maps a priced cart (useCart) to the totals view. */
export function useTotalsView(totals: Totals, opts: { showEstimateHint?: boolean } = {}): TotalsView {
  const t = useDict(ck);
  const lang = useLang();
  const settings = useSettings();
  const r = totals.freeShippingReason;
  const note =
    r === 'threshold'
      ? t('free_threshold', { amount: money(totals.freeShippingThreshold ?? settings.freeShippingThreshold, lang, { decimals: false }) })
      : r === 'pickup'
        ? undefined
        : totals.shippingEstimate && opts.showEstimateHint
          ? t('shippingCalc')
          : undefined;
  return {
    subtotal: totals.subtotal,
    installationTotal: totals.installationTotal,
    discount: totals.discount,
    couponCode: totals.coupon?.code,
    shipping: totals.shipping,
    shippingFrom: totals.shippingEstimate,
    shippingFree: !!r,
    shippingNote: note,
    shippingLabel: r === 'pickup' ? t('pickup') : t('delivery'),
    net: totals.net,
    vat: totals.vat,
    total: totals.total,
    netPricing: totals.netPricing,
  };
}

/** Totals view of a placed order (VAT on top when the stored figures say so). */
export function orderTotalsView(order: Order, labels: { pickup: string; delivery: string }): TotalsView {
  const base = round2(order.subtotal + order.installationTotal - order.discount + order.shipping);
  const netPricing = order.vat > 0 && Math.abs(base + order.vat - order.total) < 0.05;
  return {
    subtotal: order.subtotal,
    installationTotal: order.installationTotal,
    discount: order.discount,
    couponCode: order.coupon?.code,
    shipping: order.shipping,
    shippingFree: order.shipping === 0,
    shippingLabel: order.delivery.method === 'pickup' ? labels.pickup : labels.delivery,
    net: round2(order.total - order.vat),
    vat: order.vat,
    total: order.total,
    netPricing,
  };
}

/* ------------------------------------------------------------------ */
/* Free-shipping progress                                              */
/* ------------------------------------------------------------------ */
export function FreeShippingBar({ totals, className }: { totals: Totals; className?: string }) {
  const t = useDict(ck);
  const lang = useLang();
  const threshold = totals.freeShippingThreshold;
  if (threshold == null || threshold <= 0) return null;
  const applied = totals.freeShippingReason === 'threshold';
  const done = applied || totals.freeShippingRemaining <= 0;
  const pct = done ? 100 : Math.min(100, ((threshold - totals.freeShippingRemaining) / threshold) * 100);
  return (
    <div className={cn('rounded-2xl bg-white p-4 ring-1 ring-line', className)}>
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className={cn('font-semibold', done ? 'text-emerald-700' : 'text-ink')}>{applied ? t('freeReached') : done ? t('freeQualified') : t('freeLeft', { amount: money(totals.freeShippingRemaining, lang) })}</span>
        <span className="font-mono text-[11px] tabular-nums text-muted">{money(threshold, lang, { decimals: false })}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand">
        <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', done ? 'bg-emerald-500' : 'bg-brand-600')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trust notes                                                         */
/* ------------------------------------------------------------------ */
export function TrustNotes({ className, compact }: { className?: string; compact?: boolean }) {
  const t = useDict(ck);
  const items = [
    { icon: FileCheck2, title: t('trust_proof'), text: t('trust_proofText') },
    { icon: ReceiptText, title: t('trust_invoice'), text: t('trust_invoiceText') },
    { icon: ShieldCheck, title: t('trust_secure'), text: t('trust_secureText') },
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
  const p = line.product;
  const run = isRun(p);
  return (
    <div className="flex gap-3.5 py-3.5">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line">
        <Img src={p.images[0]} small alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">{l(p.name)}</p>
          <span className="shrink-0 font-mono text-[13px] tabular-nums text-ink">{money(line.lineTotal, lang)}</span>
        </div>
        <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted">
          {qtyText(line.item.qty, lang)} {run ? t('pcs') : '×'} {run ? `× ${unitMoney(line.unitPrice, lang)}` : money(line.unitPrice, lang)}
        </p>
        {line.optionsLabel && <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">{line.optionsLabel}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {line.item.artwork && <ArtworkChip art={line.item.artwork} size="sm" />}
          {line.installationTotal > 0 && <span className="font-mono text-[10.5px] text-brand-700">{t('designFee', { amount: money(line.installationTotal, lang) })}</span>}
        </div>
      </div>
    </div>
  );
}
