import { useMemo } from 'react';
import { toast } from 'sonner';
import { ArrowRight, FileText, Heart, Phone, Trash2 } from 'lucide-react';
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
import type { Product } from '@/lib/types';

const T = defineDict({
  sq: {
    pageTitle: 'Të preferuarat',
    eyebrow: 'Ruajtur për më vonë',
    title: 'Të *preferuarat*',
    subtitle: 'Produktet që i keni shënuar me zemër ju presin këtu — krahasoni materialet, çmimet sipas sasisë dhe afatet, pastaj porositni kur të jeni gati.',
    productOne: '{n} produkt',
    productMany: '{n} produkte',
    clearAll: 'Fshiji të gjitha',
    cleared: 'Lista e të preferuarave u pastrua',
    undo: 'Anulo',
    continue: 'Vazhdoni blerjen',
    emptyTitle: 'Lista juaj është *bosh*',
    emptyText: 'Klikoni zemrën në çdo produkt për ta ruajtur këtu — kështu i krahasoni lehtë kutitë, etiketat dhe qeset para porosisë.',
    emptyCta: 'Shikoni produktet',
    inspiration: 'Mund t’ju *pëlqejnë*',
    helpEyebrow: 'Paketim me porosi',
    helpTitle: 'Keni një projekt të *veçantë*?',
    helpText: 'Përmasa, material apo finishing që nuk e gjeni në katalog? Na dërgoni specifikimet — oferta e saktë vjen brenda 24 orësh, me provë digjitale falas.',
    helpCta: 'Kërko ofertë',
  },
  en: {
    pageTitle: 'Wishlist',
    eyebrow: 'Saved for later',
    title: 'Your *wishlist*',
    subtitle: 'Everything you’ve hearted waits here — compare materials, quantity pricing and lead times, then order when you’re ready.',
    productOne: '{n} product',
    productMany: '{n} products',
    clearAll: 'Clear all',
    cleared: 'Wishlist cleared',
    undo: 'Undo',
    continue: 'Continue shopping',
    emptyTitle: 'Your wishlist is *empty*',
    emptyText: 'Tap the heart on any product to save it here — it makes comparing boxes, labels and bags before you order easy.',
    emptyCta: 'Browse products',
    inspiration: 'You might *like*',
    helpEyebrow: 'Custom packaging',
    helpTitle: 'Got a *special* project?',
    helpText: 'A size, material or finish you can’t find in the catalogue? Send us the specs — an exact quote follows within 24 hours, with a free digital proof.',
    helpCta: 'Request a quote',
  },
});

export default function Wishlist() {
  const t = useDict(T);
  const lang = useLang();
  const settings = useSettings();
  const wishlist = useUi((s) => s.wishlist);
  const products = useActiveProducts();
  usePageTitle(t('pageTitle'));

  // Most recently saved first; ignore products that were unpublished or deleted in the CMS
  const items = useMemo(
    () => [...wishlist].reverse().map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p),
    [wishlist, products],
  );
  const suggestions = useMemo(
    () => diverseBestsellers(products.filter((p) => !wishlist.includes(p.id)), 4),
    [products, wishlist],
  );

  const clearAll = () => {
    const prev = useUi.getState().wishlist;
    useUi.setState({ wishlist: [] });
    toast(t('cleared'), { action: { label: t('undo'), onClick: () => useUi.setState({ wishlist: prev }) } });
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
                  <span className="translate-y-[-0.35em] rounded-full bg-brand-600 px-3 py-1 font-sans text-[13px] font-bold tracking-normal text-white sm:text-[14px]">
                    {t(pluralOne(items.length, lang) ? 'productOne' : 'productMany', { n: items.length })}
                  </span>
                )}
              </h1>
              <p className="mt-4 text-[16.5px] leading-relaxed text-muted">{t('subtitle')}</p>
            </div>
            {!empty && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={clearAll} icon={<Trash2 className="h-4 w-4" />} className="text-ink-soft hover:text-brand-700 max-md:-ml-4">
                  {t('clearAll')}
                </Button>
                <ButtonLink to="/produktet" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('continue')}
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container-x pt-12 sm:pt-16">
        {empty ? (
          <div className="mx-auto flex max-w-xl animate-fade-up flex-col items-center py-6 text-center sm:py-10">
            <span className="relative grid h-24 w-24 place-items-center">
              <span className="absolute inset-0 rounded-full bg-brand-100/70" />
              <span className="absolute inset-3 rounded-full bg-brand-50 ring-1 ring-brand-200/70" />
              <Heart className="relative h-9 w-9 text-brand-600" strokeWidth={1.6} />
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
          image="/images/misc/production.webp"
          eyebrow={t('helpEyebrow')}
          title={t('helpTitle')}
          text={t('helpText')}
          actions={
            <>
              <ButtonLink to="/kerko-oferte" variant="light" size="lg" icon={<FileText className="h-4 w-4" />}>
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
