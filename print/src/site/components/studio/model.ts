import type { Product } from '@/lib/types';
import { defineDict } from '@/i18n';
import { defaultOptions } from '@/lib/pricing';

/** Storefront route of the 3D bag studio. */
export const STUDIO_PATH = '/studio-3d';
/** Products the studio can design: everything in the paper-bag category. */
export const BAG_CATEGORY = 'cat-qese-letre';

/** What the studio page (studio.html) reports through postMessage — see getConfig() in src/studio/studio.js. */
export interface StudioConfig {
  paper: 'art' | 'kraft-brown' | 'kraft-white';
  size: 'S' | 'M' | 'L' | 'XL';
  width: number;
  depth: number;
  height: number;
  /** Paper / flood colour (hex) */
  colour: string;
  /** Lamination — art paper only */
  finish: 'matte' | 'gloss' | 'softtouch' | null;
  handle: 'rope' | 'twisted' | 'flat' | 'ribbon';
  handleColour: string;
  /** All-over print: none, chevron, dots, stripes, top or bottom colour block */
  motif: string;
  /** Catalogue product id the chosen example stands for, if any */
  product: string | null;
  /** The design uses hot-foil ink */
  foil: boolean;
  items: { front: number; back: number };
  /** Plain-text description of the design for prepress */
  spec: string;
}

/** Functions the studio page exposes on its window (same origin). */
export interface StudioApi {
  getConfig: () => StudioConfig;
  /** Square JPEG data URL of the bag as designed */
  snapshot: (size?: number) => string;
  setLang: (lang: 'sq' | 'en') => void;
  /** Show one of the studio's examples by id */
  loadSample: (id: string) => void;
  /** Pause / resume drawing (the homepage pauses the bag while it is off screen) */
  setActive: (on: boolean) => void;
}

export const studioApi = (frame: HTMLIFrameElement | null): StudioApi | undefined =>
  (frame?.contentWindow as (Window & { pwStudio?: StudioApi }) | null | undefined)?.pwStudio;

export const isBag = (p: Product) => p.categoryId === BAG_CATEGORY && !p.quoteOnly && p.status === 'active';

const has = (p: Product, optionId: string, valueId: string) => p.options.some((o) => o.id === optionId && o.values.some((v) => v.id === valueId));
const hasOption = (p: Product, optionId: string) => p.options.some((o) => o.id === optionId);

/**
 * The catalogue product a studio design is ordered as, with its options set to match the design.
 * Kraft designs go to the kraft bag, the XL size to the large shopping bag (the one bag without a size option)
 * and everything else to the premium rope-handle bag. Products come from the CMS, so the match is made on what
 * each product actually offers; `null` means no active product fits and the design goes to a quote.
 */
export function matchProduct(cfg: StudioConfig, products: Product[]): { product: Product; options: Record<string, string> } | null {
  const size = cfg.size.toLowerCase();
  const kraft = cfg.paper !== 'art';
  const preferred = kraft ? 'p-qese-kraft' : cfg.size === 'XL' ? 'p-qese-blerjesh' : 'p-qese-premium';
  let best: { product: Product; score: number } | null = null;
  for (const p of products) {
    if (!isBag(p)) continue;
    // paper and size must fit; handle and finish only rank the candidates
    if (kraft ? !has(p, 'paper', cfg.paper) : hasOption(p, 'paper') && !has(p, 'paper', 'art')) continue;
    if (cfg.size === 'XL' ? hasOption(p, 'size') : !has(p, 'size', size)) continue;
    // an example taken from the catalogue is ordered as that product for as long as it still fits
    let score = p.id === cfg.product ? 6 : p.id === preferred ? 3 : 0;
    if (has(p, 'handle', cfg.handle)) score += 2;
    if (cfg.finish && has(p, 'finish', cfg.finish)) score += 1;
    if (cfg.foil && has(p, 'finish', 'foil')) score += 1;
    if (!best || score > best.score) best = { product: p, score };
  }
  if (!best) return null;
  const product = best.product;
  const options = defaultOptions(product);
  const set = (id: string, v: string) => {
    if (has(product, id, v)) options[id] = v;
  };
  set('size', size);
  set('paper', cfg.paper);
  set('handle', cfg.handle);
  if (cfg.finish) {
    set('finish', cfg.finish);
    // the catalogue sells foil as "matte + gold foil"; a gloss bag keeps its gloss and the foil goes in the prepress note
    if (cfg.foil && cfg.finish !== 'gloss') set('finish', 'foil');
  }
  return { product, options };
}

/** Link that opens the studio on this bag with the options chosen on its product page. */
export function studioHref(p: Product, options: Record<string, string>): string {
  const q = new URLSearchParams();
  q.set('paper', options.paper ?? 'art');
  // the large shopping bag has one fixed size, which the studio calls XL
  q.set('size', options.size ? options.size.toUpperCase() : hasOption(p, 'size') ? 'M' : 'XL');
  if (options.handle) q.set('handle', options.handle);
  if (options.finish && ['matte', 'gloss', 'softtouch'].includes(options.finish)) q.set('finish', options.finish);
  return `${STUDIO_PATH}?${q.toString()}`;
}

export const SD = defineDict({
  sq: {
    nav: 'Studio 3D',
    new: 'E re',
    title: 'Dizajnoni qesen tuaj në 3D',
    sub: 'Zgjidhni letrën, madhësinë dhe dorezën, shtoni logon, tekstin ose një kod QR në të dyja anët dhe shiheni qesen ashtu siç do të dalë nga shtypi.',
    loading: 'Po hapet studioja 3D…',
    frameTitle: 'Studio 3D — dizajnoni qesen',
    orderedAs: 'Porositet si',
    qty: 'Sasia',
    perPiece: '/ copë',
    pieces: 'copë',
    total: 'Gjithsej',
    add: 'Shto në shportë',
    quote: 'Kërko ofertë',
    added: 'Dizajni u shtua në shportë',
    viewCart: 'Shiko shportën',
    quoteOnly: 'Ky kombinim bëhet me ofertë. Na dërgoni kërkesën dhe ju përgjigjemi brenda 24 orësh.',
    proofNote: 'Dizajni ruhet me porosinë. Para shtypit ju dërgojmë provën për aprovim brenda 24 orësh.',
    notReady: 'Studioja ende po hapet — provoni përsëri pas pak.',
    fileName: 'dizajn-3d-qese',
    step1: 'Zgjidhni qesen',
    step1Text: 'Kraft ose art letër, katër madhësi dhe katër lloje dorezash — litar, letër e përdredhur, letër e sheshtë ose shirit saten.',
    step2: 'Shtoni dizajnin',
    step2Text: 'Logo, tekst dhe kod QR në të dyja anët, në çdo ngjyrë — edhe me folje ari ose argjendi.',
    step3: 'Porositni',
    step3Text: 'Çmimi llogaritet menjëherë sipas sasisë. Dizajni shkon te prepress-i dhe prova ju vjen brenda 24 orësh.',
    showTitle: 'Qesja juaj në 3D, para se të shtypet',
    showText: 'Zgjidhni letrën, ngjyrën dhe dorezën, vendosni logon, tekstin ose kodin QR dhe rrotullojeni qesen nga çdo anë. Çmimi del menjëherë dhe dizajni shkon drejt te prepress-i.',
    showB1: '3 lloje letre, 4 madhësi, 4 doreza dhe çdo ngjyrë',
    showB2: 'Logo, tekst, kod QR dhe folje ari në të dyja anët',
    showB3: 'Çmim i menjëhershëm dhe provë brenda 24 orësh',
    showSecond: 'Shiko qeset e letrës',
    showLive: 'Model 3D — tërhiqeni për ta rrotulluar',
    showDesign: 'Dizajno këtë qese',
    showPick: 'Shembuj të gatshëm',
    bandEyebrow: 'E re · Studio 3D',
    bandTitle: 'Shiheni qesen tuaj para se ta porosisni',
    bandText: 'Dizajnoni qesen në 3D: letra, madhësia, doreza, logoja, teksti dhe kodi QR — rrotullojeni dhe shiheni nga çdo anë, pastaj porositeni me një klikim.',
    bandCta: 'Hape Studion 3D',
    bandAlt: 'Tri qese letre të dizajnuara në Studion 3D',
    pdpTitle: 'Shiheni këtë qese në 3D',
    pdpText: 'Vendosni logon tuaj, rrotullojeni qesen dhe porositeni ashtu siç e shihni.',
    pdpCta: 'Hape Studion 3D',
  },
  en: {
    nav: '3D Studio',
    new: 'New',
    title: 'Design your bag in 3D',
    sub: 'Pick the paper, size and handle, add your logo, text or a QR code on both sides, and see the bag as it will come off the press.',
    loading: 'Opening the 3D studio…',
    frameTitle: '3D Studio — design your bag',
    orderedAs: 'Ordered as',
    qty: 'Quantity',
    perPiece: '/ pc',
    pieces: 'pcs',
    total: 'Total',
    add: 'Add to cart',
    quote: 'Request a quote',
    added: 'Your design is in the cart',
    viewCart: 'View cart',
    quoteOnly: 'This combination is made to quote. Send us the request and we reply within 24 hours.',
    proofNote: 'Your design is saved with the order. Before printing we send you a proof to approve within 24 hours.',
    notReady: 'The studio is still opening — try again in a moment.',
    fileName: '3d-bag-design',
    step1: 'Choose the bag',
    step1Text: 'Kraft or art paper, four sizes and four handles — rope, twisted paper, flat paper or satin ribbon.',
    step2: 'Add your design',
    step2Text: 'Logo, text and a QR code on both sides, in any colour — gold or silver foil included.',
    step3: 'Order',
    step3Text: 'The price follows the quantity straight away. Your design goes to prepress and the proof reaches you within 24 hours.',
    showTitle: 'Your bag in 3D, before it is printed',
    showText: 'Pick the paper, colour and handle, place your logo, text or QR code and turn the bag to see every side. The price is there at once and the design goes straight to prepress.',
    showB1: '3 papers, 4 sizes, 4 handles and any colour',
    showB2: 'Logo, text, QR code and gold foil on both sides',
    showB3: 'Instant price and a proof within 24 hours',
    showSecond: 'See the paper bags',
    showLive: '3D model — drag to turn it',
    showDesign: 'Design this bag',
    showPick: 'Ready-made examples',
    bandEyebrow: 'New · 3D Studio',
    bandTitle: 'See your bag before you order it',
    bandText: 'Design the bag in 3D: paper, size, handle, logo, text and QR code — turn it round, see every side, then order it in one click.',
    bandCta: 'Open the 3D Studio',
    bandAlt: 'Three paper bags designed in the 3D Studio',
    pdpTitle: 'See this bag in 3D',
    pdpText: 'Place your logo, turn the bag round and order it exactly as you see it.',
    pdpCta: 'Open the 3D Studio',
  },
});
