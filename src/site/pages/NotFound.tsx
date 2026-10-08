import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowRight, Home, Search } from 'lucide-react';
import { Accent, Img } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { CategoryTiles } from '@/site/components/utility/CategoryTiles';
import { Eyebrow } from '@/site/components/SectionHeading';
import { defineDict, useDict } from '@/i18n';

const T = defineDict({
  me: {
    pageTitle: 'Stranica nije pronađena',
    eyebrow: 'Greška 404',
    title: 'Ova kutija je *prazna*.',
    text: 'Stranica koju tražite ne postoji ili je premještena. Ali naš magacin je pun — krenite odavde.',
    requested: 'Tražena adresa',
    home: 'Na početnu',
    products: 'Pogledajte proizvode',
    searchPh: 'Traži čaše, poklopce, posude…',
    searchBtn: 'Traži',
    maybeEyebrow: 'Možda tražite',
    maybeTitle: 'Krenite od *kategorije*',
    empty: 'prazno',
  },
  sq: {
    pageTitle: 'Faqja nuk u gjet',
    eyebrow: 'Gabim 404',
    title: 'Kjo pako është *bosh*.',
    text: 'Faqja që kërkoni nuk ekziston ose është zhvendosur. Por depoja jonë është plot — nisni nga këtu.',
    requested: 'Adresa e kërkuar',
    home: 'Në ballinë',
    products: 'Shikoni produktet',
    searchPh: 'Kërko gota, kapakë, enë…',
    searchBtn: 'Kërko',
    maybeEyebrow: 'Ndoshta kërkoni',
    maybeTitle: 'Nisni nga një *kategori*',
    empty: 'bosh',
  },
  en: {
    pageTitle: 'Page not found',
    eyebrow: 'Error 404',
    title: 'This box is *empty*.',
    text: 'The page you’re looking for doesn’t exist or has moved. Our warehouse is full, though — start here.',
    requested: 'Requested address',
    home: 'Back to home',
    products: 'Browse products',
    searchPh: 'Search cups, lids, containers…',
    searchBtn: 'Search',
    maybeEyebrow: 'You might be looking for',
    maybeTitle: 'Start with a *category*',
    empty: 'empty',
  },
});

export default function NotFound() {
  const t = useDict(T);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  usePageTitle(t('pageTitle'));

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-dashed border-ink/15">
        <div aria-hidden className="bg-grain absolute inset-0 -z-10" />
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(70%_60%_at_50%_0%,var(--color-sand)_0%,transparent_75%)]" />

        <div className="container-x flex flex-col items-center pb-16 pt-12 text-center sm:pb-20 sm:pt-16">
          <Eyebrow className="animate-fade-up">{t('eyebrow')}</Eyebrow>

          {/* "404" — the zero is an open kraft box */}
          <div aria-hidden className="display mt-6 flex animate-fade-up select-none items-center justify-center text-[140px] leading-[0.8] tracking-[-0.05em] text-ink [animation-delay:60ms] sm:text-[220px] lg:text-[260px]">
            <span>4</span>
            <span className="relative mx-[0.06em] inline-block h-[0.74em] w-[0.62em]">
              <span className="absolute inset-0 rotate-[-6deg] rounded-[0.12em] bg-kraft/60" />
              <span className="absolute inset-0 overflow-hidden rounded-[0.12em] bg-sand ring-[0.03em] ring-ink shadow-[0_30px_60px_-30px_rgba(15,29,22,0.6)]">
                <Img src="/images/misc/box.webp" small eager alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-[0.05em] rounded-[0.08em] border-[0.012em] border-dashed border-ink/40" />
              </span>
              <span className="absolute -right-7 -top-5 grid h-16 w-16 rotate-[14deg] place-items-center rounded-full bg-lime font-sans text-[10px] font-extrabold uppercase leading-none tracking-[0.12em] text-ink shadow-[0_10px_24px_-10px_rgba(15,29,22,0.6)] sm:-right-9 sm:-top-6 sm:h-20 sm:w-20 sm:text-[12px]">
                <span className="absolute inset-[4px] rounded-full border border-dashed border-ink/30" />
                {t('empty')}
              </span>
            </span>
            <span>4</span>
          </div>

          <h1 className="display mt-8 max-w-2xl animate-fade-up text-[34px] leading-[1.04] text-ink [animation-delay:120ms] sm:mt-10 sm:text-[54px]">
            <Accent text={t('title')} />
          </h1>
          <p className="mt-4 max-w-xl animate-fade-up text-[16.5px] leading-relaxed text-muted [animation-delay:160ms]">{t('text')}</p>

          <div className="mt-5 inline-flex max-w-full animate-fade-up items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-[12.5px] text-muted ring-1 ring-line [animation-delay:180ms]">
            <span className="shrink-0 font-semibold">{t('requested')}:</span>
            <code className="truncate font-mono text-ink-soft">{pathname}</code>
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
            className="mt-6 flex w-full max-w-md animate-fade-up items-center gap-2 rounded-full border border-line bg-white p-1.5 pl-5 shadow-[0_14px_40px_-28px_rgba(15,29,22,0.5)] transition-colors [animation-delay:260ms] focus-within:border-brand-600"
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
            <button type="submit" className="h-10 shrink-0 rounded-full bg-ink px-5 text-[13.5px] font-semibold text-paper transition-colors hover:bg-brand-600">
              {t('searchBtn')}
            </button>
          </form>
        </div>
      </section>

      <section className="container-x pt-14 sm:pt-20">
        <div className="mb-8 flex flex-col items-center text-center">
          <Eyebrow className="mb-4">{t('maybeEyebrow')}</Eyebrow>
          <h2 className="display text-[30px] leading-[1.05] text-ink sm:text-[42px]">
            <Accent text={t('maybeTitle')} />
          </h2>
        </div>
        <CategoryTiles variant="compact" />
      </section>
    </>
  );
}
