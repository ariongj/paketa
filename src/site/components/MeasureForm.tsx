import { useMemo, useState, type ReactNode } from 'react';
import { CalendarClock, Check, CheckCircle2, Package, Send, Stamp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useDb } from '@/store/db';
import { useCategories, useSettings } from '@/store/hooks';
import { allCities } from '@/lib/pricing';
import type { InquiryType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { longDate, timeRange } from '@/admin/components/appointments/dates';
import { readRules, webSlot } from '@/admin/components/appointments/rules';

/**
 * Paketoje lead form (all three inquiry types land in Admin → Kontakti):
 * - `measurement` = free SAMPLES request (business, venue type, products of interest, optional visit date)
 * - `quote`       = wholesale / logo-print quote (company, products & quantities, logo yes/no)
 * - `contact`     = plain message
 */
const T = defineDict({
  me: {
    company: 'Naziv lokala / firme',
    companyOpt: 'Firma (opciono)',
    contactPerson: 'Kontakt osoba',
    venue: 'Vrsta lokala',
    v_cafe: 'Kafić',
    v_restaurant: 'Restoran',
    v_fastfood: 'Brza hrana',
    v_pastry: 'Poslastičarnica',
    v_sushi: 'Suši',
    v_catering: 'Ketering',
    v_other: 'Drugo',
    interest: 'Koji proizvodi vas zanimaju?',
    interestHint: 'Izaberite jednu ili više kategorija — pripremamo uzorak iz svake.',
    visit: 'Posjeta sa uzorcima (opciono)',
    visitHint: 'Izaberite dan i donosimo uzorke u vaš lokal.',
    products: 'Proizvodi i količine',
    productsPh: 'Npr. čaše F95 400 ml — 5 kartona mjesečno, clip poklopci — 3 kartona',
    logo: 'Štampa logotipa',
    logoYes: 'Da, sa našim logom',
    logoNo: 'Ne, bez loga',
    samplesMsgPh: 'Npr. otvaramo kafić u Prištini i tražimo čaše od 400 ml i poklopce koji ne cure.',
    contactMsgPh: 'Kako vam možemo pomoći?',
    samplesAuto: 'Zahtjev za besplatne uzorke.',
    quoteAuto: 'Zahtjev za veleprodajnu ponudu.',
    l_products: 'Proizvodi',
    l_venue: 'Lokal',
    l_logo: 'Logo',
    yes: 'da',
    no: 'ne',
    svcSamples: 'Besplatni uzorci',
    svcQuote: 'Veleprodaja',
    svcQuoteLogo: 'Veleprodaja + štampa logotipa',
    submitSamples: 'Zatraži besplatne uzorke',
    submitQuote: 'Zatraži ponudu',
    submitContact: 'Pošalji poruku',
    okSamples: 'Pripremamo uzorke u roku od 1–2 radna dana. Javljamo vam se na {phone} da dogovorimo preuzimanje ili dostavu.',
    okQuote: 'Ponudu sa veleprodajnim cijenama šaljemo u roku od 24 sata — na e-mail ili na {phone}.',
    slot: 'Okvirni termin posjete: {when}',
    slotHint: 'Termin čeka potvrdu — potvrdićemo ga telefonom.',
    phonePh: '+383 4_ ___ ___',
    noCompany: 'Unesite naziv lokala ili firme',
    noProducts: 'Navedite proizvode i okvirne količine',
  },
  sq: {
    company: 'Emri i lokalit / biznesit',
    companyOpt: 'Biznesi (opsionale)',
    contactPerson: 'Personi kontaktues',
    venue: 'Lloji i lokalit',
    v_cafe: 'Kafiteri',
    v_restaurant: 'Restorant',
    v_fastfood: 'Fast food',
    v_pastry: 'Pastiçeri',
    v_sushi: 'Sushi',
    v_catering: 'Catering',
    v_other: 'Tjetër',
    interest: 'Cilat produkte ju interesojnë?',
    interestHint: 'Zgjidhni një ose më shumë kategori — përgatisim mostër nga secila.',
    visit: 'Vizitë me mostra (opsionale)',
    visitHint: 'Zgjidhni ditën dhe ua sjellim mostrat në lokal.',
    products: 'Produktet dhe sasitë',
    productsPh: 'P.sh. gota F95 400 ml — 5 kartonë në muaj, kapakë clip — 3 kartonë',
    logo: 'Printim me logo',
    logoYes: 'Po, me logon tonë',
    logoNo: 'Jo, pa logo',
    samplesMsgPh: 'P.sh. po hapim një kafiteri në Prishtinë dhe kërkojmë gota 400 ml me kapakë që nuk derdhen.',
    contactMsgPh: 'Si mund t’ju ndihmojmë?',
    samplesAuto: 'Kërkesë për mostra falas.',
    quoteAuto: 'Kërkesë për ofertë me shumicë.',
    l_products: 'Produktet',
    l_venue: 'Lokali',
    l_logo: 'Logo',
    yes: 'po',
    no: 'jo',
    svcSamples: 'Mostra falas',
    svcQuote: 'Shumicë',
    svcQuoteLogo: 'Shumicë + printim me logo',
    submitSamples: 'Kërko mostra falas',
    submitQuote: 'Kërko ofertë',
    submitContact: 'Dërgo mesazhin',
    okSamples: 'Mostrat i përgatisim brenda 1–2 ditësh pune. Ju telefonojmë në {phone} për t’i marrë në depo ose për t’jua dërguar.',
    okQuote: 'Ofertën me çmime shumice e dërgojmë brenda 24 orëve — në email ose në {phone}.',
    slot: 'Termini i përkohshëm i vizitës: {when}',
    slotHint: 'Termini është në pritje — do ta konfirmojmë me telefon.',
    phonePh: '+383 4_ ___ ___',
    noCompany: 'Shkruani emrin e lokalit ose biznesit',
    noProducts: 'Shkruani produktet dhe sasitë e përafërta',
  },
  en: {
    company: 'Venue / business name',
    companyOpt: 'Company (optional)',
    contactPerson: 'Contact person',
    venue: 'Type of venue',
    v_cafe: 'Café / bar',
    v_restaurant: 'Restaurant',
    v_fastfood: 'Fast food',
    v_pastry: 'Pastry & ice cream',
    v_sushi: 'Sushi',
    v_catering: 'Catering',
    v_other: 'Other',
    interest: 'Which products are you interested in?',
    interestHint: 'Pick one or more categories — we prepare a sample from each.',
    visit: 'Visit with samples (optional)',
    visitHint: 'Pick a day and we bring the samples to your venue.',
    products: 'Products and quantities',
    productsPh: 'E.g. F95 400 ml cups — 5 cartons a month, clip lids — 3 cartons',
    logo: 'Logo print',
    logoYes: 'Yes, with our logo',
    logoNo: 'No, plain',
    samplesMsgPh: 'E.g. we’re opening a café in Prishtina and need 400 ml cups with lids that don’t leak.',
    contactMsgPh: 'How can we help?',
    samplesAuto: 'Free samples request.',
    quoteAuto: 'Wholesale quote request.',
    l_products: 'Products',
    l_venue: 'Venue',
    l_logo: 'Logo',
    yes: 'yes',
    no: 'no',
    svcSamples: 'Free samples',
    svcQuote: 'Wholesale',
    svcQuoteLogo: 'Wholesale + logo print',
    submitSamples: 'Request free samples',
    submitQuote: 'Request a quote',
    submitContact: 'Send message',
    okSamples: 'We prepare your samples within 1–2 working days and call you on {phone} to arrange pickup or delivery.',
    okQuote: 'You’ll get a quote with wholesale prices within 24 hours — by email or on {phone}.',
    slot: 'Provisional visit: {when}',
    slotHint: 'Pending — we will confirm it by phone.',
    phonePh: '+383 4_ ___ ___',
    noCompany: 'Enter your venue or business name',
    noProducts: 'List the products and rough quantities',
  },
});

/** Venue types for the samples form (ids are stable; labels come from the dictionary). */
export const VENUES = ['cafe', 'restaurant', 'fastfood', 'pastry', 'sushi', 'catering', 'other'] as const;
export type Venue = (typeof VENUES)[number];

/** Booking service for "bring samples to my venue" (falls back to any on-site service). */
const SAMPLES_SERVICE = 'sv-mostra';

const EMPTY = { name: '', company: '', phone: '', email: '', city: '', date: '', products: '', message: '' };

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[13.5px] font-semibold transition-colors',
        on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink-soft hover:border-brand-600/40 hover:text-ink',
      )}
    >
      {on && <Check className="-ml-1 h-3.5 w-3.5" strokeWidth={3} />}
      {children}
    </button>
  );
}

function GroupLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2.5">
      <span className="block text-[13px] font-semibold text-ink-soft">{children}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
    </div>
  );
}

/**
 * Lead form for free samples, wholesale / logo-print quotes and plain contact.
 * Submissions land in Admin → Kontakti instantly (`addInquiry`).
 */
export function MeasureForm({
  type = 'measurement',
  productId,
  defaultService,
  defaultMessage,
  defaultLogo = false,
  className,
  onDone,
}: {
  type?: InquiryType;
  productId?: string;
  /** Preselects a venue type (VENUES id) or a category (id / slug) on the samples form */
  defaultService?: string;
  /** Prefills the message (quote: the "products & quantities" field) */
  defaultMessage?: string;
  /** Quote form: logo print preselected */
  defaultLogo?: boolean;
  className?: string;
  onDone?: () => void;
}) {
  const ts = useDict(site);
  const t = useDict(T);
  const l = useL();
  const lang = useLang();
  const cats = useCategories();
  const settings = useSettings();
  const addInquiry = useDb((s) => s.addInquiry);

  const sampleCats = useMemo(() => cats.filter((c) => !c.soon), [cats]);
  const initialVenue = (VENUES as readonly string[]).includes(defaultService ?? '') ? (defaultService as Venue) : null;

  const [form, setForm] = useState({ ...EMPTY, products: type === 'quote' ? (defaultMessage ?? '') : '', message: type === 'quote' ? '' : (defaultMessage ?? '') });
  const [venue, setVenue] = useState<Venue | null>(initialVenue);
  const [interest, setInterest] = useState<string[]>(() => {
    const c = defaultService ? cats.find((x) => x.id === defaultService || x.slug === defaultService) : undefined;
    return c ? [c.id] : [];
  });
  const [logo, setLogo] = useState(defaultLogo);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<{ type: InquiryType; name: string; phone: string; slot?: { start: string; durationMin: number } } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const today = new Date().toISOString().slice(0, 10);

  const samples = type === 'measurement';
  const quote = type === 'quote';
  const venueLabel = (v: Venue) => t(`v_${v}` as const);
  const catLabels = sampleCats.filter((c) => interest.includes(c.id)).map((c) => l(c.name));

  /**
   * A samples request with a preferred date also books a PENDING visit (10:00, or the next free slot
   * that day) linked to the inquiry. Closed / full day → no booking; the team schedules it by hand.
   */
  const bookVisit = (inquiryId: string, day: string, note: string) => {
    const st = useDb.getState();
    const service = st.services.find((x) => x.id === SAMPLES_SERVICE) ?? st.services.find((x) => x.location === 'onsite');
    if (!service) return undefined;
    const slot = webSlot(day, service, { bookings: st.bookings, services: st.services, rules: readRules(st.settings) });
    if (!slot?.staffId) return undefined;
    const res = st.addBooking({
      serviceId: service.id,
      staffId: slot.staffId,
      customerName: [form.name.trim(), form.company.trim()].filter(Boolean).join(' — '),
      phone: form.phone.trim(),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.city ? { city: form.city } : {}),
      start: slot.start,
      location: service.location ?? 'onsite',
      inquiryId,
      note: note || undefined,
      status: 'pending',
    });
    if (!res.ok) return undefined;
    // addBooking marks the inquiry as scheduled + seen — a web request must stay new/unseen in the inbox.
    st.updateInquiry(inquiryId, { status: 'new', seen: false, scheduledAt: res.booking.start });
    return { start: res.booking.start, durationMin: res.booking.durationMin };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = ts('f_required');
    if (!form.phone.trim()) err.phone = ts('f_required');
    else if (form.phone.replace(/\D/g, '').length < 8) err.phone = ts('f_invalidPhone');
    if (samples && !form.company.trim()) err.company = t('noCompany');
    if (quote && !form.products.trim()) err.products = t('noProducts');
    if (type === 'contact' && !form.message.trim()) err.message = ts('f_required');
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 650));

    const msg = form.message.trim();
    let message = msg || '—';
    let service: string | undefined;
    if (samples) {
      service = [t('svcSamples'), venue ? venueLabel(venue) : null].filter(Boolean).join(' · ');
      message = [
        msg || t('samplesAuto'),
        '',
        venue ? `${t('l_venue')}: ${venueLabel(venue)}` : null,
        catLabels.length ? `${t('l_products')}: ${catLabels.join(', ')}` : null,
      ]
        .filter((x) => x !== null)
        .join('\n')
        .trim();
    } else if (quote) {
      service = logo ? t('svcQuoteLogo') : t('svcQuote');
      message = [form.products.trim(), '', `${t('l_logo')}: ${logo ? t('yes') : t('no')}`, msg ? `\n${msg}` : null].filter((x) => x !== null).join('\n');
    }

    const inq = addInquiry({
      type,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      city: form.city || undefined,
      company: form.company.trim() || undefined,
      service,
      productId,
      message,
      preferredDate: samples ? form.date || undefined : undefined,
    });
    const slot = samples && form.date ? bookVisit(inq.id, form.date, [venue ? venueLabel(venue) : '', catLabels.join(', ')].filter(Boolean).join(' — ')) : undefined;
    setBusy(false);
    setSent({ type, name: form.name.trim().split(' ')[0], phone: form.phone.trim(), slot });
    onDone?.();
  };

  if (sent && sent.type === type) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-3xl bg-white p-8 text-center ring-1 ring-line sm:p-10', className)}>
        <span className="relative grid h-16 w-16 animate-pop place-items-center rounded-full bg-lime text-brand-700">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="display mt-5 text-3xl text-ink">{ts('f_successTitle', { name: sent.name })}</h3>
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
          {sent.type === 'measurement' ? t('okSamples', { phone: sent.phone }) : sent.type === 'quote' ? t('okQuote', { phone: sent.phone }) : ts('f_successText', { phone: sent.phone })}
        </p>
        {sent.slot && (
          <div className="mt-5 flex max-w-sm items-start gap-3 rounded-2xl bg-sand/60 px-4 py-3 text-left ring-1 ring-line">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <span className="text-sm">
              <span className="block font-semibold text-ink">{t('slot', { when: `${longDate(sent.slot.start, lang)}, ${timeRange(sent.slot.start, sent.slot.durationMin)}` })}</span>
              <span className="mt-0.5 block text-muted">{t('slotHint')}</span>
            </span>
          </div>
        )}
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setSent(null);
            setForm({ ...EMPTY });
            setVenue(null);
            setInterest([]);
            setLogo(defaultLogo);
          }}
        >
          {ts('f_newRequest')}
        </Button>
      </div>
    );
  }

  const SubmitIcon = samples ? Package : quote ? Stamp : Send;

  return (
    <form onSubmit={submit} noValidate className={cn('rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8', className)} data-lead-form={type}>
      <div className="grid gap-4 sm:grid-cols-2">
        {type !== 'contact' && (
          <Input
            label={samples ? t('company') : t('companyOpt')}
            required={samples}
            value={form.company}
            onChange={set('company')}
            error={errors.company}
            autoComplete="organization"
            name="company"
          />
        )}
        <Input label={type === 'contact' ? ts('f_name') : t('contactPerson')} required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" name="name" />

        {samples && (
          <div className="sm:col-span-2">
            <GroupLabel>{t('venue')}</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {VENUES.map((v) => (
                <Chip key={v} on={venue === v} onClick={() => setVenue((cur) => (cur === v ? null : v))}>
                  {venueLabel(v)}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {samples && sampleCats.length > 0 && (
          <div className="sm:col-span-2">
            <GroupLabel hint={t('interestHint')}>{t('interest')}</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {sampleCats.map((c) => (
                <Chip key={c.id} on={interest.includes(c.id)} onClick={() => setInterest((cur) => (cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]))}>
                  {l(c.name)}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <Input label={ts('f_phone')} required type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder={t('phonePh')} autoComplete="tel" name="phone" />
        <Input label={ts('f_email')} type="email" value={form.email} onChange={set('email')} autoComplete="email" name="email" />

        {type !== 'contact' && (
          <Select label={ts('f_city')} value={form.city} onChange={set('city')} name="city">
            <option value="">{ts('f_chooseCity')}</option>
            {allCities(settings).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
        {samples && <Input label={t('visit')} type="date" min={today} value={form.date} onChange={set('date')} hint={t('visitHint')} name="date" />}

        {quote && (
          <div>
            <GroupLabel>{t('logo')}</GroupLabel>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-sand/70 p-1 ring-1 ring-line" role="radiogroup" aria-label={t('logo')}>
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  role="radio"
                  aria-checked={logo === v}
                  onClick={() => setLogo(v)}
                  className={cn('h-9 rounded-full px-3 text-[13px] font-semibold transition-colors', logo === v ? 'bg-white text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink')}
                >
                  {v ? t('logoYes') : t('logoNo')}
                </button>
              ))}
            </div>
          </div>
        )}

        {quote && (
          <Textarea
            label={t('products')}
            required
            rows={3}
            value={form.products}
            onChange={set('products')}
            placeholder={t('productsPh')}
            error={errors.products}
            wrapClassName="sm:col-span-2"
            name="products"
          />
        )}

        <Textarea
          label={ts('f_message')}
          required={type === 'contact'}
          rows={quote ? 2 : 3}
          value={form.message}
          onChange={set('message')}
          placeholder={samples ? t('samplesMsgPh') : quote ? ts('f_messagePh') : t('contactMsgPh')}
          error={errors.message}
          wrapClassName="sm:col-span-2"
          name="message"
        />
      </div>
      <div className="mt-6 flex flex-col gap-3 border-t border-dashed border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted sm:max-w-[55%]">{ts('f_privacy')}</p>
        <Button type="submit" size="lg" loading={busy} icon={<SubmitIcon className="h-4 w-4" />}>
          {samples ? t('submitSamples') : quote ? t('submitQuote') : t('submitContact')}
        </Button>
      </div>
    </form>
  );
}
