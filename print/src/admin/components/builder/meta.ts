import type { ComponentType } from 'react';
import {
  BadgePercent, BookOpen, Factory, GalleryHorizontalEnd, Handshake, HelpCircle, Images, Instagram, LayoutGrid, ListOrdered, Megaphone, Printer, Quote,
  ShieldCheck, ShoppingBag, Wrench,
} from 'lucide-react';
import type { HomeSection, HomeSectionType, L10n } from '@/lib/types';
import { HOME_ICONS, homeIcon } from '@/site/sections/icons';
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
  services: { icon: Wrench, tone: ICON_TILE },
  projects: { icon: Images, tone: ICON_TILE },
  stats: { icon: Quote, tone: ICON_TILE },
  instagram: { icon: Instagram, tone: ICON_TILE },
  faq: { icon: HelpCircle, tone: ICON_TILE },
  blog: { icon: BookOpen, tone: ICON_TILE },
  cta: { icon: Megaphone, tone: ICON_TILE },
  industries: { icon: Factory, tone: ICON_TILE },
  technology: { icon: Printer, tone: ICON_TILE },
  logos: { icon: Handshake, tone: ICON_TILE },
};

/** Icons the storefront trust bar knows how to render — the same list the storefront uses. */
export const TRUST_ICONS: { name: string; icon: IconC }[] = HOME_ICONS;

export const trustIcon = (name: string): IconC => homeIcon(name);

/** Strip *accent* markers. */
export const stripStars = (s: string) => s.replace(/\*/g, '');

/** Bullet lines of a multi-line text field. */
export const pointLines = (s: string) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

/** One-line description of a section for the list (its headline) + a count chip. */
export function sectionSummary(s: HomeSection, l: (v: L10n) => string, t: (k: BKey, v?: Record<string, string | number>) => string): { line: string; meta: string } {
  switch (s.type) {
    case 'hero':
      return {
        line: stripStars(l(s.data.slides[0]?.title ?? { sq: '', en: '' })),
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
    case 'industries':
      return { line: s.data.items.map((i) => l(i.title)).join(' · ') || stripStars(l(s.data.title)), meta: t('count_industries', { n: s.data.items.length }) };
    case 'technology':
      return { line: stripStars(l(s.data.title)), meta: t('count_tech', { n: s.data.items.length }) };
    case 'logos':
      return { line: s.data.logos.map((g) => g.name).filter(Boolean).join(' · ') || stripStars(l(s.data.title)), meta: t('count_logos', { n: s.data.logos.length }) };
    default:
      return { line: stripStars(l(s.data.title)), meta: '' };
  }
}
