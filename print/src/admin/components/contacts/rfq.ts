// Structured quote requests (RFQ) — labels and helpers for `Inquiry.specs` (custom packaging / print jobs).
// Pure: used by the inbox list, the inquiry drawer, the quote editor ("Krijo ofertë") and the CSV export.
import type { Lang, Product, RfqSpecs } from '@/lib/types';
import { lt } from '@/i18n';
import { num } from '@/lib/format';
import { fold } from '@/lib/search';

type Pair = { sq: string; en: string };

/** RfqSpecs.product ids (the quote-request form) → readable product type. */
export const RFQ_PRODUCT: Record<string, Pair> = {
  box: { sq: 'Kuti produkti', en: 'Product box' },
  food: { sq: 'Paketim ushqimor', en: 'Food packaging' },
  label: { sq: 'Etiketa', en: 'Labels' },
  sleeve: { sq: 'Shrink sleeve', en: 'Shrink sleeve' },
  bag: { sq: 'Qese letre', en: 'Paper bags' },
  print: { sq: 'Material promovues', en: 'Promotional print' },
  other: { sq: 'Projekt i veçantë', en: 'Custom project' },
};

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function rfqProductLabel(id: string | undefined, lang: Lang) {
  if (!id) return lang === 'sq' ? RFQ_PRODUCT.other.sq : RFQ_PRODUCT.other.en;
  const p = RFQ_PRODUCT[id];
  return p ? p[lang] : cap(id);
}

/** Finishing options: chip label + the short form used inside a quote line title ("CMYK + folje"). */
const FINISH: { keys: string[]; label: Pair; short: Pair }[] = [
  { keys: ['foil', 'hotfoil', 'folje', 'stampimmefolje', 'goldfoil', 'foljeari'], label: { sq: 'Stampim me folje', en: 'Hot-foil stamping' }, short: { sq: 'folje', en: 'foil' } },
  { keys: ['emboss', 'embossing', 'reliev', 'relief'], label: { sq: 'Reliev', en: 'Embossing' }, short: { sq: 'reliev', en: 'embossing' } },
  { keys: ['deboss', 'debossing'], label: { sq: 'Reliev i futur', en: 'Debossing' }, short: { sq: 'reliev i futur', en: 'debossing' } },
  { keys: ['spotuv', 'uvspot', 'selectiveuv', 'llakuvselektiv', 'uvselektiv'], label: { sq: 'Llak UV selektiv', en: 'Spot UV' }, short: { sq: 'llak UV selektiv', en: 'spot UV' } },
  { keys: ['uv', 'varnish', 'uvvarnish', 'llak', 'llakuv'], label: { sq: 'Llak UV', en: 'UV varnish' }, short: { sq: 'llak UV', en: 'UV varnish' } },
  { keys: ['matte', 'matt', 'mat', 'mattelamination', 'laminimmat', 'matlam'], label: { sq: 'Laminim mat', en: 'Matte lamination' }, short: { sq: 'laminim mat', en: 'matte lamination' } },
  { keys: ['gloss', 'glossy', 'glosslamination', 'laminimmeshkelqim', 'shkelqim'], label: { sq: 'Laminim me shkëlqim', en: 'Gloss lamination' }, short: { sq: 'laminim me shkëlqim', en: 'gloss lamination' } },
  { keys: ['softtouch', 'velvet', 'laminimsofttouch'], label: { sq: 'Laminim soft-touch', en: 'Soft-touch lamination' }, short: { sq: 'soft-touch', en: 'soft-touch' } },
  { keys: ['window', 'petwindow', 'dritare', 'dritarepet'], label: { sq: 'Dritare PET', en: 'PET window' }, short: { sq: 'dritare PET', en: 'PET window' } },
  { keys: ['diecut', 'diecutting', 'prerje', 'prerjememartice', 'prerjemematrice'], label: { sq: 'Prerje me matricë', en: 'Die-cutting' }, short: { sq: 'prerje me matricë', en: 'die-cut' } },
  { keys: ['white', 'whiteink', 'bardhe', 'ngjyreebardhe'], label: { sq: 'Ngjyrë e bardhë', en: 'White ink' }, short: { sq: 'e bardhë', en: 'white ink' } },
  { keys: ['insert', 'ndarje', 'ndarjekartoni'], label: { sq: 'Ndarje kartoni', en: 'Board insert' }, short: { sq: 'ndarje kartoni', en: 'insert' } },
  { keys: ['magnet', 'magnetic', 'mbylljemagnetike'], label: { sq: 'Mbyllje magnetike', en: 'Magnetic closure' }, short: { sq: 'mbyllje magnetike', en: 'magnetic closure' } },
  { keys: ['handle', 'handles', 'doreza', 'dorezalitari', 'ribbonhandle'], label: { sq: 'Doreza', en: 'Handles' }, short: { sq: 'doreza', en: 'handles' } },
];
const keyOf = (s: string) => fold(s).replace(/[^a-z0-9]/g, '');

/** Only id-like values ("spot-uv", "foil") are translated — free text from the form ("Folje ari") is shown as written. */
function finishOf(raw: string) {
  if (!/^[a-z0-9_-]+$/.test(raw.trim())) return undefined;
  const k = keyOf(raw);
  return FINISH.find((f) => f.keys.includes(k));
}
const lowerFirst = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);

/** "spot-uv" → "Llak UV selektiv"; unknown values (already human text) pass through. */
export const finishLabel = (raw: string, lang: Lang) => finishOf(raw)?.label[lang] ?? cap(raw.trim());
const finishShort = (raw: string, lang: Lang) => finishOf(raw)?.short[lang] ?? lowerFirst(raw.trim());

/** "40 x 40 x 150 mm" → "40×40×150 mm" */
export const normSize = (s: string) => s.trim().replace(/(\d)\s*[x×*]\s*(?=\d)/gi, '$1×');

/** Quantity with thousands separators: 5000 → "5.000 copë" / "5,000 pcs". */
export const pcs = (n: number, lang: Lang) => `${num(n, lang, 0)} ${lang === 'sq' ? 'copë' : 'pcs'}`;

/**
 * Quote line title from the request, e.g. "Kuti kozmetike 40×40×150 mm, GC2 350 g, CMYK + folje — 5.000 copë".
 * The catalogue product (when the form was sent from a product page) names the item; otherwise the product type.
 */
export function rfqTitle(specs: RfqSpecs, lang: Lang, product?: Product) {
  const name = product ? lt(product.name, lang) : rfqProductLabel(specs.product, lang);
  const head = [name, specs.size ? normSize(specs.size) : ''].filter(Boolean).join(' ');
  const print = [specs.colours?.trim(), ...(specs.finishes ?? []).filter(Boolean).map((f) => finishShort(f, lang))].filter(Boolean).join(' + ');
  const body = [head, specs.material?.trim(), print].filter(Boolean).join(', ');
  return specs.quantity ? `${body} — ${pcs(specs.quantity, lang)}` : body;
}

/** Short one-liner for list rows: "Kuti produkti · 40×40×150 mm · 5.000 copë". */
export function rfqSummary(specs: RfqSpecs, lang: Lang, product?: Product) {
  const name = product ? lt(product.name, lang) : rfqProductLabel(specs.product, lang);
  return [name, specs.size ? normSize(specs.size) : '', specs.quantity ? pcs(specs.quantity, lang) : ''].filter(Boolean).join(' · ');
}

/** Whole days from today (local) to an ISO / "YYYY-MM-DD" date — negative when it has passed. */
export function daysUntil(iso: string, now: number) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

/** Typical production time (working days after proof approval) when the product does not say. */
export const TYPICAL_LEAD_DAYS = 10;

export type DeadlineState = 'passed' | 'tight' | 'ok';
/** passed = date is behind us · tight = fewer calendar days than the lead time (+ 2 days for the proof). */
export function deadlineState(days: number, leadDays = TYPICAL_LEAD_DAYS): DeadlineState {
  if (days < 0) return 'passed';
  return days < leadDays + 2 ? 'tight' : 'ok';
}

/** 2_480_000 → "2,4 MB" */
export function fileSize(bytes: number, lang: Lang) {
  if (!bytes || bytes < 0) return '';
  if (bytes < 1024 * 1024) return `${num(Math.max(1, Math.round(bytes / 1024)), lang, 0)} KB`;
  return `${num(bytes / (1024 * 1024), lang, 1)} MB`;
}
