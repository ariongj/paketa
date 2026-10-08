import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  AlertTriangle, Archive, ArchiveRestore, ArrowRight, Ban, Building2, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, FileCheck2, Lock, Mail,
  MapPin, PackageCheck, PackageX, PenLine, Phone, Plus, Printer, RotateCcw, SearchX, Store, Tag, Truck, X,
} from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { Card, PageHeader, Thumb, confirmDialog } from '@/admin/components/kit';
import { OrderTimeline } from '@/admin/components/orders/OrderTimeline';
import { FulfilDialog } from '@/admin/components/orders/FulfilDialog';
import { RefundDialog } from '@/admin/components/orders/RefundDialog';
import { StatusStepper } from '@/admin/components/orders/StatusStepper';
import { PrepressCard } from '@/admin/components/orders/PrepressCard';
import {
  PAY_ICON, archivePatch, archivedAtOf, channelOf, customerLink, customerName, discountName, isCarrierKey, localizeLine, mapsUrl, pluralKey, qtyLabel,
} from '@/admin/components/orders/helpers';
import { artworkOf, daysLate, designAmount, orderLeadDays, orderNet, productionDue, productionOverdue, productionStartedAt, proofOf, unitMoney, withLabel } from '@/admin/components/orders/print';
import { ArchivedBadge, ArtworkBadge, CancelledBadge, FulfilBadge, OrderStatusPill, PayBadge, ReturnBadge, StatusGlyph } from '@/admin/components/orders/status';
import { ActionMenu, CodeChip, Eyebrow, SumRow, Tip, type MenuItem } from '@/admin/components/orders/ui';
import { od } from '@/admin/components/orders/dict';
import { adm } from '@/admin/i18n';
import { LANGS, defineDict, useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useCan, useSettings } from '@/store/hooks';
import { fulfillmentOf, orderLineNet, paymentOf, refundedOf } from '@/lib/orders';
import { zoneForCity } from '@/lib/pricing';
import { customerKeyOf } from '@/lib/crm';
import { date, dateTime, money, num, unitLabel } from '@/lib/format';
import { href } from '@/lib/paths';
import { cn, round2 } from '@/lib/utils';
import type { Lang, Order, OrderStatus, Product } from '@/lib/types';

const T = defineDict({
  sq: {
    customerLang: 'Gjuha e klientit: {lang}',
    po: 'PO {n}',
    actions: 'Veprime',
    prev: 'Porosia më e re',
    next: 'Porosia më e vjetër',
    invoice: 'Faturë',
    proforma: 'Pro-formë',
    printInvoice: 'Printo faturën',
    printProforma: 'Printo pro-formën',
    refund: 'Rimburso…',
    createReturn: 'Hap reklamacion',
    archive: 'Arkivo',
    unarchive: 'Hiq nga arkivi',
    cancelOrder: 'Anulo porosinë',
    nothingToRefund: 'Nuk ka pagesë që mund të rimbursohet',
    cancelTitle: 'Të anulohet porosia #{n}?',
    cancelText: 'Nëse porosia është paguar, pagesa shënohet si e rimbursuar. Puna e prepress-it dhe prodhimit ndalet.',
    cancelConfirm: 'Po, anuloje',
    cancelled: 'Porosia #{n} u anulua',
    archived: 'Porosia #{n} u arkivua',
    unarchived: 'Porosia #{n} u kthye në listë',
    archivedBanner: 'E arkivuar më {date} — e fshehur nga listat e punës. Pagesa dhe përmbushja nuk ndryshojnë.',
    cancelledBanner: 'E anuluar më {date}.',
    workflow: 'Rrjedha e porosisë',
    wf_new: 'Kontrolloni sasitë, opsionet dhe të dhënat e kompanisë, pastaj konfirmojeni.',
    wf_confirmed: 'Porosia është konfirmuar. Dërgojeni në prepress për kontrollin e skedarëve dhe provën digjitale.',
    wf_confirmedNoArt: 'Porosia është konfirmuar dhe nuk ka skedarë printimi për të kontrolluar.',
    wf_proof: 'Prodhimi nis pasi klienti të aprovojë provën digjitale.',
    wf_proofApproved: 'Prova u aprovua — porosia është gati për prodhim.',
    wf_processing: 'Në prodhim që nga {date} · afati {days} ditë pune · gati deri më {due}.',
    wf_overdue: 'Me vonesë {n} ditë — afati ishte {due}.',
    wf_shipped: 'U dërgua më {date}.',
    wf_completed: 'U dorëzua më {date}.',
    confirm: 'Konfirmo porosinë',
    toPrepress: 'Dërgo në prepress',
    startProduction: 'Nis prodhimin',
    startProductionTip: 'Prova duhet të aprovohet nga klienti',
    prepare: 'Përgatit dërgesën',
    markDelivered: 'Shëno si të dorëzuar',
    advanced: 'Statusi: „{s}“',
    items: 'Artikujt e porosisë',
    sku: 'Kodi',
    tier: 'Çmimi për {q}+ {u}',
    design: 'Dizajn & prepress',
    designPerUnit: '{price} / {u}',
    custom: 'Artikull custom',
    exclVat: 'pa TVSH',
    shippedOn: 'Dërguar më {date}',
    deliveredOn: 'Dorëzuar më {date}',
    trackingNo: 'Gjurmimi: {n}',
    payment: 'Pagesa dhe historiku',
    subtotal: 'Nëntotali',
    shippingRow: 'Transporti · {method}',
    freeBy: 'Falas: {name}',
    netTotal: 'Totali pa TVSH',
    total: 'Totali',
    vatIncluded: 'TVSH {rate}% e përfshirë · {amount}',
    paidByCustomer: 'Paguar nga klienti',
    due: 'Për t’u paguar',
    bankRef: 'Referenca e pagesës: {n}',
    refundedRow: 'Rimbursuar më {date}',
    net: 'Neto',
    cost: 'Kosto e prodhimit',
    margin: 'Marzha bruto',
    costHint: 'E dukshme vetëm për rolet me leje „Kosto“',
    markPaid: 'Shëno si të paguar',
    markedPaid: 'Pagesa u regjistrua',
    history: 'Historiku',
    customer: 'Klienti',
    contact: 'Personi kontaktues',
    nui: 'NUI',
    poLabel: 'Nr. i porosisë së klientit (PO)',
    poNone: 'Pa numër PO',
    poPh: 'p.sh. PO-2026-118',
    poSaved: 'Numri PO u ruajt',
    ordersOf: '{n}',
    noEmail: 'Pa e-mail',
    delivery: 'Dërgesa',
    pickupAt: 'Marrje: {addr}',
    zone: 'Zona: {zone} · {days} ditë pune',
    trackingLater: 'Gjurmimi caktohet pas dërgimit',
    deliveryDate: 'Data e kërkuar: {date}',
    openMap: 'Harta',
    notes: 'Shënime',
    customerNote: 'Shënimi i klientit',
    internalNote: 'Shënim i brendshëm',
    noNotes: 'Pa shënime',
    editNote: 'Ndrysho',
    save: 'Ruaj',
    noteSaved: 'Shënimi u ruajt',
    tags: 'Etiketat',
    addTag: 'Shto etiketë…',
    discount: 'Zbritja',
    noDiscount: 'Pa zbritje',
    returns: 'Reklamacione',
    notFound: 'Porosia nuk u gjet',
    notFoundText: 'Mund të jetë fshirë ose lidhja nuk është e saktë.',
    backToOrders: 'Kthehu te porositë',
  },
  en: {
    customerLang: 'Customer language: {lang}',
    po: 'PO {n}',
    actions: 'Actions',
    prev: 'Newer order',
    next: 'Older order',
    invoice: 'Invoice',
    proforma: 'Pro-forma',
    printInvoice: 'Print invoice',
    printProforma: 'Print pro-forma',
    refund: 'Refund…',
    createReturn: 'Open a complaint',
    archive: 'Archive',
    unarchive: 'Unarchive',
    cancelOrder: 'Cancel order',
    nothingToRefund: 'There is no payment left to refund',
    cancelTitle: 'Cancel order #{n}?',
    cancelText: 'If the order was paid, the payment is marked as refunded. Prepress and production work stops.',
    cancelConfirm: 'Yes, cancel it',
    cancelled: 'Order #{n} was cancelled',
    archived: 'Order #{n} archived',
    unarchived: 'Order #{n} is back in the list',
    archivedBanner: 'Archived on {date} — hidden from the working lists. Payment and fulfilment are unchanged.',
    cancelledBanner: 'Cancelled on {date}.',
    workflow: 'Order workflow',
    wf_new: 'Check quantities, options and the company details, then confirm the order.',
    wf_confirmed: 'The order is confirmed. Send it to prepress for the file check and the digital proof.',
    wf_confirmedNoArt: 'The order is confirmed and has no print files to check.',
    wf_proof: 'Production starts once the customer approves the digital proof.',
    wf_proofApproved: 'Proof approved — the order is ready for production.',
    wf_processing: 'In production since {date} · lead time {days} working days · ready by {due}.',
    wf_overdue: '{n} day(s) late — it was due {due}.',
    wf_shipped: 'Shipped on {date}.',
    wf_completed: 'Delivered on {date}.',
    confirm: 'Confirm order',
    toPrepress: 'Send to prepress',
    startProduction: 'Start production',
    startProductionTip: 'The customer has to approve the proof first',
    prepare: 'Prepare shipment',
    markDelivered: 'Mark as delivered',
    advanced: 'Status: “{s}”',
    items: 'Order items',
    sku: 'SKU',
    tier: 'Price for {q}+ {u}',
    design: 'Design & prepress',
    designPerUnit: '{price} / {u}',
    custom: 'Custom item',
    exclVat: 'excl. VAT',
    shippedOn: 'Shipped {date}',
    deliveredOn: 'Delivered {date}',
    trackingNo: 'Tracking: {n}',
    payment: 'Payment & history',
    subtotal: 'Subtotal',
    shippingRow: 'Delivery · {method}',
    freeBy: 'Free: {name}',
    netTotal: 'Total excl. VAT',
    total: 'Total',
    vatIncluded: 'Includes {rate}% VAT · {amount}',
    paidByCustomer: 'Paid by customer',
    due: 'Amount due',
    bankRef: 'Payment reference: {n}',
    refundedRow: 'Refunded {date}',
    net: 'Net',
    cost: 'Production cost',
    margin: 'Gross margin',
    costHint: 'Only visible to roles with the “Cost” permission',
    markPaid: 'Mark as paid',
    markedPaid: 'Payment recorded',
    history: 'History',
    customer: 'Customer',
    contact: 'Contact person',
    nui: 'NUI',
    poLabel: 'Customer PO number',
    poNone: 'No PO number',
    poPh: 'e.g. PO-2026-118',
    poSaved: 'PO number saved',
    ordersOf: '{n}',
    noEmail: 'No e-mail',
    delivery: 'Delivery',
    pickupAt: 'Pickup: {addr}',
    zone: 'Zone: {zone} · {days} working days',
    trackingLater: 'Tracking is assigned once shipped',
    deliveryDate: 'Requested date: {date}',
    openMap: 'Map',
    notes: 'Notes',
    customerNote: 'Customer note',
    internalNote: 'Internal note',
    noNotes: 'No notes',
    editNote: 'Edit',
    save: 'Save',
    noteSaved: 'Note saved',
    tags: 'Tags',
    addTag: 'Add tag…',
    discount: 'Discount',
    noDiscount: 'No discount',
    returns: 'Complaints',
    notFound: 'Order not found',
    notFoundText: 'It may have been deleted or the link is incorrect.',
    backToOrders: 'Back to orders',
  },
});

type Dict = ReturnType<typeof useDict<(typeof T)['sq']>>;

const shortDate = (iso: string | Date, lang: Lang) => date(iso, lang, { day: 'numeric', month: 'short' });

/** The quantity break that priced a line, e.g. 1000 for "1.000+ copë" (null for products without tiers). */
function tierQty(p: Product | undefined, qty: number) {
  if (!p?.tiers?.length) return null;
  const sorted = [...p.tiers].sort((a, b) => a.qty - b.qty);
  let hit = sorted[0].qty;
  for (const x of sorted) if (x.qty <= qty) hit = x.qty;
  return hit;
}

export default function OrderDetail() {
  const { id } = useParams();
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const order = useDb((s) => s.orders.find((o) => o.id === id || o.number === id));
  const markOrderSeen = useDb((s) => s.markOrderSeen);

  useEffect(() => {
    if (order && !order.seen) markOrderSeen(order.id);
  }, [order, markOrderSeen]);

  if (!order) {
    return (
      <div className="animate-fade-in">
        <PageHeader back="/admin/porosite" breadcrumbs={[{ label: ta('nav_orders'), to: '/admin/porosite' }, t('notFound')]} title={t('notFound')} />
        <Card>
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title={t('notFound')}
            text={t('notFoundText')}
            action={
              <ButtonLink to="/admin/porosite" size="sm" shape="rounded">
                {t('backToOrders')}
              </ButtonLink>
            }
          />
        </Card>
      </div>
    );
  }
  return <OrderView order={order} />;
}

function OrderView({ order }: { order: Order }) {
  const t = useDict(T, 'admin');
  const to = useDict(od, 'admin');
  const ta = useDict(adm, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const orders = useDb((s) => s.orders);
  const setOrderStatus = useDb((s) => s.setOrderStatus);
  const updateOrder = useDb((s) => s.updateOrder);
  const logAudit = useDb((s) => s.logAudit);
  const [fulfilOpen, setFulfilOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const pay = paymentOf(order);
  const ful = fulfillmentOf(order);
  const cancelled = order.status === 'cancelled';
  const archivedAt = archivedAtOf(order);
  const refundable = round2(order.total - refundedOf(order)) > 0 && (pay === 'paid' || pay === 'partially_refunded');
  const lastAt = (s: OrderStatus) => [...order.timeline].reverse().find((e) => e.status === s)?.at ?? order.createdAt;
  const isInvoice = pay === 'paid' || pay === 'partially_refunded' || pay === 'refunded';

  // prev = newer, next = older (list order)
  const nav = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const i = sorted.findIndex((o) => o.id === order.id);
    return { prev: i > 0 ? sorted[i - 1] : null, next: i >= 0 && i < sorted.length - 1 ? sorted[i + 1] : null };
  }, [orders, order.id]);

  const cancel = async () => {
    const ok = await confirmDialog({ title: t('cancelTitle', { n: order.number }), text: t('cancelText'), confirmLabel: t('cancelConfirm'), danger: true });
    if (!ok) return;
    setOrderStatus(order.id, 'cancelled');
    toast.success(t('cancelled', { n: order.number }));
  };

  const setArchived = (on: boolean) => {
    updateOrder(order.id, archivePatch(on ? new Date().toISOString() : null));
    logAudit({ action: on ? 'archive' : 'restore', object: 'order', objectId: order.id, detail: order.number });
    toast.success(on ? t('archived', { n: order.number }) : t('unarchived', { n: order.number }));
  };

  const openInvoice = () => window.open(href(`/admin/fatura/${order.id}`), '_blank', 'noopener');

  const menu: MenuItem[] = [
    { label: isInvoice ? t('printInvoice') : t('printProforma'), icon: <Printer />, onClick: openInvoice },
    {
      label: t('refund'),
      icon: <RotateCcw />,
      onClick: () => setRefundOpen(true),
      disabled: !can('orders', 'refund') || !refundable,
      hint: !can('orders', 'refund') ? to('noPermission') : t('nothingToRefund'),
    },
    ...(can('returns', 'edit') && !cancelled ? [{ label: t('createReturn'), icon: <PackageX />, to: `/admin/kthimet?order=${order.id}&new=1` } as MenuItem] : []),
    { type: 'separator' },
    archivedAt
      ? { label: t('unarchive'), icon: <ArchiveRestore />, onClick: () => setArchived(false), disabled: !can('orders', 'archive'), hint: to('noPermission') }
      : { label: t('archive'), icon: <Archive />, onClick: () => setArchived(true), disabled: !can('orders', 'archive'), hint: to('noPermission') },
    ...(!cancelled && order.status !== 'completed'
      ? [{ label: t('cancelOrder'), icon: <Ban />, danger: true, onClick: cancel, disabled: !can('orders', 'cancel'), hint: to('noPermission') } as MenuItem]
      : []),
  ];

  const orderLang = LANGS.find((l) => l.code === order.lang)?.label ?? order.lang;

  return (
    <div className="animate-fade-in">
      <PageHeader
        back="/admin/porosite"
        breadcrumbs={[{ label: ta('nav_orders'), to: '/admin/porosite' }, `#${order.number}`]}
        title={`#${order.number}`}
        badge={
          <span className="flex flex-wrap items-center gap-1.5">
            <OrderStatusPill status={order.status} />
            <PayBadge state={pay} />
            {!cancelled && <FulfilBadge state={ful} />}
            {archivedAt && <ArchivedBadge />}
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>{dateTime(order.createdAt, lang)}</span>
            <span className="text-ink/25">·</span>
            <span>{to(`channel_${channelOf(order)}`)}</span>
            {order.customer.company && (
              <>
                <span className="text-ink/25">·</span>
                <span className="font-medium text-ink-soft">{order.customer.company}</span>
              </>
            )}
            {order.poNumber && (
              <>
                <span className="text-ink/25">·</span>
                <span className="font-mono text-[12.5px]">{t('po', { n: order.poNumber })}</span>
              </>
            )}
            {order.lang !== lang && (
              <>
                <span className="text-ink/25">·</span>
                <span>{t('customerLang', { lang: orderLang })}</span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <span className="hidden items-center sm:inline-flex">
              <NavArrow to={nav.prev ? `/admin/porosite/${nav.prev.id}` : null} label={t('prev')} icon={<ChevronLeft className="h-4 w-4" />} className="rounded-l-lg" />
              <NavArrow to={nav.next ? `/admin/porosite/${nav.next.id}` : null} label={t('next')} icon={<ChevronRight className="h-4 w-4" />} className="-ml-px rounded-r-lg" />
            </span>
            <Button variant="outline" size="sm" shape="rounded" icon={<Printer className="h-4 w-4" />} onClick={openInvoice}>
              {isInvoice ? t('invoice') : t('proforma')}
            </Button>
            <ActionMenu label={t('actions')} items={menu} />
          </>
        }
      />

      {(archivedAt || cancelled) && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-white px-4 py-3 text-[13.5px] text-ink-soft">
          <StatusGlyph glyph={cancelled ? 'cross' : 'dash'} className={cancelled ? 'text-[#8A1B0A]' : 'text-ink'} />
          <span className="min-w-0 flex-1">{cancelled ? t('cancelledBanner', { date: dateTime(lastAt('cancelled'), lang) }) : t('archivedBanner', { date: dateTime(archivedAt!, lang) })}</span>
          {archivedAt && can('orders', 'archive') && (
            <Button variant="outline" size="xs" shape="rounded" icon={<ArchiveRestore className="h-3.5 w-3.5" />} onClick={() => setArchived(false)}>
              {t('unarchive')}
            </Button>
          )}
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {!cancelled && <WorkflowCard order={order} t={t} onFulfil={() => setFulfilOpen(true)} />}
          <PrepressCard order={order} />
          <ItemsCard order={order} t={t} />
          <PaymentCard order={order} t={t} onRefund={() => setRefundOpen(true)} refundable={refundable} />
        </div>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <CustomerCard order={order} t={t} />
          <DeliveryCard order={order} t={t} />
          <NotesCard order={order} t={t} />
          <DiscountCard order={order} t={t} />
          <ReturnsCard order={order} t={t} />
        </div>
      </div>

      {can('orders', 'edit') && <FulfilDialog order={order} open={fulfilOpen} onClose={() => setFulfilOpen(false)} />}
      {can('orders', 'refund') && <RefundDialog order={order} open={refundOpen} onClose={() => setRefundOpen(false)} />}
    </div>
  );
}

function NavArrow({ to, label, icon, className }: { to: string | null; label: string; icon: ReactNode; className?: string }) {
  const cls = cn('grid h-9 w-9 place-items-center border border-ink/15 bg-white text-ink transition-colors', className);
  if (!to)
    return (
      <span className={cn(cls, 'cursor-not-allowed text-ink/25')} aria-disabled>
        {icon}
      </span>
    );
  return (
    <Link to={to} title={label} aria-label={label} className={cn(cls, 'hover:border-ink/35 hover:bg-canvas')}>
      {icon}
    </Link>
  );
}

/* ================================================================== */
/* Rrjedha e porosisë — stepper + the next action for the status       */
/* ================================================================== */
function WorkflowCard({ order, t, onFulfil }: { order: Order; t: Dict; onFulfil: () => void }) {
  const to = useDict(od, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const products = useDb((s) => s.products);
  const setOrderStatus = useDb((s) => s.setOrderStatus);
  const updateOrder = useDb((s) => s.updateOrder);
  const s = order.status;
  const ful = fulfillmentOf(order);
  const proof = proofOf(order, products);
  const editable = can('orders', 'edit') && s !== 'cancelled' && s !== 'completed';
  const f = order.fulfillment;

  const advance = (next: OrderStatus) => {
    setOrderStatus(order.id, next);
    toast.success(t('advanced', { s: tc(`status_${next}`) }));
  };

  const toPrepress = () => {
    setOrderStatus(order.id, 'proof');
    // start the proof machine: missing files → awaiting, otherwise straight to the check
    if (!order.proof && proof) {
      updateOrder(order.id, { proof: { status: proof.status === 'awaiting_files' ? 'awaiting_files' : 'checking', version: 0 } });
    }
    toast.success(t('advanced', { s: tc('status_proof') }));
  };

  /* ---------------- hint ---------------- */
  let hint: ReactNode = null;
  let warn = false;
  if (s === 'new') hint = t('wf_new');
  else if (s === 'confirmed') hint = proof ? t('wf_confirmed') : t('wf_confirmedNoArt');
  else if (s === 'proof') hint = proof?.status === 'approved' || !proof ? t('wf_proofApproved') : t('wf_proof');
  else if (s === 'processing') {
    const start = productionStartedAt(order) ?? order.createdAt;
    const due = productionDue(order, products);
    hint = t('wf_processing', { date: shortDate(start, lang), days: orderLeadDays(order, products), due: due ? date(due, lang, { weekday: 'short', day: 'numeric', month: 'short' }) : '—' });
    if (productionOverdue(order, products) && due) {
      warn = true;
      hint = (
        <>
          {hint} <span className="font-semibold text-[#8A1B0A]">{t('wf_overdue', { n: daysLate(order, products), due: shortDate(due, lang) })}</span>
        </>
      );
    }
  } else if (s === 'shipped')
    hint = (
      <>
        {t('wf_shipped', { date: shortDate(f?.shippedAt ?? order.createdAt, lang) })}
        {f?.carrier && <> · {isCarrierKey(f.carrier) ? to(`carrier_${f.carrier}`) : f.carrier}</>}
        {f?.tracking && <> · {t('trackingNo', { n: f.tracking })}</>}
      </>
    );
  else if (s === 'completed') hint = t('wf_completed', { date: shortDate(f?.deliveredAt ?? order.createdAt, lang) });

  const canProduce = s === 'proof' && (!proof || proof.status === 'approved');

  return (
    <Card title={t('workflow')} actions={<OrderStatusPill status={s} />}>
      <StatusStepper order={order} />
      <div className="mt-5 flex flex-col gap-3 border-t border-line/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn('flex min-w-0 items-start gap-2 text-[13.5px] leading-relaxed', warn ? 'text-ink' : 'text-ink-soft')}>
          {warn && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B42318]" />}
          <span>{hint}</span>
        </p>
        {editable && (
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            {s === 'new' && (
              <Button size="sm" shape="rounded" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => advance('confirmed')}>
                {t('confirm')}
              </Button>
            )}
            {s === 'confirmed' &&
              (proof ? (
                <Button size="sm" shape="rounded" icon={<FileCheck2 className="h-4 w-4" />} onClick={toPrepress}>
                  {t('toPrepress')}
                </Button>
              ) : (
                <Button size="sm" shape="rounded" icon={<ArrowRight className="h-4 w-4" />} onClick={() => advance('processing')}>
                  {t('startProduction')}
                </Button>
              ))}
            {s === 'proof' && (
              <Tip tip={!canProduce && t('startProductionTip')}>
                <Button size="sm" shape="rounded" icon={<Printer className="h-4 w-4" />} onClick={() => advance('processing')} disabled={!canProduce}>
                  {t('startProduction')}
                </Button>
              </Tip>
            )}
            {s === 'processing' && (ful === 'unfulfilled' || ful === 'partial') && (
              <Button size="sm" shape="rounded" icon={<PackageCheck className="h-4 w-4" />} onClick={onFulfil}>
                {t('prepare')}
              </Button>
            )}
            {s === 'shipped' && ful === 'partial' && (
              <Button variant="outline" size="sm" shape="rounded" icon={<Truck className="h-4 w-4" />} onClick={onFulfil}>
                {t('prepare')}
              </Button>
            )}
            {s === 'shipped' && ful !== 'partial' && (
              <Button size="sm" shape="rounded" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => advance('completed')}>
                {t('markDelivered')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ================================================================== */
/* Artikujt e porosisë                                                 */
/* ================================================================== */
function ItemsCard({ order, t }: { order: Order; t: Dict }) {
  const to = useDict(od, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const products = useDb((s) => s.products);
  const discounts = useDb((s) => s.discounts);
  const ful = fulfillmentOf(order);
  const s = order.status;
  const f = order.fulfillment;

  return (
    <Card
      title={
        <span className="flex flex-wrap items-center gap-2">
          {t('items')}
          {s === 'cancelled' ? <CancelledBadge /> : <FulfilBadge state={ful} />}
        </span>
      }
      actions={<span className="hidden text-[12.5px] text-muted sm:inline">{to(pluralKey('items', order.items.length, lang), { n: order.items.length })} · {t('exclVat')}</span>}
      padded={false}
    >
      <ul className="divide-y divide-line/70">
        {order.items.map((l, i) => {
          const product = products.find((p) => p.id === l.productId);
          const loc = localizeLine(l, product, order.lang, lang);
          const design = designAmount(l, products);
          const gross = round2(l.lineTotal + design);
          const net = orderLineNet(order, i);
          const allocations = l.allocations ?? [];
          const tq = tierQty(product, l.qty);
          const art = artworkOf(l, products);
          const u = unitLabel(l.unit, lang);
          return (
            <li key={`${l.productId}-${i}`} className="flex gap-3 px-4 py-3.5 sm:px-5">
              <Thumb src={l.image} className="h-12 w-12 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    {product && can('products') ? (
                      <Link to={`/admin/produktet/${product.id}`} className="font-semibold leading-snug text-ink hover:underline">
                        {loc.name}
                      </Link>
                    ) : (
                      <span className="font-semibold leading-snug text-ink">{loc.name}</span>
                    )}
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {l.custom ? t('custom') : <span className="font-mono text-[11.5px]">{l.sku}</span>}
                      {loc.options && <> · {loc.options}</>}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {tq != null && <span className="inline-flex h-[22px] items-center rounded-md bg-canvas px-2 text-[12px] font-medium text-ink-soft">{t('tier', { q: num(tq, lang), u })}</span>}
                      {design > 0 && (
                        <span className="inline-flex h-[22px] items-center gap-1.5 rounded-md bg-canvas px-2 text-[12px] font-medium text-ink-soft">
                          <PenLine className="h-3 w-3" />
                          {t('design')} · {money(design, lang)}
                        </span>
                      )}
                      {art && <ArtworkBadge status={art.status} />}
                    </div>
                    {allocations.length > 0 && (
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {allocations.map((a) => {
                          const applied = order.discounts?.find((d) => d.id === a.discountId);
                          return (
                            <li key={a.discountId} className="inline-flex items-center gap-1 rounded-md bg-canvas px-1.5 py-0.5 text-[12px] text-ink-soft">
                              <Tag className="h-3 w-3" />
                              {applied?.code ?? discountName(a.discountId, applied?.title ?? '', discounts, lang)}
                              <span className="tabular-nums">−{money(a.amount, lang)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="flex shrink-0 items-baseline justify-between gap-6 sm:justify-end">
                    <span className="text-[13px] tabular-nums text-ink-soft">
                      {qtyLabel(l, lang)} × {unitMoney(l.unitPrice, lang)}
                    </span>
                    <span className="min-w-[88px] text-right tabular-nums">
                      {net < gross - 0.004 && <span className="block text-[12px] text-muted line-through">{money(gross, lang)}</span>}
                      <span className="block font-semibold text-ink">{money(net, lang)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {f?.shippedAt && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-line/70 bg-canvas/40 px-4 py-3 text-[13px] text-ink-soft sm:px-5">
          <Truck className="h-4 w-4 text-ink" />
          <span>{t('shippedOn', { date: shortDate(f.shippedAt, lang) })}</span>
          {f.carrier && <span>· {isCarrierKey(f.carrier) ? to(`carrier_${f.carrier}`) : f.carrier}</span>}
          {f.tracking && <span>· {t('trackingNo', { n: f.tracking })}</span>}
          {f.deliveredAt && <span>· {t('deliveredOn', { date: shortDate(f.deliveredAt, lang) })}</span>}
        </div>
      )}
    </Card>
  );
}

/* ================================================================== */
/* Pagesa dhe historiku                                                */
/* ================================================================== */
function PaymentCard({ order, t, onRefund, refundable }: { order: Order; t: Dict; onRefund: () => void; refundable: boolean }) {
  const to = useDict(od, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const settings = useSettings();
  const products = useDb((s) => s.products);
  const discounts = useDb((s) => s.discounts);
  const updateOrder = useDb((s) => s.updateOrder);
  const logAudit = useDb((s) => s.logAudit);
  const pay = paymentOf(order);
  const PayIcon = PAY_ICON[order.payment.method];
  const refunded = refundedOf(order);
  const applied = order.discounts ?? [];
  const lineDiscounts = applied.filter((d) => d.kind !== 'shipping');
  const shipDiscount = applied.find((d) => d.kind === 'shipping');
  const shipBefore = order.shippingBeforeDiscount ?? order.shipping;
  const paidAmount = pay === 'paid' || pay === 'partially_refunded' || pay === 'refunded' ? order.total : 0;
  const itemCount = to(pluralKey('items', order.items.length, lang), { n: order.items.length });
  const netPricing = settings.pricesIncludeVat === false;
  const net = orderNet(order);

  // production cost & margin — internal, permission "viewCost" (cost per piece × pieces, net)
  const cost = useMemo(() => {
    let sum = 0;
    for (const l of order.items) {
      if (l.custom) continue;
      const p = products.find((x) => x.id === l.productId);
      if (!p?.cost) return null;
      sum += p.cost * l.qty;
    }
    return round2(sum);
  }, [order.items, products]);
  const goodsNet = round2(order.items.reduce((s, _, i) => s + orderLineNet(order, i), 0));
  const showCost = can('products', 'viewCost') && cost != null && cost > 0 && order.status !== 'cancelled';

  const markPaid = () => {
    updateOrder(order.id, { payment: { ...order.payment, status: 'paid', failed: false }, timeline: [...order.timeline, { at: new Date().toISOString(), status: 'payment', by: 'admin' }] });
    logAudit({ action: 'status', object: 'order', objectId: order.id, detail: `${order.number}: payment → paid` });
    toast.success(t('markedPaid'));
  };

  const canMarkPaid = (pay === 'pending' || pay === 'authorized' || pay === 'failed') && order.status !== 'cancelled' && can('orders', 'edit');

  return (
    <Card
      title={
        <span className="flex flex-wrap items-center gap-2">
          {t('payment')}
          <PayBadge state={pay} />
        </span>
      }
      actions={
        <span className="hidden items-center gap-1.5 text-[12.5px] text-muted sm:inline-flex">
          <PayIcon className="h-4 w-4" />
          {tc(`pay_${order.payment.method}`)}
        </span>
      }
    >
      <dl>
        <SumRow label={t('subtotal')} sub={itemCount} value={money(order.subtotal, lang)} />
        {order.installationTotal > 0 && <SumRow label={t('design')} value={money(order.installationTotal, lang)} />}
        {lineDiscounts.length > 0
          ? lineDiscounts.map((d) => (
              <SumRow
                key={d.id}
                label={
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    {tc('discount')} · {discountName(d.id, d.title, discounts, lang)}
                    {d.code && <CodeChip>{d.code}</CodeChip>}
                  </span>
                }
                sub={`${to(`kind_${d.kind}`)} · ${d.code ? to('code') : to('auto')}`}
                value={`−${money(d.amount, lang)}`}
              />
            ))
          : order.discount > 0 && <SumRow label={order.coupon?.code ? <span className="inline-flex items-center gap-1.5">{tc('discount')} <CodeChip>{order.coupon.code}</CodeChip></span> : tc('discount')} value={`−${money(order.discount, lang)}`} />}
        <SumRow
          label={t('shippingRow', { method: tc(`delivery_${order.delivery.method}`) })}
          sub={shipDiscount ? t('freeBy', { name: discountName(shipDiscount.id, shipDiscount.title, discounts, lang) }) : undefined}
          value={
            shipDiscount && shipBefore > order.shipping ? (
              <span>
                <span className="mr-1.5 text-muted line-through">{money(shipBefore, lang)}</span>
                {order.shipping > 0 ? money(order.shipping, lang) : tc('free')}
              </span>
            ) : order.shipping > 0 ? (
              money(order.shipping, lang)
            ) : (
              tc('free')
            )
          }
        />
        <div className="my-1.5 border-t border-line/70" />
        {netPricing ? (
          <>
            <SumRow label={t('netTotal')} value={money(net, lang)} />
            <SumRow label={tc('vat', { rate: settings.vatRate })} value={money(order.vat, lang)} />
            <SumRow strong label={t('total')} value={<span className={cn('text-[16px]', order.status === 'cancelled' && 'text-muted line-through')}>{money(order.total, lang)}</span>} />
          </>
        ) : (
          <SumRow strong label={t('total')} sub={t('vatIncluded', { rate: settings.vatRate, amount: money(order.vat, lang) })} value={<span className={cn('text-[16px]', order.status === 'cancelled' && 'text-muted line-through')}>{money(order.total, lang)}</span>} />
        )}
      </dl>

      <div className="mt-3 rounded-lg bg-canvas/70 px-3.5 py-2">
        <SumRow label={paidAmount > 0 ? t('paidByCustomer') : t('due')} sub={paidAmount === 0 && order.payment.method === 'bank' ? t('bankRef', { n: order.number }) : undefined} value={money(paidAmount > 0 ? paidAmount : order.total, lang)} />
        {(order.refunds ?? []).map((r) => (
          <SumRow key={r.id} muted label={t('refundedRow', { date: shortDate(r.at, lang) })} sub={r.note} value={`−${money(r.amount, lang)}`} />
        ))}
        {!order.refunds?.length && refunded > 0 && <SumRow muted label={to('pay_refunded')} value={`−${money(refunded, lang)}`} />}
        {refunded > 0 && <SumRow strong label={t('net')} value={money(round2(paidAmount - refunded), lang)} />}
      </div>

      {showCost && (
        <div className="mt-3 rounded-lg border border-dashed border-line px-3.5 py-1.5" title={t('costHint')}>
          <SumRow label={<span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> {t('cost')}</span>} value={money(cost!, lang)} />
          <SumRow label={t('margin')} value={`${money(round2(goodsNet - cost!), lang)} · ${goodsNet > 0 ? Math.round(((goodsNet - cost!) / goodsNet) * 100) : 0}%`} />
        </div>
      )}

      {(canMarkPaid || refundable) && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {canMarkPaid && (
            <Button variant="outline" size="sm" shape="rounded" icon={<CheckCircle2 className="h-4 w-4" />} onClick={markPaid}>
              {t('markPaid')}
            </Button>
          )}
          {refundable && (
            <Tip tip={!can('orders', 'refund') && to('noPermission')}>
              <Button variant="outline" size="sm" shape="rounded" icon={<RotateCcw className="h-4 w-4" />} onClick={onRefund} disabled={!can('orders', 'refund')}>
                {t('refund')}
              </Button>
            </Tip>
          )}
        </div>
      )}

      <div className="-mx-5 mt-5 border-t border-line/70 px-5 pt-4">
        <h3 className="mb-3 text-[13.5px] font-semibold text-ink">{t('history')}</h3>
        <OrderTimeline order={order} />
      </div>
    </Card>
  );
}

/* ================================================================== */
/* Right column                                                        */
/* ================================================================== */
function CustomerCard({ order, t }: { order: Order; t: Dict }) {
  const to = useDict(od, 'admin');
  const orders = useDb((s) => s.orders);
  const updateOrder = useDb((s) => s.updateOrder);
  const logAudit = useDb((s) => s.logAudit);
  const can = useCan();
  const c = order.customer;
  const count = useMemo(() => {
    const key = customerKeyOf(order);
    return orders.filter((o) => customerKeyOf(o) === key).length;
  }, [orders, order]);
  const lang = useLang('admin');
  const [editingPo, setEditingPo] = useState(false);
  const [po, setPo] = useState(order.poNumber ?? '');
  useEffect(() => setPo(order.poNumber ?? ''), [order.poNumber]);

  const savePo = () => {
    const v = po.trim();
    updateOrder(order.id, { poNumber: v || undefined });
    logAudit({ action: 'update', object: 'order', objectId: order.id, detail: `${order.number}: PO ${v || '—'}` });
    setEditingPo(false);
    toast.success(t('poSaved'));
  };

  const nameLink = (label: string, className: string) =>
    can('customers') ? (
      <Link to={customerLink(order)} className={cn(className, 'hover:underline')}>
        {label}
      </Link>
    ) : (
      <span className={className}>{label}</span>
    );

  return (
    <Card title={t('customer')}>
      <div className="space-y-3 text-[13.5px]">
        <div>
          {c.company ? (
            <>
              <p className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted" />
                {nameLink(c.company, 'font-semibold text-ink')}
              </p>
              {c.pib && (
                <p className="mt-0.5 text-[12.5px] text-muted">
                  <span className="font-mono text-ink-soft">{withLabel(c.pib, t('nui'))}</span>
                </p>
              )}
              <p className="mt-1.5 text-ink-soft">
                <span className="text-muted">{t('contact')}:</span> {customerName(order)}
              </p>
            </>
          ) : (
            <>
              {nameLink(customerName(order), 'font-semibold text-ink')}
              {c.pib && (
                <p className="mt-0.5 text-[12.5px] text-muted">
                  <span className="font-mono text-ink-soft">{withLabel(c.pib, t('nui'))}</span>
                </p>
              )}
            </>
          )}
          <Link to={`/admin/porosite?q=${encodeURIComponent(c.email || c.phone)}`} className="mt-0.5 block text-[12.5px] text-muted hover:text-ink hover:underline">
            {to(pluralKey('orders', count, lang), { n: count })}
          </Link>
        </div>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2 text-ink-soft">
            <Mail className="h-3.5 w-3.5 shrink-0 text-muted" />
            {c.email ? (
              <a href={`mailto:${c.email}?subject=${encodeURIComponent(`#${order.number}`)}`} className="truncate hover:text-ink hover:underline">
                {c.email}
              </a>
            ) : (
              <span className="text-muted">{t('noEmail')}</span>
            )}
          </li>
          {c.phone && (
            <li className="flex items-center gap-2 text-ink-soft">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted" />
              <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="hover:text-ink hover:underline">
                {c.phone}
              </a>
            </li>
          )}
        </ul>

        {/* PO number */}
        <div className="border-t border-line/70 pt-3">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow>{t('poLabel')}</Eyebrow>
            {can('orders', 'edit') && !editingPo && (
              <button type="button" onClick={() => setEditingPo(true)} className="text-[12.5px] font-semibold text-ink-soft hover:text-ink hover:underline">
                {order.poNumber ? t('editNote') : <Plus className="h-3.5 w-3.5" aria-label={t('poLabel')} />}
              </button>
            )}
          </div>
          {editingPo ? (
            <div className="mt-1.5 flex gap-1.5">
              <input
                autoFocus
                value={po}
                onChange={(e) => setPo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') savePo();
                  if (e.key === 'Escape') setEditingPo(false);
                }}
                placeholder={t('poPh')}
                aria-label={t('poLabel')}
                className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-white px-2.5 font-mono text-[13px] outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
              />
              <Button size="xs" shape="rounded" variant="dark" onClick={savePo}>
                {t('save')}
              </Button>
            </div>
          ) : (
            <p className={cn('mt-1 text-[13.5px]', order.poNumber ? 'font-mono font-medium text-ink' : 'text-muted')}>{order.poNumber ?? t('poNone')}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function DeliveryCard({ order, t }: { order: Order; t: Dict }) {
  const to = useDict(od, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const settings = useSettings();
  const c = order.customer;
  const pickup = order.delivery.method === 'pickup';
  const zone = pickup ? null : zoneForCity(settings, c.city);
  const f = order.fulfillment;
  return (
    <Card title={t('delivery')}>
      <div className="space-y-3 text-[13.5px]">
        <p className="flex items-center gap-2 font-medium text-ink">
          {pickup ? <Store className="h-4 w-4 text-muted" /> : <Truck className="h-4 w-4 text-muted" />}
          {tc(`delivery_${order.delivery.method}`)}
        </p>
        {pickup ? (
          <p className="text-ink-soft">{t('pickupAt', { addr: settings.pickupAddress })}</p>
        ) : (
          <div className="text-ink-soft">
            {c.company && <p className="font-medium text-ink">{c.company}</p>}
            <p>{customerName(order)}</p>
            <p>{c.address}</p>
            <p>{c.city}</p>
            {(c.address || c.city) && (
              <a href={mapsUrl(c.address, c.city)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink hover:underline">
                <MapPin className="h-3.5 w-3.5" /> {t('openMap')} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
        {zone && <p className="text-[12.5px] text-muted">{t('zone', { zone: zone.name, days: zone.days })}</p>}
        {order.delivery.date && (
          <p className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft">
            <CalendarClock className="h-3.5 w-3.5" />
            {t('deliveryDate', { date: date(order.delivery.date, lang, { weekday: 'short', day: 'numeric', month: 'short' }) })}
          </p>
        )}
        <div className="border-t border-line/70 pt-3 text-[12.5px]">
          {f?.tracking ? (
            <p className="text-ink-soft">
              {f.carrier && <span className="font-medium text-ink">{isCarrierKey(f.carrier) ? to(`carrier_${f.carrier}`) : f.carrier} · </span>}
              {t('trackingNo', { n: f.tracking })}
            </p>
          ) : f?.carrier ? (
            <p className="text-ink-soft">{isCarrierKey(f.carrier) ? to(`carrier_${f.carrier}`) : f.carrier}</p>
          ) : (
            <p className="text-muted">{t('trackingLater')}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function NotesCard({ order, t }: { order: Order; t: Dict }) {
  const can = useCan();
  const updateOrder = useDb((s) => s.updateOrder);
  const editable = can('orders', 'edit');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(order.internalNote ?? '');
  const [tag, setTag] = useState('');
  const tags = order.tags ?? [];

  useEffect(() => setDraft(order.internalNote ?? ''), [order.internalNote]);

  const saveNote = () => {
    updateOrder(order.id, { internalNote: draft.trim() || undefined });
    setEditing(false);
    toast.success(t('noteSaved'));
  };
  const addTag = () => {
    const v = tag.trim().toLowerCase();
    if (!v || tags.includes(v)) return setTag('');
    updateOrder(order.id, { tags: [...tags, v] });
    setTag('');
  };

  return (
    <Card
      title={t('notes')}
      actions={
        editable && !editing ? (
          <button type="button" onClick={() => setEditing(true)} className="text-[12.5px] font-semibold text-ink-soft hover:text-ink hover:underline">
            {order.internalNote ? t('editNote') : <span className="inline-flex items-center gap-1"><Plus className="h-3.5 w-3.5" />{t('internalNote')}</span>}
          </button>
        ) : undefined
      }
    >
      <div className="space-y-3 text-[13.5px]">
        {order.customer.note && (
          <div>
            <Eyebrow>{t('customerNote')}</Eyebrow>
            <p className="mt-1 whitespace-pre-line text-ink">{order.customer.note}</p>
          </div>
        )}
        {editing ? (
          <div>
            <Eyebrow>{t('internalNote')}</Eyebrow>
            <textarea
              autoFocus
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-1 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] leading-relaxed outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="xs"
                shape="rounded"
                aria-label={t('notes')}
                onClick={() => {
                  setEditing(false);
                  setDraft(order.internalNote ?? '');
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button size="xs" shape="rounded" onClick={saveNote}>
                {t('save')}
              </Button>
            </div>
          </div>
        ) : (
          order.internalNote && (
            <div>
              <Eyebrow>{t('internalNote')}</Eyebrow>
              <p className="mt-1 whitespace-pre-line text-ink">{order.internalNote}</p>
            </div>
          )
        )}
        {!order.customer.note && !order.internalNote && !editing && <p className="text-muted">{t('noNotes')}</p>}

        <div className="border-t border-line/70 pt-3">
          <Eyebrow>{t('tags')}</Eyebrow>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.map((tg) => (
              <span key={tg} className="inline-flex h-6 items-center gap-1 rounded-md bg-[#EBEBEB] pl-2 pr-1 text-[12px] font-medium text-ink">
                {tg}
                {editable && (
                  <button type="button" aria-label={`× ${tg}`} onClick={() => updateOrder(order.id, { tags: tags.filter((x) => x !== tg) })} className="grid h-4 w-4 place-items-center rounded hover:bg-black/10">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
            {editable && (
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder={t('addTag')}
                aria-label={t('addTag')}
                className="h-6 min-w-[110px] flex-1 rounded-md border border-dashed border-line bg-transparent px-2 text-[12px] outline-none focus:border-ink/40"
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function DiscountCard({ order, t }: { order: Order; t: Dict }) {
  const to = useDict(od, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const discounts = useDb((s) => s.discounts);
  const applied = order.discounts ?? [];
  const legacy = !applied.length && order.coupon?.code ? order.coupon : null;
  return (
    <Card title={t('discount')}>
      {applied.length === 0 && !legacy ? (
        <p className="text-[13.5px] text-muted">{t('noDiscount')}</p>
      ) : (
        <ul className="space-y-2.5 text-[13.5px]">
          {legacy && (
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-ink-soft">
                {to('code')} <CodeChip>{legacy.code}</CodeChip>
              </span>
              <span className="tabular-nums text-ink">−{money(legacy.discount, lang)}</span>
            </li>
          )}
          {applied.map((d) => {
            const exists = discounts.some((x) => x.id === d.id);
            const name = discountName(d.id, d.title, discounts, lang);
            return (
              <li key={d.id} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5 text-ink-soft">
                    {d.code ? (
                      <>
                        {to('code')} <CodeChip>{d.code}</CodeChip>
                      </>
                    ) : (
                      to('auto')
                    )}
                  </span>
                  {exists && can('discounts') ? (
                    <Link to={`/admin/zbritjet/${d.id}`} className="mt-0.5 block truncate text-[12.5px] text-muted hover:text-ink hover:underline">
                      {name}
                    </Link>
                  ) : (
                    <span className="mt-0.5 block truncate text-[12.5px] text-muted">{name}</span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-ink">−{money(d.amount, lang)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function ReturnsCard({ order, t }: { order: Order; t: Dict }) {
  const lang = useLang('admin');
  const can = useCan();
  const all = useDb((s) => s.returns);
  const returns = useMemo(() => all.filter((r) => r.orderId === order.id), [all, order.id]);
  if (!returns.length || !can('returns')) return null;
  return (
    <Card title={t('returns')}>
      <ul className="space-y-2.5 text-[13.5px]">
        {returns.map((r) => (
          <li key={r.id}>
            <Link to={`/admin/kthimet?id=${r.id}`} className="flex items-center justify-between gap-3 rounded-lg px-1 py-0.5 hover:bg-canvas">
              <span className="flex min-w-0 items-center gap-2">
                <span className="font-semibold text-ink">{r.number}</span>
                <ReturnBadge status={r.status} />
              </span>
              <span className="shrink-0 tabular-nums text-ink-soft">{money(r.refundAmount, lang)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
