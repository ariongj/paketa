import type { ComponentType } from 'react';
import {
  Award, BadgeCheck, BadgePercent, BookOpen, Boxes, Clock, Coffee, CupSoda, Gift, HandCoins, Handshake, HelpCircle, Images, Instagram, LayoutGrid, Leaf,
  ListOrdered, MapPin, Package, PackageOpen, Percent, Phone, Printer, Quote, Recycle, ShieldCheck, Sparkles, Star, Store, Timer, Truck, Utensils,
  Warehouse, Zap, GalleryHorizontalEnd, ShoppingBag,
} from 'lucide-react';
import type { HomeSection, HomeSectionType, L10n } from '@/lib/types';
import type { BKey } from './i18n';

type IconC = ComponentType<{ className?: string }>;

/** Neutral icon tile (CMS v2: black / grey / white, no decorative colour). */
export const ICON_TILE = 'bg-[#F4F4F4] text-ink ring-black/[0.06]';

/** Visual identity of each homepage section type in the builder. */
export const SECTION_META: Record<HomeSectionType, { icon: IconC; tone: string }> = {
  hero: { icon: GalleryHorizontalEnd, tone: ICON_TILE },
  trust: { icon: ShieldCheck, tone: ICON_TILE },
  categories: { icon: LayoutGrid, tone: ICON_TILE },
  featured: { icon: ShoppingBag, tone: ICON_TILE },
  promo: { icon: BadgePercent, tone: ICON_TILE },
  process: { icon: ListOrdered, tone: ICON_TILE },
  services: { icon: Handshake, tone: ICON_TILE },
  projects: { icon: Images, tone: ICON_TILE },
  stats: { icon: Quote, tone: ICON_TILE },
  instagram: { icon: Instagram, tone: ICON_TILE },
  faq: { icon: HelpCircle, tone: ICON_TILE },
  blog: { icon: BookOpen, tone: ICON_TILE },
  cta: { icon: PackageOpen, tone: ICON_TILE },
};

/** Packaging-shop icons the storefront trust bar knows how to render (a subset of site/sections/HomeSections ICONS). */
export const TRUST_ICONS: { name: string; icon: IconC }[] = [
  { name: 'Truck', icon: Truck },
  { name: 'Package', icon: Package },
  { name: 'PackageOpen', icon: PackageOpen },
  { name: 'Boxes', icon: Boxes },
  { name: 'Printer', icon: Printer },
  { name: 'Percent', icon: Percent },
  { name: 'BadgePercent', icon: BadgePercent },
  { name: 'BadgeCheck', icon: BadgeCheck },
  { name: 'Award', icon: Award },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'Clock', icon: Clock },
  { name: 'Timer', icon: Timer },
  { name: 'Leaf', icon: Leaf },
  { name: 'Recycle', icon: Recycle },
  { name: 'Coffee', icon: Coffee },
  { name: 'CupSoda', icon: CupSoda },
  { name: 'Utensils', icon: Utensils },
  { name: 'Store', icon: Store },
  { name: 'Warehouse', icon: Warehouse },
  { name: 'Gift', icon: Gift },
  { name: 'HandCoins', icon: HandCoins },
  { name: 'MapPin', icon: MapPin },
  { name: 'Phone', icon: Phone },
  { name: 'Star', icon: Star },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Zap', icon: Zap },
];

export const trustIcon = (name: string): IconC => TRUST_ICONS.find((i) => i.name === name)?.icon ?? Sparkles;

/** Strip *accent* markers. */
export const stripStars = (s: string) => s.replace(/\*/g, '');

/** One-line description of a section for the list (its headline) + a count chip. */
export function sectionSummary(s: HomeSection, l: (v: L10n) => string, t: (k: BKey, v?: Record<string, string | number>) => string): { line: string; meta: string } {
  switch (s.type) {
    case 'hero':
      return {
        line: stripStars(l(s.data.slides[0]?.title ?? { me: '', sq: '', en: '' })),
        meta: t('count_slides', { n: s.data.slides.length }),
      };
    case 'trust':
      return { line: s.data.items.map((i) => l(i.title)).join(' · '), meta: t('count_items', { n: s.data.items.length }) };
    case 'featured':
      return {
        line: stripStars(l(s.data.title)),
        meta: s.data.mode === 'manual' ? `${t('mode_manual')} · ${t('count_products', { n: s.data.productIds.length })}` : t(`mode_${s.data.mode}`),
      };
    case 'process':
      return { line: stripStars(l(s.data.title)), meta: t('count_steps', { n: s.data.steps.length }) };
    case 'services':
      return { line: stripStars(l(s.data.title)), meta: t('count_services', { n: s.data.items.length }) };
    case 'stats':
      return { line: `„${l(s.data.quote)}“`, meta: t('count_figures', { n: s.data.items.length }) };
    case 'faq':
      return { line: stripStars(l(s.data.title)), meta: t('count_questions', { n: s.data.items.length }) };
    case 'instagram':
      return { line: stripStars(l(s.data.title)), meta: t('count_photos', { n: s.data.images.length }) };
    case 'promo':
      return { line: stripStars(l(s.data.title)), meta: s.data.code ? s.data.code : '' };
    default:
      return { line: stripStars(l(s.data.title)), meta: '' };
  }
}
