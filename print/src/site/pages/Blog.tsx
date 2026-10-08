import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, ArrowUpRight, BookOpen, MessageSquare, Phone } from 'lucide-react';
import type { Post } from '@/lib/types';
import { Accent, EmptyState, Img, Reveal, plain } from '@/components/ui/misc';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { AuthorAvatar, PostCard, PostMeta, isTeamAuthor } from '@/site/components/content/PostCard';
import { C } from '@/site/components/content/dict';
import { postHref, tagKey, telHref, usePublishedPosts } from '@/site/components/content/posts';
import { ChevronTexture, CmykBar, CropMarks, Eyebrow } from '@/site/components/company/Print';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { defineDict, useDict, useL } from '@/i18n';
import { useSettings } from '@/store/hooks';
import { cn } from '@/lib/utils';

const T = defineDict({
  sq: {
    title: 'Blog',
    eyebrow: 'Blog · Dije paketimi',
    heroTitle: 'Udhëzues për *paketim më të mirë*',
    heroText: 'Materiale, finishing, prepress dhe tirazhe — shpjeguar thjesht nga ekipi ynë i prodhimit, që të porosisni me më pak pyetje dhe më pak surpriza.',
    topics: 'Temat',
    all: 'Të gjitha',
    more: 'Më shumë artikuj',
    emptyTitle: 'Ende nuk ka artikuj të publikuar',
    emptyText: 'Së shpejti publikojmë udhëzues të rinj. Ndërkohë, na pyesni direkt — ju ndihmojmë me kënaqësi.',
    emptyTagTitle: 'Nuk ka artikuj për këtë temë',
    emptyTagText: 'Shikoni të gjithë artikujt ose zgjidhni një temë tjetër.',
    showAll: 'Shfaq të gjithë artikujt',
    contact: 'Na kontaktoni',
    ask_eyebrow: 'Pyesni prepress-in',
    ask_title: 'Keni pyetje për *skedarin* tuaj?',
    ask_text: 'Bleed, dieline, ngjyra Pantone apo materiali i duhur — ekipi ynë ju përgjigjet brenda 24 orësh.',
    ask_button: 'Dërgoni pyetjen',
    articles: '{n} artikuj',
  },
  en: {
    title: 'Blog',
    eyebrow: 'Blog · Packaging know-how',
    heroTitle: 'Guides to *better packaging*',
    heroText: 'Materials, finishes, prepress and print runs — explained simply by our production team, so you can order with fewer questions and no surprises.',
    topics: 'Topics',
    all: 'All',
    more: 'More articles',
    emptyTitle: 'No articles published yet',
    emptyText: 'New guides are on the way. In the meantime, ask us directly — we’re happy to help.',
    emptyTagTitle: 'No articles on this topic',
    emptyTagText: 'See all articles or pick another topic.',
    showAll: 'Show all articles',
    contact: 'Contact us',
    ask_eyebrow: 'Ask prepress',
    ask_title: 'A question about *your file*?',
    ask_text: 'Bleed, dielines, Pantone colours or the right material — our team replies within 24 hours.',
    ask_button: 'Send a question',
    articles: '{n} articles',
  },
});

function FeaturedPost({ post }: { post: Post }) {
  const l = useL();
  const c = useDict(C);
  const title = plain(l(post.title));
  return (
    <Link to={postHref(post)} className="group grid overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-500 hover:shadow-[0_40px_80px_-50px_rgba(18,16,20,0.5)] lg:grid-cols-[1.1fr_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand lg:aspect-auto lg:min-h-[480px]">
        <Img src={post.cover} eager alt={title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
        <span className="absolute left-4 top-4 rounded-md bg-brand-600 px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white shadow-lg sm:left-5 sm:top-5">{c('latest')}</span>
      </div>
      <div className="flex flex-col p-7 sm:p-10 lg:p-12">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-brand-50 px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-700">{l(post.tag)}</span>
          <PostMeta post={post} long />
        </div>
        <h2 className="display mt-6 text-[30px] leading-[1.08] text-ink transition-colors group-hover:text-brand-700 sm:text-[42px]">{title}</h2>
        <p className="mt-5 text-[16.5px] leading-relaxed text-muted">{l(post.excerpt)}</p>
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-6 max-lg:mt-8">
          <span className="flex items-center gap-3 text-[14px] font-semibold text-ink">
            <AuthorAvatar name={post.author} className="h-10 w-10" />
            {isTeamAuthor(post.author) ? c('team') : post.author}
          </span>
          <span className="inline-flex items-center gap-3 text-sm font-semibold text-ink">
            <span className="hidden sm:inline">{c('readArticle')}</span>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-white transition-all duration-500 group-hover:-rotate-45 group-hover:bg-brand-600">
              <ArrowRight className="h-5 w-5" />
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function AskTile() {
  const t = useDict(T);
  const settings = useSettings();
  return (
    <div className="relative isolate flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl bg-ink p-7 text-white sm:p-8">
      <ChevronTexture />
      <div className="relative">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-brand-300 ring-1 ring-white/15">
          <MessageSquare className="h-5 w-5" />
        </span>
        <Eyebrow tone="light" className="mt-7">{t('ask_eyebrow')}</Eyebrow>
        <h3 className="display mt-3 text-[28px] leading-[1.1]">
          <Accent text={t('ask_title')} accentClassName="text-brand-300" />
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">{t('ask_text')}</p>
      </div>
      <div className="relative mt-auto flex flex-col gap-2 pt-8">
        <ButtonLink to="/kontakt#formulari" variant="light" iconRight={<ArrowUpRight className="h-4 w-4" />}>
          {t('ask_button')}
        </ButtonLink>
        <a href={telHref(settings.phone)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
          <Phone className="h-4 w-4" />
          {settings.phone}
        </a>
      </div>
      <CmykBar className="absolute inset-x-0 bottom-0" />
    </div>
  );
}

export default function Blog() {
  const t = useDict(T);
  const l = useL();
  const posts = usePublishedPosts();
  const [params, setParams] = useSearchParams();
  usePageTitle(t('title'));

  const tags = useMemo(() => {
    const map = new Map<string, { key: string; post: Post; n: number }>();
    for (const p of posts) {
      const k = tagKey(p);
      const cur = map.get(k);
      if (cur) cur.n++;
      else map.set(k, { key: k, post: p, n: 1 });
    }
    return [...map.values()];
  }, [posts]);

  const active = tags.some((x) => x.key === params.get('tag')) ? (params.get('tag') as string) : '';
  const list = useMemo(() => (active ? posts.filter((p) => tagKey(p) === active) : posts), [posts, active]);
  const [featured, ...rest] = list;
  const select = (key: string) => setParams(key ? { tag: key } : {}, { replace: true, preventScrollReset: true });

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="container-x pb-12 pt-10 sm:pb-14 sm:pt-14">
          <Breadcrumbs items={[{ label: t('title') }]} />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div className="animate-fade-up">
              <Eyebrow>{t('eyebrow')}</Eyebrow>
              <h1 className="display mt-5 text-[44px] leading-[1.0] text-ink sm:text-[64px]">
                <Accent text={t('heroTitle')} />
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-ink-soft">{t('heroText')}</p>
            </div>
            <div className="hidden justify-end lg:flex">
              <div className="relative">
                <CropMarks />
                <div className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 ring-1 ring-line">
                  <BookOpen className="h-5 w-5 text-brand-600" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{t('articles', { n: posts.length })}</span>
                </div>
              </div>
            </div>
          </div>
          {tags.length > 1 && (
            <div className="no-scrollbar -mx-4 mt-10 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label={t('topics')}>
              <span className="mr-2 hidden shrink-0 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted sm:inline">{t('topics')}</span>
              {[{ key: '', label: t('all'), n: posts.length }, ...tags.map((x) => ({ key: x.key, label: l(x.post.tag), n: x.n }))].map((chip) => (
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
          )}
        </div>
        <CmykBar className="absolute inset-x-0 bottom-0" />
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-x">
          {!posts.length ? (
            <EmptyState
              className="rounded-2xl bg-white ring-1 ring-line"
              icon={<BookOpen className="h-6 w-6" />}
              title={t('emptyTitle')}
              text={t('emptyText')}
              action={
                <ButtonLink to="/kontakt" variant="dark">
                  {t('contact')}
                </ButtonLink>
              }
            />
          ) : !featured ? (
            <EmptyState
              className="rounded-2xl bg-white ring-1 ring-line"
              icon={<BookOpen className="h-6 w-6" />}
              title={t('emptyTagTitle')}
              text={t('emptyTagText')}
              action={
                <Button variant="dark" onClick={() => select('')}>
                  {t('showAll')}
                </Button>
              }
            />
          ) : (
            <div key={active || 'all'} className="animate-fade-up">
              <FeaturedPost post={featured} />
              <div className="mt-16 flex items-center gap-5 sm:mt-20">
                <h2 className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-ink">{t('more')}</h2>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 90} className="h-full">
                    <PostCard post={p} />
                  </Reveal>
                ))}
                <Reveal delay={(rest.length % 3) * 90} className="h-full">
                  <AskTile />
                </Reveal>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
