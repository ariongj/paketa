import { Link } from 'react-router';
import { ArrowRight, Rotate3d } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Img } from '@/components/ui/misc';
import { useDict } from '@/i18n';
import { cn } from '@/lib/utils';
import { SD, STUDIO_PATH } from './model';

/** Three bags rendered by the studio itself (regenerate from src/studio when the bag model changes). */
const BAGS = '/images/studio/studio-bags.webp';

/** Wide call-out for the 3D studio: homepage (after the product ranges) and the paper-bag category. */
export function StudioBand({ className, compact }: { className?: string; compact?: boolean }) {
  const t = useDict(SD);
  return (
    <section className={cn('bg-paper', className)}>
      <div className="container-x">
        <div className="grid overflow-hidden rounded-[28px] border border-brand-100 bg-brand-50 sm:rounded-[32px] lg:grid-cols-[1fr_1.1fr]">
          <div className={cn('flex flex-col justify-center p-7 sm:p-10', compact ? 'lg:p-10' : 'lg:p-14')}>
            <div className="eyebrow flex items-center gap-2">
              <Rotate3d className="h-4 w-4" /> {t('bandEyebrow')}
            </div>
            <h2 className={cn('display mt-3 leading-[1.04] text-ink', compact ? 'text-[28px] sm:text-[34px]' : 'text-[32px] sm:text-[46px]')}>{t('bandTitle')}</h2>
            <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-ink-soft">{t('bandText')}</p>
            <div className="mt-7">
              <ButtonLink to={STUDIO_PATH} size={compact ? 'md' : 'lg'} iconRight={<ArrowRight className="h-4 w-4" />}>
                {t('bandCta')}
              </ButtonLink>
            </div>
          </div>
          <Link to={STUDIO_PATH} aria-label={t('bandCta')} className={cn('group relative block overflow-hidden bg-[#e7e6ea]', compact ? 'min-h-[220px]' : 'min-h-[240px] lg:min-h-[380px]')}>
            <Img src={BAGS} alt={t('bandAlt')} className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:p-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Compact card on a paper-bag product page: opens the studio on this bag with the options already chosen. */
export function StudioCta({ to, className }: { to: string; className?: string }) {
  const t = useDict(SD);
  return (
    <Link
      to={to}
      className={cn('group flex items-center gap-3.5 rounded-2xl border border-brand-100 bg-brand-50 p-3 pr-4 transition-colors hover:border-brand-300', className)}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-brand-600 ring-1 ring-brand-100">
        <Rotate3d className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold text-ink">
          {t('pdpTitle')}
          <span className="rounded-full bg-brand-600 px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.08em] text-white">{t('new')}</span>
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{t('pdpText')}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-brand-600 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
