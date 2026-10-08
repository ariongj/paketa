import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Lock, PackageOpen, ShoppingBag, Stamp, Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Accent } from '@/components/ui/misc';
import { defineDict, useDict, useLang } from '@/i18n';
import { useUi } from '@/store/ui';
import { useActiveProducts, useCart } from '@/store/hooks';
import { money, pieces } from '@/lib/format';
import type { Product } from '@/lib/types';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { Breadcrumbs, SectionHeading } from '@/site/components/SectionHeading';
import { ProductCard } from '@/site/components/ProductCard';
import { CartLine } from '@/site/components/checkout/CartLine';
import { CheckoutSteps, CouponBox, FreeShippingBar, TotalsRows, TrustNotes, packsIn, useItemsLabel, usePacksLabel, useTotalsView } from '@/site/components/checkout/parts';

/** Lead-form tabs on the contact page (samples / wholesale & logo-print quote). */
const SAMPLES_HREF = '/kontakti?lloji=mostra';
const QUOTE_HREF = '/kontakti?lloji=oferte';

const T = defineDict({
  me: {
    pageTitle: 'Korpa',
    title: 'Vaša *korpa*',
    summary: 'Pregled narudžbe',
    toCheckout: 'Nastavi na plaćanje',
    continue: 'Nastavi kupovinu',
    clear: 'Isprazni korpu',
    cleared: 'Korpa je ispražnjena',
    undo: 'Vrati',
    payMethods: 'Pouzeće · Uplata na račun · Kartica',
    b2bEyebrow: 'Za firme',
    b2bTitle: 'Veće količine ili *vaš logotip*?',
    b2bText: 'Za narudžbe od 10 kartona i štampu logotipa pripremamo ponudu u roku od 24 h — sa fakturom na NUI vaše firme.',
    b2bCta: 'Zatraži ponudu',
    samplesCta: 'Besplatni uzorci',
    emptyTitle: 'Vaša korpa je prazna',
    emptyText: 'Čaše, poklopci, posude za hranu i pribor za vaš lokal — po pakovanju ili po kartonu, sa veleprodajnim cijenama.',
    browse: 'Pogledaj proizvode',
    recoEyebrow: 'Često se kupuje zajedno',
    recoTitle: 'Dopunite *narudžbu*',
    recoTitleEmpty: 'Najprodavanije *ovog mjeseca*',
    viewAll: 'Svi proizvodi',
  },
  sq: {
    pageTitle: 'Shporta',
    title: 'Shporta *juaj*',
    summary: 'Përmbledhja e porosisë',
    toCheckout: 'Vazhdo te pagesa',
    continue: 'Vazhdo blerjen',
    clear: 'Zbraz shportën',
    cleared: 'Shporta u zbraz',
    undo: 'Kthe',
    payMethods: 'Në dorëzim · Transfertë bankare · Kartelë',
    b2bEyebrow: 'Për biznese',
    b2bTitle: 'Sasi të mëdha apo *logon tuaj*?',
    b2bText: 'Për porosi nga 10 kartonë dhe printim me logo ju përgatisim ofertë brenda 24 orëve — me faturë në NUI-n e biznesit tuaj.',
    b2bCta: 'Kërko ofertë',
    samplesCta: 'Mostra falas',
    emptyTitle: 'Shporta juaj është bosh',
    emptyText: 'Gota, kapakë, enë ushqimi dhe takëm për lokalin tuaj — me pako ose me karton, me çmime shumice.',
    browse: 'Shiko produktet',
    recoEyebrow: 'Shpesh blihen bashkë',
    recoTitle: 'Plotësoni *porosinë*',
    recoTitleEmpty: 'Më të shiturat *këtë muaj*',
    viewAll: 'Të gjitha produktet',
  },
  en: {
    pageTitle: 'Cart',
    title: 'Your *cart*',
    summary: 'Order summary',
    toCheckout: 'Continue to payment',
    continue: 'Continue shopping',
    clear: 'Empty cart',
    cleared: 'Cart emptied',
    undo: 'Undo',
    payMethods: 'Cash on delivery · Bank transfer · Card',
    b2bEyebrow: 'For business',
    b2bTitle: 'Large volumes or *your logo*?',
    b2bText: 'For orders from 10 cartons and custom logo print we prepare a quote within 24 hours — invoiced to your company’s NUI.',
    b2bCta: 'Request a quote',
    samplesCta: 'Free samples',
    emptyTitle: 'Your cart is empty',
    emptyText: 'Cups, lids, food containers and cutlery for your venue — by the pack or by the carton, at wholesale prices.',
    browse: 'Browse products',
    recoEyebrow: 'Often bought together',
    recoTitle: 'Complete your *order*',
    recoTitleEmpty: 'Bestsellers *this month*',
    viewAll: 'All products',
  },
});

/** Bestsellers from categories that complement the cart (lids for cups…), then overall bestsellers. */
function pickRecommendations(products: Product[], inCart: Set<string>, cats: string[], n = 4) {
  const pool = products.filter((p) => !inCart.has(p.id) && !p.quoteOnly && p.price > 0).sort((a, b) => b.sold - a.sold);
  const pairs: Record<string, string[]> = { 'cat-gota': ['cat-kapake', 'cat-shkopinj'], 'cat-kapake': ['cat-gota'], 'cat-ene': ['cat-takem', 'cat-salca'], 'cat-salca': ['cat-ene'], 'cat-takem': ['cat-ene'], 'cat-embelsira': ['cat-takem'] };
  const wanted = [...new Set([...cats.flatMap((c) => pairs[c] ?? []), ...cats])];
  const out: Product[] = [];
  for (const c of wanted) {
    const p = pool.find((x) => x.categoryId === c && !out.includes(x));
    if (p) out.push(p);
    if (out.length >= n) break;
  }
  for (const p of pool) {
    if (out.length >= n) break;
    if (!out.includes(p)) out.push(p);
  }
  return out.slice(0, n);
}

export default function CartPage() {
  const t = useDict(T);
  const lang = useLang();
  const items = useItemsLabel();
  const packs = usePacksLabel();
  const navigate = useNavigate();
  const totals = useCart();
  const view = useTotalsView(totals, { showEstimateHint: true });
  const cart = useUi((s) => s.cart);
  const codes = useUi((s) => s.codes);
  const clearCart = useUi((s) => s.clearCart);
  const products = useActiveProducts();
  usePageTitle(t('pageTitle'));

  const empty = totals.lines.length === 0;
  const recos = useMemo(() => {
    const inCart = new Set(cart.map((c) => c.productId));
    const cats = [...new Set(totals.lines.map((l) => l.product.categoryId))];
    return pickRecommendations(products, inCart, cats);
  }, [cart, products, totals.lines]);

  const onClear = () => {
    const snapshot = { cart, codes, coupon: codes[0] ?? null };
    clearCart();
    toast(t('cleared'), {
      action: { label: t('undo'), onClick: () => useUi.setState(snapshot) },
    });
  };

  const packCount = packsIn(totals.lines);

  return (
    <div className="pb-4">
      <div className="container-x pt-8 sm:pt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumbs items={[{ label: t('pageTitle') }]} />
          {!empty && <CheckoutSteps current={0} />}
        </div>

        {empty ? (
          <div className="mt-8 overflow-hidden rounded-3xl border-2 border-dashed border-ink/15 bg-white">
            <div className="relative flex flex-col items-center px-6 py-16 text-center sm:py-24">
              <span className="relative grid h-20 w-20 rotate-[-4deg] place-items-center rounded-3xl bg-lime text-ink shadow-[inset_0_-3px_0_rgb(0_0_0/0.08)]">
                <ShoppingBag className="h-8 w-8" strokeWidth={1.8} />
              </span>
              <h1 className="display relative mt-6 text-[34px] leading-tight text-ink sm:text-5xl">{t('emptyTitle')}</h1>
              <p className="relative mt-3 max-w-lg text-[15.5px] leading-relaxed text-muted">{t('emptyText')}</p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink to="/produktet" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('browse')}
                </ButtonLink>
                <ButtonLink to={SAMPLES_HREF} size="lg" variant="outline" icon={<PackageOpen className="h-4 w-4" />}>
                  {t('samplesCta')}
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
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-muted">
                  <span>{items(totals.lines.length)}</span>
                  {packCount > 0 && <span>· {packs(packCount)}</span>}
                  <span>· {pieces(totals.pieces, lang)}</span>
                  <span>
                    · <span className="font-semibold text-ink">{money(totals.total, lang)}</span>
                  </span>
                </p>
              </div>
              <Link to="/produktet" className="group hidden items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink sm:inline-flex">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                {t('continue')}
              </Link>
            </div>

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-14">
              {/* Lines */}
              <section className="min-w-0">
                <FreeShippingBar totals={totals} />
                <div className="mt-4 rounded-3xl bg-white px-4 ring-1 ring-line sm:px-6">
                  <div className="divide-y divide-dashed divide-line">
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

                {/* B2B nudge */}
                <div className="relative mt-8 overflow-hidden rounded-3xl bg-brand-700 p-6 text-white sm:p-8">
                  <div className="bg-grain pointer-events-none absolute inset-0 opacity-40" />
                  <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[18px] border-lime/25" />
                  <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
                    <span className="grid h-14 w-14 shrink-0 rotate-[-6deg] place-items-center rounded-2xl bg-lime text-ink shadow-[inset_0_-3px_0_rgb(0_0_0/0.1)]">
                      <Stamp className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime">{t('b2bEyebrow')}</div>
                      <h2 className="display mt-1.5 text-[24px] leading-tight text-white sm:text-[28px]">
                        <Accent text={t('b2bTitle')} accentClassName="text-lime! [background-image:none]!" />
                      </h2>
                      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/75">{t('b2bText')}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2.5 md:flex-col">
                      <ButtonLink to={QUOTE_HREF} variant="lime" iconRight={<ArrowRight className="h-4 w-4" />}>
                        {t('b2bCta')}
                      </ButtonLink>
                      <ButtonLink to={SAMPLES_HREF} variant="outlineLight" icon={<PackageOpen className="h-4 w-4" />}>
                        {t('samplesCta')}
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </section>

              {/* Summary */}
              <aside className="lg:sticky lg:top-[100px]">
                <div className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-7">
                  <h2 className="display text-[22px] leading-tight text-ink">{t('summary')}</h2>
                  <CouponBox totals={totals} className="mt-5" />
                  <div className="my-5 border-t border-dashed border-ink/15" />
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
