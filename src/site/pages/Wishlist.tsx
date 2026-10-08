import { useMemo } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Gift, Heart, Phone, ShoppingBag, Trash2 } from 'lucide-react';
import { Accent } from '@/components/ui/misc';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { ProductGrid } from '@/site/components/utility/ProductGrid';
import { CtaBand } from '@/site/components/utility/CtaBand';
import { diverseBestsellers, pluralOne } from '@/site/components/utility/shared';
import { defineDict, useDict, useLang } from '@/i18n';
import { useUi } from '@/store/ui';
import { useActiveProducts, useSettings } from '@/store/hooks';
import { basePrice, defaultOptions } from '@/lib/pricing';
import { money } from '@/lib/format';
import type { Product } from '@/lib/types';

const T = defineDict({
  me: {
    pageTitle: 'Omiljeno',
    eyebrow: 'Vaša lista za naručivanje',
    title: 'Omiljeni *proizvodi*',
    subtitle: 'Sačuvajte ambalažu koju redovno naručujete — kada vam ponestane, dodajte je u korpu jednim klikom.',
    productOne: '{n} proizvod',
    productMany: '{n} proizvoda',
    clearAll: 'Obriši sve',
    cleared: 'Lista je obrisana',
    undo: 'Poništi',
    continue: 'Nastavite kupovinu',
    addAll: 'Sve u korpu · {amount}',
    addAllHint: 'Po 1 pakovanje od svakog proizvoda na stanju',
    addedAll: 'Dodato u korpu: {n}',
    viewCart: 'Pogledaj korpu',
    emptyTitle: 'Lista je još *prazna*',
    emptyText: 'Kliknite na srce na proizvodu koji često naručujete — tako ćete ga sljedeći put brzo dodati u korpu.',
    emptyCta: 'Pogledajte asortiman',
    inspiration: 'Najčešće *naručujemo*',
    helpEyebrow: 'Besplatni uzorci',
    helpTitle: 'Probajte ambalažu *prije narudžbe*.',
    helpText: 'Šaljemo besplatne uzorke čaša, poklopaca i posuda na adresu vašeg lokala — i pripremamo veleprodajnu ponudu za redovne narudžbe.',
    helpCta: 'Zatražite uzorke',
  },
  sq: {
    pageTitle: 'Të preferuarat',
    eyebrow: 'Lista juaj e porosive',
    title: 'Të *preferuarat*',
    subtitle: 'Ruani paketimet që i porositni rregullisht — kur t’ju mbarojnë, shtojini në shportë me një klik.',
    productOne: '{n} produkt',
    productMany: '{n} produkte',
    clearAll: 'Fshiji të gjitha',
    cleared: 'Lista u pastrua',
    undo: 'Anulo',
    continue: 'Vazhdoni blerjen',
    addAll: 'Të gjitha në shportë · {amount}',
    addAllHint: 'Nga 1 pako nga çdo produkt në stok',
    addedAll: 'U shtuan në shportë: {n}',
    viewCart: 'Shiko shportën',
    emptyTitle: 'Lista është ende *bosh*',
    emptyText: 'Klikoni zemrën te produktet që i porositni shpesh — herën tjetër i shtoni në shportë menjëherë.',
    emptyCta: 'Shikoni katalogun',
    inspiration: 'Më të *porositurat*',
    helpEyebrow: 'Mostra falas',
    helpTitle: 'Provojeni paketimin *para porosisë*.',
    helpText: 'Dërgojmë mostra falas të gotave, kapakëve dhe enëve në adresën e lokalit tuaj — dhe përgatisim ofertë shumice për porositë e rregullta.',
    helpCta: 'Kërkoni mostra',
  },
  en: {
    pageTitle: 'Favourites',
    eyebrow: 'Your reorder list',
    title: 'Your *favourites*',
    subtitle: 'Save the packaging you order regularly — when you run low, add it to the cart in one click.',
    productOne: '{n} product',
    productMany: '{n} products',
    clearAll: 'Clear all',
    cleared: 'List cleared',
    undo: 'Undo',
    continue: 'Continue shopping',
    addAll: 'Add all to cart · {amount}',
    addAllHint: '1 pack of every product in stock',
    addedAll: 'Added to cart: {n}',
    viewCart: 'View cart',
    emptyTitle: 'Your list is still *empty*',
    emptyText: 'Tap the heart on products you order often — next time you can add them to the cart straight away.',
    emptyCta: 'Browse the range',
    inspiration: 'Most *ordered*',
    helpEyebrow: 'Free samples',
    helpTitle: 'Try the packaging *before you order*.',
    helpText: 'We send free samples of cups, lids and containers to your venue — and prepare a wholesale quote for regular orders.',
    helpCta: 'Request samples',
  },
});

export default function Wishlist() {
  const t = useDict(T);
  const lang = useLang();
  const settings = useSettings();
  const wishlist = useUi((s) => s.wishlist);
  const addToCart = useUi((s) => s.addToCart);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const products = useActiveProducts();
  usePageTitle(t('pageTitle'));

  // Most recently saved first; ignore products that were unpublished or deleted in the CMS
  const items = useMemo(() => [...wishlist].reverse().map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p), [wishlist, products]);
  const buyable = useMemo(() => items.filter((p) => !p.quoteOnly && p.stock > 0 && p.options.length === 0), [items]);
  const buyableTotal = buyable.reduce((s, p) => s + basePrice(p), 0);
  const suggestions = useMemo(() => diverseBestsellers(products.filter((p) => !wishlist.includes(p.id) && !p.quoteOnly && p.stock > 0), 4), [products, wishlist]);

  const clearAll = () => {
    const prev = useUi.getState().wishlist;
    useUi.setState({ wishlist: [] });
    toast(t('cleared'), { action: { label: t('undo'), onClick: () => useUi.setState({ wishlist: prev }) } });
  };

  const addAll = () => {
    for (const p of buyable) addToCart({ productId: p.id, qty: 1, options: defaultOptions(p), installation: false });
    toast.success(t('addedAll', { n: buyable.length }), { action: { label: t('viewCart'), onClick: () => setCartOpen(true) } });
    setCartOpen(true);
  };

  const empty = items.length === 0;
  const tel = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;

  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-10 pt-8 sm:pb-14 sm:pt-12">
          <Breadcrumbs items={[{ label: t('pageTitle') }]} />
          <div className="mt-8 flex flex-col gap-6 sm:mt-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="eyebrow mb-3">{t('eyebrow')}</div>
              <h1 className="display flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[40px] leading-[1.04] text-ink sm:text-[56px]">
                <Accent text={t('title')} />
                {!empty && (
                  <span className="translate-y-[-0.35em] rotate-[-3deg] rounded-full bg-pink px-3 py-1 font-display text-[13px] font-bold tracking-normal text-white sm:text-[14px]">
                    {t(pluralOne(items.length, lang) ? 'productOne' : 'productMany', { n: items.length })}
                  </span>
                )}
              </h1>
              <p className="mt-4 text-[16.5px] leading-relaxed text-muted">{t('subtitle')}</p>
            </div>
            {!empty && (
              <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" onClick={clearAll} icon={<Trash2 className="h-4 w-4" />} className="text-ink-soft hover:text-pink-ink max-md:-ml-4">
                    {t('clearAll')}
                  </Button>
                  {buyable.length > 0 ? (
                    <Button onClick={addAll} icon={<ShoppingBag className="h-4 w-4" />}>
                      {t('addAll', { amount: money(buyableTotal, lang) })}
                    </Button>
                  ) : (
                    <ButtonLink to="/produktet" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                      {t('continue')}
                    </ButtonLink>
                  )}
                </div>
                {buyable.length > 0 && <span className="text-[12.5px] text-muted">{t('addAllHint')}</span>}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container-x pt-12 sm:pt-16">
        {empty ? (
          <div className="mx-auto flex max-w-xl animate-fade-up flex-col items-center py-6 text-center sm:py-10">
            <span className="relative grid h-24 w-24 place-items-center">
              <span className="absolute inset-0 rotate-6 rounded-[28px] bg-pink-soft" />
              <span className="absolute inset-3 -rotate-3 rounded-[22px] bg-white ring-1 ring-pink/20" />
              <Heart className="relative h-9 w-9 text-pink" strokeWidth={1.8} />
            </span>
            <h2 className="display mt-7 text-[34px] leading-[1.06] text-ink sm:text-[44px]">
              <Accent text={t('emptyTitle')} />
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">{t('emptyText')}</p>
            <ButtonLink to="/produktet" size="lg" className="mt-8" iconRight={<ArrowRight className="h-4 w-4" />}>
              {t('emptyCta')}
            </ButtonLink>
          </div>
        ) : (
          <ProductGrid products={items} layout />
        )}

        {empty && suggestions.length > 0 && (
          <section className="mt-16 border-t border-line pt-14 sm:mt-20 sm:pt-16">
            <h2 className="display mb-8 text-[30px] leading-[1.05] text-ink sm:text-[40px]">
              <Accent text={t('inspiration')} />
            </h2>
            <ProductGrid products={suggestions} />
          </section>
        )}

        <CtaBand
          className="mt-16 sm:mt-24"
          image="/images/s/mostra.webp"
          eyebrow={t('helpEyebrow')}
          title={t('helpTitle')}
          text={t('helpText')}
          actions={
            <>
              <ButtonLink to="/sherbimet" variant="light" size="lg" icon={<Gift className="h-4 w-4" />}>
                {t('helpCta')}
              </ButtonLink>
              <a href={tel} className="inline-flex h-13 items-center justify-center gap-2.5 rounded-full border border-white/30 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10">
                <Phone className="h-4 w-4" /> {settings.phone}
              </a>
            </>
          }
        />
      </div>
    </>
  );
}
