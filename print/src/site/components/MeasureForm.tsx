import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarClock, CheckCircle2, ClipboardList, Factory, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useDb } from '@/store/db';
import { useCategories, useSettings } from '@/store/hooks';
import { allCities } from '@/lib/pricing';
import type { InquiryType, Service } from '@/lib/types';
import { cn } from '@/lib/utils';
import { longDate, timeRange } from '@/admin/components/appointments/dates';
import { readRules, webSlot } from '@/admin/components/appointments/rules';

const T = defineDict({
  sq: {
    kind: 'Lloji i kërkesës',
    k_contact: 'Pyetje',
    k_measurement: 'Takim në fabrikë',
    k_quote: 'Ofertë e shpejtë',
    topic: 'Tema',
    t_design: 'Dizajn & prepress',
    t_samples: 'Mostra',
    phonePh: '+383 4_ ___ ___',
    companyPh: 'Emri i biznesit (opsional)',
    invalidEmail: 'Shkruani një e-mail të saktë',
    meetingHint: 'Takimet mbahen në fabrikë, në orarin e punës. Konfirmimin jua dërgojmë me telefon.',
    quoteHint: 'Për ofertë të saktë me përmasa, material, sasi dhe skedarë, përdorni formularin e plotë.',
    quoteLink: 'Formulari i ofertës',
    msgPhContact: 'Si mund t’ju ndihmojmë?',
    msgPhMeeting: 'P.sh. duam të shohim mostra kutish për linjën e re të produkteve',
    slot: 'Termin i përkohshëm: {when}',
    slotHint: 'Termini është në pritje — do ta konfirmojmë me telefon.',
    successQuote: 'Kërkesa për ofertë u pranua. Oferta vjen brenda 24 orësh në {phone}.',
    successMeeting: 'Kërkesa për takim u pranua. Do t’ju telefonojmë në {phone} për ta konfirmuar.',
  },
  en: {
    kind: 'Type of request',
    k_contact: 'Question',
    k_measurement: 'Factory meeting',
    k_quote: 'Quick quote',
    topic: 'Topic',
    t_design: 'Design & prepress',
    t_samples: 'Samples',
    phonePh: '+383 4_ ___ ___',
    companyPh: 'Business name (optional)',
    invalidEmail: 'Enter a valid e-mail',
    meetingHint: 'Meetings take place at the factory during opening hours. We confirm by phone.',
    quoteHint: 'For an exact quote with dimensions, material, quantity and files, use the full quote form.',
    quoteLink: 'Quote form',
    msgPhContact: 'How can we help?',
    msgPhMeeting: 'E.g. we’d like to see box samples for our new product line',
    slot: 'Provisional slot: {when}',
    slotHint: 'Pending — we will confirm it by phone.',
    successQuote: 'Quote request received. Your quote follows within 24 hours on {phone}.',
    successMeeting: 'Meeting request received. We’ll call you on {phone} to confirm it.',
  },
});

const KIND_ICON = { contact: MessageSquare, measurement: Factory, quote: ClipboardList } as const;

/** Appointment services for "meeting at the factory", in order of preference (seed ids, CMS → Terminet). */
const MEETING_SERVICES = ['sv-konsulte', 'sv-vizite'];

/** Appointment service used for "meeting at the factory" requests (falls back to any non-onsite service). */
function meetingService(services: Service[]) {
  return (
    MEETING_SERVICES.map((id) => services.find((s) => s.id === id)).find(Boolean) ??
    services.find((s) => /konsult|consult|fabrik|factory/i.test(`${s.name.sq} ${s.name.en}`) && s.location !== 'onsite') ??
    services.find((s) => s.location && s.location !== 'onsite') ??
    services[0]
  );
}

/**
 * PrintWorks lead form — plain contact, a meeting at the factory (`measurement` = the CRM's
 * "meeting" kind) or a quick quote. Every submission lands in CMS → Kontaktet instantly.
 * Pass `types` to let the visitor switch between kinds. The component keeps its historical name.
 */
export function MeasureForm({
  type = 'contact',
  types,
  productId,
  defaultService,
  defaultMessage,
  className,
  onDone,
}: {
  type?: InquiryType;
  /** Show a switcher between these kinds (e.g. ['contact', 'measurement', 'quote']) */
  types?: InquiryType[];
  productId?: string;
  defaultService?: string;
  defaultMessage?: string;
  className?: string;
  onDone?: () => void;
}) {
  const t = useDict(site);
  const tf = useDict(T);
  const l = useL();
  const lang = useLang();
  const cats = useCategories();
  const settings = useSettings();
  const addInquiry = useDb((s) => s.addInquiry);
  const [kind, setKind] = useState<InquiryType>(type);
  const blank = { name: '', company: '', phone: '', email: '', city: '', service: defaultService ?? '', date: '', message: defaultMessage ?? '' };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<{ name: string; phone: string; kind: InquiryType; slot?: { start: string; durationMin: number } } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const today = new Date().toISOString().slice(0, 10);
  const topics = [...cats.map((c) => l(c.name)), tf('t_design'), tf('t_samples'), t('f_other')];

  /**
   * A meeting request with a preferred date also books a PENDING appointment (10:00, or the next free
   * slot that day) linked to the inquiry. Closed / full day → no booking; the team schedules it by hand.
   */
  const bookMeeting = (inquiryId: string, day: string) => {
    const st = useDb.getState();
    const service = meetingService(st.services);
    if (!service) return undefined;
    const slot = webSlot(day, service, { bookings: st.bookings, services: st.services, rules: readRules(st.settings) });
    if (!slot?.staffId) return undefined;
    const location = service.location && service.location !== 'onsite' ? service.location : (st.settings.locations.find((x) => x.isDefault)?.id ?? 'onsite');
    const res = st.addBooking({
      serviceId: service.id,
      staffId: slot.staffId,
      customerName: form.name.trim(),
      phone: form.phone.trim(),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.city ? { city: form.city } : {}),
      start: slot.start,
      location,
      inquiryId,
      note: [form.company.trim(), form.service, form.message.trim()].filter(Boolean).join(' — ') || undefined,
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
    if (!form.name.trim()) err.name = t('f_required');
    if (!form.phone.trim()) err.phone = t('f_required');
    else if (form.phone.replace(/\D/g, '').length < 8) err.phone = t('f_invalidPhone');
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) err.email = tf('invalidEmail');
    if (kind === 'contact' && !form.message.trim()) err.message = t('f_required');
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 650));
    const inq = addInquiry({
      type: kind,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      company: form.company.trim() || undefined,
      city: form.city || undefined,
      service: form.service || undefined,
      productId,
      message: form.message.trim() || '—',
      preferredDate: kind === 'measurement' ? form.date || undefined : undefined,
    });
    const slot = kind === 'measurement' && form.date ? bookMeeting(inq.id, form.date) : undefined;
    setBusy(false);
    setSent({ name: form.name.trim().split(' ')[0], phone: form.phone.trim(), kind, slot });
    onDone?.();
  };

  if (sent) {
    const text = sent.kind === 'quote' ? tf('successQuote', { phone: sent.phone }) : sent.kind === 'measurement' ? tf('successMeeting', { phone: sent.phone }) : t('f_successText', { phone: sent.phone });
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-2xl bg-white p-8 text-center ring-1 ring-line sm:p-12', className)} role="status">
        <span className="grid h-14 w-14 animate-pop place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/15">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="display mt-5 text-[30px] leading-tight text-ink">{t('f_successTitle', { name: sent.name })}</h3>
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">{text}</p>
        {sent.slot && (
          <div className="mt-5 flex max-w-sm items-start gap-3 rounded-xl bg-paper px-4 py-3 text-left ring-1 ring-line">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <span className="text-sm">
              <span className="block font-semibold text-ink">{tf('slot', { when: `${longDate(sent.slot.start, lang)}, ${timeRange(sent.slot.start, sent.slot.durationMin)}` })}</span>
              <span className="mt-0.5 block text-muted">{tf('slotHint')}</span>
            </span>
          </div>
        )}
        <Button
          variant="outline"
          className="mt-7"
          onClick={() => {
            setSent(null);
            setForm({ ...blank, message: '' });
          }}
        >
          {t('f_newRequest')}
        </Button>
      </div>
    );
  }

  const kinds = types && types.length > 1 ? types : null;
  const kindLabel = (k: InquiryType) => tf(k === 'measurement' ? 'k_measurement' : k === 'quote' ? 'k_quote' : 'k_contact');

  return (
    <form onSubmit={submit} noValidate className={cn('rounded-2xl bg-white p-6 ring-1 ring-line sm:p-8', className)}>
      {kinds && (
        <fieldset className="mb-6">
          <legend className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{tf('kind')}</legend>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-paper p-1 ring-1 ring-line" role="radiogroup">
            {kinds.map((k) => {
              const Icon = KIND_ICON[k];
              const on = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setKind(k)}
                  className={cn(
                    'flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[12.5px] font-semibold leading-tight transition-colors sm:flex-row sm:gap-2 sm:text-[13.5px]',
                    on ? 'bg-ink text-white shadow-sm' : 'text-ink-soft hover:bg-white hover:text-ink',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-center">{kindLabel(k)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {kind === 'quote' && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13.5px] leading-snug text-brand-900">{tf('quoteHint')}</p>
          <Link to="/kerko-oferte" className="inline-flex shrink-0 items-center gap-1.5 text-[13.5px] font-semibold text-brand-700 hover:underline">
            {tf('quoteLink')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t('f_name')} required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <Input label={t('f_company')} value={form.company} onChange={set('company')} placeholder={tf('companyPh')} autoComplete="organization" />
        <Input label={t('f_phone')} required type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder={tf('phonePh')} autoComplete="tel" />
        <Input label={t('f_email')} type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <Select label={t('f_city')} value={form.city} onChange={set('city')}>
          <option value="">{t('f_chooseCity')}</option>
          {allCities(settings).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={t('f_other')}>{t('f_other')}</option>
        </Select>
        {kind === 'measurement' ? (
          <Input label={t('f_date')} type="date" min={today} value={form.date} onChange={set('date')} hint={tf('meetingHint')} />
        ) : (
          <Select label={tf('topic')} value={form.service} onChange={set('service')}>
            <option value="">{t('f_service')}</option>
            {topics.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        )}
        {kind === 'measurement' && (
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">{t('f_service')}</span>
            <div className="flex flex-wrap gap-2">
              {topics.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={form.service === s}
                  onClick={() => setForm((f) => ({ ...f, service: f.service === s ? '' : s }))}
                  className={cn(
                    'rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
                    form.service === s ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-soft hover:border-ink/30',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <Textarea
          label={t('f_message')}
          required={kind === 'contact'}
          rows={4}
          value={form.message}
          onChange={set('message')}
          placeholder={kind === 'quote' ? t('f_messagePh') : kind === 'measurement' ? tf('msgPhMeeting') : tf('msgPhContact')}
          error={errors.message}
          wrapClassName="sm:col-span-2"
        />
      </div>
      <div className="mt-6 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted sm:max-w-[55%]">{t('f_privacy')}</p>
        <Button type="submit" size="lg" loading={busy} iconRight={<Send className="h-4 w-4" />}>
          {t('f_submit')}
        </Button>
      </div>
    </form>
  );
}
