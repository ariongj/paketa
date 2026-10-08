import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, ChevronRight, Clock, FileSearch, Mail, Phone } from 'lucide-react';
import { Markdown } from '@/components/ui/Markdown';
import { ButtonLink } from '@/components/ui/Button';
import { Accent } from '@/components/ui/misc';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { NotFoundBlock } from '@/site/components/content/NotFoundBlock';
import { C } from '@/site/components/content/dict';
import { headingsOf, telHref } from '@/site/components/content/posts';
import { ChevronTexture, CmykBar, Eyebrow } from '@/site/components/company/Print';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { date } from '@/lib/format';
import { cn } from '@/lib/utils';

const T = defineDict({
  sq: {
    eyebrow: 'Informacione për klientët',
    updated: 'Përditësuar',
    sections: 'Seksione',
    pages: 'Informacione të dobishme',
    help_title: 'Keni ndonjë pyetje?',
    help_text: 'Ekipi ynë ju ndihmon me kënaqësi — na telefononi ose na shkruani, përgjigjemi brenda 24 orësh.',
    contact: 'Na shkruani',
    nf_eyebrow: 'Faqja nuk u gjet',
    nf_title: 'Kjo faqe *doli jashtë prerjes*',
    nf_text: 'Mund të jetë hequr ose adresa është shkruar gabim. Ja disa faqe që mund t’ju ndihmojnë.',
    nf_contact: 'Kontakt',
  },
  en: {
    eyebrow: 'Customer information',
    updated: 'Updated',
    sections: 'Sections',
    pages: 'Useful information',
    help_title: 'Have a question?',
    help_text: 'Our team is happy to help — call or write and we’ll reply within 24 hours.',
    contact: 'Write to us',
    nf_eyebrow: 'Page not found',
    nf_title: 'This page *fell outside the trim*',
    nf_text: 'It may have been removed or the address was mistyped. Here are some pages that might help.',
    nf_contact: 'Contact',
  },
});

const PROSE = cn(
  'text-[16.5px] sm:text-[17px]',
  '[&_p]:leading-[1.8] [&_li]:leading-[1.7] [&_ul]:space-y-2 [&_ol]:space-y-2 [&_li::marker]:text-brand-600',
  '[&_h2]:mt-12 [&_h2]:scroll-mt-28 [&_h2]:border-t [&_h2]:border-line [&_h2]:pt-10 [&_h2]:text-[26px] [&_h2]:leading-tight sm:[&_h2]:text-[28px]',
  '[&>p:first-child]:mt-0 [&>p:first-child]:text-[19px] [&>p:first-child]:leading-[1.65] [&>p:first-child]:text-ink sm:[&>p:first-child]:text-[20px]',
  '[&_blockquote]:rounded-r-xl [&_blockquote]:bg-brand-50/70 [&_blockquote]:py-4 [&_blockquote]:pr-5 [&_blockquote]:text-[18px]',
);

export default function CmsPageView() {
  const { slug } = useParams();
  const t = useDict(T);
  const c = useDict(C);
  const l = useL();
  const lang = useLang();
  const settings = useSettings();
  const all = useDb((s) => s.pages);
  const published = useMemo(() => all.filter((p) => p.published), [all]);
  const page = published.find((p) => p.slug === slug);
  usePageTitle(page ? l(page.title) : t('nf_eyebrow'));
  const body = page ? l(page.body) : '';
  const sections = useMemo(() => headingsOf(body), [body]);

  const nav = (
    <nav aria-label={t('pages')} className="rounded-2xl bg-white p-2 ring-1 ring-line">
      <div className="px-3 pb-2 pt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{t('pages')}</div>
      <ul>
        {published.map((p, i) => {
          const current = p.id === page?.id;
          return (
            <li key={p.id}>
              <Link
                to={`/faqe/${p.slug}`}
                aria-current={current ? 'page' : undefined}
                className={cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold transition-colors', current ? 'bg-ink text-white' : 'text-ink-soft hover:bg-paper hover:text-ink')}
              >
                <span className={cn('font-mono text-[10.5px]', current ? 'text-brand-300' : 'text-brand-600')}>{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1">{l(p.title)}</span>
                <ChevronRight className={cn('h-4 w-4 transition-transform group-hover:translate-x-0.5', current ? 'text-white/60' : 'text-ink/25')} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  if (!page) {
    return (
      <NotFoundBlock
        icon={<FileSearch className="h-6 w-6" />}
        eyebrow={t('nf_eyebrow')}
        title={t('nf_title')}
        text={t('nf_text')}
        actions={
          <>
            <ButtonLink to="/" variant="dark" iconRight={<ArrowRight className="h-4 w-4" />}>
              {c('home')}
            </ButtonLink>
            <ButtonLink to="/kontakt" variant="outline">
              {t('nf_contact')}
            </ButtonLink>
          </>
        }
      >
        {published.length > 0 && <div className="mx-auto max-w-md">{nav}</div>}
      </NotFoundBlock>
    );
  }

  const title = l(page.title);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="container-x pb-12 pt-10 sm:pb-16 sm:pt-14">
          <Breadcrumbs items={[{ label: title }]} />
          <Eyebrow className="mt-10">{t('eyebrow')}</Eyebrow>
          <h1 className="display mt-5 max-w-3xl text-[40px] leading-[1.03] text-ink sm:text-[58px]">
            <Accent text={title} />
          </h1>
          <div className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            {t('updated')} <time dateTime={page.updatedAt}>{date(page.updatedAt, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          </div>
        </div>
        <CmykBar className="absolute inset-x-0 bottom-0" />
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20">
          <article className="min-w-0 max-w-[740px] animate-fade-up">
            {sections.length > 1 && (
              <div className="mb-10 rounded-xl bg-white p-5 ring-1 ring-line">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{t('sections')}</div>
                <ol className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {sections.map((s, i) => (
                    <li key={i} className="flex gap-3 text-[14.5px] text-ink-soft">
                      <span className="font-mono text-[11px] leading-[1.9] text-brand-600">{String(i + 1).padStart(2, '0')}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <Markdown source={body} className={PROSE} />
          </article>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            {published.length > 1 && nav}

            <div className="relative isolate overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-7">
              <ChevronTexture />
              <div className="relative">
                <h2 className="display text-[26px] leading-tight">{t('help_title')}</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-white/60">{t('help_text')}</p>
                <ul className="mt-6 space-y-3 text-[14.5px]">
                  <li>
                    <a href={telHref(settings.phone)} className="group flex items-center gap-3 font-semibold text-white">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-brand-300 ring-1 ring-white/10 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        <Phone className="h-4 w-4" />
                      </span>
                      <span className="font-mono">{settings.phone}</span>
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${settings.email}`} className="group flex items-center gap-3 font-semibold text-white">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-brand-300 ring-1 ring-white/10 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        <Mail className="h-4 w-4" />
                      </span>
                      {settings.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-3 text-white/70">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-brand-300 ring-1 ring-white/10">
                      <Clock className="h-4 w-4" />
                    </span>
                    {l(settings.hours)}
                  </li>
                </ul>
                <ButtonLink to="/kontakt" variant="light" className="mt-7 w-full" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('contact')}
                </ButtonLink>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
