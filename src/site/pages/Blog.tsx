import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, ArrowUpRight, BookOpen, MessageCircle, Phone, Sparkles } from 'lucide-react';
import type { Post } from '@/lib/types';
import { Accent, EmptyState, Img, Reveal, plain } from '@/components/ui/misc';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PageHero } from '@/site/components/SectionHeading';
import { AuthorAvatar, PostCard, PostMeta } from '@/site/components/content/PostCard';
import { C } from '@/site/components/content/dict';
import { postHref, tagKey, telHref, usePublishedPosts } from '@/site/components/content/posts';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { ACCENT_ON_DARK } from '@/site/components/company/Blocks';
import { defineDict, useDict, useL } from '@/i18n';
import { useSettings } from '@/store/hooks';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    title: 'Blog',
    eyebrow: 'Savjeti za vaš lokal',
    heroTitle: 'Bolji *take-away*, manje troškova',
    heroText: 'Praktični vodiči našeg tima — kako izabrati čaše i poklopce, koji materijal za koju hranu, kako uštedjeti na ambalaži i kako vaš logo pretvoriti u reklamu.',
    topics: 'Teme',
    all: 'Sve',
    more: 'Još članaka',
    emptyTitle: 'Još nema objavljenih članaka',
    emptyText: 'Uskoro objavljujemo nove vodiče. U međuvremenu, pitajte nas direktno — rado ćemo pomoći.',
    emptyTagTitle: 'Nema članaka za ovu temu',
    emptyTagText: 'Pogledajte sve članke ili izaberite drugu temu.',
    showAll: 'Prikaži sve članke',
    contact: 'Kontaktirajte nas',
    ask_eyebrow: 'Pitajte nas',
    ask_title: 'Niste sigurni *šta vam treba*?',
    ask_text: 'Recite nam šta služite i koliko — predložićemo ambalažu i poslati besplatne uzorke.',
    ask_button: 'Pošaljite pitanje',
  },
  sq: {
    title: 'Blog',
    eyebrow: 'Këshilla për lokalin tuaj',
    heroTitle: '*Take-away* më i mirë, më pak kosto',
    heroText: 'Udhëzues praktikë nga ekipi ynë — si të zgjidhni gotat dhe kapakët, cili material për cilin ushqim, si të kurseni në paketim dhe si ta ktheni logon tuaj në reklamë.',
    topics: 'Temat',
    all: 'Të gjitha',
    more: 'Më shumë artikuj',
    emptyTitle: 'Ende nuk ka artikuj të publikuar',
    emptyText: 'Së shpejti publikojmë udhëzues të rinj. Ndërkohë, na pyesni direkt — ju ndihmojmë me kënaqësi.',
    emptyTagTitle: 'Nuk ka artikuj për këtë temë',
    emptyTagText: 'Shikoni të gjithë artikujt ose zgjidhni një temë tjetër.',
    showAll: 'Shfaq të gjithë artikujt',
    contact: 'Na kontaktoni',
    ask_eyebrow: 'Na pyesni',
    ask_title: 'Nuk jeni të sigurt *çfarë ju duhet*?',
    ask_text: 'Na tregoni çfarë shërbeni dhe sa — ju propozojmë paketimin dhe ju dërgojmë mostra falas.',
    ask_button: 'Dërgoni pyetjen',
  },
  en: {
    title: 'Blog',
    eyebrow: 'Advice for your venue',
    heroTitle: 'Better *take-away*, lower costs',
    heroText: 'Practical guides from our team — how to pick cups and lids, which material suits which food, how to save on packaging and how to turn your logo into advertising.',
    topics: 'Topics',
    all: 'All',
    more: 'More articles',
    emptyTitle: 'No articles published yet',
    emptyText: 'New guides are on the way. In the meantime, ask us directly — we’re happy to help.',
    emptyTagTitle: 'No articles on this topic',
    emptyTagText: 'See all articles or pick another topic.',
    showAll: 'Show all articles',
    contact: 'Contact us',
    ask_eyebrow: 'Ask us',
    ask_title: 'Not sure *what you need*?',
    ask_text: 'Tell us what you serve and how much — we’ll suggest the packaging and send free samples.',
    ask_button: 'Send a question',
  },
});

function FeaturedPost({ post }: { post: Post }) {
  const l = useL();
  const c = useDict(C);
  const title = plain(l(post.title));
  return (
    <Link
      to={postHref(post)}
      className="group grid overflow-hidden rounded-[32px] bg-white ring-1 ring-line transition-shadow duration-500 hover:shadow-[0_40px_80px_-50px_rgba(15,29,22,0.55)] lg:grid-cols-[1.22fr_1fr]"
    >
      <div className="relative aspect-[16/11] overflow-hidden bg-sand lg:aspect-auto lg:min-h-[500px]">
        <Img src={post.cover} eager alt={title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
        <span className="absolute left-5 top-5 inline-flex -rotate-3 items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink shadow-lg sm:left-6 sm:top-6">
          <Sparkles className="h-3.5 w-3.5" />
          {c('latest')}
        </span>
      </div>
      <div className="flex flex-col p-7 sm:p-10 lg:p-12">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-700">{l(post.tag)}</span>
          <PostMeta post={post} long />
        </div>
        <h2 className="display mt-6 text-[32px] leading-[1.06] text-ink transition-colors group-hover:text-brand-700 sm:text-[44px]">{title}</h2>
        <p className="mt-5 text-[16.5px] leading-relaxed text-muted">{l(post.excerpt)}</p>
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-6 max-lg:mt-8">
          <span className="flex items-center gap-3 text-[14px] font-semibold text-ink">
            <AuthorAvatar name={post.author} className="h-10 w-10" />
            {post.author}
          </span>
          <span className="inline-flex items-center gap-3 text-sm font-semibold text-ink">
            <span className="hidden sm:inline">{c('readArticle')}</span>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-paper transition-all duration-500 group-hover:-rotate-45 group-hover:bg-brand-600">
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
    <div className="relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-3xl bg-brand-700 p-7 text-white sm:p-8">
      <div className="bg-grain pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-signal/40 blur-3xl" />
      <div className="relative">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime text-ink">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div className="eyebrow mt-7 text-lime">{t('ask_eyebrow')}</div>
        <h3 className="display mt-3 text-[30px] leading-[1.08]">
          <Accent text={t('ask_title')} accentClassName={ACCENT_ON_DARK} />
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-white/75">{t('ask_text')}</p>
      </div>
      <div className="relative mt-auto flex flex-col gap-2 pt-8">
        <ButtonLink to="/kontakti" variant="light" iconRight={<ArrowUpRight className="h-4 w-4" />}>
          {t('ask_button')}
        </ButtonLink>
        <a href={telHref(settings.phone)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
          <Phone className="h-4 w-4" />
          {settings.phone}
        </a>
      </div>
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
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroText')} crumbs={[{ label: t('title') }]}>
        {tags.length > 1 && (
          <div className="mt-9 flex flex-wrap items-center gap-2" role="tablist" aria-label={t('topics')}>
            <span className="mr-2 hidden text-[11px] font-bold uppercase tracking-[0.18em] text-muted sm:inline">{t('topics')}</span>
            {[{ key: '', label: t('all'), n: posts.length }, ...tags.map((x) => ({ key: x.key, label: l(x.post.tag), n: x.n }))].map((chip) => (
              <button
                key={chip.key || 'all'}
                type="button"
                role="tab"
                aria-selected={active === chip.key}
                onClick={() => select(chip.key)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-full border pl-4 pr-2 text-[13.5px] font-semibold transition-colors',
                  active === chip.key ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink-soft hover:border-brand-600/40 hover:text-ink',
                )}
              >
                {chip.label}
                <span className={cn('grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-bold tabular-nums', active === chip.key ? 'bg-white/20 text-white' : 'bg-sand text-ink-soft')}>{chip.n}</span>
              </button>
            ))}
          </div>
        )}
      </PageHero>

      <section className="py-14 sm:py-20">
        <div className="container-x">
          {!posts.length ? (
            <div className="rounded-[32px] bg-white ring-1 ring-line">
              <EmptyState
                icon={<BookOpen className="h-6 w-6" />}
                title={t('emptyTitle')}
                text={t('emptyText')}
                action={
                  <ButtonLink to="/kontakti" variant="dark">
                    {t('contact')}
                  </ButtonLink>
                }
              />
            </div>
          ) : !featured ? (
            <div className="rounded-[32px] bg-white ring-1 ring-line">
              <EmptyState
                icon={<BookOpen className="h-6 w-6" />}
                title={t('emptyTagTitle')}
                text={t('emptyTagText')}
                action={
                  <Button variant="dark" onClick={() => select('')}>
                    {t('showAll')}
                  </Button>
                }
              />
            </div>
          ) : (
            <div key={active || 'all'} className="animate-fade-up">
              <FeaturedPost post={featured} />

              {rest.length > 0 && (
                <>
                  <div className="mt-16 flex items-center gap-5 sm:mt-20">
                    <h2 className="display shrink-0 text-[28px] leading-none text-ink sm:text-[34px]">{t('more')}</h2>
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
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
