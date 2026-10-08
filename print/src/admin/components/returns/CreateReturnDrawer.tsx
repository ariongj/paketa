// New complaint from an existing order: pick the order → quantities per product → reason → resolution → stock decision.
import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ArrowLeftRight, Info, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Field';
import { Drawer } from '@/components/ui/Overlay';
import { Thumb } from '@/admin/components/kit';
import { customerName, matchesOrder } from '@/admin/components/orders/helpers';
import { FulfilBadge, PayBadge } from '@/admin/components/orders/status';
import { SelectInput, Stepper, TextInput } from '@/admin/components/orders/ui';
import { useDict, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { fulfillmentOf, paymentOf } from '@/lib/orders';
import { date, money, num, unitLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Order, ReturnRequest } from '@/lib/types';
import { rd } from './dict';
import { RESOLUTION_ICON } from './ComplaintBadge';
import { REASONS, RESOLUTIONS, isPrintedLine, lineName, refundGross, returnableGroups, returnedQty, type Complaint, type ReasonKey, type Resolution } from './helpers';

export function CreateReturnDrawer({ open, onClose, initialOrderId, onCreated }: { open: boolean; onClose: () => void; initialOrderId?: string | null; onCreated: (r: ReturnRequest) => void }) {
  // remount the form on every opening so it starts clean (and with the deep-linked order)
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((n) => n + 1);
  }
  return <Form key={session} open={open} onClose={onClose} initialOrderId={initialOrderId ?? null} onCreated={onCreated} />;
}

function Form({ open, onClose, initialOrderId, onCreated }: { open: boolean; onClose: () => void; initialOrderId: string | null; onCreated: (r: ReturnRequest) => void }) {
  const t = useDict(rd, 'admin');
  const lang = useLang('admin');
  const orders = useDb((s) => s.orders);
  const products = useDb((s) => s.products);
  const returns = useDb((s) => s.returns);
  const vatRate = useDb((s) => s.settings.vatRate);
  const createReturn = useDb((s) => s.createReturn);
  const upsert = useDb((s) => s.upsert);

  const [orderId, setOrderIdRaw] = useState<string | null>(initialOrderId && orders.some((o) => o.id === initialOrderId) ? initialOrderId : null);
  const [q, setQ] = useState('');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReasonKey>('colour');
  const [details, setDetails] = useState('');
  const [resolution, setResolution] = useState<Resolution>('reprint');

  const order = orderId ? orders.find((o) => o.id === orderId) : undefined;
  const groups = useMemo(() => (order ? returnableGroups(order) : []), [order]);
  const already = useMemo(() => (order ? returnedQty(returns, order.id) : new Map<string, number>()), [returns, order]);
  // custom-printed goods cannot be resold: restocking starts OFF unless every line is a standard stock item
  const defaultRestock = (o: Order | undefined) => !!o && returnableGroups(o).length > 0 && returnableGroups(o).every((g) => !isPrintedLine(g.productId, o, products));
  const [restock, setRestock] = useState(() => defaultRestock(order));
  const setOrderId = (id: string | null) => {
    setOrderIdRaw(id);
    setQty({});
    setRestock(defaultRestock(id ? orders.find((o) => o.id === id) : undefined));
  };

  const eligible = useMemo(() => {
    const shippedFirst = (o: Order) => (fulfillmentOf(o) === 'unfulfilled' ? 1 : 0);
    return orders
      .filter((o) => o.status !== 'cancelled' && o.items.some((l) => l.productId && !l.custom) && matchesOrder(o, q))
      .sort((a, b) => shippedFirst(a) - shippedFirst(b) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [orders, q]);

  const lines = groups.map((g) => ({ productId: g.productId, qty: qty[g.productId] ?? 0 })).filter((l) => l.qty > 0);
  const estimate = order ? refundGross(order, lines, vatRate) : 0;
  const maxOf = (productId: string, total: number) => Math.max(0, total - (already.get(productId) ?? 0));
  const allMax = groups.every((g) => (qty[g.productId] ?? 0) === maxOf(g.productId, g.qty));
  const pay = order ? paymentOf(order) : 'pending';
  const unpaid = !!order && !(pay === 'paid' || pay === 'partially_refunded' || pay === 'refunded');

  const submit = () => {
    if (!order || !lines.length) return toast.error(t('needItems'));
    const text = `${t(`r_${reason}`)}${details.trim() ? ` — ${details.trim()}` : ''}`;
    const r = createReturn({ orderId: order.id, lines, reason: text, restock });
    if (!r) return toast.error(t('needItems'));
    // complaint extension: resolution + the amount incl. the VAT the customer paid (store computes it net)
    const next: Complaint = { ...r, resolution, refundAmount: refundGross(order, lines, vatRate) };
    upsert('returns', next);
    toast.success(t('created', { n: r.number }), { description: `${t(`res_${resolution}`)} · ${money(estimate, lang)}` });
    onCreated(next);
  };

  const unitOf = (o: Order, productId: string) => {
    const l = o.items.find((x) => x.productId === productId);
    return l ? (l.unit === 'kom' ? t('pcs') : unitLabel(l.unit, lang)) : '';
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-[560px]"
      title={<span className="text-[17px] font-bold">{t('createTitle')}</span>}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-[13px] text-ink-soft">
            {resolution === 'reprint' ? t('estimatedReprint') : t('estimated')}
            <span className={cn('block text-[17px] font-bold tabular-nums', resolution === 'reprint' ? 'text-muted' : 'text-ink')}>{money(estimate, lang)}</span>
          </span>
          <Button size="sm" shape="rounded" disabled={!order || !lines.length} onClick={submit}>
            {t('submit')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 px-5 py-5 sm:px-6">
        {/* 1 · order */}
        <section>
          <StepLabel n={1}>{t('pickOrder')}</StepLabel>
          {order ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/25 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="text-[14.5px] font-bold tabular-nums text-ink">#{order.number}</p>
                <p className="truncate text-[12.5px] text-muted">
                  {order.customer.company || customerName(order)} · {date(order.createdAt, lang)} · {money(order.total, lang)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <PayBadge state={pay} />
                  <FulfilBadge state={fulfillmentOf(order)} />
                </div>
              </div>
              <button type="button" onClick={() => setOrderId(null)} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-semibold text-ink-soft hover:bg-ink/[0.05] hover:text-ink">
                <ArrowLeftRight className="h-3.5 w-3.5" /> {t('change')}
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="border-b border-line/70 p-2">
                <TextInput autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('findOrder')} aria-label={t('findOrder')} leading={<Search />} />
              </div>
              {eligible.length === 0 ? (
                <p className="px-4 py-5 text-center text-[13px] text-muted">{t('noOrders')}</p>
              ) : (
                <ul className="max-h-[360px] divide-y divide-line/60 overflow-y-auto">
                  {eligible.map((o) => (
                    <li key={o.id}>
                      <button type="button" onClick={() => setOrderId(o.id)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink/[0.04]">
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-semibold tabular-nums text-ink">#{o.number}</span>
                          <span className="block truncate text-[12px] text-muted">
                            {o.customer.company || customerName(o)} · {date(o.createdAt, lang, { day: 'numeric', month: 'short' })}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-[13px] font-semibold tabular-nums text-ink">{money(o.total, lang)}</span>
                          <FulfilBadge state={fulfillmentOf(o)} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {order && (
          <>
            {/* 2 · items */}
            <section>
              <div className="flex items-end justify-between gap-2">
                <StepLabel n={2}>{t('chooseItems')}</StepLabel>
                {groups.some((g) => maxOf(g.productId, g.qty) > 0) && !allMax && (
                  <button type="button" onClick={() => setQty(Object.fromEntries(groups.map((g) => [g.productId, maxOf(g.productId, g.qty)])))} className="mb-2 text-[12.5px] font-semibold text-ink-soft hover:text-ink hover:underline">
                    {t('selectAll')}
                  </button>
                )}
              </div>
              {groups.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-4 py-4 text-[13px] text-muted">{t('noLines')}</p>
              ) : (
                <ul className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line bg-white">
                  {groups.map((g) => {
                    const prev = already.get(g.productId) ?? 0;
                    const max = maxOf(g.productId, g.qty);
                    const n = qty[g.productId] ?? 0;
                    const name = lineName(g.productId, order, products, lang);
                    const unit = unitOf(order, g.productId);
                    return (
                      <li key={g.productId} className={cn('flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap', n > 0 && 'bg-ink/[0.025]')}>
                        <Thumb src={g.lines[0].line.image} className="h-11 w-11 rounded-lg" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-ink">{name}</span>
                          <span className="block truncate text-[12px] text-muted">
                            {num(g.qty, lang)} {unit} · {money(g.unitNet, lang)} / {unit}
                          </span>
                          {prev > 0 && <span className="block text-[12px] font-medium text-[#7A5D00]">{max > 0 ? t('alreadyReturned', { n: num(prev, lang) }) : t('nothingLeft')}</span>}
                        </span>
                        <QtyPicker value={n} max={max} onChange={(v) => setQty((s) => ({ ...s, [g.productId]: v }))} label={name} all={t('selectAll')} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* 3 · reason */}
            <section>
              <StepLabel n={3}>{t('reasonLabel')}</StepLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectInput aria-label={t('reasonLabel')} value={reason} onChange={(e) => setReason(e.target.value as ReasonKey)}>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`r_${r}`)}
                    </option>
                  ))}
                </SelectInput>
                <TextInput aria-label={t('details')} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('detailsPh')} />
              </div>
            </section>

            {/* 4 · resolution */}
            <section>
              <StepLabel n={4}>{t('resolutionLabel')}</StepLabel>
              <div role="radiogroup" aria-label={t('resolution')} className="grid gap-2 sm:grid-cols-3">
                {RESOLUTIONS.map((r) => {
                  const Icon = RESOLUTION_ICON[r];
                  const on = resolution === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setResolution(r)}
                      className={cn('flex flex-col items-start gap-1 rounded-xl border bg-white px-3 py-2.5 text-left transition-colors', on ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-ink/40')}
                    >
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                        <Icon className="h-3.5 w-3.5" /> {t(`res_${r}`)}
                      </span>
                      <span className="text-[11.5px] leading-snug text-muted">{t(`resHint_${r}`)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="flex items-start justify-between gap-4 rounded-xl border border-line bg-white p-4">
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">{t('restock')}</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{t('restockHint')}</p>
              </div>
              <Switch size="sm" checked={restock} onChange={setRestock} />
            </section>

            <p className="flex items-start gap-2 text-[12.5px] leading-snug text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {t('refundBasis')}
                {unpaid && resolution !== 'reprint' && <span className="mt-1 block font-medium text-[#7A5D00]">{t('unpaidCreate')}</span>}
              </span>
            </p>
          </>
        )}
      </div>
    </Drawer>
  );
}

/** Quantity of a print run can be thousands: a stepper plus an "all" shortcut. */
function QtyPicker({ value, max, onChange, label, all }: { value: number; max: number; onChange: (v: number) => void; label: string; all: string }) {
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5">
      {max > 1 && value !== max && (
        <button type="button" onClick={() => onChange(max)} className="h-8 rounded-lg px-2 text-[12px] font-semibold text-ink-soft hover:bg-ink/[0.05] hover:text-ink">
          {all}
        </button>
      )}
      <span className="[&_input]:w-14">
        <Stepper value={value} min={0} max={max} onChange={onChange} ariaLabel={label} disabled={max === 0} />
      </span>
    </span>
  );
}

function StepLabel({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{n}</span>
      {children}
    </p>
  );
}
