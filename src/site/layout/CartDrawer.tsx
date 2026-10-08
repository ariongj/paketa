import { useNavigate } from 'react-router';
import { ArrowRight, Package, ShoppingBag, Stamp } from 'lucide-react';
import { Drawer } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { useDict, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { common } from '@/i18n/common';
import { useUi } from '@/store/ui';
import { useCart, useSettings } from '@/store/hooks';
import { money, pieces } from '@/lib/format';
import { CartLine } from '@/site/components/checkout/CartLine';
import { FreeShippingBar, packsIn, usePacksLabel, useTotalsView } from '@/site/components/checkout/parts';
import { ck } from '@/site/components/checkout/dict';

export function CartDrawer() {
  const t = useDict(site);
  const tk = useDict(ck);
  const tc = useDict(common);
  const lang = useLang();
  const packs = usePacksLabel();
  const open = useUi((s) => s.cartOpen);
  const setOpen = useUi((s) => s.setCartOpen);
  const totals = useCart();
  const view = useTotalsView(totals);
  const settings = useSettings();
  const navigate = useNavigate();
  const empty = totals.lines.length === 0;
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  const packCount = packsIn(totals.lines);

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title={
        <span className="flex items-center gap-2.5">
          <span className="display text-[22px] leading-none">{t('cart')}</span>
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs font-bold text-lime">{totals.lines.length}</span>
          {packCount > 0 && <span className="text-[12.5px] font-medium text-muted">· {packs(packCount)}</span>}
        </span>
      }
      footer={
        !empty && (
          <div>
            <div className="space-y-1.5 text-[13.5px]">
              <div className="flex justify-between text-muted">
                <span>{tc('subtotal')}</span>
                <span className="tabular-nums text-ink">{money(totals.subtotal, lang)}</span>
              </div>
              {totals.installationTotal > 0 && (
                <div className="flex justify-between text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Stamp className="h-3.5 w-3.5 text-pink-ink" />
                    {tc('installation')}
                  </span>
                  <span className="tabular-nums text-ink">{money(totals.installationTotal, lang)}</span>
                </div>
              )}
              {view.discounts.map((d) => (
                <div key={d.key} className="flex justify-between gap-3 text-muted">
                  <span className="min-w-0 truncate">
                    {d.label}
                    {d.code && <span className="ml-1.5 rounded border border-dashed border-brand-600/40 bg-lime-soft px-1 text-[10.5px] font-extrabold tracking-[0.08em] text-brand-700">{d.code}</span>}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-brand-700">−{money(d.amount, lang)}</span>
                </div>
              ))}
              <div className="flex justify-between text-muted">
                <span>{tc('shipping')}</span>
                <span className="tabular-nums text-ink">
                  {view.shippingFree || totals.shipping === 0 ? (
                    <span className="font-semibold text-brand-700">{tk('free')}</span>
                  ) : totals.shippingEstimate ? (
                    tk('from', { amount: money(totals.shipping, lang) })
                  ) : (
                    money(totals.shipping, lang)
                  )}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-dashed border-ink/20 pt-2.5">
                <span className="text-[15px] font-bold text-ink">{tc('total')}</span>
                <span className="display text-[26px] leading-none tabular-nums text-ink">{money(totals.total, lang)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[11.5px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <Package className="h-3 w-3 text-kraft" />
                  {pieces(totals.pieces, lang)}
                </span>
                <span>{tk('vatNote', { rate: settings.vatRate, amount: money(totals.vat, lang) })}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Button size="lg" className="w-full" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => go('/pagesa')}>
                {t('checkout')}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => go('/shporta')}>
                {t('viewCart')}
              </Button>
            </div>
          </div>
        )
      }
    >
      {empty ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title={t('cartEmpty')}
          text={t('cartEmptyText')}
          action={
            <Button variant="dark" onClick={() => go('/produktet')}>
              {t('continueShopping')}
            </Button>
          }
          className="py-24"
        />
      ) : (
        <div className="px-5 pb-4 pt-5 sm:px-6">
          <FreeShippingBar totals={totals} />
          <div className="divide-y divide-dashed divide-line">
            {totals.lines.map((line) => (
              <CartLine key={line.item.key} line={line} compact />
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}
