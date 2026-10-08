import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Boxes,
  Brush,
  Clock3,
  Cylinder,
  FileCheck,
  FlaskConical,
  Layers,
  Lightbulb,
  PackageCheck,
  PenTool,
  Printer,
  Ruler,
  Scissors,
  ScanEye,
  Sparkles,
  Tags,
  Truck,
  Warehouse,
  Zap,
} from 'lucide-react';
import type { L10n } from '@/lib/types';

const T = (sq: string, en: string): L10n => ({ sq, en });

/* ------------------------------------------------------------------ */
/* Company facts (from the client's own site — do not add others)      */
/* ------------------------------------------------------------------ */
export const FOUNDERS = ['Visar Idrizi', 'Besian Zeneli', 'Edon Zeneli'];

export const FACTS: { value: string; unit?: string; label: L10n; note: L10n }[] = [
  { value: '2020', label: T('Viti i themelimit', 'Founded'), note: T('PrintWorks Solutions, Kosovë', 'PrintWorks Solutions, Kosovo') },
  { value: '14', label: T('Shtete ku dërgojmë', 'Countries served'), note: T('Kosova, rajoni dhe më gjerë', 'Kosovo, the region and beyond') },
  { value: '2.500', unit: 'm²', label: T('Depo', 'Warehouse'), note: T('Magazinim për stokun e klientëve', 'Storage for client stock') },
  { value: '25+', label: T('Vite përvojë në industri', 'Years of industry experience'), note: T('Përvojë reale në printim e paketim', 'Real printing & packaging experience') },
];

/* ------------------------------------------------------------------ */
/* Production technology — the exact list from printwor-ks.com         */
/* ------------------------------------------------------------------ */
export type TechGroup = 'print' | 'convert' | 'finish';

export interface Tech {
  id: string;
  group: TechGroup;
  icon: LucideIcon;
  name: L10n;
  /** Machine / configuration shown as a mono chip */
  machine?: string;
  text: L10n;
  bestFor: L10n[];
  /** Indicative run-length span on a 0–4 scale: 0 samples · 1 short · 2 medium · 3–4 long (presses only) */
  runs?: [number, number];
  /** What comes off it: cartons / labels / print */
  output?: L10n;
  /** Catalogue categories this technology produces */
  categories: string[];
}

export const TECH: Tech[] = [
  {
    id: 'offset-b1',
    group: 'print',
    icon: Printer,
    name: T('Printim offset për paketim', 'Offset packaging printing'),
    machine: 'Manroland B1',
    text: T(
      'Offset me fletë në formatin B1 për kuti kartoni të palosshme dhe paketime për ushqim, farmaci e kozmetikë — me ngjyrë të qëndrueshme nga fleta e parë te e fundit.',
      'Sheet-fed offset in B1 format for folding cartons and food, pharmaceutical and cosmetic packaging — with consistent colour from the first sheet to the last.',
    ),
    bestFor: [T('Kuti kartoni të palosshme', 'Folding cartons'), T('Paketime ushqimore', 'Food packaging'), T('Kuti farmaceutike & kozmetike', 'Pharma & cosmetic cartons')],
    runs: [1.7, 4],
    output: T('Kuti', 'Cartons'),
    categories: ['cat-kuti-produktesh', 'cat-kuti-ushqimore'],
  },
  {
    id: 'hp-indigo',
    group: 'print',
    icon: Tags,
    name: T('Printim digjital i etiketave', 'Digital label printing'),
    machine: 'HP Indigo',
    text: T(
      'Etiketa digjitale me cilësi premium — pa pllaka printimi, prandaj tirazhet e shkurtra, seritë provë dhe punët me shumë versione janë ekonomike.',
      'Premium-quality digital labels — no printing plates, so short runs, test batches and multi-version jobs stay economical.',
    ),
    bestFor: [T('Etiketa premium', 'Premium labels'), T('Tirazhe të shkurtra & seri provë', 'Short runs & test batches'), T('Punë me shumë versione', 'Multi-version jobs')],
    runs: [0.2, 2.2],
    output: T('Etiketa', 'Labels'),
    categories: ['cat-etiketa'],
  },
  {
    id: 'flexo-led',
    group: 'print',
    icon: Cylinder,
    name: T('Printim flexo i etiketave', 'Flexo label printing'),
    machine: '8 × LED UV',
    text: T(
      'Makinë etiketash me tetë njësi ngjyre dhe tharje LED UV — për etiketa në tirazhe të mëdha dhe shrink sleeve, me ngjyra që thahen menjëherë.',
      'An eight-colour label press with LED UV curing — for high-volume labels and shrink sleeves, with inks cured instantly.',
    ),
    bestFor: [T('Etiketa në tirazhe të mëdha', 'High-volume labels'), T('Shrink sleeve', 'Shrink sleeves'), T('Etiketa për ushqime, pije & detergjentë', 'Food, beverage & household labels')],
    runs: [1.8, 4],
    output: T('Etiketa & sleeve', 'Labels & sleeves'),
    categories: ['cat-etiketa'],
  },
  {
    id: 'versafire',
    group: 'print',
    icon: Zap,
    name: T('Printim digjital i paketimeve', 'Digital packaging printing'),
    machine: 'Heidelberg Versafire',
    text: T(
      'Makinë digjitale për tirazhe të shkurtra, mostra, maketa dhe punë urgjente — mënyra më e shpejtë për ta parë dizajnin në karton të vërtetë para prodhimit.',
      'A digital press for short runs, samples, mock-ups and urgent jobs — the quickest way to see a design on real board before production.',
    ),
    bestFor: [T('Mostra & maketa', 'Samples & mock-ups'), T('Tirazhe të shkurtra', 'Short runs'), T('Punë urgjente & materiale promovuese', 'Urgent jobs & promotional print')],
    runs: [0, 1.4],
    output: T('Kuti & shtyp', 'Cartons & print'),
    categories: ['cat-kuti-produktesh', 'cat-materiale-promovuese'],
  },
  {
    id: 'die-cutting',
    group: 'convert',
    icon: Scissors,
    name: T('Prerje me matricë', 'Die-cutting'),
    text: T(
      'I jep paketimit formën dhe strukturën përfundimtare: prerje, bigim dhe perforim i fletëve të printuara saktësisht sipas dieline-it.',
      'Gives packaging its final shape and structure: cutting, creasing and perforating printed sheets exactly along the dieline.',
    ),
    bestFor: [T('Kuti & tabaka', 'Boxes & trays'), T('Mbajtëse & inserte', 'Holders & inserts'), T('Forma të personalizuara', 'Custom shapes')],
    categories: ['cat-kuti-produktesh', 'cat-kuti-ushqimore'],
  },
  {
    id: 'folder-gluing',
    group: 'convert',
    icon: PackageCheck,
    name: T('Ngjitje kutish', 'Folder gluing'),
    text: T(
      'Linja e ngjitjes i kthen fletët e printuara dhe të prera në kuti të gatshme — të palosura, të ngjitura dhe të dorëzuara të sheshta.',
      'The folder-gluing line turns printed, die-cut sheets into finished boxes — folded, glued and delivered flat.',
    ),
    bestFor: [T('Kuti produktesh të gatshme', 'Ready-to-fill product cartons'), T('Paketime ushqimore', 'Food packaging'), T('Kuti farmaceutike & kozmetike', 'Pharma & cosmetic cartons')],
    categories: ['cat-kuti-produktesh', 'cat-kuti-ushqimore'],
  },
  {
    id: 'uv-coating',
    group: 'finish',
    icon: Sparkles,
    name: T('Llak UV & veshje', 'UV varnish & coating'),
    text: T(
      'Mbrojtje, shkëlqim dhe pamje premium — llak në gjithë sipërfaqen ose UV selektiv që i nxjerr në pah logon dhe detajet.',
      'Protection, shine and a premium look — full-surface varnish or selective spot UV to make logos and details stand out.',
    ),
    bestFor: [T('Mbrojtje e sipërfaqes', 'Surface protection'), T('Llak UV selektiv', 'Spot UV'), T('Kuti & materiale premium', 'Premium boxes & print')],
    categories: ['cat-finishing', 'cat-kuti-produktesh'],
  },
  {
    id: 'finishing-qc',
    group: 'finish',
    icon: ScanEye,
    name: T('Finishing & kontroll cilësie', 'Finishing & quality control'),
    text: T(
      'Para çdo dorëzimi kontrollojmë përmasat, ngjyrën, strukturën dhe finishing-un — përfshirë efektet speciale si stampimi me folje dhe relievi.',
      'Before every delivery we check size, colour, structure and finish — including specialty effects such as hot-foil and embossing.',
    ),
    bestFor: [T('Stampim me folje & reliev', 'Hot-foil & embossing'), T('Kontroll i ngjyrës & përmasave', 'Colour & size checks'), T('Paketim për dërgesë', 'Packing for delivery')],
    categories: ['cat-finishing'],
  },
];

export const techById = (id: string) => TECH.find((t) => t.id === id);

/* ------------------------------------------------------------------ */
/* Services around the presses                                        */
/* ------------------------------------------------------------------ */
export interface ServiceItem {
  id: string;
  icon: LucideIcon;
  title: L10n;
  text: L10n;
  /** Short mono tag, e.g. "€45 / rresht" */
  tag?: L10n;
  href?: string;
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'prepress',
    icon: FileCheck,
    title: T('Prepress & kontroll i skedarëve', 'Prepress & artwork check'),
    text: T(
      'Çdo skedar kontrollohet para shtypit: bleed-i, rezolucioni, ngjyrat, fontet dhe përputhja me dieline-in.',
      'Every file is checked before print: bleed, resolution, colour mode, fonts and fit with the dieline.',
    ),
    tag: T('Përfshirë', 'Included'),
  },
  {
    id: 'structural',
    icon: Ruler,
    title: T('Dizajn strukturor & dieline', 'Structural design & dielines'),
    text: T(
      'Dieline sipas përmasave të produktit tuaj — përshtatim strukturën e kutisë, insertet dhe mbylljet.',
      'Dielines sized to your product — we adapt the box structure, inserts and closures.',
    ),
  },
  {
    id: 'design',
    icon: PenTool,
    title: T('Dizajn profesional', 'Professional design'),
    text: T(
      'Nuk keni ende skedar printimi? Dizajnerët tanë e përgatisin për €45 për rresht porosie te paketimet (çmimi për materialet promovuese shkruhet te produkti).',
      'No print file yet? Our designers prepare it for €45 per order line on packaging (promotional print shows its own price on the product).',
    ),
    tag: T('€45 / rresht · pa TVSH', '€45 / line · excl. VAT'),
  },
  {
    id: 'proof',
    icon: Clock3,
    title: T('Provë digjitale brenda 24 orësh', 'Digital proof in 24 h'),
    text: T(
      'Asgjë nuk shkon në shtyp pa miratimin tuaj: provën digjitale e merrni brenda 24 orësh nga skedarët.',
      'Nothing goes to press without your approval: you receive a digital proof within 24 hours of your files.',
    ),
    tag: T('24 orë', '24 h'),
  },
  {
    id: 'samples',
    icon: FlaskConical,
    title: T('Mostra & kontroll në makinë', 'Samples & press checks'),
    text: T(
      'Paketë mostrash materialesh, maketa fizike në Versafire dhe kontroll i ngjyrës në fabrikë për punët ku ngjyra është kritike.',
      'A materials sample kit, physical mock-ups on the Versafire and colour press checks at the factory for colour-critical jobs.',
    ),
    tag: T('Paketë mostrash €19', 'Sample kit €19'),
    href: '/produkt/pakete-mostrash-printworks',
  },
  {
    id: 'logistics',
    icon: Warehouse,
    title: T('Depo 2.500 m² & dërgesa', '2,500 m² warehouse & delivery'),
    text: T(
      'Magazinim për stokun tuaj dhe dërgesë me automjetet tona në gjithë Kosovën dhe në rajon.',
      'Storage for your stock and delivery with our own vehicles across Kosovo and the region.',
    ),
    tag: T('Kosovë + rajon', 'Kosovo + region'),
  },
];

/* ------------------------------------------------------------------ */
/* Production flow: idea → prepress → print → finishing → QC → delivery */
/* ------------------------------------------------------------------ */
export const FLOW: { icon: LucideIcon; title: L10n; text: L10n }[] = [
  { icon: Lightbulb, title: T('Ideja', 'Idea'), text: T('Produkti, sasia, afati dhe buxheti', 'Product, quantity, deadline and budget') },
  { icon: Brush, title: T('Prepress', 'Prepress'), text: T('Kontroll skedarësh, dieline, provë në 24 h', 'File check, dieline, proof in 24 h') },
  { icon: Printer, title: T('Printimi', 'Print'), text: T('Offset, digjital, flexo ose HP Indigo', 'Offset, digital, flexo or HP Indigo') },
  { icon: Layers, title: T('Finishing', 'Finishing'), text: T('Llak UV, prerje, ngjitje, folje', 'UV varnish, die-cutting, gluing, foil') },
  { icon: BadgeCheck, title: T('Kontrolli', 'Quality control'), text: T('Përmasa, ngjyrë, strukturë', 'Size, colour, structure') },
  { icon: Truck, title: T('Dorëzimi', 'Delivery'), text: T('Kosovë dhe rajon, nga depo jonë', 'Kosovo and the region, from our warehouse') },
];

/* ------------------------------------------------------------------ */
/* "Why PrintWorks?" — the four points from the client's site          */
/* ------------------------------------------------------------------ */
export const WHY: { icon: LucideIcon; title: L10n; text: L10n }[] = [
  {
    icon: Boxes,
    title: T('Ekspertizë paketimi nën një çati', 'Packaging expertise under one roof'),
    text: T(
      'Offset, digjital, etiketa, llak UV, prerje me matricë, ngjitje dhe finishing në një vend — pa pasur nevojë për disa furnitorë.',
      'Offset, digital, labels, UV varnish, die-cutting, gluing and finishing in one place — no need for several suppliers.',
    ),
  },
  {
    icon: BadgeCheck,
    title: T('Përvojë e fortë', 'Strong experience'),
    text: T('Mbi 25 vite përvojë reale në industrinë e printimit dhe paketimit.', 'More than 25 years of real experience in printing and packaging.'),
  },
  {
    icon: Layers,
    title: T('Zgjidhje fleksibile', 'Flexible solutions'),
    text: T(
      'Porosi të vogla, të mesme dhe të mëdha — i përshtatemi produktit, buxhetit dhe afatit tuaj.',
      'Small, medium and large orders — we adapt to your product, budget and timeline.',
    ),
  },
  {
    icon: Sparkles,
    title: T('Cilësi, besueshmëri, partneritet', 'Quality, reliability, partnership'),
    text: T(
      'Partner afatgjatë paketimi që i ndihmon markat të dallohen në raft.',
      'A long-term packaging partner that helps brands stand out on the shelf.',
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Partner / equipment brands                                          */
/* ------------------------------------------------------------------ */
export const BRANDS = [
  { name: 'Heidelberg', image: '/images/brands/heidelberg.png' },
  { name: 'Xerox', image: '/images/brands/xerox.png' },
  { name: 'Polar', image: '/images/brands/polar.png' },
  { name: 'Ricoh', image: '/images/brands/ricoh.png' },
  { name: 'Müller Martini', image: '/images/brands/muller-martini.png' },
];
