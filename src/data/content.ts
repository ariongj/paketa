import type { CmsPage, Coupon, HomeSection, L10n, Post, Project, Settings } from '@/lib/types';

// Paketoje storefront content: settings, homepage, references, CMS pages, blog and legacy codes.
// T(me, sq, en): `me` holds Serbian (Latin), `sq` Albanian (primary), `en` English.
const T = (me: string, sq: string, en: string): L10n => ({ me, sq, en });

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */
// Real data (published in paketoje.com's own Terms of Service / refund policy): legal name Paketoje SH.P.K,
// info@paketoje.com, refund@paketoje.com, Sylyshaj (P.N/Suhodoll), Mitrovicë, tel. +383 48 400 061,
// business number (NUI) 812224632, the 5-day return policy.
// PLACEHOLDERS — confirm with the client before going live: hours, pdv (Nr. TVSH), bankName, bankAccount, whatsapp,
// instagram, the Prishtina pickup point (loc-pr) and the integration providers.
export const DEFAULT_SETTINGS: Settings = {
  companyName: 'Paketoje',
  legalName: 'Paketoje SH.P.K',
  tagline: T('Ambalaža za hranu za vaš biznis', 'Paketim ushqimi për biznesin tuaj', 'Food packaging for your business'),
  about: T(
    'Paketoje snabdijeva kafiće, restorane, brzu hranu, poslastičarnice i sladoledžinice ambalažom za hranu i piće: čaše F95 i poklopci, posude za poneti, čašice za sos, pribor i slamke. Prodajemo na pakovanja i kartone po veleprodajnim cijenama, štampamo vaš logo na čašama i kutijama i dostavljamo širom Kosova — iz našeg magacina u Suhodollu, Mitrovica.',
    'Paketoje furnizon kafiteri, restorante, fast food, pastiçeri dhe akullore me paketim për ushqim dhe pije: gota F95 dhe kapakë, enë për take-away, gota për salca, takëm dhe shkopinj. Shesim me pako dhe me karton, me çmime shumice, printojmë logon tuaj në gota e kuti dhe dërgojmë në gjithë Kosovën — nga depoja jonë në Suhodoll të Mitrovicës.',
    'Paketoje supplies cafés, restaurants, fast-food outlets, pastry shops and ice-cream parlours with food and drink packaging: F95 cups and lids, take-away containers, sauce cups, cutlery and straws. We sell by the pack and by the carton at wholesale prices, print your logo on cups and boxes, and deliver across Kosovo — from our warehouse in Suhodoll, Mitrovica.',
  ),
  email: 'info@paketoje.com',
  phone: '+383 48 400 061',
  phone2: '',
  whatsapp: '+383 48 400 061',
  address: 'Sylyshaj, Suhodoll',
  city: 'Mitrovicë',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Suhodoll%2C+Mitrovic%C3%AB',
  hours: T('Pon–Pet 08–17h · Sub 08–14h', 'Hën–Pre 08:00–17:00 · Sht 08:00–14:00', 'Mon–Fri 8am–5pm · Sat 8am–2pm'),
  pib: '812224632',
  pdv: '330XXXXXX',
  bankName: 'Banka (shembull)',
  bankAccount: 'XK05 XXXX XXXX XXXX XXXX',
  instagram: 'paketoje',
  facebook: '',
  currency: 'EUR',
  vatRate: 18,
  freeShippingThreshold: 50,
  shippingZones: [
    { id: 'z1', name: 'Mitrovicë & rrethina', cities: ['Mitrovicë', 'Vushtrri', 'Skenderaj', 'Zveçan'], fee: 2, days: '1' },
    { id: 'z2', name: 'Prishtinë & qendra', cities: ['Prishtinë', 'Fushë Kosovë', 'Obiliq', 'Podujevë', 'Lipjan', 'Drenas', 'Graçanicë'], fee: 3, days: '1–2' },
    {
      id: 'z3',
      name: 'Pjesa tjetër e Kosovës',
      cities: [
        'Pejë', 'Prizren', 'Gjakovë', 'Ferizaj', 'Gjilan', 'Istog', 'Klinë', 'Deçan', 'Rahovec', 'Suharekë', 'Malishevë', 'Kamenicë', 'Viti',
        'Kaçanik', 'Shtime', 'Dragash', 'Junik', 'Leposaviq', 'Zubin Potok', 'Novobërdë', 'Shtërpcë', 'Hani i Elezit', 'Mamushë', 'Kllokot',
        'Ranillug', 'Partesh',
      ],
      fee: 4,
      days: '1–3',
    },
  ],
  pickupAddress: 'Depo Paketoje, Sylyshaj, Suhodoll, Mitrovicë',
  payments: { cod: true, bank: true, card: true },
  languages: { me: true, sq: true, en: true },
  announcements: [
    T('Besplatna dostava za narudžbe od 50 € naviše', 'Dërgesë falas për porositë nga 50 € e lart', 'Free delivery on orders of €50 or more'),
    T('Dostava: Mitrovica za 24 sata · cijelo Kosovo za 1–3 dana', 'Dërgesa: Mitrovicë brenda 24 orëve · Kosovë 1–3 ditë', 'Delivery: Mitrovica within 24 h · all of Kosovo in 1–3 days'),
    T('Besplatni uzorci za firme — probajte prije narudžbe', 'Mostra falas për biznese — provoni para se të porositni', 'Free samples for businesses — try before you order'),
  ],
  brandColor: '#00723a',
  demoBanner: true,
  seo: {
    title: 'Paketoje — Paketim ushqimi për biznesin tuaj',
    description:
      'Gota F95, kapakë, enë ushqimi, gota për salca, takëm dhe shkopinj me çmime shumice. Printim me logo dhe dërgesë në gjithë Kosovën — nga Mitrovica.',
  },
  adminEmail: 'admin@paketoje.com',

  /* ---- CMS v2 ---- */
  timezone: 'Europe/Belgrade',
  orderPrefix: 'PK-',
  locations: [
    { id: 'loc-depo', name: 'Depo Suhodoll', address: 'Sylyshaj, Suhodoll', city: 'Mitrovicë', pickup: true, isDefault: true },
    // Placeholder — a possible pickup point in Prishtina, switched off until confirmed.
    { id: 'loc-pr', name: 'Pikë marrjeje Prishtinë', address: 'Adresa do të konfirmohet', city: 'Prishtinë', pickup: false, isDefault: false },
  ],
  notifications: [
    { id: 'nt-order', event: 'order_placed', enabled: true, recipients: 'customer', subject: T('Hvala! Primili smo vašu narudžbu {number}', 'Faleminderit! E morëm porosinë tuaj {number}', 'Thank you! We received your order {number}') },
    { id: 'nt-confirm', event: 'order_confirmed', enabled: true, recipients: 'customer', subject: T('Narudžba {number} je potvrđena i pakuje se', 'Porosia {number} u konfirmua dhe po paketohet', 'Order {number} is confirmed and being packed') },
    { id: 'nt-payment', event: 'payment_received', enabled: true, recipients: 'customer', subject: T('Uplata za narudžbu {number} je evidentirana', 'Pagesa për porosinë {number} u regjistrua', 'Payment for order {number} received') },
    { id: 'nt-shipped', event: 'order_shipped', enabled: true, recipients: 'customer', subject: T('Narudžba {number} je krenula ka vama', 'Porosia {number} është nisur drejt jush', 'Order {number} is on its way to you') },
    { id: 'nt-return', event: 'return_requested', enabled: true, recipients: 'staff', subject: T('Novi zahtjev za povrat {number}', 'Kërkesë e re për kthim {number}', 'New return request {number}') },
    { id: 'nt-refund', event: 'return_refunded', enabled: true, recipients: 'customer', subject: T('Povrat novca za {number} je odobren', 'Rimbursimi për {number} u miratua', 'Your refund for {number} is approved') },
    { id: 'nt-contact', event: 'contact_received', enabled: true, recipients: 'customer', subject: T('Hvala — javićemo vam se danas', 'Faleminderit — do t’ju kontaktojmë sot', 'Thank you — we’ll get back to you today') },
    { id: 'nt-booking', event: 'booking_confirmed', enabled: true, recipients: 'customer', subject: T('Sastanak {date} je potvrđen', 'Takimi më {date} u konfirmua', 'Your meeting on {date} is confirmed') },
    { id: 'nt-reminder', event: 'booking_reminder', enabled: false, recipients: 'customer', subject: T('Podsjetnik: sastanak sjutra u {time}', 'Kujtesë: takimi nesër në orën {time}', 'Reminder: meeting tomorrow at {time}') },
    { id: 'nt-staff-order', event: 'staff_new_order', enabled: true, recipients: 'staff', subject: T('Nova narudžba {number} — {total}', 'Porosi e re {number} — {total}', 'New order {number} — {total}') },
    { id: 'nt-staff-inquiry', event: 'staff_new_inquiry', enabled: true, recipients: 'staff', subject: T('Novi upit: {name}', 'Kërkesë e re: {name}', 'New enquiry: {name}') },
  ],
  integrations: [
    { id: 'int-payment', kind: 'payment', name: 'Pagesa me kartelë (gateway i bankës)', status: 'test', note: 'Modaliteti test — kartelat nuk ngarkohen. Çelësat e prodhimit pas marrëveshjes për e-commerce me bankën.' },
    { id: 'int-courier', kind: 'courier', name: 'Shërbim korrieri lokal', status: 'disconnected', note: 'Tani për tani dërgesat bëhen me automjetet tona; API e korrierit sipas partnerit të zgjedhur.' },
    { id: 'int-email', kind: 'email', name: 'Email transaksional (SMTP)', status: 'connected', note: 'Konfirmimet e porosive, kërkesave dhe takimeve dërgohen nga info@paketoje.com.' },
    { id: 'int-fiscal', kind: 'fiscal', name: 'Fiskalizimi (ATK)', status: 'disconnected', note: 'Lidhja me sistemin e fiskalizimit të Administratës Tatimore të Kosovës (ATK) — planifikuar për fazën 2.' },
    { id: 'int-analytics', kind: 'analytics', name: 'Google Analytics 4 + Meta Pixel', status: 'test', note: 'Matja e vizitave, shportave dhe porosive në property test; Pixel-i aktivizohet pas pëlqimit për cookies.' },
  ],
  markets: [
    { id: 'mk-xk', name: T('Kosovo', 'Kosova', 'Kosovo'), countries: ['XK'], currency: 'EUR', languages: ['sq', 'en', 'me'], status: 'active' },
    { id: 'mk-al', name: T('Albanija (B2B na upit)', 'Shqipëria (B2B me kërkesë)', 'Albania (B2B on request)'), countries: ['AL'], currency: 'EUR', languages: ['sq', 'en'], status: 'draft' },
    { id: 'mk-mk', name: T('Sjeverna Makedonija (B2B na upit)', 'Maqedonia e Veriut (B2B me kërkesë)', 'North Macedonia (B2B on request)'), countries: ['MK'], currency: 'EUR', languages: ['sq', 'en'], status: 'draft' },
    { id: 'mk-me', name: T('Crna Gora (B2B na upit)', 'Mali i Zi (B2B me kërkesë)', 'Montenegro (B2B on request)'), countries: ['ME'], currency: 'EUR', languages: ['sq', 'en', 'me'], status: 'draft' },
  ],
  checkout: { guest: true, phoneRequired: true, companyField: 'optional', marketingOptIn: false },
  privacy: { cookieBanner: true },
};

/* ------------------------------------------------------------------ */
/* Homepage sections                                                   */
/* ------------------------------------------------------------------ */
export function buildHome(now = new Date()): HomeSection[] {
  const endsAt = new Date(now.getTime() + 9 * 86400000 + 6 * 3600000).toISOString();
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
            image: '/images/hero/kraft.webp',
            eyebrow: T('Kraft, papir i štampa logotipa', 'Kraft, letër & printim me logo', 'Kraft, paper & logo print'),
            title: T('Vaš brend, *u svakoj narudžbi*.', 'Marka juaj, *në çdo porosi*.', 'Your brand, *on every order*.'),
            subtitle: T(
              'Kraft kutije, papirne čaše i naljepnice sa vašim logotipom — od 1 kartona, gotovo za 7–10 radnih dana. Uskoro i kompostabilna PLA linija.',
              'Kuti kraft, gota letre dhe ngjitëse me logon tuaj — nga 1 karton, gati për 7–10 ditë pune. Së shpejti edhe linja e kompostueshme PLA.',
              'Kraft boxes, paper cups and stickers with your logo — from 1 carton, ready in 7–10 working days. A compostable PLA range is coming soon.',
            ),
            primary: { label: T('Štampa logotipa', 'Printim me logo', 'Logo printing'), href: '/sherbimet' },
            secondary: { label: T('Svi proizvodi', 'Të gjitha produktet', 'All products'), href: '/produktet' },
          },
          {
            id: 's2',
            image: '/images/hero/smoothie.webp',
            eyebrow: T('Čaše i poklopci F95', 'Gota & kapakë F95', 'F95 cups & lids'),
            title: T('Hladni napici, *bez ijedne kapi* prosute.', 'Pije të ftohta, *pa asnjë pikë* të derdhur.', 'Cold drinks, *not a drop* spilled.'),
            subtitle: T(
              'Čaše F95 od 250 do 500 ml i ravni, kupolasti i clip poklopci koji odgovaraju svakoj — od 0,04 € po komadu, uz veleprodajne cijene po kartonu.',
              'Gota F95 nga 250 deri në 500 ml dhe kapakë të sheshtë, kupolë e clip që përshtaten me secilën — nga 0,04 € copa, me çmime shumice për karton.',
              'F95 cups from 250 to 500 ml with flat, dome and clip lids that fit every one — from €0.04 a piece, with wholesale prices by the carton.',
            ),
            primary: { label: T('Pogledajte čaše', 'Shikoni gotat', 'Shop cups'), href: '/produktet/gota' },
            secondary: { label: T('Poklopci F95', 'Kapakët F95', 'F95 lids'), href: '/produktet/kapake' },
          },
          {
            id: 's3',
            image: '/images/hero/meal.webp',
            eyebrow: T('Posude za poneti i dostavu', 'Enë për take-away & dërgesa', 'Take-away & delivery containers'),
            title: T('Hrana stiže *kao u restoranu*.', 'Ushqimi arrin *si në restorant*.', 'Food arrives *just like in the restaurant*.'),
            subtitle: T(
              'Posude za mikrotalasnu, kutije sa pregradama, posude za suši i salate — hermetične, čvrste i sa dostavom za 24 sata u Mitrovici.',
              'Enë për mikrovalë, kuti me ndarje, enë për sushi dhe sallata — hermetike, të qëndrueshme dhe me dërgesë brenda 24 orëve në Mitrovicë.',
              'Microwave containers, compartment boxes, sushi and salad containers — leak-proof, sturdy and delivered within 24 hours in Mitrovica.',
            ),
            primary: { label: T('Posude za hranu', 'Enët e ushqimit', 'Food containers'), href: '/produktet/ene-ushqimi' },
            secondary: { label: T('Besplatni uzorci', 'Mostra falas', 'Free samples'), href: '/#mostra' },
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
          { icon: 'Truck', title: T('Dostava za 24 sata', 'Dërgesë brenda 24 orëve', 'Delivery within 24 h'), text: T('Mitrovica · Kosovo 1–3 dana · besplatno od 50 €', 'Mitrovicë · Kosovë 1–3 ditë · falas nga 50 €', 'Mitrovica · Kosovo 1–3 days · free from €50') },
          { icon: 'Award', title: T('Veleprodajne cijene', 'Çmime shumice', 'Wholesale prices'), text: T('10+ pakovanja −5 % · karton do −10 %', '10+ pako −5 % · karton deri −10 %', '10+ packs −5 % · carton up to −10 %') },
          { icon: 'Sparkles', title: T('Štampa logotipa', 'Printim me logo', 'Logo printing'), text: T('Od 1 kartona · 7–10 radnih dana', 'Nga 1 karton · 7–10 ditë pune', 'From 1 carton · 7–10 working days') },
          { icon: 'ShieldCheck', title: T('Besplatni uzorci', 'Mostra falas', 'Free samples'), text: T('Probajte čaše i posude prije narudžbe', 'Provoni gotat dhe enët para porosisë', 'Try cups and containers before you order') },
        ],
      },
    },
    {
      id: 'categories',
      type: 'categories',
      enabled: true,
      data: {
        eyebrow: T('Asortiman', 'Asortimenti', 'Our range'),
        title: T('Šta pakujete *danas*?', 'Çfarë po paketoni *sot*?', 'What are you packing *today*?'),
        subtitle: T(
          'Čaše, poklopci, posude, deserti, sosovi, pribor i slamke — sve za poneti, na jednom mjestu.',
          'Gota, kapakë, enë, ëmbëlsira, salca, takëm dhe shkopinj — gjithçka për take-away, në një vend.',
          'Cups, lids, containers, desserts, sauce cups, cutlery and straws — everything for take-away, in one place.',
        ),
      },
    },
    {
      id: 'featured',
      type: 'featured',
      enabled: true,
      data: {
        eyebrow: T('Najprodavanije', 'Më të shiturat', 'Bestsellers'),
        title: T('Ono što lokali naručuju *svake sedmice*', 'Ato që lokalet porositin *çdo javë*', 'What venues reorder *every week*'),
        mode: 'bestsellers',
        productIds: [],
      },
    },
    {
      id: 'promo',
      type: 'promo',
      enabled: true,
      data: {
        eyebrow: T('Ponuda za kafiće', 'Ofertë për kafiteri', 'Café offer'),
        title: T('4 pakovanja čaša F95 = *1 pakovanje poklopaca gratis*', '4 pako gota F95 = *1 pako kapakë falas*', '4 packs of F95 cups = *1 pack of lids free*'),
        text: T(
          'Dodajte 4 pakovanja bilo kojih čaša F95 i jedno pakovanje poklopaca F95 — popust se obračunava automatski u korpi. Novi kupci uz kod MIRESEERDHE dobijaju −10 % na prvu narudžbu od 30 €.',
          'Shtoni 4 pako çfarëdo gotash F95 dhe një pako kapakë F95 — zbritja llogaritet automatikisht në shportë. Klientët e rinj me kodin MIRESEERDHE përfitojnë −10 % në porosinë e parë nga 30 €.',
          'Add 4 packs of any F95 cups and one pack of F95 lids — the discount is applied automatically in the cart. New customers get −10 % on a first order of €30+ with code MIRESEERDHE.',
        ),
        image: '/images/misc/iced.webp',
        cta: { label: T('Pogledajte čaše F95', 'Shikoni gotat F95', 'Shop F95 cups'), href: '/produktet/gota' },
        endsAt,
        code: 'MIRESEERDHE',
      },
    },
    {
      id: 'process',
      type: 'process',
      enabled: true,
      data: {
        eyebrow: T('Kako naručiti', 'Si të porositni', 'How ordering works'),
        title: T('Od izbora do dostave — *u četiri koraka*', 'Nga zgjedhja te dorëzimi — *në katër hapa*', 'From choosing to delivery — *in four steps*'),
        steps: [
          {
            title: T('Izaberite proizvode', 'Zgjidhni produktet', 'Choose your products'),
            text: T(
              'Kod svakog proizvoda vidite cijenu po pakovanju i po komadu, koliko komada ima pakovanje i koliko pakovanja ima karton.',
              'Te çdo produkt shihni çmimin për pako dhe për copë, sa copë ka pakoja dhe sa pako ka kartoni.',
              'Every product shows the price per pack and per piece, how many pieces a pack holds and how many packs make a carton.',
            ),
          },
          {
            title: T('Naručite po pakovanju ili kartonu', 'Porositni me pako ose karton', 'Order by the pack or carton'),
            text: T(
              'Veleprodajni popust se obračunava sam: 10+ pakovanja −5 %, pun karton do −10 %. Plaćanje pouzećem, karticom ili virmanski uz račun.',
              'Zbritja e shumicës llogaritet vetë: 10+ pako −5 %, karton i plotë deri −10 %. Paguani në dorëzim, me kartelë ose me transfertë me faturë.',
              'The wholesale discount applies itself: 10+ packs −5 %, a full carton up to −10 %. Pay cash on delivery, by card or by bank transfer with an invoice.',
            ),
          },
          {
            title: T('Dostava za 24 sata – 3 dana', 'Dorëzim për 24 orë – 3 ditë', 'Delivery in 24 h – 3 days'),
            text: T(
              'Mitrovica i okolina za 24 sata, ostatak Kosova za 1–3 radna dana — besplatno od 50 €. Ili preuzmite sami u magacinu u Suhodollu.',
              'Mitrovicë dhe rrethina brenda 24 orëve, pjesa tjetër e Kosovës për 1–3 ditë pune — falas nga 50 €. Ose merreni vetë në depo në Suhodoll.',
              'Mitrovica and surroundings within 24 hours, the rest of Kosovo in 1–3 working days — free from €50. Or collect it yourself at our Suhodoll warehouse.',
            ),
          },
          {
            title: T('Ponovite narudžbu', 'Riporositni', 'Reorder'),
            text: T(
              'Kada vam ponestane zaliha, naručite iste proizvode ponovo — ili nam pošaljite spisak i pripremićemo mjesečnu ponudu za vaš lokal.',
              'Kur t’ju mbarojë stoku, porositni sërish të njëjtat produkte — ose na dërgoni listën dhe ju përgatisim ofertën mujore për lokalin tuaj.',
              'When stock runs low, order the same items again — or send us your list and we’ll prepare a monthly offer for your venue.',
            ),
          },
        ],
      },
    },
    {
      id: 'services',
      type: 'services',
      enabled: true,
      data: {
        eyebrow: T('Za firme', 'Për biznese', 'For business'),
        title: T('Više od ambalaže — *partner za vaš take-away*', 'Më shumë se paketim — *partneri juaj për take-away*', 'More than packaging — *your take-away partner*'),
        subtitle: T(
          'Štampa logotipa, veleprodajne cijene, besplatni uzorci i brza dostava širom Kosova.',
          'Printim me logo, çmime shumice, mostra falas dhe dërgesë e shpejtë në gjithë Kosovën.',
          'Logo printing, wholesale prices, free samples and fast delivery across Kosovo.',
        ),
        items: [
          {
            image: '/images/s/printim.webp',
            title: T('Štampa logotipa', 'Printim me logo', 'Logo printing'),
            text: T(
              'Čaše F95, papirne čaše, kraft kutije i naljepnice sa vašim brendom. Šaljete logo, mi šaljemo probni dizajn — proizvodnja 7–10 radnih dana od 1 kartona.',
              'Gota F95, gota letre, kuti kraft dhe ngjitëse me markën tuaj. Na dërgoni logon, ju dërgojmë provën e dizajnit — prodhimi 7–10 ditë pune, nga 1 karton.',
              'F95 cups, paper cups, kraft boxes and stickers with your brand. Send us your logo, we send a proof — production in 7–10 working days, from 1 carton.',
            ),
          },
          {
            image: '/images/s/shumice.webp',
            title: T('Veleprodajne cijene', 'Çmime shumice', 'Wholesale prices'),
            text: T(
              'Popust po količini za svaku stavku u korpi: 10+ pakovanja −5 %, pun karton do −10 %. Za mjesečno snabdijevanje pravimo posebnu ponudu.',
              'Zbritje sipas sasisë për çdo produkt në shportë: 10+ pako −5 %, karton i plotë deri −10 %. Për furnizim mujor përgatisim ofertë të veçantë.',
              'Volume discounts on every cart line: 10+ packs −5 %, a full carton up to −10 %. For monthly supply we prepare a dedicated offer.',
            ),
          },
          {
            image: '/images/s/mostra.webp',
            title: T('Besplatni uzorci', 'Mostra falas', 'Free samples'),
            text: T(
              'Niste sigurni za veličinu čaše ili posude? Pošaljemo vam uzorke besplatno ili ih donesemo u vaš lokal.',
              'Nuk jeni të sigurt për madhësinë e gotës apo enës? Ju dërgojmë mostra falas ose jua sjellim në lokal.',
              'Not sure which cup or container size? We send you free samples or bring them to your venue.',
            ),
          },
          {
            image: '/images/s/dergesa.webp',
            title: T('Brza dostava', 'Dërgesë e shpejtë', 'Fast delivery'),
            text: T(
              'Mitrovica za 24 sata, Priština za 1–2 dana, ostatak Kosova za 1–3 dana. Besplatno za narudžbe od 50 €.',
              'Mitrovicë brenda 24 orëve, Prishtinë 1–2 ditë, pjesa tjetër e Kosovës 1–3 ditë. Falas për porositë nga 50 €.',
              'Mitrovica within 24 hours, Pristina in 1–2 days, the rest of Kosovo in 1–3 days. Free on orders of €50 or more.',
            ),
          },
          {
            image: '/images/s/konsulence.webp',
            title: T('Savjet za ambalažu', 'Këshillim për paketim', 'Packaging advice'),
            text: T(
              'Pomažemo vam da uskladite ambalažu sa menijem: koja posuda za toplo, koja za salate, koliko sosa po porciji — i koliko to košta po narudžbi.',
              'Ju ndihmojmë ta përshtatni paketimin me menynë: cila enë për të nxehtë, cila për sallata, sa salcë për porcion — dhe sa kushton për porosi.',
              'We help you match packaging to your menu: which container for hot food, which for salads, how much sauce per portion — and what it costs per order.',
            ),
          },
          {
            image: '/images/s/magazina.webp',
            title: T('Preuzimanje u magacinu', 'Marrje në depo', 'Warehouse pickup'),
            text: T(
              'Preuzmite narudžbu besplatno u našem magacinu u Suhodollu, Mitrovica — pozvaćemo vas čim bude spremna.',
              'Merreni porosinë falas në depon tonë në Suhodoll të Mitrovicës — ju telefonojmë sapo të jetë gati.',
              'Collect your order free of charge at our warehouse in Suhodoll, Mitrovica — we call you as soon as it’s ready.',
            ),
          },
        ],
      },
    },
    {
      id: 'projects',
      type: 'projects',
      enabled: true,
      data: {
        eyebrow: T('Reference', 'Referencat', 'References'),
        title: T('Ambalaža sa *brendom lokala*', 'Paketim me *markën e lokalit*', 'Packaging with *the venue’s brand*'),
        subtitle: T(
          'Primjeri ambalaže sa logotipom za kafiće, restorane i poslastičarnice širom Kosova.',
          'Shembuj paketimesh me logo për kafiteri, restorante dhe pastiçeri në gjithë Kosovën.',
          'Examples of logo-printed packaging for cafés, restaurants and pastry shops across Kosovo.',
        ),
      },
    },
    {
      id: 'stats',
      type: 'stats',
      enabled: true,
      data: {
        image: '/images/misc/restaurant.webp',
        quote: T(
          'Vi se bavite hranom i gostima — ambalažu donosimo mi, na vrijeme i po veleprodajnoj cijeni.',
          'Ju merruni me ushqimin dhe klientët — paketimin jua sjellim ne, në kohë dhe me çmim shumice.',
          'You focus on the food and your guests — we bring the packaging, on time and at wholesale prices.',
        ),
        items: [
          { value: '35+', label: T('proizvoda na stanju, spremnih za dostavu', 'produkte në stok, gati për dërgesë', 'products in stock, ready to ship') },
          { value: '24 h', label: T('dostava u Mitrovici i okolini', 'dorëzim në Mitrovicë dhe rrethinë', 'delivery in Mitrovica and surroundings') },
          { value: '−10 %', label: T('veleprodajni popust za pun karton', 'zbritje shumice me karton të plotë', 'wholesale discount on a full carton') },
          { value: '50 €', label: T('i više — dostava je besplatna', 'e lart — dërgesa është falas', 'or more — delivery is free') },
        ],
      },
    },
    {
      id: 'instagram',
      type: 'instagram',
      enabled: true,
      data: {
        title: T('Naša ambalaža u vašim lokalima', 'Paketimet tona në lokalet tuaja', 'Our packaging in your venues'),
        images: [
          '/images/misc/kraft-cups.webp',
          '/images/misc/fries.webp',
          '/images/misc/noodles.webp',
          '/images/misc/cups.webp',
          '/images/misc/bowls.webp',
          '/images/misc/cookies.webp',
          '/images/misc/mealprep.webp',
          '/images/misc/box.webp',
        ],
      },
    },
    {
      id: 'faq',
      type: 'faq',
      enabled: true,
      data: {
        eyebrow: T('Pitanja', 'Pyetje', 'FAQ'),
        title: T('Česta pitanja', 'Pyetje të shpeshta', 'Frequently asked questions'),
        items: [
          {
            q: T('Postoji li minimalna narudžba?', 'A ka porosi minimale?', 'Is there a minimum order?'),
            a: T(
              'Ne — za proizvode sa stanja možete naručiti i samo jedno pakovanje. Ispod 50 € plaća se dostava po zoni (2–4 €). Za štampu logotipa minimum je 1 karton po proizvodu, npr. 1.000 čaša F95.',
              'Jo — për produktet në stok mund të porositni edhe vetëm një pako. Nën 50 € paguhet dërgesa sipas zonës (2–4 €). Për printim me logo minimumi është 1 karton për produkt, p.sh. 1.000 gota F95.',
              'No — for stock items you can order as little as one pack. Under €50 a zone delivery fee applies (€2–4). For logo printing the minimum is 1 carton per product, e.g. 1,000 F95 cups.',
            ),
          },
          {
            q: T('Koja je razlika između pakovanja i kartona?', 'Cili është dallimi mes pakos dhe kartonit?', 'What’s the difference between a pack and a carton?'),
            a: T(
              'Pakovanje je najmanja prodajna jedinica (npr. 50 čaša ili 100 poklopaca). Karton je fabričko pakovanje sa više pakovanja (npr. 20 pakovanja = 1.000 čaša F95). Kod svakog proizvoda piše koliko komada ima pakovanje i karton, kao i cijena po komadu.',
              'Pakoja është njësia më e vogël e shitjes (p.sh. 50 gota ose 100 kapakë). Kartoni është paketimi i fabrikës me disa pako (p.sh. 20 pako = 1.000 gota F95). Te çdo produkt shkruan sa copë ka pakoja dhe kartoni, si dhe çmimi për copë.',
              'A pack is the smallest unit we sell (e.g. 50 cups or 100 lids). A carton is the factory case holding several packs (e.g. 20 packs = 1,000 F95 cups). Every product shows the pieces per pack and per carton, plus the price per piece.',
            ),
          },
          {
            q: T('Kako funkcionišu veleprodajne cijene?', 'Si funksionojnë çmimet e shumicës?', 'How do wholesale prices work?'),
            a: T(
              'Popust se obračunava automatski u korpi, za svaki proizvod posebno: od 10 pakovanja −5 %, za pun karton −10 % (za proizvode čiji karton ima do 10 pakovanja: −8 % po kartonu). Za veće količine ili mjesečno snabdijevanje zatražite ponudu.',
              'Zbritja llogaritet automatikisht në shportë, për çdo produkt veç e veç: nga 10 pako −5 %, me karton të plotë −10 % (për produktet me karton deri në 10 pako: −8 % për karton). Për sasi më të mëdha ose furnizim mujor kërkoni ofertë.',
              'The discount is applied automatically in the cart, per product: from 10 packs −5 %, a full carton −10 % (for products whose carton holds up to 10 packs: −8 % per carton). For larger volumes or monthly supply, ask for a quote.',
            ),
          },
          {
            q: T('Koliko košta dostava i koliko traje?', 'Sa kushton dërgesa dhe sa zgjat?', 'How much is delivery and how long does it take?'),
            a: T(
              'Mitrovica i okolina (Vučitrn, Srbica, Zvečan): 2 €, za 24 sata. Priština i centralni dio: 3 €, 1–2 dana. Ostatak Kosova: 4 €, 1–3 radna dana. Za narudžbe od 50 € dostava je besplatna, a možete i sami preuzeti u magacinu u Suhodollu.',
              'Mitrovicë dhe rrethina (Vushtrri, Skenderaj, Zveçan): 2 €, brenda 24 orëve. Prishtinë dhe qendra: 3 €, 1–2 ditë. Pjesa tjetër e Kosovës: 4 €, 1–3 ditë pune. Për porositë nga 50 € dërgesa është falas, ndërsa porosinë mund ta merrni edhe vetë në depo në Suhodoll.',
              'Mitrovica and surroundings (Vushtrri, Skenderaj, Zveçan): €2, within 24 hours. Pristina and central Kosovo: €3, 1–2 days. Rest of Kosovo: €4, 1–3 working days. Orders of €50 or more ship free, and you can also collect at our Suhodoll warehouse.',
            ),
          },
          {
            q: T('Kako mogu da platim?', 'Si mund të paguaj?', 'How can I pay?'),
            a: T(
              'Pouzećem pri preuzimanju, karticom online ili virmanski na osnovu predračuna. Firme dobijaju račun sa NUI i PDV brojem — upišite podatke firme pri plaćanju.',
              'Me para në dorëzim, me kartelë online ose me transfertë bankare sipas parafaturës. Bizneset marrin faturë me NUI dhe numrin e TVSH-së — shënoni të dhënat e kompanisë në arkë.',
              'Cash on delivery, by card online, or by bank transfer against a pro-forma invoice. Businesses receive an invoice with their NUI and VAT number — just add your company details at checkout.',
            ),
          },
          {
            q: T('Mogu li da vratim proizvod?', 'A mund ta kthej një produkt?', 'Can I return a product?'),
            a: T(
              'Da, u roku od 5 dana od prijema, ako je proizvod nekorišćen, u originalnom pakovanju i uz račun. Prije slanja nam pišite na refund@paketoje.com. Personalizovani proizvodi (sa logotipom) i artikli na akciji ne mogu se vratiti.',
              'Po, brenda 5 ditëve nga pranimi, nëse produkti është i papërdorur, në paketimin origjinal dhe me faturë. Para se ta dërgoni, na shkruani në refund@paketoje.com. Produktet e personalizuara (me logo) dhe artikujt në zbritje nuk kthehen.',
              'Yes, within 5 days of receipt, if the item is unused, in its original packaging and with proof of purchase. Email refund@paketoje.com before sending it back. Personalised (logo-printed) products and sale items can’t be returned.',
            ),
          },
          {
            q: T('Mogu li dobiti besplatne uzorke?', 'A mund të marr mostra falas?', 'Can I get free samples?'),
            a: T(
              'Da — firmama šaljemo besplatne uzorke čaša, poklopaca i posuda da ih isprobate prije narudžbe. Popunite formular „Besplatni uzorci“ i javićemo vam se istog dana.',
              'Po — bizneseve u dërgojmë mostra falas të gotave, kapakëve dhe enëve, që t’i provoni para porosisë. Plotësoni formularin „Mostra falas“ dhe ju kontaktojmë të njëjtën ditë.',
              'Yes — we send businesses free samples of cups, lids and containers to try before ordering. Fill in the “Free samples” form and we’ll get back to you the same day.',
            ),
          },
          {
            q: T('Koliki je minimum za štampu logotipa i koliko traje?', 'Sa është minimumi për printim me logo dhe sa zgjat?', 'What’s the minimum for logo printing and how long does it take?'),
            a: T(
              'Minimum je 1 karton po proizvodu (npr. 1.000 čaša F95). Pošaljete logo, mi pošaljemo probni dizajn na odobrenje, a proizvodnja traje 7–10 radnih dana. Štampa na čašama F95 košta +1,50 € po pakovanju, tj. 0,03 € po čaši.',
              'Minimumi është 1 karton për produkt (p.sh. 1.000 gota F95). Na dërgoni logon, ju dërgojmë provën e dizajnit për miratim, dhe prodhimi zgjat 7–10 ditë pune. Printimi në gotat F95 kushton +1,50 € për pako, pra 0,03 € për gotë.',
              'The minimum is 1 carton per product (e.g. 1,000 F95 cups). You send your logo, we send a proof for approval, and production takes 7–10 working days. Printing on F95 cups costs +€1.50 per pack — €0.03 per cup.',
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
        eyebrow: T('Blog', 'Blog', 'Blog'),
        title: T('Savjeti za ambalažu i *take-away*', 'Këshilla për paketim dhe *take-away*', 'Tips on packaging and *take-away*'),
      },
    },
    {
      id: 'cta',
      type: 'cta',
      enabled: true,
      data: {
        eyebrow: T('Besplatni uzorci', 'Mostra falas', 'Free samples'),
        title: T('Probajte *prije nego što naručite*', 'Provoni *para se të porositni*', 'Try it *before you order*'),
        text: T(
          'Recite nam kakav lokal imate i šta služite — poslaćemo vam besplatne uzorke čaša, poklopaca i posuda ili veleprodajnu ponudu za mjesečno snabdijevanje.',
          'Na tregoni çfarë lokali keni dhe çfarë shërbeni — ju dërgojmë mostra falas të gotave, kapakëve dhe enëve, ose një ofertë shumice për furnizimin mujor.',
          'Tell us about your venue and what you serve — we’ll send free samples of cups, lids and containers, or a wholesale quote for your monthly supply.',
        ),
        image: '/images/s/mostra.webp',
      },
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Referencat (projects)                                               */
/* ------------------------------------------------------------------ */
// ILLUSTRATIVE EXAMPLES — generic venue types, no real client names. Replace with real client work (and photos) once approved.
const TAG = {
  print: T('Štampa logotipa', 'Printim me logo', 'Logo print'),
  cups: T('Čaše', 'Gota', 'Cups'),
  paper: T('Papir i karton', 'Letër & karton', 'Paper & board'),
  boxes: T('Kutije', 'Kuti', 'Boxes'),
  labels: T('Naljepnice', 'Etiketa', 'Labels'),
  desserts: T('Deserti', 'Ëmbëlsira', 'Desserts'),
  takeaway: T('Za poneti', 'Take-away', 'Take-away'),
  containers: T('Posude', 'Enë', 'Containers'),
};

export const PROJECTS: Project[] = [
  {
    id: 'pr-1',
    title: T('Kafić — papirne čaše sa logotipom', 'Kafiteri — gota letre me logo', 'Café — branded paper cups'),
    location: 'Prishtinë',
    year: 2026,
    tags: [TAG.paper, TAG.print],
    summary: T(
      'Papirne čaše od 350 ml za kafu za poneti sa logotipom lokala u jednoj boji i kraft omotačem — dva kartona mjesečno.',
      'Gota letre 350 ml për kafe me vete, me logon e lokalit në një ngjyrë dhe mbështjellëse kraft — dy kartona në muaj.',
      '350 ml paper cups for coffee to go, printed with the café’s logo in one colour plus a kraft sleeve — two cartons a month.',
    ),
    image: '/images/projects/kafiteri.webp',
    featured: true,
  },
  {
    id: 'pr-2',
    title: T('Smoothie bar — čaše F95 sa logotipom', 'Smoothie bar — gota F95 me logo', 'Smoothie bar — branded F95 cups'),
    location: 'Pejë',
    year: 2026,
    tags: [TAG.cups, TAG.print],
    summary: T(
      'Čaše F95 od 500 ml sa logotipom u dvije boje, kupolasti poklopci i slamke od 8 mm — kompletna ambalaža za ljetni meni.',
      'Gota F95 500 ml me logo në dy ngjyra, kapakë kupolë dhe shkopinj 8 mm — paketimi i plotë për menynë e verës.',
      '500 ml F95 cups with a two-colour logo, dome lids and 8 mm straws — the complete pack for the summer menu.',
    ),
    image: '/images/projects/smoothie-bar.webp',
    featured: true,
  },
  {
    id: 'pr-3',
    title: T('Burger restoran — kraft kutije sa logotipom', 'Burger house — kuti kraft me logo', 'Burger joint — branded kraft boxes'),
    location: 'Prizren',
    year: 2025,
    tags: [TAG.boxes, TAG.print, TAG.takeaway],
    summary: T(
      'Kraft kutije za burgere sa logotipom u jednoj boji, čašice za sos od 1 oz i crni setovi pribora za dostavu.',
      'Kuti burgeri kraft me logo në një ngjyrë, gota salcash 1 oz dhe sete takëmesh të zeza për dërgesat.',
      'Kraft burger boxes with a one-colour logo, 1 oz sauce cups and black cutlery sets for deliveries.',
    ),
    image: '/images/projects/burger.webp',
    featured: true,
  },
  {
    id: 'pr-4',
    title: T('Poslastičarnica — kutije i naljepnice', 'Pastiçeri — kuti dhe ngjitëse logo', 'Pastry shop — boxes and logo stickers'),
    location: 'Mitrovicë',
    year: 2025,
    tags: [TAG.desserts, TAG.labels],
    summary: T(
      'Kraft kutije za krofne sa naljepnicom Ø60 mm, gold kutije za parče torte i čaše za desert Venus.',
      'Kuti kraft për donuts me ngjitëse logo Ø60 mm, kuti trekëndëshe gold për copë torte dhe gota ëmbëlsirash Venus.',
      'Kraft donut boxes sealed with a Ø60 mm logo sticker, gold triangle boxes for cake slices and Venus dessert cups.',
    ),
    image: '/images/projects/pasticeri.webp',
    featured: true,
  },
  {
    id: 'pr-5',
    title: T('Sladoledžinica — čaše sa logotipom i roze kašičice', 'Akullore — gota me logo dhe lugë roze', 'Ice-cream parlour — branded cups & pink spoons'),
    location: 'Gjakovë',
    year: 2026,
    tags: [TAG.desserts, TAG.print],
    summary: T(
      'Čaše Bodega od 250 ml sa logotipom i roze kašičice za sladoled — spremno za ljetnu sezonu.',
      'Gota ëmbëlsirash Bodega 250 ml me logo dhe lugë roze për akullore — gati për sezonin e verës.',
      '250 ml Bodega dessert cups with the parlour’s logo and pink ice-cream spoons — ready for the summer season.',
    ),
    image: '/images/projects/akullore.webp',
    featured: true,
  },
  {
    id: 'pr-6',
    title: T('Restoran za poneti — kraft kutije i etikete', 'Restorant take-away — kuti kraft dhe etiketa', 'Take-away restaurant — kraft boxes and labels'),
    location: 'Ferizaj',
    year: 2025,
    tags: [TAG.boxes, TAG.labels, TAG.takeaway],
    summary: T(
      'Kraft kutije za glavna jela zatvorene etiketom sa logotipom i posude za mikrotalasnu za supe i paste.',
      'Kuti kraft për pjatat kryesore, të mbyllura me etiketë logo, dhe enë për mikrovalë për supë dhe pasta.',
      'Kraft boxes for main dishes, sealed with a logo label, plus microwave containers for soups and pasta.',
    ),
    image: '/images/projects/kuti.webp',
    featured: true,
  },
  {
    id: 'pr-7',
    title: T('Brza hrana — naljepnice za kese', 'Fast food — ngjitëse logo për qeset', 'Fast food — logo stickers for bags'),
    location: 'Gjilan',
    year: 2026,
    tags: [TAG.labels, TAG.takeaway],
    summary: T(
      'Naljepnice Ø60 mm u rolni za kraft kese za poneti — brend na svakoj narudžbi uz minimalan trošak.',
      'Ngjitëse logo Ø60 mm në rrotull për qeset kraft të marrjes me vete — marka në çdo porosi, me kosto minimale.',
      'Ø60 mm logo stickers on a roll for kraft take-away bags — the brand on every order at minimal cost.',
    ),
    image: '/images/projects/qese.webp',
    featured: false,
  },
  {
    id: 'pr-8',
    title: T('Suši bar — posude i sosovi', 'Sushi bar — enë sushi dhe salca', 'Sushi bar — trays and sauce cups'),
    location: 'Prishtinë',
    year: 2025,
    tags: [TAG.containers, TAG.labels],
    summary: T(
      'Posude za suši sa crnom bazom i PET poklopcem, čašice od 1 oz za soja sos i naljepnica sa logotipom kao sigurnosni pečat.',
      'Enë sushi me bazë të zezë dhe kapak PET, gota salcash 1 oz për salcë soje dhe ngjitëse logo si vulë sigurie.',
      'Sushi trays with a black base and PET lid, 1 oz cups for soy sauce and a logo sticker as a tamper seal.',
    ),
    image: '/images/projects/sushi.webp',
    featured: false,
  },
];

/* ------------------------------------------------------------------ */
/* CMS pages                                                           */
/* ------------------------------------------------------------------ */
// Page ids/slugs are referenced by menus, the footer and checkout: pg-dostava/transporti, pg-kthimet/kthimet,
// pg-pagesa/pagesa-metodat, pg-kushtet/kushtet, pg-privatesia/privatesia, pg-shumice/shumice, pg-printimi/printimi-me-logo.
// pg-kthimet, pg-kushtet and pg-privatesia are condensed from Paketoje's live Shopify policies (Dec 2024 / Sep 2026).
export function buildPages(now = new Date()): CmsPage[] {
  const at = now.toISOString();
  return [
    {
      id: 'pg-dostava',
      slug: 'transporti',
      title: T('Dostava i preuzimanje', 'Transporti dhe dërgesa', 'Delivery & pickup'),
      body: T(
        `Dostavljamo širom Kosova iz našeg magacina u Suhodollu, Mitrovica. Narudžbe sa stanja obično se pakuju istog ili sljedećeg radnog dana.

## Zone, cijene i rokovi
- **Mitrovica i okolina** (Mitrovica, Vučitrn, Srbica, Zvečan): 2 € · za 24 sata
- **Priština i centralni dio** (Priština, Kosovo Polje, Obilić, Podujevo, Lipljan, Glogovac, Gračanica): 3 € · 1–2 radna dana
- **Ostatak Kosova** (Peć, Prizren, Đakovica, Uroševac, Gnjilane i sve ostale opštine): 4 € · 1–3 radna dana

## Besplatna dostava od 50 €
Za svaku narudžbu od **50 €** naviše dostava je **besplatna** na cijelom Kosovu — popust se obračunava automatski u korpi.

## Preuzimanje u magacinu
Narudžbu možete preuzeti sami, bez troškova, u **Depo Paketoje, Sylyshaj, Suhodoll, Mitrovica**. Pozvaćemo vas čim narudžba bude spremna.

## Proizvodi sa logotipom
Proizvodi sa štampom logotipa izrađuju se 7–10 radnih dana nakon odobrenja dizajna, a zatim se šalju po rokovima iz tabele iznad. Više o tome: [Štampa logotipa](/faqe/printimi-me-logo).

## Van Kosova
Firme iz Albanije, Sjeverne Makedonije i Crne Gore mogu zatražiti ponudu sa transportom — [pišite nam](/kontakti).

## Provjerite pošiljku
Molimo vas da pregledate pakete pri prijemu. Ako nešto nedostaje ili je oštećeno, javite nam se odmah — pogledajte [Povrat robe](/faqe/kthimet).`,
        `Dërgojmë në gjithë Kosovën nga depoja jonë në Suhodoll të Mitrovicës. Porositë me produkte në stok zakonisht paketohen të njëjtën ditë ose ditën e ardhshme të punës.

## Zonat, çmimet dhe afatet
- **Mitrovicë & rrethina** (Mitrovicë, Vushtrri, Skenderaj, Zveçan): 2 € · brenda 24 orëve
- **Prishtinë & qendra** (Prishtinë, Fushë Kosovë, Obiliq, Podujevë, Lipjan, Drenas, Graçanicë): 3 € · 1–2 ditë pune
- **Pjesa tjetër e Kosovës** (Pejë, Prizren, Gjakovë, Ferizaj, Gjilan dhe të gjitha komunat e tjera): 4 € · 1–3 ditë pune

## Dërgesë falas nga 50 €
Për çdo porosi nga **50 €** e lart dërgesa është **falas** në gjithë Kosovën — zbritja llogaritet automatikisht në shportë.

## Marrje në depo
Porosinë mund ta merrni vetë, pa pagesë, në **Depo Paketoje, Sylyshaj, Suhodoll, Mitrovicë**. Ju telefonojmë sapo porosia të jetë gati.

## Produktet me logo
Produktet me printim logoje prodhohen për 7–10 ditë pune pas miratimit të dizajnit, pastaj dërgohen sipas afateve më lart. Më shumë: [Printim me logo](/faqe/printimi-me-logo).

## Jashtë Kosovës
Bizneset nga Shqipëria, Maqedonia e Veriut dhe Mali i Zi mund të kërkojnë ofertë me transport — [na shkruani](/kontakti).

## Kontrolloni dërgesën
Ju lutemi kontrolloni pakot në pranim. Nëse diçka mungon ose është e dëmtuar, na kontaktoni menjëherë — shih [Politikën e kthimit](/faqe/kthimet).`,
        `We deliver across Kosovo from our warehouse in Suhodoll, Mitrovica. Orders for stock items are usually packed the same or the next working day.

## Zones, prices and lead times
- **Mitrovica & surroundings** (Mitrovica, Vushtrri, Skenderaj, Zveçan): €2 · within 24 hours
- **Pristina & central Kosovo** (Pristina, Fushë Kosovë, Obiliq, Podujevë, Lipjan, Drenas, Graçanicë): €3 · 1–2 working days
- **Rest of Kosovo** (Peja, Prizren, Gjakova, Ferizaj, Gjilan and every other municipality): €4 · 1–3 working days

## Free delivery from €50
Every order of **€50** or more ships **free** anywhere in Kosovo — the discount is applied automatically in the cart.

## Warehouse pickup
You can collect your order free of charge at **Depo Paketoje, Sylyshaj, Suhodoll, Mitrovica**. We'll call you as soon as it's ready.

## Logo-printed products
Logo-printed items are produced in 7–10 working days after you approve the proof, then shipped within the lead times above. More: [Logo printing](/faqe/printimi-me-logo).

## Outside Kosovo
Businesses in Albania, North Macedonia and Montenegro can request a quote including transport — [get in touch](/kontakti).

## Check your delivery
Please inspect the parcels on arrival. If anything is missing or damaged, contact us straight away — see our [Return policy](/faqe/kthimet).`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-kthimet',
      slug: 'kthimet',
      title: T('Povrat robe i novca', 'Politika e kthimit dhe rimbursimit', 'Returns & refund policy'),
      body: T(
        `Imamo politiku povrata od **5 dana**: imate 5 dana od prijema proizvoda da zatražite povrat.

## Uslovi za povrat
- Proizvod mora biti u istom stanju u kojem ste ga primili — nekorišćen, sa etiketama i u originalnom pakovanju
- Potreban je račun ili drugi dokaz o kupovini
- Povrat se šalje na adresu: **Sylyshaj, Suhodoll, Mitrovica**

## Kako započeti povrat
1. Pišite nam na [refund@paketoje.com](mailto:refund@paketoje.com) i navedite broj narudžbe
2. Ako je povrat prihvaćen, poslaćemo vam naljepnicu za povratnu pošiljku i uputstvo kako i gdje da pošaljete paket
3. Artikli poslati bez prethodnog zahtjeva za povrat neće biti prihvaćeni

## Oštećenja i problemi
Molimo vas da pregledate narudžbu odmah po prijemu i da nam se bez odlaganja javite ako je proizvod oštećen, neispravan ili ako ste dobili pogrešan artikal — kako bismo problem provjerili i riješili.

## Izuzeci — artikli koji se ne vraćaju
- Proizvodi po mjeri — posebne narudžbe i personalizovani artikli (npr. sa vašim logotipom)
- Kvarljiva roba i proizvodi za ličnu njegu
- Opasni materijali, zapaljive tečnosti i gasovi
- Artikli na akciji i poklon-kartice

Ako imate pitanje o konkretnom artiklu, slobodno nam se javite.

## Zamjena
Najbrži način da dobijete ono što želite: vratite artikal koji imate i, kada povrat bude prihvaćen, napravite novu kupovinu željenog artikla.

## Evropska unija — 14 dana
Ako se roba šalje u Evropsku uniju, imate pravo da otkažete ili vratite narudžbu u roku od 14 dana bez navođenja razloga — pod istim uslovima: nekorišćeno, sa etiketama, u originalnom pakovanju i uz dokaz o kupovini.

## Povrat novca
Obavijestićemo vas kada primimo i pregledamo povrat i javiti da li je povrat novca odobren. Ako jeste, novac se automatski vraća na prvobitni način plaćanja u roku od **10 radnih dana**. Banci ili izdavaocu kartice može trebati još malo vremena da obradi uplatu.

Ako je od odobrenja povrata prošlo više od 15 radnih dana, a novac niste dobili, pišite nam na [info@paketoje.com](mailto:info@paketoje.com).

Za sva pitanja o povratu uvijek smo dostupni na [refund@paketoje.com](mailto:refund@paketoje.com).`,
        `Kemi një politikë kthimi prej **5 ditësh**: keni 5 ditë pas marrjes së produktit për të kërkuar kthim.

## Kushtet për kthim
- Produkti duhet të jetë në të njëjtën gjendje siç e morët — i papërdorur, me etiketat dhe në paketimin origjinal
- Nevojitet fatura ose prova e blerjes
- Kthimet dërgohen në adresën: **Sylyshaj, Suhodoll, Mitrovicë**

## Si të nisni një kthim
1. Na shkruani në [refund@paketoje.com](mailto:refund@paketoje.com) dhe shënoni numrin e porosisë
2. Nëse kthimi pranohet, ju dërgojmë etiketën për dërgesën e kthimit dhe udhëzimet se si dhe ku ta dërgoni paketën
3. Artikujt që dërgohen pa kërkuar më parë kthim nuk pranohen

## Dëmtime dhe probleme
Ju lutemi kontrolloni porosinë menjëherë pas pranimit dhe na kontaktoni pa vonesë nëse produkti është i dëmtuar, me defekt ose nëse keni marrë artikull të gabuar — që ta shqyrtojmë çështjen dhe ta zgjidhim.

## Përjashtime — artikuj që nuk kthehen
- Produktet e personalizuara — porositë e veçanta dhe artikujt me emër ose me logon tuaj
- Mallrat e kalueshme dhe produktet për kujdes personal
- Materialet e rrezikshme, lëngjet e ndezshme dhe gazrat
- Artikujt në zbritje dhe kartat dhuratë

Nëse keni pyetje për një artikull të caktuar, na kontaktoni.

## Ndërrime
Mënyra më e shpejtë për të marrë atë që dëshironi: ktheni artikullin që keni dhe, pasi kthimi të pranohet, bëni një blerje të veçantë për artikullin e ri.

## Bashkimi Evropian — 14 ditë
Nëse mallrat dërgohen në Bashkimin Evropian, keni të drejtë ta anuloni ose ta ktheni porosinë brenda 14 ditëve pa dhënë arsye — me të njëjtat kushte: i papërdorur, me etiketat, në paketimin origjinal dhe me provë blerjeje.

## Rimbursimet
Ju njoftojmë sapo ta marrim dhe ta inspektojmë kthimin, dhe ju tregojmë nëse rimbursimi u miratua. Nëse miratohet, rimbursimi bëhet automatikisht në mënyrën tuaj origjinale të pagesës brenda **10 ditëve të punës**. Banka ose kompania e kartës mund të ketë nevojë për pak kohë shtesë për ta përpunuar dhe shfaqur.

Nëse kanë kaluar më shumë se 15 ditë pune nga miratimi i kthimit dhe nuk e keni marrë rimbursimin, na shkruani në [info@paketoje.com](mailto:info@paketoje.com).

Për çdo pyetje rreth kthimit, gjithmonë mund të na shkruani në [refund@paketoje.com](mailto:refund@paketoje.com).`,
        `We have a **5-day** return policy: you have 5 days after receiving your item to request a return.

## Eligibility
- The item must be in the same condition you received it — unused, with tags, and in its original packaging
- You'll need the receipt or proof of purchase
- Returns are sent to: **Sylyshaj, Suhodoll, Mitrovica**

## How to start a return
1. Email us at [refund@paketoje.com](mailto:refund@paketoje.com) with your order number
2. If your return is accepted, we'll send you a return shipping label and instructions on how and where to send your package
3. Items sent back without first requesting a return will not be accepted

## Damages and issues
Please inspect your order on arrival and contact us immediately if an item is defective, damaged or if you received the wrong item, so we can evaluate the issue and make it right.

## Exceptions — non-returnable items
- Custom products — special orders and personalised items (e.g. printed with your logo)
- Perishable goods and personal care products
- Hazardous materials, flammable liquids and gases
- Sale items and gift cards

If you have a question about a specific item, please get in touch.

## Exchanges
The fastest way to get what you want: return the item you have and, once the return is accepted, make a separate purchase for the new item.

## European Union — 14 days
If the goods are shipped into the European Union, you have the right to cancel or return your order within 14 days, for any reason and without justification — under the same conditions: unused, with tags, in original packaging and with proof of purchase.

## Refunds
We'll notify you once we've received and inspected your return and let you know whether the refund was approved. If approved, you'll be refunded automatically to your original payment method within **10 business days**. Your bank or card issuer may need some extra time to process and post the refund.

If more than 15 business days have passed since we approved your return and you haven't received your refund, please contact us at [info@paketoje.com](mailto:info@paketoje.com).

For any return question you can always reach us at [refund@paketoje.com](mailto:refund@paketoje.com).`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-pagesa',
      slug: 'pagesa-metodat',
      title: T('Načini plaćanja', 'Mënyrat e pagesës', 'Payment methods'),
      body: T(
        `Kod Paketoje možete platiti na tri načina. Sve cijene su u eurima i uključuju **PDV 18 %**.

## Pouzećem
Platite gotovinom kada preuzmete narudžbu — dostavljaču ili u magacinu, ako narudžbu preuzimate sami.

## Karticom online
Visa, Mastercard i Maestro, preko sigurne stranice za plaćanje banke. Podatke o kartici ne čuvamo.

## Virmanski (bankovni transfer)
Izaberite „Virmanski“ pri plaćanju i poslaćemo vam predračun e-mailom. Narudžba se šalje kada uplata bude evidentirana na našem računu — obično za 1 radni dan. Podaci o računu nalaze se na predračunu.

## Račun za firme
Pri plaćanju upišite naziv firme, **NUI** i **PDV broj** — račun se izdaje na vašu firmu, sa posebno iskazanim PDV-om od 18 %, i stiže e-mailom uz potvrdu narudžbe.

## Redovni kupci
Za firme koje redovno naručuju možemo dogovoriti plaćanje po fakturi sa rokom — [zatražite ponudu](/kontakti).`,
        `Në Paketoje mund të paguani në tri mënyra. Të gjitha çmimet janë në euro dhe përfshijnë **TVSH 18 %**.

## Para në dorëzim
Paguani me para në dorë kur ta pranoni porosinë — korrierit ose në depo, nëse e merrni vetë.

## Kartelë online
Visa, Mastercard dhe Maestro, përmes faqes së sigurt të pagesës së bankës. Të dhënat e kartelës nuk ruhen te ne.

## Transfertë bankare
Zgjidhni „Transfertë bankare“ në arkë dhe ju dërgojmë parafaturën me email. Porosia nis sapo pagesa të regjistrohet në llogarinë tonë — zakonisht brenda 1 dite pune. Të dhënat e llogarisë janë në parafaturë.

## Faturë për biznese
Në arkë shënoni emrin e kompanisë, **NUI**-në dhe **numrin e TVSH-së** — fatura lëshohet në emër të biznesit tuaj, me TVSH 18 % të ndarë, dhe vjen me email bashkë me konfirmimin e porosisë.

## Klientët e rregullt
Për bizneset me porosi të rregullta mund të dakordojmë pagesë me faturë me afat — [kërkoni ofertë](/kontakti).`,
        `You can pay Paketoje in three ways. All prices are in euros and include **18 % VAT** (TVSH).

## Cash on delivery
Pay in cash when you receive your order — to the courier, or at the warehouse if you collect it yourself.

## Card online
Visa, Mastercard and Maestro through the bank's secure payment page. We never store your card details.

## Bank transfer
Choose "Bank transfer" at checkout and we'll email you a pro-forma invoice. Your order ships once the payment reaches our account — usually within 1 working day. Our account details are on the pro-forma invoice.

## Invoices for businesses
Enter your company name, **NUI** (business number) and **VAT number** at checkout — the invoice is issued to your business with 18 % VAT shown separately and arrives by email with your order confirmation.

## Regular customers
For businesses that order regularly we can agree invoice payment on terms — [ask for a quote](/kontakti).`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-kushtet',
      slug: 'kushtet',
      title: T('Uslovi korišćenja', 'Kushtet e shërbimit', 'Terms of service'),
      body: T(
        `Ovaj sajt vodi **Paketoje SH.P.K.** („mi“, „nas“, „naš“). Posjetom sajtu i/ili kupovinom kod nas prihvatate ove Uslove korišćenja, kao i politike na koje upućuju: [Povrat robe](/faqe/kthimet), [Privatnost](/faqe/privatesia) i [Dostava](/faqe/transporti). Ako se ne slažete sa njima, molimo vas da ne koristite sajt.

## 1. Online prodavnica
Prihvatanjem uslova potvrđujete da ste punoljetni (ili da ste dali saglasnost maloljetnom članu domaćinstva da koristi sajt). Proizvode ne smijete koristiti u nezakonite svrhe niti kršiti zakone svoje jurisdikcije, uključujući autorska prava. Zabranjeno je prenositi viruse ili bilo kakav štetan kod. Kršenje uslova dovodi do trenutnog prekida usluge.

## 2. Opšti uslovi
Zadržavamo pravo da bilo kome odbijemo uslugu iz bilo kog razloga. Podaci o karticama uvijek se prenose šifrovano. Bez naše pisane dozvole nije dozvoljeno kopirati, preprodavati ili iskorišćavati bilo koji dio usluge.

## 3. Tačnost informacija
Sadržaj sajta služi za opštu informaciju. Trudimo se da bude tačan i ažuran, ali ga možemo izmijeniti u bilo kom trenutku i nismo obavezni da ažuriramo svaku informaciju.

## 4. Cijene i izmjene usluge
Cijene se mogu mijenjati bez prethodne najave. Uslugu ili njen dio možemo izmijeniti ili obustaviti u bilo kom trenutku i za to ne odgovaramo vama niti trećim licima.

## 5. Proizvodi
Neki proizvodi su dostupni samo online i u ograničenim količinama; povrat i zamjena važe prema [politici povrata](/faqe/kthimet). Boje i fotografije prikazujemo što vjernije, ali ne garantujemo da će ih vaš ekran prikazati tačno. Možemo ograničiti prodaju po osobi, regionu ili količini i povući bilo koji proizvod iz ponude.

## 6. Narudžbe i podaci za naplatu
Možemo odbiti ili ograničiti bilo koju narudžbu, uključujući narudžbe za preprodaju. Ako izmijenimo ili otkažemo narudžbu, pokušaćemo da vas obavijestimo e-mailom ili telefonom. Obavezujete se da ćete davati tačne i potpune podatke za kupovinu i da ćete ih ažurirati.

## 7. Alati i linkovi trećih strana
Sajt može sadržati alate i linkove trećih strana koje ne kontrolišemo. Oni se pružaju „kakvi jesu“, bez garancija, i ne odgovaramo za njihov sadržaj, proizvode ni transakcije sa njima.

## 8. Komentari i prijedlozi
Komentare, ideje i prijedloge koje nam pošaljete možemo koristiti bez ograničenja i bez naknade. Vaši komentari ne smiju kršiti prava drugih niti sadržati nezakonit ili uvredljiv sadržaj i zlonamjerni kod.

## 9. Lični podaci
Lične podatke koje pošaljete preko prodavnice obrađujemo prema [Politici privatnosti](/faqe/privatesia).

## 10. Greške i propusti
Ako sajt sadrži greške u opisima, cijenama, akcijama, troškovima i rokovima dostave ili dostupnosti, zadržavamo pravo da ih ispravimo i da otkažemo narudžbu, i nakon što je poslata, bez prethodne najave.

## 11. Zabranjena upotreba
Sajt nije dozvoljeno koristiti u nezakonite svrhe, za kršenje prava intelektualne svojine, uznemiravanje ili diskriminaciju, davanje lažnih podataka, širenje zlonamjernog koda, prikupljanje tuđih ličnih podataka, spam, scraping ili zaobilaženje bezbjednosnih mjera.

## 12. Odricanje od garancija i ograničenje odgovornosti
Ne garantujemo da će usluga biti neprekidna, pravovremena, bezbjedna ili bez grešaka. Usluga i proizvodi pružaju se „kakvi jesu“ i „kako su dostupni“, osim ako izričito nije drugačije navedeno. Paketoje i njeni zaposleni, partneri i dobavljači ne odgovaraju za direktnu, indirektnu ili posljedičnu štetu nastalu korišćenjem usluge ili proizvoda, u mjeri u kojoj to zakon dozvoljava.

## 13. Obeštećenje, djelimična nevažnost i raskid
Slažete se da ćete obeštetiti Paketoje i njene partnere za zahtjeve trećih lica nastale vašim kršenjem ovih uslova ili zakona. Ako se neka odredba pokaže nevažećom, ostale ostaju na snazi. Uslovi važe dok ih vi ili mi ne raskinemo; obaveze nastale prije raskida ostaju na snazi.

## 14. Cjelokupan ugovor i merodavno pravo
Ovi uslovi i politike objavljene na sajtu čine cjelokupan ugovor između vas i nas. Na njih se primjenjuju zakoni **Kosova**.

## 15. Izmjene i kontakt
Uslove možemo izmijeniti objavljivanjem nove verzije na ovoj stranici; dalje korišćenje sajta znači prihvatanje izmjena. Pitanja o uslovima pošaljite na [info@paketoje.com](mailto:info@paketoje.com) — Paketoje SH.P.K., Sylyshaj, Suhodoll, Mitrovica, Kosovo.`,
        `Kjo uebfaqe operohet nga **Paketoje SH.P.K.** („ne“, „na“, „jonë“). Duke vizituar faqen dhe/ose duke blerë nga ne, pranoni këto Kushte të Shërbimit, si dhe politikat që përmenden në to: [Politika e kthimit](/faqe/kthimet), [Privatësia](/faqe/privatesia) dhe [Transporti](/faqe/transporti). Nëse nuk pajtoheni me to, ju lutemi mos e përdorni faqen.

## 1. Dyqani online
Duke pranuar kushtet, deklaroni se jeni në moshë madhore (ose se keni dhënë pëlqimin që një anëtar i mitur i familjes ta përdorë faqen). Nuk mund t’i përdorni produktet tona për qëllime të paligjshme dhe nuk duhet të shkelni ligjet në juridiksionin tuaj, përfshirë të drejtën e autorit. Ndalohet transmetimi i viruseve ose i çdo kodi dëmtues. Shkelja e kushteve sjell ndërprerjen e menjëhershme të shërbimit.

## 2. Kushte të përgjithshme
Rezervojmë të drejtën ta refuzojmë shërbimin për këdo, për çfarëdo arsye. Të dhënat e kartelës transmetohen gjithmonë të enkriptuara. Pa lejen tonë me shkrim nuk lejohet kopjimi, rishitja ose shfrytëzimi i ndonjë pjese të shërbimit.

## 3. Saktësia e informacionit
Përmbajtja e faqes shërben për informim të përgjithshëm. Përpiqemi që të jetë e saktë dhe e përditësuar, por mund ta ndryshojmë në çdo kohë dhe nuk jemi të detyruar ta përditësojmë çdo informacion.

## 4. Çmimet dhe ndryshimet e shërbimit
Çmimet mund të ndryshojnë pa njoftim paraprak. Shërbimin ose një pjesë të tij mund ta ndryshojmë ose ta ndërpresim në çdo kohë, pa përgjegjësi ndaj jush apo palëve të treta.

## 5. Produktet
Disa produkte ofrohen vetëm online dhe në sasi të kufizuara; kthimi dhe ndërrimi bëhen sipas [Politikës së kthimit](/faqe/kthimet). Ngjyrat dhe fotot i paraqesim sa më saktë, por nuk garantojmë se ekrani juaj do t’i shfaqë saktë. Mund ta kufizojmë shitjen sipas personit, rajonit ose sasisë dhe mund ta tërheqim çdo produkt nga oferta.

## 6. Porositë dhe të dhënat e faturimit
Mund ta refuzojmë ose kufizojmë çdo porosi, përfshirë porositë për rishitje. Nëse e ndryshojmë ose e anulojmë një porosi, do të përpiqemi t’ju njoftojmë me email ose telefon. Ju zotoheni të jepni të dhëna të sakta dhe të plota për blerjen dhe t’i përditësoni ato.

## 7. Mjete dhe lidhje të palëve të treta
Faqja mund të përmbajë mjete dhe lidhje të palëve të treta që nuk i kontrollojmë. Ato ofrohen „siç janë“, pa garanci, dhe nuk mbajmë përgjegjësi për përmbajtjen, produktet apo transaksionet me to.

## 8. Komentet dhe sugjerimet
Komentet, idetë dhe sugjerimet që na dërgoni mund t’i përdorim pa kufizim dhe pa kompensim. Komentet tuaja nuk duhet të shkelin të drejtat e të tjerëve dhe as të përmbajnë material të paligjshëm, fyes ose kod dëmtues.

## 9. Të dhënat personale
Të dhënat personale që na dërgoni përmes dyqanit përpunohen sipas [Politikës së privatësisë](/faqe/privatesia).

## 10. Gabime dhe pasaktësi
Nëse faqja përmban gabime në përshkrime, çmime, oferta, kosto dhe afate të dërgesës ose disponueshmëri, rezervojmë të drejtën t’i korrigjojmë dhe ta anulojmë porosinë, edhe pasi të jetë dërguar, pa njoftim paraprak.

## 11. Përdorime të ndaluara
Ndalohet përdorimi i faqes për qëllime të paligjshme, për shkeljen e pronësisë intelektuale, ngacmim ose diskriminim, dhënie të dhënash të rreme, përhapje kodi dëmtues, mbledhje të dhënash personale të të tjerëve, spam, scraping ose anashkalim të masave të sigurisë.

## 12. Mohimi i garancive dhe kufizimi i përgjegjësisë
Nuk garantojmë që shërbimi do të jetë i pandërprerë, në kohë, i sigurt ose pa gabime. Shërbimi dhe produktet ofrohen „siç janë“ dhe „siç janë në dispozicion“, përveç kur shprehimisht thuhet ndryshe. Paketoje, punonjësit, partnerët dhe furnitorët e saj nuk mbajnë përgjegjësi për dëme të drejtpërdrejta, të tërthorta apo pasuese nga përdorimi i shërbimit ose i produkteve, deri në masën e lejuar nga ligji.

## 13. Dëmshpërblimi, ndashmëria dhe ndërprerja
Pranoni ta dëmshpërbleni Paketoje dhe partnerët e saj për kërkesat e palëve të treta që lindin nga shkelja juaj e këtyre kushteve ose e ligjit. Nëse ndonjë dispozitë rezulton e pavlefshme, pjesa tjetër mbetet në fuqi. Kushtet vlejnë derisa t’i ndërpresim ju ose ne; detyrimet e lindura para ndërprerjes mbeten në fuqi.

## 14. Marrëveshja e plotë dhe ligji në fuqi
Këto kushte dhe politikat e publikuara në faqe përbëjnë marrëveshjen e plotë mes jush dhe nesh. Ato rregullohen nga ligjet e **Kosovës**.

## 15. Ndryshimet dhe kontakti
Kushtet mund t’i ndryshojmë duke publikuar versionin e ri në këtë faqe; përdorimi i mëtejshëm i faqes nënkupton pranimin e ndryshimeve. Pyetjet për kushtet na i dërgoni në [info@paketoje.com](mailto:info@paketoje.com) — Paketoje SH.P.K., Sylyshaj, Suhodoll, Mitrovicë, Kosovë.`,
        `This website is operated by **Paketoje SH.P.K.** ("we", "us", "our"). By visiting the site and/or purchasing from us, you agree to these Terms of Service and to the policies they reference: [Return policy](/faqe/kthimet), [Privacy](/faqe/privatesia) and [Delivery](/faqe/transporti). If you do not agree, please do not use the site.

## 1. Online store terms
By agreeing to these terms you confirm that you are of legal age (or that you have given consent for a minor in your household to use the site). You may not use our products for any illegal or unauthorised purpose, nor violate any laws in your jurisdiction, including copyright law. You must not transmit viruses or any destructive code. A breach of these terms results in immediate termination of the service.

## 2. General conditions
We reserve the right to refuse service to anyone for any reason. Card information is always encrypted in transit. You may not reproduce, resell or exploit any part of the service without our express written permission.

## 3. Accuracy of information
Site content is provided for general information. We aim to keep it accurate and current, but we may change it at any time and have no obligation to update every piece of information.

## 4. Prices and changes to the service
Prices are subject to change without notice. We may modify or discontinue the service, or any part of it, at any time without liability to you or any third party.

## 5. Products
Some products are available online only and in limited quantities; returns and exchanges follow our [Return policy](/faqe/kthimet). We display colours and images as accurately as we can but cannot guarantee your screen shows them exactly. We may limit sales by person, region or quantity and discontinue any product.

## 6. Orders and billing information
We may refuse or limit any order, including orders for resale. If we change or cancel an order, we will try to notify you by email or phone. You agree to provide current, complete and accurate purchase information and to keep it updated.

## 7. Third-party tools and links
The site may include third-party tools and links we do not control. They are provided "as is", without warranties, and we accept no liability for their content, products or any transactions with them.

## 8. Comments and feedback
We may use any comments, ideas or suggestions you send us without restriction or compensation. Your comments must not infringe anyone's rights or contain unlawful or offensive material or malicious code.

## 9. Personal information
Personal information you submit through the store is governed by our [Privacy policy](/faqe/privatesia).

## 10. Errors and omissions
If the site contains errors in descriptions, prices, promotions, shipping charges, transit times or availability, we reserve the right to correct them and to cancel orders, even after they have been submitted, without prior notice.

## 11. Prohibited uses
You may not use the site for unlawful purposes, to infringe intellectual property, to harass or discriminate, to submit false information, to spread malicious code, to collect others' personal data, to spam or scrape, or to circumvent security features.

## 12. Disclaimer of warranties; limitation of liability
We do not guarantee that the service will be uninterrupted, timely, secure or error-free. The service and products are provided "as is" and "as available" unless we expressly state otherwise. Paketoje and its employees, partners and suppliers are not liable for any direct, indirect or consequential damages arising from your use of the service or products, to the maximum extent permitted by law.

## 13. Indemnification, severability and termination
You agree to indemnify Paketoje and its partners against third-party claims arising from your breach of these terms or of the law. If any provision is found unenforceable, the remaining provisions stay in force. These terms remain effective until terminated by you or us; obligations incurred before termination survive.

## 14. Entire agreement and governing law
These terms and the policies posted on the site form the entire agreement between you and us. They are governed by the laws of **Kosovo**.

## 15. Changes and contact
We may update these terms by posting a new version on this page; continued use of the site means you accept the changes. Questions about the terms can be sent to [info@paketoje.com](mailto:info@paketoje.com) — Paketoje SH.P.K., Sylyshaj, Suhodoll, Mitrovica, Kosovo.`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-privatesia',
      slug: 'privatesia',
      title: T('Politika privatnosti', 'Politika e privatësisë', 'Privacy policy'),
      body: T(
        `Ova politika opisuje kako Paketoje prikuplja, koristi i dijeli vaše lične podatke kada posjetite paketoje.com, kupujete kod nas ili nas kontaktirate. Korišćenjem sajta prihvatate obradu podataka opisanu ovdje.

## Koje podatke prikupljamo
- **Kontakt podaci** — ime, adresa, telefon i e-mail
- **Podaci o narudžbi** — adresa za račun i dostavu, potvrda plaćanja; za firme naziv firme, NUI i PDV broj
- **Podaci o nalogu** — ako ga otvorite: korisničko ime, lozinka i sigurnosna pitanja
- **Komunikacija sa nama** — poruke, zahtjevi za ponudu i za besplatne uzorke
- **Podaci o korišćenju** — uređaj, pregledač, mrežna veza, IP adresa i interakcija sa sajtom, prikupljeni putem kolačića
- **Od trećih strana** — od procesora plaćanja i pružalaca usluga koji rade za nas

## Kako koristimo podatke
- **Pružanje usluge** — obrada plaćanja i narudžbi, obavještenja, dostava, povrat i zamjena
- **Marketing** — ponude i novosti e-mailom ili porukom; prijavu možete otkazati u svakom trenutku
- **Bezbjednost** — otkrivanje i sprječavanje prevara i zloupotreba
- **Podrška i unapređenje** — odgovori na vaše upite i bolja usluga

## Kolačići
Kolačiće koristimo za rad prodavnice (npr. korpa i jezik), analitiku i, uz vašu saglasnost, marketing. Izbor možete napraviti u baneru za kolačiće ili ih blokirati u pregledaču — tada neki dijelovi sajta možda neće raditi ispravno.

## Sa kim dijelimo podatke
- Sa pružaocima usluga koji rade za nas (IT, plaćanje, analitika, podrška, hosting, dostava)
- Sa poslovnim i marketinškim partnerima, u skladu sa njihovim pravilima privatnosti
- Kada to zatražite ili odobrite — npr. kurirskoj službi radi dostave
- Kada to zahtijeva zakon, radi zaštite naših prava ili u slučaju poslovne transakcije

Osjetljive lične podatke ne koristimo bez vaše saglasnosti.

## Linkovi trećih strana
Sajt može sadržati linkove ka drugim sajtovima i društvenim mrežama. Za njihovu privatnost i bezbjednost ne odgovaramo — pročitajte njihova pravila.

## Djeca
Usluga nije namijenjena djeci i svjesno ne prikupljamo njihove podatke. Roditelj ili staratelj može zatražiti brisanje.

## Bezbjednost i čuvanje
Nijedna mjera zaštite nije savršena, zato osjetljive podatke ne šaljite nezaštićenim kanalima. Podatke čuvamo onoliko koliko je potrebno za uslugu, zakonske obaveze i rješavanje sporova.

## Vaša prava
- Pristup podacima koje čuvamo o vama
- Ispravka netačnih podataka
- Brisanje podataka
- Prenosivost podataka
- Ograničenje obrade
- Povlačenje saglasnosti
- Žalba na našu odluku
- Odjava sa promotivnih e-mailova

Prava ostvarujete putem kontakta ispod; prije odgovora možemo provjeriti vaš identitet. Zbog ostvarivanja prava nećete biti diskriminisani.

## Pritužbe i međunarodni prenos
Ako niste zadovoljni našim odgovorom, možete se obratiti lokalnom organu za zaštitu podataka. Podaci se mogu obrađivati i van zemlje u kojoj živite, uz priznate mehanizme zaštite.

## Kontakt
Pitanja o privatnosti i zahtjeve pošaljite na [info@paketoje.com](mailto:info@paketoje.com) ili na adresu Sylyshaj, Suhodoll, 40000 Mitrovica, Kosovo.`,
        `Kjo politikë përshkruan si Paketoje i mbledh, i përdor dhe i ndan të dhënat tuaja personale kur vizitoni paketoje.com, blini nga ne ose na kontaktoni. Duke përdorur faqen, pranoni përpunimin e të dhënave siç përshkruhet këtu.

## Çfarë të dhënash mbledhim
- **Të dhëna kontakti** — emri, adresa, telefoni dhe emaili
- **Të dhëna të porosisë** — adresa e faturimit dhe e dërgesës, konfirmimi i pagesës; për biznese emri i kompanisë, NUI dhe numri i TVSH-së
- **Të dhëna llogarie** — nëse krijoni llogari: emri i përdoruesit, fjalëkalimi dhe pyetjet e sigurisë
- **Komunikimi me ne** — mesazhet, kërkesat për ofertë dhe për mostra falas
- **Të dhëna përdorimi** — pajisja, shfletuesi, lidhja e rrjetit, adresa IP dhe ndërveprimi me faqen, të mbledhura përmes cookies
- **Nga palë të treta** — nga procesorët e pagesave dhe ofruesit e shërbimeve që punojnë për ne

## Si i përdorim të dhënat
- **Ofrimi i shërbimit** — përpunimi i pagesave dhe porosive, njoftimet, dërgesa, kthimet dhe ndërrimet
- **Marketing** — oferta dhe të reja me email ose mesazh; mund të çabonoheni në çdo kohë
- **Siguria** — zbulimi dhe parandalimi i mashtrimeve dhe keqpërdorimeve
- **Mbështetja dhe përmirësimi** — përgjigjet ndaj pyetjeve tuaja dhe një shërbim më i mirë

## Cookies
Përdorim cookies për funksionimin e dyqanit (p.sh. shporta dhe gjuha), për analitikë dhe, me pëlqimin tuaj, për marketing. Zgjedhjen mund ta bëni në banerin e cookies ose t’i bllokoni në shfletues — atëherë disa pjesë të faqes mund të mos funksionojnë si duhet.

## Me kë i ndajmë të dhënat
- Me ofruesit e shërbimeve që punojnë për ne (IT, pagesa, analitikë, mbështetje, hosting, dërgesa)
- Me partnerë biznesi dhe marketingu, sipas politikave të tyre të privatësisë
- Kur ju e kërkoni ose e lejoni — p.sh. kompanisë së korrierit për dërgesën
- Kur e kërkon ligji, për të mbrojtur të drejtat tona ose në rast të një transaksioni biznesi

Të dhënat e ndjeshme personale nuk i përdorim pa pëlqimin tuaj.

## Lidhjet e palëve të treta
Faqja mund të përmbajë lidhje drejt faqeve të tjera dhe rrjeteve sociale. Për privatësinë dhe sigurinë e tyre nuk mbajmë përgjegjësi — lexoni politikat e tyre.

## Fëmijët
Shërbimi nuk është i destinuar për fëmijë dhe nuk mbledhim me vetëdije të dhënat e tyre. Prindi ose kujdestari mund të kërkojë fshirjen e tyre.

## Siguria dhe ruajtja
Asnjë masë sigurie nuk është e përsosur, prandaj mos dërgoni të dhëna të ndjeshme përmes kanaleve të pasigurta. Të dhënat i ruajmë aq sa nevojitet për shërbimin, për detyrimet ligjore dhe për zgjidhjen e mosmarrëveshjeve.

## Të drejtat tuaja
- Qasje në të dhënat që ruajmë për ju
- Korrigjim i të dhënave të pasakta
- Fshirje e të dhënave
- Bartshmëri e të dhënave
- Kufizim i përpunimit
- Tërheqje e pëlqimit
- Ankim ndaj vendimit tonë
- Çabonim nga emailet promovuese

Të drejtat i ushtroni përmes kontaktit më poshtë; para përgjigjes mund ta verifikojmë identitetin tuaj. Nuk do të diskriminoheni për ushtrimin e këtyre të drejtave.

## Ankesat dhe transferimi ndërkombëtar
Nëse nuk jeni të kënaqur me përgjigjen tonë, mund t’i drejtoheni autoritetit vendor për mbrojtjen e të dhënave. Të dhënat mund të përpunohen edhe jashtë vendit ku jetoni, me mekanizma të njohur mbrojtjeje.

## Kontakti
Pyetjet për privatësinë dhe kërkesat na i dërgoni në [info@paketoje.com](mailto:info@paketoje.com) ose në adresën Sylyshaj, Suhodoll, 40000 Mitrovicë, Kosovë.`,
        `This policy describes how Paketoje collects, uses and discloses your personal information when you visit paketoje.com, buy from us or contact us. By using the site you agree to the processing described here.

## What we collect
- **Contact details** — name, address, phone number and email
- **Order information** — billing and shipping address, payment confirmation; for businesses the company name, NUI and VAT number
- **Account information** — if you create an account: username, password and security questions
- **Communications with us** — messages, quote requests and free-sample requests
- **Usage data** — device, browser, network connection, IP address and how you interact with the site, collected through cookies
- **From third parties** — from payment processors and service providers working on our behalf

## How we use it
- **Providing the service** — processing payments and orders, notifications, shipping, returns and exchanges
- **Marketing** — offers and news by email or message; you can unsubscribe at any time
- **Security** — detecting and preventing fraud and abuse
- **Support and improvement** — answering your questions and improving the service

## Cookies
We use cookies to run the store (e.g. cart and language), for analytics and, with your consent, for marketing. You can choose in the cookie banner or block cookies in your browser — some parts of the site may then not work properly.

## Who we share it with
- Service providers working for us (IT, payments, analytics, support, hosting, delivery)
- Business and marketing partners, under their own privacy policies
- When you ask or allow us to — e.g. the courier delivering your order
- When required by law, to protect our rights, or in a business transaction

We do not use sensitive personal information without your consent.

## Third-party links
The site may link to other websites and social networks. We are not responsible for their privacy or security — please review their policies.

## Children
The service is not intended for children and we do not knowingly collect their data. A parent or guardian can ask us to delete it.

## Security and retention
No security measure is perfect, so please don't send sensitive information over insecure channels. We keep data for as long as needed to provide the service, meet legal obligations and resolve disputes.

## Your rights
- Access the data we hold about you
- Correct inaccurate data
- Delete your data
- Data portability
- Restrict processing
- Withdraw consent
- Appeal our decision
- Unsubscribe from promotional emails

You can exercise these rights through the contact details below; we may verify your identity before responding. You will not be discriminated against for exercising them.

## Complaints and international transfers
If you're not satisfied with our response, you may lodge a complaint with your local data protection authority. Your data may be processed outside the country you live in, using recognised transfer safeguards.

## Contact
Send privacy questions and requests to [info@paketoje.com](mailto:info@paketoje.com) or write to Sylyshaj, Suhodoll, 40000 Mitrovica, Kosovo.`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-shumice',
      slug: 'shumice',
      title: T('Veleprodaja za firme', 'Porosi me shumicë për biznese', 'Wholesale for businesses'),
      body: T(
        `Paketoje radi prije svega sa firmama — kafićima, restoranima, brzom hranom, poslastičarnicama, sladoledžinicama, suši barovima i keteringom. Evo kako funkcioniše veleprodajna narudžba.

## Pakovanje i karton
Svaki proizvod se prodaje na **pakovanje** — npr. 50 čaša F95 ili 100 poklopaca. Kod svakog proizvoda vidite:

- cijenu po pakovanju i **cijenu po komadu**
- koliko komada ima pakovanje
- koliko pakovanja ima karton (npr. 20 pakovanja = 1.000 čaša)
- zalihe u pakovanjima

## Veleprodajne cijene
Popust se obračunava automatski u korpi, za svaki proizvod posebno:

- od **10 pakovanja**: −5 %
- **pun karton**: −10 %
- proizvodi čiji karton ima do 10 pakovanja: −8 % za karton

Primjer: karton čaša F95 od 400 ml (20 pakovanja × 50 = 1.000 čaša) košta 20 × 2,50 € = 50,00 €. Sa −10 % plaćate **45,00 €**, odnosno 0,045 € po čaši umjesto 0,05 €.

## Račun sa NUI i PDV brojem
Pri plaćanju upišite naziv firme, NUI i PDV broj. Račun se izdaje na firmu, sa posebno iskazanim PDV-om od 18 %. Platiti možete virmanski po predračunu, karticom ili pouzećem — pogledajte [načine plaćanja](/faqe/pagesa-metodat).

## Redovno snabdijevanje i veće količine
Za narudžbe od više kartona, mjesečno snabdijevanje ili proizvode kojih nema u katalogu [zatražite ponudu](/kontakti) — odgovaramo u roku od jednog radnog dana.

## Besplatni uzorci
Niste sigurni za veličinu? Pošaljemo vam besplatne uzorke čaša, poklopaca i posuda — [zatražite uzorke](/#mostra).

## Štampa logotipa
Čaše, kutije i naljepnice sa vašim logotipom od 1 kartona — pogledajte [kako funkcioniše štampa](/faqe/printimi-me-logo).`,
        `Paketoje punon kryesisht me biznese — kafiteri, restorante, fast food, pastiçeri, akullore, sushi bare dhe catering. Ja si funksionon porosia me shumicë.

## Pako dhe karton
Çdo produkt shitet me **pako** — p.sh. 50 gota F95 ose 100 kapakë. Te çdo produkt shihni:

- çmimin për pako dhe **çmimin për copë**
- sa copë ka pakoja
- sa pako ka kartoni (p.sh. 20 pako = 1.000 gota)
- stokun në pako

## Çmime shumice
Zbritja llogaritet automatikisht në shportë, për çdo produkt veç e veç:

- nga **10 pako**: −5 %
- **karton i plotë**: −10 %
- produktet me karton deri në 10 pako: −8 % për karton

Shembull: një karton gota F95 400 ml (20 pako × 50 = 1.000 gota) kushton 20 × 2,50 € = 50,00 €. Me −10 % paguani **45,00 €**, pra 0,045 € për gotë në vend të 0,05 €.

## Faturë me NUI dhe TVSH
Në arkë shënoni emrin e kompanisë, NUI-në dhe numrin e TVSH-së. Fatura lëshohet në emër të biznesit, me TVSH 18 % të ndarë. Mund të paguani me transfertë bankare sipas parafaturës, me kartelë ose me para në dorëzim — shih [mënyrat e pagesës](/faqe/pagesa-metodat).

## Furnizim i rregullt dhe sasi të mëdha
Për porosi me disa kartona, furnizim mujor ose produkte që nuk janë në katalog, [kërkoni ofertë](/kontakti) — përgjigjemi brenda një dite pune.

## Mostra falas
Nuk jeni të sigurt për madhësinë? Ju dërgojmë mostra falas të gotave, kapakëve dhe enëve — [kërkoni mostra](/#mostra).

## Printim me logo
Gota, kuti dhe ngjitëse me logon tuaj nga 1 karton — shih [si funksionon printimi](/faqe/printimi-me-logo).`,
        `Paketoje works mainly with businesses — cafés, restaurants, fast food, pastry shops, ice-cream parlours, sushi bars and caterers. Here's how wholesale ordering works.

## Packs and cartons
Every product is sold by the **pack** — e.g. 50 F95 cups or 100 lids. Each product page shows:

- the price per pack and the **price per piece**
- how many pieces are in a pack
- how many packs make a carton (e.g. 20 packs = 1,000 cups)
- stock in packs

## Wholesale prices
The discount is applied automatically in the cart, per product:

- from **10 packs**: −5 %
- **a full carton**: −10 %
- products whose carton holds up to 10 packs: −8 % per carton

Example: a carton of 400 ml F95 cups (20 packs × 50 = 1,000 cups) costs 20 × €2.50 = €50.00. With −10 % you pay **€45.00** — €0.045 per cup instead of €0.05.

## Invoices with NUI and VAT number
Enter your company name, NUI and VAT number at checkout. The invoice is issued to your business with 18 % VAT shown separately. Pay by bank transfer against a pro-forma invoice, by card or cash on delivery — see [payment methods](/faqe/pagesa-metodat).

## Regular supply and large volumes
For multi-carton orders, monthly supply or products not in the catalogue, [ask for a quote](/kontakti) — we reply within one working day.

## Free samples
Not sure about the size? We'll send free samples of cups, lids and containers — [request samples](/#mostra).

## Logo printing
Cups, boxes and stickers with your logo from 1 carton — see [how logo printing works](/faqe/printimi-me-logo).`,
      ),
      published: true,
      showInFooter: false,
      updatedAt: at,
    },
    {
      id: 'pg-printimi',
      slug: 'printimi-me-logo',
      title: T('Štampa logotipa', 'Printim me logo', 'Logo printing'),
      body: T(
        `Čaše, kutije i naljepnice sa logotipom vašeg lokala — reklama koja ide uz svaku narudžbu.

## Šta štampamo
- **Plastične čaše F95** (250–500 ml) i čaše za desert Bodega 250 ml — +1,50 € po pakovanju (0,03 € po komadu)
- **Papirne čaše** za kafu (240 i 350 ml) — 1–4 boje, po ponudi
- **Kraft kutije za burgere** — 1–2 boje, po ponudi
- **Naljepnice u rolni** Ø40, Ø50 i Ø60 mm — pun kolor, po ponudi

## Kako funkcioniše
1. **Pošaljite logo** — najbolje u PDF, SVG ili AI formatu (vektor); može i PNG u visokoj rezoluciji
2. **Probni dizajn** — obično za 1–2 radna dana šaljemo digitalni prikaz sa pozicijom, veličinom i bojama
3. **Odobrenje** — proizvodnja počinje tek kada pisano odobrite probni dizajn
4. **Proizvodnja: 7–10 radnih dana** — zatim dostava po zoni ili preuzimanje u magacinu

## Minimalna količina
Minimum je **1 karton po proizvodu** — npr. 1.000 čaša F95 (20 pakovanja × 50). Za papirne čaše, kutije i naljepnice minimum i cijenu navodimo u ponudi.

## Cijena
Za čaše F95 štampa se dodaje direktno u korpi: **+1,50 € po pakovanju**. Primjer: karton čaša od 400 ml sa logotipom = 20 × (2,50 € + 1,50 €) = 80,00 € prije veleprodajnog popusta, odnosno 0,08 € po čaši.

## Savjeti za dobar rezultat
- Logo u 1–2 boje izgleda najčistije na providnoj plastici
- Izbjegavajte tekst manji od 6 pt
- Na providnim čašama svijetle boje se slabije vide — birajte kontrast

Personalizovani proizvodi se ne mogu vratiti, zato probni dizajn pažljivo provjerite prije odobrenja.

## Zatražite ponudu
[Pošaljite nam logo i količinu](/kontakti) — ili dodajte „Štampa logotipa“ uz čaše direktno u korpi.`,
        `Gota, kuti dhe ngjitëse me logon e lokalit tuaj — reklamë që shkon me çdo porosi.

## Çfarë printojmë
- **Gota plastike F95** (250–500 ml) dhe gota ëmbëlsirash Bodega 250 ml — +1,50 € për pako (0,03 € për copë)
- **Gota letre** për kafe (240 dhe 350 ml) — 1–4 ngjyra, sipas ofertës
- **Kuti burgeri kraft** — 1–2 ngjyra, sipas ofertës
- **Ngjitëse në rrotull** Ø40, Ø50 dhe Ø60 mm — ngjyra të plota, sipas ofertës

## Si funksionon
1. **Na dërgoni logon** — mundësisht në PDF, SVG ose AI (vektor); funksionon edhe PNG me rezolucion të lartë
2. **Prova e dizajnit** — zakonisht brenda 1–2 ditë pune ju dërgojmë pamjen digjitale me pozicionin, madhësinë dhe ngjyrat
3. **Miratimi** — prodhimi fillon vetëm pasi ta miratoni provën me shkrim
4. **Prodhimi: 7–10 ditë pune** — pastaj dërgesa sipas zonës ose marrja në depo

## Sasia minimale
Minimumi është **1 karton për produkt** — p.sh. 1.000 gota F95 (20 pako × 50). Për gota letre, kuti dhe ngjitëse minimumin dhe çmimin i japim në ofertë.

## Çmimi
Për gotat F95 printimi shtohet direkt në shportë: **+1,50 € për pako**. Shembull: një karton gota 400 ml me logo = 20 × (2,50 € + 1,50 €) = 80,00 € para zbritjes së shumicës, pra 0,08 € për gotë.

## Këshilla për rezultat të mirë
- Logoja me 1–2 ngjyra del më e pastër në plastikë transparente
- Shmangni tekstet më të vogla se 6 pt
- Në gota transparente ngjyrat e çelëta duken më pak — zgjidhni kontrast

Produktet e personalizuara nuk kthehen, prandaj kontrollojeni provën me kujdes para miratimit.

## Kërkoni ofertë
[Na dërgoni logon dhe sasinë](/kontakti) — ose shtoni „Printim me logo“ te gotat direkt në shportë.`,
        `Cups, boxes and stickers with your venue's logo — advertising that goes out with every order.

## What we print
- **F95 plastic cups** (250–500 ml) and Bodega 250 ml dessert cups — +€1.50 per pack (€0.03 per piece)
- **Paper coffee cups** (240 and 350 ml) — 1–4 colours, on quote
- **Kraft burger boxes** — 1–2 colours, on quote
- **Sticker rolls** Ø40, Ø50 and Ø60 mm — full colour, on quote

## How it works
1. **Send us your logo** — ideally as PDF, SVG or AI (vector); a high-resolution PNG also works
2. **Proof** — usually within 1–2 working days we send a digital proof showing position, size and colours
3. **Approval** — production starts only once you approve the proof in writing
4. **Production: 7–10 working days** — then delivery by zone or pickup at our warehouse

## Minimum quantity
The minimum is **1 carton per product** — e.g. 1,000 F95 cups (20 packs × 50). For paper cups, boxes and stickers, the minimum and price are given in the quote.

## Price
For F95 cups the print is added right in the cart: **+€1.50 per pack**. Example: a carton of 400 ml cups with your logo = 20 × (€2.50 + €1.50) = €80.00 before the wholesale discount — €0.08 per cup.

## Tips for a great result
- A 1–2 colour logo prints cleanest on clear plastic
- Avoid text smaller than 6 pt
- Light colours show less on clear cups — go for contrast

Personalised products can't be returned, so please check the proof carefully before approving it.

## Ask for a quote
[Send us your logo and quantity](/kontakti) — or add "Logo print" to your cups right in the cart.`,
      ),
      published: true,
      showInFooter: false,
      updatedAt: at,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Blog                                                                */
/* ------------------------------------------------------------------ */
// Prices quoted in the posts are the catalogue prices (catalog.ts) — update the posts if prices change.
export function buildPosts(now = new Date()): Post[] {
  const d = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  return [
    {
      id: 'post-gota-f95',
      slug: 'si-te-zgjidhni-gotat-f95-dhe-kapakun',
      title: T('Kako izabrati pravu čašu F95 i poklopac', 'Si të zgjidhni gotën F95 dhe kapakun e duhur', 'How to choose the right F95 cup size and lid'),
      excerpt: T(
        '250 ili 500 ml? Ravni, kupolasti ili clip poklopac? Koja čaša za koje piće, koliko poklopaca vam treba i koliko košta upakovano piće.',
        '250 apo 500 ml? Kapak i sheshtë, kupolë apo clip? Cila gotë për cilën pije, sa kapakë ju duhen dhe sa kushton një pije e paketuar.',
        '250 or 500 ml? Flat, dome or clip lid? Which cup suits which drink, how many lids you need and what a packed drink really costs.',
      ),
      body: T(
        `Prava čaša nije samo pitanje veličine: od nje zavisi koliko leda stane, kako piće izgleda u vitrini i koliko vas košta svaka narudžba. Evo kratkog vodiča kroz čaše F95 i njihove poklopce.

## Šta znači F95?
F95 je prečnik otvora čaše: **95 mm**. Sve naše čaše F95 — od 250 do 500 ml — imaju isti otvor, pa im odgovaraju poklopci F95. To znači jedna vrsta poklopca za cijeli meni i manje artikala u magacinu.

## Koja veličina za koje piće
- **250 ml** — voda, prirodni sokovi, gazirana pića, dječje porcije · 0,04 € po komadu
- **300 ml** — limunada, ledeni čaj, mala ledena kafa · 0,05 € po komadu
- **350 ml** — klasični frape i ice latte · 0,05 € po komadu
- **400 ml** — najprodavanija: frape, smoothie, milkshake sa ledom · 0,05 € po komadu
- **500 ml** — veliki smoothie i milkshake, bubble tea · 0,06 € po komadu

Praktično pravilo: računajte oko četvrtine čaše za led. Ako je vaš recept 300 ml pića plus led, uzmite čašu od 400 ml.

## Koji poklopac
- **Ravni** — čvrsto zatvaranje za sokove, limunade i desert u čaši; jednostavan i povoljan
- **Kupolasti** — sa otvorom za slamku; ostavlja prostor za šlag, pjenu ili kuglu sladoleda, idealan za frape i milkshake
- **Clip** — otvor za pijenje direktno ili za slamku; naš najprodavaniji za ledenu kafu i piće u pokretu

Kupolasti i clip poklopci su od providnog PET-a, pa piće izgleda kao u vitrini.

## Koliko poklopaca vam treba?
Čaše dolaze u pakovanjima od 50 komada, poklopci od 100. Dakle **2 pakovanja čaša = 1 pakovanje poklopaca**. Karton čaša (20 pakovanja, 1.000 komada) ide uz karton poklopaca (10 pakovanja, 1.000 komada).

## Koliko košta upakovano piće?
Primjer sa čašom od 400 ml, clip poklopcem i slamkom od 22 cm, po cijenama za pakovanje:

- čaša: 2,50 € / 50 = 0,05 €
- poklopac: 2,00 € / 100 = 0,02 €
- slamka: 5,00 € / 500 = 0,01 €

Ukupno **0,08 € po piću**. Sa punim kartonima (čaše −10 %, poklopci i slamke −8 %) trošak pada na oko **0,07 €**.

## Tri greške koje treba izbjeći
- Ne koristite čaše F95 za topla pića — to su čaše za hladne napitke
- Ne punite do vrha: ostavite oko 1 cm da se poklopac zatvori bez prosipanja
- Ne naručujte bez probe: zatražite [besplatne uzorke](/#mostra) i isprobajte veličine sa svojim receptima

Spremni za narudžbu? Pogledajte [čaše F95](/produktet/gota) i [poklopce](/produktet/kapake).`,
        `Gota e duhur nuk është vetëm çështje madhësie: prej saj varet sa akull futet, si duket pija në vitrinë dhe sa ju kushton çdo porosi. Ja një udhëzues i shkurtër për gotat F95 dhe kapakët e tyre.

## Çfarë do të thotë F95?
F95 është diametri i grykës së gotës: **95 mm**. Të gjitha gotat tona F95 — nga 250 deri në 500 ml — kanë të njëjtën grykë, prandaj u përshtaten kapakët F95. Kjo do të thotë një lloj kapaku për gjithë menynë dhe më pak artikuj në depo.

## Cila madhësi për cilën pije
- **250 ml** — ujë, lëngje natyrale, pije të gazuara, porcione për fëmijë · 0,04 € copa
- **300 ml** — limonadë, çaj i ftohtë, kafe e ftohtë e vogël · 0,05 € copa
- **350 ml** — frappé klasik dhe ice latte · 0,05 € copa
- **400 ml** — më e shitura: frappé, smoothie, milkshake me akull · 0,05 € copa
- **500 ml** — smoothie dhe milkshake të mëdha, bubble tea · 0,06 € copa

Rregull praktik: llogaritni rreth një të katërtën e gotës për akull. Nëse receta juaj është 300 ml pije plus akull, zgjidhni gotën 400 ml.

## Cili kapak
- **I sheshtë** — mbyllje e fortë për lëngje, limonada dhe ëmbëlsira në gotë; i thjeshtë dhe i lirë
- **Kupolë** — me hapje për shkop; lë hapësirë për krem, shkumë ose top akulloreje, ideal për frappé dhe milkshake
- **Clip** — hapje për pirje direkte ose për shkop; më i shituri ynë për kafe të ftohtë dhe pije në lëvizje

Kapakët kupolë dhe clip janë prej PET-i transparent, që pija të duket si në vitrinë.

## Sa kapakë ju duhen?
Gotat vijnë në pako me 50 copë, kapakët me 100. Pra **2 pako gota = 1 pako kapakë**. Një karton gota (20 pako, 1.000 copë) shkon me një karton kapakë (10 pako, 1.000 copë).

## Sa kushton një pije e paketuar?
Shembull me gotën 400 ml, kapakun clip dhe një shkop 22 cm, me çmimet për pako:

- gota: 2,50 € / 50 = 0,05 €
- kapaku: 2,00 € / 100 = 0,02 €
- shkopi: 5,00 € / 500 = 0,01 €

Gjithsej **0,08 € për pije**. Me kartona të plotë (gotat −10 %, kapakët dhe shkopinjtë −8 %) kostoja bie në rreth **0,07 €**.

## Tri gabime që duhen shmangur
- Mos përdorni gota F95 për pije të nxehta — janë gota për pije të ftohta
- Mos i mbushni deri në buzë: lini rreth 1 cm që kapaku të mbyllet pa derdhje
- Mos porositni pa provuar: kërkoni [mostra falas](/#mostra) dhe provoni madhësitë me recetat tuaja

Gati për porosi? Shikoni [gotat F95](/produktet/gota) dhe [kapakët](/produktet/kapake).`,
        `The right cup isn't just a question of size: it decides how much ice fits, how the drink looks on the counter and what every order costs you. Here's a quick guide to F95 cups and their lids.

## What does F95 mean?
F95 is the cup's rim diameter: **95 mm**. All our F95 cups — from 250 to 500 ml — share the same rim, so F95 lids fit them. That means one type of lid for the whole menu and fewer items in the storeroom.

## Which size for which drink
- **250 ml** — water, fresh juice, soft drinks, kids' portions · €0.04 a piece
- **300 ml** — lemonade, iced tea, a small iced coffee · €0.05 a piece
- **350 ml** — classic frappé and iced latte · €0.05 a piece
- **400 ml** — our bestseller: frappé, smoothies, milkshakes with ice · €0.05 a piece
- **500 ml** — large smoothies and milkshakes, bubble tea · €0.06 a piece

Rule of thumb: allow about a quarter of the cup for ice. If your recipe is 300 ml of drink plus ice, go for the 400 ml cup.

## Which lid
- **Flat** — a tight seal for juices, lemonade and desserts in a cup; simple and inexpensive
- **Dome** — with a straw hole; leaves room for cream, foam or a scoop of ice cream, ideal for frappés and milkshakes
- **Clip** — a sip opening that also takes a straw; our bestseller for iced coffee and drinks on the go

The dome and clip lids are made of clear PET, so the drink looks as good as it does on the counter.

## How many lids do you need?
Cups come in packs of 50, lids in packs of 100. So **2 packs of cups = 1 pack of lids**. A carton of cups (20 packs, 1,000 pieces) pairs with a carton of lids (10 packs, 1,000 pieces).

## What does a packed drink cost?
Example with a 400 ml cup, a clip lid and a 22 cm straw, at pack prices:

- cup: €2.50 / 50 = €0.05
- lid: €2.00 / 100 = €0.02
- straw: €5.00 / 500 = €0.01

That's **€0.08 per drink**. With full cartons (cups −10 %, lids and straws −8 %) the cost drops to around **€0.07**.

## Three mistakes to avoid
- Don't use F95 cups for hot drinks — they are cold cups
- Don't fill to the brim: leave about 1 cm so the lid closes without spills
- Don't order blind: ask for [free samples](/#mostra) and test the sizes with your own recipes

Ready to order? See our [F95 cups](/produktet/gota) and [lids](/produktet/kapake).`,
      ),
      cover: '/images/misc/smoothie.webp',
      tag: T('Čaše i poklopci', 'Gota & kapakë', 'Cups & lids'),
      author: 'Blerta · Paketoje',
      readMinutes: 4,
      publishedAt: d(5),
      published: true,
    },
    {
      id: 'post-materialet',
      slug: 'pet-pp-ps-udhezues-per-materialet',
      title: T('PET, PP ili PS? Vodič kroz materijale za ambalažu hrane', 'PET, PP apo PS? Udhëzues për materialet e paketimit të ushqimit', 'PET vs PP vs PS — a materials guide for food packaging'),
      excerpt: T(
        'Koja posuda ide u mikrotalasnu, koja izgleda kao kristal, a koja puca na hladnom? Tri skraćenice koje odlučuju o vašoj ambalaži.',
        'Cila enë futet në mikrovalë, cila duket si kristal dhe cila plasaritet kur shtypet? Tri shkurtesat që vendosin për paketimin tuaj.',
        'Which container goes in the microwave, which looks crystal-clear and which cracks under pressure? The three abbreviations behind your packaging.',
      ),
      body: T(
        `U opisu mnogih proizvoda vidjećete skraćenicu: PET, PP ili PS. To nisu nebitni tehnički detalji — od njih zavisi da li posuda ide u mikrotalasnu, da li izgleda kao kristal u vitrini i da li puca kada je kupac stisne.

## PET — kristalno providan, za hladno
- Veoma providan i čvrst — hrana izgleda kao u vitrini
- Za hladnu hranu i pića; nije za mikrotalasnu niti za veoma toplu hranu
- Kod Paketoje: kupolasti i clip poklopci F95, kvadratne posude za salatu od 750 i 1000 ml, okrugla kutija za tortu Ø230 mm i poklopac posude za suši
- Reciklaža: oznaka **1**, plastika koja se najčešće reciklira

## PP — za toplo i za mikrotalasnu
- Nešto manje providan (mliječnog izgleda), ali savitljiv i ne puca lako
- Podnosi toplu hranu i podgrijavanje u mikrotalasnoj — zato su naše posude za mikrotalasnu pravi izbor za supe, paste i kuvana jela
- Hermetično zatvaranje: tečnost ne curi tokom dostave
- Reciklaža: oznaka **5**

## PS — čvrst i elegantan, samo za hladno
- Kristal polistiren: krut, sjajan i povoljan, ali krhkiji — može da pukne ako se jako stisne
- Za deserte, kremove i hladna jela; nije za mikrotalasnu
- Kod Paketoje: čaše za desert PS, baza posude za suši i setovi pribora PS
- Reciklaža: oznaka **6**

## Brzi izbor
- Frape, smoothie, ledena kafa → čaša F95 sa PET poklopcem
- Supa, pasta, topla jela, podgrijavanje → PP posuda
- Salate i voće → PET, jer izgleda svježije
- Tiramisu, mus, krem → čaša PS ili PET
- Suši → PS baza sa PET poklopcem

## A pribor?
PS setovi su ekonomičan izbor za uobičajena jela. PP set je savitljiviji i ne lomi se lako — bolji za meso, picu ili narudžbe gdje kupac zaista treba da sječe nožem.

## A papir i PLA?
Kraft karton i papirne čaše su alternativa za suvu hranu i toplu kafu; PLA, plastika biljnog porijekla, uskoro stiže u Paketoje. Više u članku [Zelenija ambalaža na Kosovu](/blog/paketim-me-i-gjelber-ne-kosove).

## Zlatno pravilo
Uvijek koristite ambalažu namijenjenu za kontakt sa hranom i poštujte temperature. Većina reklamacija — poklopci koji ne zatvaraju, posude koje se deformišu, čaše koje pucaju — dolazi od pogrešnog materijala za pogrešnu hranu, a ne od kvaliteta ambalaže.`,
        `Te përshkrimi i shumë produkteve do të shihni një shkurtesë: PET, PP ose PS. Nuk janë detaje teknike pa rëndësi — prej tyre varet nëse ena futet në mikrovalë, nëse duket si kristal në vitrinë dhe nëse plasaritet kur e shtyp klienti.

## PET — kristal i tejdukshëm, për të ftohtë
- Shumë transparent dhe i fortë — ushqimi duket si në vitrinë
- Për ushqime dhe pije të ftohta; nuk është për mikrovalë dhe as për ushqim shumë të nxehtë
- Te Paketoje: kapakët F95 kupolë dhe clip, enët katrore për sallata 750 dhe 1000 ml, kutia rrethore për tortë Ø230 mm dhe kapaku i enës për sushi
- Riciklimi: kodi **1**, plastika që riciklohet më shpesh

## PP — për të nxehtë dhe për mikrovalë
- Pak më pak i tejdukshëm (me pamje qumështi), por fleksibël dhe nuk plasaritet lehtë
- Duron ushqimin e nxehtë dhe ngrohjen në mikrovalë — prandaj enët tona për mikrovalë janë zgjidhja për supa, pasta dhe gjella të gatuara
- Mbyllje hermetike: lëngu nuk rrjedh gjatë dërgesës
- Riciklimi: kodi **5**

## PS — i fortë dhe elegant, vetëm për të ftohtë
- Polistiren kristal: i ngurtë, me shkëlqim dhe i lirë, por më i brishtë — mund të plasaritet nëse shtypet fort
- Për ëmbëlsira, kremra dhe ushqime të ftohta; jo për mikrovalë
- Te Paketoje: gotat e ëmbëlsirave PS, baza e enës për sushi dhe setet e takëmeve PS
- Riciklimi: kodi **6**

## Zgjedhja e shpejtë
- Frappé, smoothie, kafe e ftohtë → gotë F95 me kapak PET
- Supë, pasta, gjella të nxehta, ngrohje në mikrovalë → enë PP
- Sallata dhe fruta → PET, sepse duken më të freskëta
- Tiramisu, mus, krem → gotë PS ose PET
- Sushi → bazë PS me kapak PET

## Po takëmet?
Setet PS janë zgjedhja ekonomike për ushqimet e zakonshme. Seti PP është më fleksibël dhe nuk thyhet lehtë — më i mirë për mish, pica ose porosi ku klienti duhet vërtet të presë me thikë.

## Po letra dhe PLA?
Kartoni kraft dhe gotat e letrës janë alternativë për ushqim të thatë dhe kafe të nxehtë; PLA, plastika me origjinë bimore, vjen së shpejti te Paketoje. Më shumë në artikullin [Paketim më i gjelbër në Kosovë](/blog/paketim-me-i-gjelber-ne-kosove).

## Rregulli i artë
Përdorni gjithmonë paketim të destinuar për kontakt me ushqimin dhe respektoni temperaturat. Shumica e ankesave — kapakë që nuk mbyllen, enë që deformohen, gota që plasariten — vijnë nga materiali i gabuar për ushqimin e gabuar, jo nga cilësia e paketimit.`,
        `Many product descriptions carry an abbreviation: PET, PP or PS. These aren't throwaway technical details — they decide whether a container can go in the microwave, whether it looks crystal-clear on the counter and whether it cracks when a customer squeezes it.

## PET — crystal-clear, for cold food
- Very transparent and rigid — food looks like it's in a display case
- For cold food and drinks; not for the microwave or very hot food
- At Paketoje: F95 dome and clip lids, 750 and 1000 ml square salad containers, the Ø230 mm round cake box and the sushi tray lid
- Recycling: code **1**, the most widely recycled plastic

## PP — for hot food and the microwave
- Slightly less clear (a milky look), but flexible and doesn't crack easily
- Handles hot food and microwave reheating — which is why our microwave containers are the answer for soups, pasta and cooked dishes
- Leak-proof seal: liquids stay put during delivery
- Recycling: code **5**

## PS — rigid and elegant, cold food only
- Crystal polystyrene: stiff, glossy and affordable, but more brittle — it can crack if squeezed hard
- For desserts, creams and cold dishes; not for the microwave
- At Paketoje: PS dessert cups, the sushi tray base and PS cutlery sets
- Recycling: code **6**

## Quick picker
- Frappé, smoothies, iced coffee → F95 cup with a PET lid
- Soup, pasta, hot dishes, microwave reheating → PP container
- Salads and fruit → PET, because it looks fresher
- Tiramisu, mousse, cream desserts → PS or PET cup
- Sushi → PS base with a PET lid

## What about cutlery?
PS sets are the economical choice for everyday meals. The PP set is more flexible and doesn't snap easily — better for meat, pizza or any order where the customer really has to cut with a knife.

## And paper or PLA?
Kraft board and paper cups are an alternative for dry food and hot coffee; PLA, a plant-based plastic, is coming soon to Paketoje. Read more in [Greener packaging in Kosovo](/blog/paketim-me-i-gjelber-ne-kosove).

## The golden rule
Always use packaging intended for food contact and respect its temperature range. Most complaints — lids that won't close, containers that warp, cups that crack — come from the wrong material for the wrong food, not from the quality of the packaging.`,
      ),
      cover: '/images/misc/salad.webp',
      tag: T('Materijali', 'Materialet', 'Materials'),
      author: 'Teuta · Paketoje',
      readMinutes: 5,
      publishedAt: d(13),
      published: true,
    },
    {
      id: 'post-dergesa',
      slug: 'paketimi-per-dergesa-si-ne-restorant',
      title: T('Ambalaža za dostavu: hrana stiže kao u restoranu', 'Paketimi për dërgesa: ushqimi arrin si në restorant', 'Delivery packaging that keeps food restaurant-fresh'),
      excerpt: T(
        'Šest pravila za ambalažu koja hranu čuva toplom, hrskavom i urednom — od kuhinje do vrata kupca.',
        'Gjashtë rregulla për paketimin që e mban ushqimin të ngrohtë, krokant dhe të rregullt — nga kuzhina te dera e klientit.',
        'Six rules for packaging that keeps food hot, crisp and tidy — from your kitchen to the customer’s door.',
      ),
      body: T(
        `Kupac ne vidi vašu kuhinju — vidi kutiju kada je otvori. Dvadeset minuta na skuteru može da pokvari i najbolji tanjir ako ambalaža nije prava. Evo šest pravila koja koriste lokali sa uspješnom dostavom.

## 1. Odvojite toplo od hladnog
Svježa salata pored toplog jela uvene za par minuta. Koristite posebne posude — PET za salate, PP za toplo — ili kutiju sa dvije pregrade kada su porcije male.

## 2. Vlaga ubija hrskavost
Pomfrit i pržena hrana gube hrskavost kada para ostane zatvorena. Ostavite ih 20–30 sekundi da ispuste paru prije nego što zatvorite kutiju i ne prelivajte ih sosom — sos pošaljite posebno, u [čašicama za sos](/produktet/gota-salca).

## 3. Hermetično za sve što ima tečnosti
Supe, paste sa sosom i jela sa sokom traže PP posudu sa hermetičnim poklopcem. Bonus: kupac može hranu da podgrije direktno u mikrotalasnoj, bez presipanja u tanjir.

## 4. Pića bez prosipanja
Čaša F95 sa clip ili kupolastim poklopcem, napunjena do oko 1 cm ispod ivice. Kod narudžbi sa više pića stavite ih uspravno na dno torbe, dalje od kutija sa hranom.

## 5. Pribor se ne zaboravlja
Ništa ne kvari utisak kao salata bez viljuške. Setovi sa viljuškom, nožem, kašikom, salvetom, solju i biberom rješavaju sve jednim artiklom — i koštaju 0,08 € po setu (8,00 € za 100 setova).

## 6. Zatvaranje je i reklama
Naljepnica sa vašim logotipom preko poklopca ili kese pokazuje da narudžba nije otvarana usput — i drži vaš brend pred očima kupca. Naljepnice u rolni su najjeftiniji način da označite svaku narudžbu.

## Kontrolna lista prije nego što narudžba izađe
- Toplo i hladno u odvojenim posudama
- Sosovi posebno, u čašicama sa poklopcem
- Poklopci dobro zatvoreni sa sve četiri strane
- Pića zatvorena i uspravna
- Pribor i salvete unutra
- Naljepnica ili sigurnosni pečat na kesi

## Koliko košta dobra ambalaža
Tipičan meni — posuda za mikrotalasnu od 750 ml, čašica za sos od 1 oz i set pribora — košta oko **0,27 €** ambalaže (0,17 + 0,02 + 0,08 €). U poređenju sa reklamacijom ili kupcem koji se više ne vraća, to je najjeftinija investicija koju možete napraviti.`,
        `Klienti nuk e sheh kuzhinën tuaj — e sheh kutinë kur e hap. Njëzet minuta në skuter mund ta prishin edhe pjatën më të mirë, nëse paketimi nuk është i duhuri. Ja gjashtë rregulla që i ndjekin lokalet me dërgesa të suksesshme.

## 1. Ndajeni të nxehtën nga e ftohta
Sallata e freskët pranë gjellës së nxehtë vyshket brenda pak minutash. Përdorni enë të veçanta — PET për sallatat, PP për të nxehtën — ose kuti me dy ndarje kur porcionet janë të vogla.

## 2. Lagështia e vret krokanten
Patatet dhe ushqimet e skuqura e humbin krokanten kur avulli mbetet i mbyllur. Lërini 20–30 sekonda ta lëshojnë avullin para se ta mbyllni kutinë dhe mos i lagni me salcë — salcën dërgojeni veç, në [gota për salca](/produktet/gota-salca).

## 3. Hermetike për çdo gjë me lëng
Supat, pastat me salcë dhe gjellët me lëng duan enë PP me kapak hermetik. Bonus: klienti mund ta ngrohë ushqimin direkt në mikrovalë, pa e zhvendosur në pjatë.

## 4. Pije pa derdhje
Gotë F95 me kapak clip ose kupolë, e mbushur deri rreth 1 cm nën buzë. Te porositë me shumë pije, vendosini drejt në fund të çantës, larg kutive të ushqimit.

## 5. Takëmet nuk harrohen
Asgjë nuk e prish përshtypjen si një sallatë pa pirun. Setet me pirun, thikë, lugë, fasoletë, kripë dhe piper i zgjidhin të gjitha me një artikull — dhe kushtojnë 0,08 € seti (8,00 € për 100 sete).

## 6. Mbyllja është edhe reklamë
Një ngjitëse me logon tuaj mbi kapak ose mbi qese tregon se porosia nuk është hapur rrugës — dhe e mban markën tuaj para syve të klientit. Ngjitëset në rrotull janë mënyra më e lirë për ta markuar çdo porosi.

## Lista e kontrollit para se të dalë porosia
- E nxehta dhe e ftohta në enë të ndara
- Salcat veç, në gota me kapak
- Kapakët të mbyllur mirë nga të katër anët
- Pijet të mbyllura dhe në këmbë
- Takëmet dhe fasoletat brenda
- Ngjitësja ose vula e sigurisë mbi qese

## Sa kushton një paketim i mirë
Një menu tipike — enë për mikrovalë 750 ml, gotë salce 1 oz dhe set takëmesh — kushton rreth **0,27 €** paketim (0,17 + 0,02 + 0,08 €). Krahasuar me një ankesë apo me një klient që nuk kthehet më, është investimi më i lirë që mund të bëni.`,
        `Your customer never sees your kitchen — they see the box when they open it. Twenty minutes on a scooter can ruin even the best dish if the packaging is wrong. Here are six rules that successful delivery venues live by.

## 1. Keep hot and cold apart
A fresh salad next to a hot main wilts within minutes. Use separate containers — PET for salads, PP for hot food — or a two-compartment box when portions are small.

## 2. Steam kills crunch
Fries and fried food lose their crunch when steam stays trapped. Let them vent for 20–30 seconds before you close the box, and don't pour sauce over them — send it separately in [sauce cups](/produktet/gota-salca).

## 3. Leak-proof for anything with liquid
Soups, saucy pasta and stews need a PP container with a leak-proof lid. Bonus: customers can reheat the food straight in the microwave without moving it to a plate.

## 4. Drinks without spills
An F95 cup with a clip or dome lid, filled to about 1 cm below the rim. For orders with several drinks, stand them upright at the bottom of the bag, away from the food boxes.

## 5. Never forget the cutlery
Nothing spoils the experience like a salad without a fork. Sets with fork, knife, spoon, napkin, salt and pepper solve it with a single item — at €0.08 a set (€8.00 per 100 sets).

## 6. The seal is advertising too
A sticker with your logo across the lid or bag shows the order wasn't opened on the way — and keeps your brand in front of the customer. Sticker rolls are the cheapest way to brand every order.

## Checklist before the order leaves
- Hot and cold in separate containers
- Sauces on the side, in lidded cups
- Lids pressed shut on all four sides
- Drinks sealed and upright
- Cutlery and napkins inside
- Sticker or tamper seal on the bag

## What good packaging costs
A typical meal — a 750 ml microwave container, a 1 oz sauce cup and a cutlery set — comes to about **€0.27** in packaging (0.17 + 0.02 + 0.08). Compared with a complaint or a customer who never orders again, it's the cheapest investment you can make.`,
      ),
      cover: '/images/misc/delivery.webp',
      tag: T('Za poneti', 'Take-away', 'Take-away'),
      author: 'Valon · Paketoje',
      readMinutes: 4,
      publishedAt: d(22),
      published: true,
    },
    {
      id: 'post-printimi',
      slug: 'si-funksionon-printimi-me-logo',
      title: T('Kako funkcioniše štampa logotipa: minimum, probni dizajn i rokovi', 'Si funksionon printimi me logo: minimumi, prova dhe afatet', 'How logo printing works: minimums, proofs and lead times'),
      excerpt: T(
        'Od logotipa do čaša u vašem lokalu za oko dvije sedmice. Koliko komada je minimum, koliko košta i kako da dizajn izgleda dobro.',
        'Nga logoja te gotat në lokalin tuaj për rreth dy javë. Sa është minimumi, sa kushton dhe si të dalë bukur dizajni.',
        'From logo to cups in your venue in about two weeks. What the minimum is, what it costs and how to make the design look great.',
      ),
      body: T(
        `Čaša sa vašim logotipom prođe kroz ruke desetina ljudi: kupca, njegovih prijatelja, prolaznika na ulici, pratilaca na Instagramu. Štampa logotipa je najjeftinija reklama koju lokal može sebi da priušti — ako je dobro isplanirate.

## Šta se može štampati
- Plastične čaše F95 od 250 do 500 ml i čaše za desert Bodega 250 ml
- Papirne čaše za kafu (240 i 350 ml)
- Kutije za burgere od kraft kartona
- Naljepnice u rolni za kutije, kese i poklopce

## Četiri koraka
1. **Logo** — pošaljite ga u PDF, SVG ili AI formatu; ako imate samo PNG, neka bude u visokoj rezoluciji
2. **Probni dizajn** — obično za 1–2 radna dana dobijate digitalni prikaz čaše sa vašim logotipom, veličinom i bojama
3. **Odobrenje** — ispravljamo koliko god treba; proizvodnja počinje tek nakon vašeg pisanog odobrenja
4. **Proizvodnja** — 7–10 radnih dana, zatim dostava ili preuzimanje u magacinu

## Minimalna količina i cijena
Minimum je **1 karton po proizvodu**. Za čaše F95 to je 1.000 čaša (20 pakovanja × 50). Štampa košta **+1,50 € po pakovanju**, odnosno 0,03 € po čaši.

Primjer: kafić koji prodaje 30–35 frapea dnevno potroši otprilike karton čaša od 400 ml mjesečno. Obične čaše koštaju 50,00 € po kartonu, sa logotipom 80,00 € — 30 € više mjesečno za 1.000 reklama koje šetaju gradom.

## Planirajte vrijeme
Od logotipa do čaša u lokalu obično prođu **dvije sedmice**. Ako otvarate novi lokal ili se spremate za ljetnu sezonu, javite nam se bar 3 sedmice ranije — da ima vremena za ispravke probnog dizajna.

## Kako da rezultat bude lijep
- Pojednostavite logo: 1–2 boje izgledaju čistije od prelaza
- Mislite na kontrast: na providnoj plastici bijela i svijetle boje se slabije vide
- Izbjegavajte sitan tekst ispod 6 pt — na čaši se ne čita
- Dodajte Instagram ili broj telefona — čaša postaje vizit-karta

## Česta pitanja
**Mogu li da promijenim dizajn kod sljedeće narudžbe?** Da, svaka nova narudžba može imati novi dizajn, uz novi probni prikaz.

**Mogu li da vratim narudžbu sa logotipom?** Ne — personalizovani proizvodi se ne vraćaju, zato probni dizajn zajedno provjeravamo prije proizvodnje.

**Da li štampa utiče na dostavu?** Dostava je besplatna za svaku narudžbu od 50 €, sa štampom ili bez nje.

Spremni? [Pošaljite nam logo](/kontakti) ili pročitajte [detalje o štampi](/faqe/printimi-me-logo).`,
        `Një gotë me logon tuaj kalon nëpër duart e dhjetëra njerëzve: klientit, shokëve të tij, kalimtarëve në rrugë, ndjekësve në Instagram. Printimi me logo është reklama më e lirë që mund t’i bëni lokalit — nëse e planifikoni mirë.

## Çfarë mund të printohet
- Gota plastike F95 nga 250 deri në 500 ml dhe gota ëmbëlsirash Bodega 250 ml
- Gota letre për kafe (240 dhe 350 ml)
- Kuti burgeri prej kartoni kraft
- Ngjitëse në rrotull për kuti, qese dhe kapakë

## Katër hapat
1. **Logoja** — na e dërgoni në PDF, SVG ose AI; nëse keni vetëm PNG, duhet të jetë me rezolucion të lartë
2. **Prova** — zakonisht brenda 1–2 ditë pune merrni pamjen digjitale të gotës me logon tuaj, me madhësinë dhe ngjyrat
3. **Miratimi** — korrigjojmë sa herë të duhet; prodhimi fillon vetëm pas miratimit tuaj me shkrim
4. **Prodhimi** — 7–10 ditë pune, pastaj dërgesa ose marrja në depo

## Sasia minimale dhe çmimi
Minimumi është **1 karton për produkt**. Për gotat F95 kjo do të thotë 1.000 gota (20 pako × 50). Printimi kushton **+1,50 € për pako**, pra 0,03 € për gotë.

Shembull: një kafiteri që shet 30–35 frappé në ditë harxhon afërsisht një karton gota 400 ml në muaj. Gotat e thjeshta kushtojnë 50,00 € për karton, me logo 80,00 € — 30 € më shumë në muaj për 1.000 reklama që shëtisin nëpër qytet.

## Planifikoni kohën
Nga logoja te gotat në lokal kalojnë zakonisht **dy javë**. Nëse hapni lokal të ri ose po përgatiteni për sezonin e verës, na shkruani të paktën 3 javë përpara — që të ketë kohë për korrigjime në provë.

## Si të dalë rezultati bukur
- Thjeshtoni logon: 1–2 ngjyra duken më pastër se gradientet
- Mendoni për kontrastin: në plastikë transparente e bardha dhe ngjyrat e çelëta duken më pak
- Shmangni tekstet e vogla nën 6 pt — në gotë nuk lexohen
- Shtoni Instagramin ose numrin e telefonit — gota bëhet kartëvizitë

## Pyetje të shpeshta
**A mund ta ndryshoj dizajnin te porosia e ardhshme?** Po, çdo porosi e re mund të ketë dizajn të ri, me provë të re.

**A mund ta kthej porosinë me logo?** Jo — produktet e personalizuara nuk kthehen, prandaj provën e kontrollojmë bashkë para prodhimit.

**A ndikon printimi te dërgesa?** Dërgesa është falas për çdo porosi nga 50 €, me printim ose pa të.

Gati? [Na dërgoni logon](/kontakti) ose lexoni [detajet e printimit](/faqe/printimi-me-logo).`,
        `A cup with your logo passes through dozens of hands: your customer, their friends, passers-by on the street, followers on Instagram. Logo printing is the cheapest advertising a venue can buy — if you plan it well.

## What can be printed
- F95 plastic cups from 250 to 500 ml and Bodega 250 ml dessert cups
- Paper coffee cups (240 and 350 ml)
- Kraft board burger boxes
- Sticker rolls for boxes, bags and lids

## Four steps
1. **Your logo** — send it as PDF, SVG or AI; if you only have a PNG, make sure it's high resolution
2. **Proof** — usually within 1–2 working days you get a digital mock-up of the cup with your logo, size and colours
3. **Approval** — we revise as often as needed; production starts only after your written approval
4. **Production** — 7–10 working days, then delivery or pickup at our warehouse

## Minimum quantity and price
The minimum is **1 carton per product**. For F95 cups that's 1,000 cups (20 packs × 50). Printing costs **+€1.50 per pack** — €0.03 per cup.

Example: a café selling 30–35 frappés a day goes through roughly one carton of 400 ml cups a month. Plain cups cost €50.00 a carton, printed ones €80.00 — €30 more a month for 1,000 adverts walking around town.

## Plan your timing
From logo to cups in your venue usually takes **two weeks**. If you're opening a new place or getting ready for the summer season, contact us at least 3 weeks ahead — so there's time for proof revisions.

## How to get a great result
- Simplify the logo: 1–2 colours look cleaner than gradients
- Think about contrast: on clear plastic, white and light colours show less
- Avoid small text under 6 pt — it won't read on a cup
- Add your Instagram handle or phone number — the cup becomes a business card

## FAQ
**Can I change the design for my next order?** Yes, every new order can have a new design, with a fresh proof.

**Can I return a logo-printed order?** No — personalised products can't be returned, which is why we check the proof together before production.

**Does printing affect delivery?** Delivery is free on every order of €50 or more, printed or not.

Ready? [Send us your logo](/kontakti) or read the [logo printing details](/faqe/printimi-me-logo).`,
      ),
      cover: '/images/s/printim.webp',
      tag: T('Štampa logotipa', 'Printim me logo', 'Logo print'),
      author: 'Blerta · Paketoje',
      readMinutes: 5,
      publishedAt: d(34),
      published: true,
    },
    {
      id: 'post-salca',
      slug: 'gota-per-salca-1oz-apo-2oz',
      title: T('Čašice za sos 1 oz ili 2 oz? Porcije i trošak po narudžbi', 'Gota për salca 1 oz apo 2 oz? Porcionimi dhe kosto për porosi', 'Sauce cups 1 oz vs 2 oz — portioning and cost per order'),
      excerpt: T(
        'Računica sa stvarnim cijenama: koliko staje u čašicu, koliko košta komad i zašto je sos skuplji od same čašice.',
        'Llogaria me çmimet reale: sa nxë gota, sa kushton copa dhe pse salca kushton më shumë se vetë gota.',
        'The maths with real prices: how much each cup holds, what a piece costs and why the sauce costs more than the cup.',
      ),
      body: T(
        `Sos izgleda kao sitnica, ali u brzoj hrani sa dostavom to je jedan od artikala koji se najviše troše. Izbor između čašice od 1 oz i 2 oz direktno utiče na trošak svake narudžbe — i to ne prvenstveno zbog čašice.

## Koliko staje
- **1 oz (30 ml)** — oko 2 supene kašike; dovoljno za kečap ili majonez uz porciju pomfrita, sos od bijelog luka uz sendvič ili soja sos uz suši
- **2 oz (60 ml)** — oko 4 supene kašike; za dip uz nuggets ili krilca, preliv za salatu ili sos za dijeljenje

Obje dolaze sa poklopcem, u pakovanjima od 100 komada i kartonima od 25 pakovanja (2.500 komada).

## Cijena po komadu
- 1 oz: 2,00 € / 100 = **0,02 €** po komadu · od 10 pakovanja 0,019 € · za karton 0,018 €
- 2 oz: 3,00 € / 100 = **0,03 €** po komadu · od 10 pakovanja 0,0285 € · za karton 0,027 €

## Mjesečna računica
Uzmimo brzu hranu sa 100 narudžbi dnevno i 2 sosa po narudžbi: 200 čašica dnevno, oko **6.000 mjesečno** (60 pakovanja).

- Sa čašicama od 1 oz: 60 pakovanja × 2,00 € = 120 €; pošto je 60 pakovanja više od kartona, popust od −10 % spušta cijenu na **108 €**
- Sa čašicama od 2 oz: 60 pakovanja × 3,00 € = 180 €; sa −10 % **162 €**

Razlika u ambalaži: 54 € mjesečno. Ali prava razlika je u sosu.

## Sos košta više od čašice
Čašica od 2 oz nosi 30 ml sosa više. Ako vas sos košta, na primjer, 3 € po litru (0,003 € po ml), svaka velika čašica ima 0,09 € sosa više od male. Na 6.000 čašica to je **540 € mjesečno** — deset puta više od razlike u cijeni čašica.

## Praktična pravila
- Kečap i majonez uz pomfrit → 1 oz
- Dip uz nuggets, krilca, mozzarella sticks → 2 oz
- Preliv za salatu → 2 oz
- Soja sos i wasabi uz suši → 1 oz
- Dodatni sos uz doplatu → 2 oz, po cijeni koja pokriva i sos i čašicu

## Tri savjeta za uštedu
- Punite čašicu do oko 80 %: poklopac se čisto zatvara i sos ne curi
- Pitajte kupca: „Koliko sosova želite?“ — mnogim narudžbama ne trebaju dva
- Naplatite dodatni sos: 0,30 € za dodatnu čašicu višestruko pokriva i čašicu i sos

Naručite [čašice za sos](/produktet/gota-salca) na karton i ostvarite −10 %.`,
        `Salca duket detaj i vogël, por në një fast food me dërgesa është nga artikujt që harxhohen më shumë. Zgjedhja mes gotës 1 oz dhe 2 oz ndikon drejtpërdrejt në koston e çdo porosie — dhe jo kryesisht për shkak të gotës.

## Sa nxë secila
- **1 oz (30 ml)** — rreth 2 lugë gjelle; mjafton për ketchup ose majonezë me një porcion patate, salcë hudhre me një sanduiç ose salcë soje me sushi
- **2 oz (60 ml)** — rreth 4 lugë gjelle; për dip me nuggets ose krahë pule, salcë për sallatë ose salca për ndarje

Të dyja vijnë me kapak, në pako me 100 copë dhe kartona me 25 pako (2.500 copë).

## Çmimi për copë
- 1 oz: 2,00 € / 100 = **0,02 €** copa · nga 10 pako 0,019 € · me karton 0,018 €
- 2 oz: 3,00 € / 100 = **0,03 €** copa · nga 10 pako 0,0285 € · me karton 0,027 €

## Llogaria mujore
Le të marrim një fast food me 100 porosi në ditë dhe 2 salca për porosi: 200 gota në ditë, rreth **6.000 në muaj** (60 pako).

- Me gota 1 oz: 60 pako × 2,00 € = 120 €; meqë 60 pako janë më shumë se një karton, zbritja −10 % e ul në **108 €**
- Me gota 2 oz: 60 pako × 3,00 € = 180 €; me −10 % **162 €**

Dallimi në paketim: 54 € në muaj. Por dallimi i vërtetë është te salca.

## Salca kushton më shumë se gota
Gota 2 oz mban 30 ml salcë më shumë. Nëse salca ju kushton, për shembull, 3 € për litër (0,003 € për ml), çdo gotë e madhe ka 0,09 € salcë më shumë se gota e vogël. Për 6.000 gota kjo bën **540 € në muaj** — dhjetë herë më shumë se dallimi në çmimin e gotave.

## Rregulla praktike
- Ketchup dhe majonezë me patate → 1 oz
- Dip për nuggets, krahë pule, mozzarella sticks → 2 oz
- Salcë për sallatë → 2 oz
- Salcë soje dhe wasabi me sushi → 1 oz
- Salcë shtesë me pagesë → 2 oz, me çmim që mbulon salcën dhe gotën

## Tri këshilla për kursim
- Mbusheni gotën rreth 80 %: kapaku mbyllet pastër dhe salca nuk derdhet
- Pyesni klientin: „Sa salca dëshironi?“ — shumë porosive nuk u duhen dy
- Faturojeni salcën shtesë: 0,30 € për një gotë shtesë e mbulon me tepri koston e gotës dhe të salcës

Porositni [gotat për salca](/produktet/gota-salca) me karton dhe përfitoni −10 %.`,
        `Sauce looks like a small detail, but in a delivery-heavy fast-food outlet it's one of the items you go through fastest. Choosing between a 1 oz and a 2 oz cup directly affects the cost of every order — and not mainly because of the cup.

## How much each holds
- **1 oz (30 ml)** — about 2 tablespoons; enough for ketchup or mayo with a portion of fries, garlic sauce with a sandwich or soy sauce with sushi
- **2 oz (60 ml)** — about 4 tablespoons; for dips with nuggets or wings, salad dressing or sharing sauces

Both come with lids, in packs of 100 and cartons of 25 packs (2,500 pieces).

## Price per piece
- 1 oz: €2.00 / 100 = **€0.02** each · from 10 packs €0.019 · by the carton €0.018
- 2 oz: €3.00 / 100 = **€0.03** each · from 10 packs €0.0285 · by the carton €0.027

## The monthly maths
Take a fast-food outlet with 100 orders a day and 2 sauces per order: 200 cups a day, about **6,000 a month** (60 packs).

- With 1 oz cups: 60 packs × €2.00 = €120; since 60 packs is more than a carton, the −10 % discount brings it down to **€108**
- With 2 oz cups: 60 packs × €3.00 = €180; with −10 % **€162**

Packaging difference: €54 a month. But the real difference is the sauce.

## The sauce costs more than the cup
A 2 oz cup holds 30 ml more sauce. If your sauce costs, say, €3 per litre (€0.003 per ml), every large cup carries €0.09 more sauce than a small one. Across 6,000 cups that's **€540 a month** — ten times the difference in cup prices.

## Rules of thumb
- Ketchup and mayo with fries → 1 oz
- Dips with nuggets, wings, mozzarella sticks → 2 oz
- Salad dressing → 2 oz
- Soy sauce and wasabi with sushi → 1 oz
- Paid extra sauce → 2 oz, priced to cover both sauce and cup

## Three ways to save
- Fill cups to about 80 %: the lid closes cleanly and nothing leaks
- Ask the customer: "How many sauces would you like?" — plenty of orders don't need two
- Charge for extra sauce: €0.30 per extra cup covers the cup and the sauce several times over

Order [sauce cups](/produktet/gota-salca) by the carton and save 10 %.`,
      ),
      cover: '/images/misc/sauce.webp',
      tag: T('Troškovi', 'Kostot', 'Costs'),
      author: 'Teuta · Paketoje',
      readMinutes: 4,
      publishedAt: d(45),
      published: true,
    },
    {
      id: 'post-gjelber',
      slug: 'paketim-me-i-gjelber-ne-kosove',
      title: T('Zelenija ambalaža na Kosovu: PLA, papir i reciklaža', 'Paketim më i gjelbër në Kosovë: PLA, letër dhe riciklim', 'Greener packaging in Kosovo: PLA, paper and recycling'),
      excerpt: T(
        'Šta je PLA, kada je papir bolji izbor i kako lokal može da smanji otpad već danas — bez mitova i bez greenwashinga.',
        'Çfarë është PLA, kur është letra zgjedhje më e mirë dhe si mund t’i ulë lokali mbeturinat që sot — pa mite dhe pa greenwashing.',
        'What PLA really is, when paper is the better choice and how a venue can cut waste today — no myths, no greenwashing.',
      ),
      body: T(
        `Sve više kupaca pita: „Da li se ovo reciklira?“ Zelena ambalaža više nije samo moda — dio je imidža lokala. Ali mitova ima mnogo. Evo šta danas zaista funkcioniše na Kosovu.

## Plastika nije neprijatelj — otpad jeste
Većina ambalaže koju danas prodajemo je plastična: PET, PP i PS. Koliko je čaša „zelena“ zavisi uglavnom od toga šta se sa njom desi nakon upotrebe. PET čaša koja završi u reciklaži bolja je za okolinu od „eko“ čaše bačene u prirodu.

## Šta je PLA
PLA je plastika dobijena iz biljaka, najčešće iz kukuruznog skroba. Izgleda kao PET i kompostabilna je — ali samo u industrijskom kompostiranju, ne u prirodi niti u kućnom kompostu. Njena glavna prednost je to što se proizvodi iz obnovljive sirovine. Pažnja: hladne PLA čaše ne podnose toplotu.

**U Paketoje PLA čaše i posude stižu uskoro.** Prijavite se na [PLA i bio](/produktet/pla-bio) i javićemo vam prvima.

## Papir i kraft karton
Kraft kutije i papirne čaše su dobar izbor za burgere, suvu hranu i toplu kafu i daju prirodan izgled. Dvije stvari treba znati: papirne čaše imaju tanak plastični sloj iznutra, a mastan karton se obično ne reciklira. U Paketoje se kraft kutije i papirne čaše naručuju sa vašim logotipom — [zatražite ponudu](/kontakti).

## Manje ambalaže = manje otpada
Najzeleniji korak je ambalaža koja se uopšte ne koristi:

- Pitajte kupca da li mu treba pribor — mnoge narudžbe se jedu kod kuće
- Sosove dajte na zahtjev, ne automatski
- Clip poklopac omogućava pijenje direktno — mnogim kupcima slamka ne treba
- Birajte pravu veličinu: posuda od 750 ml za porciju od 500 ml je plaćeni vazduh

## Kako da pomognete reciklaži
- Koristite što više materijala sa oznakom 1 (PET) i 5 (PP), koji se najlakše sakupljaju
- Izbjegavajte kombinacije materijala koje se ne mogu razdvojiti
- Postavite u lokalu odvojene kante za plastiku i papir
- Napišite na meniju ili naljepnici: „Isperi i recikliraj“

## Šta stiže u Paketoje
Proširujemo ponudu PLA čašama i posudama, kao i [aluminijumskim posudama](/produktet/alumin) za toplu hranu. Ako vam treba određeni zeleniji proizvod, pišite nam — zahtjevi kupaca nam pomažu da odlučimo šta prvo da donesemo.`,
        `Gjithnjë e më shumë klientë pyesin: „A riciklohet kjo?“ Paketimi i gjelbër nuk është më vetëm modë — është pjesë e imazhit të lokalit. Por mitet janë të shumta. Ja çfarë funksionon realisht sot në Kosovë.

## Plastika nuk është armiku — mbeturina është
Shumica e paketimeve që shesim sot janë plastike: PET, PP dhe PS. Sa „e gjelbër“ është një gotë varet kryesisht nga ajo që ndodh me të pas përdorimit. Një gotë PET që përfundon në riciklim është më e mirë për mjedisin se një gotë „eko“ e hedhur në natyrë.

## Çfarë është PLA
PLA është plastikë e prodhuar nga bimët, zakonisht nga niseshteja e misrit. Duket si PET dhe është e kompostueshme — por vetëm në kompostim industrial, jo në natyrë e as në kompostin e shtëpisë. Përparësia e saj kryesore është se prodhohet nga lëndë e parë e rinovueshme. Kujdes: gotat e ftohta PLA nuk e durojnë të nxehtën.

**Te Paketoje gotat dhe enët PLA vijnë së shpejti.** Regjistrohuni te [PLA & bio](/produktet/pla-bio) dhe ju njoftojmë të parët.

## Letra dhe kartoni kraft
Kutitë kraft dhe gotat e letrës janë zgjedhje e mirë për burgerë, ushqim të thatë dhe kafe të nxehtë, dhe japin pamje natyrale. Dy gjëra duhen ditur: gotat e letrës kanë një shtresë të hollë plastike brenda, ndërsa kartoni i yndyrshëm zakonisht nuk riciklohet. Te Paketoje kutitë kraft dhe gotat e letrës porositen me logon tuaj — [kërkoni ofertë](/kontakti).

## Më pak paketim = më pak mbeturina
Hapi më i gjelbër është paketimi që nuk përdoret fare:

- Pyesni klientin nëse i duhen takëmet — shumë porosi hahen në shtëpi
- Salcat jepini me kërkesë, jo automatikisht
- Kapaku clip lejon pirje direkte — shumë klientëve nuk u duhet shkop
- Zgjidhni madhësinë e duhur: një enë 750 ml për një porcion 500 ml është ajër i paguar

## Si ta ndihmoni riciklimin
- Përdorni sa më shumë materiale me kod 1 (PET) dhe 5 (PP), që grumbullohen më lehtë
- Shmangni kombinimet e materialeve që nuk ndahen dot
- Vendosni në lokal kosha të veçantë për plastikë dhe letër
- Shkruani në menu ose në ngjitëse: „Shpëlaje dhe riciklo“

## Çfarë vjen te Paketoje
Po e zgjerojmë gamën me gota dhe enë PLA, si dhe me [enë alumini](/produktet/alumin) për ushqim të nxehtë. Nëse ju duhet një produkt i caktuar më i gjelbër, na shkruani — kërkesat e klientëve na ndihmojnë të vendosim çfarë të sjellim më parë.`,
        `More and more customers ask: "Is this recyclable?" Green packaging isn't just a trend any more — it's part of a venue's image. But there are plenty of myths. Here's what actually works in Kosovo today.

## Plastic isn't the enemy — waste is
Most of the packaging we sell today is plastic: PET, PP and PS. How "green" a cup is depends mostly on what happens to it after use. A PET cup that ends up in recycling is better for the environment than an "eco" cup thrown into nature.

## What PLA is
PLA is a plastic made from plants, usually corn starch. It looks like PET and is compostable — but only in industrial composting, not in nature or a home compost heap. Its main advantage is that it's made from a renewable raw material. Note: cold PLA cups don't tolerate heat.

**PLA cups and containers are coming soon to Paketoje.** Sign up on [PLA & bio](/produktet/pla-bio) and you'll hear first.

## Paper and kraft board
Kraft boxes and paper cups are a good choice for burgers, dry food and hot coffee, and they look natural. Two things to know: paper cups have a thin plastic lining inside, and greasy cardboard usually isn't recycled. At Paketoje, kraft boxes and paper cups are ordered printed with your logo — [ask for a quote](/kontakti).

## Less packaging = less waste
The greenest step is packaging you don't use at all:

- Ask customers whether they need cutlery — many orders are eaten at home
- Give sauces on request, not automatically
- The clip lid lets people drink directly — many don't need a straw
- Choose the right size: a 750 ml container for a 500 ml portion is paid-for air

## How to help recycling
- Use as many code 1 (PET) and code 5 (PP) materials as possible — they're the easiest to collect
- Avoid material combinations that can't be separated
- Put separate bins for plastic and paper in your venue
- Print on the menu or a sticker: "Rinse and recycle"

## What's coming to Paketoje
We're expanding the range with PLA cups and containers, plus [aluminium containers](/produktet/alumin) for hot food. If you need a specific greener product, tell us — customer requests help us decide what to bring in first.`,
      ),
      cover: '/images/misc/kraft-cups.webp',
      tag: T('Ekologija', 'Ekologji', 'Sustainability'),
      author: 'Elira · Paketoje',
      readMinutes: 5,
      publishedAt: d(58),
      published: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Coupons (legacy v1 list — the pricing engine uses `discounts`)      */
/* ------------------------------------------------------------------ */
export function buildCoupons(now = new Date()): Coupon[] {
  return [
    { id: 'cp-1', code: 'MIRESEERDHE', type: 'percent', value: 10, minTotal: 30, active: true, uses: 64, description: 'Mirëseerdhe — −10 % në porosinë e parë nga 30 €' },
    { id: 'cp-2', code: 'KAFE15', type: 'percent', value: 15, active: true, uses: 23, expiresAt: new Date(now.getTime() + 24 * 86400000).toISOString(), description: 'Koleksioni i kafiterive — −15 % në gota, kapakë dhe shkopinj' },
    { id: 'cp-3', code: 'VERA10', type: 'percent', value: 10, minTotal: 40, active: false, uses: 41, expiresAt: new Date(now.getTime() - 38 * 86400000).toISOString(), description: 'Oferta e verës — −10 % mbi 40 € (ka skaduar)' },
  ];
}
