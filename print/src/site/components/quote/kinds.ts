import type { Product } from '@/lib/types';

/** RFQ product types (Inquiry.specs.product). */
export type RfqKind = 'box' | 'food' | 'label' | 'sleeve' | 'bag' | 'print' | 'other';
export const RFQ_KINDS: RfqKind[] = ['box', 'food', 'label', 'sleeve', 'bag', 'print', 'other'];

const BY_CATEGORY: Record<string, RfqKind> = {
  'cat-kuti-produktesh': 'box',
  'cat-kuti-ushqimore': 'food',
  'cat-etiketa': 'label',
  'cat-qese-letre': 'bag',
  'cat-materiale-promovuese': 'print',
  'cat-finishing': 'other',
};

/** Best RFQ type for a catalogue product (shrink sleeves live in the labels category). */
export function kindOf(p: Pick<Product, 'id' | 'slug' | 'categoryId'>): RfqKind {
  if (/shrink|sleeve/.test(p.slug) || /shrink/.test(p.id)) return 'sleeve';
  return BY_CATEGORY[p.categoryId] ?? 'other';
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const phoneOk = (v: string) => v.replace(/\D/g, '').length >= 8;
