import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Banknote, Building2, CalendarDays, ChevronDown, CreditCard, Info, Landmark, Lock, MapPin, ShieldCheck, ShoppingBag, Sparkles, Stamp, Truck, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, RadioCard, Select, Switch, Textarea } from '@/components/ui/Field';
import { Accent } from '@/components/ui/misc';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useUi } from '@/store/ui';
import { useCart, useSettings } from '@/store/hooks';
import { zoneForCity } from '@/lib/pricing';
import { money } from '@/lib/format';
import type { Customer, DeliveryMethod, Lang, PaymentMethod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { CheckoutSteps, CompactLine, CouponBox, TotalsRows, TrustNotes, useItemsLabel, useTotalsView, useWorkDays } from '@/site/components/checkout/parts';
import { PaymentSim } from '@/site/components/checkout/PaymentSim';
import { ck } from '@/site/components/checkout/dict';

const T = defineDict({
  me: {
    pageTitle: 'Plaćanje',
    title: 'Završetak *narudžbe*',
    subtitle: 'Još par detalja — potvrdu dobijate odmah, a naš tim vas zove radi potvrde narudžbe.',
    backToCart: 'Nazad u korpu',
    secure: 'Sigurna kupovina',
    s1: 'Kontakt',
    s1d: 'Na ove podatke šaljemo potvrdu i fakturu.',
    s2: 'Dostava ili preuzimanje',
    s2d: 'Dostavljamo širom Kosova — Mitrovica u roku od 24 h.',
    s3: 'Način plaćanja',
    s3d: 'Platite kako vam odgovara — bez skrivenih troškova.',
    s4: 'Napomene i potvrda',
    demoFill: 'Popuni demo podacima',
    firstName: 'Ime',
    lastName: 'Prezime',
    phone: 'Telefon',
    phoneHint: 'Zovemo vas radi potvrde narudžbe.',
    email: 'E-mail',
    emailHint: 'Ovdje stižu potvrda i faktura.',
    asCompany: 'Kupujem kao firma',
    asCompanyHint: 'Faktura glasi na firmu, sa NUI brojem.',
    company: 'Naziv firme',
    nui: 'NUI (poslovni broj)',
    nuiPh: '9 cifara',
    vatNo: 'Broj TVSH',
    vatNoHint: 'Samo ako je firma u sistemu TVSH-a.',
    optional: 'opciono',
    zonesTitle: 'Zone dostave',
    city: 'Grad',
    chooseCity: 'Izaberite grad',
    address: 'Adresa dostave',
    addressPh: 'Ulica i broj, naziv lokala, sprat',
    date: 'Željeni datum dostave',
    datePickup: 'Željeni datum preuzimanja',
    dateHint: 'Trudimo se da ga ispoštujemo — potvrđujemo telefonom.',
    dateLogo: 'Za proizvode sa logotipom rok počinje nakon odobrenja probnog prikaza (7–10 radnih dana).',
    err_required: 'Obavezno polje',
    err_phone: 'Unesite ispravan broj telefona',
    err_email: 'Unesite ispravnu e-mail adresu',
    err_city: 'Izaberite grad',
    err_nui: 'NUI ima 9 cifara',
    err_vat: 'Broj TVSH ima 9 cifara',
    err_date: 'Izaberite datum od sutra pa nadalje',
    err_sunday: 'Nedjeljom ne dostavljamo — izaberite drugi dan',
    err_terms: 'Potrebno je prihvatiti uslove kupovine',
    fixErrors: 'Provjerite označena polja',
    deliveryPromise: 'Mitrovica 24 h · Kosovo 1–3 radna dana',
    freeThreshold: 'Besplatno za narudžbe od {amount}',
    pickupDesc: '{address} · {hours}',
    pickupReady: 'Javljamo vam telefonom kada je narudžba spremna — obično istog radnog dana.',
    codDesc: 'Plaćate kuriru gotovinom pri preuzimanju.',
    codDescPickup: 'Plaćate u magacinu — gotovinom ili karticom.',
    bankDesc: 'Podatke za uplatu (IBAN i poziv na broj) dobijate uz potvrdu. Šaljemo nakon uplate.',
    bankDescCompany: 'Fakturu na NUI {nui} šaljemo e-mailom; narudžbu šaljemo nakon uplate (obično 1 radni dan).',
    bankCompanyHint: 'Kupujete za firmu? Uključite „Kupujem kao firma“ da faktura glasi na vaš NUI.',
    cardDesc: 'Visa, Mastercard ili Maestro — na zaštićenoj stranici banke.',
    cardPanelTitle: 'Podatke o kartici unosite samo kod banke',
    cardPanelText: 'Nakon potvrde otvara se zaštićena stranica banke (3-D Secure). Paketoje nikada ne vidi niti čuva podatke vaše kartice. U demo verziji plaćanje je simulirano.',
    note: 'Napomena uz narudžbu',
    notePh: 'Npr. radno vrijeme lokala, ulaz za dostavu, osoba za kontakt…',
    logoTitle: 'Narudžba sadrži štampu logotipa',
    logoText: 'Nakon narudžbe tražimo vaš logotip, šaljemo probni prikaz na odobrenje, a zatim slijedi štampa (7–10 radnih dana).',
    termsPre: 'Prihvatam ',
    termsLink: 'uslove kupovine',
    termsMid: ' i ',
    returnsLink: 'politiku povrata',
    termsDesc: 'Vaše podatke koristimo isključivo za obradu narudžbe, fakturu i dostavu.',
    placeOrder: 'Potvrdi narudžbu',
    payNow: 'Plati {amount}',
    afterNote: 'Potvrdu narudžbe odmah šaljemo na vaš e-mail.',
    yourOrder: 'Vaša narudžba',
    edit: 'Uredi',
    showSummary: 'Prikaži pregled narudžbe',
    hideSummary: 'Sakrij pregled narudžbe',
  },
  sq: {
    pageTitle: 'Pagesa',
    title: 'Përfundo *porosinë*',
    subtitle: 'Edhe pak të dhëna — konfirmimin e merrni menjëherë, ndërsa ekipi ynë ju telefonon për ta konfirmuar porosinë.',
    backToCart: 'Kthehu te shporta',
    secure: 'Blerje e sigurt',
    s1: 'Kontakti',
    s1d: 'Në këto të dhëna dërgojmë konfirmimin dhe faturën.',
    s2: 'Dërgesa ose marrja',
    s2d: 'Dërgojmë në gjithë Kosovën — Mitrovicë brenda 24 orëve.',
    s3: 'Mënyra e pagesës',
    s3d: 'Paguani si ju përshtatet — pa kosto të fshehura.',
    s4: 'Shënime dhe konfirmimi',
    demoFill: 'Plotëso me të dhëna demo',
    firstName: 'Emri',
    lastName: 'Mbiemri',
    phone: 'Telefoni',
    phoneHint: 'Ju telefonojmë për konfirmimin e porosisë.',
    email: 'E-mail',
    emailHint: 'Këtu vijnë konfirmimi dhe fatura.',
    asCompany: 'Blej si biznes',
    asCompanyHint: 'Fatura lëshohet në emër të biznesit, me NUI.',
    company: 'Emri i biznesit',
    nui: 'NUI (numri unik i biznesit)',
    nuiPh: '9 shifra',
    vatNo: 'Nr. TVSH',
    vatNoHint: 'Vetëm nëse biznesi është në sistemin e TVSH-së.',
    optional: 'opsionale',
    zonesTitle: 'Zonat e dërgesës',
    city: 'Qyteti',
    chooseCity: 'Zgjidhni qytetin',
    address: 'Adresa e dërgesës',
    addressPh: 'Rruga dhe numri, emri i lokalit, kati',
    date: 'Data e preferuar e dorëzimit',
    datePickup: 'Data e preferuar e marrjes',
    dateHint: 'Përpiqemi ta respektojmë — e konfirmojmë me telefon.',
    dateLogo: 'Për produktet me logo afati fillon pas miratimit të provës (7–10 ditë pune).',
    err_required: 'Fushë e detyrueshme',
    err_phone: 'Shkruani një numër telefoni të saktë',
    err_email: 'Shkruani një adresë e-maili të saktë',
    err_city: 'Zgjidhni qytetin',
    err_nui: 'NUI ka 9 shifra',
    err_vat: 'Nr. TVSH ka 9 shifra',
    err_date: 'Zgjidhni një datë nga nesër e tutje',
    err_sunday: 'Të dielave nuk dorëzojmë — zgjidhni një ditë tjetër',
    err_terms: 'Duhet të pranoni kushtet e blerjes',
    fixErrors: 'Kontrolloni fushat e shënuara',
    deliveryPromise: 'Mitrovicë 24 orë · Kosovë 1–3 ditë pune',
    freeThreshold: 'Falas për porosi nga {amount}',
    pickupDesc: '{address} · {hours}',
    pickupReady: 'Ju njoftojmë me telefon kur porosia të jetë gati — zakonisht brenda së njëjtës ditë pune.',
    codDesc: 'Paguani korrierit me para në dorë kur e pranoni porosinë.',
    codDescPickup: 'Paguani në depo — me para në dorë ose me kartelë.',
    bankDesc: 'Të dhënat për pagesë (IBAN dhe referenca) i merrni me konfirmimin. Dërgojmë pas pagesës.',
    bankDescCompany: 'Faturën me NUI {nui} ua dërgojmë me e-mail; porosinë e nisim pas pagesës (zakonisht 1 ditë pune).',
    bankCompanyHint: 'Blini për biznesin? Aktivizoni „Blej si biznes“ që fatura të lëshohet me NUI-n tuaj.',
    cardDesc: 'Visa, Mastercard ose Maestro — në faqen e mbrojtur të bankës.',
    cardPanelTitle: 'Të dhënat e kartelës i shkruani vetëm te banka',
    cardPanelText: 'Pas konfirmimit hapet faqja e mbrojtur e bankës (3-D Secure). Paketoje nuk i sheh dhe nuk i ruan kurrë të dhënat e kartelës. Në versionin demo pagesa është e simuluar.',
    note: 'Shënim për porosinë',
    notePh: 'P.sh. orari i lokalit, hyrja për furnizim, personi kontaktues…',
    logoTitle: 'Porosia përmban printim me logo',
    logoText: 'Pas porosisë ju kërkojmë skedarin e logos, ju dërgojmë provën për miratim dhe më pas fillon printimi (7–10 ditë pune).',
    termsPre: 'Pranoj ',
    termsLink: 'kushtet e blerjes',
    termsMid: ' dhe ',
    returnsLink: 'politikën e kthimit',
    termsDesc: 'Të dhënat tuaja i përdorim vetëm për përpunimin e porosisë, faturën dhe dërgesën.',
    placeOrder: 'Konfirmo porosinë',
    payNow: 'Paguaj {amount}',
    afterNote: 'Konfirmimin e porosisë e dërgojmë menjëherë në e-mailin tuaj.',
    yourOrder: 'Porosia juaj',
    edit: 'Ndrysho',
    showSummary: 'Shfaq përmbledhjen e porosisë',
    hideSummary: 'Fshih përmbledhjen e porosisë',
  },
  en: {
    pageTitle: 'Checkout',
    title: 'Complete your *order*',
    subtitle: 'Just a few details — you get a confirmation right away and our team calls you to confirm the order.',
    backToCart: 'Back to cart',
    secure: 'Secure checkout',
    s1: 'Contact',
    s1d: 'We send the confirmation and the invoice here.',
    s2: 'Delivery or pickup',
    s2d: 'We deliver all over Kosovo — Mitrovica within 24 hours.',
    s3: 'Payment method',
    s3d: 'Pay the way that suits you — no hidden costs.',
    s4: 'Notes & confirmation',
    demoFill: 'Fill with demo details',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    phoneHint: 'We’ll call you to confirm the order.',
    email: 'E-mail',
    emailHint: 'Your confirmation and invoice go here.',
    asCompany: 'Buy as a business',
    asCompanyHint: 'Invoice issued to your business, with its NUI.',
    company: 'Business name',
    nui: 'NUI (business number)',
    nuiPh: '9 digits',
    vatNo: 'VAT number',
    vatNoHint: 'Only if the business is VAT-registered.',
    optional: 'optional',
    zonesTitle: 'Delivery zones',
    city: 'City',
    chooseCity: 'Choose a city',
    address: 'Delivery address',
    addressPh: 'Street and number, venue name, floor',
    date: 'Preferred delivery date',
    datePickup: 'Preferred pickup date',
    dateHint: 'We do our best to meet it — confirmed by phone.',
    dateLogo: 'For logo-printed items the lead time starts once you approve the proof (7–10 working days).',
    err_required: 'Required',
    err_phone: 'Enter a valid phone number',
    err_email: 'Enter a valid e-mail address',
    err_city: 'Choose a city',
    err_nui: 'The NUI has 9 digits',
    err_vat: 'The VAT number has 9 digits',
    err_date: 'Pick a date from tomorrow onwards',
    err_sunday: 'We don’t deliver on Sundays — please pick another day',
    err_terms: 'Please accept the terms of sale',
    fixErrors: 'Please check the highlighted fields',
    deliveryPromise: 'Mitrovica 24 h · Kosovo 1–3 working days',
    freeThreshold: 'Free on orders from {amount}',
    pickupDesc: '{address} · {hours}',
    pickupReady: 'We call you when your order is ready — usually the same working day.',
    codDesc: 'Pay the courier in cash when you receive the order.',
    codDescPickup: 'Pay at the warehouse — cash or card.',
    bankDesc: 'Payment details (IBAN and reference) come with your confirmation. We ship once paid.',
    bankDescCompany: 'We e-mail the invoice with NUI {nui}; the order ships once paid (usually 1 working day).',
    bankCompanyHint: 'Buying for a business? Switch on “Buy as a business” to get an invoice with your NUI.',
    cardDesc: 'Visa, Mastercard or Maestro — on the bank’s secure page.',
    cardPanelTitle: 'Card details are entered only at the bank',
    cardPanelText: 'After you confirm, the bank’s secure page (3-D Secure) opens. Paketoje never sees or stores your card details. In this demo the payment is simulated.',
    note: 'Order notes',
    notePh: 'E.g. venue opening hours, delivery entrance, contact person…',
    logoTitle: 'Your order includes logo print',
    logoText: 'After you order we ask for your logo file, send a proof for approval and then start printing (7–10 working days).',
    termsPre: 'I accept the ',
    termsLink: 'terms of sale',
    termsMid: ' and the ',
    returnsLink: 'returns policy',
    termsDesc: 'We use your details only to process, invoice and deliver your order.',
    placeOrder: 'Place order',
    payNow: 'Pay {amount}',
    afterNote: 'We e-mail your order confirmation right away.',
    yourOrder: 'Your order',
    edit: 'Edit',
    showSummary: 'Show order summary',
    hideSummary: 'Hide order summary',
  },
});

/* ------------------------------------------------------------------ */
/* Form model                                                          */
/* ------------------------------------------------------------------ */
interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isCompany: boolean;
  company: string;
  nui: string;
  vatNo: string;
  city: string;
  address: string;
  date: string;
  note: string;
}
type TextKey = Exclude<keyof FormState, 'isCompany'>;
type FieldKey = 'firstName' | 'lastName' | 'phone' | 'email' | 'company' | 'nui' | 'vatNo' | 'city' | 'address' | 'date' | 'terms';
const FIELD_ORDER: FieldKey[] = ['firstName', 'lastName', 'phone', 'email', 'company', 'nui', 'vatNo', 'city', 'address', 'date', 'terms'];
const DETAIL_FIELDS: FieldKey[] = FIELD_ORDER.filter((k) => k !== 'terms');

const EMPTY: FormState = { firstName: '', lastName: '', phone: '', email: '', isCompany: false, company: '', nui: '', vatNo: '', city: '', address: '', date: '', note: '' };

const DEMO: Record<Lang, Pick<FormState, 'firstName' | 'lastName' | 'phone' | 'email' | 'city' | 'address'>> = {
  sq: { firstName: 'Arbër', lastName: 'Krasniqi', phone: '+383 44 512 337', email: 'arber.krasniqi@example.com', city: 'Mitrovicë', address: 'Rr. Mbretëresha Teutë 14' },
  en: { firstName: 'Leonora', lastName: 'Berisha', phone: '+383 49 220 418', email: 'leonora.berisha@example.com', city: 'Prishtinë', address: 'Rr. Agim Ramadani 22, kati 1' },
  me: { firstName: 'Milan', lastName: 'Petrović', phone: '+383 45 310 662', email: 'milan.petrovic@example.com', city: 'Graçanicë', address: 'Glavna ulica 21' },
};

const DRAFT_KEY = 'paketoje-checkout-draft';
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
    /* storage unavailable — the draft is a convenience only */
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const digits = (s: string) => s.replace(/\D/g, '');

/** Local YYYY-MM-DD, `offset` days from today. */
function isoDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */
function Section({ n, title, desc, action, children }: { n: number; title: string; desc?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex items-start gap-3.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-bold text-lime">{n}</span>
          <div className="min-w-0 pt-0.5">
            <h2 className="display text-[20px] leading-tight text-ink">{title}</h2>
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

function Optional({ children }: { children: ReactNode }) {
  return <span className="ml-1 font-medium text-muted">({children})</span>;
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
  const workDays = useWorkDays();
  const navigate = useNavigate();
  const settings = useSettings();
  const cart = useUi((s) => s.cart);
  const codes = useUi((s) => s.codes);
  const clearCart = useUi((s) => s.clearCart);
  const placeOrder = useDb((s) => s.placeOrder);
  const updateOrder = useDb((s) => s.updateOrder);
  usePageTitle(t('pageTitle'));

  const zones = settings.shippingZones;
  const cities = useMemo(() => zones.flatMap((z) => z.cities), [zones]);
  const methods = useMemo(() => {
    const m = (['cod', 'bank', 'card'] as const).filter((k) => settings.payments[k]);
    return m.length ? m : (['cod'] as PaymentMethod[]);
  }, [settings.payments]);
  const companyField = settings.checkout?.companyField ?? 'optional';

  /* pickup point: the default pickup location (Depo Paketoje), else the legacy pickup address */
  const pickupLoc = useMemo(() => (settings.locations ?? []).find((x) => x.pickup && x.isDefault) ?? (settings.locations ?? []).find((x) => x.pickup), [settings.locations]);
  const pickupName = pickupLoc?.name ?? tc('delivery_pickup');
  const pickupAddress = pickupLoc ? [pickupLoc.address, pickupLoc.city].filter(Boolean).join(', ') : settings.pickupAddress;
  const pickupAvailable = !!pickupLoc || !!settings.pickupAddress;

  const [draft] = useState(loadDraft);
  const [form, setForm] = useState<FormState>(() => ({ ...EMPTY, ...draft.form, isCompany: companyField === 'required' ? true : (draft.form?.isCompany ?? false) }));
  const [delivery, setDelivery] = useState<DeliveryMethod>(draft.delivery === 'pickup' && pickupAvailable ? 'pickup' : 'delivery');
  const [payment, setPayment] = useState<PaymentMethod>(() => (draft.payment && methods.includes(draft.payment) ? draft.payment : methods[0]));
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'processing' | 'approved'>('idle');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const placed = useRef(false);
  const timers = useRef<number[]>([]);

  const isPickup = delivery === 'pickup';
  const city = !isPickup && form.city ? form.city : undefined;
  const totals = useCart({ delivery, city });
  const homeTotals = useCart({ delivery: 'delivery', city: form.city || undefined });
  const zone = zoneForCity(settings, form.city);
  const view = useTotalsView(totals, { showEstimateHint: true, zoneNote: zone && !isPickup ? tk('zoneNote', { zone: zone.name, days: workDays(zone.days) }) : undefined });
  const minDate = isoDay(1);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  useEffect(() => {
    if (!placed.current) saveDraft({ form, delivery, payment });
  }, [form, delivery, payment]);
  // keep the chosen method valid if the CMS switches one off
  useEffect(() => {
    if (!methods.includes(payment)) setPayment(methods[0]);
  }, [methods, payment]);

  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!form.firstName.trim()) e.firstName = t('err_required');
    if (!form.lastName.trim()) e.lastName = t('err_required');
    if (!form.phone.trim()) e.phone = t('err_required');
    else if (digits(form.phone).length < 8) e.phone = t('err_phone');
    if (!form.email.trim()) e.email = t('err_required');
    else if (!EMAIL_RE.test(form.email.trim())) e.email = t('err_email');
    if (form.isCompany) {
      if (!form.company.trim()) e.company = t('err_required');
      if (!/^\d{9}$/.test(digits(form.nui))) e.nui = form.nui.trim() ? t('err_nui') : t('err_required');
      if (form.vatNo.trim() && !/^\d{9}$/.test(digits(form.vatNo))) e.vatNo = t('err_vat');
    }
    if (!isPickup) {
      if (!form.city) e.city = t('err_city');
      if (!form.address.trim()) e.address = t('err_required');
    }
    if (form.date) {
      if (form.date < minDate) e.date = t('err_date');
      else if (new Date(form.date + 'T12:00:00').getDay() === 0) e.date = t('err_sunday');
    }
    if (!terms) e.terms = t('err_terms');
    return e;
  }, [form, terms, isPickup, minDate, t]);

  const err = (k: FieldKey) => (submitted || touched[k] ? errors[k] : undefined);
  const touch = (k: FieldKey) => () => setTouched((s) => (s[k] ? s : { ...s, [k]: true }));
  const set = (k: TextKey) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const detailsDone = DETAIL_FIELDS.every((k) => !errors[k]);
  const step = phase === 'approved' ? 3 : detailsDone ? 2 : 1;

  const fillDemo = () => {
    const d = DEMO[lang];
    setForm((f) => ({ ...f, ...d, city: cities.includes(d.city) ? d.city : (cities[0] ?? '') }));
    setTouched({});
  };

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const finish = () => {
    const vat = form.isCompany ? digits(form.vatNo) : '';
    const note = [vat ? `Nr. TVSH: ${vat}` : '', form.note.trim()].filter(Boolean).join('\n');
    const customer: Customer = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: isPickup ? form.city || pickupLoc?.city || '' : form.city,
      address: isPickup ? '' : form.address.trim(),
      ...(form.isCompany ? { company: form.company.trim(), pib: digits(form.nui) } : {}),
      ...(note ? { note } : {}),
    };
    const order = placeOrder({ customer, items: cart, delivery, payment, codes, lang });
    if (form.date) updateOrder(order.id, { delivery: { ...order.delivery, date: form.date } });
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
  const minFee = zones.length ? Math.min(...zones.map((z) => z.fee)) : 0;
  const homeFree = homeTotals.freeShippingReason === 'threshold';
  const threshold = homeTotals.freeShippingThreshold;
  const homeAside = homeFree ? (
    <span className="text-brand-700">{tk('free')}</span>
  ) : zone ? (
    <span className="tabular-nums">{money(zone.fee, lang)}</span>
  ) : (
    <span className="tabular-nums">{tk('from', { amount: money(minFee, lang) })}</span>
  );
  const homeDesc = [
    zone ? `${zone.name} · ${workDays(zone.days)}` : t('deliveryPromise'),
    homeFree ? t('freeThreshold', { amount: money(threshold ?? settings.freeShippingThreshold, lang, { decimals: false }) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const payIcon = { cod: Banknote, bank: Landmark, card: CreditCard } as const;
  const payDesc = {
    cod: isPickup ? t('codDescPickup') : t('codDesc'),
    bank: form.isCompany && /^\d{9}$/.test(digits(form.nui)) ? t('bankDescCompany', { nui: digits(form.nui) }) : t('bankDesc'),
    card: t('cardDesc'),
  } as const;
  const submitLabel = payment === 'card' ? t('payNow', { amount: money(totals.total, lang) }) : t('placeOrder');

  const summaryLines = (
    <div className="divide-y divide-dashed divide-line">
      {totals.lines.map((line) => (
        <CompactLine key={line.item.key} line={line} />
      ))}
    </div>
  );

  const termsLink = 'text-brand-700 underline decoration-brand-700/30 underline-offset-[3px] hover:decoration-brand-700';

  return (
    <div className="pb-4">
      {/* Checkout bar */}
      <div className="border-b border-line bg-white/55">
        <div className="container-x flex h-[60px] items-center justify-between gap-4">
          <Link to="/shporta" className="group hidden items-center gap-2 text-[13.5px] font-semibold text-ink-soft hover:text-ink md:inline-flex">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {t('backToCart')}
          </Link>
          <CheckoutSteps current={step} className="mx-auto md:mx-0" />
          <span className="hidden items-center gap-1.5 text-[13px] font-semibold text-brand-700 md:inline-flex">
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
            <span className="shrink-0 text-[15px] font-bold tabular-nums text-ink">{money(totals.total, lang)}</span>
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

        <div className="mt-6 grid items-start gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_430px] xl:gap-14">
          <form id="checkout-form" noValidate onSubmit={onSubmit} className="min-w-0">
            <fieldset disabled={busy} className="space-y-5">
              {/* 1 — Contact */}
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
                <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                  <Input id="f-firstName" label={t('firstName')} required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} onBlur={touch('firstName')} error={err('firstName')} />
                  <Input id="f-lastName" label={t('lastName')} required autoComplete="family-name" value={form.lastName} onChange={set('lastName')} onBlur={touch('lastName')} error={err('lastName')} />
                  <Input
                    id="f-phone"
                    type="tel"
                    inputMode="tel"
                    label={t('phone')}
                    required
                    autoComplete="tel"
                    placeholder="+383 4_ ___ ___"
                    hint={t('phoneHint')}
                    value={form.phone}
                    onChange={set('phone')}
                    onBlur={touch('phone')}
                    error={err('phone')}
                  />
                  <Input
                    id="f-email"
                    type="email"
                    inputMode="email"
                    label={t('email')}
                    required
                    autoComplete="email"
                    placeholder="emri@shembull.com"
                    hint={t('emailHint')}
                    value={form.email}
                    onChange={set('email')}
                    onBlur={touch('email')}
                    error={err('email')}
                  />
                </div>

                {companyField !== 'hidden' && (
                  <div className={cn('mt-6 rounded-2xl p-4 ring-1 ring-inset transition-colors', form.isCompany ? 'bg-lime-soft/50 ring-lime-ink/15' : 'bg-paper ring-line')}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors', form.isCompany ? 'bg-ink text-lime' : 'bg-white text-ink-soft ring-1 ring-line')}>
                          <Building2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[14.5px] font-bold text-ink">{t('asCompany')}</div>
                          <div className="text-[12.5px] text-muted">{t('asCompanyHint')}</div>
                        </div>
                      </div>
                      {companyField !== 'required' && <Switch checked={form.isCompany} onChange={(v) => setForm((f) => ({ ...f, isCompany: v }))} />}
                    </div>
                    <AnimatePresence initial={false}>
                      {form.isCompany && (
                        <motion.div {...reveal} className="overflow-hidden">
                          <div className="grid gap-x-4 gap-y-5 pt-5 sm:grid-cols-2">
                            <Input id="f-company" wrapClassName="sm:col-span-2" label={t('company')} required autoComplete="organization" value={form.company} onChange={set('company')} onBlur={touch('company')} error={err('company')} />
                            <Input id="f-nui" label={t('nui')} required inputMode="numeric" maxLength={11} placeholder={t('nuiPh')} value={form.nui} onChange={set('nui')} onBlur={touch('nui')} error={err('nui')} />
                            <Input
                              id="f-vatNo"
                              label={
                                <>
                                  {t('vatNo')}
                                  <Optional>{t('optional')}</Optional>
                                </>
                              }
                              inputMode="numeric"
                              maxLength={11}
                              placeholder="330 ••• •••"
                              hint={t('vatNoHint')}
                              value={form.vatNo}
                              onChange={set('vatNo')}
                              onBlur={touch('vatNo')}
                              error={err('vatNo')}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </Section>

              {/* 2 — Delivery or pickup */}
              <Section n={2} title={t('s2')} desc={t('s2d')}>
                <div className="grid gap-3">
                  <RadioCard checked={!isPickup} onSelect={() => setDelivery('delivery')} icon={<Truck className="h-5 w-5" />} title={tc('delivery_delivery')} description={homeDesc} aside={homeAside} />
                  {pickupAvailable && (
                    <RadioCard
                      checked={isPickup}
                      onSelect={() => setDelivery('pickup')}
                      icon={<Warehouse className="h-5 w-5" />}
                      title={`${tc('delivery_pickup')} · ${pickupName}`}
                      description={t('pickupDesc', { address: pickupAddress, hours: l(settings.hours) })}
                      aside={<span className="text-brand-700">{tk('free')}</span>}
                    />
                  )}
                </div>

                <AnimatePresence initial={false} mode="wait">
                  {!isPickup ? (
                    <motion.div key="home" {...reveal} className="overflow-hidden">
                      <div className="pt-6">
                        {zones.length > 0 && (
                          <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{t('zonesTitle')}</p>
                            <div className={cn('grid gap-2', zones.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
                              {zones.map((z) => {
                                const active = zone?.id === z.id;
                                return (
                                  <div key={z.id} className={cn('rounded-xl border px-3 py-2.5 transition-colors', active ? 'border-ink bg-ink text-paper' : 'border-dashed border-ink/20 bg-paper/60')}>
                                    <p className={cn('truncate text-[12.5px] font-bold', active ? 'text-lime' : 'text-ink')}>{z.name}</p>
                                    <p className={cn('mt-0.5 text-[12px] tabular-nums', active ? 'text-paper/80' : 'text-muted')}>
                                      {homeFree ? (
                                        <>
                                          <s className="opacity-60">{money(z.fee, lang)}</s> {tk('free')}
                                        </>
                                      ) : (
                                        money(z.fee, lang)
                                      )}{' '}
                                      · {workDays(z.days)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-2">
                          <Select id="f-city" label={t('city')} required autoComplete="address-level2" value={form.city} onChange={set('city')} onBlur={touch('city')} error={err('city')}>
                            <option value="">{t('chooseCity')}</option>
                            {zones.map((z) => (
                              <optgroup key={z.id} label={`${z.name} — ${money(z.fee, lang)} · ${workDays(z.days)}`}>
                                {[...z.cities]
                                  .sort((a, b) => a.localeCompare(b, 'sq'))
                                  .map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                              </optgroup>
                            ))}
                          </Select>
                          <Input
                            id="f-address"
                            label={t('address')}
                            required
                            autoComplete="street-address"
                            placeholder={t('addressPh')}
                            leading={<MapPin className="h-4 w-4" />}
                            value={form.address}
                            onChange={set('address')}
                            onBlur={touch('address')}
                            error={err('address')}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="pickup" {...reveal} className="overflow-hidden">
                      <div className="mt-4 flex gap-3.5 rounded-2xl bg-paper p-4 ring-1 ring-inset ring-line">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 ring-1 ring-line">
                          <MapPin className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 text-[13.5px] leading-snug">
                          <p className="font-bold text-ink">{pickupName}</p>
                          <p className="mt-0.5 text-ink-soft">{pickupAddress}</p>
                          <p className="mt-0.5 text-muted">{l(settings.hours)}</p>
                          <p className="mt-2 text-[12.5px] text-muted">{t('pickupReady')}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-5 grid gap-x-4 sm:grid-cols-2">
                  <Input
                    id="f-date"
                    type="date"
                    min={minDate}
                    label={
                      <>
                        {isPickup ? t('datePickup') : t('date')}
                        <Optional>{t('optional')}</Optional>
                      </>
                    }
                    leading={<CalendarDays className="h-4 w-4" />}
                    hint={t('dateHint')}
                    value={form.date}
                    onChange={set('date')}
                    onBlur={touch('date')}
                    error={err('date')}
                  />
                </div>
                {totals.hasInstallation && (
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-pink-soft/70 px-3.5 py-3 text-[13px] leading-snug text-pink-ink ring-1 ring-inset ring-pink/25">
                    <Stamp className="mt-0.5 h-4 w-4 shrink-0" />
                    {t('dateLogo')}
                  </p>
                )}
              </Section>

              {/* 3 — Payment */}
              <Section n={3} title={t('s3')} desc={t('s3d')}>
                <div className="grid gap-3">
                  {methods.map((m) => {
                    const Icon = payIcon[m];
                    return <RadioCard key={m} checked={payment === m} onSelect={() => setPayment(m)} icon={<Icon className="h-5 w-5" />} title={tc(`pay_${m}`)} description={payDesc[m]} />;
                  })}
                </div>
                <AnimatePresence initial={false}>
                  {payment === 'bank' && !form.isCompany && companyField !== 'hidden' && (
                    <motion.div key="bank" {...reveal} className="overflow-hidden">
                      <p className="mt-3 flex items-start gap-2 rounded-xl bg-paper px-3.5 py-3 text-[13px] leading-snug text-ink-soft ring-1 ring-inset ring-line">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                        <span>
                          {t('bankCompanyHint')}{' '}
                          <button type="button" onClick={() => setForm((f) => ({ ...f, isCompany: true }))} className="font-semibold text-brand-700 underline decoration-brand-700/30 underline-offset-2 hover:decoration-brand-700">
                            {t('asCompany')}
                          </button>
                        </span>
                      </p>
                    </motion.div>
                  )}
                  {payment === 'card' && (
                    <motion.div key="card" {...reveal} className="overflow-hidden">
                      <div className="mt-3 flex gap-3.5 rounded-2xl bg-paper p-4 ring-1 ring-inset ring-line sm:p-5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 ring-1 ring-line">
                          <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-ink">{t('cardPanelTitle')}</p>
                          <p className="mt-1 text-[13px] leading-relaxed text-muted">{t('cardPanelText')}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <CardBrands />
                            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted">
                              <Lock className="h-3 w-3" /> 3-D Secure
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Section>

              {/* 4 — Notes & confirm */}
              <Section n={4} title={t('s4')}>
                <Textarea
                  rows={3}
                  label={
                    <>
                      {t('note')}
                      <Optional>{t('optional')}</Optional>
                    </>
                  }
                  placeholder={t('notePh')}
                  value={form.note}
                  onChange={set('note')}
                />
                {totals.hasInstallation && (
                  <div className="mt-5 flex gap-3 rounded-2xl bg-pink-soft/60 p-4 ring-1 ring-inset ring-pink/25">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-pink-ink ring-1 ring-pink/25">
                      <Stamp className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-ink">{t('logoTitle')}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{t('logoText')}</p>
                    </div>
                  </div>
                )}
                <div className="lg:hidden">
                  <div className="my-6 border-t border-dashed border-ink/15" />
                  <TotalsRows v={view} big />
                </div>
                <div
                  id="f-terms"
                  tabIndex={-1}
                  className={cn('mt-6 rounded-2xl p-4 outline-none ring-1 ring-inset transition-colors', err('terms') ? 'bg-red-50/70 ring-red-300' : 'bg-paper ring-line')}
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
                        <Link to="/faqe/kushtet" target="_blank" className={termsLink}>
                          {t('termsLink')}
                        </Link>
                        {t('termsMid')}
                        <Link to="/faqe/kthimet" target="_blank" className={termsLink}>
                          {t('returnsLink')}
                        </Link>
                      </>
                    }
                    description={t('termsDesc')}
                  />
                  {err('terms') && <p className="mt-2 pl-8 text-xs font-medium text-red-600">{err('terms')}</p>}
                </div>
                <Button type="submit" size="lg" className="mt-5 w-full" loading={busy} iconRight={busy ? undefined : <ArrowRight className="h-4 w-4" />}>
                  {submitLabel}
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-muted">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  {t('afterNote')}
                </p>
              </Section>
            </fieldset>
          </form>

          {/* Sticky summary (desktop) */}
          <aside className="hidden lg:sticky lg:top-[100px] lg:block">
            <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
              <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
                <h2 className="text-[15px] font-bold text-ink">
                  {t('yourOrder')} <span className="font-medium text-muted">· {items(totals.lines.length)}</span>
                </h2>
                <Link to="/shporta" className="text-[13px] font-semibold text-brand-700 hover:underline">
                  {t('edit')}
                </Link>
              </div>
              <div className="no-scrollbar max-h-[300px] overflow-y-auto px-6">{summaryLines}</div>
              <div className="border-t border-line bg-paper/60 px-6 py-5">
                <CouponBox totals={totals} collapsible />
                <div className="my-5 border-t border-dashed border-ink/15" />
                <TotalsRows v={view} big />
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
