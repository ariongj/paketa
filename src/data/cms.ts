// CMS v2 demo data — collections, discounts, offers, placements, staff, appointments, segments,
// inventory, purchasing, drafts, returns, quotes, menus, content models and the audit log.
// Everything is relative to `now` so the demo always looks current, and coherent with the
// Paketoje catalogue (cups, lids, food containers, desserts, sauce cups, cutlery, straws) and Kosovo.
// T(me, sq, en): `me` holds Serbian (Latin).
import type {
  AuditEntry, Booking, Collection, ContentModel, Discount, DraftOrder, HomeSection, HomeVersion, Inquiry, InventoryMovement, L10n,
  Menu, Offer, Order, Placement, Product, Project, PurchaseOrder, Quote, ReturnRequest, Segment, Service, Staff,
} from '@/lib/types';
import { defaultOptions } from '@/lib/pricing';
import { refundForLines } from '@/lib/orders';
import { round2, slugify } from '@/lib/utils';

const T = (me: string, sq: string, en: string): L10n => ({ me, sq, en });
const E = (): L10n => ({ me: '', sq: '', en: '' });
const DAY = 86400000;
const iso = (now: Date, days: number, hours = 0) => new Date(now.getTime() + days * DAY + hours * 3600000).toISOString();

/* ================================================================== */
/* Products — tags, vendors, costs, barcodes, incoming, one archived   */
/* ================================================================== */
/** Purchase cost as a share of the regular pack price, per category (55–65 %). */
const COST_FACTOR: Record<string, number> = {
  'cat-gota': 0.58, 'cat-kapake': 0.55, 'cat-ene': 0.62, 'cat-embelsira': 0.6, 'cat-salca': 0.56,
  'cat-takem': 0.63, 'cat-shkopinj': 0.57, 'cat-karton': 0.6, 'cat-etiketa': 0.55,
};

const V_PET = 'Furnitor PET & PP — Turqi';
const V_PP = 'Furnitor enësh PP — Greqi';
const V_PAPER = 'Furnitor letre & kartoni — Maqedoni e Veriut';
const V_CUT = 'Furnitor takëmesh & shkopinjsh — Bullgari';
const V_PRINT = 'Paketoje — printim me logo';

const COLD = ['f95', 'pije-te-ftohta', 'kafiteri'];
const EXTRAS: Record<string, { tags: string[]; vendor: string; incoming?: number; unavailable?: number; channels?: ('online' | 'pos')[] }> = {
  'p-gota-f95-250': { tags: COLD, vendor: V_PET },
  'p-gota-f95-300': { tags: [...COLD, 'catering'], vendor: V_PET },
  'p-gota-f95-350': { tags: COLD, vendor: V_PET },
  'p-gota-f95-400': { tags: COLD, vendor: V_PET },
  'p-gota-f95-500': { tags: [...COLD, 'smoothie'], vendor: V_PET, incoming: 60 },
  'p-kapak-sheshte': { tags: ['f95', 'kapak', 'kafiteri'], vendor: V_PET },
  'p-kapak-kupole': { tags: ['f95', 'kapak', 'smoothie'], vendor: V_PET },
  'p-kapak-clip': { tags: ['f95', 'kapak', 'take-away'], vendor: V_PET },
  'p-kapak-bodega': { tags: ['bodega', 'kapak', 'embelsira'], vendor: V_PET },
  'p-kuti-dy-ndarje': { tags: ['fast-food', 'take-away', 'ndarje'], vendor: V_PP },
  'p-ene-mikrovale-500': { tags: ['mikrovale', 'take-away', 'restorant'], vendor: V_PP },
  'p-ene-mikrovale-750': { tags: ['mikrovale', 'take-away', 'oferte'], vendor: V_PP },
  'p-ene-sushi-mesme': { tags: ['sushi', 'kapak-transparent'], vendor: V_PET },
  'p-ene-sushi-500': { tags: ['sushi', 'hermetike'], vendor: V_PET },
  'p-ene-sallate-750': { tags: ['sallate', 'kristal'], vendor: V_PET },
  'p-ene-sallate-1000': { tags: ['sallate', 'kristal', 'catering'], vendor: V_PET },
  'p-gote-venus': { tags: ['embelsira', 'pasticeri', 'e-re'], vendor: V_PET, unavailable: 2 },
  'p-gote-ps': { tags: ['embelsira', 'pasticeri'], vendor: V_PET },
  'p-gote-bodega-250': { tags: ['embelsira', 'bodega'], vendor: V_PET },
  'p-kuti-torte-230': { tags: ['torte', 'pasticeri'], vendor: V_PAPER, incoming: 64, unavailable: 1 },
  'p-ene-torte-kupole': { tags: ['torte', 'pasticeri'], vendor: V_PAPER, incoming: 40 },
  'p-kuti-trekendeshe-gold': { tags: ['torte', 'gold', 'pasticeri'], vendor: V_PAPER, incoming: 60 },
  'p-luge-akullore-roze': { tags: ['akullore', 'luge', 'e-re'], vendor: V_CUT },
  'p-luge-akullore-lux': { tags: ['akullore', 'luge', 'premium'], vendor: V_CUT, incoming: 30 },
  'p-salce-1oz': { tags: ['salca', 'fast-food', 'dergesa'], vendor: V_PET },
  'p-salce-2oz': { tags: ['salca', 'fast-food', 'dergesa'], vendor: V_PET },
  'p-set-ps-zi': { tags: ['takem', 'set', 'fast-food'], vendor: V_CUT },
  'p-set-ps-bardhe': { tags: ['takem', 'set', 'catering'], vendor: V_CUT },
  'p-set-pp-zi': { tags: ['takem', 'set', 'pp'], vendor: V_CUT },
  'p-set-lux-zi': { tags: ['takem', 'set', 'premium', 'oferte'], vendor: V_CUT },
  'p-pirun-bardhe': { tags: ['takem', 'pirun'], vendor: V_CUT },
  'p-thike-bardhe': { tags: ['takem', 'thike'], vendor: V_CUT },
  'p-luge-bardhe': { tags: ['takem', 'luge'], vendor: V_CUT },
  'p-pirun-bardhe-100': { tags: ['takem', 'pirun', 'format-i-vjeter'], vendor: V_CUT },
  'p-shkop-22': { tags: ['shkopinj', 'kafiteri'], vendor: V_CUT },
  'p-shkop-24': { tags: ['shkopinj', 'kafiteri', 'smoothie'], vendor: V_CUT },
  'p-luge-kafe-standard': { tags: ['kafe', 'kafiteri'], vendor: V_CUT },
  'p-luge-kafe-gjate': { tags: ['kafe', 'kafiteri'], vendor: V_CUT },
  'p-gote-letre-logo': { tags: ['logo', 'kafe', 'me-porosi'], vendor: V_PRINT, channels: ['online'] },
  'p-kuti-burger-logo': { tags: ['logo', 'kraft', 'fast-food', 'me-porosi'], vendor: V_PRINT, channels: ['online'] },
  'p-etiketa-logo': { tags: ['logo', 'etiketa', 'me-porosi'], vendor: V_PRINT, channels: ['online'] },
};

/** Internal in-store EAN-13 (restricted-circulation prefix 2 + the SKU number) with a valid check digit. */
function ean13(sku: string, fallback: number) {
  const n = Number(sku.replace(/\D/g, '')) || fallback;
  const body = `2${String(n).padStart(11, '0')}`;
  const sum = body.split('').reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return body + ((10 - (sum % 10)) % 10);
}

/** Adds CMS v2 fields to the catalogue (cost, vendor, tags, barcode, incoming, channels, template). */
export function enrichProducts(products: Product[]): Product[] {
  return products.map((p, i): Product => {
    const x = EXTRAS[p.id];
    return {
      ...p,
      cost: round2(p.price * (COST_FACTOR[p.categoryId] ?? 0.6)),
      vendor: x?.vendor,
      // catalogue tags first, CMS merchandising tags added (no duplicates)
      tags: [...new Set([...(p.tags ?? []), ...(x?.tags ?? [])])],
      barcode: ean13(p.sku, 900 + i),
      incoming: x?.incoming ?? 0,
      unavailable: x?.unavailable ?? 0,
      template: p.quoteOnly ? 'quote' : 'standard',
      channels: x?.channels ?? ['online', 'pos'],
    };
  });
}

/** Discontinued line (old 100-piece fork pack): archived after it had sales (orders keep their copy). */
export const ARCHIVED_PRODUCT = 'p-pirun-bardhe-100';

/* ================================================================== */
/* Collections                                                         */
/* ================================================================== */
const CUPS = ['p-gota-f95-250', 'p-gota-f95-300', 'p-gota-f95-350', 'p-gota-f95-400', 'p-gota-f95-500'];
const F95_LIDS = ['p-kapak-kupole', 'p-kapak-sheshte', 'p-kapak-clip'];

export function buildCollections(now: Date): Collection[] {
  return [
    {
      id: 'col-kafiteri',
      slug: 'per-kafiteri',
      title: T('Za kafiće i barove', 'Për kafiteri & bare', 'For cafés & bars'),
      description: T(
        'Sve za hladne napitke za poneti: čaše F95 od 250 do 500 ml, odgovarajući poklopci, slamke i kašičice za kafu.',
        'Gjithçka për pije të ftohta take-away: gota F95 nga 250 deri 500 ml, kapakët përkatës, shkopinj dhe lugë kafeje.',
        'Everything for cold drinks to go: F95 cups from 250 to 500 ml, matching lids, straws and coffee spoons.',
      ),
      image: '/images/hero/iced.webp',
      kind: 'manual',
      productIds: [...CUPS, ...F95_LIDS, 'p-shkop-22', 'p-shkop-24', 'p-luge-kafe-standard', 'p-luge-kafe-gjate'],
      match: 'all',
      rules: [],
      sort: 'manual',
      published: true,
      seo: { title: 'Paketim për kafiteri — gota F95, kapakë, shkopinj | Paketoje', description: 'Gota plastike F95, kapakë, shkopinj dhe lugë kafeje me çmime shumice. Dërgesë 24h në Mitrovicë.' },
      createdAt: iso(now, -62),
    },
    {
      id: 'col-fastfood',
      slug: 'per-fast-food',
      title: T('Za brzu hranu', 'Për fast food', 'For fast food'),
      description: T(
        'Kutije sa dvije pregrade, posude za mikrotalasnu, čašice za sos i setovi pribora — za dostavu bez prosipanja.',
        'Kuti me dy ndarje, enë për mikrovalë, gota salce dhe sete takëmesh — për dërgesa pa derdhje.',
        'Two-compartment boxes, microwave containers, sauce cups and cutlery sets — for spill-free delivery.',
      ),
      image: '/images/misc/fries.webp',
      kind: 'manual',
      productIds: ['p-kuti-dy-ndarje', 'p-ene-mikrovale-500', 'p-ene-mikrovale-750', 'p-salce-1oz', 'p-salce-2oz', 'p-set-ps-zi', 'p-set-ps-bardhe', 'p-set-pp-zi', 'p-set-lux-zi'],
      match: 'all',
      rules: [],
      sort: 'manual',
      published: true,
      createdAt: iso(now, -58),
    },
    {
      id: 'col-pasticeri',
      slug: 'per-pasticeri',
      title: T('Za poslastičarnice', 'Për pastiçeri', 'For pastry shops'),
      description: T(
        'Čaše za desert, kutije za torte, gold kutije za parče torte i kašičice za sladoled — trenutno −10 % automatski u korpi.',
        'Gota ëmbëlsirash, kuti tortash, kuti gold për copë torte dhe lugë akulloreje — tani −10 % automatikisht në shportë.',
        'Dessert cups, cake boxes, gold slice boxes and ice-cream spoons — now −10 % automatically in the cart.',
      ),
      image: '/images/misc/donuts.webp',
      kind: 'smart',
      productIds: [],
      match: 'all',
      rules: [{ field: 'category', op: 'eq', value: 'cat-embelsira' }],
      sort: 'bestselling',
      published: true,
      seo: { title: 'Paketim për pastiçeri dhe akullore | Paketoje', description: 'Gota ëmbëlsirash, kuti tortash dhe lugë akulloreje — −10 % automatikisht në shportë.' },
      createdAt: iso(now, -19),
    },
    {
      id: 'col-sushi',
      slug: 'sushi-poke',
      title: T('Suši i poke', 'Sushi & poke', 'Sushi & poke'),
      description: T(
        'Posude za suši sa providnim poklopcem, hermetičke posude, posude za poke i čašice za soja sos.',
        'Enë sushi me kapak transparent, enë hermetike, enë për poke dhe gota për salcë soje.',
        'Sushi trays with clear lids, airtight containers, poke bowls and soy-sauce cups.',
      ),
      image: '/images/misc/sushi.webp',
      kind: 'manual',
      productIds: ['p-ene-sushi-mesme', 'p-ene-sushi-500', 'p-ene-sallate-750', 'p-salce-1oz', 'p-salce-2oz'],
      match: 'all',
      rules: [],
      sort: 'manual',
      published: true,
      createdAt: iso(now, -40),
    },
    {
      id: 'col-bestseleri',
      slug: 'me-te-shiturat',
      title: T('Najprodavanije', 'Më të shiturat', 'Bestsellers'),
      description: T('Proizvodi koje lokali najčešće naručuju iz mjeseca u mjesec.', 'Produktet që lokalet porositin më shpesh, muaj pas muaji.', 'The products venues reorder most, month after month.'),
      image: '/images/p/pak-104-1.webp',
      kind: 'smart',
      productIds: [],
      match: 'all',
      rules: [{ field: 'badge', op: 'eq', value: 'bestseller' }],
      sort: 'bestselling',
      published: true,
      createdAt: iso(now, -90),
    },
    {
      id: 'col-nen-3',
      slug: 'nen-3-euro',
      title: T('Ispod 3 €', 'Nën 3 €', 'Under €3'),
      description: T('Pakovanja ispod 3 € — čaše, poklopci, pribor i kašičice za svaki dan.', 'Pako nën 3 € — gota, kapakë, takëm dhe lugë për çdo ditë.', 'Packs under €3 — cups, lids, cutlery and spoons for every day.'),
      image: '/images/cat/shkopinj.webp',
      kind: 'smart',
      productIds: [],
      match: 'all',
      rules: [{ field: 'price', op: 'lt', value: '3' }],
      sort: 'price-asc',
      published: true,
      createdAt: iso(now, -33),
    },
    {
      id: 'col-delivery',
      slug: 'paketim-per-dergesa',
      title: T('Ambalaža za dostavu', 'Paketim për dërgesa', 'Delivery packaging'),
      description: T(
        'Komplet za restorane koji rade dostavu: posude koje se dobro zatvaraju, čašice za sos, pribor i clip poklopci.',
        'Paketa për restorantet me dërgesa: enë që mbyllen mirë, gota salce, takëm dhe kapakë clip.',
        'A kit for restaurants that deliver: tight-closing containers, sauce cups, cutlery and clip lids.',
      ),
      image: '/images/hero/delivery.webp',
      kind: 'manual',
      productIds: ['p-kuti-dy-ndarje', 'p-ene-mikrovale-500', 'p-ene-mikrovale-750', 'p-salce-1oz', 'p-set-ps-zi', 'p-gota-f95-400', 'p-kapak-clip'],
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
const ALL_LINES = { scope: 'all' as const, ids: [] };
const NO_MIN = { type: 'none' as const, value: 0 };
const EVERYONE = { type: 'all' as const };

/** End of the autumn cold-drinks campaign (4 packs of F95 cups → 1 pack of lids free) — usable for a homepage countdown. */
export const autumnSaleEnd = (now: Date) => new Date(now.getTime() + 23 * DAY + 5 * 3600000).toISOString();

/** Black Friday (4th Friday of November, local midnight) — this year, or next year once it has passed. */
export function blackFriday(now: Date): Date {
  const at = (y: number) => {
    const d = new Date(y, 10, 1);
    d.setDate(1 + ((5 - d.getDay() + 7) % 7) + 21);
    return d;
  };
  const d = at(now.getFullYear());
  return d.getTime() + 4 * DAY < now.getTime() ? at(now.getFullYear() + 1) : d;
}

export function buildDiscounts(now: Date): Discount[] {
  const bf = blackFriday(now);
  return [
    {
      id: 'd-mireseerdhe',
      title: 'Mirëseardhje — MIRESEERDHE (porosia e parë)',
      publicTitle: T('Dobrodošlica −10%', 'Mirëseardhje −10%', 'Welcome −10%'),
      kind: 'order',
      method: 'code',
      code: 'MIRESEERDHE',
      valueType: 'percent',
      value: 10,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 30 },
      audience: EVERYONE,
      combines: { products: true, order: false, shipping: true },
      oncePerCustomer: true,
      startsAt: iso(now, -200),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -200),
      tags: ['mireseardhje', 'klient-i-ri'],
    },
    {
      id: 'd-kafe15',
      title: 'Kafiteri −15% — KAFE15',
      publicTitle: T('Za kafiće −15%', 'Për kafiteri −15%', 'Café range −15%'),
      kind: 'products',
      method: 'code',
      code: 'KAFE15',
      valueType: 'percent',
      value: 15,
      appliesTo: { scope: 'collections', ids: ['col-kafiteri'] },
      minimum: NO_MIN,
      audience: EVERYONE,
      combines: { products: true, order: false, shipping: true },
      usageLimit: 300,
      startsAt: iso(now, -45),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -46),
      tags: ['kafiteri'],
    },
    {
      id: 'd-gota-kapak',
      title: 'Gota F95: 4 pako → 1 pako kapakë falas (automatike)',
      publicTitle: T('4 pak. čaša F95 → 1 pak. poklopaca gratis', '4 pako gota F95 → 1 pako kapakë falas', '4 packs of F95 cups → 1 pack of lids free'),
      kind: 'bxgy',
      method: 'auto',
      valueType: 'percent',
      value: 100,
      appliesTo: ALL_LINES,
      minimum: NO_MIN,
      bxgy: { buyIds: CUPS, buyScope: 'products', buyQty: 4, getIds: F95_LIDS, getScope: 'products', getQty: 1, getType: 'free', getValue: 100, maxUses: 5 },
      audience: EVERYONE,
      combines: { products: true, order: true, shipping: true },
      startsAt: iso(now, -60),
      endsAt: autumnSaleEnd(now),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -61),
      tags: ['pije-te-ftohta', 'kafiteri'],
    },
    {
      id: 'd-dergesa50',
      title: 'Transport falas mbi 50 €',
      publicTitle: T('Besplatna dostava preko 50 €', 'Transport falas mbi 50 €', 'Free delivery over €50'),
      kind: 'shipping',
      method: 'auto',
      valueType: 'percent',
      value: 100,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 50 },
      shipping: { zoneIds: [] },
      audience: EVERYONE,
      combines: { products: true, order: true, shipping: false },
      startsAt: iso(now, -300),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -300),
      tags: ['dergesa'],
    },
    {
      id: 'd-pasticeri10',
      title: 'Pastiçeri −10% (automatike)',
      publicTitle: T('Poslastičarnice −10%', 'Pastiçeri −10%', 'Pastry range −10%'),
      kind: 'products',
      method: 'auto',
      valueType: 'percent',
      value: 10,
      appliesTo: { scope: 'collections', ids: ['col-pasticeri'] },
      minimum: NO_MIN,
      audience: EVERYONE,
      combines: { products: true, order: true, shipping: true },
      startsAt: iso(now, -18),
      endsAt: iso(now, 24),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -19),
      tags: ['pasticeri'],
    },
    {
      id: 'd-blackfriday',
      title: 'Black Friday — BLACKFRIDAY −20%',
      publicTitle: T('Black Friday −20%', 'Black Friday −20%', 'Black Friday −20%'),
      kind: 'order',
      method: 'code',
      code: 'BLACKFRIDAY',
      valueType: 'percent',
      value: 20,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 20 },
      audience: EVERYONE,
      combines: { products: false, order: false, shipping: true },
      usageLimit: 500,
      startsAt: bf.toISOString(),
      endsAt: new Date(bf.getTime() + 4 * DAY).toISOString(),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -2),
      tags: ['black-friday'],
    },
    {
      id: 'd-vera10',
      title: 'Vera — VERA10',
      publicTitle: T('Ljeto −10%', 'Vera −10%', 'Summer −10%'),
      kind: 'order',
      method: 'code',
      code: 'VERA10',
      valueType: 'percent',
      value: 10,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 25 },
      audience: EVERYONE,
      combines: { products: true, order: false, shipping: true },
      startsAt: iso(now, -128),
      endsAt: iso(now, -37),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -130),
      tags: ['vera'],
    },
    {
      id: 'd-vip',
      title: 'Klientë VIP — 15 € mbi 150 €',
      publicTitle: T('VIP popust 15 €', 'Zbritje VIP 15 €', 'VIP €15 off'),
      kind: 'order',
      method: 'code',
      code: 'VIP15',
      valueType: 'fixed',
      value: 15,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 150 },
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
/* Offers (active / active / draft / scheduled)                        */
/* ================================================================== */
const ZERO = { visits: 0, ctaClicks: 0, codeUses: 0, orders: 0, revenue: 0, discountTotal: 0 };

export function buildOffers(now: Date, discounts: Discount[], orders: Order[]): Offer[] {
  const d = (id: string) => discounts.find((x) => x.id === id)!;
  const metrics = (discountId: string, visitsPerOrder: number, baseVisits: number) => {
    const list = orders.filter((o) => o.status !== 'cancelled' && o.discounts?.some((a) => a.id === discountId));
    const discountTotal = round2(list.reduce((s, o) => s + (o.discounts?.find((a) => a.id === discountId)?.amount ?? 0), 0));
    const visits = baseVisits + list.length * visitsPerOrder;
    return {
      visits,
      ctaClicks: Math.round(visits * 0.17),
      codeUses: list.filter((o) => o.discounts?.some((a) => a.id === discountId && a.code)).length,
      orders: list.length,
      revenue: round2(list.reduce((s, o) => s + o.total, 0)),
      discountTotal,
    };
  };
  return [
    {
      id: 'of-pije-te-ftohta',
      slug: 'pije-te-ftohta',
      name: T('Hladni napici — poklopci gratis', 'Pije të ftohta — kapakë falas', 'Cold drinks — free lids'),
      description: T(
        'Automatski: za svaka 4 pakovanja čaša F95 jedno pakovanje poklopaca gratis (do 5 po narudžbi). Prikazuje se u banneru kataloga, traci obavještenja i promo bloku početne.',
        'Automatike: për çdo 4 pako gota F95 një pako kapakë falas (deri në 5 për porosi). Shfaqet në banerin e katalogut, shiritin e njoftimeve dhe bllokun promo të ballinës.',
        'Automatic: one pack of lids free for every 4 packs of F95 cups (up to 5 per order). Shown in the catalogue banner, announcement bar and homepage promo block.',
      ),
      status: 'active',
      startsAt: d('d-gota-kapak').startsAt,
      endsAt: d('d-gota-kapak').endsAt,
      discountId: 'd-gota-kapak',
      collectionId: 'col-kafiteri',
      productIds: [],
      badge: T('Poklopci gratis', 'Kapakë falas', 'Free lids'),
      image: '/images/misc/drinks.webp',
      landing: {
        title: T('Na svaka *4 pakovanja čaša* — poklopci gratis', 'Për çdo *4 pako gota* — kapakë falas', 'For every *4 packs of cups* — free lids'),
        text: T(
          'Dodajte čaše F95 i poklopce u korpu — besplatno pakovanje poklopaca obračunava se automatski, bez koda. Važi i uz cijene za veleprodaju.',
          'Shtoni gotat F95 dhe kapakët në shportë — pakoja falas e kapakëve llogaritet automatikisht, pa kod. Vlen edhe me çmimet e shumicës.',
          'Add F95 cups and lids to the cart — the free pack of lids is applied automatically, no code needed. Works with wholesale prices too.',
        ),
      },
      placements: ['banner', 'announcement', 'home-block'],
      owner: 'st-blerta',
      utm: 'utm_source=paketoje&utm_medium=banner&utm_campaign=pije-te-ftohta',
      metrics: metrics('d-gota-kapak', 34, 220),
      createdAt: iso(now, -61),
    },
    {
      id: 'of-mireseerdhe',
      slug: 'mireseerdhe',
      name: T('Dobrodošlica — MIRESEERDHE', 'Mirëseardhje — MIRESEERDHE', 'Welcome — MIRESEERDHE'),
      description: T(
        'Kod MIRESEERDHE daje 10 % na prvu narudžbu od 30 € (jednom po kupcu). Kombinuje se sa popustima na proizvode i besplatnom dostavom.',
        'Kodi MIRESEERDHE jep 10 % në porosinë e parë nga 30 € (një herë për klient). Kombinohet me zbritjet e produkteve dhe transportin falas.',
        'Code MIRESEERDHE gives 10 % off a first order from €30 (once per customer). Combines with product discounts and free delivery.',
      ),
      status: 'active',
      startsAt: d('d-mireseerdhe').startsAt,
      discountId: 'd-mireseerdhe',
      productIds: [],
      badge: T('−10% uz MIRESEERDHE', '−10% me MIRESEERDHE', '−10% with MIRESEERDHE'),
      image: '/images/misc/about.webp',
      landing: {
        title: T('Dobro došli u *Paketoje*', 'Mirë se vini në *Paketoje*', 'Welcome to *Paketoje*'),
        text: T(
          'Za prvu narudžbu unesite kod MIRESEERDHE u korpi i ostvarite 10 % popusta na narudžbe od 30 €. Dostava za 24 sata u Mitrovici.',
          'Për porosinë e parë shkruani kodin MIRESEERDHE në shportë dhe përfitoni 10 % zbritje për porosi nga 30 €. Dërgesë brenda 24 orësh në Mitrovicë.',
          'For your first order enter code MIRESEERDHE in the cart and get 10 % off orders from €30. 24-hour delivery in Mitrovica.',
        ),
      },
      placements: ['banner', 'home-block'],
      owner: 'st-blerta',
      utm: 'utm_source=paketoje&utm_medium=landing&utm_campaign=mireseerdhe',
      metrics: metrics('d-mireseerdhe', 42, 640),
      createdAt: iso(now, -200),
    },
    {
      id: 'of-pasticeri',
      slug: 'per-pasticeri',
      name: T('Sezona torti — poslastičarnice −10 %', 'Sezoni i tortave — pastiçeri −10 %', 'Cake season — pastry shops −10 %'),
      description: T(
        'Kampanja za poslastičarnice prije praznika: stranica ponude i slajd su u pripremi; popust −10 % na kolekciju već radi automatski.',
        'Fushatë për pastiçeritë para festave: faqja e ofertës dhe slide-i janë në përgatitje; zbritja −10 % në koleksion funksionon tashmë automatikisht.',
        'A pre-holiday campaign for pastry shops: the offer page and slide are being prepared; the −10 % collection discount already runs automatically.',
      ),
      status: 'draft',
      startsAt: iso(now, 6),
      endsAt: d('d-pasticeri10').endsAt,
      discountId: 'd-pasticeri10',
      collectionId: 'col-pasticeri',
      productIds: [],
      badge: T('Poslastičarnice −10%', 'Pastiçeri −10%', 'Pastry −10%'),
      image: '/images/projects/pasticeri.webp',
      landing: {
        title: T('Kutije i čaše za *slatke praznike*', 'Kuti dhe gota për *festa të ëmbla*', 'Boxes and cups for *sweet holidays*'),
        text: T(
          'Kutije za torte, gold kutije za parče torte i čaše za desert — 10 % jeftinije, automatski u korpi.',
          'Kuti tortash, kuti gold për copë torte dhe gota ëmbëlsirash — 10 % më lirë, automatikisht në shportë.',
          'Cake boxes, gold slice boxes and dessert cups — 10 % off, automatically in the cart.',
        ),
      },
      placements: ['hero', 'home-block'],
      owner: 'st-elira',
      utm: 'utm_source=paketoje&utm_medium=hero&utm_campaign=sezoni-tortave',
      metrics: { ...ZERO },
      createdAt: iso(now, -1),
    },
    {
      id: 'of-blackfriday',
      slug: 'black-friday',
      name: T('Black Friday −20 %', 'Black Friday −20 %', 'Black Friday −20 %'),
      description: T(
        'Planirano: četiri dana −20 % na cijelu narudžbu uz kod BLACKFRIDAY. Slajd i traka se uključuju sami sa početkom akcije.',
        'E planifikuar: katër ditë −20 % në tërë porosinë me kodin BLACKFRIDAY. Slide-i dhe shiriti aktivizohen vetë me fillimin e ofertës.',
        'Scheduled: four days of −20 % on the whole order with code BLACKFRIDAY. The slide and bar switch on by themselves when the sale starts.',
      ),
      status: 'active',
      startsAt: d('d-blackfriday').startsAt,
      endsAt: d('d-blackfriday').endsAt,
      discountId: 'd-blackfriday',
      productIds: [],
      badge: T('Black Friday −20%', 'Black Friday −20%', 'Black Friday −20%'),
      image: '/images/misc/kraft-cups.webp',
      landing: {
        title: T('Black Friday: *−20 % na sve*', 'Black Friday: *−20 % në gjithçka*', 'Black Friday: *−20 % on everything*'),
        text: T(
          'Četiri dana, kod BLACKFRIDAY u korpi — idealno za zalihe za praznike. Važi uz cijene za veleprodaju i besplatnu dostavu preko 50 €.',
          'Katër ditë, kodi BLACKFRIDAY në shportë — ideale për stok para festave. Vlen me çmimet e shumicës dhe transportin falas mbi 50 €.',
          'Four days, code BLACKFRIDAY in the cart — ideal for stocking up before the holidays. Works with wholesale prices and free delivery over €50.',
        ),
      },
      placements: ['hero', 'announcement'],
      owner: 'st-blerta',
      utm: 'utm_source=paketoje&utm_medium=hero&utm_campaign=black-friday',
      metrics: { ...ZERO },
      createdAt: iso(now, -2),
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
    name: ['Hero — eko kraft', 'Hero — pije të ftohta: gota & kapakë', 'Hero — enë take-away'][i] ?? `Hero ${i + 1}`,
    eyebrow: s.eyebrow,
    title: s.title,
    subtitle: s.subtitle,
    cta: s.primary,
    secondary: s.secondary,
    image: s.image,
    alt: [
      T('Kraft kutija, papirna čaša, posuda za supu i drveni pribor', 'Kuti kraft, gotë letre, enë supe dhe takëm druri', 'Kraft box, paper cup, soup container and wooden cutlery'),
      T('Smoothie u providnoj čaši sa slamkom', 'Smoothie në gotë të tejdukshme me shkop', 'Smoothie in a clear cup with a straw'),
      T('Salate u crnim posudama za poneti', 'Sallata në enë të zeza take-away', 'Salads in black take-away containers'),
    ][i] ?? E(),
    overlay: 35,
    order: i + 1,
  }));
  const ann = (id: string, order: number, title: L10n, offerId?: string, href = ''): Placement => ({
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
      id: 'pl-s4',
      kind: 'slide',
      position: 'home-hero',
      name: 'Hero — Black Friday −20%',
      eyebrow: T('Black Friday', 'Black Friday', 'Black Friday'),
      title: T('Sve *−20 %*.', 'Gjithçka *−20 %*.', 'Everything *−20 %*.'),
      subtitle: T(
        'Četiri dana sa kodom BLACKFRIDAY — čaše, poklopci, posude i pribor za praznične gužve.',
        'Katër ditë me kodin BLACKFRIDAY — gota, kapakë, enë dhe takëm për ngarkesën e festave.',
        'Four days with code BLACKFRIDAY — cups, lids, containers and cutlery for the holiday rush.',
      ),
      cta: { label: T('Pogledajte proizvode', 'Shikoni produktet', 'Shop products'), href: '/produktet' },
      secondary: { label: T('Detalji ponude', 'Detajet e ofertës', 'Offer details'), href: '/oferta/black-friday' },
      image: '/images/misc/kraft-cups.webp',
      alt: T('Dvije kraft čaše sa crnim poklopcem', 'Dy gota kraft me kapak të zi', 'Two kraft cups with black lids'),
      overlay: 45,
      offerId: 'of-blackfriday',
      order: 4,
    },
    {
      ...base,
      id: 'pl-s5',
      kind: 'slide',
      position: 'home-hero',
      status: 'draft',
      name: 'Hero — sezoni i tortave (draft)',
      eyebrow: T('Za poslastičarnice', 'Për pastiçeri', 'For pastry shops'),
      title: T('Slatko, upakovano *kako treba*.', 'E ëmbël, e paketuar *si duhet*.', 'Sweet, packed *properly*.'),
      subtitle: T(
        'Kutije za torte, gold kutije za parče torte i čaše za desert — −10 % automatski u korpi.',
        'Kuti tortash, kuti gold për copë torte dhe gota ëmbëlsirash — −10 % automatikisht në shportë.',
        'Cake boxes, gold slice boxes and dessert cups — −10 % automatically in the cart.',
      ),
      cta: { label: T('Pogledajte kolekciju', 'Shikoni koleksionin', 'See the collection'), href: '/koleksioni/per-pasticeri' },
      image: '/images/projects/pasticeri.webp',
      alt: T('Krofne u kraft kutiji', 'Donuts në kuti kraft', 'Doughnuts in a kraft box'),
      textAlign: 'center',
      overlay: 40,
      offerId: 'of-pasticeri',
      order: 5,
    },
    {
      ...base,
      id: 'pl-b1',
      kind: 'banner',
      position: 'catalog',
      name: 'Katalogu — pije të ftohta: kapakë falas',
      eyebrow: T('Hladni napici', 'Pije të ftohta', 'Cold drinks'),
      title: T('4 pak. čaša → *poklopci gratis*', '4 pako gota → *kapakë falas*', '4 packs of cups → *free lids*'),
      subtitle: T('Obračunava se automatski u korpi — bez koda, do 5 pakovanja po narudžbi.', 'Llogaritet automatikisht në shportë — pa kod, deri në 5 pako për porosi.', 'Applied automatically in the cart — no code, up to 5 packs per order.'),
      cta: { label: T('Za kafiće', 'Për kafiteri', 'Café range'), href: '/koleksioni/per-kafiteri' },
      image: '/images/misc/drinks.webp',
      alt: T('Tri smoothieja sa crnim slamkama', 'Tre smoothie me shkopinj të zinj', 'Three smoothies with black straws'),
      overlay: 30,
      offerId: 'of-pije-te-ftohta',
      order: 1,
    },
    {
      ...base,
      id: 'pl-b2',
      kind: 'banner',
      position: 'catalog',
      name: 'Katalogu — MIRESEERDHE −10%',
      eyebrow: T('Za prvu narudžbu', 'Për porosinë e parë', 'For your first order'),
      title: T('−10 % uz kod *MIRESEERDHE*', '−10 % me kodin *MIRESEERDHE*', '−10 % with code *MIRESEERDHE*'),
      subtitle: T('Za narudžbe od 30 € — kombinuje se sa besplatnom dostavom preko 50 €.', 'Për porosi nga 30 € — kombinohet me transportin falas mbi 50 €.', 'On orders from €30 — combines with free delivery over €50.'),
      cta: { label: T('Kupujte sada', 'Blini tani', 'Shop now'), href: '/produktet' },
      image: '/images/misc/about.webp',
      alt: T('Police sa kartonima u skladištu', 'Rafte me kartona në depo', 'Warehouse shelves stacked with cartons'),
      overlay: 40,
      offerId: 'of-mireseerdhe',
      order: 2,
    },
    ann('pl-a1', 1, T('Besplatni uzorci za lokale · dostava za 24h u Mitrovici', 'Mostra falas për lokale · dërgesë 24h në Mitrovicë', 'Free samples for venues · 24h delivery in Mitrovica'), undefined, '/sherbimet'),
    ann('pl-a2', 2, T('Besplatna dostava za narudžbe preko 50 € širom Kosova', 'Transport falas për porosi mbi 50 € në gjithë Kosovën', 'Free delivery on orders over €50 across Kosovo'), undefined, '/faqe/transporti'),
    ann('pl-a3', 3, T('4 pakovanja čaša F95 → 1 pakovanje poklopaca gratis, automatski', '4 pako gota F95 → 1 pako kapakë falas, automatikisht', '4 packs of F95 cups → 1 pack of lids free, automatically'), 'of-pije-te-ftohta', '/koleksioni/per-kafiteri'),
    ann('pl-a4', 4, T('Black Friday: −20 % na sve uz kod BLACKFRIDAY', 'Black Friday: −20 % në gjithçka me kodin BLACKFRIDAY', 'Black Friday: −20 % on everything with code BLACKFRIDAY'), 'of-blackfriday', '/oferta/black-friday'),
  ];
}

/* ================================================================== */
/* Staff, services, bookings                                           */
/* ================================================================== */
export const STAFF: Staff[] = [
  { id: 'st-driton', name: 'Driton Gashi', email: 'driton@paketoje.com', role: 'owner', color: '#1f2937', active: true, phone: '+383 44 100 200', title: T('Vlasnik', 'Pronar', 'Owner') },
  { id: 'st-teuta', name: 'Teuta Berisha', email: 'teuta@paketoje.com', role: 'manager', color: '#6b5b95', active: true, phone: '+383 44 100 201', title: T('Menadžerka prodaje', 'Menaxhere shitjesh', 'Sales manager') },
  { id: 'st-blerta', name: 'Blerta Krasniqi', email: 'blerta@paketoje.com', role: 'marketing', color: '#c2410c', active: true, title: T('Marketing i dizajn', 'Marketing & dizajn', 'Marketing & design') },
  { id: 'st-ardita', name: 'Ardita Shala', email: 'info@paketoje.com', role: 'reception', color: '#0f766e', active: true, phone: '+383 44 100 202', title: T('Prodaja i recepcija', 'Shitje & recepsion', 'Sales & reception') },
  { id: 'st-valon', name: 'Valon Morina', email: 'valon@paketoje.com', role: 'orders', color: '#1d4ed8', active: true, phone: '+383 44 100 203', title: T('Narudžbe i skladište', 'Porositë & depoja', 'Orders & warehouse') },
  { id: 'st-elira', name: 'Elira Hoxha', email: 'elira@paketoje.com', role: 'editor', color: '#a16207', active: true, title: T('Urednica sadržaja', 'Redaktore përmbajtjeje', 'Content editor') },
];

export const SERVICES: Service[] = [
  {
    id: 'sv-mostra',
    name: T('Besplatni uzorci u vašem lokalu', 'Mostra falas në lokalin tuaj', 'Free samples at your venue'),
    description: T(
      'Dolazimo sa uzorcima čaša, poklopaca i posuda i pomažemo da izaberete prave veličine.',
      'Vijmë me mostra gotash, kapakësh dhe enësh dhe ju ndihmojmë të zgjidhni madhësitë e duhura.',
      'We bring samples of cups, lids and containers and help you pick the right sizes.',
    ),
    durationMin: 30,
    capacity: 2,
    price: 0,
    color: '#0f766e',
    staffIds: ['st-ardita', 'st-valon', 'st-teuta'],
    location: 'onsite',
  },
  {
    id: 'sv-dizajn',
    name: T('Konsultacija za štampu logotipa', 'Konsulencë për printim me logo', 'Logo-print design consultation'),
    description: T(
      'Logo, boje i pozicija na čaši ili kutiji — probni dizajn i ponuda u roku od 48 sati.',
      'Logoja, ngjyrat dhe pozicioni në gotë ose kuti — dizajn provë dhe ofertë brenda 48 orësh.',
      'Logo, colours and placement on the cup or box — a proof and a quote within 48 hours.',
    ),
    durationMin: 45,
    capacity: 1,
    color: '#c2410c',
    staffIds: ['st-blerta', 'st-teuta'],
    location: 'loc-depo',
  },
  {
    id: 'sv-takim',
    name: T('B2B sastanak — veleprodaja', 'Takim B2B — shitje me shumicë', 'B2B wholesale meeting'),
    description: T(
      'Mjesečne količine, cijene po kartonu, rokovi dostave i plaćanje na fakturu.',
      'Sasi mujore, çmime për karton, afatet e dërgesës dhe pagesa me faturë.',
      'Monthly volumes, carton pricing, delivery schedules and invoice payment.',
    ),
    durationMin: 60,
    capacity: 2,
    color: '#1f2937',
    staffIds: ['st-driton', 'st-teuta'],
    location: 'loc-depo',
  },
];

const BOOKING_PEOPLE: [string, string, string][] = [
  ['Arianit Kelmendi', '+383 44 218 774', 'Vushtrri'],
  ['Gentrit Hyseni', '+383 49 330 512', 'Prishtinë'],
  ['Erza Bislimi', '+383 45 671 209', 'Vushtrri'],
  ['Valdrin Murati', '+383 44 905 316', 'Mitrovicë'],
  ['Shqipe Latifi', '+383 49 128 650', 'Mitrovicë'],
  ['Albion Zymberi', '+383 44 760 431', 'Ferizaj'],
  ['Njomza Ibrahimi', '+383 45 502 117', 'Prishtinë'],
  ['Arben Uka', '+383 44 337 905', 'Prishtinë'],
  ['Lirije Behrami', '+383 49 846 223', 'Prishtinë'],
  ['Besart Gjocaj', '+383 44 615 378', 'Mitrovicë'],
  ['Marija Lazić', '+383 45 290 664', 'Mitrovicë'],
  ['Hana Shabani', '+383 44 471 052', 'Mitrovicë'],
  ['Ilir Rexha', '+383 49 563 819', 'Prishtinë'],
  ['Edonis Smajli', '+383 44 822 140', 'Vushtrri'],
  ['Dren Mulliqi', '+383 45 718 336', 'Mitrovicë'],
  ['Vesna Todorović', '+383 44 639 205', 'Zveçan'],
  ['Arbnora Hajdari', '+383 49 274 581', 'Skenderaj'],
  ['Leart Fetahu', '+383 44 158 903', 'Prishtinë'],
];

const VENUE_STREETS: Record<string, string[]> = {
  Mitrovicë: ['Rr. Mbretëresha Teutë', 'Rr. Adem Jashari', 'Rr. Isa Boletini', 'Rr. Nënë Tereza'],
  Prishtinë: ['Bulevardi Nënë Tereza', 'Rr. Agim Ramadani', 'Rr. Fehmi Agani', 'Bulevardi Bill Clinton'],
  Vushtrri: ['Rr. Adem Jashari', 'Rr. Dëshmorët e Kombit'],
  Zveçan: ['Ul. Nemanjina'],
};

/** [day offset from this Monday, hour, minute, service, staff, note] — no overlaps per staff member. */
const SLOTS: [number, number, number, string, string, string][] = [
  [0, 9, 30, 'sv-mostra', 'st-ardita', 'Kafiteri e re — gota F95 400/500 ml + kapakë kupolë'],
  [0, 11, 0, 'sv-takim', 'st-driton', 'Furnizim mujor për 3 lokale fast food — çmime për karton'],
  [1, 10, 0, 'sv-dizajn', 'st-blerta', 'Logo 1 ngjyrë në gota F95 400 ml — skica dhe Pantone'],
  [1, 13, 30, 'sv-mostra', 'st-valon', 'Restorant — enë mikrovalë 500/750 ml dhe kuti me dy ndarje'],
  [2, 9, 0, 'sv-mostra', 'st-ardita', 'Pastiçeri — gota Venus/PS dhe kuti tortash'],
  [2, 9, 30, 'sv-dizajn', 'st-teuta', 'Kuti kraft burgeri me logo — formati dhe printimi'],
  [2, 14, 0, 'sv-takim', 'st-driton', 'Catering — çmime shumice për sezonin e dasmave'],
  [3, 10, 0, 'sv-mostra', 'st-valon', 'Sushi bar — enë sushi me kapak transparent'],
  [3, 11, 30, 'sv-takim', 'st-teuta', 'Rrjet kafiterish — marrëveshje vjetore për gota & kapakë'],
  [4, 9, 30, 'sv-dizajn', 'st-blerta', 'Etiketa me logo në rrotull për pastiçeri'],
  [4, 13, 0, 'sv-mostra', 'st-ardita', 'Akullore — lugë rozë dhe gota PS'],
  [7, 9, 30, 'sv-mostra', 'st-ardita', 'Restorant — enë sallatash 750/1000 ml'],
  [7, 11, 0, 'sv-takim', 'st-driton', 'Dy pika smoothie — gota 500 ml, kapakë kupolë, shkopinj'],
  [8, 10, 0, 'sv-dizajn', 'st-blerta', 'Gota letre me logo për kafiteri — dizajn 2 ngjyra'],
  [8, 14, 0, 'sv-mostra', 'st-ardita', 'Bar kafe — gota F95 300 ml dhe lugë kafeje'],
  [9, 10, 30, 'sv-mostra', 'st-valon', 'Kafiteri — kapakë clip dhe shkopinj 24 cm'],
  [10, 12, 0, 'sv-takim', 'st-teuta', 'Catering — porosi për eventet e fundvitit'],
  [11, 9, 30, 'sv-mostra', 'st-ardita', 'Fast food — gota salce 1/2 oz dhe sete takëmesh'],
];

function mondayOf(now: Date) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return d;
}

/** Inquiry → the service it books: samples → visit, logo print → design consultation, the rest → B2B meeting. */
const serviceFor = (q: Inquiry) => (q.type === 'measurement' ? 'sv-mostra' : q.service === 'Printim me logo' ? 'sv-dizajn' : 'sv-takim');

/**
 * Bookings for this and next week. Scheduled inquiries are linked to future bookings of the matching
 * service (samples → sample visit, logo print → design consultation, wholesale → B2B meeting) and get the same date.
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
    const status: Booking['status'] = past ? (i === 4 ? 'noshow' : i === 5 ? 'cancelled' : 'done') : i === 13 || i === 15 ? 'pending' : 'confirmed';
    const streets = VENUE_STREETS[city] ?? ['Rr. Adem Jashari', 'Rr. Skënderbeu'];
    return {
      id: `bk-${101 + i}`,
      serviceId,
      staffId,
      customerName,
      phone,
      city,
      start: start.toISOString(),
      durationMin: service.durationMin,
      status,
      note,
      location: service.location ?? 'loc-depo',
      ...(service.location === 'onsite' ? { address: `${streets[i % streets.length]} ${4 + ((i * 7) % 60)}` } : {}),
      createdAt: new Date(start.getTime() - (2 + (i % 5)) * DAY).toISOString(),
    };
  });

  const out = inquiries.map((q) => ({ ...q }));
  const free = (svc: string) => bookings.filter((b) => b.serviceId === svc && !b.inquiryId && new Date(b.start).getTime() > now.getTime() && b.status !== 'cancelled');
  for (const q of out.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (q.status !== 'scheduled') continue;
    const slot = free(serviceFor(q))[0];
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
    if (q.company) slot.note = `${q.company} — ${slot.note}`;
    if (slot.location === 'onsite') {
      const streets = VENUE_STREETS[q.city ?? ''] ?? ['Rr. Adem Jashari'];
      slot.address = `${streets[0]} ${8 + (Number(q.id.replace(/\D/g, '')) % 40)}`;
    }
    q.scheduledAt = slot.start;
  }
  return { bookings, inquiries: out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}

/* ================================================================== */
/* Inquiries — CMS v2 fields + two extra (café-chain quote, delivery)   */
/* ================================================================== */
export function enrichInquiries(now: Date, inquiries: Inquiry[]): Inquiry[] {
  const out: Inquiry[] = inquiries.map((q, i) => ({
    ...q,
    source: q.type === 'measurement' ? 'measurement' : q.type === 'quote' ? 'quote' : 'web-form',
    assignee:
      q.status === 'new' ? undefined : q.type === 'measurement' ? (i % 2 ? 'st-valon' : 'st-ardita') : q.type === 'quote' ? (q.service === 'Printim me logo' ? 'st-blerta' : 'st-teuta') : 'st-ardita',
    tags: [q.service ? slugify(q.service) : 'pergjithshme', ...(q.type === 'quote' ? ['oferte'] : []), ...(q.company ? ['b2b'] : [])],
    ...(q.type === 'quote' && q.status === 'contacted' ? { followUpAt: iso(now, 1) } : {}),
  }));
  out.push(
    {
      id: 'inq_120',
      createdAt: iso(now, -4, -3),
      type: 'quote',
      name: 'Arbnor Avdyli',
      company: 'Kafeteritë Aroma sh.p.k.',
      phone: '+383 44 552 301',
      email: 'prokurimi.aroma@example.com',
      city: 'Prishtinë',
      service: 'Printim me logo',
      productId: 'p-gota-f95-400',
      message:
        'Kemi 4 kafiteri (3 në Prishtinë, 1 në Fushë Kosovë). Na duhet ofertë për gota F95 400 dhe 500 ml me logon tonë në 2 ngjyra — rreth 20.000 copë për 3 muaj — plus kapakë kupolë. A mund të na dërgoni edhe një provë të printimit?',
      status: 'contacted',
      seen: true,
      source: 'quote',
      assignee: 'st-teuta',
      tags: ['b2b', 'logo', 'kafiteri'],
      followUpAt: iso(now, 2),
    },
    {
      id: 'inq_121',
      createdAt: iso(now, 0, -5),
      type: 'contact',
      name: 'Gresa Kurteshi',
      phone: '+383 49 419 207',
      email: 'gresa.kurteshi@example.com',
      city: 'Pejë',
      message: 'Përshëndetje, a dërgoni në Pejë dhe sa kushton transporti për 3 kartona me gota 400 ml? A mund të paguaj me para në dorë?',
      status: 'new',
      seen: false,
      source: 'web-form',
      tags: ['dergesa'],
    },
  );
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ================================================================== */
/* Segments                                                            */
/* ================================================================== */
export const SEGMENTS: Segment[] = [
  {
    id: 'seg-vip',
    name: T('VIP kupci', 'Klientë VIP', 'VIP customers'),
    description: T('Potrošili više od 300 €.', 'Kanë shpenzuar mbi 300 €.', 'Spent more than €300.'),
    match: 'all',
    rules: [{ field: 'spent', op: 'gt', value: '300' }],
  },
  {
    id: 'seg-povratni',
    name: T('Povratni kupci', 'Klientë që kthehen', 'Returning customers'),
    description: T('3 ili više narudžbi.', '3 ose më shumë porosi.', '3 or more orders.'),
    match: 'all',
    rules: [{ field: 'orders', op: 'gt', value: '2' }],
  },
  {
    id: 'seg-mitrovice',
    name: T('Mitrovica', 'Mitrovicë', 'Mitrovica'),
    description: T('Kupci iz Mitrovice — dostava za 24h ili preuzimanje u skladištu.', 'Klientë nga Mitrovica — dërgesë 24h ose marrje në depo.', 'Customers in Mitrovica — 24h delivery or warehouse pickup.'),
    match: 'all',
    rules: [{ field: 'city', op: 'eq', value: 'Mitrovicë' }],
  },
  {
    id: 'seg-prishtine',
    name: T('Priština i okolina', 'Prishtina & rrethina', 'Prishtina area'),
    description: T('Kupci iz Prištine i Kosova Polja.', 'Klientë nga Prishtina dhe Fushë Kosova.', 'Customers in Prishtina and Fushë Kosovë.'),
    match: 'any',
    rules: [
      { field: 'city', op: 'eq', value: 'Prishtinë' },
      { field: 'city', op: 'eq', value: 'Fushë Kosovë' },
    ],
  },
  {
    id: 'seg-sr',
    name: T('Kupci na srpskom', 'Klientë në serbisht', 'Serbian-speaking customers'),
    description: T('Naručivali na srpskom — za kampanje na SR.', 'Kanë porositur në serbisht — për fushata në SR.', 'Ordered in Serbian — for SR campaigns.'),
    match: 'all',
    rules: [{ field: 'lang', op: 'eq', value: 'me' }],
  },
];

/* ================================================================== */
/* Purchasing & inventory movements                                    */
/* ================================================================== */
export function buildPurchaseOrders(now: Date): PurchaseOrder[] {
  return [
    {
      id: 'po-014',
      number: 'PO-2026-014',
      supplier: V_PET,
      location: 'loc-depo',
      status: 'partial',
      lines: [
        { productId: 'p-gota-f95-400', ordered: 200, received: 200, rejected: 0, cost: 1.38 },
        { productId: 'p-gota-f95-500', ordered: 160, received: 100, rejected: 0, cost: 1.66 },
        { productId: 'p-kapak-kupole', ordered: 120, received: 120, rejected: 0, cost: 1.08 },
        { productId: 'p-kapak-clip', ordered: 100, received: 94, rejected: 6, cost: 1.08 },
      ],
      reference: 'TR-2026-0815',
      note: '60 pako gota 500 ml vijnë me kamionin e dytë. 6 pako kapakë clip u refuzuan — karton i shtypur gjatë transportit.',
      expectedAt: iso(now, 4),
      createdAt: iso(now, -14),
    },
    {
      id: 'po-015',
      number: 'PO-2026-015',
      supplier: V_PAPER,
      location: 'loc-depo',
      status: 'sent',
      lines: [
        { productId: 'p-kuti-trekendeshe-gold', ordered: 60, received: 0, rejected: 0, cost: 2.62 },
        { productId: 'p-kuti-torte-230', ordered: 64, received: 0, rejected: 0, cost: 4.1 },
        { productId: 'p-ene-torte-kupole', ordered: 40, received: 0, rejected: 0, cost: 1.75 },
        { productId: 'p-luge-akullore-lux', ordered: 30, received: 0, rejected: 0, cost: 5.9 },
      ],
      reference: 'MK-2026/0418',
      note: 'Para sezonit të tortave të fundvitit — kutitë e tortave 230 mm janë në stok të ulët, lugët luksoze janë jashtë stokut.',
      expectedAt: iso(now, 8),
      createdAt: iso(now, -2),
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
    mv('mv-1', 'p-kuti-torte-230', -1, 'damaged', -3, 'st-valon', 'Pako e shtypur gjatë shkarkimit — u shlye'),
    mv('mv-2', 'p-gota-f95-400', -3, 'correction', -4, 'st-ardita', 'Mostra falas për 6 kafiteri (3 pako)'),
    mv('mv-3', 'p-gota-f95-400', 200, 'received', -6, 'st-valon', V_PET, 'PO-2026-014'),
    mv('mv-4', 'p-gota-f95-500', 100, 'received', -6, 'st-valon', `${V_PET} — 60 pako vijnë me kamionin e dytë`, 'PO-2026-014'),
    mv('mv-5', 'p-kapak-kupole', 120, 'received', -6, 'st-valon', V_PET, 'PO-2026-014'),
    mv('mv-6', 'p-kapak-clip', 94, 'received', -6, 'st-valon', `${V_PET} — 6 pako u refuzuan (karton i shtypur)`, 'PO-2026-014'),
    mv('mv-7', 'p-salce-1oz', -4, 'count', -9, 'st-teuta', 'Inventari mujor — diferencë në raftin B3'),
    mv('mv-8', 'p-shkop-24', 2, 'count', -9, 'st-teuta', 'Inventari mujor — u gjetën 2 pako'),
    mv('mv-9', 'p-luge-akullore-lux', -3, 'damaged', -15, 'st-valon', 'Pako të lagura nga shiu gjatë shkarkimit'),
    mv('mv-10', 'p-gote-venus', -2, 'correction', -11, 'st-elira', 'Mostra për vitrinën në depo'),
  ];
  // restocked returns
  for (const r of returns) {
    if (!r.restocked) continue;
    const rec = r.timeline.find((t) => t.status === 'received');
    for (const l of r.lines) list.push({ id: `mv-${r.id}-${l.productId}`, productId: l.productId, delta: l.qty, reason: 'return', at: rec?.at ?? r.createdAt, by: rec?.by ?? 'st-valon', note: 'Pako të pahapura — u kthyen në stok', ref: r.number });
  }
  // the most recent web orders as 'sale' movements
  let n = 20;
  for (const o of orders.slice(0, 6)) {
    for (const l of o.items) {
      if (!l.productId) continue;
      const days = (new Date(o.createdAt).getTime() - now.getTime()) / DAY;
      list.push({ id: `mv-${n++}`, productId: l.productId, delta: -l.qty, reason: 'sale', at: iso(now, days), by: 'web', ref: o.number });
    }
  }
  return list.sort((a, b) => b.at.localeCompare(a.at));
}

/* ================================================================== */
/* Draft orders, returns, quotes                                       */
/* ================================================================== */
export function buildDrafts(now: Date, products: Product[]): DraftOrder[] {
  const opts = (id: string) => {
    const p = products.find((x) => x.id === id);
    return p ? defaultOptions(p) : {};
  };
  const key = (id: string, o: Record<string, string>, inst: boolean) =>
    `${id}|${Object.keys(o)
      .sort()
      .map((k) => `${k}=${o[k]}`)
      .join('&')}|${inst ? 'i' : ''}`;
  const line = (id: string, qty: number, installation = false) => {
    const o = opts(id);
    return { key: key(id, o, installation), productId: id, qty, options: o, installation };
  };
  return [
    {
      id: 'dr-1001',
      number: 'D-1001',
      createdAt: iso(now, -1, -2),
      customer: { firstName: 'Arbër', lastName: 'Bytyqi', company: 'Kafiteria Lumi', pib: '811402375', email: 'kafiterialumi@example.com', phone: '+383 44 512 803', city: 'Mitrovicë', address: 'Rr. Mbretëresha Teutë 14' },
      items: [line('p-gota-f95-400', 40, true), line('p-kapak-kupole', 20), line('p-shkop-24', 4)],
      customLines: [{ title: 'Klishe printimi për logon (njëherë)', price: 25, qty: 1 }],
      discountCodes: [],
      delivery: 'delivery',
      payment: 'bank',
      note: 'Porosi mujore + 2 kartona gota me logo (1 ngjyrë) për sezonin e ri. Logoja u aprovua me e-mail; faturë me NUI, pagesë me transfer bankar.',
      tags: ['b2b', 'kafiteri', 'logo'],
      status: 'open',
      createdBy: 'st-teuta',
      lang: 'sq',
    },
    {
      id: 'dr-1002',
      number: 'D-1002',
      createdAt: iso(now, -3, -1),
      customer: { firstName: 'Dragan', lastName: 'Kostić', company: 'Ketering Slavlje', pib: '811067452', email: 'ketering.slavlje@example.com', phone: '+383 45 318 607', city: 'Graçanicë', address: 'Ul. Kralja Milutina 52' },
      items: [line('p-set-ps-bardhe', 10), line('p-ene-mikrovale-750', 10), line('p-kuti-dy-ndarje', 6), line('p-gota-f95-300', 20), line('p-kapak-sheshte', 10), line('p-salce-1oz', 5)],
      customLines: [{ title: 'Dërgesë me orar të caktuar (dita e eventit)', price: 10, qty: 1 }],
      discountCodes: ['MIRESEERDHE'],
      delivery: 'delivery',
      payment: 'bank',
      note: 'Dasmë me rreth 400 të ftuar të shtunën — fatura proforma u dërgua me e-mail, pritet pagesa paraprake.',
      tags: ['b2b', 'catering', 'event'],
      status: 'invoice_sent',
      createdBy: 'st-ardita',
      lang: 'me',
    },
  ];
}

/** Two returns from real generated orders; the refunded one is also recorded on its order. */
export function buildReturns(now: Date, orders: Order[]): { returns: ReturnRequest[]; orders: Order[] } {
  const age = (o: Order) => (now.getTime() - new Date(o.createdAt).getTime()) / DAY;
  const isCup = (id: string) => CUPS.includes(id);
  const cupLine = (o: Order, min: number) => o.items.find((l) => isCup(l.productId) && l.qty >= min && !l.installation);
  const old =
    orders.find((o) => o.status === 'completed' && age(o) > 20 && age(o) < 80 && cupLine(o, 20)) ??
    orders.find((o) => o.status === 'completed' && age(o) > 20 && cupLine(o, 4)) ??
    orders.find((o) => o.status === 'completed' && age(o) > 20 && o.items.length > 0);
  const recentLine = (o: Order) => o.items.find((l) => l.productId === 'p-kapak-sheshte' && l.qty >= 2) ?? o.items.find((l) => l.unit === 'pack' && l.qty >= 2 && !l.installation);
  const recent =
    orders.find((o) => o !== old && o.status === 'completed' && age(o) > 1 && age(o) < 5 && o.items.some((l) => l.productId === 'p-kapak-sheshte' && l.qty >= 2)) ??
    orders.find((o) => o !== old && (o.status === 'completed' || o.status === 'shipped') && age(o) > 1 && age(o) < 6 && recentLine(o));
  const returns: ReturnRequest[] = [];
  let out = orders;
  if (old) {
    const line = cupLine(old, 4) ?? old.items[0];
    // one damaged carton (or the whole line when it is smaller than a carton)
    const lines = [{ productId: line.productId, qty: Math.min(line.qty, 20) }];
    const amount = refundForLines(old, lines);
    const t0 = new Date(new Date(old.createdAt).getTime() + 2 * DAY);
    const at = (h: number) => new Date(t0.getTime() + h * 3600000).toISOString();
    returns.push({
      id: 'rt-1001',
      number: 'RT-1001',
      orderId: old.id,
      lines,
      reason: 'Kartoni arriti i shtypur gjatë transportit — gota të çara, klienti dërgoi foto dhe kërkon rimbursim',
      status: 'refunded',
      refundAmount: amount,
      restock: false,
      createdAt: at(0),
      timeline: [
        { at: at(0), status: 'requested', by: 'st-ardita', note: 'Lajmërim me telefon + foto në WhatsApp' },
        { at: at(3), status: 'approved', by: 'st-teuta', note: 'Dëmtim në transport — rimbursim i plotë i kartonit' },
        { at: at(26), status: 'received', by: 'st-valon', note: 'Kartoni u mor me dërgesën e radhës — i dëmtuar, nuk kthehet në stok' },
        { at: at(29), status: 'refunded', by: 'st-teuta' },
      ],
    });
    out = out.map((o) =>
      o.id === old.id
        ? {
            ...o,
            refunds: [{ id: 'rf-1001', at: at(29), amount, lineIds: [String(o.items.indexOf(line))], note: 'RT-1001', by: 'st-teuta' }],
            payment: { ...o.payment, status: 'paid', refunded: amount },
            timeline: [...o.timeline, { at: at(29), status: 'payment', note: `Rimbursim ${amount.toFixed(2)} € (RT-1001)`, by: 'st-teuta' }],
          }
        : o,
    );
  }
  if (recent) {
    const line = recentLine(recent)!;
    const qty = Math.min(line.qty, 4);
    const lines = [{ productId: line.productId, qty }];
    const delivered = recent.fulfillment?.deliveredAt ?? recent.fulfillment?.shippedAt ?? recent.createdAt;
    const at = new Date(Math.min(now.getTime() - 3600000, Math.max(now.getTime() - 20 * 3600000, new Date(delivered).getTime() + 2 * 3600000))).toISOString();
    const wrongLid = line.productId === 'p-kapak-sheshte';
    returns.push({
      id: 'rt-1002',
      number: 'RT-1002',
      orderId: recent.id,
      lines,
      reason: wrongLid
        ? `Gabim në porosi: kapak i sheshtë në vend të kupolës — ${qty} pako të pahapura në paketimin origjinal`
        : `Porositën më shumë se ç'u duhej — ${qty} pako të pahapura në paketimin origjinal, brenda 5 ditëve`,
      status: 'requested',
      refundAmount: refundForLines(recent, lines),
      restock: true,
      createdAt: at,
      timeline: [{ at, status: 'requested', by: 'web', note: 'Kërkesë me e-mail në refund@paketoje.com me numrin e porosisë' }],
    });
  }
  return { returns, orders: out };
}

export function buildQuotes(now: Date): Quote[] {
  const terms = T(
    'Cijene uključuju PDV 18 %. Za štampu logotipa avans 50 %, ostatak prije isporuke. Izrada 7–10 radnih dana od odobrenja probnog dizajna. Besplatna dostava na Kosovu za narudžbe preko 50 €.',
    'Çmimet përfshijnë TVSH 18 %. Për printimin me logo avans 50 %, pjesa tjetër para dërgesës. Prodhimi 7–10 ditë pune nga aprovimi i dizajnit provë. Dërgesë falas në Kosovë për porosi mbi 50 €.',
    'Prices include 18 % VAT. Logo print: 50 % deposit, balance before delivery. Production 7–10 working days from proof approval. Free delivery in Kosovo on orders over €50.',
  );
  return [
    {
      id: 'q-031',
      number: 'Q-2026-031',
      inquiryId: 'inq_120',
      customer: { name: 'Arbnor Avdyli', company: 'Kafeteritë Aroma sh.p.k.', email: 'prokurimi.aroma@example.com', phone: '+383 44 552 301' },
      lines: [
        { productId: 'p-gota-f95-400', title: 'Gota F95 400 ml me logo, printim 2 ngjyra — pako 50 copë', qty: 200, price: 4.05 },
        { productId: 'p-gota-f95-500', title: 'Gota F95 500 ml me logo, printim 2 ngjyra — pako 50 copë', qty: 200, price: 4.45 },
        { productId: 'p-kapak-kupole', title: 'Kapak kupolë F95 — pako 100 copë', qty: 200, price: 1.84 },
        { title: 'Klishe dhe dizajn provë për printim (njëherë)', qty: 1, price: 60 },
      ],
      validUntil: iso(now, 14),
      terms,
      version: 2,
      status: 'sent',
      createdAt: iso(now, -3),
      owner: 'st-teuta',
    },
    {
      id: 'q-032',
      number: 'Q-2026-032',
      inquiryId: 'inq_107',
      customer: { name: 'Labinot Rama', company: 'Fast Food Kroni', email: 'fastfoodkroni@example.com', phone: '+383 45 437 019' },
      lines: [
        { productId: 'p-kuti-burger-logo', title: 'Kuti kraft për burger me logo, printim 1 ngjyrë', qty: 3000, price: 0.24 },
        { productId: 'p-kuti-burger-logo', title: 'Kuti kraft për patate (M) me logo, printim 1 ngjyrë', qty: 3000, price: 0.16 },
        { title: 'Klishe printimi (njëherë)', qty: 1, price: 45 },
      ],
      validUntil: iso(now, 30),
      terms,
      version: 1,
      status: 'draft',
      createdAt: iso(now, -1),
      owner: 'st-blerta',
    },
  ];
}

/* ================================================================== */
/* Menus & content models                                              */
/* ================================================================== */
const CATEGORY_LINKS: [string, L10n][] = [
  ['cat-gota', T('Čaše', 'Gota', 'Cups')],
  ['cat-kapake', T('Poklopci', 'Kapakë', 'Lids')],
  ['cat-ene', T('Posude za hranu', 'Enë ushqimi', 'Food containers')],
  ['cat-embelsira', T('Deserti i sladoled', 'Ëmbëlsira & akullore', 'Desserts & ice cream')],
  ['cat-salca', T('Čašice za sos', 'Gota për salca', 'Sauce cups')],
  ['cat-takem', T('Pribor i setovi', 'Takëm & sete', 'Cutlery & sets')],
  ['cat-shkopinj', T('Slamke i kašičice', 'Shkopinj & lugë kafeje', 'Straws & stirrers')],
];

/** Made-to-order (custom print, quote) and "coming soon" ranges — main menu only (the mega menu groups them). */
const EXTRA_CATEGORY_LINKS: [string, L10n][] = [
  ['cat-karton', T('Papir i karton', 'Letër & karton', 'Paper & cardboard')],
  ['cat-etiketa', T('Rolne i etikete', 'Rrotulla & etiketa', 'Rolls & labels')],
  ['cat-alumini', T('Aluminijum', 'Alumin', 'Aluminium')],
  ['cat-pla', T('PLA i bio', 'PLA & bio', 'PLA & bio')],
];

export function buildMenus(): Menu[] {
  const cat = (prefix: string, extra = false) =>
    (extra ? [...CATEGORY_LINKS, ...EXTRA_CATEGORY_LINKS] : CATEGORY_LINKS).map(([id, label]) => ({ id: `mi-${prefix}${id}`, label, type: 'category' as const, target: id }));
  const url = (id: string, label: L10n, target: string, children?: Menu['items']) => ({ id, label, type: 'url' as const, target, ...(children ? { children } : {}) });
  const page = (id: string, label: L10n) => ({ id: `mi-${id}`, label, type: 'page' as const, target: id });
  return [
    {
      id: 'menu-main',
      handle: 'main',
      title: 'Menuja kryesore',
      items: [
        url('mi-products', T('Proizvodi', 'Produktet', 'Products'), '/produktet', cat('', true)),
        url('mi-business', T('Za biznis', 'Për biznese', 'For business'), '/sherbimet'),
        url('mi-projects', T('Reference', 'Referencat', 'References'), '/referencat'),
        url('mi-blog', T('Blog', 'Blog', 'Blog'), '/blog'),
        url('mi-contact', T('Kontakt', 'Kontakti', 'Contact'), '/kontakti'),
      ],
    },
    {
      id: 'menu-footer',
      handle: 'footer',
      title: 'Fundi i faqes',
      items: [
        url('mi-f-shop', T('Proizvodi', 'Produktet', 'Products'), '/produktet', cat('f-')),
        url('mi-f-business', T('Za biznis', 'Për biznese', 'For business'), '/sherbimet', [
          url('mi-f-services', T('Usluge za lokale', 'Shërbimet për lokale', 'Services for venues'), '/sherbimet'),
          page('pg-printimi', T('Štampa logotipa', 'Printim me logo', 'Logo printing')),
          page('pg-shumice', T('Veleprodaja', 'Shitje me shumicë', 'Wholesale')),
          url('mi-f-projects', T('Reference', 'Referencat', 'References'), '/referencat'),
        ]),
        url('mi-f-company', T('Paketoje', 'Paketoje', 'Paketoje'), '/rreth-nesh', [
          url('mi-f-about', T('O nama', 'Rreth nesh', 'About us'), '/rreth-nesh'),
          url('mi-f-blog', T('Blog', 'Blog', 'Blog'), '/blog'),
          url('mi-f-contact', T('Kontakt', 'Kontakti', 'Contact'), '/kontakti'),
        ]),
        url('mi-f-help', T('Pomoć', 'Ndihmë', 'Help'), '', [
          page('pg-dostava', T('Dostava', 'Dërgesa', 'Delivery')),
          page('pg-pagesa', T('Plaćanje', 'Pagesa', 'Payment')),
          page('pg-kthimet', T('Povrat i reklamacije', 'Kthimet & rimbursimi', 'Returns & refunds')),
          page('pg-kushtet', T('Uslovi korišćenja', 'Kushtet e përdorimit', 'Terms & conditions')),
          page('pg-privatesia', T('Politika privatnosti', 'Politika e privatësisë', 'Privacy policy')),
        ]),
      ],
    },
  ];
}

export function buildContentModels(projects: Project[], home: HomeSection[], locations: number): ContentModel[] {
  const faq = home.find((h) => h.type === 'faq');
  const services = home.find((h) => h.type === 'services');
  return [
    {
      id: 'cm-projekti',
      name: T('Reference', 'Referencat', 'References'),
      source: 'projects',
      fields: [
        { key: 'title', label: T('Naziv', 'Titulli', 'Title'), type: 'text' },
        { key: 'location', label: T('Tip lokala / grad', 'Lloji i lokalit / qyteti', 'Venue type / city'), type: 'text' },
        { key: 'year', label: T('Godina', 'Viti', 'Year'), type: 'number' },
        { key: 'tags', label: T('Ambalaža', 'Paketimi', 'Packaging'), type: 'choice' },
        { key: 'summary', label: T('Opis', 'Përshkrimi', 'Summary'), type: 'text' },
        { key: 'image', label: T('Fotografija', 'Fotografia', 'Photo'), type: 'image' },
        { key: 'featured', label: T('Izdvojeno', 'E veçuar', 'Featured'), type: 'boolean' },
      ],
      entries: projects.length,
    },
    {
      id: 'cm-faq',
      name: T('Česta pitanja', 'Pyetje të shpeshta', 'FAQ'),
      source: 'home.faq',
      fields: [
        { key: 'q', label: T('Pitanje', 'Pyetja', 'Question'), type: 'text' },
        { key: 'a', label: T('Odgovor', 'Përgjigjja', 'Answer'), type: 'text' },
      ],
      entries: faq && faq.type === 'faq' ? faq.data.items.length : 0,
    },
    {
      id: 'cm-usluge',
      name: T('Usluge za biznis', 'Shërbimet për biznese', 'Business services'),
      source: 'home.services',
      fields: [
        { key: 'image', label: T('Fotografija', 'Fotografia', 'Photo'), type: 'image' },
        { key: 'title', label: T('Naziv', 'Titulli', 'Title'), type: 'text' },
        { key: 'text', label: T('Opis', 'Përshkrimi', 'Description'), type: 'text' },
        { key: 'service', label: T('Termin (usluga)', 'Termini (shërbimi)', 'Booking service'), type: 'reference' },
      ],
      entries: services && services.type === 'services' ? services.data.items.length : 0,
    },
    {
      id: 'cm-lokacije',
      name: T('Lokacije', 'Lokacionet', 'Locations'),
      source: 'settings.locations',
      fields: [
        { key: 'name', label: T('Naziv', 'Emri', 'Name'), type: 'text' },
        { key: 'address', label: T('Adresa', 'Adresa', 'Address'), type: 'text' },
        { key: 'city', label: T('Grad', 'Qyteti', 'City'), type: 'text' },
        { key: 'pickup', label: T('Preuzimanje', 'Marrje në vend', 'Pickup'), type: 'boolean' },
        { key: 'map', label: T('Mapa', 'Harta', 'Map'), type: 'link' },
      ],
      entries: locations,
    },
  ];
}

/* ================================================================== */
/* Homepage history & audit log                                        */
/* ================================================================== */
export function buildHomeHistory(now: Date, home: HomeSection[]): HomeVersion[] {
  const v1 = structuredClone(home).map((s) => (s.type === 'instagram' ? { ...s, enabled: false } : s));
  const v2 = structuredClone(home)
    .filter((s) => s.type !== 'promo')
    .map((s) => (s.type === 'blog' ? { ...s, enabled: false } : s));
  return [
    { at: iso(now, -6, -4), by: 'st-elira', sections: v1 },
    { at: iso(now, -21, -2), by: 'st-blerta', sections: v2 },
  ];
}

export function buildAudit(now: Date, orders: Order[]): AuditEntry[] {
  const o = (i: number) => orders[Math.min(i, orders.length - 1)];
  const a = (id: number, hours: number, actor: string, action: AuditEntry['action'], object: AuditEntry['object'], objectId: string, detail?: string): AuditEntry => ({
    id: `au-${id}`,
    at: new Date(now.getTime() - hours * 3600000).toISOString(),
    actor,
    action,
    object,
    objectId,
    ...(detail ? { detail } : {}),
  });
  const confirmed = orders.find((x) => x.status === 'confirmed') ?? o(3);
  const shipped = orders.find((x) => x.status === 'shipped' || x.status === 'completed') ?? o(8);
  const refunded = orders.find((x) => x.refunds?.some((f) => f.id === 'rf-1001'));
  const list: AuditEntry[] = [
    a(1, 0.4, 'st-driton', 'login', 'staff', 'st-driton', 'Hyrje në CMS'),
    a(2, 1.2, 'st-ardita', 'status', 'order', confirmed.id, `${confirmed.number}: new → confirmed`),
    a(3, 3, 'st-ardita', 'assign', 'inquiry', 'inq_120', 'Arbnor Avdyli → Teuta Berisha'),
    a(4, 26, 'st-teuta', 'create', 'draft', 'dr-1001', 'D-1001 — Kafiteria Lumi'),
    a(5, 27, 'st-valon', 'fulfil', 'order', shipped.id, shipped.number),
    a(6, 30, 'st-ardita', 'create', 'booking', 'bk-103', 'Takim dizajni — e martë 10:00'),
    a(7, 47, 'st-blerta', 'create', 'offer', 'of-blackfriday', 'Black Friday −20 %'),
    a(8, 48, 'st-blerta', 'create', 'discount', 'd-blackfriday', 'BLACKFRIDAY −20%'),
    a(9, 50, 'st-blerta', 'create', 'placement', 'pl-s4', 'Hero — Black Friday −20%'),
    a(10, 70, 'st-driton', 'archive', 'product', 'p-pirun-bardhe-100', 'Pirunj plastikë të bardhë – pako 100 copë (PAK-505)'),
    a(11, 72, 'st-teuta', 'send', 'quote', 'q-031', 'Q-2026-031 v2 — Kafeteritë Aroma'),
    a(12, 73, 'st-valon', 'adjust', 'inventory', 'p-kuti-torte-230', 'PAK-306 −1 (damaged)'),
    a(13, 74, 'st-ardita', 'send', 'draft', 'dr-1002', 'D-1002 — faturë proforma'),
    a(14, 144, 'st-valon', 'receive', 'purchaseOrder', 'po-014', 'PO-2026-014: +514 pako'),
    a(15, 148, 'st-elira', 'publish', 'home', 'home', 'Ballina — blloku promo i vjeshtës'),
    a(16, 152, 'st-elira', 'update', 'page', 'pg-dostava', 'Dërgesa'),
    a(17, 200, 'st-driton', 'update', 'settings', 'settings', 'shippingZones'),
    a(18, 456, 'st-blerta', 'create', 'collection', 'col-pasticeri', 'Për pastiçeri'),
    a(19, 1100, 'st-blerta', 'create', 'discount', 'd-kafe15', 'KAFE15'),
    a(20, 1440, 'st-driton', 'publish', 'offer', 'of-pije-te-ftohta', 'Pije të ftohta — kapakë falas'),
    a(21, 1462, 'st-blerta', 'create', 'discount', 'd-gota-kapak', 'Gota F95: 4 pako → 1 pako kapakë falas'),
    a(22, 1488, 'st-blerta', 'create', 'collection', 'col-kafiteri', 'Për kafiteri & bare'),
  ];
  if (refunded?.refunds?.[0]) list.push({ id: 'au-23', at: refunded.refunds[0].at, actor: 'st-teuta', action: 'refund', object: 'return', objectId: 'rt-1001', detail: `RT-1001 — ${refunded.number}` });
  return list.sort((x, y) => y.at.localeCompare(x.at));
}
