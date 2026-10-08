import { useMemo } from 'react';
import type { Category, Collection, HomeSection, HomeSectionType, ShippingZone } from '@/lib/types';
import { useDb } from '@/store/db';
import { activeShippingRule } from '@/lib/pricing';

export type SectionData<T extends HomeSectionType> = Extract<HomeSection, { type: T }>['data'];

/**
 * Content of a homepage section, looked up by type. The company pages reuse
 * the CMS-managed homepage blocks (faq…) so the client edits that content in
 * one place. Visibility on the homepage does not matter here.
 */
export function useHomeData<T extends HomeSectionType>(type: T): SectionData<T> | undefined {
  const home = useDb((s) => s.home);
  return useMemo(() => home.find((h) => h.type === type)?.data as SectionData<T> | undefined, [home, type]);
}

/** Where "free samples" links point: the homepage form when it is shown, otherwise the contact page samples tab. */
export function useMeasureHref() {
  const home = useDb((s) => s.home);
  return useMemo(() => (home.some((h) => h.type === 'cta' && h.enabled) ? '/#mjerenje' : '/kontakti?lloji=mostra'), [home]);
}

/** Contact-page links that open the lead form on the right tab. */
export const SAMPLES_HREF = '/kontakti?lloji=mostra';
export const QUOTE_HREF = '/kontakti?lloji=oferte';
export const LOGO_QUOTE_HREF = '/kontakti?lloji=oferte&logo=1';

/** Smooth-scroll to an in-page anchor without touching the URL. */
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const waHref = (phone?: string) => {
  const d = (phone ?? '').replace(/\D/g, '');
  return d ? `https://wa.me/${d}` : '';
};

/** "1" → 1, "1–3" → 3 (upper bound of a zone's delivery days). */
const maxDays = (days: string) => Math.max(...(days.match(/\d+/g) ?? ['0']).map(Number));

/**
 * Real store facts for the company pages — nothing invented: live product and category counts,
 * delivery promise and fees from the shipping zones, the free-delivery threshold from the live
 * automatic shipping discount (fallback: settings).
 */
export function useStoreFacts() {
  const products = useDb((s) => s.products);
  const categories = useDb((s) => s.categories);
  const settings = useDb((s) => s.settings);
  const discounts = useDb((s) => s.discounts);
  return useMemo(() => {
    const live = products.filter((p) => p.status === 'active');
    const zones: ShippingZone[] = settings.shippingZones;
    const rule = activeShippingRule(discounts);
    const freeFrom = rule && rule.minimum.type === 'amount' ? rule.minimum.value : settings.freeShippingThreshold;
    const fees = zones.map((z) => z.fee);
    return {
      products: live.filter((p) => !p.quoteOnly).length,
      categories: categories.filter((c) => !c.soon).length,
      soonCategories: categories.filter((c) => c.soon),
      zones,
      cities: zones.reduce((n, z) => n + z.cities.length, 0),
      fastest: zones[0],
      maxDays: zones.length ? Math.max(...zones.map((z) => maxDays(z.days))) : 0,
      minFee: fees.length ? Math.min(...fees) : 0,
      maxFee: fees.length ? Math.max(...fees) : 0,
      freeFrom,
      pickup: settings.locations.find((x) => x.pickup),
      logoProducts: live.filter((p) => p.installation?.available && !p.quoteOnly),
      quoteProducts: live.filter((p) => p.quoteOnly),
    };
  }, [products, categories, settings, discounts]);
}

/* ------------------------------------------------------------------ */
/* Industries — venue types linked to a matching collection (if one is  */
/* published) or to the closest shop category                           */
/* ------------------------------------------------------------------ */
export type IndustryId = 'cafe' | 'restaurant' | 'fastfood' | 'pastry' | 'sushi' | 'catering';

export const INDUSTRIES: { id: IndustryId; image: string; keys: string[]; category: string }[] = [
  { id: 'cafe', image: '/images/misc/iced.webp', keys: ['kafe', 'kafiteri', 'cafe', 'pije'], category: 'cat-gota' },
  { id: 'restaurant', image: '/images/misc/restaurant.webp', keys: ['restorant', 'restaurant', 'take-away', 'dergesa', 'delivery'], category: 'cat-ene' },
  { id: 'fastfood', image: '/images/misc/fries.webp', keys: ['fast-food', 'fastfood', 'burger'], category: 'cat-salca' },
  { id: 'pastry', image: '/images/misc/donuts.webp', keys: ['pasticeri', 'embelsira', 'akullore', 'dessert'], category: 'cat-embelsira' },
  { id: 'sushi', image: '/images/misc/sushi.webp', keys: ['sushi'], category: 'cat-ene' },
  { id: 'catering', image: '/images/misc/mealprep.webp', keys: ['catering', 'evente', 'event'], category: 'cat-takem' },
];

export function useIndustryLinks() {
  const collections = useDb((s) => s.collections);
  const categories = useDb((s) => s.categories);
  return useMemo(() => {
    const pub = collections.filter((c) => c.published);
    return INDUSTRIES.map((ind) => {
      const col: Collection | undefined = pub.find((c) => ind.keys.some((k) => c.slug.includes(k)));
      const cat: Category | undefined = categories.find((c) => c.id === ind.category);
      return { ...ind, to: col ? `/koleksioni/${col.slug}` : cat ? `/produktet/${cat.slug}` : '/produktet', collection: col, category: cat };
    });
  }, [collections, categories]);
}
