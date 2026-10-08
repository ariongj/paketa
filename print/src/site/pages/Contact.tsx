import type { ComponentType, ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { HomeSection } from '@/lib/types';
import { Accent, Accordion, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { InstagramIcon, ViberIcon, WhatsAppIcon } from '@/components/brand/Social';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { MeasureForm } from '@/site/components/MeasureForm';
import { MapCard } from '@/site/components/content/MapCard';
import { Heading } from '@/site/components/company/Blocks';
import { ChevronTexture, CmykBar, Eyebrow } from '@/site/components/company/Print';
import { QUOTE_HREF, telHref, waHref } from '@/site/components/company/data';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { defineDict, useDict, useL } from '@/i18n';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { cn } from '@/lib/utils';

const T = defineDict({
  sq: {
    title: 'Kontakt',
    eyebrow: 'Kontakt',
    heroTitle: 'Le të flasim për *paketimin tuaj*',
    heroText: 'Na telefononi, na shkruani ose caktoni një takim në fabrikë. Çdo kërkese i përgjigjemi brenda 24 orësh — shpesh të njëjtën ditë.',
    replyBadge: 'Përgjigje brenda 24 orësh',
    proofBadge: 'Provë digjitale para çdo shtypi',
    quoteCta: 'Kërko ofertë të detajuar',
    phone: 'Telefoni',
    phoneHint: 'Shitja & këshillimi',
    email: 'E-mail',
    emailHint: 'Për oferta, skedarë dhe dieline',
    address: 'Fabrika & zyrat',
    addressHint: 'Hap hartën',
    hours: 'Orari i punës',
    hoursHint: 'Takimet në fabrikë me caktim paraprak',
    whatsapp: 'WhatsApp',
    viber: 'Viber',
    chatTitle: 'Më shpejt me *mesazh*?',
    chatText: 'Dërgoni foto të produktit, përmasat ose skedarin në WhatsApp/Viber — ju kthejmë përgjigje me ofertë orientuese.',
    formEyebrow: 'Formulari',
    formTitle: 'Na shkruani ose *caktoni takim*',
    formText: 'Zgjidhni llojin e kërkesës. Për takime në fabrikë zgjidhni datën e preferuar — termin e konfirmojmë me telefon.',
    faqHelpTitle: 'Nuk e gjetët përgjigjen?',
    faqHelpText: 'Na telefononi — ekipi i shitjes është në dispozicion gjatë gjithë orarit të punës.',
    faqEyebrow: 'Pyetje të shpeshta',
    faqTitle: 'Para se të *porosisni*',
  },
  en: {
    title: 'Contact',
    eyebrow: 'Contact',
    heroTitle: 'Let’s talk about *your packaging*',
    heroText: 'Call, write or book a meeting at the factory. We reply to every request within 24 hours — often the same day.',
    replyBadge: 'Reply within 24 hours',
    proofBadge: 'Digital proof before every print',
    quoteCta: 'Request a detailed quote',
    phone: 'Phone',
    phoneHint: 'Sales & advice',
    email: 'E-mail',
    emailHint: 'For quotes, files and dielines',
    address: 'Factory & offices',
    addressHint: 'Open map',
    hours: 'Opening hours',
    hoursHint: 'Factory meetings by appointment',
    whatsapp: 'WhatsApp',
    viber: 'Viber',
    chatTitle: 'Faster by *message*?',
    chatText: 'Send a product photo, the dimensions or your file on WhatsApp/Viber — we’ll come back with an indicative quote.',
    formEyebrow: 'Form',
    formTitle: 'Write to us or *book a meeting*',
    formText: 'Choose the type of request. For factory meetings pick a preferred date — we confirm the slot by phone.',
    faqHelpTitle: 'Didn’t find your answer?',
    faqHelpText: 'Give us a call — the sales team is available throughout opening hours.',
    faqEyebrow: 'FAQ',
    faqTitle: 'Before you *order*',
  },
});

type FaqData = Extract<HomeSection, { type: 'faq' }>;

function ContactCard({ icon: Icon, label, hint, href, external, children }: { icon: ComponentType<{ className?: string }>; label: string; hint?: string; href?: string; external?: boolean; children: ReactNode }) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </span>
        {href && <ArrowUpRight className="h-5 w-5 text-ink/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />}
      </div>
      <div className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className="mt-1.5 break-words text-[17px] font-semibold leading-snug text-ink sm:text-[18px]">{children}</div>
      {hint && <div className="mt-auto pt-3 text-[13.5px] leading-snug text-muted">{hint}</div>}
    </>
  );
  const cls = 'group relative flex h-full flex-col bg-white p-6 sm:p-7';
  if (!href) return <div className={cls}>{inner}</div>;
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className={cn(cls, 'transition-colors duration-300 hover:bg-paper')}>
      {inner}
    </a>
  );
}

export default function Contact() {
  const t = useDict(T);
  const l = useL();
  const settings = useSettings();
  const faq = useDb((s) => s.home.find((h): h is FaqData => h.type === 'faq'));
  usePageTitle(t('title'));

  const igHandle = (settings.instagram ?? '')
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '');
  const wa = waHref(settings.whatsapp || settings.phone);
  const waDigits = wa.replace(/\D/g, '');
  const hours = l(settings.hours)
    .split(/\s*·\s*/)
    .filter(Boolean);
  const faqItems = (faq?.data.items ?? []).slice(0, 5);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="container-x pb-14 pt-10 sm:pb-16 sm:pt-14">
          <Breadcrumbs items={[{ label: t('title') }]} />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div className="animate-fade-up">
              <Eyebrow>{t('eyebrow')}</Eyebrow>
              <h1 className="display mt-5 text-[44px] leading-[1.0] text-ink sm:text-[66px]">
                <Accent text={t('heroTitle')} />
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-ink-soft">{t('heroText')}</p>
            </div>
            <div className="flex animate-fade-up flex-col gap-3 [animation-delay:100ms] lg:items-end">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink ring-1 ring-line">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  {t('replyBadge')}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink ring-1 ring-line">
                  <span className="h-2 w-2 rounded-full bg-brand-600" />
                  {t('proofBadge')}
                </span>
              </div>
              <ButtonLink to={QUOTE_HREF} size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                {t('quoteCta')}
              </ButtonLink>
            </div>
          </div>
        </div>
        <CmykBar className="absolute inset-x-0 bottom-0" />
      </section>

      {/* Contact cards */}
      <section className="pb-16 pt-12 sm:pb-20 sm:pt-16">
        <div className="container-x">
          <Reveal>
            <div className="grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
              <ContactCard icon={Phone} label={t('phone')} hint={t('phoneHint')} href={telHref(settings.phone)}>
                <span className="font-mono text-[17px] tracking-tight">{settings.phone}</span>
                {settings.phone2 ? <span className="block font-mono text-[15px] font-medium text-muted">{settings.phone2}</span> : null}
              </ContactCard>
              <ContactCard icon={Mail} label={t('email')} hint={t('emailHint')} href={`mailto:${settings.email}`}>
                {settings.email}
              </ContactCard>
              <ContactCard icon={MapPin} label={t('address')} hint={t('addressHint')} href={settings.mapUrl} external>
                {settings.city}
                <span className="block text-[14.5px] font-medium text-muted">{settings.address}</span>
              </ContactCard>
              <ContactCard icon={Clock} label={t('hours')} hint={t('hoursHint')}>
                {hours.map((h) => (
                  <span key={h} className="block text-[15.5px]">
                    {h}
                  </span>
                ))}
              </ContactCard>
            </div>
          </Reveal>

          {/* Messaging strip */}
          {(waDigits || igHandle) && (
            <Reveal className="mt-4">
              <div className="relative isolate flex flex-col gap-6 overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-8 lg:flex-row lg:items-center lg:justify-between">
                <ChevronTexture />
                <div className="relative flex items-center gap-5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#25D366] text-white">
                    <WhatsAppIcon className="h-7 w-7" />
                  </span>
                  <div>
                    <h2 className="display text-[26px] leading-tight sm:text-[30px]">
                      <Accent text={t('chatTitle')} accentClassName="text-brand-300" />
                    </h2>
                    <p className="mt-1 max-w-xl text-[14.5px] text-white/60">{t('chatText')}</p>
                  </div>
                </div>
                <div className="relative flex flex-wrap gap-2">
                  {waDigits && (
                    <>
                      <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink transition hover:bg-sand">
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
                    <a href={`https://www.instagram.com/${igHandle}/`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                      <InstagramIcon className="h-4 w-4" />@{igHandle}
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Form + location */}
      <section id="formulari" className="scroll-mt-20 border-t border-line bg-white py-20 sm:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
          <Reveal>
            <Heading eyebrow={t('formEyebrow')} title={t('formTitle')} text={t('formText')} />
            <MeasureForm type="contact" types={['contact', 'measurement', 'quote']} className="mt-10 bg-paper/60 lg:p-9" />
          </Reveal>
          <Reveal delay={120} className="h-full lg:pt-2">
            <MapCard className="h-full" />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section className="py-20 sm:py-24">
          <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
            <Reveal>
              <Heading eyebrow={l(faq!.data.eyebrow) || t('faqEyebrow')} title={t('faqTitle')} />
              <div className="mt-10 rounded-2xl bg-white p-6 ring-1 ring-line sm:p-7">
                <h3 className="text-lg font-semibold text-ink">{t('faqHelpTitle')}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{t('faqHelpText')}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={telHref(settings.phone)} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-ink-soft">
                    <Phone className="h-4 w-4" /> {settings.phone}
                  </a>
                  <ButtonLink to={QUOTE_HREF} variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                    {t('quoteCta')}
                  </ButtonLink>
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <Accordion items={faqItems.map((it) => ({ title: l(it.q), content: l(it.a) }))} />
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
