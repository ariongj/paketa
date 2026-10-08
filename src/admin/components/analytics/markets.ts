// Markets (PDF p.37): "Shtete/rajone, status, valutë, gjuhë, katalog, domen dhe rregulla dërgese. Konfigurim default
// dhe overrides të tregut … Shuma fikse në valuta të ndryshme kërkon politikë konvertimi dhe rrumbullakimi të ruajtur."
// `Market` (lib/types) holds the core fields; the per-market overrides below are stored on the same objects
// (MarketX is a structural extension, so it still saves through updateSettings({ markets })).
import type { L10n, Lang, Market } from '@/lib/types';

export type Rounding = 'none' | '0.99' | '1' | '10' | '100';
export const ROUNDINGS: Rounding[] = ['none', '0.99', '1', '10', '100'];
/** zones = Kosovo zones from Settings · flat = one fee · quote = B2B, delivery priced in the quote · none = pickup only */
export type ShippingMode = 'zones' | 'flat' | 'quote' | 'none';
export type CatalogMode = 'all' | 'stock';

export interface MarketX extends Market {
  domain?: string;
  defaultLang?: Lang;
  /** units of the market currency per 1 EUR (stored rate — never live) */
  fxRate?: number;
  rounding?: Rounding;
  shipping?: { mode: ShippingMode; fee?: number; days?: string };
  catalog?: CatalogMode;
}

/** Paketoje invoices in EUR everywhere; ALL / MKD exist for regional price lists shown for information. */
export const CURRENCIES = ['EUR', 'ALL', 'MKD'] as const;

/** Reference currency per country — shown "for information" next to EUR prices (stored rate, confirm before use). */
export const INFO_FX: Record<string, { currency: string; rate: number }> = {
  AL: { currency: 'ALL', rate: 98 },
  MK: { currency: 'MKD', rate: 61.5 },
};

export const COUNTRIES: Record<string, L10n> = {
  XK: { me: 'Kosovo', sq: 'Kosova', en: 'Kosovo' },
  AL: { me: 'Albanija', sq: 'Shqipëria', en: 'Albania' },
  MK: { me: 'Sjeverna Makedonija', sq: 'Maqedonia e Veriut', en: 'North Macedonia' },
  ME: { me: 'Crna Gora', sq: 'Mali i Zi', en: 'Montenegro' },
  RS: { me: 'Srbija', sq: 'Serbia', en: 'Serbia' },
  DE: { me: 'Njemačka', sq: 'Gjermania', en: 'Germany' },
  CH: { me: 'Švajcarska', sq: 'Zvicra', en: 'Switzerland' },
};

/** Kosovo is the live market; the region is served B2B on request (delivery priced in the quote). */
const DEFAULTS: Record<string, Partial<MarketX>> = {
  'mk-xk': { domain: 'paketoje.com', defaultLang: 'sq', fxRate: 1, rounding: 'none', shipping: { mode: 'zones' }, catalog: 'all' },
  'mk-al': { domain: 'paketoje.com/al', defaultLang: 'sq', fxRate: 1, rounding: 'none', shipping: { mode: 'quote', days: '2–4' }, catalog: 'stock' },
  'mk-mk': { domain: 'paketoje.com/mk', defaultLang: 'sq', fxRate: 1, rounding: 'none', shipping: { mode: 'quote', days: '2–4' }, catalog: 'stock' },
  'mk-me': { domain: 'paketoje.com/me', defaultLang: 'me', fxRate: 1, rounding: 'none', shipping: { mode: 'quote', days: '2–5' }, catalog: 'stock' },
};
const GENERIC: Partial<MarketX> = { domain: '', fxRate: 1, rounding: 'none', shipping: { mode: 'quote', days: '' }, catalog: 'stock' };

/** Market with its overrides filled in (stored values win over the defaults). */
export function marketX(m: Market): MarketX {
  const x = m as MarketX;
  const d = DEFAULTS[m.id] ?? GENERIC;
  return { ...d, ...x, defaultLang: x.defaultLang ?? d.defaultLang ?? m.languages[0] ?? 'sq', shipping: x.shipping ?? d.shipping ?? { mode: 'flat' } };
}

/** Converted price with the stored rate and the market's rounding policy. */
export function convert(eur: number, m: Pick<MarketX, 'currency' | 'fxRate' | 'rounding'>): number {
  const raw = eur * (m.currency === 'EUR' ? 1 : m.fxRate || 1);
  switch (m.rounding ?? 'none') {
    case '0.99':
      return Math.max(0.99, Math.ceil(raw) - 0.01);
    case '1':
      return Math.round(raw);
    case '10':
      return Math.round(raw / 10) * 10;
    case '100':
      return Math.round(raw / 100) * 100;
    default:
      return Math.round(raw * 100) / 100;
  }
}

export function moneyIn(value: number, currency: string, lang: Lang) {
  const decimals = !Number.isInteger(Math.round(value * 100) / 100);
  try {
    return new Intl.NumberFormat(lang === 'en' ? 'en-IE' : 'de-DE', { style: 'currency', currency, currencyDisplay: currency === 'EUR' ? 'symbol' : 'code', minimumFractionDigits: decimals ? 2 : 0, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
