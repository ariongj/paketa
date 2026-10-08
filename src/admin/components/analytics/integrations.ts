// Integrations catalogue (PDF p.06 "Integrime: pagesa, korrier, email, ERP, analitikë", p.40 "Integrime dhe webhook
// endpoints me scopes, status, histori dhe rotacion secrets", p.51 "Pagesa, korrieri, fiskalizimi/kontabiliteti").
// Everything here is a DEMO description: nothing connects to a real service.
import type { ComponentType } from 'react';
import { ChartColumn, CreditCard, Database, Mail, Receipt, Truck } from 'lucide-react';
import { lt } from '@/i18n';
import type { Integration, IntegrationKind, L10n, Lang, Order } from '@/lib/types';

const T = (me: string, sq: string, en: string): L10n => ({ me, sq, en });

/** Provider names are brand names (plain text) or a localised description. */
export type ProviderName = string | L10n;
export const pName = (n: ProviderName | undefined, lang: Lang) => (n === undefined ? undefined : typeof n === 'string' ? n : lt(n, lang));

export const KINDS: IntegrationKind[] = ['payment', 'courier', 'email', 'fiscal', 'analytics', 'erp'];

export interface IntegrationX extends Integration {
  provider?: string;
  scopes?: string[];
  env?: 'test' | 'live';
  lastSync?: string;
  /** demo connection log entries, newest first */
  log?: { at: string; level: 'ok' | 'warn' | 'error'; text: L10n }[];
}

export interface KindMeta {
  icon: ComponentType<{ className?: string }>;
  label: L10n;
  title: L10n;
  desc: L10n;
  providers: { id: string; name: ProviderName; note: L10n }[];
  scopes: { id: string; label: L10n; required?: boolean }[];
}

export const KIND_META: Record<IntegrationKind, KindMeta> = {
  payment: {
    icon: CreditCard,
    label: T('Plaćanja', 'Pagesa', 'Payments'),
    title: T('Kartično plaćanje', 'Pagesa me kartelë', 'Card payments'),
    desc: T('Online plaćanje karticom, autorizacija, naplata i povrat novca. CMS čuva samo reference transakcija, nikad brojeve kartica.', 'Pagesë online me kartelë, autorizim, capture dhe rimbursim. CMS ruan vetëm referenca transaksioni, jo numra kartash.', 'Online card payments, authorisation, capture and refunds. The CMS stores transaction references only, never card numbers.'),
    providers: [
      { id: 'bank', name: T('E-commerce gateway banke', 'Porta e-commerce e bankës', 'Bank e-commerce gateway'), note: T('Ugovor sa bankom na Kosovu (Raiffeisen, ProCredit, TEB…) — Primjer', 'Kontratë me një bankë në Kosovë (Raiffeisen, ProCredit, TEB…) — Shembull', 'Contract with a Kosovo bank (Raiffeisen, ProCredit, TEB…) — Example') },
      { id: 'paysera', name: 'Paysera Checkout', note: T('Kartice i bankovni linkovi, regionalno', 'Kartela dhe linqe bankare, rajonale', 'Cards and bank links, regional') },
    ],
    scopes: [
      { id: 'payments:write', label: T('Kreiranje i naplata plaćanja', 'Krijo dhe kap pagesa', 'Create and capture payments'), required: true },
      { id: 'refunds:write', label: T('Povrat novca', 'Rimburso', 'Refunds') },
      { id: 'webhooks:read', label: T('Webhook obavještenja (potpisana)', 'Njoftime webhook (të nënshkruara)', 'Webhook notifications (signed)'), required: true },
    ],
  },
  courier: {
    icon: Truck,
    label: T('Kurir', 'Korrier', 'Courier'),
    title: T('Kurirska služba', 'Shërbimi i korrierit', 'Courier service'),
    desc: T('Pošiljke i nalepnice za kartone, broj za praćenje u narudžbi, pouzeće i obavještenje kupcu.', 'Dërgesa dhe etiketa për kartonët, numri i gjurmimit në porosi, pagesa në dorëzim dhe njoftim për klientin.', 'Shipments and labels for cartons, tracking number on the order, cash on delivery and a customer notification.'),
    providers: [
      { id: 'local', name: T('Lokalni kurir (po izboru)', 'Korrier lokal (sipas zgjedhjes)', 'Local courier (to be chosen)'), note: T('Kosovo za 1–3 dana, sa pouzećem', 'Kosova për 1–3 ditë, me pagesë në dorëzim', 'Kosovo in 1–3 days, with cash on delivery') },
      { id: 'posta', name: 'Posta e Kosovës', note: T('Nacionalna pošta', 'Posta kombëtare', 'National post') },
      { id: 'dhl', name: 'DHL Express', note: T('B2B pošiljke za Albaniju, S. Makedoniju i Crnu Goru', 'Dërgesa B2B për Shqipëri, Maqedoni të V. dhe Mal të Zi', 'B2B shipments to Albania, N. Macedonia and Montenegro') },
    ],
    scopes: [
      { id: 'shipments:write', label: T('Pošiljke i nalepnice', 'Dërgesa dhe etiketa', 'Shipments and labels'), required: true },
      { id: 'tracking:read', label: T('Praćenje pošiljke', 'Gjurmimi i dërgesës', 'Shipment tracking'), required: true },
      { id: 'pickups:write', label: T('Zakazivanje preuzimanja', 'Porosit marrje', 'Schedule pickups') },
    ],
  },
  email: {
    icon: Mail,
    label: T('E-mail', 'E-mail', 'E-mail'),
    title: T('Transakcijski e-mail', 'E-mail transaksionalë', 'Transactional e-mail'),
    desc: T('Potvrde narudžbi, plaćanja, dostave, povrata, upita, uzoraka i termina — sa logom slanja i ponovnim pokušajem.', 'Konfirmime porosie, pagese, dërgese, kthimi, kërkese, mostrash dhe termini — me log dërgimi dhe riprovim.', 'Order, payment, shipping, return, request, sample and booking confirmations — with a send log and retries.'),
    providers: [
      { id: 'smtp', name: 'SMTP (info@paketoje.com)', note: T('Postojeći server pošte domena', 'Serveri ekzistues i postës së domenit', 'The domain’s existing mail server') },
      { id: 'postmark', name: 'Postmark', note: T('Servis za transakcijsku poštu', 'Shërbim për e-mail transaksionalë', 'Transactional e-mail service') },
      { id: 'ses', name: 'Amazon SES', note: T('Veliki obim slanja', 'Vëllim i madh dërgimi', 'High sending volume') },
    ],
    scopes: [
      { id: 'messages:send', label: T('Slanje poruka', 'Dërgo mesazhe', 'Send messages'), required: true },
      { id: 'templates:read', label: T('Šabloni', 'Shabllonet', 'Templates') },
      { id: 'bounces:read', label: T('Vraćene poruke (bounce)', 'Mesazhet e kthyera (bounce)', 'Bounces') },
    ],
  },
  fiscal: {
    icon: Receipt,
    label: T('Fiskalizacija', 'Fiskalizimi', 'Fiscalisation'),
    title: T('Fiskalizacija (ATK)', 'Fiskalizimi (ATK)', 'Fiscalisation (ATK)'),
    desc: T('Fiskalni račun za svaku plaćenu narudžbu preko sistema fiskalizacije Poreske administracije Kosova (ATK) — faza 2. CMS ne zamjenjuje fiskalni uređaj.', 'Kupon / faturë fiskale për çdo porosi të paguar përmes sistemit të fiskalizimit të Administratës Tatimore të Kosovës (ATK) — faza 2. CMS nuk zëvendëson pajisjen fiskale.', 'A fiscal receipt for every paid order through the Tax Administration of Kosovo (ATK) fiscalisation system — phase 2. The CMS doesn’t replace the fiscal device.'),
    providers: [
      { id: 'atk', name: T('ATK — direktna veza', 'ATK — lidhje direkte', 'ATK — direct connection'), note: T('Sa sertifikatom firme (NUI)', 'Me certifikatën e biznesit (NUI)', 'With the business certificate (NUI)') },
      { id: 'device', name: T('Certifikovani fiskalni uređaj', 'Pajisje fiskale e certifikuar', 'Certified fiscal device'), note: T('Kasa u depou izdaje račun', 'Arka në depo e lëshon kuponin', 'The warehouse till issues the receipt') },
      { id: 'accounting', name: T('Preko knjigovodstvenog softvera', 'Përmes softuerit të kontabilitetit', 'Through the accounting software'), note: T('Fiskalizuje knjigovodstvo', 'Fiskalizon kontabiliteti', 'Fiscalised by the accounting software') },
    ],
    scopes: [
      { id: 'invoices:fiscalize', label: T('Fiskalizacija računa (verifikacioni kod)', 'Fiskalizo faturat (kodi i verifikimit)', 'Fiscalise invoices (verification code)'), required: true },
      { id: 'invoices:read', label: T('Status računa', 'Statusi i faturave', 'Invoice status'), required: true },
      { id: 'reports:z', label: T('Dnevni Z izvještaj', 'Raporti ditor Z', 'Daily Z report') },
    ],
  },
  analytics: {
    icon: ChartColumn,
    label: T('Analitika', 'Analitikë', 'Analytics'),
    title: T('Praćenje posjeta i konverzija', 'Analitika e vizitave dhe konvertimeve', 'Visit and conversion tracking'),
    desc: T('Strukturisani događaji: posjeta, korpa, checkout, kupovina, UTM i klikovi na ponude — uz poštovanje pristanka na kolačiće.', 'Ngjarje të strukturuara: vizitë, shportë, checkout, blerje, UTM dhe klikime ofertash — duke respektuar pëlqimin për cookies.', 'Structured events: visit, cart, checkout, purchase, UTM and offer clicks — respecting cookie consent.'),
    providers: [
      { id: 'ga4', name: 'Google Analytics 4', note: T('Besplatno, standard', 'Falas, standard', 'Free, standard') },
      { id: 'plausible', name: 'Plausible', note: T('Bez kolačića', 'Pa cookies', 'Cookie-less') },
      { id: 'meta', name: 'Meta Pixel', note: T('Kampanje na mrežama', 'Fushata në rrjete', 'Social campaigns') },
    ],
    scopes: [
      { id: 'events:write', label: T('Slanje događaja', 'Dërgo ngjarje', 'Send events'), required: true },
      { id: 'consent:read', label: T('Pristanak na kolačiće', 'Pëlqimi për cookies', 'Cookie consent'), required: true },
      { id: 'reports:read', label: T('Čitanje izvještaja u CMS-u', 'Lexo raportet në CMS', 'Read reports in the CMS') },
    ],
  },
  erp: {
    icon: Database,
    label: T('ERP / knjigovodstvo', 'ERP / kontabilitet', 'ERP / accounting'),
    title: T('ERP i knjigovodstvo', 'ERP dhe kontabiliteti', 'ERP and accounting'),
    desc: T('Sinhronizacija artikala, zaliha, narudžbi i računa sa knjigovodstvom. Uključuje se po potrebi, uz specifikaciju i testove.', 'Sinkronizim artikujsh, stoku, porosish dhe faturash me kontabilitetin. Aktivizohet sipas nevojës, me specifikim dhe prova.', 'Syncs items, stock, orders and invoices with accounting. Switched on when needed, with a specification and tests.'),
    providers: [
      { id: 'accounting', name: T('Knjigovodstveni softver (po izboru)', 'Softueri i kontabilitetit (sipas zgjedhjes)', 'Accounting software (to be chosen)'), note: T('Artikli (SKU PAK-…), zalihe u pakovanjima, fakture', 'Artikujt (SKU PAK-…), stoku në pako, faturat', 'Items (SKU PAK-…), stock in packs, invoices') },
      { id: 'csv', name: 'Excel / CSV', note: T('Izvoz za postojeći sistem', 'Eksport për sistemin ekzistues', 'Export for the existing system') },
      { id: 'api', name: 'REST API', note: T('Za sopstveno rješenje', 'Për zgjidhje të veten', 'For a custom solution') },
    ],
    scopes: [
      { id: 'products:read', label: T('Artikli i zalihe', 'Artikuj dhe stok', 'Items and stock'), required: true },
      { id: 'orders:write', label: T('Slanje narudžbi', 'Dërgo porositë', 'Send orders'), required: true },
      { id: 'invoices:read', label: T('Računi', 'Faturat', 'Invoices') },
    ],
  },
};

/** Localised versions of the seeded notes (the stored note is Albanian — `sq` must match the seed text). */
export const SEEDED_NOTES: Record<string, L10n> = {
  'int-payment': T('Test način — kartice se ne terete. Produkcijski ključevi nakon ugovora o e-commerce-u sa bankom.', 'Modaliteti test — kartelat nuk ngarkohen. Çelësat e prodhimit pas marrëveshjes për e-commerce me bankën.', 'Test mode — cards are not charged. Live keys after the e-commerce agreement with the bank.'),
  'int-courier': T('Za sada dostava našim vozilima; API kurira po izboru partnera.', 'Tani për tani dërgesat bëhen me automjetet tona; API e korrierit sipas partnerit të zgjedhur.', 'Delivery with our own vehicles for now; the courier API depends on the chosen partner.'),
  'int-email': T('Potvrde narudžbi, upita i sastanaka šalju se sa info@paketoje.com.', 'Konfirmimet e porosive, kërkesave dhe takimeve dërgohen nga info@paketoje.com.', 'Order, request and meeting confirmations are sent from info@paketoje.com.'),
  'int-fiscal': T('Povezivanje sa sistemom fiskalizacije Poreske administracije Kosova (ATK) — planirano za fazu 2.', 'Lidhja me sistemin e fiskalizimit të Administratës Tatimore të Kosovës (ATK) — planifikuar për fazën 2.', 'Connection to the fiscalisation system of the Tax Administration of Kosovo (ATK) — planned for phase 2.'),
  'int-analytics': T('Praćenje posjeta, korpi i narudžbi u test property-ju; Pixel se uključuje nakon pristanka na kolačiće.', 'Matja e vizitave, shportave dhe porosive në property test; Pixel-i aktivizohet pas pëlqimit për cookies.', 'Visits, carts and orders tracked in a test property; the Pixel fires only after cookie consent.'),
};

/** True when the stored note is still the seeded text (in any language) — then it is shown translated. */
export const isSeededNote = (id: string, note: string) => !!SEEDED_NOTES[id] && Object.values(SEEDED_NOTES[id]).includes(note);

export const DEFAULT_PROVIDER: Partial<Record<IntegrationKind, string>> = { payment: 'bank', email: 'smtp', analytics: 'ga4' };

/** Every kind has a card: kinds missing from settings show as "not connected". */
export function integrationList(stored: Integration[]): IntegrationX[] {
  return KINDS.map((kind) => {
    const found = stored.find((i) => i.kind === kind) as IntegrationX | undefined;
    const base: IntegrationX = found ?? { id: `int-${kind}`, kind, name: KIND_META[kind].title.me, status: 'disconnected', note: '' };
    return {
      ...base,
      provider: base.provider ?? (base.status !== 'disconnected' ? DEFAULT_PROVIDER[kind] : undefined),
      scopes: base.scopes ?? (base.status !== 'disconnected' ? KIND_META[kind].scopes.map((s) => s.id) : []),
      env: base.env ?? (base.status === 'connected' ? 'live' : base.status === 'test' ? 'test' : undefined),
    };
  });
}

export const maskEmail = (e: string) => {
  const [u, d] = e.split('@');
  return d ? `${u.slice(0, 1)}•••@${d}` : e;
};

/** Demo activity log, derived from real store data so it changes with the demo. */
export function demoLog(x: IntegrationX, orders: Order[], now: Date): { at: string; level: 'ok' | 'warn' | 'error'; text: L10n }[] {
  const out = [...(x.log ?? [])];
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const min = (n: number) => new Date(now.getTime() - n * 60000).toISOString();
  if (x.kind === 'payment' && x.status !== 'disconnected') {
    for (const o of recent.filter((o) => o.payment.method === 'card').slice(0, 4))
      out.push({ at: o.createdAt, level: 'ok', text: T(`payment.succeeded — ${o.number} · webhook potpis provjeren`, `payment.succeeded — ${o.number} · nënshkrimi i webhook-ut u verifikua`, `payment.succeeded — ${o.number} · webhook signature verified`) });
    out.push({ at: min(60 * 26), level: 'warn', text: T('Test način: kartice se ne terete', 'Mjedis prove: kartelat nuk ngarkohen', 'Test mode: cards are not charged') });
  }
  if (x.kind === 'email' && x.status !== 'disconnected') {
    for (const o of recent.slice(0, 5))
      out.push({ at: o.createdAt, level: 'ok', text: T(`Poslato „Primili smo vašu narudžbu ${o.number}“ → ${maskEmail(o.customer.email)}`, `U dërgua „E morëm porosinë tuaj ${o.number}“ → ${maskEmail(o.customer.email)}`, `Sent “We received your order ${o.number}” → ${maskEmail(o.customer.email)}`) });
    out.push({ at: min(60 * 30), level: 'warn', text: T('1 poruka vraćena (bounce) — ponovni pokušaj zakazan', '1 mesazh u kthye (bounce) — riprovimi u planifikua', '1 message bounced — retry scheduled') });
  }
  if (x.kind === 'analytics' && x.status !== 'disconnected') {
    out.push({ at: min(9), level: 'ok', text: T('Poslato 312 događaja (page_view, add_to_cart, purchase) u test property', 'U dërguan 312 ngjarje (page_view, add_to_cart, purchase) në property prove', '312 events sent (page_view, add_to_cart, purchase) to the test property') });
    out.push({ at: min(60 * 5), level: 'warn', text: T('18 % posjetilaca odbilo je analitičke kolačiće — ne mjere se', '18 % e vizitorëve refuzuan cookies analitike — nuk maten', '18% of visitors declined analytics cookies — not measured') });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
