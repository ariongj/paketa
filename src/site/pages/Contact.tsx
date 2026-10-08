import type { ComponentType, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, ArrowUpRight, Clock, Gift, Mail, MapPin, MessageSquareText, Phone, RotateCcw, Stamp, Truck } from 'lucide-react';
import type { HomeSection, InquiryType } from '@/lib/types';
import { Accent, Accordion, Reveal } from '@/components/ui/misc';
import { InstagramIcon, ViberIcon, WhatsAppIcon } from '@/components/brand/Social';
import { PageHero, SectionHeading } from '@/site/components/SectionHeading';
import { MeasureForm } from '@/site/components/MeasureForm';
import { MapCard } from '@/site/components/content/MapCard';
import { REFUND_EMAIL, telHref } from '@/site/components/content/posts';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { ACCENT_ON_DARK } from '@/site/components/company/Blocks';
import { defineDict, useDict, useL } from '@/i18n';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    title: 'Kontakt',
    eyebrow: 'Kontakt',
    heroTitle: 'Razgovarajmo o *vašoj ambalaži*',
    heroText: 'Pozovite, pišite na WhatsApp ili svratite u naš magacin u Suhodolu, Mitrovica. Na svaki upit odgovaramo istog radnog dana.',
    replyBadge: 'Odgovaramo istog dana',
    deliveryBadge: 'Dostava širom Kosova',
    phone: 'Telefon',
    phoneHint: 'Pozovite nas direktno',
    email: 'E-mail',
    emailHint: 'Za ponude, logotipe i fakture',
    address: 'Magacin',
    addressHint: 'Prikaži na mapi',
    hours: 'Radno vrijeme',
    hoursHint: 'Preuzimanje narudžbi u magacinu',
    socialTitle: 'Brže preko *WhatsApp-a*',
    socialText: 'Pošaljite fotografiju proizvoda ili vaš logo — odgovaramo odmah tokom radnog vremena.',
    whatsapp: 'WhatsApp',
    viber: 'Viber',
    formEyebrow: 'Pišite nam',
    formTitle: 'Poruka, uzorci ili *ponuda*',
    formText: 'Izaberite šta vam treba — zahtjev stiže direktno našem timu za prodaju.',
    tab_contact: 'Poruka',
    tab_samples: 'Besplatni uzorci',
    tab_quote: 'Veleprodajna ponuda',
    returnsTitle: 'Povrat robe',
    returnsText: 'Nekorišćenu robu u originalnom pakovanju možete vratiti u roku od 5 dana od prijema. Pišite nam na:',
    returnsPolicy: 'Pravila povrata',
    faqHelpTitle: 'Niste pronašli odgovor?',
    faqHelpText: 'Pozovite nas — tim prodaje je dostupan tokom cijelog radnog vremena.',
  },
  sq: {
    title: 'Kontakti',
    eyebrow: 'Kontakti',
    heroTitle: 'Të flasim për *paketimin tuaj*',
    heroText: 'Na telefononi, na shkruani në WhatsApp ose ejani në depon tonë në Suhodoll, Mitrovicë. Çdo kërkese i përgjigjemi të njëjtën ditë pune.',
    replyBadge: 'Përgjigjemi të njëjtën ditë',
    deliveryBadge: 'Dërgesë në gjithë Kosovën',
    phone: 'Telefoni',
    phoneHint: 'Na telefononi direkt',
    email: 'Email',
    emailHint: 'Për oferta, logo dhe fatura',
    address: 'Depoja',
    addressHint: 'Shfaq në hartë',
    hours: 'Orari',
    hoursHint: 'Marrje e porosive në depo',
    socialTitle: 'Më shpejt në *WhatsApp*',
    socialText: 'Na dërgoni foton e produktit ose logon tuaj — përgjigjemi menjëherë gjatë orarit të punës.',
    whatsapp: 'WhatsApp',
    viber: 'Viber',
    formEyebrow: 'Na shkruani',
    formTitle: 'Mesazh, mostra apo *ofertë*',
    formText: 'Zgjidhni çfarë ju nevojitet — kërkesa i shkon drejtpërdrejt ekipit tonë të shitjes.',
    tab_contact: 'Mesazh',
    tab_samples: 'Mostra falas',
    tab_quote: 'Ofertë shumice',
    returnsTitle: 'Kthimi i mallit',
    returnsText: 'Mallin e papërdorur, në paketimin origjinal, mund ta ktheni brenda 5 ditëve nga pranimi. Na shkruani në:',
    returnsPolicy: 'Politika e kthimit',
    faqHelpTitle: 'Nuk e gjetët përgjigjen?',
    faqHelpText: 'Na telefononi — ekipi i shitjes është në dispozicion gjatë gjithë orarit.',
  },
  en: {
    title: 'Contact',
    eyebrow: 'Contact',
    heroTitle: 'Let’s talk about *your packaging*',
    heroText: 'Call, message us on WhatsApp or drop by our warehouse in Suhodoll, Mitrovica. We reply to every enquiry the same working day.',
    replyBadge: 'Same-day replies',
    deliveryBadge: 'Delivery across Kosovo',
    phone: 'Phone',
    phoneHint: 'Call us directly',
    email: 'Email',
    emailHint: 'For quotes, logos and invoices',
    address: 'Warehouse',
    addressHint: 'Show on map',
    hours: 'Opening hours',
    hoursHint: 'Order pickup at the warehouse',
    socialTitle: 'Faster on *WhatsApp*',
    socialText: 'Send us a photo of the product or your logo — we reply right away during opening hours.',
    whatsapp: 'WhatsApp',
    viber: 'Viber',
    formEyebrow: 'Write to us',
    formTitle: 'A message, samples or a *quote*',
    formText: 'Pick what you need — your request goes straight to our sales team.',
    tab_contact: 'Message',
    tab_samples: 'Free samples',
    tab_quote: 'Wholesale quote',
    returnsTitle: 'Returns',
    returnsText: 'Unused goods in their original packaging can be returned within 5 days of receipt. Write to us at:',
    returnsPolicy: 'Returns policy',
    faqHelpTitle: 'Didn’t find your answer?',
    faqHelpText: 'Give us a call — our sales team is available throughout opening hours.',
  },
});

type FaqData = Extract<HomeSection, { type: 'faq' }>;

/** ?lloji=mostra | oferte  ↔  inquiry type */
const TYPE_BY_PARAM: Record<string, InquiryType> = { mostra: 'measurement', oferte: 'quote' };
const PARAM_BY_TYPE: Record<InquiryType, string> = { contact: '', measurement: 'mostra', quote: 'oferte' };

/** Contact tile — compact icon-left row on phones, tall card with the icon on top from `sm` up. */
function ContactCard({ icon: Icon, label, hint, href, external, children }: { icon: ComponentType<{ className?: string }>; label: string; hint?: string; href?: string; external?: boolean; children: ReactNode }) {
  const inner = (
    <>
      <div className="flex flex-1 gap-4 sm:flex-col sm:gap-0">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </span>
        <div className={cn('flex min-w-0 flex-1 flex-col sm:mt-7 sm:pr-0', href && 'pr-6')}>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{label}</div>
          <div className="mt-1.5 break-words text-[17px] font-semibold leading-snug text-ink sm:mt-2 sm:text-[18px]">{children}</div>
          {hint && <div className={cn('mt-auto pt-2.5 text-[13.5px] leading-snug text-muted sm:pt-4', href && 'transition-colors group-hover:text-ink')}>{hint}</div>}
        </div>
      </div>
      {href && <ArrowUpRight className="absolute right-5 top-5 h-5 w-5 text-ink/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600 sm:right-7 sm:top-7" />}
    </>
  );
  const cls = 'group relative flex h-full flex-col rounded-3xl bg-white p-5 ring-1 ring-line sm:p-7';
  if (!href) return <div className={cls}>{inner}</div>;
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={cn(cls, 'transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-32px_rgba(15,29,22,0.5)] hover:ring-ink/15')}
    >
      {inner}
    </a>
  );
}

export default function Contact() {
  const t = useDict(T);
  const l = useL();
  const settings = useSettings();
  const faq = useDb((s) => s.home.find((h): h is FaqData => h.type === 'faq'));
  const returnsPage = useDb((s) => s.pages.find((p) => p.published && p.slug === 'kthimet'));
  const [params, setParams] = useSearchParams();
  usePageTitle(t('title'));

  const type: InquiryType = TYPE_BY_PARAM[params.get('lloji') ?? ''] ?? 'contact';
  const selectType = (next: InquiryType) => {
    const p = new URLSearchParams(params);
    if (PARAM_BY_TYPE[next]) p.set('lloji', PARAM_BY_TYPE[next]);
    else p.delete('lloji');
    if (next !== 'quote') p.delete('logo');
    setParams(p, { replace: true, preventScrollReset: true });
  };

  // Tolerate "@handle" or a pasted profile URL in the CMS settings.
  const igHandle = (settings.instagram ?? '')
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '');
  const instagram = `https://www.instagram.com/${igHandle}/`;
  const waDigits = (settings.whatsapp ?? '').replace(/\D/g, '');
  const hours = l(settings.hours)
    .split(/\s*·\s*/)
    .filter(Boolean);

  const tabs: { id: InquiryType; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { id: 'contact', label: t('tab_contact'), icon: MessageSquareText },
    { id: 'measurement', label: t('tab_samples'), icon: Gift },
    { id: 'quote', label: t('tab_quote'), icon: Stamp },
  ];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroText')} crumbs={[{ label: t('title') }]}>
        <div className="mt-8 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink ring-1 ring-line">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            {t('replyBadge')}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink ring-1 ring-line">
            <Truck className="h-3.5 w-3.5 text-brand-600" />
            {t('deliveryBadge')}
          </span>
        </div>
      </PageHero>

      {/* Contact cards */}
      <section className="pb-16 pt-12 sm:pb-20 sm:pt-16">
        <div className="container-x">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            <Reveal className="h-full">
              <ContactCard icon={Phone} label={t('phone')} hint={t('phoneHint')} href={telHref(settings.phone)}>
                {settings.phone}
                {settings.phone2 ? <span className="block text-[15px] font-medium text-muted">{settings.phone2}</span> : null}
              </ContactCard>
            </Reveal>
            <Reveal delay={70} className="h-full">
              <ContactCard icon={Mail} label={t('email')} hint={t('emailHint')} href={`mailto:${settings.email}`}>
                {settings.email}
              </ContactCard>
            </Reveal>
            <Reveal delay={140} className="h-full">
              <ContactCard icon={MapPin} label={t('address')} hint={t('addressHint')} href={settings.mapUrl} external>
                {settings.address}
                <span className="block text-[15px] font-medium text-muted">{settings.city}</span>
              </ContactCard>
            </Reveal>
            <Reveal delay={210} className="h-full">
              <ContactCard icon={Clock} label={t('hours')} hint={t('hoursHint')}>
                {hours.map((h) => (
                  <span key={h} className="block">
                    {h}
                  </span>
                ))}
              </ContactCard>
            </Reveal>
          </div>

          {/* WhatsApp / social strip */}
          {(igHandle || waDigits) && (
            <Reveal className="mt-5">
              <div className="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-brand-700 p-6 text-white sm:p-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="bg-grain pointer-events-none absolute inset-0" />
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-signal/40 blur-3xl" />
                <div className="relative flex items-center gap-5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#25D366] text-white shadow-lg">
                    <WhatsAppIcon className="h-7 w-7" />
                  </span>
                  <div>
                    <h2 className="display text-[26px] leading-tight sm:text-[30px]">
                      <Accent text={t('socialTitle')} accentClassName={ACCENT_ON_DARK} />
                    </h2>
                    <p className="mt-1 text-[14.5px] text-white/70">{t('socialText')}</p>
                  </div>
                </div>
                <div className="relative flex flex-wrap gap-2">
                  {waDigits && (
                    <>
                      <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-ink transition hover:bg-[#b3f560]">
                        <WhatsAppIcon className="h-4 w-4" />
                        {t('whatsapp')}
                      </a>
                      <a href={`viber://chat?number=%2B${waDigits}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                        <ViberIcon className="h-4 w-4" />
                        {t('viber')}
                      </a>
                    </>
                  )}
                  {igHandle && (
                    <a href={instagram} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                      <InstagramIcon className="h-4 w-4" />@{igHandle}
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Form + map */}
      <section id="forma" className="scroll-mt-24 bg-sand/60 py-20 sm:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <Reveal>
            <SectionHeading eyebrow={t('formEyebrow')} title={t('formTitle')} subtitle={t('formText')} />
            <div className="mt-8 grid grid-cols-3 gap-1 rounded-full bg-white p-1 ring-1 ring-line" role="tablist" aria-label={t('formEyebrow')}>
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={type === id}
                  onClick={() => selectType(id)}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-2 py-1.5 text-[13px] font-semibold leading-tight transition-colors sm:text-[14px]',
                    type === id ? 'bg-brand-600 text-white shadow-[0_8px_18px_-10px_var(--color-brand-700)]' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  <Icon className="hidden h-4 w-4 shrink-0 sm:block" />
                  <span className="text-center">{label}</span>
                </button>
              ))}
            </div>
            <MeasureForm type={type} defaultLogo={params.get('logo') === '1'} className="mt-4 shadow-[0_30px_60px_-45px_rgba(15,29,22,0.45)] lg:p-9" />
          </Reveal>
          <Reveal delay={120} className="flex h-full flex-col gap-4">
            <MapCard className="flex-1 shadow-[0_30px_60px_-45px_rgba(15,29,22,0.45)]" />
            <div className="flex items-start gap-4 rounded-3xl border-2 border-dashed border-brand-600/25 bg-white/70 p-5 sm:p-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pink-soft text-pink-ink">
                <RotateCcw className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-ink">{t('returnsTitle')}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">
                  {t('returnsText')}{' '}
                  <a href={`mailto:${REFUND_EMAIL}`} className="font-semibold text-brand-700 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-600">
                    {REFUND_EMAIL}
                  </a>
                </p>
                {returnsPage && (
                  <Link to={`/faqe/${returnsPage.slug}`} className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink hover:text-brand-700">
                    {t('returnsPolicy')} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      {faq && faq.data.items.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
            <Reveal>
              <SectionHeading eyebrow={l(faq.data.eyebrow)} title={l(faq.data.title)} />
              <div className="mt-10 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-7">
                <h3 className="text-lg font-bold text-ink">{t('faqHelpTitle')}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{t('faqHelpText')}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={telHref(settings.phone)} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-ink-soft">
                    <Phone className="h-4 w-4" /> {settings.phone}
                  </a>
                  {waDigits && (
                    <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/15 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink/35">
                      <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> {t('whatsapp')}
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <Accordion items={faq.data.items.map((it) => ({ title: l(it.q), content: l(it.a) }))} />
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
