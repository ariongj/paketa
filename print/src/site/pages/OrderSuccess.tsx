import { Link, useParams } from 'react-router';
import { ArrowRight, Banknote, CheckCircle2, Copy, CreditCard, Factory, FileCheck2, Home, Landmark, LayoutDashboard, PackageCheck, PackageSearch, Printer, ThumbsUp, Truck, UploadCloud } from 'lucide-react';
import type { ComponentType } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { Accent, Badge, Img } from '@/components/ui/misc';
import { defineDict, useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { zoneForCity } from '@/lib/pricing';
import { dateTime, money, unitLabel } from '@/lib/format';
import type { ArtworkRef, Order } from '@/lib/types';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { CheckoutSteps, TotalsRows, orderTotalsView, useCopy, useItemsLabel } from '@/site/components/checkout/parts';
import { ArtworkChip, AttachButton } from '@/site/components/checkout/artwork';
import { Confetti, SuccessCheck } from '@/site/components/checkout/Celebrate';
import { ck } from '@/site/components/checkout/dict';
import { ArtworkThumb } from '@/site/components/product/ArtworkDrop';
import { ChevronTexture, CmykBar, Eyebrow } from '@/site/components/company/Print';
import { qtyText, unitMoney } from '@/site/components/product/print';

const T = defineDict({
  sq: {
    pageTitle: 'Porosia u pranua',
    eyebrow: 'Porosia u pranua',
    thanks: 'Faleminderit, *{name}*!',
    lead: 'Porosia juaj u regjistrua. Konfirmimin {proforma}e dërguam në {email}.',
    leadProforma: 'dhe pro-formën ',
    orderNo: 'Numri i porosisë',
    placedAt: 'Porositur më {date}',
    poRef: 'PO: {po}',
    nextTitle: 'Çfarë *vijon*',
    n1: 'Kontrolli prepress & prova digjitale',
    n1when: 'brenda 24 orësh',
    n1text: 'Kontrollojmë rezolucionin, bleed-in dhe ngjyrat, pastaj ju dërgojmë provën PDF në {email}.',
    n1design: 'Dizajnerët tanë përgatisin dizajnin dhe ju dërgojnë provën e parë në {email}.',
    n2: 'Ju e aprovoni provën',
    n2when: 'me një klik',
    n2text: 'Asgjë nuk printohet pa miratimin tuaj — ndryshimet e vogla në provë janë falas.',
    n3: 'Prodhimi',
    n3when: '~{days} ditë pune',
    n3text: 'Printim, finishing dhe kontroll cilësie në fabrikën tonë në Prishtinë.',
    n3bank: 'Prodhimi nis pasi të regjistrohet pagesa sipas pro-formës.',
    n4delivery: 'Dorëzimi',
    n4deliveryText: 'Dërgojmë në {address}. Ju njoftojmë një ditë më parë.',
    n4pickup: 'Marrja në fabrikë',
    n4pickupText: 'Porosia ju pret në {address}. Ju njoftojmë kur të jetë gati.',
    n4when: '{days} ditë pune',
    n4whenPickup: 'kur të jetë gati',
    filesTitle: 'Skedarët e printimit',
    filesMissing: 'Ngarkoni skedarët që mungojnë',
    filesMissingText: 'Sa më shpejt t’i marrim, aq më shpejt vjen prova. Pranojmë PDF, AI, EPS, SVG, PNG, JPG dhe TIF.',
    filesReady: 'Të gjithë skedarët janë gati',
    filesReadyText: 'Prepress-i ka gjithçka që i duhet — prova vjen brenda 24 orësh.',
    uploadFile: 'Ngarko skedarin',
    noteUploaded: 'Klienti ngarkoi skedarin „{file}“ për {line}',
    proformaTitle: 'Pro-forma · të dhënat për pagesë',
    proformaText: 'Ju lutemi shënoni numrin e porosisë si referencë. Prodhimi nis sapo të regjistrohet pagesa (zakonisht 1 ditë pune).',
    placeholder: 'Të dhëna shembull — përditësohen në Konfigurime',
    recipient: 'Përfituesi',
    bank: 'Banka',
    account: 'IBAN / llogaria',
    amount: 'Shuma për pagesë',
    reference: 'Referenca',
    purpose: 'Qëllimi i pagesës',
    purposeText: 'Pagesë për porosinë {n}',
    printProforma: 'Printo',
    codNote: 'Përgatitni {amount} — paguani korrierit me para në dorë ose me kartelë.',
    cardNote: 'Pagesa me kartelë u miratua — {amount} u paguan.',
    deliveryTo: 'Dërgesa',
    payment: 'Pagesa',
    billing: 'Faturimi',
    summary: 'Përmbledhja',
    continue: 'Vazhdo me produktet',
    home: 'Ballina',
    demo: 'Demo:',
    demoText: 'porosia sapo u shfaq në CMS — me skedarët dhe statusin e provës.',
    demoLink: 'Shiko në CMS',
    nfTitle: 'Porosia nuk u gjet',
    nfText: 'Kontrolloni lidhjen nga konfirmimi ose na kontaktoni — me kënaqësi ju ndihmojmë.',
    contactUs: 'Na kontaktoni',
  },
  en: {
    pageTitle: 'Order received',
    eyebrow: 'Order received',
    thanks: 'Thank you, *{name}*!',
    lead: 'Your order is in. We’ve sent the confirmation {proforma}to {email}.',
    leadProforma: 'and pro-forma invoice ',
    orderNo: 'Order number',
    placedAt: 'Placed {date}',
    poRef: 'PO: {po}',
    nextTitle: 'What happens *next*',
    n1: 'Prepress check & digital proof',
    n1when: 'within 24 hours',
    n1text: 'We check resolution, bleed and colours, then send a PDF proof to {email}.',
    n1design: 'Our designers prepare your artwork and send the first proof to {email}.',
    n2: 'You approve the proof',
    n2when: 'in one click',
    n2text: 'Nothing is printed without your sign-off — small proof corrections are free.',
    n3: 'Production',
    n3when: '~{days} working days',
    n3text: 'Printing, finishing and quality control at our factory in Prishtina.',
    n3bank: 'Production starts once the pro-forma payment is registered.',
    n4delivery: 'Delivery',
    n4deliveryText: 'We deliver to {address} and let you know the day before.',
    n4pickup: 'Factory pickup',
    n4pickupText: 'Your order will be waiting at {address}. We’ll tell you when it’s ready.',
    n4when: '{days} working days',
    n4whenPickup: 'when ready',
    filesTitle: 'Print files',
    filesMissing: 'Upload the missing files',
    filesMissingText: 'The sooner we have them, the sooner your proof arrives. PDF, AI, EPS, SVG, PNG, JPG and TIF accepted.',
    filesReady: 'All files are in',
    filesReadyText: 'Prepress has everything it needs — your proof follows within 24 hours.',
    uploadFile: 'Upload file',
    noteUploaded: 'Customer uploaded “{file}” for {line}',
    proformaTitle: 'Pro-forma · payment details',
    proformaText: 'Please quote the order number as the reference. Production starts as soon as the payment is registered (usually 1 working day).',
    placeholder: 'Sample data — updated in Settings',
    recipient: 'Beneficiary',
    bank: 'Bank',
    account: 'IBAN / account',
    amount: 'Amount due',
    reference: 'Reference',
    purpose: 'Payment description',
    purposeText: 'Payment for order {n}',
    printProforma: 'Print',
    codNote: 'Please have {amount} ready — pay the courier in cash or by card.',
    cardNote: 'Card payment approved — {amount} has been charged.',
    deliveryTo: 'Delivery',
    payment: 'Payment',
    billing: 'Billing',
    summary: 'Summary',
    continue: 'Continue browsing',
    home: 'Home',
    demo: 'Demo:',
    demoText: 'the order has just landed in the CMS — with its files and proof status.',
    demoLink: 'View in the CMS',
    nfTitle: 'Order not found',
    nfText: 'Please check the link from your confirmation or get in touch — we’re happy to help.',
    contactUs: 'Contact us',
  },
});

/** Settings values that are still demo placeholders (e.g. "NUI 81XXXXXXX", "XK05 1110 0000 0000 0000"). */
const isPlaceholder = (v: string | undefined) => !v || /X{3,}/i.test(v) || /(0000[\s-]?){3}/.test(v);

function NotFoundState() {
  const t = useDict(T);
  usePageTitle(t('nfTitle'));
  return (
    <div className="container-x py-16 sm:py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-line">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-paper text-ink-soft ring-1 ring-line">
          <PackageSearch className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <h1 className="display mt-6 text-[34px] leading-tight text-ink sm:text-[42px]">{t('nfTitle')}</h1>
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">{t('nfText')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/" icon={<Home className="h-4 w-4" />}>
            {t('home')}
          </ButtonLink>
          <ButtonLink to="/kontakt" variant="outline">
            {t('contactUs')}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function Step({ icon: Icon, title, when, text, extra, first, last }: { icon: ComponentType<{ className?: string }>; title: string; when: string; text: string; extra?: string; first?: boolean; last?: boolean }) {
  return (
    <li className={cn('relative flex gap-4', !last && 'pb-7')}>
      {!last && <span aria-hidden className="absolute bottom-0 left-5 top-11 w-px bg-line" />}
      <span className={cn('relative grid h-10 w-10 shrink-0 place-items-center rounded-full', first ? 'bg-brand-600 text-white shadow-[0_8px_20px_-10px_var(--color-brand-700)]' : 'bg-white text-ink-soft ring-1 ring-line')}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 pt-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3 className="text-[15.5px] font-semibold text-ink">{title}</h3>
          <span className={cn('rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em]', first ? 'bg-brand-50 text-brand-700' : 'bg-paper text-muted ring-1 ring-line')}>{when}</span>
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{text}</p>
        {extra && <p className="mt-1 text-[13px] font-medium text-amber-800">{extra}</p>}
      </div>
    </li>
  );
}

function Proforma({ order }: { order: Order }) {
  const t = useDict(T);
  const tk = useDict(ck);
  const lang = useLang();
  const settings = useSettings();
  const copy = useCopy();
  const demo = isPlaceholder(settings.bankAccount);
  const rows: { label: string; value: string; copy?: boolean; strong?: boolean; mono?: boolean }[] = [
    { label: t('recipient'), value: settings.legalName },
    { label: t('bank'), value: settings.bankName },
    { label: t('account'), value: settings.bankAccount, copy: true, strong: true, mono: true },
    { label: t('amount'), value: money(order.total, lang), strong: true },
    { label: t('reference'), value: order.number, copy: true, strong: true, mono: true },
    { label: t('purpose'), value: t('purposeText', { n: order.number }) },
  ];
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-ink p-6 text-paper sm:p-8">
      <ChevronTexture />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-brand-300">
              <Landmark className="h-5 w-5" />
            </span>
            <h2 className="text-[22px] font-semibold leading-tight text-white">{t('proformaTitle')}</h2>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[13px] font-semibold text-paper/85 transition-colors hover:bg-white/20 hover:text-white no-print">
            <Printer className="h-4 w-4" /> {t('printProforma')}
          </button>
        </div>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-paper/65">{t('proformaText')}</p>
        {demo && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-amber-200 ring-1 ring-inset ring-amber-300/30">
            {t('placeholder')}
          </p>
        )}
        <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 bg-ink/85 px-4 py-3.5">
              <div className="min-w-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/45">{r.label}</dt>
                <dd className={cn('mt-0.5 break-words text-[14.5px] tabular-nums', r.strong ? 'font-semibold text-white' : 'text-paper/85', r.mono && 'font-mono text-[14px]')}>{r.value}</dd>
              </div>
              {r.copy && (
                <button
                  type="button"
                  onClick={() => copy(r.value)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-paper/80 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label={`${tk('copy')}: ${r.label}`}
                  title={tk('copy')}
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Lines still waiting for a print file — upload updates the order line's artwork (visible live in the CMS). */
function FilesCard({ order }: { order: Order }) {
  const t = useDict(T);
  const lang = useLang();
  const updateOrder = useDb((s) => s.updateOrder);
  const lines = order.items.map((it, i) => ({ it, i })).filter(({ it }) => !!it.artwork);
  if (!lines.length) return null;
  const missing = lines.filter(({ it }) => it.artwork?.status === 'later').length;

  const attach = (index: number, a: ArtworkRef) => {
    const current = useDb.getState().orders.find((o) => o.id === order.id) ?? order;
    const line = current.items[index];
    const note = line.artwork?.note ? { note: line.artwork.note } : {};
    updateOrder(order.id, {
      items: current.items.map((x, k) => (k === index ? { ...x, artwork: { ...a, ...note } } : x)),
      timeline: [...current.timeline, { at: new Date().toISOString(), status: 'note', note: t('noteUploaded', { file: a.name ?? '', line: line.name }), by: 'web' }],
    });
  };

  return (
    <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
      <div className={cn('flex items-start gap-3.5 px-6 py-5 sm:px-8', missing ? 'bg-amber-50/70' : 'bg-emerald-50/60')}>
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', missing ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700')}>
          {missing ? <UploadCloud className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{t('filesTitle')}</div>
          <h2 className="mt-0.5 text-[18px] font-semibold text-ink">{missing ? t('filesMissing') : t('filesReady')}</h2>
          <p className="mt-1 text-[13.5px] leading-snug text-muted">{missing ? t('filesMissingText') : t('filesReadyText')}</p>
        </div>
      </div>
      <ul className="divide-y divide-line px-6 sm:px-8">
        {lines.map(({ it, i }) => (
          <li key={i} className="flex flex-wrap items-center gap-3.5 py-4">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line">{it.image && <Img src={it.image} small alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-ink">{it.name}</div>
              <div className="font-mono text-[11px] text-muted">
                {qtyText(it.qty, lang)} {unitLabel(it.unit, lang)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {it.artwork?.status === 'uploaded' && <ArtworkThumb art={it.artwork} className="h-8 w-8" />}
              {it.artwork && <ArtworkChip art={it.artwork} />}
              {it.artwork?.status === 'later' && <AttachButton onFile={(a) => attach(i, a)} label={t('uploadFile')} className="h-8 border-solid border-ink bg-ink px-3 text-paper hover:border-brand-600 hover:bg-brand-600 hover:text-white" />}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function OrderSuccess() {
  const { id } = useParams();
  const order = useDb((s) => s.orders.find((o) => o.id === id || o.number === id));
  if (!order) return <NotFoundState />;
  return <Success order={order} />;
}

function Success({ order }: { order: Order }) {
  const t = useDict(T);
  const tk = useDict(ck);
  const tc = useDict(common);
  const lang = useLang();
  const settings = useSettings();
  const items = useItemsLabel();
  const copy = useCopy();
  const products = useDb((s) => s.products);
  usePageTitle(t('pageTitle'));

  const c = order.customer;
  const name = c.firstName.replace(/\*/g, '').trim() || c.company || c.lastName;
  const pickup = order.delivery.method === 'pickup';
  const zone = zoneForCity(settings, c.city);
  const fullAddress = [c.address, c.city].filter(Boolean).join(', ');
  const lead = Math.max(1, ...order.items.map((it) => products.find((p) => p.id === it.productId)?.leadDays ?? 0));
  const design = order.items.some((it) => it.artwork?.status === 'design');
  const bank = order.payment.method === 'bank';

  const steps = [
    { icon: FileCheck2, title: t('n1'), when: t('n1when'), text: design ? t('n1design', { email: c.email }) : t('n1text', { email: c.email }) },
    { icon: ThumbsUp, title: t('n2'), when: t('n2when'), text: t('n2text') },
    { icon: Factory, title: t('n3'), when: t('n3when', { days: lead }), text: t('n3text'), extra: bank && order.payment.status !== 'paid' ? t('n3bank') : undefined },
    pickup
      ? { icon: PackageCheck, title: t('n4pickup'), when: t('n4whenPickup'), text: t('n4pickupText', { address: settings.pickupAddress }) }
      : { icon: Truck, title: t('n4delivery'), when: t('n4when', { days: zone?.days ?? '1–2' }), text: t('n4deliveryText', { address: fullAddress }) },
  ];

  const PayIcon = { cod: Banknote, bank: Landmark, card: CreditCard }[order.payment.method];
  const payNote = order.payment.method === 'card' ? t('cardNote', { amount: money(order.total, lang) }) : order.payment.method === 'cod' ? t('codNote', { amount: money(order.total, lang) }) : null;
  const view = orderTotalsView(order, { pickup: tk('pickup'), delivery: tk('delivery') });
  const lead1 = t('lead', { proforma: bank ? t('leadProforma') : '', email: '{email}' });

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-white to-paper">
        <CmykBar />
        <Confetti />
        <div className="container-x relative flex flex-col items-center pb-14 pt-8 text-center sm:pb-16 sm:pt-10">
          <CheckoutSteps current={4} className="mb-10 sm:mb-12" />
          <SuccessCheck />
          <Eyebrow className="mt-7 animate-fade-up [animation-delay:250ms]">{t('eyebrow')}</Eyebrow>
          <h1 className="display mt-3 animate-fade-up text-[40px] leading-[1.02] text-ink [animation-delay:320ms] sm:text-[60px]">
            <Accent text={t('thanks', { name })} />
          </h1>
          <p className="mt-4 max-w-xl animate-fade-up text-[16px] leading-relaxed text-muted [animation-delay:400ms] sm:text-[17px]">
            {lead1.split('{email}').flatMap((part, i) => (i === 0 ? [part] : [<strong key={i} className="font-semibold text-ink">{c.email}</strong>, part]))}
          </p>
          <div className="mt-7 inline-flex animate-fade-up items-center gap-3 rounded-full bg-white py-1.5 pl-5 pr-1.5 shadow-[0_10px_30px_-18px_rgba(18,16,20,0.45)] ring-1 ring-line [animation-delay:480ms]">
            <span className="text-[13px] text-muted">{t('orderNo')}</span>
            <span className="font-mono text-[17px] font-medium tracking-wide text-ink">{order.number}</span>
            <button type="button" onClick={() => copy(order.number)} className="grid h-9 w-9 place-items-center rounded-full bg-paper text-ink-soft ring-1 ring-line transition-colors hover:bg-ink hover:text-paper" aria-label={tk('copy')} title={tk('copy')}>
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 animate-fade-up font-mono text-[11px] text-muted [animation-delay:520ms]">
            {t('placedAt', { date: dateTime(order.createdAt, lang) })}
            {order.poNumber && ` · ${t('poRef', { po: order.poNumber })}`}
          </p>
        </div>
      </section>

      <div className="container-x grid items-start gap-8 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12 xl:gap-16">
        <div className="min-w-0 space-y-6">
          <FilesCard order={order} />
          {bank && <Proforma order={order} />}

          <section className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8">
            <h2 className="display text-[30px] leading-tight text-ink">
              <Accent text={t('nextTitle')} />
            </h2>
            <ol className="mt-7">
              {steps.map((s, i) => (
                <Step key={i} {...s} first={i === 0} last={i === steps.length - 1} />
              ))}
            </ol>
          </section>

          <section className="grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line sm:grid-cols-3">
            <div className="bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                {pickup ? <Factory className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                {t('deliveryTo')}
              </div>
              <p className="mt-2 text-[14px] font-semibold text-ink">{tc(`delivery_${order.delivery.method}`)}</p>
              <p className="mt-1 text-[13.5px] leading-snug text-muted">{pickup ? settings.pickupAddress : fullAddress}</p>
            </div>
            <div className="bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                <PayIcon className="h-3.5 w-3.5" />
                {t('payment')}
              </div>
              <p className="mt-2 text-[14px] font-semibold text-ink">{tc(`pay_${order.payment.method}`)}</p>
              <Badge tone={order.payment.status === 'paid' ? 'green' : order.payment.status === 'refunded' ? 'gray' : 'amber'} dot className="mt-2">
                {tc(`paystatus_${order.payment.status}`)}
              </Badge>
            </div>
            <div className="bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                <Landmark className="h-3.5 w-3.5" />
                {t('billing')}
              </div>
              <p className="mt-2 text-[14px] font-semibold text-ink">{c.company || `${c.firstName} ${c.lastName}`}</p>
              <p className="mt-1 break-words text-[13.5px] leading-snug text-muted">
                {c.pib && <span className="block font-mono text-[12px]">NUI {c.pib}</span>}
                {c.company && (
                  <span className="block">
                    {c.firstName} {c.lastName}
                  </span>
                )}
                <span className="block">{c.phone}</span>
                <span className="block">{c.email}</span>
              </p>
            </div>
          </section>

          {payNote && (
            <p className={cn('flex items-start gap-2.5 rounded-2xl px-4 py-3.5 text-[13.5px] leading-snug ring-1 ring-inset', order.payment.method === 'card' ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/15' : 'bg-white text-ink-soft ring-line')}>
              {order.payment.method === 'card' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />}
              {payNote}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink to="/produktet" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              {t('continue')}
            </ButtonLink>
            <ButtonLink to="/" size="lg" variant="outline" icon={<Home className="h-4 w-4" />}>
              {t('home')}
            </ButtonLink>
          </div>

          <Link
            to={`/admin/porosite/${order.id}`}
            className="group flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-dashed border-ink/20 px-4 py-3.5 text-[13px] text-muted transition-colors hover:border-ink/40 hover:bg-white/60"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-paper">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-ink-soft">{t('demo')}</span> {t('demoText')}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-ink group-hover:text-brand-700">
              {t('demoLink')} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-[100px]">
          <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
            <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
              <h2 className="text-[15px] font-semibold text-ink">
                {t('summary')} <span className="font-medium text-muted">· {items(order.items.length)}</span>
              </h2>
              <span className="font-mono text-[12px] text-muted">{order.number}</span>
            </div>
            <ul className="divide-y divide-line px-6">
              {order.items.map((it, i) => {
                const fee = it.installation ? (it.installationPer === 'line' ? it.installationPrice : Math.round(it.installationPrice * it.qty * 100) / 100) : 0;
                return (
                  <li key={i} className="flex gap-3.5 py-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line">{it.image && <Img src={it.image} small alt="" className="h-full w-full object-cover" />}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">{it.name}</p>
                        <span className="shrink-0 font-mono text-[13px] tabular-nums text-ink">{money(it.lineTotal, lang)}</span>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted">
                        {qtyText(it.qty, lang)} {unitLabel(it.unit, lang)} × {it.unit === 'kom' ? unitMoney(it.unitPrice, lang) : money(it.unitPrice, lang)}
                      </p>
                      {it.options && <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">{it.options}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {it.artwork && <ArtworkChip art={it.artwork} size="sm" />}
                        {fee > 0 && <span className="font-mono text-[10.5px] text-brand-700">{tk('designFee', { amount: money(fee, lang) })}</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-line bg-paper/60 px-6 py-5">
              <TotalsRows big v={view} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
