// Offer landing hero: badge, landing title/text, the linked discount (code to copy or "automatic"), countdown, image.
import { ArrowDown, CalendarClock, Gift, Sparkles } from 'lucide-react';
import { Accent, Img } from '@/components/ui/misc';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { ACCENT_ON_DARK } from '@/site/components/company/Blocks';
import { useMeasureHref, scrollToId } from '@/site/components/company/data';
import { useL, useLang } from '@/i18n';
import type { Discount, Offer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CodeBox, Countdown } from './parts';
import { longDate } from './model';
import { useOT } from './i18n';

export function OfferHero({ offer, discount, value, onCta }: { offer: Offer; discount?: Discount; value: string | null; onCta: () => void }) {
  const t = useOT();
  const l = useL();
  const lang = useLang();
  const samplesHref = useMeasureHref();
  const title = l(offer.landing.title) || l(offer.name);
  const badge = l(offer.badge);
  const code = discount?.method === 'code' ? discount.code : undefined;
  const big = discount?.kind === 'bxgy' ? badge || value : value;

  return (
    <section className="relative isolate overflow-hidden bg-brand-800 text-white">
      <div className="bg-grain pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-signal/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-52 right-0 -z-10 h-[420px] w-[420px] rounded-full bg-lime/10 blur-[120px]" />
      <div className="container-x grid items-center gap-12 pb-16 pt-10 sm:pb-20 sm:pt-14 lg:grid-cols-[1.08fr_1fr] lg:gap-16 lg:pb-24">
        <div className="animate-fade-up">
          <Breadcrumbs tone="light" items={[{ label: t('crumb') }, { label: l(offer.name) }]} />
          {badge && badge !== big && (
            <span className="mt-9 inline-flex -rotate-2 items-center gap-1.5 rounded-full bg-lime px-3.5 py-1.5 text-[12.5px] font-extrabold text-ink shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)]">
              <Sparkles className="h-3.5 w-3.5" /> {badge}
            </span>
          )}
          <h1 className={cn('display max-w-2xl text-[42px] leading-[1.02] sm:text-[60px] lg:text-[66px]', badge && badge !== big ? 'mt-6' : 'mt-10')}>
            <Accent text={title} accentClassName={ACCENT_ON_DARK} />
          </h1>
          {l(offer.landing.text) && <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/75">{l(offer.landing.text)}</p>}

          <div className="mt-8">
            {code ? (
              <CodeBox code={code} onUse={onCta} />
            ) : discount ? (
              <span className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-2.5 text-[14px] font-semibold text-white ring-1 ring-white/15">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-lime text-ink">
                  <Gift className="h-3.5 w-3.5" />
                </span>
                {t('autoChip')}
              </span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              variant="light"
              onClick={() => {
                onCta();
                scrollToId('produktet');
              }}
              iconRight={<ArrowDown className="h-4 w-4" />}
            >
              {t('seeProducts')}
            </Button>
            <ButtonLink to={samplesHref} size="lg" variant="outlineLight" onClick={onCta}>
              {t('samples')}
            </ButtonLink>
          </div>

          <div className="mt-10 border-t border-white/10 pt-7">
            {offer.endsAt ? (
              <Countdown to={offer.endsAt} tone="dark" />
            ) : (
              <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-white/70">
                <CalendarClock className="h-4 w-4 text-lime" /> {t('noEnd')}
              </span>
            )}
            {offer.endsAt && <div className="mt-3 text-[13px] text-white/55">{t('activeUntil', { date: longDate(offer.endsAt, lang) })}</div>}
          </div>
        </div>

        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[34px] border-2 border-dashed border-lime/40 sm:translate-x-5 sm:translate-y-5" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-brand-700 lg:aspect-[4/5]">
            <Img src={offer.image} eager alt={l(offer.name)} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-900/40 via-transparent to-transparent" />
          </div>
          {big && (
            <div className="absolute -left-3 -top-5 rotate-[-8deg] rounded-[22px] bg-pink px-5 py-3 text-white shadow-[0_20px_40px_-18px_rgba(0,0,0,0.6)] sm:-left-6 sm:-top-6">
              <div className="display max-w-[11ch] text-[30px] leading-[0.95] sm:text-[40px]">{big}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
