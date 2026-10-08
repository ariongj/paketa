import type { ReactNode } from 'react';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import { Accent, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { defineDict, useDict, useL } from '@/i18n';
import { useSettings } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { pad2, QUOTE_HREF, telHref } from './data';
import { BRANDS, FACTS, FLOW } from './tech';
import { ChevronTexture, CmykBar, CropMarks, Eyebrow } from './Print';

/** Strings shared by the company pages (about, technology, industries, projects). */
export const C = defineDict({
  sq: {
    quote: 'Kërko ofertë',
    products: 'Shiko produktet',
    ctaEyebrow: 'Projekti i radhës',
    ctaTitle: 'Le ta printojmë *markën tuaj*.',
    ctaText: 'Na tregoni produktin, sasinë dhe afatin — oferta vjen brenda 24 orësh, prova digjitale para çdo shtypi.',
    ctaB1: 'Ofertë brenda 24 orësh',
    ctaB2: 'Provë digjitale para shtypit',
    ctaB3: 'Porosi të vogla, të mesme e të mëdha',
    inNumbers: 'PrintWorks në shifra',
    flowEyebrow: 'Rrjedha e prodhimit',
    flowTitle: 'Nga ideja te *dorëzimi* — nën një çati',
    flowText: 'Çdo hap kryhet në fabrikën tonë, prandaj afatet, ngjyrat dhe cilësia mbeten nën kontroll nga skedari i parë deri te paleta e fundit.',
    brandsTitle: 'Punojmë me pajisje dhe partnerë nga',
    step: 'Hapi',
  },
  en: {
    quote: 'Request a quote',
    products: 'Browse products',
    ctaEyebrow: 'Your next project',
    ctaTitle: 'Let’s print *your brand*.',
    ctaText: 'Tell us the product, quantity and deadline — your quote follows within 24 hours, with a digital proof before anything is printed.',
    ctaB1: 'Quote within 24 hours',
    ctaB2: 'Digital proof before print',
    ctaB3: 'Small, medium and large orders',
    inNumbers: 'PrintWorks in numbers',
    flowEyebrow: 'Production flow',
    flowTitle: 'From idea to *delivery* — under one roof',
    flowText: 'Every step happens in our own factory, so deadlines, colour and quality stay under control from the first file to the last pallet.',
    brandsTitle: 'We work with equipment and partners from',
    step: 'Step',
  },
});

/* ------------------------------------------------------------------ */
/* Section heading with a registration-mark eyebrow                    */
/* ------------------------------------------------------------------ */
export function Heading({
  eyebrow,
  title,
  text,
  action,
  tone = 'dark',
  align = 'left',
  className,
  as: H = 'h2',
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: ReactNode;
  tone?: 'dark' | 'light';
  align?: 'left' | 'center';
  className?: string;
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={cn('flex flex-col gap-6', align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <Eyebrow tone={tone} className="mb-4">{eyebrow}</Eyebrow>}
        <H className={cn('display text-[34px] leading-[1.04] sm:text-[48px]', tone === 'light' ? 'text-white' : 'text-ink')}>
          <Accent text={title} accentClassName={tone === 'light' ? 'text-brand-300' : undefined} />
        </H>
        {text && <p className={cn('mt-4 text-[16.5px] leading-relaxed', tone === 'light' ? 'text-white/65' : 'text-muted')}>{text}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Key facts — 2020 · 14 countries · 2,500 m² · 25+ years              */
/* ------------------------------------------------------------------ */
export function FactsBand({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  const l = useL();
  const t = useDict(C);
  const dark = tone === 'dark';
  return (
    <section className={cn('relative isolate overflow-hidden', dark ? 'bg-ink text-white' : 'bg-white', className)}>
      {dark && <ChevronTexture />}
      <div className="container-x py-16 sm:py-20">
        <div className={cn('flex items-center justify-between gap-6 border-b pb-6', dark ? 'border-white/10' : 'border-line')}>
          <Eyebrow tone={dark ? 'light' : 'dark'}>{t('inNumbers')}</Eyebrow>
          <CmykBar segments className="hidden sm:flex" />
        </div>
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f, i) => (
            <Reveal key={f.value} delay={i * 80} className={cn('py-8 pr-4 sm:py-10 lg:px-8', i % 2 === 1 && 'border-l pl-5 sm:pl-8', i > 0 && 'lg:border-l', i === 0 && 'lg:pl-0', i >= 2 && 'border-t lg:border-t-0', dark ? 'border-white/10' : 'border-line')}>
              <dt className={cn('font-mono text-[11px] uppercase tracking-[0.16em]', dark ? 'text-white/50' : 'text-muted')}>
                {pad2(i + 1)} · {l(f.label)}
              </dt>
              <dd className="mt-4">
                <span className={cn('display text-[52px] leading-none sm:text-[72px]', dark ? 'text-white' : 'text-ink')}>{f.value}</span>
                {f.unit && <span className={cn('ml-1.5 font-mono text-[18px] sm:text-[22px]', dark ? 'text-brand-300' : 'text-brand-600')}>{f.unit}</span>}
                <span className={cn('mt-3 block text-[14px] leading-snug', dark ? 'text-white/55' : 'text-muted')}>{l(f.note)}</span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Partner / equipment brands strip                                    */
/* ------------------------------------------------------------------ */
export function BrandStrip({ className, title }: { className?: string; title?: string }) {
  const t = useDict(C);
  return (
    <section className={cn('border-y border-line bg-white', className)}>
      <div className="container-x flex flex-col items-center gap-6 py-10 lg:flex-row lg:gap-12">
        <p className="shrink-0 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted lg:max-w-[200px] lg:text-left">{title ?? t('brandsTitle')}</p>
        <ul className="grid w-full grid-cols-3 items-center gap-x-6 gap-y-4 sm:grid-cols-5">
          {BRANDS.map((b) => (
            <li key={b.name} className="flex justify-center">
              <img src={b.image} alt={b.name} loading="lazy" className="h-14 w-auto object-contain opacity-70 mix-blend-multiply grayscale transition-opacity duration-300 [clip-path:inset(0_4px_0_0)] hover:opacity-100 sm:h-[72px]" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Production flow diagram: idea → prepress → print → finishing → QC → delivery */
/* ------------------------------------------------------------------ */
export function ProductionFlow({ className, compact }: { className?: string; compact?: boolean }) {
  const l = useL();
  const t = useDict(C);
  return (
    <section className={cn('relative isolate overflow-hidden bg-ink text-white', className)}>
      <ChevronTexture />
      <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[460px] w-[460px] rounded-full bg-brand-600/25 blur-[120px]" />
      <div className={cn('container-x', compact ? 'py-16 sm:py-20' : 'py-20 sm:py-28')}>
        <Reveal>
          <Heading eyebrow={t('flowEyebrow')} title={t('flowTitle')} text={t('flowText')} tone="light" />
        </Reveal>

        <ol className="relative mt-14 grid gap-0 sm:mt-16 lg:grid-cols-6">
          {/* connector: vertical on mobile, horizontal on desktop */}
          <span aria-hidden className="absolute bottom-8 left-[27px] top-8 w-px bg-gradient-to-b from-brand-400 via-white/25 to-white/10 lg:hidden" />
          <span aria-hidden className="absolute left-[8.33%] right-[8.33%] top-[27px] hidden h-px bg-gradient-to-r from-brand-400 via-white/30 to-white/15 lg:block" />
          {FLOW.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal as="li" key={i} delay={i * 90} className="relative flex gap-5 pb-8 last:pb-0 lg:flex-col lg:items-center lg:gap-0 lg:px-3 lg:pb-0 lg:text-center">
                <span className={cn('relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full ring-1 transition-colors', i === 0 ? 'bg-brand-600 ring-brand-400' : 'bg-ink ring-white/20')}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="pt-1 lg:pt-6">
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-300">
                    {t('step')} {pad2(i + 1)}
                  </div>
                  <div className="mt-1.5 text-[18px] font-semibold leading-tight">{l(s.title)}</div>
                  <p className="mt-1.5 text-[14px] leading-snug text-white/55 lg:mx-auto lg:max-w-[18ch]">{l(s.text)}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
      <CmykBar className="absolute inset-x-0 bottom-0" />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing call-to-action band                                         */
/* ------------------------------------------------------------------ */
export function CtaBand({ image = '/images/p/kuti-dhurate-mailer.webp', title, text, className }: { image?: string; title?: string; text?: string; className?: string }) {
  const t = useDict(C);
  const settings = useSettings();
  return (
    <section className={cn('pt-20 sm:pt-24', className)}>
      <div className="container-x">
        <Reveal>
          <div className="relative isolate grid overflow-hidden rounded-3xl bg-ink text-white lg:grid-cols-[1.2fr_1fr]">
            <ChevronTexture />
            <div className="pointer-events-none absolute -bottom-32 -left-24 -z-10 h-80 w-80 rounded-full bg-brand-600/35 blur-[100px]" />
            <div className="relative p-7 sm:p-12 lg:p-16">
              <Eyebrow tone="light">{t('ctaEyebrow')}</Eyebrow>
              <h2 className="display mt-5 text-[38px] leading-[1.02] sm:text-[56px]">
                <Accent text={title ?? t('ctaTitle')} accentClassName="text-brand-300" />
              </h2>
              <p className="mt-5 max-w-lg text-[16.5px] leading-relaxed text-white/65">{text ?? t('ctaText')}</p>
              <ul className="mt-7 grid gap-2.5 font-mono text-[12px] uppercase tracking-[0.1em] text-white/70 sm:grid-cols-3 sm:gap-4">
                {[t('ctaB1'), t('ctaB2'), t('ctaB3')].map((b) => (
                  <li key={b} className="flex items-start gap-2 border-t border-white/12 pt-3 leading-snug">
                    <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink to={QUOTE_HREF} size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('quote')}
                </ButtonLink>
                <ButtonLink to="/produktet" size="lg" variant="outlineLight">
                  {t('products')}
                </ButtonLink>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-white/70">
                <a href={telHref(settings.phone)} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                  <Phone className="h-4 w-4 text-brand-300" /> {settings.phone}
                </a>
                <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                  <Mail className="h-4 w-4 text-brand-300" /> {settings.email}
                </a>
              </div>
            </div>
            <div className="relative hidden items-center justify-center p-12 lg:flex">
              <div className="relative w-full max-w-[380px]">
                <CropMarks tone="light" />
                <div className="aspect-square overflow-hidden rounded-2xl bg-white">
                  <Img src={image} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
