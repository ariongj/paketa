import type { Lang } from '@/lib/types';

/** Popular searches per storefront language — terms from the print catalogue (pages hide terms with no hits). */
export const POPULAR_SEARCHES: Record<Lang, string[]> = {
  sq: ['kuti pice', 'etiketa', 'qese letre', 'kartëvizita', 'mailer', 'shrink sleeve', 'kozmetike', 'takeaway'],
  en: ['pizza box', 'labels', 'paper bag', 'business cards', 'mailer', 'shrink sleeve', 'cosmetic', 'takeaway'],
};

/** Plural category for counted nouns — Albanian and English use the singular only for 1. */
export function pluralOne(n: number, lang: Lang) {
  void lang;
  return n === 1;
}

/** Best sellers with variety: the top seller of each category first, then the rest by sales. */
export function diverseBestsellers<P extends { id: string; categoryId: string; sold: number }>(products: P[], n: number): P[] {
  const sorted = [...products].sort((a, b) => b.sold - a.sold);
  const seen = new Set<string>();
  const firstPass = sorted.filter((p) => (seen.has(p.categoryId) ? false : (seen.add(p.categoryId), true)));
  const rest = sorted.filter((p) => !firstPass.includes(p));
  return [...firstPass, ...rest].slice(0, n);
}
