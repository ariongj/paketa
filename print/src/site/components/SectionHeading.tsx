import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Accent, Img } from '@/components/ui/misc';
import { useDict } from '@/i18n';
import { site } from '@/i18n/site';
import { cn } from '@/lib/utils';
import { ChevronTexture, CropMarks } from '@/site/sections/motifs';

/** Mono eyebrow + display title (supports *accent*) + optional subtitle and action. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  align = 'left',
  className,
  tone = 'dark',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  tone?: 'dark' | 'light';
}) {
  return (
    <div className={cn('flex flex-col gap-6', align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <div className={cn('eyebrow mb-4 flex items-center gap-2.5', align === 'center' && 'justify-center', tone === 'light' && 'text-brand-300')}>
            <span aria-hidden className={cn('h-px w-6', tone === 'light' ? 'bg-brand-300/60' : 'bg-brand-600/60')} />
            {eyebrow}
          </div>
        )}
        <h2 className={cn('display text-[34px] leading-[1.04] sm:text-[48px]', tone === 'light' ? 'text-white' : 'text-ink')}>
          <Accent text={title} accentClassName={tone === 'light' ? 'text-brand-400' : undefined} />
        </h2>
        {subtitle && <p className={cn('mt-4 max-w-xl text-[16px] leading-relaxed', tone === 'light' ? 'text-white/65' : 'text-muted')}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Breadcrumbs({ items, tone = 'dark' }: { items: { label: string; to?: string }[]; tone?: 'dark' | 'light' }) {
  const t = useDict(site);
  const all = [{ label: t('home'), to: '/' }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1 text-[13px]', tone === 'light' ? 'text-white/65' : 'text-muted')}>
      {all.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
          {it.to && i < all.length - 1 ? (
            <Link to={it.to} className={cn('hover:underline', tone === 'light' ? 'hover:text-white' : 'hover:text-ink')}>
              {it.label}
            </Link>
          ) : (
            <span className={tone === 'light' ? 'text-white' : 'text-ink'}>{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Top-of-page hero for secondary pages. With `image` it renders a dark header with the picture as a
 * framed "sheet" beside the title (never stretched full-bleed); without, a calm paper header.
 */
export function PageHero({ eyebrow, title, subtitle, image, crumbs, children }: { eyebrow?: string; title: string; subtitle?: string; image?: string; crumbs?: { label: string; to?: string }[]; children?: ReactNode }) {
  if (image) {
    return (
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <ChevronTexture id="pw-pagehero-chev" />
        <div className="pointer-events-none absolute -right-32 top-0 -z-10 h-[480px] w-[480px] rounded-full bg-brand-600/25 blur-[130px]" />
        <div className="container-x grid items-center gap-12 pb-14 pt-10 sm:pb-20 sm:pt-14 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            {crumbs && <Breadcrumbs items={crumbs} tone="light" />}
            {eyebrow && <div className="eyebrow mb-3 mt-8 text-brand-300">{eyebrow}</div>}
            <h1 className={cn('display max-w-3xl text-[42px] leading-[1.0] text-white sm:text-6xl', !eyebrow && 'mt-8')}>
              <Accent text={title} accentClassName="text-brand-400" />
            </h1>
            {subtitle && <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-white/70">{subtitle}</p>}
            {children}
          </div>
          <div className="mx-auto w-full max-w-[420px] px-4 lg:px-0">
            <div className="relative">
              <CropMarks tone="light" gap={9} len={16} />
              <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-white">
                <Img src={image} eager alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="border-b border-line bg-paper">
      <div className="container-x pb-12 pt-10 sm:pb-16 sm:pt-14">
        {crumbs && <Breadcrumbs items={crumbs} />}
        {eyebrow && <div className="eyebrow mb-3 mt-8">{eyebrow}</div>}
        <h1 className={cn('display max-w-3xl text-[40px] leading-[1.04] text-ink sm:text-[56px]', !eyebrow && 'mt-8')}>
          <Accent text={title} />
        </h1>
        {subtitle && <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
