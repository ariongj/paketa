// Draftet — B2B draft orders for print jobs: build the job, send the pro-forma, convert into an order.
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { FilePlus2, FileText, Plus, Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { Card, PageHeader, SearchInput, Table, Td, Th, confirmDialog } from '@/admin/components/kit';
import { DraftPill, draftCustomerName, draftDisplayName, draftTotals, poNumberOf, type DraftTotals } from '@/admin/components/orders/drafts';
import { actorName, pluralKey } from '@/admin/components/orders/helpers';
import { Check, Stat, Tabs, Tip } from '@/admin/components/orders/ui';
import { od } from '@/admin/components/orders/dict';
import { adm } from '@/admin/i18n';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { useCan } from '@/store/hooks';
import { fold } from '@/lib/search';
import { date, money, num } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DraftOrder, Lang, Product } from '@/lib/types';

const T = defineDict({
  sq: {
    description: 'Punë printimi që ekipi i përgatit për klientët B2B: çmime sipas sasisë, dizajn & prepress, pro-formë dhe konvertim në porosi.',
    create: 'Draft i ri',
    tab_all: 'Të gjitha',
    tab_open: 'Të hapura',
    tab_invoice_sent: 'Pro-forma e dërguar',
    tab_converted: 'Të konvertuara',
    searchPh: 'Kërko numrin, kompaninë, NUI-n, PO-në ose etiketën',
    col_draft: 'Drafti',
    col_date: 'Krijuar',
    col_customer: 'Klienti',
    col_items: 'Artikujt',
    col_by: 'Krijuar nga',
    col_status: 'Statusi',
    col_total: 'Totali',
    col_order: 'Porosia',
    noCustomer: 'Pa klient',
    noItems: 'Pa artikuj',
    customItem: 'Artikull custom',
    moreItems: '+{n} të tjerë',
    exclVat: '{amount} pa TVSH',
    stat_open: 'Drafte të hapura',
    stat_openHint: 'presin pro-formën ose konfirmimin',
    stat_value: 'Vlera e të hapurave',
    stat_valueHint: 'pa TVSH · me zbritje dhe transport',
    stat_converted: 'Të konvertuara',
    stat_convertedHint: 'drafte u bënë porosi',
    selectAll: 'Zgjidh të gjitha',
    selectRow: 'Zgjidh {n}',
    delete: 'Fshij',
    deleteTitle: 'Të fshihen {n}?',
    deleteText: 'Draftet fshihen përfundimisht. Draftet e konvertuara nuk fshihen — porosia e tyre mbetet.',
    deleted: 'U fshinë: {n}',
    emptyTitle: 'Ende nuk ka drafte',
    emptyText: 'Krijoni një draft kur klienti porosit me telefon ose e-mail: shtoni produktet me sasitë, dizajnin dhe transportin, dërgoni pro-formën dhe konvertojeni në porosi.',
    emptyFiltered: 'Nuk ka drafte për këtë filtër',
    drafts_one: '{n} draft',
    drafts_few: '{n} drafte',
    drafts_many: '{n} drafte',
    pcs: 'copë',
  },
  en: {
    description: 'Print jobs the team prepares for B2B customers: quantity pricing, design & prepress, a pro-forma and conversion into an order.',
    create: 'New draft',
    tab_all: 'All',
    tab_open: 'Open',
    tab_invoice_sent: 'Pro-forma sent',
    tab_converted: 'Converted',
    searchPh: 'Search number, company, business no., PO or tag',
    col_draft: 'Draft',
    col_date: 'Created',
    col_customer: 'Customer',
    col_items: 'Items',
    col_by: 'Created by',
    col_status: 'Status',
    col_total: 'Total',
    col_order: 'Order',
    noCustomer: 'No customer',
    noItems: 'No items',
    customItem: 'Custom item',
    moreItems: '+{n} more',
    exclVat: '{amount} excl. VAT',
    stat_open: 'Open drafts',
    stat_openHint: 'awaiting pro-forma or confirmation',
    stat_value: 'Open draft value',
    stat_valueHint: 'excl. VAT · with discounts and delivery',
    stat_converted: 'Converted',
    stat_convertedHint: 'drafts became orders',
    selectAll: 'Select all',
    selectRow: 'Select {n}',
    delete: 'Delete',
    deleteTitle: 'Delete {n}?',
    deleteText: 'Drafts are deleted permanently. Converted drafts are kept — their order stays.',
    deleted: 'Deleted: {n}',
    emptyTitle: 'No drafts yet',
    emptyText: 'Create a draft when a customer orders by phone or e-mail: add the products and quantities, design and delivery, send the pro-forma and convert it into an order.',
    emptyFiltered: 'No drafts for this filter',
    drafts_one: '{n} draft',
    drafts_few: '{n} drafts',
    drafts_many: '{n} drafts',
    pcs: 'pcs',
  },
});

type Tab = 'all' | DraftOrder['status'];
const TABS: Tab[] = ['all', 'open', 'invoice_sent', 'converted'];

export default function DraftOrders() {
  const t = useDict(T, 'admin');
  const to = useDict(od, 'admin');
  const ta = useDict(adm, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const navigate = useNavigate();
  const drafts = useDb((s) => s.drafts);
  const orders = useDb((s) => s.orders);
  const staff = useDb((s) => s.staff);
  const products = useDb((s) => s.products);
  const settings = useDb((s) => s.settings);
  const discounts = useDb((s) => s.discounts);
  const collections = useDb((s) => s.collections);
  const remove = useDb((s) => s.remove);

  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const totals = useMemo(() => new Map(drafts.map((d) => [d.id, draftTotals(d, { products, settings, discounts, collections })])), [drafts, products, settings, discounts, collections]);

  const searched = useMemo(() => {
    const q = fold(query.trim());
    const list = [...drafts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!q) return list;
    return list.filter((d) => {
      const c = d.customer;
      const hay = fold(`${d.number} ${draftCustomerName(d)} ${c.company ?? ''} ${c.pib ?? ''} ${poNumberOf(d)} ${c.email ?? ''} ${c.phone ?? ''} ${c.city ?? ''} ${d.tags.join(' ')}`);
      return q.split(/\s+/).every((term) => hay.includes(term));
    });
  }, [drafts, query]);
  const filtered = tab === 'all' ? searched : searched.filter((d) => d.status === tab);
  const counts = Object.fromEntries(TABS.map((k) => [k, k === 'all' ? searched.length : searched.filter((d) => d.status === k).length])) as Record<Tab, number>;

  const stats = useMemo(() => {
    const open = drafts.filter((d) => d.status !== 'converted');
    return { open: open.length, value: open.reduce((s, d) => s + (totals.get(d.id)?.grandNet ?? 0), 0), converted: drafts.length - open.length };
  }, [drafts, totals]);

  const deletable = filtered.filter((d) => d.status !== 'converted');
  const chosen = deletable.filter((d) => selected.has(d.id));
  const allOn = deletable.length > 0 && deletable.every((d) => selected.has(d.id));
  const canDelete = can('drafts', 'delete');
  const plural = (n: number) => t(pluralKey('drafts', n, lang), { n });
  const by = (d: DraftOrder) => actorName(d.createdBy, staff, { web: to('by_web'), admin: to('by_admin') });

  const del = async () => {
    const ok = await confirmDialog({ title: t('deleteTitle', { n: plural(chosen.length) }), text: t('deleteText'), confirmLabel: t('delete'), danger: true });
    if (!ok) return;
    chosen.forEach((d) => remove('drafts', d.id));
    setSelected(new Set());
    toast.success(t('deleted', { n: plural(chosen.length) }));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: ta('nav_orders'), to: '/admin/porosite' }, ta('nav_drafts')]}
        title={ta('nav_drafts')}
        description={t('description')}
        actions={
          can('drafts', 'edit') && (
            <ButtonLink to="/admin/draftet/i-ri" size="sm" shape="rounded" icon={<Plus className="h-4 w-4" />}>
              {t('create')}
            </ButtonLink>
          )
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label={t('stat_open')} value={stats.open} hint={t('stat_openHint')} onClick={() => setTab(tab === 'open' ? 'all' : 'open')} active={tab === 'open'} />
        <Stat label={t('stat_value')} value={money(stats.value, lang, { decimals: false })} hint={t('stat_valueHint')} />
        <div className="col-span-2 lg:col-span-1">
          <Stat label={t('stat_converted')} value={stats.converted} hint={t('stat_convertedHint')} onClick={() => setTab(tab === 'converted' ? 'all' : 'converted')} active={tab === 'converted'} />
        </div>
      </div>

      <Card padded={false}>
        <Tabs
          tabs={TABS.map((k) => ({ id: k, label: t(`tab_${k}`), count: counts[k] }))}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setSelected(new Set());
          }}
        />
        <div className="flex flex-col gap-2 border-b border-line/70 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <SearchInput value={query} onChange={setQuery} placeholder={t('searchPh')} className="min-w-0 sm:max-w-md sm:flex-1 [&_input]:h-9" />
          {chosen.length > 0 && (
            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="text-[13px] font-semibold text-ink">{to('selected', { n: chosen.length })}</span>
              <Tip tip={!canDelete && to('noPermission')}>
                <Button variant="outline" size="xs" shape="rounded" icon={<Trash2 className="h-3.5 w-3.5" />} disabled={!canDelete} onClick={del}>
                  {t('delete')}
                </Button>
              </Tip>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={drafts.length ? <FileText className="h-6 w-6" /> : <FilePlus2 className="h-6 w-6" />}
            title={drafts.length ? t('emptyFiltered') : t('emptyTitle')}
            text={drafts.length ? undefined : t('emptyText')}
            action={
              !drafts.length &&
              can('drafts', 'edit') && (
                <ButtonLink to="/admin/draftet/i-ri" size="sm" shape="rounded" icon={<Plus className="h-4 w-4" />}>
                  {t('create')}
                </ButtonLink>
              )
            }
          />
        ) : (
          <>
            <Table className="hidden md:block">
              <thead>
                <tr>
                  <Th className="w-10">
                    <Check checked={allOn} indeterminate={!allOn && chosen.length > 0} onChange={(v) => setSelected(v ? new Set(deletable.map((d) => d.id)) : new Set())} label={t('selectAll')} disabled={!deletable.length} />
                  </Th>
                  <Th>{t('col_draft')}</Th>
                  <Th>{t('col_customer')}</Th>
                  <Th className="hidden xl:table-cell">{t('col_items')}</Th>
                  <Th>{t('col_by')}</Th>
                  <Th>{t('col_status')}</Th>
                  <Th className="text-right">{t('col_total')}</Th>
                  <Th>{t('col_order')}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const order = d.convertedOrderId ? orders.find((o) => o.id === d.convertedOrderId) : undefined;
                  const sel = selected.has(d.id);
                  const tot = totals.get(d.id);
                  const contact = draftCustomerName(d);
                  return (
                    <tr key={d.id} onClick={() => navigate(`/admin/draftet/${d.id}`)} className={cn('cursor-pointer transition-colors', sel ? 'bg-ink/[0.035]' : 'hover:bg-canvas/70')}>
                      <Td className="w-10">
                        <Check
                          checked={sel}
                          disabled={d.status === 'converted'}
                          onChange={(v) =>
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(d.id);
                              else next.delete(d.id);
                              return next;
                            })
                          }
                          label={t('selectRow', { n: d.number })}
                        />
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className="block font-semibold tabular-nums">{d.number}</span>
                        <span className="block text-[12px] text-muted">{date(d.createdAt, lang, { day: 'numeric', month: 'short' })}</span>
                      </Td>
                      <Td className="max-w-[240px]">
                        <span className={cn('block truncate', draftDisplayName(d) ? 'font-medium' : 'text-muted')}>{draftDisplayName(d) || t('noCustomer')}</span>
                        <span className="block truncate text-[12px] text-muted">{[d.customer.company ? contact : null, d.customer.city, poNumberOf(d) ? `PO ${poNumberOf(d)}` : null].filter(Boolean).join(' · ')}</span>
                      </Td>
                      <Td className="hidden max-w-[260px] xl:table-cell">
                        <ItemsSummary d={d} tot={tot} products={products} lang={lang} t={t} />
                      </Td>
                      <Td className="whitespace-nowrap text-ink-soft">{by(d) || '—'}</Td>
                      <Td className="whitespace-nowrap">
                        <DraftPill status={d.status} />
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">
                        <span className="block font-semibold">{money(tot?.grandTotal ?? 0, lang)}</span>
                        <span className="block text-[12px] text-muted">{t('exclVat', { amount: money(tot?.grandNet ?? 0, lang) })}</span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        {order ? (
                          <Link to={`/admin/porosite/${order.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-ink underline-offset-2 hover:underline">
                            #{order.number}
                          </Link>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            <ul className="divide-y divide-line/70 md:hidden">
              {filtered.map((d) => {
                const tot = totals.get(d.id);
                return (
                  <li key={d.id}>
                    <Link to={`/admin/draftet/${d.id}`} className="block px-4 py-3.5 active:bg-canvas">
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-[14.5px] font-semibold tabular-nums">{d.number}</span>
                        <span className="text-[14.5px] font-semibold tabular-nums">{money(tot?.grandTotal ?? 0, lang)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-3 text-[13px]">
                        <span className="truncate">{draftDisplayName(d) || t('noCustomer')}</span>
                        <span className="shrink-0 text-[12px] text-muted">{date(d.createdAt, lang, { day: 'numeric', month: 'short' })}</span>
                      </span>
                      <span className="mt-1 block text-[12.5px] text-muted">
                        <ItemsSummary d={d} tot={tot} products={products} lang={lang} t={t} plain />
                      </span>
                      <span className="mt-2 flex items-center gap-2">
                        <DraftPill status={d.status} />
                        <span className="truncate text-[12px] text-muted">{by(d)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}

/** "Kuti pice tetëkëndore · 1.000 copë  +2 të tjerë" */
function ItemsSummary({ d, tot, products, lang, t, plain }: { d: DraftOrder; tot: DraftTotals | undefined; products: Product[]; lang: Lang; t: ReturnType<typeof useDict<(typeof T)['sq']>>; plain?: boolean }) {
  const l = useL('admin');
  const first = d.items.find((it) => products.some((p) => p.id === it.productId));
  const customs = d.customLines.filter((c) => c.title.trim() && c.qty > 0);
  const count = (tot?.lines.length ?? 0) + customs.length;
  if (!count) return <span className="text-muted">{t('noItems')}</span>;
  const p = first ? products.find((x) => x.id === first.productId) : undefined;
  const label = p && first ? `${l(p.name)} · ${num(first.qty, lang)} ${p.unit === 'set' ? 'set' : t('pcs')}` : `${customs[0]?.title || t('customItem')} · ${num(customs[0]?.qty ?? 0, lang)} ${t('pcs')}`;
  return (
    <span className={cn('block truncate', !plain && 'text-[13px]')}>
      {label}
      {count > 1 && <span className="ml-1.5 text-[12px] text-muted">{t('moreItems', { n: count - 1 })}</span>}
    </span>
  );
}
