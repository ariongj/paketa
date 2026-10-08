// Reklamacione — complaints on printed orders (route kept: /admin/kthimet). The store's return flow stays
// (requested → approved → received → refunded | rejected); the screens add the print resolution: reprint, refund
// or credit note. Deep links: ?status=requested (tab) · ?id=<complaint> (drawer) · ?order=<order id>&new=1 (create).
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { MessageSquareWarning, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { Card, PageHeader, SearchInput, Table, Td, Th, Thumb } from '@/admin/components/kit';
import { customerName, pluralKey } from '@/admin/components/orders/helpers';
import { Stat, Tabs } from '@/admin/components/orders/ui';
import { rd } from '@/admin/components/returns/dict';
import { RETURN_STATUSES, complaintAmount, lineImage, lineName, reachedAt, reasonKey, resolutionOf } from '@/admin/components/returns/helpers';
import { ComplaintBadge, ResolutionChip } from '@/admin/components/returns/ComplaintBadge';
import { ReturnDrawer } from '@/admin/components/returns/ReturnDrawer';
import { CreateReturnDrawer } from '@/admin/components/returns/CreateReturnDrawer';
import { adm } from '@/admin/i18n';
import { useDict, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { useCan } from '@/store/hooks';
import { fold } from '@/lib/search';
import { date, money, num } from '@/lib/format';
import { cn, round2 } from '@/lib/utils';
import type { Lang, Order, Product, ReturnRequest, ReturnStatus } from '@/lib/types';

type Tab = 'all' | ReturnStatus;
const TABS: Tab[] = ['all', ...RETURN_STATUSES];
const DAY = 86400000;

const timeOf = (iso: string, lang: Lang) => new Date(iso).toLocaleTimeString(lang === 'en' ? 'en-GB' : 'sq-AL', { hour: '2-digit', minute: '2-digit' });
const companyOf = (o: Order | undefined) => o?.customer.company?.trim() || (o ? customerName(o) : '');

export default function Returns() {
  const t = useDict(rd, 'admin');
  const ta = useDict(adm, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const returns = useDb((s) => s.returns);
  const orders = useDb((s) => s.orders);
  const products = useDb((s) => s.products);
  const vatRate = useDb((s) => s.settings.vatRate);

  /* ---------------- URL state: tab, drawer, create ---------------- */
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('status') as Tab | null;
  const tab: Tab = rawTab && TABS.includes(rawTab) ? rawTab : 'all';
  const openId = params.get('id');
  const creating = params.get('new') === '1' && can('returns', 'edit');
  const createFor = params.get('order');
  const patch = (p: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(p)) (v ? next.set(k, v) : next.delete(k));
        return next;
      },
      { replace: true },
    );
  const [query, setQuery] = useState('');

  const orderOf = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);

  const searched = useMemo(() => {
    const q = fold(query.trim());
    const list = [...returns].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!q) return list;
    return list.filter((r) => {
      const o = orderOf.get(r.orderId);
      const hay = `${r.number} ${o?.number ?? ''} ${o ? customerName(o) : ''} ${o?.customer.company ?? ''} ${o?.customer.phone ?? ''} ${o?.customer.city ?? ''} ${r.reason} ${t(`r_${reasonKey(r.reason)}`)} ${r.lines.map((l) => lineName(l.productId, o, products, lang)).join(' ')}`;
      return q.split(/\s+/).every((term) => fold(hay).includes(term));
    });
  }, [returns, query, orderOf, products, lang, t]);

  const counts = useMemo(() => Object.fromEntries(TABS.map((k) => [k, k === 'all' ? searched.length : searched.filter((r) => r.status === k).length])) as Record<Tab, number>, [searched]);
  const filtered = tab === 'all' ? searched : searched.filter((r) => r.status === tab);

  const stats = useMemo(() => {
    const by = (s: ReturnStatus) => returns.filter((r) => r.status === s);
    const since = Date.now() - 30 * DAY;
    const closed = by('refunded').filter((r) => new Date(reachedAt(r, 'refunded') ?? r.createdAt).getTime() >= since);
    const reprints = closed.filter((r) => resolutionOf(r) === 'reprint');
    const paidBack = closed.filter((r) => resolutionOf(r) !== 'reprint');
    return {
      requested: by('requested').length,
      approved: by('approved').length,
      received: by('received').length,
      paidBack,
      reprints,
      amount: round2(paidBack.reduce((s, r) => s + r.refundAmount, 0)),
    };
  }, [returns]);

  const canEdit = can('returns', 'edit');
  const pl = (base: 'returns' | 'refunds' | 'reprints', n: number) => t(pluralKey(base, n, lang), { n });

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: ta('nav_orders'), to: '/admin/porosite' }, t('title')]}
        title={t('title')}
        description={t('description')}
        actions={
          canEdit && (
            <Button size="sm" shape="rounded" icon={<Plus className="h-4 w-4" />} onClick={() => patch({ new: '1', order: null, id: null })}>
              {t('create')}
            </Button>
          )
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t('stat_requested')} value={stats.requested} hint={t('stat_requestedHint')} onClick={() => patch({ status: tab === 'requested' ? null : 'requested' })} active={tab === 'requested'} />
        <Stat label={t('stat_approved')} value={stats.approved} hint={t('stat_approvedHint')} onClick={() => patch({ status: tab === 'approved' ? null : 'approved' })} active={tab === 'approved'} />
        <Stat label={t('stat_received')} value={stats.received} hint={t('stat_receivedHint')} onClick={() => patch({ status: tab === 'received' ? null : 'received' })} active={tab === 'received'} />
        <Stat
          label={t('stat_refunded')}
          value={money(stats.amount, lang)}
          hint={t('stat_refundedHint', { refunds: pl('refunds', stats.paidBack.length), reprints: pl('reprints', stats.reprints.length) })}
          onClick={() => patch({ status: tab === 'refunded' ? null : 'refunded' })}
          active={tab === 'refunded'}
        />
      </div>

      <Card padded={false}>
        <Tabs tabs={TABS.map((k) => ({ id: k, label: t(`tab_${k}`), count: counts[k] }))} value={tab} onChange={(v) => patch({ status: v === 'all' ? null : v })} />
        <div className="border-b border-line/70 px-4 py-3 sm:px-5">
          <SearchInput value={query} onChange={setQuery} placeholder={t('searchPh')} className="min-w-0 sm:max-w-md [&_input]:h-9" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquareWarning className="h-6 w-6" />}
            title={returns.length ? t('emptyFiltered') : t('emptyTitle')}
            text={returns.length ? t('emptyFilteredText') : t('emptyText')}
            action={
              returns.length && query ? (
                <Button variant="outline" size="sm" shape="rounded" onClick={() => setQuery('')}>
                  {t('clearSearch')}
                </Button>
              ) : (
                !returns.length &&
                canEdit && (
                  <Button size="sm" shape="rounded" icon={<Plus className="h-4 w-4" />} onClick={() => patch({ new: '1' })}>
                    {t('create')}
                  </Button>
                )
              )
            }
          />
        ) : (
          <>
            {/* desktop */}
            <Table className="hidden md:block">
              <thead>
                <tr>
                  <Th>{t('col_return')}</Th>
                  <Th>{t('col_customer')}</Th>
                  <Th>{t('col_items')}</Th>
                  <Th>{t('col_resolution')}</Th>
                  <Th>{t('col_status')}</Th>
                  <Th>{t('col_date')}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const o = orderOf.get(r.orderId);
                  return (
                    <tr key={r.id} onClick={() => patch({ id: r.id })} className={cn('group cursor-pointer transition-colors hover:bg-canvas/70', openId === r.id && 'bg-ink/[0.035]')}>
                      <Td className="whitespace-nowrap">
                        <span className="block font-semibold tabular-nums">{r.number}</span>
                        {o ? (
                          <Link to={`/admin/porosite/${o.id}`} onClick={(e) => e.stopPropagation()} className="block text-[12px] tabular-nums text-muted underline-offset-2 hover:text-ink hover:underline">
                            #{o.number}
                          </Link>
                        ) : (
                          <span className="block text-[12px] text-muted">—</span>
                        )}
                      </Td>
                      <Td className="max-w-[200px]">
                        <span className="block truncate font-medium">{companyOf(o) || '—'}</span>
                        <span className="block truncate text-[12px] text-muted">{[o?.customer.company ? customerName(o) : null, o?.customer.city].filter(Boolean).join(' · ')}</span>
                      </Td>
                      <Td className="max-w-[320px]">
                        <Lines ret={r} order={o} products={products} lang={lang} />
                      </Td>
                      <Td className="whitespace-nowrap">
                        <Resolution ret={r} order={o} vatRate={vatRate} lang={lang} />
                      </Td>
                      <Td className="whitespace-nowrap">
                        <ComplaintBadge ret={r} />
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className="block">{date(r.createdAt, lang, { day: 'numeric', month: 'short' })}</span>
                        <span className="block text-[12px] tabular-nums text-muted">{timeOf(r.createdAt, lang)}</span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            {/* mobile */}
            <ul className="divide-y divide-line/70 md:hidden">
              {filtered.map((r) => {
                const o = orderOf.get(r.orderId);
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => patch({ id: r.id })} className="block w-full px-4 py-3.5 text-left active:bg-canvas">
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-[14.5px] font-semibold tabular-nums">
                          {r.number} {o && <span className="font-normal text-muted">· #{o.number}</span>}
                        </span>
                        <span className="shrink-0 text-[12px] text-muted">{date(r.createdAt, lang, { day: 'numeric', month: 'short' })}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13px]">{companyOf(o) || '—'}</span>
                      <span className="mt-2 block">
                        <Lines ret={r} order={o} products={products} lang={lang} compact />
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        <ComplaintBadge ret={r} />
                        <Resolution ret={r} order={o} vatRate={vatRate} lang={lang} inline />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="px-4 py-3 text-[13px] text-muted sm:px-5">{t('showing', { n: filtered.length, total: returns.length })}</p>
          </>
        )}
      </Card>

      <ReturnDrawer id={openId && returns.some((r) => r.id === openId) ? openId : null} onClose={() => patch({ id: null })} />
      <CreateReturnDrawer open={creating} initialOrderId={createFor} onClose={() => patch({ new: null, order: null })} onCreated={(r) => patch({ new: null, order: null, id: r.id, status: null })} />
    </div>
  );
}

/** Resolution chip + the amount paid back (none for a reprint, struck through when rejected). */
function Resolution({ ret, order, vatRate, lang, inline }: { ret: ReturnRequest; order: Order | undefined; vatRate: number; lang: Lang; inline?: boolean }) {
  const res = resolutionOf(ret);
  const amount = complaintAmount(ret, order, vatRate);
  const showAmount = res !== 'reprint';
  return (
    <span className={cn('inline-flex items-center gap-2', !inline && 'min-w-[150px]')}>
      <ResolutionChip resolution={res} />
      {showAmount && <span className={cn('text-[13px] tabular-nums', ret.status === 'rejected' ? 'text-muted line-through' : 'font-semibold text-ink')}>{money(amount, lang)}</span>}
    </span>
  );
}

/** "300 × Kuti pice tetëkëndore  +1 më shumë" with the reason category under it. */
function Lines({ ret, order, products, lang, compact }: { ret: ReturnRequest; order: Order | undefined; products: Product[]; lang: Lang; compact?: boolean }) {
  const t = useDict(rd, 'admin');
  const first = ret.lines[0];
  if (!first) return null;
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {!compact && <Thumb src={lineImage(first.productId, order, products)} className="h-9 w-9 rounded-md" />}
      <span className="min-w-0">
        <span className="block truncate text-[13.5px]">
          <span className="tabular-nums text-muted">{num(first.qty, lang)} ×</span> {lineName(first.productId, order, products, lang)}
          {ret.lines.length > 1 && <span className="ml-1.5 text-[12px] text-muted">{t('more', { n: ret.lines.length - 1 })}</span>}
        </span>
        <span className="block truncate text-[12px] text-muted">{t(`r_${reasonKey(ret.reason)}`)}</span>
      </span>
    </span>
  );
}
