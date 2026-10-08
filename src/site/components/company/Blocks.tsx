import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight, Phone } from 'lucide-react';
import { Accent, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/site/components/SectionHeading';
import { defineDict, useDict } from '@/i18n';
import { site } from '@/i18n/site';
import { useSettings } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { QUOTE_HREF, pad2, telHref, useIndustryLinks, useMeasureHref } from './data';

/** Accent words (`*word*`) on dark green: lime text, no marker swipe. */
export const ACCENT_ON_DARK = 'text-lime! [background-image:none]!';

/** Strings shared by the company pages (for business, references, about). */
export const C = defineDict({
  me: {
    step: 'Korak',
    bookFree: 'Zatraži besplatne uzorke',
    getQuote: 'Zatraži veleprodajnu ponudu',
    logoQuote: 'Ponuda za štampu logotipa',
    ctaEyebrow: 'Sljedeći korak',
    ctaTitle: 'Vaš lokal, *vaša ambalaža*.',
    ctaText: 'Probajte uzorke besplatno ili nam pošaljite listu proizvoda — veleprodajnu ponudu, i sa vašim logom, dobijate u roku od 24 sata.',
    ind_eyebrow: 'Za koga radimo',
    ind_title: 'Ambalaža za *svaki meni*',
    ind_cafe: 'Kafići i barovi',
    ind_restaurant: 'Restorani',
    ind_fastfood: 'Brza hrana',
    ind_pastry: 'Poslastičarnice',
    ind_sushi: 'Suši',
    ind_catering: 'Ketering',
    ind_cafe_x: 'Čaše F95, poklopci, slamke',
    ind_restaurant_x: 'Posude za take-away i dostavu',
    ind_fastfood_x: 'Čašice za sos, pribor, kutije',
    ind_pastry_x: 'Čaše za desert, kutije za torte',
    ind_sushi_x: 'Posude za suši sa poklopcem',
    ind_catering_x: 'Setovi pribora, posude, čaše',
    browse: 'Pogledaj',
  },
  sq: {
    step: 'Hapi',
    bookFree: 'Kërko mostra falas',
    getQuote: 'Kërko ofertë shumice',
    logoQuote: 'Ofertë për printim me logo',
    ctaEyebrow: 'Hapi i radhës',
    ctaTitle: 'Lokali juaj, *paketimi juaj*.',
    ctaText: 'Provoni mostrat falas ose na dërgoni listën e produkteve — ofertën me çmime shumice, edhe me logon tuaj, e merrni brenda 24 orëve.',
    ind_eyebrow: 'Për kë punojmë',
    ind_title: 'Paketim për *çdo meny*',
    ind_cafe: 'Kafiteri & bare',
    ind_restaurant: 'Restorante',
    ind_fastfood: 'Fast food',
    ind_pastry: 'Pastiçeri & akullore',
    ind_sushi: 'Sushi',
    ind_catering: 'Catering',
    ind_cafe_x: 'Gota F95, kapakë, shkopinj',
    ind_restaurant_x: 'Enë për take-away dhe dërgesa',
    ind_fastfood_x: 'Gota salcash, takëm, kuti',
    ind_pastry_x: 'Gota ëmbëlsirash, kuti tortash',
    ind_sushi_x: 'Enë sushi me kapak',
    ind_catering_x: 'Sete takëmesh, enë, gota',
    browse: 'Shiko',
  },
  en: {
    step: 'Step',
    bookFree: 'Request free samples',
    getQuote: 'Get a wholesale quote',
    logoQuote: 'Logo-print quote',
    ctaEyebrow: 'Next step',
    ctaTitle: 'Your venue, *your packaging*.',
    ctaText: 'Try the samples for free or send us your product list — you get a wholesale quote, with your logo too, within 24 hours.',
    ind_eyebrow: 'Who we work for',
    ind_title: 'Packaging for *every menu*',
    ind_cafe: 'Cafés & bars',
    ind_restaurant: 'Restaurants',
    ind_fastfood: 'Fast food',
    ind_pastry: 'Pastry & ice cream',
    ind_sushi: 'Sushi',
    ind_catering: 'Catering',
    ind_cafe_x: 'F95 cups, lids, straws',
    ind_restaurant_x: 'Take-away & delivery containers',
    ind_fastfood_x: 'Sauce cups, cutlery, boxes',
    ind_pastry_x: 'Dessert cups, cake boxes',
    ind_sushi_x: 'Sushi trays with lids',
    ind_catering_x: 'Cutlery sets, containers, cups',
    browse: 'Browse',
  },
});

/** Rotated "sticker" label — the playful Paketoje accent (lime / pink / white). */
export function Sticker({ children, tone = 'lime', className }: { children: ReactNode; tone?: 'lime' | 'pink' | 'white' | 'ink'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex -rotate-6 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-extrabold tracking-tight shadow-[0_8px_18px_-10px_rgba(15,29,22,0.55)]',
        tone === 'lime' && 'bg-lime text-ink',
        tone === 'pink' && 'bg-pink text-white',
        tone === 'white' && 'bg-white text-ink ring-1 ring-line',
        tone === 'ink' && 'bg-ink text-lime',
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Dark band with REAL store facts (counts, delivery, fees)             */
/* ------------------------------------------------------------------ */
export function FactsBand({ eyebrow, title, items, className }: { eyebrow: string; title: string; items: { value: string; label: string; icon?: ComponentType<{ className?: string }> }[]; className?: string }) {
  return (
    <section className={cn('relative isolate overflow-hidden bg-brand-800 py-20 text-white sm:py-24', className)}>
      <div className="bg-grain pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[460px] w-[460px] rounded-full bg-signal/25 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 -z-10 h-[380px] w-[380px] rounded-full bg-lime/10 blur-[110px]" />
      <div className="container-x">
        <Reveal>
          <SectionHeading eyebrow={eyebrow} title={title} tone="light" />
        </Reveal>
        <div className={cn('mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/10', items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {items.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={i} delay={i * 80} className="bg-brand-800">
                <div className="flex h-full flex-col p-5 sm:p-8">
                  {Icon && <Icon className="h-5 w-5 text-lime" />}
                  <div className="display mt-4 text-[40px] leading-none text-white sm:text-[58px]">{s.value}</div>
                  <p className="mt-3 max-w-[22ch] text-[13.5px] leading-snug text-white/65 sm:text-[14.5px]">{s.label}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Numbered steps joined by a dashed "cut line"                         */
/* ------------------------------------------------------------------ */
export function StepCards({ steps, className, tone = 'white' }: { steps: { title: string; text: string; icon?: ComponentType<{ className?: string }> }[]; className?: string; tone?: 'white' | 'paper' }) {
  const t = useDict(C);
  const n = steps.length;
  return (
    <ol className={cn('relative grid gap-4 sm:grid-cols-2 lg:gap-5', n >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3', className)}>
      <span aria-hidden className="pointer-events-none absolute left-8 right-8 top-[46px] hidden border-t-2 border-dashed border-ink/15 lg:block" />
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <Reveal as="li" key={i} delay={i * 90} className="relative">
            <div className={cn('flex h-full flex-col rounded-3xl p-6 ring-1 ring-line transition-[box-shadow,transform] duration-500 hover:-translate-y-1 hover:shadow-[0_28px_60px_-34px_rgba(15,29,22,0.4)] sm:p-7', tone === 'white' ? 'bg-white' : 'bg-paper')}>
              <div className="flex items-center justify-between gap-4">
                <span className={cn('grid h-12 w-12 place-items-center rounded-2xl', i === n - 1 ? 'bg-lime text-ink' : 'bg-brand-600 text-white')}>
                  {Icon ? <Icon className="h-5 w-5" /> : <span className="display text-lg">{i + 1}</span>}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
                  {t('step')} {pad2(i + 1)}
                </span>
              </div>
              <h3 className="display mt-7 text-[22px] leading-tight text-ink">{s.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.text}</p>
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Industries strip — venue types linked to collections / categories   */
/* ------------------------------------------------------------------ */
export function IndustryStrip({ className, heading = true }: { className?: string; heading?: boolean }) {
  const t = useDict(C);
  const links = useIndustryLinks();
  return (
    <div className={className}>
      {heading && (
        <Reveal>
          <SectionHeading eyebrow={t('ind_eyebrow')} title={t('ind_title')} />
        </Reveal>
      )}
      <div className={cn('no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6', heading && 'mt-10')}>
        {links.map((ind, i) => (
          <Reveal key={ind.id} delay={(i % 6) * 60} className="w-[46%] shrink-0 snap-start sm:w-auto">
            <Link to={ind.to} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-ink">
              <Img src={ind.image} small alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.07]" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
              <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100 max-md:hidden">
                <ArrowUpRight className="h-4 w-4" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h3 className="display text-[20px] leading-[1.05] text-white sm:text-[22px]">{t(`ind_${ind.id}` as const)}</h3>
                <p className="mt-1.5 text-[12px] leading-snug text-white/70">{t(`ind_${ind.id}_x` as const)}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Closing call-to-action band                                         */
/* ------------------------------------------------------------------ */
export function CtaBand({ image = '/images/hero/kraft.webp', className }: { image?: string; className?: string }) {
  const t = useDict(C);
  const ts = useDict(site);
  const settings = useSettings();
  const measureHref = useMeasureHref();
  return (
    <section className={cn('pt-20 sm:pt-28', className)}>
      <div className="container-x">
        <Reveal>
          <div className="relative isolate grid overflow-hidden rounded-[36px] bg-brand-700 text-white lg:grid-cols-[1.15fr_1fr]">
            <div className="bg-grain pointer-events-none absolute inset-0 -z-10" />
            <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-signal/30 blur-3xl" />
            <div className="relative px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
              <div className="eyebrow text-lime">{t('ctaEyebrow')}</div>
              <h2 className="display mt-4 text-[38px] leading-[1.02] sm:text-[56px]">
                <Accent text={t('ctaTitle')} accentClassName={ACCENT_ON_DARK} />
              </h2>
              <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/75">{t('ctaText')}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink to={measureHref} size="lg" variant="lime" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('bookFree')}
                </ButtonLink>
                <ButtonLink to={QUOTE_HREF} size="lg" variant="outlineLight">
                  {t('getQuote')}
                </ButtonLink>
              </div>
              <a href={telHref(settings.phone)} className="mt-7 inline-flex items-center gap-2.5 text-[15px] font-semibold text-white/80 transition-colors hover:text-white">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                  <Phone className="h-4 w-4" />
                </span>
                {ts('callUs')}: {settings.phone}
              </a>
            </div>
            <div className="relative min-h-[240px] sm:min-h-[320px]">
              <Img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-700 via-transparent to-transparent lg:bg-gradient-to-r lg:from-brand-700 lg:via-brand-700/10 lg:to-transparent" />
              <Sticker className="absolute bottom-6 right-6 text-[13px]">it’s packaging</Sticker>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
