import type { Category, Lang, Product } from './types';

const FOLD: Record<string, string> = { č: 'c', ć: 'c', š: 's', ž: 'z', đ: 'dj', ë: 'e', ç: 'c' };

/** Lower-case and strip diacritics so "kašika", "kasika" and "KAŠIKA" (or "gotë" / "gote") all match. */
export function fold(s: string) {
  return s
    .toLowerCase()
    .replace(/[čćšžđëç]/g, (c) => FOLD[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Synonym groups (folded word stems) across Albanian, English and Serbian — a query word that starts with
 * any stem of a group also matches products containing a word that starts with any other stem of it.
 * "kapakë" → lid / poklopac, "slamka" → shkop / straw, "posuda" → enë / kuti / container…
 */
const SYNONYMS: string[][] = [
  ['gote', 'gota', 'gotat', 'cup', 'casa', 'case', 'casic'],
  ['kapak', 'lid', 'poklop'],
  ['shkop', 'pipez', 'straw', 'slamk'],
  ['luge', 'spoon', 'kasik', 'kasic', 'stirrer'],
  ['pirun', 'fork', 'viljusk'],
  ['thik', 'knife', 'knive', 'noz'],
  ['ene', 'enet', 'kuti', 'container', 'posud', 'kutij', 'box', 'tray'],
  ['salc', 'sauce', 'sos', 'dip', 'umak'],
  ['embelsir', 'dessert', 'desert', 'poslast', 'tiramisu', 'mousse', 'mus'],
  ['akullor', 'sladoled', 'gelato', 'ice'],
  ['sushi', 'susi'],
  ['tort', 'cake', 'kolac'],
  ['takem', 'cutlery', 'pribor', 'set'],
  ['fasolet', 'napkin', 'salvet'],
  ['mikroval', 'microwave', 'mikrotalas'],
  ['sallat', 'salad', 'salat'],
  ['kafe', 'kafa', 'kafu', 'coffee', 'espresso'],
  ['logo', 'print', 'stamp', 'brand'],
  ['leter', 'paper', 'papir'],
  ['karton', 'kraft', 'cardboard'],
  ['etiket', 'sticker', 'label', 'naljepn', 'ngjites'],
  ['burger', 'hamburger'],
  ['patat', 'fries', 'pomfrit'],
  ['alumin', 'foil', 'folij'],
  ['kupol', 'dome', 'kupolast'],
  ['frappe', 'smoothie', 'milkshake', 'shake'],
];

/** Alternative stems for one folded query word (empty when it belongs to no group). */
function synonymsOf(term: string): string[] {
  const out = new Set<string>();
  for (const g of SYNONYMS) {
    // "kapakë" starts with "kapak"; "pos" (≥ 3 letters) is the start of "posud"
    if (g.some((s) => term.startsWith(s) || (term.length >= 3 && s.startsWith(term)))) g.forEach((s) => out.add(s));
  }
  out.delete(term);
  return [...out];
}

const words = (s: string) => s.split(/[^a-z0-9]+/).filter(Boolean);
const startsAny = (ws: string[], stems: string[]) => stems.some((st) => ws.some((w) => w.startsWith(st)));

export function searchProducts(products: Product[], categories: Category[], query: string, lang: Lang): Product[] {
  const q = fold(query.trim());
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const alts = terms.map(synonymsOf);
  const scored: { p: Product; score: number }[] = [];
  for (const p of products) {
    const cat = categories.find((c) => c.id === p.categoryId);
    const name = fold(`${p.name[lang]} ${p.name.sq} ${p.name.en} ${p.name.me}`);
    const hay = fold(
      `${name} ${p.sku} ${p.slug} ${(p.tags ?? []).join(' ')} ${cat ? `${cat.name.sq} ${cat.name.en} ${cat.name.me}` : ''}`,
    );
    const nameWords = words(name);
    const hayWords = words(hay);
    let score = 0;
    let all = true;
    terms.forEach((term, i) => {
      if (name.includes(term)) score += name.startsWith(term) ? 6 : 4;
      else if (hay.includes(term)) score += 1.5;
      else if (alts[i].length && startsAny(nameWords, alts[i])) score += 3;
      else if (alts[i].length && startsAny(hayWords, alts[i])) score += 1.2;
      else all = false;
    });
    if (all && score > 0) scored.push({ p, score: score + Math.log10(p.sold + 10) * 0.3 });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.p);
}
