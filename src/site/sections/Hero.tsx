import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react';
import type { HeroSlide, Product } from '@/lib/types';
import { Accent, Img } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { ACCENT_ON_DARK } from '@/site/components/SectionHeading';
import { useMeasureHref } from '@/site/components/company/data';
import { useDict, useL, useLang } from '@/i18n';
import { basePrice, piecePrice, piecesPerUnit } from '@/lib/pricing';
import { money, moneyPiece } from '@/lib/format';
import { useActiveProducts, useCategories } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { H } from './dict';
import { Sticker, catSlugOf, topSeller } from './parts';

const DURATION = 7000;

interface SlidePick {
  product?: Product;
  /** Sticker: lowest per-piece price ("nga 0,04 €/copë") or the logo-print surcharge per piece */
  sticker: { kind: 'piece' | 'print'; value: number } | null;
}

/**
 * Per slide: the best seller of the category the slide links to (or of the whole range) and a price sticker.
 * A slide that links to the business services (logo print) shows the logo-print price per piece instead.
 */
function useSlidePicks(slides: HeroSlide[]): SlidePick[] {
  const products = useActiveProducts();
  const cats = useCategories();
  return useMemo(
    () =>
      slides.map((sl) => {
        const hrefs = [sl.primary.href, sl.secondary.href];
        const slug = hrefs.map(catSlugOf).find(Boolean);
        const cat = slug ? cats.find((c) => c.slug === slug) : undefined;
        const buyable = products.filter((p) => !p.quoteOnly && p.status === 'active');
        if (!cat && hrefs.some((x) => x.startsWith('/sherbimet'))) {
          const printable = buyable.filter((p) => p.installation?.available && p.installation.price > 0);
          if (printable.length) {
            const value = Math.min(...printable.map((p) => (p.installation?.price ?? 0) / piecesPerUnit(p)));
            return { product: topSeller(printable), sticker: { kind: 'print', value } };
          }
        }
        const pool = cat ? buyable.filter((p) => p.categoryId === cat.id) : buyable;
        const list = pool.length ? pool : buyable;
        const pieceList = list.filter((p) => piecesPerUnit(p) > 1);
        const value = pieceList.length ? Math.min(...pieceList.map((p) => piecePrice(p))) : NaN;
        return { product: topSeller(list), sticker: Number.isFinite(value) ? { kind: 'piece', value } : null };
      }),
    [slides, products, cats],
  );
}

export function HeroSection({ slides, autoplay }: { slides: HeroSlide[]; autoplay: boolean }) {
  const l = useL();
  const lang = useLang();
  const h = useDict(H);
  const samplesHref = useMeasureHref();
  const picks = useSlidePicks(slides);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((n: number) => setI(((n % count) + count) % count), [count]);

  useEffect(() => {
    if (i >= count) setI(0);
  }, [count, i]);

  if (!count) return null;
  const idx = Math.min(i, count - 1);
  const s = slides[idx];
  const pick = picks[idx];
  const isSamples = (href: string) => href === samplesHref || href.includes('#') || href.includes('mostra');

  const fade = (delay: number, y = 18) => ({
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] as const } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.22 } },
  });

  return (
    <section className="pt-3 sm:pt-4" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-brand-700 text-white sm:rounded-[40px]">
          <div aria-hidden className="bg-grain pointer-events-none absolute inset-0 -z-10 opacity-80" />
          <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-brand-500/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute inset-3 -z-10 rounded-[20px] border border-dashed border-white/15 sm:inset-4 sm:rounded-[30px]" />

          <div className="container-x grid items-center gap-10 pb-8 pt-10 sm:pb-12 sm:pt-14 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:pb-14 lg:pt-16 xl:gap-20">
            {/* Copy */}
            <div className="relative min-w-0">
              <AnimatePresence mode="wait">
                <motion.div key={s.id} initial="hidden" animate="show" exit="exit">
                  <motion.div variants={fade(0.05, 10)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-lime ring-1 ring-white/15 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                    {l(s.eyebrow)}
                  </motion.div>
                  <motion.h1 variants={fade(0.12, 28)} className="display mt-6 text-[44px] leading-[0.96] sm:text-[64px] lg:text-[70px] xl:text-[84px]">
                    <Accent text={l(s.title)} accentClassName={ACCENT_ON_DARK} />
                  </motion.h1>
                  <motion.p variants={fade(0.22)} className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-white/75 sm:text-[18px]">
                    {l(s.subtitle)}
                  </motion.p>
                  <motion.div variants={fade(0.32, 14)} className="mt-8 flex flex-wrap gap-3">
                    <ButtonLink to={s.primary.href} size="lg" className="bg-lime! text-ink! shadow-none! hover:bg-white!" iconRight={<ArrowRight className="h-4 w-4" />}>
                      {l(s.primary.label)}
                    </ButtonLink>
                    <ButtonLink to={s.secondary.href} size="lg" variant="outlineLight" icon={isSamples(s.secondary.href) ? <PackageOpen className="h-4 w-4" /> : undefined}>
                      {l(s.secondary.label)}
                    </ButtonLink>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Slide tabs */}
              {count > 1 && (
                <div className="mt-10 hidden grid-cols-3 gap-4 border-t border-dashed border-white/20 pt-5 lg:grid" role="tablist">
                  {slides.map((sl, k) => (
                    <button key={sl.id} role="tab" aria-selected={k === idx} onClick={() => go(k)} className="group min-w-0 text-left">
                      <span className="relative block h-[3px] overflow-hidden rounded-full bg-white/15">
                        <span
                          className={cn('absolute inset-y-0 left-0 rounded-full bg-lime', k < idx || (k === idx && !autoplay) ? 'w-full' : 'w-0')}
                          style={k === idx && autoplay ? { animation: `heroprogress ${DURATION}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' } : undefined}
                          onAnimationEnd={k === idx && autoplay ? () => go(idx + 1) : undefined}
                        />
                      </span>
                      <span className={cn('mt-3 flex items-baseline gap-2 transition-colors', k === idx ? 'text-white' : 'text-white/45 group-hover:text-white/80')}>
                        <span className="font-display text-[13px] font-bold tabular-nums">{String(k + 1).padStart(2, '0')}</span>
                        <span className="truncate text-[13px] font-semibold">{l(sl.eyebrow)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Image composition */}
            <div className="relative mx-auto w-full max-w-[640px] pb-10 sm:pb-12 lg:pb-8">
              <div aria-hidden className="absolute inset-x-6 bottom-4 top-6 rotate-[4deg] rounded-[34px] bg-kraft shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] sm:inset-x-10" />
              <div className="relative aspect-[6/5] overflow-hidden rounded-[28px] bg-sand ring-4 ring-white/90 sm:rounded-[34px]">
                {slides.map((sl, k) => (
                  <img
                    key={sl.id}
                    src={sl.image}
                    alt={k === idx ? l(sl.title).replace(/\*/g, '') : ''}
                    aria-hidden={k !== idx}
                    loading={k === 0 ? 'eager' : 'lazy'}
                    className={cn(
                      'absolute inset-0 h-full w-full object-cover transition-opacity duration-[1100ms] ease-out',
                      k === idx ? 'animate-[kenburns_9s_ease-out_both] opacity-100' : 'opacity-0',
                    )}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {pick?.sticker && (
                  <motion.div
                    key={`st-${s.id}`}
                    initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.25 }}
                    className="absolute -left-2 -top-5 sm:-left-6 sm:-top-7"
                  >
                    <Sticker tone={pick.sticker.kind === 'print' ? 'pink' : 'lime'} className="w-[104px] sm:w-[128px]">
                      <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] sm:text-[11px]">{pick.sticker.kind === 'print' ? 'Logo' : h('from')}</span>
                      <span className="display block text-[22px] leading-none sm:text-[28px]">
                        {pick.sticker.kind === 'print' ? '+' : ''}
                        {moneyPiece(pick.sticker.value, lang)}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] font-bold sm:text-[12px]">{h('perPiece')}</span>
                    </Sticker>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {pick?.product && (
                  <motion.div
                    key={`pc-${s.id}`}
                    initial={{ y: 18, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-0 left-3 right-3 sm:left-auto sm:right-6 sm:w-[340px] lg:-left-8 lg:right-auto"
                  >
                    <HeroProductChip product={pick.product} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile / tablet controls */}
          {count > 1 && (
            <div className="container-x flex items-center justify-between gap-4 pb-6 lg:hidden">
              <div className="flex flex-1 gap-2">
                {slides.map((sl, k) => (
                  <button key={sl.id} onClick={() => go(k)} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/20" aria-label={h('slide', { n: k + 1 })}>
                    <span
                      className={cn('absolute inset-y-0 left-0 rounded-full bg-lime', k < idx || (k === idx && !autoplay) ? 'w-full' : 'w-0')}
                      style={k === idx && autoplay ? { animation: `heroprogress ${DURATION}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' } : undefined}
                      onAnimationEnd={k === idx && autoplay ? () => go(idx + 1) : undefined}
                    />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => go(idx - 1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white" aria-label={h('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => go(idx + 1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white" aria-label={h('next')}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Floating white card: best seller with pack price, pack size and per-piece price. */
function HeroProductChip({ product }: { product: Product }) {
  const l = useL();
  const lang = useLang();
  const h = useDict(H);
  const pcs = piecesPerUnit(product);
  return (
    <Link
      to={`/produkt/${product.slug}`}
      className="group flex items-center gap-3 rounded-[22px] bg-white p-2.5 pr-4 text-ink shadow-[0_24px_50px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
    >
      <span className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-2xl bg-sand">
        <Img src={product.images[0]} small eager alt="" className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-lime-ink">★ {h('bestseller')}</span>
        <span className="mt-0.5 block truncate text-[14px] font-bold leading-tight">{l(product.name)}</span>
        <span className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[12.5px]">
          <span className="font-bold tabular-nums">{money(basePrice(product), lang)}</span>
          <span className="text-muted">{h('perPack')}</span>
          {pcs > 1 && (
            <>
              <span className="text-muted">·</span>
              <span className="font-semibold text-brand-700 tabular-nums">
                {moneyPiece(piecePrice(product), lang)}
                {h('perPiece')}
              </span>
            </>
          )}
        </span>
      </span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors group-hover:bg-brand-600">
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
