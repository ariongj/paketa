import type { Db, MediaItem, Product } from '@/lib/types';
import { lt } from '@/i18n';
import { CATEGORIES, buildProducts } from './catalog';
import { DEFAULT_SETTINGS, PROJECTS, buildCoupons, buildHome, buildPages, buildPosts } from './content';
import { generateInquiries, generateOrders } from './demo';
import {
  ARCHIVED_PRODUCT, SEGMENTS, SERVICES, STAFF, buildAudit, buildBookings, buildCollections, buildContentModels, buildDiscounts,
  buildDrafts, buildHomeHistory, buildMenus, buildMovements, buildOffers, buildPlacements, buildPurchaseOrders, buildQuotes,
  buildReturns, countDiscountUses, enrichInquiries, enrichProducts,
} from './cms';

/** Bump to force every browser to reload fresh demo data. */
export const DB_VERSION = 1;

/** Every bundled lifestyle image (brand assets excluded), exposed in the CMS media library. */
const IMAGE_PATHS = [
  'hero/kraft', 'hero/smoothie', 'hero/meal', 'hero/delivery', 'hero/iced',
  'cat/gota', 'cat/kapake', 'cat/ene', 'cat/embelsira', 'cat/salca', 'cat/takem', 'cat/shkopinj', 'cat/karton', 'cat/alumini', 'cat/pla', 'cat/etiketa',
  's/printim', 's/shumice', 's/dergesa', 's/mostra', 's/konsulence', 's/magazina',
  'projects/kafiteri', 'projects/smoothie-bar', 'projects/burger', 'projects/pasticeri', 'projects/akullore', 'projects/kuti', 'projects/qese', 'projects/sushi',
  'misc/about', 'misc/restaurant', 'misc/restaurant-top', 'misc/sushi', 'misc/fries', 'misc/sauce', 'misc/bowls', 'misc/drinks', 'misc/burger',
  'misc/donuts', 'misc/icecream', 'misc/bag', 'misc/bag2', 'misc/cookies', 'misc/cups', 'misc/kraft-cups', 'misc/sleeve', 'misc/alu', 'misc/alu2',
  'misc/smoothie', 'misc/iced', 'misc/box', 'misc/noodles', 'misc/delivery', 'misc/salad', 'misc/mealprep',
];

const FOLDER: Record<string, string> = { hero: 'Hero', cat: 'Kategoritë', s: 'Shërbimet', projects: 'Referencat', misc: 'Të ndryshme', p: 'Produktet' };

function buildMedia(products: Product[], now: Date): MediaItem[] {
  // product photos get the product's (Albanian) name as alt text, "— 2", "— 3"… for extra angles
  const productAlt = new Map<string, string>();
  for (const p of products) p.images.forEach((url, k) => productAlt.set(url, k ? `${lt(p.name, 'sq')} — ${k + 1}` : lt(p.name, 'sq')));
  const all = [...IMAGE_PATHS.map((p) => `/images/${p}.webp`), ...products.flatMap((p) => p.images)];
  const unique = Array.from(new Set(all));
  return unique.map((url, i) => {
    const seg = url.split('/')[2] ?? 'misc';
    const name = url.split('/').pop()!.replace('.webp', '');
    return {
      id: `m_${i + 1}`,
      url,
      name: `${name}.webp`,
      alt: productAlt.get(url) ?? name.replace(/-\d$/, '').replace(/-/g, ' '),
      folder: FOLDER[seg] ?? 'Të ndryshme',
      uploaded: false,
      createdAt: new Date(now.getTime() - (unique.length - i) * 3600000).toISOString(),
    };
  });
}

export function createSeed(now = new Date()): Db {
  const catalog = enrichProducts(buildProducts(now));
  const settings = structuredClone(DEFAULT_SETTINGS);
  const collections = buildCollections(now);
  const home = buildHome(now);

  // Orders go through the real discount engine (with each order's date), then uses are recounted.
  const generated = generateOrders(catalog, settings, buildDiscounts(now), collections, now);
  const { returns, orders } = buildReturns(now, generated);
  const discounts = countDiscountUses(buildDiscounts(now), orders);

  // A discontinued line: archived after it had sales (orders keep their copy of it).
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
    media: buildMedia(products, now),
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
    quotes: buildQuotes(now),
    menus: buildMenus(),
    contentModels: buildContentModels(PROJECTS, home, settings.locations.length),
    audit: buildAudit(now, orders),
    homeDraft: null,
    homeHistory: buildHomeHistory(now, home),
  };
}
