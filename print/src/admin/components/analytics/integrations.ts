// Integrations catalogue (PDF p.06 "Integrime: pagesa, korrier, email, ERP, analitikë", p.40 "Integrime dhe webhook
// endpoints me scopes, status, histori dhe rotacion secrets", p.51 "Pagesa, korrieri, fiskalizimi/kontabiliteti").
// Everything here is a DEMO description: nothing connects to a real service.
import type { ComponentType } from 'react';
import { ChartColumn, CreditCard, Database, Mail, Receipt, Truck } from 'lucide-react';
import type { Integration, IntegrationKind, L10n, Order } from '@/lib/types';

const T = (sq: string, en: string): L10n => ({ sq, en });

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
  providers: { id: string; name: string; note: L10n }[];
  scopes: { id: string; label: L10n; required?: boolean }[];
}

export const KIND_META: Record<IntegrationKind, KindMeta> = {
  payment: {
    icon: CreditCard,
    label: T('Pagesa', 'Payments'),
    title: T('Pagesa me kartelë', 'Card payments'),
    desc: T('Pagesë online me kartelë, autorizim, capture dhe rimbursim. CMS ruan vetëm referenca transaksioni, jo numra kartash.', 'Online card payments, authorisation, capture and refunds. The CMS stores transaction references only, never card numbers.'),
    providers: [
      { id: 'bank', name: 'POS virtual i bankës', note: T('Kontratë me një bankë në Kosovë', 'Contract with a bank in Kosovo') },
      { id: 'gateway', name: 'Payment gateway ndërkombëtar', note: T('Për klientë jashtë Kosovës (BE)', 'For customers outside Kosovo (EU)') },
    ],
    scopes: [
      { id: 'payments:write', label: T('Krijo dhe kap pagesa', 'Create and capture payments'), required: true },
      { id: 'refunds:write', label: T('Rimburso', 'Refunds') },
      { id: 'webhooks:read', label: T('Njoftime webhook (të nënshkruara)', 'Webhook notifications (signed)'), required: true },
    ],
  },
  courier: {
    icon: Truck,
    label: T('Korrier', 'Courier'),
    title: T('Shërbimi i korrierit', 'Courier service'),
    desc: T('Krijim dërgesash dhe etiketash, numri i gjurmimit në porosi dhe njoftim për klientin.', 'Shipments and labels, tracking number on the order and a customer notification.'),
    providers: [
      { id: 'own', name: 'Automjetet e PrintWorks', note: T('Dorëzim me paleta në Kosovë — pa API', 'Pallet delivery in Kosovo — no API') },
      { id: 'local', name: 'Korrier lokal (API)', note: T('Kosovë, Shqipëri dhe Maqedoni e Veriut', 'Kosovo, Albania and North Macedonia') },
      { id: 'dhl', name: 'DHL Express', note: T('Eksport në BE', 'EU export') },
    ],
    scopes: [
      { id: 'shipments:write', label: T('Dërgesa dhe etiketa', 'Shipments and labels'), required: true },
      { id: 'tracking:read', label: T('Gjurmimi i dërgesës', 'Shipment tracking'), required: true },
      { id: 'pickups:write', label: T('Porosit marrje', 'Schedule pickups') },
    ],
  },
  email: {
    icon: Mail,
    label: T('E-mail', 'E-mail'),
    title: T('E-mail transaksionalë', 'Transactional e-mail'),
    desc: T('Konfirmime porosie, prove digjitale, pagese, dërgese, kërkese për ofertë dhe takimi — me log dërgimi dhe riprovim.', 'Order, digital proof, payment, shipping, quote request and meeting confirmations — with a send log and retries.'),
    providers: [
      { id: 'smtp', name: 'SMTP (hello@printwor-ks.com)', note: T('Serveri ekzistues i postës', 'Existing mail server') },
      { id: 'postmark', name: 'Postmark', note: T('Shërbim për e-mail transaksionalë', 'Transactional e-mail service') },
      { id: 'ses', name: 'Amazon SES', note: T('Vëllim i madh dërgimi', 'High sending volume') },
    ],
    scopes: [
      { id: 'messages:send', label: T('Dërgo mesazhe', 'Send messages'), required: true },
      { id: 'templates:read', label: T('Shabllonet', 'Templates') },
      { id: 'bounces:read', label: T('Mesazhet e kthyera (bounce)', 'Bounces') },
    ],
  },
  fiscal: {
    icon: Receipt,
    label: T('Fiskalizimi', 'Fiscalisation'),
    title: T('Fiskalizimi (ATK)', 'Fiscalisation (ATK)'),
    desc: T('Regjistrimi i shitjeve në sistemin e fiskalizimit të Administratës Tatimore të Kosovës (ATK) dhe numri fiskal në faturë. CMS nuk zëvendëson pajisjen fiskale.', 'Registers sales with the fiscal system of the Kosovo Tax Administration (ATK) and prints the fiscal number on the invoice. The CMS does not replace the fiscal device.'),
    providers: [
      { id: 'atk', name: 'Sistemi fiskal i ATK-së', note: T('Drejtpërdrejt, me certifikatën e biznesit', 'Direct, with the business certificate') },
      { id: 'accounting', name: 'Softueri i kontabilitetit', note: T('Fiskalizon kontabiliteti', 'Fiscalised by the accounting software') },
    ],
    scopes: [
      { id: 'invoices:fiscalize', label: T('Fiskalizo faturat (numri fiskal)', 'Fiscalise invoices (fiscal number)'), required: true },
      { id: 'invoices:read', label: T('Statusi i faturave', 'Invoice status'), required: true },
      { id: 'cash:write', label: T('Depozita e arkës', 'Cash deposit') },
    ],
  },
  analytics: {
    icon: ChartColumn,
    label: T('Analitikë', 'Analytics'),
    title: T('Matja e vizitave dhe konvertimeve', 'Visit and conversion tracking'),
    desc: T('Ngjarje të strukturuara: vizitë, shportë, checkout, blerje, UTM dhe klikime ofertash — duke respektuar pëlqimin për cookies.', 'Structured events: visit, cart, checkout, purchase, UTM and offer clicks — respecting cookie consent.'),
    providers: [
      { id: 'ga4', name: 'Google Analytics 4', note: T('Falas, standard', 'Free, standard') },
      { id: 'plausible', name: 'Plausible', note: T('Pa cookies', 'Cookie-less') },
      { id: 'meta', name: 'Meta Pixel', note: T('Fushata në rrjete', 'Social campaigns') },
    ],
    scopes: [
      { id: 'events:write', label: T('Dërgo ngjarje', 'Send events'), required: true },
      { id: 'consent:read', label: T('Pëlqimi për cookies', 'Cookie consent'), required: true },
      { id: 'reports:read', label: T('Lexo raportet në CMS', 'Read reports in the CMS') },
    ],
  },
  erp: {
    icon: Database,
    label: T('Prepress & ERP', 'Prepress & ERP'),
    title: T('Prepress, MIS dhe ERP', 'Prepress, MIS and ERP'),
    desc: T('Skedarët e printimit kalojnë në preflight automatik (PDF, CMYK, bleed), porositë hapin punë në planifikimin e prodhimit (MIS) dhe faturat sinkronizohen me kontabilitetin. Faza 2 — me specifikim dhe prova.', 'Print files go through automatic preflight (PDF, CMYK, bleed), orders open jobs in production planning (MIS) and invoices sync with accounting. Phase 2 — with a specification and tests.'),
    providers: [
      { id: 'esko', name: 'Esko Automation Engine', note: T('Prepress: preflight dhe prova digjitale', 'Prepress: preflight and digital proofs') },
      { id: 'mis', name: 'MIS i shtypshkronjës', note: T('Punët, makinat, kosto dhe afatet', 'Jobs, presses, costing and lead times') },
      { id: 'csv', name: 'Eksport CSV / API', note: T('Për kontabilitetin ekzistues', 'For the existing accounting') },
    ],
    scopes: [
      { id: 'artwork:read', label: T('Skedarët e printimit dhe provat', 'Print files and proofs'), required: true },
      { id: 'orders:write', label: T('Hap punë në prodhim', 'Open production jobs'), required: true },
      { id: 'invoices:read', label: T('Faturat', 'Invoices') },
    ],
  },
};

/** Localised versions of the seeded notes (the stored note is Albanian only). */
export const SEEDED_NOTES: Record<string, L10n> = {
  'int-payment': T('Modalitet testimi — kartelat nuk ngarkohen. Çelësat e prodhimit pas marrëveshjes me bankën.', 'Test mode — cards are not charged. Live keys after the agreement with the bank.'),
  'int-courier': T('Aktualisht dërgesa me automjetet tona; API e kurierit sipas partnerit të zgjedhur.', 'Currently delivered with our own vans; the courier API depends on the chosen partner.'),
  'int-email': T('Konfirmimet e porosive, provave dhe takimeve dërgohen nga hello@printwor-ks.com.', 'Order, proof and meeting confirmations are sent from hello@printwor-ks.com.'),
  'int-fiscal': T('Lidhja me sistemin e fiskalizimit të ATK-së — e planifikuar për fazën 2.', 'Connection to the ATK fiscalisation system — planned for phase 2.'),
  'int-analytics': T('Matja e vizitave dhe konvertimeve në një property testimi.', 'Visit and conversion tracking in a test property.'),
  'int-erp': T('Preflight automatik i skedarëve dhe hapja e punëve në prodhim — faza 2.', 'Automatic file preflight and production job creation — phase 2.'),
};

export const DEFAULT_PROVIDER: Partial<Record<IntegrationKind, string>> = { payment: 'bank', courier: 'own', email: 'smtp', fiscal: 'atk', analytics: 'ga4', erp: 'esko' };

/** Every kind has a card: kinds missing from settings show as "not connected". */
export function integrationList(stored: Integration[]): IntegrationX[] {
  return KINDS.map((kind) => {
    const found = stored.find((i) => i.kind === kind) as IntegrationX | undefined;
    const base: IntegrationX = found ?? { id: `int-${kind}`, kind, name: KIND_META[kind].title.sq, status: 'disconnected', note: SEEDED_NOTES[`int-${kind}`]?.sq ?? '' };
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
      out.push({ at: o.createdAt, level: 'ok', text: T(`payment.succeeded — ${o.number} · nënshkrimi i webhook-ut u verifikua`, `payment.succeeded — ${o.number} · webhook signature verified`) });
    out.push({ at: min(60 * 26), level: 'warn', text: T('Mjedis prove: kartelat nuk ngarkohen', 'Test mode: cards are not charged') });
  }
  if (x.kind === 'email' && x.status !== 'disconnected') {
    for (const o of recent.slice(0, 5))
      out.push({ at: o.createdAt, level: 'ok', text: T(`U dërgua „E morëm porosinë tuaj ${o.number}“ → ${maskEmail(o.customer.email)}`, `Sent “We received your order ${o.number}” → ${maskEmail(o.customer.email)}`) });
    for (const o of recent.filter((o) => o.proof && (o.proof.status === 'sent' || o.proof.status === 'approved')).slice(0, 3))
      out.push({ at: o.proof?.sentAt ?? o.createdAt, level: 'ok', text: T(`U dërgua „Prova v${o.proof?.version ?? 1} për porosinë ${o.number}“ → ${maskEmail(o.customer.email)}`, `Sent “Proof v${o.proof?.version ?? 1} for order ${o.number}” → ${maskEmail(o.customer.email)}`) });
    out.push({ at: min(60 * 30), level: 'warn', text: T('1 mesazh u kthye (bounce) — riprovimi u planifikua', '1 message bounced — retry scheduled') });
  }
  if (x.kind === 'analytics' && x.status !== 'disconnected') {
    out.push({ at: min(9), level: 'ok', text: T('U dërguan 312 ngjarje (page_view, add_to_cart, purchase) në property prove', '312 events sent (page_view, add_to_cart, purchase) to the test property') });
    out.push({ at: min(60 * 5), level: 'warn', text: T('18 % e vizitorëve refuzuan cookies analitike — nuk maten', '18% of visitors declined analytics cookies — not measured') });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
