// Friendly page for an offer that is not live: scheduled (teaser + countdown to the start), expired, or
// draft / paused / unknown slug (generic text — a draft is never revealed). Lists the other live offers.
import { ArrowRight, CalendarClock, Hourglass, TicketX } from 'lucide-react';
import { Accent, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/site/components/SectionHeading';
import { CategoryTiles } from '@/site/components/utility/CategoryTiles';
import { useL, useLang } from '@/i18n';
import type { Offer, OfferState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Countdown, OfferCard } from './parts';
import { longDate } from './model';
import { useOT } from './i18n';

export function OfferEnded({ offer, state, others }: { offer?: Offer; state: OfferState | null; others: Offer[] }) {
  const t = useOT();
  const l = useL();
  const lang = useLang();
  const scheduled = !!offer && state === 'scheduled';
  const expired = !!offer && state === 'expired';
  const name = offer ? l(offer.name) : '';

  const title = scheduled ? t('soon_title') : t('ended_title');
  const text = scheduled
    ? t('soon_text', { name, date: longDate(offer!.startsAt, lang) })
    : expired && offer?.endsAt
      ? t('ended_text', { name, date: longDate(offer.endsAt, lang) })
      : t('ended_generic');

  return (
    <>
      <section className="container-x py-12 sm:py-20">
        <div className={cn('relative grid overflow-hidden rounded-[36px] bg-white ring-1 ring-line', scheduled && 'lg:grid-cols-[1.1fr_1fr]')}>
          <div className="bg-grain pointer-events-none absolute inset-0" />
          <div className={cn('relative px-6 pb-12 pt-14 sm:px-12 sm:pb-14 sm:pt-16', !scheduled && 'text-center')}>
            <span className={cn('grid h-16 w-16 animate-pop place-items-center rounded-full', scheduled ? 'bg-lime text-ink' : 'bg-brand-600 text-white', !scheduled && 'mx-auto')}>
              {scheduled ? <Hourglass className="h-7 w-7" /> : <TicketX className="h-7 w-7" />}
            </span>
            <div className="eyebrow mt-7">{scheduled ? t('soon_eyebrow') : t('ended_eyebrow')}</div>
            <h1 className="display mt-3 text-[38px] leading-[1.04] text-ink sm:text-[54px]">
              <Accent text={title} />
            </h1>
            <p className={cn('mt-4 max-w-lg text-[16px] leading-relaxed text-muted', !scheduled && 'mx-auto')}>{text}</p>
            {scheduled && offer && <Countdown to={offer.startsAt} label={t('startsIn')} className="mt-8" />}
            <div className={cn('mt-9 flex flex-wrap gap-3', !scheduled && 'justify-center')}>
              <ButtonLink to="/produktet?akcija=1" variant="primary" iconRight={<ArrowRight className="h-4 w-4" />}>
                {t('onSale')}
              </ButtonLink>
              <ButtonLink to="/produktet" variant="outline">
                {t('allProducts')}
              </ButtonLink>
            </div>
          </div>
          {scheduled && offer && (
            <div className="relative min-h-[260px]">
              <Img src={offer.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute bottom-5 left-5 inline-flex -rotate-3 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-ink shadow-lg">
                <CalendarClock className="h-3.5 w-3.5 text-brand-600" /> {longDate(offer.startsAt, lang)}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="container-x pb-8">
        <Reveal>
          <SectionHeading eyebrow={t('more_eyebrow')} title={t('more_title')} />
        </Reveal>
        {others.length > 0 ? (
          <div className={others.length === 1 ? 'mt-10' : 'mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3'}>
            {others.map((o, i) => (
              <Reveal key={o.id} delay={i * 90}>
                <OfferCard offer={o} wide={others.length === 1} />
              </Reveal>
            ))}
          </div>
        ) : (
          <>
            <p className="mt-4 text-muted">{t('noActive')}</p>
            <CategoryTiles variant="compact" limit={6} className="mt-8" />
          </>
        )}
      </section>
    </>
  );
}
