import type { CmsPage, Coupon, HomeSection, L10n, Post, Project, Settings } from '@/lib/types';

const T = (sq: string, en: string): L10n => ({ sq, en });

/* ------------------------------------------------------------------ */
/* Settings (placeholders marked in Admin → Postavke)                  */
/* ------------------------------------------------------------------ */
export const DEFAULT_SETTINGS: Settings = {
  companyName: 'PrintWorks',
  legalName: 'PrintWorks Solutions L.L.C.',
  tagline: T('Printim inovativ. Paketim i jashtëzakonshëm.', 'Innovative printing. Exceptional packaging.'),
  about: T(
    'PrintWorks Solutions është kompani moderne e printimit dhe paketimit me bazë në Kosovë, e themeluar në vitin 2020 nga Visar Idrizi, Besian Zeneli dhe Edon Zeneli. Bashkojmë offset, digjital, flexo, HP Indigo, prerje me matricë, ngjitje kutish dhe finishing nën një çati — nga ideja deri te produkti final.',
    'PrintWorks Solutions is a modern printing and packaging company based in Kosovo, founded in 2020 by Visar Idrizi, Besian Zeneli and Edon Zeneli. We bring offset, digital, flexo, HP Indigo, die-cutting, folder-gluing and finishing under one roof — from idea to finished product.',
  ),
  email: 'hello@printwor-ks.com',
  phone: '+383 49 732 700',
  phone2: '',
  whatsapp: '+383 49 732 700',
  address: 'Zona Industriale p.n.',
  city: 'Prishtinë',
  mapUrl: 'https://maps.google.com/?q=Prishtin%C3%AB',
  hours: T('Hën–Pre 08:00–17:00 · Sht 09:00–13:00', 'Mon–Fri 8:00–17:00 · Sat 9:00–13:00'),
  pib: 'NUI 81XXXXXXX',
  pdv: 'TVSH 330XXXXXX',
  bankName: 'ProCredit Bank Kosovo',
  bankAccount: 'XK05 1110 0000 0000 0000',
  instagram: 'printworks.solutions',
  facebook: '',
  currency: 'EUR',
  vatRate: 18,
  pricesIncludeVat: false,
  freeShippingThreshold: 250,
  shippingZones: [
    { id: 'z1', name: 'Prishtinë dhe rrethina', cities: ['Prishtinë', 'Fushë Kosovë', 'Obiliq', 'Lipjan', 'Graçanicë', 'Podujevë', 'Drenas'], fee: 5, days: '1' },
    {
      id: 'z2',
      name: 'Kosova',
      cities: ['Prizren', 'Pejë', 'Gjakovë', 'Ferizaj', 'Gjilan', 'Mitrovicë', 'Vushtrri', 'Suharekë', 'Rahovec', 'Malishevë', 'Skenderaj', 'Deçan', 'Istog', 'Klinë', 'Kamenicë', 'Viti', 'Dragash', 'Kaçanik', 'Shtime', 'Junik', 'Hani i Elezit'],
      fee: 8,
      days: '1–2',
    },
    { id: 'z3', name: 'Shqipëri & Maqedoni e Veriut', cities: ['Tiranë', 'Durrës', 'Shkodër', 'Vlorë', 'Elbasan', 'Kukës', 'Shkup', 'Tetovë', 'Gostivar', 'Strugë', 'Kumanovë'], fee: 25, days: '2–4' },
    { id: 'z4', name: 'Mali i Zi & rajoni', cities: ['Podgoricë', 'Ulqin', 'Tivar', 'Budvë', 'Beograd', 'Sarajevë'], fee: 35, days: '3–5' },
  ],
  pickupAddress: 'PrintWorks — Zona Industriale p.n., Prishtinë',
  payments: { cod: true, bank: true, card: true },
  languages: { sq: true, en: true },
  announcements: [
    T('Provë digjitale falas brenda 24 orësh për çdo porosi', 'Free digital proof within 24 hours on every order'),
    T('Transport falas në Kosovë për porosi mbi €250', 'Free delivery in Kosovo on orders over €250'),
    T('Paketë mostrash €19 — e zbritur nga porosia e parë', 'Sample kit €19 — credited on your first order'),
  ],
  brandColor: '#80298f',
  demoBanner: true,
  seo: {
    title: 'PrintWorks — Paketim, etiketa dhe shtyp premium në Kosovë',
    description: 'Kuti produktesh, paketime ushqimore, etiketa, shrink sleeve, qese letre dhe materiale promovuese. Offset, digjital, flexo dhe HP Indigo nën një çati.',
  },
  adminEmail: 'admin@printwor-ks.com',

  /* ---- CMS v2 ---- */
  timezone: 'Europe/Belgrade',
  orderPrefix: 'PW-',
  locations: [
    { id: 'loc-prod', name: 'Fabrika & zyrat', address: 'Zona Industriale p.n.', city: 'Prishtinë', pickup: true, isDefault: true },
    { id: 'loc-wh', name: 'Depo 2.500 m²', address: 'Zona Industriale p.n.', city: 'Prishtinë', pickup: false, isDefault: false },
  ],
  notifications: [
    { id: 'nt-order', event: 'order_placed', enabled: true, recipients: 'customer', subject: T('E morëm porosinë tuaj {number}', 'We received your order {number}') },
    { id: 'nt-confirm', event: 'order_confirmed', enabled: true, recipients: 'customer', subject: T('Porosia {number} u konfirmua — prova digjitale vjen brenda 24 orësh', 'Order {number} confirmed — your digital proof follows within 24 hours') },
    { id: 'nt-payment', event: 'payment_received', enabled: true, recipients: 'customer', subject: T('Pagesa për porosinë {number} u regjistrua', 'Payment for order {number} received') },
    { id: 'nt-shipped', event: 'order_shipped', enabled: true, recipients: 'customer', subject: T('Porosia {number} është në rrugë', 'Order {number} is on its way') },
    { id: 'nt-return', event: 'return_requested', enabled: true, recipients: 'staff', subject: T('Reklamacion i ri {number}', 'New complaint {number}') },
    { id: 'nt-refund', event: 'return_refunded', enabled: true, recipients: 'customer', subject: T('Rimbursimi për {number}', 'Refund for {number}') },
    { id: 'nt-contact', event: 'contact_received', enabled: true, recipients: 'customer', subject: T('Faleminderit — oferta juaj vjen brenda 24 orësh', 'Thank you — your quote follows within 24 hours') },
    { id: 'nt-booking', event: 'booking_confirmed', enabled: true, recipients: 'customer', subject: T('Takimi {date} u konfirmua', 'Your meeting on {date} is confirmed') },
    { id: 'nt-reminder', event: 'booking_reminder', enabled: false, recipients: 'customer', subject: T('Kujtesë: takimi nesër në {time}', 'Reminder: meeting tomorrow at {time}') },
    { id: 'nt-staff-order', event: 'staff_new_order', enabled: true, recipients: 'staff', subject: T('Porosi e re {number} — {total}', 'New order {number} — {total}') },
    { id: 'nt-staff-inquiry', event: 'staff_new_inquiry', enabled: true, recipients: 'staff', subject: T('Kërkesë e re për ofertë: {name}', 'New quote request: {name}') },
  ],
  integrations: [
    { id: 'int-payment', kind: 'payment', name: 'Pagesa me kartelë (payment gateway)', status: 'test', note: 'Modalitet testimi — kartelat nuk ngarkohen. Çelësat e prodhimit pas marrëveshjes me bankën.' },
    { id: 'int-courier', kind: 'courier', name: 'Shërbimi postar / kurier', status: 'disconnected', note: 'Aktualisht dërgesa me automjetet tona; API e kurierit sipas partnerit të zgjedhur.' },
    { id: 'int-email', kind: 'email', name: 'E-mail transaksional (SMTP)', status: 'connected', note: 'Konfirmimet e porosive, provave dhe takimeve dërgohen nga hello@printwor-ks.com.' },
    { id: 'int-fiscal', kind: 'fiscal', name: 'Fiskalizimi (ATK)', status: 'disconnected', note: 'Lidhja me sistemin e fiskalizimit të ATK-së — e planifikuar për fazën 2.' },
    { id: 'int-analytics', kind: 'analytics', name: 'Google Analytics 4', status: 'test', note: 'Matja e vizitave dhe konvertimeve në një property testimi.' },
  ],
  markets: [
    { id: 'mk-xk', name: T('Kosova', 'Kosovo'), countries: ['XK'], currency: 'EUR', languages: ['sq', 'en'], status: 'active' },
    { id: 'mk-al', name: T('Shqipëria & Maqedonia e Veriut', 'Albania & North Macedonia'), countries: ['AL', 'MK'], currency: 'EUR', languages: ['sq', 'en'], status: 'active' },
    { id: 'mk-eu', name: T('Eksport BE (DACH)', 'EU export (DACH)'), countries: ['DE', 'AT', 'CH'], currency: 'EUR', languages: ['en'], status: 'draft' },
  ],
  checkout: { guest: true, phoneRequired: true, companyField: 'optional', marketingOptIn: true },
  privacy: { cookieBanner: true },
};

/* ------------------------------------------------------------------ */
/* Industries & technology (client facts — printwor-ks.com)            */
/* Exported so the industries / technology pages can reuse them.       */
/* ------------------------------------------------------------------ */
export interface IndustryInfo {
  /** URL slug: /industrite/<slug> */
  slug: string;
  title: L10n;
  /** One-line positioning */
  short: L10n;
  /** The six points listed on the client's site */
  points: L10n[];
  image: string;
  /** Related catalogue categories */
  categoryIds: string[];
}

export const INDUSTRIES: IndustryInfo[] = [
  {
    slug: 'ushqim-pije',
    title: T('Ushqim & pije', 'Food & Beverage'),
    short: T('Paketime të sigurta për ushqim, nga kutia e picës te etiketa e pijes.', 'Food-safe packaging, from the pizza box to the beverage label.'),
    points: [
      T('Paketime të sigurta për kontakt me ushqim', 'Food-safe packaging solutions'),
      T('Etiketa dhe shrink sleeve për pije', 'Beverage labels & shrink sleeves'),
      T('Paketime takeaway dhe për dërgesa', 'Takeaway & delivery packaging'),
      T('Paketime fleksibile për snacks dhe kafe', 'Flexible snack & coffee packaging'),
      T('Paketime premium ushqimore me markën tuaj', 'Premium branded food packaging'),
      T('Menu, insertë dhe materiale promovuese', 'Menus, inserts & promotional print'),
    ],
    image: '/images/p/kuti-pice.webp',
    categoryIds: ['cat-kuti-ushqimore', 'cat-etiketa'],
  },
  {
    slug: 'fmcg-retail',
    title: T('FMCG & shitje me pakicë', 'FMCG & Retail'),
    short: T('Paketim gati për raft dhe materiale që e shesin produktin në dyqan.', 'Shelf-ready packaging and print that sells in store.'),
    points: [
      T('Paketime produktesh gati për raft', 'Retail-ready product packaging'),
      T('Ekspozues POS dhe markim raftesh', 'POS displays & shelf branding'),
      T('Qese blerjesh dhe paketime dhuratash', 'Shopping bags & gift packaging'),
      T('Etiketa produktesh dhe ngjitëse promovuese', 'Product labels & promotional stickers'),
      T('Paketime për e-commerce dhe transport', 'E-commerce & transport packaging'),
      T('Fletëpalosje, katalogë dhe printime për dyqane', 'Flyers, catalogs & retail print'),
    ],
    image: '/images/p/qese-blerjesh.webp',
    categoryIds: ['cat-kuti-produktesh', 'cat-qese-letre', 'cat-materiale-promovuese'],
  },
  {
    slug: 'kozmetike',
    title: T('Kozmetikë & kujdes personal', 'Cosmetics & Personal Care'),
    short: T('Kuti dhe etiketa premium me folje, reliev dhe soft-touch.', 'Premium cartons and labels with foil, embossing and soft-touch.'),
    points: [
      T('Paketime luksoze për kozmetikë', 'Luxury cosmetic packaging'),
      T('Etiketa premium me finishim me folje', 'Premium labels & foil finishes'),
      T('Kuti për produkte të lëkurës dhe parfume', 'Skincare & perfume boxes'),
      T('Kuti të forta dhe sete dhuratash', 'Rigid boxes & gift sets'),
      T('Ekspozues për dyqane bukurie', 'Beauty retail displays'),
      T('Qese luksoze dhe insertë', 'Luxury shopping bags & inserts'),
    ],
    image: '/images/p/kuti-kozmetike.webp',
    categoryIds: ['cat-kuti-produktesh', 'cat-etiketa', 'cat-finishing'],
  },
  {
    slug: 'pastrim-amviseri',
    title: T('Pastrim & amvisëri', 'Cleaning & Household'),
    short: T('Etiketa që i rezistojnë kimikateve, ujit dhe përdorimit të përditshëm.', 'Labels that stand up to chemicals, water and daily use.'),
    points: [
      T('Etiketa rezistente ndaj kimikateve', 'Durable chemical-resistant labels'),
      T('Paketime për produkte shtëpiake', 'Household product packaging'),
      T('Qese fleksibile dhe paketime rimbushjeje', 'Flexible pouches & refill packs'),
      T('Etiketa sigurie dhe udhëzimesh', 'Safety & instruction labeling'),
      T('Paketime ekspozuese për dyqane', 'Retail display packaging'),
      T('Paketime për shumicë dhe transport', 'Bulk & transport packaging'),
    ],
    image: '/images/p/etiketa-detergjent.webp',
    categoryIds: ['cat-etiketa', 'cat-kuti-produktesh'],
  },
  {
    slug: 'botime-marketing',
    title: T('Botime & marketing', 'Publishing & Marketing'),
    short: T('Libra, katalogë dhe materiale promovuese me finishim premium.', 'Books, catalogues and promotional print with premium finishing.'),
    points: [
      T('Libra, revista dhe katalogë', 'Books, magazines & catalogs'),
      T('Broshura, fletëpalosje dhe postera', 'Brochures, flyers & posters'),
      T('Materiale korporative për zyrë', 'Business stationery materials'),
      T('Printime për evente dhe promovime', 'Event & promotional print'),
      T('Grafika të formatit të madh për markim', 'Large-format branding graphics'),
      T('Finishim premium dhe printime speciale', 'Premium finishing & specialty print'),
    ],
    image: '/images/p/katalog.webp',
    categoryIds: ['cat-materiale-promovuese', 'cat-finishing'],
  },
];

export interface TechnologyInfo {
  title: L10n;
  text: L10n;
}

/** The eight production technologies, in the client's order. */
export const TECHNOLOGIES: TechnologyInfo[] = [
  {
    title: T('Printim offset i paketimeve — Manroland B1', 'Offset packaging printing — Manroland B1'),
    text: T(
      'Kuti kartoni të palosshme për ushqim, farmaci dhe kozmetikë, kuti tortash dhe paketime fast-food — në format B1, me ngjyrë të njëtrajtshme në gjithë tirazhin.',
      'Folding cartons for food, pharma and cosmetics, cake boxes and fast-food packaging — in B1 format, with consistent colour across the whole run.',
    ),
  },
  {
    title: T('Etiketa digjitale — HP Indigo', 'Digital label printing — HP Indigo'),
    text: T(
      'Etiketa vetëngjitëse premium për tirazhe të shkurtra dhe të mesme, lansime produktesh, seri testuese dhe punë me shumë versione.',
      'Premium self-adhesive labels for short and medium runs, product launches, test batches and multi-version jobs.',
    ),
  },
  {
    title: T('Etiketa flexo — 8 ngjyra, LED UV', 'Flexo label printing — 8-colour LED UV'),
    text: T(
      'Volume të mëdha etiketash dhe shrink sleeve për ushqim, pije, kozmetikë dhe produkte shtëpiake — me tharje të menjëhershme LED UV.',
      'High-volume labels and shrink sleeves for food, beverage, cosmetic and household products — with instant LED UV curing.',
    ),
  },
  {
    title: T('Paketime digjitale — Heidelberg Versafire', 'Digital packaging printing — Heidelberg Versafire'),
    text: T(
      'Tirazhe të shkurtra, maketa, mostra, punë urgjente dhe produkte të personalizuara — para se projekti të kalojë në offset.',
      'Short runs, mock-ups, samples, urgent jobs and personalised products — before a project moves to offset.',
    ),
  },
  {
    title: T('Prerje me matricë', 'Die-cutting'),
    text: T('I jep paketimit formën dhe strukturën përfundimtare, me saktësi të lartë në çdo fletë.', 'Gives packaging its final shape and structure, precisely on every sheet.'),
  },
  {
    title: T('Ngjitje kutish', 'Folder gluing'),
    text: T('Fletët e printuara dhe të prera shndërrohen në kuti të gatshme për mbushje.', 'Turns printed, die-cut sheets into finished boxes ready for filling.'),
  },
  {
    title: T('Llak UV & veshje', 'UV varnish & coating'),
    text: T('Mbrojtje, shkëlqim ose efekt mat — për një pamje premium që zgjat.', 'Protection, gloss or a matte effect — for a premium look that lasts.'),
  },
  {
    title: T('Finishim & kontroll cilësie', 'Finishing & quality control'),
    text: T(
      'Prerje, inspektim dhe paketim — kontrollojmë përmasat, ngjyrën, strukturën dhe finishimin para dorëzimit.',
      'Cutting, inspection and packing — we check size, colour, structure and finish before delivery.',
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Homepage sections                                                   */
/* ------------------------------------------------------------------ */
/**
 * The published homepage. Every section type appears once (the builder's "Add section" starts from these),
 * so the seasonal promo, services and Instagram blocks are seeded hidden — ready to switch on in the CMS.
 */
export function buildHome(now = new Date()): HomeSection[] {
  const endsAt = new Date(now.getTime() + 12 * 86400000 + 5 * 3600000).toISOString();
  return [
    {
      id: 'hero',
      type: 'hero',
      enabled: true,
      data: {
        autoplay: true,
        slides: [
          {
            id: 's1',
            image: '/images/p/kuti-cokollate.webp',
            eyebrow: T('Printim & paketim · Prishtinë', 'Print & packaging · Prishtina'),
            title: T('Perfection *Printed.*', 'Perfection *Printed.*'),
            subtitle: T(
              'Kuti produktesh, paketime ushqimore, etiketa dhe qese letre — offset, digjital, flexo dhe HP Indigo nën një çati, nga ideja deri te produkti final.',
              'Product boxes, food packaging, labels and paper bags — offset, digital, flexo and HP Indigo under one roof, from idea to finished product.',
            ),
            primary: { label: T('Kërko ofertë', 'Get a quote'), href: '/kerko-oferte' },
            secondary: { label: T('Shiko produktet', 'Browse products'), href: '/produktet' },
          },
          {
            id: 's2',
            image: '/images/p/kuti-takeaway-doreze.webp',
            eyebrow: T('Paketime ushqimore', 'Food packaging'),
            title: T('Paketim që *shet.*', 'Packaging that *sells.*'),
            subtitle: T(
              'Kuti pice, takeaway, ëmbëlsirash dhe sushi nga karton i sigurt për ushqim — me ngjyrat e markës suaj, me çmime sipas sasisë.',
              'Pizza, takeaway, pastry and sushi boxes in food-safe board — in your brand colours, priced by quantity.',
            ),
            primary: { label: T('Paketime ushqimore', 'Food packaging'), href: '/produktet/kuti-ushqimore' },
            secondary: { label: T('Kërko ofertë', 'Get a quote'), href: '/kerko-oferte' },
          },
          {
            id: 's3',
            image: '/images/p/etiketa-ushqimore-rrotull-2.webp',
            eyebrow: T('Etiketa & shrink sleeve', 'Labels & shrink sleeves'),
            title: T('Etiketa që *mbeten.*', 'Labels that *stay.*'),
            subtitle: T(
              'HP Indigo për tirazhe të shkurtra, flexo LED UV me 8 ngjyra për volume — në rrotull, gati për linjën tuaj të mbushjes.',
              'HP Indigo for short runs, 8-colour LED UV flexo for volume — on rolls, ready for your filling line.',
            ),
            primary: { label: T('Shiko etiketat', 'Shop labels'), href: '/produktet/etiketa' },
            secondary: { label: T('Udhëzuesi i skedarëve', 'Artwork guide'), href: '/faqe/si-te-pergatisni-skedaret' },
          },
        ],
      },
    },
    {
      id: 'trust',
      type: 'trust',
      enabled: true,
      data: {
        items: [
          { icon: 'Clock', title: T('Provë digjitale në 24 orë', 'Digital proof in 24 h'), text: T('Për çdo porosi, para se të nisë prodhimi', 'On every order, before production starts') },
          { icon: 'Layers', title: T('Nga 100 copë', 'From 100 pieces'), text: T('Tirazhe të shkurtra në digjital, volume në offset', 'Short runs digital, volume on offset') },
          { icon: 'Printer', title: T('Offset · digjital · flexo · HP Indigo', 'Offset · digital · flexo · HP Indigo'), text: T('Katër teknologji nën një çati', 'Four technologies under one roof') },
          { icon: 'Truck', title: T('Dërgesë në Kosovë & rajon', 'Delivery in Kosovo & region'), text: T('1–2 ditë në Kosovë, falas mbi €250', '1–2 days in Kosovo, free over €250') },
        ],
      },
    },
    {
      id: 'categories',
      type: 'categories',
      enabled: true,
      data: {
        eyebrow: T('Produktet', 'Products'),
        title: T('Gjashtë linja prodhimi. *Një partner.*', 'Six product lines. *One partner.*'),
        subtitle: T(
          'Nga kutia e picës te etiketa e verës — çdo produkt me çmime sipas sasisë, provë digjitale dhe dorëzim në Kosovë e rajon.',
          'From the pizza box to the wine label — every product with quantity pricing, a digital proof and delivery across Kosovo and the region.',
        ),
      },
    },
    {
      id: 'featured',
      type: 'featured',
      enabled: true,
      data: {
        eyebrow: T('Më të porositurat', 'Most ordered'),
        title: T('Produktet që bizneset *riporosisin*', 'The products businesses *reorder*'),
        mode: 'bestsellers',
        productIds: [],
      },
    },
    {
      id: 'promo',
      type: 'promo',
      enabled: false,
      data: {
        eyebrow: T('Sezoni i festave', 'Holiday season'),
        title: T('Paketimi i festave, *gati në kohë.*', 'Holiday packaging, *ready on time.*'),
        text: T(
          'Kuti dhuratash, qese dhe etiketa me motive festive — porositë e konfirmuara para fundit të ofertës dorëzohen para festave. Me kodin PRINT10 përfitoni 10% në porosinë e parë mbi €100.',
          'Gift boxes, bags and labels with festive designs — orders confirmed before the offer ends are delivered before the holidays. Use code PRINT10 for 10% off your first order over €100.',
        ),
        image: '/images/p/kuti-dhurate-gable.webp',
        cta: { label: T('Kuti dhuratash', 'Gift boxes'), href: '/produktet/kuti-produktesh' },
        endsAt,
        code: 'PRINT10',
      },
    },
    {
      id: 'industries',
      type: 'industries',
      enabled: true,
      data: {
        eyebrow: T('Industritë', 'Industries'),
        title: T('Paketim për çdo *raft.*', 'Packaging for every *shelf.*'),
        subtitle: T(
          'Pesë industri, një standard: ngjyrë e saktë, materiali i duhur dhe afate që mbahen.',
          'Five industries, one standard: accurate colour, the right material and deadlines that hold.',
        ),
        items: INDUSTRIES.map((ind) => ({
          title: ind.title,
          points: T(ind.points.map((p) => p.sq).join('\n'), ind.points.map((p) => p.en).join('\n')),
          image: ind.image,
          href: `/industrite/${ind.slug}`,
        })),
      },
    },
    {
      id: 'process',
      type: 'process',
      enabled: true,
      data: {
        eyebrow: T('Si funksionon', 'How it works'),
        title: T('Nga skedari te *paleta* — në katër hapa', 'From file to *pallet* — in four steps'),
        steps: [
          {
            title: T('Konfiguroni ose kërkoni ofertë', 'Configure or request a quote'),
            text: T(
              'Zgjidhni produktin, materialin dhe sasinë online me çmime sipas sasisë — ose përshkruani projektin dhe oferta vjen brenda 24 orësh.',
              'Choose the product, material and quantity online with tiered pricing — or describe your project and get a quote within 24 hours.',
            ),
          },
          {
            title: T('Ngarkoni skedarin', 'Upload your artwork'),
            text: T(
              'Dërgoni PDF-në gati për shtyp. Nuk keni dizajn? Ekipi ynë i dizajnit dhe prepress-it e përgatit për ju.',
              'Send a print-ready PDF. No design yet? Our design and prepress team prepares it for you.',
            ),
          },
          {
            title: T('Provë digjitale në 24 orë', 'Digital proof in 24 h'),
            text: T(
              'Kontrollojmë bleed-in, ngjyrat dhe rezolucionin dhe ju dërgojmë provën. Prodhimi nis vetëm pas aprovimit tuaj.',
              'We check bleed, colour and resolution and send you a proof. Production starts only after you approve it.',
            ),
          },
          {
            title: T('Prodhim & dërgesë', 'Production & delivery'),
            text: T(
              'Printim, prerje me matricë, ngjitje dhe kontroll cilësie në fabrikën tonë — pastaj dërgesë në Kosovë dhe rajon.',
              'Printing, die-cutting, gluing and quality control in our factory — then delivery across Kosovo and the region.',
            ),
          },
        ],
      },
    },
    {
      id: 'technology',
      type: 'technology',
      enabled: true,
      data: {
        eyebrow: T('Teknologjia', 'Technology'),
        title: T('Katër teknologji printimi. *Një çati.*', 'Four print technologies. *One roof.*'),
        text: T(
          'Nga 100 etiketa në HP Indigo te qindra mijëra kuti në Manroland B1 — zgjedhim procesin që i jep projektit tuaj cilësinë më të mirë me çmimin e duhur. Prepress, printim, finishim dhe kontroll cilësie bëhen në të njëjtën fabrikë.',
          'From 100 labels on HP Indigo to hundreds of thousands of boxes on a Manroland B1 — we pick the process that gives your project the best quality at the right price. Prepress, printing, finishing and quality control all happen in the same factory.',
        ),
        image: '/images/misc/production.webp',
        items: TECHNOLOGIES.map((x) => ({ title: x.title, text: x.text })),
      },
    },
    {
      id: 'services',
      type: 'services',
      enabled: false,
      data: {
        eyebrow: T('Shërbimet', 'Services'),
        title: T('Më shumë se printim — *partner* nga ideja te paleta', 'More than print — a *partner* from idea to pallet'),
        subtitle: T('Ekipi ynë ju shoqëron në çdo fazë: dizajn, strukturë, mostra dhe dorëzim.', 'Our team supports every stage: design, structure, samples and delivery.'),
        items: [
          { image: '/images/p/dosje-prezantimi.webp', title: T('Dizajn & prepress', 'Design & prepress'), text: T('Përgatitja e skedarëve, ndarja e ngjyrave dhe kontrolli teknik para shtypit.', 'File preparation, colour separation and technical checks before print.') },
          { image: '/images/p/kuti-dhurate-mailer-2.webp', title: T('Strukturë & dieline', 'Structure & dielines'), text: T('Konstruksioni i kutisë sipas produktit tuaj, me dieline gati për dizajn.', 'Box construction around your product, with a dieline ready for design.') },
          { image: '/images/p/mostra-finishing-2.webp', title: T('Mostra & prototipe', 'Samples & prototypes'), text: T('Maketa të printuara në Heidelberg Versafire para tirazhit të madh.', 'Printed mock-ups on the Heidelberg Versafire before the full run.') },
          { image: '/images/p/hot-foil.webp', title: T('Finishim premium', 'Premium finishing'), text: T('Folje ari dhe argjendi, reliev, llak UV selektiv dhe soft-touch.', 'Gold and silver foil, embossing, spot UV and soft-touch.') },
        ],
      },
    },
    {
      id: 'stats',
      type: 'stats',
      enabled: true,
      data: {
        image: '/images/misc/team.webp',
        quote: T(
          'Të jemi partneri i besuar dhe inovativ i printimit dhe paketimit për kompanitë lider që janë gati të rriten dhe të kenë sukses.',
          'To be the trusted and innovative printing and packaging partner for leading companies ready to grow and succeed.',
        ),
        items: [
          { value: '2020', label: T('viti i themelimit në Prishtinë', 'founded in Prishtina') },
          { value: '14', label: T('vende ku dërgojmë', 'countries served') },
          { value: '2 500 m²', label: T('depo dhe hapësirë prodhimi', 'warehouse and production space') },
          { value: '25+', label: T('vjet përvojë e ekipit', 'years of team experience') },
        ],
      },
    },
    {
      id: 'projects',
      type: 'projects',
      enabled: true,
      data: {
        eyebrow: T('Realizime', 'Our work'),
        title: T('Projekte që kanë dalë nga *presat* tona', 'Work that came off our *presses*'),
        subtitle: T(
          'Një përzgjedhje paketimesh, etiketash dhe qesesh të prodhuara për biznese në Kosovë.',
          'A selection of packaging, labels and bags produced for businesses across Kosovo.',
        ),
      },
    },
    {
      id: 'logos',
      type: 'logos',
      enabled: true,
      data: {
        title: T('Pajisje dhe partnerë nga markat më të njohura të industrisë grafike', 'Equipment and partners from the graphic industry’s leading brands'),
        logos: [
          { name: 'Heidelberg', image: '/images/brands/heidelberg.png' },
          { name: 'Xerox', image: '/images/brands/xerox.png' },
          { name: 'Polar', image: '/images/brands/polar.png' },
          { name: 'Ricoh', image: '/images/brands/ricoh.png' },
          { name: 'Müller Martini', image: '/images/brands/muller-martini.png' },
        ],
      },
    },
    {
      id: 'faq',
      type: 'faq',
      enabled: true,
      data: {
        eyebrow: T('Pyetje të shpeshta', 'FAQ'),
        title: T('Gjithçka para se të *printojmë*', 'Everything before we *print*'),
        items: [
          {
            q: T('Në çfarë formati duhet ta dërgoj skedarin?', 'What file format should I send?'),
            a: T(
              'PDF gati për shtyp (PDF/X-1a ose PDF/X-4), në CMYK, me imazhe 300 dpi, fontet e konvertuara në kurba dhe 3 mm bleed. Pranojmë edhe AI dhe EPS — prepress-i ynë e kontrollon çdo skedar falas para provës.',
              'A print-ready PDF (PDF/X-1a or PDF/X-4) in CMYK, with 300 dpi images, fonts converted to outlines and 3 mm bleed. We also accept AI and EPS — our prepress team checks every file free of charge before the proof.',
            ),
          },
          {
            q: T('Çfarë është bleed-i dhe pse më duhen 3 mm?', 'What is bleed and why do I need 3 mm?'),
            a: T(
              'Bleed-i është zgjatja e ngjyrës dhe imazheve 3 mm jashtë vijës së prerjes. Gjatë prerjes fleta lëviz pak — pa bleed shfaqen vija të bardha në skaje. Tekstet dhe logot mbajini të paktën 3 mm brenda vijës së prerjes.',
              'Bleed is colour and imagery extended 3 mm beyond the cut line. Sheets shift slightly when cut — without bleed you get white slivers on the edges. Keep text and logos at least 3 mm inside the cut line.',
            ),
          },
          {
            q: T('A e shoh produktin para se të printohet?', 'Do I see the job before it is printed?'),
            a: T(
              'Po. Brenda 24 orësh nga marrja e skedarit ju dërgojmë provën digjitale me dieline-in. Prodhimi nis vetëm pas aprovimit tuaj me shkrim. Për paketime të reja mund të kërkoni edhe maketë fizike të printuar në digjital.',
              'Yes. Within 24 hours of receiving your file we send a digital proof on the dieline. Production starts only after your written approval. For new packaging you can also request a physical digital mock-up.',
            ),
          },
          {
            q: T('Sa është sasia minimale e porosisë?', 'What is the minimum order quantity?'),
            a: T(
              'Varet nga produkti: në digjital (HP Indigo, Heidelberg Versafire) nisim nga 100 copë, ndërsa offset-i dhe flexo bëhen të leverdishëm nga 1.000 copë e lart. Sasia minimale dhe çmimet sipas sasisë shkruhen te çdo produkt.',
              'It depends on the product: digital (HP Indigo, Heidelberg Versafire) starts at 100 pieces, while offset and flexo become cost-effective from about 1,000 pieces. Each product shows its minimum and quantity price tiers.',
            ),
          },
          {
            q: T('Sa zgjat prodhimi?', 'How long does production take?'),
            a: T(
              'Zakonisht 3–7 ditë pune për punët digjitale dhe 9–15 ditë pune për offset dhe flexo, të numëruara nga aprovimi i provës. Afati i saktë shkruhet te çdo produkt; për punë urgjente na kontaktoni para porosisë.',
              'Typically 3–7 working days for digital jobs and 9–15 working days for offset and flexo, counted from proof approval. Each product shows its exact lead time; for rush jobs, contact us before ordering.',
            ),
          },
          {
            q: T('A mund të printoni ngjyra Pantone?', 'Can you print Pantone colours?'),
            a: T(
              'Po — në offset dhe flexo printojmë ngjyra Pantone si ngjyra të veçanta (spot). Në digjital i përafrojmë me gamë të zgjeruar CMYK dhe ju tregojmë rezultatin në provë. Shkruani kodin Pantone në porosi ose në skedar.',
              'Yes — on offset and flexo we print Pantone colours as true spot colours. On digital we match them with an extended CMYK gamut and show you the result on the proof. Add the Pantone code to your order or file.',
            ),
          },
          {
            q: T('A është kartoni i sigurt për kontakt me ushqim?', 'Is the board safe for food contact?'),
            a: T(
              'Për paketimet ushqimore përdorim karton me fibër të freskët, të përshtatshëm për kontakt të drejtpërdrejtë me ushqim, me ngjyra me migrim të ulët dhe llak dispersion ose barrierë ndaj yndyrës. Deklaratën e konformitetit të materialit e dërgojmë sipas kërkesës.',
              'For food packaging we use virgin-fibre board suitable for direct food contact, low-migration inks and a dispersion varnish or grease barrier. We can send the material’s declaration of conformity on request.',
            ),
          },
          {
            q: T('Ku dërgoni dhe sa kushton transporti?', 'Where do you deliver and what does it cost?'),
            a: T(
              'Në Prishtinë dhe rrethinë për 1 ditë (€5), në gjithë Kosovën për 1–2 ditë (€8) dhe falas për porosi mbi €250. Dërgojmë edhe në Shqipëri, Maqedoni të Veriut dhe rajon për 2–5 ditë; porosinë mund ta merrni edhe në fabrikë.',
              'Prishtina area in 1 day (€5), anywhere in Kosovo in 1–2 days (€8) and free on orders over €250. We also ship to Albania, North Macedonia and the region in 2–5 days, or you can collect from the factory.',
            ),
          },
          {
            q: T('Si mund të paguaj? A lëshoni faturë me TVSH?', 'How can I pay? Do you issue VAT invoices?'),
            a: T(
              'Me transfertë bankare sipas profaturës, me kartelë online ose me para në dorëzim në Kosovë. Çdo porosi faturohet me TVSH 18% — për bizneset në emër të kompanisë dhe me NUI. Klientët e rregullt B2B mund të kenë afat pagese sipas marrëveshjes.',
              'By bank transfer against a pro-forma invoice, by card online or cash on delivery in Kosovo. Every order is invoiced with 18% VAT — for businesses in the company name with its business number. Regular B2B clients can have agreed payment terms.',
            ),
          },
        ],
      },
    },
    {
      id: 'blog',
      type: 'blog',
      enabled: true,
      data: {
        eyebrow: T('Blog', 'Blog'),
        title: T('Njohuri për paketim dhe *printim*', 'Know-how on packaging and *print*'),
      },
    },
    {
      id: 'instagram',
      type: 'instagram',
      enabled: false,
      data: {
        title: T('Nga presat tona, në Instagram', 'Fresh off the press, on Instagram'),
        images: [
          '/images/p/kuti-sushi.webp',
          '/images/p/etiketa-vaj-ulliri.webp',
          '/images/p/mbajtese-gotash.webp',
          '/images/p/qese-luksoze.webp',
          '/images/p/kuti-caji.webp',
          '/images/p/kartevizita.webp',
        ],
      },
    },
    {
      id: 'cta',
      type: 'cta',
      enabled: true,
      data: {
        eyebrow: T('Paketim me porosi', 'Custom packaging'),
        title: T('Keni një ide për paketim? *Le ta printojmë.*', 'Got a packaging idea? *Let’s print it.*'),
        text: T(
          'Na tregoni produktin, përmasat dhe sasinë — ju kthejmë ofertë të detajuar brenda 24 orësh, me rekomandim për materialin dhe finishimin.',
          'Tell us the product, dimensions and quantity — we’ll send a detailed quote within 24 hours, with a recommendation on material and finish.',
        ),
        image: '/images/p/mostra-finishing.webp',
      },
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Projects / portfolio ("Realizime")                                  */
/* ------------------------------------------------------------------ */
const TAG = {
  food: T('Paketime ushqimore', 'Food packaging'),
  box: T('Kuti produktesh', 'Product packaging'),
  labels: T('Etiketa', 'Labels'),
  bags: T('Qese letre', 'Paper bags'),
  offset: T('Offset', 'Offset'),
  digital: T('Digjital', 'Digital'),
  indigo: T('HP Indigo', 'HP Indigo'),
  flexo: T('Flexo', 'Flexo'),
  foil: T('Folje', 'Foil'),
  ecommerce: T('E-commerce', 'E-commerce'),
  kraft: T('Kraft', 'Kraft'),
};

export const PROJECTS: Project[] = [
  {
    id: 'pr-1',
    title: T('Maison Amélie — kuti ëmbëlsirash', 'Maison Amélie — pastry boxes'),
    location: 'Prishtinë',
    year: 2025,
    tags: [TAG.food, TAG.offset],
    summary: T(
      'Kuti me kapak për pastiçeri në karton GC1 krem, me logo me dy ngjyra dhe laminim mat që e mban kutinë të pastër në vitrinë.',
      'Lidded boxes for a pâtisserie in cream GC1 board, with a two-colour logo and matte lamination that keeps the box clean in the display case.',
    ),
    image: '/images/p/kuti-embelsirash.webp',
    featured: true,
  },
  {
    id: 'pr-2',
    title: T('The Coffee Lab Prishtina — mbajtëse gotash', 'The Coffee Lab Prishtina — cup carriers'),
    location: 'Prishtinë',
    year: 2025,
    tags: [TAG.food, TAG.kraft],
    summary: T(
      'Mbajtëse për dy gota në karton kraft me ilustrim të printuar në një ngjyrë — e palosur nga një fletë e vetme, pa ngjitës.',
      'Two-cup carriers in kraft board with a one-colour illustration — folded from a single sheet, no glue.',
    ),
    image: '/images/p/mbajtese-gotash.webp',
    featured: true,
  },
  {
    id: 'pr-3',
    title: T('Sushi House — kuti me mëngë', 'Sushi House — sleeved boxes'),
    location: 'Prizren',
    year: 2025,
    tags: [TAG.food, TAG.offset],
    summary: T(
      'Kuti sushi me tabaka të bardhë dhe mëngë të printuar me motiv të kuq — mëngët ndërrohen sipas menysë pa ndryshuar kutinë.',
      'Sushi boxes with a white tray and a red patterned printed sleeve — sleeves change with the menu while the box stays the same.',
    ),
    image: '/images/p/kuti-sushi.webp',
    featured: true,
  },
  {
    id: 'pr-4',
    title: T('Mix Fruit Jam — etiketa në rrotull', 'Mix Fruit Jam — roll labels'),
    location: 'Gjakovë',
    year: 2026,
    tags: [TAG.labels, TAG.indigo],
    summary: T(
      'Dy shije, dy etiketa në një tirazh: etiketa letre semi-gloss në rrotull, të printuara në HP Indigo dhe të prera për aplikim automatik.',
      'Two flavours, two labels in one run: semi-gloss paper roll labels printed on HP Indigo and die-cut for automatic application.',
    ),
    image: '/images/p/etiketa-ushqimore-rrotull-2.webp',
    featured: true,
  },
  {
    id: 'pr-5',
    title: T('Power Clean — etiketa detergjenti', 'Power Clean — detergent labels'),
    location: 'Ferizaj',
    year: 2025,
    tags: [TAG.labels, TAG.flexo],
    summary: T(
      'Etiketa në PP të bardhë, rezistente ndaj kimikateve dhe ujit, të printuara në flexo LED UV për bidonë 1 litër.',
      'White PP labels resistant to chemicals and water, printed on LED UV flexo for 1-litre bottles.',
    ),
    image: '/images/p/etiketa-detergjent.webp',
    featured: true,
  },
  {
    id: 'pr-6',
    title: T('Vaj ulliri ekstra i virgjër — etiketa', 'Extra virgin olive oil — labels'),
    location: 'Rahovec',
    year: 2024,
    tags: [TAG.labels, TAG.indigo],
    summary: T(
      'Etiketa në letër të strukturuar me ilustrim botanik, të printuara në HP Indigo dhe të dorëzuara në rrotull për mbushjen manuale.',
      'Textured-paper labels with a botanical illustration, printed on HP Indigo and supplied on rolls for hand application.',
    ),
    image: '/images/p/etiketa-vaj-ulliri.webp',
    featured: true,
  },
  {
    id: 'pr-7',
    title: T('Çaj DIO — kuti çaji', 'DIO tea — tea cartons'),
    location: 'Pejë',
    year: 2025,
    tags: [TAG.box, TAG.offset, TAG.foil],
    summary: T(
      'Seri kutish për dy shije çaji në karton GC2, me detaje me folje ari dhe laminim mat — një dieline, dy dizajne në të njëjtën fletë.',
      'A carton series for two tea flavours in GC2 board, with gold foil details and matte lamination — one dieline, two designs on the same sheet.',
    ),
    image: '/images/p/kuti-caji.webp',
    featured: true,
  },
  {
    id: 'pr-8',
    title: T('Kuti dhuratash për e-commerce', 'E-commerce gift mailers'),
    location: 'Prishtinë',
    year: 2026,
    tags: [TAG.box, TAG.ecommerce, TAG.digital],
    summary: T(
      'Kuti postare në mikrovalë E, të printuara brenda dhe jashtë në Heidelberg Versafire — tirazhe të shkurtra për koleksione sezonale.',
      'E-flute mailer boxes printed inside and out on the Heidelberg Versafire — short runs for seasonal collections.',
    ),
    image: '/images/p/kuti-dhurate-mailer.webp',
    featured: false,
  },
  {
    id: 'pr-9',
    title: T('Si Italiane — kuti pice', 'Si Italiane — pizza boxes'),
    location: 'Mitrovicë',
    year: 2024,
    tags: [TAG.food, TAG.flexo],
    summary: T(
      'Kuti pice tetëkëndore në karton të valëzuar, me printim të plotë në dy ngjyra dhe barrierë ndaj yndyrës.',
      'Octagonal pizza boxes in corrugated board, with full two-colour print and a grease barrier.',
    ),
    image: '/images/p/kuti-pice.webp',
    featured: false,
  },
  {
    id: 'pr-10',
    title: T('PrintWorks — qese premium me litar', 'PrintWorks — premium rope-handle bags'),
    location: 'Prishtinë',
    year: 2024,
    tags: [TAG.bags, TAG.offset],
    summary: T(
      'Qeset tona për klientë dhe panaire: art letër 170 g me laminim mat, motivi i shevroneve në ngjyrë të plotë dhe dorezë pambuku.',
      'Our own bags for clients and trade fairs: 170 gsm art paper with matte lamination, the chevron pattern in full colour and cotton rope handles.',
    ),
    image: '/images/p/qese-premium-litar.webp',
    featured: false,
  },
];

/* ------------------------------------------------------------------ */
/* CMS pages (ids kept stable: menus and settings link to them)        */
/* ------------------------------------------------------------------ */
export function buildPages(now = new Date()): CmsPage[] {
  const at = now.toISOString();
  return [
    {
      id: 'pg-dostava',
      slug: 'transporti-dhe-afatet',
      title: T('Transporti & afatet', 'Delivery & lead times'),
      body: T(
        `Çdo porosi kalon nëpër tre faza: prova digjitale, prodhimi dhe dërgesa. Afatet më poshtë numërohen nga **aprovimi i provës**, jo nga dita e porosisë.

## Afatet e prodhimit
- Etiketa digjitale (HP Indigo): 3–6 ditë pune
- Paketime digjitale dhe tirazhe të shkurtra (Heidelberg Versafire): 3–7 ditë pune
- Kuti kartoni në offset (Manroland B1): 9–14 ditë pune
- Etiketa dhe shrink sleeve në flexo: 7–12 ditë pune
- Qese letre me porosi: 10–15 ditë pune

Afati i saktë shkruhet te çdo produkt. Për punë urgjente na shkruani para porosisë — shpesh gjejmë një vend në plan.

## Dërgesa
- Prishtinë dhe rrethina: 1 ditë pune — €5
- Kosova: 1–2 ditë pune — €8
- Shqipëri dhe Maqedoni e Veriut: 2–4 ditë pune — €25
- Mali i Zi dhe rajoni: 3–5 ditë pune — €35

Dërgesa në Kosovë është **falas për porosi mbi €250** (pa TVSH). Porositë e mëdha dorëzohen në paleta, me listë paketimi për çdo artikull.

## Marrja në fabrikë
Porosinë mund ta merrni vetë në fabrikën tonë në Prishtinë, Hën–Pre 08:00–17:00. Ju njoftojmë me SMS dhe e-mail kur porosia është gati.

## Eksporti
Dërgojmë rregullisht në 14 vende. Për dërgesa jashtë rajonit përgatisim dokumentacionin dhe ofertën e transportit sipas destinacionit — [na kontaktoni](/kontakt).`,
        `Every order goes through three stages: digital proof, production and delivery. The lead times below are counted from **proof approval**, not from the order date.

## Production lead times
- Digital labels (HP Indigo): 3–6 working days
- Digital packaging and short runs (Heidelberg Versafire): 3–7 working days
- Offset folding cartons (Manroland B1): 9–14 working days
- Flexo labels and shrink sleeves: 7–12 working days
- Custom paper bags: 10–15 working days

Each product shows its exact lead time. For rush jobs, write to us before ordering — we can often find a slot in the schedule.

## Delivery
- Prishtina area: 1 working day — €5
- Kosovo: 1–2 working days — €8
- Albania and North Macedonia: 2–4 working days — €25
- Montenegro and the region: 3–5 working days — €35

Delivery within Kosovo is **free on orders over €250** (excl. VAT). Large orders ship on pallets with a packing list for every item.

## Factory collection
You can collect your order from our factory in Prishtina, Mon–Fri 8:00–17:00. We notify you by SMS and e-mail when it is ready.

## Export
We regularly ship to 14 countries. For deliveries outside the region we prepare the paperwork and a freight quote for your destination — [contact us](/kontakt).`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-skedaret',
      slug: 'si-te-pergatisni-skedaret',
      title: T('Si të përgatisni skedarët', 'Preparing your artwork'),
      body: T(
        `Një skedar i përgatitur mirë është rruga më e shpejtë drejt një printimi të saktë. Prepress-i ynë kontrollon çdo skedar falas, por këto rregulla kursejnë një rundë korrigjimesh.

## Formati
- **PDF/X-1a** ose **PDF/X-4**, një faqe për çdo dizajn ose version
- Pranojmë edhe AI dhe EPS; skedarët e hapur InDesign dërgojini të paketuar (Package)
- Mos dërgoni JPG ose PNG për tekst dhe logo — ato humbasin mprehtësinë

## Bleed dhe zona e sigurt
- **3 mm bleed** në çdo anë: ngjyra dhe imazhet zgjaten përtej vijës së prerjes
- Tekstet, logot dhe barkodet mbajini **të paktën 3 mm brenda** vijës së prerjes (5 mm te kutitë e palosshme)
- Te etiketat në rrotull, bleed-i është 2 mm

## Ngjyrat
- Gjithçka në **CMYK** — skedarët RGB i konvertojmë, por ngjyrat mund të ndryshojnë
- Ngjyrat Pantone shënojini si ngjyra spot me emrin origjinal (p.sh. PANTONE 2602 C)
- E zeza për tekst: 100% K; e zeza e plotë për sipërfaqe të mëdha: 40C 30M 30Y 100K
- Mbulimi total i ngjyrës jo më shumë se 300%

## Rezolucioni dhe fontet
- Imazhet në **300 dpi** në madhësinë reale të printimit
- Fontet të **konvertuara në kurba** ose të përfshira në PDF
- Linjat jo më të holla se 0,25 pt; teksti jo më i vogël se 6 pt (5 pt te etiketat)

## Dieline dhe efektet
- Përdorni dieline-in tonë — e merrni nga faqja e produktit ose me ofertën
- Vija e prerjes në shtresë të veçantë, si ngjyrë spot me emrin **Dieline**, pa u printuar
- Folja, llaku UV selektiv, relievi dhe e bardha (te materialet transparente) në shtresa të veçanta, 100% e një ngjyre spot me emër të qartë (Foil, SpotUV, White)

## Prova digjitale
Brenda 24 orësh ju dërgojmë provën me dieline-in dhe shënimet e prepress-it. Kontrolloni tekstet, kodet dhe datat — pas aprovimit, prova është referenca e prodhimit.

> Nuk keni skedar gati? Shtoni **Dizajn profesional** në shportë (€45 për linjë porosie) dhe ekipi ynë e përgatit dizajnin sipas markës suaj.`,
        `A well-prepared file is the fastest route to an accurate print. Our prepress team checks every file free of charge, but these rules save a round of corrections.

## Format
- **PDF/X-1a** or **PDF/X-4**, one page per design or version
- We also accept AI and EPS; send open InDesign files packaged
- Don't send JPG or PNG for text and logos — they lose sharpness

## Bleed and safe area
- **3 mm bleed** on every side: colour and images extend beyond the cut line
- Keep text, logos and barcodes **at least 3 mm inside** the cut line (5 mm on folding cartons)
- On roll labels, bleed is 2 mm

## Colour
- Everything in **CMYK** — we convert RGB files, but colours may shift
- Mark Pantone colours as spot colours with their original name (e.g. PANTONE 2602 C)
- Black for text: 100% K; rich black for large areas: 40C 30M 30Y 100K
- Total ink coverage no more than 300%

## Resolution and fonts
- Images at **300 dpi** at final print size
- Fonts **converted to outlines** or embedded in the PDF
- Lines no thinner than 0.25 pt; text no smaller than 6 pt (5 pt on labels)

## Dielines and effects
- Use our dieline — download it from the product page or get it with your quote
- The cut line on its own layer, as a non-printing spot colour named **Dieline**
- Foil, spot UV, embossing and white ink (on clear materials) on separate layers, 100% of a clearly named spot colour (Foil, SpotUV, White)

## Digital proof
Within 24 hours we send a proof on the dieline with prepress notes. Check texts, codes and dates — once approved, the proof is the production reference.

> No file ready? Add **Professional design** in the cart (€45 per order line) and our team will prepare the artwork to your brand.`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-uslovi',
      slug: 'kushtet-e-shitjes',
      title: T('Kushtet e shitjes', 'Terms of sale'),
      body: T(
        `Këto kushte vlejnë për porositë e bëra në dyqanin online dhe me ofertë të PrintWorks Solutions L.L.C.

## Porosia dhe konfirmimi
Porosia regjistrohet kur e dërgoni në dyqan ose kur pranoni ofertën tonë. Ju konfirmojmë me e-mail brenda një dite pune; prodhimi nis vetëm pas **aprovimit të provës digjitale**.

## Çmimet
Çmimet në katalog janë në euro, **pa TVSH**; TVSH-ja 18% shtohet në arkë dhe në faturë. Çmimi për copë varet nga sasia e porositur (çmime sipas sasisë). Për porositë e konfirmuara vlen çmimi i konfirmimit.

## Prova dhe përgjegjësia për përmbajtjen
Prova digjitale tregon tekstet, pozicionin dhe ngjyrat e skedarit tuaj. Pas aprovimit, gabimet në tekst, kode ose data që ishin në provë nuk konsiderohen defekt prodhimi. Klienti garanton që ka të drejtën e përdorimit të logove, imazheve dhe teksteve që na dërgon.

## Toleranca
- Ngjyrat në materiale të ndryshme mund të ndryshojnë lehtë nga ekrani dhe nga prova digjitale
- Sasia e dorëzuar mund të ndryshojë **±5%** nga sasia e porositur; faturohet sasia e dorëzuar

## Pagesa
Me transfertë bankare sipas profaturës, me kartelë online ose me para në dorëzim në Kosovë. Detajet te [Pagesat](/faqe/pagesat).

## Anulimi
Porosinë mund ta anuloni pa kosto deri në aprovimin e provës. Pas nisjes së prodhimit, produktet e personalizuara nuk mund të anulohen ose kthehen.

## Ankesat
Shih [Reklamacionet & kthimet](/faqe/reklamacionet-dhe-kthimet).`,
        `These terms apply to orders placed in the PrintWorks Solutions L.L.C. online store and by quote.

## Order and confirmation
An order is registered when you submit it in the store or accept our quote. We confirm it by e-mail within one working day; production starts only after you **approve the digital proof**.

## Prices
Catalogue prices are in euros, **excluding VAT**; 18% VAT is added at checkout and on the invoice. The unit price depends on the quantity ordered (quantity tiers). Confirmed orders keep the confirmed price.

## Proof and responsibility for content
The digital proof shows the texts, positioning and colours of your file. After approval, errors in text, codes or dates that were on the proof are not production defects. The customer warrants that they hold the rights to the logos, images and texts they send us.

## Tolerances
- Colours on different materials may vary slightly from screen and from the digital proof
- The delivered quantity may vary by **±5%** from the quantity ordered; the delivered quantity is invoiced

## Payment
By bank transfer against a pro-forma invoice, by card online or cash on delivery in Kosovo. Details under [Payments](/faqe/pagesat).

## Cancellation
You can cancel free of charge until you approve the proof. Once production has started, personalised products cannot be cancelled or returned.

## Complaints
See [Complaints & returns](/faqe/reklamacionet-dhe-kthimet).`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-pagesat',
      slug: 'pagesat',
      title: T('Pagesat', 'Payments'),
      body: T(
        `Pagesa është e thjeshtë për bizneset dhe për porositë e vogla. Çdo porosi faturohet me **TVSH 18%**.

## Mënyrat e pagesës
- **Transfertë bankare** — pas porosisë merrni profaturën me e-mail; prodhimi planifikohet kur pagesa regjistrohet
- **Kartelë online** — Visa dhe Mastercard, përmes portalit të sigurt të bankës; kartela nuk ruhet te ne
- **Para në dorëzim** — në Kosovë, për porosi deri në €1.000

## Faturat
- Fatura lëshohet në emrin e kompanisë suaj, me **NUI** dhe adresë, kur i shkruani në porosi
- Çmimet në dyqan janë pa TVSH; në arkë shihni totalin pa TVSH, TVSH-në 18% dhe totalin për pagesë
- Faturën dhe profaturën i gjeni edhe në e-mailin e konfirmimit

## Porositë e mëdha dhe klientët e rregullt
- Për projekte me porosi mbi €2.000 kërkohet paradhënie 50% para prodhimit
- Klientët e rregullt B2B mund të kenë afat pagese sipas marrëveshjes
- Numrin e porosisë së brendshme (PO) e shkruani në arkë dhe del në faturë

Pyetje për pagesat? Na shkruani në [hello@printwor-ks.com](mailto:hello@printwor-ks.com).`,
        `Paying is simple for businesses and for small orders alike. Every order is invoiced with **18% VAT**.

## Payment methods
- **Bank transfer** — you receive a pro-forma invoice by e-mail; production is scheduled once payment is registered
- **Card online** — Visa and Mastercard via the bank's secure gateway; we never store your card
- **Cash on delivery** — within Kosovo, for orders up to €1,000

## Invoices
- The invoice is issued in your company's name, with its **business number (NUI)** and address, when you add them to the order
- Store prices exclude VAT; at checkout you see the net total, 18% VAT and the total to pay
- Your invoice and pro-forma are also in the confirmation e-mail

## Large orders and regular clients
- Custom projects over €2,000 require a 50% deposit before production
- Regular B2B clients can have agreed payment terms
- Add your purchase order (PO) number at checkout and it appears on the invoice

Questions about payment? Write to [hello@printwor-ks.com](mailto:hello@printwor-ks.com).`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-reklamacije',
      slug: 'reklamacionet-dhe-kthimet',
      title: T('Reklamacionet & kthimet', 'Complaints & returns'),
      body: T(
        `Çdo tirazh kontrollohet para dorëzimit. Nëse megjithatë diçka nuk është në rregull, e zgjidhim shpejt.

## Si të paraqisni reklamacion
1. Na shkruani brenda **7 ditëve** nga dorëzimi, me numrin e porosisë (p.sh. PW-1042)
2. Bashkëngjitni fotografi të defektit dhe, nëse kërkohet, disa copë si mostër
3. Ju përgjigjemi brenda 24 orësh dhe propozojmë zgjidhjen

## Çfarë konsiderohet defekt
- Devijim nga prova e aprovuar (ngjyrë, pozicion, prerje)
- Material ose finishim tjetër nga ai i porositur
- Dëmtim gjatë transportit — shënojeni në fletëdërgesë në momentin e dorëzimit

## Zgjidhja
Sipas rastit, e riprintojmë pjesën me defekt pa kosto ose ju kthejmë shumën për copat me defekt.

## Kthimet
Produktet e printuara me dizajnin tuaj prodhohen vetëm për ju dhe **nuk mund të kthehen** pa defekt. Produktet standarde pa printim (p.sh. paketa e mostrave) mund të kthehen brenda 14 ditëve, të papërdorura dhe në paketimin origjinal.`,
        `Every run is checked before delivery. If something still isn't right, we fix it quickly.

## How to report a problem
1. Write to us within **7 days** of delivery, with your order number (e.g. PW-1042)
2. Attach photos of the defect and, if requested, a few pieces as a sample
3. We reply within 24 hours with a proposed solution

## What counts as a defect
- Deviation from the approved proof (colour, position, cutting)
- A different material or finish from the one ordered
- Transport damage — note it on the delivery note at the moment of delivery

## Resolution
Depending on the case, we reprint the defective part free of charge or refund the defective pieces.

## Returns
Products printed with your artwork are made only for you and **cannot be returned** unless defective. Standard unprinted products (e.g. the sample kit) can be returned within 14 days, unused and in their original packaging.`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-privatnost',
      slug: 'politika-e-privatesise',
      title: T('Politika e privatësisë', 'Privacy policy'),
      body: T(
        `PrintWorks Solutions L.L.C. i përpunon të dhënat tuaja vetëm për të përmbushur porositë, ofertat dhe komunikimin me ju.

## Çfarë të dhënash mbledhim
- Emrin, kompaninë, NUI-në, telefonin dhe e-mailin
- Adresën e dërgesës dhe të faturimit
- Historinë e porosive dhe të ofertave
- Skedarët e printimit që na dërgoni

## Skedarët tuaj të printimit
Skedarët dhe provat i përdorim vetëm për porosinë tuaj dhe nuk ia japim askujt. I ruajmë deri në 24 muaj për ta bërë më të lehtë riporosinë; me kërkesën tuaj i fshijmë më herët.

## Për çfarë i përdorim
- Përpunimi i porosive, provave, faturave dhe dërgesave
- Përgjigjja ndaj kërkesave për ofertë
- Buletini — vetëm nëse jeni abonuar; mund të çabonoheni në çdo kohë

## Cookies
Përdorim cookies të domosdoshme për shportën dhe gjuhën. Cookies analitike përdoren vetëm me pëlqimin tuaj.

## Të drejtat tuaja
Mund të kërkoni qasje, korrigjim, eksport ose fshirje të të dhënave tuaja duke na shkruar në [hello@printwor-ks.com](mailto:hello@printwor-ks.com). Faturat ruhen sipas detyrimeve ligjore.`,
        `PrintWorks Solutions L.L.C. processes your data only to fulfil orders and quotes and to communicate with you.

## What we collect
- Name, company, business number, phone and e-mail
- Delivery and billing address
- Order and quote history
- The artwork files you send us

## Your artwork files
We use your files and proofs only for your order and never share them. We keep them for up to 24 months to make reorders easy; on request we delete them sooner.

## How we use your data
- Processing orders, proofs, invoices and deliveries
- Answering quote requests
- Newsletter — only if you subscribed; unsubscribe at any time

## Cookies
We use essential cookies for the cart and language. Analytics cookies are used only with your consent.

## Your rights
You can request access to, correction, export or deletion of your data by writing to [hello@printwor-ks.com](mailto:hello@printwor-ks.com). Invoices are kept as required by law.`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Blog                                                                */
/* ------------------------------------------------------------------ */
const AUTHOR = 'Ekipi PrintWorks';

export function buildPosts(now = new Date()): Post[] {
  const d = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  return [
    {
      id: 'post-kartoni',
      slug: 'si-te-zgjidhni-kartonin',
      title: T('GC1, GC2, kraft apo mikrovalë E? Si ta zgjidhni kartonin', 'GC1, GC2, kraft or E-flute? How to choose your board'),
      excerpt: T(
        'Kartoni vendos si ndihet kutia në dorë, sa mbron produktin dhe sa kushton. Ja kur përdoret secili.',
        'The board decides how a box feels in the hand, how well it protects and what it costs. Here is when to use each.',
      ),
      body: T(
        `Dy kuti me të njëjtin dizajn mund të duken krejt ndryshe në raft — dallimi është kartoni. Para se të zgjidhni finishimin, zgjidhni bazën.

## GC1 — e bardha premium
Karton me fibër të freskët, i bardhë në të dyja anët. Ngjyrat dalin më të pastra dhe më të ndritshme, ndaj është zgjedhja jonë për **kozmetikë, farmaci dhe ushqim premium**. Në 300–350 g mban mirë formën për kuti deri në rreth 0,5 kg.

## GC2 — e fortë dhe ekonomike
Pamje e ngjashme nga jashtë, por anën e brendshme e ka pak më të errët. Është pak më i fortë për të njëjtën peshë dhe më i lirë — ideal për **kuti produktesh, lodra dhe paketime shumë të përdorura**.

## Kraft — natyral dhe i ngrohtë
Ngjyra kafe e fibrës natyrale i jep markës pamje artizanale. Ngjyrat printohen më të errëta, ndaj punojmë me dizajne me kontrast të lartë ose me një deri në dy ngjyra. I shkëlqyer për **kafe, bukë, ushqim takeaway dhe qese**.

## Mikrovalë E — mbrojtje për dërgesa
Karton i valëzuar me valë 1,5 mm: shumë më i fortë se kartoni i thjeshtë, por ende mjaft i hollë për printim të bukur. Zgjidhja për **kuti postare e-commerce, pica dhe produkte të rënda**.

## Rregulli i shpejtë
- Produkt i lehtë, raft premium → **GC1**
- Volum i madh, buxhet i kontrolluar → **GC2**
- Markë natyrale ose ushqim → **kraft**
- Transport dhe dërgesa → **mikrovalë E**

> Nuk jeni të sigurt? Porositni [paketën e mostrave](/produkt/pakete-mostrash-printworks) — i prekni të gjitha materialet dhe finishimet para porosisë.`,
        `Two boxes with the same design can look completely different on the shelf — the difference is the board. Before choosing a finish, choose the base.

## GC1 — premium white
Virgin-fibre board, white on both sides. Colours print cleaner and brighter, so it is our choice for **cosmetics, pharma and premium food**. At 300–350 gsm it holds its shape well for boxes up to about 0.5 kg.

## GC2 — stiff and economical
Similar on the outside, with a slightly greyer reverse. A little stiffer for the same weight and cheaper — ideal for **product boxes, toys and hard-working packaging**.

## Kraft — natural and warm
The brown of natural fibre gives a brand a crafted look. Colours print darker, so we work with high-contrast or one- to two-colour designs. Great for **coffee, bakery, takeaway food and bags**.

## E-flute — protection in transit
Corrugated board with a 1.5 mm flute: far stronger than solid board, yet thin enough to print beautifully. The answer for **e-commerce mailers, pizza and heavier products**.

## The quick rule
- Light product, premium shelf → **GC1**
- High volume, controlled budget → **GC2**
- Natural brand or food → **kraft**
- Shipping and delivery → **E-flute**

> Not sure? Order the [sample kit](/produkt/pakete-mostrash-printworks) and feel every material and finish before you order.`,
      ),
      cover: '/images/p/kuti-dhurate-mailer-2.webp',
      tag: T('Materiale', 'Materials'),
      author: AUTHOR,
      readMinutes: 5,
      publishedAt: d(6),
      published: true,
    },
    {
      id: 'post-teknologjia',
      slug: 'offset-digjital-apo-flexo',
      title: T('Offset, digjital apo flexo — cila teknologji për porosinë tuaj?', 'Offset, digital or flexo — which process fits your job?'),
      excerpt: T(
        'Sasia, materiali dhe numri i versioneve e përcaktojnë teknologjinë. Shpjegojmë ku shkëlqen secila.',
        'Quantity, material and the number of versions decide the process. Here is where each one shines.',
      ),
      body: T(
        `Në PrintWorks punojmë me katër teknologji nën një çati. Nuk ju duhet t'i njihni të gjitha — por kur e kuptoni logjikën, e kuptoni edhe çmimin.

## Digjitali: shpejt, pa pllaka
**HP Indigo** për etiketa dhe **Heidelberg Versafire** për paketime printojnë direkt nga skedari, pa pllaka dhe pa kohë përgatitjeje. Kjo e bën digjitalin më të leverdishmin për:
- tirazhe nga 100 deri në rreth 1.000 copë
- shumë versione (shije, gjuhë, emra) në të njëjtin tirazh
- mostra, maketa dhe lansime testuese

## Offset-i: cilësi dhe çmim për volum
**Manroland B1** printon fletë të mëdha me shumë kuti njëherësh. Përgatitja kërkon pllaka, por pastaj çmimi për copë bie shumë. Offset-i është zgjedhja për **kuti kartoni nga rreth 1.000 copë e lart**, me ngjyrë të njëtrajtshme nga fleta e parë te e fundit dhe ngjyra Pantone të vërteta.

## Flexo: etiketa në volum
Linja jonë **flexo me 8 ngjyra dhe LED UV** printon etiketa dhe shrink sleeve në rrotull me shpejtësi të lartë. Bojërat thahen menjëherë, ndaj etiketat dalin gati për aplikim. Ideale për **dhjetëra mijëra etiketa** dhe produkte që riporositen rregullisht.

## Si vendosim ne
1. Sa copë dhe sa versione?
2. Çfarë materiali — karton, letër, PP, film?
3. A ka ngjyra Pantone, folje ose llak selektiv?
4. Sa shpejt ju duhet?

> Shpesh kombinojmë: nisni me 300 kuti në digjital për lansim, pastaj kalojmë në offset kur produkti shitet. Dizajni dhe dieline mbeten të njëjta.`,
        `At PrintWorks we run four technologies under one roof. You don't need to know them all — but once you see the logic, you understand the price.

## Digital: fast, no plates
**HP Indigo** for labels and the **Heidelberg Versafire** for packaging print straight from the file, with no plates and no make-ready. That makes digital the most cost-effective option for:
- runs from 100 to about 1,000 pieces
- many versions (flavours, languages, names) in one run
- samples, mock-ups and test launches

## Offset: quality and price at volume
The **Manroland B1** prints large sheets with many boxes at once. Make-ready needs plates, but then the unit price drops sharply. Offset is the choice for **folding cartons from about 1,000 pieces**, with consistent colour from the first sheet to the last and true Pantone colours.

## Flexo: labels at volume
Our **8-colour LED UV flexo** line prints labels and shrink sleeves on rolls at high speed. Inks cure instantly, so labels come off ready to apply. Ideal for **tens of thousands of labels** and products that are reordered regularly.

## How we decide
1. How many pieces and how many versions?
2. What material — board, paper, PP, film?
3. Any Pantone colours, foil or spot varnish?
4. How fast do you need it?

> We often combine them: launch with 300 boxes on digital, then move to offset once the product sells. The artwork and dieline stay the same.`,
      ),
      cover: '/images/misc/production.webp',
      tag: T('Teknologji', 'Technology'),
      author: AUTHOR,
      readMinutes: 5,
      publishedAt: d(15),
      published: true,
    },
    {
      id: 'post-gabime',
      slug: '7-gabime-ne-skedaret-e-paketimit',
      title: T('7 gabime në skedarët e paketimit — dhe si t’i shmangni', '7 packaging artwork mistakes — and how to avoid them'),
      excerpt: T(
        'Nga bleed-i që mungon te barkodi pranë palosjes: gabimet që shohim më shpesh në prepress.',
        'From missing bleed to a barcode on the fold: the mistakes we see most often in prepress.',
      ),
      body: T(
        `Prepress-i ynë kontrollon çdo skedar para provës. Këto janë shtatë gabimet që hasim më shpesh — dhe të gjitha shmangen lehtë.

## 1. Pa bleed
Imazhi ndalet saktësisht te vija e prerjes. Rezultati: vija të bardha në skaje. Zgjateni sfondin **3 mm** jashtë prerjes.

## 2. Tekst shumë afër prerjes ose palosjes
Teksti i vendosur 1 mm nga skaji rrezikon të pritet. Mbajeni **3–5 mm brenda** dhe larg vijave të palosjes.

## 3. RGB në vend të CMYK
Ngjyrat e ndezura të ekranit nuk ekzistojnë në bojë. Konvertoni në CMYK para se ta aprovoni dizajnin, që të mos ketë surpriza.

## 4. Imazhe me rezolucion të ulët
Një logo e marrë nga faqja e internetit (72 dpi) del e turbullt. Përdorni **300 dpi** ose, më mirë, logo vektoriale.

## 5. Dieline i printueshëm
Vija e prerjes në shtresën e dizajnit printohet në kuti. Vendoseni në shtresë të veçantë, si ngjyrë spot me emrin **Dieline**.

## 6. Barkod në vendin e gabuar
Barkodi mbi palosje ose me kontrast të dobët nuk lexohet. Vendoseni në sipërfaqe të sheshtë, të zi në sfond të bardhë, në madhësi 100%.

## 7. Fontet që mungojnë
Pa fontet e përfshira, teksti zëvendësohet me font tjetër. Konvertoni tekstin në kurba ose përfshini fontet në PDF.

> Udhëzuesi i plotë teknik: [Si të përgatisni skedarët](/faqe/si-te-pergatisni-skedaret).`,
        `Our prepress team checks every file before the proof. These are the seven mistakes we see most — and all of them are easy to avoid.

## 1. No bleed
The image stops exactly at the cut line. The result: white slivers on the edges. Extend the background **3 mm** beyond the cut.

## 2. Text too close to the cut or fold
Text 1 mm from the edge risks being trimmed. Keep it **3–5 mm inside** and away from fold lines.

## 3. RGB instead of CMYK
Bright screen colours don't exist in ink. Convert to CMYK before you sign off the design, so there are no surprises.

## 4. Low-resolution images
A logo taken from a website (72 dpi) prints blurry. Use **300 dpi** or, better, a vector logo.

## 5. A printing dieline
A cut line on the artwork layer gets printed on the box. Put it on its own layer as a spot colour named **Dieline**.

## 6. Barcode in the wrong place
A barcode over a fold or with weak contrast won't scan. Place it on a flat panel, black on white, at 100% size.

## 7. Missing fonts
Without embedded fonts, text is replaced with another typeface. Convert text to outlines or embed the fonts in the PDF.

> The full technical guide: [Preparing your artwork](/faqe/si-te-pergatisni-skedaret).`,
      ),
      cover: '/images/p/kuti-farmaceutike.webp',
      tag: T('Prepress', 'Prepress'),
      author: AUTHOR,
      readMinutes: 4,
      publishedAt: d(27),
      published: true,
    },
    {
      id: 'post-etiketa',
      slug: 'etiketa-qe-mbijetojne-frigoriferin',
      title: T('Etiketa që mbijetojnë frigoriferin dhe banjon', 'Labels that survive the fridge and the bathroom'),
      excerpt: T(
        'Lagështia, yndyra dhe kimikatet i shkatërrojnë etiketat e zakonshme. Materiali dhe ngjitësi i duhur bëjnë dallimin.',
        'Moisture, grease and chemicals destroy ordinary labels. The right material and adhesive make the difference.',
      ),
      body: T(
        `Një etiketë që zbardhet në frigorifer ose shqitet në dush e dëmton markën më shumë se mungesa e saj. Qëndrueshmëria nuk vjen nga printimi — vjen nga tre zgjedhje.

## 1. Materiali
- **Letër semi-gloss** — e shkëlqyer për kavanoza, kuti dhe produkte të thata
- **PP e bardhë** — plastikë që nuk thithet nga uji; standardi për frigorifer, pije dhe kozmetikë
- **PP transparente** — efekti "pa etiketë" në shishe qelqi ose plastike
- **PP metalike** — pamje premium me rezistencë të PP-së

## 2. Ngjitësi
Ngjitësi i përgjithshëm nuk mban në sipërfaqe të ftohta ose të lagura. Për produkte që mbushen të ftohta ose ruhen në frigorifer përdorim **ngjitës për temperatura të ulëta**; për shampo dhe detergjentë, ngjitës që i reziston lagështisë dhe produktit vetë.

## 3. Mbrojtja e sipërfaqes
Llaku UV ose laminimi mbrojtës e mbron printimin nga gërvishtjet, vaji dhe kimikatet. Te detergjentët dhe produktet e pastrimit, laminimi është i domosdoshëm.

## Kombinimet që rekomandojmë
- Reçel dhe salca në frigorifer → letër semi-gloss + ngjitës për të ftohtë + llak
- Shampo dhe xhel dushi → PP e bardhë ose transparente + laminim
- Detergjent → PP e bardhë + ngjitës rezistent + laminim
- Vaj ulliri → letër e strukturuar ose PP me llak që nuk e thith yndyrën

> Testojmë kombinimin para tirazhit: kërkoni disa etiketa provë në HP Indigo dhe vendosini në produktin tuaj real.`,
        `A label that fades in the fridge or peels off in the shower hurts a brand more than no label at all. Durability doesn't come from the print — it comes from three choices.

## 1. Material
- **Semi-gloss paper** — great for jars, boxes and dry goods
- **White PP** — a plastic face that doesn't absorb water; the standard for chilled products, drinks and cosmetics
- **Clear PP** — the "no-label" look on glass or plastic bottles
- **Metallic PP** — a premium look with PP's resistance

## 2. Adhesive
General-purpose adhesive won't hold on cold or wet surfaces. For products filled cold or kept refrigerated we use a **low-temperature adhesive**; for shampoo and detergent, an adhesive that resists moisture and the product itself.

## 3. Surface protection
UV varnish or a protective laminate shields the print from scuffs, oil and chemicals. On detergents and cleaning products, lamination is a must.

## The combinations we recommend
- Jam and sauces kept chilled → semi-gloss paper + cold-temperature adhesive + varnish
- Shampoo and shower gel → white or clear PP + laminate
- Detergent → white PP + resistant adhesive + laminate
- Olive oil → textured paper or PP with a grease-resistant varnish

> We test the combination before the run: ask for a few trial labels on HP Indigo and apply them to your real product.`,
      ),
      cover: '/images/p/etiketa-kozmetike.webp',
      tag: T('Etiketa', 'Labels'),
      author: AUTHOR,
      readMinutes: 4,
      publishedAt: d(38),
      published: true,
    },
    {
      id: 'post-qendrueshmeria',
      slug: 'paketim-i-qendrueshem',
      title: T('Paketim i qëndrueshëm: 6 vendime që ulin plastikën', 'Sustainable packaging: 6 decisions that cut plastic'),
      excerpt: T(
        'Paketimi më i gjelbër nuk është gjithmonë më i shtrenjti. Gjashtë hapa praktikë që i bëni që në fazën e dizajnit.',
        'The greenest packaging isn’t always the most expensive. Six practical steps you take at the design stage.',
      ),
      body: T(
        `Klientët tuaj e vënë re paketimin e tepërt — dhe gjithnjë e më shumë, edhe partnerët tuaj tregtarë. Lajmi i mirë: shumica e përmirësimeve nuk e rrisin çmimin.

## 1. Përmasa e duhur
Kutia që i përshtatet produktit përdor më pak karton dhe hapësirë transporti. Ne e ndërtojmë dieline-in rreth produktit tuaj real.

## 2. Karton në vend të plastikës
Dritaret plastike, tabakatë PET dhe insertet nga shkuma shpesh zëvendësohen me karton të palosur. Kutia mbetet një material — më e lehtë për t'u ricikluar.

## 3. Llak dispersion në vend të laminimit
Laminimi shton një shtresë plastike. Për shumë paketime ushqimore, **llaku dispersion me bazë uji** jep mbrojtje të mjaftueshme dhe e lë kartonin të riciklueshëm.

## 4. Kraft dhe fibër e ricikluar
Kraft-i natyral nuk ka nevojë për zbardhim dhe e komunikon qëndrueshmërinë pa fjalë.

## 5. Më pak bojë, më shumë dizajn
Dizajnet me një deri në dy ngjyra dhe hapësirë të lirë përdorin më pak bojë dhe shpesh duken më premium.

## 6. Porosi sipas nevojës
Me printimin digjital nuk keni pse të porosisni 10.000 copë që të merrni çmim të mirë. Tirazhe më të vogla do të thotë më pak stok që skadon kur ndryshon dizajni.

> Po planifikoni rifreskimin e paketimit? [Kërkoni ofertë](/kerko-oferte) dhe shënoni "qëndrueshmëri" — ju propozojmë alternativat me karton.`,
        `Your customers notice excess packaging — and increasingly, so do your retail partners. The good news: most improvements don't raise the price.

## 1. The right size
A box that fits the product uses less board and less shipping space. We build the dieline around your actual product.

## 2. Board instead of plastic
Plastic windows, PET trays and foam inserts can often be replaced with folded board. The box stays a single material — easier to recycle.

## 3. Dispersion varnish instead of lamination
Lamination adds a plastic layer. For much food packaging, a **water-based dispersion varnish** gives enough protection and keeps the board recyclable.

## 4. Kraft and recycled fibre
Natural kraft needs no bleaching and communicates sustainability without a word.

## 5. Less ink, more design
One- or two-colour designs with breathing room use less ink and often look more premium.

## 6. Order to demand
With digital printing you don't have to order 10,000 pieces to get a good price. Smaller runs mean less stock that goes to waste when the design changes.

> Planning a packaging refresh? [Request a quote](/kerko-oferte) and mention "sustainability" — we'll propose board-based alternatives.`,
      ),
      cover: '/images/p/qese-kraft.webp',
      tag: T('Qëndrueshmëri', 'Sustainability'),
      author: AUTHOR,
      readMinutes: 4,
      publishedAt: d(52),
      published: true,
    },
    {
      id: 'post-shrink',
      slug: 'si-funksionon-shrink-sleeve',
      title: T('Si funksionon shrink sleeve — etiketa 360° për shishe', 'How shrink sleeves work — 360° labels for bottles'),
      excerpt: T(
        'Një film i printuar që tkurret rreth shishes dhe e mbulon nga qafa te fundi. Kur ia vlen dhe çfarë duhet të dini për dizajnin.',
        'A printed film that shrinks around a bottle and covers it from neck to base. When it pays off and what to know for the design.',
      ),
      body: T(
        `Shrink sleeve është mënyra më e shpejtë për ta kthyer një shishe të zakonshme në produkt që bie në sy. E gjithë sipërfaqja bëhet hapësirë për markën.

## Si prodhohet
1. Dizajni printohet **në anën e brendshme** të një filmi transparent (PETG ose PVC), që boja të mbrohet
2. Filmi ngjitet në formë tubi dhe pritet në gjatësinë e shishes
3. Mënga vendoset mbi shishe dhe kalon nëpër një tunel me avull ose ajër të nxehtë
4. Filmi tkurret dhe merr formën e saktë të shishes

## Kur ia vlen
- Shishe me forma të veçanta, ku etiketa e sheshtë nuk ngjitet mirë
- Produkte që duan **360° hapësirë** për markë, përbërës dhe gjuhë të shumta
- Pije dhe produkte qumështi që ruhen në frigorifer — filmi nuk shqitet nga lagështia
- Vulë sigurie: mënga mund të mbulojë edhe kapakun

## Çfarë duhet të dini për dizajnin
Filmi tkurret më shumë në pjesët e ngushta të shishes, ndaj dizajni **deformohet qëllimisht** në skedar që të duket i drejtë në shishe. Këtë e bën prepress-i ynë me modelin e shishes suaj — ju dërgojmë provën e deformimit dhe, sipas nevojës, mostër fizike.

> Na dërgoni një shishe ose vizatimin teknik dhe [kërkoni ofertë](/kerko-oferte) për shrink sleeve.`,
        `A shrink sleeve is the fastest way to turn an ordinary bottle into a product that stands out. The whole surface becomes brand space.

## How it's made
1. The design is printed **on the inside** of a clear film (PETG or PVC), so the ink is protected
2. The film is seamed into a tube and cut to the bottle's length
3. The sleeve goes over the bottle and through a steam or hot-air tunnel
4. The film shrinks and takes the exact shape of the bottle

## When it pays off
- Shaped bottles where a flat label won't sit well
- Products that need **360° of space** for brand, ingredients and several languages
- Drinks and dairy kept refrigerated — the film doesn't peel in moisture
- Tamper evidence: the sleeve can cover the cap too

## What to know for the design
The film shrinks more where the bottle narrows, so the artwork is **deliberately distorted** in the file to look right on the bottle. Our prepress team does this with your bottle's model — we send you a distortion proof and, if needed, a physical sample.

> Send us a bottle or its technical drawing and [request a quote](/kerko-oferte) for shrink sleeves.`,
      ),
      cover: '/images/p/shrink-sleeve.webp',
      tag: T('Etiketa', 'Labels'),
      author: AUTHOR,
      readMinutes: 4,
      publishedAt: d(66),
      published: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Coupons (legacy code list — the pricing engine uses `discounts`)    */
/* ------------------------------------------------------------------ */
export function buildCoupons(now = new Date()): Coupon[] {
  return [
    { id: 'cp-1', code: 'PRINT10', type: 'percent', value: 10, minTotal: 100, active: true, uses: 37, description: 'Mirëseardhje — 10% në porosinë e parë mbi €100' },
    { id: 'cp-2', code: 'MOSTRA19', type: 'fixed', value: 19, minTotal: 150, active: true, uses: 21, description: 'Vlera e paketës së mostrave (€19) zbritet nga porosia e parë mbi €150' },
    { id: 'cp-3', code: 'FESTA25', type: 'fixed', value: 25, minTotal: 300, active: true, uses: 9, expiresAt: new Date(now.getTime() + 20 * 86400000).toISOString(), description: 'Sezoni i festave — €25 zbritje për porosi mbi €300' },
    { id: 'cp-4', code: 'AGJENCI15', type: 'percent', value: 15, minTotal: 500, active: false, uses: 4, description: 'Për agjenci dizajni dhe marketingu (joaktiv)' },
  ];
}
