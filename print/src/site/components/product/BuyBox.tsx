import { useState, type ReactNode, type Ref } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { BadgeCheck, CalendarClock, Check, Clock, FileCheck2, Heart, Phone, ReceiptText, Share2, ShoppingBag, Truck } from 'lucide-react';
import type { Category } from '@/lib/types';
import { WhatsAppIcon } from '@/components/brand/Social';
import { ProductBadges } from '@/site/components/ProductCard';
import { useDict, useL, useLang } from '@/i18n';
import { useUi } from '@/store/ui';
import { useSettings } from '@/store/hooks';
import { money } from '@/lib/format';
import { cn, round2 } from '@/lib/utils';
import { href } from '@/lib/paths';
import { ChevronTexture } from '@/site/components/company/Print';
import { PD, eur } from './dict';
import { OptionPicker } from './OptionPicker';
import { QuantityPicker } from './QuantityPicker';
import { ArtworkPicker } from './ArtworkPicker';
import { QuoteForm } from './QuoteForm';
import { addWorkingDays, fromUnitPrice, qtyText, shortDay, unitMoney } from './print';
import { useTweenedNumber, type Configurator } from './useConfigurator';

export function BuyBox({ cfg, category, onAdd, ctaRef, artError }: { cfg: Configurator; category?: Category; onAdd: () => void; ctaRef?: Ref<HTMLDivElement>; artError?: boolean }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
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

  let step = 0;
  const next = () => String(++step).padStart(2, '0');

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
      <h1 className="display mt-3 text-[32px] leading-[1.04] text-ink sm:text-[40px] xl:text-[44px]">{l(p.name)}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <ProductBadges product={p} />
        <span className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted">
          {t('sku')} <span className="text-ink-soft">{p.sku}</span>
        </span>
      </div>
      {l(p.short) && <p className="mt-4 text-[15.5px] leading-relaxed text-ink-soft">{l(p.short)}</p>}
      <FactRow cfg={cfg} />

      <div className="my-7 h-px bg-line" />

      {p.quoteOnly ? (
        <QuotePanel cfg={cfg} ctaRef={ctaRef} />
      ) : (
        <div className="space-y-7">
          {p.options.length > 0 && (
            <Step n={next()} title={t('step_options')}>
              <OptionPicker options={p.options} value={cfg.options} onChange={cfg.setOption} perPiece={cfg.run} />
            </Step>
          )}
          <Step n={next()} title={t('step_qty')} aside={cfg.run ? t('qtyRule', { min: qtyText(cfg.rules.min, lang), step: qtyText(cfg.rules.step, lang) }) : undefined}>
            <QuantityPicker cfg={cfg} />
          </Step>
          {cfg.needsArtwork && (
            <Step n={next()} title={t('step_art')} id="hap-skedari">
              <ArtworkPicker cfg={cfg} showError={artError} />
            </Step>
          )}
          <Summary cfg={cfg} onAdd={onAdd} ctaRef={ctaRef} />
        </div>
      )}

      <HelpLine />
      <TrustRow />
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Step({ n, title, aside, children, id }: { n: string; title: string; aside?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 className="flex items-baseline gap-2.5 text-[15px] font-semibold text-ink">
          <span className="font-mono text-[11px] font-medium text-brand-600">{n}</span>
          {title}
        </h2>
        {aside && <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
function FactRow({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const p = cfg.product;
  const chip = 'inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[12px] font-medium text-ink-soft ring-1 ring-line';
  const days = p.leadDays ?? 0;
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {cfg.rules.min > 1 && (
        <span className={chip}>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{t('spec_moq')}</span>
          <span className="font-mono tabular-nums text-ink">{t('pcsValue', { n: qtyText(cfg.rules.min, lang) })}</span>
        </span>
      )}
      {days > 0 && (
        <span className={chip}>
          <Clock className="h-3.5 w-3.5 text-brand-600" />
          {cfg.run || p.quoteOnly ? t('daysAfterProof', { n: days }) : t('shipsBy')}
        </span>
      )}
      {(cfg.needsArtwork || p.quoteOnly) && (
        <span className={chip}>
          <FileCheck2 className="h-3.5 w-3.5 text-brand-600" />
          {t('trust_proof')}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Summary({ cfg, onAdd, ctaRef }: { cfg: Configurator; onAdd: () => void; ctaRef?: Ref<HTMLDivElement> }) {
  const t = useDict(PD);
  const lang = useLang();
  const settings = useSettings();
  const p = cfg.product;
  const unit = useTweenedNumber(cfg.unitPrice, 0.45);
  const total = useTweenedNumber(cfg.total);
  const [justAdded, setJustAdded] = useState(false);
  const net = settings.pricesIncludeVat === false;
  const vat = net ? round2((cfg.total * settings.vatRate) / 100) : 0;
  const days = p.leadDays ?? 0;
  const ready = days > 0 ? addWorkingDays(days + 1) : null;

  const add = () => {
    onAdd();
    if (cfg.missingFile) return;
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="relative isolate overflow-hidden rounded-3xl bg-ink p-5 text-paper shadow-[0_30px_60px_-30px_rgba(18,16,20,0.6)] sm:p-6">
      <ChevronTexture opacity={0.035} />
      {cfg.run && (
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/50">{t('unitPrice')}</div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-[30px] font-semibold leading-none tracking-tight tabular-nums">{unitMoney(round2(unit * 1000) / 1000, lang)}</span>
              <span className="text-[13px] text-paper/55">{t('perPiece')}</span>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {cfg.savePct > 0 && (
              <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-full bg-brand-600 px-2.5 py-1 font-mono text-[11px] font-medium text-white">
                −{cfg.savePct}%
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}

      <dl className={cn('space-y-1.5 text-[13px]', cfg.run ? 'pt-4' : '')}>
        <div className="flex justify-between gap-4 text-paper/70">
          <dt className="font-mono tabular-nums">
            {qtyText(cfg.qty, lang)} {cfg.run ? t('pieces') : t(`unit_${p.unit === 'set' ? 'set' : 'kom'}`).toLowerCase()} × {cfg.run ? unitMoney(cfg.unitPrice, lang) : money(cfg.unitPrice, lang)}
          </dt>
          <dd className="font-mono tabular-nums text-paper">{money(cfg.goodsTotal, lang)}</dd>
        </div>
        <AnimatePresence initial={false}>
          {cfg.designTotal > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-between gap-4 overflow-hidden text-paper/70">
              <dt>+ {t('designFee')}</dt>
              <dd className="font-mono tabular-nums text-paper">{money(cfg.designTotal, lang)}</dd>
            </motion.div>
          )}
        </AnimatePresence>
      </dl>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="text-[13px] font-semibold text-paper/80">{net ? t('total') : t('totalGross')}</div>
        <div className="text-right text-[30px] font-semibold leading-none tracking-tight tabular-nums sm:text-[34px]">{eur(total, lang, cfg.total)}</div>
      </div>
      <div className="mt-1.5 text-right font-mono text-[10.5px] tabular-nums text-paper/50">
        {net ? t('vatLine', { rate: settings.vatRate, vat: money(vat, lang), gross: money(round2(cfg.total + vat), lang) }) : t('vatIncluded', { rate: settings.vatRate })}
      </div>
      {cfg.run && cfg.savePct > 0 && <p className="mt-3 text-[12.5px] text-brand-200">{t('youSave', { pct: cfg.savePct })}</p>}

      <div ref={ctaRef} className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={add}
          className="relative inline-flex h-14 flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-full bg-brand-600 px-6 text-[15.5px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] transition-[background,transform] duration-200 hover:bg-brand-500 active:scale-[0.98]"
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[12px] text-paper/60">
        {ready && cfg.run ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-brand-300" />
            <span>
              {t('readyBy', { date: shortDay(ready, lang) })} <span className="text-paper/40">· {t('readyByNote', { days })}</span>
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-brand-300" /> {t('shipsBy')}
          </span>
        )}
        {cfg.needsArtwork && (
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5 text-brand-300" /> {t('proofFree')}
          </span>
        )}
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
        toast(wish ? t('wishRemoved') : t('wishAdded'), { icon: <Heart className="h-4 w-4 fill-brand-600 text-brand-600" /> });
      }}
      aria-pressed={wish}
      aria-label={wish ? t('wishRemove') : t('wishAdd')}
      title={wish ? t('wishRemove') : t('wishAdd')}
      className={cn(
        'grid h-14 w-14 shrink-0 place-items-center rounded-full transition-all duration-200 active:scale-95',
        tone === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'border border-line bg-white text-ink hover:border-ink/30',
        wish && (tone === 'dark' ? 'bg-white text-brand-600 hover:bg-white' : 'border-brand-200 bg-brand-50 text-brand-600'),
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
function QuotePanel({ cfg, ctaRef }: { cfg: Configurator; ctaRef?: Ref<HTMLDivElement> }) {
  const t = useDict(PD);
  const lang = useLang();
  const p = cfg.product;
  const steps = [t('quoteStep1'), t('quoteStep2'), t('quoteStep3')];
  return (
    <div className="space-y-6">
      <div className="relative isolate overflow-hidden rounded-3xl bg-ink p-5 text-paper sm:p-6">
        <ChevronTexture opacity={0.035} />
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-300">{t('quoteOnly')}</div>
        {p.price > 0 && <div className="mt-2 text-[13px] text-paper/60">{t('quoteIndicative', { price: unitMoney(fromUnitPrice(p), lang), n: qtyText(cfg.rules.min, lang) })}</div>}
        <p className="mt-3 text-[14px] leading-relaxed text-paper/75">{t('quoteLead')}</p>
        <ol className="mt-5 grid gap-2.5 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={i} className="rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10">
              <span className="font-mono text-[11px] text-brand-300">{String(i + 1).padStart(2, '0')}</span>
              <span className="mt-1 block text-[13px] font-semibold leading-snug">{s}</span>
            </li>
          ))}
        </ol>
      </div>
      {p.options.length > 0 && <OptionPicker options={p.options} value={cfg.options} onChange={cfg.setOption} perPiece={false} />}
      <div ref={ctaRef} id="rfq" className="scroll-mt-28">
        <QuoteForm product={p} options={cfg.options} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function HelpLine() {
  const t = useDict(PD);
  const settings = useSettings();
  const wa = settings.whatsapp?.replace(/[^\d]/g, '');
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1">
      <span className="min-w-0 text-[13px] leading-snug">
        <span className="block font-semibold text-ink">{t('help')}</span>
        <span className="block text-muted">{t('helpText')}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-[13px]">
        <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 font-semibold tabular-nums text-ink transition-colors hover:border-ink/30">
          <Phone className="h-3.5 w-3.5" /> {settings.phone}
        </a>
        {wa && (
          <a href={href(`https://wa.me/${wa}`)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full bg-[#25d366] text-white transition-transform hover:scale-105">
            <WhatsAppIcon className="h-[18px] w-[18px]" />
          </a>
        )}
      </span>
    </div>
  );
}

function TrustRow() {
  const t = useDict(PD);
  const lang = useLang();
  const settings = useSettings();
  const items = [
    { icon: FileCheck2, title: t('trust_proof'), text: t('trust_proofText') },
    { icon: BadgeCheck, title: t('trust_quality'), text: t('trust_qualityText') },
    { icon: Truck, title: t('trust_delivery', { amount: money(settings.freeShippingThreshold, lang, { decimals: false }) }), text: t('trust_deliveryText') },
    { icon: ReceiptText, title: t('trust_pay'), text: t('trust_payText') },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <div key={i} className="flex items-start gap-3 bg-white p-3.5 sm:p-4">
            <Icon className="h-[18px] w-[18px] shrink-0 text-brand-600" />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-tight text-ink">{it.title}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">{it.text}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
