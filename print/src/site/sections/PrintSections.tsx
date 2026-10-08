// PrintWorks-specific homepage sections: industries served, production technology, partner / equipment logos.
import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Accent, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/site/components/SectionHeading';
import { useDict, useL } from '@/i18n';
import { cn } from '@/lib/utils';
import { H, ScrollArrows, pad, trackCls, useScroller, type DataOf } from './HomeSections';
import { ChevronTexture, CornerTicks, CropMarks, RegMark } from './motifs';

/** "points" is stored as one bullet per line. */
const lines = (s: string) =>
  s
    .split('\n')
    .map((x) => x.replace(/^[-•·*]\s*/, '').trim())
    .filter(Boolean);

/* ------------------------------------------------------------------ */
/* Industries                                                          */
/* ------------------------------------------------------------------ */
export function IndustriesSection({ data }: { data: DataOf<'industries'> }) {
  const l = useL();
  const h = useDict(H);
  const [active, setActive] = useState(0);
  const { ref, by } = useScroller();
  const items = data.items;
  if (!items.length) return null;
  const idx = Math.min(active, items.length - 1);
  const cur = items[idx];

  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow={l(data.eyebrow)}
            title={l(data.title)}
            subtitle={l(data.subtitle)}
            action={
              <div className="flex items-center gap-3">
                <ScrollArrows by={by} className="lg:hidden" />
                <ButtonLink to="/industrite" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />} className="max-sm:hidden">
                  {h('allIndustries')}
                </ButtonLink>
              </div>
            }
          />
        </Reveal>

        {/* Desktop: list + detail panel */}
        <div className="mt-14 hidden gap-10 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:gap-14">
          <ul className="border-t border-line" role="tablist" aria-orientation="vertical">
            {items.map((it, i) => {
              const on = i === idx;
              return (
                <li key={i}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className="group relative flex w-full items-center gap-5 border-b border-line py-6 text-left"
                  >
                    <span className={cn('absolute -left-px bottom-[-1px] h-[2px] bg-brand-600 transition-all duration-500', on ? 'w-full' : 'w-0')} />
                    <span className={cn('mono w-7 shrink-0 text-[12px] tabular-nums transition-colors', on ? 'text-brand-600' : 'text-muted/60')}>{pad(i + 1)}</span>
                    <span className={cn('display flex-1 text-[26px] leading-tight transition-colors xl:text-[30px]', on ? 'text-ink' : 'text-ink/35 group-hover:text-ink/65')}>{l(it.title)}</span>
                    <ArrowRight className={cn('h-5 w-5 shrink-0 transition-all duration-300', on ? 'translate-x-0 text-brand-600 opacity-100' : '-translate-x-2 text-ink/30 opacity-0')} />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="relative min-h-[480px] overflow-hidden rounded-3xl bg-paper ring-1 ring-line">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="grid h-full grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
              >
                <div className="relative overflow-hidden bg-white">
                  {cur.image && <Img src={cur.image} alt={l(cur.title)} className="absolute inset-0 h-full w-full object-cover" />}
                  <CornerTicks className="text-white/90" />
                </div>
                <div className="flex flex-col p-8 xl:p-10">
                  <div className="mono text-[11px] uppercase tracking-[0.16em] text-muted">
                    {pad(idx + 1)} / {pad(items.length)}
                  </div>
                  <h3 className="display mt-3 text-[30px] leading-[1.05] text-ink">{l(cur.title)}</h3>
                  <ul className="mt-6 divide-y divide-line border-y border-line">
                    {lines(l(cur.points)).map((p, k) => (
                      <li key={k} className="flex items-baseline gap-3 py-2.5 text-[14.5px] leading-snug text-ink-soft">
                        <span className="mono w-5 shrink-0 text-[10.5px] text-brand-600">{pad(k + 1)}</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  {cur.href && (
                    <Link to={cur.href} className="group mt-auto inline-flex items-center gap-2 pt-7 text-[14.5px] font-semibold text-ink">
                      <span className="link-u">{h('viewIndustry')}</span>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white transition-colors group-hover:bg-brand-600">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile / tablet: swipeable cards */}
        <div ref={ref} className={cn(trackCls, 'mt-10 lg:hidden')}>
          {items.map((it, i) => (
            <article key={i} className="flex w-[84%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-paper ring-1 ring-line sm:w-[46%]">
              <div className="relative aspect-[16/10] overflow-hidden bg-white">
                {it.image && <Img src={it.image} small alt="" className="h-full w-full object-cover" />}
                <span className="mono absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] text-ink">{pad(i + 1)}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="display text-[23px] leading-tight text-ink">{l(it.title)}</h3>
                <ul className="mt-4 space-y-2">
                  {lines(l(it.points)).map((p, k) => (
                    <li key={k} className="flex items-baseline gap-2.5 text-[14px] leading-snug text-ink-soft">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-600" />
                      {p}
                    </li>
                  ))}
                </ul>
                {it.href && (
                  <Link to={it.href} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[14px] font-semibold text-ink">
                    {h('viewIndustry')} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Technology                                                          */
/* ------------------------------------------------------------------ */
export function TechnologySection({ data }: { data: DataOf<'technology'> }) {
  const l = useL();
  const h = useDict(H);
  return (
    <section className="relative isolate overflow-hidden bg-ink py-24 text-white sm:py-28">
      <ChevronTexture id="pw-tech-chev" />
      <div className="pointer-events-none absolute -right-40 top-10 -z-10 h-[520px] w-[520px] rounded-full bg-brand-600/20 blur-[140px]" />
      <div className="container-x relative grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <div className="mono flex items-center gap-2.5 text-[11.5px] uppercase tracking-[0.18em] text-brand-300">
              <RegMark className="h-4 w-4" /> {l(data.eyebrow)}
            </div>
            <h2 className="display mt-4 text-[38px] leading-[1.02] sm:text-[52px]">
              <Accent text={l(data.title)} accentClassName="text-brand-400" />
            </h2>
            {l(data.text) && <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/65">{l(data.text)}</p>}
            <ButtonLink to="/teknologjia" variant="outlineLight" className="mt-8" iconRight={<ArrowRight className="h-4 w-4" />}>
              {h('learnMore')}
            </ButtonLink>
          </Reveal>
          {data.image && (
            <Reveal delay={120} className="mt-12">
              <div className="mx-3 sm:mx-0 sm:max-w-[460px]">
                <div className="relative">
                  <CropMarks tone="light" gap={9} len={16} />
                  <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-ink-soft">
                    <Img src={data.image} alt={h('factory')} className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="mono mt-4 text-[10.5px] uppercase tracking-[0.16em] text-white/40">{h('factory')}</div>
              </div>
            </Reveal>
          )}
        </div>

        <ol className="grid self-start border-t border-white/10 sm:grid-cols-2">
          {data.items.map((it, i) => (
            <Reveal
              as="li"
              key={i}
              delay={(i % 2) * 90}
              className={cn('border-b border-white/10 py-8 sm:py-9', i % 2 === 0 ? 'sm:border-r sm:pr-8' : 'sm:pl-8')}
            >
              <div className="flex items-center gap-3">
                <span className="mono text-[12px] tabular-nums text-brand-300">{pad(i + 1)}</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <h3 className="mt-5 text-[18px] font-semibold leading-snug tracking-[-0.01em] text-white">{l(it.title)}</h3>
              {l(it.text) && <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/60">{l(it.text)}</p>}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Partner / equipment logos                                           */
/* ------------------------------------------------------------------ */
export function LogosSection({ data }: { data: DataOf<'logos'> }) {
  const l = useL();
  const logos = data.logos.filter((x) => x.image);
  if (!logos.length) return null;
  return (
    <section className="border-y border-line bg-white">
      <div className="container-x flex flex-col gap-8 py-12 lg:flex-row lg:items-center lg:gap-16 lg:py-14">
        {l(data.title) && <p className="mono max-w-[320px] shrink-0 text-[11px] uppercase leading-relaxed tracking-[0.16em] text-muted">{l(data.title)}</p>}
        <ul className="grid flex-1 grid-cols-3 items-center gap-x-6 gap-y-8 sm:grid-cols-5">
          {logos.map((g, i) => (
            <li key={i} className="flex justify-center">
              <img src={g.image} alt={g.name} title={g.name} loading="lazy" className="h-11 w-auto max-w-full object-contain opacity-60 mix-blend-multiply grayscale transition duration-300 [clip-path:inset(3px)] hover:opacity-100 sm:h-14" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
