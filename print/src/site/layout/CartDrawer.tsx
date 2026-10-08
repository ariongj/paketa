import { useNavigate } from 'react-router';
import { ArrowRight, FileText, ShoppingBag } from 'lucide-react';
import { Drawer } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { useDict, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useUi } from '@/store/ui';
import { useCart, useSettings } from '@/store/hooks';
import { common } from '@/i18n/common';
import { money } from '@/lib/format';
import { CartLine } from '@/site/components/checkout/CartLine';
import { FreeShippingBar, useTotalsView } from '@/site/components/checkout/parts';
import { ck } from '@/site/components/checkout/dict';
import { CmykBar } from '@/site/components/company/Print';

export function CartDrawer() {
  const t = useDict(site);
  const tk = useDict(ck);
  const tc = useDict(common);
  const settings = useSettings();
  const lang = useLang();
  const open = useUi((s) => s.cartOpen);
  const setOpen = useUi((s) => s.setCartOpen);
  const totals = useCart();
  const view = useTotalsView(totals);
  const navigate = useNavigate();
  const empty = totals.lines.length === 0;
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      width="max-w-[480px]"
      title={
        <span className="flex items-center gap-2.5">
          {t('cart')}
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 font-mono text-[11px] text-paper">{totals.lines.length}</span>
        </span>
      }
      footer={
        !empty && (
          <div>
            <dl className="space-y-1.5 text-[13.5px]">
              <div className="flex justify-between text-muted">
                <dt>{tk('subtotal')}</dt>
                <dd className="font-mono tabular-nums text-ink">{money(totals.subtotal, lang)}</dd>
              </div>
              {totals.installationTotal > 0 && (
                <div className="flex justify-between text-muted">
                  <dt>{tk('design')}</dt>
                  <dd className="font-mono tabular-nums text-ink">{money(totals.installationTotal, lang)}</dd>
                </div>
              )}
              {totals.discount > 0 && (
                <div className="flex justify-between text-muted">
                  <dt>{tk('discounts')}</dt>
                  <dd className="font-mono tabular-nums text-emerald-700">−{money(totals.discount, lang)}</dd>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <dt>{tk('delivery')}</dt>
                <dd className="font-mono tabular-nums text-ink">{totals.shipping === 0 ? <span className="font-sans font-semibold text-emerald-700">{tk('free')}</span> : `${totals.shippingEstimate ? `${tc('from')} ` : ''}${money(totals.shipping, lang)}`}</dd>
              </div>
              {view.netPricing && (
                <>
                  <div className="flex justify-between border-t border-dashed border-line pt-2 text-ink">
                    <dt className="font-semibold">{tk('netTotal')}</dt>
                    <dd className="font-mono tabular-nums">{money(totals.net, lang)}</dd>
                  </div>
                  <div className="flex justify-between text-muted">
                    <dt>{tk('vat', { rate: settings.vatRate })}</dt>
                    <dd className="font-mono tabular-nums text-ink">{money(totals.vat, lang)}</dd>
                  </div>
                </>
              )}
              <div className="flex items-baseline justify-between border-t border-line pt-2.5 text-ink">
                <dt className="text-[15px] font-semibold">{tk('total')}</dt>
                <dd className="text-[22px] font-semibold tabular-nums">{money(totals.total, lang)}</dd>
              </div>
            </dl>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <Button size="lg" className="w-full" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => go('/pagesa')}>
                {t('checkout')}
              </Button>
              <Button size="lg" variant="outline" onClick={() => go('/shporta')}>
                {t('viewCart')}
              </Button>
            </div>
          </div>
        )
      }
    >
      {empty ? (
        <div className="flex flex-col items-center px-8 py-20 text-center">
          <span className="relative grid h-20 w-20 place-items-center rounded-full bg-white ring-1 ring-line">
            <ShoppingBag className="h-8 w-8 text-ink-soft" strokeWidth={1.6} />
          </span>
          <CmykBar segments className="mt-6" />
          <h3 className="mt-5 text-[18px] font-semibold text-ink">{t('cartEmpty')}</h3>
          <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-muted">{t('cartEmptyText')}</p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Button variant="dark" onClick={() => go('/produktet')}>
              {t('continueShopping')}
            </Button>
            <Button variant="outline" icon={<FileText className="h-4 w-4" />} onClick={() => go('/kerko-oferte')}>
              {t('requestQuote')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-2 pt-5 sm:px-6">
          <FreeShippingBar totals={totals} />
          <div className="divide-y divide-line">
            {totals.lines.map((line) => (
              <CartLine key={line.item.key} line={line} compact onNavigate={() => setOpen(false)} />
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}
