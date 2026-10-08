import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, FileQuestion } from 'lucide-react';
import { Img, Reveal, plain } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { Markdown } from '@/components/ui/Markdown';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { AuthorAvatar, PostCard, PostMeta, isTeamAuthor } from '@/site/components/content/PostCard';
import { ShareButtons } from '@/site/components/content/ShareButtons';
import { QuoteCta } from '@/site/components/content/QuoteCta';
import { NotFoundBlock } from '@/site/components/content/NotFoundBlock';
import { C } from '@/site/components/content/dict';
import { headingsOf, postHref, tagKey, usePublishedPosts } from '@/site/components/content/posts';
import { Heading } from '@/site/components/company/Blocks';
import { CropMarks, Eyebrow } from '@/site/components/company/Print';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { date } from '@/lib/format';
import { cn } from '@/lib/utils';

const T = defineDict({
  sq: {
    blog: 'Blog',
    back: 'Kthehu te blogu',
    by: 'Shkruar nga',
    published: 'Publikuar',
    reading: 'Leximi',
    topic: 'Tema',
    toc: 'Në këtë artikull',
    related_eyebrow: 'Vazhdoni leximin',
    related_title: 'Artikuj të *ngjashëm*',
    allPosts: 'Të gjithë artikujt',
    nf_eyebrow: 'Artikulli nuk u gjet',
    nf_title: 'Ky artikull *doli jashtë prerjes*',
    nf_text: 'Artikulli mund të jetë hequr ose adresa i është ndryshuar. Shikoni udhëzuesit e tjerë të ekipit tonë.',
    nf_suggest: 'Mund t’ju interesojë',
    authorNote: 'Udhëzime praktike nga ekipi i prepress-it dhe prodhimit në fabrikën tonë.',
  },
  en: {
    blog: 'Blog',
    back: 'Back to the blog',
    by: 'Written by',
    published: 'Published',
    reading: 'Reading time',
    topic: 'Topic',
    toc: 'In this article',
    related_eyebrow: 'Keep reading',
    related_title: 'Related *articles*',
    allPosts: 'All articles',
    nf_eyebrow: 'Article not found',
    nf_title: 'This article *fell outside the trim*',
    nf_text: 'It may have been removed or its address changed. Have a look at the other guides from our team.',
    nf_suggest: 'You might like',
    authorNote: 'Practical guidance from the prepress and production team at our factory.',
  },
});

/** Editorial typography on top of `.prose-cms`: lead paragraph, larger headings, tip-style quotes. */
const ARTICLE = cn(
  'text-[17px] sm:text-[18px]',
  '[&_p]:leading-[1.8] [&_li]:leading-[1.7] [&_ul]:space-y-2 [&_ol]:space-y-2 [&_li::marker]:text-brand-600 [&_li::marker]:font-mono',
  '[&_h2]:mt-14 [&_h2]:scroll-mt-28 [&_h2]:text-[26px] [&_h2]:leading-tight sm:[&_h2]:text-[30px]',
  '[&>p:first-child]:mt-0 [&>p:first-child]:text-[19px] [&>p:first-child]:text-ink sm:[&>p:first-child]:text-[21px] [&>p:first-child]:leading-[1.65]',
  '[&_blockquote]:my-10 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-[3px] [&_blockquote]:bg-brand-50/70 [&_blockquote]:py-5 [&_blockquote]:pl-6 [&_blockquote]:pr-6 [&_blockquote]:text-[20px] [&_blockquote]:leading-snug sm:[&_blockquote]:pl-8 sm:[&_blockquote]:text-[22px]',
);

/** Thin brand bar at the very top showing how far through the article the reader is. */
function ReadingProgress({ target }: { target: RefObject<HTMLElement | null> }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = target.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const end = top + el.offsetHeight - window.innerHeight * 0.75;
        const v = (window.scrollY - top + 120) / Math.max(1, end - top + 120);
        setP(Math.min(1, Math.max(0, v)));
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [target]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]" aria-hidden>
      <div className="h-full origin-left bg-brand-600 transition-transform duration-150 ease-out" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

/** Sticky table of contents with scroll-spy (headings are matched by order). */
function Toc({ items, bodyRef, label }: { items: string[]; bodyRef: RefObject<HTMLElement | null>; label: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const update = () => {
      const hs = bodyRef.current?.querySelectorAll('h2');
      if (!hs) return;
      let idx = 0;
      hs.forEach((h, i) => {
        if (h.getBoundingClientRect().top < window.innerHeight * 0.35) idx = i;
      });
      setActive(idx);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [bodyRef, items]);
  const go = (i: number) => bodyRef.current?.querySelectorAll('h2')[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <nav aria-label={label}>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{label}</div>
      <ol className="mt-4 border-l border-line">
        {items.map((h, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => go(i)}
              className={cn('-ml-px flex w-full gap-3 border-l-2 py-2 pl-4 text-left text-[13.5px] leading-snug transition-colors', active === i ? 'border-brand-600 font-semibold text-ink' : 'border-transparent text-muted hover:text-ink')}
            >
              <span className="font-mono text-[10.5px] leading-[1.9] text-brand-600">{String(i + 1).padStart(2, '0')}</span>
              {h}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function PostPage() {
  const { slug } = useParams();
  const t = useDict(T);
  const c = useDict(C);
  const l = useL();
  const lang = useLang();
  const posts = usePublishedPosts();
  const post = posts.find((p) => p.slug === slug);
  const articleRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const title = post ? plain(l(post.title)) : '';
  usePageTitle(post ? title : t('nf_eyebrow'));

  const body = post ? l(post.body) : '';
  const toc = useMemo(() => headingsOf(body), [body]);
  const related = useMemo(() => {
    if (!post) return [];
    const key = tagKey(post);
    return posts
      .filter((p) => p.id !== post.id)
      .map((p, i) => ({ p, score: (tagKey(p) === key ? 100 : 0) - i }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.p);
  }, [posts, post]);

  if (!post) {
    return (
      <NotFoundBlock
        icon={<FileQuestion className="h-6 w-6" />}
        eyebrow={t('nf_eyebrow')}
        title={t('nf_title')}
        text={t('nf_text')}
        actions={
          <>
            <ButtonLink to="/blog" variant="dark" iconRight={<ArrowRight className="h-4 w-4" />}>
              {t('allPosts')}
            </ButtonLink>
            <ButtonLink to="/" variant="outline">
              {c('home')}
            </ButtonLink>
          </>
        }
      >
        {posts.length > 0 && (
          <>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{t('nf_suggest')}</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {posts.slice(0, 3).map((p) => (
                <Link key={p.id} to={postHref(p)} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-paper sm:flex-col sm:items-start">
                  <div className="aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg bg-sand sm:w-full">
                    <Img src={p.cover} small alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="min-w-0 sm:px-1 sm:pb-1">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-700">{l(p.tag)}</div>
                    <div className="mt-1 line-clamp-2 text-[14.5px] font-semibold leading-snug text-ink group-hover:text-brand-700">{plain(l(p.title))}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </NotFoundBlock>
    );
  }

  const author = isTeamAuthor(post.author) ? c('team') : post.author;

  return (
    <>
      <ReadingProgress target={articleRef} />
      <article ref={articleRef}>
        <header className="border-b border-line bg-paper pt-10 sm:pt-14">
          <div className="container-x">
            <div className="mx-auto max-w-[860px]">
              <Breadcrumbs items={[{ label: t('blog'), to: '/blog' }, { label: l(post.tag) }]} />
              <Link to={`/blog?tag=${tagKey(post)}`} className="mt-10 inline-block">
                <Eyebrow>{l(post.tag)}</Eyebrow>
              </Link>
              <h1 className="display mt-5 animate-fade-up text-[36px] leading-[1.05] text-ink sm:text-[54px] lg:text-[60px]">{title}</h1>
              <p className="mt-5 max-w-2xl animate-fade-up text-[17px] leading-relaxed text-muted [animation-delay:80ms] sm:text-[19px]">{l(post.excerpt)}</p>
              <dl className="mt-8 grid animate-fade-up grid-cols-2 gap-x-6 gap-y-4 border-t border-line py-6 [animation-delay:140ms] sm:flex sm:flex-wrap sm:items-center sm:gap-x-10">
                <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                  <AuthorAvatar name={post.author} className="h-10 w-10" />
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{t('by')}</dt>
                    <dd className="text-[14.5px] font-semibold text-ink">{author}</dd>
                  </div>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{t('published')}</dt>
                  <dd className="text-[14.5px] font-semibold text-ink">
                    <time dateTime={post.publishedAt}>{date(post.publishedAt, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{t('reading')}</dt>
                  <dd className="text-[14.5px] font-semibold text-ink">{c('minRead', { n: post.readMinutes })}</dd>
                </div>
                <div className="col-span-2 sm:col-span-1 sm:ml-auto">
                  <ShareButtons title={title} variant="pill" />
                </div>
              </dl>
            </div>
          </div>
        </header>

        <div className="container-x pt-10 sm:pt-14">
          <div className="relative mx-auto max-w-[1100px]">
            <CropMarks size={14} gap={8} className="hidden sm:block" />
            <div className="relative aspect-[4/3] animate-fade-in overflow-hidden rounded-2xl bg-sand sm:aspect-[2/1]">
              <Img src={post.cover} eager alt={title} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container-x pb-20 pt-12 sm:pb-24 sm:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,700px)_minmax(0,1fr)] lg:gap-12">
            <aside className="hidden lg:block">
              <div className="sticky top-28 flex justify-end pr-4">
                <ShareButtons title={title} variant="rail" />
              </div>
            </aside>

            <div className="min-w-0">
              <div ref={bodyRef}>
                <Markdown source={body} className={ARTICLE} />
              </div>

              <div className="mt-14 flex flex-col gap-6 border-y border-line py-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <AuthorAvatar name={post.author} className="h-14 w-14" />
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{t('by')}</div>
                    <div className="mt-0.5 text-[16px] font-semibold text-ink">{author}</div>
                    <div className="mt-0.5 max-w-[36ch] text-[13px] leading-snug text-muted">{t('authorNote')}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5 sm:items-end">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{c('shareArticle')}</span>
                  <ShareButtons title={title} variant="row" />
                </div>
              </div>

              <Link to="/blog" className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-ink hover:text-brand-700">
                <ArrowLeft className="h-4 w-4" /> {t('back')}
              </Link>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-8 pl-4">
                {toc.length > 1 && <Toc items={toc} bodyRef={bodyRef} label={t('toc')} />}
                <div className="rounded-xl bg-white p-4 ring-1 ring-line">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{t('topic')}</div>
                  <Link to={`/blog?tag=${tagKey(post)}`} className="mt-1 block text-[14px] font-semibold text-brand-700 hover:underline">
                    {l(post.tag)}
                  </Link>
                  <PostMeta post={post} className="mt-3" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      <section className="pb-20 sm:pb-24">
        <div className="container-x">
          <Reveal>
            <QuoteCta image={post.cover} />
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-white py-20 sm:py-24">
          <div className="container-x">
            <Reveal>
              <Heading
                eyebrow={t('related_eyebrow')}
                title={t('related_title')}
                action={
                  <ButtonLink to="/blog" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                    {t('allPosts')}
                  </ButtonLink>
                }
              />
            </Reveal>
            <div className={cn('mt-12 grid gap-x-8 gap-y-12', related.length >= 3 ? 'md:grid-cols-3' : 'lg:grid-cols-2')}>
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 90} className="h-full">
                  <PostCard post={p} layout={related.length >= 3 ? 'vertical' : 'horizontal'} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
