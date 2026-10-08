import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { PageHeader } from '@/admin/components/kit';
import { adm } from '@/admin/i18n';
import { useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useCan } from '@/store/hooks';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { buildBuckets, isComparable, isPeriod, openQuotes, pctChange, periodRanges, printPipeline, windowStats, type Period } from '@/admin/components/dashboard/data';
import { D, capitalize, pluralKey } from '@/admin/components/dashboard/i18n';
import { fmtDate } from '@/admin/components/dashboard/dates';
import { useNow } from '@/admin/components/dashboard/useNow';
import { KpiCard } from '@/admin/components/dashboard/KpiCard';
import { PeriodSelect } from '@/admin/components/dashboard/PeriodSelect';
import { RevenueChart } from '@/admin/components/dashboard/RevenueChart';
import { StatusBreakdown } from '@/admin/components/dashboard/StatusBreakdown';
import { RecentOrders, TopProducts } from '@/admin/components/dashboard/lists';
import { Attention } from '@/admin/components/dashboard/Attention';
import { QuotesCard } from '@/admin/components/dashboard/Quotes';
import { Campaigns } from '@/admin/components/dashboard/Campaigns';

/** Last period the viewer picked — a per-browser convenience; the URL (?period=) wins. */
const PERIOD_KEY = 'pw-overview-period';
function storedPeriod(): Period | null {
  try {
    const v = localStorage.getItem(PERIOD_KEY);
    return isPeriod(v) ? v : null;
  } catch {
    return null;
  }
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label}>
      <h2 className="mb-2 text-[12.5px] font-semibold text-muted">{label}</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">{children}</div>
    </section>
  );
}

/**
 * Përmbledhje — the print-shop back office. One period selector scopes the sales tiles, the chart, the status
 * breakdown and top products; the "work in progress" tiles (quotes, files, proofs) and the attention list show
 * the live state. Every tile and row opens its filtered list. Widgets follow the role's module permissions.
 */
export default function Dashboard() {
  const t = useDict(D, 'admin');
  const ta = useDict(adm, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const can = useCan();

  const orders = useDb((s) => s.orders);
  const inquiries = useDb((s) => s.inquiries);
  const products = useDb((s) => s.products);
  const quotes = useDb((s) => s.quotes);

  const [params, setParams] = useSearchParams();
  const [remembered] = useState(storedPeriod);
  const raw = params.get('period');
  const period: Period = isPeriod(raw) ? raw : (remembered ?? 'today');
  const setPeriod = (p: Period) => {
    const next = new URLSearchParams(params);
    next.set('period', p);
    setParams(next, { replace: true });
    try {
      localStorage.setItem(PERIOD_KEY, p);
    } catch {
      /* private mode — the URL still holds it */
    }
  };

  // "now" ticks every minute and is re-read when data changes (e.g. a new order from the storefront tab)
  const tick = useNow();
  const now = useMemo(() => new Date(Math.max(tick, Date.now())), [tick, orders, inquiries, quotes]); // eslint-disable-line react-hooks/exhaustive-deps

  const showOrders = can('orders');
  const showAnalytics = can('analytics');
  const showSales = showOrders || showAnalytics;
  const showQuotes = can('quotes');
  const showOffers = can('offers');

  const ranges = useMemo(() => periodRanges(period, now), [period, now]);
  const cur = useMemo(() => windowStats(orders, inquiries, ranges.current), [orders, inquiries, ranges]);
  const prev = useMemo(() => windowStats(orders, inquiries, ranges.previous), [orders, inquiries, ranges]);
  const comparable = useMemo(() => isComparable(orders, ranges.previous), [orders, ranges]);
  const chart = useMemo(() => buildBuckets(orders, now, period), [orders, now, period]);
  const recent = useMemo(() => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 7), [orders]);
  const unseen = useMemo(() => orders.filter((o) => !o.seen).length, [orders]);
  const pipe = useMemo(() => printPipeline(orders, products, now), [orders, products, now]);
  const open = useMemo(() => openQuotes(quotes, now), [quotes, now]);

  const periodLabel = t(`pl_${period}`);
  const openList = t('open_list');
  const salesLink = showAnalytics ? `/admin/analitika?range=${period}` : showOrders ? '/admin/porosite' : undefined;

  /** Delta vs. the comparison window; when there is no base to divide by, name the previous value instead. */
  const compare = (c: number, p: number, fmt: (v: number) => string) => {
    if (!comparable) return { delta: undefined, caption: t('no_compare') };
    const delta = pctChange(c, p, comparable);
    if (delta !== null) return { delta, caption: period === 'today' ? t('vs_today') : t('vs_prev', { n: ranges.days }) };
    return { delta: undefined, caption: period === 'today' ? t('prev_today', { v: fmt(p) }) : t('prev_days', { n: ranges.days, v: fmt(p) }) };
  };
  const fmtMoney = (v: number) => money(v, lang, { decimals: false });

  /* ---------------- sales (period) ---------------- */
  const sales = showSales
    ? [
        <KpiCard
          key="net"
          className="max-lg:col-span-2"
          label={t('kpi_net')}
          value={fmtMoney(cur.net)}
          sub={t('kpi_gross', { v: fmtMoney(cur.gross) })}
          {...compare(cur.net, prev.net, fmtMoney)}
          title={`${t('net_def')}\n${t('gross_def')}`}
          to={salesLink}
          linkLabel={openList}
        />,
        <KpiCard
          key="orders"
          label={t('kpi_orders')}
          value={cur.orders}
          {...compare(cur.orders, prev.orders, String)}
          title={t('orders_def')}
          to={showOrders ? '/admin/porosite' : salesLink}
          linkLabel={openList}
        />,
        <KpiCard key="aov" label={t('kpi_aov')} value={fmtMoney(cur.aov)} sub={tc('exclVat')} {...compare(cur.aov, prev.aov, fmtMoney)} title={t('aov_def')} to={salesLink} linkLabel={openList} />,
      ]
    : [];

  /* ---------------- work in progress (live) ---------------- */
  const changes = pipe.changes.length;
  const awaiting = pipe.awaiting.length;
  const proofsLink =
    changes + awaiting === 1 ? `/admin/porosite/${(pipe.changes[0] ?? pipe.awaiting[0]).id}` : changes ? '/admin/porosite?proof=changes' : awaiting ? '/admin/porosite?proof=sent' : '/admin/porosite?status=proof';
  const work = [
    showQuotes && (
      <KpiCard
        key="quotes"
        className={cn(showOrders && 'max-lg:col-span-2')}
        label={t('kpi_quotes')}
        value={fmtMoney(open.value)}
        caption={
          open.list.length
            ? (['sent', 'draft', 'expired'] as const)
                .map((k) => [k, k === 'sent' ? open.sent : k === 'draft' ? open.drafts : open.expired] as const)
                .filter(([, n]) => n > 0)
                .map(([k, n]) => t(`qc_${k}_${pluralKey(lang, n)}`, { n }))
                .join(' · ')
            : t('quotes_none')
        }
        title={t('quotes_def')}
        to="/admin/kontaktet/oferta-b2b"
        linkLabel={openList}
      />
    ),
    showOrders && (
      <KpiCard
        key="files"
        label={t('kpi_files')}
        value={pipe.files.length}
        caption={pipe.files.length ? t(`files_miss_${pluralKey(lang, pipe.missingFiles)}`, { n: pipe.missingFiles }) : t('files_none')}
        title={t('files_def')}
        to={pipe.files.length === 1 ? `/admin/porosite/${pipe.files[0].id}` : '/admin/porosite?files=missing'}
        linkLabel={openList}
      />
    ),
    showOrders && (
      <KpiCard
        key="proofs"
        label={t('kpi_proofs')}
        value={changes + awaiting}
        caption={changes + awaiting ? t('proofs_caption', { a: awaiting, c: changes }) : t('proofs_none')}
        title={t('proofs_def')}
        to={proofsLink}
        linkLabel={openList}
      />
    ),
  ].filter(Boolean);

  /* ---------------- bottom row: top products · B2B quotes · campaigns ---------------- */
  const bottom: ((cls: string) => ReactNode)[] = [];
  if (showSales) bottom.push((cls) => <TopProducts key="top" className={cls} rows={cur.top} products={products} periodLabel={periodLabel} linkable={can('products')} />);
  if (showQuotes) bottom.push((cls) => <QuotesCard key="quotes" className={cls} data={open} now={now} />);
  if (showOffers) bottom.push((cls) => <Campaigns key="campaigns" className={cls} now={now} />);
  const bottomCls = (i: number) => {
    const last = i === bottom.length - 1;
    if (bottom.length === 3) return last ? 'lg:col-span-2 xl:col-span-1' : '';
    if (bottom.length === 1) return 'lg:col-span-2';
    return '';
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[ta('nav_overview'), t(`p_${period}`)]}
        title={t('title')}
        description={capitalize(fmtDate(now, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })).replace(/\.$/, '')}
        actions={<PeriodSelect value={period} onChange={setPeriod} now={now} />}
      />

      <div className="space-y-4 sm:space-y-5">
        {sales.length > 0 && <Group label={t('g_sales', { p: periodLabel })}>{sales}</Group>}
        {work.length > 0 && <Group label={t('g_work')}>{work}</Group>}

        <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
          {showOrders && <RecentOrders className="xl:col-span-2" orders={recent} products={products} unseen={unseen} />}
          {/* phones/tablets: tasks first; desktop: next to the orders */}
          <Attention className={cn('order-first xl:order-none', !showOrders && 'xl:col-span-3')} now={now} />
        </div>

        {showSales && (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
            <RevenueChart className="xl:col-span-2" buckets={chart.buckets} step={chart.step} periodLabel={periodLabel} />
            <StatusBreakdown byStatus={cur.byStatus} periodLabel={periodLabel} linkable={showOrders} />
          </div>
        )}

        {bottom.length > 0 && (
          <div className={cn('grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2', bottom.length === 3 && 'xl:grid-cols-3')}>{bottom.map((render, i) => render(bottomCls(i)))}</div>
        )}
      </div>
    </>
  );
}
