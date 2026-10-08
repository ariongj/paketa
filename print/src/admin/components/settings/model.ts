// Settings space (Konfigurimet) — PDF pp.39–42, mock-up p.41.
// Section registry, the settings draft type and the few settings the shared `Settings` type does not carry yet.
import type { ComponentType } from 'react';
import { Activity, Bell, Building2, CreditCard, Database, Languages, MapPin, Percent, Plug, ShieldCheck, ShoppingCart, Truck, Users } from 'lucide-react';
import type { Lang, Settings } from '@/lib/types';
import type { SKey } from './strings';

/* ------------------------------------------------------------------ */
/* Extra settings (stored on `settings.ext` until the shared type has them) */
/* ------------------------------------------------------------------ */
/** pilot = decided with the bank for the pilot · bank = the bank's e-commerce card processor · gateway = an international gateway */
export type PayProvider = 'pilot' | 'bank' | 'gateway';

export interface SettingsExt {
  /** Primary domain shown in General → Domain */
  domain: string;
  weightUnit: 'kg' | 'g';
  lengthUnit: 'cm' | 'mm' | 'm';
  payProvider: PayProvider;
  payEnv: 'test' | 'live';
  /** auto = captured at checkout · manual = authorised, captured when the order is confirmed */
  capture: 'auto' | 'manual';
  langDefault: Lang;
  langFallback: Lang;
  localDelivery: { enabled: boolean; fee: number; area: string };
}

export const EXT_DEFAULTS: SettingsExt = {
  domain: 'printwor-ks.com',
  weightUnit: 'kg',
  lengthUnit: 'mm',
  payProvider: 'pilot',
  payEnv: 'test',
  capture: 'auto',
  langDefault: 'sq',
  langFallback: 'sq',
  localDelivery: { enabled: true, fee: 0, area: 'Prishtinë, Fushë Kosovë, Obiliq' },
};

/** The draft the settings screens edit: the shared settings + `ext`. */
export type SettingsX = Settings & { ext: SettingsExt };

export function withExt(s: Settings): SettingsX {
  const ext = (s as Partial<SettingsX>).ext;
  const merged = { ...EXT_DEFAULTS, ...ext, localDelivery: { ...EXT_DEFAULTS.localDelivery, ...ext?.localDelivery } };
  // providers from older demo data fall back to the pilot choice
  if (!(['pilot', 'bank', 'gateway'] as string[]).includes(merged.payProvider)) merged.payProvider = 'pilot';
  return { ...s, ext: merged };
}

export type SetX = <K extends keyof SettingsX>(key: K, value: SettingsX[K]) => void;
export type SetExt = <K extends keyof SettingsExt>(key: K, value: SettingsExt[K]) => void;
export type Errors = Partial<Record<string, string>>;

/** Props every settings section receives. */
export interface SecProps {
  s: SettingsX;
  set: SetX;
  setExt: SetExt;
  errors: Errors;
  /** Current role may only look (settings: view) */
  readOnly: boolean;
}

/* ------------------------------------------------------------------ */
/* Section registry — drives the sub-navigation and /admin/konfigurimet/:section */
/* ------------------------------------------------------------------ */
export type SectionId =
  | 'general' | 'taxes' | 'staff' | 'payments' | 'checkout' | 'shipping' | 'locations' | 'languages' | 'notifications' | 'integrations' | 'privacy' | 'activity' | 'data';

export interface SectionDef {
  id: SectionId;
  /** URL segment after /admin/konfigurimet ('' = index) */
  slug: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: SKey;
  /** Settings keys edited by the section (unsaved / example dots) */
  keys: (keyof SettingsX)[];
  /** Section lives elsewhere — the nav item is a link */
  to?: string;
}

export const SECTIONS: SectionDef[] = [
  { id: 'general', slug: '', icon: Building2, label: 'sec_general', keys: ['companyName', 'legalName', 'tagline', 'about', 'pib', 'pdv', 'bankName', 'bankAccount', 'email', 'phone', 'phone2', 'whatsapp', 'address', 'city', 'mapUrl', 'hours', 'instagram', 'facebook', 'timezone', 'orderPrefix', 'seo'] },
  { id: 'taxes', slug: 'taksat', icon: Percent, label: 'sec_taxes', keys: ['vatRate', 'pricesIncludeVat'] },
  { id: 'staff', slug: 'stafi', icon: Users, label: 'sec_staff', keys: [] },
  { id: 'payments', slug: 'pagesat', icon: CreditCard, label: 'sec_payments', keys: ['payments', 'bankName', 'bankAccount'] },
  { id: 'checkout', slug: 'checkout', icon: ShoppingCart, label: 'sec_checkout', keys: ['checkout'] },
  { id: 'shipping', slug: 'dergesat', icon: Truck, label: 'sec_shipping', keys: ['shippingZones', 'pickupAddress'] },
  { id: 'locations', slug: 'lokacionet', icon: MapPin, label: 'sec_locations', keys: ['locations'] },
  { id: 'languages', slug: 'gjuhet', icon: Languages, label: 'sec_languages', keys: ['languages'] },
  { id: 'notifications', slug: 'njoftimet', icon: Bell, label: 'sec_notifications', keys: ['notifications', 'adminEmail'] },
  { id: 'integrations', slug: 'integrimet', icon: Plug, label: 'sec_integrations', keys: [], to: '/admin/integrimet' },
  { id: 'privacy', slug: 'privatesia', icon: ShieldCheck, label: 'sec_privacy', keys: ['privacy'] },
  { id: 'activity', slug: 'aktiviteti', icon: Activity, label: 'sec_activity', keys: [] },
  { id: 'data', slug: 'demo', icon: Database, label: 'sec_data', keys: ['demoBanner'] },
];

export const sectionPath = (d: SectionDef) => d.to ?? (d.slug ? `/admin/konfigurimet/${d.slug}` : '/admin/konfigurimet');

/** Old / alternative slugs that still open the right section. */
const ALIASES: Record<string, SectionId> = {
  pergjithshme: 'general', 'te-pergjithshme': 'general', general: 'general',
  tvsh: 'taxes', taxes: 'taxes', tatimet: 'taxes',
  staff: 'staff', rolet: 'staff',
  pagesa: 'payments', payments: 'payments',
  transporti: 'shipping', dergesa: 'shipping', shipping: 'shipping',
  locations: 'locations', languages: 'languages', notifications: 'notifications',
  privacy: 'privacy', activity: 'activity', 'te-dhenat': 'data', data: 'data',
};

export function sectionFor(slug: string | undefined): SectionDef | undefined {
  const s = (slug ?? '').toLowerCase();
  return SECTIONS.find((d) => d.slug === s) ?? SECTIONS.find((d) => d.id === ALIASES[s]);
}

/* ------------------------------------------------------------------ */
/* Demo placeholders ("Shembull" chip)                                 */
/* ------------------------------------------------------------------ */
export const EXAMPLE_FIELDS: { key: keyof Settings; section: SectionId }[] = [
  { key: 'pib', section: 'general' },
  { key: 'pdv', section: 'general' },
  { key: 'phone', section: 'general' },
  { key: 'phone2', section: 'general' },
  { key: 'whatsapp', section: 'general' },
  { key: 'address', section: 'general' },
  { key: 'city', section: 'general' },
  { key: 'bankAccount', section: 'general' },
  { key: 'bankAccount', section: 'payments' },
];

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */
export const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export const ORDER_PREFIX_RE = /^[A-Z0-9][A-Z0-9-]{0,5}$/;

/** Zones offered in the settings. Kosovo's IANA zone is Europe/Belgrade (CET) — always shown as "Prishtinë". */
export const TIMEZONES = ['Europe/Belgrade', 'Europe/Tirane', 'Europe/Skopje', 'Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich', 'Europe/London', 'Europe/Istanbul'];

const TZ_CITY: Record<string, { sq: string; en: string }> = {
  'Europe/Belgrade': { sq: 'Prishtinë', en: 'Prishtina' },
  'Europe/Tirane': { sq: 'Tiranë', en: 'Tirana' },
  'Europe/Skopje': { sq: 'Shkup', en: 'Skopje' },
  'Europe/Berlin': { sq: 'Berlin', en: 'Berlin' },
  'Europe/Vienna': { sq: 'Vjenë', en: 'Vienna' },
  'Europe/Zurich': { sq: 'Cyrih', en: 'Zurich' },
  'Europe/London': { sq: 'Londër', en: 'London' },
  'Europe/Istanbul': { sq: 'Stamboll', en: 'Istanbul' },
};

/** Readable city for an IANA zone: "Europe/Belgrade" → "Prishtinë" (sq) / "Prishtina" (en). */
export function tzCity(zone: string, lang: Lang = 'sq') {
  return TZ_CITY[zone]?.[lang] ?? zone.split('/').pop()!.replace(/_/g, ' ');
}

/** "GMT+2" for an IANA zone (current offset). */
export function tzOffset(zone: string, at = new Date()) {
  try {
    const part = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName');
    return part?.value ?? '';
  } catch {
    return '';
  }
}

/** Current wall-clock time in a zone, "14:32". */
export function tzNow(zone: string, at = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(at);
  } catch {
    return '';
  }
}

/** Short stable hash → payment references in the demo ("TX-7K2M9Q"). */
export function shortRef(seed: string, len = 6) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  let x = h >>> 0;
  for (let i = 0; i < len; i++) {
    out += abc[x % abc.length];
    x = Math.floor(x / abc.length) || (h >>> (i + 1)) + i * 7919;
  }
  return out;
}
