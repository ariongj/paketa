import { Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowUpRight, Clock, FileText, Heart, Plus } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Badge, Img } from '@/components/ui/misc';
import { Price } from './Price';
import { useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { common } from '@/i18n/common';
import { useUi } from '@/store/ui';
import { useDb } from '@/store/db';
import { defaultOptions, discountPct } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { isRun, qtyRules, qtyText } from './product/print';

export function ProductBadges({ product, className }: { product: Product; className?: string }) {
  const tc = useDict(common);
  const pct = discountPct(product);
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {pct > 0 && <Badge tone="brand">−{pct}%</Badge>}
      {product.badges.includes('new') && <Badge tone="dark">{tc('badge_new')}</Badge>}
      {product.badges.includes('bestseller') && <Badge tone="light" className="ring-1 ring-ink/10">{tc('badge_bestseller')}</Badge>}
      {product.badges.includes('premium') && !product.badges.includes('new') && (
        <Badge tone="light" className="text-brand-700 ring-1 ring-brand-200">
          {tc('badge_premium')}
        </Badge>
      )}
    </div>
  );
}

/** Four printer's crop marks around a box (appear on hover). */
export function CropMarks({ className }: { className?: string }) {
  const base = 'pointer-events-none absolute h-3 w-3 border-ink/35 transition-opacity duration-500';
  return (
    <span aria-hidden className={cn('opacity-0 group-hover:opacity-100', className)}>
      <span className={cn(base, '-left-2 -top-2 border-l border-t')} />
      <span className={cn(base, '-right-2 -top-2 border-r border-t')} />
      <span className={cn(base, '-bottom-2 -left-2 border-b border-l')} />
      <span className={cn(base, '-bottom-2 -right-2 border-b border-r')} />
    </span>
  );
}

export function ProductCard({ product, className, priority }: { product: Product; className?: string; priority?: boolean }) {
  const t = useDict(site);
  const l = useL();
  const lang = useLang();
  const category = useDb((s) => s.categories.find((c) => c.id === product.categoryId));
  const wish = useUi((s) => s.wishlist.includes(product.id));
  const toggleWishlist = useUi((s) => s.toggleWishlist);
  const addToCart = useUi((s) => s.addToCart);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const href = `/produkt/${product.slug}`;
  const run = isRun(product);
  // Sample kits and other simple items go straight to the cart; print runs open the configurator.
  const simple = !product.quoteOnly && !run && !product.artwork && product.options.length === 0;
  const swatches = product.options.find((o) => o.type === 'swatch');
  const min = qtyRules(product).min;

  const quickAdd = () => {
    addToCart({ productId: product.id, qty: 1, options: defaultOptions(product), installation: false });
    toast.success(t('added'), { description: l(product.name), action: { label: t('viewCart'), onClick: () => setCartOpen(true) } });
  };

  const cta = 'flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white/95 text-[13.5px] font-semibold text-ink shadow-[0_10px_30px_-12px_rgb(18_16_20/0.45)] ring-1 ring-ink/5 backdrop-blur transition-colors hover:bg-ink hover:text-white';

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="relative">
        <CropMarks />
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-500 group-hover:shadow-[0_28px_60px_-34px_rgb(18_16_20/0.45)]">
          <Link to={href} aria-label={l(product.name)} className="absolute inset-0">
            <Img
              src={product.images[0]}
              small
              eager={priority}
              alt={l(product.name)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
            />
            {product.images[1] && <Img src={product.images[1]} small alt="" className="absolute inset-0 h-full w-full object-cover opacity-0! transition-opacity duration-700 group-hover:opacity-100!" />}
          </Link>
          <ProductBadges product={product} className="pointer-events-none absolute left-3 top-3" />
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label={t('wishlist')}
            aria-pressed={wish}
            className={cn(
              'absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-ink/5 backdrop-blur transition-all hover:scale-105',
              wish ? 'text-brand-600' : 'text-ink/60 hover:text-ink',
            )}
          >
            <Heart className={cn('h-4 w-4', wish && 'fill-current')} />
          </button>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
            {simple ? (
              <button type="button" onClick={quickAdd} className={cta}>
                <Plus className="h-4 w-4" /> {t('addToCart')}
              </button>
            ) : (
              <Link to={href} className={cta}>
                {product.quoteOnly ? <FileText className="h-4 w-4" /> : null}
                {product.quoteOnly ? t('requestQuote') : t('chooseOptions')}
                {!product.quoteOnly && <ArrowUpRight className="h-4 w-4" />}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{category ? l(category.name) : ''}</span>
          {swatches && (
            <span className="flex shrink-0 -space-x-1">
              {swatches.values.slice(0, 4).map((v) => (
                <span key={v.id} title={l(v.label)} className="h-3.5 w-3.5 rounded-full border-2 border-paper ring-1 ring-ink/15" style={{ background: v.swatch }} />
              ))}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 text-[15.5px] font-semibold leading-snug text-ink">
          <Link to={href} className="link-u">
            {l(product.name)}
          </Link>
        </h3>
        {l(product.short) && <p className="mt-1 line-clamp-1 text-[13px] leading-snug text-muted">{l(product.short)}</p>}
        <div className="mt-auto pt-3">
          <Price product={product} size="sm" />
          {(run || product.quoteOnly || (product.leadDays ?? 0) > 0) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {(run || product.quoteOnly) && min > 1 && (
                <span className="inline-flex h-6 items-center rounded-md bg-sand px-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.04em] text-ink-soft">
                  {t('moq', { n: qtyText(min, lang) })}
                </span>
              )}
              {(product.leadDays ?? 0) > 0 && (
                <span className="inline-flex h-6 items-center gap-1 text-[11.5px] text-muted">
                  <Clock className="h-3 w-3" />
                  {t('leadTime', { days: product.leadDays! })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
