import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Copy, FileText, Mail, Phone } from 'lucide-react';
import type { HomeSection, Product } from '@/lib/types';
import { Accent, Accordion, Img, Reveal, useCountdown } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { InstagramIcon } from '@/components/brand/Social';
import { SectionHeading } from '@/site/components/SectionHeading';
import { ProductCard } from '@/site/components/ProductCard';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useDb } from '@/store/db';
import { useActiveProducts, useCategories, useSettings } from '@/store/hooks';
import { isOnSale } from '@/lib/pricing';
import { date } from '@/lib/format';
import { cn } from '@/lib/utils';
import { homeIcon } from './icons';
import { ChevronTexture, CmykDots, CornerTicks, CropMarks, RegMark } from './motifs';

export type DataOf<T extends HomeSection['type']> = Extract<HomeSection, { type: T }>['data'];

export const H = defineDict({
  sq: {
    days: 'ditë',
    hours: 'orë',
    minutes: 'min',
    seconds: 'sek',
    endsIn: 'Oferta përfundon për',
    useCode: 'Kodi',
    copied: 'Kodi u kopjua',
    allProducts: 'Të gjitha produktet',
    productsCount: '{n} produkte',
    tab_bestsellers: 'Më të porositurat',
    tab_sale: 'Në ofertë',
    tab_new: 'Të reja',
    tab_manual: 'Të përzgjedhura',
    allProjects: 'Të gjitha realizimet',
    readMore: 'Lexo artikullin',
    minRead: '{n} min lexim',
    allPosts: 'Të gjithë artikujt',
    helpTitle: 'Keni një pyetje tjetër?',
    helpText: 'Na shkruani ose na telefononi — përgjigjemi brenda ditës së punës.',
    artworkGuide: 'Udhëzuesi i skedarëve',
    follow: 'Na ndiqni',
    learnMore: 'Teknologjia jonë',
    step: 'Hapi',
    allIndustries: 'Të gjitha industritë',
    viewIndustry: 'Shiko industrinë',
    statsEyebrow: 'PrintWorks në shifra',
    vision: 'Vizioni i PrintWorks',
    factory: 'Fabrika PrintWorks · Prishtinë',
    quoteBtn: 'Kërko ofertë',
    sampleBtn: 'Porosit paketën e mostrave',
    reply: 'Ofertë brenda 24 orësh',
    prev: 'Para',
    next: 'Pas',
  },
  en: {
    days: 'days',
    hours: 'hrs',
    minutes: 'min',
    seconds: 'sec',
    endsIn: 'Offer ends in',
    useCode: 'Code',
    copied: 'Code copied',
    allProducts: 'All products',
    productsCount: '{n} products',
    tab_bestsellers: 'Most ordered',
    tab_sale: 'On sale',
    tab_new: 'New',
    tab_manual: 'Hand-picked',
    allProjects: 'All projects',
    readMore: 'Read article',
    minRead: '{n} min read',
    allPosts: 'All articles',
    helpTitle: 'Another question?',
    helpText: 'Write or call us — we reply within the working day.',
    artworkGuide: 'Artwork guide',
    follow: 'Follow us',
    learnMore: 'Our technology',
    step: 'Step',
    allIndustries: 'All industries',
    viewIndustry: 'View industry',
    statsEyebrow: 'PrintWorks in numbers',
    vision: 'The PrintWorks vision',
    factory: 'PrintWorks factory · Prishtina',
    quoteBtn: 'Get a quote',
    sampleBtn: 'Order the sample kit',
    reply: 'Quote within 24 hours',
    prev: 'Previous',
    next: 'Next',
  },
});

export const pad = (n: number) => String(n).padStart(2, '0');

/** Horizontal scroller with external arrow buttons. */
export function useScroller() {
  const ref = useRef<HTMLDivElement>(null);
  const by = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return { ref, by };
}

export function ScrollArrows({ by, tone = 'dark', className }: { by: (d: number) => void; tone?: 'dark' | 'light'; className?: string }) {
  const h = useDict(H);
  const cls = cn(
    'grid h-11 w-11 place-items-center rounded-full border transition',
    tone === 'light' ? 'border-white/20 text-white hover:bg-white hover:text-ink' : 'border-ink/15 bg-white text-ink hover:border-ink hover:bg-ink hover:text-white',
  );
  return (
    <div className={cn('flex gap-2', className)}>
      <button type="button" onClick={() => by(-1)} className={cls} aria-label={h('prev')}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => by(1)} className={cls} aria-label={h('next')}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export const trackCls = 'no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:gap-6 lg:px-0';

/* ------------------------------------------------------------------ */
/* Trust / capabilities strip                                          */
/* ------------------------------------------------------------------ */
export function TrustSection({ data }: { data: DataOf<'trust'> }) {
  const l = useL();
  return (
    <section className="relative border-b border-line bg-white">
      <div className="container-x">
        <ul className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {data.items.map((it, i) => {
            const Icon = homeIcon(it.icon);
            return (
              <li key={i} className={cn('flex items-start gap-4 py-5 sm:py-7 lg:px-7', i === 0 && 'lg:pl-0', i === data.items.length - 1 && 'lg:pr-0', i > 1 && 'sm:border-t sm:border-line lg:border-t-0')}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold leading-snug text-ink">{l(it.title)}</div>
                  <div className="mt-1 text-[13.5px] leading-snug text-muted">{l(it.text)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */
export function CategoriesSection({ data }: { data: DataOf<'categories'> }) {
  const l = useL();
  const h = useDict(H);
  const cats = useCategories();
  const products = useActiveProducts();
  return (
    <section className="bg-paper py-24 sm:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow={l(data.eyebrow)}
            title={l(data.title)}
            subtitle={l(data.subtitle)}
            action={
              <ButtonLink to="/produktet" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                {h('allProducts')}
              </ButtonLink>
            }
          />
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {cats.map((c, i) => {
            const n = products.filter((p) => p.categoryId === c.id).length;
            return (
              <Reveal key={c.id} delay={(i % 3) * 80}>
                <Link to={`/produktet/${c.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-[box-shadow,transform] duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-36px_rgb(18_16_20/0.5)] hover:ring-ink/10">
                  <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                    <Img src={c.image} alt={l(c.name)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]" />
                    <CornerTicks className="text-white opacity-0 transition-opacity duration-500 group-hover:opacity-90" />
                    <span className="mono absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink backdrop-blur">{pad(i + 1)}</span>
                  </div>
                  <div className="flex flex-1 items-end justify-between gap-4 p-5 sm:p-6">
                    <div className="min-w-0">
                      <h3 className="display text-[23px] leading-tight text-ink sm:text-[25px]">{l(c.name)}</h3>
                      <p className="mt-1.5 text-[14px] leading-snug text-muted">{l(c.tagline)}</p>
                      <p className="mono mt-4 text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">{h('productsCount', { n })}</p>
                    </div>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink/10 text-ink transition-all duration-500 group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white">
                      <ArrowUpRight className="h-[18px] w-[18px]" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Featured products                                                   */
/* ------------------------------------------------------------------ */
type FeatMode = DataOf<'featured'>['mode'];

function pickProducts(products: Product[], mode: FeatMode, ids: string[]) {
  switch (mode) {
    case 'sale':
      return products.filter(isOnSale).sort((a, b) => b.sold - a.sold);
    case 'new':
      return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'manual':
      return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
    default:
      return [...products].sort((a, b) => b.sold - a.sold);
  }
}

export function FeaturedSection({ data }: { data: DataOf<'featured'> }) {
  const l = useL();
  const h = useDict(H);
  const products = useActiveProducts();
  const [mode, setMode] = useState<FeatMode>(data.mode);
  const { ref, by } = useScroller();
  // Only offer tabs that have something to show
  const tabs = useMemo(() => {
    const all: FeatMode[] = data.mode === 'manual' ? ['manual', 'bestsellers', 'new', 'sale'] : ['bestsellers', 'new', 'sale'];
    return all.filter((m) => m === data.mode || pickProducts(products, m, data.productIds).length > 0);
  }, [products, data.mode, data.productIds]);
  const list = useMemo(() => pickProducts(products, mode, data.productIds).slice(0, 10), [products, mode, data.productIds]);
  return (
    <section className="bg-paper pb-24 sm:pb-28">
      <div className="container-x">
        <div className="border-t border-line pt-20 sm:pt-24">
          <Reveal>
            <SectionHeading eyebrow={l(data.eyebrow)} title={l(data.title)} />
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              {tabs.length > 1 ? (
                <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-line" role="tablist">
                  {tabs.map((m) => (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={mode === m}
                      onClick={() => setMode(m)}
                      className={cn('rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors', mode === m ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink')}
                    >
                      {h(`tab_${m}`)}
                    </button>
                  ))}
                </div>
              ) : (
                <span />
              )}
              <ScrollArrows by={by} className="max-lg:hidden" />
            </div>
          </Reveal>
          <div ref={ref} className={cn(trackCls, 'mt-10')}>
            {list.map((p, i) => (
              <div key={p.id} className="w-[74%] shrink-0 snap-start py-2 sm:w-[44%] lg:w-[calc((100%-72px)/4)]">
                <ProductCard product={p} priority={i < 4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Seasonal promo with countdown                                       */
/* ------------------------------------------------------------------ */
export function PromoSection({ data }: { data: DataOf<'promo'> }) {
  const l = useL();
  const h = useDict(H);
  const cd = useCountdown(data.endsAt);
  const cells: [number, string][] = [
    [cd.days, h('days')],
    [cd.hours, h('hours')],
    [cd.minutes, h('minutes')],
    [cd.seconds, h('seconds')],
  ];
  return (
    <section className="bg-paper pb-24 sm:pb-28">
      <div className="container-x">
        <Reveal>
          <div className="relative grid overflow-hidden rounded-[32px] bg-ink lg:grid-cols-[0.9fr_1.1fr]">
            <ChevronTexture id="pw-promo-chev" />
            <div className="relative p-6 sm:p-10 lg:p-12">
              <div className="relative mx-auto aspect-square max-w-[460px]">
                <CropMarks tone="light" gap={8} len={14} />
                <div className="h-full w-full overflow-hidden rounded-3xl bg-white">
                  <Img src={data.image} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
            <div className="relative flex flex-col justify-center px-6 pb-10 sm:px-10 lg:py-14 lg:pl-4 lg:pr-14">
              <div className="mono flex items-center gap-2 text-[11.5px] uppercase tracking-[0.18em] text-brand-300">
                <RegMark className="h-4 w-4" /> {l(data.eyebrow)}
              </div>
              <h2 className="display mt-4 text-[38px] leading-[1.02] text-white sm:text-[52px]">
                <Accent text={l(data.title)} accentClassName="text-brand-400" />
              </h2>
              <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/65">{l(data.text)}</p>
              <div className="mt-8">
                <div className="mono text-[10.5px] uppercase tracking-[0.18em] text-white/45">{h('endsIn')}</div>
                <div className="mt-3 flex gap-2 sm:gap-3">
                  {cells.map(([v, label]) => (
                    <div key={label} className="w-[68px] rounded-2xl bg-white/[0.06] py-3 text-center ring-1 ring-white/10 sm:w-20">
                      <div className="display text-3xl tabular-nums text-white sm:text-4xl">{pad(v)}</div>
                      <div className="mono mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink to={data.cta.href} size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {l(data.cta.label)}
                </ButtonLink>
                {data.code && (
                  <button
                    onClick={() => {
                      void navigator.clipboard?.writeText(data.code);
                      toast.success(h('copied'), { description: data.code });
                    }}
                    className="group inline-flex h-13 items-center gap-3 rounded-full border border-dashed border-white/30 px-5 text-white transition hover:border-white"
                  >
                    <span className="mono text-[10.5px] uppercase tracking-[0.16em] text-white/55">{h('useCode')}</span>
                    <span className="mono text-[15px] font-medium tracking-wider">{data.code}</span>
                    <Copy className="h-4 w-4 opacity-60 group-hover:opacity-100" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Process — four steps, joined by a dashed "die line"                 */
/* ------------------------------------------------------------------ */
export function ProcessSection({ data }: { data: DataOf<'process'> }) {
  const l = useL();
  const h = useDict(H);
  return (
    <section className="bg-paper py-24 sm:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHeading eyebrow={l(data.eyebrow)} title={l(data.title)} />
        </Reveal>
        <ol className={cn('mt-14 grid gap-4 sm:grid-cols-2 lg:gap-5', data.steps.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {data.steps.map((s, i) => (
            <Reveal as="li" key={i} delay={i * 100} className="relative">
              <div className="flex h-full flex-col rounded-2xl bg-white p-6 ring-1 ring-line sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="mono grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-medium text-white">{pad(i + 1)}</span>
                  {i < data.steps.length - 1 ? <span className="h-px flex-1 border-t border-dashed border-ink/25" /> : <RegMark className="ml-auto h-5 w-5 text-brand-600" />}
                </div>
                <div className="mono mt-8 text-[10.5px] uppercase tracking-[0.18em] text-muted">
                  {h('step')} {pad(i + 1)}
                </div>
                <h3 className="mt-2 text-[19px] font-semibold leading-snug text-ink">{l(s.title)}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{l(s.text)}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Services (hover list with image)                                    */
/* ------------------------------------------------------------------ */
export function ServicesSection({ data }: { data: DataOf<'services'> }) {
  const l = useL();
  const h = useDict(H);
  const [active, setActive] = useState(0);
  const items = data.items;
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow={l(data.eyebrow)}
            title={l(data.title)}
            subtitle={l(data.subtitle)}
            action={
              <ButtonLink to="/teknologjia" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                {h('learnMore')}
              </ButtonLink>
            }
          />
        </Reveal>
        <div className="mt-14 hidden gap-12 lg:grid lg:grid-cols-[1.05fr_1fr]">
          <ul className="border-t border-line">
            {items.map((it, i) => (
              <li key={i}>
                <button onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)} className="group flex w-full items-start gap-6 border-b border-line py-7 text-left">
                  <span className={cn('mono mt-2 w-8 text-[12px] tabular-nums transition-colors', active === i ? 'text-brand-600' : 'text-muted/60')}>{pad(i + 1)}</span>
                  <span className="flex-1">
                    <span className={cn('display block text-[30px] leading-tight transition-colors', active === i ? 'text-ink' : 'text-ink/40 group-hover:text-ink/70')}>{l(it.title)}</span>
                    <span className={cn('grid transition-all duration-500', active === i ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                      <span className="overflow-hidden text-[15px] leading-relaxed text-muted">{l(it.text)}</span>
                    </span>
                  </span>
                  <ArrowUpRight className={cn('mt-2 h-6 w-6 transition-all', active === i ? 'text-brand-600' : 'text-ink/25')} />
                </button>
              </li>
            ))}
          </ul>
          <div className="relative">
            <div className="sticky top-28 aspect-square overflow-hidden rounded-3xl bg-sand ring-1 ring-line">
              {items.map((it, i) => (
                <Img key={i} src={it.image} alt={l(it.title)} className={cn('absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700', active === i ? 'scale-100 opacity-100!' : 'scale-105 opacity-0!')} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:hidden">
          {items.map((it, i) => (
            <Reveal key={i} delay={(i % 2) * 80} className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
              <div className="aspect-[16/10] overflow-hidden bg-sand">
                <Img src={it.image} small alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <div className="mono text-[11px] text-brand-600">{pad(i + 1)}</div>
                <h3 className="mt-1 text-lg font-semibold">{l(it.title)}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{l(it.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Projects — bento of the featured case studies                       */
/* ------------------------------------------------------------------ */
export function ProjectsSection({ data }: { data: DataOf<'projects'> }) {
  const l = useL();
  const h = useDict(H);
  const all = useDb((s) => s.projects);
  const projects = useMemo(() => [...all].sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year).slice(0, 5), [all]);
  const { ref, by } = useScroller();
  if (!projects.length) return null;
  return (
    <section className="bg-paper py-24 sm:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow={l(data.eyebrow)}
            title={l(data.title)}
            subtitle={l(data.subtitle)}
            action={
              <div className="flex items-center gap-3">
                <ScrollArrows by={by} className="lg:hidden" />
                <ButtonLink to="/projektet" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />} className="max-sm:hidden">
                  {h('allProjects')}
                </ButtonLink>
              </div>
            }
          />
        </Reveal>
        <div ref={ref} className={cn(trackCls, 'mt-12 lg:grid lg:grid-cols-4 lg:grid-rows-2 lg:gap-5 lg:overflow-visible lg:pb-0')}>
          {projects.map((p, i) => (
            <Link
              key={p.id}
              to="/projektet"
              className={cn(
                'group relative block aspect-[4/5] w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl bg-white ring-1 ring-line sm:w-[46%] lg:aspect-auto lg:w-auto',
                i === 0 ? 'lg:col-span-2 lg:row-span-2 lg:min-h-[640px]' : 'lg:min-h-[310px]',
              )}
            >
              <Img src={p.image} alt={l(p.title)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
              <span className="mono absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] text-ink backdrop-blur">
                {p.location} · {p.year}
              </span>
              <div className={cn('absolute inset-x-0 bottom-0', i === 0 ? 'p-6 sm:p-8' : 'p-5')}>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 3).map((tg, k) => (
                    <span key={k} className="mono rounded-full bg-white/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white backdrop-blur">
                      {l(tg)}
                    </span>
                  ))}
                </div>
                <h3 className={cn('display mt-3 leading-tight text-white', i === 0 ? 'text-[26px] sm:text-[34px]' : 'text-[20px]')}>{l(p.title)}</h3>
                {i === 0 && <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-white/75 max-sm:line-clamp-2">{l(p.summary)}</p>}
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 sm:hidden">
          <ButtonLink to="/projektet" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
            {h('allProjects')}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stats + vision                                                      */
/* ------------------------------------------------------------------ */
export function StatsSection({ data }: { data: DataOf<'stats'> }) {
  const l = useL();
  const h = useDict(H);
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="container-x">
        <div className={cn('grid gap-12 lg:items-center lg:gap-16', data.image && 'lg:grid-cols-[1.1fr_1fr]')}>
          <Reveal>
            <div className="eyebrow">{h('statsEyebrow')}</div>
            <blockquote className="display mt-5 text-[30px] leading-[1.12] text-ink sm:text-[40px]">„{l(data.quote)}“</blockquote>
            <div className="mono mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted">
              <span className="h-px w-8 bg-ink/30" /> {h('vision')}
            </div>
          </Reveal>
          {data.image && (
            <Reveal delay={120} className="relative">
              <div className="relative aspect-[2/1] overflow-hidden rounded-3xl bg-ink">
                <Img src={data.image} alt="" className="h-full w-full object-cover" />
              </div>
            </Reveal>
          )}
        </div>
        <dl className="mt-16 grid grid-cols-2 border-t border-line lg:grid-cols-4">
          {data.items.map((s, i) => (
            <Reveal key={i} delay={i * 80} className={cn('border-line py-8 pr-4 lg:px-8', i % 2 === 1 && 'border-l pl-5 sm:pl-8', i > 1 && 'border-t lg:border-t-0', i >= 2 && i % 2 === 0 && 'lg:border-l', i === 0 && 'lg:pl-0')}>
              <dt className="display whitespace-nowrap text-[40px] leading-none tracking-[-0.045em] text-ink sm:text-[60px] xl:text-[68px]">{s.value}</dt>
              <dd className="mono mt-4 max-w-[22ch] text-[11px] uppercase leading-relaxed tracking-[0.14em] text-muted">{l(s.label)}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Blog                                                                */
/* ------------------------------------------------------------------ */
export function BlogSection({ data }: { data: DataOf<'blog'> }) {
  const l = useL();
  const lang = useLang();
  const h = useDict(H);
  const all = useDb((s) => s.posts);
  const posts = useMemo(() => all.filter((p) => p.published).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3), [all]);
  if (!posts.length) return null;
  return (
    <section className="bg-paper py-24 sm:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow={l(data.eyebrow)}
            title={l(data.title)}
            action={
              <ButtonLink to="/blog" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                {h('allPosts')}
              </ButtonLink>
            }
          />
        </Reveal>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6 lg:gap-8">
          {posts.map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <Link to={`/blog/${p.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                  <Img src={p.cover} small alt="" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
                  <span className="mono absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.12em] text-ink backdrop-blur">{l(p.tag)}</span>
                </div>
                <div className="mono mt-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted">
                  <span>{date(p.publishedAt, lang)}</span>
                  <span aria-hidden>·</span>
                  <span>{h('minRead', { n: p.readMinutes })}</span>
                </div>
                <h3 className="mt-2.5 text-[21px] font-semibold leading-snug tracking-[-0.015em] text-ink transition-colors group-hover:text-brand-700">{l(p.title)}</h3>
                <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted">{l(p.excerpt)}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                  {h('readMore')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */
export function FaqSection({ data }: { data: DataOf<'faq'> }) {
  const l = useL();
  const h = useDict(H);
  const t = useDict(site);
  const settings = useSettings();
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <Reveal>
          <SectionHeading eyebrow={l(data.eyebrow)} title={l(data.title)} />
          <div className="relative mt-10 overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-7">
            <ChevronTexture id="pw-faq-chev" />
            <div className="relative">
              <h3 className="text-[18px] font-semibold">{h('helpTitle')}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/65">{h('helpText')}</p>
              <div className="mt-5 space-y-2.5 text-[14.5px]">
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-white hover:text-brand-200">
                  <Phone className="h-4 w-4 text-brand-300" /> <span className="mono">{settings.phone}</span>
                </a>
                <a href={`mailto:${settings.email}`} className="flex items-center gap-3 text-white hover:text-brand-200">
                  <Mail className="h-4 w-4 text-brand-300" /> {settings.email}
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <ButtonLink to="/kontakt" variant="light" size="sm">
                  {t('nav_contact')}
                </ButtonLink>
                <ButtonLink to="/faqe/si-te-pergatisni-skedaret" variant="outlineLight" size="sm" icon={<FileText className="h-4 w-4" />}>
                  {h('artworkGuide')}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <Accordion items={data.items.map((it) => ({ title: l(it.q), content: l(it.a) }))} />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Instagram                                                           */
/* ------------------------------------------------------------------ */
export function InstagramSection({ data }: { data: DataOf<'instagram'> }) {
  const l = useL();
  const h = useDict(H);
  const settings = useSettings();
  const url = `https://www.instagram.com/${settings.instagram}/`;
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <a href={url} target="_blank" rel="noreferrer" className="eyebrow inline-flex items-center gap-2">
                <InstagramIcon className="h-4 w-4" /> @{settings.instagram}
              </a>
              <h2 className="display mt-3 text-[34px] leading-tight sm:text-[44px]">
                <Accent text={l(data.title)} />
              </h2>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-ink-soft sm:self-auto">
              <InstagramIcon className="h-4 w-4" /> {h('follow')}
            </a>
          </div>
        </Reveal>
        <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
          {data.images.map((src, i) => (
            <Reveal key={i} delay={i * 60}>
              <a href={url} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-2xl bg-sand" aria-label={`Instagram ${i + 1}`}>
                <Img src={src} small alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span className="absolute inset-0 grid place-items-center bg-ink/0 text-white opacity-0 transition group-hover:bg-ink/35 group-hover:opacity-100">
                  <InstagramIcon className="h-7 w-7" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing CTA — custom packaging → quote request                       */
/* ------------------------------------------------------------------ */
export function CtaSection({ data }: { data: DataOf<'cta'> }) {
  const l = useL();
  const h = useDict(H);
  const settings = useSettings();
  const sampleKit = useDb((s) => s.products.find((p) => p.id === 'p-mostra' && p.status === 'active'));
  return (
    <section id="oferta" className="scroll-mt-28 bg-paper pt-4">
      <div className="container-x">
        <Reveal>
          <div className="relative isolate grid overflow-hidden rounded-[32px] bg-ink text-white lg:grid-cols-[1.25fr_1fr]">
            <ChevronTexture id="pw-cta-chev" />
            <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-[420px] w-[420px] rounded-full bg-brand-600/35 blur-[120px]" />
            <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12 sm:py-16 lg:py-20 lg:pl-16 lg:pr-6">
              <div className="mono flex items-center gap-2.5 text-[11.5px] uppercase tracking-[0.18em] text-white/60">
                <RegMark className="h-[18px] w-[18px] text-brand-400" /> {l(data.eyebrow)}
              </div>
              <h2 className="display mt-5 text-[40px] leading-[0.98] sm:text-[56px] xl:text-[64px]">
                <Accent text={l(data.title)} accentClassName="text-brand-400" />
              </h2>
              <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-white/70">{l(data.text)}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink to="/kerko-oferte" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {h('quoteBtn')}
                </ButtonLink>
                {sampleKit && (
                  <ButtonLink to={`/produkt/${sampleKit.slug}`} size="lg" variant="outlineLight">
                    {h('sampleBtn')}
                  </ButtonLink>
                )}
              </div>
              <div className="mono mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-[12.5px] text-white/60">
                <span className="inline-flex items-center gap-2 text-white/80">
                  <CmykDots /> {h('reply')}
                </span>
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:text-white">
                  {settings.phone}
                </a>
                <a href={`mailto:${settings.email}`} className="hover:text-white">
                  {settings.email}
                </a>
              </div>
            </div>
            {data.image && (
              <div className="relative px-10 pb-12 sm:px-16 lg:py-16 lg:pl-6 lg:pr-16">
                <div className="relative mx-auto aspect-square w-full max-w-[420px] lg:max-w-none">
                  <CropMarks tone="light" gap={9} len={16} />
                  <div className="h-full w-full overflow-hidden rounded-3xl bg-white shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
                    <Img src={data.image} alt="" className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

