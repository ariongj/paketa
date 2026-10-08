import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowDown, ArrowRight, Check, Clock, FileText, Mail, PackageSearch, Phone, Stamp } from 'lucide-react';
import type { Category, Product } from '@/lib/types';
import { ButtonLink } from '@/components/ui/Button';
import { Accent, EmptyState } from '@/components/ui/misc';
import { Modal } from '@/components/ui/Overlay';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { MeasureForm } from '@/site/components/MeasureForm';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { useDict, useL, useLang } from '@/i18n';
import { useUi } from '@/store/ui';
import { useActiveProducts, useCategories, useCategory, useProduct, useSettings } from '@/store/hooks';
import { optionsLabel } from '@/lib/pricing';
import { money, num, pieces, unitLabel } from '@/lib/format';
import { PD } from '@/site/components/product/dict';
import { useConfigurator } from '@/site/components/product/useConfigurator';
import { compatibleProducts } from '@/site/components/product/compat';
import { Gallery } from '@/site/components/product/Gallery';
import { BuyBox, WishButton } from '@/site/components/product/BuyBox';
import { DetailTabs } from '@/site/components/product/DetailTabs';
import { StickyBar } from '@/site/components/product/StickyBar';
import { ProductRail } from '@/site/components/product/ProductRail';
import { ProductBadges } from '@/site/components/ProductCard';

export default function ProductPage() {
  const { slug } = useParams();
  const product = useProduct(slug);
  const t = useDict(PD);
  const visible = product && product.status === 'active' ? product : undefined;
  const l = useL();
  usePageTitle(visible ? l(visible.name) : t('notFoundTitle'));

  if (!visible) return <NotFoundProduct />;
  // key → options/quantity reset when navigating to another product
  return <ProductView key={visible.id} product={visible} />;
}

function NotFoundProduct() {
  const t = useDict(PD);
  return (
    <div className="container-x py-16 sm:py-24">
      <div className="mx-auto max-w-xl rounded-[32px] bg-white ring-1 ring-line">
        <EmptyState
          icon={<PackageSearch className="h-6 w-6" />}
          title={<span className="display text-[30px]">{t('notFoundTitle')}</span>}
          text={t('notFoundText')}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink to="/produktet" iconRight={<ArrowRight className="h-4 w-4" />}>
                {t('browse')}
              </ButtonLink>
              <ButtonLink to="/" variant="outline">
                {t('backHome')}
              </ButtonLink>
            </div>
          }
        />
      </div>
    </div>
  );
}

function ProductView({ product }: { product: Product }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const category = useCategory(product.categoryId);
  const categories = useCategories();
  const all = useActiveProducts();
  const recentIds = useUi((s) => s.recentlyViewed);
  const pushViewed = useUi((s) => s.pushViewed);
  const addToCart = useUi((s) => s.addToCart);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const cfg = useConfigurator(product);
  const [stockOpen, setStockOpen] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const sticky = useStickyVisibility(ctaRef);
  const quote = !!product.quoteOnly || product.template === 'quote';

  // Remember the visit once per product (recentlyViewed shown below + on other pages)
  const [recentAtMount] = useState(recentIds);
  useEffect(() => {
    pushViewed(product.id);
  }, [product.id, pushViewed]);

  const compatible = useMemo(() => compatibleProducts(product, all, categories), [product, all, categories]);
  const related = useMemo(
    () =>
      all
        .filter((p) => p.categoryId === product.categoryId && p.id !== product.id && !compatible.includes(p))
        .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || Number(b.featured) - Number(a.featured) || b.sold - a.sold)
        .slice(0, 10),
    [all, product.categoryId, product.id, compatible],
  );
  const recent = useMemo(
    () => recentAtMount.filter((id) => id !== product.id).map((id) => all.find((p) => p.id === id)).filter((p): p is Product => !!p).slice(0, 10),
    [recentAtMount, all, product.id],
  );

  const add = () => {
    addToCart({ productId: product.id, qty: cfg.qty, options: cfg.options, installation: cfg.installation });
    const qty = `${num(cfg.qty, lang)} ${unitLabel(product.unit, lang)}${cfg.isPack ? ` (${pieces(cfg.totalPieces, lang)})` : ''}`;
    toast.success(t('added'), {
      description: `${l(product.name)} · ${qty} · ${money(cfg.total, lang)}`,
      action: { label: t('viewCart'), onClick: () => setCartOpen(true) },
    });
    setCartOpen(true);
  };

  const scrollToForm = () => document.getElementById('oferta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const rails = (
    <>
      <ProductRail id="pershtatet" className="mt-24 sm:mt-32" eyebrow={t('compatEyebrow')} title={t('compatTitle')} products={compatible} />
      <ProductRail
        id="alternativat"
        className={compatible.length ? 'mt-20 sm:mt-28' : 'mt-24 sm:mt-32'}
        eyebrow={t('relatedEyebrow')}
        title={t('relatedTitle')}
        products={related}
        action={
          category && (
            <ButtonLink to={`/produktet/${category.slug}`} variant="outline" size="sm" iconRight={<ArrowRight className="h-4 w-4" />} className="hidden sm:inline-flex">
              {t('seeCategory')}
            </ButtonLink>
          )
        }
      />
      <ProductRail className="mt-20 sm:mt-28" eyebrow={t('recentEyebrow')} title={t('recentTitle')} products={recent} />
    </>
  );

  if (quote) {
    return (
      <div>
        <QuoteHero product={product} category={category} ctaRef={ctaRef} onQuote={scrollToForm} />
        <QuoteForm product={product} options={cfg.options} />
        <div className="container-x mt-20 sm:mt-28">
          <DetailTabs product={product} category={category} />
        </div>
        {rails}
        <StickyBar cfg={cfg} visible={sticky} onAdd={scrollToForm} onLead={scrollToForm} />
      </div>
    );
  }

  return (
    <div>
      <div className="container-x pt-6 sm:pt-8">
        <Breadcrumbs items={[...(category ? [{ label: l(category.name), to: `/produktet/${category.slug}` }] : []), { label: l(product.name) }]} />

        <div className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-[100px]">
              <Gallery images={product.images} alt={l(product.name)} />
            </div>
          </div>
          <div className="lg:col-span-5">
            <BuyBox cfg={cfg} category={category} compatible={compatible} onAdd={add} onContact={() => setStockOpen(true)} ctaRef={ctaRef} />
          </div>
        </div>
      </div>

      <div className="container-x mt-20 sm:mt-28">
        <DetailTabs product={product} category={category} />
      </div>

      {rails}

      <StickyBar cfg={cfg} visible={sticky} onAdd={add} onLead={() => setStockOpen(true)} />

      <Modal open={stockOpen} onClose={() => setStockOpen(false)} title={t('contactTitle')} description={t('contactText')} size="lg">
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-sand/60 p-3">
            <img src={product.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-ink">{l(product.name)}</div>
              <div className="truncate text-[12.5px] text-muted">
                {t('sku')}: {product.sku} · {t('outStock')}
              </div>
            </div>
          </div>
          <MeasureForm type="contact" productId={product.id} defaultMessage={t('stockMsg', { name: l(product.name), sku: product.sku })} className="p-0! ring-0! sm:p-0!" />
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quote-only template: hero + inline request-a-quote form             */
/* ------------------------------------------------------------------ */
function QuoteHero({ product: p, category, ctaRef, onQuote }: { product: Product; category?: Category; ctaRef: RefObject<HTMLDivElement | null>; onQuote: () => void }) {
  const t = useDict(PD);
  const l = useL();
  const settings = useSettings();
  const steps = [
    { title: t('quoteStep1'), text: t('quoteStep1Text') },
    { title: t('quoteStep2'), text: t('quoteStep2Text') },
    { title: t('quoteStep3'), text: t('quoteStep3Text', { days: p.leadDays ?? 21 }) },
  ];
  return (
    <div className="container-x pt-6 sm:pt-8">
      <Breadcrumbs items={[...(category ? [{ label: l(category.name), to: `/produktet/${category.slug}` }] : []), { label: l(p.name) }]} />
      <div className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-[100px]">
            <Gallery images={p.images} alt={l(p.name)} />
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="flex flex-wrap items-center gap-3">
            {category && (
              <Link to={`/produktet/${category.slug}`} className="eyebrow hover:text-brand-800">
                {l(category.name)}
              </Link>
            )}
            <span className="inline-flex h-7 rotate-[-2deg] items-center gap-1.5 rounded-full bg-ink px-3 font-display text-[13px] font-bold text-lime shadow-[0_8px_18px_-10px_rgb(15_29_22/0.6)]">
              <Stamp className="h-3.5 w-3.5" /> {t('quoteBadge')}
            </span>
          </div>
          <h1 className="display mt-3 text-[32px] leading-[1.02] text-ink sm:text-[40px] xl:text-[44px]">{l(p.name)}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <ProductBadges product={p} size="md" />
            <span className="text-[12.5px] font-medium text-muted">
              {t('sku')}: <span className="font-semibold tabular-nums text-ink-soft">{p.sku}</span>
            </span>
          </div>
          {l(p.short) && <p className="mt-5 text-[16px] leading-relaxed text-ink-soft">{l(p.short)}</p>}

          <div className="mt-6 rounded-3xl bg-lime-soft p-5 ring-1 ring-inset ring-lime-ink/10">
            <div className="display text-[28px] leading-none text-ink">{t('quoteOnly')}</div>
            <p className="mt-2 text-[13.5px] leading-snug text-ink-soft">{t('quotePriceNote')}</p>
            {(p.specs.length > 0 || p.leadDays) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {p.specs.slice(0, 3).map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12.5px]">
                    <span className="text-muted">{l(s.label)}</span>
                    <span className="font-semibold text-ink">{l(s.value)}</span>
                  </span>
                ))}
                {p.leadDays ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12.5px]">
                    <Clock className="h-3.5 w-3.5 text-brand-600" />
                    <span className="text-muted">{t('leadTime')}</span>
                    <span className="font-semibold text-ink">{t('leadValue', { n: p.leadDays })}</span>
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{t('quoteStepsTitle')}</div>
            <ol className="mt-4 space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="display grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-[15px] text-lime">{i + 1}</span>
                  <span className="min-w-0 pt-0.5">
                    <span className="block text-[14.5px] font-bold text-ink">{s.title}</span>
                    <span className="block text-[13px] leading-snug text-muted">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div ref={ctaRef} className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={onQuote}
              className="inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-brand-600 px-6 text-[15.5px] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_14px_30px_-16px_var(--color-brand-700)] transition-[background,transform] duration-200 hover:bg-brand-700 active:scale-[0.98]"
            >
              <FileText className="h-5 w-5" /> {t('requestQuote')} <ArrowDown className="h-4 w-4 opacity-70" />
            </button>
            <WishButton productId={p.id} tone="light" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink/30">
              <Phone className="h-4 w-4" /> {settings.phone}
            </a>
            <a href={`mailto:${settings.email}`} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink/30">
              <Mail className="h-4 w-4" /> {settings.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteForm({ product: p, options }: { product: Product; options: Record<string, string> }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const settings = useSettings();
  const opts = optionsLabel(p, options, lang);
  const points = [t('formPoint1'), t('formPoint2'), t('formPoint3')];
  return (
    <section id="oferta" className="container-x mt-16 scroll-mt-24 sm:mt-24">
      <div className="relative grid gap-8 overflow-hidden rounded-[32px] bg-sand p-6 sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:p-14">
        <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[26px] border-2 border-dashed border-kraft/40" />
        <div className="relative">
          <div className="eyebrow">{t('formEyebrow')}</div>
          <h2 className="display mt-3 text-[34px] leading-[1.04] text-ink sm:text-[46px]">
            <Accent text={t('formTitle')} />
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-soft">{t('formText')}</p>
          <ul className="mt-6 space-y-3">
            {points.map((x) => (
              <li key={x} className="flex items-center gap-3 text-[15px] font-semibold text-ink">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {x}
              </li>
            ))}
          </ul>
          <p className="mt-7 text-[14px] text-muted">
            {t('formEmail')}{' '}
            <a href={`mailto:${settings.email}`} className="font-bold text-brand-700 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-600">
              {settings.email}
            </a>
          </p>
        </div>
        <div className="relative">
          <MeasureForm type="quote" productId={p.id} defaultMessage={t('quoteMsg', { name: l(p.name), opts: opts ? ` (${opts})` : '' })} className="shadow-[0_30px_60px_-36px_rgb(15_29_22/0.45)]" />
        </div>
      </div>
    </section>
  );
}

/**
 * Sticky bar visibility: on phones whenever the main CTA is off-screen,
 * on desktop only once the shopper has scrolled past it. Hidden while the
 * site footer is on screen so it never covers it.
 */
function useStickyVisibility(ref: RefObject<HTMLDivElement | null>) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const footer = document.querySelector('footer');
    const form = document.getElementById('oferta');
    let cta: IntersectionObserverEntry | null = null;
    let footerVisible = false;
    let formVisible = false;
    const apply = () => {
      if (!cta) return;
      const off = !cta.isIntersecting && (!mq.matches || cta.boundingClientRect.top < 0);
      setShow(off && !footerVisible && !formVisible);
    };
    // the sticky header (76px) hides whatever scrolls under it
    const io = new IntersectionObserver(
      ([e]) => {
        cta = e;
        apply();
      },
      { rootMargin: '-76px 0px 0px 0px' },
    );
    const fo = new IntersectionObserver(([e]) => {
      footerVisible = e.isIntersecting;
      apply();
    });
    const qo = new IntersectionObserver(([e]) => {
      formVisible = e.isIntersecting;
      apply();
    });
    io.observe(el);
    if (footer) fo.observe(footer);
    if (form) qo.observe(form);
    mq.addEventListener('change', apply);
    return () => {
      io.disconnect();
      fo.disconnect();
      qo.disconnect();
      mq.removeEventListener('change', apply);
    };
  }, [ref]);
  return show;
}
