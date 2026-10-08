import type { Lang, Unit } from './types';

const LOCALE: Record<Lang, string> = { me: 'de-DE', sq: 'de-DE', en: 'en-IE' };
const DATE_LOCALE: Record<Lang, string> = { me: 'sr-Latn-RS', sq: 'sq-AL', en: 'en-GB' };

/** 1.249,00 € (SQ/SR) — €1,249.00 (EN) */
export function money(value: number, lang: Lang = 'sq', opts: { decimals?: boolean } = {}) {
  const decimals = opts.decimals ?? true;
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(value);
}

/**
 * Per-piece price with sub-cent precision (packaging is priced in fractions of a cent):
 * 0,05 € · 0,004 € · 0,015 €. Always 2–4 decimals.
 */
export function moneyPiece(value: number, lang: Lang = 'sq') {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: value > 0 && value < 0.01 ? 4 : 3,
  }).format(value);
}

/** Compact money for charts/KPIs: 12,4k € */
export function moneyCompact(value: number, lang: Lang = 'sq') {
  if (Math.abs(value) < 10000) return money(value, lang, { decimals: false });
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function num(value: number, lang: Lang = 'sq', maxDecimals = 2) {
  return new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: maxDecimals }).format(value);
}

/* Chrome ships without Albanian ICU data (sq → English months), so Albanian dates are assembled here. */
const SQ_MONTHS = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
const SQ_MONTHS_SHORT = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'korr', 'gush', 'sht', 'tet', 'nën', 'dhj'];
const SQ_DAYS = ['e diel', 'e hënë', 'e martë', 'e mërkurë', 'e enjte', 'e premte', 'e shtunë'];
const SQ_DAYS_SHORT = ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'];

let sqNative: boolean | null = null;
function hasAlbanian() {
  if (sqNative == null) {
    try {
      sqNative = new Intl.DateTimeFormat('sq', { month: 'long' }).format(new Date(2026, 9, 1)) === 'tetor';
    } catch {
      sqNative = false;
    }
  }
  return sqNative;
}

function albanianDate(d: Date, opts: Intl.DateTimeFormatOptions) {
  const tz = opts.timeZone;
  const monthIdx = Number(new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: tz }).format(d)) - 1;
  const dayIdx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: tz }).format(d));
  // en-GB has the same order as Albanian ("8 Oct 2026, 14:05" → "8 tet 2026, 14:05")
  return new Intl.DateTimeFormat('en-GB', { hourCycle: 'h23', ...opts })
    .formatToParts(d)
    .map((p) => {
      if (p.type === 'month' && (opts.month === 'short' || opts.month === 'long' || opts.month === 'narrow')) {
        return (opts.month === 'long' ? SQ_MONTHS : SQ_MONTHS_SHORT)[monthIdx] ?? p.value;
      }
      if (p.type === 'weekday') return (opts.weekday === 'long' ? SQ_DAYS : SQ_DAYS_SHORT)[dayIdx] ?? p.value;
      if (p.type === 'dayPeriod') return '';
      if (p.type === 'literal' && p.value === '/') return '.';
      return p.value;
    })
    .join('')
    .trim();
}

export function date(iso: string | Date, lang: Lang = 'sq', opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (lang === 'sq' && !hasAlbanian()) {
    try {
      return albanianDate(d, opts);
    } catch {
      /* fall through */
    }
  }
  try {
    return new Intl.DateTimeFormat(DATE_LOCALE[lang], opts).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-GB', opts).format(d);
  }
}

export function dateTime(iso: string, lang: Lang = 'sq') {
  return date(iso, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const REL: Record<Lang, { now: string; min: string; h: string; d: string; ago: (s: string) => string }> = {
  me: { now: 'upravo sada', min: 'min', h: 'h', d: 'd', ago: (s) => `prije ${s}` },
  sq: { now: 'tani', min: 'min', h: 'orë', d: 'ditë', ago: (s) => `para ${s}` },
  en: { now: 'just now', min: 'min', h: 'h', d: 'd', ago: (s) => `${s} ago` },
};

export function timeAgo(iso: string, lang: Lang = 'sq') {
  const r = REL[lang];
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return r.now;
  if (diff < 3600) return r.ago(`${Math.floor(diff / 60)} ${r.min}`);
  if (diff < 86400) return r.ago(`${Math.floor(diff / 3600)} ${r.h}`);
  if (diff < 86400 * 30) return r.ago(`${Math.floor(diff / 86400)} ${r.d}`);
  return date(iso, lang);
}

/** Selling unit of a cart line: pack ("pako"), single piece, set, metre. */
const UNIT_LABEL: Record<Lang, Record<Unit, string>> = {
  me: { kom: 'kom', pack: 'pak.', m: 'm', set: 'set' },
  sq: { kom: 'copë', pack: 'pako', m: 'm', set: 'set' },
  en: { kom: 'pc', pack: 'pack', m: 'm', set: 'set' },
};

const PIECES: Record<Lang, string> = { me: 'kom', sq: 'copë', en: 'pcs' };
const CARTON: Record<Lang, [string, string]> = { me: ['karton', 'kartona'], sq: ['karton', 'kartonë'], en: ['carton', 'cartons'] };

export function unitLabel(unit: Unit, lang: Lang = 'sq') {
  return UNIT_LABEL[lang][unit];
}

/** "/ pako" style suffix for prices */
export function perUnit(unit: Unit, lang: Lang = 'sq') {
  return `/ ${unitLabel(unit, lang)}`;
}

/** "copë" / "pcs" / "kom" — the piece word used with pack sizes. */
export function piecesLabel(lang: Lang = 'sq') {
  return PIECES[lang];
}

/** "1.000 copë" */
export function pieces(n: number, lang: Lang = 'sq') {
  return `${num(n, lang, 0)} ${PIECES[lang]}`;
}

/** "karton" / "kartonë" */
export function cartonLabel(n: number, lang: Lang = 'sq') {
  return CARTON[lang][n === 1 ? 0 : 1];
}
