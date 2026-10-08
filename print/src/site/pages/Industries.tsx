// Industries we serve: /industrite (overview) and /industrite/:slug (detail).
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, ArrowUpRight, Check, SearchX } from 'lucide-react';
import { Accent, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { ProductCard } from '@/site/components/ProductCard';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { C, CtaBand, Heading, ProductionFlow } from '@/site/components/company/Blocks';
import { ProjectLightbox } from '@/site/components/company/ProjectLightbox';
import { ChevronTexture, CmykBar, CropMarks, Eyebrow } from '@/site/components/company/Print';
import { techById } from '@/site/components/company/tech';
import { pad2, QUOTE_HREF } from '@/site/components/company/data';
import { INDUSTRIES, industryBySlug, projectsForIndustry, type Industry } from '@/site/components/industries/data';
import { NotFoundBlock } from '@/site/components/content/NotFoundBlock';
import { defineDict, useDict, useL } from '@/i18n';
import { site } from '@/i18n/site';
import { useDb } from '@/store/db';
import { useActiveProducts, useCategories } from '@/store/hooks';
import { cn } from '@/lib/utils';

const T = defineDict({
  sq: {
    eyebrow: 'Industritë',
    title: 'Paketim i ndërtuar për *industrinë tuaj*',
    lead: 'Çdo industri ka kërkesat e veta: kontakt me ushqim, rezistencë ndaj kimikateve, finishing luksoz ose afate të shkurtra fushatash. Ja si i përgjigjemi secilës.',
    explore: 'Shiko industrinë',
    count: '{n} industri',
    commonEyebrow: 'Për çdo industri',
    commonTitle: 'Të njëjtat standarde, *çdo herë*',
    c1t: 'Provë digjitale brenda 24 orësh',
    c1: 'Asgjë nuk shkon në shtyp pa miratimin tuaj.',
    c2t: 'Prepress & dieline',
    c2: 'Kontroll i skedarëve dhe struktura sipas produktit tuaj.',
    c3t: 'Porosi të vogla deri të mëdha',
    c3: 'Digjital për seri të shkurtra, offset e flexo për tirazhe të mëdha.',
    c4t: 'Depo 2.500 m² & dërgesë',
    c4: 'Magazinim dhe dërgesë në Kosovë dhe në rajon.',
    weMake: 'Çfarë prodhojmë për ju',
    weMakeTitle: 'Gjashtë fusha ku *ju ndihmojmë*',
    reqEyebrow: 'Kërkesat tipike',
    reqTitle: 'Çfarë kërkon kjo industri — *dhe si përgjigjemi*',
    techEyebrow: 'Teknologjitë që përdorim',
    productsEyebrow: 'Nga katalogu',
    productsTitle: 'Produkte për *{name}*',
    productsText: 'Çmime sipas sasisë, pa TVSH — ose kërkoni ofertë për një paketim krejtësisht me porosi.',
    allIn: 'Të gjitha: {name}',
    projectsEyebrow: 'Projekte',
    projectsTitle: 'Punë të realizuara në *këtë industri*',
    recentTitle: 'Projekte të *fundit*',
    allProjects: 'Të gjitha projektet',
    otherEyebrow: 'Industri të tjera',
    nfEyebrow: 'Industria nuk u gjet',
    nfTitle: 'Kjo industri *nuk ekziston*',
    nfText: 'Adresa mund të jetë shkruar gabim. Zgjidhni një nga industritë që shërbejmë.',
    allIndustries: 'Të gjitha industritë',
    ctaTitle: 'Projekti juaj i radhës: *{name}*',
  },
  en: {
    eyebrow: 'Industries',
    title: 'Packaging built for *your industry*',
    lead: 'Every industry has its own demands: food contact, chemical resistance, luxury finishes or tight campaign deadlines. Here is how we answer each of them.',
    explore: 'Explore industry',
    count: '{n} industries',
    commonEyebrow: 'For every industry',
    commonTitle: 'The same standards, *every time*',
    c1t: 'Digital proof within 24 hours',
    c1: 'Nothing goes to press without your approval.',
    c2t: 'Prepress & dielines',
    c2: 'File checks and structures made for your product.',
    c3t: 'Small to large orders',
    c3: 'Digital for short runs, offset and flexo for long runs.',
    c4t: '2,500 m² warehouse & delivery',
    c4: 'Storage and delivery across Kosovo and the region.',
    weMake: 'What we make for you',
    weMakeTitle: 'Six areas where *we help*',
    reqEyebrow: 'Typical requirements',
    reqTitle: 'What this industry needs — *and how we answer*',
    techEyebrow: 'Technology we use',
    productsEyebrow: 'From the catalogue',
    productsTitle: 'Products for *{name}*',
    productsText: 'Quantity pricing, excl. VAT — or request a quote for fully custom packaging.',
    allIn: 'All: {name}',
    projectsEyebrow: 'Projects',
    projectsTitle: 'Work delivered in *this industry*',
    recentTitle: 'Recent *projects*',
    allProjects: 'All projects',
    otherEyebrow: 'Other industries',
    nfEyebrow: 'Industry not found',
    nfTitle: 'This industry *doesn’t exist*',
    nfText: 'The address may be mistyped. Choose one of the industries we serve.',
    allIndustries: 'All industries',
    ctaTitle: 'Your next *{name}* project',
  },
});

export default function Industries() {
  const { slug } = useParams();
  if (!slug) return <Overview />;
  const ind = industryBySlug(slug);
  return ind ? <Detail key={ind.slug} ind={ind} /> : <UnknownIndustry />;
}

/* ================================================================== */
/* Overview                                                            */
/* ================================================================== */
function IndustryRow({ ind, n }: { ind: Industry; n: number }) {
  const t = useDict(T);
  const l = useL();
  const Icon = ind.icon;
  const flip = n % 2 === 0;
  return (
    <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <Link to={`/industrite/${ind.slug}`} className={cn('group relative block', flip && 'lg:order-last')}>
        <CropMarks className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-sand ring-1 ring-line/60">
          <Img src={ind.image} alt={l(ind.name)} className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
          <span className="absolute left-4 top-4 rounded-md bg-white/95 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink shadow-sm">
            {pad2(n)} / {pad2(INDUSTRIES.length)}
          </span>
        </div>
      </Link>
      <div>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Icon className="h-5 w-5" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{l(ind.tagline)}</span>
        </div>
        <h2 className="display mt-5 text-[34px] leading-[1.04] text-ink sm:text-[44px]">
          <Link to={`/industrite/${ind.slug}`} className="transition-colors hover:text-brand-700">
            {l(ind.name)}
          </Link>
        </h2>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">{l(ind.intro)}</p>
        <ul className="mt-6 grid gap-x-6 gap-y-2.5 border-t border-line pt-6 sm:grid-cols-2">
          {ind.points.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[14.5px] text-ink">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {l(p)}
            </li>
          ))}
        </ul>
        <ButtonLink to={`/industrite/${ind.slug}`} variant="dark" className="mt-8" iconRight={<ArrowRight className="h-4 w-4" />}>
          {t('explore')}
        </ButtonLink>
      </div>
    </article>
  );
}

function Overview() {
  const t = useDict(T);
  const ts = useDict(site);
  const l = useL();
  usePageTitle(ts('nav_industries'));
  const common = [
    { t: t('c1t'), d: t('c1') },
    { t: t('c2t'), d: t('c2') },
    { t: t('c3t'), d: t('c3') },
    { t: t('c4t'), d: t('c4') },
  ];
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="container-x pb-14 pt-10 sm:pb-20 sm:pt-14">
          <Breadcrumbs items={[{ label: ts('nav_industries') }]} />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div className="animate-fade-up">
              <Eyebrow>{t('eyebrow')}</Eyebrow>
              <h1 className="display mt-5 text-[44px] leading-[1.0] text-ink sm:text-[66px]">
                <Accent text={t('title')} />
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-ink-soft">{t('lead')}</p>
            </div>
            <nav aria-label={ts('nav_industries')} className="animate-fade-up rounded-2xl bg-white ring-1 ring-line [animation-delay:100ms]">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
                <span>{t('eyebrow')}</span>
                <span>{t('count', { n: INDUSTRIES.length })}</span>
              </div>
              <ul className="divide-y divide-line">
                {INDUSTRIES.map((ind, i) => {
                  const Icon = ind.icon;
                  return (
                    <li key={ind.slug}>
                      <Link to={`/industrite/${ind.slug}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper">
                        <span className="font-mono text-[11px] text-brand-600">{pad2(i + 1)}</span>
                        <Icon className="h-4 w-4 text-muted transition-colors group-hover:text-brand-600" />
                        <span className="flex-1 text-[15px] font-semibold text-ink">{l(ind.name)}</span>
                        <ArrowUpRight className="h-4 w-4 text-ink/25 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
        <CmykBar className="absolute inset-x-0 bottom-0" />
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-x space-y-20 sm:space-y-28">
          {INDUSTRIES.map((ind, i) => (
            <Reveal key={ind.slug}>
              <IndustryRow ind={ind} n={i + 1} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Common standards */}
      <section className="relative isolate overflow-hidden bg-ink py-20 text-white sm:py-24">
        <ChevronTexture />
        <div className="container-x">
          <Reveal>
            <Heading eyebrow={t('commonEyebrow')} title={t('commonTitle')} tone="light" />
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {common.map((c, i) => (
              <Reveal key={i} delay={i * 80} className="h-full">
                <div className="h-full bg-ink p-6 sm:p-7">
                  <div className="font-mono text-[11px] text-brand-300">{pad2(i + 1)}</div>
                  <div className="mt-6 text-[17px] font-semibold leading-snug">{c.t}</div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-white/60">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand image="/images/p/kuti-takeaway-doreze.webp" />
    </>
  );
}

/* ================================================================== */
/* Detail                                                              */
/* ================================================================== */
function Detail({ ind }: { ind: Industry }) {
  const t = useDict(T);
  const tc = useDict(C);
  const ts = useDict(site);
  const l = useL();
  const products = useActiveProducts();
  const cats = useCategories();
  const allProjects = useDb((s) => s.projects);
  const [open, setOpen] = useState<number | null>(null);
  const name = l(ind.name);
  usePageTitle(name);

  const picks = useMemo(() => {
    const byId = ind.productIds.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
    if (byId.length >= 4) return byId.slice(0, 8);
    const more = products.filter((p) => ind.categoryIds.includes(p.categoryId) && !byId.includes(p));
    return [...byId, ...more].slice(0, 8);
  }, [products, ind]);
  const linkedCats = cats.filter((c) => ind.categoryIds.includes(c.id));
  const techs = ind.tech.map(techById).filter((x): x is NonNullable<typeof x> => !!x);

  const matched = useMemo(() => projectsForIndustry(ind, allProjects), [ind, allProjects]);
  const projects = useMemo(() => (matched.length ? matched : [...allProjects].sort((a, b) => b.year - a.year)).slice(0, 3), [matched, allProjects]);
  const others = INDUSTRIES.filter((x) => x.slug !== ind.slug);
  const Icon = ind.icon;
  const n = INDUSTRIES.indexOf(ind) + 1;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <ChevronTexture />
        <div className="pointer-events-none absolute -right-32 -top-32 -z-10 h-[420px] w-[420px] rounded-full bg-brand-600/30 blur-[120px]" />
        <div className="container-x grid items-center gap-12 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-20">
          <div className="animate-fade-up">
            <Breadcrumbs items={[{ label: ts('nav_industries'), to: '/industrite' }, { label: name }]} tone="light" />
            <div className="mt-10 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <Eyebrow tone="light">
                {t('eyebrow')} · {pad2(n)}
              </Eyebrow>
            </div>
            <h1 className="display mt-6 text-[44px] leading-[1.0] sm:text-[64px]">{name}</h1>
            <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.14em] text-brand-300">{l(ind.tagline)}</p>
            <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-white/70">{l(ind.intro)}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to={QUOTE_HREF} size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                {tc('quote')}
              </ButtonLink>
              <a href="#produktet" className="inline-flex h-13 items-center gap-2 rounded-full border border-white/40 px-7 text-[15px] font-semibold text-white transition hover:bg-white/10">
                {tc('products')}
              </a>
            </div>
          </div>
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="relative">
              <CropMarks tone="light" size={16} gap={10} />
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-ink-soft">
                <Img src={ind.image} eager alt={name} className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {ind.gallery.map((g) => (
                <div key={g} className="aspect-square overflow-hidden rounded-xl bg-white">
                  <Img src={g} small alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <CmykBar className="absolute inset-x-0 bottom-0" />
      </section>

      {/* Six points */}
      <section className="py-20 sm:py-28">
        <div className="container-x">
          <Reveal>
            <Heading eyebrow={t('weMake')} title={t('weMakeTitle')} />
          </Reveal>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-3">
            {ind.points.map((p, i) => (
              <Reveal as="li" key={i} delay={(i % 3) * 70} className="h-full">
                <div className="flex h-full items-start gap-4 bg-white p-6 sm:p-7">
                  <span className="font-mono text-[12px] text-brand-600">{pad2(i + 1)}</span>
                  <span className="text-[17px] font-semibold leading-snug text-ink">{l(p)}</span>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Requirements + technology */}
      <section className="border-y border-line bg-white py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <Heading eyebrow={t('reqEyebrow')} title={t('reqTitle')} />
            <div className="mt-10">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{t('techEyebrow')}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {techs.map((x) => (
                  <Link key={x.id} to={`/teknologjia#${x.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink">
                    {x.machine ?? l(x.name)}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
          <div className="space-y-4">
            {ind.requirements.map((r, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="group relative rounded-2xl bg-paper p-6 ring-1 ring-line transition-colors hover:bg-white sm:p-7">
                  <CropMarks className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="flex items-start gap-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink font-mono text-[12px] text-white">{pad2(i + 1)}</span>
                    <div>
                      <h3 className="text-[18px] font-semibold leading-snug text-ink">{l(r.title)}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-muted">{l(r.text)}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      {picks.length > 0 && (
        <section id="produktet" className="scroll-mt-20 py-20 sm:py-28">
          <div className="container-x">
            <Reveal>
              <Heading eyebrow={t('productsEyebrow')} title={t('productsTitle', { name })} text={t('productsText')} />
            </Reveal>
            {linkedCats.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {linkedCats.map((c) => (
                  <Link key={c.id} to={`/produktet/${c.slug}`} className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold text-ink ring-1 ring-line transition-colors hover:ring-ink/40">
                    <Img src={c.image} small alt="" className="h-7 w-7 rounded-full object-cover" />
                    {t('allIn', { name: l(c.name) })}
                    <ArrowRight className="h-3.5 w-3.5 text-muted" />
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
              {picks.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 70} className="h-full">
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="border-t border-line bg-white py-20 sm:py-24">
          <div className="container-x">
            <Reveal>
              <Heading
                eyebrow={t('projectsEyebrow')}
                title={matched.length ? t('projectsTitle') : t('recentTitle')}
                action={
                  <ButtonLink to="/projektet" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                    {t('allProjects')}
                  </ButtonLink>
                }
              />
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <Reveal key={p.id} delay={i * 80}>
                  <button type="button" onClick={() => setOpen(i)} className="group block w-full text-left">
                    <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-sand ring-1 ring-line/60">
                      <Img src={p.image} small alt={l(p.title)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                      {p.location} · {p.year}
                    </div>
                    <div className="mt-1.5 text-[18px] font-semibold leading-snug text-ink group-hover:text-brand-700">{l(p.title)}</div>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
          <ProjectLightbox projects={projects} index={open ?? 0} open={open !== null} onClose={() => setOpen(null)} onIndex={setOpen} />
        </section>
      )}

      {/* Other industries */}
      <section className="py-16 sm:py-20">
        <div className="container-x">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">{t('otherEyebrow')}</span>
            <span className="h-px flex-1 bg-line" />
            <Link to="/industrite" className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink">
              {t('allIndustries')}
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => {
              const OIcon = o.icon;
              return (
                <Link key={o.slug} to={`/industrite/${o.slug}`} className="group flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_rgba(18,16,20,0.45)]">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                    <Img src={o.gallery[0]} small alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <OIcon className="h-4 w-4 text-brand-600" />
                    <div className="mt-1 text-[15px] font-semibold leading-snug text-ink group-hover:text-brand-700">{l(o.name)}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <ProductionFlow compact />

      <CtaBand image={ind.gallery[0]} title={t('ctaTitle', { name })} />
    </>
  );
}

function UnknownIndustry() {
  const t = useDict(T);
  const l = useL();
  usePageTitle(t('nfEyebrow'));
  return (
    <NotFoundBlock
      icon={<SearchX className="h-6 w-6" />}
      eyebrow={t('nfEyebrow')}
      title={t('nfTitle')}
      text={t('nfText')}
      actions={
        <ButtonLink to="/industrite" variant="dark" iconRight={<ArrowRight className="h-4 w-4" />}>
          {t('allIndustries')}
        </ButtonLink>
      }
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {INDUSTRIES.map((ind) => (
          <li key={ind.slug}>
            <Link to={`/industrite/${ind.slug}`} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-semibold text-ink hover:bg-paper">
              {l(ind.name)} <ArrowRight className="h-4 w-4 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </NotFoundBlock>
  );
}
