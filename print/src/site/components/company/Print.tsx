import { useId, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/*
 * Print motifs used across the company pages — kept small and quiet:
 * crop marks on card corners, a thin CMYK colour bar, a registration target,
 * the logo chevrons as a faint texture on dark sections, and mono spec labels.
 */

/** Trim/crop marks just outside the four corners of the (relative) parent. */
export function CropMarks({ tone = 'dark', size = 12, gap = 6, className }: { tone?: 'dark' | 'light' | 'brand'; size?: number; gap?: number; className?: string }) {
  const colour = tone === 'light' ? 'bg-white/35' : tone === 'brand' ? 'bg-brand-600/60' : 'bg-ink/25';
  const off = -(gap + size);
  const line = (style: CSSProperties, horizontal: boolean) => <span className={cn('absolute', colour)} style={{ ...style, width: horizontal ? size : 1, height: horizontal ? 1 : size }} />;
  return (
    <span aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      {/* top-left */}
      {line({ top: 0, left: off }, true)}
      {line({ left: 0, top: off }, false)}
      {/* top-right */}
      {line({ top: 0, right: off }, true)}
      {line({ right: 0, top: off }, false)}
      {/* bottom-left */}
      {line({ bottom: 0, left: off }, true)}
      {line({ left: 0, bottom: off }, false)}
      {/* bottom-right */}
      {line({ bottom: 0, right: off }, true)}
      {line({ right: 0, bottom: off }, false)}
    </span>
  );
}

/** Thin process-colour bar (C · M · Y · K) — a press-sheet colour strip. */
export function CmykBar({ className, segments = false }: { className?: string; segments?: boolean }) {
  if (segments) {
    return (
      <span aria-hidden className={cn('flex h-2 gap-[3px]', className)}>
        {['bg-cyan', 'bg-magenta', 'bg-yellow', 'bg-key', 'bg-cyan/50', 'bg-magenta/50', 'bg-yellow/60', 'bg-key/50'].map((c, i) => (
          <span key={i} className={cn('w-3 rounded-[1px]', c)} />
        ))}
      </span>
    );
  }
  return (
    <span aria-hidden className={cn('flex h-[3px] w-full overflow-hidden', className)}>
      <span className="flex-1 bg-cyan" />
      <span className="flex-1 bg-magenta" />
      <span className="flex-1 bg-yellow" />
      <span className="flex-1 bg-key" />
    </span>
  );
}

/** Registration target (circle + cross hair). */
export function RegMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-4 w-4', className)} fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
      <path d="M12 1v22M1 12h22" />
    </svg>
  );
}

/** Eyebrow with a registration target in front — mono, uppercase, brand colour. */
export function Eyebrow({ children, tone = 'dark', className }: { children: ReactNode; tone?: 'dark' | 'light'; className?: string }) {
  return (
    <div className={cn('eyebrow inline-flex items-center gap-2', tone === 'light' && 'text-brand-300', className)}>
      <RegMark className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

const ROW = 'M72 0H107.5V29.5L35 102H0V72Z M114.5 0H150L217 67V102H187L114.5 29.5Z M229 74L303 0H330V38L266 102H229Z';

/** The logo chevrons as a faint repeating texture (for dark ink sections). */
export function ChevronTexture({ className, opacity = 0.035, scale = 0.16 }: { className?: string; opacity?: number; scale?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg aria-hidden className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}>
      <defs>
        <pattern id={`chev-${id}`} width={400} height={240} patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
          <g fill="#fff" fillOpacity={opacity}>
            <path d={ROW} />
            <path d={ROW} transform="translate(0 92)" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#chev-${id})`} />
    </svg>
  );
}

/** Mono label + value pair (spec sheet style). */
export function Spec({ label, children, tone = 'dark', className }: { label: ReactNode; children: ReactNode; tone?: 'dark' | 'light'; className?: string }) {
  return (
    <div className={className}>
      <div className={cn('font-mono text-[10.5px] uppercase tracking-[0.16em]', tone === 'light' ? 'text-white/45' : 'text-muted')}>{label}</div>
      <div className={cn('mt-1.5 text-[15px] font-semibold leading-snug', tone === 'light' ? 'text-white' : 'text-ink')}>{children}</div>
    </div>
  );
}

/** Small mono chip, e.g. "B1", "8 × LED UV". */
export function MonoChip({ children, tone = 'dark', className }: { children: ReactNode; tone?: 'dark' | 'light' | 'brand'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em]',
        tone === 'light' ? 'bg-white/10 text-white/80 ring-1 ring-white/15' : tone === 'brand' ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100' : 'bg-ink/[0.05] text-ink-soft ring-1 ring-ink/10',
        className,
      )}
    >
      {children}
    </span>
  );
}
