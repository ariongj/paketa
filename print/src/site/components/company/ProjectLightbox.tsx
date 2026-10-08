import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Project } from '@/lib/types';
import { Modal } from '@/components/ui/Overlay';
import { ButtonLink } from '@/components/ui/Button';
import { Img } from '@/components/ui/misc';
import { defineDict, useDict, useL } from '@/i18n';
import { cn } from '@/lib/utils';
import { INDUSTRIES, projectsForIndustry } from '@/site/components/industries/data';
import { C } from './Blocks';
import { pad2, QUOTE_HREF } from './data';
import { CmykBar, CropMarks, Eyebrow, Spec } from './Print';

const T = defineDict({
  sq: {
    caseStudy: 'Rast studimi',
    location: 'Vendndodhja',
    year: 'Viti',
    work: 'Punimet',
    industry: 'Industria',
    prev: 'Projekti i mëparshëm',
    next: 'Projekti i radhës',
    close: 'Mbyll',
    similar: 'Keni një projekt të ngjashëm?',
    similarText: 'Na tregoni produktin dhe sasinë — oferta vjen brenda 24 orësh, me provë digjitale para shtypit.',
    keys: '← → për të shfletuar',
    more: 'Më shumë projekte',
  },
  en: {
    caseStudy: 'Case study',
    location: 'Location',
    year: 'Year',
    work: 'Work',
    industry: 'Industry',
    prev: 'Previous project',
    next: 'Next project',
    close: 'Close',
    similar: 'Planning something similar?',
    similarText: 'Tell us the product and quantity — your quote follows within 24 hours, with a digital proof before print.',
    keys: '← → to browse',
    more: 'More projects',
  },
});

/** Case-study viewer: large image, project facts, matching industry, prev/next (arrows, keys, swipe) and a thumbnail strip. */
export function ProjectLightbox({
  projects,
  index,
  open,
  onClose,
  onIndex,
}: {
  projects: Project[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const t = useDict(T);
  const tc = useDict(C);
  const l = useL();
  const n = projects.length;
  const i = Math.min(index, Math.max(0, n - 1));
  const p = projects[i];
  const go = useCallback((d: number) => n > 1 && onIndex((i + d + n) % n), [i, n, onIndex]);

  const industries = useMemo(() => (p ? INDUSTRIES.filter((ind) => projectsForIndustry(ind, [p]).length > 0).slice(0, 2) : []), [p]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, go]);

  // Warm the cache for the neighbours so prev/next feels instant
  useEffect(() => {
    if (!open || n < 2) return;
    [projects[(i + 1) % n], projects[(i - 1 + n) % n]].forEach((x) => {
      const img = new Image();
      img.src = x.image;
    });
  }, [open, i, n, projects]);

  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    // Scroll the strip only (scrollIntoView would also scroll the details panel / page)
    const box = strip.current;
    const el = box?.querySelector<HTMLElement>(`[data-i="${i}"]`);
    if (box && el) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [open, i]);

  const touchX = useRef<number | null>(null);
  const arrow = 'grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-lg ring-1 ring-ink/5 transition hover:scale-105';

  return (
    <Modal open={open && !!p} onClose={onClose} size="full">
      {p && (
        <div className="grid lg:h-[min(86vh,780px)] lg:grid-cols-[1.35fr_1fr]">
          {/* Image */}
          <div
            className="relative flex items-center justify-center bg-paper p-6 sm:p-10 lg:h-full"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            }}
          >
            <div className="relative aspect-square w-full max-w-[560px]">
              <CropMarks />
              <div className="h-full w-full overflow-hidden rounded-2xl bg-white">
                <Img key={p.id} src={p.image} eager alt={l(p.title)} className="h-full w-full object-cover" />
              </div>
            </div>
            {n > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label={t('prev')} title={t('prev')} className={cn(arrow, 'absolute left-3 top-1/2 -translate-y-1/2 sm:left-5')}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label={t('next')} title={t('next')} className={cn(arrow, 'absolute right-3 top-1/2 -translate-y-1/2 sm:right-5')}>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            <div className="absolute bottom-4 left-4 font-mono text-[11px] tracking-[0.16em] text-muted sm:bottom-5 sm:left-6">
              {pad2(i + 1)} / {pad2(n)}
            </div>
            <CmykBar segments className="absolute bottom-5 right-6 hidden sm:flex" />
          </div>

          {/* Details */}
          <div className="flex min-h-0 flex-col border-line p-6 sm:p-8 lg:overflow-y-auto lg:border-l lg:p-10">
            <div key={p.id} className="animate-fade-in">
              <Eyebrow className="pr-12">{t('caseStudy')}</Eyebrow>
              <h2 className="display mt-4 text-[30px] leading-[1.06] text-ink sm:text-[36px]">{l(p.title)}</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">{l(p.summary)}</p>
              <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-6">
                <Spec label={t('location')}>{p.location || '—'}</Spec>
                <Spec label={t('year')}>
                  <span className="font-mono">{p.year}</span>
                </Spec>
                {p.tags.length > 0 && (
                  <Spec label={t('work')} className="col-span-2">
                    <span className="flex flex-wrap gap-1.5 pt-0.5">
                      {p.tags.map((tg, k) => (
                        <span key={k} className="rounded-full bg-sand px-3 py-1 text-[12.5px] font-semibold text-ink-soft">
                          {l(tg)}
                        </span>
                      ))}
                    </span>
                  </Spec>
                )}
                {industries.length > 0 && (
                  <Spec label={t('industry')} className="col-span-2">
                    <span className="flex flex-wrap gap-x-4 gap-y-1">
                      {industries.map((ind) => (
                        <Link key={ind.slug} to={`/industrite/${ind.slug}`} onClick={onClose} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                          {l(ind.name)} <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      ))}
                    </span>
                  </Spec>
                )}
              </div>
            </div>

            <div className="mt-7 rounded-2xl bg-ink p-5 text-white sm:p-6">
              <div className="text-[16px] font-semibold">{t('similar')}</div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">{t('similarText')}</p>
              <ButtonLink to={QUOTE_HREF} onClick={onClose} size="sm" className="mt-4" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                {tc('quote')}
              </ButtonLink>
            </div>

            {n > 1 && (
              <div className="mt-auto pt-8">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{t('more')}</span>
                  <span className="hidden font-mono text-[10.5px] text-muted lg:inline">{t('keys')}</span>
                </div>
                <div ref={strip} className="no-scrollbar relative -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
                  {projects.map((x, k) => (
                    <button
                      key={x.id}
                      type="button"
                      data-i={k}
                      onClick={() => onIndex(k)}
                      aria-label={l(x.title)}
                      aria-current={k === i}
                      className={cn(
                        'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand transition',
                        k === i ? 'ring-2 ring-brand-600 ring-offset-2 ring-offset-white' : 'opacity-55 hover:opacity-100',
                      )}
                    >
                      <Img src={x.image} small alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        title={t('close')}
        className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-md ring-1 ring-ink/5 transition hover:bg-sand lg:right-4 lg:top-4"
      >
        <X className="h-5 w-5" />
      </button>
    </Modal>
  );
}
