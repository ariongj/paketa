import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { AlertTriangle, Archive, ArchiveRestore, ArrowDown, ArrowUp, CheckCheck, ChevronDown, Download, Eye, Plus, ShoppingBag, X } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { Card, PageHeader, SearchInput, Table, Td, Th } from '@/admin/components/kit';
import { ALL_STATUSES, archivePatch, channelOf, csvNum, customerName, discountName, isArchived, localizeLine, matchesOrder, pluralKey, qtyLabel, toCsv } from '@/admin/components/orders/helpers';
import { PROOF_STATUSES, artworkSummary, orderNet, productionOverdue, proofOf, waitingForFiles } from '@/admin/components/orders/print';
import { ArchivedBadge, CancelledBadge, FilesBadge, FulfilBadge, OrderStatusPill, PayBadge, ProofBadge } from '@/admin/components/orders/status';
import { Check, SelectInput, Stat, Tabs, Tip } from '@/admin/components/orders/ui';
import { od } from '@/admin/components/orders/dict';
import { adm } from '@/admin/i18n';
import { defineDict, useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useCan } from '@/store/hooks';
import { FULFILLMENT_STATES, PAYMENT_STATES, fulfillmentOf, paymentOf, refundedOf } from '@/lib/orders';
import { date, money } from '@/lib/format';
import { cn, download } from '@/lib/utils';
import type { FulfillmentState, Lang, Order, OrderStatus, PaymentState, Product, ProofStatus } from '@/lib/types';

const T = defineDict({
  sq: {
    description: 'Porositë nga Online Store dhe porositë B2B të ekipit — nga skedarët e printimit dhe prova, te prodhimi dhe dërgesa.',
    create: 'Krijo porosi',
    exportCsv: 'Eksporto CSV',
    exported: 'CSV u shkarkua: {n}',
    markAllSeen: 'Shëno të gjitha si të shikuara',
    markedSeen: 'Të gjitha porositë u shënuan si të shikuara',
    tab_all: 'Të gjitha',
    tab_files: 'Pret skedarët',
    tab_proof: 'Prepress & provë',
    tab_production: 'Në prodhim',
    tab_unfulfilled: 'Pa u dërguar',
    tab_unpaid: 'Të papaguara',
    tab_archived: 'Të arkivuara',
    searchPh: 'Kërko numrin, kompaninë, NUI-n, PO-në, klientin ose e-mailin',
    f_payment: 'Pagesa',
    f_fulfilment: 'Përmbushja',
    f_status: 'Statusi',
    f_proof: 'Prova',
    f_channel: 'Kanali',
    f_period: 'Periudha',
    f_any: 'Të gjitha',
    period_today: 'Sot',
    period_7: '7 ditët e fundit',
    period_30: '30 ditët e fundit',
    period_90: '90 ditët e fundit',
    period_all: 'E gjithë periudha',
    overdueChip: 'Me vonesë në prodhim',
    clearFilters: 'Pastro filtrat',
    col_order: 'Porosia',
    col_customer: 'Klienti',
    col_status: 'Statusi',
    col_prepress: 'Prova & skedarët',
    col_payment: 'Pagesa',
    col_fulfilment: 'Përmbushja',
    col_total: 'Totali',
    netShort: '{amount} pa TVSH',
    unseen: 'E re — e pashikuar',
    refundedShort: '−{amount} rimburs.',
    selectAll: 'Zgjidh të gjitha të shfaqurat',
    selectRow: 'Zgjidh {n}',
    archive: 'Arkivo',
    unarchive: 'Hiq nga arkivi',
    exportSelected: 'Eksporto të zgjedhurat',
    markSeen: 'Shëno si të shikuara',
    archivedToast: 'U arkivuan: {n}. Pagesa dhe përmbushja mbeten të pandryshuara.',
    unarchivedToast: 'U kthyen në listë: {n}',
    undo: 'Zhbëj',
    stat_files: 'Pret skedarët',
    stat_filesHint: 'porosi të hapura pa skedar printimi',
    stat_proofs: 'Prova te klienti',
    stat_proofsHint: 'në pritje të aprovimit',
    stat_proofsChanges: '{n} me ndryshime të kërkuara',
    stat_production: 'Në prodhim',
    stat_productionHint: 'të gjitha brenda afatit',
    stat_productionLate: '{n} me vonesë',
    stat_unpaid: 'Në pritje të pagesës',
    emptyAllTitle: 'Ende nuk ka porosi',
    emptyAllText: 'Kur klientët porosisin nga Online Store, ose ekipi konverton një draft B2B, porositë shfaqen këtu.',
    emptyTitle: 'Nuk ka porosi për këta filtra',
    emptyText: 'Ndryshoni skedën, filtrat ose termin e kërkimit.',
    emptyFilesTitle: 'Asnjë porosi nuk pret skedarë',
    emptyFilesText: 'Të gjitha porositë e hapura i kanë skedarët e printimit ose dizajnin nga PrintWorks.',
    emptyArchivedTitle: 'Arkivi është bosh',
    emptyArchivedText: 'Arkivoni porositë e mbyllura që lista të mbetet e pastër — arkivimi nuk ndryshon pagesën as përmbushjen.',
    showMore: 'Shfaq më shumë',
    showing: 'Shfaqen {n} nga {total}',
    csvFile: 'porosite',
    csv_number: 'Numri',
    csv_date: 'Data',
    csv_company: 'Kompania',
    csv_nui: 'NUI',
    csv_customer: 'Personi kontaktues',
    csv_email: 'E-mail',
    csv_phone: 'Telefoni',
    csv_city: 'Qyteti',
    csv_address: 'Adresa',
    csv_po: 'Nr. PO',
    csv_items: 'Artikujt',
    csv_channel: 'Kanali',
    csv_delivery: 'Dërgesa',
    csv_method: 'Mënyra e pagesës',
    csv_payment: 'Pagesa',
    csv_fulfilment: 'Përmbushja',
    csv_status: 'Statusi',
    csv_proof: 'Prova',
    csv_files: 'Skedarët gati',
    csv_design: 'Dizajn & prepress',
    csv_discounts: 'Zbritjet e aplikuara',
    csv_net: 'Totali pa TVSH',
    csv_vat: 'TVSH',
    csv_total: 'Totali me TVSH',
    csv_refunded: 'Rimbursuar',
    csv_archived: 'E arkivuar',
  },
  en: {
    description: 'Online Store orders and the team’s B2B orders — from print files and proof to production and delivery.',
    create: 'Create order',
    exportCsv: 'Export CSV',
    exported: 'CSV downloaded: {n}',
    markAllSeen: 'Mark all as viewed',
    markedSeen: 'All orders marked as viewed',
    tab_all: 'All',
    tab_files: 'Awaiting files',
    tab_proof: 'Prepress & proof',
    tab_production: 'In production',
    tab_unfulfilled: 'Not shipped',
    tab_unpaid: 'Unpaid',
    tab_archived: 'Archived',
    searchPh: 'Search number, company, business no., PO, customer or e-mail',
    f_payment: 'Payment',
    f_fulfilment: 'Fulfilment',
    f_status: 'Status',
    f_proof: 'Proof',
    f_channel: 'Channel',
    f_period: 'Period',
    f_any: 'All',
    period_today: 'Today',
    period_7: 'Last 7 days',
    period_30: 'Last 30 days',
    period_90: 'Last 90 days',
    period_all: 'All time',
    overdueChip: 'Late in production',
    clearFilters: 'Clear filters',
    col_order: 'Order',
    col_customer: 'Customer',
    col_status: 'Status',
    col_prepress: 'Proof & files',
    col_payment: 'Payment',
    col_fulfilment: 'Fulfilment',
    col_total: 'Total',
    netShort: '{amount} excl. VAT',
    unseen: 'New — not viewed yet',
    refundedShort: '−{amount} refunded',
    selectAll: 'Select all shown',
    selectRow: 'Select {n}',
    archive: 'Archive',
    unarchive: 'Unarchive',
    exportSelected: 'Export selected',
    markSeen: 'Mark as viewed',
    archivedToast: 'Archived: {n}. Payment and fulfilment are unchanged.',
    unarchivedToast: 'Back in the list: {n}',
    undo: 'Undo',
    stat_files: 'Awaiting files',
    stat_filesHint: 'open orders without a print file',
    stat_proofs: 'Proofs with customers',
    stat_proofsHint: 'waiting for approval',
    stat_proofsChanges: '{n} with changes requested',
    stat_production: 'In production',
    stat_productionHint: 'all on schedule',
    stat_productionLate: '{n} running late',
    stat_unpaid: 'Awaiting payment',
    emptyAllTitle: 'No orders yet',
    emptyAllText: 'When customers order from the Online Store, or the team converts a B2B draft, orders appear here.',
    emptyTitle: 'No orders match these filters',
    emptyText: 'Try another tab, filter or search term.',
    emptyFilesTitle: 'No order is waiting for files',
    emptyFilesText: 'Every open order has its print files or is designed by PrintWorks.',
    emptyArchivedTitle: 'The archive is empty',
    emptyArchivedText: 'Archive closed orders to keep the list tidy — archiving does not change payment or fulfilment.',
    showMore: 'Show more',
    showing: 'Showing {n} of {total}',
    csvFile: 'orders',
    csv_number: 'Number',
    csv_date: 'Date',
    csv_company: 'Company',
    csv_nui: 'Business no. (NUI)',
    csv_customer: 'Contact person',
    csv_email: 'E-mail',
    csv_phone: 'Phone',
    csv_city: 'City',
    csv_address: 'Address',
    csv_po: 'PO number',
    csv_items: 'Items',
    csv_channel: 'Channel',
    csv_delivery: 'Delivery',
    csv_method: 'Payment method',
    csv_payment: 'Payment',
    csv_fulfilment: 'Fulfilment',
    csv_status: 'Status',
    csv_proof: 'Proof',
    csv_files: 'Files ready',
    csv_design: 'Design & prepress',
    csv_discounts: 'Applied discounts',
    csv_net: 'Total excl. VAT',
    csv_vat: 'VAT',
    csv_total: 'Total incl. VAT',
    csv_refunded: 'Refunded',
    csv_archived: 'Archived',
  },
});

type Tab = 'all' | 'files' | 'proof' | 'production' | 'unfulfilled' | 'unpaid' | 'archived';
type Period = 'today' | '7' | '30' | '90' | 'all';
type Channel = 'online' | 'draft';
type SortKey = 'date' | 'total';
const TABS: Tab[] = ['all', 'files', 'proof', 'production', 'unfulfilled', 'unpaid', 'archived'];
const PERIODS: Period[] = ['all', 'today', '7', '30', '90'];
const PAGE = 25;
const DAY = 86400000;

const isUnfulfilled = (o: Order) => o.status !== 'cancelled' && (fulfillmentOf(o) === 'unfulfilled' || fulfillmentOf(o) === 'partial');
const isUnpaid = (o: Order) => o.status !== 'cancelled' && ['pending', 'authorized', 'failed'].includes(paymentOf(o));

function inTab(o: Order, tab: Tab, products: Product[]) {
  if (tab === 'archived') return isArchived(o);
  if (isArchived(o)) return false;
  switch (tab) {
    case 'files':
      return waitingForFiles(o, products);
    case 'proof':
      return o.status === 'proof';
    case 'production':
      return o.status === 'processing';
    case 'unfulfilled':
      return isUnfulfilled(o);
    case 'unpaid':
      return isUnpaid(o);
    default:
      return true;
  }
}

const periodStart = (p: Period) => {
  if (p === 'all') return 0;
  if (p === 'today') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  return Date.now() - Number(p) * DAY;
};

const dayOf = (iso: string, lang: Lang) => date(iso, lang, { day: 'numeric', month: 'short' });
const timeOf = (iso: string, lang: Lang) => date(iso, lang, { hour: '2-digit', minute: '2-digit' });
const oneOf = <V extends string>(v: string | null, list: readonly V[]): V | '' => (v && (list as readonly string[]).includes(v) ? (v as V) : '');

export default function Orders() {
  const t = useDict(T, 'admin');
  const to = useDict(od, 'admin');
  const ta = useDict(adm, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const navigate = useNavigate();
  const orders = useDb((s) => s.orders);
  const products = useDb((s) => s.products);
  const discounts = useDb((s) => s.discounts);
  const updateOrder = useDb((s) => s.updateOrder);
  const markOrderSeen = useDb((s) => s.markOrderSeen);
  const markAllOrdersSeen = useDb((s) => s.markAllOrdersSeen);
  const logAudit = useDb((s) => s.logAudit);

  /* ---------------- filters (deep-linkable: tab, status, proof, files, overdue, payment, fulfillment, period, q) ---------------- */
  const [params, setParams] = useSearchParams();
  const rawTab = (params.get('tab') as Tab | null) ?? (params.get('files') === 'missing' ? 'files' : null);
  const tab: Tab = rawTab && TABS.includes(rawTab) ? rawTab : 'all';
  const status = oneOf<OrderStatus>(params.get('status'), ALL_STATUSES);
  const proofF = oneOf<ProofStatus>(params.get('proof'), PROOF_STATUSES);
  const overdue = params.get('overdue') === '1';
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'tab') next.delete('files');
    setParams(next, { replace: true });
    setLimit(PAGE);
    setSelected(new Set());
  };
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [pay, setPay] = useState<PaymentState | ''>(() => oneOf(params.get('payment'), PAYMENT_STATES));
  const [ful, setFul] = useState<FulfillmentState | ''>(() => oneOf(params.get('fulfillment'), FULFILLMENT_STATES));
  const [channel, setChannel] = useState<Channel | ''>('');
  const [period, setPeriod] = useState<Period>(() => oneOf(params.get('period'), PERIODS) || 'all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const plural = (base: 'orders' | 'items', n: number) => to(pluralKey(base, n, lang), { n });

  // search + filters first, so tab counts reflect them
  const base = useMemo(() => {
    const from = periodStart(period);
    return orders.filter(
      (o) =>
        matchesOrder(o, query) &&
        (!pay || paymentOf(o) === pay) &&
        (!ful || fulfillmentOf(o) === ful) &&
        (!status || o.status === status) &&
        (!proofF || (o.status !== 'cancelled' && proofOf(o, products)?.status === proofF)) &&
        (!overdue || productionOverdue(o, products)) &&
        (!channel || channelOf(o) === channel) &&
        (!from || new Date(o.createdAt).getTime() >= from),
    );
  }, [orders, products, query, pay, ful, status, proofF, overdue, channel, period]);

  const counts = useMemo(() => Object.fromEntries(TABS.map((k) => [k, base.filter((o) => inTab(o, k, products)).length])) as Record<Tab, number>, [base, products]);

  const filtered = useMemo(() => {
    const list = base.filter((o) => inTab(o, tab, products));
    const dir = sort.dir === 'asc' ? 1 : -1;
    return list.sort((a, b) => dir * (sort.key === 'total' ? a.total - b.total : a.createdAt.localeCompare(b.createdAt)));
  }, [base, tab, sort, products]);
  const visible = filtered.slice(0, limit);

  const stats = useMemo(() => {
    const live = orders.filter((o) => !isArchived(o) && o.status !== 'cancelled');
    const unpaid = live.filter(isUnpaid);
    let sent = 0;
    let changes = 0;
    for (const o of live) {
      if (o.status !== 'new' && o.status !== 'confirmed' && o.status !== 'proof') continue;
      const p = proofOf(o, products)?.status;
      if (p === 'sent') sent++;
      if (p === 'changes') changes++;
    }
    const production = live.filter((o) => o.status === 'processing');
    return {
      files: live.filter((o) => waitingForFiles(o, products)).length,
      sent,
      changes,
      production: production.length,
      late: production.filter((o) => productionOverdue(o, products)).length,
      unpaidCount: unpaid.length,
      unpaidSum: unpaid.reduce((s, o) => s + o.total, 0),
    };
  }, [orders, products]);

  const unseen = useMemo(() => orders.filter((o) => !o.seen).length, [orders]);
  const filtersActive = !!(query.trim() || pay || ful || status || proofF || overdue || channel || period !== 'all');
  const resetFilters = () => {
    setQuery('');
    setPay('');
    setFul('');
    setChannel('');
    setPeriod('all');
    const next = new URLSearchParams(params);
    for (const k of ['status', 'q', 'proof', 'overdue', 'payment', 'fulfillment', 'period']) next.delete(k);
    setParams(next, { replace: true });
  };

  /* ---------------- selection + bulk actions ---------------- */
  const selectedOrders = filtered.filter((o) => selected.has(o.id));
  const allShown = visible.length > 0 && visible.every((o) => selected.has(o.id));
  const someShown = visible.some((o) => selected.has(o.id));
  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const toggleAll = (on: boolean) => setSelected(on ? new Set(visible.map((o) => o.id)) : new Set());

  const setArchived = (list: Order[], archived: boolean) => {
    const at = archived ? new Date().toISOString() : null;
    for (const o of list) {
      updateOrder(o.id, archivePatch(at));
      logAudit({ action: archived ? 'archive' : 'restore', object: 'order', objectId: o.id, detail: o.number });
    }
    setSelected(new Set());
    const n = plural('orders', list.length);
    toast.success(archived ? t('archivedToast', { n }) : t('unarchivedToast', { n }), {
      action: { label: t('undo'), onClick: () => list.forEach((o) => updateOrder(o.id, archivePatch(archived ? null : new Date().toISOString()))) },
    });
  };

  const exportCsv = (list: Order[]) => {
    const header = [
      t('csv_number'), t('csv_date'), t('csv_company'), t('csv_nui'), t('csv_customer'), t('csv_email'), t('csv_phone'), t('csv_city'), t('csv_address'), t('csv_po'), t('csv_items'),
      t('csv_channel'), t('csv_delivery'), t('csv_method'), t('csv_payment'), t('csv_fulfilment'), t('csv_status'), t('csv_proof'), t('csv_files'),
      tc('subtotal'), t('csv_design'), tc('discount'), t('csv_discounts'), tc('shipping'), t('csv_net'), t('csv_vat'), t('csv_total'), t('csv_refunded'), t('csv_archived'),
    ];
    const rows = list.map((o) => {
      const proof = proofOf(o, products);
      const art = artworkSummary(o, products);
      return [
        o.number,
        `${date(o.createdAt, lang, { year: 'numeric', month: '2-digit', day: '2-digit' })} ${timeOf(o.createdAt, lang)}`,
        o.customer.company ?? '', o.customer.pib ?? '', customerName(o), o.customer.email, o.customer.phone, o.customer.city, o.customer.address, o.poNumber ?? '',
        o.items.map((l) => `${localizeLine(l, products.find((p) => p.id === l.productId), o.lang, lang).name} × ${qtyLabel(l, lang)}`).join(' | '),
        to(`channel_${channelOf(o)}`), tc(`delivery_${o.delivery.method}`), tc(`pay_${o.payment.method}`), to(`pay_${paymentOf(o)}`), to(`ful_${fulfillmentOf(o)}`), tc(`status_${o.status}`),
        proof ? `${tc(`proof_${proof.status}`)}${proof.version ? ` v${proof.version}` : ''}` : '', art.total ? `${art.ready}/${art.total}` : '',
        csvNum(o.subtotal, lang), csvNum(o.installationTotal, lang), csvNum(o.discount, lang),
        (o.discounts ?? []).map((d) => `${discountName(d.id, d.title, discounts, lang)}${d.code ? ` (${d.code})` : ''} −${csvNum(d.amount, lang)}`).join(' | '),
        csvNum(o.shipping, lang), csvNum(orderNet(o), lang), csvNum(o.vat, lang), csvNum(o.total, lang), csvNum(refundedOf(o), lang), isArchived(o) ? ta('yes') : ta('no'),
      ];
    });
    download(`${t('csvFile')}-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + toCsv([header, ...rows]), 'text/csv;charset=utf-8');
    toast.success(t('exported', { n: plural('orders', rows.length) }));
  };

  const canArchive = can('orders', 'archive');
  const canExport = can('orders', 'export');
  const open = (o: Order) => navigate(`/admin/porosite/${o.id}`);
  const sortBy = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));
  const SortIcon = ({ k }: { k: SortKey }) => (sort.key === k ? sort.dir === 'desc' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" /> : null);

  const tabs = TABS.map((k) => ({ id: k, label: t(`tab_${k}`), count: counts[k] }));
  const emptyFiles = tab === 'files' && !filtersActive;

  /** Proof + artwork readiness for a row (nothing for orders without print files). */
  const prepressCell = (o: Order) => {
    if (o.status === 'cancelled') return <span className="text-[12.5px] text-muted">—</span>;
    const proof = proofOf(o, products);
    const art = artworkSummary(o, products);
    if (!proof && !art.total) return <span className="text-[12.5px] text-muted">—</span>;
    // past production the proof is history — keep it quiet
    if ((o.status === 'shipped' || o.status === 'completed') && proof?.status === 'approved')
      return (
        <span className="text-[12.5px] text-muted">
          {tc('proof_approved')}
          {proof.version > 0 && <span className="ml-1 font-mono text-[11px]">v{proof.version}</span>}
        </span>
      );
    const showFiles = art.total > 0 && (art.missing > 0 || (proof?.status !== 'approved' && o.status !== 'processing'));
    return (
      <span className="flex flex-wrap items-center gap-1">
        {proof && <ProofBadge proof={proof} />}
        {showFiles && <FilesBadge summary={art} />}
      </span>
    );
  };

  const customerCell = (o: Order) => {
    const name = customerName(o);
    const primary = o.customer.company || name;
    const sub = [o.customer.company ? name : o.customer.city, o.poNumber ? `PO ${o.poNumber}` : ''].filter(Boolean).join(' · ');
    return { primary, sub };
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumbs={[ta('nav_orders'), t(`tab_${tab}`)]}
        title={ta('nav_orders')}
        description={t('description')}
        actions={
          <>
            {unseen > 0 && (
              <Button
                variant="ghost"
                size="sm"
                shape="rounded"
                icon={<CheckCheck className="h-4 w-4" />}
                aria-label={t('markAllSeen')}
                onClick={() => {
                  markAllOrdersSeen();
                  toast.success(t('markedSeen'));
                }}
              >
                <span className="hidden sm:inline">{t('markAllSeen')}</span>
              </Button>
            )}
            {canExport && (
              <Button variant="outline" size="sm" shape="rounded" icon={<Download className="h-4 w-4" />} onClick={() => exportCsv(filtered)} disabled={!filtered.length}>
                {t('exportCsv')}
              </Button>
            )}
            {can('drafts', 'edit') && (
              <ButtonLink to="/admin/draftet/i-ri" size="sm" shape="rounded" icon={<Plus className="h-4 w-4" />}>
                {t('create')}
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t('stat_files')} value={stats.files} hint={t('stat_filesHint')} onClick={() => setParam('tab', tab === 'files' ? '' : 'files')} active={tab === 'files'} />
        <Stat
          label={t('stat_proofs')}
          value={stats.sent}
          hint={stats.changes ? t('stat_proofsChanges', { n: stats.changes }) : t('stat_proofsHint')}
          onClick={() => setParam('proof', proofF === 'sent' ? '' : 'sent')}
          active={proofF === 'sent'}
        />
        <Stat
          label={t('stat_production')}
          value={stats.production}
          hint={stats.late ? <span className="inline-flex items-center gap-1 font-medium text-[#8A1B0A]"><AlertTriangle className="h-3 w-3" />{t('stat_productionLate', { n: stats.late })}</span> : t('stat_productionHint')}
          onClick={() => setParam('tab', tab === 'production' ? '' : 'production')}
          active={tab === 'production'}
        />
        <Stat label={t('stat_unpaid')} value={money(stats.unpaidSum, lang, { decimals: false })} hint={plural('orders', stats.unpaidCount)} onClick={() => setParam('tab', tab === 'unpaid' ? '' : 'unpaid')} active={tab === 'unpaid'} />
      </div>

      <Card padded={false}>
        <Tabs tabs={tabs} value={tab} onChange={(v) => setParam('tab', v === 'all' ? '' : v)} />

        {/* toolbar: search + filters */}
        <div className="flex flex-col gap-2 border-b border-line/70 px-4 py-3 sm:px-5 2xl:flex-row 2xl:items-center">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setLimit(PAGE);
            }}
            placeholder={t('searchPh')}
            className="min-w-0 2xl:flex-1 [&_input]:h-9"
          />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center 2xl:flex-nowrap">
            <FilterSelect width="sm:w-[150px]" label={t('f_status')} value={status} onChange={(v) => setParam('status', v)} options={ALL_STATUSES.map((s) => [s, tc(`status_${s}`)])} any={t('f_any')} />
            <FilterSelect width="sm:w-[150px]" label={t('f_proof')} value={proofF} onChange={(v) => setParam('proof', v)} options={PROOF_STATUSES.map((s) => [s, tc(`proof_${s}`)])} any={t('f_any')} />
            <FilterSelect width="sm:w-[150px]" label={t('f_payment')} value={pay} onChange={(v) => setPay(v as PaymentState | '')} options={PAYMENT_STATES.map((s) => [s, to(`pay_${s}`)])} any={t('f_any')} />
            <FilterSelect width="sm:w-[150px]" label={t('f_fulfilment')} value={ful} onChange={(v) => setFul(v as FulfillmentState | '')} options={FULFILLMENT_STATES.map((s) => [s, to(`ful_${s}`)])} any={t('f_any')} />
            <FilterSelect width="sm:w-[140px]" label={t('f_channel')} value={channel} onChange={(v) => setChannel(v as Channel | '')} options={[['online', to('channel_online')], ['draft', to('channel_draft')]]} any={t('f_any')} />
            <FilterSelect width="sm:w-[160px]" label={t('f_period')} value={period === 'all' ? '' : period} onChange={(v) => setPeriod((v || 'all') as Period)} options={PERIODS.filter((p) => p !== 'all').map((p) => [p, t(`period_${p}`)])} any={t('period_all')} />
            {filtersActive && (
              <button type="button" onClick={resetFilters} title={t('clearFilters')} className="col-span-2 inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold text-muted hover:bg-ink/[0.05] hover:text-ink sm:col-span-1">
                <X className="h-3.5 w-3.5" /> <span className="2xl:hidden">{t('clearFilters')}</span>
              </button>
            )}
          </div>
        </div>
        {overdue && (
          <div className="flex items-center gap-2 border-b border-line/70 px-4 py-2 sm:px-5">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-[#FDE3DF] pl-2.5 pr-1 text-[12.5px] font-semibold text-[#8A1B0A]">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('overdueChip')}
              <button type="button" aria-label={t('clearFilters')} onClick={() => setParam('overdue', '')} className="grid h-5 w-5 place-items-center rounded hover:bg-black/10">
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        {/* bulk bar */}
        {selectedOrders.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line/70 bg-canvas/70 px-4 py-2.5 sm:px-5">
            <Check checked={allShown} indeterminate={!allShown && someShown} onChange={toggleAll} label={t('selectAll')} />
            <span className="mr-1 text-[13px] font-semibold text-ink">{to('selected', { n: selectedOrders.length })}</span>
            {tab === 'archived' ? (
              <BulkButton icon={<ArchiveRestore className="h-4 w-4" />} disabled={!canArchive} tip={!canArchive && to('noPermission')} onClick={() => setArchived(selectedOrders, false)}>
                {t('unarchive')}
              </BulkButton>
            ) : (
              <BulkButton icon={<Archive className="h-4 w-4" />} disabled={!canArchive} tip={!canArchive && to('noPermission')} onClick={() => setArchived(selectedOrders, true)}>
                {t('archive')}
              </BulkButton>
            )}
            {canExport && (
              <BulkButton icon={<Download className="h-4 w-4" />} onClick={() => exportCsv(selectedOrders)}>
                {t('exportSelected')}
              </BulkButton>
            )}
            {selectedOrders.some((o) => !o.seen) && (
              <BulkButton
                icon={<Eye className="h-4 w-4" />}
                onClick={() => {
                  selectedOrders.forEach((o) => markOrderSeen(o.id));
                  setSelected(new Set());
                }}
              >
                {t('markSeen')}
              </BulkButton>
            )}
            <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-[13px] font-semibold text-muted hover:text-ink">
              {to('clearSelection')}
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={tab === 'archived' && !filtersActive ? <Archive className="h-6 w-6" /> : emptyFiles ? <CheckCheck className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
            title={orders.length === 0 ? t('emptyAllTitle') : tab === 'archived' && !filtersActive ? t('emptyArchivedTitle') : emptyFiles ? t('emptyFilesTitle') : t('emptyTitle')}
            text={orders.length === 0 ? t('emptyAllText') : tab === 'archived' && !filtersActive ? t('emptyArchivedText') : emptyFiles ? t('emptyFilesText') : t('emptyText')}
            action={
              filtersActive && (
                <Button variant="outline" size="sm" shape="rounded" onClick={resetFilters}>
                  {t('clearFilters')}
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* desktop table */}
            <Table className="hidden md:block">
              <thead>
                <tr>
                  <Th className="w-10">
                    <Check checked={allShown} indeterminate={!allShown && someShown} onChange={toggleAll} label={t('selectAll')} />
                  </Th>
                  <Th>
                    <button type="button" onClick={() => sortBy('date')} className="inline-flex items-center gap-1 hover:text-ink">
                      {t('col_order')} <SortIcon k="date" />
                    </button>
                  </Th>
                  <Th>{t('col_customer')}</Th>
                  <Th>{t('col_status')}</Th>
                  <Th>{t('col_prepress')}</Th>
                  <Th>{t('col_payment')}</Th>
                  <Th>{t('col_fulfilment')}</Th>
                  <Th className="text-right">
                    <button type="button" onClick={() => sortBy('total')} className="inline-flex items-center gap-1 hover:text-ink">
                      <SortIcon k="total" /> {t('col_total')}
                    </button>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => {
                  const sel = selected.has(o.id);
                  const refunded = refundedOf(o);
                  const cust = customerCell(o);
                  return (
                    <tr key={o.id} onClick={() => open(o)} className={cn('group cursor-pointer transition-colors', sel ? 'bg-ink/[0.035]' : 'hover:bg-canvas/70')}>
                      <Td className="w-10">
                        <Check checked={sel} onChange={(v) => toggle(o.id, v)} label={t('selectRow', { n: o.number })} />
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className={cn('tabular-nums', o.seen ? 'font-semibold' : 'font-bold')}>#{o.number}</span>
                          {!o.seen && <span title={t('unseen')} className="h-2 w-2 rounded-full bg-ink" />}
                        </span>
                        <span className="block text-[12px] tabular-nums text-muted">
                          {dayOf(o.createdAt, lang)} · {timeOf(o.createdAt, lang)}
                        </span>
                      </Td>
                      <Td className="max-w-[230px]">
                        <span className={cn('block truncate', o.seen ? 'font-medium' : 'font-semibold')}>{cust.primary}</span>
                        <span className="block truncate text-[12px] text-muted">{cust.sub || plural('items', o.items.length)}</span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className="flex flex-col items-start gap-1">
                          <OrderStatusPill status={o.status} />
                          {isArchived(o) && tab !== 'archived' && <ArchivedBadge />}
                        </span>
                      </Td>
                      <Td>{prepressCell(o)}</Td>
                      <Td className="whitespace-nowrap">
                        <PayBadge state={paymentOf(o)} />
                      </Td>
                      <Td className="whitespace-nowrap">{o.status === 'cancelled' ? <CancelledBadge /> : <FulfilBadge state={fulfillmentOf(o)} />}</Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">
                        <span className={cn('block', o.status === 'cancelled' ? 'text-muted line-through' : 'font-semibold')}>{money(o.total, lang)}</span>
                        {refunded > 0 && o.status !== 'cancelled' ? (
                          <span className="block text-[12px] text-muted">{t('refundedShort', { amount: money(refunded, lang) })}</span>
                        ) : (
                          <span className="block text-[12px] text-muted">{t('netShort', { amount: money(orderNet(o), lang) })}</span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            {/* mobile cards */}
            <ul className="divide-y divide-line/70 md:hidden">
              {visible.map((o) => {
                const sel = selected.has(o.id);
                const cust = customerCell(o);
                const proof = o.status === 'cancelled' ? null : proofOf(o, products);
                const art = artworkSummary(o, products);
                return (
                  <li key={o.id} className={cn('flex gap-3 px-4 py-3.5', sel && 'bg-ink/[0.035]')}>
                    <Check checked={sel} onChange={(v) => toggle(o.id, v)} label={t('selectRow', { n: o.number })} className="mt-0.5" />
                    <button type="button" onClick={() => open(o)} className="min-w-0 flex-1 text-left">
                      <span className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2">
                          <span className={cn('text-[14.5px] tabular-nums', o.seen ? 'font-semibold' : 'font-bold')}>#{o.number}</span>
                          {!o.seen && <span className="h-2 w-2 rounded-full bg-ink" />}
                        </span>
                        <span className={cn('text-[14.5px] tabular-nums', o.status === 'cancelled' ? 'text-muted line-through' : 'font-semibold')}>{money(o.total, lang)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-3 text-[13px]">
                        <span className="min-w-0 truncate text-ink">
                          {cust.primary} {cust.sub && <span className="text-muted">· {cust.sub}</span>}
                        </span>
                        <span className="shrink-0 text-[12px] text-muted">{dayOf(o.createdAt, lang)}</span>
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        <OrderStatusPill status={o.status} />
                        {proof && o.status !== 'completed' && o.status !== 'shipped' && <ProofBadge proof={proof} />}
                        {art.missing > 0 && o.status !== 'cancelled' && <FilesBadge summary={art} />}
                        <PayBadge state={paymentOf(o)} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 text-[13px] text-muted sm:flex-row sm:px-5">
              <span>{t('showing', { n: visible.length, total: filtered.length })}</span>
              {visible.length < filtered.length && (
                <Button variant="outline" size="sm" shape="rounded" iconRight={<ChevronDown className="h-4 w-4" />} onClick={() => setLimit((l) => l + PAGE)}>
                  {t('showMore')}
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/** Compact filter: shows the filter name until a value is picked, then the value (bold border = active). */
function FilterSelect({ label, value, onChange, options, any, width }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; any: string; width: string }) {
  return (
    <SelectInput aria-label={label} title={label} value={value} onChange={(e) => onChange(e.target.value)} wrapClassName={cn('min-w-0', width)} className={cn('truncate', value ? 'border-ink/50 font-semibold' : 'text-ink-soft')}>
      <option value="">{label}</option>
      <optgroup label={label}>
        <option value="">{any}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </optgroup>
    </SelectInput>
  );
}

function BulkButton({ icon, children, onClick, disabled, tip }: { icon: ReactNode; children: ReactNode; onClick: () => void; disabled?: boolean; tip?: string | false }) {
  return (
    <Tip tip={tip}>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/15 bg-white px-3 text-[13px] font-semibold text-ink transition-colors hover:border-ink/35 disabled:pointer-events-none disabled:opacity-45"
      >
        {icon}
        {children}
      </button>
    </Tip>
  );
}
