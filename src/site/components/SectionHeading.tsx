import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Home } from 'lucide-react';
import { Accent, Img } from '@/components/ui/misc';
import { useDict } from '@/i18n';
import { site } from '@/i18n/site';
import { cn } from '@/lib/utils';

/** Accent words on dark backgrounds: lime text, no marker swipe. */
export const ACCENT_ON_DARK = 'text-lime [background-image:none]!';

/** Small uppercase label with the lime "cut" marker. */
export function Eyebrow({ children, tone = 'dark', className }: { children: ReactNode; tone?: 'dark' | 'light'; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]', tone === 'light' ? 'text-lime' : 'text-brand-700', className)}>
      <span aria-hidden className={cn('h-2 w-2 rotate-45 rounded-[2px]', tone === 'light' ? 'bg-lime' : 'bg-brand-600')} />
      {children}
    </div>
  );
}

/** Eyebrow + display title (supports *accent*) + optional subtitle and action. */
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
          <Eyebrow tone={tone} className="mb-4">
            {eyebrow}
          </Eyebrow>
        )}
        <h2 className={cn('display text-[34px] leading-[1.02] sm:text-[50px]', tone === 'light' ? 'text-white' : 'text-ink')}>
          <Accent text={title} accentClassName={tone === 'light' ? ACCENT_ON_DARK : undefined} />
        </h2>
        {subtitle && <p className={cn('mt-4 text-[16px] leading-relaxed sm:text-[17px]', align === 'center' && 'mx-auto max-w-xl', tone === 'light' ? 'text-paper/70' : 'text-muted')}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Breadcrumbs({ items, tone = 'dark' }: { items: { label: string; to?: string }[]; tone?: 'dark' | 'light' }) {
  const t = useDict(site);
  const all = [{ label: t('home'), to: '/' }, ...items];
  const light = tone === 'light';
  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1 text-[13px] font-medium', light ? 'text-white/65' : 'text-muted')}>
      {all.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
          {it.to && i < all.length - 1 ? (
            <Link to={it.to} className={cn('inline-flex items-center gap-1.5 rounded-full transition-colors', light ? 'hover:text-white' : 'hover:text-ink')}>
              {i === 0 && <Home className="h-3.5 w-3.5" />}
              {it.label}
            </Link>
          ) : (
            <span className={cn('font-semibold', light ? 'text-white' : 'text-ink')}>{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Top-of-page hero for secondary pages. With `image` it renders a rounded dark photo panel;
 * without, a calm kraft-paper header with a die-cut line underneath.
 */
export function PageHero({ eyebrow, title, subtitle, image, crumbs, children }: { eyebrow?: string; title: string; subtitle?: string; image?: string; crumbs?: { label: string; to?: string }[]; children?: ReactNode }) {
  if (image) {
    return (
      <section className="pt-3 sm:pt-4">
        <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4">
          <div className="relative isolate overflow-hidden rounded-[28px] bg-ink sm:rounded-[36px]">
            <Img src={image} eager alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/10" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[20px] border border-dashed border-white/15 sm:inset-4 sm:rounded-[26px]" />
            <div className="container-x pb-14 pt-10 sm:pb-20 sm:pt-14 lg:pb-24">
              {crumbs && <Breadcrumbs items={crumbs} tone="light" />}
              {eyebrow && (
                <Eyebrow tone="light" className="mb-4 mt-10">
                  {eyebrow}
                </Eyebrow>
              )}
              <h1 className={cn('display max-w-3xl text-[40px] leading-[1] text-white sm:text-[64px]', !eyebrow && 'mt-10')}>
                <Accent text={title} accentClassName={ACCENT_ON_DARK} />
              </h1>
              {subtitle && <p className="mt-5 max-w-2xl text-[16.5px] leading-relaxed text-paper/80 sm:text-[18px]">{subtitle}</p>}
              {children}
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="relative border-b border-dashed border-ink/15 bg-[linear-gradient(180deg,var(--color-sand)_0%,var(--color-paper)_100%)]">
      <div aria-hidden className="bg-grain pointer-events-none absolute inset-0" />
      <div className="container-x relative pb-12 pt-8 sm:pb-16 sm:pt-12">
        {crumbs && <Breadcrumbs items={crumbs} />}
        {eyebrow && (
          <Eyebrow className="mb-4 mt-9">
            {eyebrow}
          </Eyebrow>
        )}
        <h1 className={cn('display max-w-3xl text-[40px] leading-[1.02] text-ink sm:text-[60px]', !eyebrow && 'mt-9')}>
          <Accent text={title} />
        </h1>
        {subtitle && <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-muted sm:text-[17.5px]">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
