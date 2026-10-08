import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroSlide } from '@/lib/types';
import { Accent, plain } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { defineDict, useDict, useL } from '@/i18n';
import { cn } from '@/lib/utils';
import { ChevronTexture, CmykDots, CropMarks, RegMark } from './motifs';

const DURATION = 7000;

const H = defineDict({
  sq: {
    slide: 'Sllajdi {n}',
    prev: 'Sllajdi i mëparshëm',
    next: 'Sllajdi i radhës',
    sheet: 'Fleta',
    ticker: 'Printim offset · HP Indigo · Flexo LED UV · Heidelberg Versafire · Prerje me matricë · Ngjitje kutish · Llak UV · Kontroll cilësie',
  },
  en: {
    slide: 'Slide {n}',
    prev: 'Previous slide',
    next: 'Next slide',
    sheet: 'Sheet',
    ticker: 'Offset printing · HP Indigo · LED UV flexo · Heidelberg Versafire · Die-cutting · Folder gluing · UV varnish · Quality control',
  },
});

/**
 * Dark hero: headline on the left, the slide's product photo as a "press sheet" on the right (crop marks,
 * colour bar), with the other slides stacked behind it. Images stay at their native square size — no
 * full-bleed upscaling.
 */
export function HeroSection({ slides, autoplay }: { slides: HeroSlide[]; autoplay: boolean }) {
  const l = useL();
  const h = useDict(H);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((n: number) => setI(((n % count) + count) % count), [count]);

  useEffect(() => {
    if (i >= count) setI(0);
  }, [count, i]);

  if (!count) return null;
  const cur = Math.min(i, count - 1);
  const s = slides[cur];
  // Slides behind the active one (max two), nearest first
  const behind = Array.from({ length: Math.min(2, count - 1) }, (_, k) => (cur + k + 1) % count);
  const ticker = h('ticker').split(' · ');

  return (
    <section
      className="relative isolate overflow-hidden bg-ink text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <ChevronTexture id="pw-hero-chev" />
      <div className="pointer-events-none absolute -right-48 top-24 -z-10 h-[640px] w-[640px] rounded-full bg-brand-600/30 blur-[150px]" />
      <div className="pointer-events-none absolute -left-40 bottom-0 -z-10 h-[420px] w-[420px] rounded-full bg-brand-900/40 blur-[120px]" />

      <div className="container-x relative grid items-center gap-14 pb-14 pt-[112px] sm:pt-[128px] lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:pb-20 lg:pt-[140px] xl:gap-20">
        {/* Copy */}
        <div className="relative min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={s.id} initial="hidden" animate="show" exit="exit">
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.05 } }, exit: { opacity: 0, y: -6, transition: { duration: 0.2 } } }}
                className="mono flex items-center gap-2.5 text-[11.5px] font-medium uppercase tracking-[0.18em] text-white/65"
              >
                <RegMark className="h-[18px] w-[18px] text-brand-400" />
                {l(s.eyebrow)}
              </motion.div>
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.85, delay: 0.12, ease: [0.16, 1, 0.3, 1] } }, exit: { opacity: 0, y: -10, transition: { duration: 0.22 } } }}
                className="display mt-6 text-[52px] leading-[0.94] text-white sm:text-[76px] lg:text-[84px] xl:text-[104px]"
              >
                <Accent text={l(s.title)} accentClassName="text-brand-400" />
              </motion.h1>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.24 } }, exit: { opacity: 0, transition: { duration: 0.18 } } }}
                className="mt-7 max-w-[34rem] text-[16.5px] leading-relaxed text-white/70 sm:text-[18px]"
              >
                {l(s.subtitle)}
              </motion.p>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.34 } }, exit: { opacity: 0, transition: { duration: 0.18 } } }}
                className="mt-9 flex flex-wrap gap-3"
              >
                {s.primary.href && l(s.primary.label) && (
                  <ButtonLink to={s.primary.href} size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                    {l(s.primary.label)}
                  </ButtonLink>
                )}
                {s.secondary.href && l(s.secondary.label) && (
                  <ButtonLink to={s.secondary.href} size="lg" variant="outlineLight">
                    {l(s.secondary.label)}
                  </ButtonLink>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Slide controls */}
          {count > 1 && (
            <div className="mt-12 flex items-center gap-5 lg:mt-16">
              <span className="mono text-[12px] tabular-nums text-white/50">
                <span className="text-white">{String(cur + 1).padStart(2, '0')}</span> / {String(count).padStart(2, '0')}
              </span>
              <div className="flex gap-1.5">
                {slides.map((sl, k) => (
                  <button key={sl.id} onClick={() => go(k)} className="group relative h-6 w-12 sm:w-14" aria-label={h('slide', { n: k + 1 })} aria-current={k === cur || undefined}>
                    <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden rounded-full bg-white/20 transition-colors group-hover:bg-white/35">
                      <span
                        className={cn('absolute inset-y-0 left-0 bg-white', k < cur || (k === cur && !autoplay) ? 'w-full' : 'w-0')}
                        style={k === cur && autoplay ? { animation: `heroprogress ${DURATION}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' } : undefined}
                        onAnimationEnd={k === cur && autoplay ? () => go(cur + 1) : undefined}
                      />
                    </span>
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-2 lg:ml-2">
                <button onClick={() => go(cur - 1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:bg-white hover:text-ink" aria-label={h('prev')}>
                  <ChevronLeft className="h-[18px] w-[18px]" />
                </button>
                <button onClick={() => go(cur + 1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:bg-white hover:text-ink" aria-label={h('next')}>
                  <ChevronRight className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Press-sheet stack */}
        <div className="relative mx-auto w-full max-w-[440px] px-6 sm:max-w-[500px] lg:max-w-[540px] lg:px-0">
          <div className="relative aspect-square">
            {behind
              .slice()
              .reverse()
              .map((k, depth) => {
                const near = depth === behind.length - 1;
                return (
                  <button
                    key={slides[k].id}
                    type="button"
                    onClick={() => go(k)}
                    aria-label={plain(l(slides[k].title)) || h('slide', { n: k + 1 })}
                    className={cn(
                      'absolute inset-0 overflow-hidden rounded-[26px] bg-white shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] transition-[transform,opacity] duration-700 ease-[cubic-bezier(.16,1,.3,1)] hover:opacity-90',
                      near ? 'translate-x-[9%] -translate-y-[6%] rotate-[6deg] scale-[0.84] opacity-60' : '-translate-x-[9%] translate-y-[5%] -rotate-[7deg] scale-[0.8] opacity-40',
                    )}
                  >
                    <img src={slides[k].image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            <div className="absolute inset-0">
              <CropMarks tone="light" gap={10} len={18} />
              <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-white shadow-[0_50px_100px_-40px_rgba(0,0,0,0.95)] ring-1 ring-white/10">
                {slides.map((sl, k) => (
                  <img
                    key={sl.id}
                    src={sl.image}
                    alt={k === cur ? plain(l(sl.title)) : ''}
                    loading={k === 0 ? 'eager' : 'lazy'}
                    aria-hidden={k !== cur}
                    className={cn('absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[900ms] ease-out', k === cur ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0')}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* Sheet slug line + colour bar */}
          <div className="mono mt-6 flex items-center justify-between gap-4 text-[10.5px] uppercase tracking-[0.16em] text-white/40">
            <span className="truncate">
              PW · {h('sheet')} {String(cur + 1).padStart(2, '0')}/{String(count).padStart(2, '0')} · CMYK
            </span>
            <CmykDots />
          </div>
        </div>
      </div>

      {/* Technology ticker */}
      <div className="relative border-t border-white/10">
        <div className="mask-fade-x overflow-hidden py-4">
          <div className="flex w-max animate-marquee gap-10 pr-10 motion-reduce:animate-none">
            {[0, 1].map((rep) => (
              <div key={rep} className="flex shrink-0 items-center gap-10" aria-hidden={rep === 1}>
                {ticker.map((w) => (
                  <span key={w} className="mono flex items-center gap-10 whitespace-nowrap text-[11.5px] uppercase tracking-[0.18em] text-white/45">
                    {w}
                    <RegMark className="h-3 w-3 text-white/25" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
