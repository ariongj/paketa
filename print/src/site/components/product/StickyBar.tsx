import { AnimatePresence, motion } from 'motion/react';
import { FileText, ShoppingBag } from 'lucide-react';
import { Img } from '@/components/ui/misc';
import { useDict, useL, useLang } from '@/i18n';
import { money } from '@/lib/format';
import { useSettings } from '@/store/hooks';
import { PD, eur } from './dict';
import { qtyText, unitMoney } from './print';
import { useTweenedNumber, type Configurator } from './useConfigurator';
import { WishButton } from './BuyBox';

/** Bottom bar: always handy on mobile, on desktop once the buy box is out of view. */
export function StickyBar({ cfg, visible, onAdd, onQuote }: { cfg: Configurator; visible: boolean; onAdd: () => void; onQuote: () => void }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const settings = useSettings();
  const p = cfg.product;
  const total = useTweenedNumber(cfg.total);
  const net = settings.pricesIncludeVat === false;
  const qtyLine = cfg.run ? `${qtyText(cfg.qty, lang)} ${t('pieces')} × ${unitMoney(cfg.unitPrice, lang)}` : `${qtyText(cfg.qty, lang)} × ${money(cfg.unitPrice, lang)}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_40px_-24px_rgba(18,16,20,0.35)] backdrop-blur-xl"
        >
          <div className="container-x flex h-[76px] items-center gap-3 sm:gap-4">
            <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line sm:block">
              <Img src={p.images[0]} small alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="hidden truncate text-[14.5px] font-semibold text-ink sm:block">{l(p.name)}</div>
              {p.quoteOnly ? (
                <div className="truncate text-[14px] font-semibold text-ink sm:text-[12.5px] sm:font-medium sm:text-muted">{t('quoteOnly')}</div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1.5 sm:hidden">
                    <span className="text-[18px] font-semibold leading-tight tabular-nums text-ink">{eur(total, lang, cfg.total)}</span>
                    {net && <span className="font-mono text-[9.5px] uppercase text-muted">{t('exclVat')}</span>}
                  </div>
                  <div className="truncate font-mono text-[11px] tabular-nums text-muted">
                    {qtyLine}
                    {cfg.installation && <span className="font-sans"> · {t('designFee')}</span>}
                  </div>
                </>
              )}
            </div>
            {!p.quoteOnly && (
              <div className="hidden shrink-0 text-right sm:block">
                <div className="text-[22px] font-semibold leading-none tabular-nums text-ink">{eur(total, lang, cfg.total)}</div>
                {net && <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">{t('exclVat')}</div>}
              </div>
            )}
            <WishButton productId={p.id} tone="light" className="h-12! w-12! max-md:hidden!" />
            <button
              type="button"
              onClick={p.quoteOnly ? onQuote : onAdd}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-[14.5px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_10px_24px_-14px_var(--color-brand-700)] transition-[background,transform] hover:bg-brand-700 active:scale-[0.98] sm:px-7"
            >
              {p.quoteOnly ? <FileText className="h-[18px] w-[18px]" /> : <ShoppingBag className="h-[18px] w-[18px]" />}
              {p.quoteOnly ? t('requestQuote') : t('addToCart')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
