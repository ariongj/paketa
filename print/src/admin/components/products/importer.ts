// CSV product import (PDF p.09): field mapping, validation, duplicate-SKU report, then create/update.
// Reads every column the exporter writes (same headers in SQ and EN), so an export can be edited in a
// spreadsheet and imported again — including print fields: quantity tiers, MOQ, step, artwork, design service.
import type { Category, PriceTier, Product, ProductStatus, SalesChannel, Unit } from '@/lib/types';
import { UNTRACKED_STOCK } from '@/lib/inventory';
import { fold } from '@/lib/search';
import { slugify, uid } from '@/lib/utils';
import { parseNumber } from './csv';
import { applyPricing, checkTiers, missingForPublish, roundUnit, skusOf, uniqueSlug, MAX_TRACKED, type ProductX } from './model';

export const IMPORT_FIELDS = [
  'name_sq', 'name_en', 'sku', 'barcode', 'handle', 'category', 'vendor', 'tags', 'status', 'price', 'compareAt', 'cost', 'unit',
  'tiers', 'moq', 'qtyStep', 'artwork', 'design', 'leadDays', 'stock', 'channels', 'template', 'description', 'image',
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];
export type MappedField = ImportField | 'ignore';

/** Header synonyms in SQ / EN and Shopify's export names (folded, lower-case, punctuation removed). */
const SYNONYMS: Record<ImportField, string[]> = {
  name_sq: ['name', 'title', 'titulli', 'emri', 'product', 'produkti', 'emri sq', 'titulli sq', 'name sq', 'title sq', 'emri shqip', 'emri i produktit'],
  name_en: ['name en', 'emri en', 'title en', 'titulli en', 'english name', 'emri anglisht'],
  sku: ['sku', 'kodi', 'code', 'variant sku', 'kodi i artikullit'],
  barcode: ['barcode', 'barkodi', 'barkod', 'ean', 'gtin', 'variant barcode'],
  handle: ['url', 'handle', 'slug', 'adresa url'],
  category: ['category', 'kategoria', 'product type', 'type', 'grupi'],
  vendor: ['vendor', 'supplier', 'furnitori', 'furnitori i materialit', 'material supplier', 'brand', 'marka', 'prodhuesi'],
  tags: ['tags', 'etiketat', 'tag'],
  status: ['status', 'statusi'],
  price: ['price', 'cmimi', 'variant price', 'cmimi i shitjes', 'cmimi cope', 'price pc', 'unit price'],
  compareAt: ['compare at', 'compare at price', 'compareat', 'variant compare at price', 'cmimi referues', 'cmimi i vjeter'],
  cost: ['cost', 'kosto', 'kosto cope', 'cost per item', 'cost per piece', 'kostoja'],
  unit: ['unit', 'njesia', 'sold per', 'njesia e shitjes'],
  tiers: ['tiers', 'price tiers', 'quantity pricing', 'quantity tiers', 'cmimet sipas sasise', 'cmime sipas sasise', 'shkallet', 'shkallet e cmimit'],
  moq: ['moq', 'minimum order', 'minimum order quantity', 'min order', 'min qty', 'sasia minimale', 'sasia min'],
  qtyStep: ['qty step', 'quantity step', 'step', 'hapi', 'hapi i sasise'],
  artwork: ['artwork', 'print file', 'needs a print file', 'needs artwork', 'skedar printimi', 'skedari i printimit', 'kerkon skedar printimi'],
  design: ['design', 'design service', 'design & prepress', 'design prepress', 'dizajn', 'dizajn & prepress', 'dizajn profesional & prepress', 'dizajni'],
  leadDays: ['lead time', 'lead days', 'lead time working days', 'lead time days', 'production time', 'afati', 'afati dite pune', 'afati i prodhimit', 'dite pune'],
  stock: ['stock', 'stoku', 'sasia', 'qty', 'quantity', 'inventory', 'variant inventory qty', 'ne stok'],
  channels: ['channels', 'sales channels', 'kanalet', 'kanali'],
  template: ['template', 'product page', 'faqja e produktit', 'lloji', 'sales mode', 'menyra e shitjes'],
  description: ['description', 'pershkrimi', 'body', 'body html'],
  image: ['image', 'images', 'imazhi', 'imazhet', 'image src', 'foto'],
};

const norm = (h: string) =>
  fold(h)
    .replace(/[()[\]_/\-–—:.,*#€]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Best guess for each CSV column; a field is used once (first column wins). */
export function autoMap(headers: string[]): MappedField[] {
  const taken = new Set<ImportField>();
  return headers.map((h) => {
    const n = norm(h);
    let hit = IMPORT_FIELDS.find((f) => !taken.has(f) && SYNONYMS[f].includes(n));
    if (!hit) {
      const lang = /\b(sq|al|shqip)\b/.test(n) ? 'sq' : /\b(en|eng|english|anglisht)\b/.test(n) ? 'en' : null;
      const bare = n.replace(/\b(sq|al|en|eng|shqip|english|anglisht)\b/g, '').trim();
      if (lang && SYNONYMS.name_sq.includes(bare)) hit = lang === 'sq' ? 'name_sq' : 'name_en';
      else hit = IMPORT_FIELDS.find((f) => !taken.has(f) && SYNONYMS[f].some((s) => s.length > 3 && (bare === s || bare.startsWith(`${s} `))));
    }
    if (hit && !taken.has(hit)) {
      taken.add(hit);
      return hit;
    }
    return 'ignore';
  });
}

export type IssueCode =
  | 'noName' | 'noPrice' | 'badNumber' | 'negative' | 'badTiers' | 'badFlag' | 'dupFile' | 'exists' | 'noCategory' | 'unknownCategory' | 'compareLow' | 'badStatus' | 'notPublishable' | 'nameFromOther';
export interface Issue {
  code: IssueCode;
  field?: ImportField;
  value?: string;
}

export interface ImportRow {
  /** CSV line number (header = line 1) */
  line: number;
  values: Partial<Record<ImportField, string>>;
  name: string;
  sku: string;
  price: number | null;
  /** parsed quantity tiers (null = column empty or invalid) */
  tiers: PriceTier[] | null;
  categoryId: string;
  errors: Issue[];
  warnings: Issue[];
  /** catalogue product with the same SKU */
  existing?: Product;
  /** line of the first row with the same SKU */
  dupOfLine?: number;
  action: 'create' | 'update' | 'skip';
}

export interface ImportOptions {
  /** what to do when the SKU already exists in the catalogue */
  onExisting: 'update' | 'skip';
  /** new products: always draft (recommended) or use the status column */
  newStatus: 'draft' | 'column';
}

const STATUS: Record<string, ProductStatus> = {
  active: 'active', aktiv: 'active', aktive: 'active', published: 'active', publikuar: 'active', 'i publikuar': 'active',
  draft: 'draft', skice: 'draft',
  archived: 'archived', arkivuar: 'archived', 'i arkivuar': 'archived', 'te arkivuara': 'archived',
};
const UNITS: Record<string, Unit> = { kom: 'kom', pc: 'kom', pcs: 'kom', cope: 'kom', piece: 'kom', pieces: 'kom', set: 'set', sete: 'set', sets: 'set', kit: 'set', paketa: 'set', m2: 'm2', m: 'm' };
const YES = new Set(['po', 'yes', 'y', 'true', '1', 'x', 'ja', 'po kerkon']);
const NO = new Set(['jo', 'no', 'n', 'false', '0', '-', 'pa']);
/** "Me porosi" / "Made to order" / "∞" in the stock column = not stock-tracked. */
const TO_ORDER = /^(me porosi|prodhim me porosi|made to order|to order|on demand|∞|unlimited)$/;

export function matchCategory(raw: string, categories: Category[]): string | null {
  const v = fold(raw.trim());
  if (!v) return null;
  const c = categories.find((x) => x.id === raw.trim() || x.slug === slugify(raw) || [x.name.sq, x.name.en].some((n) => fold(n) === v));
  return c?.id ?? null;
}

/** "500:0,44|1000:0,39" (also "500=0.44", ";" or newline between tiers) → tiers sorted by qty; null when invalid. */
export function parseTiers(raw: string | undefined): PriceTier[] | null {
  if (!raw?.trim()) return null;
  const parts = raw.split(/[|\n]+/).map((s) => s.trim()).filter(Boolean);
  const out: PriceTier[] = [];
  for (const part of parts) {
    const m = part.match(/^([\d.,\s]+)\s*[:=→>]\s*(.+)$/);
    if (!m) return null;
    const qty = parseInt(m[1].replace(/[^\d]/g, ''), 10);
    const price = parseNumber(m[2]);
    if (!qty || qty < 1 || price == null || price <= 0) return null;
    out.push({ qty, price: roundUnit(price) });
  }
  out.sort((a, b) => a.qty - b.qty);
  return checkTiers(out).some(Boolean) ? null : out;
}

/** Tiers back to the CSV cell (decimal comma for SQ). */
export function formatTiers(tiers: PriceTier[] | undefined, decimalComma: boolean) {
  return (tiers ?? []).map((x) => `${x.qty}:${decimalComma ? String(x.price).replace('.', ',') : x.price}`).join('|');
}

const flag = (raw: string | undefined): boolean | null => {
  if (raw == null || raw === '') return null;
  const v = fold(raw.trim());
  return YES.has(v) ? true : NO.has(v) ? false : null;
};

/** Design service cell: "45,00" (per order line) · "0,05 / copë" (per piece) · "jo" (not offered). */
function parseDesign(raw: string | undefined): Product['installation'] | 'invalid' | undefined {
  if (raw == null || raw.trim() === '') return undefined;
  if (flag(raw) === false) return { available: false, price: 0 };
  const perUnit = /(\/|per)\s*(cope|copë|pc|pcs|piece|unit|njesi)/i.test(raw);
  const price = parseNumber(raw.replace(/(\/|per).*$/i, ''));
  if (price == null || price < 0) return 'invalid';
  return { available: price > 0, price, per: perUnit ? 'unit' : 'line' };
}

function parseChannels(raw: string | undefined): SalesChannel[] | null {
  if (raw == null || raw.trim() === '') return null;
  const v = fold(raw);
  const out: SalesChannel[] = [];
  if (/online|dyqani|web/.test(v)) out.push('online');
  if (/pos|direkt|direct/.test(v)) out.push('pos');
  return out;
}

const parseTemplate = (raw: string | undefined): 'standard' | 'quote' | null => (raw?.trim() ? (/ofert|quote/.test(fold(raw)) ? 'quote' : 'standard') : null);

function read(row: string[], mapping: MappedField[]) {
  const values: Partial<Record<ImportField, string>> = {};
  mapping.forEach((f, i) => {
    if (f !== 'ignore' && row[i] != null && row[i] !== '' && values[f] == null) values[f] = row[i];
  });
  return values;
}

export function validateRows(rows: string[][], mapping: MappedField[], products: ProductX[], categories: Category[], opts: ImportOptions): ImportRow[] {
  const bySku = new Map<string, Product>();
  for (const p of products) for (const s of skusOf(p)) bySku.set(s.toUpperCase(), p);
  const firstLine = new Map<string, number>();

  return rows.map((row, i): ImportRow => {
    const line = i + 2;
    const values = read(row, mapping);
    const errors: Issue[] = [];
    const warnings: Issue[] = [];
    let name = values.name_sq?.trim() ?? '';
    if (!name && values.name_en) {
      name = values.name_en.trim();
      warnings.push({ code: 'nameFromOther' });
    }
    const sku = (values.sku ?? '').trim().toUpperCase();
    const existing = sku ? bySku.get(sku) : undefined;
    if (!name && !existing) errors.push({ code: 'noName' });

    const num = (f: ImportField) => {
      const raw = values[f];
      if (raw == null || raw === '') return null;
      const n = parseNumber(raw);
      if (n == null) errors.push({ code: 'badNumber', field: f, value: raw });
      else if (n < 0) errors.push({ code: 'negative', field: f, value: raw });
      return n;
    };
    const tiers = parseTiers(values.tiers);
    if (values.tiers && !tiers) errors.push({ code: 'badTiers', field: 'tiers', value: values.tiers });
    const price = tiers ? tiers[0].price : num('price');
    const compareAt = tiers ? null : num('compareAt');
    num('cost');
    num('moq');
    num('qtyStep');
    num('leadDays');
    if (values.stock != null && !TO_ORDER.test(fold(values.stock.trim()))) num('stock');
    if (!existing && !values.tiers && (values.price == null || price === 0)) errors.push({ code: 'noPrice' });
    if (compareAt != null && price != null && compareAt <= price) warnings.push({ code: 'compareLow', value: values.compareAt });
    if (values.artwork && flag(values.artwork) == null) warnings.push({ code: 'badFlag', field: 'artwork', value: values.artwork });
    if (parseDesign(values.design) === 'invalid') warnings.push({ code: 'badFlag', field: 'design', value: values.design });

    let categoryId = existing?.categoryId ?? '';
    if (values.category) {
      const hit = matchCategory(values.category, categories);
      if (hit) categoryId = hit;
      else warnings.push({ code: 'unknownCategory', value: values.category });
    } else if (!existing) warnings.push({ code: 'noCategory' });

    if (values.status && !STATUS[fold(values.status.trim())]) warnings.push({ code: 'badStatus', value: values.status });

    let dupOfLine: number | undefined;
    if (sku) {
      const first = firstLine.get(sku);
      if (first) {
        dupOfLine = first;
        errors.push({ code: 'dupFile', value: sku });
      } else firstLine.set(sku, line);
    }
    if (existing && !dupOfLine) warnings.push({ code: 'exists', value: sku });

    const action: ImportRow['action'] = errors.length ? 'skip' : existing ? (opts.onExisting === 'update' ? 'update' : 'skip') : 'create';
    if (action === 'create') {
      const wantActive = opts.newStatus === 'column' && STATUS[fold(values.status?.trim() ?? '')] === 'active';
      if (wantActive && missingForPublish({ name: { sq: name, en: '' }, categoryId, price: price ?? 0, images: values.image ? ['x'] : [] }, categories).length) {
        warnings.push({ code: 'notPublishable' });
      }
    }
    return { line, values, name: name || existing?.name.sq || '', sku, price, tiers, categoryId, errors, warnings, existing, dupOfLine, action };
  });
}

const splitList = (raw?: string) =>
  (raw ?? '')
    .split(/[;|,]/)
    .map((s) => s.trim())
    .filter(Boolean);

const int = (raw: string | undefined) => {
  const n = raw != null && raw !== '' ? parseNumber(raw) : null;
  return n != null && n > 0 ? Math.round(n) : undefined;
};

/** Build the product to store for a validated row (create or update). Empty cells leave existing values unchanged. */
export function buildProduct(row: ImportRow, opts: ImportOptions, categories: Category[], all: Pick<Product, 'id' | 'slug'>[]): ProductX {
  const v = row.values;
  const n = (f: ImportField) => (v[f] != null && v[f] !== '' ? parseNumber(v[f]) : null);
  const now = new Date().toISOString();
  const statusCol = v.status ? STATUS[fold(v.status.trim())] : undefined;
  const images = v.image ? v.image.split(/[|\s]+/).map((s) => s.trim()).filter(Boolean) : null;
  const toOrder = v.stock != null && TO_ORDER.test(fold(v.stock.trim()));
  const stock = toOrder ? UNTRACKED_STOCK : n('stock') != null ? Math.min(MAX_TRACKED, Math.round(n('stock') as number)) : null;
  const unit = v.unit ? UNITS[fold(v.unit.trim())] : undefined;
  const artwork = flag(v.artwork);
  const designRaw = parseDesign(v.design);
  const design = designRaw === 'invalid' ? undefined : designRaw;
  const channels = parseChannels(v.channels);
  const template = parseTemplate(v.template);
  const handle = v.handle ? slugify(v.handle) : '';

  if (row.action === 'update' && row.existing) {
    const p = row.existing as ProductX;
    const next: ProductX = { ...p, categoryId: row.categoryId || p.categoryId, updatedAt: now };
    if (row.tiers) Object.assign(next, { tiers: row.tiers, price: row.tiers[0].price, salePrice: null });
    else if ((v.price != null || v.compareAt != null) && !p.tiers?.length) {
      // tiered products keep their tiers: the price column of an export is just the first tier
      const price = n('price') ?? (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price);
      const compare = v.compareAt != null ? n('compareAt') : p.salePrice && p.salePrice < p.price ? p.price : null;
      Object.assign(next, applyPricing(price, compare));
    }
    if (v.name_sq) next.name = { ...next.name, sq: v.name_sq.trim() };
    if (v.name_en) next.name = { ...next.name, en: v.name_en.trim() };
    if (handle) next.slug = uniqueSlug(handle, p.id, all);
    if (v.description) next.description = { ...p.description, sq: v.description.trim() };
    if (v.barcode) next.barcode = v.barcode.trim();
    if (n('cost') != null) next.cost = n('cost') as number;
    if (v.vendor) next.vendor = v.vendor.trim();
    if (v.tags) next.tags = splitList(v.tags);
    if (int(v.moq)) next.moq = int(v.moq);
    if (int(v.qtyStep)) next.qtyStep = int(v.qtyStep);
    if (int(v.leadDays)) next.leadDays = int(v.leadDays);
    if (artwork != null) next.artwork = artwork;
    if (design) next.installation = design;
    if (stock != null) next.stock = stock;
    if (unit) next.unit = unit;
    if (channels) next.channels = channels;
    if (template) Object.assign(next, { template, quoteOnly: template === 'quote' });
    if (images?.length) next.images = images;
    if (statusCol && opts.newStatus === 'column') {
      next.status = statusCol === 'active' && missingForPublish(next, categories).length ? p.status : statusCol;
    }
    return next;
  }

  const id = uid('p');
  const name = { sq: row.name, en: v.name_en?.trim() ?? '' };
  const base: ProductX = {
    id,
    slug: uniqueSlug(handle || slugify(row.name) || id, id, all),
    sku: row.sku,
    categoryId: row.categoryId,
    name,
    short: { sq: '', en: '' },
    description: { sq: v.description?.trim() ?? '', en: '' },
    ...(row.tiers ? { price: row.tiers[0].price, salePrice: null, tiers: row.tiers } : applyPricing(n('price'), n('compareAt'))),
    unit: unit ?? 'kom',
    // print is made to order unless the file gives a stock number
    stock: stock ?? UNTRACKED_STOCK,
    images: images ?? [],
    options: [],
    specs: [],
    installation: design ?? { available: true, price: 45, per: 'line' },
    artwork: artwork ?? true,
    moq: int(v.moq),
    qtyStep: int(v.qtyStep),
    badges: ['new'],
    featured: false,
    status: 'draft',
    quoteOnly: template === 'quote',
    leadDays: int(v.leadDays) ?? 10,
    createdAt: now,
    sold: 0,
    vendor: v.vendor?.trim() || undefined,
    tags: splitList(v.tags),
    barcode: v.barcode?.trim() || undefined,
    cost: n('cost') ?? undefined,
    incoming: 0,
    unavailable: 0,
    template: template ?? 'standard',
    channels: channels ?? ['online', 'pos'],
  };
  if (opts.newStatus === 'column' && statusCol) base.status = statusCol === 'active' && missingForPublish(base, categories).length ? 'draft' : statusCol;
  return base;
}

/** A ready-made sample (PrintWorks data incl. one existing SKU, one duplicate and two errors). */
export const SAMPLE_CSV = [
  'Emri (SQ);Emri (EN);SKU;Kategoria;Çmimi;Çmimet sipas sasisë;Sasia minimale;Hapi i sasisë;Skedar printimi;Dizajn & prepress (€);Afati (ditë pune);Kosto / copë;Stoku;Etiketat',
  'Kuti burgeri me dritare;Burger box with window;PW-FD-120;Paketime ushqimore;;250:0,96|500:0,69|1000:0,51|2500:0,40;250;250;po;45,00;10;0,31;Me porosi;burger|takeaway',
  'Kuti pice tetëkëndore;Octagonal pizza box;PW-FD-001;Paketime ushqimore;;250:0,76|500:0,57|1000:0,43|2500:0,35|5000:0,30|10000:0,26;250;250;po;45,00;10;;;',
  'Etiketa për kavanoza mjalti;Honey jar labels;PW-LB-120;Etiketa & shrink sleeve;;1000:0,11|2500:0,07|5000:0,05|10000:0,038;1000;500;po;45,00;6;0,03;Me porosi;etiketa|ushqim',
  'Etiketa për kavanoza mjalti — ari;Honey jar labels — gold;PW-LB-120;Etiketa & shrink sleeve;;1000:0,14|2500:0,09;1000;500;po;45,00;7;;Me porosi;etiketa',
  'Qese kraft me logo;Kraft bag with logo;PW-BG-120;Qese letre;;250:0,62|500:0,70;250;50;po;45,00;12;;Me porosi;qese|kraft',
  'Dosje prezantimi A4;A4 presentation folder;PW-PR-120;Materiale promovuese;;;250;50;po;45,00;9;;;dosje',
  'Paketë mostrash për etiketa;Label sample pack;PW-FN-120;Finishing & efekte;12,00;;;;jo;jo;1;6,50;40;mostra',
].join('\n');
