import { useMemo, useState, type ComponentType } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowRight, ArrowUpRight, Award, BadgeCheck, BadgePercent, Boxes, Check, Clock, Coffee, Copy, CupSoda, Gift, HandCoins, Hammer,
  Home as HomeIcon, Leaf, MapPin, MousePointerClick, Package, PackageOpen, Percent, Phone, Printer, Quote, Recycle, Repeat, Ruler,
  ShieldCheck, Sparkles, Star, Store, Timer, Truck, Utensils, Warehouse, Wrench, Zap,
} from 'lucide-react';
import type { HomeSection, Product } from '@/lib/types';
import { Accent, Accordion, Img, Reveal, useCountdown } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { LogoMark } from '@/components/brand/Logo';
import { InstagramIcon, WhatsAppIcon } from '@/components/brand/Social';
import { ACCENT_ON_DARK, Eyebrow, SectionHeading } from '@/site/components/SectionHeading';
import { ProductCard } from '@/site/components/ProductCard';
import { MeasureForm } from '@/site/components/MeasureForm';
import { useMeasureHref } from '@/site/components/company/data';
import { useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { isOnSale, piecePrice, piecesPerUnit } from '@/lib/pricing';
import { date, moneyPiece } from '@/lib/format';
import { cn } from '@/lib/utils';
import { H } from './dict';
import { Rail, RailArrows, Sticker, TapeMarquee, useCatalog, useRail, type CatInfo } from './parts';

type DataOf<T extends HomeSection['type']> = Extract<HomeSection, { type: T }>['data'];

/** Icons the trust bar can render — names are stored in the CMS (Homepage → Trust bar). */
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Truck, Award, Sparkles, ShieldCheck, Clock, Leaf, Star, Phone, Package, PackageOpen, Printer, Percent, BadgePercent, BadgeCheck, Boxes,
  Recycle, Store, Warehouse, Gift, Coffee, CupSoda, Utensils, HandCoins, Timer, Zap, MapPin, Ruler, Hammer, Wrench, Home: HomeIcon,
};

/** Lime marker swipe (same gesture as <Accent>) for numbers and active labels. */
const MARKER = 'bg-[linear-gradient(transparent_60%,var(--color-lime)_60%,var(--color-lime)_92%,transparent_92%)] [box-decoration-break:clone]';

/* ------------------------------------------------------------------ */
/* Trust bar                                                           */
/* ------------------------------------------------------------------ */
export function TrustSection({ data, overlap }: { data: DataOf<'trust'>; overlap: boolean }) {
  const l = useL();
  return (
    <section className={overlap ? 'pt-5 sm:pt-6' : 'pt-14'}>
      <div className="container-x">
        <div className="grid overflow-hidden rounded-[26px] bg-white ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((it, i) => {
            const Icon = ICONS[it.icon] ?? Sparkles;
            return (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-4 border-dashed border-ink/15 px-5 py-5 sm:px-6 sm:py-6',
                  i > 0 && 'border-t',
                  i % 2 === 1 ? 'sm:border-l' : 'sm:border-l-0',
                  i < 2 ? 'sm:border-t-0' : 'sm:border-t',
                  'lg:border-t-0',
                  i > 0 ? 'lg:border-l' : 'lg:border-l-0',
                )}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lime-soft text-lime-ink">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold leading-snug text-ink">{l(it.title)}</div>
                  <div className="mt-0.5 text-[13.5px] leading-snug text-muted">{l(it.text)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Categories — bento of stocked ranges, made-to-order card, "soon" chips */
/* ------------------------------------------------------------------ */
function CategoryTile({ info, big, from, delay }: { info: CatInfo; big: boolean; from: number | null; delay: number }) {
  const l = useL();
  const lang = useLang();
  const h = useDict(H);
  const { cat, count } = info;
  return (
    <Reveal delay={delay} className={cn(big ? 'col-span-2 lg:row-span-2' : '')}>
      <Link
        to={`/produktet/${cat.slug}`}
        className={cn('group relative block h-full overflow-hidden rounded-[24px] bg-ink sm:rounded-[28px]', big ? 'aspect-[16/12] lg:aspect-auto' : 'aspect-[4/5] lg:aspect-auto')}
      >
        <Img src={cat.image} small={!big} alt={l(cat.name)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
        {count > 0 && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur sm:left-4 sm:top-4">{h('productsCount', { n: count })}</span>}
        {big && from != null && (
          <Sticker className="absolute right-4 top-4 w-[92px] rotate-[10deg] sm:right-6 sm:top-6 sm:w-[112px]">
            <span className="block text-[9.5px] font-extrabold uppercase tracking-[0.14em] sm:text-[10.5px]">{h('from')}</span>
            <span className="display block text-[19px] leading-none sm:text-[24px]">{moneyPiece(from, lang)}</span>
            <span className="block text-[10px] font-bold sm:text-[11px]">{h('perPiece')}</span>
          </Sticker>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-6">
          <div className="min-w-0">
            <h3 className={cn('display leading-[0.95] text-white', big ? 'text-[34px] sm:text-[54px]' : 'text-[21px] sm:text-[28px]')}>{l(cat.name)}</h3>
            <p className={cn('mt-1.5 line-clamp-2 text-white/75', big ? 'text-[14px] sm:text-[15.5px]' : 'hidden text-[13px] sm:block')}>{l(cat.tagline)}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink transition-all duration-500 group-hover:-rotate-45 group-hover:bg-lime sm:h-12 sm:w-12">
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

function QuoteTile({ items }: { items: CatInfo[] }) {
  const l = useL();
  const h = useDict(H);
  return (
    <Reveal delay={120} className="col-span-2">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-[color-mix(in_oklab,var(--color-kraft)_32%,var(--color-paper))] p-5 sm:rounded-[28px] sm:p-7 lg:flex-row lg:items-center lg:gap-5 lg:px-7 lg:py-6">
        <div aria-hidden className="pointer-events-none absolute inset-2 rounded-[18px] border-2 border-dashed border-ink/15 sm:rounded-[22px]" />
        <div className="relative min-w-0 flex-1">
          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-pink-ink">{h('quoteEyebrow')}</div>
          <h3 className="display mt-2 text-[24px] leading-[1.02] text-ink sm:text-[28px]">
            <Accent text={h('quoteTitle')} />
          </h3>
          <p className="mt-2 max-w-md text-[13px] leading-snug text-ink-soft">{h('quoteText')}</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <ButtonLink to="/sherbimet" size="sm" variant="dark" className="h-8! px-3.5! text-[12.5px]!" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              {h('quoteCta')}
            </ButtonLink>
            {items.map((x) => (
              <Link key={x.cat.id} to={`/produktet/${x.cat.slug}`} className="inline-flex h-8 items-center rounded-full bg-white/70 px-3 text-[12px] font-semibold text-ink ring-1 ring-ink/10 transition-colors hover:bg-white">
                {l(x.cat.name)}
              </Link>
            ))}
          </div>
        </div>
        <div className="relative mt-5 hidden h-[170px] w-[190px] shrink-0 sm:block lg:mt-0">
          {items.slice(0, 2).map((x, k) => (
            <div
              key={x.cat.id}
              className={cn(
                'absolute h-[132px] w-[110px] overflow-hidden rounded-2xl border-4 border-white bg-sand shadow-[0_18px_40px_-18px_rgba(15,29,22,0.6)]',
                k === 0 ? 'left-0 top-4 -rotate-6' : 'right-0 top-0 rotate-[7deg]',
              )}
            >
              <Img src={x.cat.image} small alt="" className="h-full w-full object-cover" />
            </div>
          ))}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-[-4deg] rounded-full bg-pink px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink shadow-md">Logo</span>
        </div>
      </div>
    </Reveal>
  );
}

export function CategoriesSection({ data }: { data: DataOf<'categories'> }) {
  const l = useL();
  const h = useDict(H);
  const { stocked, quote, soon, products } = useCatalog();
  const fromFirst = useMemo(() => {
    const first = stocked[0];
    if (!first) return null;
    const list = products.filter((p) => p.categoryId === first.cat.id && !p.quoteOnly && piecesPerUnit(p) > 1);
    return list.length ? Math.min(...list.map((p) => piecePrice(p))) : null;
  }, [stocked, products]);
  return (
    <section className="pb-24 pt-16 sm:pb-28 sm:pt-20">
      <TapeMarquee className="mb-16 sm:mb-20" />
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
        <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:auto-rows-[244px] lg:grid-cols-4 lg:gap-5">
          {stocked.map((x, i) => (
            <CategoryTile key={x.cat.id} info={x} big={i === 0 && stocked.length > 2} from={i === 0 ? fromFirst : null} delay={(i % 4) * 70} />
          ))}
          {quote.length > 0 && <QuoteTile items={quote} />}
        </div>
        {soon.length > 0 && (
          <Reveal className="mt-4 sm:mt-5">
            <div className="flex flex-col gap-3 rounded-[22px] border-2 border-dashed border-ink/15 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
              <div className="shrink-0">
                <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-pink-ink">
                  <span className="h-2 w-2 rounded-full bg-pink" /> {h('soonTitle')}
                </div>
                <p className="mt-0.5 text-[13px] text-muted">{h('soonText')}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                {soon.map((x) => (
                  <Link key={x.cat.id} to={`/produktet/${x.cat.slug}`} className="group inline-flex items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-4 ring-1 ring-line transition-colors hover:ring-ink/30">
                    <span className="h-9 w-9 overflow-hidden rounded-full bg-sand">
                      <Img src={x.cat.image} small alt="" className="h-full w-full object-cover grayscale-[35%] transition group-hover:grayscale-0" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-bold leading-tight text-ink">{l(x.cat.name)}</span>
                      <span className="block max-w-[220px] truncate text-[11.5px] text-muted">{l(x.cat.tagline)}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-ink/30 transition-colors group-hover:text-ink" />
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Featured products rail                                              */
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
  const { products } = useCatalog();
  const rail = useRail();
  const [mode, setMode] = useState<FeatMode>(data.mode);
  const visible = useMemo(() => {
    const tabs: FeatMode[] = data.mode === 'manual' ? ['manual', 'bestsellers', 'sale', 'new'] : ['bestsellers', 'sale', 'new'];
    return tabs.filter((m) => m === data.mode || pickProducts(products, m, data.productIds).length > 0);
  }, [data.mode, data.productIds, products]);
  const list = useMemo(() => pickProducts(products, mode, data.productIds).slice(0, 10), [products, mode, data.productIds]);
  return (
    <section className="pb-24 sm:pb-28">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Eyebrow className="mb-4">{l(data.eyebrow)}</Eyebrow>
              <h2 className="display text-[34px] leading-[1.02] text-ink sm:text-[50px]">
                <Accent text={l(data.title)} />
              </h2>
            </div>
            <div className="flex items-center justify-between gap-3">
              {visible.length > 1 && (
                <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-line">
                  {visible.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn('shrink-0 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors', mode === m ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink')}
                    >
                      {h(`tab_${m}`)}
                    </button>
                  ))}
                </div>
              )}
              <RailArrows rail={rail} />
            </div>
          </div>
        </Reveal>
        <Rail rail={rail} className="mt-10">
          {list.map((p, i) => (
            <div key={p.id} className="w-[68%] shrink-0 snap-start sm:w-[42%] lg:w-[calc((100%-72px)/4)]">
              <ProductCard product={p} priority={i < 4} />
            </div>
          ))}
        </Rail>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Promo with countdown + coupon ticket                                 */
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
    <section className="pb-24 sm:pb-28">
      <div className="container-x">
        <Reveal>
          <div className="relative isolate grid overflow-hidden rounded-[30px] bg-brand-700 text-white sm:rounded-[36px] lg:grid-cols-[1fr_1.1fr]">
            <div aria-hidden className="bg-grain pointer-events-none absolute inset-0 -z-10 opacity-80" />
            <div className="relative min-h-[300px] overflow-hidden sm:min-h-[380px] lg:min-h-[560px]">
              <Img src={data.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-700/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-brand-700/50" />
              <Sticker tone="pink" className="absolute left-5 top-5 w-[104px] -rotate-12 sm:left-7 sm:top-7 sm:w-[128px]">
                <Percent className="mx-auto h-7 w-7 sm:h-9 sm:w-9" strokeWidth={2.6} />
                <span className="mt-1 block font-display text-[13px] font-bold uppercase tracking-[0.08em] sm:text-[15px]">{h('deal')}</span>
              </Sticker>
            </div>
            <div className="relative flex flex-col justify-center p-7 sm:p-12 lg:p-14 xl:p-16">
              <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[22px] border border-dashed border-white/15 max-lg:hidden" />
              <Eyebrow tone="light">{l(data.eyebrow)}</Eyebrow>
              <h2 className="display relative mt-4 text-[32px] leading-[1.02] sm:text-[48px]">
                <Accent text={l(data.title)} accentClassName={ACCENT_ON_DARK} />
              </h2>
              <p className="relative mt-5 max-w-lg text-[15.5px] leading-relaxed text-white/75">{l(data.text)}</p>
              {!cd.done && (
                <div className="relative mt-8">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">{h('endsIn')}</div>
                  <div className="mt-3 flex gap-2 sm:gap-3">
                    {cells.map(([v, label]) => (
                      <div key={label} className="w-[66px] rounded-2xl bg-white/[0.08] py-3 text-center ring-1 ring-white/15 sm:w-20">
                        <div className="display text-[28px] tabular-nums leading-none text-white sm:text-4xl">{String(v).padStart(2, '0')}</div>
                        <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="relative mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink to={data.cta.href} size="lg" className="bg-lime! text-ink! shadow-none! hover:bg-white!" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {l(data.cta.label)}
                </ButtonLink>
                {data.code && (
                  <button
                    onClick={() => {
                      void navigator.clipboard?.writeText(data.code);
                      toast.success(h('copied'), { description: data.code });
                    }}
                    className="group relative inline-flex h-[52px] items-center gap-3 rounded-2xl border-2 border-dashed border-white/35 bg-white/[0.06] px-6 text-left transition hover:border-lime"
                    title={h('copy')}
                  >
                    <span aria-hidden className="absolute -left-[11px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-brand-700" />
                    <span aria-hidden className="absolute -right-[11px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-brand-700" />
                    <span className="max-w-[90px] text-[10px] font-bold uppercase leading-tight tracking-[0.14em] text-white/55">{h('useCode')}</span>
                    <span className="font-mono text-[15px] font-bold tracking-wider text-lime">{data.code}</span>
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
/* How ordering works                                                   */
/* ------------------------------------------------------------------ */
const STEP_ICONS = [MousePointerClick, Boxes, Truck, Repeat];

export function ProcessSection({ data }: { data: DataOf<'process'> }) {
  const l = useL();
  const h = useDict(H);
  return (
    <section className="relative overflow-hidden bg-sand/70 py-24 sm:py-28">
      <div aria-hidden className="bg-grain pointer-events-none absolute inset-0" />
      <div className="container-x relative">
        <Reveal>
          <SectionHeading eyebrow={l(data.eyebrow)} title={l(data.title)} align="center" />
        </Reveal>
        <ol className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <div aria-hidden className="pointer-events-none absolute left-[10%] right-[10%] top-[58px] hidden border-t-2 border-dashed border-ink/15 lg:block" />
          {data.steps.map((s, i) => {
            const Icon = STEP_ICONS[i % STEP_ICONS.length];
            return (
              <Reveal as="li" key={i} delay={i * 100} className="relative rounded-[26px] bg-white p-6 ring-1 ring-line sm:p-7">
                <div className="flex items-start justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-700 text-lime shadow-[0_14px_30px_-16px_var(--color-brand-700)]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="display text-[46px] leading-none text-ink/[0.08]">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700">
                  {h('step')} {i + 1}
                </div>
                <h3 className="mt-2 text-[19px] font-bold leading-snug text-ink">{l(s.title)}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{l(s.text)}</p>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* For business (services)                                              */
/* ------------------------------------------------------------------ */
export function ServicesSection({ data }: { data: DataOf<'services'> }) {
  const l = useL();
  const h = useDict(H);
  const rail = useRail();
  const [active, setActive] = useState(0);
  const items = data.items;
  const cur = Math.min(active, Math.max(items.length - 1, 0));
  return (
    <section className="py-24 sm:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow={l(data.eyebrow)}
            title={l(data.title)}
            subtitle={l(data.subtitle)}
            action={
              <ButtonLink to="/sherbimet" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                {h('learnMore')}
              </ButtonLink>
            }
          />
        </Reveal>

        {/* Desktop: hover list with image reveal */}
        <div className="mt-14 hidden gap-14 lg:grid lg:grid-cols-[1.05fr_1fr]">
          <ul className="border-t border-dashed border-ink/20">
            {items.map((it, i) => (
              <li key={i}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className="group flex w-full items-start gap-6 border-b border-dashed border-ink/20 py-6 text-left"
                >
                  <span className={cn('display mt-1.5 w-9 text-[15px] tabular-nums transition-colors', cur === i ? 'text-brand-600' : 'text-muted/60')}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1">
                    <span className={cn('display block text-[30px] leading-tight transition-colors', cur === i ? 'text-ink' : 'text-ink/40 group-hover:text-ink/70')}>
                      <span className={cn(cur === i && MARKER)}>{l(it.title)}</span>
                    </span>
                    <span className={cn('grid transition-all duration-500', cur === i ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                      <span className="overflow-hidden text-[15px] leading-relaxed text-muted">{l(it.text)}</span>
                    </span>
                  </span>
                  <ArrowUpRight className={cn('mt-2 h-6 w-6 shrink-0 transition-all', cur === i ? 'rotate-45 text-brand-600' : 'text-ink/25')} />
                </button>
              </li>
            ))}
          </ul>
          <div className="relative">
            <div className="sticky top-28">
              <div aria-hidden className="absolute inset-x-8 -bottom-4 top-8 -rotate-3 rounded-[32px] bg-kraft/60" />
              <div className="relative aspect-[5/6] overflow-hidden rounded-[30px] bg-sand ring-1 ring-line">
                {items.map((it, i) => (
                  <Img key={i} src={it.image} alt={l(it.title)} className={cn('absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700', cur === i ? 'scale-100 opacity-100!' : 'scale-105 opacity-0!')} />
                ))}
                <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl bg-white/92 p-4 backdrop-blur-md">
                  <span className="display grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime text-[15px] text-ink">{String(cur + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-ink">{l(items[cur]?.title)}</div>
                    <div className="text-[12px] font-semibold text-muted">
                      {String(cur + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile / tablet: swipeable cards */}
        <Rail rail={rail} className="mt-10 lg:hidden">
          {items.map((it, i) => (
            <div key={i} className="w-[80%] shrink-0 snap-start overflow-hidden rounded-[24px] bg-white ring-1 ring-line sm:w-[46%]">
              <div className="aspect-[16/10] overflow-hidden bg-sand">
                <Img src={it.image} small alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <div className="display text-[13px] text-brand-600">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="mt-1 text-[18px] font-bold leading-snug text-ink">{l(it.title)}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{l(it.text)}</p>
              </div>
            </div>
          ))}
        </Rail>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* References (projects)                                                */
/* ------------------------------------------------------------------ */
export function ProjectsSection({ data }: { data: DataOf<'projects'> }) {
  const l = useL();
  const h = useDict(H);
  const rail = useRail();
  const all = useDb((s) => s.projects);
  const projects = useMemo(() => [...all].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 8), [all]);
  if (!projects.length) return null;
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-white sm:py-28">
      <div aria-hidden className="bg-grain pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[460px] w-[460px] rounded-full bg-brand-600/25 blur-3xl" />
      <div className="container-x relative">
        <Reveal>
          <SectionHeading eyebrow={l(data.eyebrow)} title={l(data.title)} subtitle={l(data.subtitle)} tone="light" action={<RailArrows rail={rail} tone="light" />} />
        </Reveal>
        <Rail rail={rail} className="mt-12">
          {projects.map((p) => (
            <Link key={p.id} to="/referencat" className="group relative block aspect-[4/5] w-[80%] shrink-0 snap-start overflow-hidden rounded-[28px] bg-ink-soft sm:w-[46%] lg:w-[calc((100%-48px)/3)]">
              <Img src={p.image} small alt={l(p.title)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
              <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-1.5">
                {p.tags.map((tg, k) => (
                  <span key={k} className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur', k === 0 ? 'bg-lime text-ink' : 'bg-ink/60 text-white')}>
                    {l(tg)}
                  </span>
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white/65">
                  <MapPin className="h-3.5 w-3.5" /> {p.location} · {p.year}
                </div>
                <h3 className="display mt-2 text-[24px] leading-[1.05] text-white sm:text-[28px]">{l(p.title)}</h3>
                <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-white/65">{l(p.summary)}</p>
              </div>
            </Link>
          ))}
        </Rail>
        <div className="mt-10">
          <ButtonLink to="/referencat" variant="outlineLight" iconRight={<ArrowRight className="h-4 w-4" />}>
            {h('allProjects')}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stats + quote                                                        */
/* ------------------------------------------------------------------ */
export function StatsSection({ data }: { data: DataOf<'stats'> }) {
  const l = useL();
  const settings = useSettings();
  return (
    <section className="py-24 sm:py-28">
      <div className="container-x grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative pb-10">
          <div aria-hidden className="absolute inset-x-6 bottom-6 top-6 -rotate-3 rounded-[34px] bg-kraft/55" />
          <div className="relative aspect-[5/6] overflow-hidden rounded-[32px] bg-sand ring-1 ring-line">
            <Img src={data.image} alt="" className="h-full w-full object-cover" />
          </div>
          <figure className="absolute bottom-0 left-4 right-4 rounded-[26px] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(15,29,22,0.5)] ring-1 ring-line sm:left-auto sm:right-[-20px] sm:w-[390px]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-lime text-ink">
              <Quote className="h-4 w-4" />
            </span>
            <blockquote className="display mt-4 text-[21px] leading-snug text-ink">„{l(data.quote)}“</blockquote>
            <figcaption className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-muted">
              <LogoMark className="h-5" /> {settings.companyName}
            </figcaption>
          </figure>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-10">
          {data.items.map((s, i) => (
            <Reveal key={i} delay={i * 90} className="border-t-2 border-dashed border-ink/15 pt-6">
              <div className="display text-[46px] leading-none text-ink sm:text-[68px]">
                <span className={cn(i === 0 && MARKER)}>{s.value}</span>
              </div>
              <p className="mt-3 max-w-[20ch] text-[14.5px] leading-snug text-muted sm:text-[15px]">{l(s.label)}</p>
            </Reveal>
          ))}
        </div>
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
    <section className="relative overflow-hidden bg-sand/60 py-24 sm:py-28">
      <div aria-hidden className="bg-grain pointer-events-none absolute inset-0" />
      <div className="container-x relative">
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
        <div className="mt-12 grid gap-5 md:grid-cols-3 lg:gap-6">
          {posts.map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <Link to={`/blog/${p.slug}`} className="group flex h-full flex-col rounded-[26px] bg-white p-3 ring-1 ring-line transition-shadow hover:shadow-[0_30px_60px_-36px_rgba(15,29,22,0.5)]">
                <div className="aspect-[4/3] overflow-hidden rounded-[20px] bg-sand">
                  <Img src={p.cover} small alt="" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col px-2 pb-3 pt-4">
                  <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-muted">
                    <span className="rounded-full bg-lime-soft px-2.5 py-1 text-lime-ink">{l(p.tag)}</span>
                    <span>{date(p.publishedAt, lang)}</span>
                    <span>·</span>
                    <span>{h('minRead', { n: p.readMinutes })}</span>
                  </div>
                  <h3 className="display mt-3 text-[23px] leading-[1.1] text-ink transition-colors group-hover:text-brand-700">{l(p.title)}</h3>
                  <p className="mt-2 line-clamp-2 text-[14.5px] leading-relaxed text-muted">{l(p.excerpt)}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-ink">
                    {h('readMore')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
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
    <section className="py-24 sm:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.3fr] lg:gap-20">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <SectionHeading eyebrow={l(data.eyebrow)} title={l(data.title)} />
            <div className="relative isolate mt-10 overflow-hidden rounded-[26px] bg-brand-700 p-6 text-white sm:p-7">
              <div aria-hidden className="bg-grain pointer-events-none absolute inset-0 -z-10 opacity-80" />
              <h3 className="display text-[22px] leading-tight">{h('helpTitle')}</h3>
              <p className="mt-1.5 text-[14.5px] text-white/70">{h('helpText')}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-ink transition-colors hover:bg-white">
                  <Phone className="h-4 w-4" /> {settings.phone}
                </a>
                {settings.whatsapp && (
                  <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/35 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                    <WhatsAppIcon className="h-4 w-4" /> {h('whatsapp')}
                  </a>
                )}
                <ButtonLink to="/kontakti" variant="outlineLight">
                  {t('nav_contact')}
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
  if (!data.images.length) return null;
  const url = `https://www.instagram.com/${settings.instagram}/`;
  return (
    <section className="pb-24 sm:pb-28">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-brand-700 hover:text-ink">
                <InstagramIcon className="h-4 w-4" /> @{settings.instagram}
              </a>
              <h2 className="display mt-3 text-[32px] leading-[1.04] text-ink sm:text-[44px]">
                <Accent text={l(data.title)} />
              </h2>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-ink px-5 text-sm font-bold text-paper transition-colors hover:bg-brand-700 sm:self-auto">
              <InstagramIcon className="h-4 w-4" /> {h('follow')}
            </a>
          </div>
        </Reveal>
        <div className="mt-10 grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-8">
          {data.images.map((src, i) => (
            <Reveal key={i} delay={i * 50} className={cn(i % 2 === 1 && 'lg:translate-y-5')}>
              <a href={url} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-xl bg-sand sm:rounded-2xl" aria-label={`Instagram ${i + 1}`}>
                <Img src={src} small alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span className="absolute inset-0 grid place-items-center bg-brand-700/0 text-white opacity-0 transition group-hover:bg-brand-700/45 group-hover:opacity-100">
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
/* Free samples CTA + lead form                                         */
/* ------------------------------------------------------------------ */
export function CtaSection({ data }: { data: DataOf<'cta'> }) {
  const l = useL();
  const h = useDict(H);
  // The anchor every "free samples" link on the site points to (shared helper).
  const anchor = useMeasureHref().split('#')[1] || 'mostra';
  return (
    <section id={anchor} className="scroll-mt-28 pb-8">
      <div className="container-x">
        <Reveal>
          <div className="grid gap-3 rounded-[36px] bg-white p-3 ring-1 ring-line sm:p-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative isolate flex min-h-[460px] flex-col overflow-hidden rounded-[28px] bg-brand-700 text-white">
              <Img src={data.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-700 via-brand-700/85 to-brand-700/30" />
              <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[20px] border border-dashed border-white/20" />
              <Sticker className="absolute right-5 top-5 w-[104px] rotate-[12deg] sm:right-7 sm:top-7 sm:w-[120px]">
                <span className="display block text-[30px] leading-none sm:text-[36px]">0 €</span>
                <span className="mt-0.5 block text-[10px] font-extrabold uppercase tracking-[0.12em]">{l(data.eyebrow)}</span>
              </Sticker>
              <div className="relative mt-auto p-7 pt-36 sm:p-10">
                <Eyebrow tone="light">{l(data.eyebrow)}</Eyebrow>
                <h2 className="display mt-4 text-[34px] leading-[1.02] sm:text-[48px]">
                  <Accent text={l(data.title)} accentClassName={ACCENT_ON_DARK} />
                </h2>
                <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/75">{l(data.text)}</p>
                <ul className="mt-6 space-y-2.5">
                  {[h('benefit1'), h('benefit2'), h('benefit3')].map((b) => (
                    <li key={b} className="flex items-center gap-3 text-[15px] font-semibold text-white">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime text-ink">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <MeasureForm className="shadow-none ring-0 lg:p-10" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
