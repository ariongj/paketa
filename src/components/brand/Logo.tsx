import { cn } from '@/lib/utils';

/**
 * Paketoje logo — the extruded "P" box mark (forest green, lime, pink) and the rounded "paketoje"
 * wordmark, cropped from the brand artwork (public/images/brand). `tone="light"` swaps in the white
 * wordmark for dark backgrounds; the mark keeps its colours on both.
 *
 * Size it with a height class on `className` (default h-10); everything scales from that height.
 */
export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <span className={cn('inline-flex h-10 shrink-0 items-center gap-[0.22em] select-none', className)} role="img" aria-label="Paketoje — it's packaging">
      <img src="/images/brand/mark.png" alt="" draggable={false} className="h-full w-auto" />
      <img
        src={tone === 'light' ? '/images/brand/wordmark-white.png' : '/images/brand/wordmark.png'}
        alt=""
        draggable={false}
        className="h-[78%] w-auto translate-y-[9%]"
      />
    </span>
  );
}

/** The box mark alone (favicon, avatars, compact headers). */
export function LogoMark({ className }: { className?: string; tone?: 'dark' | 'light' }) {
  return <img src="/images/brand/mark.png" alt="Paketoje" draggable={false} className={cn('h-8 w-auto shrink-0 select-none', className)} />;
}

/** The wordmark alone. */
export function Wordmark({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <img
      src={tone === 'light' ? '/images/brand/wordmark-white.png' : '/images/brand/wordmark.png'}
      alt="paketoje"
      draggable={false}
      className={cn('h-7 w-auto shrink-0 select-none', className)}
    />
  );
}
