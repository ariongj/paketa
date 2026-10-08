// CMS v2 demo data — collections, discounts, offers, placements, staff, appointments, segments,
// inventory, purchasing, drafts, complaints, quotes, menus, content models and the audit log.
// Everything is relative to `now` so the demo always looks current, and coherent with the
// PrintWorks catalogue (packaging, labels, bags, promotional print) and its Kosovo B2B clients.
import type {
  AuditEntry, Booking, CartItem, Collection, ContentModel, Discount, DraftOrder, HomeSection, HomeVersion, Inquiry, InquirySource,
  InventoryMovement, L10n, Menu, Offer, Order, Placement, Product, Project, PurchaseOrder, Quote, ReturnRequest, Segment, Service, Staff,
} from '@/lib/types';
import { defaultOptions } from '@/lib/pricing';
import { grossFactor, refundForLines } from '@/lib/orders';
import { round2 } from '@/lib/utils';
import { LEGACY_PRODUCT, clientCustomer } from './demo';

const T = (sq: string, en: string): L10n => ({ sq, en });
const E = (): L10n => ({ sq: '', en: '' });
const DAY = 86400000;
const iso = (now: Date, days: number, hours = 0) => new Date(now.getTime() + days * DAY + hours * 3600000).toISOString();
const plain = (s: string) => s.replace(/\*/g, '');

/* ================================================================== */
/* Products — cost, vendor, tags, barcode, incoming, one archived      */
/* ================================================================== */
/** Internal cost as a share of the mid-tier price (setup is amortised over longer runs). */
const COST_FACTOR: Record<string, number> = {
  'cat-kuti-ushqimore': 0.52,
  'cat-kuti-produktesh': 0.5,
  'cat-etiketa': 0.46,
  'cat-qese-letre': 0.58,
  'cat-materiale-promovuese': 0.48,
  'cat-finishing': 0.55,
};

const IN_HOUSE = 'PrintWorks';
const BAG_PARTNER = 'Qeseria Lux Converting';
const BINDERY = 'Lidhja Studio';
const KIT_BOX_MAKER = 'Kutia Magnetike sh.p.k.';

const EXTRAS: Record<string, { tags: string[]; vendor?: string; incoming?: number; unavailable?: number; pos?: boolean }> = {
  'p-kuti-pice': { tags: ['ushqim', 'horeca', 'takeaway', 'karton-i-valezuar'] },
  'p-kuti-takeaway': { tags: ['ushqim', 'horeca', 'takeaway'] },
  'p-kuti-menu-femije': { tags: ['ushqim', 'horeca', 'femije'] },
  'p-mbajtese-patatesh': { tags: ['ushqim', 'horeca', 'takeaway', 'pa-plastike'] },
  'p-kuti-hot-dog': { tags: ['ushqim', 'horeca', 'takeaway', 'pa-plastike'] },
  'p-kuti-sushi': { tags: ['ushqim', 'horeca', 'premium'] },
  'p-kuti-torte': { tags: ['ushqim', 'pasticeri'] },
  'p-kuti-embelsirash': { tags: ['ushqim', 'pasticeri', 'festat'] },
  'p-kuti-katrore': { tags: ['ushqim', 'pasticeri', 'pa-plastike'] },
  'p-kuti-makarona': { tags: ['ushqim', 'pasticeri', 'premium', 'festat'] },
  'p-kuti-menu-familjare': { tags: ['ushqim', 'horeca', 'takeaway'] },
  'p-kuti-sanduici': { tags: ['ushqim', 'horeca', 'kafene'] },
  'p-tabaka-doreze': { tags: ['ushqim', 'horeca', 'street-food', 'pa-plastike'] },
  'p-mbajtese-donuti': { tags: ['ushqim', 'pasticeri', 'pa-plastike'] },
  'p-kuti-gable': { tags: ['dhurata', 'festat', 'kraft'] },
  'p-kuti-kozmetike': { tags: ['kozmetike', 'premium'] },
  'p-kuti-farmaceutike': { tags: ['farmaci', 'braille'] },
  'p-kuti-lodrash': { tags: ['lodra', 'retail'] },
  'p-kuti-mailer': { tags: ['e-commerce', 'premium', 'festat'] },
  'p-kuti-dhurate': { tags: ['e-commerce', 'dhurata', 'festat'] },
  'p-kuti-cokollate': { tags: ['premium', 'dhurata', 'festat'] },
  'p-kuti-caji': { tags: ['ushqim', 'kraft'] },
  'p-mbajtese-gotash': { tags: ['horeca', 'kafene', 'kraft', 'pa-plastike'] },
  'p-etiketa-vere': { tags: ['etiketa', 'pije', 'premium', 'festat'] },
  'p-etiketa-kozmetike': { tags: ['etiketa', 'kozmetike'] },
  'p-etiketa-transparente': { tags: ['etiketa', 'kozmetike', 'premium'] },
  'p-etiketa-detergjent': { tags: ['etiketa', 'pastrim'] },
  'p-etiketa-ushqimore': { tags: ['etiketa', 'ushqim'] },
  'p-etiketa-vaj': { tags: ['etiketa', 'ushqim', 'premium'] },
  'p-etiketa-letra-lagura': { tags: ['etiketa', 'higjiene'] },
  'p-shrink-sleeve': { tags: ['pije', 'shrink'] },
  'p-qese-premium': { tags: ['retail', 'premium', 'festat'], vendor: BAG_PARTNER, incoming: 800 },
  'p-qese-ngjyre': { tags: ['retail'] },
  'p-qese-kraft': { tags: ['retail', 'kraft', 'pa-plastike', 'horeca'] },
  'p-qese-luksoze': { tags: ['retail', 'premium', 'festat'], vendor: BAG_PARTNER },
  'p-qese-pastel': { tags: ['retail'] },
  'p-qese-blerjesh': { tags: ['retail'] },
  'p-kartevizita': { tags: ['promo'], pos: true },
  'p-fletepalosje': { tags: ['promo', 'horeca'], pos: true },
  'p-katalog': { tags: ['promo', 'botime'], incoming: 1500 },
  'p-dosje': { tags: ['promo', 'korporative'] },
  'p-blloqe': { tags: ['promo', 'korporative', 'festat'], vendor: BINDERY, incoming: 500, pos: true },
  'p-hot-foil': { tags: ['finishing', 'premium'] },
  'p-reliev': { tags: ['finishing', 'premium'] },
  'p-folje-uv': { tags: ['finishing', 'premium'] },
  'p-mostra': { tags: ['mostra'], unavailable: 2, pos: true },
};

/** EAN-13 in the GS1 "internal use" range (prefix 200) — warehouse labels for finished goods. */
function ean13(n: number) {
  const body = `200${String(100000000 + n * 7919).slice(-9)}`;
  const sum = body.split('').reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return body + ((10 - (sum % 10)) % 10);
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const midPrice = (p: Product) => (p.tiers?.length ? p.tiers[Math.floor((p.tiers.length - 1) / 2)].price : p.price);

/** The square pizza box sold until the octagonal one replaced it (archived by seed.ts after the orders). */
function legacyProduct(base: Product, now: Date): Product {
  return {
    ...structuredClone(base),
    id: LEGACY_PRODUCT.id,
    slug: 'kuti-pice-katrore',
    sku: 'PW-FD-090',
    name: T('Kuti pice katrore (seria 2025)', 'Square pizza box (2025 series)'),
    short: T('Modeli i mëparshëm katror — zëvendësuar nga kutia tetëkëndore.', 'The previous square model — replaced by the octagonal box.'),
    description: T(
      'Kuti pice katrore nga mikrovalë E me printim CMYK. U zëvendësua nga kutia tetëkëndore, e cila i forcon qoshet dhe e mban picën më të nxehtë. Mbetet në histori për porositë e vjetra.',
      'Square E-flute pizza box printed CMYK. Replaced by the octagonal box, which stiffens the corners and keeps the pizza hotter. Kept for the history of older orders.',
    ),
    tiers: (base.tiers ?? []).map((t) => ({ qty: t.qty, price: round2(t.price * 0.96) })),
    price: round2(base.price * 0.96),
    badges: [],
    featured: false,
    sold: 18500,
    createdAt: iso(now, -640),
    updatedAt: iso(now, -LEGACY_PRODUCT.archivedDaysAgo),
  };
}

/** Adds CMS v2 fields to the catalogue (cost, vendor, tags, barcode, incoming, channels, template) + the legacy line. */
export function enrichProducts(products: Product[], now = new Date()): Product[] {
  const base = products.find((p) => p.id === LEGACY_PRODUCT.replaces);
  const list = base ? products.flatMap((p) => (p === base ? [p, legacyProduct(base, now)] : [p])) : products;
  return list.map((p, i): Product => {
    const x = EXTRAS[p.id === LEGACY_PRODUCT.id ? LEGACY_PRODUCT.replaces : p.id];
    const express = !p.quoteOnly && (p.leadDays ?? 99) <= 5;
    return {
      ...p,
      cost: r3(midPrice(p) * (p.id === 'p-mostra' ? 0.42 : (COST_FACTOR[p.categoryId] ?? 0.55))),
      vendor: x?.vendor ?? (p.id === 'p-mostra' ? KIT_BOX_MAKER : IN_HOUSE),
      tags: [...new Set([...(x?.tags ?? []), ...(express ? ['ekspres'] : [])])],
      barcode: ean13(i + 1),
      incoming: x?.incoming ?? 0,
      unavailable: x?.unavailable ?? 0,
      template: p.quoteOnly ? 'quote' : 'standard',
      channels: x?.pos ? ['online', 'pos'] : ['online'],
    };
  });
}

/**
 * Discontinued line, archived after it had sales (orders keep their copy). Not a catalogue product:
 * enrichProducts adds it next to the octagonal box it was replaced by, so the storefront is untouched.
 */
export const ARCHIVED_PRODUCT = LEGACY_PRODUCT.id;

/* ================================================================== */
/* Collections                                                         */
/* ================================================================== */
const festiveYear = (now: Date) => now.getFullYear();

export function buildCollections(now: Date): Collection[] {
  const year = festiveYear(now);
  return [
    {
      id: 'col-horeca',
      slug: 'restorante-dhe-takeaway',
      title: T('Për restorante & takeaway', 'For restaurants & takeaway'),
      description: T(
        'Kuti pice, takeaway, mbajtëse patatesh dhe gotash, tabaka dhe qese — gjithë paketimi i lokalit me ngjyrat e markës suaj.',
        'Pizza and takeaway boxes, fries scoops, cup carriers, trays and bags — all your venue’s packaging in your brand colours.',
      ),
      image: '/images/c/kuti-ushqimore.webp',
      kind: 'smart',
      productIds: [],
      match: 'any',
      rules: [{ field: 'tag', op: 'eq', value: 'horeca' }],
      sort: 'bestselling',
      published: true,
      seo: { title: 'Paketim për restorante dhe takeaway — PrintWorks', description: 'Kuti pice, takeaway dhe mbajtëse të printuara me markën tuaj, nga 250 copë.' },
      createdAt: iso(now, -95),
    },
    {
      id: 'col-kraft',
      slug: 'paketim-i-qendrueshem',
      title: T('Paketim i qëndrueshëm (kraft & pa plastikë)', 'Sustainable packaging (kraft & plastic-free)'),
      description: T(
        'Karton kraft, llak dispersion në vend të laminimit dhe mbajtëse pa plastikë — e riciklueshme, e printuar me ngjyra të plota.',
        'Kraft board, dispersion varnish instead of film and plastic-free holders — recyclable and printed in full colour.',
      ),
      image: '/images/p/qese-kraft.webp',
      kind: 'smart',
      productIds: [],
      match: 'any',
      rules: [
        { field: 'tag', op: 'eq', value: 'kraft' },
        { field: 'tag', op: 'eq', value: 'pa-plastike' },
      ],
      sort: 'bestselling',
      published: true,
      createdAt: iso(now, -60),
    },
    {
      id: 'col-ekspres',
      slug: 'gati-per-3-5-dite',
      title: T('Gati për 3–5 ditë', 'Ready in 3–5 days'),
      description: T(
        'Produkte me afat të shkurtër prodhimi pas aprovimit të provës — për lansime dhe evente që nuk presin.',
        'Short production time after proof approval — for launches and events that can’t wait.',
      ),
      image: '/images/p/kartevizita.webp',
      kind: 'smart',
      productIds: [],
      match: 'all',
      rules: [{ field: 'tag', op: 'eq', value: 'ekspres' }],
      sort: 'price-asc',
      published: true,
      createdAt: iso(now, -45),
    },
    {
      id: 'col-te-kerkuarat',
      slug: 'me-te-kerkuarat',
      title: T('Më të kërkuarat', 'Most requested'),
      description: T('Paketimet dhe etiketat që klientët tanë porosisin më shpesh.', 'The packaging and labels our clients order most often.'),
      image: '/images/p/kuti-pice.webp',
      kind: 'manual',
      productIds: ['p-kuti-pice', 'p-etiketa-ushqimore', 'p-kuti-kozmetike', 'p-qese-kraft', 'p-kuti-mailer', 'p-kartevizita', 'p-kuti-embelsirash', 'p-shrink-sleeve'],
      match: 'all',
      rules: [],
      sort: 'bestselling',
      published: true,
      createdAt: iso(now, -120),
    },
    {
      id: 'col-festat',
      slug: 'festat',
      title: T(`Festat ${year}`, `Holidays ${year}`),
      description: T(
        'Kuti dhuratash, mailer, qese luksoze dhe etiketa vere për sezonin e festave — porositni me kohë, tirazhet planifikohen sipas radhës.',
        'Gift boxes, mailers, luxury bags and wine labels for the holiday season — order early, runs are scheduled first come, first served.',
      ),
      image: '/images/p/kuti-dhurate-mailer.webp',
      kind: 'manual',
      productIds: ['p-kuti-dhurate', 'p-kuti-mailer', 'p-kuti-gable', 'p-kuti-makarona', 'p-kuti-embelsirash', 'p-qese-luksoze', 'p-qese-premium', 'p-etiketa-vere', 'p-blloqe', 'p-kuti-cokollate'],
      match: 'all',
      rules: [],
      sort: 'manual',
      published: true,
      seo: { title: `Paketim për festat ${year} — PrintWorks`, description: 'Kuti dhuratash, qese luksoze dhe etiketa vere me −10% gjatë fushatës së festave.' },
      createdAt: iso(now, -8),
    },
    {
      id: 'col-etiketa-premium',
      slug: 'etiketa-premium',
      title: T('Etiketa premium', 'Premium labels'),
      description: T('Letër e strukturuar, PP transparente, folje dhe reliev — për vera, vajra dhe kozmetikë.', 'Textured paper, clear PP, foil and embossing — for wine, oil and cosmetics.'),
      image: '/images/p/etiketa-vere.webp',
      kind: 'smart',
      productIds: [],
      match: 'all',
      rules: [
        { field: 'category', op: 'eq', value: 'cat-etiketa' },
        { field: 'badge', op: 'eq', value: 'premium' },
      ],
      sort: 'price-desc',
      published: true,
      createdAt: iso(now, -30),
    },
    {
      id: 'col-ecommerce',
      slug: 'kit-per-dyqane-online',
      title: T('Kit për dyqane online', 'E-commerce starter kit'),
      description: T(
        'Kuti postare, kuti dhuratash, etiketa transparente dhe kartëvizita — gjithçka për një unboxing që ndahet në rrjete sociale.',
        'Mailer boxes, gift boxes, clear labels and business cards — everything for an unboxing worth sharing.',
      ),
      image: '/images/p/kuti-mailer-premium.webp',
      kind: 'manual',
      productIds: ['p-kuti-mailer', 'p-kuti-dhurate', 'p-etiketa-transparente', 'p-kartevizita', 'p-qese-ngjyre'],
      match: 'all',
      rules: [],
      sort: 'manual',
      published: false,
      createdAt: iso(now, -2),
    },
  ];
}

/* ================================================================== */
/* Discounts — all 4 types, code + automatic, every lifecycle state    */
/* ================================================================== */
const LABELS = ['p-etiketa-vere', 'p-etiketa-kozmetike', 'p-etiketa-transparente', 'p-etiketa-detergjent', 'p-etiketa-ushqimore', 'p-etiketa-vaj', 'p-etiketa-letra-lagura'];
const BAGS = ['p-qese-premium', 'p-qese-ngjyre', 'p-qese-kraft', 'p-qese-luksoze', 'p-qese-pastel', 'p-qese-blerjesh'];
const PROMO_PRINT = ['p-kartevizita', 'p-fletepalosje', 'p-katalog', 'p-dosje', 'p-blloqe'];
const BF_PRODUCTS = ['p-kuti-mailer', 'p-kuti-dhurate'];
const ALL_LINES = { scope: 'all' as const, ids: [] };
const NO_MIN = { type: 'none' as const, value: 0 };
const EVERYONE = { type: 'all' as const };
const yy = (d: Date) => String(d.getFullYear()).slice(2);

/** End of the holiday packaging campaign — export for a homepage promo countdown. */
export const festiveSaleEnd = (now: Date) => iso(now, 55);

/** Black Week: the Friday before Black Friday → Cyber Monday (always in the future for the demo). */
export function blackWeek(now: Date): { start: string; end: string } {
  const friday = (y: number) => {
    const d = new Date(y, 10, 1, 0, 0, 0, 0);
    d.setDate(1 + ((4 - d.getDay() + 7) % 7) + 21 + 1); // 4th Thursday of November + 1
    return d;
  };
  let bf = friday(now.getFullYear());
  if (bf.getTime() - 7 * DAY <= now.getTime()) bf = friday(now.getFullYear() + 1);
  return { start: new Date(bf.getTime() - 7 * DAY).toISOString(), end: new Date(bf.getTime() + 4 * DAY).toISOString() };
}

export function buildDiscounts(now: Date): Discount[] {
  const bw = blackWeek(now);
  const school = new Date(now.getTime() - 58 * DAY);
  return [
    {
      id: 'd-print10',
      title: 'Mirëseardhje B2B — PRINT10',
      publicTitle: T('Mirëseardhje −10%', 'Welcome −10%'),
      kind: 'order',
      method: 'code',
      code: 'PRINT10',
      valueType: 'percent',
      value: 10,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 300 },
      audience: EVERYONE,
      combines: { products: true, order: false, shipping: true },
      oncePerCustomer: true,
      startsAt: iso(now, -150),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -151),
      tags: ['mireseardhje', 'b2b'],
    },
    {
      id: 'd-transport250',
      title: 'Transport falas në Kosovë mbi €250',
      publicTitle: T('Transport falas mbi €250', 'Free delivery over €250'),
      kind: 'shipping',
      method: 'auto',
      valueType: 'percent',
      value: 100,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 250 },
      shipping: { zoneIds: ['z1', 'z2'] },
      audience: EVERYONE,
      combines: { products: true, order: true, shipping: false },
      startsAt: iso(now, -200),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -200),
      tags: ['transport'],
    },
    {
      id: 'd-etiketa15',
      title: 'Promo etiketash — −15% nga 5.000 copë (automatike)',
      publicTitle: T('Etiketa −15% nga 5.000 copë', 'Labels −15% from 5,000 pcs'),
      kind: 'products',
      method: 'auto',
      valueType: 'percent',
      value: 15,
      appliesTo: { scope: 'products', ids: LABELS },
      minimum: { type: 'qty', value: 5000 },
      audience: EVERYONE,
      combines: { products: true, order: true, shipping: true },
      startsAt: iso(now, -18),
      endsAt: iso(now, 23),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -19),
      tags: ['etiketa', 'volum'],
    },
    {
      id: 'd-mostra19',
      title: 'Kredit i paketës së mostrave — MOSTRA19',
      publicTitle: T('Kredit mostrash −€19', 'Sample kit credit −€19'),
      kind: 'order',
      method: 'code',
      code: 'MOSTRA19',
      valueType: 'fixed',
      value: 19,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 250 },
      audience: EVERYONE,
      combines: { products: true, order: false, shipping: true },
      oncePerCustomer: true,
      startsAt: iso(now, -21),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -21),
      tags: ['mostra'],
    },
    {
      id: 'd-qese-kartevizita',
      title: 'Qese + kartëvizita — 250 kartëvizita falas me 500+ qese',
      publicTitle: T('250 kartëvizita falas me 500+ qese', '250 free business cards with 500+ bags'),
      kind: 'bxgy',
      method: 'auto',
      valueType: 'percent',
      value: 100,
      appliesTo: ALL_LINES,
      minimum: NO_MIN,
      bxgy: { buyIds: BAGS, buyScope: 'products', buyQty: 500, getIds: ['p-kartevizita'], getScope: 'products', getQty: 250, getType: 'free', getValue: 100, maxUses: 1 },
      audience: EVERYONE,
      combines: { products: true, order: true, shipping: true },
      startsAt: iso(now, -45),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -46),
      tags: ['qese', 'cross-sell'],
    },
    {
      id: 'd-festat',
      title: `Festat ${festiveYear(now)} — paketim dhuratash −10%`,
      publicTitle: T(`Festat ${festiveYear(now)} −10%`, `Holidays ${festiveYear(now)} −10%`),
      kind: 'products',
      method: 'code',
      code: `FESTAT${yy(now)}`,
      valueType: 'percent',
      value: 10,
      appliesTo: { scope: 'collections', ids: ['col-festat'] },
      minimum: NO_MIN,
      audience: EVERYONE,
      combines: { products: false, order: false, shipping: true },
      usageLimit: 300,
      startsAt: iso(now, -7),
      endsAt: festiveSaleEnd(now),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -8),
      tags: ['festat', 'sezonale'],
    },
    {
      id: 'd-shkolla',
      title: 'Kthimi në shkollë — materiale promovuese −15%',
      publicTitle: T('Kthimi në shkollë −15%', 'Back to school −15%'),
      kind: 'products',
      method: 'code',
      code: `SHKOLLA${yy(school)}`,
      valueType: 'percent',
      value: 15,
      appliesTo: { scope: 'products', ids: PROMO_PRINT },
      minimum: NO_MIN,
      audience: EVERYONE,
      combines: { products: false, order: false, shipping: true },
      usageLimit: 150,
      startsAt: iso(now, -58),
      endsAt: iso(now, -24),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -60),
      tags: ['shkolla', 'sezonale'],
    },
    {
      id: 'd-blackfriday',
      title: 'Black Friday — kuti postare dhe dhuratash −20%',
      publicTitle: T('Black Friday: kuti postare −20%', 'Black Friday: mailer boxes −20%'),
      kind: 'products',
      method: 'auto',
      valueType: 'percent',
      value: 20,
      appliesTo: { scope: 'products', ids: BF_PRODUCTS },
      minimum: NO_MIN,
      audience: EVERYONE,
      combines: { products: false, order: true, shipping: true },
      startsAt: bw.start,
      endsAt: bw.end,
      status: 'active',
      uses: 0,
      createdAt: iso(now, -2),
      tags: ['black-friday', 'e-commerce'],
    },
    {
      id: 'd-vip',
      title: 'Klientë VIP — €150 nga €3.000',
      publicTitle: T('Falënderim VIP −€150', 'VIP thank-you −€150'),
      kind: 'order',
      method: 'code',
      code: 'VIP150',
      valueType: 'fixed',
      value: 150,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 3000 },
      audience: { type: 'segment', segmentId: 'seg-vip' },
      combines: { products: true, order: false, shipping: true },
      oncePerCustomer: true,
      startsAt: iso(now, 0),
      status: 'draft',
      uses: 0,
      createdAt: iso(now, -1),
      tags: ['vip'],
    },
  ];
}

/** Recount uses from the generated orders (cancelled orders excluded). */
export function countDiscountUses(discounts: Discount[], orders: Order[]): Discount[] {
  const uses = new Map<string, number>();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    for (const a of o.discounts ?? []) uses.set(a.id, (uses.get(a.id) ?? 0) + 1);
  }
  return discounts.map((d) => ({ ...d, uses: uses.get(d.id) ?? 0 }));
}

/* ================================================================== */
/* Offers (active / active / scheduled / draft)                        */
/* ================================================================== */
const ZERO = { visits: 0, ctaClicks: 0, codeUses: 0, orders: 0, revenue: 0, discountTotal: 0 };

export function buildOffers(now: Date, discounts: Discount[], orders: Order[]): Offer[] {
  const d = (id: string) => discounts.find((x) => x.id === id)!;
  const year = festiveYear(now);
  const metrics = (discountId: string, visitsPerOrder: number, baseVisits: number) => {
    const list = orders.filter((o) => o.status !== 'cancelled' && o.discounts?.some((a) => a.id === discountId));
    const discountTotal = round2(list.reduce((s, o) => s + (o.discounts?.find((a) => a.id === discountId)?.amount ?? 0), 0));
    const visits = baseVisits + list.length * visitsPerOrder;
    return {
      visits,
      ctaClicks: Math.round(visits * 0.14),
      codeUses: list.filter((o) => o.discounts?.some((a) => a.id === discountId && a.code)).length,
      orders: list.length,
      revenue: round2(list.reduce((s, o) => s + o.total, 0)),
      discountTotal,
    };
  };
  return [
    {
      id: 'of-festat',
      slug: 'paketimi-per-festat',
      name: T(`Paketimi për festat ${year}`, `Holiday packaging ${year}`),
      description: T(
        `Kodi ${d('d-festat').code} jep −10% për kuti dhuratash, mailer, qese luksoze dhe etiketa vere nga koleksioni i festave. Shfaqet në slider, banerin e katalogut, shiritin e njoftimeve dhe bllokun promo.`,
        `Code ${d('d-festat').code} gives −10% on gift boxes, mailers, luxury bags and wine labels from the holiday collection. Shown in the slider, catalogue banner, announcement bar and promo block.`,
      ),
      status: 'active',
      startsAt: d('d-festat').startsAt,
      endsAt: d('d-festat').endsAt,
      discountId: 'd-festat',
      collectionId: 'col-festat',
      productIds: [],
      badge: T('Festat −10%', 'Holidays −10%'),
      image: '/images/banner/kuti-ushqimore.webp',
      landing: {
        title: T('Paketim që *dhurohet*', 'Packaging worth *gifting*'),
        text: T(
          `Kuti dhuratash, qese luksoze dhe etiketa me folje ari — me kodin ${d('d-festat').code} përfitoni −10%. Porositni me kohë: tirazhet për festat planifikohen sipas radhës.`,
          `Gift boxes, luxury bags and gold-foil labels — use code ${d('d-festat').code} for −10%. Order early: holiday runs are scheduled first come, first served.`,
        ),
      },
      placements: ['hero', 'banner', 'announcement', 'home-block'],
      owner: 'st-drita',
      utm: `utm_source=printwor-ks&utm_medium=hero&utm_campaign=festat-${year}`,
      metrics: metrics('d-festat', 34, 420),
      createdAt: iso(now, -8),
    },
    {
      id: 'of-mireseardhje',
      slug: 'mireseerdhje-b2b',
      name: T('Mirëseardhje B2B — PRINT10', 'B2B welcome — PRINT10'),
      description: T(
        'Kodi PRINT10 jep 10% për porosinë e parë nga €300 (pa TVSH, pas zbritjeve të produkteve). Kombinohet me transportin falas dhe zbritjet e produkteve.',
        'Code PRINT10 gives 10% on a first order from €300 (excl. VAT, after product discounts). Combines with free delivery and product discounts.',
      ),
      status: 'active',
      startsAt: d('d-print10').startsAt,
      discountId: 'd-print10',
      productIds: [],
      badge: T('−10% porosia e parë', '−10% first order'),
      image: '/images/misc/production.webp',
      landing: {
        title: T('Mirë se vini në *PrintWorks*', 'Welcome to *PrintWorks*'),
        text: T(
          'Për porosinë e parë shkruani kodin PRINT10 në shportë dhe përfitoni 10% zbritje nga €300. Prova digjitale vjen brenda 24 orësh.',
          'On your first order enter code PRINT10 in the cart for 10% off from €300. Your digital proof follows within 24 hours.',
        ),
      },
      placements: ['banner', 'home-block'],
      owner: 'st-drita',
      utm: 'utm_source=printwor-ks&utm_medium=landing&utm_campaign=mireseardhje-b2b',
      metrics: metrics('d-print10', 52, 1240),
      createdAt: iso(now, -151),
    },
    {
      id: 'of-blackfriday',
      slug: 'black-friday-kuti-postare',
      name: T('Black Friday — kuti postare −20%', 'Black Friday — mailer boxes −20%'),
      description: T(
        'E planifikuar: një javë −20% për kuti postare dhe kuti dhuratash, për dyqanet online që përgatiten për sezonin. Slide-i dhe shiriti aktivizohen vetë me fillimin e ofertës.',
        'Scheduled: one week of −20% on mailer and gift boxes for online shops getting ready for the season. The slide and the bar switch on by themselves when it starts.',
      ),
      status: 'active',
      startsAt: d('d-blackfriday').startsAt,
      endsAt: d('d-blackfriday').endsAt,
      discountId: 'd-blackfriday',
      productIds: BF_PRODUCTS,
      badge: T('Black Friday −20%', 'Black Friday −20%'),
      image: '/images/banner/kuti-produktesh.webp',
      landing: {
        title: T('Black Friday: *kuti postare −20%*', 'Black Friday: *mailer boxes −20%*'),
        text: T('Një javë, printim jashtë dhe brenda, provë digjitale brenda 24 orësh.', 'One week, print outside and inside, digital proof within 24 hours.'),
      },
      placements: ['hero', 'announcement'],
      owner: 'st-drita',
      utm: 'utm_source=printwor-ks&utm_medium=hero&utm_campaign=black-friday',
      metrics: { ...ZERO },
      createdAt: iso(now, -2),
    },
    {
      id: 'of-shrink',
      slug: 'shrink-sleeve-per-pije',
      name: T('Shrink sleeve për pije & bulmet', 'Shrink sleeves for drinks & dairy'),
      description: T(
        'Fushatë editoriale pa zbritje: dekor 360° për shishe dhe gota, me flexo LED UV 8 ngjyra. Në përgatitje për ballinën dhe slider-in.',
        'Editorial campaign without a discount: 360° decoration for bottles and cups on 8-colour LED UV flexo. Being prepared for the homepage and slider.',
      ),
      status: 'draft',
      startsAt: iso(now, 10),
      productIds: ['p-shrink-sleeve', 'p-etiketa-ushqimore'],
      badge: T('E re', 'New'),
      image: '/images/banner/shrink.webp',
      landing: {
        title: T('Dekor *360°* për çdo shishe', '*360°* decoration for every bottle'),
        text: T('Shrink sleeve me perforim kundër hapjes, nga 5.000 copë.', 'Shrink sleeves with tamper perforation, from 5,000 pieces.'),
      },
      placements: ['hero', 'home-block'],
      owner: 'st-drita',
      utm: 'utm_source=printwor-ks&utm_medium=hero&utm_campaign=shrink-sleeve',
      metrics: { ...ZERO },
      createdAt: iso(now, -1),
    },
  ];
}

/* ================================================================== */
/* Placements — hero slides, catalogue banners, announcement bar       */
/* ================================================================== */
export function buildPlacements(home: HomeSection[]): Placement[] {
  const hero = home.find((h) => h.type === 'hero');
  const slides = hero && hero.type === 'hero' ? hero.data.slides : [];
  const base = { textAlign: 'left' as const, status: 'active' as const };
  const fromHero: Placement[] = slides.map((s, i) => ({
    ...base,
    id: `pl-${s.id}`,
    kind: 'slide',
    position: 'home-hero',
    name: `Hero — ${plain(s.title.sq).replace(/[.!]$/, '').slice(0, 48) || i + 1}`,
    eyebrow: s.eyebrow,
    title: s.title,
    subtitle: s.subtitle,
    cta: s.primary,
    secondary: s.secondary,
    image: s.image,
    alt: { sq: plain(s.title.sq), en: plain(s.title.en) },
    overlay: 35,
    order: i + 1,
  }));
  const n = fromHero.length;
  const ann = (id: string, order: number, title: L10n, href: string, offerId?: string): Placement => ({
    ...base,
    id,
    kind: 'announcement',
    position: 'bar',
    name: `Shiriti — ${title.sq.slice(0, 36)}`,
    eyebrow: E(),
    title,
    subtitle: E(),
    cta: { label: E(), href },
    image: '',
    alt: E(),
    overlay: 0,
    order,
    ...(offerId ? { offerId } : {}),
  });
  return [
    ...fromHero,
    {
      ...base,
      id: 'pl-s-festat',
      kind: 'slide',
      position: 'home-hero',
      name: 'Hero — Paketimi për festat',
      eyebrow: T('Festat', 'Holidays'),
      title: T('Paketim që *dhurohet*.', 'Packaging worth *gifting*.'),
      subtitle: T(
        'Kuti dhuratash, qese luksoze dhe etiketa me folje ari — −10% me kodin e festave. Porositni me kohë.',
        'Gift boxes, luxury bags and gold-foil labels — −10% with the holiday code. Order early.',
      ),
      cta: { label: T('Shikoni koleksionin', 'See the collection'), href: '/koleksioni/festat' },
      secondary: { label: T('Kërkoni ofertë', 'Request a quote'), href: '/kerko-oferte' },
      image: '/images/banner/kuti-ushqimore.webp',
      alt: T('Kuti ëmbëlsirash e printuar me markën e pastiçerisë', 'Pastry box printed with the bakery’s brand'),
      overlay: 40,
      offerId: 'of-festat',
      order: n + 1,
    },
    {
      ...base,
      id: 'pl-s-bf',
      kind: 'slide',
      position: 'home-hero',
      name: 'Hero — Black Friday kuti postare',
      eyebrow: T('Black Friday', 'Black Friday'),
      title: T('Kuti postare *−20%*.', 'Mailer boxes *−20%*.'),
      subtitle: T('Unboxing që ndahet në rrjete sociale — printim jashtë dhe brenda, vetëm një javë.', 'An unboxing worth sharing — printed outside and inside, one week only.'),
      cta: { label: T('Shikoni kutitë', 'Shop mailer boxes'), href: '/produktet/kuti-produktesh' },
      secondary: { label: T('Kërkoni ofertë', 'Request a quote'), href: '/kerko-oferte' },
      image: '/images/banner/kuti-produktesh.webp',
      alt: T('Kuti postare të printuara me ngjyra', 'Colour-printed mailer boxes'),
      overlay: 45,
      offerId: 'of-blackfriday',
      order: n + 2,
    },
    {
      ...base,
      id: 'pl-s-shrink',
      kind: 'slide',
      position: 'home-hero',
      status: 'draft',
      name: 'Hero — Shrink sleeve (draft)',
      eyebrow: T('E re në prodhim', 'New in production'),
      title: T('Dekor *360°* për çdo shishe.', '*360°* decoration for every bottle.'),
      subtitle: T('Shrink sleeve në flexo LED UV me 8 ngjyra — për pije, bulmet dhe kozmetikë.', 'Shrink sleeves on 8-colour LED UV flexo — for drinks, dairy and cosmetics.'),
      cta: { label: T('Shikoni etiketat', 'See labels'), href: '/produktet/etiketa' },
      image: '/images/banner/shrink.webp',
      alt: T('Shishe jogurti me shrink sleeve me ngjyra', 'Yoghurt bottles with colourful shrink sleeves'),
      textAlign: 'center',
      overlay: 35,
      offerId: 'of-shrink',
      order: n + 3,
    },
    {
      ...base,
      id: 'pl-b1',
      kind: 'banner',
      position: 'catalog',
      name: 'Katalogu — Festat',
      eyebrow: T('Festat', 'Holidays'),
      title: T('Paketim për festat *−10%*', 'Holiday packaging *−10%*'),
      subtitle: T('Kuti dhuratash, qese luksoze dhe etiketa vere — me kodin e festave.', 'Gift boxes, luxury bags and wine labels — with the holiday code.'),
      cta: { label: T('Shikoni koleksionin', 'See the collection'), href: '/koleksioni/festat' },
      image: '/images/banner/kuti-ushqimore.webp',
      alt: T('Kuti ëmbëlsirash e printuar', 'Printed pastry box'),
      overlay: 30,
      offerId: 'of-festat',
      order: 1,
    },
    {
      ...base,
      id: 'pl-b2',
      kind: 'banner',
      position: 'catalog',
      name: 'Katalogu — Etiketa −15%',
      eyebrow: T('Etiketa', 'Labels'),
      title: T('Etiketa *−15%* nga 5.000 copë', 'Labels *−15%* from 5,000 pcs'),
      subtitle: T('Zbritja llogaritet automatikisht në shportë — pa kod.', 'The discount is applied automatically in the cart — no code needed.'),
      cta: { label: T('Shikoni etiketat', 'Shop labels'), href: '/produktet/etiketa' },
      image: '/images/banner/etiketa.webp',
      alt: T('Kavanoza reçeli me etiketa të printuara', 'Jam jars with printed labels'),
      overlay: 30,
      order: 2,
    },
    {
      ...base,
      id: 'pl-b3',
      kind: 'banner',
      position: 'catalog',
      name: 'Katalogu — Paketa e mostrave',
      eyebrow: T('Para porosisë', 'Before you order'),
      title: T('Prekni materialet — *€19*', 'Feel the materials — *€19*'),
      subtitle: T('Paketa e mostrave zbritet nga porosia e parë me kodin MOSTRA19.', 'The sample kit is credited on your first order with code MOSTRA19.'),
      cta: { label: T('Porosit mostrat', 'Order the kit'), href: '/produkt/pakete-mostrash-printworks' },
      image: '/images/p/mostra-finishing.webp',
      alt: T('Paketa e mostrave me letra dhe efekte finishing', 'Sample kit with papers and finishing effects'),
      overlay: 20,
      order: 3,
    },
    {
      ...base,
      id: 'pl-b4',
      kind: 'banner',
      position: 'home-banner',
      name: 'Ballina — PRINT10 mirëseardhje',
      eyebrow: T('Për porosinë e parë', 'For your first order'),
      title: T('−10% me kodin *PRINT10*', '−10% with code *PRINT10*'),
      subtitle: T('Për porosi nga €300 pa TVSH — kombinohet me transportin falas.', 'On orders from €300 excl. VAT — combines with free delivery.'),
      cta: { label: T('Shikoni produktet', 'Browse products'), href: '/produktet' },
      image: '/images/misc/production.webp',
      alt: T('Operator në makinën e printimit në fabrikën PrintWorks', 'Operator at a press in the PrintWorks factory'),
      overlay: 40,
      offerId: 'of-mireseardhje',
      order: 1,
    },
    ann('pl-a1', 1, T('Provë digjitale falas brenda 24 orësh për çdo porosi', 'Free digital proof within 24 hours on every order'), '/teknologjia'),
    ann('pl-a2', 2, T('Transport falas në Kosovë për porosi mbi €250', 'Free delivery in Kosovo on orders over €250'), '/produktet'),
    ann('pl-a3', 3, T('Paketë mostrash €19 — e zbritur nga porosia e parë', 'Sample kit €19 — credited on your first order'), '/produkt/pakete-mostrash-printworks'),
    ann('pl-a4', 4, T('Festat: −10% për kuti dhuratash, qese dhe etiketa vere', 'Holidays: −10% on gift boxes, bags and wine labels'), '/koleksioni/festat', 'of-festat'),
    ann('pl-a5', 5, T('Black Friday: kuti postare −20% — vetëm një javë', 'Black Friday: mailer boxes −20% — one week only'), '/produktet/kuti-produktesh', 'of-blackfriday'),
  ];
}

/* ================================================================== */
/* Staff, services, bookings                                           */
/* ================================================================== */
export const STAFF: Staff[] = [
  { id: 'st-gent', name: 'Gent Berisha', email: 'gent@printwor-ks.com', role: 'owner', color: '#1a1a1a', active: true, phone: '+383 44 210 300', title: T('Drejtor operativ', 'Operations director') },
  { id: 'st-arta', name: 'Arta Krasniqi', email: 'arta@printwor-ks.com', role: 'manager', color: '#5b5b7a', active: true, phone: '+383 44 512 118', title: T('Menaxhere e shitjeve B2B', 'B2B sales manager') },
  { id: 'st-blerim', name: 'Blerim Gashi', email: 'prepress@printwor-ks.com', role: 'orders', color: '#3d5a80', active: true, phone: '+383 49 330 118', title: T('Prepress & planifikimi i prodhimit', 'Prepress & production planning') },
  { id: 'st-ana', name: 'Ana Morina', email: 'ana@printwor-ks.com', role: 'catalog', color: '#7a6a58', active: true, title: T('Katalogu & çmimet', 'Catalogue & pricing') },
  { id: 'st-drita', name: 'Drita Hoxha', email: 'drita@printwor-ks.com', role: 'marketing', color: '#8a5a44', active: true, title: T('Marketing & komunikim', 'Marketing & communications') },
  { id: 'st-lirie', name: 'Liridona Shala', email: 'liridona@printwor-ks.com', role: 'reception', color: '#2f6f62', active: true, phone: '+383 45 732 701', title: T('Recepsioni & shërbimi i klientëve', 'Front desk & customer care') },
];

export const SERVICES: Service[] = [
  {
    id: 'sv-konsulte',
    name: T('Konsultë për paketim', 'Packaging consultation'),
    description: T('Zgjedhja e materialit, formatit dhe finishing-ut me mostra fizike në fabrikë.', 'Choosing board, format and finishing with physical samples at the factory.'),
    durationMin: 45,
    capacity: 2,
    price: 0,
    color: '#4b5563',
    staffIds: ['st-arta', 'st-gent', 'st-drita'],
    location: 'loc-prod',
  },
  {
    id: 'sv-presscheck',
    name: T('Kontroll ngjyre në makinë (press check)', 'Press check'),
    description: T('Klienti aprovon ngjyrat në fletën e parë të tirazhit, pranë makinës.', 'The client approves colour on the first sheets of the run, at the press.'),
    durationMin: 60,
    capacity: 1,
    price: 0,
    color: '#3d5a80',
    staffIds: ['st-blerim'],
    location: 'loc-prod',
  },
  {
    id: 'sv-vizite',
    name: T('Vizitë në fabrikë', 'Factory visit'),
    description: T('Tur në prodhim: offset, HP Indigo, flexo, prerje me matricë dhe ngjitje kutish.', 'A tour of production: offset, HP Indigo, flexo, die-cutting and folder-gluing.'),
    durationMin: 60,
    capacity: 6,
    price: 0,
    color: '#2f6f62',
    staffIds: ['st-gent', 'st-arta'],
    location: 'loc-prod',
  },
  {
    id: 'sv-takim',
    name: T('Takim te klienti', 'Meeting at your premises'),
    description: T('Vijmë me mostra dhe katalog materialesh në zyrën ose lokalin tuaj.', 'We visit your office or venue with samples and the material book.'),
    durationMin: 60,
    capacity: 1,
    price: 0,
    color: '#8a5a44',
    staffIds: ['st-arta', 'st-gent'],
    location: 'onsite',
  },
];

const BOOKING_PEOPLE: [string, string, string][] = [
  ['Teuta Rexhepi', '+383 44 318 204', 'Pejë'],
  ['Mentor Hasani', '+383 49 602 117', 'Prishtinë'],
  ['Valbona Hoxha', '+383 45 220 517', 'Ferizaj'],
  ['Arlind Behrami', '+383 44 715 330', 'Vushtrri'],
  ['Kaltrina Haxhiu', '+383 49 908 114', 'Prishtinë'],
  ['Agim Memeti', '+389 70 510 276', 'Shkup'],
  ['Dafina Musliu', '+383 45 304 681', 'Prishtinë'],
  ['Bekim Pllana', '+383 44 655 209', 'Drenas'],
  ['Fatmir Rexha', '+383 49 147 993', 'Prishtinë'],
  ['Egzona Bajrami', '+383 44 822 460', 'Prizren'],
  ['Hysen Begolli', '+383 45 390 845', 'Ferizaj'],
  ['Ilir Shala', '+383 49 674 152', 'Prishtinë'],
  ['Merita Limani', '+383 44 251 738', 'Gjilan'],
  ['Naim Spahiu', '+383 49 118 506', 'Rahovec'],
  ['Besa Ademi', '+389 71 963 027', 'Shkup'],
  ['Labinot Ahmeti', '+383 45 437 615', 'Gjilan'],
];

const ONSITE_ADDRESSES = ['Rr. Agim Ramadani 15, Prishtinë', 'Rr. Nëna Terezë 33, Gjakovë', 'Rr. Skënderbeu 38, Gjilan', 'Rr. Dëshmorët e Kombit 61, Ferizaj'];

/** [day offset from this Monday, hour, minute, service, staff, note] — no overlaps per staff member. */
const SLOTS: [number, number, number, string, string, string][] = [
  [0, 9, 0, 'sv-konsulte', 'st-arta', 'Paketim për linjën e re të serumeve'],
  [0, 11, 0, 'sv-presscheck', 'st-blerim', 'Etiketa vere — Pantone 7421 C'],
  [1, 10, 0, 'sv-takim', 'st-arta', 'Prezantim mostrash në zyrat e klientit'],
  [1, 14, 0, 'sv-vizite', 'st-gent', 'Vizitë me ekipin e marketingut'],
  [2, 9, 0, 'sv-konsulte', 'st-drita', 'Rebranding — qese dhe kuti takeaway'],
  [2, 10, 30, 'sv-presscheck', 'st-blerim', 'Kuti kozmetike — soft-touch + folje'],
  [3, 9, 0, 'sv-takim', 'st-gent', 'Kalim nga plastika në kraft — 6 lokale'],
  [3, 13, 0, 'sv-konsulte', 'st-arta', 'Shrink sleeve për shishe 0,5 L'],
  [4, 9, 30, 'sv-vizite', 'st-arta', 'Vizitë në fabrikë — distributor nga Shkupi'],
  [4, 14, 0, 'sv-presscheck', 'st-blerim', 'Kuti tortash — kontroll i rozës së markës'],
  [7, 9, 0, 'sv-konsulte', 'st-arta', 'Paketim farmaceutik me Braille'],
  [7, 11, 0, 'sv-takim', 'st-gent', 'Etiketa dhe kuti dhuratash për vaj ulliri'],
  [8, 10, 0, 'sv-vizite', 'st-gent', 'Vizitë me studentët e dizajnit grafik'],
  [8, 14, 0, 'sv-presscheck', 'st-blerim', 'Katalog A4 — prova e ngjyrave'],
  [9, 9, 0, 'sv-konsulte', 'st-drita', 'Kuti dhuratash për festat'],
  [10, 11, 0, 'sv-takim', 'st-arta', 'Prezantim te zinxhiri i pastiçerive'],
];

/** Meeting requests and the service they are booked into. */
const MEETING: Record<string, { service: string; note?: string }> = {
  inq_101: { service: 'sv-vizite', note: 'Vizitë në fabrikë — kuti pastiçerie dhe kraft' },
  inq_105: { service: 'sv-presscheck', note: 'Kuti tortash — kontroll i rozës së markës' },
  inq_108: { service: 'sv-konsulte', note: 'Kalim nga plastika në karton — 6 lokale' },
  inq_109: { service: 'sv-takim', note: 'Etiketa dhe kuti dhuratash për vaj ulliri' },
  inq_113: { service: 'sv-konsulte' },
};

function mondayOf(now: Date) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return d;
}

/**
 * Bookings for this and next week. Scheduled inquiries are linked to the first free future booking of
 * their service (factory visit, press check, consultation or a meeting at the client) and get its date.
 */
export function buildBookings(now: Date, inquiries: Inquiry[]): { bookings: Booking[]; inquiries: Inquiry[] } {
  const monday = mondayOf(now);
  const bookings: Booking[] = SLOTS.map(([day, h, m, serviceId, staffId, note], i) => {
    const start = new Date(monday);
    start.setDate(monday.getDate() + day);
    start.setHours(h, m, 0, 0);
    const service = SERVICES.find((s) => s.id === serviceId)!;
    const end = start.getTime() + service.durationMin * 60000;
    const [customerName, phone, city] = BOOKING_PEOPLE[i % BOOKING_PEOPLE.length];
    const past = end < now.getTime();
    const status: Booking['status'] = past ? (i === 4 ? 'noshow' : i === 5 ? 'cancelled' : 'done') : i === 13 || i === 14 ? 'pending' : 'confirmed';
    return {
      id: `bk-${101 + i}`,
      serviceId,
      staffId,
      customerName,
      phone,
      email: `${customerName.toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c').replace(/\s+/g, '.')}@example.com`,
      city,
      start: start.toISOString(),
      durationMin: service.durationMin,
      status,
      note,
      location: service.location ?? 'loc-prod',
      ...(service.location === 'onsite' ? { address: ONSITE_ADDRESSES[i % ONSITE_ADDRESSES.length] } : {}),
      createdAt: new Date(start.getTime() - (3 + (i % 5)) * DAY).toISOString(),
    };
  });

  const out = inquiries.map((q) => ({ ...q }));
  const free = (svc: string) => bookings.filter((b) => b.serviceId === svc && !b.inquiryId && new Date(b.start).getTime() > now.getTime() && b.status !== 'cancelled');
  for (const q of out.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (q.status !== 'scheduled') continue;
    const meet = MEETING[q.id];
    const slot = free(meet?.service ?? 'sv-konsulte')[0];
    if (!slot) {
      q.status = 'contacted';
      q.scheduledAt = undefined;
      continue;
    }
    slot.inquiryId = q.id;
    slot.customerName = q.name;
    slot.phone = q.phone;
    slot.email = q.email;
    slot.city = q.city;
    slot.status = 'confirmed';
    if (meet?.note) slot.note = meet.note;
    if (slot.location === 'onsite') slot.address = `${q.company ?? q.name}, ${q.city ?? ''}`.replace(/, $/, '');
    q.scheduledAt = slot.start;
  }
  return { bookings, inquiries: out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}

/* ================================================================== */
/* Inquiries — CMS v2 fields + the flagship B2B request and a fresh one */
/* ================================================================== */
const INQ_META: Record<string, { source: InquirySource; assignee?: string; tags: string[]; followUpIn?: number }> = {
  inq_100: { source: 'quote', tags: ['kozmetike', 'lansim'] },
  inq_101: { source: 'measurement', tags: ['vizite-ne-fabrike', 'pasticeri'] },
  inq_116: { source: 'web-form', tags: ['dasma', 'tirazh-i-vogel'] },
  inq_102: { source: 'web-form', assignee: 'st-lirie', tags: ['certifikata', 'ushqim'], followUpIn: 0.3 },
  inq_103: { source: 'quote', assignee: 'st-arta', tags: ['etiketa', 'vere', 'press-check'], followUpIn: 1 },
  inq_104: { source: 'phone', assignee: 'st-gent', tags: ['shrink', 'pije', 'kontrate'], followUpIn: 2 },
  inq_105: { source: 'measurement', assignee: 'st-blerim', tags: ['press-check', 'pasticeri'] },
  inq_106: { source: 'quote', assignee: 'st-arta', tags: ['qese', 'festat'], followUpIn: 3 },
  inq_107: { source: 'web-form', assignee: 'st-arta', tags: ['eksport', 'dach'], followUpIn: -1 },
  inq_108: { source: 'quote', assignee: 'st-arta', tags: ['pa-plastike', 'horeca'] },
  inq_109: { source: 'measurement', assignee: 'st-gent', tags: ['vaj-ulliri', 'eksport'] },
  inq_110: { source: 'quote', assignee: 'st-arta', tags: ['katalog', 'agjenci'] },
  inq_111: { source: 'quote', assignee: 'st-gent', tags: ['farmaci', 'braille'] },
  inq_112: { source: 'web-form', assignee: 'st-lirie', tags: ['marrje-ne-fabrike'] },
  inq_113: { source: 'measurement', assignee: 'st-drita', tags: ['e-commerce', 'konsulte'] },
  inq_114: { source: 'quote', assignee: 'st-arta', tags: ['cokollate', 'festat'] },
  inq_115: { source: 'web-form', assignee: 'st-lirie', tags: ['fature'] },
};

export function enrichInquiries(now: Date, inquiries: Inquiry[]): Inquiry[] {
  const out: Inquiry[] = inquiries.map((q) => {
    const m = INQ_META[q.id];
    return {
      ...q,
      source: m?.source ?? (q.type === 'measurement' ? 'measurement' : q.type === 'quote' ? 'quote' : 'web-form'),
      assignee: q.status === 'new' ? undefined : (m?.assignee ?? 'st-lirie'),
      tags: m?.tags ?? [],
      ...(m?.followUpIn != null && q.status !== 'done' ? { followUpAt: iso(now, m.followUpIn) } : {}),
    };
  });
  out.push(
    {
      id: 'inq_120',
      createdAt: iso(now, -4, -3),
      type: 'quote',
      name: 'Mentor Hasani',
      company: 'Fresk Food Group sh.p.k.',
      phone: '+383 49 602 117',
      email: 'mentor.hasani@example.com',
      city: 'Prishtinë',
      service: 'Paketime ushqimore',
      productId: 'p-kuti-sanduici',
      message:
        'Kërkojmë ofertë për paketimin e plotë të linjës së re të sanduiçëve dhe sallatave për 40 pika shitjeje: kuti sanduiçi me dritare PLA, etiketa në rrotull dhe kuti takeaway. Volumi vjetor rreth 400.000 copë, me dorëzime mujore.',
      specs: {
        product: 'food',
        size: 'Kuti sanduiçi 123 × 123 × 72 mm',
        material: 'Karton kraft 300 g + dritare PLA',
        quantity: 400000,
        colours: 'CMYK',
        finishes: ['Dritare PLA (pa plastikë fosile)', 'Llak dispersion'],
        deadline: iso(now, 30).slice(0, 10),
        files: [
          { name: 'fresk-food-brief-2026.pdf', size: 3250000 },
          { name: 'fresk-sandwich-dieline.pdf', size: 1180000 },
        ],
      },
      status: 'contacted',
      seen: true,
      source: 'phone',
      assignee: 'st-arta',
      tags: ['b2b', 'horeca', 'kontrate-vjetore'],
      followUpAt: iso(now, 2),
    },
    {
      id: 'inq_121',
      createdAt: iso(now, 0, -5),
      type: 'contact',
      name: 'Arta Ziberi',
      phone: '+389 70 418 207',
      email: 'arta.ziberi@example.com',
      city: 'Gostivar',
      service: 'Etiketa & shrink sleeve',
      productId: 'p-etiketa-ushqimore',
      message: 'Sa ditë zgjat prodhimi dhe dërgesa për 5.000 etiketa ushqimore në Gostivar? Na duhen për panairin e muajit tjetër.',
      status: 'new',
      seen: false,
      source: 'web-form',
      tags: ['eksport', 'afati'],
    },
  );
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ================================================================== */
/* Segments                                                            */
/* ================================================================== */
const EXPORT_CITIES = ['Tiranë', 'Durrës', 'Shkodër', 'Vlorë', 'Elbasan', 'Kukës', 'Shkup', 'Tetovë', 'Gostivar', 'Strugë', 'Kumanovë'];

export const SEGMENTS: Segment[] = [
  {
    id: 'seg-horeca',
    name: T('HoReCa', 'HoReCa'),
    description: T('Restorante, kafene, pastiçeri dhe furra.', 'Restaurants, cafés, pastry shops and bakeries.'),
    match: 'any',
    rules: [
      { field: 'tag', op: 'eq', value: 'horeca' },
      { field: 'tag', op: 'eq', value: 'pasticeri' },
    ],
  },
  {
    id: 'seg-kozmetike',
    name: T('Kozmetikë & farmaci', 'Cosmetics & pharma'),
    description: T('Marka kozmetike, laboratorë dhe farmaci.', 'Cosmetics brands, labs and pharmacies.'),
    match: 'any',
    rules: [
      { field: 'tag', op: 'eq', value: 'kozmetike' },
      { field: 'tag', op: 'eq', value: 'farmaci' },
    ],
  },
  {
    id: 'seg-vip',
    name: T('Klientë VIP', 'VIP clients'),
    description: T('Kanë porositur mbi €5.000.', 'Ordered more than €5,000.'),
    match: 'all',
    rules: [{ field: 'spent', op: 'gt', value: '5000' }],
  },
  {
    id: 'seg-eksport',
    name: T('Eksport (AL/MK)', 'Export (AL/MK)'),
    description: T('Klientë nga Shqipëria dhe Maqedonia e Veriut.', 'Clients in Albania and North Macedonia.'),
    match: 'any',
    rules: EXPORT_CITIES.map((c) => ({ field: 'city' as const, op: 'eq' as const, value: c })),
  },
  {
    id: 'seg-te-rinj',
    name: T('Klientë të rinj', 'New clients'),
    description: T('Porosia e parë në 30 ditët e fundit — për ndjekje pas dorëzimit.', 'First order in the last 30 days — for a follow-up after delivery.'),
    match: 'all',
    rules: [
      { field: 'orders', op: 'lt', value: '2' },
      { field: 'lastOrderDays', op: 'lt', value: '30' },
    ],
  },
  {
    id: 'seg-riporosi',
    name: T('Riporosi të rregullta', 'Regular reorders'),
    description: T('Tre ose më shumë porosi — kandidatë për kontratë vjetore.', 'Three or more orders — candidates for an annual contract.'),
    match: 'all',
    rules: [{ field: 'orders', op: 'gt', value: '2' }],
  },
];

/* ================================================================== */
/* Purchasing & inventory movements                                    */
/* ================================================================== */
export function buildPurchaseOrders(now: Date): PurchaseOrder[] {
  return [
    {
      id: 'po-031',
      number: 'PO-2026-031',
      supplier: `${BAG_PARTNER} (Shkup)`,
      location: 'loc-wh',
      status: 'partial',
      lines: [
        { productId: 'p-qese-premium', ordered: 2000, received: 1200, rejected: 0, cost: 0.62 },
        { productId: 'p-qese-luksoze', ordered: 1000, received: 980, rejected: 20, cost: 0.78 },
      ],
      reference: 'QL-2026/418',
      note: 'Konfeksionimi i qeseve me dorezë litari për porositë e festave. 20 qese luksoze të refuzuara — laminim i flluskuar. Pjesa tjetër vjen të enjten.',
      expectedAt: iso(now, 3),
      createdAt: iso(now, -9),
    },
    {
      id: 'po-032',
      number: 'PO-2026-032',
      supplier: `${BINDERY} (Prishtinë)`,
      location: 'loc-prod',
      status: 'sent',
      lines: [
        { productId: 'p-blloqe', ordered: 500, received: 0, rejected: 0, cost: 1.45 },
        { productId: 'p-katalog', ordered: 1500, received: 0, rejected: 0, cost: 0.38 },
      ],
      reference: 'LS-0932',
      note: 'Lidhje me spirale për blloqet e Eventa Group dhe ngjitje PUR për katalogun e Pixel & Co.',
      expectedAt: iso(now, 6),
      createdAt: iso(now, -2),
    },
    {
      id: 'po-030',
      number: 'PO-2026-030',
      supplier: KIT_BOX_MAKER,
      location: 'loc-wh',
      status: 'closed',
      lines: [{ productId: 'p-mostra', ordered: 120, received: 118, rejected: 2, cost: 6.8 }],
      reference: 'KM-1187',
      note: 'Kuti magnetike me insert për paketën e mostrave. 2 kuti me kapak të shtypur — refuzuar.',
      expectedAt: iso(now, -21),
      createdAt: iso(now, -27),
    },
    {
      id: 'po-033',
      number: 'PO-2026-033',
      supplier: KIT_BOX_MAKER,
      location: 'loc-wh',
      status: 'draft',
      lines: [{ productId: 'p-mostra', ordered: 150, received: 0, rejected: 0, cost: 6.6 }],
      note: 'Rimbushje për fushatën e festave — pret aprovimin.',
      expectedAt: iso(now, 14),
      createdAt: iso(now, -1),
    },
  ];
}

export function buildMovements(now: Date, orders: Order[], returns: ReturnRequest[]): InventoryMovement[] {
  const mv = (id: string, productId: string, delta: number, reason: InventoryMovement['reason'], days: number, by: string, note?: string, ref?: string): InventoryMovement => ({
    id,
    productId,
    delta,
    reason,
    at: iso(now, days),
    by,
    ...(note ? { note } : {}),
    ...(ref ? { ref } : {}),
  });
  const list: InventoryMovement[] = [
    mv('mv-1', 'p-mostra', 118, 'received', -21, 'st-blerim', KIT_BOX_MAKER, 'PO-2026-030'),
    mv('mv-2', 'p-mostra', -6, 'correction', -12, 'st-drita', 'Paketa për stendën në panairin e ushqimit'),
    mv('mv-3', 'p-mostra', -1, 'count', -6, 'st-ana', 'Inventarizim — 1 paketë mungon në depo'),
    mv('mv-4', 'p-mostra', -2, 'damaged', -4, 'st-blerim', 'Kapaku i kutisë i shtypur — nuk dërgohet'),
    mv('mv-5', 'p-qese-premium', 1200, 'received', -2, 'st-blerim', BAG_PARTNER, 'PO-2026-031'),
    mv('mv-6', 'p-qese-luksoze', 980, 'received', -2, 'st-blerim', `${BAG_PARTNER} — 20 të refuzuara`, 'PO-2026-031'),
  ];
  // restocked returns (custom print is normally not restocked)
  for (const r of returns) {
    if (!r.restocked) continue;
    const rec = r.timeline.find((t) => t.status === 'received');
    for (const l of r.lines) list.push({ id: `mv-${r.id}-${l.productId}`, productId: l.productId, delta: l.qty, reason: 'return', at: rec?.at ?? r.createdAt, by: rec?.by ?? 'st-blerim', note: 'Kthyer e padëmtuar', ref: r.number });
  }
  // stocked items sold on the web (the sample kit — everything else is made to order)
  let n = 10;
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    for (const l of o.items) if (l.productId === 'p-mostra') list.push({ id: `mv-${n++}`, productId: l.productId, delta: -l.qty, reason: 'sale', at: o.createdAt, by: 'web', ref: o.number });
  }
  return list.sort((a, b) => b.at.localeCompare(a.at));
}

/* ================================================================== */
/* Draft orders, complaints (returns), quotes                          */
/* ================================================================== */
const keyOf = (id: string, o: Record<string, string>, inst: boolean) =>
  `${id}|${Object.keys(o)
    .sort()
    .map((k) => `${k}=${o[k]}`)
    .join('&')}|${inst ? 'i' : ''}`;

export function buildDrafts(now: Date, products: Product[]): DraftOrder[] {
  const item = (id: string, qty: number, chosen: Record<string, string>, installation: boolean, artwork: CartItem['artwork']): CartItem => {
    const p = products.find((x) => x.id === id);
    const options = { ...(p ? defaultOptions(p) : {}), ...chosen };
    return { key: keyOf(id, options, installation), productId: id, qty, options, installation, ...(artwork ? { artwork } : {}) };
  };
  return [
    {
      id: 'dr-1001',
      number: 'D-1001',
      createdAt: iso(now, -1, -2),
      customer: clientCustomer('natyra'),
      items: [
        item('p-kuti-kozmetike', 10000, { size: 'm', board: 'gc2', finish: 'softtouch' }, false, { status: 'uploaded', name: 'natyra-serum-30ml-dieline-v4.pdf', size: 3480000 }),
        item('p-etiketa-transparente', 10000, { size: '40x60', finish: 'foil' }, false, { status: 'uploaded', name: 'natyra-serum-etiketa-clear.pdf', size: 1240000 }),
      ],
      customLines: [
        { title: 'Matricë e re prerjeje — kuti serumi 30 ml', price: 180, qty: 1 },
        { title: 'Klishe për stampim me folje ari', price: 95, qty: 1 },
      ],
      discountCodes: [],
      delivery: 'delivery',
      payment: 'bank',
      note: 'Lansimi i linjës së re në nëntor — prova fizike para tirazhit. Fatura në emër të kompanisë.',
      tags: ['b2b', 'kozmetike', 'lansim'],
      status: 'open',
      createdBy: 'st-arta',
      lang: 'sq',
    },
    {
      id: 'dr-1002',
      number: 'D-1002',
      createdAt: iso(now, -4, -1),
      customer: clientCustomer('forno-rosso'),
      items: [
        item('p-kuti-pice', 10000, { size: '33', sides: 'outside' }, false, { status: 'uploaded', name: 'forno-rosso-kuti-pice-v3.pdf', size: 5120000, note: 'Ribotim — i njëjti dizajn.' }),
        item('p-mbajtese-patatesh', 10000, { size: 'm' }, false, { status: 'uploaded', name: 'forno-rosso-fries-v2.pdf', size: 2210000 }),
      ],
      customLines: [{ title: 'Magazinim në depon tonë dhe dorëzim në 3 pjesë', price: 60, qty: 1 }],
      discountCodes: [],
      delivery: 'delivery',
      payment: 'bank',
      note: 'Proforma u dërgua me e-mail — pritet avansi 50%. Dorëzimet: 1/3 tani, pjesa tjetër sipas thirrjes.',
      tags: ['horeca', 'kontrate'],
      status: 'invoice_sent',
      createdBy: 'st-gent',
      lang: 'sq',
    },
    {
      id: 'dr-1003',
      number: 'D-1003',
      createdAt: iso(now, 0, -6),
      customer: clientCustomer('eventa'),
      items: [
        item('p-blloqe', 500, { size: 'a5', ruling: 'dotted' }, true, { status: 'design', note: 'Logo e konferencës + data në kopertinë.' }),
        item('p-qese-ngjyre', 500, { size: 'm', handle: 'twisted' }, false, { status: 'later' }),
        item('p-fletepalosje', 2000, {}, false, { status: 'later' }),
      ],
      customLines: [{ title: 'Paketim individual i setit për pjesëmarrës', price: 0.35, qty: 500 }],
      discountCodes: [],
      delivery: 'delivery',
      payment: 'bank',
      note: 'Set për konferencën e dhjetorit (500 pjesëmarrës). Skedarët e qeseve dhe fletëpalosjeve vijnë nga agjencia e tyre.',
      tags: ['evente'],
      status: 'open',
      createdBy: 'st-arta',
      lang: 'sq',
    },
  ];
}

/**
 * Complaints ("reklamacione") on real generated orders. Custom print is never restocked; the refunded
 * one is also recorded on its order.
 */
export function buildReturns(now: Date, orders: Order[]): { returns: ReturnRequest[]; orders: Order[] } {
  const age = (o: Order) => (now.getTime() - new Date(o.createdAt).getTime()) / DAY;
  const used = new Set<string>();
  const lineOf = (o: Order, cats: string[]) => o.items.find((l) => l.artwork && l.qty >= 500 && cats.some((c) => l.sku.startsWith(c)));
  // the biggest matching job — complaints on tiny runs don't make the demo
  const find = (pred: (o: Order) => boolean, cats: string[]) => {
    const o = orders
      .filter((x) => !used.has(x.id) && pred(x) && lineOf(x, cats))
      .sort((a, b) => (lineOf(b, cats)?.lineTotal ?? 0) - (lineOf(a, cats)?.lineTotal ?? 0))[0];
    if (o) used.add(o.id);
    return o;
  };
  const part = (qty: number, share: number) => Math.max(50, Math.round((qty * share) / 50) * 50);
  const at = (t0: number, h: number) => new Date(t0 + h * 3600000).toISOString();

  const shippedAgo = (o: Order) => (o.fulfillment?.shippedAt ? (now.getTime() - new Date(o.fulfillment.shippedAt).getTime()) / DAY : -1);
  const transit = find((o) => (o.status === 'completed' || o.status === 'shipped') && shippedAgo(o) >= 0 && shippedAgo(o) < 10, ['PW-BG', 'PW-FD', 'PW-PK']);
  const colour = find((o) => o.status === 'completed' && age(o) > 18 && o.payment.status === 'paid', ['PW-LB', 'PW-PK']);
  const diecut = find((o) => o.status === 'completed' && shippedAgo(o) > 4 && shippedAgo(o) < 25, ['PW-FD', 'PW-PK']);
  const design = find((o) => o.status === 'completed' && age(o) > 12, ['PW-PR', 'PW-BG', 'PW-FD']);

  const returns: ReturnRequest[] = [];
  let out = orders;
  if (colour) {
    const line = lineOf(colour, ['PW-LB', 'PW-PK'])!;
    const lines = [{ productId: line.productId, qty: part(line.qty, 0.2) }];
    const amount = Math.round(refundForLines(colour, lines) * grossFactor(colour) * 100) / 100;
    const t0 = Math.min(now.getTime() - 9 * DAY, new Date(colour.createdAt).getTime() + 16 * DAY);
    returns.push({
      id: 'rt-1001',
      number: 'RT-1001',
      orderId: colour.id,
      lines,
      reason: 'Ngjyra e markës jashtë tolerancës (ΔE > 3 ndaj Pantone-it të aprovuar) në një pjesë të tirazhit.',
      status: 'refunded',
      refundAmount: amount,
      restock: false,
      createdAt: at(t0, 0),
      timeline: [
        { at: at(t0, 0), status: 'requested', by: 'st-lirie', note: 'Klienti dërgoi foto dhe mostra nga paleta e dytë.' },
        { at: at(t0, 6), status: 'approved', by: 'st-arta', note: 'Matur me spektrofotometër — ΔE 4,2. Pranohet rimbursim i pjesshëm.' },
        { at: at(t0, 50), status: 'received', by: 'st-blerim', note: 'Copët e refuzuara u kthyen për riciklim.' },
        { at: at(t0, 54), status: 'refunded', by: 'st-arta' },
      ],
    });
    out = out.map((o) =>
      o.id === colour.id
        ? {
            ...o,
            refunds: [{ id: 'rf-1001', at: at(t0, 54), amount, lineIds: [String(o.items.indexOf(line))], note: 'RT-1001', by: 'st-arta' }],
            payment: { ...o.payment, status: 'paid', refunded: amount },
            timeline: [...o.timeline, { at: at(t0, 54), status: 'payment', note: `Rimbursim i pjesshëm ${amount.toFixed(2).replace('.', ',')} € (RT-1001)`, by: 'st-arta' }],
          }
        : o,
    );
  }
  if (diecut) {
    const line = lineOf(diecut, ['PW-FD', 'PW-PK'])!;
    const lines = [{ productId: line.productId, qty: part(line.qty, 0.15) }];
    const t0 = Math.min(now.getTime() - 2 * DAY, new Date(diecut.createdAt).getTime() + 12 * DAY);
    returns.push({
      id: 'rt-1002',
      number: 'RT-1002',
      orderId: diecut.id,
      lines,
      reason: 'Prerja me matricë e zhvendosur ~2 mm në një pjesë të kutive — printimi del jashtë skajit.',
      status: 'approved',
      refundAmount: Math.round(refundForLines(diecut, lines) * grossFactor(diecut) * 100) / 100,
      restock: false,
      createdAt: at(t0, 0),
      timeline: [
        { at: at(t0, 0), status: 'requested', by: 'web', note: 'Kërkesë nga formulari me numrin e porosisë dhe foto.' },
        { at: at(t0, 20), status: 'approved', by: 'st-arta', note: 'Ribotim pa pagesë i sasisë së dëmtuar — planifikuar për javën e ardhshme.' },
      ],
    });
  }
  if (transit) {
    const line = lineOf(transit, ['PW-BG', 'PW-FD', 'PW-PK'])!;
    const lines = [{ productId: line.productId, qty: part(line.qty, 0.05) }];
    const t = iso(now, 0, -20);
    returns.push({
      id: 'rt-1003',
      number: 'RT-1003',
      orderId: transit.id,
      lines,
      reason: 'Dëmtuar gjatë transportit — dy kartona të lagur nga shiu gjatë shkarkimit.',
      status: 'requested',
      refundAmount: Math.round(refundForLines(transit, lines) * grossFactor(transit) * 100) / 100,
      restock: false,
      createdAt: t,
      timeline: [{ at: t, status: 'requested', by: 'web', note: 'E-mail me foto të kartonave dhe fletëdërgesën e nënshkruar.' }],
    });
  }
  if (design) {
    const line = lineOf(design, ['PW-PR', 'PW-BG', 'PW-FD'])!;
    const lines = [{ productId: line.productId, qty: line.qty }];
    const t0 = new Date(design.createdAt).getTime() + 11 * DAY;
    returns.push({
      id: 'rt-1004',
      number: 'RT-1004',
      orderId: design.id,
      lines,
      reason: 'Klienti kërkon kthim pasi ndryshoi tekstin e dizajnit pas dorëzimit.',
      status: 'rejected',
      refundAmount: Math.round(refundForLines(design, lines) * grossFactor(design) * 100) / 100,
      restock: false,
      createdAt: at(t0, 0),
      timeline: [
        { at: at(t0, 0), status: 'requested', by: 'st-lirie', note: 'Telefonatë nga klienti.' },
        { at: at(t0, 26), status: 'rejected', by: 'st-arta', note: 'Prova u aprovua me shkrim para prodhimit — reklamacioni nuk qëndron. Ofruar ribotim me 15% zbritje.' },
      ],
    });
  }
  return { returns, orders: out };
}

export function buildQuotes(now: Date, orders: Order[] = []): Quote[] {
  const terms = T(
    'Çmimet janë pa TVSH (18%). Avans 50% me konfirmimin e porosisë, pjesa tjetër para dorëzimit. Afati i prodhimit: 10–12 ditë pune pas aprovimit të provës. Toleranca e tirazhit ±5%.',
    'Prices exclude VAT (18%). 50% deposit on order confirmation, balance before delivery. Production time: 10–12 working days after proof approval. Run tolerance ±5%.',
  );
  const contact = (id: string) => {
    const c = clientCustomer(id);
    return { name: `${c.firstName} ${c.lastName}`, company: c.company ?? '', email: c.email, phone: c.phone };
  };
  const sleeves = orders.find((o) => o.status !== 'cancelled' && o.customer.company === 'Burimi Kristal' && o.items.some((l) => l.productId === 'p-shrink-sleeve'));
  return [
    {
      id: 'q-031',
      number: 'Q-2026-031',
      inquiryId: 'inq_120',
      customer: { name: 'Mentor Hasani', company: 'Fresk Food Group sh.p.k.', email: 'mentor.hasani@example.com', phone: '+383 49 602 117' },
      lines: [
        { productId: 'p-kuti-sanduici', title: 'Kuti sanduiçi trekëndore — kraft + dritare PLA, CMYK', qty: 200000, price: 0.092 },
        { productId: 'p-etiketa-ushqimore', title: 'Etiketa në rrotull 80 × 60 mm — PP e bardhë, 4 variante', qty: 120000, price: 0.019 },
        { productId: 'p-kuti-takeaway', title: 'Kuti takeaway M — llak dispersion', qty: 80000, price: 0.29 },
        { title: 'Matricë e re prerjeje (njëherë)', qty: 1, price: 380 },
        { title: 'Magazinim dhe dorëzim mujor', qty: 12, price: 45 },
      ],
      validUntil: iso(now, 14),
      terms,
      version: 2,
      status: 'sent',
      createdAt: iso(now, -3),
      owner: 'st-arta',
    },
    {
      id: 'q-032',
      number: 'Q-2026-032',
      inquiryId: 'inq_103',
      customer: contact('kodra-diellit'),
      lines: [
        { productId: 'p-etiketa-vere', title: 'Etiketa vere 90 × 120 mm — letër e strukturuar, folje ari + reliev (3 variante)', qty: 6000, price: 0.16 },
        { title: 'Klishe për reliev dhe folje', qty: 1, price: 140 },
      ],
      validUntil: iso(now, 30),
      terms,
      version: 1,
      status: 'draft',
      createdAt: iso(now, -1),
      owner: 'st-arta',
    },
    {
      id: 'q-033',
      number: 'Q-2026-033',
      inquiryId: 'inq_106',
      customer: contact('elegance'),
      lines: [
        { productId: 'p-qese-luksoze', title: 'Qese luksoze L — laminim mat, dorezë litari, logo me folje ari', qty: 2000, price: 1.46 },
        { title: 'Klishe për stampim me folje', qty: 1, price: 95 },
      ],
      validUntil: iso(now, 21),
      terms,
      version: 1,
      status: 'sent',
      createdAt: iso(now, -3, -4),
      owner: 'st-arta',
    },
    {
      id: 'q-030',
      number: 'Q-2026-030',
      inquiryId: 'inq_111',
      customer: contact('lumi-pharma'),
      lines: [
        { productId: 'p-kuti-farmaceutike', title: 'Kuti farmaceutike 62 × 22 × 105 mm — GC2 350 g, Braille + pharmacode (4 variante)', qty: 40000, price: 0.085 },
        { title: 'Matricë prerjeje + mostra për validim', qty: 1, price: 260 },
      ],
      validUntil: iso(now, 4),
      terms,
      version: 1,
      status: 'accepted',
      createdAt: iso(now, -10),
      owner: 'st-gent',
    },
    {
      id: 'q-029',
      number: 'Q-2026-029',
      inquiryId: 'inq_114',
      customer: contact('kakao-lab'),
      lines: [
        { productId: 'p-kuti-cokollate', title: 'Kuti çokollate me sirtar 160 × 90 × 25 mm — karton i fortë i veshur', qty: 2000, price: 1.74 },
        { title: 'Insert me 12 ndarje', qty: 2000, price: 0.38 },
      ],
      validUntil: iso(now, -7),
      terms,
      version: 2,
      status: 'declined',
      createdAt: iso(now, -21),
      owner: 'st-arta',
    },
    {
      id: 'q-028',
      number: 'Q-2026-028',
      customer: contact('burimi-kristal'),
      lines: [
        { productId: 'p-shrink-sleeve', title: 'Shrink sleeve 0,5 L — PETG 45 µm, CMYK + e bardhë', qty: 100000, price: 0.021 },
        { title: 'Klishe flexo (8 ngjyra)', qty: 1, price: 320 },
      ],
      validUntil: iso(now, -20),
      terms,
      version: 1,
      status: sleeves ? 'converted' : 'accepted',
      createdAt: iso(now, -48),
      owner: 'st-gent',
      ...(sleeves ? { orderId: sleeves.id } : {}),
    },
  ];
}

/* ================================================================== */
/* Menus & content models                                              */
/* ================================================================== */
const CATEGORY_LINKS: [string, L10n][] = [
  ['cat-kuti-ushqimore', T('Paketime ushqimore', 'Food packaging')],
  ['cat-kuti-produktesh', T('Kuti produktesh', 'Product packaging')],
  ['cat-etiketa', T('Etiketa & shrink sleeve', 'Labels & shrink sleeves')],
  ['cat-qese-letre', T('Qese letre', 'Paper bags')],
  ['cat-materiale-promovuese', T('Materiale promovuese', 'Promotional print')],
  ['cat-finishing', T('Finishing & efekte', 'Finishing & effects')],
];

export function buildMenus(): Menu[] {
  const cat = (prefix: string) => CATEGORY_LINKS.map(([id, label]) => ({ id: `${prefix}-${id}`, label, type: 'category' as const, target: id }));
  const url = (id: string, label: L10n, target: string, children?: Menu['items']) => ({ id, label, type: 'url' as const, target, ...(children ? { children } : {}) });
  const page = (id: string, label: L10n) => ({ id: `mi-f-${id}`, label, type: 'page' as const, target: id });
  return [
    {
      id: 'menu-main',
      handle: 'main',
      title: 'Menyja kryesore',
      items: [
        url('mi-products', T('Produktet', 'Products'), '/produktet', [
          ...cat('mi'),
          { id: 'mi-festat', label: T('Paketimi për festat', 'Holiday packaging'), type: 'offer', target: 'of-festat' },
        ]),
        url('mi-industries', T('Industritë', 'Industries'), '/industrite'),
        url('mi-technology', T('Teknologjia', 'Technology'), '/teknologjia'),
        url('mi-projects', T('Projektet', 'Projects'), '/projektet'),
        url('mi-about', T('Rreth nesh', 'About'), '/rreth-nesh'),
        url('mi-blog', T('Blog', 'Blog'), '/blog'),
        url('mi-contact', T('Kontakt', 'Contact'), '/kontakt'),
      ],
    },
    {
      id: 'menu-footer',
      handle: 'footer',
      title: 'Fundi i faqes',
      items: [
        url('mi-f-shop', T('Produktet', 'Products'), '/produktet', [
          ...cat('mi-f'),
          { id: 'mi-f-mostra', label: T('Paketa e mostrave', 'Sample kit'), type: 'product', target: 'p-mostra' },
          url('mi-f-quote', T('Kërko ofertë', 'Request a quote'), '/kerko-oferte'),
        ]),
        url('mi-f-company', T('Kompania', 'Company'), '/rreth-nesh', [
          url('mi-f-about', T('Rreth nesh', 'About'), '/rreth-nesh'),
          url('mi-f-technology', T('Teknologjia', 'Technology'), '/teknologjia'),
          url('mi-f-industries', T('Industritë', 'Industries'), '/industrite'),
          url('mi-f-projects', T('Projektet', 'Projects'), '/projektet'),
          url('mi-f-blog', T('Blog', 'Blog'), '/blog'),
          url('mi-f-contact', T('Kontakt', 'Contact'), '/kontakt'),
        ]),
        url('mi-f-help', T('Për klientët', 'Customer care'), '', [
          page('pg-dostava', T('Dërgesa dhe afatet', 'Delivery & lead times')),
          page('pg-skedaret', T('Si të përgatisni skedarët', 'Artwork guide')),
          page('pg-pagesat', T('Pagesat', 'Payments')),
          page('pg-uslovi', T('Kushtet e shitjes', 'Terms of sale')),
          page('pg-reklamacije', T('Reklamacionet', 'Complaints')),
          page('pg-privatnost', T('Politika e privatësisë', 'Privacy policy')),
        ]),
      ],
    },
  ];
}

export function buildContentModels(projects: Project[], home: HomeSection[], locations: number): ContentModel[] {
  const section = <K extends HomeSection['type']>(type: K) => home.find((h): h is Extract<HomeSection, { type: K }> => h.type === type);
  const faq = section('faq');
  const tech = section('technology');
  const industries = section('industries');
  return [
    {
      id: 'cm-projektet',
      name: T('Projektet (raste studimi)', 'Projects (case studies)'),
      source: 'projects',
      fields: [
        { key: 'title', label: T('Titulli', 'Title'), type: 'text' },
        { key: 'location', label: T('Klienti / qyteti', 'Client / city'), type: 'text' },
        { key: 'year', label: T('Viti', 'Year'), type: 'number' },
        { key: 'tags', label: T('Kategoritë', 'Categories'), type: 'choice' },
        { key: 'summary', label: T('Përshkrimi', 'Summary'), type: 'text' },
        { key: 'image', label: T('Fotografia', 'Photo'), type: 'image' },
        { key: 'featured', label: T('I veçuar', 'Featured'), type: 'boolean' },
      ],
      entries: projects.length,
    },
    {
      id: 'cm-faq',
      name: T('Pyetje të shpeshta', 'FAQ'),
      source: 'home.faq',
      fields: [
        { key: 'q', label: T('Pyetja', 'Question'), type: 'text' },
        { key: 'a', label: T('Përgjigjja', 'Answer'), type: 'text' },
      ],
      entries: faq ? faq.data.items.length : 0,
    },
    {
      id: 'cm-teknologjia',
      name: T('Teknologjia', 'Technology'),
      source: 'home.technology',
      fields: [
        { key: 'title', label: T('Makina / procesi', 'Machine / process'), type: 'text' },
        { key: 'text', label: T('Përshkrimi', 'Description'), type: 'text' },
      ],
      entries: tech ? tech.data.items.length : 0,
    },
    {
      id: 'cm-industrite',
      name: T('Industritë', 'Industries'),
      source: 'home.industries',
      fields: [
        { key: 'title', label: T('Industria', 'Industry'), type: 'text' },
        { key: 'points', label: T('Pikat (një për rresht)', 'Points (one per line)'), type: 'text' },
        { key: 'image', label: T('Fotografia', 'Photo'), type: 'image' },
        { key: 'href', label: T('Lidhja', 'Link'), type: 'link' },
      ],
      entries: industries ? industries.data.items.length : 0,
    },
    {
      id: 'cm-lokacionet',
      name: T('Lokacionet', 'Locations'),
      source: 'settings.locations',
      fields: [
        { key: 'name', label: T('Emri', 'Name'), type: 'text' },
        { key: 'address', label: T('Adresa', 'Address'), type: 'text' },
        { key: 'city', label: T('Qyteti', 'City'), type: 'text' },
        { key: 'pickup', label: T('Marrje në vend', 'Pickup'), type: 'boolean' },
        { key: 'map', label: T('Harta', 'Map'), type: 'link' },
      ],
      entries: locations,
    },
  ];
}

/* ================================================================== */
/* Homepage history & audit log                                        */
/* ================================================================== */
export function buildHomeHistory(now: Date, home: HomeSection[]): HomeVersion[] {
  // v1: before the partner logos went live · v2: before the holiday promo block was added
  const v1 = structuredClone(home).map((s) => (s.type === 'logos' || s.type === 'instagram' ? { ...s, enabled: false } : s));
  const v2 = structuredClone(home)
    .filter((s) => s.type !== 'promo')
    .map((s) => (s.type === 'blog' ? { ...s, enabled: false } : s));
  return [
    { at: iso(now, -7, -4), by: 'st-drita', sections: v1 },
    { at: iso(now, -21, -2), by: 'st-drita', sections: v2 },
  ];
}

export function buildAudit(now: Date, orders: Order[]): AuditEntry[] {
  const o = (i: number) => orders[Math.min(i, orders.length - 1)];
  const firstWith = (status: Order['status'], from = 0) => orders.slice(from).find((x) => x.status === status) ?? o(from);
  const a = (id: number, hours: number, actor: string, action: AuditEntry['action'], object: AuditEntry['object'], objectId: string, detail?: string): AuditEntry => ({
    id: `au-${id}`,
    at: new Date(now.getTime() - hours * 3600000).toISOString(),
    actor,
    action,
    object,
    objectId,
    ...(detail ? { detail } : {}),
  });
  const confirmed = firstWith('confirmed');
  const proof = firstWith('proof');
  const shipped = firstWith('shipped');
  const year = festiveYear(now);
  return [
    a(1, 0.4, 'st-gent', 'login', 'staff', 'st-gent', 'Hyrje në CMS'),
    a(2, 1.2, 'st-arta', 'status', 'order', confirmed.id, `${confirmed.number}: new → confirmed`),
    a(3, 2.5, 'st-blerim', 'send', 'order', proof.id, `${proof.number}: prova digjitale v1`),
    a(4, 3, 'st-lirie', 'assign', 'inquiry', 'inq_120', 'Mentor Hasani → Arta Krasniqi'),
    a(5, 20, 'st-arta', 'create', 'draft', 'dr-1001', 'D-1001 — Natyra Skin Lab'),
    a(6, 26, 'st-lirie', 'fulfil', 'order', shipped.id, shipped.number),
    a(7, 30, 'st-lirie', 'create', 'booking', 'bk-110', 'Press check — kuti tortash'),
    a(8, 47, 'st-drita', 'create', 'offer', 'of-blackfriday', 'Black Friday — kuti postare −20%'),
    a(9, 48, 'st-drita', 'create', 'discount', 'd-blackfriday', 'Black Friday — kuti postare dhe dhuratash −20%'),
    a(10, 50, 'st-drita', 'create', 'placement', 'pl-s-bf', 'Hero — Black Friday kuti postare'),
    a(11, 52, 'st-arta', 'receive', 'purchaseOrder', 'po-031', 'PO-2026-031: +2.180'),
    a(12, 74, 'st-arta', 'send', 'quote', 'q-031', 'Q-2026-031 v2'),
    a(13, 96, 'st-blerim', 'adjust', 'inventory', 'p-mostra', 'PW-FN-004 −2 (dëmtuar)'),
    a(14, 98, 'st-gent', 'send', 'draft', 'dr-1002', 'D-1002 — proforma'),
    a(15, 170, 'st-drita', 'publish', 'home', 'home', 'Ballina — blloku promo i festave'),
    a(16, 180, 'st-drita', 'publish', 'offer', 'of-festat', `Paketimi për festat ${year}`),
    a(17, 182, 'st-drita', 'create', 'discount', 'd-festat', `Festat ${year} — paketim dhuratash −10%`),
    a(18, 184, 'st-ana', 'create', 'collection', 'col-festat', `Festat ${year}`),
    a(19, 230, 'st-arta', 'refund', 'return', 'rt-1001', 'RT-1001 — ngjyrë jashtë tolerancës'),
    a(20, 430, 'st-ana', 'create', 'discount', 'd-etiketa15', 'Promo etiketash — −15% nga 5.000 copë'),
    a(21, 505, 'st-ana', 'create', 'product', 'p-mostra', 'Paketë mostrash PrintWorks'),
    a(22, 506, 'st-drita', 'create', 'discount', 'd-mostra19', 'MOSTRA19'),
    a(23, 610, 'st-gent', 'update', 'settings', 'settings', 'freeShippingThreshold: 250'),
    a(24, LEGACY_PRODUCT.archivedDaysAgo * 24, 'st-ana', 'archive', 'product', LEGACY_PRODUCT.id, 'Kuti pice katrore (seria 2025)'),
  ];
}
