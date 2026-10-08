import { ArrowRight, Check, Package } from 'lucide-react';
import { Accent, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { useDict } from '@/i18n';
import { ChevronTexture, CmykBar, Eyebrow } from '@/site/components/company/Print';
import { T } from './dict';

/** "Custom packaging" band under product grids: request a quote or order the sample kit. */
export function HelpBand() {
  const t = useDict(T);
  return (
    <section className="container-x mt-20 sm:mt-28">
      <Reveal>
        <div className="relative isolate grid overflow-hidden rounded-[32px] bg-ink text-paper lg:grid-cols-[1.25fr_0.75fr]">
          <ChevronTexture />
          <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-brand-600/30 blur-[100px]" />
          <div className="relative p-7 sm:p-12 lg:p-14">
            <Eyebrow tone="light">{t('helpEyebrow')}</Eyebrow>
            <h2 className="display mt-4 max-w-xl text-[34px] leading-[1.04] text-white sm:text-[48px]">
              <Accent text={t('helpTitle')} accentClassName="text-brand-300" />
            </h2>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-paper/65">{t('helpText')}</p>
            <ul className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {[t('helpPoint1'), t('helpPoint2'), t('helpPoint3')].map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[14.5px] font-medium text-paper/90">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <ButtonLink to="/kerko-oferte" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                {t('helpCta')}
              </ButtonLink>
              <ButtonLink to="/produkt/pakete-mostrash-printworks" size="lg" variant="outlineLight" icon={<Package className="h-4 w-4" />}>
                {t('helpSample')}
              </ButtonLink>
            </div>
          </div>
          <div className="relative min-h-[260px] lg:min-h-full">
            <Img src="/images/misc/production.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-ink lg:via-ink/10 lg:to-transparent" />
            <CmykBar segments className="absolute bottom-5 right-5" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
