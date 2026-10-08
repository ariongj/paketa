import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { Img, plain } from '@/components/ui/misc';
import { LogoMark } from '@/components/brand/Logo';
import { useDict, useL, useLang } from '@/i18n';
import { date } from '@/lib/format';
import { cn, initials } from '@/lib/utils';
import { C } from './dict';
import { postHref } from './posts';

/** Authors written by the in-house team ("Ekipi PrintWorks", "PrintWorks team"…) get the logo mark. */
export const isTeamAuthor = (name: string) => /printworks|ekipi|team/i.test(name);

/** Round author avatar — the PrintWorks mark for the in-house team, initials otherwise. */
export function AuthorAvatar({ name, className }: { name: string; className?: string }) {
  const team = isTeamAuthor(name);
  return (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1', team ? 'bg-white ring-line' : 'bg-ink text-paper ring-ink', className)} aria-hidden>
      {team ? <LogoMark className="h-[42%] w-auto" /> : <span className="font-mono text-[11px] font-medium tracking-wider">{initials(name)}</span>}
    </span>
  );
}

/** "12 sht 2026 · 4 min lexim" in mono. */
export function PostMeta({ post, className, long }: { post: Post; className?: string; long?: boolean }) {
  const lang = useLang();
  const c = useDict(C);
  return (
    <div className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted', className)}>
      <time dateTime={post.publishedAt}>{date(post.publishedAt, lang, long ? { day: 'numeric', month: 'long', year: 'numeric' } : undefined)}</time>
      <span className="h-px w-3 bg-current opacity-40" />
      <span>{c('minRead', { n: post.readMinutes })}</span>
    </div>
  );
}

/** Blog card. `horizontal` puts the cover beside the text from `sm` up. */
export function PostCard({ post, layout = 'vertical', className, priority }: { post: Post; layout?: 'vertical' | 'horizontal'; className?: string; priority?: boolean }) {
  const l = useL();
  const c = useDict(C);
  const title = plain(l(post.title));

  const cover = (
    <div className={cn('relative overflow-hidden rounded-2xl bg-sand ring-1 ring-line/60', layout === 'horizontal' ? 'aspect-[4/3] sm:aspect-square' : 'aspect-[4/3]')}>
      <Img src={post.cover} small eager={priority} alt={title} className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]" />
      <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink shadow-sm">{l(post.tag)}</span>
    </div>
  );

  const body = (
    <div className={cn('flex flex-1 flex-col', layout === 'vertical' && 'pt-5')}>
      <PostMeta post={post} />
      <h3 className={cn('display mt-2.5 leading-[1.14] text-ink transition-colors group-hover:text-brand-700', layout === 'horizontal' ? 'text-[22px] sm:text-[24px]' : 'text-[23px] sm:text-[25px]')}>{title}</h3>
      <p className="mt-2.5 line-clamp-3 text-[15px] leading-relaxed text-muted">{l(post.excerpt)}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-ink">
        <span className="link-u">{c('readArticle')}</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </div>
  );

  if (layout === 'horizontal') {
    return (
      <Link to={postHref(post)} className={cn('group grid items-center gap-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] sm:gap-7', className)}>
        {cover}
        {body}
      </Link>
    );
  }
  return (
    <Link to={postHref(post)} className={cn('group flex h-full flex-col', className)}>
      {cover}
      {body}
    </Link>
  );
}
