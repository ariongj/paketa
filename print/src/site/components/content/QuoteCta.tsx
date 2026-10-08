import { ArrowRight, Check } from 'lucide-react';
import { Accent, Img } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { useDict } from '@/i18n';
import { cn } from '@/lib/utils';
import { ChevronTexture, CmykBar, CropMarks, Eyebrow } from '@/site/components/company/Print';
import { C } from './dict';

/** Dark call-to-action box used under articles: request a quote / browse products. */
export function QuoteCta({ image, className }: { image?: string; className?: string }) {
  const c = useDict(C);
  return (
    <div className={cn('relative isolate grid overflow-hidden rounded-3xl bg-ink text-white lg:grid-cols-[1.25fr_1fr]', className)}>
      <ChevronTexture />
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-brand-600/35 blur-[90px]" />
      <div className="relative p-7 sm:p-12 lg:p-14">
        <Eyebrow tone="light">{c('cta_eyebrow')}</Eyebrow>
        <h2 className="display mt-5 text-[32px] leading-[1.05] sm:text-[44px]">
          <Accent text={c('cta_title')} accentClassName="text-brand-300" />
        </h2>
        <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-white/65">{c('cta_text')}</p>
        <ul className="mt-7 space-y-2.5">
          {[c('cta_b1'), c('cta_b2'), c('cta_b3')].map((b) => (
            <li key={b} className="flex items-center gap-3 text-[15px] text-white/85">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600">
                <Check className="h-3 w-3" />
              </span>
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink to="/kerko-oferte" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
            {c('cta_button')}
          </ButtonLink>
          <ButtonLink to="/produktet" size="lg" variant="outlineLight">
            {c('cta_products')}
          </ButtonLink>
        </div>
      </div>
      {image && (
        <div className="relative hidden items-center justify-center p-10 lg:flex">
          <div className="relative w-full max-w-[340px]">
            <CropMarks tone="light" />
            <div className="aspect-square overflow-hidden rounded-2xl bg-white">
              <Img src={image} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      )}
      <CmykBar className="absolute inset-x-0 bottom-0" />
    </div>
  );
}
