import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowUpRight, Check, FileText, Heart, Mail, Plus, Stamp } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Img } from '@/components/ui/misc';
import { PieceChip, Price, isPackProduct } from './Price';
import { useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useUi } from '@/store/ui';
import { useDb } from '@/store/db';
import { defaultOptions, discountPct } from '@/lib/pricing';
import { num, unitLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PD, keepUnits, pctOff } from './product/dict';

type Sticker = { key: string; label: string; className: string };

/**
 * Sticker-style badges (sale −%, new, bestseller, premium) — slightly rotated, like labels on a box.
 * `max` limits how many show (cards keep it to two).
 */
export function ProductBadges({ product, className, max = 4, size = 'sm' }: { product: Product; className?: string; max?: number; size?: 'sm' | 'md' }) {
  const tc = useDict(common);
  const lang = useLang();
  const pct = discountPct(product);
  const list: Sticker[] = [];
  if (pct > 0) list.push({ key: 'sale', label: pctOff(pct, lang), className: 'bg-pink text-white -rotate-3' });
  if (product.badges.includes('new')) list.push({ key: 'new', label: tc('badge_new'), className: 'bg-ink text-lime rotate-2' });
  if (product.badges.includes('bestseller')) list.push({ key: 'best', label: tc('badge_bestseller'), className: 'bg-lime text-ink -rotate-2' });
  if (product.badges.includes('premium')) list.push({ key: 'premium', label: tc('badge_premium'), className: 'bg-kraft text-ink rotate-1' });
  if (!list.length) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {list.slice(0, max).map((s) => (
        <span
          key={s.key}
          className={cn(
            'inline-flex items-center whitespace-nowrap rounded-full font-display font-bold tracking-[-0.01em] shadow-[0_6px_14px_-8px_rgb(15_29_22/0.55)] ring-1 ring-black/5',
            size === 'md' ? 'h-7 px-3 text-[13px]' : 'h-6 px-2.5 text-[12px]',
            s.className,
          )}
        >
          {s.label}
        </span>
      ))}
    </div>
  );
}

export function ProductCard({ product, className, priority }: { product: Product; className?: string; priority?: boolean }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const category = useDb((s) => s.categories.find((c) => c.id === product.categoryId));
  const wish = useUi((s) => s.wishlist.includes(product.id));
  const toggleWishlist = useUi((s) => s.toggleWishlist);
  const addToCart = useUi((s) => s.addToCart);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const [added, setAdded] = useState(false);

  const href = `/produkt/${product.slug}`;
  const quote = !!product.quoteOnly;
  const out = !quote && product.stock <= 0;
  const pack = isPackProduct(product);
  const simple = !quote && !out && product.options.length === 0;
  const logo = !!product.installation?.available;

  const quickAdd = () => {
    addToCart({ productId: product.id, qty: 1, options: defaultOptions(product), installation: false });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
    toast.success(t('added'), {
      description: `${l(product.name)} · 1 ${unitLabel(product.unit, lang)}`,
      action: { label: t('viewCart'), onClick: () => setCartOpen(true) },
    });
  };

  const actionCls =
    'grid h-10 w-10 shrink-0 place-items-center rounded-full transition-[background,color,transform,box-shadow] duration-200 active:scale-95 sm:h-11 sm:w-11';

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-[22px] bg-white p-1.5 ring-1 ring-line/80 transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_28px_50px_-30px_rgb(15_29_22/0.45)] hover:ring-ink/10 sm:rounded-[26px] sm:p-2',
        className,
      )}
    >
      {/* square frame on a soft neutral background — photos range from dark studio to bright lifestyle */}
      <div className="relative aspect-square overflow-hidden rounded-[17px] bg-sand sm:rounded-[20px]">
        <Link to={href} aria-label={l(product.name)} className="absolute inset-0">
          <Img
            src={product.images[0]}
            small
            eager={priority}
            alt={l(product.name)}
            className={cn('absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]', out && 'grayscale-[40%]')}
          />
          {product.images[1] && (
            <Img src={product.images[1]} small alt="" className="absolute inset-0 h-full w-full object-cover opacity-0! transition-opacity duration-700 group-hover:opacity-100! max-md:hidden" />
          )}
        </Link>
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-ink/[0.06]" />
        <ProductBadges product={product} max={2} className="pointer-events-none absolute left-2 top-2 sm:left-2.5 sm:top-2.5" />
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={wish ? t('wishRemove') : t('wishAdd')}
          aria-pressed={wish}
          className={cn(
            'absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all hover:scale-105 sm:right-2.5 sm:top-2.5 sm:h-9 sm:w-9',
            wish ? 'text-pink' : 'text-ink/60 hover:text-ink',
          )}
        >
          <Heart className={cn('h-4 w-4', wish && 'fill-current')} />
        </button>
        {out ? (
          <span className="pointer-events-none absolute inset-x-2 bottom-2 rounded-full bg-white/95 py-1.5 text-center text-[12px] font-bold text-ink shadow-sm backdrop-blur sm:inset-x-2.5 sm:bottom-2.5">{t('card_out')}</span>
        ) : quote ? (
          <span className="pointer-events-none absolute bottom-2 left-2 inline-flex h-6 items-center gap-1 rounded-full bg-ink px-2.5 text-[11.5px] font-bold text-lime sm:bottom-2.5 sm:left-2.5">
            <Stamp className="h-3 w-3" /> {t('quoteBadge')}
          </span>
        ) : (
          logo && (
            <span
              title={t('card_logoTitle')}
              className="pointer-events-none absolute bottom-2 left-2 inline-flex h-6 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[11.5px] font-bold text-brand-700 shadow-sm backdrop-blur sm:bottom-2.5 sm:left-2.5"
            >
              <Stamp className="h-3 w-3" /> {t('card_logo')}
            </span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3 sm:px-2 sm:pb-1.5">
        <div className="truncate text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted sm:text-[11px]">{category ? l(category.name) : ''}</div>
        <h3 className="mt-1 line-clamp-2 text-pretty text-[14px] font-semibold leading-snug text-ink sm:text-[15px]">
          <Link to={href} className="link-u">
            {keepUnits(l(product.name))}
          </Link>
        </h3>
        {pack && <div className="mt-1 text-[12.5px] font-medium tabular-nums text-muted">{t('packOf', { n: num(product.packSize ?? 1, lang, 0) })}</div>}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {quote ? (
              <Link to={href} className="block text-[14.5px] font-bold leading-tight text-brand-700 hover:text-brand-800 sm:text-[15px]">
                {t('card_quote')}
                <span className="mt-0.5 block text-[12px] font-medium text-muted">{t('card_onRequest')}</span>
              </Link>
            ) : (
              <>
                <Price product={product} size="sm" />
                {pack && <PieceChip product={product} className="mt-1.5" />}
              </>
            )}
          </div>
          {simple ? (
            <button
              type="button"
              onClick={quickAdd}
              aria-label={t('card_add')}
              title={t('card_add')}
              className={cn(actionCls, added ? 'bg-brand-600 text-white' : 'bg-ink text-white hover:bg-brand-600 hover:shadow-[0_10px_22px_-12px_var(--color-brand-700)]')}
            >
              {added ? <Check className="h-[18px] w-[18px]" strokeWidth={2.6} /> : <Plus className="h-[18px] w-[18px]" strokeWidth={2.4} />}
            </button>
          ) : (
            <Link
              to={href}
              aria-label={out ? t('card_contact') : quote ? t('card_quote') : t('card_options')}
              title={out ? t('card_contact') : quote ? t('card_quote') : t('card_options')}
              className={cn(actionCls, quote ? 'bg-lime text-ink hover:bg-ink hover:text-lime' : 'border border-line bg-white text-ink hover:border-ink hover:bg-ink hover:text-white')}
            >
              {out ? <Mail className="h-[17px] w-[17px]" /> : quote ? <FileText className="h-[17px] w-[17px]" /> : <ArrowUpRight className="h-[18px] w-[18px]" />}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
