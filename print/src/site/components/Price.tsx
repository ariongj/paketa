import type { Product } from '@/lib/types';
import { basePrice, isOnSale } from '@/lib/pricing';
import { money } from '@/lib/format';
import { useDict, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { common } from '@/i18n/common';
import { cn } from '@/lib/utils';
import { useSettings } from '@/store/hooks';
import { fromUnitPrice, isRun, unitMoney } from '@/site/components/product/print';

/** True when the shopper can reach a lower or higher price than the list price (tiers / options). */
export function hasPriceRange(p: Product) {
  return !!p.tiers?.length || p.options.some((o) => o.values.some((v) => (v.priceDelta ?? 0) !== 0));
}

/**
 * Storefront price line.
 * - print runs: "nga 0,27 € / copë · pa TVSH" (lowest tier, cheapest options)
 * - quote-only: "Çmim sipas projektit"
 * - everything else (sample kit): the normal price "19,00 € · pa TVSH"
 */
export function Price({
  product,
  size = 'md',
  className,
  vat = true,
}: {
  product: Product;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** show the "excl. VAT" note */
  vat?: boolean;
}) {
  const lang = useLang();
  const t = useDict(site);
  const tc = useDict(common);
  const net = useSettings().pricesIncludeVat === false;
  const sizes = {
    sm: 'text-[15px]',
    md: 'text-[17px]',
    lg: 'text-2xl',
    xl: 'text-[34px] leading-none',
  };

  if (product.quoteOnly) {
    return (
      <div className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
        <span className={cn('font-semibold tracking-tight text-ink', size === 'sm' ? 'text-[14px]' : sizes[size])}>{t('quoteOnly')}</span>
      </div>
    );
  }

  const run = isRun(product);
  const sale = isOnSale(product);
  const value = run ? fromUnitPrice(product) : basePrice(product);
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5', className)}>
      {run && <span className="text-[12.5px] font-medium text-muted">{tc('from')}</span>}
      <span className={cn('font-semibold tracking-tight tabular-nums', sale ? 'text-brand-700' : 'text-ink', sizes[size])}>{run ? unitMoney(value, lang) : money(value, lang)}</span>
      {run && <span className="text-[12.5px] font-medium text-muted">{tc('perPiece')}</span>}
      {!run && sale && <span className="text-[12.5px] font-medium text-muted line-through tabular-nums">{money(product.price, lang)}</span>}
      {vat && <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted/90">· {net ? tc('exclVat') : tc('inclVat')}</span>}
    </div>
  );
}
