import type { Category, Product } from '@/lib/types';

/**
 * "Përshtatet me" — packaging families that are used together (F95 cups ↔ F95 lids ↔ 8 mm straws,
 * Bodega dessert cups ↔ Bodega lids). The CMS tags (`f95`, `bodega`) are the source of truth; for
 * products without those tags the family is recognised from the slug / English name / "Fits" spec.
 */
const FAMILIES = ['f95', 'bodega'] as const;
type Family = (typeof FAMILIES)[number];

export function fitFamilies(p: Product): Family[] {
  const out = new Set<Family>();
  for (const tag of p.tags ?? []) {
    const t = tag.toLowerCase().trim() as Family;
    if (FAMILIES.includes(t)) out.add(t);
  }
  const text = `${p.slug} ${p.name.en} ${p.specs.map((s) => s.value.en).join(' ')}`.toLowerCase();
  if (text.includes('bodega')) out.add('bodega');
  // Bodega lids are named "… – F95" in the import but only fit Bodega cups
  else if (/\bf95\b/.test(text)) out.add('f95');
  // 8 mm straws fit the straw opening of the F95 dome & clip lids
  if (p.categoryId === 'cat-shkopinj' && /straw|shkop/.test(text)) out.add('f95');
  return [...out];
}

/** Products from OTHER categories that share a fit family with `p` (category order, then bestsellers). */
export function compatibleProducts(p: Product, all: Product[], categories: Category[]): Product[] {
  const fam = fitFamilies(p);
  if (!fam.length) return [];
  const order = new Map(categories.map((c) => [c.id, c.order]));
  return all
    .filter((x) => x.id !== p.id && x.categoryId !== p.categoryId && x.status === 'active' && fitFamilies(x).some((f) => fam.includes(f)))
    .sort((a, b) => (order.get(a.categoryId) ?? 99) - (order.get(b.categoryId) ?? 99) || b.sold - a.sold);
}
