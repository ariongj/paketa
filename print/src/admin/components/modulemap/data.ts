// Harta e moduleve — content from the CMS proposal: p.47 (other modules), p.49 (phases), p.50 (acceptance criteria),
// p.51 (decisions). Each module/criterion says honestly what THIS demo already shows and links to that screen.
import type { L10n } from '@/lib/types';

const T = (sq: string, en: string): L10n => ({ sq, en });

/* ------------------------------------------------------------------ */
/* Modules by phase (p.49 + p.47)                                      */
/* ------------------------------------------------------------------ */
export type PhaseId = 'base' | 'second' | 'business';
/** demo = working screen in this demo · phase2 = planned for the second extension · need = only when the business needs it */
export type ModStatus = 'demo' | 'phase2' | 'need';

export interface Phase {
  id: PhaseId;
  title: L10n;
  text: L10n;
}

export const PHASES: Phase[] = [
  {
    id: 'base',
    title: T('Baza e përbashkët', 'Shared core'),
    text: T('Ajo që çdo projekt merr në lëshimin e parë.', 'What every project gets in the first release.'),
  },
  {
    id: 'second',
    title: T('Zgjerimi i dytë', 'Second extension'),
    text: T('Vjen pasi baza funksionon në prodhim.', 'Comes once the core runs in production.'),
  },
  {
    id: 'business',
    title: T('Sipas biznesit', 'Per business need'),
    text: T('Çdo integrim ka specifikim, kufij dhe prova.', 'Every integration has a specification, limits and tests.'),
  },
];

export interface ModuleItem {
  id: string;
  phase: PhaseId;
  status: ModStatus;
  name: L10n;
  text: L10n;
  /** Screen that shows it in this demo (admin route, or a storefront route when `site`) */
  to?: string;
  site?: boolean;
  /** A related (simulated) screen for modules that are not in the demo yet */
  related?: string;
}

export const MODULES_MAP: ModuleItem[] = [
  /* ---------------- 01 Baza e përbashkët ---------------- */
  { id: 'access', phase: 'base', status: 'demo', to: '/admin/konfigurimet/stafi', name: T('Hyrja, rolet dhe auditi', 'Sign-in, roles and audit'), text: T('Leje sipas veprimit; menytë dhe butonat fshihen sipas rolit.', 'Permissions per action; menus and buttons hide per role.') },
  { id: 'catalog', phase: 'base', status: 'demo', to: '/admin/produktet', name: T('Katalog me variante', 'Catalogue with variants'), text: T('Produkte, opsione (madhësia, kartoni, finishimi), çmime, status dhe SEO.', 'Products, options (size, board, finish), prices, status and SEO.') },
  { id: 'tiers', phase: 'base', status: 'demo', to: '/admin/produktet', name: T('Çmime sipas sasisë', 'Quantity price tiers'), text: T('Çmimi për copë sipas tirazhit, sasia minimale dhe hapi i sasisë — pa TVSH.', 'Price per piece by print run, minimum order and quantity step — excl. VAT.') },
  { id: 'artwork', phase: 'base', status: 'demo', to: '/admin/porosite', name: T('Skedarët e printimit dhe prova digjitale', 'Print files and digital proof'), text: T('Skedari në porosi, „dërgo më vonë“ ose dizajn nga PrintWorks; prova v1, v2… dhe aprovimi.', 'File on the order, “send later” or design by PrintWorks; proof v1, v2… and approval.') },
  { id: 'collections', phase: 'base', status: 'demo', to: '/admin/koleksionet', name: T('Koleksionet', 'Collections'), text: T('Koleksione manuale dhe smart me kushte.', 'Manual and smart collections with conditions.') },
  { id: 'inventory', phase: 'base', status: 'demo', to: '/admin/inventari', name: T('Inventari — një lokacion', 'Inventory — one location'), text: T('Lëvizje stoku me arsye; e disponueshme = në dorë − e angazhuar.', 'Stock movements with a reason; available = on hand − committed.') },
  { id: 'orders', phase: 'base', status: 'demo', to: '/admin/porosite', name: T('Porositë dhe draftet', 'Orders and drafts'), text: T('Pagesa, përmbushja dhe rimbursimi veç e veç; porosi draft.', 'Payment, fulfilment and refunds kept apart; draft orders.') },
  { id: 'customers', phase: 'base', status: 'demo', to: '/admin/klientet', name: T('Klientët dhe segmentet', 'Customers and segments'), text: T('Profili i klientit, historia e porosive dhe segmentet.', 'Customer profile, order history and segments.') },
  { id: 'payship', phase: 'base', status: 'demo', to: '/admin/konfigurimet/pagesat', name: T('Pagesa dhe dërgesa', 'Payment and shipping'), text: T('Mënyrat e zgjedhura të pagesës, zonat e dërgesës dhe checkout.', 'Chosen payment methods, shipping zones and checkout.') },
  { id: 'discounts', phase: 'base', status: 'demo', to: '/admin/zbritjet', name: T('Katër llojet e zbritjeve', 'Four discount types'), text: T('Me kod ose automatike, kombinime, pragje dhe kufij.', 'Code or automatic, combinations, thresholds and limits.') },
  { id: 'content', phase: 'base', status: 'demo', to: '/admin/faqet', name: T('Faqet, menytë dhe skedarët', 'Pages, menus and files'), text: T('Përmbajtje në shqip dhe anglisht, me draft dhe publikim.', 'Content in Albanian and English, with draft and publish.') },
  { id: 'offers', phase: 'base', status: 'demo', to: '/admin/ofertat', name: T('Qendra e ofertave', 'Offers centre'), text: T('Oferta lidh rregullin e zbritjes, landing page dhe bannerët.', 'An offer ties the discount rule, landing page and banners.') },
  { id: 'slides', phase: 'base', status: 'demo', to: '/admin/dyqani/sllajdet', name: T('Slideshow dhe bannerë', 'Slideshow and banners'), text: T('Imazhe desktop/mobile, CTA, orar dhe announcement bar.', 'Desktop/mobile images, CTA, schedule and announcement bar.') },
  { id: 'editor', phase: 'base', status: 'demo', to: '/admin/dyqani/editor', name: T('Online Store dhe editori', 'Online Store and editor'), text: T('Seksionet e ballinës, draft, publikim dhe rikthim versioni.', 'Homepage sections, draft, publish and version rollback.') },
  { id: 'contacts', phase: 'base', status: 'demo', to: '/admin/kontaktet', name: T('Kontaktet dhe kërkesat për ofertë', 'Contacts and quote requests'), text: T('Kërkesat nga faqja me specifikimet e punës (material, përmasa, sasi, afat), përgjegjësi dhe statusi.', 'Website requests with the job specs (material, size, quantity, deadline), assignee and status.') },
  { id: 'settings', phase: 'base', status: 'demo', to: '/admin/konfigurimet', name: T('Konfigurimet dhe njoftimet', 'Settings and notifications'), text: T('Dyqani, stafi, gjuhët, shabllonet email dhe privatësia.', 'Store, staff, languages, email templates and privacy.') },
  { id: 'reports', phase: 'base', status: 'demo', to: '/admin/analitika', name: T('Raporte bazë', 'Basic reports'), text: T('Shitje, operacione dhe fushata, me eksport CSV.', 'Sales, operations and campaigns, with CSV export.') },

  /* ---------------- 02 Zgjerimi i dytë ---------------- */
  { id: 'purchasing', phase: 'second', status: 'demo', to: '/admin/furnizimet', name: T('Furnizimet', 'Purchase orders'), text: T('Pranimi i mallit është idempotent — i njëjti pranim dy herë nuk shton stok.', 'Receiving is idempotent — the same receipt twice adds no stock.') },
  { id: 'transfers', phase: 'second', status: 'phase2', related: '/admin/inventari', name: T('Transferimet dhe multi-location', 'Transfers and multi-location'), text: T('Për tani një lokacion dhe korrigjime me arsye.', 'One location and reasoned adjustments for now.') },
  { id: 'models', phase: 'second', status: 'demo', to: '/admin/modelet', name: T('Blogu dhe modelet e përmbajtjes', 'Blog and content models'), text: T('Përmbajtje e strukturuar: projekte klientësh, FAQ, teknologji, lokacione.', 'Structured content: client projects, FAQ, technology, locations.') },
  { id: 'markets', phase: 'second', status: 'demo', to: '/admin/tregjet', name: T('Tregjet dhe shumë valuta', 'Markets and currencies'), text: T('Shtete, gjuhë, valutë dhe politikë rrumbullakimi.', 'Countries, languages, currency and rounding policy.') },
  { id: 'returns', phase: 'second', status: 'demo', to: '/admin/kthimet', name: T('Kthimet', 'Returns'), text: T('Kthim i pjesshëm me shumë të saktë dhe rikthim në stok.', 'Partial returns with the exact amount and restocking.') },
  { id: 'selfservice', phase: 'second', status: 'phase2', name: T('Vetëshërbim për klientët', 'Customer self-service'), text: T('Klienti e kërkon vetë kthimin dhe ndjek statusin.', 'Customers request returns and track the status themselves.') },
  { id: 'appointments', phase: 'second', status: 'demo', to: '/admin/terminet', name: T('Takimet dhe kalendari', 'Meetings and calendar'), text: T('Konsulta për paketim, prezantime mostrash dhe vizita në fabrikë pa mbivendosje.', 'Packaging consultations, sample presentations and factory visits without overlaps.') },
  { id: 'b2b', phase: 'second', status: 'demo', to: '/admin/kontaktet/oferta-b2b', name: T('Oferta B2B', 'B2B quotes'), text: T('Ofertë nga kërkesa, artikuj, afat vlefshmërie dhe status.', 'Quote from an enquiry, lines, validity and status.') },
  { id: 'campaigns', phase: 'second', status: 'demo', to: '/admin/analitika?tab=campaigns', name: T('Raportet e fushatave', 'Campaign reports'), text: T('Vizita, klikime, përdorime kodi, porosi dhe ulje monetare.', 'Visits, clicks, code uses, orders and money off.') },
  { id: 'fiscal', phase: 'second', status: 'phase2', related: '/admin/integrimet', name: T('Fiskalizimi (ATK)', 'Fiscalisation (ATK)'), text: T('Regjistrimi i faturave në sistemin e fiskalizimit të ATK-së — përmes integrimit.', 'Invoices registered with the ATK fiscal system — via an integration.') },
  { id: 'automations', phase: 'second', status: 'phase2', name: T('Automatizimet', 'Automations'), text: T('Trigger → kusht → veprim, me log, riprovim dhe parandalim ciklesh.', 'Trigger → condition → action, with log, retry and loop protection.') },
  { id: 'import', phase: 'second', status: 'phase2', related: '/admin/produktet', name: T('Import i avancuar', 'Advanced import'), text: T('Importi bazë CSV me kontroll dublikatash SKU funksionon tashmë në demo.', 'Basic CSV import with a duplicate-SKU check already works in the demo.') },

  /* ---------------- 03 Sipas biznesit ---------------- */
  { id: 'wishlist', phase: 'business', status: 'demo', to: '/te-preferuarat', site: true, name: T('Wishlist, kërkim dhe filtra', 'Wishlist, search and filters'), text: T('Në faqen publike funksionojnë tashmë wishlist, kërkimi dhe filtrat.', 'Wishlist, search and filters already work on the public site.') },
  { id: 'pos', phase: 'business', status: 'need', name: T('POS me sinkronizim', 'POS with sync'), text: T('Një burim i qartë për stokun dhe porositë.', 'One source of truth for stock and orders.') },
  { id: 'marketplace', phase: 'business', status: 'need', name: T('Marketplace dhe rrjete sociale', 'Marketplaces and social'), text: T('Mapim produktesh, queue dhe gabime sinkronizimi.', 'Product mapping, queue and sync errors.') },
  { id: 'erp', phase: 'business', status: 'need', related: '/admin/integrimet', name: T('Prepress, MIS dhe ERP', 'Prepress, MIS and ERP'), text: T('Preflight automatik i skedarëve, punë në planifikimin e prodhimit dhe fatura me kontabilitetin.', 'Automatic file preflight, jobs in production planning and invoices with accounting.') },
  { id: 'courier', phase: 'business', status: 'need', related: '/admin/integrimet', name: T('API i korrierit', 'Courier API'), text: T('Etiketa dhe gjurmim i dërgesës në porosi.', 'Labels and shipment tracking on the order.') },
  { id: 'giftcards', phase: 'business', status: 'need', name: T('Gift cards dhe store credit', 'Gift cards and store credit'), text: T('Balancë dhe regjistër përdorimi.', 'Balance and usage ledger.') },
  { id: 'b2bprices', phase: 'business', status: 'need', name: T('Kompani B2B dhe çmime sipas klientit', 'B2B companies and price lists'), text: T('Çmime kontrate për klientë të rregullt (p.sh. zinxhirë restorantesh) dhe ripërsëritje porosie me një klik.', 'Contract prices for regular customers (e.g. restaurant chains) and one-click reorders.') },
  { id: 'bundles', phase: 'business', status: 'need', name: T('Bundles', 'Bundles'), text: T('Stoku i komponentëve zbritet bashkë.', 'Component stock is reduced together.') },
  { id: 'subscriptions', phase: 'business', status: 'need', name: T('Abonime dhe produkte digjitale', 'Subscriptions and digital products'), text: T('Rinovim dhe anulim përmes ofruesit të pagesave periodike.', 'Renewal and cancellation via a recurring-payments provider.') },
  { id: 'loyalty', phase: 'business', status: 'need', name: T('Program besnikërie', 'Loyalty programme'), text: T('Pikë ose kupona, me regjistër dhe kthim pikësh.', 'Points or coupons, with a ledger and reversals.') },
  { id: 'reviews', phase: 'business', status: 'need', name: T('Reviews', 'Reviews'), text: T('Moderim dhe verifikim blerjeje.', 'Moderation and verified purchase.') },
  { id: 'abandoned', phase: 'business', status: 'need', name: T('Shporta të braktisura', 'Abandoned carts'), text: T('Kujtesë vetëm me pëlqimin e klientit.', 'Reminders only with the customer’s consent.') },
  { id: 'ai', phase: 'business', status: 'need', name: T('AI për sugjerime përmbajtjeje', 'AI content suggestions'), text: T('Gjithmonë me shqyrtim para publikimit; nuk ndryshon vetë çmime apo zbritje.', 'Always reviewed before publishing; never changes prices or discounts on its own.') },
  { id: 'multistore', phase: 'business', status: 'need', name: T('Panel për shumë dyqane', 'Multi-store dashboard'), text: T('Projekt platforme më vete, me izolim të dhënash.', 'A separate platform project, with data isolation.') },
];

/* ------------------------------------------------------------------ */
/* Acceptance criteria (p.50)                                          */
/* ------------------------------------------------------------------ */
/** demo = demonstrated here · partial = visible in the demo, completed in the implementation · impl = verified during implementation */
export type CritState = 'demo' | 'partial' | 'impl';

export interface Criterion {
  id: string;
  state: CritState;
  text: L10n;
  how: L10n;
  to?: string;
  site?: boolean;
}

export interface CriteriaGroup {
  id: string;
  title: L10n;
  items: Criterion[];
}

export const CRITERIA: CriteriaGroup[] = [
  {
    id: 'catalog',
    title: T('Katalog, porosi dhe leje', 'Catalogue, orders and permissions'),
    items: [
      { id: 'variant', state: 'partial', to: '/admin/porosite', text: T('Variant dhe tirazh i saktë', 'Correct variant and print run'), how: T('Opsionet (madhësia, kartoni, finishimi), sasia dhe çmimi sipas sasisë ruhen në shportë dhe porosi; stoku për variant verifikohet në implementim.', 'Options (size, board, finish), quantity and the tier price are kept in the cart and order; per-variant stock is verified in the implementation.') },
      { id: 'import', state: 'demo', to: '/admin/produktet', text: T('Import pa duplikate', 'Import without duplicates'), how: T('Importi CSV raporton SKU të dyfishtë dhe ofron përditësimin e produktit ekzistues.', 'The CSV import reports duplicate SKUs and offers to update the existing product.') },
      { id: 'archive', state: 'demo', to: '/admin/produktet', text: T('Arkivim pa humbje historie', 'Archiving without losing history'), how: T('Produkti i arkivuar largohet nga faqja, por mbetet në porositë dhe raportet e vjetra.', 'An archived product leaves the site but stays in past orders and reports.') },
      { id: 'oversell', state: 'partial', to: '/admin/inventari', text: T('Shitja e njësisë së fundit pa overselling', 'Selling the last unit without overselling'), how: T('Demo tregon të disponueshmen = në dorë − e angazhuar; transaksioni në server për blerje të njëkohshme verifikohet në implementim.', 'The demo shows available = on hand − committed; the server transaction for simultaneous purchases is verified in the implementation.') },
      { id: 'payment', state: 'partial', to: '/admin/furnizimet', text: T('Pagesë e përsëritur nuk krijon pagesë/porosi të dyfishtë', 'A repeated payment never creates a duplicate payment or order'), how: T('Parimi i idempotencës shihet te pranimi i furnizimit: i njëjti pranim dy herë nuk shton stok. Pagesat verifikohen me ofruesin.', 'Idempotency shows when receiving a purchase order: the same receipt twice adds no stock. Payments are verified with the provider.') },
      { id: 'return', state: 'demo', to: '/admin/kthimet', text: T('Kthim i pjesshëm me sasi dhe ulje të saktë', 'Partial return with exact quantity and discount'), how: T('Rimbursimi llogaritet nga shuma neto e paguar e artikujve — ulja e shpërndarë në artikuj merret parasysh.', 'The refund is the net paid amount of the lines — the discount allocated to them is taken into account.') },
      { id: 'perm', state: 'partial', to: '/admin/konfigurimet/stafi', text: T('API refuzon publikimin/fshirjen/rimbursimin pa leje', 'The API refuses publish/delete/refund without permission'), how: T('Ndërroni rolin te menuja e llogarisë: menytë dhe butonat fshihen (Marketingu përgatit, por nuk publikon). Refuzimi në API verifikohet në implementim.', 'Switch the role in the account menu: menus and buttons hide (Marketing prepares but cannot publish). The API refusal is verified in the implementation.') },
    ],
  },
  {
    id: 'promo',
    title: T('Zbritje dhe oferta', 'Discounts and offers'),
    items: [
      { id: 'four', state: 'demo', to: '/admin/zbritjet', text: T('Të katër llojet me kod ose automatike', 'All four types, by code or automatic'), how: T('Produkte, porosi, Blej X merr Y dhe dërgesë — secila me kod ose automatike.', 'Products, order, Buy X get Y and shipping — each by code or automatic.') },
      { id: 'threshold', state: 'demo', to: '/admin/zbritjet', text: T('Prag para/pas uljeve i specifikuar', 'Threshold before/after discounts is specified'), how: T('Pragu i kodit të porosisë llogaritet pas zbritjeve të produkteve dhe pa TVSH — shihet në testin e shportës.', 'The order code’s threshold counts after product discounts and excl. VAT — visible in the cart tester.') },
      { id: 'combine', state: 'demo', to: '/admin/zbritjet', text: T('Kombinim i ndërsjellë dhe best value', 'Mutual combination and best value'), how: T('Të dy rregullat duhet ta lejojnë kombinimin; motori zgjedh kursimin më të madh në euro, jo përqindjen më të lartë.', 'Both rules must allow combining; the engine picks the largest saving in euros, not the highest percentage.') },
      { id: 'cents', state: 'demo', to: '/admin/zbritjet', text: T('Pa total negativ dhe centë të saktë', 'No negative total, exact cents'), how: T('Shembujt numerikë të fq. 26 kalojnë në testin e motorit të zbritjeve; shpërndarja në artikuj bëhet në centë.', 'The numeric examples from p.26 pass the discount-engine test; allocation per line is done in cents.') },
      { id: 'usage', state: 'partial', to: '/admin/zbritjet', text: T('Kufi përdorimi atomik', 'Atomic usage limit'), how: T('Kufiri dhe numëruesi i përdorimeve ekzistojnë te çdo kod; atomiciteti nën ngarkesë verifikohet në server.', 'The limit and usage counter exist on every code; atomicity under load is verified on the server.') },
      { id: 'expiry', state: 'demo', to: '/admin/ofertat', text: T('Oferta skadon në kohën e duhur', 'An offer expires on time'), how: T('Gjendja llogaritet nga datat: oferta e skaduar largohet nga bannerët dhe shiriti, dhe slide-t e saj fiken.', 'State derives from dates: an expired offer leaves the banners and bar, and its slides switch off.') },
      { id: 'fallback', state: 'demo', to: '/admin/ofertat', text: T('Produkt pa stok dhe landing page joaktive trajtohen', 'Out-of-stock product and inactive landing page are handled'), how: T('Oferta draft ose e skaduar shfaq „Oferta ka përfunduar“ me ofertat aktive; kontrollet e ofertës paralajmërojnë për produktet pa stok.', 'A draft or expired offer shows “This offer has ended” with the live offers; offer checks warn about out-of-stock products.') },
    ],
  },
  {
    id: 'ops',
    title: T('Përmbajtje dhe operim', 'Content and operations'),
    items: [
      { id: 'slides', state: 'demo', to: '/admin/dyqani/sllajdet', text: T('Slide me media mobile/desktop, CTA e vlefshme dhe tekst alternativ', 'Slide with mobile/desktop media, a valid CTA and alt text'), how: T('Editori i slide-it kontrollon linkun, kërkon tekst alternativ dhe shfaq të dy formatet.', 'The slide editor checks the link, requires alt text and previews both formats.') },
      { id: 'drafts', state: 'demo', to: '/admin/dyqani/editor', text: T('Draftet jo publike; publish/rollback i kontrolluar', 'Drafts are not public; controlled publish/rollback'), how: T('Ballina redaktohet si draft, publikohet me një klik dhe rikthehet nga historia e versioneve.', 'The homepage is edited as a draft, published in one click and restored from version history.') },
      { id: 'forms', state: 'impl', text: T('Formular pa duplikim/spam', 'Forms without duplicates or spam'), how: T('Mbrojtja nga spami (honeypot, kufizim frekuence) dhe dublikatat funksionon në server.', 'Spam (honeypot, rate limit) and duplicate protection run on the server.') },
      { id: 'bookings', state: 'demo', to: '/admin/terminet', text: T('Termine pa mbivendosje', 'Appointments without overlap'), how: T('Kalendari refuzon takimin kur konsulenti është i zënë ose kapaciteti i shërbimit është plot.', 'The calendar rejects a meeting when the consultant is busy or the service is at capacity.') },
      { id: 'notify', state: 'impl', text: T('Njoftimet nuk përsëriten pas retry', 'Notifications are not repeated after a retry'), how: T('Queue me çelës idempotence në server.', 'A server queue with an idempotency key.') },
      { id: 'backup', state: 'partial', to: '/admin/konfigurimet/demo', text: T('Backup rikthehet', 'A backup can be restored'), how: T('Të dhënat demo eksportohen dhe importohen te Konfigurimet; backup-i real me provë rikthimi funksionon në server.', 'Demo data is exported and imported in Settings; a real backup with a restore test runs on the server.') },
      { id: 'second', state: 'impl', text: T('Projekti i dytë instalohet pa kopjim logjike', 'A second project installs without copying logic'), how: T('I njëjti core me konfigurim tjetër (marka, gjuhët, modulet) — verifikohet në projektin pilot.', 'The same core with another configuration (brand, languages, modules) — verified on the pilot project.') },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Decisions for the client (p.51)                                     */
/* ------------------------------------------------------------------ */
export interface Decision {
  id: string;
  q: L10n;
  /** What the demo currently assumes — may contain {staff} {roles} {langs} {tz} {products} {connected} {test} */
  hint?: L10n;
}

export interface DecisionGroup {
  id: string;
  title: L10n;
  items: Decision[];
}

export const DECISIONS: DecisionGroup[] = [
  {
    id: 'identity',
    title: T('Identitet dhe projekti pilot', 'Identity and pilot project'),
    items: [
      { id: 'brand', q: T('Emri dhe marka e CMS-it?', 'The CMS name and brand?'), hint: T('Në demo: „CMS“ me shenjën PrintWorks', 'In the demo: “CMS” with the PrintWorks mark') },
      { id: 'pilot', q: T('Website-i i parë (pilot), tipi i produkteve dhe kodi ekzistues?', 'The first website (pilot), product types and existing code?'), hint: T('Propozim: printwor-ks.com — paketim produktesh dhe ushqimor, etiketa & shrink sleeve, qese letre, materiale promovuese', 'Proposal: printwor-ks.com — product and food packaging, labels & shrink sleeves, paper bags, promotional print') },
      { id: 'staff', q: T('Stafi që do ta përdorë dhe rolet?', 'Who will use it, and with which roles?'), hint: T('Në demo: {staff} persona, {roles} role', 'In the demo: {staff} people, {roles} roles') },
      { id: 'locale', q: T('Gjuhët, valuta, domeni dhe zona kohore?', 'Languages, currency, domain and time zone?'), hint: T('Në demo: {langs} · EUR · {tz}', 'In the demo: {langs} · EUR · {tz}') },
      { id: 'catalog', q: T('Vëllimi i katalogut dhe të dhënat për migrim?', 'Catalogue size and data to migrate?'), hint: T('Në demo: {products} produkte; import me CSV', 'In the demo: {products} products; CSV import') },
    ],
  },
  {
    id: 'promo',
    title: T('Promocionet', 'Promotions'),
    items: [
      { id: 'pricing', q: T('Çmimi në katalog apo ulje në checkout?', 'Sale price in the catalogue or a discount at checkout?'), hint: T('Në demo: të dyja — çmim promocional te produkti dhe zbritje automatike në shportë', 'In the demo: both — a sale price on the product and automatic discounts in the cart') },
      { id: 'combos', q: T('Cilat kombinime lejohen; pragjet dhe kufijtë?', 'Which combinations are allowed; thresholds and limits?'), hint: T('Në demo: kodi i porosisë nuk kombinohet me zbritje tjetër porosie; pragjet pa TVSH', 'In the demo: an order code does not combine with another order discount; thresholds excl. VAT') },
      { id: 'offers', q: T('Për ofertat: landing page, slideshow, bannerë dhe orar?', 'For offers: landing page, slideshow, banners and schedule?'), hint: T('Në demo: të katërta, të lidhura me të njëjtën ofertë', 'In the demo: all four, linked to the same offer') },
      { id: 'bxgy', q: T('Dhurata te „Blej X, merr Y“ manuale apo automatike?', 'Is the “Buy X get Y” gift manual or automatic?'), hint: T('Në demo: Y shtohet në shportë nga klienti (p.sh. 1.000 kuti pice → 1.000 etiketa falas)', 'In the demo: the customer adds Y to the cart (e.g. 1,000 pizza boxes → 1,000 labels free)') },
      { id: 'approval', q: T('Miratim nga menaxheri para aktivizimit?', 'Manager approval before activation?'), hint: T('Në demo: Marketingu përgatit, menaxheri ose pronari publikon', 'In the demo: Marketing prepares, a manager or the owner publishes') },
    ],
  },
  {
    id: 'print',
    title: T('Printimi dhe prepress-i', 'Print and prepress'),
    items: [
      { id: 'tiers', q: T('Çmimet sipas sasisë: shkallët, sasia minimale dhe hapi për çdo produkt?', 'Quantity pricing: tiers, minimum order and step per product?'), hint: T('Në demo: çmime sipas tirazhit, MOQ dhe hap sasie te çdo produkt', 'In the demo: run-length prices, MOQ and a quantity step on every product') },
      { id: 'vat', q: T('Çmimet në katalog pa TVSH (B2B) apo me TVSH?', 'Catalogue prices excl. VAT (B2B) or incl. VAT?'), hint: T('Në demo: {priced}, TVSH {vat}% në arkë', 'In the demo: {priced}, {vat}% VAT at checkout') },
      { id: 'artwork', q: T('Skedarët: ngarkim me porosinë, „dërgo më vonë“ apo dizajn nga PrintWorks?', 'Files: upload with the order, “send later” or design by PrintWorks?'), hint: T('Në demo: të treja; dizajni & prepress si tarifë fikse për linjë', 'In the demo: all three; design & prepress as a flat fee per line') },
      { id: 'proof', q: T('Prova digjitale: kush e aprovon, sa versione përfshihen dhe kur nis prodhimi?', 'Digital proof: who approves it, how many versions are included and when does production start?'), hint: T('Në demo: prova v1 brenda 24 orësh; ndryshimet hapin v2; prodhimi nis pas aprovimit', 'In the demo: proof v1 within 24 h; changes open v2; production starts after approval') },
      { id: 'rfq', q: T('Kërkesat për ofertë: cilat fusha (material, përmasa, ngjyra, finishime, afat)?', 'Quote requests: which fields (material, size, colours, finishes, deadline)?'), hint: T('Në demo: formulari „Kërko ofertë“ krijon kërkesë me specifikime te Kontaktet', 'In the demo: the “Request a quote” form creates a request with specs in Contacts') },
    ],
  },
  {
    id: 'integrations',
    title: T('Integrimet dhe modulet', 'Integrations and modules'),
    items: [
      { id: 'providers', q: T('Pagesa, korrieri, fiskalizimi/kontabiliteti dhe kanalet — cilët ofrues?', 'Payments, courier, fiscalisation/accounting and channels — which providers?'), hint: T('Gjendja në demo: {connected} e lidhur, {test} në prove', 'Demo status: {connected} connected, {test} in test') },
      { id: 'bookings', q: T('Terminet: rezervime apo kërkesa takimesh; pagesë/depozitë?', 'Appointments: bookings or meeting requests; payment or deposit?'), hint: T('Në demo: takime (konsulta, vizita në fabrikë) që ekipi i konfirmon, pa depozitë', 'In the demo: meetings (consultations, factory visits) confirmed by the team, no deposit') },
      { id: 'scope', q: T('A duhen çmime kontrate B2B, prepress/MIS, multi-location ose eksport BE në lëshimin e parë?', 'Are B2B contract prices, prepress/MIS, multi-location or EU export needed in the first release?') },
    ],
  },
];
