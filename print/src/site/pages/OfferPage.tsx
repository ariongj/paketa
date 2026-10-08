// /oferta/:slug — campaign landing page (offers centre, CMS proposal pp.28–30). Live offers only; a signed-in CMS user
// can preview a draft / scheduled / ended offer with ?preview=1. Visits and CTA clicks feed the offer metrics.
import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowDown, ArrowRight, BadgeCheck, CalendarRange, Eye, FileText, LayoutGrid, Sparkles } from 'lucide-react';
import { ButtonLink, buttonClass } from '@/components/ui/Button';
import { Accent, Badge, Img, Reveal } from '@/components/ui/misc';
import { useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { money } from '@/lib/format';
import { normalizeCode } from '@/lib/discounts';
import { cn } from '@/lib/utils';
import type { Discount, Offer } from '@/lib/types';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { ProductGrid } from '@/site/components/utility/ProductGrid';
import { HelpBand } from '@/site/components/shop/HelpBand';
import { ChevronTexture, CmykBar, CropMarks, Eyebrow } from '@/site/components/company/Print';
import { useOT, type OTKey } from '@/site/components/offers/i18n';
import { bumpOfferMetric, longDate, useCountVisit, useOfferLanding, valueText } from '@/site/components/offers/model';
import { CodeBox, Countdown, OfferCard } from '@/site/components/offers/parts';

const MAX_PRODUCTS = 8;

export default function OfferPage() {
  const { slug } = useParams();
  const data = useOfferLanding(slug);
  const t = useOT();
  const l = useL();
  usePageTitle(data.visible && data.offer ? l(data.offer.name) : t('ended_page'));
  useCountVisit(data.offer, data.visible && !data.preview);

  if (!data.visible || !data.offer) return <EndedOffer offer={data.offer} state={data.state} others={data.others} />;
  return <Landing key={data.offer.id} data={data} offer={data.offer} />;
}

/* ================================================================== */
function Landing({ data, offer }: { data: ReturnType<typeof useOfferLanding>; offer: Offer }) {
  const t = useOT();
  const ts = useDict(site);
  const l = useL();
  const lang = useLang();
  const d = data.discount;
  const value = valueText(d, lang, { free: t('v_free'), bxgy: t('v_bxgy') });
  const code = d?.method === 'code' && d.code ? normalizeCode(d.code) : null;
  const mode: 'auto' | 'code' | 'editorial' = !d ? 'editorial' : code ? 'code' : 'auto';
  const cta = () => bumpOfferMetric(offer.id, 'ctaClicks');
  const list = data.products.slice(0, MAX_PRODUCTS);

  const steps: { t: string; x: string }[] =
    mode === 'auto'
      ? [
          { t: t('a1_t'), x: t('a1_x') },
          { t: t('a2_t'), x: t('a2_x') },
          { t: t('a3_t'), x: t('a3_x', { value: value ?? '' }) },
        ]
      : mode === 'code'
        ? [
            { t: t('a1_t'), x: data.scope === 'all' ? t('c1_x') : t('a1_x') },
            { t: t('c2_t'), x: t('c2_x') },
            { t: t('c3_t', { value: value ?? '' }), x: t('c3_x') },
          ]
        : [
            { t: t('e1_t'), x: t('e1_x') },
            { t: t('e2_t'), x: t('e2_x') },
            { t: t('e3_t'), x: t('e3_x') },
          ];

  return (
    <>
      {data.preview && (
        <div className="border-b border-amber-200 bg-amber-50 text-amber-900">
          <div className="container-x flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-[13.5px]">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Eye className="h-4 w-4" /> {t('preview')} — {t('previewText', { state: t(`st_${data.state ?? 'draft'}` as OTKey) })}
            </span>
            <Link to={`/admin/ofertat/${offer.id}`} className="font-semibold underline underline-offset-2 hover:no-underline">
              CMS
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink text-paper">
        <ChevronTexture />
        <div className="pointer-events-none absolute -left-32 top-10 -z-10 h-96 w-96 rounded-full bg-brand-600/30 blur-[120px]" />
        <div className="container-x relative pb-14 pt-7 sm:pb-20 sm:pt-9">
          <Breadcrumbs tone="light" items={[{ label: t('crumb') }, { label: l(offer.name) }]} />
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
            <div className="animate-fade-up">
              <div className="flex flex-wrap items-center gap-3">
                <Eyebrow tone="light">{t('crumb')}</Eyebrow>
                {l(offer.badge) && <Badge tone="brand">{l(offer.badge)}</Badge>}
              </div>
              <h1 className="display mt-4 text-[42px] leading-[1.0] text-white sm:text-[64px]">
                <Accent text={l(offer.landing.title) || l(offer.name)} accentClassName="text-brand-300" />
              </h1>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-paper/70 sm:text-[17px]">{l(offer.landing.text) || l(offer.description)}</p>

              {value && (
                <div className="mt-7 flex flex-wrap items-end gap-x-5 gap-y-2">
                  <span className="display text-[56px] leading-none text-brand-300 sm:text-[72px]">{value}</span>
                  {mode === 'auto' && <span className="max-w-[240px] pb-2 text-[13px] leading-snug text-paper/60">{t('autoChip')}</span>}
                </div>
              )}
              {code && <CodeBox code={code} className="mt-6" />}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#produktet" onClick={cta} className={buttonClass({ size: 'lg' })}>
                  {t('seeProducts')} <ArrowDown className="h-4 w-4" />
                </a>
                <ButtonLink to="/kerko-oferte" size="lg" variant="outlineLight" icon={<FileText className="h-4 w-4" />} onClick={cta}>
                  {t('freeMeasure')}
                </ButtonLink>
              </div>
            </div>

            <div className="relative animate-fade-up [animation-delay:120ms]">
              <CropMarks tone="light" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10">
                {(offer.image || list[0]?.images[0]) && <Img src={offer.image || list[0].images[0]} eager alt={l(offer.name)} className="absolute inset-0 h-full w-full object-cover" />}
              </div>
              {offer.endsAt && (
                <div className="relative -mt-12 ml-4 inline-block rounded-3xl bg-ink/90 p-4 ring-1 ring-white/10 backdrop-blur sm:ml-6 sm:p-5">
                  <Countdown to={offer.endsAt} tone="dark" />
                </div>
              )}
            </div>
          </div>
        </div>
        <CmykBar />
      </section>

      {/* How it works + terms */}
      <section className="container-x mt-16 sm:mt-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-14">
          <Reveal>
            <Eyebrow>{t('how_eyebrow')}</Eyebrow>
            <h2 className="display mt-4 text-[32px] leading-[1.05] text-ink sm:text-[44px]">
              <Accent text={mode === 'editorial' ? t('how_title_ed') : t('how_title')} />
            </h2>
            <ol className="mt-8 grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={i} className="bg-white p-6">
                  <span className="font-mono text-[11px] text-brand-600">
                    {t('step')} {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="mt-3 text-[16px] font-semibold text-ink">{s.t}</div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{s.x}</p>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={80}>
            <Terms offer={offer} discount={d} code={code} mode={mode} />
          </Reveal>
        </div>
      </section>

      {/* Products */}
      <section id="produktet" className="container-x mt-20 scroll-mt-24 sm:mt-28">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{t('prod_eyebrow')}</Eyebrow>
            <h2 className="display mt-4 text-[32px] leading-[1.05] text-ink sm:text-[44px]">
              <Accent text={data.scope === 'all' ? t('prod_title_all') : data.scope === 'collection' ? t('prod_title_ed') : t('prod_title')} />
            </h2>
            <p className="mt-3 text-[14.5px] text-muted">
              {data.scope === 'all' ? t('prod_sub_all') : t(data.products.length === 1 ? 'prod_one' : 'prod_many', { n: data.products.length })}
              {d && <span className="block text-[13px]">{t('priceNote')}</span>}
            </p>
          </div>
          {data.collectionSlug ? (
            <ButtonLink to={`/koleksioni/${data.collectionSlug}`} variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
              {t('viewAll', { n: data.products.length })}
            </ButtonLink>
          ) : (
            <ButtonLink to="/produktet" variant="outline" iconRight={<LayoutGrid className="h-4 w-4" />}>
              {ts('allProducts')}
            </ButtonLink>
          )}
        </div>
        <ProductGrid products={list} />
      </section>

      {data.others.length > 0 && (
        <section className="container-x mt-20 sm:mt-28">
          <Eyebrow>{t('more_eyebrow')}</Eyebrow>
          <h2 className="display mb-8 mt-4 text-[32px] leading-[1.05] text-ink sm:text-[44px]">
            <Accent text={t('more_title')} />
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.others.slice(0, 3).map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        </section>
      )}

      <HelpBand />
    </>
  );
}

/* ------------------------------------------------------------------ */
function Terms({ offer, discount: d, code, mode }: { offer: Offer; discount?: Discount; code: string | null; mode: 'auto' | 'code' | 'editorial' }) {
  const t = useOT();
  const lang = useLang();
  const rows: string[] = [];
  rows.push(offer.endsAt ? t('t_valid', { from: longDate(offer.startsAt, lang), to: longDate(offer.endsAt, lang) }) : t('t_validOpen', { from: longDate(offer.startsAt, lang) }));
  if (d) {
    if (d.minimum.type === 'amount' && d.minimum.value > 0) rows.push(d.kind === 'order' ? t('t_minAfter', { sum: money(d.minimum.value, lang, { decimals: false }) }) : t('t_min', { sum: money(d.minimum.value, lang, { decimals: false }) }));
    if (d.minimum.type === 'qty' && d.minimum.value > 0) rows.push(t('t_minQty', { n: d.minimum.value }));
    const others = (['products', 'order', 'shipping'] as const).filter((k) => d.combines[k]);
    rows.push(others.length ? t('t_combines', { list: others.map((k) => t(`cl_${k}`)).join(', ') }) : t('t_noCombine'));
    if (d.oncePerCustomer) rows.push(t('t_once'));
    if (d.usageLimit) rows.push(t('t_limited'));
    rows.push(mode === 'code' && code ? t('t_code', { code }) : t('t_auto'));
  } else rows.push(t('t_editorial'));
  rows.push(t('t_measure'));
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-7">
      <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
        <CalendarRange className="h-3.5 w-3.5 text-brand-600" /> {t('terms')}
      </div>
      <ul className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <li key={r} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink-soft">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================== */
/* Ended / scheduled / unknown offer                                    */
/* ================================================================== */
function EndedOffer({ offer, state, others }: { offer?: Offer; state: string | null; others: Offer[] }) {
  const t = useOT();
  const ts = useDict(site);
  const l = useL();
  const lang = useLang();
  const soon = state === 'scheduled';
  const text = !offer ? t('ended_generic') : soon ? t('soon_text', { name: l(offer.name) }) : offer.endsAt ? t('ended_text', { name: l(offer.name), date: longDate(offer.endsAt, lang) }) : t('ended_generic');
  const list = useMemo(() => others.slice(0, 3), [others]);
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line bg-paper">
        <CmykBar />
        <div className="container-x flex flex-col items-center pb-16 pt-14 text-center sm:pb-20 sm:pt-20">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-brand-600 shadow-sm ring-1 ring-line">
            <Sparkles className="h-6 w-6" />
          </span>
          <Eyebrow className="mt-6">{t('ended_eyebrow')}</Eyebrow>
          <h1 className="display mt-3 max-w-3xl text-[40px] leading-[1.04] text-ink sm:text-[60px]">
            <Accent text={soon ? t('soon_title') : t('ended_title')} />
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]">{text}</p>
          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <ButtonLink to="/produktet" variant="dark" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              {ts('allProducts')}
            </ButtonLink>
            <ButtonLink to="/kerko-oferte" variant="outline" size="lg" icon={<FileText className="h-4 w-4" />}>
              {ts('requestQuote')}
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className="container-x mt-14 sm:mt-20">
        <Eyebrow>{t('more_eyebrow')}</Eyebrow>
        <h2 className="display mb-8 mt-4 text-[32px] leading-[1.05] text-ink sm:text-[44px]">
          <Accent text={t('more_title')} />
        </h2>
        {list.length ? (
          <div className={cn('grid gap-5 sm:grid-cols-2', list.length > 2 && 'lg:grid-cols-3')}>
            {list.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-muted">{t('noActive')}</p>
        )}
      </section>
      <HelpBand />
    </>
  );
}
