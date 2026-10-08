import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Accent, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { BrandStrip, C, CtaBand, Heading, ProductionFlow } from '@/site/components/company/Blocks';
import { ChevronTexture, CmykBar, CropMarks, Eyebrow, MonoChip } from '@/site/components/company/Print';
import { SERVICES, TECH, type Tech, type TechGroup } from '@/site/components/company/tech';
import { pad2, QUOTE_HREF } from '@/site/components/company/data';
import { defineDict, useDict, useL } from '@/i18n';
import { site } from '@/i18n/site';
import { useCategories } from '@/store/hooks';
import { cn } from '@/lib/utils';

const T = defineDict({
  sq: {
    eyebrow: 'Teknologjia & shërbimet',
    title: 'Tetë teknologji. *Një çati.*',
    lead: 'Offset B1, HP Indigo, flexo me 8 ngjyra LED UV dhe Heidelberg Versafire — të lidhura me prerjen, ngjitjen, llakun UV dhe kontrollin e cilësisë në të njëjtën fabrikë. Kështu zgjedhim procesin e duhur për çdo tirazh.',
    seeTech: 'Shiko teknologjitë',
    statTech: 'teknologji prodhimi',
    statProof: 'provë digjitale',
    statWh: 'depo',
    statCountries: 'shtete',
    indexEyebrow: 'Parku i makinerive',
    indexTitle: 'Teknologjia e duhur për *çdo punë*',
    indexText: 'Çdo makinë ka vendin e saj: digjitali për mostra dhe seri të shkurtra, offset-i dhe flexo-ja për tirazhe të mëdha me ngjyrë të qëndrueshme.',
    g_print: 'Printimi',
    g_convert: 'Përpunimi',
    g_finish: 'Finishing',
    bestFor: 'Më e mira për',
    makes: 'Prodhon',
    runsEyebrow: 'Cila makinë, për cilin tirazh?',
    runsTitle: 'Harta e *tirazheve*',
    runsText: 'Një udhëzues orientues — zgjedhjen përfundimtare e bëjmë bashkë sipas produktit, materialit, sasisë dhe afatit.',
    r0: 'Mostra & maketa',
    r1: 'Tirazh i shkurtër',
    r2: 'Tirazh i mesëm',
    r3: 'Tirazh i madh',
    indicative: 'Orientuese · jo çmim',
    servicesEyebrow: 'Shërbimet',
    servicesTitle: 'Më shumë se *printim*',
    servicesText: 'Rreth makinerive qëndron një ekip që kujdeset për skedarët, strukturën, provën, mostrat, magazinimin dhe dërgesën.',
    learnMore: 'Më shumë',
    products: 'Produktet',
  },
  en: {
    eyebrow: 'Technology & services',
    title: 'Eight technologies. *One roof.*',
    lead: 'B1 offset, HP Indigo, 8-colour LED UV flexo and the Heidelberg Versafire — connected to die-cutting, folder gluing, UV varnish and quality control in the same factory. That is how we pick the right process for every run.',
    seeTech: 'See the technology',
    statTech: 'production technologies',
    statProof: 'digital proof',
    statWh: 'warehouse',
    statCountries: 'countries',
    indexEyebrow: 'Our equipment',
    indexTitle: 'The right technology for *every job*',
    indexText: 'Every machine has its place: digital for samples and short runs, offset and flexo for long runs with consistent colour.',
    g_print: 'Printing',
    g_convert: 'Converting',
    g_finish: 'Finishing',
    bestFor: 'Best for',
    makes: 'Produces',
    runsEyebrow: 'Which press for which run?',
    runsTitle: 'The *run-length* map',
    runsText: 'An indicative guide — we make the final choice together based on product, material, quantity and deadline.',
    r0: 'Samples & mock-ups',
    r1: 'Short run',
    r2: 'Medium run',
    r3: 'Long run',
    indicative: 'Indicative · not a price',
    servicesEyebrow: 'Services',
    servicesTitle: 'More than *printing*',
    servicesText: 'Around the presses is a team that takes care of files, structure, proofs, samples, storage and delivery.',
    learnMore: 'Learn more',
    products: 'Products',
  },
});

const GROUPS: TechGroup[] = ['print', 'convert', 'finish'];
const GROUP_KEY = { print: 'g_print', convert: 'g_convert', finish: 'g_finish' } as const;

/* ------------------------------------------------------------------ */
/* One technology as a spec-sheet card                                 */
/* ------------------------------------------------------------------ */
function TechCard({ tech, n, large }: { tech: Tech; n: number; large?: boolean }) {
  const t = useDict(T);
  const l = useL();
  const cats = useCategories();
  const Icon = tech.icon;
  const linked = cats.filter((c) => tech.categories.includes(c.id));
  return (
    <article id={tech.id} className="group relative flex h-full scroll-mt-28 flex-col rounded-2xl bg-white p-6 ring-1 ring-line transition-[box-shadow,transform] duration-500 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-40px_rgba(18,16,20,0.45)] sm:p-8">
      <CropMarks className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-white transition-colors duration-300 group-hover:bg-brand-600">
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-mono text-[11px] text-muted">{pad2(n)} / {pad2(TECH.length)}</span>
      </div>
      {(tech.machine || tech.output) && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {tech.machine && <MonoChip tone="brand">{tech.machine}</MonoChip>}
          {tech.output && <MonoChip>{l(tech.output)}</MonoChip>}
        </div>
      )}
      <h3 className={cn('display leading-[1.1] text-ink', tech.machine || tech.output ? 'mt-3' : 'mt-8', large ? 'text-[28px] sm:text-[32px]' : 'text-[24px] sm:text-[26px]')}>{l(tech.name)}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{l(tech.text)}</p>
      <div className="mt-6 border-t border-line pt-5">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{t('bestFor')}</div>
        <ul className="mt-3 space-y-2">
          {tech.bestFor.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[14.5px] text-ink">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              {l(b)}
            </li>
          ))}
        </ul>
      </div>
      {linked.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          {linked.map((c) => (
            <Link key={c.id} to={`/produktet/${c.slug}`} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink">
              {l(c.name)} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Run-length map (qualitative, presses only)                          */
/* ------------------------------------------------------------------ */
function RunMap() {
  const t = useDict(T);
  const l = useL();
  const presses = TECH.filter((x) => x.runs);
  const cols = [t('r0'), t('r1'), t('r2'), t('r3')];
  return (
    <section className="py-20 sm:py-28">
      <div className="container-x">
        <Reveal>
          <Heading eyebrow={t('runsEyebrow')} title={t('runsTitle')} text={t('runsText')} />
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-12 overflow-hidden rounded-2xl bg-white ring-1 ring-line">
            {/* axis */}
            <div className="grid grid-cols-[minmax(0,1fr)] border-b border-line md:grid-cols-[260px_minmax(0,1fr)]">
              <div className="hidden items-center px-6 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted md:flex">{t('indicative')}</div>
              <div className="mx-5 grid grid-cols-4 md:mx-0">
                {cols.map((c, i) => (
                  <div key={c} className={cn('px-2 py-4 text-center font-mono text-[10px] uppercase leading-tight tracking-[0.1em] text-muted sm:px-3 sm:text-[11px]', i > 0 && 'border-l border-line')}>
                    {c}
                  </div>
                ))}
              </div>
            </div>
            {presses.map((p, i) => {
              const [a, b] = p.runs!;
              return (
                <div key={p.id} className={cn('grid grid-cols-[minmax(0,1fr)] md:grid-cols-[260px_minmax(0,1fr)]', i > 0 && 'border-t border-line')}>
                  <a href={`#${p.id}`} className="flex items-center gap-3 px-5 pb-1 pt-4 transition-colors hover:text-brand-700 md:px-6 md:py-5">
                    <span className="font-mono text-[11px] text-brand-600">{pad2(TECH.indexOf(p) + 1)}</span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold leading-tight text-ink">{p.machine}</span>
                      <span className="block text-[12.5px] text-muted">{l(p.output!)}</span>
                    </span>
                  </a>
                  <div className="relative mx-5 mb-4 h-10 md:m-0 md:h-auto">
                    <div className="absolute inset-0 grid grid-cols-4">
                      {cols.map((c, k) => (
                        <span key={c} className={cn(k > 0 && 'border-l border-dashed border-line')} />
                      ))}
                    </div>
                    <div
                      className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-400 to-brand-700"
                      style={{ left: `calc(${(a / 4) * 100}% + 6px)`, width: `calc(${((b - a) / 4) * 100}% - 12px)` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Services() {
  const ts = useDict(site);
  const t = useDict(T);
  const tc = useDict(C);
  const l = useL();
  usePageTitle(ts('nav_services'));

  const stats = [
    { v: '8', k: t('statTech') },
    { v: '24 h', k: t('statProof') },
    { v: '2.500 m²', k: t('statWh') },
    { v: '14', k: t('statCountries') },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <ChevronTexture />
        <div className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[420px] w-[420px] rounded-full bg-brand-600/25 blur-[120px]" />
        <div className="container-x grid items-center gap-12 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-20">
          <div className="animate-fade-up">
            <Breadcrumbs items={[{ label: ts('nav_services') }]} tone="light" />
            <Eyebrow tone="light" className="mt-10">{t('eyebrow')}</Eyebrow>
            <h1 className="display mt-5 text-[44px] leading-[1.0] sm:text-[68px]">
              <Accent text={t('title')} accentClassName="text-brand-300" />
            </h1>
            <p className="mt-7 max-w-xl text-[17px] leading-[1.7] text-white/70">{t('lead')}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to={QUOTE_HREF} size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                {tc('quote')}
              </ButtonLink>
              <a href="#teknologjite" className="inline-flex h-13 items-center gap-2 rounded-full border border-white/40 px-7 text-[15px] font-semibold text-white transition hover:bg-white/10">
                {t('seeTech')}
              </a>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.k} className="bg-ink px-4 py-4">
                  <dt className="sr-only">{s.k}</dt>
                  <dd className="display text-[26px] leading-none">{s.v}</dd>
                  <dd className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">{s.k}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="relative mx-auto max-w-[440px]">
              <CropMarks tone="light" size={16} gap={10} />
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-ink-soft">
                <Img src="/images/misc/production.webp" eager alt={l({ sq: 'Operator në makinën e printimit', en: 'Operator at the press' })} className="h-full w-full object-cover object-[50%_40%]" />
              </div>
              <div className="absolute -bottom-5 left-5 right-5 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-ink shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6)]">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">Prepress → Print → QC</span>
                <CmykBar segments />
              </div>
            </div>
          </div>
        </div>
        <CmykBar className="absolute inset-x-0 bottom-0" />
      </section>

      {/* Technology index */}
      <section id="teknologjite" className="scroll-mt-20 py-20 sm:py-28">
        <div className="container-x">
          <Reveal>
            <Heading eyebrow={t('indexEyebrow')} title={t('indexTitle')} text={t('indexText')} />
          </Reveal>
          {/* quick index */}
          <Reveal delay={80}>
            <nav aria-label={t('indexEyebrow')} className="no-scrollbar -mx-4 mt-10 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {TECH.map((x, i) => (
                <a key={x.id} href={`#${x.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink">
                  <span className="font-mono text-[10.5px] text-brand-600">{pad2(i + 1)}</span>
                  {x.machine ?? l(x.name)}
                </a>
              ))}
            </nav>
          </Reveal>

          {GROUPS.map((g) => {
            const items = TECH.filter((x) => x.group === g);
            return (
              <div key={g} className="mt-14">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">{t(GROUP_KEY[g])}</span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="font-mono text-[11px] text-muted">{pad2(items.length)}</span>
                </div>
                <div className={cn('mt-6 grid gap-4 lg:gap-5', items.length >= 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-2')}>
                  {items.map((x, i) => (
                    <Reveal key={x.id} delay={(i % 2) * 90} className="h-full">
                      <TechCard tech={x} n={TECH.indexOf(x) + 1} large={g === 'print'} />
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ProductionFlow />

      <RunMap />

      {/* Services */}
      <section className="border-t border-line bg-white py-20 sm:py-28">
        <div className="container-x">
          <Reveal>
            <Heading
              eyebrow={t('servicesEyebrow')}
              title={t('servicesTitle')}
              text={t('servicesText')}
              action={
                <ButtonLink to="/produktet" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('products')}
                </ButtonLink>
              }
            />
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              const body = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    {s.tag && <MonoChip>{l(s.tag)}</MonoChip>}
                  </div>
                  <div className="mt-8 font-mono text-[11px] text-muted">{pad2(i + 1)}</div>
                  <h3 className="mt-1.5 text-[19px] font-semibold leading-snug text-ink">{l(s.title)}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{l(s.text)}</p>
                  {s.href && (
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[14px] font-semibold text-ink">
                      <span className="link-u">{t('learnMore')}</span> <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </>
              );
              const cls = 'group flex h-full flex-col bg-white p-7 transition-colors duration-300 hover:bg-paper sm:p-8';
              return (
                <Reveal key={s.id} delay={(i % 3) * 80} className="h-full">
                  {s.href ? (
                    <Link to={s.href} className={cls}>
                      {body}
                    </Link>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <BrandStrip />

      <CtaBand image="/images/p/kuti-cokollate.webp" />
    </>
  );
}
