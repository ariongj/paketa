import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight, PackageSearch } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { useDict, useL, useLang } from '@/i18n';
import { useUi } from '@/store/ui';
import { useActiveProducts, useCategory, useProduct } from '@/store/hooks';
import { money } from '@/lib/format';
import { PD } from '@/site/components/product/dict';
import { useConfigurator } from '@/site/components/product/useConfigurator';
import { Gallery } from '@/site/components/product/Gallery';
import { BuyBox } from '@/site/components/product/BuyBox';
import { DetailTabs } from '@/site/components/product/DetailTabs';
import { StickyBar } from '@/site/components/product/StickyBar';
import { ProductRail } from '@/site/components/product/ProductRail';
import { qtyText } from '@/site/components/product/print';
import { common } from '@/i18n/common';
import { site } from '@/i18n/site';

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
  const tc = useDict(common);
  const ts = useDict(site);
  const l = useL();
  const lang = useLang();
  const category = useCategory(product.categoryId);
  const all = useActiveProducts();
  const recentIds = useUi((s) => s.recentlyViewed);
  const pushViewed = useUi((s) => s.pushViewed);
  const addToCart = useUi((s) => s.addToCart);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const cfg = useConfigurator(product);
  const [artError, setArtError] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const sticky = useStickyVisibility(ctaRef);

  // Remember the visit once per product (recentlyViewed shown below + on other pages)
  const [recentAtMount] = useState(recentIds);
  useEffect(() => {
    pushViewed(product.id);
  }, [product.id, pushViewed]);
  useEffect(() => {
    if (!cfg.missingFile) setArtError(false);
  }, [cfg.missingFile]);

  const related = useMemo(
    () => all.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).sort((a, b) => Number(b.featured) - Number(a.featured) || b.sold - a.sold).slice(0, 10),
    [all, product.categoryId, product.id],
  );
  const recent = useMemo(
    () => recentAtMount.filter((id) => id !== product.id).map((id) => all.find((p) => p.id === id)).filter((p): p is Product => !!p).slice(0, 10),
    [recentAtMount, all, product.id],
  );

  const add = () => {
    if (cfg.missingFile) {
      setArtError(true);
      document.getElementById('hap-skedari')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error(t('needFile'));
      return;
    }
    addToCart({ productId: product.id, qty: cfg.qty, options: cfg.options, installation: cfg.installation, artwork: cfg.artwork() });
    const qty = `${qtyText(cfg.qty, lang)} ${cfg.run ? t('pieces') : ''}`.trim();
    toast.success(t('added'), {
      description: `${l(product.name)} · ${qty} · ${money(cfg.total, lang)} ${tc('exclVat')}`,
      action: { label: t('viewCart'), onClick: () => setCartOpen(true) },
    });
    setCartOpen(true);
  };

  const toQuote = () => document.getElementById('rfq')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div>
      <div className="container-x pt-6 sm:pt-8">
        <Breadcrumbs items={[{ label: ts('nav_products'), to: '/produktet' }, ...(category ? [{ label: l(category.name), to: `/produktet/${category.slug}` }] : []), { label: l(product.name) }]} />

        <div className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-[100px]">
              <Gallery images={product.images} alt={l(product.name)} />
            </div>
          </div>
          <div className="lg:col-span-5">
            <BuyBox cfg={cfg} category={category} onAdd={add} ctaRef={ctaRef} artError={artError} />
          </div>
        </div>
      </div>

      <div className="container-x mt-20 sm:mt-28">
        <DetailTabs
          cfg={cfg}
          category={category}
          onPickQty={(q) => {
            cfg.setQty(q);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      <ProductRail
        className="mt-24 sm:mt-32"
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

      <StickyBar cfg={cfg} visible={sticky} onAdd={add} onQuote={toQuote} />
    </div>
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
    let cta: IntersectionObserverEntry | null = null;
    let footerVisible = false;
    const apply = () => {
      if (!cta) return;
      const off = !cta.isIntersecting && (!mq.matches || cta.boundingClientRect.top < 0);
      setShow(off && !footerVisible);
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
    io.observe(el);
    if (footer) fo.observe(footer);
    mq.addEventListener('change', apply);
    return () => {
      io.disconnect();
      fo.disconnect();
      mq.removeEventListener('change', apply);
    };
  }, [ref]);
  return show;
}
