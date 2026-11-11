import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight, FileCheck2, Loader2, ShoppingBag } from 'lucide-react';
import type { ArtworkRef } from '@/lib/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { site } from '@/i18n/site';
import { useUi } from '@/store/ui';
import { useActiveProducts } from '@/store/hooks';
import { money } from '@/lib/format';
import { optionsLabel, unitPrice } from '@/lib/pricing';
import { cn, round2 } from '@/lib/utils';
import { href } from '@/lib/paths';
import { defaultQty, qtyRules, qtyText, snapQty, tierRows, unitMoney } from '@/site/components/product/print';
import { matchProduct, SD, studioApi, type StudioConfig } from '@/site/components/studio/model';

/** Query parameters the product pages pass on to the studio (see studioHref). */
const PASS = ['paper', 'size', 'handle', 'finish', 'sample'];

/**
 * 3D bag studio. The studio itself is a separate page (studio.html, src/studio/studio.js) shown in an iframe, so
 * three.js is only loaded here. It reports the design through postMessage; this page prices it from the catalogue
 * and adds it to the cart with a picture of the bag and a prepress note as the line's artwork.
 */
export default function Studio3D() {
  const t = useDict(SD);
  const tc = useDict(common);
  const ts = useDict(site);
  const l = useL();
  const lang = useLang();
  usePageTitle(t('title'));
  const [params] = useSearchParams();
  const products = useActiveProducts();
  const addToCart = useUi((s) => s.addToCart);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const frame = useRef<HTMLIFrameElement>(null);
  const [cfg, setCfg] = useState<StudioConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [qty, setQty] = useState(0);
  const [adding, setAdding] = useState(false);

  // Fixed for the life of the page: changing the iframe's address would reload the studio and lose the design.
  const [src] = useState(() => {
    const q = new URLSearchParams({ lang });
    for (const k of PASS) {
      const v = params.get(k);
      if (v) q.set(k, v);
    }
    return href(`/studio.html?${q.toString()}`);
  });

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { source?: string; type?: string; config?: StudioConfig } | null;
      if (!d || d.source !== 'pw-studio') return;
      if (d.type === 'ready') setReady(true);
      if (d.config) setCfg(d.config);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // The studio follows the storefront's language switch without reloading.
  useEffect(() => {
    if (ready) studioApi(frame.current)?.setLang(lang);
  }, [lang, ready]);

  const match = useMemo(() => (cfg ? matchProduct(cfg, products) : null), [cfg, products]);
  const product = match?.product;
  const options = match?.options;
  const rules = useMemo(() => (product ? qtyRules(product) : null), [product]);
  const tiers = useMemo(() => (product && options ? tierRows(product, options) : []), [product, options]);

  // A new product (e.g. art paper → kraft) has its own minimum and quantity breaks.
  const productId = product?.id;
  useEffect(() => {
    if (product && rules) setQty((q) => (q > 0 && tierRows(product, {}).some((r) => r.qty === q) ? q : snapQty(defaultQty(product), rules)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const unit = product && options && qty > 0 ? unitPrice(product, options, qty) : 0;
  const total = round2(unit * qty);

  const add = () => {
    const api = studioApi(frame.current);
    if (!api || !product || !options || !rules) {
      toast.error(t('notReady'));
      return;
    }
    setAdding(true);
    try {
      const design = api.getConfig();
      const thumb = api.snapshot(320);
      // A unique name per design: lines with different artwork must not merge in the cart.
      const name = `${t('fileName')}-${design.size.toLowerCase()}-${Date.now().toString(36).slice(-4)}.jpg`;
      const artwork: ArtworkRef = { status: 'uploaded', name, size: Math.round(thumb.length * 0.75), thumb, note: design.spec, studio: true };
      const n = snapQty(qty, rules);
      addToCart({ productId: product.id, qty: n, options, installation: false, artwork });
      toast.success(t('added'), {
        description: `${l(product.name)} · ${qtyText(n, lang)} ${t('pieces')} · ${money(round2(unitPrice(product, options, n) * n), lang)} ${tc('exclVat')}`,
        action: { label: t('viewCart'), onClick: () => setCartOpen(true) },
      });
      setCartOpen(true);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-paper pb-20 sm:pb-28">
      {/* Kept short on purpose: on a laptop the whole studio and its order bar fit on the first screen. */}
      <div className="container-x pt-5 sm:pt-6">
        <Breadcrumbs items={[{ label: ts('nav_products'), to: '/produktet' }, { label: t('nav') }]} />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-10 gap-y-2">
          <h1 className="display text-[28px] leading-[1.05] text-ink sm:text-[36px]">{t('title')}</h1>
          <p className="max-w-[560px] text-[13.5px] leading-relaxed text-ink-soft">{t('sub')}</p>
        </div>
      </div>

      <div className="container-x mt-5">
        <div className="overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_30px_60px_-40px_rgb(18_16_20/0.35)] sm:rounded-[28px]">
          <div className="relative h-[86dvh] max-h-[860px] min-h-[540px] bg-[#ecebef] lg:h-[clamp(520px,calc(100dvh-340px),780px)] lg:max-h-none lg:min-h-0">
            {!ready && (
              <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                <span className="inline-flex items-center gap-2.5 rounded-full bg-white/90 px-4 py-2 text-[13px] font-medium text-ink-soft shadow-sm ring-1 ring-line">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> {t('loading')}
                </span>
              </div>
            )}
            <iframe ref={frame} src={src} title={t('frameTitle')} className="absolute inset-0 block h-full w-full border-0" allow="fullscreen" />
          </div>

          {/* Order bar: the design priced as a catalogue product */}
          <div className="border-t border-line bg-white px-4 py-4 sm:px-6 sm:py-5">
            {product && options && rules ? (
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-8">
                <div className="min-w-0 xl:w-[300px] xl:shrink-0">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{t('orderedAs')}</div>
                  <Link to={`/produkt/${product.slug}`} className="link-u mt-0.5 inline-block text-[15.5px] font-semibold text-ink">
                    {l(product.name)}
                  </Link>
                  <div className="mt-0.5 truncate text-[12.5px] text-muted" title={optionsLabel(product, options, lang)}>
                    {optionsLabel(product, options, lang)}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{t('qty')}</div>
                  <div className="no-scrollbar -mx-1 mt-1.5 flex gap-1.5 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label={t('qty')}>
                    {tiers.map((r) => (
                      <button
                        key={r.qty}
                        type="button"
                        role="radio"
                        aria-checked={r.qty === qty}
                        onClick={() => setQty(r.qty)}
                        className={cn(
                          'shrink-0 rounded-xl border px-3 py-1.5 text-left transition-colors',
                          r.qty === qty ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink/35',
                        )}
                      >
                        <span className="block font-mono text-[13px] font-medium tabular-nums">{qtyText(r.qty, lang)}</span>
                        <span className={cn('block font-mono text-[10.5px] tabular-nums', r.qty === qty ? 'text-white/70' : 'text-muted')}>{unitMoney(r.unit, lang)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 xl:shrink-0 xl:justify-end">
                  <div className="text-right max-xl:text-left">
                    <div className="font-mono text-[12px] tabular-nums text-muted">
                      {unitMoney(unit, lang)} {t('perPiece')}
                    </div>
                    <div className="display text-[26px] leading-none tabular-nums text-ink">{money(total, lang)}</div>
                    <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">
                      {t('total')} · {tc('exclVat')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ButtonLink to="/kerko-oferte" variant="outline" className="max-sm:hidden">
                      {t('quote')}
                    </ButtonLink>
                    <Button onClick={add} loading={adding} disabled={!ready} icon={<ShoppingBag className="h-4 w-4" />}>
                      {t('add')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-2xl text-[14px] text-ink-soft">{cfg ? t('quoteOnly') : t('loading')}</p>
                <ButtonLink to="/kerko-oferte" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('quote')}
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 text-[13px] text-muted">
          <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {t('proofNote')}
        </p>
      </div>

      <div className="container-x mt-14 sm:mt-20">
        <ol className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {([1, 2, 3] as const).map((n) => (
            <li key={n} className="rounded-2xl border border-line bg-white p-6">
              <span className="font-mono text-[11px] font-medium text-brand-600">0{n}</span>
              <h2 className="display mt-2 text-[21px] text-ink">{t(`step${n}`)}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{t(`step${n}Text`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
