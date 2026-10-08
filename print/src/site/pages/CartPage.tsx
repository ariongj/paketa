import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, FileText, Lock, Package, ShoppingBag, Trash2, UploadCloud } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Accent } from '@/components/ui/misc';
import { defineDict, useDict, useLang } from '@/i18n';
import { useUi } from '@/store/ui';
import { useActiveProducts, useCart } from '@/store/hooks';
import { money } from '@/lib/format';
import type { Product } from '@/lib/types';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { Breadcrumbs, SectionHeading } from '@/site/components/SectionHeading';
import { ProductCard } from '@/site/components/ProductCard';
import { CartLine } from '@/site/components/checkout/CartLine';
import { CheckoutSteps, CouponBox, FreeShippingBar, TotalsRows, TrustNotes, useItemsLabel, useTotalsView } from '@/site/components/checkout/parts';
import { ck } from '@/site/components/checkout/dict';
import { common } from '@/i18n/common';
import { ChevronTexture, CmykBar, Eyebrow } from '@/site/components/company/Print';

const T = defineDict({
  sq: {
    pageTitle: 'Shporta',
    title: 'Shporta *juaj*',
    summary: 'Përmbledhja',
    toCheckout: 'Vazhdo te porosia',
    continue: 'Vazhdo me produktet',
    clear: 'Zbraz shportën',
    cleared: 'Shporta u zbraz',
    undo: 'Kthe',
    payMethods: 'Pro-formë · Kartelë · Në dorëzim',
    quoteTitle: 'Projekt i veçantë?',
    quoteText: 'Përmasa, material apo finishing që nuk e gjeni në katalog — ofertë brenda 24 orësh.',
    quoteCta: 'Kërko ofertë',
    emptyTitle: 'Shporta juaj është bosh',
    emptyText: 'Konfiguroni kuti, etiketa ose qese me çmime sipas sasisë — ose na dërgoni specifikimet për një paketim me porosi.',
    browse: 'Shiko produktet',
    sample: 'Paketa e mostrave · 19 €',
    recoEyebrow: 'Rekomandim',
    recoTitle: 'Shpesh porositen *bashkë*',
    recoTitleEmpty: 'Më të porositurat *këtë muaj*',
    viewAll: 'Të gjitha produktet',
  },
  en: {
    pageTitle: 'Cart',
    title: 'Your *cart*',
    summary: 'Summary',
    toCheckout: 'Continue to order',
    continue: 'Continue browsing',
    clear: 'Empty cart',
    cleared: 'Cart emptied',
    undo: 'Undo',
    payMethods: 'Pro-forma · Card · Cash on delivery',
    quoteTitle: 'A custom project?',
    quoteText: 'A size, material or finish you can’t find in the catalogue — quote within 24 hours.',
    quoteCta: 'Request a quote',
    emptyTitle: 'Your cart is empty',
    emptyText: 'Configure boxes, labels or bags with quantity pricing — or send us the specs for custom packaging.',
    browse: 'Browse products',
    sample: 'Sample kit · €19',
    recoEyebrow: 'Recommended',
    recoTitle: 'Often ordered *together*',
    recoTitleEmpty: 'Most ordered *this month*',
    viewAll: 'All products',
  },
});

/** One bestseller per category already in the cart, then overall bestsellers. */
function pickRecommendations(products: Product[], inCart: Set<string>, cats: string[], n = 4) {
  const pool = products.filter((p) => !inCart.has(p.id) && !p.quoteOnly).sort((a, b) => b.sold - a.sold);
  const out: Product[] = [];
  for (const c of cats) {
    const p = pool.find((x) => x.categoryId === c && !out.includes(x));
    if (p) out.push(p);
  }
  for (const p of pool) {
    if (out.length >= n) break;
    if (!out.includes(p)) out.push(p);
  }
  return out.slice(0, n);
}

export default function CartPage() {
  const t = useDict(T);
  const tk = useDict(ck);
  const tc = useDict(common);
  const lang = useLang();
  const items = useItemsLabel();
  const navigate = useNavigate();
  const totals = useCart();
  const view = useTotalsView(totals, { showEstimateHint: true });
  const cart = useUi((s) => s.cart);
  const codes = useUi((s) => s.codes);
  const clearCart = useUi((s) => s.clearCart);
  const products = useActiveProducts();
  usePageTitle(t('pageTitle'));

  const empty = totals.lines.length === 0;
  const missing = totals.lines.filter((l) => l.item.artwork?.status === 'later').length;
  const recos = useMemo(() => {
    const inCart = new Set(cart.map((c) => c.productId));
    const cats = [...new Set(totals.lines.map((l) => l.product.categoryId))];
    return pickRecommendations(products, inCart, cats);
  }, [cart, products, totals.lines]);

  const onClear = () => {
    const snapshot = { cart, codes, coupon: codes[0] ?? null };
    clearCart();
    toast(t('cleared'), { action: { label: t('undo'), onClick: () => useUi.setState(snapshot) } });
  };

  return (
    <div className="pb-4">
      <div className="container-x pt-8 sm:pt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumbs items={[{ label: t('pageTitle') }]} />
          {!empty && <CheckoutSteps current={0} />}
        </div>

        {empty ? (
          <div className="mt-8 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
            <CmykBar />
            <div className="relative flex flex-col items-center px-6 py-16 text-center sm:py-24">
              <span className="relative grid h-20 w-20 place-items-center rounded-full bg-paper ring-1 ring-line">
                <ShoppingBag className="h-8 w-8 text-ink-soft" strokeWidth={1.6} />
              </span>
              <h1 className="display mt-6 text-[34px] leading-tight text-ink sm:text-5xl">{t('emptyTitle')}</h1>
              <p className="mt-3 max-w-lg text-[15.5px] leading-relaxed text-muted">{t('emptyText')}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink to="/produktet" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('browse')}
                </ButtonLink>
                <ButtonLink to="/kerko-oferte" size="lg" variant="outline" icon={<FileText className="h-4 w-4" />}>
                  {t('quoteCta')}
                </ButtonLink>
                <ButtonLink to="/produkt/pakete-mostrash-printworks" size="lg" variant="ghost" icon={<Package className="h-4 w-4" />}>
                  {t('sample')}
                </ButtonLink>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <h1 className="display text-[42px] leading-[1.02] text-ink sm:text-[56px]">
                  <Accent text={t('title')} />
                </h1>
                <p className="mt-3 text-[15px] text-muted">
                  {items(totals.lines.length)} · <span className="font-semibold text-ink">{money(totals.net, lang)}</span> <span className="font-mono text-[11px] uppercase">{tc('exclVat')}</span>
                </p>
              </div>
              <Link to="/produktet" className="group hidden items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink sm:inline-flex">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                {t('continue')}
              </Link>
            </div>

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-14">
              <section className="min-w-0">
                <FreeShippingBar totals={totals} />
                {missing > 0 && (
                  <div className="mt-3 flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-inset ring-amber-600/15">
                    <UploadCloud className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                    <div className="text-[13px] leading-snug">
                      <div className="font-semibold text-amber-900">{missing === 1 ? tk('art_missingOne') : tk('art_missing', { n: missing })}</div>
                      <div className="text-amber-900/75">{tk('art_missingHint')}</div>
                    </div>
                  </div>
                )}
                <div className="mt-4 rounded-3xl bg-white px-4 ring-1 ring-line sm:px-6">
                  <div className="divide-y divide-line">
                    {totals.lines.map((line) => (
                      <CartLine key={line.item.key} line={line} />
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 px-1 sm:justify-end">
                  <Link to="/produktet" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink sm:hidden">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    {t('continue')}
                  </Link>
                  <button type="button" onClick={onClear} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:bg-ink/5 hover:text-ink">
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('clear')}
                  </button>
                </div>

                {/* Custom project nudge */}
                <div className="relative isolate mt-8 flex flex-col gap-4 overflow-hidden rounded-3xl bg-ink p-6 text-paper sm:flex-row sm:items-center sm:p-7">
                  <ChevronTexture />
                  <div className="min-w-0 flex-1">
                    <Eyebrow tone="light">{t('quoteCta')}</Eyebrow>
                    <h2 className="mt-2.5 text-[22px] font-semibold leading-tight text-white">{t('quoteTitle')}</h2>
                    <p className="mt-1 text-[14px] leading-relaxed text-paper/65">{t('quoteText')}</p>
                  </div>
                  <ButtonLink to="/kerko-oferte" variant="light" className="self-start sm:self-center" iconRight={<ArrowRight className="h-4 w-4" />}>
                    {t('quoteCta')}
                  </ButtonLink>
                </div>
              </section>

              <aside className="lg:sticky lg:top-[100px]">
                <div className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-7">
                  <h2 className="text-lg font-semibold text-ink">{t('summary')}</h2>
                  <CouponBox totals={totals} className="mt-5" />
                  <div className="my-5 h-px bg-line" />
                  <TotalsRows v={view} big />
                  <Button size="lg" className="mt-6 w-full" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => navigate('/pagesa')}>
                    {t('toCheckout')}
                  </Button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muted">
                    <Lock className="h-3.5 w-3.5" />
                    {t('payMethods')}
                  </p>
                </div>
                <TrustNotes className="mt-6 px-1" />
              </aside>
            </div>
          </>
        )}
      </div>

      {recos.length > 0 && (
        <section className="container-x mt-20 sm:mt-24">
          <SectionHeading
            eyebrow={t('recoEyebrow')}
            title={empty ? t('recoTitleEmpty') : t('recoTitle')}
            action={
              <Link to="/produktet" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-brand-700">
                {t('viewAll')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {recos.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
