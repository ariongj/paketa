// Realistic B2B demo activity for PrintWorks — orders and inquiries, so the CMS looks alive.
// Deterministic for a given seed and always relative to "now". Every order goes through the real
// pricing + discount engine with its own date (net catalogue prices, VAT 18% added on top).
import type {
  ArtworkRef, CartItem, Collection, Customer, Discount, Inquiry, Lang, Order, OrderEvent, OrderLine, OrderProof, OrderStatus,
  PaymentMethod, Product, RfqSpecs, Settings,
} from '@/lib/types';
import { defaultOptions, minQty, priceCart, unitPrice, zoneForCity } from '@/lib/pricing';
import { collectionIdsFor } from '@/lib/collections';
import { lt } from '@/i18n';
import { pick, rng, slugify, weighted } from '@/lib/utils';

const HOUR = 3600000;
const DAY = 24 * HOUR;

/* ================================================================== */
/* Clients — fictional businesses from Kosovo and the region           */
/* ================================================================== */
export type Sector =
  | 'horeca' | 'pasticeri' | 'kozmetike' | 'farmaci' | 'pastrim' | 'pije' | 'ushqim'
  | 'retail' | 'e-commerce' | 'agjenci' | 'arsim' | 'evente' | 'sherbime';

export interface Client {
  /** Short slug — also used in artwork file names */
  id: string;
  company: string;
  first: string;
  last: string;
  city: string;
  street: string;
  sector: Sector;
  /** 0 = short runs … 1 = long runs */
  scale: number;
  /** Relative order frequency */
  weight: number;
  /** Products the client usually orders */
  buys: string[];
  /** No business number on file */
  noNui?: boolean;
  /** Customer PO pattern — '#' becomes a digit */
  po?: string;
  lang?: Lang;
  /** Became a client N days ago — the first order often uses PRINT10 */
  since?: number;
  /** Prospect flow: sample kit N days ago, first print order M days ago with MOSTRA19 (null = not yet) */
  kit?: [number, number | null];
}

export const CLIENTS: Client[] = [
  /* ---- HoReCa ---- */
  { id: 'forno-rosso', company: 'Pizzeria Forno Rosso', first: 'Arbër', last: 'Krasniqi', city: 'Prishtinë', street: 'Rr. Agim Ramadani 41', sector: 'horeca', scale: 0.7, weight: 4, buys: ['p-kuti-pice', 'p-mbajtese-patatesh', 'p-qese-kraft', 'p-fletepalosje'] },
  { id: 'burger-lab', company: 'Burger Lab', first: 'Driton', last: 'Berisha', city: 'Prizren', street: 'Rr. Remzi Ademaj 12', sector: 'horeca', scale: 0.55, weight: 3, buys: ['p-kuti-takeaway', 'p-mbajtese-patatesh', 'p-mbajtese-gotash', 'p-kuti-menu-femije'] },
  { id: 'kafe-ritmo', company: 'Kafe Ritmo', first: 'Fjolla', last: 'Haliti', city: 'Prishtinë', street: 'Rr. Fehmi Agani 18', sector: 'horeca', scale: 0.35, weight: 2.4, buys: ['p-mbajtese-gotash', 'p-kuti-sanduici', 'p-qese-kraft', 'p-kartevizita'], noNui: true },
  { id: 'sushi-kaze', company: 'Sushi Kaze', first: 'Ilir', last: 'Shala', city: 'Prishtinë', street: 'Bulevardi Bill Clinton 7', sector: 'horeca', scale: 0.3, weight: 1.5, buys: ['p-kuti-sushi', 'p-qese-kraft', 'p-qese-ngjyre'] },
  { id: 'street-grill', company: 'Street Grill 38', first: 'Labinot', last: 'Ahmeti', city: 'Gjilan', street: 'Rr. Skënderbeu 38', sector: 'horeca', scale: 0.45, weight: 2, buys: ['p-tabaka-doreze', 'p-kuti-hot-dog', 'p-kuti-menu-familjare', 'p-mbajtese-patatesh'] },
  { id: 'te-ura', company: 'Restorant Te Ura', first: 'Agron', last: 'Bytyqi', city: 'Mitrovicë', street: 'Rr. Mbretëresha Teutë 4', sector: 'horeca', scale: 0.35, weight: 1.2, buys: ['p-kuti-menu-familjare', 'p-kuti-takeaway', 'p-qese-kraft'], since: 60 },
  { id: 'lumi-fast', company: 'Fast Food Lumi', first: 'Shpend', last: 'Hyseni', city: 'Podujevë', street: 'Rr. Zahir Pajaziti 22', sector: 'horeca', scale: 0.3, weight: 1.2, buys: ['p-kuti-menu-femije', 'p-mbajtese-patatesh', 'p-kuti-hot-dog'], noNui: true },
  { id: 'pizza-bella', company: 'Pizza Bella Tirana', first: 'Erion', last: 'Dervishi', city: 'Tiranë', street: 'Rr. Myslym Shyri 54', sector: 'horeca', scale: 0.6, weight: 1.5, buys: ['p-kuti-pice', 'p-mbajtese-patatesh'] },
  { id: 'kafe-ora', company: 'Kafe Ora', first: 'Agim', last: 'Memeti', city: 'Shkup', street: 'Bulevardi Ilinden 102', sector: 'horeca', scale: 0.3, weight: 1, buys: ['p-mbajtese-gotash', 'p-kuti-sanduici', 'p-qese-kraft'], since: 35 },
  { id: 'vila-mira', company: 'Hotel Vila Mira', first: 'Burim', last: 'Lushaj', city: 'Pejë', street: 'Rr. Lidhja e Pejës 3', sector: 'horeca', scale: 0.3, weight: 0.8, buys: ['p-kartevizita', 'p-fletepalosje', 'p-qese-ngjyre'] },
  /* ---- Bakeries & pastry ---- */
  { id: 'donut-corner', company: 'Donut Corner', first: 'Rina', last: 'Gërguri', city: 'Prishtinë', street: 'Rr. Rexhep Luci 9', sector: 'pasticeri', scale: 0.4, weight: 1.5, buys: ['p-mbajtese-donuti', 'p-mbajtese-gotash', 'p-kuti-embelsirash'], since: 50 },
  { id: 'buka-e-mire', company: 'Furra Buka e Mirë', first: 'Valbona', last: 'Hoxha', city: 'Ferizaj', street: 'Rr. Dëshmorët e Kombit 61', sector: 'pasticeri', scale: 0.55, weight: 2.5, buys: ['p-kuti-embelsirash', 'p-mbajtese-donuti', 'p-kuti-katrore', 'p-qese-kraft'] },
  { id: 'vanilla', company: 'Pastiçeri Vanilla', first: 'Mimoza', last: 'Kelmendi', city: 'Gjakovë', street: 'Rr. Nëna Terezë 33', sector: 'pasticeri', scale: 0.45, weight: 2.5, buys: ['p-kuti-torte', 'p-kuti-embelsirash', 'p-kuti-makarona', 'p-kuti-gable'] },
  { id: 'sheqer-kanelle', company: 'Ëmbëltore Sheqer & Kanellë', first: 'Teuta', last: 'Rexhepi', city: 'Pejë', street: 'Rr. Mbretëresha Teutë 16', sector: 'pasticeri', scale: 0.3, weight: 1.5, buys: ['p-kuti-katrore', 'p-kuti-makarona', 'p-kuti-torte'] },
  { id: 'ilirida', company: 'Pastiçeri Ilirida', first: 'Shpresa', last: 'Iseni', city: 'Tetovë', street: 'Rr. Ilindeni 45', sector: 'pasticeri', scale: 0.35, weight: 1, buys: ['p-kuti-torte', 'p-kuti-embelsirash'] },
  /* ---- Cosmetics, pharma, hygiene ---- */
  { id: 'natyra', company: 'Natyra Skin Lab', first: 'Blerina', last: 'Gashi', city: 'Prishtinë', street: 'Rr. Ukshin Hoti 120', sector: 'kozmetike', scale: 0.85, weight: 3, buys: ['p-kuti-kozmetike', 'p-etiketa-kozmetike', 'p-etiketa-transparente', 'p-kuti-mailer'], po: 'PO-NSL-26##' },
  { id: 'aroma', company: 'Aroma Naturale', first: 'Lirije', last: 'Ziberi', city: 'Tetovë', street: 'Rr. Ilindeni 112', sector: 'kozmetike', scale: 0.5, weight: 1.5, buys: ['p-kuti-kozmetike', 'p-etiketa-kozmetike'], since: 55 },
  { id: 'bio-iliria', company: 'Bio Iliria Cosmetics', first: 'Klea', last: 'Marku', city: 'Tiranë', street: 'Rr. Sami Frashëri 21', sector: 'kozmetike', scale: 0.5, weight: 1.5, buys: ['p-etiketa-kozmetike', 'p-etiketa-transparente', 'p-kuti-dhurate'] },
  { id: 'shendeti-plus', company: 'Farmacia Shëndeti Plus', first: 'Faton', last: 'Morina', city: 'Prizren', street: 'Rr. Lidhja e Prizrenit 5', sector: 'farmaci', scale: 0.45, weight: 1.5, buys: ['p-kuti-farmaceutike', 'p-etiketa-kozmetike', 'p-qese-kraft'] },
  { id: 'lumi-pharma', company: 'Lumi Pharma Lab', first: 'Besarta', last: 'Kryeziu', city: 'Fushë Kosovë', street: 'Rr. Nëna Terezë 214', sector: 'farmaci', scale: 0.85, weight: 2, buys: ['p-kuti-farmaceutike', 'p-etiketa-kozmetike'], po: '45000#####' },
  { id: 'pastra', company: 'Pastra Hygiene', first: 'Gëzim', last: 'Bislimi', city: 'Lipjan', street: 'Rr. Skënderbeu 77', sector: 'pastrim', scale: 0.7, weight: 2, buys: ['p-etiketa-letra-lagura', 'p-etiketa-detergjent', 'p-shrink-sleeve'] },
  { id: 'shkelqimi', company: 'Shkëlqimi Detergjent', first: 'Bekim', last: 'Pllana', city: 'Drenas', street: 'Zona Industriale p.n.', sector: 'pastrim', scale: 0.75, weight: 1.5, buys: ['p-etiketa-detergjent', 'p-shrink-sleeve'], po: 'UB-##/26' },
  { id: 'cleanpro', company: 'CleanPro Kosova', first: 'Arlind', last: 'Behrami', city: 'Vushtrri', street: 'Rr. Hasan Prishtina 40', sector: 'pastrim', scale: 0.5, weight: 1, buys: ['p-etiketa-detergjent'], since: 45 },
  /* ---- Beverages, wine, olive oil, food producers ---- */
  { id: 'kodra-diellit', company: 'Vreshtat Kodra e Diellit', first: 'Naim', last: 'Spahiu', city: 'Rahovec', street: 'Rr. e Vreshtave 14', sector: 'pije', scale: 0.5, weight: 1.8, buys: ['p-etiketa-vere', 'p-qese-luksoze', 'p-kuti-dhurate'] },
  { id: 'rrushi-arte', company: 'Vera Rrushi i Artë', first: 'Arbnora', last: 'Qerimi', city: 'Suharekë', street: 'Rr. Dëshmorët 9', sector: 'pije', scale: 0.4, weight: 1.2, buys: ['p-etiketa-vere', 'p-qese-premium'] },
  { id: 'burimi-kristal', company: 'Burimi Kristal', first: 'Ramadan', last: 'Ukaj', city: 'Pejë', street: 'Rr. Haxhi Zeka 88', sector: 'pije', scale: 0.95, weight: 1.6, buys: ['p-shrink-sleeve', 'p-etiketa-ushqimore'], po: 'PO-BK-26###' },
  { id: 'fusha-gjelber', company: 'Qumështorja Fusha e Gjelbër', first: 'Hysen', last: 'Begolli', city: 'Ferizaj', street: 'Rr. Rexhep Bislimi 5', sector: 'ushqim', scale: 0.8, weight: 1.4, buys: ['p-shrink-sleeve', 'p-etiketa-ushqimore'], po: 'FG-26-###' },
  { id: 'ulliri-bregut', company: 'Ulliri i Bregut', first: 'Ardit', last: 'Hoxholli', city: 'Vlorë', street: 'Rr. Ismail Qemali 33', sector: 'ushqim', scale: 0.5, weight: 1.4, buys: ['p-etiketa-vaj', 'p-kuti-dhurate'] },
  { id: 'oleum', company: 'Oleum Durrës', first: 'Elsa', last: 'Kapllani', city: 'Durrës', street: 'Rr. Taulantia 18', sector: 'ushqim', scale: 0.45, weight: 1, buys: ['p-etiketa-vaj', 'p-qese-kraft'], since: 33 },
  { id: 'bletari', company: 'Bletari i Sharrit', first: 'Xhevdet', last: 'Sopi', city: 'Dragash', street: 'Rr. Kryesore 12', sector: 'ushqim', scale: 0.25, weight: 1.2, buys: ['p-etiketa-ushqimore', 'p-kuti-gable'], noNui: true },
  { id: 'bimet-sharrit', company: 'Bimët e Sharrit', first: 'Valentina', last: 'Avdiu', city: 'Prizren', street: 'Rr. Ilir Konushevci 2', sector: 'ushqim', scale: 0.45, weight: 1, buys: ['p-kuti-caji', 'p-etiketa-ushqimore'], kit: [8, null] },
  { id: 'shija-fshatit', company: 'Shija e Fshatit', first: 'Merita', last: 'Limani', city: 'Gjilan', street: 'Rr. Ismail Qemali 14', sector: 'ushqim', scale: 0.3, weight: 1.2, buys: ['p-etiketa-ushqimore', 'p-kuti-gable', 'p-qese-kraft'] },
  { id: 'kakao-lab', company: 'Kakao Lab Chocolatier', first: 'Dafina', last: 'Musliu', city: 'Prishtinë', street: 'Rr. Garibaldi 3', sector: 'ushqim', scale: 0.35, weight: 1.2, buys: ['p-kuti-makarona', 'p-kuti-dhurate', 'p-kuti-gable', 'p-qese-luksoze'], kit: [19, 10] },
  /* ---- Retail & e-commerce ---- */
  { id: 'lodra-gezimi', company: 'Lodra Gëzimi', first: 'Kushtrim', last: 'Salihu', city: 'Prishtinë', street: 'Rr. Isa Kastrati 71', sector: 'retail', scale: 0.5, weight: 1, buys: ['p-kuti-lodrash', 'p-qese-blerjesh'] },
  { id: 'elegance', company: 'Butik Elegance', first: 'Albana', last: 'Dushi', city: 'Prishtinë', street: 'Rr. Nëna Terezë 22', sector: 'retail', scale: 0.3, weight: 1.8, buys: ['p-qese-premium', 'p-qese-luksoze', 'p-kartevizita'] },
  { id: 'moda-linea', company: 'Moda Linea', first: 'Egzona', last: 'Bajrami', city: 'Prizren', street: 'Rr. Shën Flori 6', sector: 'retail', scale: 0.35, weight: 1.4, buys: ['p-qese-pastel', 'p-qese-premium', 'p-qese-blerjesh'] },
  { id: 'optika-vizion', company: 'Optika Vizion', first: 'Petrit', last: 'Ibrahimi', city: 'Pejë', street: 'Rr. Mbretëresha Teutë 51', sector: 'retail', scale: 0.2, weight: 1, buys: ['p-qese-ngjyre', 'p-kartevizita', 'p-fletepalosje'] },
  { id: 'libraria-fjala', company: 'Libraria Fjala', first: 'Arben', last: 'Kastrati', city: 'Prishtinë', street: 'Rr. Luan Haradinaj 15', sector: 'retail', scale: 0.3, weight: 1.2, buys: ['p-qese-kraft', 'p-blloqe', 'p-qese-blerjesh'] },
  { id: 'atelier-nord', company: 'Atelier Nord', first: 'Besa', last: 'Ademi', city: 'Shkup', street: 'Rr. Skënderbeu 9', sector: 'retail', scale: 0.35, weight: 1, buys: ['p-qese-luksoze', 'p-kuti-dhurate'], kit: [13, 3] },
  { id: 'esenca', company: 'Shtëpia e Parfumeve Esenca', first: 'Ina', last: 'Gjoka', city: 'Tiranë', street: 'Rr. Ibrahim Rugova 5', sector: 'retail', scale: 0.4, weight: 1, buys: ['p-qese-luksoze', 'p-kuti-dhurate', 'p-etiketa-transparente'], kit: [16, 6] },
  { id: 'kutia-dhuratave', company: 'Kutia e Dhuratave', first: 'Diellza', last: 'Rrahmani', city: 'Prishtinë', street: 'Rr. Muharrem Fejza 44', sector: 'e-commerce', scale: 0.45, weight: 2, buys: ['p-kuti-mailer', 'p-kuti-dhurate', 'p-etiketa-transparente', 'p-kartevizita'] },
  { id: 'kafe-kokrra', company: 'Kafe & Kokrra Roastery', first: 'Valon', last: 'Demolli', city: 'Gjakovë', street: 'Rr. Ismail Qemali 7', sector: 'e-commerce', scale: 0.3, weight: 1.2, buys: ['p-kuti-mailer', 'p-etiketa-ushqimore', 'p-qese-kraft'] },
  /* ---- Agencies, schools, events, services ---- */
  { id: 'pixel-co', company: 'Pixel & Co. Agjenci Kreative', first: 'Liridon', last: 'Zeka', city: 'Prishtinë', street: 'Rr. Fehmi Agani 61', sector: 'agjenci', scale: 0.5, weight: 2.5, buys: ['p-kartevizita', 'p-fletepalosje', 'p-katalog', 'p-dosje'] },
  { id: 'ideja-studio', company: 'Ideja Studio', first: 'Mirlinda', last: 'Sylejmani', city: 'Prishtinë', street: 'Rr. Garibaldi 12', sector: 'agjenci', scale: 0.4, weight: 1.5, buys: ['p-katalog', 'p-dosje', 'p-qese-ngjyre'] },
  { id: 'horizont', company: 'Kolegji Horizont', first: 'Fatmir', last: 'Rexha', city: 'Prishtinë', street: 'Rr. Ilaz Agushi 4', sector: 'arsim', scale: 0.45, weight: 1.2, buys: ['p-blloqe', 'p-dosje', 'p-fletepalosje'], po: 'KH-2026/###' },
  { id: 'lingua', company: 'Lingua Plus', first: 'Edona', last: 'Mustafa', city: 'Ferizaj', street: 'Rr. Dëshmorët e Kombit 12', sector: 'arsim', scale: 0.25, weight: 0.8, buys: ['p-fletepalosje', 'p-dosje', 'p-kartevizita'], since: 40 },
  { id: 'eventa', company: 'Eventa Group', first: 'Kaltrina', last: 'Haxhiu', city: 'Prishtinë', street: 'Bulevardi Bill Clinton 89', sector: 'evente', scale: 0.5, weight: 1.4, buys: ['p-blloqe', 'p-qese-ngjyre', 'p-fletepalosje', 'p-dosje'], since: 30 },
  { id: 'smile', company: 'Klinika Dentare Smile', first: 'Blendi', last: 'Hasani', city: 'Gjilan', street: 'Rr. Adem Jashari 2', sector: 'sherbime', scale: 0.2, weight: 0.8, buys: ['p-kartevizita', 'p-dosje', 'p-fletepalosje'], since: 20 },
  { id: 'prona-invest', company: 'Prona Invest', first: 'Gentiana', last: 'Zeqiri', city: 'Prishtinë', street: 'Rr. Ukshin Hoti 45', sector: 'sherbime', scale: 0.4, weight: 0.8, buys: ['p-katalog', 'p-dosje', 'p-kartevizita'], since: 25 },
];

/* Walk-in customers without a company (freelancers, families, small makers) */
const FIRST = ['Arbnor', 'Blerta', 'Dren', 'Elira', 'Fisnik', 'Hana', 'Ilirjana', 'Jeton', 'Leutrim', 'Mrika', 'Njomza', 'Orges', 'Qëndresa', 'Rron', 'Shqipe', 'Trim', 'Vesa', 'Yll', 'Zana', 'Ermira'];
const LAST = ['Krasniqi', 'Gashi', 'Berisha', 'Morina', 'Shala', 'Hoxha', 'Kelmendi', 'Bytyqi', 'Hasani', 'Rexhepi', 'Ahmeti', 'Mustafa', 'Sylejmani', 'Avdiu', 'Kastrati', 'Pllana', 'Haliti', 'Limani', 'Begolli', 'Gjoka'];
const WALK_IN_CITIES: (readonly [string, number])[] = [
  ['Prishtinë', 10], ['Prizren', 3], ['Ferizaj', 2], ['Pejë', 2], ['Gjakovë', 2], ['Gjilan', 2], ['Mitrovicë', 1], ['Fushë Kosovë', 1], ['Podujevë', 1], ['Tiranë', 1], ['Shkup', 1],
];
const WALK_IN_STREETS = ['Rr. Agim Ramadani', 'Rr. Nëna Terezë', 'Rr. Skënderbeu', 'Rr. Dëshmorët e Kombit', 'Rr. Ismail Qemali', 'Rr. Fehmi Agani', 'Rr. Lidhja e Prizrenit', 'Rr. Hasan Prishtina'];
const WALK_IN_BUYS = ['p-kartevizita', 'p-kartevizita', 'p-kartevizita', 'p-blloqe', 'p-kuti-gable', 'p-kuti-gable', 'p-qese-kraft', 'p-etiketa-ushqimore', 'p-fletepalosje', 'p-kuti-dhurate'];

const ALBANIA = new Set(['Tiranë', 'Durrës', 'Shkodër', 'Vlorë', 'Elbasan', 'Kukës']);
const MACEDONIA = new Set(['Shkup', 'Tetovë', 'Gostivar', 'Strugë', 'Kumanovë']);
const countryOf = (city: string) => (ALBANIA.has(city) ? 'AL' : MACEDONIA.has(city) ? 'MK' : 'XK');

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const digits = (r: () => number, n: number) => Array.from({ length: n }, () => Math.floor(r() * 10)).join('');

function phoneFor(key: string, city: string) {
  const r = rng(hash(key));
  const c = countryOf(city);
  if (c === 'AL') return `+355 6${pick(['7', '8', '9'], r)} ${digits(r, 3)} ${digits(r, 4)}`;
  if (c === 'MK') return `+389 7${pick(['0', '1', '5', '8'], r)} ${digits(r, 3)} ${digits(r, 3)}`;
  return `+383 4${pick(['4', '5', '9'], r)} ${100 + Math.floor(r() * 900)} ${100 + Math.floor(r() * 900)}`;
}

/** Business number in the local format: NUI (Kosovo), NIPT (Albania), EDB (North Macedonia). */
function businessNo(key: string, city: string) {
  const r = rng(hash(`${key}#nui`));
  const c = countryOf(city);
  if (c === 'AL') return `${pick(['K', 'L', 'M'], r)}${digits(r, 8)}${String.fromCharCode(65 + Math.floor(r() * 26))}`;
  if (c === 'MK') return `MK40${digits(r, 11)}`;
  return `81${digits(r, 7)}`;
}

const emailOf = (first: string, last: string) => `${slugify(first)}.${slugify(last)}@example.com`;

/** Contact block of a client as stored on orders (shared with drafts, quotes and inquiries). */
export function clientCustomer(id: string): Customer {
  const c = CLIENTS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown demo client ${id}`);
  return {
    firstName: c.first,
    lastName: c.last,
    email: emailOf(c.first, c.last),
    phone: phoneFor(c.id, c.city),
    city: c.city,
    address: c.street,
    company: c.company,
    ...(c.noNui ? {} : { pib: businessNo(c.id, c.city) }),
  };
}

/* ================================================================== */
/* Lines, quantities, artwork                                          */
/* ================================================================== */
/** The square pizza box was replaced by the octagonal one — archived in the CMS, still on older orders. */
export const LEGACY_PRODUCT = { id: 'p-kuti-pice-katrore', replaces: 'p-kuti-pice', archivedDaysAgo: 38 };

const keyOf = (id: string, o: Record<string, string>, inst: boolean) =>
  `${id}|${Object.keys(o)
    .sort()
    .map((k) => `${k}=${o[k]}`)
    .join('&')}|${inst ? 'i' : ''}`;

/** A realistic print run: around the tier that matches the client's size, rounded to the product's step. */
function qtyFor(p: Product, scale: number, r: () => number) {
  const tiers = p.tiers ?? [];
  if (!tiers.length) return p.unit === 'set' ? (r() < 0.85 ? 1 : 2) : minQty(p);
  const pos = Math.max(0, Math.min(tiers.length - 1, Math.round(scale * (tiers.length - 1) + (r() - 0.5) * 1.6)));
  const mult = weighted([[1, 6], [1.5, 1.6], [2, 1.4], [3, 0.5]] as const, r);
  const step = p.qtyStep ?? tiers[0].qty;
  return Math.max(minQty(p), Math.round((tiers[pos].qty * mult) / step) * step);
}

function optionsFor(p: Product, r: () => number) {
  const options = defaultOptions(p);
  for (const o of p.options) if (r() < 0.45) options[o.id] = pick(o.values, r).id;
  return options;
}

const DESIGN_NOTES = [
  'Logo në PDF vektoriale — ngjyrat sipas manualit të markës.',
  'Dizajn i ri sipas menysë sonë, fotot i dërgojmë me e-mail.',
  'Ruani stilin e etiketave ekzistuese, ndryshon vetëm formati.',
  'Vetëm logo dhe adresa — stil minimal, sfond i bardhë.',
  'Na duhet edhe versioni në anglisht për eksport.',
  'Ilustrim i thjeshtë me motive festive, ngjyra e markës Pantone 485 C.',
];
const LATER_NOTES = ['Skedarët i dërgojmë nesër me e-mail.', 'Dizajni është te agjencia jonë — vjen këtë javë.', 'Dërgojmë dieline-in e përditësuar pas takimit.', ''];
const CHANGE_NOTES = [
  'logo 10% më e madhe dhe kodi QR në anën e pasme.',
  'tekst i ri i përbërësve dhe simboli i riciklimit.',
  'sfond më i errët, sipas Pantone 7421 C.',
  'korrigjim i numrit të telefonit në kapak.',
  'barkod EAN-13 i veçantë për secilin variant.',
];

function fileFor(brand: string, p: Product, r: () => number): { name: string; size: number } {
  const item = p.slug.split('-').slice(0, 2).join('-');
  const v = 1 + Math.floor(r() * 4);
  if (r() < 0.22) return { name: `${brand}-${item}-v${v}.ai`, size: Math.round((6 + r() * 42) * 1048576) };
  const name = pick([`${brand}-${item}-v${v}.pdf`, `${brand}_${item}_print-ready.pdf`, `${item}-${brand}-final.pdf`, `${brand}-${item}-dieline-cmyk.pdf`], r);
  return { name, size: Math.round((0.8 + r() * 22) * 1048576) };
}

/** Production technology noted when a job goes to press (exact machine list from printwor-ks.com). */
function techFor(p: Product, qty: number) {
  switch (p.categoryId) {
    case 'cat-etiketa':
      return p.id === 'p-shrink-sleeve' || qty > 10000 ? 'flexo LED UV 8 ngjyra' : 'HP Indigo';
    case 'cat-qese-letre':
      return 'offset + konfeksionim i qeseve';
    case 'cat-materiale-promovuese':
      return qty <= 1000 ? 'Heidelberg Versafire' : 'Manroland B1';
    default:
      return qty < 1000 ? 'Heidelberg Versafire' : 'Manroland B1 + prerje me matricë';
  }
}

/** Push a moment into working hours (Mon–Fri 8–17, Sat 9–13). */
function work(t: number, r: () => number) {
  const d = new Date(t);
  for (let guard = 0; guard < 8; guard++) {
    const dow = d.getDay();
    const h = d.getHours() + d.getMinutes() / 60;
    const [open, close] = dow === 0 ? [0, 0] : dow === 6 ? [9, 13] : [8, 17];
    if (close > open && h >= open && h < close) return d.getTime();
    if (close > open && h < open) {
      d.setHours(open, Math.floor(r() * 50), 0, 0);
      return d.getTime();
    }
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
  }
  return d.getTime();
}

/** ISO time rounded to the minute (event timestamps). */
const minute = (t: number) => new Date(Math.round(t / 60000) * 60000).toISOString();

const eur = (n: number) => `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/* ================================================================== */
/* Orders                                                              */
/* ================================================================== */
interface Buyer {
  key: string;
  client: Client | null;
  customer: Customer;
  brand: string;
  scale: number;
  buys: string[];
  sector: Sector | null;
}

interface Intent {
  at: number;
  buyer: Buyer;
  kind: 'random' | 'kit' | 'follow';
}

const FLOW: OrderStatus[] = ['new', 'confirmed', 'proof', 'processing', 'shipped', 'completed'];
/** Codes handled explicitly (welcome / sample credit) — every other live code counts as seasonal. */
const FIXED_CODES = new Set(['d-print10', 'd-mostra19']);

const CANCEL_REASONS = [
  'Klienti anuloi — eventi u shty për vitin e ardhshëm.',
  'Porosi e dyfishtë — u mbajt porosia e mëparshme.',
  'Klienti zgjodhi ofertë individuale për tirazh më të madh.',
  'Avansi nuk u pagua brenda 7 ditëve.',
];
const CUSTOMER_NOTES = ['Ju lutem dorëzimi para orës 10:00.', 'Telefononi para dorëzimit — hyrja nga oborri.', 'Na duhet prova fizike para tirazhit.', 'Fatura në emër të kompanisë, me NUI.'];
const INTERNAL_NOTES = ['Klient i rregullt — përparësi në planifikim.', 'Kontrollo ngjyrën e markës me mostrën e porosisë së kaluar.', 'Pagesa me afat 15 ditë sipas marrëveshjes.', 'Dorëzim në dy pjesë — gjysma këtë javë.'];

function buyerOf(c: Client): Buyer {
  return { key: c.id, client: c, customer: clientCustomer(c.id), brand: c.id, scale: c.scale, buys: c.buys, sector: c.sector };
}

function walkIn(r: () => number): Buyer {
  const first = pick(FIRST, r);
  const last = pick(LAST, r);
  const city = weighted(WALK_IN_CITIES, r);
  const key = `${first}-${last}-${city}`;
  return {
    key,
    client: null,
    customer: { firstName: first, lastName: last, email: emailOf(first, last), phone: phoneFor(key, city), city, address: `${pick(WALK_IN_STREETS, r)} ${1 + Math.floor(r() * 140)}` },
    brand: slugify(last),
    scale: 0.25,
    buys: WALK_IN_BUYS,
    sector: null,
  };
}

/**
 * B2B orders over the last 75 days. Every cart goes through the real pricing + discount engine with
 * the order date as "now", so automatic rules (free delivery, label promo, bags + cards) and codes only
 * apply inside their window. Status, proof and timeline follow a realistic print workflow.
 */
export function generateOrders(products: Product[], settings: Settings, discounts: Discount[], collections: Collection[], now = new Date(), seed = 42): Order[] {
  const r = rng(seed);
  const T0 = now.getTime();
  const byId = new Map(products.map((p) => [p.id, p]));
  const prefix = settings.orderPrefix || 'PW-';
  const archiveAt = T0 - LEGACY_PRODUCT.archivedDaysAgo * DAY;

  /* ---------- 1. when, and who ---------- */
  const intents: Intent[] = [];
  const DAYS = 75;
  const regular = CLIENTS.filter((c) => !c.kit);
  const walkIns: Buyer[] = [];
  for (let day = DAYS; day >= 0; day--) {
    const date = new Date(T0 - day * DAY);
    const dow = date.getDay();
    const base = 0.95 + ((DAYS - day) / DAYS) * 0.7;
    const mean = dow === 0 ? base * 0.25 : dow === 6 ? base * 0.55 : base;
    let count = 0;
    const x = r();
    let p = Math.exp(-mean);
    let cdf = p;
    while (x > cdf && count < 5) {
      count++;
      p = (p * mean) / count;
      cdf += p;
    }
    if (day === 0) count = Math.max(count, 3);
    for (let i = 0; i < count; i++) {
      const created = new Date(date);
      created.setHours(weighted([[8, 2], [9, 3], [10, 3], [11, 3], [12, 2], [13, 2], [14, 3], [15, 2], [16, 2], [17, 1], [18, 1], [19, 1], [20, 1], [21, 0.5]] as const, r), Math.floor(r() * 60), Math.floor(r() * 60), 0);
      if (created.getTime() > T0) created.setTime(T0 - (i + 1) * 53 * 60000);
      let buyer: Buyer;
      if (r() < 0.11) {
        buyer = walkIns.length > 3 && r() < 0.12 ? pick(walkIns, r) : walkIn(r);
        walkIns.push(buyer);
      } else {
        const eligible = regular.filter((c) => c.since == null || day <= c.since);
        buyer = buyerOf(weighted(eligible.map((c) => [c, c.weight] as const), r));
      }
      intents.push({ at: created.getTime(), buyer, kind: 'random' });
    }
  }
  // prospects: sample kit first, the first print run (with MOSTRA19) a week or two later
  const atDay = (daysAgo: number, hour: number) => {
    const d = new Date(T0 - daysAgo * DAY);
    d.setHours(hour, Math.floor(r() * 60), 0, 0);
    return Math.min(d.getTime(), T0 - HOUR);
  };
  for (const c of CLIENTS.filter((x) => x.kit)) {
    const [kitDay, followDay] = c.kit!;
    intents.push({ at: atDay(kitDay, 10 + Math.floor(r() * 5)), buyer: buyerOf(c), kind: 'kit' });
    if (followDay != null) intents.push({ at: atDay(followDay, 9 + Math.floor(r() * 7)), buyer: buyerOf(c), kind: 'follow' });
  }
  for (const d of [15, 4]) intents.push({ at: atDay(d, 11 + Math.floor(r() * 6)), buyer: walkIn(r), kind: 'kit' });
  intents.sort((a, b) => a.at - b.at);

  /* ---------- 2. carts, prices, workflow ---------- */
  const history = new Map<string, { numbers: string[]; products: Map<string, string> }>();
  const orders: Order[] = [];
  let seq = 1001;
  for (const it of intents) {
    const { buyer } = it;
    const at = it.at;
    const ageDays = (T0 - at) / DAY;
    const hist = history.get(buyer.key) ?? { numbers: [], products: new Map<string, string>() };
    const first = hist.numbers.length === 0;
    const number = `${prefix}${seq}`;
    const available = (id: string) => {
      const p = byId.get(id);
      return !!p && p.status === 'active' && !p.quoteOnly && new Date(p.createdAt).getTime() <= at && (p.id !== LEGACY_PRODUCT.id || at < archiveAt);
    };

    /* cart */
    const cart: CartItem[] = [];
    const kitLine = (): CartItem => {
      const kit = byId.get('p-mostra')!;
      const options = defaultOptions(kit);
      return { key: keyOf(kit.id, options, false), productId: kit.id, qty: qtyFor(kit, 0, r), options, installation: false };
    };
    if (it.kind === 'kit' && available('p-mostra')) {
      cart.push(kitLine());
      if (r() < 0.3 && available('p-kartevizita')) {
        const p = byId.get('p-kartevizita')!;
        cart.push({ key: '', productId: p.id, qty: 250, options: optionsFor(p, r), installation: false });
      }
    } else {
      const pool = buyer.buys.filter(available);
      const n = Math.min(pool.length, weighted([[1, 5], [2, 3.5], [3, 1.5]] as const, r));
      const chosen = new Set<string>();
      for (let k = 0; k < n * 3 && chosen.size < n; k++) chosen.add(pick(pool, r));
      for (let id of chosen) {
        if (id === LEGACY_PRODUCT.replaces && available(LEGACY_PRODUCT.id) && r() < 0.55) id = LEGACY_PRODUCT.id;
        const p = byId.get(id)!;
        cart.push({ key: '', productId: id, qty: qtyFor(p, buyer.scale, r), options: optionsFor(p, r), installation: false });
      }
      // print jobs below ~€110 net are rare — small buyers step up to the next run length
      const net = () => cart.reduce((s, c) => s + unitPrice(byId.get(c.productId)!, c.options, c.qty) * c.qty, 0);
      for (let k = 0; k < 4 && cart.length && net() < 110; k++) cart[0].qty *= 2;
    }
    if (!cart.length) continue;

    // shoppers following the "bags + business cards" promo add the free cards themselves (manual mode)
    for (const d of discounts) {
      const b = d.bxgy;
      if (d.kind !== 'bxgy' || !b || d.method !== 'auto' || d.status !== 'active' || new Date(d.startsAt).getTime() > at || (d.endsAt && new Date(d.endsAt).getTime() <= at)) continue;
      const xQty = cart.filter((c) => b.buyIds.includes(c.productId)).reduce((s, c) => s + c.qty, 0);
      const y = byId.get(b.getIds[0]);
      if (y && xQty >= b.buyQty && !cart.some((c) => c.productId === y.id) && r() < 0.65) cart.push({ key: '', productId: y.id, qty: b.getQty, options: defaultOptions(y), installation: false });
    }

    /* design service + artwork on every artwork line */
    let reprintOf: string | undefined;
    for (const item of cart) {
      const p = byId.get(item.productId)!;
      const before = hist.products.get(p.id);
      if (p.installation?.available && !before && r() < (buyer.scale < 0.4 ? 0.5 : 0.3)) item.installation = true;
      if (p.artwork) {
        let art: ArtworkRef;
        if (item.installation) art = { status: 'design', note: pick(DESIGN_NOTES, r) };
        else if (before && r() < 0.7) {
          art = { status: 'uploaded', ...fileFor(buyer.brand, p, r), note: `Ribotim — i njëjti dizajn si te ${before}.` };
          reprintOf = before;
        } else if (r() < 0.24) {
          const note = pick(LATER_NOTES, r);
          art = { status: 'later', ...(note ? { note } : {}) };
        } else art = { status: 'uploaded', ...fileFor(buyer.brand, p, r) };
        item.artwork = art;
      }
      item.key = keyOf(item.productId, item.options, item.installation);
    }

    /* codes people typed */
    const live = (d: Discount) => d.method === 'code' && !!d.code && d.status === 'active' && new Date(d.startsAt).getTime() <= at && (!d.endsAt || new Date(d.endsAt).getTime() > at);
    let code: string | null = null;
    if (it.kind === 'follow') code = discounts.find((d) => d.id === 'd-mostra19')?.code ?? null;
    else if (first && it.kind === 'random' && (buyer.client?.since != null ? r() < 0.7 : !buyer.client && r() < 0.25)) code = discounts.find((d) => d.id === 'd-print10')?.code ?? null;
    else if (it.kind === 'random') {
      for (const d of discounts) {
        if (!live(d) || FIXED_CODES.has(d.id) || d.audience.type !== 'all') continue;
        const hit = cart.some((c) => {
          const p = byId.get(c.productId)!;
          if (d.appliesTo.scope === 'all') return true;
          if (d.appliesTo.scope === 'products') return d.appliesTo.ids.includes(p.id);
          return collectionIdsFor(p, collections).some((id) => d.appliesTo.ids.includes(id));
        });
        if (hit && r() < 0.55) {
          code = d.code!;
          break;
        }
      }
    }

    /* buyers top up to reach a threshold: a code's minimum, or the quantity of an automatic volume promo */
    const netOf = () => cart.reduce((s, c) => s + unitPrice(byId.get(c.productId)!, c.options, c.qty) * c.qty, 0);
    const codeMin = code ? discounts.find((d) => d.code === code)?.minimum : undefined;
    if (codeMin?.type === 'amount') for (let k = 0; k < 4 && netOf() < codeMin.value * 1.05; k++) cart[0].qty *= 2;
    for (const d of discounts) {
      if (d.method !== 'auto' || d.kind !== 'products' || d.minimum.type !== 'qty' || d.appliesTo.scope !== 'products' || d.status !== 'active') continue;
      if (new Date(d.startsAt).getTime() > at || (d.endsAt && new Date(d.endsAt).getTime() <= at)) continue;
      const eligible = cart.filter((c) => d.appliesTo.ids.includes(c.productId));
      const qty = eligible.reduce((s, c) => s + c.qty, 0);
      if (eligible.length && qty < d.minimum.value && qty >= d.minimum.value * 0.4 && r() < 0.7) eligible[0].qty += d.minimum.value - qty;
    }

    const cust = buyer.customer;
    const zone = zoneForCity(settings, cust.city);
    const exportOrder = zone?.id === 'z3';
    const delivery = !exportOrder && zone?.id === 'z1' && r() < 0.22 ? 'pickup' : 'delivery';
    const lang: Lang = buyer.client?.lang ?? (r() < 0.1 ? 'en' : 'sq');
    const totals = priceCart(cart, products, settings, { lang, couponCode: code, discounts, collections, delivery, city: cust.city, now: new Date(at) });
    const payMethod: PaymentMethod = !buyer.client
      ? weighted([['card', 5.5], ['cod', 3.5], ['bank', 1]] as const, r)
      : exportOrder
        ? weighted([['bank', 3], ['card', 1]] as const, r)
        : weighted([['bank', 6], ['card', 2.8], ['cod', 1.2]] as const, r);

    /* ---------- workflow timing ---------- */
    const kitOnly = cart.every((c) => !byId.get(c.productId)!.artwork);
    const hasLater = cart.some((c) => c.artwork?.status === 'later');
    const hasDesign = cart.some((c) => c.artwork?.status === 'design');
    const lead = Math.max(1, ...cart.map((c) => byId.get(c.productId)!.leadDays ?? 7));
    const main = cart.find((c) => byId.get(c.productId)!.artwork) ?? cart[0];
    const mainP = byId.get(main.productId)!;
    const big = buyer.scale >= 0.6;
    const confirmer = big ? 'st-arta' : 'st-lirie';
    const h = (n: number) => n * HOUR;

    const tConfirmed = work(at + h(1 + r() * 3), r);
    const tFiles = hasLater ? work(tConfirmed + h(8 + r() * 56), r) : undefined;
    const tProof = kitOnly ? undefined : work(Math.max(tConfirmed, tFiles ?? 0) + h(hasDesign ? 26 + r() * 30 : 4 + r() * 18), r);
    const version = kitOnly ? 0 : r() < 0.28 ? 2 : 1;
    const tChanges = tProof != null && version === 2 ? tProof + h(3 + r() * 20) : undefined;
    const tProof2 = tChanges != null ? work(tChanges + h(4 + r() * 16), r) : undefined;
    const tApproved = tProof != null ? work((tProof2 ?? tProof) + h(4 + r() * 70), r) : undefined;
    const tShipped = kitOnly ? work(tConfirmed + h(2 + r() * 4), r) : work(tApproved! + lead * DAY * 1.1 * (0.85 + r() * 0.3), r);
    const pickup = delivery === 'pickup';
    const tCompleted = exportOrder ? tShipped + h(48 + r() * 60) : work(tShipped + h(pickup ? 3 + r() * 45 : 24 + r() * 130), r);
    const changeNote = pick(CHANGE_NOTES, r);

    // payment: card at checkout · bank = proforma before production, or invoice with payment terms · COD on delivery
    const proforma = !buyer.client || buyer.client.noNui || exportOrder || first || r() < 0.45;
    const tPaid = payMethod === 'card' ? at : payMethod === 'cod' ? tCompleted : proforma ? work((tProof ?? tConfirmed) + h(2 + r() * 30), r) : work(tCompleted + DAY * (2 + r() * 12), r);

    /* status at "now" — fresh orders wait for the team; a few are cancelled before production */
    let cutoff = T0;
    let cancelled: { at: number; reason: string } | null = null;
    const hold = r();
    if (ageDays < 0.8 && hold < 0.65) cutoff = at;
    // prepress still on it (files being checked, proforma unpaid) — confirmed, proof not sent yet
    else if (ageDays < 3 && hold < 0.45 && tProof != null && tProof > tConfirmed + 60000 && tConfirmed < T0) cutoff = Math.min(T0, tProof - 60000);
    else if (ageDays > 1.5 && r() < 0.05) {
      const span = Math.max(h(2), (tApproved ?? tShipped) - tConfirmed - h(1));
      const cAt = Math.min(tConfirmed + r() * span, T0 - h(1));
      cancelled = { at: cAt, reason: pick(CANCEL_REASONS, r) };
      cutoff = cAt;
    }

    const carrier = pickup ? 'pickup' : exportOrder || (zone?.id === 'z2' && r() < 0.3) ? 'courier' : 'printworks';
    const tracking = carrier === 'courier' ? `${countryOf(cust.city)}${digits(r, 8)}` : undefined;
    const shipNote = carrier === 'pickup' ? 'pickup Gati për marrje në recepsion' : carrier === 'courier' ? `courier ${tracking}` : `printworks ${pick(['Linja e mëngjesit', 'Linja e pasdites', 'Dorëzim i veçantë'], r)}`;
    const tech = techFor(mainP, main.qty);
    const fileName = cart.map((c) => c.artwork).find((a) => a?.status === 'later') ? fileFor(buyer.brand, mainP, r) : null;

    const all: (OrderEvent & { t: number })[] = [{ t: at, at: '', status: 'new', by: 'web' }];
    const ev = (t: number | undefined, status: OrderEvent['status'], by: string, note?: string) => {
      if (t != null) all.push({ t, at: '', status, by, ...(note ? { note } : {}) });
    };
    ev(tConfirmed, 'confirmed', confirmer, payMethod === 'bank' ? 'Fatura proforma u dërgua me e-mail.' : payMethod === 'cod' ? 'Konfirmuar me telefon — pagesa në dorëzim.' : 'Pagesa me kartelë e verifikuar.');
    if (tFiles != null && fileName) ev(tFiles, 'note', 'st-blerim', `Skedarët e printimit u pranuan (${fileName.name}).`);
    ev(tProof, 'proof', 'st-blerim', 'Prova digjitale v1 u dërgua për aprovim.');
    ev(tChanges, 'note', 'st-blerim', `Klienti kërkoi ndryshime: ${changeNote}`);
    ev(tProof2, 'note', 'st-blerim', 'Prova digjitale v2 u dërgua.');
    ev(tApproved, 'processing', 'st-blerim', `Prova v${version} u aprovua — në prodhim (${tech}).`);
    ev(tShipped, 'shipped', 'st-lirie', shipNote);
    ev(tCompleted, 'completed', 'st-lirie', pickup ? 'U mor nga klienti në fabrikë.' : `Dorëzuar — pranoi ${cust.firstName} ${cust.lastName.charAt(0)}.`);
    if (payMethod !== 'card') ev(tPaid, 'payment', 'st-arta', payMethod === 'cod' ? `Pagesa në dorëzim u arkëtua — ${eur(totals.total)}.` : proforma ? `Pagesa me transfertë u pranua — ${eur(totals.total)}.` : `Fatura ${number} u pagua me transfertë — ${eur(totals.total)}.`);
    const events = all.filter((e) => e.t <= cutoff).sort((a, b) => a.t - b.t);
    const paid = payMethod === 'card' || events.some((e) => e.status === 'payment');
    if (cancelled) {
      events.push({ t: cancelled.at, at: '', status: 'cancelled', by: 'st-arta', note: cancelled.reason });
      if (paid) events.push({ t: cancelled.at + h(0.2), at: '', status: 'payment', by: 'st-arta', note: `${payMethod === 'card' ? 'Rimbursim në kartelë' : 'Rimbursim me transfertë'} — ${eur(totals.total)}.` });
    }
    const timeline: OrderEvent[] = events.map(({ t, ...e }) => ({ ...e, at: minute(t) }));
    const status: OrderStatus = cancelled ? 'cancelled' : ((events.filter((e) => FLOW.includes(e.status as OrderStatus)).pop()?.status as OrderStatus | undefined) ?? 'new');

    /* proof at the cutoff */
    let proof: OrderProof | undefined;
    if (!kitOnly) {
      const iso = minute;
      if (tProof == null || cutoff < tProof) proof = { status: hasLater && (tFiles == null || cutoff < tFiles) ? 'awaiting_files' : 'checking', version: 0 };
      else if (tChanges != null && cutoff < tChanges) proof = { status: 'sent', version: 1, sentAt: iso(tProof) };
      else if (tChanges != null && tProof2 != null && cutoff < tProof2) proof = { status: 'changes', version: 1, sentAt: iso(tProof), note: `Klienti kërkoi: ${changeNote}` };
      else if (tApproved == null || cutoff < tApproved) proof = { status: 'sent', version, sentAt: iso(tProof2 ?? tProof) };
      else proof = { status: 'approved', version, sentAt: iso(tProof2 ?? tProof), approvedAt: iso(tApproved) };
    }
    const filesIn = tFiles != null && cutoff >= tFiles;

    const items: OrderLine[] = totals.lines.map((l) => {
      let artwork = l.item.artwork;
      if (artwork?.status === 'later' && filesIn) artwork = { status: 'uploaded', ...fileFor(buyer.brand, l.product, r), note: 'Dërguar me e-mail pas porosisë.' };
      return {
        productId: l.product.id,
        sku: l.product.sku,
        name: lt(l.product.name, lang),
        image: l.product.images[0] ?? '',
        unit: l.product.unit,
        packSize: l.product.packSize,
        qty: l.item.qty,
        options: l.optionsLabel,
        unitPrice: l.unitPrice,
        installation: l.item.installation,
        installationPrice: l.installationUnitPrice,
        ...(l.product.installation?.per === 'line' ? { installationPer: 'line' as const } : {}),
        lineTotal: l.lineTotal,
        ...(artwork ? { artwork } : {}),
        discount: l.discount,
        allocations: l.allocations,
      };
    });

    const po = buyer.client?.po && r() < 0.8 ? buyer.client.po.replace(/#/g, () => String(Math.floor(r() * 10))) : undefined;
    const tags = [buyer.sector, exportOrder ? 'eksport' : null, reprintOf ? 'ribotim' : null].filter((x): x is string => !!x);
    const shippedEv = timeline.find((e) => e.status === 'shipped');
    orders.push({
      id: `o_${seq}`,
      number,
      createdAt: new Date(at).toISOString(),
      status,
      customer: { ...cust, ...(r() < 0.12 ? { note: pick(CUSTOMER_NOTES, r) } : {}) },
      items,
      delivery: { method: delivery, fee: totals.shipping },
      payment: { method: payMethod, status: cancelled ? (paid ? 'refunded' : 'pending') : paid ? 'paid' : 'pending' },
      coupon: totals.coupon ? { code: totals.coupon.code, discount: totals.discount } : null,
      discounts: totals.applied,
      shippingBeforeDiscount: totals.shippingBeforeDiscount,
      subtotal: totals.subtotal,
      installationTotal: totals.installationTotal,
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
      vat: totals.vat,
      lang,
      timeline,
      ...(r() < 0.1 ? { internalNote: pick(INTERNAL_NOTES, r) } : {}),
      seen: ageDays > 0.6,
      demo: true,
      ...(proof ? { proof } : {}),
      ...(po ? { poNumber: po } : {}),
      ...(tags.length ? { tags } : {}),
      ...(shippedEv && (status === 'shipped' || status === 'completed')
        ? { fulfillment: { shippedAt: shippedEv.at, carrier, ...(tracking ? { tracking } : {}), ...(status === 'completed' ? { deliveredAt: timeline.find((e) => e.status === 'completed')?.at } : {}) } }
        : {}),
    });

    hist.numbers.push(number);
    for (const c of cart) if (!hist.products.has(c.productId)) hist.products.set(c.productId, number);
    history.set(buyer.key, hist);
    seq++;
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ================================================================== */
/* Inquiries — quote requests (RFQ), meetings, contact messages        */
/* ================================================================== */
const SVC = {
  food: 'Paketime ushqimore',
  box: 'Kuti produktesh',
  label: 'Etiketa & shrink sleeve',
  bag: 'Qese letre',
  promo: 'Materiale promovuese',
};

interface InqSeed {
  id: number;
  hours: number;
  type: Inquiry['type'];
  status: Inquiry['status'];
  /** Reuse an existing client's contact data */
  client?: string;
  name?: string;
  company?: string;
  city?: string;
  phone?: string;
  service?: string;
  productId?: string;
  message: string;
  /** Meetings: preferred date, days from now */
  preferredIn?: number;
  specs?: Omit<RfqSpecs, 'deadline'> & { deadlineIn?: number };
}

const MB = 1048576;

const INQ: InqSeed[] = [
  {
    id: 100, hours: 2.5, type: 'quote', status: 'new', name: 'Rinor Sadiku', company: 'Alba Organics', city: 'Prishtinë', service: SVC.box, productId: 'p-kuti-kozmetike',
    message: 'Po lansojmë tri kremëra fytyre dhe na duhen kuti kartoni me soft-touch dhe folje ari. Ju lutem ofertë për 3 × 3.000 copë dhe afatin e prodhimit — lansimi është në fund të nëntorit.',
    specs: { product: 'box', size: '55 × 55 × 110 mm', material: 'GC1 350 g', quantity: 9000, colours: 'CMYK + 1 Pantone (871 C ari)', finishes: ['Soft-touch', 'Folje ari', 'Reliev në logo'], deadlineIn: 35, files: [{ name: 'alba-organics-dieline-50ml.pdf', size: Math.round(2.7 * MB) }] },
  },
  {
    id: 101, hours: 9, type: 'measurement', status: 'new', name: 'Gresa Tahiri', company: 'Pekaria Tradita', city: 'Ferizaj', service: SVC.food, preferredIn: 2,
    message: 'Dëshirojmë të vizitojmë fabrikën të enjten me ekipin tonë, për të parë kutitë e pastiçerisë dhe mostrat në karton kraft para porosisë për festat.',
  },
  {
    id: 116, hours: 36, type: 'contact', status: 'new', name: 'Elira Shehu', city: 'Gjakovë', service: SVC.promo,
    message: 'Përshëndetje! A printoni ftesa dasme dhe kuti të vogla për bombonierë? Na duhen rreth 150 copë nga secila, dasma është në dhjetor.',
  },
  {
    id: 102, hours: 22, type: 'contact', status: 'contacted', name: 'Florent Hyseni', company: 'Pizzeria Napoli 21', city: 'Gjilan', service: SVC.food, productId: 'p-kuti-pice',
    message: 'A e keni certifikatën për kartonin në kontakt me ushqimin? Na e kërkon inspektori për kutitë e picave. Nëse po, ju lutem na e dërgoni në PDF.',
  },
  {
    id: 103, hours: 30, type: 'quote', status: 'contacted', client: 'kodra-diellit', service: SVC.label, productId: 'p-etiketa-vere',
    message: 'Për serinë e re (Vranac, Rizling, Rose) duam etiketa me letër të strukturuar, folje ari dhe reliev në emër. Sa kushtojnë 3 × 2.000 copë dhe a mund të bëjmë press check?',
    specs: { product: 'label', size: '90 × 120 mm', material: 'Letër vere e strukturuar, e bardhë natyrale', quantity: 6000, colours: 'CMYK + e bardhë', finishes: ['Folje ari', 'Reliev', 'Llak UV selektiv'], deadlineIn: 28, files: [{ name: 'kodra-e-diellit-etiketa-2026.ai', size: Math.round(38.4 * MB) }] },
  },
  {
    id: 104, hours: 50, type: 'quote', status: 'contacted', client: 'burimi-kristal', service: SVC.label, productId: 'p-shrink-sleeve',
    message: 'Kemi shishe të re 0,33 L dhe na duhet shrink sleeve me perforim kundër hapjes. Volumi i parë 120.000 copë, pastaj porosi çdo muaj.',
    specs: { product: 'sleeve', size: 'Shishe 0,33 L · perimetër 185 mm · lartësi 140 mm', material: 'PETG 45 µm', quantity: 120000, colours: 'CMYK + e bardhë mbuluese', finishes: ['Perforim kundër hapjes (tamper)'], deadlineIn: 40, files: [{ name: 'burimi-kristal-033-sleeve-v2.pdf', size: Math.round(6.2 * MB) }] },
  },
  {
    id: 105, hours: 70, type: 'measurement', status: 'scheduled', client: 'vanilla', service: SVC.food, productId: 'p-kuti-torte', preferredIn: 4,
    message: 'Duam të jemi në fabrikë kur printohen kutitë e tortave, për ta kontrolluar rozën e markës në makinë. Vijmë dy veta.',
  },
  {
    id: 106, hours: 96, type: 'quote', status: 'contacted', client: 'elegance', service: SVC.bag, productId: 'p-qese-luksoze',
    message: 'Për sezonin e festave na duhen qese luksoze me laminim mat, dorezë litari dhe logo me folje ari. 2.000 copë, madhësia L.',
    specs: { product: 'bag', size: '32 × 12 × 42 cm', material: 'Art letër 170 g + laminim mat', quantity: 2000, colours: '1 Pantone (Black 6 C)', finishes: ['Folje ari', 'Dorezë litari pambuku'], deadlineIn: 45, files: [{ name: 'elegance-logo-vector.pdf', size: Math.round(0.9 * MB) }] },
  },
  {
    id: 107, hours: 118, type: 'contact', status: 'contacted', name: 'Lukas Meier', company: 'Alpenkiste GmbH', city: 'Zürich', phone: '+41 79 418 22 63', service: SVC.box, productId: 'p-kuti-mailer',
    message: 'Hello, we are a Swiss e-commerce brand looking for about 5,000 printed mailer boxes per quarter. Do you ship to Switzerland, and can you prepare the customs documents?',
  },
  {
    id: 108, hours: 140, type: 'quote', status: 'scheduled', name: 'Ardian Kryeziu', company: 'Grill House Kosova', city: 'Prishtinë', service: SVC.food, productId: 'p-tabaka-doreze',
    message: 'Po kalojmë nga ambalazhi plastik në karton për 6 lokale. Na duhet tabaka me dorezë dhe kuti për menu familjare, me barrierë ndaj yndyrës. Dëshirojmë edhe një takim për mostrat.',
    specs: { product: 'food', size: 'Tabaka 180 × 120 × 50 mm + kuti 200 × 200 × 80 mm', material: 'Kraft natyral me barrierë ndaj yndyrës', quantity: 30000, colours: '2 Pantone', finishes: ['Pa plastikë', 'Llak dispersion'], deadlineIn: 21 },
  },
  {
    id: 109, hours: 165, type: 'measurement', status: 'scheduled', client: 'ulliri-bregut', service: SVC.label, productId: 'p-etiketa-vaj', preferredIn: 6,
    message: 'Ju ftojmë për një takim në Vlorë për etiketat e reja dhe kutitë e dhuratave për vajin e ullirit — duam të shohim mostrat e letrës së strukturuar.',
  },
  {
    id: 110, hours: 215, type: 'quote', status: 'done', client: 'pixel-co', service: SVC.promo, productId: 'p-katalog',
    message: 'Katalog për një klient tonë: A4, 48 faqe + kopertinë, ngjitje PUR, soft-touch në kopertinë. Tirazh 1.500 copë, na duhet për panair.',
    specs: { product: 'print', size: 'A4 (210 × 297 mm), 48 + 4 faqe', material: 'Art mat 150 g, kopertinë 300 g', quantity: 1500, colours: 'CMYK 4/4', finishes: ['Ngjitje PUR', 'Soft-touch në kopertinë'], deadlineIn: -2, files: [{ name: 'katalog-2026-final.pdf', size: Math.round(84.6 * MB) }] },
  },
  {
    id: 111, hours: 262, type: 'quote', status: 'done', client: 'lumi-pharma', service: SVC.box, productId: 'p-kuti-farmaceutike',
    message: 'Kuti për 4 suplemente të reja, me Braille dhe pharmacode. Na duhet dokumentacioni i materialit dhe mostra për validim para tirazhit.',
    specs: { product: 'box', size: '62 × 22 × 105 mm', material: 'GC2 350 g', quantity: 40000, colours: 'CMYK + 1 Pantone', finishes: ['Braille', 'Pharmacode', 'Llak mat'], deadlineIn: 12, files: [{ name: 'lumi-4sku-dielines.pdf', size: Math.round(4.1 * MB) }, { name: 'braille-tekstet.xlsx', size: 48200 }] },
  },
  {
    id: 112, hours: 330, type: 'contact', status: 'done', client: 'optika-vizion', service: SVC.bag,
    message: 'A mund ta marr porosinë vetë në fabrikë të shtunën paradite? Jam në Prishtinë atë ditë.',
  },
  {
    id: 113, hours: 430, type: 'measurement', status: 'done', client: 'kutia-dhuratave', service: SVC.box, productId: 'p-kuti-mailer', preferredIn: -12,
    message: 'Kërkojmë një konsultë për kutitë mailer me printim brenda dhe jashtë — duam t’i shohim materialet para se të vendosim.',
  },
  {
    id: 114, hours: 530, type: 'quote', status: 'done', client: 'kakao-lab', service: SVC.box, productId: 'p-kuti-cokollate',
    message: 'Kuti me sirtar për pralina, me ndarje për 12 copë dhe logo me folje. Rreth 2.000 copë para festave.',
    specs: { product: 'box', size: '160 × 90 × 25 mm', material: 'Karton i fortë 1,5 mm i veshur me letër', quantity: 2000, colours: '1 Pantone + folje', finishes: ['Folje ari', 'Insert me 12 ndarje'], deadlineIn: 30 },
  },
  {
    id: 115, hours: 620, type: 'contact', status: 'done', client: 'forno-rosso', service: SVC.food,
    message: 'Na duhen faturat me NUI për porositë e shtatorit, të ndara sipas dy lokaleve. Faleminderit!',
  },
];

export function generateInquiries(now = new Date(), seed = 7): Inquiry[] {
  const r = rng(seed);
  const day = (n: number) => new Date(now.getTime() + n * DAY).toISOString().slice(0, 10);
  return INQ.map((q): Inquiry => {
    const created = new Date(now.getTime() - q.hours * HOUR - Math.floor(r() * 40) * 60000);
    const c = q.client ? clientCustomer(q.client) : null;
    const name = c ? `${c.firstName} ${c.lastName}` : q.name!;
    const city = c?.city ?? q.city;
    const { deadlineIn, ...specs } = q.specs ?? ({ product: '' } as NonNullable<InqSeed['specs']>);
    return {
      id: `inq_${q.id}`,
      createdAt: created.toISOString(),
      type: q.type,
      name,
      phone: c?.phone ?? q.phone ?? phoneFor(name, city ?? 'Prishtinë'),
      email: c?.email ?? (q.name ? emailOf(q.name.split(' ')[0], q.name.split(' ').slice(1).join(' ')) : undefined),
      city,
      ...(c?.company ?? q.company ? { company: c?.company ?? q.company } : {}),
      service: q.service,
      productId: q.productId,
      message: q.message,
      preferredDate: q.preferredIn != null ? day(q.preferredIn) : undefined,
      status: q.status,
      seen: q.status !== 'new',
      ...(q.specs ? { specs: { ...specs, ...(deadlineIn != null ? { deadline: day(deadlineIn) } : {}) } as RfqSpecs } : {}),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
