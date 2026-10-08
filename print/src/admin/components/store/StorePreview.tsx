// Mini storefront that shows the theme settings BEFORE they are saved (logo, brand colour, fonts, spacing).
// It sits inside the neutral CMS, so the PrintWorks site tokens + brand scale are restored locally (storefrontVars).
import { useMemo } from 'react';
import { ArrowRight, Search, ShoppingBag } from 'lucide-react';
import type { Lang, Product } from '@/lib/types';
import { lt } from '@/i18n';
import { site } from '@/i18n/site';
import { Accent, plain } from '@/components/ui/misc';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { useDb } from '@/store/db';
import { usePlacements } from '@/store/hooks';
import { basePrice } from '@/lib/pricing';
import { money } from '@/lib/format';
import { thumb } from '@/lib/utils';
import { DENSITY, FONT_PAIRS, accentLast, storefrontVars, type LogoVariant, type StoreTheme } from './theme';
import { objectPos, type PlacementX } from './placements';

/** Lowest quantity-tier price (what the storefront cards show as "nga €0,27 / copë"). */
const fromPrice = (p: Product) => (p.tiers?.length ? Math.min(...p.tiers.map((x) => x.price)) : basePrice(p));

export function ThemeLogo({ variant, dark }: { variant: LogoVariant; dark?: boolean }) {
  if (variant === 'mark') return <LogoMark tone={dark ? 'light' : 'dark'} />;
  if (variant === 'mono') return <Logo tone={dark ? 'mono-light' : 'mono-dark'} />;
  return <Logo tone={dark ? 'light' : 'dark'} />;
}

export function StorePreview({ brand, theme, lang, words }: { brand: string; theme: StoreTheme; lang: Lang; words: { eyebrow: string; text: string; cta: string; cta2: string; badge: string } }) {
  const settings = useDb((s) => s.settings);
  const products = useDb((s) => s.products);
  const hero = usePlacements('home-hero')[0] as PlacementX | undefined;
  const bar = usePlacements('bar')[0];
  const picks = useMemo(
    () =>
      products
        .filter((p) => p.status === 'active' && p.images[0] && !p.quoteOnly)
        .sort((a, b) => Number(b.featured) - Number(a.featured) || b.sold - a.sold)
        .slice(0, 2),
    [products],
  );
  const d = DENSITY[theme.density];
  const f = FONT_PAIRS[theme.font];
  const nav = site[lang];
  const logoH = Math.round(theme.logoSize * 0.62);
  const heroImage = hero?.image || '/images/misc/production.webp';

  return (
    <div style={{ ...storefrontVars(brand), ...f.body }} className="pointer-events-none select-none overflow-hidden rounded-xl border border-black/10 bg-white text-ink shadow-[0_18px_40px_-26px_rgb(0_0_0/0.5)]" aria-hidden>
      {/* announcement bar */}
      <div className="truncate bg-ink px-3 py-1.5 text-center text-[10px] font-medium text-white">{bar ? lt(bar.title, lang) : lt(settings.announcements[0], lang)}</div>
      {/* header */}
      <div className="flex items-center justify-between border-b border-line bg-white" style={{ padding: `${d.pad * 0.5}px ${d.pad * 0.8}px` }}>
        <span className="flex max-w-[45%] [&>svg]:h-full! [&>svg]:w-auto [&>svg]:max-w-full" style={{ height: logoH }}>
          <ThemeLogo variant={theme.logo} />
        </span>
        <div className="flex items-center gap-2.5 text-[10.5px] font-semibold text-ink-soft">
          <span>{nav.nav_products}</span>
          <span className="hidden min-[380px]:inline">{nav.nav_industries}</span>
          <Search className="h-3.5 w-3.5" />
          <ShoppingBag className="h-3.5 w-3.5" />
        </div>
      </div>
      {/* hero — ink section, like the storefront */}
      <div className="relative isolate overflow-hidden bg-ink" style={{ minHeight: 176 * d.scale }}>
        <img src={thumb(heroImage)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70" style={{ objectPosition: objectPos(hero?.focal) }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/15" />
        <div style={{ padding: `${d.pad * 1.3}px ${d.pad}px ${d.pad}px` }}>
          <span className="inline-flex items-center gap-1.5 text-[8.5px] font-medium text-brand-300" style={f.eyebrow}>
            <span className="h-1 w-3 rounded-full bg-brand-400" />
            {words.eyebrow}
          </span>
          <div className="mt-2 text-[26px] leading-[1.02] text-white" style={f.heading}>
            <Accent text={accentLast(lt(settings.tagline, lang))} accentClassName="text-brand-300" />
          </div>
          <p className="mt-2 max-w-[250px] text-[11px] leading-snug text-white/80">{words.text}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-brand-600 px-3 text-[10.5px] font-semibold text-white">
              {words.cta} <ArrowRight className="h-3 w-3" />
            </span>
            <span className="inline-flex h-7 items-center rounded-full border border-white/40 px-3 text-[10.5px] font-semibold text-white">{words.cta2}</span>
          </div>
        </div>
        {/* CMYK registration strip */}
        <div className="absolute bottom-0 left-0 flex h-[3px] w-full" aria-hidden>
          <span className="flex-1 bg-cyan" />
          <span className="flex-1 bg-magenta" />
          <span className="flex-1 bg-yellow" />
          <span className="flex-1 bg-key" />
        </div>
      </div>
      {/* products — square mock-ups on white, "nga … / copë · pa TVSH" */}
      <div className="grid grid-cols-2 bg-paper" style={{ gap: d.gap, padding: d.pad }}>
        {picks.map((p) => (
          <div key={p.id} className="overflow-hidden border border-line bg-white" style={{ borderRadius: d.radius }}>
            <div className="relative aspect-square bg-white">
              <img src={thumb(p.images[0])} alt="" className="h-full w-full object-cover" />
              {p.badges.includes('new') && <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[8px] font-bold text-white">{words.badge}</span>}
            </div>
            <div style={{ padding: d.gap * 0.75 }}>
              <div className="line-clamp-1 text-[10.5px] font-semibold text-ink">{plain(lt(p.name, lang))}</div>
              <div className="mt-0.5 flex items-baseline gap-1 font-mono">
                <span className="text-[10.5px] font-medium text-brand-700">
                  {p.tiers?.length ? `${lang === 'sq' ? 'nga' : 'from'} ` : ''}
                  {money(fromPrice(p), lang)}
                </span>
                <span className="text-[8.5px] text-muted">{nav.exclVatShort}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
