import { cn } from '@/lib/utils';

/**
 * PrintWorks mark — two stacked chevron rows (each "/ \ /", six bars in all), redrawn from the
 * company's logo artwork (330 × 194 units). Shared by the full logo and the standalone mark.
 */
const ROW = 'M72 0H107.5V29.5L35 102H0V72Z M114.5 0H150L217 67V102H187L114.5 29.5Z M229 74L303 0H330V38L266 102H229Z';

function MarkPaths({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <path d={ROW} />
      <path d={ROW} transform="translate(0 92)" />
    </g>
  );
}

type Tone = 'dark' | 'light' | 'mono-light' | 'mono-dark';

const colours = (tone: Tone) => ({
  mark: tone === 'mono-light' ? '#ffffff' : tone === 'mono-dark' ? 'var(--color-ink)' : 'var(--color-brand-600)',
  word: tone === 'light' || tone === 'mono-light' ? '#ffffff' : 'var(--color-ink)',
});

/** Full logo: mark + "PrintWorks®" wordmark (≈ 5.6 : 1). `light` = for dark backgrounds (purple mark, white type). */
export function Logo({ className, tone = 'dark' }: { className?: string; tone?: Tone }) {
  const c = colours(tone);
  return (
    <svg viewBox="0 0 1090 194" className={cn('h-8 w-auto', className)} role="img" aria-label="PrintWorks">
      <MarkPaths fill={c.mark} />
      {/* textLength pins the wordmark width, so it never overflows the frame (e.g. before DM Sans has loaded) */}
      <text x="366" y="152" textLength="691" lengthAdjust="spacingAndGlyphs" fill={c.word} style={{ font: '500 138px var(--font-sans)', letterSpacing: '-2px' }}>
        PrintWorks
      </text>
      <text x="1064" y="66" fill={c.word} style={{ font: '500 34px var(--font-sans)' }}>
        ®
      </text>
    </svg>
  );
}

/** The chevron mark on its own (favicon-style uses, avatars, small badges). */
export function LogoMark({ className, tone = 'dark' }: { className?: string; tone?: Tone }) {
  const c = colours(tone);
  return (
    <svg viewBox="0 0 330 194" className={cn('h-6 w-auto', className)} aria-hidden>
      <MarkPaths fill={c.mark} />
    </svg>
  );
}
