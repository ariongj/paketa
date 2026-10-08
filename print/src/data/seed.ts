import type { Db, MediaItem } from '@/lib/types';
import { CATEGORIES, buildProducts } from './catalog';
import { DEFAULT_SETTINGS, PROJECTS, buildCoupons, buildHome, buildPages, buildPosts } from './content';
import { generateInquiries, generateOrders } from './demo';
import {
  ARCHIVED_PRODUCT, SEGMENTS, SERVICES, STAFF, buildAudit, buildBookings, buildCollections, buildContentModels, buildDiscounts,
  buildDrafts, buildHomeHistory, buildMenus, buildMovements, buildOffers, buildPlacements, buildPurchaseOrders, buildQuotes,
  buildReturns, countDiscountUses, enrichInquiries, enrichProducts,
} from './cms';

/** Bump to force every browser to reload fresh demo data (storage key `pw-db`). */
export const DB_VERSION = 2;

/**
 * Every bundled image (public/images, without the -sm variants), exposed in the CMS media library:
 * [path, width, height, bytes].
 */
const IMAGES: [string, number, number, number][] = [
  ['banner/kuti-produktesh.webp', 1200, 600, 39838],
  ['banner/kuti-ushqimore.webp', 1200, 600, 38524],
  ['banner/etiketa.webp', 1200, 600, 64790],
  ['banner/shrink.webp', 1200, 600, 42682],
  ['misc/production.webp', 1080, 1920, 67312],
  ['misc/team.webp', 1600, 800, 123590],
  ['og.jpg', 1200, 630, 106681],
  ['c/kuti-ushqimore.webp', 1200, 1200, 48190],
  ['c/kuti-produktesh.webp', 1200, 1200, 57874],
  ['c/etiketa.webp', 1200, 1200, 107562],
  ['c/qese-letre.webp', 1200, 1200, 63256],
  ['c/materiale-promovuese.webp', 1200, 1200, 31604],
  ['c/finishing.webp', 1200, 1200, 209478],
  ['brands/heidelberg.png', 182, 125, 4308],
  ['brands/xerox.png', 183, 125, 5583],
  ['brands/polar.png', 130, 125, 5050],
  ['brands/ricoh.png', 183, 125, 7586],
  ['brands/muller-martini.png', 190, 125, 3339],
];

/** Product photos are 1200 × 1200 WebP — bytes per file. */
const PRODUCT_BYTES: Record<string, number> = {
  'blloqe-shenimesh': 219788, 'dosje-prezantimi': 26406, 'etiketa-detergjent-2': 87580, 'etiketa-detergjent': 81422, 'etiketa-kozmetike': 51032,
  'etiketa-letra-te-lagura-2': 121896, 'etiketa-letra-te-lagura': 58328, 'etiketa-transparente': 24358, 'etiketa-ushqimore-rrotull-2': 164862,
  'etiketa-ushqimore-rrotull-3': 107562, 'etiketa-ushqimore-rrotull': 107394, 'etiketa-vaj-ulliri-2': 91844, 'etiketa-vaj-ulliri': 76692,
  'etiketa-vere': 64582, fletepalosje: 43404, 'folje-uv': 209478, 'hot-foil': 234136, kartevizita: 31604, katalog: 469378, 'kuti-caji': 87998,
  'kuti-cokollate': 84736, 'kuti-dhurate-gable': 33538, 'kuti-dhurate-mailer-2': 57874, 'kuti-dhurate-mailer': 39864, 'kuti-embelsirash-2': 48190,
  'kuti-embelsirash': 42558, 'kuti-farmaceutike': 71820, 'kuti-hot-dog': 67046, 'kuti-katrore-embelsira': 63588, 'kuti-kozmetike': 24944,
  'kuti-lodrash': 35390, 'kuti-mailer-premium': 41260, 'kuti-makarona': 32182, 'kuti-menu-familjare': 59216, 'kuti-menu-femije': 49814,
  'kuti-pice': 87850, 'kuti-sanduici': 38930, 'kuti-sushi': 54366, 'kuti-takeaway-doreze': 58954, 'kuti-torte-doreze': 47922,
  'mbajtese-donuti': 61436, 'mbajtese-gotash': 58550, 'mbajtese-patatesh': 28640, 'mostra-finishing-2': 208598, 'mostra-finishing-3': 209478,
  'mostra-finishing': 234136, 'qese-blerjesh': 63256, 'qese-kraft': 153438, 'qese-luksoze': 212614, 'qese-ngjyre-plote': 42560, 'qese-pastel': 129218,
  'qese-premium-litar': 61440, reliev: 208598, 'shrink-sleeve': 75620, 'tabaka-doreze': 43678,
};

const FOLDER: Record<string, string> = { p: 'Produktet', c: 'Kategoritë', banner: 'Banera', misc: 'Fabrika', brands: 'Partnerët' };

const ALT: Record<string, string> = {
  'misc/production': 'Operator në makinën e printimit në fabrikën PrintWorks',
  'misc/team': 'Ekipi PrintWorks',
  og: 'PrintWorks — printim inovativ, paketim i jashtëzakonshëm',
  'brands/muller-martini': 'Müller Martini',
};

function buildMedia(productImages: string[], now: Date): MediaItem[] {
  const fixed = IMAGES.map(([path, width, height, size]) => ({ url: `/images/${path}`, width, height, size }));
  const products = productImages.map((url) => ({ url, width: 1200, height: 1200, size: PRODUCT_BYTES[url.split('/').pop()!.replace(/\.webp$/, '')] }));
  const seen = new Set<string>();
  const unique = [...fixed, ...products].filter((m) => (seen.has(m.url) ? false : (seen.add(m.url), true)));
  return unique.map((m, i) => {
    const rel = m.url.replace(/^\/images\//, '');
    const seg = rel.includes('/') ? rel.split('/')[0] : '';
    const file = rel.split('/').pop()!;
    const base = rel.replace(/\.(webp|png|jpe?g)$/, '');
    const pretty = file.replace(/\.(webp|png|jpe?g)$/, '').replace(/-\d$/, '').replace(/-/g, ' ');
    return {
      id: `m_${i + 1}`,
      url: m.url,
      name: file,
      alt: ALT[base] ?? (seg === 'brands' ? pretty.replace(/^\w/, (c) => c.toUpperCase()) : pretty),
      folder: FOLDER[seg] ?? 'Marka',
      uploaded: false,
      createdAt: new Date(now.getTime() - (unique.length - i) * 3600000).toISOString(),
      width: m.width,
      height: m.height,
      ...(m.size ? { size: m.size } : {}),
    };
  });
}

export function createSeed(now = new Date()): Db {
  const catalog = enrichProducts(buildProducts(now), now);
  const settings = structuredClone(DEFAULT_SETTINGS);
  const collections = buildCollections(now);
  const home = buildHome(now);

  // Orders go through the real discount engine (with each order's date), then uses are recounted.
  const generated = generateOrders(catalog, settings, buildDiscounts(now), collections, now);
  const { returns, orders } = buildReturns(now, generated);
  const discounts = countDiscountUses(buildDiscounts(now), orders);
  // keep the settings threshold in sync with the automatic free-delivery rule
  const freeShipping = discounts.find((d) => d.kind === 'shipping' && d.method === 'auto' && d.minimum.type === 'amount');
  if (freeShipping) settings.freeShippingThreshold = freeShipping.minimum.value;

  // The replaced square pizza box: archived after it had sales (orders keep their copy of it).
  const products = catalog.map((p) => (p.id === ARCHIVED_PRODUCT ? { ...p, status: 'archived' as const, featured: false } : p));

  const { bookings, inquiries } = buildBookings(now, enrichInquiries(now, generateInquiries(now)));

  return {
    version: DB_VERSION,
    settings,
    categories: structuredClone(CATEGORIES),
    products,
    orders,
    inquiries,
    coupons: buildCoupons(now),
    pages: buildPages(now),
    posts: buildPosts(now),
    projects: structuredClone(PROJECTS),
    media: buildMedia(products.flatMap((p) => p.images), now),
    home,
    seededAt: now.toISOString(),

    collections,
    discounts,
    offers: buildOffers(now, discounts, orders),
    placements: buildPlacements(home),
    staff: structuredClone(STAFF),
    services: structuredClone(SERVICES),
    bookings,
    segments: structuredClone(SEGMENTS),
    movements: buildMovements(now, orders, returns),
    purchaseOrders: buildPurchaseOrders(now),
    drafts: buildDrafts(now, products),
    returns,
    quotes: buildQuotes(now, orders),
    menus: buildMenus(),
    contentModels: buildContentModels(PROJECTS, home, settings.locations.length),
    audit: buildAudit(now, orders),
    homeDraft: null,
    homeHistory: buildHomeHistory(now, home),
  };
}
