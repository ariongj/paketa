// Online Store → Tema (PDF p.32 "Theme settings për logo, font, hapësira dhe ngjyra të website publik",
// p.37 "Preferencat për aksesin, faqen e mirëmbajtjes, gjuhën dhe metadata").
//
// The public-site theme lives on `settings.theme` (not in the shared Settings type yet — see readTheme / themePatch).
// The brand colour stays on `settings.brandColor` and the SEO texts on `settings.seo`.
import type { CSSProperties } from 'react';
import type { L10n, Settings } from '@/lib/types';
import { brandVars, DEFAULT_BRAND, isHex } from '@/lib/color';

/** full = chevrons + “PrintWorks®” wordmark (≈ 5:1) · mark = chevrons only · mono = one-colour full logo */
export type LogoVariant = 'full' | 'mark' | 'mono';
export type FontPair = 'classic' | 'modern' | 'elegant';
export type Density = 'compact' | 'comfortable' | 'airy';
export type SlideLayout = 'full' | 'inset' | 'layered';

export interface StoreTheme {
  logo: LogoVariant;
  /** Header logo height on desktop, px (the full logo is ≈ 5.15 × wider than high) */
  logoSize: number;
  font: FontPair;
  density: Density;
  /** Open Graph image (1200×630) used when the site is shared */
  shareImage: string;
  maintenance: { on: boolean; message: L10n };
  /** Homepage slideshow behaviour (PDF p.31) */
  slideshow: { layout: SlideLayout; autoplay: boolean; interval: number; controls: boolean };
  domain: { name: string; checkedAt?: string };
}

export const LOGO_SIZE = { min: 20, max: 40, step: 2 };

export const DEFAULT_THEME = (phone = '+383 49 732 700', email = 'hello@printwor-ks.com'): StoreTheme => ({
  logo: 'full',
  logoSize: 30,
  font: 'classic',
  density: 'comfortable',
  shareImage: '/images/og.jpg',
  maintenance: {
    on: false,
    message: {
      sq: `Po e përditësojmë dyqanin online — kthehemi së shpejti. Për porosi dhe oferta: ${phone} · ${email}.`,
      en: `We are updating the online store — back soon. For orders and quotes: ${phone} · ${email}.`,
    },
  },
  slideshow: { layout: 'full', autoplay: true, interval: 7, controls: true },
  domain: { name: 'printwor-ks.com' },
});

type WithTheme = Settings & { theme?: Partial<StoreTheme> };

/** Theme stored on the settings, merged over the defaults (older data has none). */
export function readTheme(settings: Settings): StoreTheme {
  const base = DEFAULT_THEME(settings.phone || undefined, settings.email || undefined);
  const t = (settings as WithTheme).theme ?? {};
  const size = Number(t.logoSize);
  return {
    ...base,
    ...t,
    // older data was sized for a compact logo (32–56 px) — clamp to the wide PrintWorks logo's range
    logoSize: Number.isFinite(size) ? Math.min(LOGO_SIZE.max, Math.max(LOGO_SIZE.min, size)) : base.logoSize,
    logo: t.logo === 'mark' || t.logo === 'mono' ? t.logo : 'full',
    shareImage: t.shareImage && !t.shareImage.startsWith('/images/hero/') ? t.shareImage : base.shareImage,
    maintenance: { ...base.maintenance, ...t.maintenance, message: { ...base.maintenance.message, ...t.maintenance?.message } },
    slideshow: { ...base.slideshow, ...t.slideshow },
    domain: { ...base.domain, ...t.domain },
  };
}

/** `updateSettings(themePatch(theme))` — the field is additive (the shared Settings type does not declare it yet). */
export function themePatch(theme: StoreTheme): Partial<Settings> {
  return { theme } as unknown as Partial<Settings>;
}

/* ------------------------------------------------------------------ */
/* Brand colour                                                        */
/* ------------------------------------------------------------------ */
/** PrintWorks purple (#80298f, their exact colour) first, then print-friendly alternatives. */
export const BRAND_PRESETS: { hex: string; key: 'preset_printworks' | 'preset_magenta' | 'preset_cyan' | 'preset_petrol' | 'preset_eco' | 'preset_graphite' }[] = [
  { hex: DEFAULT_BRAND, key: 'preset_printworks' },
  { hex: '#b3125e', key: 'preset_magenta' },
  { hex: '#0b6fa4', key: 'preset_cyan' },
  { hex: '#1f5a63', key: 'preset_petrol' },
  { hex: '#3d6b47', key: 'preset_eco' },
  { hex: '#2e2b33', key: 'preset_graphite' },
];

export const normHex = (v: string) => {
  const h = v.trim().replace(/^#?/, '#').toLowerCase();
  return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
};

/** WCAG contrast of white text on the colour (buttons are white on brand-600). */
export function whiteContrast(hex: string) {
  const v = normHex(hex).slice(1);
  const ch = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  return 1.05 / (lum + 0.05);
}

/* ------------------------------------------------------------------ */
/* Storefront preview inside the neutral CMS                           */
/* ------------------------------------------------------------------ */
/** The PrintWorks storefront tokens (src/index.css) — the admin remaps them to greys, a preview restores them locally. */
const SITE_TOKENS: Record<string, string> = {
  '--color-ink': '#121014',
  '--color-ink-soft': '#35303a',
  '--color-muted': '#6c6672',
  '--color-paper': '#f7f7f8',
  '--color-sand': '#efeef1',
  '--color-sand-2': '#e5e3e9',
  '--color-line': '#e3e0e7',
  '--color-canvas': '#f2f1f4',
};

/** Inline style that makes a subtree look like the public site (brand scale + PrintWorks ink/paper tokens). */
export function storefrontVars(brand: string): CSSProperties {
  return { ...brandVars(isHex(brand) ? brand : DEFAULT_BRAND), ...(SITE_TOKENS as CSSProperties) };
}

/**
 * Typography presets — all DM Sans (the PrintWorks typeface), with DM Mono for eyebrows, specs and prices.
 * classic = the storefront default (DM Sans semibold, tight tracking) · modern = bolder headings + mono labels ·
 * elegant = light headings.
 */
export const FONT_PAIRS: Record<FontPair, { heading: CSSProperties; body: CSSProperties; eyebrow: CSSProperties; label: string }> = {
  classic: {
    heading: { fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.035em' },
    body: { fontFamily: 'var(--font-sans)' },
    eyebrow: { fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase' },
    label: 'DM Sans 600 + DM Mono',
  },
  modern: {
    heading: { fontFamily: 'var(--font-sans)', fontWeight: 750, letterSpacing: '-0.045em' },
    body: { fontFamily: 'var(--font-sans)' },
    eyebrow: { fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase' },
    label: 'DM Sans 750 + DM Mono',
  },
  elegant: {
    heading: { fontFamily: 'var(--font-sans)', fontWeight: 300, letterSpacing: '-0.03em' },
    body: { fontFamily: 'var(--font-sans)', letterSpacing: '0.005em' },
    eyebrow: { fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' },
    label: 'DM Sans 300',
  },
};

/** Preview spacing per density: section padding, gap and card radius. */
export const DENSITY: Record<Density, { pad: number; gap: number; radius: number; scale: number }> = {
  compact: { pad: 14, gap: 8, radius: 10, scale: 0.86 },
  comfortable: { pad: 20, gap: 12, radius: 14, scale: 1 },
  airy: { pad: 28, gap: 16, radius: 18, scale: 1.14 },
};

/** "Paketim premium" → "Paketim *premium*" (last word in the brand colour). */
export const accentLast = (text: string) => (text.includes('*') ? text : text.replace(/(\S+)\s*$/, '*$1*'));
