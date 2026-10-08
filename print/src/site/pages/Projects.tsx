import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowRight, FolderOpen, Maximize2 } from 'lucide-react';
import type { Project } from '@/lib/types';
import { Accent, EmptyState, Img, Reveal } from '@/components/ui/misc';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { C, CtaBand } from '@/site/components/company/Blocks';
import { ProjectLightbox } from '@/site/components/company/ProjectLightbox';
import { CmykBar, CropMarks, Eyebrow } from '@/site/components/company/Print';
import { pad2, QUOTE_HREF } from '@/site/components/company/data';
import { INDUSTRIES } from '@/site/components/industries/data';
import { defineDict, useDict, useL } from '@/i18n';
import { site } from '@/i18n/site';
import { useDb } from '@/store/db';
import { cn, slugify } from '@/lib/utils';

const T = defineDict({
  sq: {
    eyebrow: 'Projektet',
    title: 'Punë që *flasin vetë*',
    lead: 'Një përzgjedhje paketimesh, etiketash dhe materialesh të printuara në fabrikën tonë — nga kutitë për restorante te etiketat premium dhe katalogët e markave.',
    industries: 'Sipas industrisë',
    filter: 'Filtro sipas llojit të punës',
    all: 'Të gjitha',
    showing: '{n} nga {total} projekte',
    view: 'Hap rastin',
    emptyTitle: 'Portofoli po përditësohet',
    emptyText: 'Projektet e reja publikohen së shpejti. Ndërkohë, na kërkoni mostra ose shembuj të ngjashëm.',
    emptyTagTitle: 'Nuk ka projekte me këtë etiketë',
    emptyTagText: 'Zgjidhni një kategori tjetër ose shikoni të gjitha projektet.',
    showAll: 'Shfaq të gjitha',
    featured: 'I veçuar',
  },
  en: {
    eyebrow: 'Projects',
    title: 'Work that *speaks for itself*',
    lead: 'A selection of packaging, labels and print produced in our factory — from restaurant boxes to premium labels and brand catalogues.',
    industries: 'By industry',
    filter: 'Filter by type of work',
    all: 'All',
    showing: '{n} of {total} projects',
    view: 'Open case study',
    emptyTitle: 'Portfolio being updated',
    emptyText: 'New projects are published soon. In the meantime, ask us for samples or similar examples.',
    emptyTagTitle: 'No projects with this tag',
    emptyTagText: 'Pick another category or see all projects.',
    showAll: 'Show all',
    featured: 'Featured',
  },
});

const tagKey = (tg: { sq: string }) => slugify(tg.sq);

function ProjectTile({ p, n, big, onOpen }: { p: Project; n: number; big?: boolean; onOpen: () => void }) {
  const t = useDict(T);
  const l = useL();
  return (
    <button type="button" onClick={onOpen} className="group relative flex h-full w-full flex-col text-left" aria-label={`${t('view')}: ${l(p.title)}`}>
      <div className="relative flex-1">
        <CropMarks className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className={cn('relative h-full overflow-hidden rounded-2xl bg-sand ring-1 ring-line/60', big ? 'aspect-[4/3] lg:aspect-auto' : 'aspect-square')}>
          <Img src={p.image} small={!big} alt={l(p.title)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink shadow-sm">{pad2(n)}</span>
          {p.featured && big && <span className="absolute right-3 top-3 rounded-md bg-brand-600 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">{t('featured')}</span>}
          <span className="absolute bottom-4 left-4 inline-flex translate-y-2 items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink opacity-0 shadow-lg transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" /> {t('view')}
          </span>
        </div>
      </div>
      <div className="pt-4">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
          {p.location} · {p.year}
        </div>
        <h3 className={cn('mt-1.5 font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700', big ? 'text-[22px] sm:text-[26px]' : 'text-[17px]')}>{l(p.title)}</h3>
        {p.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.tags.slice(0, 3).map((tg, i) => (
              <span key={i} className="rounded-full bg-sand px-2.5 py-0.5 text-[12px] font-medium text-ink-soft">
                {l(tg)}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

export default function Projects() {
  const ts = useDict(site);
  const t = useDict(T);
  const tc = useDict(C);
  const l = useL();
  const raw = useDb((s) => s.projects);
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<number | null>(null);
  usePageTitle(ts('nav_projects'));

  // Featured first, then newest
  const projects = useMemo(() => [...raw].sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year), [raw]);

  const tags = useMemo(() => {
    const map = new Map<string, { key: string; label: Project['tags'][number]; n: number }>();
    for (const p of projects)
      for (const tg of p.tags) {
        const k = tagKey(tg);
        const cur = map.get(k);
        if (cur) cur.n++;
        else map.set(k, { key: k, label: tg, n: 1 });
      }
    return [...map.values()].sort((a, b) => b.n - a.n);
  }, [projects]);

  const active = tags.some((x) => x.key === params.get('tag')) ? (params.get('tag') as string) : '';
  const list = useMemo(() => (active ? projects.filter((p) => p.tags.some((tg) => tagKey(tg) === active)) : projects), [projects, active]);
  const select = (key: string) => setParams(key ? { tag: key } : {}, { replace: true, preventScrollReset: true });
  const bigFirst = !active && list.length >= 5;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="container-x pb-12 pt-10 sm:pb-16 sm:pt-14">
          <Breadcrumbs items={[{ label: ts('nav_projects') }]} />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div className="animate-fade-up">
              <Eyebrow>{t('eyebrow')}</Eyebrow>
              <h1 className="display mt-5 text-[44px] leading-[1.0] text-ink sm:text-[66px]">
                <Accent text={t('title')} />
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-ink-soft">{t('lead')}</p>
            </div>
            <div className="animate-fade-up [animation-delay:100ms]">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{t('industries')}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {INDUSTRIES.map((ind) => (
                  <ButtonLink key={ind.slug} to={`/industrite/${ind.slug}`} variant="outline" size="sm">
                    {l(ind.name)}
                  </ButtonLink>
                ))}
              </div>
            </div>
          </div>
        </div>
        <CmykBar className="absolute inset-x-0 bottom-0" />
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-x">
          {tags.length > 1 && (
            <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-center md:justify-between">
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label={t('filter')}>
                {[{ key: '', label: t('all'), n: projects.length }, ...tags.map((x) => ({ key: x.key, label: l(x.label), n: x.n }))].map((chip) => (
                  <button
                    key={chip.key || 'all'}
                    type="button"
                    role="tab"
                    aria-selected={active === chip.key}
                    onClick={() => select(chip.key)}
                    className={cn(
                      'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border pl-4 pr-2 text-[13.5px] font-semibold transition-colors',
                      active === chip.key ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink',
                    )}
                  >
                    {chip.label}
                    <span className={cn('grid h-6 min-w-6 place-items-center rounded-full px-1.5 font-mono text-[10.5px]', active === chip.key ? 'bg-white/15 text-white' : 'bg-sand text-ink-soft')}>{chip.n}</span>
                  </button>
                ))}
              </div>
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{t('showing', { n: list.length, total: projects.length })}</span>
            </div>
          )}

          {!projects.length ? (
            <EmptyState
              className="mt-8 rounded-2xl bg-white ring-1 ring-line"
              icon={<FolderOpen className="h-6 w-6" />}
              title={t('emptyTitle')}
              text={t('emptyText')}
              action={
                <ButtonLink to={QUOTE_HREF} variant="dark" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {tc('quote')}
                </ButtonLink>
              }
            />
          ) : !list.length ? (
            <EmptyState
              className="mt-8 rounded-2xl bg-white ring-1 ring-line"
              icon={<FolderOpen className="h-6 w-6" />}
              title={t('emptyTagTitle')}
              text={t('emptyTagText')}
              action={
                <Button variant="dark" onClick={() => select('')}>
                  {t('showAll')}
                </Button>
              }
            />
          ) : (
            <div key={active || 'all'} className="mt-10 grid animate-fade-up grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 70} className={cn('h-full', bigFirst && i === 0 && 'sm:col-span-2 lg:row-span-2')}>
                  <ProjectTile p={p} n={i + 1} big={bigFirst && i === 0} onOpen={() => setOpen(i)} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <ProjectLightbox projects={list} index={open ?? 0} open={open !== null} onClose={() => setOpen(null)} onIndex={setOpen} />

      <CtaBand image="/images/p/qese-premium-litar.webp" />
    </>
  );
}
