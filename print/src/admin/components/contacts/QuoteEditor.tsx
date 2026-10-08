import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowUpRight, CheckCircle2, FileText, Lock, PackagePlus, Plus, Printer, RotateCcw, Send, ShoppingBag, Trash2, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { Card, PageHeader, SaveBar, Thumb, confirmDialog } from '@/admin/components/kit';
import { L10nInput } from '@/admin/components/L10nInput';
import { adm } from '@/admin/i18n';
import { defineDict, lt, useDict, useL, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { useCan, useCurrentStaff, useSettings } from '@/store/hooks';
import { minQty, tierPrice } from '@/lib/pricing';
import { date, dateTime, money, unitLabel } from '@/lib/format';
import type { L10n, Lang, Product, Quote } from '@/lib/types';
import { cn, round2, uid } from '@/lib/utils';
import { cx } from './i18n';
import { CInput, CSelect, Chip } from './fields';
import { QuoteStatusPill, StaffAvatar, useNoPermText } from './atoms';
import { ProductPicker } from './ProductPicker';
import { RfqInline } from './RfqSpecs';
import { QuotePrintModal } from './QuotePrint';
import { rfqTitle } from './rfq';
import { paymentText, deliveryText, qd, termRows } from './quoteDoc';
import {
  DELIVERY_TERMS, PAYMENT_TERMS, daysLeft, draftFromQuote, isoDayFromNow, lineAmount, nextQuoteNumber, quoteOwners, quoteState, quoteTotals, round4, unitMoney, withTerms,
  type DeliveryTerm, type InquiryX, type PaymentTerm, type QuoteX,
} from './model';

const T = defineDict({
  sq: {
    newTitle: 'Ofertë e re',
    lines: 'Linjat e ofertës',
    linesNet: 'Çmimet pa TVSH',
    col_item: 'Produkti / përshkrimi',
    col_qty: 'Sasia',
    col_price: 'Çmimi / njësi',
    col_total: 'Shuma',
    custom: 'Linjë e lirë',
    fromCatalog: 'Nga katalogu',
    addCustom: 'Linjë e lirë',
    quickAdd: 'Shto shpejt',
    linesEmpty: 'Shtoni produkte nga katalogu ose një linjë të lirë (dizajn & prepress, matricë prerjeje, transport…).',
    itemPh: 'P.sh. Kuti kozmetike 40×40×150 mm, GC2 350 g, CMYK + folje — 5.000 copë',
    priceHint: 'Deri në 4 shifra dhjetore për çmimin për copë (p.sh. 0,0450 €).',
    subtotal: 'Nëntotali (pa TVSH)',
    vat: 'TVSH {rate}%',
    total: 'Totali me TVSH',
    subtotalGross: 'Totali pa TVSH',
    vatGross: 'TVSH {rate}% (e përfshirë)',
    totalGross: 'Totali',
    terms: 'Kushtet tregtare',
    termsHint: 'Shfaqen në ofertë nën tabelën e çmimeve — klienti i pranon me nënshkrim.',
    payment: 'Pagesa',
    delivery: 'Dorëzimi',
    leadDays: 'Afati i prodhimit',
    leadUnit: 'ditë pune',
    leadHint: 'Pas aprovimit të provës digjitale.',
    tolerance: 'Toleranca e sasisë',
    toleranceHint: 'Zakon në printim: ±5% — faturohet sasia e dorëzuar.',
    notes: 'Shënime shtesë',
    customer: 'Klienti',
    name: 'Personi i kontaktit',
    company: 'Kompania',
    nui: 'NUI (numri i biznesit)',
    email: 'E-mail',
    phone: 'Telefoni',
    fromInquiry: 'Nga kërkesa: {name}',
    validity: 'Vlefshmëria & versioni',
    validUntil: 'E vlefshme deri',
    plus14: '+14 ditë',
    plus30: '+30 ditë',
    daysLeft: 'Skadon për {n} ditë',
    lastDay: 'Skadon sot',
    expired: 'Vlefshmëria ka skaduar',
    version: 'Versioni',
    versionHint: 'Çdo ndryshim i ruajtur krijon një version të ri.',
    owner: 'Përgjegjësi',
    history: 'Historiku',
    historyEmpty: 'Historiku plotësohet pasi ta ruani ofertën.',
    h_create: 'U krijua',
    h_update: 'U ndryshua',
    h_send: 'U dërgua te klienti',
    h_status: 'Statusi',
    h_convert: 'U konvertua në porosi',
    h_delete: 'U fshi',
    preview: 'Parapamje / PDF',
    send: 'Dërgo',
    resend: 'Dërgo sërish',
    accept: 'Pranuar',
    decline: 'Refuzuar',
    convert: 'Konverto në porosi',
    reopen: 'Rihap për ndryshime',
    openDraft: 'Hap draftin {number}',
    saveFirst: 'Ruani ndryshimet fillimisht',
    sendTitle: 'Të dërgohet oferta {number}?',
    sendText: 'Versioni {v} i dërgohet {email} si PDF me letterhead-in e PrintWorks dhe lidhje për pranim.',
    sentToast: 'Oferta {number} v{v} u dërgua te {email}',
    noEmail: 'Shtoni e-mailin e klientit para dërgimit',
    acceptedToast: 'Oferta u pranua — tani mund ta konvertoni në porosi',
    declinedToast: 'Oferta u shënua si e refuzuar',
    convertTitle: 'Të konvertohet në porosi?',
    convertText: 'Krijohet draft-porosia {draft} me linjat dhe çmimet e rëna dakord të ofertës ({total} me TVSH). Oferta kyçet.',
    convertedToast: 'U krijua draft-porosia {number}',
    draftNote: 'Nga oferta {number} (v{v}), e pranuar më {date}. Pagesa: {payment}. Afati: {lead}.',
    reopenedToast: 'Oferta u rihap si versioni {v}',
    savedNew: 'Oferta {number} u krijua',
    saved: 'U ruajt si versioni {v}',
    savedResend: 'U ruajt si versioni {v} — dërgojeni sërish te klienti',
    savedSame: 'Ndryshimet u ruajtën',
    errName: 'Shkruani personin e kontaktit ose kompaninë',
    errLines: 'Shtoni të paktën një linjë me sasi',
    errEmail: 'E-maili nuk është i saktë',
    locked: 'Oferta e pranuar ose e konvertuar është e kyçur. Për ndryshime rihapeni si version të ri.',
    readOnly: 'Vetëm shikim — nuk keni leje për të ndryshuar ofertat.',
    delete: 'Fshij ofertën',
    deleteTitle: 'Të fshihet oferta {number}?',
    deleteText: 'Drafti i ofertës do të hiqet përgjithmonë.',
    deleted: 'Oferta u fshi',
    notFound: 'Oferta nuk u gjet',
    notFoundText: 'Mund të jetë fshirë. Kthehuni te lista e ofertave B2B.',
    back: 'Kthehu te ofertat',
    remove: 'Hiq linjën',
    fromRfq: 'Plotësuar nga kërkesa — kontrolloni çmimin për copë.',
    noPrice: 'Pa çmim',
  },
  en: {
    newTitle: 'New quote',
    lines: 'Quote lines',
    linesNet: 'Prices excl. VAT',
    col_item: 'Product / description',
    col_qty: 'Qty',
    col_price: 'Unit price',
    col_total: 'Amount',
    custom: 'Custom line',
    fromCatalog: 'From catalogue',
    addCustom: 'Custom line',
    quickAdd: 'Quick add',
    linesEmpty: 'Add products from the catalogue or a custom line (design & prepress, cutting die, delivery…).',
    itemPh: 'E.g. Cosmetic box 40×40×150 mm, GC2 350 gsm, CMYK + foil — 5,000 pcs',
    priceHint: 'Up to 4 decimals for per-piece prices (e.g. €0.0450).',
    subtotal: 'Subtotal (excl. VAT)',
    vat: 'VAT {rate}%',
    total: 'Total incl. VAT',
    subtotalGross: 'Total excl. VAT',
    vatGross: 'VAT {rate}% (included)',
    totalGross: 'Total',
    terms: 'Commercial terms',
    termsHint: 'Printed on the quote below the price table — the customer accepts them by signing.',
    payment: 'Payment',
    delivery: 'Delivery',
    leadDays: 'Lead time',
    leadUnit: 'working days',
    leadHint: 'After the digital proof is approved.',
    tolerance: 'Quantity tolerance',
    toleranceHint: 'Customary in print: ±5% — the delivered quantity is invoiced.',
    notes: 'Additional notes',
    customer: 'Customer',
    name: 'Contact person',
    company: 'Company',
    nui: 'Business no. (NUI)',
    email: 'E-mail',
    phone: 'Phone',
    fromInquiry: 'From request: {name}',
    validity: 'Validity & version',
    validUntil: 'Valid until',
    plus14: '+14 days',
    plus30: '+30 days',
    daysLeft: 'Expires in {n} d',
    lastDay: 'Expires today',
    expired: 'Validity has expired',
    version: 'Version',
    versionHint: 'Every saved change creates a new version.',
    owner: 'Owner',
    history: 'History',
    historyEmpty: 'History fills in once you save the quote.',
    h_create: 'Created',
    h_update: 'Edited',
    h_send: 'Sent to the customer',
    h_status: 'Status',
    h_convert: 'Converted to an order',
    h_delete: 'Deleted',
    preview: 'Preview / PDF',
    send: 'Send',
    resend: 'Send again',
    accept: 'Accepted',
    decline: 'Declined',
    convert: 'Convert to order',
    reopen: 'Reopen for changes',
    openDraft: 'Open draft {number}',
    saveFirst: 'Save your changes first',
    sendTitle: 'Send quote {number}?',
    sendText: 'Version {v} goes to {email} as a PDF on the PrintWorks letterhead, with an acceptance link.',
    sentToast: 'Quote {number} v{v} sent to {email}',
    noEmail: "Add the customer's e-mail before sending",
    acceptedToast: 'Quote accepted — you can now convert it to an order',
    declinedToast: 'Quote marked as declined',
    convertTitle: 'Convert to an order?',
    convertText: 'Creates draft order {draft} with the lines and agreed prices of the quote ({total} incl. VAT). The quote gets locked.',
    convertedToast: 'Draft order {number} created',
    draftNote: 'From quote {number} (v{v}), accepted on {date}. Payment: {payment}. Lead time: {lead}.',
    reopenedToast: 'Quote reopened as version {v}',
    savedNew: 'Quote {number} created',
    saved: 'Saved as version {v}',
    savedResend: 'Saved as version {v} — send it to the customer again',
    savedSame: 'Changes saved',
    errName: 'Enter the contact person or the company',
    errLines: 'Add at least one line with a quantity',
    errEmail: 'E-mail is not valid',
    locked: 'An accepted or converted quote is locked. Reopen it as a new version to change it.',
    readOnly: 'View only — you do not have permission to edit quotes.',
    delete: 'Delete quote',
    deleteTitle: 'Delete quote {number}?',
    deleteText: 'The draft quote will be removed permanently.',
    deleted: 'Quote deleted',
    notFound: 'Quote not found',
    notFoundText: 'It may have been deleted. Go back to the B2B quotes list.',
    back: 'Back to quotes',
    remove: 'Remove line',
    fromRfq: 'Prefilled from the request — check the price per piece.',
    noPrice: 'No price',
  },
});

const DEFAULT_NOTES: L10n = {
  sq: 'Ngjyrat Pantone dhe finishimet speciale konfirmohen në provën digjitale. Mostra fizike para tirazhit ofrohet sipas kërkesës.',
  en: 'Pantone colours and special finishes are confirmed on the digital proof. A physical pre-production sample is available on request.',
};

/** One-click lines that come up in almost every packaging quote (net prices, editable). */
const QUICK_LINES: { id: string; chip: L10n; title: L10n; price: number }[] = [
  { id: 'design', chip: { sq: 'Dizajn & prepress', en: 'Design & prepress' }, title: { sq: 'Dizajn & prepress — përgatitja e skedarit dhe prova digjitale', en: 'Design & prepress — artwork preparation and digital proof' }, price: 35 },
  { id: 'die', chip: { sq: 'Matricë prerjeje', en: 'Cutting die' }, title: { sq: 'Matricë prerjeje — kosto e njëhershme', en: 'Cutting die — one-off cost' }, price: 120 },
  { id: 'block', chip: { sq: 'Klishe për folje', en: 'Foil block' }, title: { sq: 'Klishe për stampim me folje — kosto e njëhershme', en: 'Foil-stamping block — one-off cost' }, price: 65 },
  { id: 'sample', chip: { sq: 'Mostër fizike', en: 'Physical sample' }, title: { sq: 'Mostër fizike para tirazhit', en: 'Physical pre-production sample' }, price: 45 },
  { id: 'delivery', chip: { sq: 'Transport', en: 'Delivery' }, title: { sq: 'Transport — dërgesë në adresën e klientit', en: 'Delivery to the customer’s address' }, price: 25 },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Line = Quote['lines'][number];
/** Everything the customer sees — a change here bumps the version (the owner is internal). */
const content = (q: QuoteX) => {
  const x = withTerms(q);
  return JSON.stringify([x.customer, x.nui ?? '', x.lines, x.validUntil, x.terms ?? null, x.payment, x.leadDays, x.tolerance, x.delivery]);
};

/** First line of a quote built from a request: the RFQ title, the catalogue product's tier price for that quantity. */
function linesFromInquiry(inquiry: InquiryX | undefined, product: Product | undefined, lang: Lang): Line[] {
  if (inquiry?.specs) {
    const qty = inquiry.specs.quantity ?? (product ? minQty(product) : 1);
    const out: Line[] = [{ ...(product ? { productId: product.id } : {}), title: rfqTitle(inquiry.specs, lang, product), qty, price: product && !product.quoteOnly ? round4(tierPrice(product, qty)) : 0 }];
    if (!inquiry.specs.files?.length && product?.installation?.available) {
      out.push({ title: lt(QUICK_LINES[0].title, lang), qty: 1, price: product.installation.price });
    }
    return out;
  }
  if (product) {
    const qty = minQty(product);
    return [{ productId: product.id, title: lt(product.name, lang), qty, price: product.quoteOnly ? 0 : round4(tierPrice(product, qty)) }];
  }
  return [];
}

/** B2B quote editor (p.43): customer/company, catalogue or custom lines, net prices + VAT, terms, versions, send/accept/decline/convert, printable PDF. */
export function QuoteEditor({ id, inquiryId }: { id: string; inquiryId?: string | null }) {
  const t = useDict(T, 'admin');
  const tx = useDict(cx, 'admin');
  const ta = useDict(adm, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const navigate = useNavigate();
  const can = useCan();
  const noPerm = useNoPermText();
  const me = useCurrentStaff();
  const settings = useSettings();
  const quotes = useDb((s) => s.quotes) as QuoteX[];
  const products = useDb((s) => s.products);
  const staff = useDb((s) => s.staff);
  const inquiries = useDb((s) => s.inquiries) as InquiryX[];
  const drafts = useDb((s) => s.drafts);
  const audit = useDb((s) => s.audit);

  const isNew = id === 'new';
  const saved = isNew ? undefined : quotes.find((x) => x.id === id);
  const inquiry = inquiries.find((x) => x.id === (saved?.inquiryId ?? inquiryId ?? ''));
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const owners = useMemo(() => quoteOwners(staff), [staff]);
  const inquiryProduct = inquiry?.productId ? productById.get(inquiry.productId) : undefined;

  const buildBlank = (): QuoteX =>
    withTerms({
      id: '',
      number: nextQuoteNumber(quotes),
      ...(inquiry ? { inquiryId: inquiry.id } : {}),
      customer: { name: inquiry?.name ?? '', company: inquiry?.company ?? '', email: inquiry?.email ?? '', phone: inquiry?.phone ?? '' },
      lines: linesFromInquiry(inquiry, inquiryProduct, lang),
      validUntil: isoDayFromNow(30),
      terms: DEFAULT_NOTES,
      version: 1,
      status: 'draft',
      createdAt: '',
      leadDays: inquiryProduct?.leadDays ?? 10,
      owner: (me && owners.some((m) => m.id === me.id) ? me.id : undefined) ?? (inquiry?.assignee && owners.some((m) => m.id === inquiry.assignee) ? inquiry.assignee : owners[0]?.id),
    });

  // built once per editor mount (the page keys the editor by id)
  const [draft, setDraft] = useState<QuoteX>(() => (saved ? structuredClone(withTerms(saved)) : buildBlank()));
  const [picker, setPicker] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isNew && !saved) {
    return (
      <div className="animate-fade-in">
        <PageHeader back="/admin/kontaktet/oferta-b2b" breadcrumbs={[{ label: ta('nav_contacts'), to: '/admin/kontaktet' }, { label: ta('nav_quotes'), to: '/admin/kontaktet/oferta-b2b' }]} title={t('notFound')} />
        <Card>
          <EmptyState icon={<FileText className="h-6 w-6" />} title={t('notFound')} text={t('notFoundText')} action={<Link to="/admin/kontaktet/oferta-b2b" className="text-[13px] font-semibold text-ink underline underline-offset-2">{t('back')}</Link>} />
        </Card>
      </div>
    );
  }

  const now = Date.now();
  const state = saved ? quoteState(saved, now) : 'draft';
  const canEdit = can('quotes', 'edit');
  const canSend = can('quotes', 'publish');
  const canConvert = can('quotes', 'publish') && can('drafts', 'edit');
  const lockedByState = !!saved && (saved.status === 'accepted' || saved.status === 'converted');
  const locked = !canEdit || lockedByState;
  const contentDirty = isNew || (!!saved && content(draft) !== content(saved));
  const dirty = isNew || contentDirty || (!!saved && draft.owner !== saved.owner);
  const totals = quoteTotals(draft.lines, settings);
  const left = daysLeft(draft.validUntil, now);
  const linkedDraft = saved?.orderId ? drafts.find((d) => d.id === saved.orderId) : undefined;
  const terms = withTerms(draft);

  const db = () => useDb.getState();
  const patch = (p: Partial<QuoteX>) => setDraft((d) => ({ ...d, ...p }));
  const setCustomer = (k: keyof Quote['customer'], v: string) => setDraft((d) => ({ ...d, customer: { ...d.customer, [k]: v } }));
  const setLine = (i: number, p: Partial<Line>) => setDraft((d) => ({ ...d, lines: d.lines.map((x, k) => (k === i ? { ...x, ...p } : x)) }));
  const removeLine = (i: number) => setDraft((d) => ({ ...d, lines: d.lines.filter((_, k) => k !== i) }));
  const addLine = (line: Line) => {
    setDraft((d) => ({ ...d, lines: [...d.lines, line] }));
    setErrors((e) => ({ ...e, lines: '' }));
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!draft.customer.name.trim() && !draft.customer.company.trim()) err.name = t('errName');
    if (draft.customer.email.trim() && !EMAIL_RE.test(draft.customer.email.trim())) err.email = t('errEmail');
    if (!draft.lines.some((x) => x.title.trim() && x.qty > 0)) err.lines = t('errLines');
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const clean = (q: QuoteX): QuoteX => ({
    ...withTerms(q),
    customer: { name: q.customer.name.trim(), company: q.customer.company.trim(), email: q.customer.email.trim(), phone: q.customer.phone.trim() },
    ...(q.nui?.trim() ? { nui: q.nui.trim() } : { nui: undefined }),
    lines: q.lines.filter((x) => x.title.trim() && x.qty > 0).map((x) => ({ ...x, title: x.title.trim(), qty: round2(x.qty), price: round4(x.price) })),
  });

  const save = () => {
    if (!validate()) return;
    if (isNew) {
      const q: QuoteX = { ...clean(draft), id: uid('q'), number: nextQuoteNumber(db().quotes), createdAt: new Date().toISOString(), version: 1, status: 'draft' };
      db().upsert('quotes', q);
      if (inquiry && inquiry.status === 'new') {
        db().updateInquiry(inquiry.id, { status: 'contacted', seen: true });
        db().logAudit({ action: 'status', object: 'inquiry', objectId: inquiry.id, detail: 'new → contacted' });
      }
      toast.success(t('savedNew', { number: q.number }));
      navigate(`/admin/kontaktet/oferta-b2b?id=${q.id}`, { replace: true });
      return;
    }
    if (!saved) return;
    const bump = contentDirty;
    const resend = bump && saved.status !== 'draft';
    const next: QuoteX = { ...clean(draft), version: bump ? saved.version + 1 : saved.version, status: resend ? 'draft' : saved.status };
    db().upsert('quotes', next);
    setDraft(structuredClone(next));
    toast.success(bump ? t(resend ? 'savedResend' : 'saved', { v: next.version }) : t('savedSame'));
  };
  const discard = () => {
    if (isNew) navigate(inquiry ? `/admin/kontaktet?id=${inquiry.id}` : '/admin/kontaktet/oferta-b2b');
    else if (saved) {
      setDraft(structuredClone(withTerms(saved)));
      setErrors({});
    }
  };

  /* ---------------- status actions ---------------- */
  const setStatus = (status: Quote['status'], extra: Partial<QuoteX> = {}) => {
    if (!saved) return null;
    const next: QuoteX = { ...withTerms(saved), ...extra, status };
    db().upsert('quotes', next);
    setDraft(structuredClone(next));
    return next;
  };
  const send = async () => {
    if (!saved) return;
    const email = saved.customer.email.trim();
    if (!email || !EMAIL_RE.test(email)) {
      toast.error(t('noEmail'));
      return;
    }
    const ok = await confirmDialog({ title: t('sendTitle', { number: saved.number }), text: t('sendText', { v: saved.version, email }), confirmLabel: t('send'), danger: false });
    if (!ok) return;
    setStatus('sent');
    db().logAudit({ action: 'send', object: 'quote', objectId: saved.id, detail: `${saved.number} v${saved.version}` });
    toast.success(t('sentToast', { number: saved.number, v: saved.version, email }));
  };
  const accept = () => {
    if (!saved) return;
    setStatus('accepted');
    db().logAudit({ action: 'status', object: 'quote', objectId: saved.id, detail: `${saved.number}: ${saved.status} → accepted` });
    toast.success(t('acceptedToast'));
  };
  const decline = () => {
    if (!saved) return;
    setStatus('declined');
    db().logAudit({ action: 'status', object: 'quote', objectId: saved.id, detail: `${saved.number}: ${saved.status} → declined` });
    toast.success(t('declinedToast'));
  };
  const reopen = () => {
    if (!saved) return;
    const next = setStatus('draft', { version: saved.version + 1 });
    db().logAudit({ action: 'status', object: 'quote', objectId: saved.id, detail: `${saved.number}: ${saved.status} → draft` });
    if (next) toast.success(t('reopenedToast', { v: next.version }));
  };
  const convert = async () => {
    if (!saved) return;
    const st = withTerms(saved);
    const totalLabel = money(quoteTotals(saved.lines, settings).total, lang);
    const pv = draftFromQuote(saved, { drafts: db().drafts, by: me?.id ?? 'admin', lang, note: '', skuOf: () => undefined });
    const ok = await confirmDialog({ title: t('convertTitle'), text: t('convertText', { draft: pv.number, total: totalLabel }), confirmLabel: t('convert'), danger: false });
    if (!ok) return;
    const d = draftFromQuote(saved, {
      drafts: db().drafts,
      by: me?.id ?? 'admin',
      lang,
      city: inquiry?.city,
      note: t('draftNote', { number: saved.number, v: saved.version, date: date(new Date(), lang), payment: paymentText(st.payment, lang), lead: qd(lang, 'lead', { n: st.leadDays }) }),
      skuOf: (pid) => productById.get(pid)?.sku,
    });
    db().upsert('drafts', st.nui ? { ...d, customer: { ...d.customer, pib: st.nui } } : d);
    setStatus('converted', { orderId: d.id });
    db().logAudit({ action: 'convert', object: 'quote', objectId: saved.id, detail: `${saved.number} → ${d.number}` });
    toast.success(t('convertedToast', { number: d.number }));
    navigate(`/admin/draftet/${d.id}`);
  };
  const remove = async () => {
    if (!saved) return;
    const ok = await confirmDialog({ title: t('deleteTitle', { number: saved.number }), text: t('deleteText'), confirmLabel: ta('delete'), danger: true });
    if (!ok) return;
    db().remove('quotes', saved.id);
    toast.success(t('deleted'));
    navigate('/admin/kontaktet/oferta-b2b', { replace: true });
  };

  /* ---------------- header actions by state ---------------- */
  const gate = (allowed: boolean, extraBlock?: string) => ({ disabled: !allowed || dirty || !!extraBlock, title: !allowed ? noPerm : dirty ? t('saveFirst') : extraBlock });
  const actions: ReactNode = (
    <>
      <ActionBtn icon={<Printer className="h-4 w-4" />} onClick={() => setPreview(true)}>
        {t('preview')}
      </ActionBtn>
      {(state === 'sent' || state === 'expired') && (
        <>
          <ActionBtn {...gate(canEdit)} icon={<XCircle className="h-4 w-4" />} onClick={decline}>
            {t('decline')}
          </ActionBtn>
          <ActionBtn {...gate(canSend)} icon={<Send className="h-4 w-4" />} onClick={send}>
            {t('resend')}
          </ActionBtn>
          <ActionBtn primary {...gate(canEdit)} icon={<CheckCircle2 className="h-4 w-4" />} onClick={accept}>
            {t('accept')}
          </ActionBtn>
        </>
      )}
      {!isNew && state === 'draft' && (
        <ActionBtn primary {...gate(canSend)} icon={<Send className="h-4 w-4" />} onClick={send}>
          {t('send')}
        </ActionBtn>
      )}
      {state === 'declined' && (
        <ActionBtn {...gate(canEdit)} icon={<RotateCcw className="h-4 w-4" />} onClick={reopen}>
          {t('reopen')}
        </ActionBtn>
      )}
      {state === 'accepted' && (
        <>
          <ActionBtn {...gate(canEdit)} icon={<RotateCcw className="h-4 w-4" />} onClick={reopen}>
            {t('reopen')}
          </ActionBtn>
          <ActionBtn primary {...gate(canConvert)} icon={<ShoppingBag className="h-4 w-4" />} onClick={convert}>
            {t('convert')}
          </ActionBtn>
        </>
      )}
      {state === 'converted' && linkedDraft && (
        <Link to={`/admin/draftet/${linkedDraft.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-[13px] font-semibold text-white hover:bg-brand-700">
          <ShoppingBag className="h-4 w-4" /> {t('openDraft', { number: linkedDraft.number })}
        </Link>
      )}
    </>
  );

  const history = saved ? audit.filter((a) => a.object === 'quote' && a.objectId === saved.id) : [];
  // an upsert logs "update" next to the explicit send/status/convert entry — keep only the meaningful one
  const shown = history.filter((a) => a.action !== 'update' || !history.some((b) => b !== a && b.action !== 'update' && Math.abs(new Date(b.at).getTime() - new Date(a.at).getTime()) < 3000));
  const staffName = (sid: string) => staff.find((m) => m.id === sid)?.name ?? (sid === 'web' ? 'Web' : sid);
  const hLabel = (action: string) =>
    action === 'create' ? t('h_create') : action === 'send' ? t('h_send') : action === 'convert' ? t('h_convert') : action === 'status' ? t('h_status') : action === 'delete' ? t('h_delete') : t('h_update');
  const statusDetail = (detail?: string) => {
    const m = /→\s*(\w+)$/.exec(detail ?? '');
    const s = m?.[1];
    return s && ['draft', 'sent', 'accepted', 'declined', 'converted'].includes(s) ? tx(`q_${s as 'draft'}`) : undefined;
  };
  const owner = staff.find((m) => m.id === draft.owner);
  const fromRfq = isNew && !!inquiry?.specs;

  return (
    <div className="animate-fade-in pb-24">
      <PageHeader
        back="/admin/kontaktet/oferta-b2b"
        breadcrumbs={[{ label: ta('nav_contacts'), to: '/admin/kontaktet' }, { label: ta('nav_quotes'), to: '/admin/kontaktet/oferta-b2b' }, isNew ? t('newTitle') : saved!.number]}
        title={isNew ? t('newTitle') : saved!.number}
        badge={
          !isNew && (
            <span className="flex items-center gap-2">
              <QuoteStatusPill state={state} />
              <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-ink-soft">v{saved!.version}</span>
            </span>
          )
        }
        description={draft.customer.company || draft.customer.name ? [draft.customer.company, draft.customer.name].filter(Boolean).join(' · ') : undefined}
        actions={actions}
      />

      {(lockedByState || !canEdit) && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-[13px] text-ink-soft">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          {!canEdit ? t('readOnly') : t('locked')}
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-5">
        <div className="min-w-0 space-y-4">
          {/* Lines */}
          <Card
            padded={false}
            title={t('lines')}
            description={totals.netPricing ? t('linesNet') : undefined}
            actions={
              !locked && (
                <>
                  <Button variant="outline" shape="rounded" size="xs" icon={<PackagePlus className="h-3.5 w-3.5" />} onClick={() => setPicker(true)}>
                    {t('fromCatalog')}
                  </Button>
                  <Button variant="outline" shape="rounded" size="xs" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => addLine({ title: '', qty: 1, price: 0 })}>
                    <span className="max-sm:hidden">{t('addCustom')}</span>
                  </Button>
                </>
              )
            }
          >
            {fromRfq && inquiry?.specs && (
              <div className="flex flex-col gap-1.5 border-b border-line/70 bg-canvas/50 px-4 py-2.5 sm:px-5">
                <RfqInline specs={inquiry.specs} product={inquiryProduct} now={now} className="flex-wrap gap-y-1" />
                <span className="text-[12px] text-muted">{t('fromRfq')}</span>
              </div>
            )}
            {draft.lines.length === 0 ? (
              <p className={cn('px-5 py-8 text-center text-[13px]', errors.lines ? 'font-semibold text-red-700' : 'text-muted')}>{errors.lines || t('linesEmpty')}</p>
            ) : (
              <>
                <div className="hidden grid-cols-[minmax(0,1fr)_96px_128px_110px_32px] gap-3 border-b border-line bg-canvas/60 px-5 py-2 text-[12.5px] font-semibold text-muted md:grid">
                  <span>{t('col_item')}</span>
                  <span className="text-right">{t('col_qty')}</span>
                  <span className="text-right">{t('col_price')}</span>
                  <span className="text-right">{t('col_total')}</span>
                  <span />
                </div>
                <ul className="divide-y divide-line/70">
                  {draft.lines.map((line, i) => {
                    const p = line.productId ? productById.get(line.productId) : undefined;
                    return (
                      <li key={i} className="grid grid-cols-[minmax(0,1fr)_32px] items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5 md:grid-cols-[minmax(0,1fr)_96px_128px_110px_32px]">
                        <div className="flex min-w-0 items-center gap-3">
                          {p ? <Thumb src={p.images[0]} className="h-10 w-10 rounded-md" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-dashed border-ink/20 text-muted"><FileText className="h-4 w-4" /></span>}
                          <div className="min-w-0 flex-1">
                            {locked ? (
                              <div className="text-[13.5px] font-semibold leading-snug text-ink">{line.title}</div>
                            ) : (
                              <textarea
                                value={line.title}
                                rows={1}
                                onChange={(e) => setLine(i, { title: e.target.value.replace(/\n/g, ' ') })}
                                placeholder={t('itemPh')}
                                aria-label={t('col_item')}
                                className="block min-h-8 w-full resize-none rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[13.5px] font-semibold leading-snug text-ink outline-none transition-colors [field-sizing:content] placeholder:font-normal placeholder:text-muted/70 hover:border-line focus:border-ink/40 focus:bg-white"
                              />
                            )}
                            <div className="truncate px-1.5 text-[12px] text-muted">
                              {p ? <span className="font-mono">{p.sku}</span> : t('custom')}
                              {p && ` · ${unitLabel(p.unit, lang)}`}
                              {line.price === 0 && <span className="ml-1 font-semibold text-amber-800">· {t('noPrice')}</span>}
                            </div>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeLine(i)} disabled={locked} className="order-2 grid h-8 w-8 place-items-center justify-self-end rounded-md text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink disabled:invisible md:order-none md:col-start-5 md:row-start-1" aria-label={t('remove')} title={t('remove')}>
                          <X className="h-4 w-4" />
                        </button>
                        <div className="order-3 col-span-2 grid grid-cols-3 gap-2 md:order-none md:col-span-3 md:col-start-2 md:row-start-1 md:grid-cols-[96px_128px_110px] md:gap-3">
                          <NumField label={t('col_qty')} value={line.qty} onChange={(v) => setLine(i, { qty: v })} locked={locked} step="1" display={new Intl.NumberFormat(lang === 'sq' ? 'de-DE' : 'en-IE').format(line.qty)} />
                          <NumField label={t('col_price')} value={line.price} onChange={(v) => setLine(i, { price: v })} locked={locked} step="0.0001" suffix="€" display={unitMoney(line.price, lang)} title={t('priceHint')} />
                          <div className="flex flex-col items-end justify-center">
                            <span className="text-[11px] text-muted md:hidden">{t('col_total')}</span>
                            <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">{money(lineAmount(line), lang)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {errors.lines && <p className="px-5 pb-1 pt-2 text-[12.5px] font-semibold text-red-700">{errors.lines}</p>}
              </>
            )}
            {!locked && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-line/70 px-4 py-2.5 sm:px-5">
                <span className="mr-1 text-[12px] font-semibold text-muted">{t('quickAdd')}:</span>
                {QUICK_LINES.map((x) => (
                  <Chip key={x.id} onClick={() => addLine({ title: lt(x.title, lang), qty: 1, price: x.price })}>
                    <Plus className="mr-1 h-3 w-3" />
                    {l(x.chip)}
                  </Chip>
                ))}
              </div>
            )}
            <dl className="space-y-1 border-t border-line bg-canvas/30 px-5 py-3.5 text-[13px]">
              <div className="flex justify-between text-muted">
                <dt>{totals.netPricing ? t('subtotal') : t('subtotalGross')}</dt>
                <dd className="font-mono tabular-nums">{money(totals.net, lang)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>{totals.netPricing ? t('vat', { rate: settings.vatRate }) : t('vatGross', { rate: settings.vatRate })}</dt>
                <dd className="font-mono tabular-nums">{money(totals.vat, lang)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5 text-[15px] font-bold text-ink">
                <dt>{totals.netPricing ? t('total') : t('totalGross')}</dt>
                <dd className="font-mono tabular-nums">{money(totals.total, lang)}</dd>
              </div>
            </dl>
          </Card>

          {/* Terms */}
          <Card title={t('terms')} description={t('termsHint')}>
            {locked ? (
              <dl className="divide-y divide-line/70 text-[13px]">
                {termRows(terms, lang, date(draft.validUntil, lang)).map((r) => (
                  <div key={r.label} className="grid gap-1 py-2 sm:grid-cols-[180px_1fr] sm:gap-3">
                    <dt className="font-semibold text-ink-soft">{r.label}</dt>
                    <dd className="text-ink">{r.text}</dd>
                  </div>
                ))}
                {l(draft.terms) && (
                  <div className="grid gap-1 py-2 sm:grid-cols-[180px_1fr] sm:gap-3">
                    <dt className="font-semibold text-ink-soft">{t('notes')}</dt>
                    <dd className="whitespace-pre-line text-ink">{l(draft.terms)}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
                  <CSelect label={t('payment')} value={terms.payment} onChange={(e) => patch({ payment: e.target.value as PaymentTerm })}>
                    {PAYMENT_TERMS.map((p) => (
                      <option key={p} value={p}>
                        {paymentText(p, lang)}
                      </option>
                    ))}
                  </CSelect>
                  <CSelect label={t('delivery')} value={terms.delivery} onChange={(e) => patch({ delivery: e.target.value as DeliveryTerm })}>
                    {DELIVERY_TERMS.map((d) => (
                      <option key={d} value={d}>
                        {deliveryText(d, lang)}
                      </option>
                    ))}
                  </CSelect>
                  <CInput
                    label={t('leadDays')}
                    type="number"
                    min={1}
                    max={90}
                    value={terms.leadDays}
                    onChange={(e) => patch({ leadDays: Math.max(1, Math.min(90, Math.round(Number(e.target.value) || 1))) })}
                    trailing={t('leadUnit')}
                    className="pr-24"
                    hint={t('leadHint')}
                  />
                  <CInput
                    label={t('tolerance')}
                    type="number"
                    min={0}
                    max={20}
                    value={terms.tolerance}
                    onChange={(e) => patch({ tolerance: Math.max(0, Math.min(20, Math.round(Number(e.target.value) || 0))) })}
                    leading={<span className="text-[13px] font-semibold">±</span>}
                    trailing="%"
                    hint={t('toleranceHint')}
                  />
                </div>
                <L10nInput label={t('notes')} value={draft.terms ?? { sq: '', en: '' }} onChange={(v) => patch({ terms: v })} multiline rows={2} />
              </div>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          {/* Customer */}
          <Card title={t('customer')}>
            <div className="space-y-3">
              <CInput label={t('company')} value={draft.customer.company} onChange={(e) => setCustomer('company', e.target.value)} disabled={locked} placeholder="SH.P.K. / L.L.C." />
              <CInput label={t('nui')} value={draft.nui ?? ''} onChange={(e) => patch({ nui: e.target.value })} disabled={locked} placeholder="81…" className="font-mono" />
              <CInput label={t('name')} value={draft.customer.name} onChange={(e) => setCustomer('name', e.target.value)} disabled={locked} error={errors.name} />
              <CInput label={t('email')} type="email" value={draft.customer.email} onChange={(e) => setCustomer('email', e.target.value)} disabled={locked} error={errors.email} />
              <CInput label={t('phone')} type="tel" value={draft.customer.phone} onChange={(e) => setCustomer('phone', e.target.value)} disabled={locked} placeholder="+383 4_ ___ ___" />
              {inquiry && (
                <Link to={`/admin/kontaktet?id=${inquiry.id}`} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-soft underline decoration-ink/20 underline-offset-2 hover:text-ink">
                  {t('fromInquiry', { name: inquiry.name })} <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </Card>

          {/* Validity, version, owner */}
          <Card title={t('validity')}>
            <div className="space-y-3.5">
              <div>
                <CInput label={t('validUntil')} type="date" value={draft.validUntil.slice(0, 10)} onChange={(e) => e.target.value && patch({ validUntil: e.target.value })} disabled={locked} />
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {!locked && (
                    <>
                      <Chip onClick={() => patch({ validUntil: isoDayFromNow(14) })}>{t('plus14')}</Chip>
                      <Chip onClick={() => patch({ validUntil: isoDayFromNow(30) })}>{t('plus30')}</Chip>
                    </>
                  )}
                  <span className={cn('ml-auto text-[12px]', left < 0 ? 'font-semibold text-amber-800' : 'text-muted')}>{left < 0 ? t('expired') : left === 0 ? t('lastDay') : t('daysLeft', { n: left })}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-canvas/60 px-3 py-2.5">
                <div>
                  <div className="text-[12.5px] font-semibold text-ink-soft">{t('version')}</div>
                  <div className="text-[11.5px] text-muted">{t('versionHint')}</div>
                </div>
                <span className="text-[18px] font-bold tabular-nums text-ink">v{isNew ? 1 : contentDirty && saved ? saved.version + 1 : draft.version}</span>
              </div>
              <CSelect label={t('owner')} value={draft.owner ?? ''} onChange={(e) => patch({ owner: e.target.value || undefined })} disabled={!canEdit || saved?.status === 'converted'}>
                {owners.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </CSelect>
            </div>
          </Card>

          {/* History */}
          {!isNew && (
            <Card title={t('history')}>
              {shown.length === 0 ? (
                <p className="text-[13px] text-muted">{t('historyEmpty')}</p>
              ) : (
                <ol className="space-y-3">
                  {shown.slice(0, 8).map((a) => (
                    <li key={a.id} className="flex gap-2.5">
                      <StaffAvatar name={staffName(a.actor)} size="xs" className="mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-ink">
                          {hLabel(a.action)}
                          {a.action === 'status' && statusDetail(a.detail) && `: ${statusDetail(a.detail)}`}
                          {a.action === 'send' && a.detail && <span className="text-muted"> · {a.detail.split(' ').pop()}</span>}
                          {a.action === 'convert' && a.detail && <span className="text-muted"> · {a.detail.split('→').pop()?.trim()}</span>}
                        </div>
                        <div className="text-[12px] text-muted">
                          {dateTime(a.at, lang)} · {staffName(a.actor)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          )}

          {!isNew && saved?.status === 'draft' && can('quotes', 'delete') && (
            <button type="button" onClick={remove} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-red-700 transition-colors hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" /> {t('delete')}
            </button>
          )}
        </div>
      </div>

      <SaveBar dirty={dirty} onSave={save} onDiscard={discard} />
      <ProductPicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(p) => {
          const qty = minQty(p);
          addLine({ productId: p.id, title: l(p.name), qty, price: p.quoteOnly ? 0 : round4(tierPrice(p, qty)) });
          setPicker(false);
        }}
      />
      <QuotePrintModal open={preview} onClose={() => setPreview(false)} quote={{ ...draft, createdAt: draft.createdAt || new Date().toISOString() }} owner={owner} />
    </div>
  );
}

function ActionBtn({ primary, disabled, title, icon, onClick, children }: { primary?: boolean; disabled?: boolean; title?: string; icon: ReactNode; onClick: () => void; children: ReactNode }) {
  return (
    <span title={title}>
      <Button variant={primary ? 'primary' : 'outline'} shape="rounded" size="sm" icon={icon} disabled={disabled} onClick={onClick}>
        {children}
      </Button>
    </span>
  );
}

function NumField({ label, value, onChange, locked, step, suffix, display, title }: { label: string; value: number; onChange: (v: number) => void; locked: boolean; step: string; suffix?: string; display: string; title?: string }) {
  return (
    <label className="flex min-w-0 flex-col items-end" title={title}>
      <span className="text-[11px] text-muted md:hidden">{label}</span>
      {locked ? (
        <span className="font-mono text-[13px] tabular-nums text-ink">{display}</span>
      ) : (
        <span className="relative w-full">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={step}
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => onChange(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
            aria-label={label}
            className={cn('h-8 w-full rounded-md border border-line bg-white pl-2 text-right font-mono text-[13px] tabular-nums text-ink outline-none transition-colors focus:border-ink/40 focus:ring-4 focus:ring-ink/5', suffix ? 'pr-6' : 'pr-2')}
          />
          {suffix && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11.5px] text-muted">{suffix}</span>}
        </span>
      )}
    </label>
  );
}
