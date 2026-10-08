// Realistic demo activity (orders + inquiries) so the CMS dashboard looks alive.
// Deterministic for a given seed, always relative to "now". Paketoje sells by the pack to Kosovo
// businesses (cafés, fast food, pastry shops, sushi, catering) and to private customers.
import type { CartItem, Collection, Customer, Discount, Inquiry, Lang, Order, OrderEvent, OrderStatus, PaymentMethod, Product, Settings } from '@/lib/types';
import { priceCart, defaultOptions } from '@/lib/pricing';
import { inCollection } from '@/lib/collections';
import { lt } from '@/i18n';
import { pick, rng, slugify, weighted } from '@/lib/utils';

const DAY = 86400000;

/* ================================================================== */
/* Customers                                                           */
/* ================================================================== */
type Kind = 'cafe' | 'smoothie' | 'fastfood' | 'restaurant' | 'pastry' | 'icecream' | 'sushi' | 'catering' | 'party' | 'home';

/** Business customers (invented, generic venue names): [first, last, company, kind, city, street, lang, NUI, phone, order frequency] */
const BUSINESSES: [string, string, string, Kind, string, string, Lang, string, string, number][] = [
  ['Arbër', 'Bytyqi', 'Kafiteria Lumi', 'cafe', 'Mitrovicë', 'Rr. Mbretëresha Teutë 14', 'sq', '811402375', '+383 44 512 803', 5],
  ['Fisnik', 'Rexhepi', 'Fast Food Te Ura', 'fastfood', 'Mitrovicë', 'Rr. Adem Jashari 32', 'sq', '811230984', '+383 49 207 615', 4],
  ['Mimoza', 'Kastrati', 'Pastiçeria Ëmbëlsira', 'pastry', 'Mitrovicë', 'Rr. Isa Boletini 7', 'sq', '810977341', '+383 44 830 126', 4],
  ['Dardan', 'Ahmeti', 'Bar Kafe Sheshi', 'cafe', 'Prishtinë', 'Bulevardi Nënë Tereza 21', 'sq', '811576620', '+383 45 611 470', 4],
  ['Liridon', 'Mustafa', 'Burger Point', 'fastfood', 'Prishtinë', 'Rr. Agim Ramadani 45', 'sq', '', '+383 44 309 552', 3],
  ['Kaltrina', 'Hyseni', 'Smoothie Bar Fresh', 'smoothie', 'Prishtinë', 'Bulevardi Bill Clinton 88', 'sq', '811690213', '+383 49 725 018', 3],
  ['Valmir', 'Osmani', 'Restorant Te Kroni', 'restaurant', 'Vushtrri', 'Rr. Dëshmorët e Kombit 12', 'sq', '810854402', '+383 44 146 239', 2.5],
  ['Edona', 'Zeqiri', 'Akullore Dolce', 'icecream', 'Mitrovicë', 'Rr. Ismail Qemali 3', 'sq', '', '+383 45 270 884', 2.5],
  ['Kushtrim', 'Kelmendi', 'Sushi Bar Hana', 'sushi', 'Prishtinë', 'Rr. Fehmi Agani 19', 'sq', '811745518', '+383 44 958 307', 2],
  ['Agron', 'Haliti', 'Catering Festa', 'catering', 'Prishtinë', 'Rr. Rexhep Luci 6', 'sq', '811333270', '+383 49 384 661', 2.5],
  ['Blerina', 'Jashari', 'Kafe Bar Ibri', 'cafe', 'Mitrovicë', 'Rr. Nënë Tereza 18', 'sq', '', '+383 44 677 145', 3],
  ['Shpend', 'Bajrami', 'Qebaptore Tradita', 'restaurant', 'Skenderaj', 'Rr. Adem Jashari 101', 'sq', '', '+383 45 803 592', 1.5],
  ['Granit', 'Ramadani', 'Piceria Napoli', 'fastfood', 'Vushtrri', 'Rr. Skënderbeu 22', 'sq', '810612099', '+383 44 221 908', 2],
  ['Fjolla', 'Musliu', 'Pastiçeri Mjaltë', 'pastry', 'Prishtinë', 'Rr. Luan Haradinaj 9', 'sq', '811918064', '+383 49 560 237', 2],
  ['Ermal', 'Fazliu', 'Kafiteria Kalaja', 'cafe', 'Prizren', 'Rr. Adem Jashari 4', 'sq', '', '+383 44 718 460', 1.5],
  ['Labinot', 'Rama', 'Fast Food Kroni', 'fastfood', 'Ferizaj', 'Rr. Dëshmorët e Kombit 56', 'sq', '', '+383 45 437 019', 1.5],
  ['Nemanja', 'Jovanović', 'Kafić Centar', 'cafe', 'Mitrovicë', 'Ul. Kralja Petra I 41', 'me', '', '+383 44 390 572', 3],
  ['Jelena', 'Petrović', 'Poslastičarnica Slatko', 'pastry', 'Mitrovicë', 'Ul. Kneza Miloša 12', 'me', '811520387', '+383 45 618 204', 2],
  ['Dušan', 'Nikolić', 'Picerija Kod Mosta', 'fastfood', 'Mitrovicë', 'Ul. Kralja Petra I 8', 'me', '', '+383 44 802 316', 2],
  ['Milica', 'Stojanović', 'Kafe Lipa', 'cafe', 'Graçanicë', 'Ul. Kralja Milutina 27', 'me', '', '+383 49 145 730', 1.5],
  ['Marko', 'Ilić', 'Roštilj Kutak', 'restaurant', 'Zveçan', 'Ul. Nemanjina 15', 'me', '', '+383 44 563 981', 1.5],
  ['Besarta', 'Salihu', 'Kafe Bar Rruga', 'cafe', 'Fushë Kosovë', 'Rr. Nënë Tereza 140', 'sq', '', '+383 45 902 615', 1.5],
  ['Lulzim', 'Halimi', 'Fast Food Ama', 'fastfood', 'Podujevë', 'Rr. Zahir Pajaziti 33', 'sq', '', '+383 44 274 508', 1],
  ['Dafina', 'Mehmeti', 'Akullore Bora', 'icecream', 'Pejë', 'Rr. Mbretëresha Teutë 10', 'sq', '', '+383 49 631 274', 1],
  ['Visar', 'Islami', 'Restorant Bujana', 'restaurant', 'Gjilan', 'Rr. Adem Jashari 77', 'sq', '810455761', '+383 44 185 649', 1],
  ['Rina', 'Beqiri', 'Kafe Libraria', 'cafe', 'Gjakovë', 'Rr. Nënë Tereza 31', 'sq', '', '+383 45 726 381', 1],
  ['Egzon', 'Limani', 'Byrektore Mëngjesi', 'restaurant', 'Lipjan', 'Rr. Skënderbeu 5', 'sq', '', '+383 44 497 120', 1],
  ['Faton', 'Selimi', 'Sushi & Poke Koi', 'sushi', 'Prishtinë', 'Rr. Garibaldi 11', 'sq', '811265430', '+383 49 852 063', 1.5],
  ['Zana', 'Sadiku', 'Ëmbëltore Vanilje', 'pastry', 'Vushtrri', 'Rr. Hasan Prishtina 16', 'sq', '', '+383 44 360 795', 1.5],
  ['Mentor', 'Qerimi', 'Kafe Lounge Ura', 'cafe', 'Mitrovicë', 'Rr. Agim Ramadani 2', 'sq', '811004862', '+383 45 211 486', 2.5],
  ['Drilon', 'Kryeziu', 'Catering Gëzimi', 'catering', 'Mitrovicë', 'Rr. Skënderbeu 9', 'sq', '810731558', '+383 44 648 352', 2],
  ['Leonora', 'Avdiu', 'Coffee Lab', 'cafe', 'Prishtinë', 'Rr. Tirana 34', 'en', '811884207', '+383 49 307 916', 2],
  ['Endrit', 'Tahiri', 'Green Bowl', 'restaurant', 'Prishtinë', 'Rr. UÇK 52', 'en', '', '+383 44 915 274', 1.5],
  ['Arlind', 'Maloku', 'Fast Food Drenica', 'fastfood', 'Drenas', 'Rr. Skënderbeu 61', 'sq', '', '+383 45 164 830', 1],
  ['Bujar', 'Spahiu', 'Kafiteria Parku', 'cafe', 'Vushtrri', 'Rr. Adem Jashari 9', 'sq', '', '+383 44 539 207', 1.5],
  ['Ivana', 'Savić', 'Pekara Zlatno Zrno', 'pastry', 'Graçanicë', 'Ul. Kralja Milutina 3', 'me', '', '+383 45 482 619', 1],
];

const SQ_FIRST = ['Arben', 'Blerim', 'Ilir', 'Gëzim', 'Kreshnik', 'Agim', 'Naim', 'Burim', 'Artan', 'Ardian', 'Besim', 'Leutrim', 'Rinor', 'Albana', 'Vlora', 'Lindita', 'Shqipe', 'Hana', 'Erza', 'Merita', 'Diellza', 'Elona', 'Florentina', 'Jeta'];
const SQ_LAST = ['Hajdari', 'Gjinovci', 'Rexha', 'Smajli', 'Zymberi', 'Behrami', 'Uka', 'Murati', 'Latifi', 'Ibrahimi', 'Bislimi', 'Shabani', 'Kurteshi', 'Dervishi', 'Avdyli', 'Hoti', 'Vitia', 'Lila', 'Mulliqi', 'Gjocaj', 'Fetahu', 'Ismaili', 'Durmishi'];
const SR_FIRST = ['Nikola', 'Stefan', 'Milan', 'Dragan', 'Ana', 'Sanja', 'Vesna', 'Nenad', 'Snežana', 'Miloš', 'Tijana'];
const SR_LAST = ['Simić', 'Todorović', 'Pavlović', 'Lazić', 'Đokić', 'Milić', 'Radić', 'Stanković', 'Mitić', 'Živković'];

/** Private customers' cities — weighted towards Mitrovicë and Prishtinë (all from the shipping zones). */
const SQ_CITIES: (readonly [string, number])[] = [
  ['Mitrovicë', 30], ['Prishtinë', 26], ['Vushtrri', 7], ['Skenderaj', 3], ['Fushë Kosovë', 5], ['Podujevë', 3], ['Ferizaj', 4], ['Prizren', 4],
  ['Pejë', 3], ['Gjilan', 3], ['Gjakovë', 3], ['Lipjan', 2], ['Drenas', 2], ['Obiliq', 2], ['Istog', 1], ['Suharekë', 1],
];
const SR_CITIES: (readonly [string, number])[] = [['Mitrovicë', 5], ['Zveçan', 3], ['Graçanicë', 3], ['Leposaviq', 1]];

const STREETS: Record<string, string[]> = {
  Mitrovicë: ['Rr. Mbretëresha Teutë', 'Rr. Adem Jashari', 'Rr. Isa Boletini', 'Rr. Skënderbeu', 'Rr. Nënë Tereza', 'Rr. Agim Ramadani'],
  Prishtinë: ['Bulevardi Bill Clinton', 'Bulevardi Nënë Tereza', 'Rr. Agim Ramadani', 'Rr. Garibaldi', 'Rr. Fehmi Agani', 'Rr. Rexhep Luci', 'Rr. Tirana', 'Rr. UÇK'],
  Zveçan: ['Ul. Nemanjina', 'Ul. Kralja Milana'],
  Graçanicë: ['Ul. Kralja Milutina', 'Ul. Vidovdanska'],
  Leposaviq: ['Ul. Nemanjina'],
};
const GENERIC_STREETS = ['Rr. Adem Jashari', 'Rr. Skënderbeu', 'Rr. Nënë Tereza', 'Rr. Dëshmorët e Kombit', 'Rr. Isa Boletini', 'Rr. Hasan Prishtina'];
const NORTH_STREETS = ['Ul. Kralja Petra I', 'Ul. Kneza Miloša', 'Ul. Čika Jovina'];

interface Buyer {
  c: Customer;
  kind: Kind;
  lang: Lang;
  business: boolean;
  freq: number;
  /** Days ago the customer could first order (new B2B customers join during the period) */
  since: number;
}

const phoneOf = (r: () => number) => `+383 4${pick(['4', '4', '9', '5', '3'], r)} ${String(Math.floor(r() * 900) + 100)} ${String(Math.floor(r() * 900) + 100)}`;

function businessBuyers(r: () => number, days: number): Buyer[] {
  return BUSINESSES.map(([firstName, lastName, company, kind, city, address, lang, nui, phone, freq], i) => ({
    c: { firstName, lastName, company, email: `${slugify(company).replace(/-/g, '')}@example.com`, phone, city, address, ...(nui ? { pib: nui } : {}) },
    kind,
    lang,
    business: true,
    freq,
    // regular customers are there from the start; a few smaller ones joined recently
    since: freq >= 2 || i % 3 === 0 ? days : 12 + Math.floor(r() * (days - 20)),
  }));
}

function privateBuyer(r: () => number): Buyer {
  const sr = r() < 0.18;
  const firstName = pick(sr ? SR_FIRST : SQ_FIRST, r);
  const lastName = pick(sr ? SR_LAST : SQ_LAST, r);
  const city = weighted(sr ? SR_CITIES : SQ_CITIES, r);
  const streets = sr && city === 'Mitrovicë' ? NORTH_STREETS : STREETS[city] ?? GENERIC_STREETS;
  return {
    c: { firstName, lastName, email: `${slugify(firstName)}.${slugify(lastName)}@example.com`, phone: phoneOf(r), city, address: `${pick(streets, r)} ${Math.floor(r() * 140) + 1}` },
    kind: r() < 0.6 ? 'party' : 'home',
    lang: sr ? (r() < 0.9 ? 'me' : 'sq') : weighted([['sq', 12], ['en', 1]] as const, r),
    business: false,
    freq: 1,
    since: 0,
  };
}

/* ================================================================== */
/* Baskets — what each kind of venue typically orders (in packs)        */
/* ================================================================== */
type W = readonly (readonly [number, number])[];
type WS = readonly (readonly [string, number])[];
const CUP_QTY: W = [[4, 2], [5, 1], [6, 2], [8, 1], [10, 3], [20, 5], [40, 1]];
const SMALL: W = [[1, 3], [2, 3], [3, 1]];

function basket(kind: Kind, r: () => number, ageDays: number): CartItem[] {
  const lines = new Map<string, CartItem>();
  const add = (id: string, qty: number, print = false) => {
    const q = Math.min(40, Math.max(1, Math.round(qty)));
    const cur = lines.get(id);
    if (cur) cur.qty = Math.min(40, cur.qty + q);
    else lines.set(id, { key: '', productId: id, qty: q, options: {}, installation: print });
  };
  const chance = (p: number) => r() < p;
  const q = (list: W) => weighted(list, r);
  const one = (list: WS) => weighted(list, r);
  const fork = ageDays > 55 && chance(0.5) ? 'p-pirun-bardhe-100' : 'p-pirun-bardhe';
  // logo orders cluster in the recent weeks (new season menus), so the "Në printim" stage is visible
  const printBoost = ageDays > 1 && ageDays < 12 ? 3 : 1;

  /** 1–2 cup sizes; ~10 % of cup lines are printed with the venue's logo (min. one carton). Returns packs. */
  const cups = (sizes: WS, qty: W, printChance: number, two = 0.4) => {
    let total = 0;
    const n = chance(two) ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const id = one(sizes);
      if (lines.has(id)) continue;
      let packs = q(qty);
      const print = chance(printChance * printBoost);
      if (print) packs = chance(0.7) ? 20 : 40;
      add(id, packs, print);
      total += packs;
    }
    return total;
  };
  /** Lids and straws to match the cups piece for piece (cups 50/pack, lids 100/pack, straws 500/pack). */
  const lidsFor = (cupPacks: number, types: WS, p = 0.85) => {
    if (cupPacks && chance(p)) add(one(types), Math.max(1, Math.ceil(cupPacks / 2)));
  };
  const strawsFor = (cupPacks: number, p: number) => {
    if (cupPacks && chance(p)) add(chance(0.65) ? 'p-shkop-24' : 'p-shkop-22', Math.max(1, Math.round(cupPacks / 10)));
  };
  const COLD_LIDS = [['p-kapak-kupole', 4], ['p-kapak-clip', 2], ['p-kapak-sheshte', 2]] as const;
  const SETS = [['p-set-ps-zi', 4], ['p-set-pp-zi', 2], ['p-set-lux-zi', 1], ['p-set-ps-bardhe', 1]] as const;

  switch (kind) {
    case 'cafe': {
      const n = cups([['p-gota-f95-400', 5], ['p-gota-f95-500', 3], ['p-gota-f95-300', 2], ['p-gota-f95-350', 2], ['p-gota-f95-250', 1.5]], CUP_QTY, 0.14);
      lidsFor(n, COLD_LIDS);
      strawsFor(n, 0.65);
      if (chance(0.45)) add(chance(0.6) ? 'p-luge-kafe-standard' : 'p-luge-kafe-gjate', q(SMALL));
      break;
    }
    case 'smoothie': {
      const n = cups([['p-gota-f95-500', 5], ['p-gota-f95-400', 3]], CUP_QTY, 0.14);
      lidsFor(n, [['p-kapak-kupole', 5], ['p-kapak-clip', 1]], 0.95);
      if (n && chance(0.9)) add('p-shkop-24', Math.max(1, Math.round(n / 10)));
      if (chance(0.2)) add('p-gote-ps', q([[2, 2], [5, 1]]));
      break;
    }
    case 'fastfood': {
      if (chance(0.55)) add('p-kuti-dy-ndarje', q([[2, 3], [3, 2], [6, 4], [12, 1]]));
      if (chance(0.55)) add(one([['p-ene-mikrovale-750', 3], ['p-ene-mikrovale-500', 2]]), q([[2, 3], [4, 3], [5, 1], [10, 3], [20, 0.5]]));
      if (chance(0.8)) {
        const big = chance(0.4);
        add(big ? 'p-salce-2oz' : 'p-salce-1oz', q([[2, 2], [3, 2], [5, 3], [10, 2], [25, 2]]));
        if (chance(0.25)) add(big ? 'p-salce-1oz' : 'p-salce-2oz', q([[2, 2], [5, 2]]));
      }
      if (chance(0.45)) add(one(SETS), q([[1, 3], [2, 3], [5, 3], [10, 0.5]]));
      if (chance(0.25)) add(fork, q([[4, 2], [10, 3], [40, 1]]));
      if (chance(0.2)) {
        const n = q([[4, 1], [10, 2], [20, 1]]);
        add('p-gota-f95-300', n);
        lidsFor(n, [['p-kapak-sheshte', 1]], 0.8);
      }
      break;
    }
    case 'restaurant': {
      if (chance(0.8)) add(one([['p-ene-mikrovale-750', 3], ['p-ene-mikrovale-500', 2]]), q([[2, 3], [4, 3], [10, 3], [20, 0.5]]));
      if (chance(0.35)) add(chance(0.5) ? 'p-ene-sallate-750' : 'p-ene-sallate-1000', q([[2, 3], [3, 2], [6, 3]]));
      if (chance(0.6)) add(chance(0.6) ? 'p-salce-1oz' : 'p-salce-2oz', q([[2, 2], [5, 3], [10, 2]]));
      if (chance(0.35)) add(one(SETS), q([[1, 3], [2, 2], [5, 2]]));
      if (chance(0.4)) {
        const n = q([[4, 2], [10, 2], [40, 1]]);
        add(fork, n);
        add('p-thike-bardhe', n);
      }
      if (chance(0.15)) add('p-ene-sushi-500', q([[2, 2], [6, 1]]));
      if (chance(0.3)) add('p-kuti-dy-ndarje', q([[2, 2], [6, 2]]));
      break;
    }
    case 'pastry': {
      if (chance(0.7)) {
        const n = chance(0.35) ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const id = one([['p-gote-venus', 3], ['p-gote-ps', 3], ['p-gote-bodega-250', 2]]);
          if (lines.has(id)) continue;
          const print = id === 'p-gote-bodega-250' && chance(0.12 * printBoost);
          const packs = print ? 20 : q([[2, 3], [4, 3], [5, 2], [10, 3], [20, 0.5]]);
          add(id, packs, print);
          if (id === 'p-gote-bodega-250' && chance(0.7)) add('p-kapak-bodega', Math.max(1, Math.ceil(packs / 2)));
        }
      }
      if (ageDays > 10 ? chance(0.5) : chance(0.2)) add('p-kuti-torte-230', ageDays > 10 ? q([[1, 3], [2, 3], [4, 2], [8, 1]]) : 1);
      if (chance(0.4)) add('p-ene-torte-kupole', q([[2, 3], [4, 2], [8, 2]]));
      if (chance(0.55)) add('p-kuti-trekendeshe-gold', q([[2, 3], [5, 3], [10, 3]]));
      if (chance(0.3)) add('p-luge-akullore-roze', q([[2, 2], [5, 2], [10, 1]]));
      if (chance(0.12)) add('p-gota-f95-300', q([[4, 1], [10, 1]]));
      break;
    }
    case 'icecream': {
      if (chance(0.85)) add('p-luge-akullore-roze', q([[5, 3], [10, 3], [20, 2]]));
      if (ageDays > 14 && chance(0.35)) add('p-luge-akullore-lux', q([[1, 3], [2, 2], [5, 1]]));
      if (chance(0.5)) add(chance(0.5) ? 'p-gote-ps' : 'p-gote-venus', q([[2, 3], [5, 2], [10, 2]]));
      if (chance(0.35)) {
        const n = cups([['p-gota-f95-300', 2], ['p-gota-f95-400', 2]], [[4, 2], [10, 2], [20, 1]], 0.05, 0.1);
        lidsFor(n, [['p-kapak-kupole', 1]]);
        strawsFor(n, 0.5);
      }
      break;
    }
    case 'sushi': {
      if (chance(0.85)) add('p-ene-sushi-mesme', q([[4, 3], [6, 2], [12, 3]]));
      if (chance(0.6)) add('p-ene-sushi-500', q([[2, 3], [6, 2], [12, 2]]));
      if (chance(0.85)) add('p-salce-1oz', q([[2, 2], [5, 3], [10, 2]]));
      if (chance(0.3)) add('p-ene-sallate-750', q([[2, 2], [6, 2]]));
      if (chance(0.2)) add('p-set-ps-zi', q([[1, 2], [2, 1]]));
      break;
    }
    case 'catering': {
      if (chance(0.8)) add(one([['p-set-ps-bardhe', 3], ['p-set-ps-zi', 2], ['p-set-lux-zi', 1]]), q([[2, 2], [5, 4], [10, 2]]));
      if (chance(0.7)) {
        const n = cups([['p-gota-f95-300', 3], ['p-gota-f95-250', 2]], [[10, 2], [20, 4], [40, 2]], 0.05, 0.2);
        lidsFor(n, [['p-kapak-sheshte', 1]], 0.3);
      }
      if (chance(0.55)) add('p-ene-mikrovale-750', q([[4, 2], [10, 3], [20, 1]]));
      if (chance(0.45)) add('p-kuti-dy-ndarje', q([[3, 2], [6, 3], [12, 1]]));
      if (chance(0.35)) add('p-ene-sallate-1000', q([[2, 2], [6, 2]]));
      if (chance(0.45)) add(fork, q([[4, 2], [10, 2], [40, 1]]));
      if (chance(0.45)) add('p-thike-bardhe', q([[4, 2], [10, 2], [40, 1]]));
      if (chance(0.3)) add('p-luge-bardhe', q([[4, 2], [10, 2]]));
      if (chance(0.35)) add('p-salce-1oz', q([[2, 2], [5, 2]]));
      if (chance(0.15)) add('p-kuti-trekendeshe-gold', q([[5, 1], [10, 1]]));
      break;
    }
    case 'party': {
      if (chance(0.75)) {
        const n = cups([['p-gota-f95-300', 3], ['p-gota-f95-400', 2], ['p-gota-f95-250', 2]], [[1, 3], [2, 3], [4, 1]], 0, 0.15);
        lidsFor(n, COLD_LIDS, 0.3);
        if (n && chance(0.3)) add('p-shkop-22', 1);
      }
      if (chance(0.5)) add(fork, q(SMALL));
      if (chance(0.45)) add('p-thike-bardhe', q(SMALL));
      if (chance(0.35)) add('p-luge-bardhe', q(SMALL));
      if (chance(0.2)) add('p-set-ps-zi', 1);
      if (chance(0.2)) add('p-salce-1oz', 1);
      if (chance(0.15)) add('p-kuti-dy-ndarje', 1);
      break;
    }
    case 'home': {
      if (ageDays > 10 ? chance(0.5) : chance(0.15)) add('p-kuti-torte-230', 1);
      if (chance(0.4)) add('p-ene-torte-kupole', q([[1, 2], [2, 1]]));
      if (chance(0.35)) add('p-kuti-trekendeshe-gold', q([[1, 2], [2, 1]]));
      if (chance(0.5)) add(chance(0.5) ? 'p-gote-venus' : 'p-gote-ps', q([[1, 2], [2, 1]]));
      if (chance(0.35)) add(chance(0.5) ? 'p-ene-mikrovale-500' : 'p-ene-mikrovale-750', q([[1, 2], [2, 1]]));
      if (chance(0.2)) add('p-ene-sallate-750', 1);
      break;
    }
  }
  if (!lines.size) {
    const fallback: Record<Kind, [string, number]> = {
      cafe: ['p-gota-f95-400', 10], smoothie: ['p-gota-f95-500', 10], fastfood: ['p-salce-1oz', 5], restaurant: ['p-ene-mikrovale-750', 4], pastry: ['p-kuti-trekendeshe-gold', 5],
      icecream: ['p-luge-akullore-roze', 10], sushi: ['p-ene-sushi-mesme', 6], catering: ['p-set-ps-bardhe', 5], party: ['p-gota-f95-300', 2], home: ['p-ene-torte-kupole', 1],
    };
    add(...fallback[kind]);
  }
  return [...lines.values()];
}

/* ================================================================== */
/* Order lifecycle                                                     */
/* ================================================================== */
/** Standard flow, and the logo-print flow where "Në printim" (status 'installation') comes before shipping. */
const FLOW: OrderStatus[] = ['new', 'confirmed', 'processing', 'shipped', 'completed'];
const FLOW_PRINT: OrderStatus[] = ['new', 'confirmed', 'processing', 'installation', 'shipped', 'completed'];

function statusFor(ageDays: number, print: boolean, r: () => number): OrderStatus {
  if (ageDays < 0.5) return r() < 0.7 ? 'new' : 'confirmed';
  if (print) {
    // logo print: proof approval, then 7–10 working days in production
    if (ageDays < 2) return weighted([['confirmed', 3], ['processing', 3]] as const, r);
    if (ageDays < 10) return weighted([['installation', 6], ['processing', 1]] as const, r);
    if (ageDays < 14) return weighted([['installation', 1], ['shipped', 3], ['completed', 2]] as const, r);
    return weighted([['completed', 15], ['cancelled', 0.5]] as const, r);
  }
  if (ageDays < 1.5) return weighted([['confirmed', 4], ['processing', 3], ['new', 1]] as const, r);
  if (ageDays < 4) return weighted([['processing', 2], ['shipped', 5], ['completed', 3], ['cancelled', 0.3]] as const, r);
  if (ageDays < 10) return weighted([['shipped', 1], ['completed', 8], ['cancelled', 0.4]] as const, r);
  return weighted([['completed', 18], ['cancelled', 0.8]] as const, r);
}

/** Hours after the order each step happens (delivery: Mitrovicë 24h, Prishtinë 1–2 days, rest of Kosovo 1–3 days). */
function stepHours(flow: OrderStatus[], city: string, pickup: boolean, r: () => number): number[] {
  const near = ['Mitrovicë', 'Vushtrri', 'Skenderaj', 'Zveçan'].includes(city);
  const transit = pickup ? 3 + r() * 20 : near ? 6 + r() * 14 : 18 + r() * 40;
  if (flow === FLOW_PRINT) {
    const production = (9 + r() * 4) * 24; // 7–10 working days
    return [0, 1 + r() * 2, 20 + r() * 10, 30 + r() * 10, production, production + transit];
  }
  const shipped = 18 + r() * 8;
  return [0, 0.5 + r() * 2, 3 + r() * 4, shipped, shipped + transit];
}

const PRINT_NOTES = [
  'Logo e dërguar me e-mail (PDF vektor) — printim 1 ngjyrë.',
  'Dizajni provë u aprovua në telefon — printim 2 ngjyra, logo në qendër.',
  'Logo nga porosia e kaluar — e njëjta klishe, ngjyra Pantone e njëjtë.',
];

/**
 * Orders over the last 120 days. Every cart goes through the real pricing + discount engine with the
 * order date as "now", so automatic rules only apply inside their window (e.g. the cold-drinks promo) and
 * the welcome code works once per customer.
 */
export function generateOrders(products: Product[], settings: Settings, discounts: Discount[], collections: Collection[], now = new Date(), seed = 42): Order[] {
  const r = rng(seed);
  const DAYS = 120;
  const byId = new Map(products.map((p) => [p.id, p]));
  const businesses = businessBuyers(r, DAYS);
  const privates: Buyer[] = [];
  const usedBy = new Map<string, Set<string>>();
  const orders: Order[] = [];

  for (let day = DAYS; day >= 0; day--) {
    // gentle growth trend + weekly rhythm (quiet Sundays, half Saturdays)
    const date = new Date(now.getTime() - day * DAY);
    const dow = date.getDay();
    const base = 0.8 + ((DAYS - day) / DAYS) * 1.4;
    const mean = dow === 0 ? base * 0.25 : dow === 6 ? base * 0.7 : base;
    let count = 0;
    const x0 = r();
    let p = Math.exp(-mean);
    let cdf = p;
    while (x0 > cdf && count < 6) {
      count++;
      p = (p * mean) / count;
      cdf += p;
    }
    if (day === 0) count = Math.max(count, 4);

    for (let i = 0; i < count; i++) {
      // who orders: ~80 % of orders come from businesses (regulars reorder every couple of weeks)
      let buyer: Buyer;
      const eligible = businesses.filter((b) => b.since >= day);
      if (r() < 0.8 && eligible.length) buyer = weighted(eligible.map((b) => [b, b.freq] as const), r);
      else if (privates.length > 5 && r() < 0.12) buyer = pick(privates, r);
      else {
        buyer = privateBuyer(r);
        privates.push(buyer);
      }
      const cust = { ...buyer.c };

      const hour = buyer.business ? 7 + Math.floor(r() * 11) : 9 + Math.floor(r() * 13);
      const created = new Date(date);
      created.setHours(hour, Math.floor(r() * 60), Math.floor(r() * 60), 0);
      if (created > now) created.setTime(now.getTime() - (i + 1) * 47 * 60000);
      const ageDays = (now.getTime() - created.getTime()) / DAY;

      const cart = basket(buyer.kind, r, ageDays).filter((c) => byId.has(c.productId));
      for (const c of cart) c.options = defaultOptions(byId.get(c.productId)!);

      // shoppers following the "buy X get Y" promo add the free item themselves (manual mode)
      for (const d of discounts) {
        const b = d.bxgy;
        if (d.kind !== 'bxgy' || !b || d.method !== 'auto' || b.getScope !== 'products' || new Date(d.startsAt) > created || (d.endsAt && new Date(d.endsAt) <= created)) continue;
        const xQty = cart.filter((c) => b.buyScope === 'products' && b.buyIds.includes(c.productId)).reduce((n, c) => n + c.qty, 0);
        const y = byId.get(b.getIds[0]);
        if (y && xQty >= b.buyQty && !cart.some((c) => b.getIds.includes(c.productId)) && r() < 0.7) {
          cart.push({ key: '', productId: y.id, qty: b.getQty * Math.min(b.maxUses || 1, Math.floor(xQty / b.buyQty)), options: defaultOptions(y), installation: false });
        }
      }

      const print = cart.some((c) => c.installation);
      const near = ['Mitrovicë', 'Vushtrri', 'Skenderaj', 'Zveçan'].includes(cust.city);
      const delivery = r() < (near ? (buyer.business ? 0.15 : 0.3) : 0.04) ? 'pickup' : 'delivery';

      // codes people typed: the welcome code on a first order, or the code that was live that day
      const key = cust.email.toLowerCase();
      const used = usedBy.get(key) ?? new Set<string>();
      const firstOrder = !usedBy.has(key);
      const x = r();
      let couponCode: string | null = null;
      if (firstOrder && x < 0.4) couponCode = 'MIRESEERDHE';
      else if (x < 0.55) {
        const live = discounts.filter(
          (d) => d.method === 'code' && d.code && d.code !== 'MIRESEERDHE' && d.status === 'active' && d.audience.type === 'all' && new Date(d.startsAt) <= created && (!d.endsAt || new Date(d.endsAt) > created),
        );
        const fits = live.find(
          (d) => d.appliesTo.scope !== 'collections' || cart.some((c) => collections.some((col) => d.appliesTo.ids.includes(col.id) && inCollection(col, byId.get(c.productId)!))),
        );
        if (fits) couponCode = fits.code!;
      }

      const totals = priceCart(cart, products, settings, {
        lang: buyer.lang,
        couponCode,
        discounts,
        collections,
        delivery,
        city: cust.city,
        now: created,
        customer: { usedDiscountIds: [...used] },
      });

      const payMethod: PaymentMethod = buyer.business
        ? weighted([['cod', 4], ['bank', cust.pib ? 4 : 1.5], ['card', 1]] as const, r)
        : weighted([['cod', 6], ['card', 2.5], ['bank', 0.3]] as const, r);
      const status = statusFor(ageDays, print, r);
      const flow = print ? FLOW_PRINT : FLOW;

      const idx = flow.indexOf(status);
      const timeline: OrderEvent[] = [{ at: created.toISOString(), status: 'new', by: 'web' }];
      if (status === 'cancelled') {
        timeline.push({ at: new Date(created.getTime() + (2 + r() * 5) * 3600000).toISOString(), status: 'cancelled', note: 'Klienti anuloi me telefon', by: 'st-ardita' });
      } else if (idx > 0) {
        const hours = stepHours(flow, cust.city, delivery === 'pickup', r);
        // compress the schedule when the order is younger than its planned timeline
        const room = ageDays * 24 * 0.92;
        const k = hours[idx] > room ? room / hours[idx] : 1;
        const by: Partial<Record<OrderStatus, string>> = { confirmed: 'st-ardita', processing: 'st-valon', installation: 'st-teuta', shipped: 'st-valon', completed: 'st-valon' };
        const notes: Partial<Record<OrderStatus, string>> = print
          ? { processing: 'Dizajni provë u dërgua për aprovim', installation: 'Dizajni u aprovua — në printim' }
          : delivery === 'pickup'
            ? { shipped: 'Gati për marrje në depo' }
            : {};
        for (let s = 1; s <= idx; s++) {
          timeline.push({ at: new Date(created.getTime() + hours[s] * k * 3600000).toISOString(), status: flow[s], by: by[flow[s]], ...(notes[flow[s]] ? { note: notes[flow[s]] } : {}) });
        }
      }
      const paid = payMethod === 'card' ? true : payMethod === 'bank' ? idx >= 1 : status === 'completed';
      const shippedAt = timeline.find((e) => e.status === 'shipped')?.at;

      if (status !== 'cancelled') for (const a of totals.applied) used.add(a.id);
      usedBy.set(key, used);

      orders.push({
        id: '',
        number: '',
        createdAt: created.toISOString(),
        status,
        customer: cust,
        items: totals.lines.map((l) => ({
          productId: l.product.id,
          sku: l.product.sku,
          name: lt(l.product.name, buyer.lang),
          image: l.product.images[0] ?? '',
          unit: l.product.unit,
          packSize: l.product.packSize,
          qty: l.item.qty,
          options: l.optionsLabel,
          unitPrice: l.unitPrice,
          installation: l.item.installation,
          installationPrice: l.installationUnitPrice,
          lineTotal: l.lineTotal,
          ...(l.tierPct ? { tierPct: l.tierPct } : {}),
          discount: l.discount,
          allocations: l.allocations,
        })),
        delivery: { method: delivery, fee: totals.shipping },
        payment: { method: payMethod, status: status === 'cancelled' ? (paid && payMethod === 'card' ? 'refunded' : 'pending') : paid ? 'paid' : 'pending' },
        coupon: totals.coupon ? { code: totals.coupon.code, discount: totals.discount } : null,
        discounts: totals.applied,
        shippingBeforeDiscount: totals.shippingBeforeDiscount,
        subtotal: totals.subtotal,
        installationTotal: totals.installationTotal,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        vat: totals.vat,
        lang: buyer.lang,
        timeline,
        seen: ageDays > 0.5,
        demo: true,
        ...(buyer.business || print ? { tags: [...(buyer.business ? ['b2b'] : []), ...(print ? ['logo'] : [])] } : {}),
        ...(print ? { internalNote: pick(PRINT_NOTES, r) } : {}),
        ...(shippedAt ? { fulfillment: { shippedAt, ...(status === 'completed' ? { deliveredAt: timeline[timeline.length - 1].at } : {}) } } : {}),
      });
    }
  }
  // numbers follow the order date (PK-1001 is the oldest), newest first
  return orders
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((o, i) => ({ ...o, id: `o_${1001 + i}`, number: `PK-${1001 + i}` }))
    .reverse();
}

/* ================================================================== */
/* Inquiries — sample requests, wholesale / logo quotes, contact form   */
/* ================================================================== */
interface InqSeed {
  type: Inquiry['type'];
  service?: string;
  productId?: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  city: string;
  ageHours: number;
  status: Inquiry['status'];
  message: string;
}

const INQ: InqSeed[] = [
  {
    type: 'measurement', service: 'Gota & kapakë', name: 'Arianit Kelmendi', company: 'Kafiteria Arti', phone: '+383 44 218 774', email: 'kafiteria.arti@example.com', city: 'Vushtrri', ageHours: 2.5, status: 'new',
    message: 'Përshëndetje, po hapim një kafiteri të re në Vushtrri. A mund të na sillni mostra të gotave F95 400 dhe 500 ml me kapak kupolë? Faleminderit.',
  },
  {
    type: 'quote', service: 'Printim me logo', productId: 'p-gota-f95-400', name: 'Gentrit Hyseni', company: 'Bar Kafe Nata', phone: '+383 49 330 512', email: 'barkafe.nata@example.com', city: 'Prishtinë', ageHours: 9, status: 'new',
    message: 'Na duhen rreth 5.000 gota F95 400 ml me logon tonë (1 ngjyrë) për sezonin. Sa kushton printimi dhe sa ditë zgjat prodhimi?',
  },
  {
    type: 'contact', name: 'Ermira Hoti', phone: '+383 45 671 209', email: 'ermira.hoti@example.com', city: 'Prizren', ageHours: 30, status: 'contacted',
    message: 'A dërgoni edhe në Prizren? Sa ditë zgjat dërgesa për 2 kartona me gota 400 ml dhe a mund të paguaj me para në dorë?',
  },
  {
    type: 'measurement', service: 'Enë ushqimi', name: 'Valdrin Murati', company: 'Restorant Oda', phone: '+383 44 905 316', email: 'restorant.oda@example.com', city: 'Mitrovicë', ageHours: 40, status: 'scheduled',
    message: 'Restorant me dërgesa — dëshirojmë mostra nga enët për mikrovalë 500 dhe 750 ml dhe kutia me dy ndarje, para se të porosisim me karton.',
  },
  {
    type: 'quote', service: 'Shumicë', productId: 'p-salce-1oz', name: 'Albion Zymberi', company: 'Burger Station', phone: '+383 44 760 431', email: 'burger.station@example.com', city: 'Ferizaj', ageHours: 72, status: 'contacted',
    message: 'Kërkojmë ofertë shumice për gota salce 1 oz me kapak — rreth 20.000 copë në muaj, me dërgesë çdo dy javë. A keni çmim të veçantë për 8 kartona?',
  },
  {
    type: 'contact', name: 'Marija Lazić', phone: '+383 45 290 664', email: 'marija.lazic@example.com', city: 'Mitrovicë', ageHours: 96, status: 'done',
    message: 'Poštovani, da li imate kutije za tortu veće od 230 mm i kada stižu aluminijumske posude? Hvala unapred.',
  },
  {
    type: 'measurement', service: 'Ëmbëlsira', name: 'Shqipe Latifi', company: 'Pastiçeri Bajame', phone: '+383 49 128 650', email: 'pasticeri.bajame@example.com', city: 'Mitrovicë', ageHours: 50, status: 'scheduled',
    message: 'Na interesojnë gotat Venus dhe PS për tiramisu dhe mus. A mund të marrim disa mostra në pastiçeri para porosisë së parë?',
  },
  {
    type: 'quote', service: 'Printim me logo', productId: 'p-kuti-burger-logo', name: 'Labinot Rama', company: 'Fast Food Kroni', phone: '+383 45 437 019', email: 'fastfoodkroni@example.com', city: 'Ferizaj', ageHours: 120, status: 'scheduled',
    message: 'Kërkojmë kuti kraft për burger dhe patate të skuqura me logon tonë — 3.000 copë nga secila për fillim. Logon e kemi në PDF.',
  },
  {
    type: 'contact', name: 'Lirije Behrami', company: 'Event Catering Prishtina', phone: '+383 49 846 223', email: 'events.catering@example.com', city: 'Prishtinë', ageHours: 150, status: 'done',
    message: 'Hello, we run a catering company in Prishtina. Do you issue VAT invoices for monthly orders, and can we pay by bank transfer at the end of the month?',
  },
  {
    type: 'measurement', service: 'Sushi', name: 'Ilir Rexha', company: 'Sushi Corner', phone: '+383 49 563 819', email: 'sushi.corner@example.com', city: 'Prishtinë', ageHours: 190, status: 'done',
    message: 'Sushi bar i ri — na duhen mostra nga enët sushi me kapak transparent (madhësia mesatare) dhe gotat për salca 1 oz.',
  },
  {
    type: 'quote', service: 'Shumicë', productId: 'p-gota-f95-500', name: 'Njomza Ibrahimi', company: 'Fresh Point', phone: '+383 45 502 117', email: 'freshpoint@example.com', city: 'Prishtinë', ageHours: 240, status: 'done',
    message: 'Hapim 2 pika të reja smoothie. Ofertë për gota 500 ml, kapakë kupolë dhe shkopinj 24 cm — rreth 10 kartona në muaj.',
  },
  {
    type: 'contact', name: 'Besart Gjocaj', phone: '+383 44 615 378', email: 'besart.gjocaj@example.com', city: 'Mitrovicë', ageHours: 290, status: 'done',
    message: 'A mund ta marr porosinë direkt në depo në Suhodoll? Deri në çfarë ore jeni të hapur të shtunën?',
  },
  {
    type: 'measurement', service: 'Čaše i poklopci', name: 'Vesna Todorović', company: 'Kafić Most', phone: '+383 44 639 205', email: 'kafic.most@example.com', city: 'Zveçan', ageHours: 28, status: 'scheduled',
    message: 'Otvaramo kafić u Zvečanu. Da li možete da donesete uzorke čaša F95 od 400 ml i poklopaca sa otvorom za slamku? Hvala.',
  },
];

export function generateInquiries(now = new Date(), seed = 7): Inquiry[] {
  const r = rng(seed);
  return INQ.map((m, i) => {
    const created = new Date(now.getTime() - m.ageHours * 3600000 - Math.floor(r() * 50) * 60000);
    const scheduledAt = m.status === 'scheduled' ? new Date(now.getTime() + (1 + (i % 4)) * DAY).toISOString() : undefined;
    return {
      id: `inq_${100 + i}`,
      createdAt: created.toISOString(),
      type: m.type,
      name: m.name,
      phone: m.phone,
      email: m.email,
      city: m.city,
      service: m.service,
      productId: m.productId,
      message: m.message,
      preferredDate: m.type === 'measurement' ? new Date(now.getTime() + (2 + (i % 5)) * DAY).toISOString().slice(0, 10) : undefined,
      status: m.status,
      seen: m.status !== 'new',
      scheduledAt,
      ...(m.company ? { company: m.company } : {}),
    } satisfies Inquiry;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
