import { useMemo, useState } from 'react';
import { BadgeCheck, FolderOpen, MapPin, Maximize2, Palette, PenTool, Stamp, Upload } from 'lucide-react';
import type { Project } from '@/lib/types';
import { EmptyState, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { PageHero } from '@/site/components/SectionHeading';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { C, CtaBand } from '@/site/components/company/Blocks';
import { ProjectLightbox } from '@/site/components/company/ProjectLightbox';
import { LOGO_QUOTE_HREF } from '@/site/components/company/data';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useDb } from '@/store/db';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    eyebrow: 'Reference',
    title: 'Ambalaža sa *vašim logom*',
    subtitle: 'Primjeri personalizovane ambalaže za kafiće, restorane, poslastičarnice i brzu hranu — čaše, kutije, kese i naljepnice sa brendom lokala.',
    flow1: 'Logo',
    flow2: 'Probni dizajn',
    flow3: 'Odobrenje',
    flow4: 'Izrada 7–10 dana',
    all: 'Sve',
    filter: 'Filtriraj po vrsti ambalaže',
    showing: 'Prikazano {n} od {total}',
    view: 'Pogledaj primjer',
    emptyTitle: 'Uskoro novi primjeri',
    emptyText: 'Galerija se upravo dopunjava. U međuvremenu nam pošaljite logo — pripremamo probni dizajn.',
  },
  sq: {
    eyebrow: 'Referencat',
    title: 'Paketim me *logon tuaj*',
    subtitle: 'Shembuj paketimesh të personalizuara për kafiteri, restorante, pastiçeri dhe fast food — gota, kuti, qese dhe etiketa me markën e lokalit.',
    flow1: 'Logoja',
    flow2: 'Dizajni provë',
    flow3: 'Aprovimi',
    flow4: 'Prodhimi 7–10 ditë',
    all: 'Të gjitha',
    filter: 'Filtro sipas llojit të paketimit',
    showing: 'Shfaqen {n} nga {total}',
    view: 'Shiko shembullin',
    emptyTitle: 'Së shpejti shembuj të rinj',
    emptyText: 'Galeria po plotësohet. Ndërkohë na dërgoni logon — ju përgatisim dizajnin provë.',
  },
  en: {
    eyebrow: 'References',
    title: 'Packaging with *your logo*',
    subtitle: 'Examples of custom-branded packaging for cafés, restaurants, pastry shops and fast food — cups, boxes, bags and labels carrying the venue’s brand.',
    flow1: 'Your logo',
    flow2: 'Proof',
    flow3: 'Approval',
    flow4: 'Production 7–10 days',
    all: 'All',
    filter: 'Filter by packaging type',
    showing: 'Showing {n} of {total}',
    view: 'View example',
    emptyTitle: 'New examples coming soon',
    emptyText: 'The gallery is being updated. Meanwhile, send us your logo — we’ll prepare a proof.',
  },
});

/* ------------------------------------------------------------------ */
/* Bento layout                                                        */
/* Blocks of three tile a 12-column grid with no holes: one large      */
/* (7 cols × 2 rows) + two small (5 cols), mirrored every other block. */
/* Leftovers become 7/5 pairs so the last row is always full.          */
/* ------------------------------------------------------------------ */
type Size = 'big' | 'small' | 'pairWide' | 'pairNarrow' | 'solo';

function bento(n: number): Size[] {
  if (n === 1) return ['solo'];
  const out: Size[] = [];
  const rem = n % 3;
  // with one leftover, the last full block + leftover form two 7/5 pairs
  const blocks = Math.floor(n / 3) - (rem === 1 ? 1 : 0);
  for (let b = 0; b < blocks; b++) out.push(...((b % 2 === 0 ? ['big', 'small', 'small'] : ['small', 'big', 'small']) as Size[]));
  const pairs = rem === 1 ? 2 : rem === 2 ? 1 : 0;
  for (let k = 0; k < pairs; k++) {
    const mirror = (blocks + k) % 2 === 1;
    out.push(...((mirror ? ['pairNarrow', 'pairWide'] : ['pairWide', 'pairNarrow']) as Size[]));
  }
  return out;
}

const SPAN: Record<Size, string> = {
  big: 'sm:col-span-2 lg:col-span-7 lg:row-span-2',
  solo: 'sm:col-span-2 lg:col-span-12 lg:row-span-2',
  small: 'lg:col-span-5',
  pairWide: 'lg:col-span-7',
  pairNarrow: 'lg:col-span-5',
};

const ASPECT: Record<Size, string> = {
  big: 'aspect-[4/5] sm:aspect-[16/10]',
  solo: 'aspect-[4/5] sm:aspect-[16/10]',
  small: 'aspect-[5/4] sm:aspect-[4/5]',
  pairWide: 'aspect-[5/4] sm:aspect-[4/5]',
  pairNarrow: 'aspect-[5/4] sm:aspect-[4/5]',
};

function ProjectTile({ project: p, size, onOpen }: { project: Project; size: Size; onOpen: () => void }) {
  const l = useL();
  const t = useDict(T);
  const big = size === 'big' || size === 'solo';
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${t('view')}: ${l(p.title)}`}
      className={cn('group relative block w-full overflow-hidden rounded-3xl bg-ink text-left lg:aspect-auto lg:h-full', ASPECT[size])}
    >
      <Img
        src={p.image}
        small={!big}
        alt={l(p.title)}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
      <div className="absolute inset-0 bg-brand-900/0 transition-colors duration-500 group-hover:bg-brand-900/30" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap gap-1.5">
          {p.tags.map((tg, k) => (
            <span key={k} className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md', k === 0 ? 'bg-lime text-ink' : 'bg-white/85 text-ink')}>
              {l(tg)}
            </span>
          ))}
        </div>
        <span className="grid h-11 w-11 shrink-0 translate-y-1 scale-90 place-items-center rounded-full bg-white text-ink opacity-0 shadow-lg transition-all duration-500 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="h-4 w-4" />
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        {p.location && (
          <div className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.16em] text-white/75">
            <MapPin className="h-3.5 w-3.5" />
            {p.location}
          </div>
        )}
        <h3 className={cn('display mt-2 max-w-xl leading-[1.08] text-white', big ? 'text-[28px] sm:text-[38px] lg:text-[44px]' : 'text-[24px] sm:text-[28px]')}>{l(p.title)}</h3>
        <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:grid-rows-[1fr] group-hover:opacity-100">
          <div className="overflow-hidden">
            <p className="max-w-lg pt-2.5 text-[14.5px] leading-relaxed text-white/80">{l(p.summary)}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Projects() {
  const ts = useDict(site);
  const t = useDict(T);
  const tc = useDict(C);
  const l = useL();
  const lang = useLang();
  const all = useDb((s) => s.projects);
  usePageTitle(ts('nav_projects'));

  // Selected tag is remembered together with the language it was picked in,
  // so switching language simply falls back to "all".
  const [sel, setSel] = useState<{ lang: string; label: string } | null>(null);
  const active = sel && sel.lang === lang ? sel.label : null;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const list = useMemo(() => [...all].sort((a, b) => Number(b.featured) - Number(a.featured)), [all]);

  const tags = useMemo(() => {
    const m = new Map<string, number>();
    list.forEach((p) => {
      const seen = new Set<string>();
      p.tags.forEach((tg) => {
        const label = l(tg).trim();
        if (!label || seen.has(label)) return;
        seen.add(label);
        m.set(label, (m.get(label) ?? 0) + 1);
      });
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count }));
  }, [list, l]);

  const shown = useMemo(() => (active ? list.filter((p) => p.tags.some((tg) => l(tg).trim() === active)) : list), [list, active, l]);
  const sizes = useMemo(() => bento(shown.length), [shown.length]);

  const chip = (on: boolean) =>
    cn(
      'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold transition-colors',
      on ? 'bg-brand-600 text-white' : 'bg-white text-ink-soft ring-1 ring-line hover:text-ink hover:ring-brand-600/40',
    );

  const flow = [
    { icon: Upload, label: t('flow1') },
    { icon: PenTool, label: t('flow2') },
    { icon: BadgeCheck, label: t('flow3') },
    { icon: Stamp, label: t('flow4') },
  ];

  return (
    <>
      <PageHero crumbs={[{ label: ts('nav_projects') }]} eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')}>
        <div className="mt-9 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <ol className="flex flex-wrap items-center gap-2">
            {flow.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex items-center gap-2">
                <span className={cn('inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold ring-1', i === flow.length - 1 ? 'bg-lime text-ink ring-lime' : 'bg-white text-ink ring-line')}>
                  <Icon className={cn('h-4 w-4', i === flow.length - 1 ? 'text-ink' : 'text-brand-600')} />
                  {label}
                </span>
                {i < flow.length - 1 && <span aria-hidden className="w-5 border-t-2 border-dashed border-ink/20" />}
              </li>
            ))}
          </ol>
          <ButtonLink to={LOGO_QUOTE_HREF} size="lg" icon={<Palette className="h-4 w-4" />} className="self-start lg:self-auto">
            {tc('logoQuote')}
          </ButtonLink>
        </div>
      </PageHero>

      {list.length === 0 ? (
        <div className="container-x py-16">
          <EmptyState
            icon={<FolderOpen className="h-6 w-6" />}
            title={t('emptyTitle')}
            text={t('emptyText')}
            action={
              <ButtonLink to={LOGO_QUOTE_HREF} variant="dark">
                {tc('logoQuote')}
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <>
          {/* Filter bar */}
          {tags.length > 1 && (
            <div className="sticky top-[64px] z-30 border-b border-line bg-paper/90 backdrop-blur-xl lg:top-[76px]">
              <div className="container-x flex items-center gap-4 py-3">
                <div role="group" aria-label={t('filter')} className="no-scrollbar -mx-4 flex flex-1 gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                  <button type="button" aria-pressed={!active} onClick={() => setSel(null)} className={chip(!active)}>
                    {t('all')}
                    <span className={cn('text-[12px] tabular-nums', !active ? 'text-white/65' : 'text-muted')}>{list.length}</span>
                  </button>
                  {tags.map((tg) => {
                    const on = active === tg.label;
                    return (
                      <button key={tg.label} type="button" aria-pressed={on} onClick={() => setSel(on ? null : { lang, label: tg.label })} className={chip(on)}>
                        {tg.label}
                        <span className={cn('text-[12px] tabular-nums', on ? 'text-white/65' : 'text-muted')}>{tg.count}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="hidden shrink-0 text-[13px] text-muted md:block">{t('showing', { n: shown.length, total: list.length })}</div>
              </div>
            </div>
          )}

          {/* Bento grid */}
          <section className="pb-4 pt-10 sm:pt-14">
            <div className="container-x">
              <div key={active ?? '*'} className="grid grid-cols-1 gap-4 sm:grid-flow-row-dense sm:grid-cols-2 lg:auto-rows-[300px] lg:grid-flow-row lg:grid-cols-12 lg:gap-6">
                {shown.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 90} className={SPAN[sizes[i]]}>
                    <ProjectTile
                      project={p}
                      size={sizes[i]}
                      onOpen={() => {
                        setIndex(i);
                        setOpen(true);
                      }}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <CtaBand image="/images/projects/kuti.webp" />

      <ProjectLightbox projects={shown} index={index} open={open} onClose={() => setOpen(false)} onIndex={setIndex} />
    </>
  );
}
