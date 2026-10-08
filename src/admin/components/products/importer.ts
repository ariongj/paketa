// CSV product import (PDF p.09): field mapping, validation, duplicate-SKU report, then create/update.
import type { Category, PriceTier, Product, ProductStatus, Unit } from '@/lib/types';
import { fold } from '@/lib/search';
import { slugify, uid } from '@/lib/utils';
import { parseNumber } from './csv';
import { applyPricing, missingForPublish, skusOf, uniqueSlug, MAX_TRACKED, type ProductX } from './model';

export const IMPORT_FIELDS = ['name_sq', 'name_en', 'name_me', 'sku', 'barcode', 'price', 'compareAt', 'cost', 'category', 'vendor', 'tags', 'stock', 'status', 'unit', 'packSize', 'cartonPacks', 'tiers', 'description', 'image'] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];
export type MappedField = ImportField | 'ignore';

/** Generic "name" headers — mapped to the Albanian (primary) name unless a language suffix says otherwise. */
const NAME_WORDS = ['name', 'naziv', 'title', 'titulli', 'emri', 'product', 'produkti', 'proizvod', 'artikulli'];

/** Header synonyms in SQ / EN / SR, Shopify's export names and the machine names (folded, lower-case). */
const SYNONYMS: Record<ImportField, string[]> = {
  name_sq: [...NAME_WORDS, 'name sq', 'naziv sq', 'emri sq', 'titulli sq', 'title sq', 'emri shqip', 'name al'],
  name_en: ['name en', 'naziv en', 'emri en', 'title en', 'titulli en', 'english name'],
  name_me: ['name sr', 'naziv sr', 'emri sr', 'title sr', 'titulli sr', 'name me', 'naziv me', 'emri me', 'srpski naziv'],
  sku: ['sku', 'sifra', 'kodi', 'code', 'variant sku', 'artikal', 'kod'],
  barcode: ['barcode', 'barkod', 'barkodi', 'ean', 'gtin', 'variant barcode'],
  price: ['price', 'cijena', 'cmimi', 'variant price', 'prodajna cijena', 'cmimi i shitjes'],
  compareAt: ['compare at', 'compare at price', 'compareat', 'variant compare at price', 'cmimi referues', 'referentna cijena', 'redovna cijena', 'stara cijena', 'cmimi i vjeter'],
  cost: ['cost', 'kosto', 'kosto cope', 'cost per item', 'trosak', 'trosak kom', 'nabavna cijena', 'nabavna'],
  category: ['category', 'kategorija', 'kategoria', 'product type', 'type', 'grupa'],
  vendor: ['vendor', 'furnitori', 'dobavljac', 'brand', 'marka', 'proizvodjac', 'prodhuesi'],
  tags: ['tags', 'etiketat', 'etiketa', 'oznake', 'tagovi'],
  stock: ['stock', 'zalihe', 'stoku', 'sasia', 'qty', 'quantity', 'inventory', 'variant inventory qty', 'kolicina', 'na stanju'],
  status: ['status', 'statusi'],
  unit: ['unit', 'jedinica', 'njesia', 'jedinica mjere', 'njesia e shitjes'],
  packSize: ['pack size', 'packsize', 'cope ne pako', 'cope pako', 'cope per pako', 'pieces per pack', 'pcs per pack', 'komada u pakovanju', 'kom u pakovanju', 'kom pak'],
  cartonPacks: ['carton packs', 'cartonpacks', 'pako ne karton', 'pako per karton', 'packs per carton', 'pakovanja u kartonu', 'pak u kartonu', 'karton', 'carton'],
  tiers: ['tiers', 'volume tiers', 'volume pricing', 'cmime shumice', 'cmimet e shumices', 'shumice', 'kolicinske cijene', 'veleprodaja', 'rabat'],
  description: ['description', 'opis', 'pershkrimi', 'body', 'body html'],
  image: ['image', 'images', 'slika', 'slike', 'imazhi', 'imazhet', 'image src', 'foto'],
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
      const lang = /\b(sq|al|shqip)\b/.test(n) ? 'sq' : /\b(en|eng|english)\b/.test(n) ? 'en' : /\b(sr|me|srp|srpski)\b/.test(n) ? 'me' : null;
      const bare = n.replace(/\b(me|sr|srp|srpski|sq|al|en|eng|shqip|english)\b/g, '').trim();
      if (lang && NAME_WORDS.includes(bare)) hit = lang === 'sq' ? 'name_sq' : lang === 'en' ? 'name_en' : 'name_me';
      else hit = IMPORT_FIELDS.find((f) => !taken.has(f) && SYNONYMS[f].some((s) => s.length > 3 && (bare === s || bare.startsWith(`${s} `))));
    }
    if (hit && !taken.has(hit)) {
      taken.add(hit);
      return hit;
    }
    return 'ignore';
  });
}

export type IssueCode = 'noName' | 'noPrice' | 'badNumber' | 'negative' | 'dupFile' | 'exists' | 'noCategory' | 'unknownCategory' | 'compareLow' | 'badStatus' | 'notPublishable' | 'nameFromOther' | 'badTiers' | 'badUnit' | 'noPackSize';
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
  active: 'active', aktiv: 'active', aktivan: 'active', aktivno: 'active', published: 'active', publikuar: 'active', objavljen: 'active',
  draft: 'draft', nacrt: 'draft', skica: 'draft',
  archived: 'archived', arkivuar: 'archived', arhiviran: 'archived', arhivirano: 'archived',
};
/** Accepted unit values (folded): pack | kom | set | m, plus the SQ / SR / EN words. */
const UNITS: Record<string, Unit> = {
  pack: 'pack', packs: 'pack', pako: 'pack', pak: 'pack', paket: 'pack', pakovanje: 'pack', sleeve: 'pack',
  kom: 'kom', pc: 'kom', pcs: 'kom', cope: 'kom', piece: 'kom', komad: 'kom',
  set: 'set', sets: 'set', komplet: 'set',
  m: 'm', metre: 'm', meter: 'm', meteri: 'm', metar: 'm',
};
const unitOf = (raw?: string) => (raw ? UNITS[fold(raw.trim()).replace(/\.$/, '')] : undefined);

/** "10:5|20:10" (also "10+:5%; 20=10") → [{minQty:10,pct:5},{minQty:20,pct:10}]; null when malformed. */
export function parseTiers(raw: string): PriceTier[] | null {
  const parts = raw.split(/[|;,/]+/).map((x) => x.trim()).filter(Boolean);
  if (!parts.length) return [];
  const out: PriceTier[] = [];
  for (const part of parts) {
    const m = /^(\d+)\s*\+?\s*[:=>]\s*-?\s*(\d+(?:[.]\d+)?)\s*%?$/.exec(part);
    if (!m) return null;
    const minQty = Number(m[1]);
    const pct = Number(m[2]);
    if (minQty < 2 || pct <= 0 || pct > 90 || out.some((t) => t.minQty === minQty)) return null;
    out.push({ minQty, pct });
  }
  return out.sort((a, b) => a.minQty - b.minQty);
}

/** Back to the CSV form: "10:5|20:10". */
export const tiersToText = (tiers: PriceTier[] | undefined) => (tiers ?? []).map((t) => t.minQty + ':' + t.pct).join('|');

export function matchCategory(raw: string, categories: Category[]): string | null {
  const v = fold(raw.trim());
  if (!v) return null;
  const c = categories.find((x) => x.id === raw.trim() || x.slug === slugify(raw) || [x.name.me, x.name.sq, x.name.en].some((n) => fold(n) === v));
  return c?.id ?? null;
}

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
    if (!name && (values.name_en || values.name_me)) {
      name = (values.name_en || values.name_me || '').trim();
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
    const price = num('price');
    const compareAt = num('compareAt');
    num('cost');
    num('stock');
    const packSize = num('packSize');
    num('cartonPacks');
    if (values.tiers && parseTiers(values.tiers) == null) errors.push({ code: 'badTiers', value: values.tiers });
    const unit = unitOf(values.unit);
    if (values.unit && !unit) warnings.push({ code: 'badUnit', value: values.unit });
    const finalUnit = unit ?? (existing ? existing.unit : packSize ? 'pack' : 'kom');
    if (finalUnit === 'pack' && !packSize && !existing?.packSize) warnings.push({ code: 'noPackSize' });
    if (values.price == null && !existing) errors.push({ code: 'noPrice' });
    else if (price === 0 && !existing) errors.push({ code: 'noPrice' });
    if (compareAt != null && price != null && compareAt <= price) warnings.push({ code: 'compareLow', value: values.compareAt });

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
      if (wantActive && missingForPublish({ name: { me: '', sq: name, en: '' }, categoryId, price: price ?? 0, images: values.image ? ['x'] : [] }, categories).length) {
        warnings.push({ code: 'notPublishable' });
      }
    }
    return { line, values, name: name || existing?.name.sq || '', sku, price, categoryId, errors, warnings, existing, dupOfLine, action };
  });
}

const splitList = (raw?: string) =>
  (raw ?? '')
    .split(/[;|,]/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Build the product to store for a validated row (create or update). */
export function buildProduct(row: ImportRow, opts: ImportOptions, categories: Category[], all: Pick<Product, 'id' | 'slug'>[]): ProductX {
  const v = row.values;
  const n = (f: ImportField) => (v[f] != null && v[f] !== '' ? parseNumber(v[f]) : null);
  const now = new Date().toISOString();
  const statusCol = v.status ? STATUS[fold(v.status.trim())] : undefined;
  const images = v.image ? v.image.split(/[|\s]+/).map((s) => s.trim()).filter(Boolean) : null;
  const stock = n('stock');
  const unit = unitOf(v.unit);
  const packSize = n('packSize');
  const cartonPacks = n('cartonPacks');
  const tiers = v.tiers ? parseTiers(v.tiers) : null;
  const intOrUndef = (x: number | null) => (x != null && x > 0 ? Math.round(x) : undefined);

  if (row.action === 'update' && row.existing) {
    const p = row.existing as ProductX;
    const price = n('price') ?? (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price);
    const compare = v.compareAt != null ? n('compareAt') : p.salePrice && p.salePrice < p.price ? p.price : null;
    const next: ProductX = {
      ...p,
      ...applyPricing(price, compare),
      name: v.name_sq ? { ...p.name, sq: v.name_sq.trim() } : p.name,
      categoryId: row.categoryId || p.categoryId,
      updatedAt: now,
    };
    if (v.name_en) next.name = { ...next.name, en: v.name_en.trim() };
    if (v.name_me) next.name = { ...next.name, me: v.name_me.trim() };
    if (v.description) next.description = { ...p.description, sq: v.description.trim() };
    if (v.barcode) next.barcode = v.barcode.trim();
    if (n('cost') != null) next.cost = n('cost') as number;
    if (v.vendor) next.vendor = v.vendor.trim();
    if (v.tags) next.tags = splitList(v.tags);
    if (stock != null) next.stock = Math.min(MAX_TRACKED, Math.round(stock));
    if (unit) next.unit = unit;
    if (packSize != null) next.packSize = intOrUndef(packSize);
    if (cartonPacks != null) next.cartonPacks = intOrUndef(cartonPacks);
    if (tiers) next.tiers = tiers.length ? tiers : undefined;
    if (next.unit !== 'pack') {
      next.packSize = undefined;
      next.cartonPacks = undefined;
    }
    if (images?.length) next.images = images;
    if (statusCol && opts.newStatus === 'column') {
      next.status = statusCol === 'active' && missingForPublish(next, categories).length ? p.status : statusCol;
    }
    return next;
  }

  const id = uid('p');
  const newUnit: Unit = unit ?? (packSize ? 'pack' : 'kom');
  const name = { me: v.name_me?.trim() ?? '', sq: row.name, en: v.name_en?.trim() ?? '' };
  const base: ProductX = {
    id,
    slug: uniqueSlug(slugify(row.name) || id, id, all),
    sku: row.sku,
    categoryId: row.categoryId,
    name,
    short: { me: '', sq: '', en: '' },
    description: { me: '', sq: v.description?.trim() ?? '', en: '' },
    ...applyPricing(n('price'), n('compareAt')),
    unit: newUnit,
    ...(newUnit === 'pack' ? { packSize: intOrUndef(packSize), cartonPacks: intOrUndef(cartonPacks) } : {}),
    ...(tiers?.length ? { tiers } : {}),
    stock: stock != null ? Math.min(MAX_TRACKED, Math.round(stock)) : 0,
    images: images ?? [],
    options: [],
    specs: [],
    installation: null,
    badges: ['new'],
    featured: false,
    status: 'draft',
    quoteOnly: false,
    leadDays: 2,
    createdAt: now,
    sold: 0,
    vendor: v.vendor?.trim() || undefined,
    tags: splitList(v.tags),
    barcode: v.barcode?.trim() || undefined,
    cost: n('cost') ?? undefined,
    incoming: 0,
    unavailable: 0,
    template: 'standard',
    channels: ['online', 'pos'],
  };
  if (opts.newStatus === 'column' && statusCol) base.status = statusCol === 'active' && missingForPublish(base, categories).length ? 'draft' : statusCol;
  return base;
}

/**
 * A ready-made sample (Paketoje packaging incl. one existing SKU → update, one duplicate in the file,
 * one row without a price → error, one malformed tier list → error).
 */
export const SAMPLE_CSV = [
  'Emri;Emri (EN);SKU;Kategoria;Çmimi;Çmimi referues;Kosto;Njësia;Copë në pako;Pako në karton;Çmime shumice;Stoku;Etiketat',
  'Gotë letre kraft 8 oz me dorezë;Kraft paper cup 8 oz with handle;PAK-110;Gota;3,20;;1,90;pack;50;20;10:5|20:10;180;kafe|eko|e re',
  'Gotë letre kraft 12 oz;Kraft paper cup 12 oz;PAK-111;Gota;3,80;4,20;2,30;pack;50;20;10:5|20:10;140;kafe|eko',
  'Gota Plastike F95 400ml CC;F95 Plastic Cup – 400ml (Cold Cup);PAK-104;Gota;2,50;;1,40;pack;50;20;10:5|20:10;520;smoothie',
  'Kuti kartoni për burger;Cardboard burger box;PAK-311;Enë ushqimi;6,50;;3,90;pack;50;10;10:8;90;fast-food',
  'Kuti kartoni për burger XL;Cardboard burger box XL;PAK-311;Enë ushqimi;7,50;;4,40;pack;50;10;;60;fast-food',
  'Pirun druri 16 cm;Wooden fork 16 cm;PAK-511;Takëm & sete;;;;pack;100;20;;200;eko',
  'Shkop druri për kafe 14 cm;Wooden coffee stirrer 14 cm;PAK-605;Shkopinj & lugë kafeje;3,50;;2,00;pack;1000;10;5:5|5:8;300;kafe',
].join('\n');
