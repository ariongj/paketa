import { useMemo, type ComponentType } from 'react';
import { Link } from 'react-router';
import { CalendarClock, CheckCheck, ChevronRight, CreditCard, FileClock, FilePen, FileWarning, Hourglass, MessageSquareWarning, PackageMinus, Timer, Truck, UserX } from 'lucide-react';
import { Card } from '@/admin/components/kit';
import { useDict, useL, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { useCan } from '@/store/hooks';
import { money, timeAgo } from '@/lib/format';
import type { Lang } from '@/lib/types';
import { daysUntil, expiringOffers, lowStockProducts, openReturns, pendingBookings, pendingPayments, printPipeline, proofSentAt, unassignedContacts, unfulfilledOrders } from './data';
import { fmtDate } from './dates';
import { D, pluralKey, unitWord } from './i18n';
import { Empty, customerShort } from './lists';

type Tone = 'urgent' | 'normal';
interface Item {
  id: string;
  icon: ComponentType<{ className?: string }>;
  text: string;
  detail?: string;
  to: string;
  /** urgent rows (blocked production) get a solid ink icon tile */
  tone?: Tone;
}

const shortDate = (iso: string, lang: Lang) => fmtDate(new Date(iso), lang, { day: 'numeric', month: 'short' });
const dateTimeShort = (iso: string, lang: Lang) => fmtDate(new Date(iso), lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * "Kërkojnë vëmendje": the print workflow first (proof changes, late production, missing files, proofs with
 * the customer), then money, shipping, complaints, stock and contacts. Each queue links to its filtered list;
 * a single item opens directly. Only queues the current role may open are shown.
 */
function useAttentionItems(now: Date): Item[] {
  const t = useDict(D, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const can = useCan();
  const products = useDb((s) => s.products);
  const orders = useDb((s) => s.orders);
  const bookings = useDb((s) => s.bookings);
  const inquiries = useDb((s) => s.inquiries);
  const offers = useDb((s) => s.offers);
  const returns = useDb((s) => s.returns);

  return useMemo(() => {
    const out: Item[] = [];
    type Base = 'changes' | 'overdue' | 'files' | 'awaiting' | 'payments' | 'unful' | 'returns' | 'low' | 'contacts' | 'book' | 'offers' | 'late';
    const plural = (base: Base, n: number) => t(`${base}_${pluralKey(lang, n)}`, { n });
    const orderLink = (id: string) => `/admin/porosite/${id}`;

    if (can('orders')) {
      const pipe = printPipeline(orders, products, now);
      // 1 · the customer asked for changes on a proof — prepress must act
      if (pipe.changes.length) {
        const o = pipe.changes[0];
        out.push({
          id: 'changes',
          icon: FilePen,
          tone: 'urgent',
          text: plural('changes', pipe.changes.length),
          detail: t('d_changes', { n: o.number, who: customerShort(o) }),
          to: pipe.changes.length === 1 ? orderLink(o.id) : '/admin/porosite?proof=changes',
        });
      }
      // 2 · in production past the lead time
      if (pipe.overdue.length) {
        const { order: o, late } = pipe.overdue[0];
        out.push({
          id: 'overdue',
          icon: Timer,
          tone: 'urgent',
          text: plural('overdue', pipe.overdue.length),
          detail: t('d_overdue', { n: o.number, late: plural('late', late) }),
          to: pipe.overdue.length === 1 ? orderLink(o.id) : '/admin/porosite?status=processing&overdue=1',
        });
      }
      // 3 · print files still to come from the customer
      if (pipe.files.length) {
        const o = pipe.files[0];
        out.push({
          id: 'files',
          icon: FileWarning,
          text: plural('files', pipe.files.length),
          detail: t('d_files', { n: o.number, who: customerShort(o), ago: timeAgo(o.createdAt, lang) }),
          to: pipe.files.length === 1 ? orderLink(o.id) : '/admin/porosite?files=missing',
        });
      }
      // 4 · proof sent, waiting for the customer's approval
      if (pipe.awaiting.length) {
        const o = pipe.awaiting[0];
        out.push({
          id: 'awaiting',
          icon: FileClock,
          text: plural('awaiting', pipe.awaiting.length),
          detail: t('d_awaiting', { n: o.number, who: customerShort(o), ago: timeAgo(proofSentAt(o, products), lang) }),
          to: pipe.awaiting.length === 1 ? orderLink(o.id) : '/admin/porosite?proof=sent',
        });
      }
      // 5 · payments outstanding
      const pay = pendingPayments(orders);
      if (pay.length) {
        const sum = pay.reduce((s, o) => s + o.total, 0);
        out.push({
          id: 'payments',
          icon: CreditCard,
          text: plural('payments', pay.length),
          detail: t('d_payments', { amount: money(sum, lang, { decimals: false }) }),
          to: pay.length === 1 ? orderLink(pay[0].id) : '/admin/porosite?tab=unpaid',
        });
      }
      // 6 · not shipped yet
      const open = unfulfilledOrders(orders);
      if (open.length) {
        const o = open[0];
        out.push({
          id: 'unfulfilled',
          icon: Truck,
          text: plural('unful', open.length),
          detail: t('d_unful', { n: o.number, ago: timeAgo(o.createdAt, lang) }),
          to: open.length === 1 ? orderLink(o.id) : '/admin/porosite?tab=unfulfilled',
        });
      }
    }
    // 7 · complaints / returns waiting
    if (can('returns')) {
      const list = openReturns(returns);
      if (list.length) {
        const r = list[0];
        out.push({
          id: 'returns',
          icon: MessageSquareWarning,
          text: plural('returns', list.length),
          detail: t('d_returns', { n: r.number, amount: money(r.refundAmount, lang) }),
          to: list.length === 1 ? `/admin/kthimet?id=${r.id}` : '/admin/kthimet',
        });
      }
    }
    // 8 · low stock — only stock-tracked items (e.g. the sample kit); print runs are made to order
    if (can('inventory') && can('products')) {
      const low = lowStockProducts(products);
      if (low.length) {
        const p = low[0];
        const qty = `${p.stock} ${unitWord(p.unit, p.stock, lang)}`;
        out.push({
          id: 'low',
          icon: PackageMinus,
          text: plural('low', low.length),
          detail: t('d_low', { name: l(p.name), n: qty }),
          to: low.length === 1 ? `/admin/produktet/${p.id}` : low.every((x) => x.stock <= 0) ? '/admin/produktet?zalihe=out' : '/admin/produktet?zalihe=low',
        });
      }
    }
    // 9 · contacts and quote requests nobody owns
    if (can('contacts')) {
      const list = unassignedContacts(inquiries);
      if (list.length) {
        const q = list[0];
        const name = q.company ? `${q.company} (${q.name})` : q.name;
        out.push({
          id: 'contacts',
          icon: UserX,
          text: plural('contacts', list.length),
          detail: t(q.type === 'quote' ? 'd_contacts_quote' : 'd_contacts', { name, ago: timeAgo(q.createdAt, lang) }),
          to: list.length === 1 ? `/admin/kontaktet?id=${q.id}` : '/admin/kontaktet?assignee=none',
        });
      }
    }
    // 10 · meetings / consultations awaiting confirmation
    if (can('appointments')) {
      const list = pendingBookings(bookings);
      if (list.length) {
        const b = list[0];
        out.push({
          id: 'bookings',
          icon: CalendarClock,
          text: plural('book', list.length),
          detail: t('d_book', { name: b.customerName, when: dateTimeShort(b.start, lang) }),
          to: list.length === 1 ? `/admin/terminet?id=${b.id}` : '/admin/terminet?status=pending',
        });
      }
    }
    // 11 · promotional campaigns that end soon
    if (can('offers')) {
      const list = expiringOffers(offers, now);
      if (list.length) {
        const o = list[0];
        const d = daysUntil(new Date(o.endsAt!), now);
        const when = d <= 0 ? t('when_today') : d === 1 ? t('when_tomorrow') : t('when_days', { n: d });
        out.push(
          list.length === 1
            ? {
                id: 'offers',
                icon: Hourglass,
                text: t('offer_one', { name: l(o.name), when }),
                detail: t('d_offer', { date: shortDate(o.endsAt!, lang), revenue: money(o.metrics.revenue, lang, { decimals: false }) }),
                to: `/admin/ofertat/${o.id}`,
              }
            : { id: 'offers', icon: Hourglass, text: plural('offers', list.length), detail: t('d_offers', { name: l(o.name), date: shortDate(o.endsAt!, lang) }), to: '/admin/ofertat?status=active' },
        );
      }
    }
    return out;
  }, [products, orders, bookings, inquiries, offers, returns, now, can, t, l, lang]);
}

export function Attention({ now, className }: { now: Date; className?: string }) {
  const t = useDict(D, 'admin');
  const items = useAttentionItems(now);
  return (
    <Card
      className={className}
      title={
        <span className="inline-flex items-center gap-2">
          {t('att_title')}
          {items.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-semibold tabular-nums text-white">{items.length}</span>}
        </span>
      }
      description={t('att_desc')}
      padded={false}
    >
      {items.length === 0 ? (
        <Empty icon={<CheckCheck className="h-5 w-5" />} title={t('att_clear')} text={t('att_clear_text')} />
      ) : (
        <ul className="divide-y divide-line/70">
          {items.map((it) => {
            const Icon = it.icon;
            const urgent = it.tone === 'urgent';
            return (
              <li key={it.id}>
                <Link to={it.to} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#f7f7f7] focus-visible:bg-[#f7f7f7] focus-visible:outline-none">
                  <span
                    className={
                      urgent
                        ? 'relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-white'
                        : 'relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f1f1f1] text-ink-soft transition-colors group-hover:bg-[#e8e8e8] group-hover:text-ink'
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium leading-snug text-ink">{it.text}</span>
                    {it.detail && <span className="mt-0.5 block truncate text-[12px] text-muted">{it.detail}</span>}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink/25 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
