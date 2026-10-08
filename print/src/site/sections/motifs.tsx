// Print motifs used sparingly on the storefront: crop marks, registration target, CMYK colour bar and the
// logo-chevron texture for dark sections. Purely decorative — always aria-hidden.
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * Four corner crop marks drawn OUTSIDE the parent box (parent must be `relative`).
 * `gap` = distance from the corner, `len` = mark length (px).
 */
export function CropMarks({ className, gap = 8, len = 14, tone = 'dark' }: { className?: string; gap?: number; len?: number; tone?: 'dark' | 'light' | 'brand' }) {
  const colour = tone === 'light' ? 'bg-white/45' : tone === 'brand' ? 'bg-brand-600' : 'bg-ink/35';
  const o = gap + len;
  const h = (s: CSSProperties) => <span className={cn('absolute h-px', colour)} style={{ width: len, ...s }} />;
  const v = (s: CSSProperties) => <span className={cn('absolute w-px', colour)} style={{ height: len, ...s }} />;
  return (
    <span aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      {h({ top: 0, left: -o })}
      {v({ left: 0, top: -o })}
      {h({ top: 0, right: -o })}
      {v({ right: 0, top: -o })}
      {h({ bottom: 0, left: -o })}
      {v({ left: 0, bottom: -o })}
      {h({ bottom: 0, right: -o })}
      {v({ right: 0, bottom: -o })}
    </span>
  );
}

/** Corner ticks drawn INSIDE a card (hover detail for tiles). */
export function CornerTicks({ className, size = 12 }: { className?: string; size?: number }) {
  const base = 'absolute border-current';
  const s = { width: size, height: size };
  return (
    <span aria-hidden className={cn('pointer-events-none absolute inset-3', className)}>
      <span className={cn(base, 'left-0 top-0 border-l border-t')} style={s} />
      <span className={cn(base, 'right-0 top-0 border-r border-t')} style={s} />
      <span className={cn(base, 'bottom-0 left-0 border-b border-l')} style={s} />
      <span className={cn(base, 'bottom-0 right-0 border-b border-r')} style={s} />
    </span>
  );
}

/** Registration target (⊕ with a centre dot). Inherits `currentColor`. */
export function RegMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-4 w-4', className)} fill="none" stroke="currentColor" strokeWidth={1.25} aria-hidden>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 1v22M1 12h22" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Thin CMYK colour bar (solids then 50% tints), like the control strip on a press sheet. */
export function ColorBar({ className, tints = true }: { className?: string; tints?: boolean }) {
  const solids = ['bg-cyan', 'bg-magenta', 'bg-yellow', 'bg-key'];
  return (
    <span aria-hidden className={cn('flex h-1.5 overflow-hidden', className)}>
      {solids.map((c) => (
        <span key={c} className={cn('flex-1', c)} />
      ))}
      {tints &&
        solids.map((c) => (
          <span key={`${c}-t`} className={cn('flex-1 opacity-50', c, c === 'bg-key' && 'bg-ink-soft opacity-100')} />
        ))}
    </span>
  );
}

/** Small CMYK swatch row (4 squares) — eyebrow-sized detail. */
export function CmykDots({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('inline-flex gap-[3px]', className)}>
      {['bg-cyan', 'bg-magenta', 'bg-yellow', 'bg-key ring-1 ring-white/25'].map((c) => (
        <span key={c} className={cn('h-1.5 w-1.5 rounded-[1px]', c)} />
      ))}
    </span>
  );
}

/* The logo chevrons (same geometry as components/brand/Logo), tiled as a faint texture. */
const ROW = 'M72 0H107.5V29.5L35 102H0V72Z M114.5 0H150L217 67V102H187L114.5 29.5Z M229 74L303 0H330V38L266 102H229Z';

/** Faint tiled chevron pattern for dark sections. Parent must be `relative`. */
export function ChevronTexture({ className, id = 'pw-chev' }: { className?: string; id?: string }) {
  return (
    <svg aria-hidden className={cn('pointer-events-none absolute inset-0 h-full w-full text-white/[0.035] [mask-image:radial-gradient(ellipse_80%_70%_at_85%_10%,black,transparent_75%)]', className)}>
      <defs>
        <pattern id={id} width="240" height="168" patternUnits="userSpaceOnUse">
          <g fill="currentColor">
            <path d={ROW} transform="scale(0.42)" />
            <path d={ROW} transform="scale(0.42) translate(0 92)" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
