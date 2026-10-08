import type { LucideIcon } from 'lucide-react';
import { BookOpen, Coffee, ShoppingBag, SprayCan, Sparkles } from 'lucide-react';
import type { L10n, Project } from '@/lib/types';

const T = (sq: string, en: string): L10n => ({ sq, en });

/**
 * Industries PrintWorks serves (/industrite, /industrite/:slug).
 * `points` are the six bullets from the client's own site; products, categories and
 * technologies link the industry to the catalogue and the /teknologjia page.
 */
export interface Industry {
  slug: string;
  icon: LucideIcon;
  name: L10n;
  /** One-line positioning under the name */
  tagline: L10n;
  intro: L10n;
  /** Six bullets (client's site) */
  points: L10n[];
  /** What this industry typically needs from its packaging — and how we answer it */
  requirements: { title: L10n; text: L10n }[];
  /** Hero image + small gallery (existing photos only) */
  image: string;
  gallery: string[];
  categoryIds: string[];
  productIds: string[];
  /** TECH ids (company/tech.ts) */
  tech: string[];
  /** Lower-case stems matched against project tags / titles for "related projects" */
  keywords: string[];
}

export const INDUSTRIES: Industry[] = [
  {
    slug: 'ushqim-pije',
    icon: Coffee,
    name: T('Ushqim & pije', 'Food & Beverage'),
    tagline: T('Paketim që mbron produktin dhe e shet markën', 'Packaging that protects the product and sells the brand'),
    intro: T(
      'Nga kutia e picës te etiketa e verës: paketim i sigurt për ushqim, i printuar me ngjyrat e markës suaj dhe i gatshëm për kuzhinë, raft ose dërgesë.',
      'From the pizza box to the wine label: food-safe packaging, printed in your brand colours and ready for the kitchen, the shelf or delivery.',
    ),
    points: [
      T('Paketim i sigurt për ushqim', 'Food-safe packaging'),
      T('Etiketa dhe shrink sleeve për pije', 'Beverage labels & shrink sleeves'),
      T('Paketim për takeaway dhe delivery', 'Takeaway & delivery packaging'),
      T('Paketim për snacks dhe kafe', 'Snack & coffee packaging'),
      T('Paketim premium i markës për ushqime', 'Premium branded food packaging'),
      T('Menu dhe inserte', 'Menus & inserts'),
    ],
    requirements: [
      {
        title: T('Karton i përshtatshëm për ushqim', 'Food-appropriate board'),
        text: T(
          'Kontakt i drejtpërdrejtë, yndyrë, lagështi apo nxehtësi — materialin dhe mbrojtjen (p.sh. barrierë ndaj yndyrës) i përcaktojmë sipas produktit.',
          'Direct contact, grease, moisture or heat — we specify the board and coating (e.g. a grease barrier) for the product.',
        ),
      },
      {
        title: T('Etiketa për kushte të ftohta e të lagështa', 'Labels for chilled & humid conditions'),
        text: T(
          'Materiale PP rezistente ndaj ujit dhe ngjitës të zgjedhur për shishe, kavanoza dhe paketime në frigorifer.',
          'Water-resistant PP materials and adhesives chosen for bottles, jars and chilled packs.',
        ),
      },
      {
        title: T('Ngjyrë e njëjtë në çdo porosi', 'Same colour on every reorder'),
        text: T(
          'Offset B1 dhe flexo me 8 ngjyra mbajnë ngjyrat e markës të qëndrueshme në tirazhe të mëdha dhe ripërsëritje.',
          'B1 offset and 8-colour flexo keep brand colours consistent across long runs and repeat orders.',
        ),
      },
      {
        title: T('Shpejtësi për sezonin', 'Speed for the season'),
        text: T(
          'Menu të reja, oferta sezonale ose lansime — tirazhet e shkurtra i printojmë digjitalisht, pa pritur për pllaka.',
          'New menus, seasonal offers or launches — short runs are printed digitally, with no wait for plates.',
        ),
      },
    ],
    image: '/images/banner/kuti-ushqimore.webp',
    gallery: ['/images/p/kuti-pice.webp', '/images/p/mbajtese-gotash.webp', '/images/p/etiketa-vaj-ulliri.webp'],
    categoryIds: ['cat-kuti-ushqimore', 'cat-etiketa'],
    productIds: ['p-kuti-pice', 'p-kuti-takeaway', 'p-kuti-embelsirash', 'p-mbajtese-gotash', 'p-etiketa-ushqimore', 'p-etiketa-vere', 'p-shrink-sleeve', 'p-kuti-caji'],
    tech: ['offset-b1', 'flexo-led', 'hp-indigo', 'die-cutting', 'folder-gluing'],
    keywords: ['ushqim', 'food', 'pije', 'beverage', 'drink', 'restorant', 'restaurant', 'takeaway', 'pica', 'pizza', 'kafe', 'coffee', 'ëmbëlsir', 'pastry', 'bakery', 'furr', 'etiketa vere', 'wine', 'vaj ulliri', 'olive', 'jogurt', 'yogurt', 'qumësht', 'dairy', 'çaj', 'reçel', 'jam'],
  },
  {
    slug: 'fmcg-retail',
    icon: ShoppingBag,
    name: T('FMCG & retail', 'FMCG & Retail'),
    tagline: T('Paketim gati për raft, POS dhe e-commerce', 'Shelf-ready packaging, POS and e-commerce'),
    intro: T(
      'Për markat që shesin në raft dhe online: kuti me ndikim në raft, ekspozues POS, qese dhe paketime transporti që mbërrijnë të paprekura.',
      'For brands that sell on the shelf and online: cartons with shelf impact, POS displays, bags and transport packaging that arrives intact.',
    ),
    points: [
      T('Paketim gati për raft (retail-ready)', 'Retail-ready packaging'),
      T('Ekspozues POS', 'POS displays'),
      T('Qese blerjesh dhe dhuratash', 'Shopping & gift bags'),
      T('Etiketa produktesh dhe promocionale', 'Product & promotional labels'),
      T('Paketim për e-commerce dhe transport', 'E-commerce & transport packaging'),
      T('Fletushka dhe katalogë', 'Flyers & catalogues'),
    ],
    requirements: [
      {
        title: T('Ndikim në raft', 'Shelf impact'),
        text: T(
          'Ngjyra të forta, laminim mat ose me shkëlqim dhe llak UV selektiv që e kthejnë kutinë në reklamë.',
          'Strong colour, matte or gloss lamination and spot UV that turn the carton into advertising.',
        ),
      },
      {
        title: T('Shumë SKU, shumë versione', 'Many SKUs, many versions'),
        text: T(
          'Shije, madhësi apo gjuhë të ndryshme — me printimin digjital çdo version printohet pa kosto shtesë përgatitjeje.',
          'Different flavours, sizes or languages — digital print handles every version without extra set-up costs.',
        ),
      },
      {
        title: T('Forcë për transport', 'Strength for transport'),
        text: T(
          'Mikrovalë E dhe karton GC2 për kuti postare dhe e-commerce që mbrojnë produktin deri te klienti.',
          'E-flute and GC2 board for mailer and e-commerce boxes that protect the product all the way to the customer.',
        ),
      },
      {
        title: T('Afate të fushatave', 'Campaign deadlines'),
        text: T(
          'POS, qese dhe materiale promovuese të koordinuara për të njëjtën datë lansimi.',
          'POS, bags and promotional print coordinated for the same launch date.',
        ),
      },
    ],
    image: '/images/banner/kuti-produktesh.webp',
    gallery: ['/images/p/qese-blerjesh.webp', '/images/p/kuti-lodrash.webp', '/images/p/katalog.webp'],
    categoryIds: ['cat-kuti-produktesh', 'cat-qese-letre', 'cat-materiale-promovuese'],
    productIds: ['p-kuti-mailer', 'p-kuti-lodrash', 'p-kuti-dhurate', 'p-qese-blerjesh', 'p-qese-ngjyre', 'p-qese-kraft', 'p-katalog', 'p-fletepalosje'],
    tech: ['offset-b1', 'versafire', 'hp-indigo', 'die-cutting', 'folder-gluing', 'uv-coating'],
    keywords: ['fmcg', 'retail', 'supermarket', 'e-commerce', 'ecommerce', 'lodr', 'toy', 'qese', 'paper bag', 'shopping', 'mailer', 'dhurat', 'gift'],
  },
  {
    slug: 'kozmetike',
    icon: Sparkles,
    name: T('Kozmetikë & kujdes personal', 'Cosmetics & Personal Care'),
    tagline: T('Finishing luksoz për produktet e bukurisë', 'Luxury finishing for beauty products'),
    intro: T(
      'Kuti dhe etiketa që ndihen premium në dorë: folje, reliev, soft-touch dhe llak UV selektiv — me përshtatje të saktë për tuba, shishe dhe kavanoza.',
      'Boxes and labels that feel premium in the hand: foil, embossing, soft-touch and spot UV — sized precisely for tubes, bottles and jars.',
    ),
    points: [
      T('Paketim luksoz kozmetik', 'Luxury cosmetic packaging'),
      T('Etiketa premium me folje', 'Premium labels with foil finishes'),
      T('Kuti për kujdesin e lëkurës dhe parfume', 'Skincare & perfume boxes'),
      T('Kuti të forta (rigid) dhe sete dhuratash', 'Rigid boxes & gift sets'),
      T('Ekspozues për shitjen e kozmetikës', 'Beauty retail displays'),
      T('Qese luksoze dhe inserte', 'Luxury bags & inserts'),
    ],
    requirements: [
      {
        title: T('Finishing luksoz', 'Luxury finishes'),
        text: T(
          'Stampim me folje ari ose argjendi, reliev, soft-touch dhe llak UV selektiv — të kombinuara në të njëjtën kuti.',
          'Gold or silver hot-foil, embossing, soft-touch and spot UV — combined on the same box.',
        ),
      },
      {
        title: T('Përshtatje e saktë', 'A precise fit'),
        text: T(
          'Dieline sipas tubit, shishes ose kavanozit tuaj, me inserte që e mbajnë produktin në vend.',
          'Dielines made for your tube, bottle or jar, with inserts that hold the product in place.',
        ),
      },
      {
        title: T('Lansime & edicione të kufizuara', 'Launches & limited editions'),
        text: T(
          'HP Indigo dhe Versafire për seri të vogla, mostra për fotografim dhe versione sezonale.',
          'HP Indigo and Versafire for small batches, samples for photo shoots and seasonal versions.',
        ),
      },
      {
        title: T('Pamje “pa etiketë”', 'The no-label look'),
        text: T(
          'Etiketa transparente PP që lënë të duket ngjyra e produktit dhe xhami i shishes.',
          'Clear PP labels that let the product colour and the glass show through.',
        ),
      },
    ],
    image: '/images/p/etiketa-kozmetike.webp',
    gallery: ['/images/p/kuti-kozmetike.webp', '/images/p/etiketa-transparente.webp', '/images/p/qese-luksoze.webp'],
    categoryIds: ['cat-kuti-produktesh', 'cat-etiketa', 'cat-finishing'],
    productIds: ['p-kuti-kozmetike', 'p-etiketa-kozmetike', 'p-etiketa-transparente', 'p-kuti-dhurate', 'p-qese-luksoze', 'p-qese-premium', 'p-hot-foil', 'p-reliev'],
    tech: ['offset-b1', 'hp-indigo', 'uv-coating', 'finishing-qc', 'die-cutting'],
    keywords: ['kozmet', 'cosmet', 'beauty', 'bukuri', 'skincare', 'lëkur', 'parfum', 'perfume', 'serum'],
  },
  {
    slug: 'pastrim-amviseri',
    icon: SprayCan,
    name: T('Pastrim & amvisëri', 'Cleaning & Household'),
    tagline: T('Etiketa që i rezistojnë ujit dhe kimikateve', 'Labels that stand up to water and chemicals'),
    intro: T(
      'Detergjentë, letra të lagura dhe produkte shtëpiake: etiketa të qëndrueshme, informacion i lexueshëm dhe paketim që i bën ballë transportit me shumicë.',
      'Detergents, wet wipes and household products: durable labels, legible information and packaging built for bulk transport.',
    ),
    points: [
      T('Etiketa rezistente ndaj kimikateve', 'Chemical-resistant labels'),
      T('Paketim për produkte shtëpiake', 'Household product packaging'),
      T('Qese fleksibile dhe paketime rimbushëse', 'Flexible pouches & refill packs'),
      T('Etiketa sigurie dhe udhëzimesh', 'Safety & instruction labels'),
      T('Paketim ekspozues për pikat e shitjes', 'Retail display packaging'),
      T('Paketim për transport me shumicë', 'Bulk transport packaging'),
    ],
    requirements: [
      {
        title: T('Rezistencë ndaj kimikateve', 'Chemical resistance'),
        text: T(
          'Materiale PP dhe laminim mbrojtës që nuk fshihen e nuk zbehen nga detergjenti apo uji.',
          'PP materials and protective laminate that don’t smudge or fade from detergent or water.',
        ),
      },
      {
        title: T('Informacion i lexueshëm', 'Legible information'),
        text: T(
          'Udhëzime, piktograme dhe tekst i vogël të printuar qartë — ju na jepni përmbajtjen, ne kujdesemi për mprehtësinë.',
          'Instructions, pictograms and small text printed sharp — you supply the content, we make sure it stays crisp.',
        ),
      },
      {
        title: T('Markë në gjithë shishen', 'Branding all round the bottle'),
        text: T(
          'Shrink sleeve me printim 360° për shishe me forma të veçanta.',
          '360° printed shrink sleeves for bottles with distinctive shapes.',
        ),
      },
      {
        title: T('Tirazhe të mëdha, çmim i qëndrueshëm', 'High volumes, steady pricing'),
        text: T(
          'Flexo me 8 ngjyra dhe LED UV për etiketa në rrotull me çmime sipas sasisë.',
          '8-colour LED UV flexo for roll labels, with quantity-based pricing.',
        ),
      },
    ],
    image: '/images/p/etiketa-detergjent.webp',
    gallery: ['/images/p/etiketa-letra-te-lagura.webp', '/images/p/shrink-sleeve.webp', '/images/p/etiketa-detergjent-2.webp'],
    categoryIds: ['cat-etiketa', 'cat-kuti-produktesh'],
    productIds: ['p-etiketa-detergjent', 'p-etiketa-letra-lagura', 'p-shrink-sleeve', 'p-etiketa-transparente', 'p-kuti-mailer', 'p-etiketa-ushqimore'],
    tech: ['flexo-led', 'hp-indigo', 'uv-coating', 'finishing-qc'],
    keywords: ['pastrim', 'cleaning', 'detergj', 'detergent', 'amvis', 'household', 'shtëpiak', 'letra të lagura', 'wipes', 'higjien', 'hygiene'],
  },
  {
    slug: 'botime-marketing',
    icon: BookOpen,
    name: T('Botime & marketing', 'Publishing & Marketing'),
    tagline: T('Shtyp që e prezanton markën tuaj', 'Print that presents your brand'),
    intro: T(
      'Katalogë, broshura, materiale zyre dhe printime për evente — me letrat, lidhjet dhe finishing-un që i japin peshë mesazhit.',
      'Catalogues, brochures, stationery and event print — with the papers, bindings and finishes that give your message weight.',
    ),
    points: [
      T('Libra, revista dhe katalogë', 'Books, magazines & catalogues'),
      T('Broshura dhe postera', 'Brochures & posters'),
      T('Materiale zyre të biznesit', 'Business stationery'),
      T('Printime për evente dhe promovim', 'Event & promotional print'),
      T('Grafika në format të madh', 'Large-format graphics'),
      T('Finishing special', 'Specialty finishing'),
    ],
    requirements: [
      {
        title: T('Ngjyrë e saktë', 'Accurate colour'),
        text: T(
          'Provë digjitale brenda 24 orësh dhe kontroll në makinë për punët ku ngjyra e markës është kritike.',
          'A digital proof within 24 hours and press checks for jobs where brand colour is critical.',
        ),
      },
      {
        title: T('Letra & lidhje', 'Paper & binding'),
        text: T(
          'Nga letra me shkëlqim te kartoni i trashë, me lidhje me kapëse ose ngjitje PUR — sipas numrit të faqeve.',
          'From gloss paper to heavy board, saddle-stitched or PUR-bound — depending on the page count.',
        ),
      },
      {
        title: T('Afate për evente', 'Event deadlines'),
        text: T(
          'Tirazhet e shkurtra dhe urgjente printohen digjitalisht në Versafire.',
          'Short and urgent runs are printed digitally on the Versafire.',
        ),
      },
      {
        title: T('Efekte që kujtohen', 'Finishes people remember'),
        text: T(
          'Folje, reliev dhe llak UV selektiv për kartëvizita, dosje dhe kopertina.',
          'Foil, embossing and spot UV for business cards, folders and covers.',
        ),
      },
    ],
    image: '/images/p/katalog.webp',
    gallery: ['/images/p/dosje-prezantimi.webp', '/images/p/kartevizita.webp', '/images/p/fletepalosje.webp'],
    categoryIds: ['cat-materiale-promovuese', 'cat-finishing'],
    productIds: ['p-katalog', 'p-fletepalosje', 'p-kartevizita', 'p-dosje', 'p-blloqe', 'p-hot-foil', 'p-folje-uv', 'p-reliev'],
    tech: ['versafire', 'offset-b1', 'uv-coating', 'finishing-qc'],
    keywords: ['botim', 'publish', 'marketing', 'katalog', 'catalog', 'broshur', 'brochure', 'libër', 'book', 'revist', 'magazine', 'event', 'kartëvizit', 'business card', 'stationery', 'promovues', 'promotional'],
  },
];

export const industryBySlug = (slug: string | undefined) => INDUSTRIES.find((i) => i.slug === slug);

/** Projects whose tags / title / summary mention the industry (best matches first). */
export function projectsForIndustry(ind: Industry, projects: Project[]) {
  const score = (p: Project) => {
    const tagText = p.tags.map((t) => `${t.sq} ${t.en}`).join(' ').toLowerCase();
    const body = `${p.title.sq} ${p.title.en} ${p.summary.sq} ${p.summary.en}`.toLowerCase();
    let s = 0;
    for (const k of ind.keywords) {
      if (tagText.includes(k)) s += 3;
      if (body.includes(k)) s += 1;
    }
    return s;
  };
  return projects
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.p.year - a.p.year)
    .map((x) => x.p);
}
