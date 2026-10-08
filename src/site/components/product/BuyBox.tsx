import { useState, type Ref } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, Banknote, Boxes, Check, Clock, FileCheck2, Gift, Heart, Mail, PackageX, Phone, Plus, RotateCcw, Share2, ShoppingBag, Stamp, Store, Truck, Zap } from 'lucide-react';
import type { Category, Product } from '@/lib/types';
import { WhatsAppIcon } from '@/components/brand/Social';
import { Img } from '@/components/ui/misc';
import { ProductBadges } from '@/site/components/ProductCard';
import { PieceChip } from '@/site/components/Price';
import { useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { common } from '@/i18n/common';
import { useUi } from '@/store/ui';
import { useCart, useSettings } from '@/store/hooks';
import { basePrice, defaultOptions, piecePrice } from '@/lib/pricing';
import { money, moneyPiece, num, pieces, unitLabel } from '@/lib/format';
import { cn, round2 } from '@/lib/utils';
import { PD, eur, keepUnits, pctOff } from './dict';
import { OptionPicker } from './OptionPicker';
import { QuantityPicker } from './QuantityPicker';
import { TierTable } from './TierTable';
import { useTweenedNumber, type Configurator } from './useConfigurator';

export function BuyBox({
  cfg,
  category,
  compatible,
  onAdd,
  onContact,
  ctaRef,
}: {
  cfg: Configurator;
  category?: Category;
  compatible: Product[];
  onAdd: () => void;
  onContact: () => void;
  ctaRef?: Ref<HTMLDivElement>;
}) {
  const t = useDict(PD);
  const l = useL();
  const p = cfg.product;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: l(p.name), url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t('linkCopied'));
      }
    } catch {
      /* dismissed or blocked — nothing to do */
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        {category ? (
          <Link to={`/produktet/${category.slug}`} className="eyebrow hover:text-brand-800">
            {l(category.name)}
          </Link>
        ) : (
          <span />
        )}
        <button type="button" onClick={share} className="-mr-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink">
          <Share2 className="h-3.5 w-3.5" /> {t('share')}
        </button>
      </div>
      <h1 className="display mt-3 text-balance text-[32px] leading-[1.02] text-ink sm:text-[40px] xl:text-[44px]">{keepUnits(l(p.name))}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <ProductBadges product={p} size="md" />
        <span className="text-[12.5px] font-medium text-muted">
          {t('sku')}: <span className="font-semibold tabular-nums text-ink-soft">{p.sku}</span>
        </span>
      </div>

      <PriceBlock cfg={cfg} />

      {l(p.short) && <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">{l(p.short)}</p>}
      <StockLine cfg={cfg} />

      <div className="my-6 h-px bg-line" />

      {cfg.soldOut ? (
        <OutOfStockPanel cfg={cfg} onContact={onContact} ctaRef={ctaRef} />
      ) : (
        <div className="space-y-4">
          <OptionPicker options={p.options} value={cfg.options} onChange={cfg.setOption} />
          <QuantityPicker cfg={cfg} />
          <TierTable cfg={cfg} />
          {cfg.canInstall && <LogoPrintCard cfg={cfg} />}
          <Summary cfg={cfg} onAdd={onAdd} ctaRef={ctaRef} />
        </div>
      )}

      <DeliveryPromise cfg={cfg} />
      {compatible.length > 0 && <FitsWith products={compatible} />}
      <HelpLine />
      <TrustRow />
    </div>
  );
}

/* ------------------------------------------------------------------ */
function PriceBlock({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const p = cfg.product;
  const sale = cfg.regularUnitPrice > cfg.baseUnitPrice;
  const chip = 'inline-flex h-7 items-center rounded-full border border-line bg-white px-3 text-[12.5px] font-semibold tabular-nums text-ink-soft';
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <span className={cn('display text-[46px] leading-[0.9] tabular-nums sm:text-[52px]', sale ? 'text-pink-ink' : 'text-ink')}>{money(cfg.baseUnitPrice, lang)}</span>
        {p.unit !== 'kom' && <span className="pb-1 text-[15px] font-semibold text-muted">/ {unitLabel(p.unit, lang)}</span>}
        {sale && <span className="pb-1 text-[16px] font-medium text-muted line-through tabular-nums">{money(cfg.regularUnitPrice, lang)}</span>}
        {sale && (
          <span className="mb-1 rotate-[-2deg] rounded-full bg-pink px-3 py-1 font-display text-[13px] font-bold text-white shadow-[0_8px_18px_-10px_var(--color-pink-ink)]">
            {t('save', { amount: money(round2(cfg.regularUnitPrice - cfg.baseUnitPrice), lang) })}
          </span>
        )}
      </div>
      {cfg.isPack && (
        <div className="mt-3.5 flex flex-wrap gap-2">
          <PieceChip product={p} value={cfg.basePiecePrice} className="h-7! px-3! text-[12.5px]!" />
          <span className={chip}>{t('packOf', { n: num(cfg.packSize, lang, 0) })}</span>
          {cfg.cartonPacks > 0 && <span className={chip}>{t('cartonInfo', { packs: cfg.cartonPacks, pieces: pieces(cfg.cartonPacks * cfg.packSize, lang) })}</span>}
        </div>
      )}
      <div className="mt-2.5 text-[12.5px] text-muted">{cfg.isPack ? t('vatIncl') : t('vatInclPiece')}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function StockLine({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const p = cfg.product;
  const tone = cfg.soldOut ? 'red' : cfg.lowStock ? 'amber' : 'green';
  const dot = { red: 'bg-red-500', amber: 'bg-amber-500', green: 'bg-emerald-500' }[tone];
  const ping = { red: '', amber: 'bg-amber-400', green: 'bg-emerald-400' }[tone];
  const text = cfg.soldOut
    ? t('outStock')
    : cfg.lowStock
      ? t('lowStock', { n: p.stock })
      : p.stock < 999
        ? cfg.isPack || p.unit === 'pack'
          ? t('inStockN', { n: num(p.stock, lang, 0) })
          : t('unitsInStock', { n: num(p.stock, lang, 0) })
        : t('inStock');
  return (
    <div className={cn('mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold', { red: 'text-red-700', amber: 'text-amber-700', green: 'text-emerald-700' }[tone])}>
      <span className="relative flex h-2.5 w-2.5">
        {ping && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', ping)} />}
        <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', dot)} />
      </span>
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function LogoPrintCard({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const ts = useDict(site);
  const tc = useDict(common);
  const lang = useLang();
  const p = cfg.product;
  const price = p.installation!.price;
  const on = cfg.installation;
  return (
    <label
      className={cn(
        'relative block cursor-pointer rounded-3xl border p-4 transition-all duration-300 select-none sm:p-5',
        on ? 'border-brand-600 bg-brand-50/70 shadow-[0_0_0_1px_var(--color-brand-600)]' : 'border-line bg-white hover:border-ink/25',
      )}
    >
      <input type="checkbox" className="peer sr-only" checked={on} onChange={(e) => cfg.setInstallation(e.target.checked)} />
      <span className="flex gap-3.5">
        <span
          aria-hidden
          className={cn(
            'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-brand-600/20',
            on ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink/25 bg-white',
          )}
        >
          <Check className={cn('h-3.5 w-3.5 transition-transform', on ? 'scale-100' : 'scale-0')} strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className="inline-flex items-center gap-2 text-[15px] font-bold text-ink">
              <Stamp className="h-4 w-4 text-brand-600" />
              {ts('addInstallation')}
            </span>
            <span className="text-[13.5px] font-semibold tabular-nums text-ink">
              +{money(price, lang)} <span className="font-medium text-muted">{t('perPack')}</span>
            </span>
          </span>
          <span className="mt-1.5 block text-[13px] leading-snug text-muted">{t('installText')}</span>
          <span className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-ink-soft ring-1 ring-inset ring-line">
              <Boxes className="h-3.5 w-3.5 text-brand-600" /> {t('installMin', { packs: cfg.printMinQty, pieces: pieces(cfg.printMinQty * cfg.packSize, lang) })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-ink-soft ring-1 ring-inset ring-line">
              <Clock className="h-3.5 w-3.5 text-brand-600" /> {t('installLead')}
            </span>
          </span>
          <AnimatePresence initial={false}>
            {on && (
              <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="block overflow-hidden">
                <span className="mt-3.5 block space-y-2 border-t border-brand-600/15 pt-3.5 text-[12.5px] leading-snug">
                  {cfg.printRaised && (
                    <span className="flex items-start gap-2 rounded-xl bg-lime-soft px-3 py-2 font-semibold text-lime-ink">
                      <Boxes className="mt-px h-3.5 w-3.5 shrink-0" /> {t('installRaised')}
                    </span>
                  )}
                  <span className="flex items-start gap-2 text-ink-soft">
                    <Mail className="mt-px h-3.5 w-3.5 shrink-0 text-brand-600" /> {t('installContact')}
                  </span>
                  <span className="flex items-center justify-between gap-2 font-bold tabular-nums text-brand-700">
                    <span className="font-semibold text-muted">{tc('installation')}</span>
                    {cfg.qty} × {money(price, lang)} = +{money(cfg.installationTotal, lang)}
                  </span>
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
function Summary({ cfg, onAdd, ctaRef }: { cfg: Configurator; onAdd: () => void; ctaRef?: Ref<HTMLDivElement> }) {
  const t = useDict(PD);
  const lang = useLang();
  const p = cfg.product;
  const total = useTweenedNumber(cfg.total);
  const [justAdded, setJustAdded] = useState(false);
  const effPiece = cfg.totalPieces ? cfg.total / cfg.totalPieces : 0;

  const add = () => {
    onAdd();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="rounded-3xl bg-ink p-5 text-paper shadow-[0_30px_60px_-30px_rgb(15_29_22/0.6)] sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-paper/55">{t('total')}</div>
          <div className="mt-2 space-y-0.5 text-[13px] leading-snug text-paper/70">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
              <span>
                {num(cfg.qty, lang)} {unitLabel(p.unit, lang)} × {money(cfg.unitPrice, lang)}
              </span>
              {cfg.tierPct > 0 && <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-ink">{t('tierBadge', { pct: pctOff(cfg.tierPct, lang) })}</span>}
            </div>
            <AnimatePresence initial={false}>
              {cfg.installation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden tabular-nums">
                  + {t('logoLine', { qty: cfg.qty, price: money(cfg.installationUnit, lang) })}
                </motion.div>
              )}
            </AnimatePresence>
            {cfg.isPack && <div className="tabular-nums">{t('piecesLine', { pieces: pieces(cfg.totalPieces, lang), price: moneyPiece(effPiece, lang) })}</div>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[30px] font-bold leading-none tracking-tight tabular-nums sm:text-[34px]">{eur(total, lang, cfg.total)}</div>
          {cfg.tierSaving > 0 && <div className="mt-1.5 text-[12px] font-bold tabular-nums text-lime">{t('youSave', { amount: money(cfg.tierSaving, lang) })}</div>}
        </div>
      </div>
      <div ref={ctaRef} className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={add}
          className="relative inline-flex h-14 flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-full bg-brand-600 px-6 text-[15.5px] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] transition-[background,transform] duration-200 hover:bg-brand-500 active:scale-[0.98]"
        >
          <AnimatePresence mode="wait" initial={false}>
            {justAdded ? (
              <motion.span key="ok" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} className="inline-flex items-center gap-2.5">
                <Check className="h-5 w-5" strokeWidth={2.6} /> {t('addedShort')}
              </motion.span>
            ) : (
              <motion.span key="add" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} className="inline-flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5" /> {t('addToCart')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <WishButton productId={p.id} />
      </div>
    </div>
  );
}

export function WishButton({ productId, tone = 'dark', className }: { productId: string; tone?: 'dark' | 'light'; className?: string }) {
  const t = useDict(PD);
  const wish = useUi((s) => s.wishlist.includes(productId));
  const toggle = useUi((s) => s.toggleWishlist);
  return (
    <button
      type="button"
      onClick={() => {
        toggle(productId);
        toast(wish ? t('wishRemoved') : t('wishAdded'), { icon: <Heart className="h-4 w-4 fill-pink text-pink" /> });
      }}
      aria-pressed={wish}
      aria-label={wish ? t('wishRemove') : t('wishAdd')}
      title={wish ? t('wishRemove') : t('wishAdd')}
      className={cn(
        'grid h-14 w-14 shrink-0 place-items-center rounded-full transition-all duration-200 active:scale-95',
        tone === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'border border-line bg-white text-ink hover:border-ink/30',
        wish && (tone === 'dark' ? 'bg-white text-pink hover:bg-white' : 'border-pink/30 bg-pink-soft text-pink'),
        className,
      )}
    >
      <motion.span key={String(wish)} initial={{ scale: wish ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
        <Heart className={cn('h-5 w-5', wish && 'fill-current')} />
      </motion.span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
function OutOfStockPanel({ cfg, onContact, ctaRef }: { cfg: Configurator; onContact: () => void; ctaRef?: Ref<HTMLDivElement> }) {
  const t = useDict(PD);
  return (
    <div className="rounded-3xl bg-ink p-5 text-paper shadow-[0_30px_60px_-30px_rgb(15_29_22/0.6)] sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-pink/15 text-pink">
          <PackageX className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[15px] font-bold">{t('oosTitle')}</span>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-paper/70">{t('oosText')}</p>
      <div ref={ctaRef} className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={onContact}
          className="inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-brand-600 px-6 text-[15.5px] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] transition-[background,transform] duration-200 hover:bg-brand-500 active:scale-[0.98]"
        >
          <Mail className="h-5 w-5" /> {t('oosCta')}
        </button>
        <WishButton productId={cfg.product.id} />
      </div>
      <a href="#alternativat" className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 text-[14px] font-semibold text-paper/90 transition-colors hover:bg-white/10">
        {t('oosAlt')} <ArrowDown className="h-4 w-4" />
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/** "1–2" + "1–3" → "1–3": widest day range across zones. */
function dayRange(days: string[]) {
  const nums = days.flatMap((d) => d.split(/[–-]/).map((x) => parseInt(x, 10))).filter((n) => Number.isFinite(n));
  if (!nums.length) return '';
  const a = Math.min(...nums);
  const b = Math.max(...nums);
  return a === b ? String(a) : `${a}–${b}`;
}

function DeliveryPromise({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const settings = useSettings();
  const cart = useCart();
  const zones = settings.shippingZones;
  const fast = zones[0];
  const rest = zones.slice(1);
  const threshold = cart.freeShippingThreshold ?? settings.freeShippingThreshold;
  const withThis = cart.subtotal - cart.productDiscount + (cfg.soldOut ? 0 : cfg.goodsTotal);
  const remaining = threshold > 0 ? Math.max(0, round2(threshold - withThis)) : 0;
  const progress = threshold > 0 ? Math.min(1, withThis / threshold) : 1;

  const rows = [
    fast && { icon: Zap, text: fast.days.trim() === '1' ? t('deliveryFast', { zone: fast.name }) : t('deliveryZone', { zone: fast.name, days: fast.days }) },
    rest.length > 0 && { icon: Truck, text: t('deliveryKosovo', { days: dayRange(rest.map((z) => z.days)) }) },
    { icon: Store, text: t('pickupLine'), sub: settings.pickupAddress },
  ].filter(Boolean) as { icon: typeof Truck; text: string; sub?: string }[];

  return (
    <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-line sm:p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{t('deliveryTitle')}</div>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <li key={i} className="flex items-start gap-3 text-[13.5px]">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span className="min-w-0">
                <span className="font-semibold text-ink">{r.text}</span>
                {r.sub && <span className="block text-[12.5px] text-muted">{r.sub}</span>}
              </span>
            </li>
          );
        })}
      </ul>
      {threshold > 0 && (
        <div className="mt-4 border-t border-dashed border-line pt-3.5">
          <div className="flex items-center justify-between gap-3 text-[12.5px]">
            <span className={cn('font-semibold', remaining === 0 ? 'text-brand-700' : 'text-ink-soft')}>
              {remaining === 0 ? t('freeReached') : t('freeLeft', { amount: money(remaining, lang) })}
            </span>
            <span className="shrink-0 text-muted">{t('freeOver', { amount: money(threshold, lang, { decimals: threshold % 1 !== 0 }) })}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
            <div className={cn('h-full rounded-full transition-[width] duration-500', remaining === 0 ? 'bg-brand-600' : 'bg-lime')} style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
          {cfg.installation && <p className="mt-2 text-[12px] text-muted">{t('printNoFree')}</p>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function FitsWith({ products }: { products: Product[] }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const addToCart = useUi((s) => s.addToCart);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const [added, setAdded] = useState<string | null>(null);
  const list = products.slice(0, 3);

  const quick = (x: Product) => {
    addToCart({ productId: x.id, qty: 1, options: defaultOptions(x), installation: false });
    setAdded(x.id);
    window.setTimeout(() => setAdded((v) => (v === x.id ? null : v)), 1500);
    toast.success(t('added'), { description: `${l(x.name)} · 1 ${unitLabel(x.unit, lang)}`, action: { label: t('viewCart'), onClick: () => setCartOpen(true) } });
  };

  return (
    <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-line sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{t('fitsTitle')}</div>
        {products.length > list.length && (
          <a href="#pershtatet" className="text-[12.5px] font-semibold text-brand-700 hover:text-brand-800">
            {t('fitsAll')} ({products.length})
          </a>
        )}
      </div>
      <ul className="mt-3 divide-y divide-line/70">
        {list.map((x) => {
          const out = x.stock <= 0 || x.quoteOnly;
          return (
            <li key={x.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <Link to={`/produkt/${x.slug}`} className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-sand ring-1 ring-inset ring-ink/5">
                <Img src={x.images[0]} small alt="" className="h-full w-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/produkt/${x.slug}`} className="line-clamp-1 text-[13.5px] font-semibold text-ink hover:text-brand-700">
                  {keepUnits(l(x.name))}
                </Link>
                <div className="mt-0.5 text-[12px] tabular-nums text-muted">
                  <span className="font-bold text-ink">{money(basePrice(x), lang)}</span> / {unitLabel(x.unit, lang)}
                  {x.unit === 'pack' && x.packSize ? ` · ${t('perPiece', { price: moneyPiece(piecePrice(x), lang) })}` : ''}
                </div>
              </div>
              {!out && (
                <button
                  type="button"
                  onClick={() => quick(x)}
                  aria-label={t('quickAdd')}
                  title={t('quickAdd')}
                  className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors', added === x.id ? 'bg-brand-600 text-white' : 'border border-line text-ink hover:border-ink hover:bg-ink hover:text-white')}
                >
                  {added === x.id ? <Check className="h-4 w-4" strokeWidth={2.6} /> : <Plus className="h-4 w-4" />}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function HelpLine() {
  const t = useDict(PD);
  const settings = useSettings();
  const wa = settings.whatsapp?.replace(/[^\d]/g, '');
  return (
    <div className="mt-5 flex items-center justify-between gap-3 px-1">
      <span className="min-w-0 text-[13px] leading-snug">
        <span className="block font-bold text-ink">{t('help')}</span>
        <span className="block text-muted">{t('helpText')}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-[13px]">
        <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 font-semibold text-ink transition-colors hover:border-ink/30 max-[400px]:hidden">
          <Phone className="h-3.5 w-3.5" /> {settings.phone}
        </a>
        <a href={`tel:${settings.phone.replace(/\s/g, '')}`} aria-label={settings.phone} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink min-[401px]:hidden">
          <Phone className="h-3.5 w-3.5" />
        </a>
        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full bg-[#25d366] text-white transition-transform hover:scale-105">
            <WhatsAppIcon className="h-[18px] w-[18px]" />
          </a>
        )}
      </span>
    </div>
  );
}

function TrustRow() {
  const t = useDict(PD);
  const settings = useSettings();
  const items = [
    { icon: Gift, title: t('trust_samples'), text: t('trust_samplesText'), to: '/sherbimet' },
    { icon: RotateCcw, title: t('trust_returns'), text: t('trust_returnsText') },
    settings.payments.cod ? { icon: Banknote, title: t('trust_cod'), text: t('trust_codText') } : null,
    { icon: FileCheck2, title: t('trust_invoice'), text: t('trust_invoiceText') },
  ].filter(Boolean) as { icon: typeof Gift; title: string; text: string; to?: string }[];
  return (
    <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line">
      {items.slice(0, 4).map((it, i) => {
        const Icon = it.icon;
        const inner = (
          <>
            <Icon className="h-5 w-5 shrink-0 text-brand-600" />
            <span className="min-w-0">
              <span className="block text-[13px] font-bold leading-tight text-ink">{it.title}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">{it.text}</span>
            </span>
          </>
        );
        const cls = 'flex items-start gap-3 bg-white p-3.5 sm:p-4';
        return it.to ? (
          <Link key={i} to={it.to} className={cn(cls, 'transition-colors hover:bg-paper')}>
            {inner}
          </Link>
        ) : (
          <div key={i} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

