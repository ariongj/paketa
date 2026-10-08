// Markets (PDF p.37): "Shtete/rajone, status, valutë, gjuhë, katalog, domen dhe rregulla dërgese. Konfigurim default
// dhe overrides të tregut … Shuma fikse në valuta të ndryshme kërkon politikë konvertimi dhe rrumbullakimi të ruajtur."
// `Market` (lib/types) holds the core fields; the per-market overrides below are stored on the same objects
// (MarketX is a structural extension, so it still saves through updateSettings({ markets })).
import type { L10n, Lang, Market } from '@/lib/types';

export type Rounding = 'none' | '0.99' | '1' | '10' | '100';
export const ROUNDINGS: Rounding[] = ['none', '0.99', '1', '10', '100'];
export type ShippingMode = 'zones' | 'flat' | 'none';
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

/** EUR is the base (Kosovo uses the euro); ALL / MKD for the region, CHF for Switzerland. */
export const CURRENCIES = ['EUR', 'ALL', 'MKD', 'CHF'] as const;

/** Kosovo first, then the region and the EU export countries PrintWorks ships to. */
export const COUNTRIES: Record<string, L10n> = {
  XK: { sq: 'Kosova', en: 'Kosovo' },
  AL: { sq: 'Shqipëria', en: 'Albania' },
  MK: { sq: 'Maqedonia e Veriut', en: 'North Macedonia' },
  DE: { sq: 'Gjermania', en: 'Germany' },
  AT: { sq: 'Austria', en: 'Austria' },
  CH: { sq: 'Zvicra', en: 'Switzerland' },
  IT: { sq: 'Italia', en: 'Italy' },
  SE: { sq: 'Suedia', en: 'Sweden' },
  NL: { sq: 'Holanda', en: 'Netherlands' },
};

/** Cities outside Kosovo that appear in the delivery zones — used to attribute orders to markets. */
const CITY_COUNTRY: Record<string, string> = {
  'tiranë': 'AL', tirana: 'AL', 'durrës': 'AL', 'shkodër': 'AL', 'vlorë': 'AL', elbasan: 'AL', 'kukës': 'AL', 'korçë': 'AL', fier: 'AL', berat: 'AL',
  shkup: 'MK', skopje: 'MK', 'tetovë': 'MK', gostivar: 'MK', 'strugë': 'MK', 'kumanovë': 'MK', 'kërçovë': 'MK', 'ohër': 'MK',
};

/** ISO country of an order's delivery city (Kosovo unless the city is a known regional one). */
export function countryOfCity(city?: string) {
  return CITY_COUNTRY[(city ?? '').trim().toLowerCase()] ?? 'XK';
}

const DEFAULTS: Record<string, Partial<MarketX>> = {
  'mk-xk': { domain: 'printwor-ks.com', defaultLang: 'sq', fxRate: 1, rounding: 'none', shipping: { mode: 'zones' }, catalog: 'all' },
  'mk-al': { domain: 'printwor-ks.com', defaultLang: 'sq', fxRate: 1, rounding: 'none', shipping: { mode: 'zones' }, catalog: 'all' },
  'mk-eu': { domain: 'printwor-ks.com/en', defaultLang: 'en', fxRate: 1, rounding: 'none', shipping: { mode: 'flat', fee: 95, days: '5–8' }, catalog: 'stock' },
};
const GENERIC: Partial<MarketX> = { domain: '', fxRate: 1, rounding: 'none', shipping: { mode: 'flat', fee: 0, days: '' }, catalog: 'stock' };

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
