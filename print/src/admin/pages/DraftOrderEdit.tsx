// Draft order editor (B2B print jobs): catalogue lines with quantity price tiers, MOQ + quantity step, options,
// the flat design & prepress fee, net custom lines, discount codes, delivery, pro-forma and conversion.
// Deep link: /admin/draftet/i-ri?ribotim=<complaint id> prefills a free reprint from a complaint (Reklamacione).
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { AlertCircle, ArrowRightLeft, ArrowUpRight, CheckCircle2, Clock3, FileText, Minus, PenTool, Plus, RotateCcw, Search, Send, Store, Tag, Trash2, TrendingDown, Truck, UserRound, X } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { Card, PageHeader, SaveBar, Thumb, confirmDialog } from '@/admin/components/kit';
import { ProductSearch } from '@/admin/components/orders/ProductSearch';
import {
  DraftPill,
  blankDraft,
  clampQty,
  draftCustomerName,
  draftProblems,
  draftTotals,
  fromPrice,
  knownCustomers,
  nextDraftNumber,
  nextTier,
  normalizeItems,
  poNumberOf,
  qtyStepOf,
  reprintDraft,
  reprintOf,
  sortedTiers,
  tierIndex,
  unitMoney,
  type DraftExt,
  type DraftTotals,
  type KnownCustomer,
} from '@/admin/components/orders/drafts';
import { actorName, discountName, pluralKey, rejectText } from '@/admin/components/orders/helpers';
import { ActionMenu, Check, CodeChip, SelectInput, SumRow, TextArea, TextInput } from '@/admin/components/orders/ui';
import { od } from '@/admin/components/orders/dict';
import type { Complaint } from '@/admin/components/returns/helpers';
import { adm } from '@/admin/i18n';
import { LANGS, defineDict, useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useCan, useCurrentStaff } from '@/store/hooks';
import { allCities, defaultOptions, minQty, unitPrice, zoneForCity } from '@/lib/pricing';
import { normalizeCode } from '@/lib/discounts';
import { fold } from '@/lib/search';
import { dateTime, money, num } from '@/lib/format';
import { cn, round2, uid } from '@/lib/utils';
import type { ArtworkStatus, CartItem, DraftOrder, Lang, PaymentMethod, Product } from '@/lib/types';

const T = defineDict({
  sq: {
    newTitle: 'Draft i ri',
    title: 'Drafti {n}',
    createdBy: 'Krijuar nga {name} · {date}',
    newDesc: 'Përgatitni një punë printimi për klientin B2B: çmime sipas sasisë, dizajn & prepress, pro-formë dhe konvertim në porosi.',
    sendProforma: 'Dërgo pro-formën',
    resendProforma: 'Ridërgo pro-formën',
    convert: 'Konverto në porosi',
    more: 'Më shumë',
    deleteDraft: 'Fshij draftin',
    deleteTitle: 'Të fshihet drafti {n}?',
    deleteText: 'Drafti fshihet përfundimisht.',
    deleted: 'Drafti {n} u fshi',
    saved: 'Drafti {n} u ruajt',
    proformaSent: 'Pro-forma për {n} u dërgua te {email}',
    convertTitle: 'Të konvertohet {n} në porosi?',
    convertText: 'Krijohet një porosi e konfirmuar me këto çmime, zbritje dhe transport ({total} me TVSH). Puna kalon te prepress-i dhe drafti mbyllet.',
    convertConfirm: 'Konverto',
    converted: 'U krijua porosia #{n}',
    convertedBanner: 'Drafti u konvertua në porosinë #{n}. Ndryshimet nuk janë më të mundshme.',
    openOrder: 'Hap porosinë',
    sentBanner: 'Pro-forma u dërgua më {date}. Konvertojeni draftin kur klienti ta konfirmojë ose të paguajë avansin.',
    readOnly: 'Vetëm shikim — roli juaj nuk mund të ndryshojë draftet.',
    reprintBanner: 'Ribotim pa pagesë për reklamacionin {ret} · porosia #{order}',
    openComplaint: 'Hap reklamacionin',
    reprintLine: 'Ribotim — {name}{opts} ({ret})',
    reprintNote: 'Ribotim pa pagesë për reklamacionin {ret} të porosisë {order}. Skedari dhe specifikat si në porosinë origjinale.',
    fixFirst: 'Plotësoni: {list}',
    p_lines: 'të paktën një artikull',
    p_name: 'kompaninë ose personin e kontaktit',
    p_contact: 'telefonin ose e-mailin',
    p_email: 'e-mailin për pro-formën',
    p_city: 'qytetin',
    p_address: 'adresën e dërgesës',
    required: 'E detyrueshme',
    products: 'Artikujt',
    noLines: 'Shtoni produkte nga katalogu ose një artikull custom (p.sh. matricë e re prerjeje, mostër fizike).',
    addCustom: 'Shto artikull custom',
    customTitle: 'Emri i artikullit custom',
    customPh: 'p.sh. Matricë e re prerjeje (die-cut)',
    unitNet: 'Çmimi për copë, pa TVSH',
    qty: 'Sasia',
    custom: 'Artikull custom (pa TVSH)',
    customFree: 'Ribotim pa pagesë',
    design: 'Dizajn & prepress',
    designLine: '{price} për linjë',
    designUnit: '{price} / copë',
    artwork: 'Skedari i printimit',
    artworkShort: 'Skedari',
    remove: 'Hiq',
    missing: 'Produkti nuk ekziston më në katalog',
    missingHint: 'Hiqeni ose zëvendësojeni — nuk llogaritet dhe nuk kalon në porosi.',
    tierApplied: 'Çmimi për {n}+ copë',
    tiers: 'Çmime sipas sasisë (pa TVSH)',
    nextTier: 'Nga {n} copë: {price} / copë · {pct}% më lirë',
    qtyRule: 'Min. {min} copë · hapi {step}',
    qtyMin: 'Min. {min} copë',
    rounded: 'Sasia u rregullua në {n} copë (min. {min} · hapi {step})',
    quoteAdded: '„{name}“ është produkt me ofertë — u shtua si artikull custom. Vendosni çmimin e ofertës.',
    quoteTag: 'Me ofertë',
    pcs: 'copë',
    exclVat: 'pa TVSH',
    summary: 'Përmbledhja',
    codes: 'Kodet e zbritjes',
    codePh: 'Shkruani kodin, p.sh. PRINT10',
    apply: 'Apliko',
    codeExists: 'Kodi është shtuar tashmë',
    applied: 'I aplikuar',
    autoHint: '{name}: {reason}',
    subtotal: 'Nëntotali',
    customLines: 'përfshirë artikuj custom {amount}',
    shippingRow: 'Transporti',
    pickupFree: 'Marrje në fabrikë',
    estimate: 'vlerësim — zgjidhni qytetin',
    totalNet: 'Totali pa TVSH',
    vat: 'TVSH {rate}%',
    total: 'Totali',
    method: 'Mënyra e pagesës',
    methodHint: 'Klientët B2B zakonisht paguajnë me transfertë bankare kundrejt pro-formës.',
    engineNote: 'Çmimet janë pa TVSH; TVSH {rate}% shtohet në fund. Zbritjet llogariten me të njëjtin motor si në dyqanin online — porosia del identike pas konvertimit.',
    customer: 'Klienti',
    findCustomer: 'Gjej klient — kompania, emri, telefoni…',
    noMatch: 'Nuk ka klient — plotësoni të dhënat më poshtë',
    ordersN: '{n} porosi',
    clearCustomer: 'Klient i ri',
    company: 'Kompania',
    companyPh: 'Emri zyrtar i biznesit',
    pib: 'NUI',
    pibPh: 'Numri unik identifikues',
    po: 'Nr. PO i klientit',
    poPh: 'p.sh. PO-2026-118',
    poHint: 'Kalon në porosi pas konvertimit.',
    contact: 'Personi i kontaktit',
    firstName: 'Emri',
    lastName: 'Mbiemri',
    phone: 'Telefoni',
    email: 'E-mail',
    customerLang: 'Gjuha e klientit (artikujt, pro-forma)',
    delivery: 'Dërgesa',
    city: 'Qyteti',
    chooseCity: 'Zgjidhni qytetin',
    address: 'Adresa',
    zone: '{zone} · {fee} · {days} ditë',
    pickupAt: 'Marrje në fabrikë: {addr}',
    lead: 'Afati i prodhimit: deri në {n} ditë pune pas aprovimit të provës.',
    tags: 'Etiketat',
    addTag: 'Shto etiketë dhe Enter',
    notes: 'Shënime',
    notesPh: 'Marrëveshja me klientin, afatet, avansi, kërkesat për provën…',
    notesHint: 'Kalon si shënim i klientit në porosi.',
    notFound: 'Drafti nuk u gjet',
    notFoundText: 'Mund të jetë fshirë ose lidhja nuk është e saktë.',
    back: 'Të gjitha draftet',
  },
  en: {
    newTitle: 'New draft',
    title: 'Draft {n}',
    createdBy: 'Created by {name} · {date}',
    newDesc: 'Prepare a print job for a B2B customer: quantity pricing, design & prepress, a pro-forma and conversion into an order.',
    sendProforma: 'Send pro-forma',
    resendProforma: 'Resend pro-forma',
    convert: 'Convert to order',
    more: 'More',
    deleteDraft: 'Delete draft',
    deleteTitle: 'Delete draft {n}?',
    deleteText: 'The draft is deleted permanently.',
    deleted: 'Draft {n} deleted',
    saved: 'Draft {n} saved',
    proformaSent: 'Pro-forma for {n} sent to {email}',
    convertTitle: 'Convert {n} into an order?',
    convertText: 'A confirmed order is created with these prices, discounts and delivery ({total} incl. VAT). The job moves to prepress and the draft is closed.',
    convertConfirm: 'Convert',
    converted: 'Order #{n} created',
    convertedBanner: 'This draft was converted into order #{n}. It can no longer be edited.',
    openOrder: 'Open order',
    sentBanner: 'Pro-forma sent on {date}. Convert the draft once the customer confirms or pays the deposit.',
    readOnly: 'View only — your role cannot edit drafts.',
    reprintBanner: 'Free reprint for complaint {ret} · order #{order}',
    openComplaint: 'Open complaint',
    reprintLine: 'Reprint — {name}{opts} ({ret})',
    reprintNote: 'Free reprint for complaint {ret} on order {order}. Same file and specifications as the original order.',
    fixFirst: 'Please add: {list}',
    p_lines: 'at least one item',
    p_name: 'company or contact person',
    p_contact: 'phone or e-mail',
    p_email: 'e-mail for the pro-forma',
    p_city: 'city',
    p_address: 'delivery address',
    required: 'Required',
    products: 'Items',
    noLines: 'Add catalogue products or a custom item (e.g. a new cutting die, a physical sample).',
    addCustom: 'Add custom item',
    customTitle: 'Custom item name',
    customPh: 'e.g. New cutting die (die-cut)',
    unitNet: 'Price per piece, excl. VAT',
    qty: 'Quantity',
    custom: 'Custom item (excl. VAT)',
    customFree: 'Free reprint',
    design: 'Design & prepress',
    designLine: '{price} per line',
    designUnit: '{price} / pc',
    artwork: 'Print file',
    artworkShort: 'File',
    remove: 'Remove',
    missing: 'This product no longer exists in the catalogue',
    missingHint: 'Remove or replace it — it is not priced and will not be carried into the order.',
    tierApplied: 'Price for {n}+ pcs',
    tiers: 'Quantity pricing (excl. VAT)',
    nextTier: 'From {n} pcs: {price} / pc · {pct}% cheaper',
    qtyRule: 'Min. {min} pcs · step {step}',
    qtyMin: 'Min. {min} pcs',
    rounded: 'Quantity adjusted to {n} pcs (min. {min} · step {step})',
    quoteAdded: '“{name}” is quote-only — it was added as a custom item. Enter the quoted price.',
    quoteTag: 'Quote only',
    pcs: 'pcs',
    exclVat: 'excl. VAT',
    summary: 'Summary',
    codes: 'Discount codes',
    codePh: 'Enter a code, e.g. PRINT10',
    apply: 'Apply',
    codeExists: 'Code already added',
    applied: 'Applied',
    autoHint: '{name}: {reason}',
    subtotal: 'Subtotal',
    customLines: 'incl. custom items {amount}',
    shippingRow: 'Delivery',
    pickupFree: 'Pickup at the factory',
    estimate: 'estimate — choose a city',
    totalNet: 'Total excl. VAT',
    vat: 'VAT {rate}%',
    total: 'Total',
    method: 'Payment method',
    methodHint: 'B2B customers usually pay by bank transfer against the pro-forma.',
    engineNote: 'Prices exclude VAT; {rate}% VAT is added at the end. Discounts use the same engine as the online shop — the order comes out identical after converting.',
    customer: 'Customer',
    findCustomer: 'Find a customer — company, name, phone…',
    noMatch: 'No customer — fill in the details below',
    ordersN: '{n} orders',
    clearCustomer: 'New customer',
    company: 'Company',
    companyPh: 'Registered business name',
    pib: 'Business no. (NUI)',
    pibPh: 'Unique identification number',
    po: 'Customer PO no.',
    poPh: 'e.g. PO-2026-118',
    poHint: 'Carried into the order on conversion.',
    contact: 'Contact person',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    email: 'E-mail',
    customerLang: 'Customer language (items, pro-forma)',
    delivery: 'Delivery',
    city: 'City',
    chooseCity: 'Choose a city',
    address: 'Address',
    zone: '{zone} · {fee} · {days} days',
    pickupAt: 'Pickup at the factory: {addr}',
    lead: 'Production time: up to {n} working days after proof approval.',
    tags: 'Tags',
    addTag: 'Add a tag and press Enter',
    notes: 'Notes',
    notesPh: 'Agreement with the customer, deadlines, deposit, proof requirements…',
    notesHint: 'Carried over as the customer note on the order.',
    notFound: 'Draft not found',
    notFoundText: 'It may have been deleted or the link is incorrect.',
    back: 'All drafts',
  },
});

type Dict = ReturnType<typeof useDict<(typeof T)['sq']>>;
type Problem = ReturnType<typeof draftProblems>[number];
type SetDraft = (fn: (d: DraftExt) => DraftExt) => void;

const ARTWORK_OPTIONS: ArtworkStatus[] = ['later', 'uploaded', 'design'];

export default function DraftOrderEdit() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const isNew = id === 'i-ri';
  const stored = useDb((s) => (isNew ? undefined : s.drafts.find((d) => d.id === id || d.number === id)));
  const reprintId = isNew ? params.get('ribotim') : null;

  if (!isNew && !stored) {
    return (
      <div className="animate-fade-in">
        <PageHeader back="/admin/draftet" breadcrumbs={[{ label: ta('nav_orders'), to: '/admin/porosite' }, { label: ta('nav_drafts'), to: '/admin/draftet' }, t('notFound')]} title={t('notFound')} />
        <Card>
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title={t('notFound')}
            text={t('notFoundText')}
            action={
              <ButtonLink to="/admin/draftet" size="sm" shape="rounded">
                {t('back')}
              </ButtonLink>
            }
          />
        </Card>
      </div>
    );
  }
  return <Editor key={stored?.id ?? `new:${reprintId ?? ''}`} stored={(stored as DraftExt | undefined) ?? null} reprintId={reprintId} />;
}

function Editor({ stored, reprintId }: { stored: DraftExt | null; reprintId: string | null }) {
  const t = useDict(T, 'admin');
  const to = useDict(od, 'admin');
  const ta = useDict(adm, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const navigate = useNavigate();
  const me = useCurrentStaff();
  const drafts = useDb((s) => s.drafts);
  const orders = useDb((s) => s.orders);
  const returns = useDb((s) => s.returns);
  const staff = useDb((s) => s.staff);
  const audit = useDb((s) => s.audit);
  const products = useDb((s) => s.products);
  const settings = useDb((s) => s.settings);
  const discounts = useDb((s) => s.discounts);
  const collections = useDb((s) => s.collections);
  const upsert = useDb((s) => s.upsert);
  const remove = useDb((s) => s.remove);
  const logAudit = useDb((s) => s.logAudit);
  const convertDraft = useDb((s) => s.convertDraft);
  const updateOrder = useDb((s) => s.updateOrder);

  const [base, setBase] = useState<DraftExt>(() => stored ?? blankDraft(lang, me?.id));
  const [draft, setDraft] = useState<DraftExt>(() => {
    if (stored) return stored;
    // a reprint from a complaint starts prefilled (unsaved, so the SaveBar shows)
    const ret = reprintId ? returns.find((r) => r.id === reprintId) : undefined;
    const order = ret ? orders.find((o) => o.id === ret.orderId) : undefined;
    if (ret && order)
      return reprintDraft(ret, order, products, {
        lang,
        createdBy: me?.id,
        note: t('reprintNote', { ret: ret.number, order: order.number }),
        titleOf: (name, opts, n) => t('reprintLine', { name, opts: opts ? ` · ${opts}` : '', ret: n }),
      });
    return blankDraft(lang, me?.id);
  });
  const [showErrors, setShowErrors] = useState<Problem[]>([]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);

  // follow store updates (status change, another tab) while there are no local edits
  useEffect(() => {
    if (!stored || JSON.stringify(stored) === JSON.stringify(base)) return;
    setBase(stored);
    if (!dirty) setDraft(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  const converted = draft.status === 'converted';
  const readOnly = converted || !can('drafts', 'edit');
  const totals = useMemo(() => draftTotals(draft, { products, settings, discounts, collections }), [draft, products, settings, discounts, collections]);
  const order = draft.convertedOrderId ? orders.find((o) => o.id === draft.convertedOrderId) : undefined;
  const sentAt = useMemo(() => (stored ? audit.find((a) => a.object === 'draft' && a.objectId === stored.id && a.action === 'send')?.at : undefined), [audit, stored]);
  const reprint = useMemo(() => {
    const rid = reprintOf(draft);
    const ret = rid ? returns.find((r) => r.id === rid) : undefined;
    return ret ? { ret, order: orders.find((o) => o.id === ret.orderId) } : null;
  }, [draft, returns, orders]);
  const problems = showErrors;
  const has = (p: Problem) => problems.includes(p);

  const patch = (p: Partial<DraftExt>) => setDraft((d) => ({ ...d, ...p }));
  const patchCustomer = (p: Partial<DraftOrder['customer']>) => setDraft((d) => ({ ...d, customer: { ...d.customer, ...p } }));

  /* ---------------- persistence ---------------- */
  const persist = (next: DraftExt): DraftExt => {
    const isFirst = !next.id;
    const saved: DraftExt = isFirst ? { ...next, id: uid('dr'), number: nextDraftNumber(drafts), createdAt: new Date().toISOString() } : next;
    upsert('drafts', saved);
    // link a new reprint draft back to its complaint
    const rid = reprintOf(saved);
    if (isFirst && rid) {
      const ret = useDb.getState().returns.find((r) => r.id === rid) as Complaint | undefined;
      if (ret && !ret.reprintDraftId) upsert('returns', { ...ret, reprintDraftId: saved.id } as Complaint);
    }
    setBase(saved);
    setDraft(saved);
    if (isFirst) navigate(`/admin/draftet/${saved.id}`, { replace: true });
    return saved;
  };

  const save = () => {
    const saved = persist(draft);
    toast.success(t('saved', { n: saved.number }));
  };

  const check = (needEmail = false) => {
    const p = draftProblems(draft, { needEmail });
    setShowErrors(p);
    if (p.length) toast.error(t('fixFirst', { list: p.map((x) => t(`p_${x}`)).join(', ') }));
    return p.length === 0;
  };

  const sendProforma = () => {
    if (!check(true)) return;
    const saved = persist({ ...draft, status: 'invoice_sent' });
    logAudit({ action: 'send', object: 'draft', objectId: saved.id, detail: `${saved.number} → ${saved.customer.email}` });
    toast.success(t('proformaSent', { n: saved.number, email: saved.customer.email ?? '' }));
  };

  const convert = async () => {
    if (!check()) return;
    const ok = await confirmDialog({
      title: t('convertTitle', { n: draft.number || t('newTitle') }),
      text: t('convertText', { total: money(totals.grandTotal, lang) }),
      confirmLabel: t('convertConfirm'),
      danger: false,
    });
    if (!ok) return;
    const saved = persist(draft);
    const created = convertDraft(saved.id);
    if (!created) return;
    // convertDraft carries company, NUI and the note; the PO number lives on the draft extension
    const po = poNumberOf(saved).trim();
    if (po) updateOrder(created.id, { poNumber: po });
    toast.success(t('converted', { n: created.number }));
    navigate(`/admin/porosite/${created.id}`);
  };

  const del = async () => {
    const ok = await confirmDialog({ title: t('deleteTitle', { n: draft.number }), text: t('deleteText'), confirmLabel: ta('delete'), danger: true });
    if (!ok) return;
    remove('drafts', draft.id);
    toast.success(t('deleted', { n: draft.number }));
    navigate('/admin/draftet');
  };

  const creator = actorName(draft.createdBy, staff, { web: to('by_web'), admin: to('by_admin') });
  const title = draft.number ? t('title', { n: draft.number }) : t('newTitle');

  return (
    <div className="animate-fade-in pb-24">
      <PageHeader
        back="/admin/draftet"
        breadcrumbs={[{ label: ta('nav_orders'), to: '/admin/porosite' }, { label: ta('nav_drafts'), to: '/admin/draftet' }, draft.number || t('newTitle')]}
        title={title}
        badge={draft.id ? <DraftPill status={draft.status} /> : undefined}
        description={draft.id ? t('createdBy', { name: creator || '—', date: dateTime(draft.createdAt, lang) }) : t('newDesc')}
        actions={
          !readOnly && (
            <>
              <Button variant="outline" size="sm" shape="rounded" icon={<Send className="h-4 w-4" />} onClick={sendProforma}>
                {draft.status === 'invoice_sent' ? t('resendProforma') : t('sendProforma')}
              </Button>
              <Button size="sm" shape="rounded" icon={<ArrowRightLeft className="h-4 w-4" />} onClick={convert}>
                {t('convert')}
              </Button>
              {draft.id && (
                <ActionMenu
                  label={t('more')}
                  items={[{ label: t('deleteDraft'), icon: <Trash2 />, danger: true, onClick: del, disabled: !can('drafts', 'delete'), hint: to('noPermission') }]}
                />
              )}
            </>
          )
        }
      />

      {converted && (
        <Banner icon={<CheckCircle2 className="h-4 w-4" />}>
          <span className="flex-1">{t('convertedBanner', { n: order?.number ?? '—' })}</span>
          {order && (
            <ButtonLink to={`/admin/porosite/${order.id}`} size="xs" shape="rounded">
              {t('openOrder')}
            </ButtonLink>
          )}
        </Banner>
      )}
      {reprint && (
        <Banner icon={<RotateCcw className="h-4 w-4" />}>
          <span className="flex-1">{t('reprintBanner', { ret: reprint.ret.number, order: reprint.order?.number ?? '—' })}</span>
          <Link to={`/admin/kthimet?id=${reprint.ret.id}`} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink hover:underline">
            {t('openComplaint')} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Banner>
      )}
      {draft.status === 'invoice_sent' && <Banner icon={<Send className="h-4 w-4" />}>{t('sentBanner', { date: sentAt ? dateTime(sentAt, lang) : '—' })}</Banner>}
      {!converted && !can('drafts', 'edit') && <Banner icon={<AlertCircle className="h-4 w-4" />}>{t('readOnly')}</Banner>}
      {problems.length > 0 && !readOnly && (
        <Banner tone="critical" icon={<AlertCircle className="h-4 w-4" />}>
          {t('fixFirst', { list: problems.map((x) => t(`p_${x}`)).join(', ') })}
        </Banner>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <ProductsCard draft={draft} setDraft={setDraft} totals={totals} readOnly={readOnly} error={has('lines')} t={t} />
          <SummaryCard draft={draft} patch={patch} totals={totals} readOnly={readOnly} t={t} />
        </div>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <CustomerCard draft={draft} patch={patch} patchCustomer={patchCustomer} readOnly={readOnly} problems={problems} t={t} />
          <DeliveryCard draft={draft} patch={patch} patchCustomer={patchCustomer} readOnly={readOnly} problems={problems} t={t} />
          <Card title={t('tags')}>
            <TagsInput value={draft.tags} onChange={(tags) => patch({ tags })} placeholder={t('addTag')} disabled={readOnly} />
          </Card>
          <Card title={t('notes')}>
            <TextArea value={draft.note} onChange={(e) => patch({ note: e.target.value })} placeholder={t('notesPh')} hint={t('notesHint')} rows={3} disabled={readOnly} />
          </Card>
        </div>
      </div>

      {!readOnly && (
        <SaveBar
          dirty={dirty}
          onSave={save}
          onDiscard={() => {
            setDraft(base);
            setShowErrors([]);
          }}
        />
      )}
    </div>
  );
}

function Banner({ icon, children, tone = 'neutral' }: { icon: ReactNode; children: ReactNode; tone?: 'neutral' | 'critical' }) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-3 text-[13.5px]', tone === 'critical' ? 'border-[#F4C7BF] bg-[#FDF1EF] text-[#8A1B0A]' : 'border-line bg-white text-ink-soft')}>
      <span className="shrink-0">{icon}</span>
      {children}
    </div>
  );
}

/* ================================================================== */
/* Quantity field: − n + with MOQ and step                             */
/* ================================================================== */
function QtyField({ value, onCommit, min, step, ariaLabel, disabled }: { value: number; onCommit: (n: number) => void; min: number; step: number; ariaLabel: string; disabled?: boolean }) {
  const lang = useLang('admin');
  const [text, setText] = useState<string | null>(null);
  const commit = (raw: string) => {
    setText(null);
    const n = parseInt(raw.replace(/[^\d]/g, ''), 10);
    if (!Number.isNaN(n) && n !== value) onCommit(n);
  };
  const btn = 'grid h-full w-8 place-items-center text-ink-soft transition-colors hover:bg-ink/[0.04] hover:text-ink disabled:opacity-30';
  return (
    <div className={cn('inline-flex h-8 items-center rounded-lg border border-line bg-white', disabled && 'opacity-60')}>
      <button type="button" aria-label="−" disabled={disabled || value - step < min} onClick={() => onCommit(value - step)} className={cn(btn, 'rounded-l-lg')}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        aria-label={ariaLabel}
        inputMode="numeric"
        disabled={disabled}
        value={text ?? num(value, lang)}
        onFocus={(e) => {
          setText(String(value));
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="h-full w-[72px] border-x border-line bg-transparent text-center text-[13px] font-semibold tabular-nums outline-none focus:bg-canvas/60"
      />
      <button type="button" aria-label="+" disabled={disabled} onClick={() => onCommit(value + step)} className={cn(btn, 'rounded-r-lg')}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Money field for net unit prices (keeps up to 3 decimals while typing). */
function PriceField({ value, onChange, ariaLabel, disabled }: { value: number; onChange: (v: number) => void; ariaLabel: string; disabled?: boolean }) {
  const lang = useLang('admin');
  const [text, setText] = useState<string | null>(null);
  const plain = lang === 'en' ? String(value) : String(value).replace('.', ',');
  const shown = text ?? plain;
  const commit = (raw: string) => {
    setText(null);
    const n = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isNaN(n)) onChange(Math.max(0, Math.round(n * 1000) / 1000));
  };
  return (
    <div className="relative w-[112px]">
      <input
        aria-label={ariaLabel}
        inputMode="decimal"
        disabled={disabled}
        value={shown}
        onFocus={() => setText(plain)}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="h-8 w-full rounded-lg border border-line bg-white pl-3 pr-7 text-right text-[13px] tabular-nums outline-none transition focus:border-ink/40 focus:ring-4 focus:ring-ink/5 disabled:bg-canvas disabled:text-muted"
      />
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[12.5px] text-muted">€</span>
    </div>
  );
}

/* ================================================================== */
/* Items                                                               */
/* ================================================================== */
function ProductsCard({ draft, setDraft, totals, readOnly, error, t }: { draft: DraftExt; setDraft: SetDraft; totals: DraftTotals; readOnly: boolean; error: boolean; t: Dict }) {
  const l = useL('admin');
  const lang = useLang('admin');
  const products = useDb((s) => s.products);

  const setItems = (fn: (items: CartItem[]) => CartItem[]) => setDraft((d) => ({ ...d, items: normalizeItems(fn(d.items)) }));
  const setCustom = (fn: (c: DraftOrder['customLines']) => DraftOrder['customLines']) => setDraft((d) => ({ ...d, customLines: fn(d.customLines) }));

  const add = (p: Product) => {
    if (p.quoteOnly) {
      // quote-only products have no fixed price — staff enter the quoted (net) price on a custom line
      setCustom((list) => [...list, { title: `${l(p.name)} · ${p.sku}`, price: fromPrice(p), qty: minQty(p) }]);
      toast.info(t('quoteAdded', { name: l(p.name) }));
      return;
    }
    setItems((items) => [...items, { key: '', productId: p.id, qty: minQty(p), options: defaultOptions(p), installation: false, ...(p.artwork ? { artwork: { status: 'later' as const } } : {}) }]);
  };

  const empty = draft.items.length === 0 && draft.customLines.length === 0;

  return (
    <Card title={t('products')} padded={false}>
      <div className="border-b border-line/70 px-4 py-3 sm:px-5">
        <ProductSearch onPick={add} disabled={readOnly} />
      </div>
      {empty ? (
        <p className={cn('px-5 py-10 text-center text-[13.5px]', error ? 'font-medium text-[#B42318]' : 'text-muted')}>{t('noLines')}</p>
      ) : (
        <ul className="divide-y divide-line/70">
          {draft.items.map((it, i) => {
            const p = products.find((x) => x.id === it.productId);
            const update = (fn: (x: CartItem) => CartItem) => setItems((items) => items.map((x, k) => (k === i ? fn(x) : x)));
            const drop = () => setItems((items) => items.filter((_, k) => k !== i));
            if (!p) return <MissingLine key={it.key || i} item={it} onRemove={drop} readOnly={readOnly} t={t} />;
            return <CatalogueLine key={it.key || i} p={p} item={it} priced={totals.lines.find((x) => x.item.key === it.key)} applied={totals.applied} update={update} onRemove={drop} readOnly={readOnly} t={t} />;
          })}
          {draft.customLines.map((c, i) => {
            const update = (patch: Partial<DraftOrder['customLines'][number]>) => setCustom((list) => list.map((x, k) => (k === i ? { ...x, ...patch } : x)));
            const free = !!reprintOf(draft) && c.price === 0;
            return (
              <li key={`c${i}`} className="flex gap-3 px-4 py-4 sm:px-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-dashed border-line text-muted">{free ? <RotateCcw className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <TextInput aria-label={t('customTitle')} value={c.title} disabled={readOnly} placeholder={t('customPh')} onChange={(e) => update({ title: e.target.value })} wrapClassName="min-w-0 flex-1" />
                    <span className="shrink-0 pt-1.5 text-right tabular-nums">
                      <span className="block font-semibold text-ink">{money(round2(c.price * c.qty), lang)}</span>
                      <span className="block text-[11.5px] text-muted">{t('exclVat')}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <QtyField value={c.qty} min={1} step={1} onCommit={(n) => update({ qty: Math.max(1, n) })} ariaLabel={t('qty')} disabled={readOnly} />
                    <span className="text-[12.5px] text-muted">{t('pcs')} ×</span>
                    <PriceField value={c.price} onChange={(v) => update({ price: v })} ariaLabel={t('unitNet')} disabled={readOnly} />
                    <span className="text-[12px] text-muted">{free ? t('customFree') : t('custom')}</span>
                    {!readOnly && <RemoveBtn onClick={() => setCustom((list) => list.filter((_, k) => k !== i))} label={t('remove')} />}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!readOnly && (
        <div className="border-t border-line/70 px-4 py-2.5 sm:px-5">
          <button type="button" onClick={() => setCustom((list) => [...list, { title: '', price: 0, qty: 1 }])} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-ink hover:bg-ink/[0.05]">
            <Plus className="h-4 w-4" /> {t('addCustom')}
          </button>
        </div>
      )}
    </Card>
  );
}

function RemoveBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="ml-auto inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12.5px] font-medium text-muted hover:bg-ink/[0.05] hover:text-ink">
      <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function MissingLine({ item, onRemove, readOnly, t }: { item: CartItem; onRemove: () => void; readOnly: boolean; t: Dict }) {
  const lang = useLang('admin');
  return (
    <li className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-canvas text-muted">
        <AlertCircle className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{t('missing')}</p>
        <p className="text-[12.5px] text-muted">
          {num(item.qty, lang)} {t('pcs')} · {t('missingHint')}
        </p>
      </div>
      {!readOnly && <RemoveBtn onClick={onRemove} label={t('remove')} />}
    </li>
  );
}

function CatalogueLine({ p, item, priced, applied, update, onRemove, readOnly, t }: { p: Product; item: CartItem; priced: DraftTotals['lines'][number] | undefined; applied: DraftTotals['applied']; update: (fn: (x: CartItem) => CartItem) => void; onRemove: () => void; readOnly: boolean; t: Dict }) {
  const l = useL('admin');
  const lang = useLang('admin');
  const tc = useDict(common, 'admin');
  const min = minQty(p);
  const step = qtyStepOf(p);
  const tiers = sortedTiers(p);
  const idx = tierIndex(p, item.qty);
  const next = nextTier(p, item.qty);
  const design = p.installation?.available ? p.installation : null;
  const perLine = design?.per === 'line';
  const gross = priced ? round2(priced.lineTotal + priced.installationTotal) : 0;
  const net = priced ? round2(gross - priced.discount) : 0;
  const currentUnit = priced?.unitPrice ?? unitPrice(p, item.options, item.qty);
  const nextUnit = next ? unitPrice(p, item.options, next.qty) : 0;
  const pct = next && currentUnit > 0 ? Math.round((1 - nextUnit / currentUnit) * 100) : 0;

  const setQty = (n: number) => {
    const c = clampQty(p, n);
    if (c !== n && n >= 0) toast(t('rounded', { n: num(c, lang), min: num(min, lang), step: num(step, lang) }));
    update((x) => ({ ...x, qty: c }));
  };
  // the paid design service and the "designed by PrintWorks" artwork state go together
  const setDesign = (on: boolean) =>
    update((x) => {
      const prev: ArtworkStatus = x.artwork?.status ?? 'later';
      const status: ArtworkStatus = on ? 'design' : prev === 'design' ? 'later' : prev;
      return { ...x, installation: on, ...(p.artwork ? { artwork: { ...x.artwork, status } } : {}) };
    });
  const setArtwork = (s: ArtworkStatus) => update((x) => ({ ...x, artwork: { ...x.artwork, status: s }, ...(design ? { installation: s === 'design' } : {}) }));

  return (
    <li className="flex gap-3 px-4 py-4 sm:px-5">
      <Thumb src={p.images[0]} className="h-12 w-12 rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold leading-snug text-ink">{l(p.name)}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-muted">
              <span className="font-mono text-[11.5px]">{p.sku}</span>
              <span aria-hidden>·</span>
              <span className="tabular-nums text-ink-soft">
                {unitMoney(currentUnit, lang)} / {p.unit === 'set' ? 'set' : t('pcs')}
              </span>
              {idx >= 0 && tiers.length > 1 && (
                <>
                  <span aria-hidden>·</span>
                  <span>{t('tierApplied', { n: num(tiers[idx].qty, lang) })}</span>
                </>
              )}
            </p>
          </div>
          <div className="shrink-0 text-right tabular-nums">
            {priced && priced.discount > 0 && <span className="block text-[12px] text-muted line-through">{money(gross, lang)}</span>}
            <span className="block font-semibold text-ink">{money(net, lang)}</span>
            <span className="block text-[11.5px] text-muted">{t('exclVat')}</span>
          </div>
        </div>

        {/* quantity + options */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <QtyField value={item.qty} min={min} step={step} onCommit={setQty} ariaLabel={t('qty')} disabled={readOnly} />
          <span className="text-[12px] text-muted">{step > 1 ? t('qtyRule', { min: num(min, lang), step: num(step, lang) }) : min > 1 ? t('qtyMin', { min: num(min, lang) }) : p.unit === 'set' ? 'set' : t('pcs')}</span>
          {p.options.map((o) => (
            <SelectInput
              key={o.id}
              aria-label={l(o.name)}
              value={item.options[o.id] ?? ''}
              disabled={readOnly}
              onChange={(e) => update((x) => ({ ...x, options: { ...x.options, [o.id]: e.target.value } }))}
              wrapClassName="min-w-0"
              className="h-8 max-w-[320px] text-[12.5px]"
            >
              {o.values.map((v) => (
                <option key={v.id} value={v.id}>
                  {l(o.name)}: {l(v.label)}
                  {v.priceDelta ? ` (${v.priceDelta > 0 ? '+' : '−'}${unitMoney(Math.abs(v.priceDelta), lang)} / ${t('pcs')})` : ''}
                </option>
              ))}
            </SelectInput>
          ))}
        </div>

        {/* quantity price tiers */}
        {tiers.length > 1 && (
          <div className="mt-3">
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">{t('tiers')}</p>
            <div className="no-scrollbar overflow-x-auto">
              <div className="inline-flex min-w-full overflow-hidden rounded-lg border border-line">
                {tiers.map((tier, k) => {
                  const on = k === idx;
                  return (
                    <button
                      key={tier.qty}
                      type="button"
                      disabled={readOnly}
                      aria-pressed={on}
                      onClick={() => update((x) => ({ ...x, qty: clampQty(p, tier.qty) }))}
                      className={cn('min-w-[76px] flex-1 border-l border-line px-2.5 py-1.5 text-left transition-colors first:border-l-0', on ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-ink/[0.04] disabled:hover:bg-white')}
                    >
                      <span className={cn('block font-mono text-[11px]', on ? 'text-white/70' : 'text-muted')}>{num(tier.qty, lang)}+</span>
                      <span className="block text-[12.5px] font-semibold tabular-nums">{unitMoney(unitPrice(p, item.options, tier.qty), lang)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {next && pct > 0 && !readOnly && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-soft">
                <TrendingDown className="h-3.5 w-3.5 shrink-0 text-muted" />
                {t('nextTier', { n: num(next.qty, lang), price: unitMoney(nextUnit, lang), pct })}
              </p>
            )}
          </div>
        )}

        {/* design service, artwork, discounts */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {design && (
            <label className={cn('inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-line px-2.5 text-[12.5px] text-ink-soft', item.installation && 'border-ink/40 text-ink', readOnly && 'cursor-not-allowed opacity-60')}>
              <Check checked={item.installation} disabled={readOnly} onChange={setDesign} label={t('design')} />
              <PenTool className="h-3.5 w-3.5" />
              <span>
                {t('design')} · <span className="tabular-nums">{perLine ? t('designLine', { price: money(design.price, lang) }) : t('designUnit', { price: money(design.price, lang) })}</span>
              </span>
            </label>
          )}
          {p.artwork && (
            <SelectInput aria-label={t('artwork')} value={item.artwork?.status ?? 'later'} disabled={readOnly} onChange={(e) => setArtwork(e.target.value as ArtworkStatus)} wrapClassName="min-w-0" className="h-8 max-w-[320px] text-[12.5px]">
              {ARTWORK_OPTIONS.filter((s) => s !== 'design' || design).map((s) => (
                <option key={s} value={s}>
                  {t('artworkShort')}: {tc(`artwork_${s}`)}
                </option>
              ))}
            </SelectInput>
          )}
          {priced?.allocations.map((a) => <AllocationChip key={a.discountId} id={a.discountId} amount={a.amount} applied={applied} />)}
          {!readOnly && <RemoveBtn onClick={onRemove} label={t('remove')} />}
        </div>
      </div>
    </li>
  );
}

function AllocationChip({ id, amount, applied }: { id: string; amount: number; applied: DraftTotals['applied'] }) {
  const lang = useLang('admin');
  const discounts = useDb((s) => s.discounts);
  const a = applied.find((x) => x.id === id);
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-md bg-canvas px-1.5 text-[12px] text-ink-soft">
      <Tag className="h-3 w-3" />
      {a?.code ?? discountName(id, a?.title ?? '', discounts, lang)} <span className="tabular-nums">−{money(amount, lang)}</span>
    </span>
  );
}

/* ================================================================== */
/* Summary: codes, totals (net → VAT → total), payment                  */
/* ================================================================== */
function SummaryCard({ draft, patch, totals, readOnly, t }: { draft: DraftExt; patch: (p: Partial<DraftExt>) => void; totals: DraftTotals; readOnly: boolean; t: Dict }) {
  const to = useDict(od, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const settings = useDb((s) => s.settings);
  const discounts = useDb((s) => s.discounts);
  const [code, setCode] = useState('');
  const nameOf = (id: string) => discountName(id, discounts.find((d) => d.id === id)?.title ?? id, discounts, lang);

  const addCode = () => {
    const c = normalizeCode(code);
    if (!c) return;
    if (draft.discountCodes.map(normalizeCode).includes(c)) {
      toast.error(t('codeExists'));
      return;
    }
    patch({ discountCodes: [...draft.discountCodes, c] });
    setCode('');
  };

  const lineDiscounts = totals.applied.filter((a) => a.kind !== 'shipping');
  const ship = totals.applied.find((a) => a.kind === 'shipping');
  const autoHints = totals.rejected.filter((r) => r.auto && r.reason === 'minimum' && r.id);
  const methods = (['bank', 'cod', 'card'] as PaymentMethod[]).filter((m) => settings.payments?.[m] || draft.payment === m || m === 'bank');
  const lines = draft.items.filter((it) => totals.lines.some((x) => x.item.key === it.key)).length + draft.customLines.filter((c) => c.title.trim() && c.qty > 0).length;

  return (
    <Card title={t('summary')}>
      {/* discount codes */}
      <div>
        <p className="mb-1 text-[12.5px] font-semibold text-ink-soft">{t('codes')}</p>
        {!readOnly && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addCode();
            }}
          >
            <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('codePh')} leading={<Tag />} wrapClassName="min-w-0 flex-1" className="uppercase placeholder:normal-case" aria-label={t('codes')} />
            <Button type="submit" variant="outline" size="sm" shape="rounded" disabled={!code.trim()}>
              {t('apply')}
            </Button>
          </form>
        )}
        {draft.discountCodes.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {draft.discountCodes.map((c) => {
              const nc = normalizeCode(c);
              const ok = totals.applied.find((a) => a.code === nc);
              const rej = totals.rejected.find((r) => r.code === nc);
              return (
                <li key={c} className={cn('flex items-start gap-2.5 rounded-lg border px-3 py-2 text-[13px]', ok ? 'border-line bg-white' : 'border-[#F4C7BF] bg-[#FDF1EF]')}>
                  <CodeChip className="mt-px">{nc}</CodeChip>
                  <span className="min-w-0 flex-1">
                    {ok ? (
                      <span className="text-ink">
                        <span className="font-semibold">{t('applied')}</span> · {nameOf(ok.id)} · <span className="tabular-nums">−{money(ok.amount, lang)}</span>
                      </span>
                    ) : (
                      <span className="text-[#8A1B0A]">{rej ? rejectText(rej, to, lang, nameOf) : to('rej_notfound')}</span>
                    )}
                  </span>
                  {!readOnly && (
                    <button type="button" aria-label={`× ${nc}`} onClick={() => patch({ discountCodes: draft.discountCodes.filter((x) => x !== c) })} className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted hover:bg-black/5 hover:text-ink">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* totals */}
      <dl className="mt-4 border-t border-line/70 pt-2">
        <SumRow
          label={t('subtotal')}
          sub={[lines ? to(pluralKey('items', lines, lang), { n: lines }) : null, totals.customTotal > 0 ? t('customLines', { amount: money(totals.customTotal, lang) }) : null].filter(Boolean).join(' · ') || undefined}
          value={money(totals.grandSubtotal, lang)}
        />
        {totals.installationTotal > 0 && <SumRow label={tc('installation')} value={money(totals.installationTotal, lang)} />}
        {lineDiscounts.map((d) => (
          <SumRow
            key={d.id}
            label={
              <span className="inline-flex flex-wrap items-center gap-1.5">
                {tc('discount')} · {nameOf(d.id)}
                {d.code && <CodeChip>{d.code}</CodeChip>}
              </span>
            }
            sub={`${to(`kind_${d.kind}`)} · ${d.code ? to('code') : to('auto')}`}
            value={`−${money(d.amount, lang)}`}
          />
        ))}
        <SumRow
          label={t('shippingRow')}
          sub={draft.delivery === 'pickup' ? t('pickupFree') : ship ? nameOf(ship.id) : totals.shippingEstimate ? t('estimate') : undefined}
          value={
            ship && totals.shippingBeforeDiscount > totals.shipping ? (
              <span>
                <span className="mr-1.5 text-muted line-through">{money(totals.shippingBeforeDiscount, lang)}</span>
                {totals.shipping > 0 ? money(totals.shipping, lang) : tc('free')}
              </span>
            ) : totals.shipping > 0 ? (
              money(totals.shipping, lang)
            ) : (
              tc('free')
            )
          }
        />
        {autoHints.map((r) => (
          <p key={r.id} className="py-0.5 text-[12px] text-muted">
            {t('autoHint', { name: nameOf(r.id!), reason: rejectText(r, to, lang, nameOf) })}
          </p>
        ))}
        <div className="my-1.5 border-t border-line/70" />
        <SumRow label={t('totalNet')} value={money(totals.grandNet, lang)} />
        <SumRow label={t('vat', { rate: settings.vatRate })} value={money(totals.grandVat, lang)} />
        <div className="my-1.5 border-t border-line/70" />
        <SumRow strong label={t('total')} value={<span className="text-[17px]">{money(totals.grandTotal, lang)}</span>} />
      </dl>

      <div className="mt-4 grid gap-3 border-t border-line/70 pt-4 sm:grid-cols-[240px_1fr] sm:items-end">
        <SelectInput label={t('method')} value={draft.payment ?? 'bank'} onChange={(e) => patch({ payment: e.target.value as PaymentMethod })} disabled={readOnly} hint={draft.payment === 'bank' || !draft.payment ? undefined : t('methodHint')}>
          {methods.map((m) => (
            <option key={m} value={m}>
              {tc(`pay_${m}`)}
            </option>
          ))}
        </SelectInput>
        <p className="text-[12px] leading-snug text-muted">{t('engineNote', { rate: settings.vatRate })}</p>
      </div>
    </Card>
  );
}

/* ================================================================== */
/* Customer (B2B: company, NUI, PO number, contact person)              */
/* ================================================================== */
function CustomerCard({ draft, patch, patchCustomer, readOnly, problems, t }: { draft: DraftExt; patch: (p: Partial<DraftExt>) => void; patchCustomer: (p: Partial<DraftOrder['customer']>) => void; readOnly: boolean; problems: Problem[]; t: Dict }) {
  const orders = useDb((s) => s.orders);
  const known = useMemo(() => knownCustomers(orders), [orders]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const c = draft.customer;
  const err = (p: Problem) => (problems.includes(p) ? t('required') : undefined);

  const hits = useMemo(() => {
    const f = fold(q.trim());
    if (!f) return [];
    return known
      .filter((k) => f.split(/\s+/).every((term) => fold(`${k.customer.company ?? ''} ${k.customer.pib ?? ''} ${k.customer.firstName} ${k.customer.lastName} ${k.customer.email} ${k.customer.phone} ${k.customer.city}`).includes(term)))
      .slice(0, 6);
  }, [q, known]);

  const pick = (k: KnownCustomer) => {
    const x = k.customer;
    patch({
      customer: { firstName: x.firstName ?? '', lastName: x.lastName ?? '', email: x.email ?? '', phone: x.phone ?? '', city: x.city ?? '', address: x.address ?? '', ...(x.company ? { company: x.company } : {}), ...(x.pib ? { pib: x.pib } : {}) },
      lang: k.lang,
    });
    setQ('');
    setOpen(false);
  };

  return (
    <Card
      title={t('customer')}
      actions={
        !readOnly && (draftCustomerName(draft) || c.company) ? (
          <button type="button" onClick={() => patch({ customer: { firstName: '', lastName: '', email: '', phone: '', city: '', address: '' }, poNumber: undefined })} className="text-[12.5px] font-semibold text-ink-soft hover:text-ink hover:underline">
            {t('clearCustomer')}
          </button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {!readOnly && (
          <div className="relative">
            <TextInput
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder={t('findCustomer')}
              aria-label={t('findCustomer')}
              leading={<Search />}
            />
            {open && q.trim() && (
              <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_12px_40px_-12px_rgb(0_0_0/0.35)]">
                {hits.length === 0 ? (
                  <p className="px-3 py-3 text-[12.5px] text-muted">{t('noMatch')}</p>
                ) : (
                  <ul className="py-1">
                    {hits.map((k) => (
                      <li key={k.key}>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(k)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-ink/[0.05]">
                          <UserRound className="h-4 w-4 shrink-0 text-muted" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-medium text-ink">{k.customer.company || `${k.customer.firstName} ${k.customer.lastName}`}</span>
                            <span className="block truncate text-[12px] text-muted">{[k.customer.company ? `${k.customer.firstName} ${k.customer.lastName}`.trim() : null, k.customer.phone, k.customer.city].filter(Boolean).join(' · ')}</span>
                          </span>
                          <span className="shrink-0 text-[12px] text-muted">{t('ordersN', { n: k.orders })}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <TextInput label={t('company')} value={c.company ?? ''} placeholder={t('companyPh')} onChange={(e) => patchCustomer({ company: e.target.value || undefined })} disabled={readOnly} error={err('name')} wrapClassName="col-span-2" />
          <TextInput label={t('pib')} value={c.pib ?? ''} placeholder={t('pibPh')} onChange={(e) => patchCustomer({ pib: e.target.value || undefined })} disabled={readOnly} />
          <TextInput label={t('po')} value={poNumberOf(draft)} placeholder={t('poPh')} onChange={(e) => patch({ poNumber: e.target.value || undefined })} disabled={readOnly} />
          <p className="col-span-2 -mt-1 text-[12px] text-muted">{t('poHint')}</p>
          <p className="col-span-2 mt-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">{t('contact')}</p>
          <TextInput label={t('firstName')} value={c.firstName ?? ''} onChange={(e) => patchCustomer({ firstName: e.target.value })} disabled={readOnly} />
          <TextInput label={t('lastName')} value={c.lastName ?? ''} onChange={(e) => patchCustomer({ lastName: e.target.value })} disabled={readOnly} />
          <TextInput label={t('phone')} type="tel" value={c.phone ?? ''} placeholder="+383 4x xxx xxx" onChange={(e) => patchCustomer({ phone: e.target.value })} disabled={readOnly} error={err('contact')} wrapClassName="col-span-2" />
          <TextInput label={t('email')} type="email" value={c.email ?? ''} onChange={(e) => patchCustomer({ email: e.target.value })} disabled={readOnly} error={err('email')} wrapClassName="col-span-2" />
          <SelectInput label={t('customerLang')} value={draft.lang ?? 'sq'} onChange={(e) => patch({ lang: e.target.value as Lang })} disabled={readOnly} wrapClassName="col-span-2">
            {LANGS.map((x) => (
              <option key={x.code} value={x.code}>
                {x.label}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>
    </Card>
  );
}

/* ================================================================== */
/* Delivery + production time                                          */
/* ================================================================== */
function DeliveryCard({ draft, patch, patchCustomer, readOnly, problems, t }: { draft: DraftExt; patch: (p: Partial<DraftExt>) => void; patchCustomer: (p: Partial<DraftOrder['customer']>) => void; readOnly: boolean; problems: Problem[]; t: Dict }) {
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const settings = useDb((s) => s.settings);
  const products = useDb((s) => s.products);
  const cities = useMemo(() => allCities(settings), [settings]);
  const zone = zoneForCity(settings, draft.customer.city);
  const err = (p: Problem) => (problems.includes(p) ? t('required') : undefined);
  const city = draft.customer.city ?? '';
  const leadDays = draft.items.reduce((m, it) => Math.max(m, products.find((p) => p.id === it.productId)?.leadDays ?? 0), 0);

  return (
    <Card title={t('delivery')}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-canvas p-1">
          {(['delivery', 'pickup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={readOnly}
              aria-pressed={draft.delivery === m}
              onClick={() => patch({ delivery: m })}
              className={cn('inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-[12.5px] font-semibold transition-colors', draft.delivery === m ? 'bg-white text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink')}
            >
              {m === 'delivery' ? <Truck className="h-3.5 w-3.5 shrink-0" /> : <Store className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{tc(`delivery_${m}`)}</span>
            </button>
          ))}
        </div>
        {draft.delivery === 'pickup' ? (
          <p className="text-[13px] text-ink-soft">{t('pickupAt', { addr: settings.pickupAddress || settings.address })}</p>
        ) : (
          <>
            <SelectInput label={t('city')} value={cities.includes(city) || city ? city : ''} onChange={(e) => patchCustomer({ city: e.target.value })} disabled={readOnly} hint={zone ? t('zone', { zone: zone.name, fee: money(zone.fee, lang), days: zone.days }) : undefined}>
              <option value="">{t('chooseCity')}</option>
              {city && !cities.includes(city) && <option value={city}>{city}</option>}
              {cities.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </SelectInput>
            {err('city') && <p className="-mt-2 text-[12px] font-medium text-[#B42318]">{err('city')}</p>}
            <TextInput label={t('address')} value={draft.customer.address ?? ''} onChange={(e) => patchCustomer({ address: e.target.value })} disabled={readOnly} error={err('address')} />
          </>
        )}
        {leadDays > 0 && (
          <p className="flex items-start gap-2 rounded-lg bg-canvas px-3 py-2 text-[12.5px] leading-snug text-ink-soft">
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
            {t('lead', { n: leadDays })}
          </p>
        )}
      </div>
    </Card>
  );
}

/* ================================================================== */
/* Tags                                                                */
/* ================================================================== */
function TagsInput({ value, onChange, placeholder, disabled }: { value: string[]; onChange: (v: string[]) => void; placeholder: string; disabled?: boolean }) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim().toLowerCase();
    if (v && !value.includes(v)) onChange([...value, v]);
    setText('');
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {value.map((tg) => (
        <span key={tg} className="inline-flex h-6 items-center gap-1 rounded-md bg-[#EBEBEB] pl-2 pr-1 text-[12px] font-medium text-ink">
          {tg}
          {!disabled && (
            <button type="button" aria-label={`× ${tg}`} onClick={() => onChange(value.filter((x) => x !== tg))} className="grid h-4 w-4 place-items-center rounded hover:bg-black/10">
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          value={text}
          aria-label={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          className="h-6 min-w-[150px] flex-1 rounded-md border border-dashed border-line bg-transparent px-2 text-[12px] outline-none focus:border-ink/40"
        />
      )}
    </div>
  );
}
