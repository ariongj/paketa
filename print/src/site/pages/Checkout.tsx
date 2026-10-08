import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Banknote, Building2, CalendarClock, ChevronDown, CreditCard, Factory, FileText, Landmark, Lock, ShieldCheck, ShoppingBag, Sparkles, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, RadioCard, Select, Textarea } from '@/components/ui/Field';
import { Accent } from '@/components/ui/misc';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useUi } from '@/store/ui';
import { useCart, useSettings } from '@/store/hooks';
import { allCities, zoneForCity } from '@/lib/pricing';
import { money } from '@/lib/format';
import type { Customer, DeliveryMethod, Lang, PaymentMethod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { CheckoutSteps, CompactLine, CouponBox, TotalsRows, TrustNotes, useItemsLabel, useTotalsView } from '@/site/components/checkout/parts';
import { PaymentSim } from '@/site/components/checkout/PaymentSim';
import { ck } from '@/site/components/checkout/dict';
import { addWorkingDays, shortDay } from '@/site/components/product/print';

const T = defineDict({
  sq: {
    pageTitle: 'Porosia',
    title: 'Përfundoni *porosinë*',
    subtitle: 'Të dhënat e faturimit dhe dërgesës. Pas porosisë kontrollojmë skedarët dhe ju dërgojmë provën digjitale brenda 24 orësh.',
    backToCart: 'Kthehu te shporta',
    secure: 'Lidhje e sigurt',
    s1: 'Faturimi',
    s1d: 'Fatura lëshohet me TVSH 18% në emër të kompanisë suaj.',
    s2: 'Dërgesa',
    s2d: 'Dorëzojmë në Kosovë, Shqipëri, Maqedoni të Veriut dhe rajon.',
    s3: 'Pagesa',
    s3d: 'Pa kosto të fshehura — zgjidhni si ju përshtatet.',
    demoFill: 'Plotëso me të dhëna demo',
    asBusiness: 'Biznes',
    asPerson: 'Individ',
    company: 'Emri i kompanisë',
    companyPh: 'p.sh. Furra Arbëria SH.P.K.',
    nui: 'NUI / Numri i TVSH-së',
    nuiPh: 'p.sh. 811234567',
    nuiHint: 'Numri unik i biznesit ose numri fiskal (NIPT, PIB…).',
    po: 'Numri i porosisë së blerjes (PO)',
    poPh: 'p.sh. PO-2026-118',
    contact: 'Personi kontaktues',
    firstName: 'Emri',
    lastName: 'Mbiemri',
    phone: 'Telefoni',
    phoneHint: 'Ju telefonojmë vetëm nëse ka pyetje për skedarin.',
    email: 'E-mail',
    emailHint: 'Këtu vjen konfirmimi, pro-forma dhe prova digjitale.',
    city: 'Qyteti',
    chooseCity: 'Zgjidhni qytetin',
    address: 'Adresa e dërgesës',
    addressPh: 'Rruga dhe numri, zona industriale, objekti',
    note: 'Shënim për porosinë',
    optional: 'opsionale',
    notePh: 'P.sh. orari i pranimit të mallit, paleta apo kuti, afati i fushatës…',
    err_required: 'Fushë e detyrueshme',
    err_phone: 'Shkruani një numër telefoni të saktë',
    err_email: 'Shkruani një adresë e-maili të saktë',
    err_city: 'Zgjidhni qytetin',
    err_nui: 'Kontrolloni numrin (6–15 shifra ose shkronja)',
    err_terms: 'Duhet të pranoni kushtet e shitjes',
    fixErrors: 'Kontrolloni fushat e shënuara',
    deliveryDays: 'Dorëzim për {days} ditë pune pas prodhimit',
    deliveryChooseCity: 'Zgjidhni qytetin për tarifën dhe afatin e saktë',
    freeThreshold: 'Falas për porosi mbi {amount}',
    pickupDesc: '{address} · {hours}',
    bankDesc: 'Pro-forma me të dhënat bankare vjen menjëherë me konfirmimin. Prodhimi nis pas pagesës.',
    cardDesc: 'Visa, Mastercard ose Maestro — në faqen e mbrojtur të bankës.',
    codDesc: 'Paguani korrierit kur të merrni mallin (Kosovë).',
    recommended: 'E rekomanduar për biznese',
    cardPanelTitle: 'Të dhënat e kartelës i shkruani vetëm te banka',
    cardPanelText: 'Pas konfirmimit hapet faqja e mbrojtur e bankës (3-D Secure). PrintWorks nuk i sheh dhe nuk i ruan kurrë të dhënat e kartelës.',
    termsPre: 'Pranoj ',
    termsLink: 'kushtet e shitjes',
    termsPost: ' dhe kuptoj që prodhimi nis pas aprovimit të provës digjitale.',
    termsDesc: 'Të dhënat përdoren vetëm për faturimin, prodhimin dhe dërgesën e porosisë.',
    placeOrder: 'Dërgo porosinë',
    payNow: 'Paguaj {amount}',
    afterNote: 'Konfirmimi dhe pro-forma vijnë menjëherë në e-mail.',
    yourOrder: 'Porosia juaj',
    edit: 'Ndrysho',
    showSummary: 'Shfaq përmbledhjen',
    hideSummary: 'Fshih përmbledhjen',
    eta: 'Gati për dërgesë rreth {date}',
    etaNote: 'nëse prova aprovohet brenda 24 orësh',
  },
  en: {
    pageTitle: 'Checkout',
    title: 'Complete your *order*',
    subtitle: 'Billing and delivery details. After you order we check your files and send a digital proof within 24 hours.',
    backToCart: 'Back to cart',
    secure: 'Secure connection',
    s1: 'Billing',
    s1d: 'The invoice is issued to your company with 18% VAT.',
    s2: 'Delivery',
    s2d: 'We deliver across Kosovo, Albania, North Macedonia and the region.',
    s3: 'Payment',
    s3d: 'No hidden costs — choose what suits you.',
    demoFill: 'Fill with demo details',
    asBusiness: 'Business',
    asPerson: 'Individual',
    company: 'Company name',
    companyPh: 'e.g. Arbëria Bakery L.L.C.',
    nui: 'Business / VAT number',
    nuiPh: 'e.g. 811234567',
    nuiHint: 'Kosovo NUI, or your tax number (NIPT, PIB…).',
    po: 'Purchase order (PO) number',
    poPh: 'e.g. PO-2026-118',
    contact: 'Contact person',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    phoneHint: 'We only call if there’s a question about your file.',
    email: 'E-mail',
    emailHint: 'Your confirmation, pro-forma and digital proof go here.',
    city: 'City',
    chooseCity: 'Choose a city',
    address: 'Delivery address',
    addressPh: 'Street and number, industrial zone, building',
    note: 'Order note',
    optional: 'optional',
    notePh: 'E.g. goods-in hours, pallet or boxes, campaign deadline…',
    err_required: 'Required',
    err_phone: 'Enter a valid phone number',
    err_email: 'Enter a valid e-mail address',
    err_city: 'Choose a city',
    err_nui: 'Check the number (6–15 digits or letters)',
    err_terms: 'Please accept the terms of sale',
    fixErrors: 'Please check the highlighted fields',
    deliveryDays: 'Delivered {days} working days after production',
    deliveryChooseCity: 'Choose a city for the exact fee and timing',
    freeThreshold: 'Free on orders over {amount}',
    pickupDesc: '{address} · {hours}',
    bankDesc: 'A pro-forma invoice with bank details comes with your confirmation. Production starts once paid.',
    cardDesc: 'Visa, Mastercard or Maestro — on the bank’s secure page.',
    codDesc: 'Pay the courier when the goods arrive (Kosovo).',
    recommended: 'Recommended for businesses',
    cardPanelTitle: 'Card details are entered only at the bank',
    cardPanelText: 'After you confirm, the bank’s secure page (3-D Secure) opens. PrintWorks never sees or stores your card details.',
    termsPre: 'I accept the ',
    termsLink: 'terms of sale',
    termsPost: ' and understand production starts after I approve the digital proof.',
    termsDesc: 'We use your details only to invoice, produce and deliver your order.',
    placeOrder: 'Place order',
    payNow: 'Pay {amount}',
    afterNote: 'Your confirmation and pro-forma arrive by e-mail right away.',
    yourOrder: 'Your order',
    edit: 'Edit',
    showSummary: 'Show order summary',
    hideSummary: 'Hide order summary',
    eta: 'Ready to ship around {date}',
    etaNote: 'if the proof is approved within 24 hours',
  },
});

/* ------------------------------------------------------------------ */
/* Form model                                                          */
/* ------------------------------------------------------------------ */
interface FormState {
  business: boolean;
  company: string;
  pib: string;
  po: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  note: string;
}
type TextKey = Exclude<keyof FormState, 'business'>;
type FieldKey = 'company' | 'pib' | 'firstName' | 'lastName' | 'phone' | 'email' | 'city' | 'address' | 'terms';
const FIELD_ORDER: FieldKey[] = ['company', 'pib', 'firstName', 'lastName', 'email', 'phone', 'city', 'address', 'terms'];
const CONTACT_FIELDS: FieldKey[] = FIELD_ORDER.filter((k) => k !== 'terms');

const EMPTY: FormState = { business: true, company: '', pib: '', po: '', firstName: '', lastName: '', phone: '', email: '', city: '', address: '', note: '' };

/** Demo data — fictitious example business (obviously sample values). */
const DEMO: Record<Lang, Omit<FormState, 'business' | 'note'>> = {
  sq: { company: 'Furra Arbëria SH.P.K.', pib: '811234567', po: 'PO-2026-118', firstName: 'Arta', lastName: 'Krasniqi', phone: '+383 44 123 456', email: 'arta.krasniqi@example.com', city: 'Prishtinë', address: 'Rr. Agim Ramadani 15' },
  en: { company: 'Bloom Cosmetics L.L.C.', pib: '811765432', po: 'PO-4471', firstName: 'Liridon', lastName: 'Berisha', phone: '+383 49 555 210', email: 'liridon@example.com', city: 'Prizren', address: 'Rr. Remzi Ademaj 8' },
};

const DRAFT_KEY = 'pw-checkout-draft';
interface Draft {
  form: FormState;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
}
function loadDraft(): Partial<Draft> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<Draft>) : {};
  } catch {
    return {};
  }
}
function saveDraft(d: Draft | null) {
  try {
    if (d) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage unavailable — draft is a convenience only */
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NUI_RE = /^[A-Za-z0-9]{6,15}$/;

/* ------------------------------------------------------------------ */
function Section({ n, title, desc, action, children }: { n: number; title: string; desc?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex items-start gap-3.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] text-paper">{String(n).padStart(2, '0')}</span>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-[18px] font-semibold leading-tight text-ink">{title}</h2>
            {desc && <p className="mt-1 text-[13.5px] leading-snug text-muted">{desc}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CardBrands() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span className="grid h-7 place-items-center rounded-md bg-white px-2 text-[12px] font-black italic tracking-tight text-[#1a1f71] ring-1 ring-line">VISA</span>
      <span className="flex h-7 items-center rounded-md bg-white px-2 ring-1 ring-line">
        <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
        <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b]/90" />
      </span>
      <span className="flex h-7 items-center rounded-md bg-white px-2 ring-1 ring-line">
        <span className="h-4 w-4 rounded-full bg-[#0099df]" />
        <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#eb001b]/90" />
      </span>
    </div>
  );
}

const reveal = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Checkout() {
  const t = useDict(T);
  const tk = useDict(ck);
  const tc = useDict(common);
  const l = useL();
  const lang = useLang();
  const items = useItemsLabel();
  const navigate = useNavigate();
  const settings = useSettings();
  const cart = useUi((s) => s.cart);
  const codes = useUi((s) => s.codes);
  const clearCart = useUi((s) => s.clearCart);
  const placeOrder = useDb((s) => s.placeOrder);
  const updateOrder = useDb((s) => s.updateOrder);
  const pages = useDb((s) => s.pages);
  usePageTitle(t('pageTitle'));

  const cities = useMemo(() => allCities(settings), [settings]);
  const methods = useMemo(() => {
    const m = (['bank', 'card', 'cod'] as const).filter((k) => settings.payments[k]);
    return m.length ? [...m] : (['bank'] as PaymentMethod[]);
  }, [settings.payments]);
  const companyMode = settings.checkout?.companyField ?? 'optional';
  const termsSlug = pages.find((p) => p.published && /kusht|terms|uslov/.test(p.slug))?.slug ?? 'kushtet-e-shitjes';

  const [draft] = useState(loadDraft);
  const [form, setForm] = useState<FormState>(() => ({ ...EMPTY, ...draft.form, ...(companyMode === 'hidden' ? { business: false } : {}) }));
  const [delivery, setDelivery] = useState<DeliveryMethod>(draft.delivery ?? 'delivery');
  const [payment, setPayment] = useState<PaymentMethod>(() => (draft.payment && methods.includes(draft.payment) ? draft.payment : methods[0]));
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'processing' | 'approved'>('idle');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const placed = useRef(false);
  const timers = useRef<number[]>([]);

  const city = form.city || undefined;
  const totals = useCart({ delivery, city });
  const homeTotals = useCart({ delivery: 'delivery', city });
  const view = useTotalsView(totals, { showEstimateHint: true });
  const zone = zoneForCity(settings, form.city);
  const maxLead = Math.max(0, ...totals.lines.map((x) => x.product.leadDays ?? 0));
  const eta = maxLead > 0 ? addWorkingDays(maxLead + 1) : null;

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  useEffect(() => {
    if (!placed.current) saveDraft({ form, delivery, payment });
  }, [form, delivery, payment]);
  useEffect(() => {
    if (!methods.includes(payment)) setPayment(methods[0]);
  }, [methods, payment]);
  // cash on delivery makes no sense for factory pickup → bank
  useEffect(() => {
    if (delivery === 'pickup' && payment === 'cod') setPayment(methods.includes('bank') ? 'bank' : methods[0]);
  }, [delivery, payment, methods]);

  const business = form.business && companyMode !== 'hidden';
  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (business || companyMode === 'required') {
      if (!form.company.trim()) e.company = t('err_required');
      if (!form.pib.trim()) e.pib = t('err_required');
      else if (!NUI_RE.test(form.pib.replace(/[\s-]/g, ''))) e.pib = t('err_nui');
    }
    if (!form.firstName.trim()) e.firstName = t('err_required');
    if (!form.lastName.trim()) e.lastName = t('err_required');
    if (!form.phone.trim()) e.phone = t('err_required');
    else if (form.phone.replace(/\D/g, '').length < 8) e.phone = t('err_phone');
    if (!form.email.trim()) e.email = t('err_required');
    else if (!EMAIL_RE.test(form.email.trim())) e.email = t('err_email');
    if (!form.city) e.city = t('err_city');
    if (delivery === 'delivery' && !form.address.trim()) e.address = t('err_required');
    if (!terms) e.terms = t('err_terms');
    return e;
  }, [form, terms, delivery, business, companyMode, t]);

  const err = (k: FieldKey) => (submitted || touched[k] ? errors[k] : undefined);
  const touch = (k: FieldKey) => () => setTouched((s) => (s[k] ? s : { ...s, [k]: true }));
  const set = (k: TextKey) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const contactDone = CONTACT_FIELDS.every((k) => !errors[k]);
  const step = phase === 'approved' ? 3 : contactDone ? 2 : 1;

  const fillDemo = () => {
    const d = DEMO[lang];
    setForm((f) => ({ ...f, ...d, business: companyMode !== 'hidden', city: cities.includes(d.city) ? d.city : (cities[0] ?? '') }));
    setTouched({});
  };

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const finish = () => {
    const customer: Customer = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city,
      address: delivery === 'pickup' && !form.address.trim() ? settings.pickupAddress : form.address.trim(),
      ...(business ? { company: form.company.trim(), pib: form.pib.replace(/[\s-]/g, '').toUpperCase() } : {}),
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    };
    const order = placeOrder({ customer, items: cart, delivery, payment, codes, lang });
    if (form.po.trim()) updateOrder(order.id, { poNumber: form.po.trim() });
    placed.current = true;
    saveDraft(null);
    clearCart();
    navigate('/porosia/' + order.id);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setSubmitted(true);
    const first = FIELD_ORDER.find((k) => errors[k]);
    if (first) {
      const el = document.getElementById('f-' + first);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      later(() => el?.focus({ preventScroll: true }), 450);
      toast.error(t('fixErrors'));
      return;
    }
    setBusy(true);
    if (payment === 'card') {
      setPhase('processing');
      later(() => setPhase('approved'), 1800);
      later(finish, 2900);
    } else {
      later(finish, 750);
    }
  };

  if (!totals.lines.length) {
    return placed.current ? <div className="min-h-[60vh]" /> : <Navigate to="/shporta" replace />;
  }

  /* ---------- delivery card copy ---------- */
  const minFee = Math.min(...settings.shippingZones.map((z) => z.fee));
  const homeFree = homeTotals.freeShippingReason === 'threshold';
  const homeAside = homeFree ? (
    <span className="text-emerald-700">{tk('free')}</span>
  ) : zone ? (
    <span className="font-mono tabular-nums">{money(zone.fee, lang)}</span>
  ) : (
    <span className="font-mono tabular-nums">{tk('from', { amount: money(minFee, lang) })}</span>
  );
  const homeDesc = [
    homeFree ? t('freeThreshold', { amount: money(homeTotals.freeShippingThreshold ?? settings.freeShippingThreshold, lang, { decimals: false }) }) : null,
    zone ? t('deliveryDays', { days: zone.days }) : !homeFree ? t('deliveryChooseCity') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const payIcon = { cod: Banknote, bank: Landmark, card: CreditCard } as const;
  const payDesc = { cod: t('codDesc'), bank: t('bankDesc'), card: t('cardDesc') } as const;
  const submitLabel = payment === 'card' ? t('payNow', { amount: money(totals.total, lang) }) : t('placeOrder');

  const summaryLines = (
    <div className="divide-y divide-line">
      {totals.lines.map((line) => (
        <CompactLine key={line.item.key} line={line} />
      ))}
    </div>
  );
  const etaBox = eta && (
    <p className="flex items-start gap-2 rounded-xl bg-white px-3.5 py-3 text-[12.5px] leading-snug ring-1 ring-line">
      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <span>
        <span className="font-semibold text-ink">{t('eta', { date: shortDay(eta, lang) })}</span> <span className="text-muted">— {t('etaNote')}</span>
      </span>
    </p>
  );

  return (
    <div className="pb-4">
      <div className="border-b border-line bg-white/55">
        <div className="container-x flex h-[60px] items-center justify-between gap-4">
          <Link to="/shporta" className="group hidden items-center gap-2 text-[13.5px] font-semibold text-ink-soft hover:text-ink md:inline-flex">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {t('backToCart')}
          </Link>
          <CheckoutSteps current={step} className="mx-auto md:mx-0" />
          <span className="hidden items-center gap-1.5 text-[13px] font-semibold text-emerald-700 md:inline-flex">
            <Lock className="h-3.5 w-3.5" />
            {t('secure')}
          </span>
        </div>
      </div>

      <div className="container-x pt-8 sm:pt-12">
        <div className="max-w-2xl">
          <h1 className="display text-[38px] leading-[1.04] text-ink sm:text-[52px]">
            <Accent text={t('title')} />
          </h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{t('subtitle')}</p>
        </div>

        {/* Mobile summary toggle */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-line lg:hidden">
          <button type="button" onClick={() => setSummaryOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left" aria-expanded={summaryOpen}>
            <span className="flex min-w-0 items-center gap-2.5 text-[13.5px] font-semibold text-ink">
              <ShoppingBag className="h-4 w-4 shrink-0 text-brand-600" />
              <span className="truncate">{summaryOpen ? t('hideSummary') : t('showSummary')}</span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted transition-transform duration-300', summaryOpen && 'rotate-180')} />
            </span>
            <span className="shrink-0 text-[15px] font-semibold tabular-nums text-ink">{money(totals.total, lang)}</span>
          </button>
          <AnimatePresence initial={false}>
            {summaryOpen && (
              <motion.div {...reveal} className="overflow-hidden">
                <div className="border-t border-line px-4">{summaryLines}</div>
                <div className="border-t border-line bg-paper/60 px-4 py-4">
                  <CouponBox totals={totals} collapsible />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 grid items-start gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-14">
          <form id="checkout-form" noValidate onSubmit={onSubmit} className="min-w-0">
            <fieldset disabled={busy} className="space-y-5">
              {/* 1 — Billing */}
              <Section
                n={1}
                title={t('s1')}
                desc={t('s1d')}
                action={
                  <button type="button" onClick={fillDemo} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/20 px-3 py-1.5 text-[12px] font-semibold text-muted transition-colors hover:border-ink/40 hover:text-ink">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('demoFill')}
                  </button>
                }
              >
                {companyMode !== 'hidden' && (
                  <div className="mb-5 inline-flex rounded-full bg-paper p-1 ring-1 ring-inset ring-line" role="radiogroup">
                    {[
                      { v: true, label: t('asBusiness'), icon: Building2 },
                      { v: false, label: t('asPerson'), icon: User },
                    ].map(({ v, label, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        role="radio"
                        aria-checked={form.business === v}
                        disabled={!v && companyMode === 'required'}
                        onClick={() => setForm((f) => ({ ...f, business: v }))}
                        className={cn('inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold transition-colors disabled:opacity-40', form.business === v ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink')}
                      >
                        <Icon className="h-4 w-4" /> {label}
                      </button>
                    ))}
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {business && (
                    <motion.div {...reveal} className="overflow-hidden">
                      <div className="grid gap-x-4 gap-y-5 pb-6 sm:grid-cols-2">
                        <Input id="f-company" label={t('company')} required autoComplete="organization" placeholder={t('companyPh')} value={form.company} onChange={set('company')} onBlur={touch('company')} error={err('company')} wrapClassName="sm:col-span-2" />
                        <Input id="f-pib" label={t('nui')} required placeholder={t('nuiPh')} hint={t('nuiHint')} className="font-mono" value={form.pib} onChange={set('pib')} onBlur={touch('pib')} error={err('pib')} />
                        <Input
                          id="f-po"
                          label={
                            <>
                              {t('po')} <span className="font-medium text-muted">({t('optional')})</span>
                            </>
                          }
                          placeholder={t('poPh')}
                          className="font-mono"
                          value={form.po}
                          onChange={set('po')}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{t('contact')}</div>
                <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                  <Input id="f-firstName" label={t('firstName')} required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} onBlur={touch('firstName')} error={err('firstName')} />
                  <Input id="f-lastName" label={t('lastName')} required autoComplete="family-name" value={form.lastName} onChange={set('lastName')} onBlur={touch('lastName')} error={err('lastName')} />
                  <Input id="f-email" type="email" inputMode="email" label={t('email')} required autoComplete="email" placeholder="emri@kompania.com" hint={t('emailHint')} value={form.email} onChange={set('email')} onBlur={touch('email')} error={err('email')} />
                  <Input id="f-phone" type="tel" inputMode="tel" label={t('phone')} required autoComplete="tel" placeholder="+383 4_ ___ ___" hint={t('phoneHint')} value={form.phone} onChange={set('phone')} onBlur={touch('phone')} error={err('phone')} />
                </div>
              </Section>

              {/* 2 — Delivery */}
              <Section n={2} title={t('s2')} desc={t('s2d')}>
                <div className="grid gap-3">
                  <RadioCard checked={delivery === 'delivery'} onSelect={() => setDelivery('delivery')} icon={<Truck className="h-5 w-5" />} title={tc('delivery_delivery')} description={homeDesc} aside={homeAside} />
                  <RadioCard
                    checked={delivery === 'pickup'}
                    onSelect={() => setDelivery('pickup')}
                    icon={<Factory className="h-5 w-5" />}
                    title={tc('delivery_pickup')}
                    description={t('pickupDesc', { address: settings.pickupAddress, hours: l(settings.hours) })}
                    aside={<span className="text-emerald-700">{tk('free')}</span>}
                  />
                </div>
                <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <Select id="f-city" label={t('city')} required autoComplete="address-level2" value={form.city} onChange={set('city')} onBlur={touch('city')} error={err('city')}>
                    <option value="">{t('chooseCity')}</option>
                    {settings.shippingZones.map((z) => (
                      <optgroup key={z.id} label={z.name}>
                        {[...z.cities].sort((a, b) => a.localeCompare(b, 'sq')).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                  <AnimatePresence initial={false} mode="popLayout">
                    {delivery === 'delivery' && (
                      <motion.div key="addr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Input id="f-address" label={t('address')} required autoComplete="street-address" placeholder={t('addressPh')} value={form.address} onChange={set('address')} onBlur={touch('address')} error={err('address')} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Section>

              {/* 3 — Payment */}
              <Section n={3} title={t('s3')} desc={t('s3d')}>
                <div className="grid gap-3">
                  {methods.map((m) => {
                    const Icon = payIcon[m];
                    const off = m === 'cod' && delivery === 'pickup';
                    return (
                      <RadioCard
                        key={m}
                        checked={payment === m}
                        onSelect={() => setPayment(m)}
                        disabled={off}
                        icon={<Icon className="h-5 w-5" />}
                        title={m === 'bank' ? `${tc('pay_bank')} · pro-forma` : tc(`pay_${m}`)}
                        description={payDesc[m]}
                        aside={m === 'bank' ? <span className="hidden rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 sm:inline">{t('recommended')}</span> : undefined}
                      />
                    );
                  })}
                </div>
                <AnimatePresence initial={false}>
                  {payment === 'card' && (
                    <motion.div {...reveal} className="overflow-hidden">
                      <div className="mt-3 flex gap-3.5 rounded-2xl bg-paper p-4 ring-1 ring-inset ring-line sm:p-5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 ring-1 ring-line">
                          <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-ink">{t('cardPanelTitle')}</p>
                          <p className="mt-1 text-[13px] leading-relaxed text-muted">{t('cardPanelText')}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <CardBrands />
                            <span className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">
                              <Lock className="h-3 w-3" /> 3-D Secure
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Section>

              {/* Confirm */}
              <section className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-7">
                <Textarea
                  rows={3}
                  label={
                    <>
                      {t('note')} <span className="font-medium text-muted">({t('optional')})</span>
                    </>
                  }
                  placeholder={t('notePh')}
                  value={form.note}
                  onChange={set('note')}
                />
                <div className="lg:hidden">
                  <div className="my-5 h-px bg-line" />
                  <TotalsRows v={view} big />
                </div>
                <div
                  id="f-terms"
                  tabIndex={-1}
                  className={cn('mt-5 rounded-2xl p-4 outline-none ring-1 ring-inset transition-colors', err('terms') ? 'bg-red-50/70 ring-red-300' : 'bg-paper ring-line')}
                >
                  <Checkbox
                    checked={terms}
                    onChange={(v) => {
                      setTerms(v);
                      setTouched((s) => ({ ...s, terms: true }));
                    }}
                    label={
                      <>
                        {t('termsPre')}
                        <Link to={`/faqe/${termsSlug}`} target="_blank" className="text-brand-700 underline decoration-brand-700/30 underline-offset-[3px] hover:decoration-brand-700">
                          {t('termsLink')}
                        </Link>
                        {t('termsPost')}
                      </>
                    }
                    description={t('termsDesc')}
                  />
                  {err('terms') && <p className="mt-2 pl-8 text-xs font-medium text-red-600">{err('terms')}</p>}
                </div>
                <Button type="submit" size="lg" className="mt-5 w-full" loading={busy} icon={busy ? undefined : payment === 'bank' ? <FileText className="h-4 w-4" /> : undefined} iconRight={busy ? undefined : <ArrowRight className="h-4 w-4" />}>
                  {submitLabel}
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-muted">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  {t('afterNote')}
                </p>
              </section>
            </fieldset>
          </form>

          {/* Sticky summary (desktop) */}
          <aside className="hidden lg:sticky lg:top-[100px] lg:block">
            <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
              <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
                <h2 className="text-[15px] font-semibold text-ink">
                  {t('yourOrder')} <span className="font-medium text-muted">· {items(totals.lines.length)}</span>
                </h2>
                <Link to="/shporta" className="text-[13px] font-semibold text-brand-700 hover:underline">
                  {t('edit')}
                </Link>
              </div>
              <div className="no-scrollbar max-h-[300px] overflow-y-auto px-6">{summaryLines}</div>
              <div className="border-t border-line bg-paper/60 px-6 py-5">
                <CouponBox totals={totals} collapsible />
                <div className="my-5 h-px bg-line" />
                <TotalsRows v={view} big />
                {etaBox && <div className="mt-5">{etaBox}</div>}
                <Button type="submit" form="checkout-form" size="lg" className="mt-5 w-full" loading={busy} iconRight={busy ? undefined : <ArrowRight className="h-4 w-4" />}>
                  {submitLabel}
                </Button>
              </div>
            </div>
            <TrustNotes compact className="mt-5 px-2" />
          </aside>
        </div>
      </div>

      <PaymentSim phase={phase} amount={totals.total} merchant={settings.legalName} />
    </div>
  );
}
