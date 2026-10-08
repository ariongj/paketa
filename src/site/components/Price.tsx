import type { Product } from '@/lib/types';
import { basePrice, isOnSale, piecePrice, piecesPerUnit } from '@/lib/pricing';
import { money, moneyPiece, perUnit } from '@/lib/format';
import { useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { PD } from '@/site/components/product/dict';
import { cn } from '@/lib/utils';

/** True when options can push the price above the base price → show "from". */
export function hasPriceRange(p: Product) {
  return p.options.some((o) => o.values.some((v) => (v.priceDelta ?? 0) > 0));
}

/** Sold per pack with a known pack size → show per-piece prices and "50 copë/pako". */
export const isPackProduct = (p: Product) => p.unit === 'pack' && piecesPerUnit(p) > 1;

/**
 * Price per selling unit ("2,50 € / pako") with the compare-at price when on sale.
 * Quote-only products show "Çmimi sipas kërkesës" instead of a number.
 */
export function Price({
  product,
  size = 'md',
  className,
  showUnit = true,
  showPiece = false,
}: {
  product: Product;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showUnit?: boolean;
  /** add the per-piece chip ("0,05 €/copë") for pack products */
  showPiece?: boolean;
}) {
  const lang = useLang();
  const t = useDict(PD);
  const tc = useDict(common);
  const sizes = {
    sm: 'text-[16px]',
    md: 'text-[18px]',
    lg: 'text-2xl',
    xl: 'text-[34px] leading-none',
  };
  if (product.quoteOnly) {
    return <div className={cn('text-[13.5px] font-semibold text-ink-soft', className)}>{t('quoteOnly')}</div>;
  }
  const sale = isOnSale(product);
  const price = basePrice(product);
  const from = hasPriceRange(product);
  return (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1', className)}>
      <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
        {from && <span className="text-[12.5px] font-medium text-muted">{tc('from')}</span>}
        <span className={cn('font-bold tracking-tight tabular-nums', sale ? 'text-pink-ink' : 'text-ink', sizes[size])}>{money(price, lang)}</span>
        {showUnit && product.unit === 'pack' && <span className="text-[12.5px] font-medium text-muted">{perUnit('pack', lang)}</span>}
        {sale && <span className="text-[12.5px] font-medium text-muted line-through tabular-nums">{money(product.price, lang)}</span>}
      </span>
      {showPiece && isPackProduct(product) && <PieceChip product={product} />}
    </div>
  );
}

/** Lime "0,05 €/copë" chip — the per-piece price B2B buyers compare on. */
export function PieceChip({ product, value, className }: { product: Product; value?: number; className?: string }) {
  const lang = useLang();
  const t = useDict(PD);
  const v = value ?? piecePrice(product);
  return (
    <span className={cn('inline-flex h-6 items-center whitespace-nowrap rounded-full bg-lime-soft px-2.5 text-[11.5px] font-bold tabular-nums text-lime-ink ring-1 ring-inset ring-lime-ink/10', className)}>
      {t('perPiece', { price: moneyPiece(v, lang) })}
    </span>
  );
}
