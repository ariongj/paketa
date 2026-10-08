import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, FileX2, Printer } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button, ButtonLink } from '@/components/ui/Button';
import { installationAmount, localizeLine } from '@/admin/components/orders/helpers';
import { isPack, piecePriceText, piecesOf, unitWord } from '@/admin/components/products/units';
import { LANGS, defineDict, interpolate, useDict } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { brandVars } from '@/lib/color';
import { date, money, num } from '@/lib/format';
import { cn, round2 } from '@/lib/utils';
import type { Lang, Order } from '@/lib/types';

/**
 * Kosovo-style invoice / proforma (Faturë / Parafaturë) for an order — printed from /admin/faktura/:id.
 * The document speaks the ORDER's language (SQ / EN / SR) by default; the toolbar can switch it for printing.
 */
const T = defineDict({
  me: {
    proforma: 'Predračun',
    invoice: 'Račun',
    docNo: 'br. {n}',
    back: 'Nazad na narudžbu',
    print: 'Štampaj / PDF',
    preview: 'Pregled za štampu',
    docLang: 'Jezik dokumenta',
    seller: 'Prodavac',
    buyer: 'Kupac',
    contact: 'Kontakt osoba',
    delivery: 'Isporuka i plaćanje',
    issued: 'Datum izdavanja',
    orderDate: 'Datum narudžbe',
    place: 'Mjesto izdavanja',
    due: 'Rok plaćanja',
    currency: 'Valuta',
    nui: 'NUI',
    vatNo: 'PDV br.',
    iban: 'IBAN',
    tel: 'Tel.',
    country: 'Kosovo',
    col_no: 'R.br.',
    col_desc: 'Opis',
    col_qty: 'Količina',
    col_pcs: 'Komada',
    col_price: 'Cijena sa PDV',
    col_amount: 'Iznos',
    sku: 'Šifra',
    perPack: '{n} kom/pak.',
    tier: 'količinska cijena −{pct}%',
    printFor: 'Štampa logotipa — {name}',
    shippingLine: 'Dostava — {city}',
    discountLine: 'Popust — {name}',
    unit_service: 'usl.',
    vatSummary: 'Rekapitulacija PDV-a',
    rate: 'Stopa',
    base: 'Osnovica',
    vat: 'PDV',
    gross: 'Ukupno',
    exclVat: 'Iznos bez PDV-a',
    vatRow: 'PDV {rate}%',
    toPay: 'Ukupno za uplatu',
    paidStamp: 'Plaćeno',
    payTitle: 'Instrukcije za plaćanje',
    payMethod: 'Način plaćanja',
    recipient: 'Primalac',
    bank: 'Banka',
    reference: 'Poziv na broj',
    amount: 'Iznos',
    purpose: 'Svrha uplate',
    purposeText: 'Plaćanje po dokumentu {n}',
    note_cod: 'Iznos se plaća prilikom isporuke ili preuzimanja robe u magacinu.',
    note_card: 'Narudžba je plaćena platnom karticom putem web prodavnice.',
    note_bank: 'Molimo izvršite uplatu u roku od 8 dana na IBAN iznad, uz broj narudžbe kao poziv na broj.',
    issuedBy: 'Izdao',
    receivedBy: 'Primio',
    thanks: 'Hvala vam na povjerenju!',
    thanksText: 'Za pitanja o narudžbi, isporuci ili štampi logotipa: {phone} · {email}',
    returns: 'Povrat: u roku od 5 dana od prijema, nekorišćena roba u originalnom pakovanju — refund@paketoje.com.',
    legal: 'Dokument je izdat elektronski i punovažan je bez pečata i potpisa. Cijene su u eurima i uključuju PDV {rate}%.',
    notFound: 'Narudžba nije pronađena',
    notFoundText: 'Račun ne može biti prikazan jer narudžba ne postoji.',
    toOrders: 'Sve narudžbe',
  },
  sq: {
    proforma: 'Parafaturë',
    invoice: 'Faturë',
    docNo: 'nr. {n}',
    back: 'Kthehu te porosia',
    print: 'Printo / PDF',
    preview: 'Parapamje për printim',
    docLang: 'Gjuha e dokumentit',
    seller: 'Shitësi',
    buyer: 'Blerësi',
    contact: 'Personi kontaktues',
    delivery: 'Dorëzimi dhe pagesa',
    issued: 'Data e lëshimit',
    orderDate: 'Data e porosisë',
    place: 'Vendi i lëshimit',
    due: 'Afati i pagesës',
    currency: 'Monedha',
    nui: 'NUI',
    vatNo: 'Nr. TVSH',
    iban: 'IBAN',
    tel: 'Tel.',
    country: 'Kosovë',
    col_no: 'Nr.',
    col_desc: 'Përshkrimi',
    col_qty: 'Sasia',
    col_pcs: 'Copë',
    col_price: 'Çmimi me TVSH',
    col_amount: 'Vlera',
    sku: 'Kodi',
    perPack: '{n} copë/pako',
    tier: 'çmim shumice −{pct}%',
    printFor: 'Printim me logo — {name}',
    shippingLine: 'Transporti — {city}',
    discountLine: 'Zbritje — {name}',
    unit_service: 'shërb.',
    vatSummary: 'Përmbledhja e TVSH-së',
    rate: 'Norma',
    base: 'Baza',
    vat: 'TVSH',
    gross: 'Gjithsej',
    exclVat: 'Vlera pa TVSH',
    vatRow: 'TVSH {rate}%',
    toPay: 'Totali për pagesë',
    paidStamp: 'E paguar',
    payTitle: 'Udhëzime për pagesë',
    payMethod: 'Mënyra e pagesës',
    recipient: 'Përfituesi',
    bank: 'Banka',
    reference: 'Referenca',
    amount: 'Shuma',
    purpose: 'Qëllimi i pagesës',
    purposeText: 'Pagesë sipas dokumentit {n}',
    note_cod: 'Shuma paguhet në dorëzim ose kur merrni mallin në depo.',
    note_card: 'Porosia është paguar me kartelë përmes dyqanit online.',
    note_bank: 'Ju lutemi paguani brenda 8 ditëve në IBAN-in më sipër, me numrin e porosisë si referencë.',
    issuedBy: 'Lëshoi',
    receivedBy: 'Pranoi',
    thanks: 'Faleminderit për besimin!',
    thanksText: 'Për pyetje rreth porosisë, dërgesës ose printimit me logo: {phone} · {email}',
    returns: 'Kthimet: brenda 5 ditëve nga pranimi, mallra të papërdorura në paketimin origjinal — refund@paketoje.com.',
    legal: 'Dokumenti është lëshuar elektronikisht dhe është i vlefshëm pa vulë dhe nënshkrim. Çmimet janë në euro me TVSH {rate}% të përfshirë.',
    notFound: 'Porosia nuk u gjet',
    notFoundText: 'Fatura nuk mund të shfaqet sepse porosia nuk ekziston.',
    toOrders: 'Të gjitha porositë',
  },
  en: {
    proforma: 'Proforma invoice',
    invoice: 'Invoice',
    docNo: 'no. {n}',
    back: 'Back to order',
    print: 'Print / PDF',
    preview: 'Print preview',
    docLang: 'Document language',
    seller: 'Seller',
    buyer: 'Bill to',
    contact: 'Contact person',
    delivery: 'Delivery & payment',
    issued: 'Issue date',
    orderDate: 'Order date',
    place: 'Place of issue',
    due: 'Payment due',
    currency: 'Currency',
    nui: 'Business no. (NUI)',
    vatNo: 'VAT no.',
    iban: 'IBAN',
    tel: 'Tel.',
    country: 'Kosovo',
    col_no: 'No.',
    col_desc: 'Description',
    col_qty: 'Qty',
    col_pcs: 'Pieces',
    col_price: 'Price incl. VAT',
    col_amount: 'Amount',
    sku: 'SKU',
    perPack: '{n} pcs/pack',
    tier: 'volume price −{pct}%',
    printFor: 'Logo print — {name}',
    shippingLine: 'Delivery — {city}',
    discountLine: 'Discount — {name}',
    unit_service: 'svc.',
    vatSummary: 'VAT summary',
    rate: 'Rate',
    base: 'Taxable base',
    vat: 'VAT',
    gross: 'Total',
    exclVat: 'Amount excl. VAT',
    vatRow: 'VAT {rate}%',
    toPay: 'Total to pay',
    paidStamp: 'Paid',
    payTitle: 'Payment instructions',
    payMethod: 'Payment method',
    recipient: 'Beneficiary',
    bank: 'Bank',
    reference: 'Reference',
    amount: 'Amount',
    purpose: 'Payment purpose',
    purposeText: 'Payment for document {n}',
    note_cod: 'The amount is paid on delivery or when collecting the goods at the warehouse.',
    note_card: 'This order was paid by card through the online shop.',
    note_bank: 'Please pay within 8 days to the IBAN above, quoting the order number as the reference.',
    issuedBy: 'Issued by',
    receivedBy: 'Received by',
    thanks: 'Thank you for your trust!',
    thanksText: 'Questions about your order, delivery or logo print: {phone} · {email}',
    returns: 'Returns: within 5 days of receipt, unused goods in their original packaging — refund@paketoje.com.',
    legal: 'This document was issued electronically and is valid without stamp or signature. Prices are in euros and include {rate}% VAT.',
    notFound: 'Order not found',
    notFoundText: 'The invoice cannot be shown because the order does not exist.',
    toOrders: 'All orders',
  },
});

type Key = keyof typeof T.me;
type Vars = Record<string, string | number>;

/** Page-level print rules: A4, no browser margins (the sheet carries its own), keep colours. */
const PRINT_CSS = `
@page { size: A4; margin: 0; }
@media print {
  html, body { background: #fff !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

export default function Invoice() {
  const { id } = useParams();
  const order = useDb((s) => s.orders.find((o) => o.id === id || o.number === id));
  return order ? <InvoiceView key={order.id} order={order} /> : <Missing />;
}

function Missing() {
  const t = useDict(T, 'admin');
  return (
    <div className="min-h-screen bg-canvas px-4 pt-24 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sand text-ink-soft">
          <FileX2 className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-ink">{t('notFound')}</h1>
        <p className="mt-1.5 text-sm text-muted">{t('notFoundText')}</p>
        <ButtonLink to="/admin/narudzbe" variant="dark" size="sm" shape="rounded" className="mt-6">
          {t('toOrders')}
        </ButtonLink>
      </div>
    </div>
  );
}

function InvoiceView({ order }: { order: Order }) {
  const ta = useDict(T, 'admin');
  const companyName = useDb((s) => s.settings.companyName);
  // The document follows the customer's language; staff can switch it before printing.
  const [lang, setLang] = useState<Lang>(order.lang ?? 'sq');

  useEffect(() => {
    const prev = document.title;
    document.title = `${order.number} — ${companyName}`;
    return () => {
      document.title = prev;
    };
  }, [order.number, companyName]);

  return (
    <div className="min-h-screen bg-canvas pb-16 print:min-h-0! print:bg-white print:p-0!">
      <style>{PRINT_CSS}</style>
      <div className="no-print sticky top-0 z-20 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[calc(210mm+2rem)] items-center gap-2 px-4">
          <Link to={`/admin/narudzbe/${order.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-ink-soft hover:bg-ink/[0.05] hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{ta('back')}</span>
          </Link>
          <span className="ml-1 hidden truncate text-[13px] text-muted md:inline">
            {ta('preview')} · <span className="font-semibold text-ink">{order.number}</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div role="radiogroup" aria-label={ta('docLang')} title={ta('docLang')} className="flex rounded-lg bg-white p-0.5 ring-1 ring-inset ring-line">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  role="radio"
                  aria-checked={lang === l.code}
                  onClick={() => setLang(l.code)}
                  className={cn('h-8 rounded-md px-2.5 text-[12px] font-bold tracking-wide transition-colors', lang === l.code ? 'bg-ink text-white' : 'text-muted hover:text-ink')}
                >
                  {l.short}
                </button>
              ))}
            </div>
            <Button size="sm" shape="rounded" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
              <span className="max-sm:sr-only">{ta('print')}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-3 pt-6 sm:px-4 sm:pt-10 print:p-0!">
        <Sheet order={order} lang={lang} />
      </div>
    </div>
  );
}

type InvoiceRow = { key: string; desc: ReactNode; sub?: ReactNode; qty: string; pcs: string; price: number | null; amount: number; muted?: boolean };

function Sheet({ order, lang }: { order: Order; lang: Lang }) {
  const t = (k: Key, vars?: Vars) => interpolate(T[lang][k] ?? T.sq[k], vars);
  const tc = (k: keyof typeof common.me, vars?: Vars) => interpolate(common[lang][k] ?? common.sq[k], vars);
  const s = useSettings();
  const products = useDb((st) => st.products);
  const discounts = useDb((st) => st.discounts);
  const c = order.customer;
  const m = (v: number) => money(v, lang);

  const issued = new Date().toISOString();
  const dueDate = new Date(new Date(order.createdAt).getTime() + 8 * 86400000).toISOString();
  const d = (iso: string) => date(iso, lang, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const paid = order.payment.status === 'paid';

  // Rows: products (packs + pieces), their logo print, delivery, discounts
  const rows: InvoiceRow[] = [];
  order.items.forEach((l, i) => {
    const loc = localizeLine(l, products.find((p) => p.id === l.productId), order.lang, lang);
    const pack = isPack(l);
    const sub = [
      l.custom ? '' : `${t('sku')} ${l.sku}`,
      loc.options,
      pack ? t('perPack', { n: num(l.packSize as number, lang) }) : '',
      pack ? piecePriceText(l, l.unitPrice, lang) : '',
      l.tierPct ? t('tier', { pct: l.tierPct }) : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const qty = `${num(l.qty, lang)} ${unitWord(l.unit, l.qty, lang)}`;
    const pcs = pack ? num(piecesOf(l, l.qty), lang, 0) : '';
    rows.push({ key: `p${i}`, desc: loc.name, sub, qty, pcs, price: l.unitPrice, amount: l.lineTotal });
    const inst = installationAmount(l);
    if (inst > 0) rows.push({ key: `i${i}`, desc: t('printFor', { name: loc.name }), qty, pcs, price: l.installationPrice, amount: inst });
  });
  if (order.shipping > 0) rows.push({ key: 'ship', desc: t('shippingLine', { city: c.city }), sub: tc(`delivery_${order.delivery.method}`), qty: `1 ${t('unit_service')}`, pcs: '', price: order.shipping, amount: order.shipping });
  const lineDiscounts = (order.discounts ?? []).filter((x) => x.kind !== 'shipping' && x.amount > 0);
  if (lineDiscounts.length) {
    for (const x of lineDiscounts) {
      const rule = discounts.find((r) => r.id === x.id);
      const name = (rule && (rule.publicTitle[lang] || rule.publicTitle.sq)) || x.title;
      rows.push({ key: `d-${x.id}`, desc: t('discountLine', { name: x.code ? `${name} (${x.code})` : name }), qty: '', pcs: '', price: null, amount: -x.amount, muted: true });
    }
  } else if (order.discount > 0) {
    rows.push({ key: 'disc', desc: t('discountLine', { name: order.coupon?.code ?? '' }).replace(/ — $/, ''), qty: '', pcs: '', price: null, amount: -order.discount, muted: true });
  }

  const rate = s.vatRate;
  const vat = order.vat || round2(order.total - order.total / (1 + rate / 100));
  const base = round2(order.total - vat);

  return (
    <article
      style={brandVars(s.brandColor)}
      className="print-sheet relative mx-auto w-full max-w-[210mm] bg-white px-5 py-7 text-[12px] leading-normal text-ink shadow-[0_1px_2px_rgb(28_26_23/0.06),0_24px_60px_-28px_rgb(28_26_23/0.35)] ring-1 ring-line/70 sm:min-h-[297mm] sm:px-[14mm] sm:py-[12mm] print:min-h-0! print:ring-0!"
    >
      {/* brand rule */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-brand-600" />

      {/* Header: seller + document meta */}
      <header className="grid gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
        <div>
          <Logo className="h-[46px]" />
          <div className="mt-3 space-y-px text-[11.5px] text-ink-soft">
            <p className="text-[13px] font-extrabold text-ink">{s.legalName}</p>
            <p>
              {s.address}, {s.city}, {t('country')}
            </p>
            <p>
              {t('nui')}: <span className="font-semibold text-ink">{s.pib}</span> · {t('vatNo')}: <span className="font-semibold text-ink">{s.pdv}</span>
            </p>
            <p>
              {t('tel')} {s.phone} · {s.email}
            </p>
          </div>
        </div>
        <div className="sm:text-right">
          <h1 className="display text-[26px] leading-tight text-ink sm:text-[30px]">{paid ? t('invoice') : t('proforma')}</h1>
          <p className="mt-0.5 text-[15px] font-extrabold tracking-wide text-brand-700">{t('docNo', { n: order.number })}</p>
          <dl className="mt-4 grid grid-cols-[auto_auto] justify-start gap-x-4 gap-y-0.5 text-[11.5px] sm:justify-end">
            <Meta label={t('issued')}>{d(issued)}</Meta>
            <Meta label={t('orderDate')}>{d(order.createdAt)}</Meta>
            <Meta label={t('place')}>{s.city}</Meta>
            {order.payment.method === 'bank' && !paid && <Meta label={t('due')}>{d(dueDate)}</Meta>}
            <Meta label={t('currency')}>EUR (€)</Meta>
          </dl>
        </div>
      </header>

      {/* Parties */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="rounded-lg bg-canvas/70 px-4 py-3">
          <Label>{t('buyer')}</Label>
          {c.company ? (
            <>
              <p className="mt-1 text-[13.5px] font-bold text-ink">{c.company}</p>
              {c.pib && (
                <p className="text-ink-soft">
                  {t('nui')}: <span className="font-semibold text-ink">{c.pib}</span>
                </p>
              )}
              <p className="text-ink-soft">
                {t('contact')}: {c.firstName} {c.lastName}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[13.5px] font-bold text-ink">
              {c.firstName} {c.lastName}
            </p>
          )}
          <p className="text-ink-soft">
            {c.address}, {c.city}, {t('country')}
          </p>
          <p className="text-ink-soft">{[c.phone, c.email].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="rounded-lg border border-line px-4 py-3">
          <Label>{t('delivery')}</Label>
          <p className="mt-1 font-semibold text-ink">{tc(`delivery_${order.delivery.method}`)}</p>
          <p className="text-ink-soft">{order.delivery.method === 'pickup' ? s.pickupAddress : `${c.address}, ${c.city}`}</p>
          <p className="mt-1.5 font-semibold text-ink">{tc(`pay_${order.payment.method}`)}</p>
          <p className="text-ink-soft">{tc(`paystatus_${order.payment.status}`)}</p>
        </div>
      </section>

      {/* Items */}
      <table className="mt-6 w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-ink text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
            <th className="hidden w-8 py-2 pr-2 font-bold sm:table-cell">{t('col_no')}</th>
            <th className="py-2 pr-3 font-bold">{t('col_desc')}</th>
            <th className="py-2 pr-2 text-right font-bold">{t('col_qty')}</th>
            <th className="hidden py-2 pr-3 text-right font-bold sm:table-cell">{t('col_pcs')}</th>
            <th className="hidden py-2 pr-3 text-right font-bold sm:table-cell">{t('col_price')}</th>
            <th className="py-2 text-right font-bold">{t('col_amount')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} className="border-b border-line/80 align-top">
              <td className="hidden py-2 pr-2 tabular-nums text-muted sm:table-cell">{i + 1}.</td>
              <td className="py-2 pr-3">
                <span className={cn('block font-semibold leading-snug', r.muted ? 'text-ink-soft' : 'text-ink')}>{r.desc}</span>
                {r.sub && <span className="block text-[10.5px] leading-snug text-muted">{r.sub}</span>}
                {r.price !== null && <span className="block text-[10.5px] text-muted sm:hidden">{m(r.price)}</span>}
              </td>
              <td className="whitespace-nowrap py-2 pr-2 text-right tabular-nums">
                {r.qty}
                {r.pcs && <span className="block text-[10.5px] text-muted sm:hidden">{r.pcs} {t('col_pcs').toLowerCase()}</span>}
              </td>
              <td className="hidden whitespace-nowrap py-2 pr-3 text-right tabular-nums text-ink-soft sm:table-cell">{r.pcs}</td>
              <td className="hidden whitespace-nowrap py-2 pr-3 text-right tabular-nums sm:table-cell">{r.price !== null ? m(r.price) : ''}</td>
              <td className={cn('whitespace-nowrap py-2 text-right font-semibold tabular-nums', r.amount < 0 && 'text-ink-soft')}>{r.amount < 0 ? `− ${m(-r.amount)}` : m(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* VAT summary + totals */}
      <section className="mt-5 grid gap-6 sm:grid-cols-[1fr_272px] sm:gap-8">
        <div>
          <Label>{t('vatSummary')}</Label>
          <table className="mt-1.5 w-full border-collapse text-[11.5px] tabular-nums">
            <thead>
              <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.08em] text-muted">
                <th className="py-1 pr-3 font-semibold">{t('rate')}</th>
                <th className="py-1 pr-3 text-right font-semibold">{t('base')}</th>
                <th className="py-1 pr-3 text-right font-semibold">{t('vat')}</th>
                <th className="py-1 text-right font-semibold">{t('gross')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line/70">
                <td className="py-1.5 pr-3 font-semibold text-ink">{num(rate, lang)}%</td>
                <td className="py-1.5 pr-3 text-right">{m(base)}</td>
                <td className="py-1.5 pr-3 text-right">{m(vat)}</td>
                <td className="py-1.5 text-right font-semibold text-ink">{m(order.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <dl className="space-y-1 text-[12px]">
            <TotalRow label={t('exclVat')} value={m(base)} />
            <TotalRow label={t('vatRow', { rate })} value={m(vat)} />
          </dl>
          <div className="mt-2 flex items-baseline justify-between gap-3 rounded-lg bg-ink px-3.5 py-2 text-paper">
            <span className="whitespace-nowrap text-[10.5px] font-bold uppercase tracking-[0.08em] text-paper/75">{t('toPay')}</span>
            <span className="text-[17px] font-extrabold tabular-nums">{m(order.total)}</span>
          </div>
          {paid && (
            <div className="mt-4 flex justify-end">
              <span className="-rotate-6 rounded-md border-2 border-brand-600 px-3 py-1 text-[13px] font-extrabold uppercase tracking-[0.25em] text-brand-700">{t('paidStamp')}</span>
            </div>
          )}
        </div>
      </section>

      {/* Payment instructions */}
      <section className="mt-5 rounded-lg border border-dashed border-ink/20 px-4 py-3">
        <Label>{t('payTitle')}</Label>
        <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[11.5px] sm:grid-cols-[auto_1fr_auto_1fr]">
          {(
            [
              [t('recipient'), s.legalName],
              [t('bank'), s.bankName],
              [t('iban'), <span className="font-semibold tracking-wide tabular-nums">{s.bankAccount}</span>],
              [t('reference'), <span className="font-bold tracking-wide text-brand-700">{order.number}</span>],
              [t('amount'), <span className="font-semibold">{m(order.total)}</span>],
              [t('purpose'), t('purposeText', { n: order.number })],
            ] as [string, ReactNode][]
          ).map(([k, v]) => (
            <Fragment key={k}>
              <dt className="text-muted">{k}</dt>
              <dd className="text-ink">{v}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="mt-2.5 border-t border-line/80 pt-2 text-[11px] text-ink-soft">
          <span className="font-semibold text-ink">{t('payMethod')}:</span> {tc(`pay_${order.payment.method}`)}. {t(`note_${order.payment.method}`)}
        </p>
      </section>

      {/* Signatures (Kosovo invoices are signed on handover) */}
      <section className="mt-8 grid grid-cols-2 gap-8 text-[11px] text-muted">
        {[t('issuedBy'), t('receivedBy')].map((x) => (
          <div key={x}>
            <div className="h-10 border-b border-ink/30" />
            <p className="mt-1">{x}</p>
          </div>
        ))}
      </section>

      {/* Thank-you + legal */}
      <footer className="mt-6 border-t border-line pt-4">
        <p className="display text-[18px] text-brand-700">{t('thanks')}</p>
        <p className="mt-1 text-pretty text-[11.5px] text-ink-soft">{t('thanksText', { phone: s.phone, email: s.email })}</p>
        <p className="mt-1 text-pretty text-[11px] text-ink-soft">{t('returns')}</p>
        <p className="mt-3 text-[10px] leading-snug text-muted">{t('legal', { rate })}</p>
      </footer>
    </article>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{children}</p>;
}

function Meta({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-ink">{children}</dd>
    </>
  );
}

function TotalRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
