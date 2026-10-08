// Complaint detail (Reklamacion): request → accept → verify (stock decision) → resolve, or reject.
// Resolution: reprint (free reprint draft, nothing paid back), refund or credit note (both paid back through the
// store's refund step, from the net paid amount of the lines + VAT, PDF p.24 — can only be lowered).
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowUpRight, Check, CheckCircle2, CircleDollarSign, FilePlus2, Info, Lock, PackageCheck, PackageOpen, ReceiptText, RotateCcw, ThumbsUp, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Field';
import { Drawer } from '@/components/ui/Overlay';
import { Thumb, confirmDialog } from '@/admin/components/kit';
import { actorName, customerName } from '@/admin/components/orders/helpers';
import { FulfilBadge, PayBadge, StatusGlyph } from '@/admin/components/orders/status';
import { Eyebrow, TextInput, Tip } from '@/admin/components/orders/ui';
import { od } from '@/admin/components/orders/dict';
import { DraftPill, reprintOf } from '@/admin/components/orders/drafts';
import { NumInput } from '@/admin/components/products/parts';
import { adm } from '@/admin/i18n';
import { useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useCan } from '@/store/hooks';
import { fulfillmentOf, paymentOf } from '@/lib/orders';
import { date, dateTime, money, num, unitLabel } from '@/lib/format';
import { cn, round2 } from '@/lib/utils';
import type { Order, ReturnRequest, ReturnStatus } from '@/lib/types';
import { rd } from './dict';
import { ComplaintBadge, RESOLUTION_ICON } from './ComplaintBadge';
import { RESOLUTIONS, RETURN_FLOW, lineImage, lineName, reachedAt, reasonKey, refundBreakdown, refundCap, refundGross, reprintDraftOf, resolutionOf, type Complaint, type Resolution } from './helpers';

const isPaid = (o: Order | undefined) => {
  const p = o ? paymentOf(o) : 'pending';
  return p === 'paid' || p === 'partially_refunded' || p === 'refunded';
};

export function ReturnDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  // keep the last complaint rendered while the drawer slides out
  const [lastId, setLastId] = useState(id);
  if (id && id !== lastId) setLastId(id);
  const ret = useDb((s) => s.returns.find((r) => r.id === (id ?? lastId)));
  const order = useDb((s) => (ret ? s.orders.find((o) => o.id === ret.orderId) : undefined));
  const vatRate = useDb((s) => s.settings.vatRate);
  const lang = useLang('admin');

  // step inputs — reset whenever another complaint opens or the status moves on
  const stepKey = ret ? `${ret.id}:${ret.status}` : '';
  const [inputs, setInputs] = useState({ key: stepKey, amount: null as number | null, note: '' });
  if (inputs.key !== stepKey) setInputs({ key: stepKey, amount: null, note: '' });

  const cap = useMemo(() => (ret && order ? refundCap(order, ret, vatRate) : { computed: ret?.refundAmount ?? 0, remaining: 0, max: 0, capped: false }), [ret, order, vatRate]);
  const open = !!ret && (ret.status === 'requested' || ret.status === 'approved' || ret.status === 'received');
  const amount = ret ? (open ? round2(Math.min(inputs.amount ?? cap.max, cap.max)) : ret.refundAmount) : 0;
  const step = {
    amount,
    note: inputs.note,
    setAmount: (v: number) => setInputs((s) => ({ ...s, amount: v })),
    setNote: (v: string) => setInputs((s) => ({ ...s, note: v })),
  };

  return (
    <Drawer
      open={!!id && !!ret}
      onClose={onClose}
      width="max-w-[560px]"
      title={
        ret && (
          <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <span className="text-[17px] font-bold tabular-nums">{ret.number}</span>
            <ComplaintBadge ret={ret} />
            <span className="w-full text-[12.5px] font-normal text-muted">{dateTime(ret.createdAt, lang)}</span>
          </span>
        )
      }
      footer={ret && <Footer ret={ret} order={order} cap={cap} step={step} />}
    >
      {ret && <Body ret={ret} order={order} cap={cap} step={step} />}
    </Drawer>
  );
}

type Cap = ReturnType<typeof refundCap>;
type Step = { amount: number; note: string; setAmount: (v: number) => void; setNote: (v: string) => void };
type Props = { ret: ReturnRequest; order: Order | undefined; cap: Cap; step: Step };

/** The reprint draft of a complaint (linked id, or a draft that points back to it). */
function useReprintDraft(ret: ReturnRequest) {
  const drafts = useDb((s) => s.drafts);
  return useMemo(() => {
    const id = reprintDraftOf(ret);
    return drafts.find((d) => d.id === id) ?? drafts.find((d) => reprintOf(d) === ret.id);
  }, [drafts, ret]);
}

/* ================================================================== */
/* Body                                                                 */
/* ================================================================== */
function Body({ ret, order, cap, step }: Props) {
  const t = useDict(rd, 'admin');
  const to = useDict(od, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const navigate = useNavigate();
  const products = useDb((s) => s.products);
  const staff = useDb((s) => s.staff);
  const vatRate = useDb((s) => s.settings.vatRate);
  const upsert = useDb((s) => s.upsert);
  const updateOrder = useDb((s) => s.updateOrder);
  const reprintDraft = useReprintDraft(ret);

  const editable = can('returns', 'edit');
  const canRefund = can('returns', 'refund');
  const open = ret.status === 'requested' || ret.status === 'approved' || ret.status === 'received';
  const paid = isPaid(order);
  const res = resolutionOf(ret);
  const breakdown = order ? refundBreakdown(order, ret.lines, vatRate) : null;
  const reason = reasonKey(ret.reason);
  const closedAt = reachedAt(ret, 'refunded');
  const moneyBack = res !== 'reprint';

  const setResolution = (v: Resolution) => upsert('returns', { ...ret, resolution: v } as Complaint);
  const markPaid = () => {
    if (!order) return;
    updateOrder(order.id, { payment: { ...order.payment, status: 'paid', failed: false }, timeline: [...order.timeline, { at: new Date().toISOString(), status: 'payment', note: ret.number, by: 'admin' }] });
    toast.success(t('orderPaid', { n: order.number }));
  };

  const unitOf = (productId: string) => {
    const line = order?.items.find((l) => l.productId === productId);
    return line ? (line.unit === 'kom' ? t('pcs') : unitLabel(line.unit, lang)) : '';
  };
  const tracked = ret.lines.map((l) => products.find((p) => p.id === l.productId)).filter((p) => !!p && p.stock < 999);
  const nextText = ret.status === 'received' ? t(`next_received_${res}`) : ret.status === 'approved' ? t('next_approved') : t('next_requested');
  const closedText = ret.status === 'rejected' ? t('closed_rejected') : t(`closed_${res}`);

  return (
    <div className="space-y-5 px-5 py-5 sm:px-6">
      <Progress status={ret.status} timeline={ret.timeline} resolution={res} />

      <p className="flex items-start gap-2 rounded-lg bg-[#EBEBEB]/70 px-3 py-2.5 text-[13px] leading-snug text-ink-soft">
        {open ? (
          editable ? <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" /> : <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        ) : (
          <StatusGlyph glyph={ret.status === 'refunded' ? 'check' : 'cross'} className="mt-1 text-ink-soft" />
        )}
        {open ? (editable ? nextText : t('readOnly')) : closedText}
      </p>

      {/* resolution */}
      <section>
        <Eyebrow>{open && editable ? t('resolutionLabel') : t('resolution')}</Eyebrow>
        {open && editable ? (
          <div role="radiogroup" aria-label={t('resolution')} className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-canvas p-1">
            {RESOLUTIONS.map((r) => {
              const Icon = RESOLUTION_ICON[r];
              const on = res === r;
              return (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setResolution(r)}
                  className={cn('inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2 text-[12.5px] font-semibold transition-colors', on ? 'bg-white text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink')}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t(`res_${r}`)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
            {(() => {
              const Icon = RESOLUTION_ICON[res];
              return <Icon className="h-4 w-4" />;
            })()}
            {t(`res_${res}`)}
          </p>
        )}
        <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{t(`resHint_${res}`)}</p>
      </section>

      {/* order */}
      <section className="rounded-xl border border-line bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <Eyebrow>{t('order')}</Eyebrow>
          {order && (
            <Link to={`/admin/porosite/${order.id}`} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-soft hover:text-ink hover:underline">
              {t('openOrder')} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        {order ? (
          <div className="mt-1.5">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <Link to={`/admin/porosite/${order.id}`} className="text-[15px] font-bold tabular-nums text-ink hover:underline">
                #{order.number}
              </Link>
              <span className="text-[12.5px] text-muted">
                {date(order.createdAt, lang)} · {money(order.total, lang)}
                {order.poNumber && <> · PO {order.poNumber}</>}
              </span>
            </p>
            <p className="mt-0.5 truncate text-[13.5px] text-ink-soft">
              {order.customer.company ? <span className="font-medium text-ink">{order.customer.company} · </span> : null}
              {customerName(order)}
              {order.customer.phone && <span className="text-muted"> · {order.customer.phone}</span>}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <PayBadge state={paymentOf(order)} />
              {order.status !== 'cancelled' && <FulfilBadge state={fulfillmentOf(order)} />}
            </div>
          </div>
        ) : (
          <p className="mt-1 text-[13px] text-muted">{t('noOrder')}</p>
        )}
      </section>

      {/* items */}
      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <p className="border-b border-line/70 px-4 py-2.5 text-[13.5px] font-semibold text-ink">{t('items')}</p>
        <ul className="divide-y divide-line/70">
          {ret.lines.map((l) => {
            const ordered = order?.items.filter((x) => x.productId === l.productId).reduce((s, x) => s + x.qty, 0) ?? l.qty;
            const value = order ? refundGross(order, [l], vatRate) : 0;
            const line = order?.items.find((x) => x.productId === l.productId);
            const sku = products.find((p) => p.id === l.productId)?.sku ?? line?.sku;
            return (
              <li key={l.productId} className="flex items-center gap-3 px-4 py-3">
                <Thumb src={lineImage(l.productId, order, products)} className="h-11 w-11 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{lineName(l.productId, order, products, lang)}</span>
                  <span className="block truncate text-[12px] text-muted">
                    {t('ofQty', { n: num(l.qty, lang), total: num(ordered, lang) })} {unitOf(l.productId)}
                    {sku && <span className="font-mono"> · {sku}</span>}
                  </span>
                  {line?.options && <span className="block truncate text-[12px] text-muted">{line.options}</span>}
                </span>
                <span className={cn('shrink-0 text-right text-[13.5px] font-semibold tabular-nums', moneyBack ? 'text-ink' : 'text-muted')}>{money(value, lang)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* reason */}
      <section>
        <Eyebrow>{t('reason')}</Eyebrow>
        <span className="mt-1.5 inline-flex h-[22px] items-center rounded-md bg-[#EBEBEB] px-2 text-[12px] font-semibold text-ink">{t(`r_${reason}`)}</span>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{ret.reason}</p>
      </section>

      {/* reprint draft */}
      {res === 'reprint' && ret.status !== 'rejected' && (
        <section className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
          <div className="flex min-w-0 gap-2.5">
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-ink">{t('reprintDraft')}</p>
              {reprintDraft ? (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
                  <span className="font-semibold tabular-nums text-ink">{reprintDraft.number}</span>
                  <DraftPill status={reprintDraft.status} />
                </p>
              ) : (
                <p className="mt-0.5 text-[12.5px] text-muted">{t('reprintNone')}</p>
              )}
            </div>
          </div>
          {reprintDraft ? (
            <Link to={`/admin/draftet/${reprintDraft.id}`} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-ink/15 bg-white px-3 text-[12.5px] font-semibold text-ink hover:border-ink/35">
              {t('reprintOpen', { n: reprintDraft.number })} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            editable &&
            open &&
            ret.status !== 'requested' &&
            can('drafts', 'edit') && (
              <Button variant="outline" size="xs" shape="rounded" icon={<FilePlus2 className="h-3.5 w-3.5" />} onClick={() => navigate(`/admin/draftet/i-ri?ribotim=${ret.id}`)}>
                {t('makeReprint')}
              </Button>
            )
          )}
        </section>
      )}

      {/* amount */}
      <section className="rounded-xl border border-line bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13.5px] font-semibold text-ink">{t('refundTitle')}</p>
          {ret.status === 'refunded' && closedAt && <span className="text-[12px] text-muted">{t('refundedOn', { date: date(closedAt, lang) })}</span>}
        </div>
        {breakdown && (
          <dl className={cn('mt-2.5 space-y-1 text-[13px]', !moneyBack && 'opacity-60')}>
            <Row label={t('value')} value={money(breakdown.value, lang)} />
            {breakdown.discount > 0 && <Row label={t('discounts')} value={`−${money(breakdown.discount, lang)}`} />}
            <Row label={t('net')} value={money(breakdown.net, lang)} />
            {breakdown.netPriced && <Row label={`${t('vat')} ${vatRate}%`} value={money(breakdown.vat, lang)} />}
            <Row label={t('gross')} value={money(breakdown.gross, lang)} strong />
          </dl>
        )}

        {!moneyBack ? (
          <p className="mt-3 flex items-center gap-2 border-t border-line/70 pt-3 text-[13.5px] font-semibold text-ink">
            <RotateCcw className="h-4 w-4 text-muted" /> {t('noMoney')}
          </p>
        ) : ret.status === 'received' && can('returns', 'edit') && canRefund && paid && cap.max > 0 ? (
          <div className="mt-3 border-t border-line/70 pt-3">
            <label className="mb-1 block text-[12.5px] font-semibold text-ink-soft">{t('amountLabel')}</label>
            <NumInput size="sm" money value={step.amount} onChange={(v) => step.setAmount(Math.max(0, Math.min(cap.max, v ?? 0)))} suffix="€" wrapClassName="max-w-[180px]" aria-label={t('amountLabel')} />
            <p className="mt-1 text-[12px] text-muted">{cap.capped ? t('amountCapped', { max: money(cap.max, lang) }) : t('amountHint', { max: money(cap.max, lang) })}</p>
          </div>
        ) : (
          <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line/70 pt-3">
            <span className="text-[13.5px] font-semibold text-ink">{ret.status === 'refunded' ? t(res === 'credit' ? 'step_credit' : 'step_refunded') : t('toRefund')}</span>
            <span className={cn('text-[20px] font-bold tabular-nums', ret.status === 'rejected' ? 'text-muted line-through' : 'text-ink')}>{money(step.amount, lang)}</span>
          </div>
        )}
        {moneyBack && <p className="mt-2 text-[12px] leading-snug text-muted">{t('refundBasis')}</p>}

        {moneyBack && order && open && !paid && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#E8D9A8] bg-[#FFF8E1] px-3 py-2 text-[12.5px] text-[#4A3A00]">
            <span className="min-w-0 flex-1">{t('unpaid')}</span>
            {can('orders', 'edit') && (
              <Button variant="outline" size="xs" shape="rounded" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={markPaid}>
                {t('markOrderPaid')}
              </Button>
            )}
          </div>
        )}
      </section>

      {/* stock decision (PDF p.15: "Kthimi rrit stokun vetëm pas pranimit") — off for custom-printed goods */}
      {(ret.status !== 'rejected' || ret.restocked) && (
        <section className="flex items-start justify-between gap-4 rounded-xl border border-line bg-white p-4">
          <div className="flex min-w-0 gap-2.5">
            <PackageOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-ink">{t('restock')}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{ret.restocked ? t('restockDone') : ret.status === 'received' || ret.status === 'refunded' ? t('restockSkipped') : t('restockHint')}</p>
              {tracked.length > 0 && (
                <p className="mt-1 text-[12px] tabular-nums text-muted">
                  {tracked.map((p) => (
                    <span key={p!.id} className="mr-3 inline-block">
                      <span className="font-mono">{p!.sku}</span> · {t('stockNow', { n: num(p!.stock, lang) })}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
          {ret.status === 'requested' || ret.status === 'approved' ? (
            <Switch size="sm" checked={ret.restock} disabled={!editable} onChange={(v) => upsert('returns', { ...ret, restock: v })} />
          ) : (
            <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full', ret.restocked ? 'bg-ink text-white' : 'bg-[#EBEBEB] text-muted')} aria-label={ret.restocked ? tc('yes') : tc('no')}>
              {ret.restocked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={2.5} />}
            </span>
          )}
        </section>
      )}

      {editable && open && <TextInput label={t('note')} value={step.note} placeholder={t('notePh')} onChange={(e) => step.setNote(e.target.value)} />}

      {/* history */}
      <section>
        <Eyebrow>{t('history')}</Eyebrow>
        <ol className="relative mt-3 space-y-4 before:absolute before:bottom-3 before:left-[4px] before:top-3 before:w-px before:bg-line">
          {[...ret.timeline].reverse().map((e, i) => (
            <li key={`${e.at}-${i}`} className="relative flex gap-3">
              <span className={cn('relative z-10 mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full ring-4 ring-paper', i === 0 ? 'bg-ink' : 'bg-[#BDBDBD]')} />
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium text-ink">{e.status === 'refunded' ? t(res === 'reprint' ? 'st_reprint' : res === 'credit' ? 'st_credit' : 'st_refunded') : t(`st_${e.status}`)}</p>
                {e.note && <p className="mt-0.5 text-[13px] text-ink-soft">{e.note}</p>}
                <p className="text-[12px] text-muted">
                  {dateTime(e.at, lang)}
                  {e.by && <> · {actorName(e.by, staff, { web: to('by_web'), admin: to('by_admin') })}</>}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Row({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? 'font-semibold text-ink' : 'text-ink-soft'}>{label}</dt>
      <dd className={cn('tabular-nums', strong ? 'font-semibold text-ink' : 'text-ink')}>{value}</dd>
    </div>
  );
}

/* ================================================================== */
/* Progress: request → accepted → verified → resolved (or rejected)     */
/* ================================================================== */
function Progress({ status, timeline, resolution }: { status: ReturnStatus; timeline: { at: string; status: ReturnStatus }[]; resolution: Resolution }) {
  const t = useDict(rd, 'admin');
  const lang = useLang('admin');
  const reached = Math.max(0, ...timeline.map((e) => RETURN_FLOW.indexOf(e.status)));
  const rejected = status === 'rejected';
  const at = (s: ReturnStatus) => [...timeline].reverse().find((e) => e.status === s)?.at;
  const finalLabel = resolution === 'reprint' ? t('step_reprint') : resolution === 'credit' ? t('step_credit') : t('step_refunded');
  type State = 'done' | 'current' | 'todo' | 'rejected';
  const steps: { key: ReturnStatus; state: State; at?: string }[] = RETURN_FLOW.map((s, i) => {
    if (rejected && i === reached + 1) return { key: 'rejected', state: 'rejected', at: at('rejected') };
    if (i < reached || (i === reached && (status === 'refunded' || rejected))) return { key: s, state: 'done', at: at(s) };
    if (i === reached) return { key: s, state: 'current', at: at(s) };
    return { key: s, state: 'todo' };
  });
  return (
    <ol className="grid grid-cols-4">
      {steps.map((s, i) => (
        <li key={`${s.key}-${i}`} className="relative flex min-w-0 flex-col items-center text-center">
          {i > 0 && <span aria-hidden className={cn('absolute top-[11px] h-0.5', s.state === 'todo' ? 'bg-line' : 'bg-ink')} style={{ right: 'calc(50% + 16px)', left: 'calc(-50% + 16px)' }} />}
          <span
            className={cn(
              'relative z-10 grid h-6 w-6 place-items-center rounded-full',
              s.state === 'done' && 'bg-ink text-white',
              s.state === 'current' && 'bg-white text-ink ring-2 ring-ink',
              s.state === 'todo' && 'bg-white text-[#BDBDBD] ring-2 ring-line',
              s.state === 'rejected' && 'bg-[#FDE3DF] text-[#8A1B0A] ring-2 ring-[#F2B8AE]',
            )}
          >
            {s.state === 'done' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s.state === 'rejected' ? <X className="h-3.5 w-3.5" strokeWidth={3} /> : <StatusGlyph glyph={s.state === 'current' ? 'dot' : 'ring'} className="h-2 w-2" />}
          </span>
          <span className={cn('mt-1.5 max-w-full truncate px-1 text-[12px] font-semibold', s.state === 'todo' ? 'text-muted' : s.state === 'rejected' ? 'text-[#8A1B0A]' : 'text-ink')}>
            {s.key === 'refunded' ? finalLabel : t(`step_${s.key}`)}
          </span>
          <span className="text-[11.5px] tabular-nums text-muted">{s.at ? date(s.at, lang, { day: 'numeric', month: 'short' }) : ' '}</span>
        </li>
      ))}
    </ol>
  );
}

/* ================================================================== */
/* Footer: the next allowed step                                        */
/* ================================================================== */
function Footer({ ret, order, cap, step }: Props) {
  const t = useDict(rd, 'admin');
  const ta = useDict(adm, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const navigate = useNavigate();
  const upsert = useDb((s) => s.upsert);
  const setReturnStatus = useDb((s) => s.setReturnStatus);
  const reprintDraft = useReprintDraft(ret);

  const editable = can('returns', 'edit');
  const canRefund = can('returns', 'refund');
  const paid = isPaid(order);
  const res = resolutionOf(ret);
  const amount = step.amount;

  const go = async (status: ReturnStatus) => {
    if (status === 'rejected') {
      const ok = await confirmDialog({ title: t('rejectTitle', { n: ret.number }), text: t('rejectText'), confirmLabel: t('rejectConfirm'), danger: true });
      if (!ok) return;
    }
    const notes = [step.note.trim()];
    if (status === 'refunded') {
      if (res === 'reprint') {
        // nothing is paid back — the store refunds `refundAmount`, so it goes to 0 first
        if (ret.refundAmount !== 0) upsert('returns', { ...ret, refundAmount: 0 });
        notes.unshift(t('reprintNote', { n: reprintDraft?.number ?? '—' }));
      } else {
        // the store refunds `refundAmount` — align it with the (VAT-inclusive, capped) amount first
        if (Math.abs(amount - ret.refundAmount) > 0.004) upsert('returns', { ...ret, refundAmount: amount });
        if (res === 'credit') notes.unshift(t('creditNote'));
        if (amount < cap.computed - 0.004) notes.push(t('partialNote', { amount: money(amount, lang), max: money(cap.computed, lang) }));
      }
    }
    setReturnStatus(ret.id, status, notes.filter(Boolean).join(' · ') || undefined);
    const done = status === 'refunded' ? (res === 'reprint' ? 'done_reprint' : res === 'credit' ? 'done_credit' : 'done_refunded') : (`done_${status}` as 'done_approved' | 'done_received' | 'done_rejected');
    toast.success(t(done, { n: ret.number, amount: money(amount, lang) }));
  };

  if (!editable || ret.status === 'refunded' || ret.status === 'rejected') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
          {!editable && (
            <>
              <Lock className="h-3.5 w-3.5" /> {t('readOnly')}
            </>
          )}
        </span>
        {order ? (
          <Link to={`/admin/porosite/${order.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink/15 bg-white px-4 text-[13px] font-semibold text-ink hover:border-ink/35">
            {t('openOrder')} #{order.number} <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="text-[12.5px] text-muted">{ta('close')}</span>
        )}
      </div>
    );
  }

  const refundTip = !canRefund ? t('noRefundPerm') : !paid ? t('unpaid') : cap.max <= 0 ? t('amountCapped', { max: money(0, lang) }) : null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="outline" size="sm" shape="rounded" icon={<X className="h-4 w-4" />} onClick={() => go('rejected')}>
        {t('reject')}
      </Button>
      {ret.status === 'requested' && (
        <Button size="sm" shape="rounded" icon={<ThumbsUp className="h-4 w-4" />} onClick={() => go('approved')}>
          {t('approve')}
        </Button>
      )}
      {ret.status === 'approved' && (
        <Button size="sm" shape="rounded" icon={<PackageCheck className="h-4 w-4" />} onClick={() => go('received')}>
          {t('receive')}
        </Button>
      )}
      {ret.status === 'received' && res === 'reprint' && (
        <>
          {!reprintDraft && can('drafts', 'edit') && (
            <Button variant="outline" size="sm" shape="rounded" icon={<FilePlus2 className="h-4 w-4" />} onClick={() => navigate(`/admin/draftet/i-ri?ribotim=${ret.id}`)}>
              {t('makeReprint')}
            </Button>
          )}
          <Button size="sm" shape="rounded" icon={<RotateCcw className="h-4 w-4" />} onClick={() => go('refunded')}>
            {t('closeReprint')}
          </Button>
        </>
      )}
      {ret.status === 'received' && res !== 'reprint' && (
        <Tip tip={refundTip}>
          <Button size="sm" shape="rounded" icon={!canRefund ? <Lock className="h-4 w-4" /> : res === 'credit' ? <ReceiptText className="h-4 w-4" /> : <CircleDollarSign className="h-4 w-4" />} disabled={!!refundTip} onClick={() => go('refunded')}>
            {res === 'credit' ? t('credit', { amount: money(amount, lang) }) : t('refund', { amount: money(amount, lang) })}
          </Button>
        </Tip>
      )}
    </div>
  );
}
