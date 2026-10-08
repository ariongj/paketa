import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight, ArrowUpRight, Home, Search } from 'lucide-react';
import { Accent, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { CategoryTiles } from '@/site/components/utility/CategoryTiles';
import { CmykBar, CropMarks, Eyebrow, RegMark } from '@/site/components/company/Print';
import { defineDict, useDict } from '@/i18n';
import { site } from '@/i18n/site';
import { cn } from '@/lib/utils';

const T = defineDict({
  sq: {
    pageTitle: 'Faqja nuk u gjet',
    eyebrow: 'Gabim 404',
    title: 'Faqja doli *jashtë prerjes*.',
    text: 'Faqja që kërkoni nuk ekziston ose është zhvendosur — ndoshta mbeti në anën e gabuar të vijës së prerjes. Pjesa tjetër e faqes është gati për shtyp.',
    requested: 'Adresa',
    home: 'Në ballinë',
    products: 'Shikoni produktet',
    searchPh: 'Kërkoni kuti, etiketa, qese…',
    searchBtn: 'Kërko',
    trim: 'Vija e prerjes',
    bleed: 'Bleed 3 mm',
    quickEyebrow: 'Vazhdoni nga këtu',
    maybeTitle: 'Nisni nga një *kategori*',
  },
  en: {
    pageTitle: 'Page not found',
    eyebrow: 'Error 404',
    title: 'This page fell *outside the trim*.',
    text: 'The page you’re looking for doesn’t exist or has moved — it probably ended up on the wrong side of the cut line. The rest of the site is print-ready.',
    requested: 'Address',
    home: 'Back to home',
    products: 'Browse products',
    searchPh: 'Search boxes, labels, bags…',
    searchBtn: 'Search',
    trim: 'Trim line',
    bleed: 'Bleed 3 mm',
    quickEyebrow: 'Carry on from here',
    maybeTitle: 'Start with a *category*',
  },
});

/** "404" crossing the trim line: sharp inside the trim box, faded in the waste area outside it. */
function TrimSheet() {
  const t = useDict(T);
  const digits = 'display absolute left-[30%] top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[150px] leading-none tracking-[-0.05em] sm:left-[44%] sm:text-[250px] lg:text-[290px]';
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[880px] overflow-hidden rounded-2xl bg-white p-8 ring-1 ring-line sm:p-14">
      {/* registration targets in the margins */}
      <RegMark className="absolute left-1/2 top-2.5 h-4 w-4 -translate-x-1/2 text-ink/30 sm:top-4" />
      <RegMark className="absolute bottom-2.5 left-1/2 h-4 w-4 -translate-x-1/2 text-ink/30 sm:bottom-4" />
      <RegMark className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30 sm:left-4" />
      <CmykBar segments className="absolute bottom-3 right-4 hidden sm:flex" />

      <div className="relative h-[160px] sm:h-[250px] lg:h-[280px]">
        <CropMarks size={14} gap={6} />
        {/* bleed line */}
        <span className="pointer-events-none absolute -inset-2 rounded-[2px] border border-dashed border-brand-600/35" />
        {/* waste: the part outside the trim */}
        <span className={cn(digits, 'text-ink/[0.13]')}>404</span>
        {/* inside the trim */}
        <span className="absolute inset-0 overflow-hidden">
          <span className={cn(digits, 'text-ink')}>404</span>
          <span className={cn(digits, 'translate-x-[3px] text-magenta/25 mix-blend-multiply')}>404</span>
        </span>
        <span className="absolute -top-6 left-0 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted sm:-top-8 sm:text-[10.5px]">{t('trim')}</span>
        <span className="absolute -bottom-6 left-0 font-mono text-[9.5px] uppercase tracking-[0.16em] text-brand-600/70 sm:-bottom-8 sm:text-[10.5px]">{t('bleed')}</span>
      </div>
    </div>
  );
}

export default function NotFound() {
  const t = useDict(T);
  const ts = useDict(site);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  usePageTitle(t('pageTitle'));

  const quick = [
    { to: '/teknologjia', label: ts('nav_services') },
    { to: '/industrite', label: ts('nav_industries') },
    { to: '/projektet', label: ts('nav_projects') },
    { to: '/kerko-oferte', label: ts('requestQuote') },
    { to: '/kontakt', label: ts('nav_contact') },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="container-x flex flex-col items-center pb-16 pt-10 text-center sm:pb-20 sm:pt-14">
          <Eyebrow className="animate-fade-up">{t('eyebrow')}</Eyebrow>

          <div className="mt-8 w-full animate-fade-up [animation-delay:60ms]">
            <TrimSheet />
          </div>

          <h1 className="display mt-10 max-w-2xl animate-fade-up text-[34px] leading-[1.05] text-ink [animation-delay:120ms] sm:mt-12 sm:text-[52px]">
            <Accent text={t('title')} />
          </h1>
          <p className="mt-4 max-w-xl animate-fade-up text-[16.5px] leading-relaxed text-muted [animation-delay:160ms]">{t('text')}</p>

          <div className="mt-5 inline-flex max-w-full animate-fade-up items-center gap-2 rounded-md bg-white px-3 py-1.5 font-mono text-[11.5px] text-muted ring-1 ring-line [animation-delay:180ms]">
            <span className="shrink-0 uppercase tracking-[0.12em]">{t('requested')}:</span>
            <code className="truncate text-ink-soft">{pathname}</code>
          </div>

          <div className="mt-8 flex w-full animate-fade-up flex-col items-stretch justify-center gap-3 [animation-delay:220ms] sm:w-auto sm:flex-row sm:items-center">
            <ButtonLink to="/" size="lg" icon={<Home className="h-4 w-4" />}>
              {t('home')}
            </ButtonLink>
            <ButtonLink to="/produktet" size="lg" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
              {t('products')}
            </ButtonLink>
          </div>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const v = q.trim();
              navigate(v ? `/kerko?q=${encodeURIComponent(v)}` : '/kerko');
            }}
            className="mt-6 flex w-full max-w-md animate-fade-up items-center gap-2 rounded-full border border-line bg-white p-1.5 pl-5 shadow-[0_14px_40px_-28px_rgba(18,16,20,0.5)] transition-colors [animation-delay:260ms] focus-within:border-ink/30"
          >
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('searchPh')}
              aria-label={t('searchPh')}
              enterKeyHint="search"
              className="h-10 min-w-0 flex-1 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-muted/70"
            />
            <button type="submit" className="h-10 shrink-0 rounded-full bg-ink px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-600">
              {t('searchBtn')}
            </button>
          </form>

          <nav aria-label={t('quickEyebrow')} className="mt-10 flex animate-fade-up flex-wrap justify-center gap-x-6 gap-y-2 [animation-delay:300ms]">
            <span className="w-full font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{t('quickEyebrow')}</span>
            {quick.map((x) => (
              <Link key={x.to} to={x.to} className="inline-flex items-center gap-1 text-[14.5px] font-semibold text-ink hover:text-brand-700">
                {x.label} <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </Link>
            ))}
          </nav>
        </div>
        <CmykBar className="absolute inset-x-0 bottom-0" />
      </section>

      <section className="container-x py-14 sm:py-20">
        <Reveal className="mb-8 text-center">
          <h2 className="display text-[30px] leading-[1.05] text-ink sm:text-[40px]">
            <Accent text={t('maybeTitle')} />
          </h2>
        </Reveal>
        <CategoryTiles variant="compact" />
      </section>
    </>
  );
}
