import { AnimatePresence, motion } from 'motion/react';
import { FileText, Mail, ShoppingBag } from 'lucide-react';
import { Img } from '@/components/ui/misc';
import { useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { num, pieces, unitLabel } from '@/lib/format';
import { PD, eur, keepUnits, pctOff } from './dict';
import { useTweenedNumber, type Configurator } from './useConfigurator';
import { WishButton } from './BuyBox';

/** Bottom add-to-cart bar: always handy on mobile, on desktop once the buy box is out of view. */
export function StickyBar({ cfg, visible, onAdd, onLead }: { cfg: Configurator; visible: boolean; onAdd: () => void; onLead: () => void }) {
  const t = useDict(PD);
  const tc = useDict(common);
  const l = useL();
  const lang = useLang();
  const p = cfg.product;
  const total = useTweenedNumber(cfg.total);
  const lead = !!p.quoteOnly || cfg.soldOut;
  const qtyText = `${num(cfg.qty, lang)} ${unitLabel(p.unit, lang)}${cfg.isPack ? ` · ${pieces(cfg.totalPieces, lang)}` : ''}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_40px_-24px_rgb(15_29_22/0.35)] backdrop-blur-xl"
        >
          <div className="container-x flex h-[76px] items-center gap-3 sm:gap-4">
            <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-sand sm:block">
              <Img src={p.images[0]} small alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="hidden truncate text-[14.5px] font-semibold text-ink sm:block">{keepUnits(l(p.name))}</div>
              {p.quoteOnly ? (
                <div className="truncate text-[13px] font-semibold text-brand-700 max-sm:text-[15px] max-sm:text-ink">{t('quoteOnly')}</div>
              ) : cfg.soldOut ? (
                <div className="truncate text-[13px] font-semibold text-red-700 max-sm:text-[15px]">{t('outStock')}</div>
              ) : (
                <>
                  <div className="text-[18px] font-bold leading-tight tabular-nums text-ink sm:hidden">{eur(total, lang, cfg.total)}</div>
                  <div className="truncate text-[12.5px] tabular-nums text-muted">
                    {qtyText}
                    {cfg.tierPct > 0 && <span className="font-semibold text-lime-ink"> · {pctOff(cfg.tierPct, lang)}</span>}
                    {cfg.installation && <span className="hidden md:inline"> · {tc('installation')}</span>}
                  </div>
                </>
              )}
            </div>
            {!lead && <div className="hidden shrink-0 text-right text-[22px] font-bold tabular-nums text-ink sm:block">{eur(total, lang, cfg.total)}</div>}
            <WishButton productId={p.id} tone="light" className="h-12! w-12! max-md:hidden!" />
            <button
              type="button"
              onClick={lead ? onLead : onAdd}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-[14.5px] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_10px_24px_-14px_var(--color-brand-700)] transition-[background,transform] hover:bg-brand-700 active:scale-[0.98] sm:px-7"
            >
              {p.quoteOnly ? <FileText className="h-[18px] w-[18px]" /> : cfg.soldOut ? <Mail className="h-[18px] w-[18px]" /> : <ShoppingBag className="h-[18px] w-[18px]" />}
              {p.quoteOnly ? t('requestQuote') : cfg.soldOut ? t('oosCta') : t('addToCart')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
