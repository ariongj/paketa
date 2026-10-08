import { Fragment, useEffect, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, FileX2, Info, Printer } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { LangSwitcher } from '@/components/LangSwitcher';
import { Button, ButtonLink } from '@/components/ui/Button';
import { customerName, discountName, lineUnits, localizeLine } from '@/admin/components/orders/helpers';
import { designAmount, isFlatDesign, orderNet, unitMoney, withLabel } from '@/admin/components/orders/print';
import { defineDict, useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { paymentOf, refundedOf } from '@/lib/orders';
import { brandVars } from '@/lib/color';
import { date, money, num, unitLabel } from '@/lib/format';
import { cn, round2 } from '@/lib/utils';
import type { Order } from '@/lib/types';

/**
 * Default B2B payment terms (days from the issue date). Settings has no field for it yet — when one is added
 * (e.g. `settings.paymentTermsDays`), read it here.
 */
const PAYMENT_TERMS_DAYS = 14;

const T = defineDict({
  sq: {
    invoice: 'Faturë',
    proforma: 'Pro-formë',
    docNo: 'nr. {n}',
    back: 'Kthehu te porosia',
    print: 'Printo / PDF',
    preview: 'Parapamje për printim',
    placeholderHint: 'Adresa, NUI, nr. i TVSH-së dhe IBAN janë vlera shembull — plotësojini te Konfigurimet.',
    placeholderLink: 'Hap Konfigurimet',
    billTo: 'Faturohet për',
    deliveryPayment: 'Dërgesa dhe pagesa',
    issued: 'Data e lëshimit',
    orderDate: 'Data e porosisë',
    orderNo: 'Nr. i porosisë',
    po: 'PO e klientit',
    due: 'Afati i pagesës',
    terms: 'Kushtet',
    termsValue: '{n} ditë neto',
    currency: 'Monedha',
    nui: 'NUI',
    vatNo: 'Nr. TVSH',
    iban: 'IBAN',
    contact: 'Kontakt',
    country: 'Kosovë',
    col_no: 'Nr.',
    col_desc: 'Përshkrimi',
    col_qty: 'Sasia',
    col_unit: 'Njës.',
    col_price: 'Çmimi / njës.',
    col_amount: 'Shuma',
    netNote: 'Të gjitha shumat pa TVSH',
    sku: 'Kodi',
    designFor: 'Dizajn & prepress — {name}',
    designSub: 'Përgatitja e skedarit, kontrolli prepress dhe prova digjitale',
    customSub: 'Artikull sipas marrëveshjes',
    unit_service: 'shërb.',
    subtotal: 'Nëntotali',
    design: 'Dizajn & prepress',
    discount: 'Zbritje',
    discountCode: 'Zbritje ({code})',
    shipping: 'Transporti',
    net: 'Totali pa TVSH',
    vat: 'TVSH {rate}%',
    toPay: 'Totali për pagesë',
    total: 'Totali me TVSH',
    refunded: 'Rimbursuar',
    paidStamp: 'E paguar',
    payTitle: 'Pagesa me transfertë bankare',
    recipient: 'Përfituesi',
    bank: 'Banka',
    reference: 'Referenca',
    amount: 'Shuma',
    purpose: 'Qëllimi',
    purposeText: 'Pagesë për porosinë {n}',
    note_bank: 'Ju lutemi paguani brenda {days} ditëve nga data e lëshimit dhe shënoni referencën {n} në urdhërpagesë.',
    note_cod: 'Shuma paguhet në dorëzim ose kur malli merret në fabrikë.',
    note_card: 'Porosia është paguar me kartelë përmes dyqanit online.',
    note_paid: 'Pagesa është pranuar — faleminderit.',
    termsTitle: 'Kushtet',
    termsText:
      'Pagesa brenda {days} ditëve nga data e lëshimit (kushtet standarde B2B, nëse nuk është rënë dakord ndryshe me shkrim). Prodhimi nis pas aprovimit të provës digjitale; tolerancë sasie ±5% sipas standardeve të industrisë së printimit. Ankesat për cilësinë pranohen brenda 7 ditëve nga dorëzimi.',
    proformaNote: 'Kjo pro-formë nuk është faturë tatimore. Fatura lëshohet pas pranimit të pagesës.',
    thanks: 'Faleminderit që zgjodhët PrintWorks.',
    thanksText: 'Për pyetje rreth porosisë, provës digjitale ose dërgesës jemi në dispozicion në {phone} ose {email}.',
    legal: 'Dokumenti është lëshuar elektronikisht dhe është i vlefshëm pa vulë dhe nënshkrim. Çmimet janë në euro; TVSH {rate}% llogaritet mbi totalin pa TVSH.',
    notFound: 'Porosia nuk u gjet',
    notFoundText: 'Dokumenti nuk mund të shfaqet sepse porosia nuk ekziston.',
    toOrders: 'Të gjitha porositë',
  },
  en: {
    invoice: 'Invoice',
    proforma: 'Pro-forma invoice',
    docNo: 'no. {n}',
    back: 'Back to order',
    print: 'Print / PDF',
    preview: 'Print preview',
    placeholderHint: 'Address, business no., VAT no. and IBAN are sample values — fill them in under Settings.',
    placeholderLink: 'Open Settings',
    billTo: 'Bill to',
    deliveryPayment: 'Delivery & payment',
    issued: 'Issue date',
    orderDate: 'Order date',
    orderNo: 'Order no.',
    po: 'Customer PO',
    due: 'Payment due',
    terms: 'Terms',
    termsValue: 'Net {n} days',
    currency: 'Currency',
    nui: 'NUI',
    vatNo: 'VAT no.',
    iban: 'IBAN',
    contact: 'Contact',
    country: 'Kosovo',
    col_no: 'No.',
    col_desc: 'Description',
    col_qty: 'Qty',
    col_unit: 'Unit',
    col_price: 'Unit price',
    col_amount: 'Amount',
    netNote: 'All amounts excl. VAT',
    sku: 'SKU',
    designFor: 'Design & prepress — {name}',
    designSub: 'Artwork preparation, prepress check and digital proof',
    customSub: 'Item as agreed',
    unit_service: 'svc.',
    subtotal: 'Subtotal',
    design: 'Design & prepress',
    discount: 'Discount',
    discountCode: 'Discount ({code})',
    shipping: 'Delivery',
    net: 'Total excl. VAT',
    vat: 'VAT {rate}%',
    toPay: 'Total due',
    total: 'Total incl. VAT',
    refunded: 'Refunded',
    paidStamp: 'Paid',
    payTitle: 'Payment by bank transfer',
    recipient: 'Beneficiary',
    bank: 'Bank',
    reference: 'Reference',
    amount: 'Amount',
    purpose: 'Purpose',
    purposeText: 'Payment for order {n}',
    note_bank: 'Please pay within {days} days of the issue date and quote the reference {n} on your transfer.',
    note_cod: 'The amount is paid on delivery or when the goods are collected at the factory.',
    note_card: 'This order was paid by card through the online shop.',
    note_paid: 'Payment received — thank you.',
    termsTitle: 'Terms',
    termsText:
      'Payment within {days} days of the issue date (standard B2B terms unless otherwise agreed in writing). Production starts after the digital proof is approved; a quantity tolerance of ±5% applies as is customary in the printing industry. Quality complaints are accepted within 7 days of delivery.',
    proformaNote: 'This pro-forma is not a tax invoice. The invoice is issued once payment is received.',
    thanks: 'Thank you for choosing PrintWorks.',
    thanksText: 'For questions about your order, the digital proof or delivery, reach us at {phone} or {email}.',
    legal: 'This document was issued electronically and is valid without stamp or signature. Prices are in euros; VAT {rate}% is charged on the total excl. VAT.',
    notFound: 'Order not found',
    notFoundText: 'The document cannot be shown because the order does not exist.',
    toOrders: 'All orders',
  },
});

/** Page-level print rules: A4, no browser margins (the sheet carries its own), keep colours. */
const PRINT_CSS = `
@page { size: A4; margin: 0; }
@media print {
  html, body { background: #fff !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-sheet tr, .print-sheet section, .print-sheet footer { break-inside: avoid; }
}`;

export default function Invoice() {
  const { id } = useParams();
  const t = useDict(T, 'admin');
  const order = useDb((s) => s.orders.find((o) => o.id === id || o.number === id));
  const companyName = useDb((s) => s.settings.companyName);

  useEffect(() => {
    const prev = document.title;
    document.title = order ? `${order.number} — ${companyName}` : companyName;
    return () => {
      document.title = prev;
    };
  }, [order, companyName]);

  return (
    <div className="min-h-screen bg-canvas pb-16 print:min-h-0! print:bg-white print:p-0!">
      <style>{PRINT_CSS}</style>
      <div className="no-print sticky top-0 z-20 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[calc(210mm+2rem)] items-center gap-2 px-4">
          {order ? (
            <Link to={`/admin/porosite/${order.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-ink-soft hover:bg-ink/[0.05] hover:text-ink">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('back')}</span>
            </Link>
          ) : (
            <span />
          )}
          {order && (
            <span className="ml-1 hidden truncate text-[13px] text-muted md:inline">
              {t('preview')} · <span className="font-semibold text-ink">{order.number}</span>
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <LangSwitcher scope="admin" compact />
            {order && (
              <Button size="sm" shape="rounded" variant="dark" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                {t('print')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {order ? (
        <div className="px-3 pt-5 sm:px-4 sm:pt-8 print:p-0!">
          <p className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed border-ink/20 bg-white/60 px-3.5 py-2 text-[12.5px] text-ink-soft">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 flex-1">{t('placeholderHint')}</span>
            <Link to="/admin/konfigurimet" className="font-semibold text-ink underline underline-offset-2">
              {t('placeholderLink')}
            </Link>
          </p>
          <Sheet order={order} />
        </div>
      ) : (
        <div className="mx-auto mt-16 max-w-md px-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sand text-ink-soft">
            <FileX2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-ink">{t('notFound')}</h1>
          <p className="mt-1.5 text-sm text-muted">{t('notFoundText')}</p>
          <ButtonLink to="/admin/porosite" variant="dark" size="sm" shape="rounded" className="mt-6">
            {t('toOrders')}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}

type InvoiceRow = { key: string; desc: ReactNode; sub?: ReactNode; qty: string; unit: string; price: string; amount: number };

function Sheet({ order }: { order: Order }) {
  const t = useDict(T, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const s = useSettings();
  const products = useDb((st) => st.products);
  const discounts = useDb((st) => st.discounts);
  const c = order.customer;

  const pay = paymentOf(order);
  const paid = pay === 'paid' || pay === 'partially_refunded' || pay === 'refunded';
  // invoice: dated when the payment was recorded (card orders: at checkout); pro-forma: today
  const issuedAt = paid ? ([...order.timeline].reverse().find((e) => e.status === 'payment')?.at ?? order.createdAt) : new Date().toISOString();
  const dueDate = new Date(new Date(issuedAt).getTime() + PAYMENT_TERMS_DAYS * 86400000).toISOString();
  const d = (iso: string) => date(iso, lang, { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Rows: products (net), then their design & prepress service
  const rows: InvoiceRow[] = [];
  order.items.forEach((l, i) => {
    const product = products.find((p) => p.id === l.productId);
    const loc = localizeLine(l, product, order.lang, lang);
    const units = lineUnits(l);
    const sub = l.custom ? t('customSub') : [`${t('sku')} ${l.sku}`, loc.options].filter(Boolean).join(' · ');
    rows.push({ key: `p${i}`, desc: loc.name, sub, qty: num(units, lang), unit: unitLabel(l.unit, lang), price: unitMoney(l.unitPrice, lang), amount: l.lineTotal });
    const design = designAmount(l, products);
    if (design > 0) {
      const flat = isFlatDesign(l, products);
      rows.push({
        key: `d${i}`,
        desc: t('designFor', { name: loc.name }),
        sub: t('designSub'),
        qty: flat ? '1' : num(units, lang),
        unit: flat ? t('unit_service') : unitLabel(l.unit, lang),
        price: flat ? money(design, lang) : unitMoney(l.installationPrice, lang),
        amount: design,
      });
    }
  });

  const net = orderNet(order);
  const refunded = refundedOf(order);
  // one row per applied product/order discount (shipping discounts are already inside the delivery fee)
  const applied = (order.discounts ?? []).filter((x) => x.kind !== 'shipping' && x.amount > 0);
  const discountRows: [string, number][] = applied.length
    ? applied.map((x) => [x.code ? t('discountCode', { code: x.code }) : `${t('discount')} · ${discountName(x.id, x.title, discounts, lang)}`, x.amount])
    : order.discount > 0
      ? [[order.coupon?.code ? t('discountCode', { code: order.coupon.code }) : t('discount'), order.discount]]
      : [];
  const docTitle = paid ? t('invoice') : t('proforma');

  return (
    <article
      style={brandVars(s.brandColor)}
      className="print-sheet relative mx-auto w-full max-w-[210mm] overflow-hidden bg-white px-5 py-7 text-[12px] leading-normal text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06),0_24px_60px_-28px_rgb(0_0_0/0.35)] ring-1 ring-line/70 sm:min-h-[297mm] sm:px-[14mm] sm:py-[12mm] print:min-h-0! print:ring-0!"
    >
      {/* CMYK colour bar — the print-house signature */}
      <div aria-hidden className="absolute inset-x-0 top-0 flex h-1.5">
        <span className="flex-1 bg-cyan" />
        <span className="flex-1 bg-magenta" />
        <span className="flex-1 bg-yellow" />
        <span className="flex-1 bg-key" />
      </div>

      {/* Letterhead + document meta */}
      <header className="grid gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
        <div>
          <Logo className="h-[38px]" />
          <div className="mt-4 space-y-px text-[11px] text-ink-soft">
            <p className="text-[12.5px] font-bold text-ink">{s.legalName}</p>
            <p>
              {s.address}, {s.city}, {t('country')}
            </p>
            <p>{[withLabel(s.pib, t('nui')), /^(tvsh|vat)/i.test(s.pdv) ? s.pdv : withLabel(s.pdv, t('vatNo'))].filter(Boolean).join(' · ')}</p>
            <p>
              {t('iban')} {s.bankAccount} · {s.bankName}
            </p>
            <p>
              {s.phone} · {s.email} · printwor-ks.com
            </p>
          </div>
        </div>
        <div className="sm:text-right">
          <h1 className="display text-[26px] leading-tight text-ink sm:text-[30px]">{docTitle}</h1>
          <p className="mt-0.5 font-mono text-[14px] font-medium tracking-wide text-brand-600">{t('docNo', { n: order.number })}</p>
          <dl className="mt-4 grid grid-cols-[auto_auto] justify-start gap-x-4 gap-y-0.5 text-[11px] sm:justify-end">
            <Meta label={t('issued')}>{d(issuedAt)}</Meta>
            <Meta label={t('orderDate')}>{d(order.createdAt)}</Meta>
            {order.poNumber && <Meta label={t('po')}>{order.poNumber}</Meta>}
            {!paid && order.payment.method === 'bank' && <Meta label={t('due')}>{d(dueDate)}</Meta>}
            <Meta label={t('terms')}>{t('termsValue', { n: PAYMENT_TERMS_DAYS })}</Meta>
            <Meta label={t('currency')}>EUR (€)</Meta>
          </dl>
        </div>
      </header>

      {/* Parties */}
      <section className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="rounded-lg bg-[#f4f4f5] px-4 py-3">
          <Label>{t('billTo')}</Label>
          <p className="mt-1 text-[13.5px] font-bold text-ink">{c.company || customerName(order)}</p>
          {c.pib && <p className="font-medium text-ink-soft">{withLabel(c.pib, t('nui'))}</p>}
          {c.company && (
            <p className="text-ink-soft">
              {t('contact')}: {customerName(order)}
            </p>
          )}
          {c.address && <p className="text-ink-soft">{c.address}</p>}
          {c.city && <p className="text-ink-soft">{c.city}</p>}
          <p className="text-ink-soft">{[c.phone, c.email].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="rounded-lg border border-line px-4 py-3">
          <Label>{t('deliveryPayment')}</Label>
          <p className="mt-1 font-semibold text-ink">{tc(`delivery_${order.delivery.method}`)}</p>
          <p className="text-ink-soft">{order.delivery.method === 'pickup' ? s.pickupAddress : [c.address, c.city].filter(Boolean).join(', ')}</p>
          <p className="mt-1.5 font-semibold text-ink">{tc(`pay_${order.payment.method}`)}</p>
          <p className="text-ink-soft">
            {t('orderNo')}: <span className="font-mono">{order.number}</span>
            {order.poNumber && (
              <>
                {' '}
                · PO <span className="font-mono">{order.poNumber}</span>
              </>
            )}
          </p>
        </div>
      </section>

      {/* Items */}
      <table className="mt-7 w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-ink text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted">
            <th className="hidden w-8 py-2 pr-2 font-bold sm:table-cell">{t('col_no')}</th>
            <th className="py-2 pr-3 font-bold">{t('col_desc')}</th>
            <th className="py-2 pr-2 text-right font-bold">{t('col_qty')}</th>
            <th className="hidden py-2 pl-1.5 pr-3 font-bold sm:table-cell">{t('col_unit')}</th>
            <th className="hidden py-2 pr-3 text-right font-bold sm:table-cell">{t('col_price')}</th>
            <th className="py-2 text-right font-bold">{t('col_amount')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} className="border-b border-line/80 align-top">
              <td className="hidden py-2 pr-2 tabular-nums text-muted sm:table-cell">{i + 1}.</td>
              <td className="py-2 pr-3">
                <span className="block font-semibold leading-snug text-ink">{r.desc}</span>
                {r.sub && <span className="block text-[10.5px] leading-snug text-muted">{r.sub}</span>}
                <span className="block text-[10.5px] text-muted sm:hidden">
                  {r.price} / {r.unit}
                </span>
              </td>
              <td className="whitespace-nowrap py-2 pr-2 text-right tabular-nums">
                {r.qty}
                <span className="sm:hidden"> {r.unit}</span>
              </td>
              <td className="hidden py-2 pl-1.5 pr-3 text-ink-soft sm:table-cell">{r.unit}</td>
              <td className="hidden whitespace-nowrap py-2 pr-3 text-right tabular-nums sm:table-cell">{r.price}</td>
              <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums">{money(r.amount, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 text-right text-[10px] text-muted">{t('netNote')}</p>

      {/* Payment instructions + totals */}
      <section className="mt-4 grid gap-6 sm:grid-cols-[1fr_272px] sm:gap-8">
        <div className="order-2 sm:order-1">
          {order.payment.method === 'bank' ? (
            <div className="rounded-lg border border-dashed border-ink/25 px-4 py-3">
              <Label>{t('payTitle')}</Label>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[11px]">
                {(
                  [
                    [t('recipient'), s.legalName],
                    [t('bank'), s.bankName],
                    [t('iban'), <span className="font-mono font-medium tracking-wide">{s.bankAccount}</span>],
                    [t('reference'), <span className="font-mono font-bold tracking-wide text-ink">{order.number}</span>],
                    [t('amount'), <span className="font-semibold tabular-nums">{money(round2(order.total - refunded), lang)}</span>],
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
                {paid ? t('note_paid') : order.payment.method === 'bank' ? t('note_bank', { days: PAYMENT_TERMS_DAYS, n: order.number }) : t(`note_${order.payment.method}`)}
              </p>
            </div>
          ) : (
            <p className="rounded-lg border border-line px-4 py-3 text-[11px] text-ink-soft">
              <span className="font-semibold text-ink">{tc(`pay_${order.payment.method}`)}.</span> {order.payment.method === 'cod' && paid ? t('note_paid') : t(`note_${order.payment.method}`)}
            </p>
          )}
          <div className="mt-3 px-1">
            <Label>{t('termsTitle')}</Label>
            <p className="mt-1 text-pretty text-[10.5px] leading-snug text-ink-soft">{t('termsText', { days: PAYMENT_TERMS_DAYS })}</p>
            {!paid && <p className="mt-1 text-[10.5px] font-semibold text-ink-soft">{t('proformaNote')}</p>}
          </div>
        </div>

        <div className="order-1 sm:order-2">
          <dl className="space-y-1 text-[12px]">
            <TotalRow label={t('subtotal')} value={money(order.subtotal, lang)} />
            {order.installationTotal > 0 && <TotalRow label={t('design')} value={money(order.installationTotal, lang)} />}
            {discountRows.map(([label, amount], i) => (
              <TotalRow key={i} label={label} value={`− ${money(amount, lang)}`} />
            ))}
            <TotalRow label={t('shipping')} value={order.shipping > 0 ? money(order.shipping, lang) : tc('free')} />
            <div className="my-1.5 border-t border-line" />
            <TotalRow label={t('net')} value={money(net, lang)} strong />
            <TotalRow label={t('vat', { rate: s.vatRate })} value={money(order.vat, lang)} />
            {refunded > 0 && <TotalRow label={t('refunded')} value={`− ${money(refunded, lang)}`} />}
          </dl>
          <div className="mt-2 flex items-baseline justify-between gap-3 rounded-lg bg-ink px-3.5 py-2 text-white">
            <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">{paid ? t('total') : t('toPay')}</span>
            <span className="text-[17px] font-bold tabular-nums">{money(round2(order.total - refunded), lang)}</span>
          </div>
          {paid && (
            <div className="mt-4 flex justify-end">
              <span className="-rotate-6 rounded-md border-2 border-ink px-3 py-1 text-[12px] font-bold uppercase tracking-[0.25em] text-ink">{t('paidStamp')}</span>
            </div>
          )}
        </div>
      </section>

      {/* Thank-you + legal */}
      <footer className="mt-7 border-t border-line pt-4">
        <p className="display text-[18px] text-ink">
          {t('thanks').split('PrintWorks')[0]}
          <span className="text-brand-600">PrintWorks</span>
          {t('thanks').split('PrintWorks')[1]}
        </p>
        <p className="mt-1 text-pretty text-[11px] text-ink-soft">{t('thanksText', { phone: s.phone, email: s.email })}</p>
        <p className="mt-3 text-[9.5px] leading-snug text-muted">{t('legal', { rate: s.vatRate })}</p>
      </footer>
    </article>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted">{children}</p>;
}

function Meta({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-ink">{children}</dd>
    </>
  );
}

function TotalRow({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={cn(strong ? 'font-semibold text-ink' : 'text-ink-soft')}>{label}</dt>
      <dd className={cn('tabular-nums text-ink', strong ? 'font-bold' : 'font-semibold')}>{value}</dd>
    </div>
  );
}
