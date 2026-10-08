import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowRight,
  Banknote,
  BadgeCheck,
  CalendarDays,
  Copy,
  CreditCard,
  Home,
  Landmark,
  LayoutDashboard,
  PackageCheck,
  PackageSearch,
  PenTool,
  PhoneCall,
  Repeat,
  ShieldCheck,
  Stamp,
  Truck,
  Warehouse,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Accent, Badge, Img } from '@/components/ui/misc';
import { defineDict, useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useUi } from '@/store/ui';
import { useSettings } from '@/store/hooks';
import { zoneForCity } from '@/lib/pricing';
import { date, dateTime, money, moneyPiece, pieces, unitLabel } from '@/lib/format';
import type { Order } from '@/lib/types';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { CheckoutSteps, TotalsRows, useCopy, useItemsLabel, useOrderTotalsView, usePacksLabel, useWorkDays } from '@/site/components/checkout/parts';
import { Confetti, SuccessCheck } from '@/site/components/checkout/Celebrate';
import { ck } from '@/site/components/checkout/dict';

const T = defineDict({
  me: {
    pageTitle: 'Narudžba primljena',
    eyebrow: 'Narudžba je primljena',
    thanks: 'Hvala, *{name}*!',
    lead: 'Vaša narudžba je uspješno zaprimljena. Potvrdu smo poslali na {email}, a naš tim će vas uskoro pozvati.',
    orderNo: 'Broj narudžbe',
    placedAt: 'Naručeno {date}',
    nextTitle: 'Šta *slijedi*',
    n1: 'Poziv za potvrdu',
    n1when: 'u roku od 2 h',
    n1text: 'Zovemo vas na {phone} da potvrdimo narudžbu i termin dostave.',
    pPrep: 'Priprema u magacinu',
    pPrepWhen: 'istog dana',
    pPrepWhenBank: 'nakon uplate',
    pPrepText: 'Pakujemo vašu narudžbu u magacinu u Mitrovici i provjeravamo svaku stavku.',
    pProof: 'Logotip i probni prikaz',
    pProofWhen: '1 radni dan',
    pProofText: 'Pošaljite nam logotip (PDF, AI ili PNG) na {email} — vraćamo vam digitalni probni prikaz na ambalaži.',
    pApprove: 'Vaše odobrenje',
    pApproveWhen: 'kada potvrdite',
    pApproveText: 'Provjerite boje, veličinu i poziciju — ništa ne štampamo bez vašeg odobrenja.',
    pPrint: 'Štampa',
    pPrintWhen: '7–10 radnih dana',
    pPrintText: 'Štampamo ambalažu sa vašim logotipom; status narudžbe prelazi u „U štampi“.',
    dDelivery: 'Dostava na adresu',
    dDeliveryText: 'Dostavljamo na {address}. Kurir vas zove prije dolaska.',
    dPickup: 'Preuzimanje u magacinu',
    dPickupText: 'Narudžba vas čeka u {place}: {address}. Javićemo vam kada bude spremna.',
    dWhenPickup: 'kada bude spremno',
    preferred: 'Željeni datum: {date}',
    bankTitle: 'Podaci za uplatu',
    bankText: 'Narudžbu šaljemo čim uplata bude evidentirana (obično 1 radni dan). Obavezno navedite broj narudžbe kao poziv na broj.',
    bankInvoice: 'Fakturu na NUI {nui} šaljemo na {email}.',
    recipient: 'Primalac',
    bank: 'Banka',
    account: 'IBAN',
    amount: 'Iznos',
    reference: 'Poziv na broj',
    purpose: 'Svrha uplate',
    purposeText: 'Uplata po narudžbi {n}',
    codNote: 'Pripremite {amount} — plaćate kuriru gotovinom.',
    codNotePickup: 'Pripremite {amount} — plaćate u magacinu gotovinom ili karticom.',
    cardNote: 'Plaćanje karticom je odobreno — iznos {amount} je naplaćen.',
    deliveryTo: 'Dostava',
    payment: 'Plaćanje',
    contact: 'Kontakt',
    summary: 'Pregled narudžbe',
    reorderTitle: 'Dopuna zaliha u jednom kliku',
    reorderText: 'Sačuvajte broj {n} — kada vam zatreba ista ambalaža, vratite iste proizvode u korpu jednim klikom ili nas pozovite.',
    reorderCta: 'Vrati iste proizvode u korpu',
    reordered: 'Proizvodi su vraćeni u korpu',
    continue: 'Nastavi kupovinu',
    home: 'Početna',
    demo: 'Demo:',
    demoText: 'narudžba se upravo pojavila u CMS-u.',
    demoLink: 'Pogledaj narudžbu u CMS-u',
    nfTitle: 'Narudžba nije pronađena',
    nfText: 'Provjerite link iz potvrde ili nas kontaktirajte — rado ćemo pomoći.',
    contactUs: 'Kontaktirajte nas',
  },
  sq: {
    pageTitle: 'Porosia u pranua',
    eyebrow: 'Porosia u pranua',
    thanks: 'Faleminderit, *{name}*!',
    lead: 'Porosia juaj u pranua me sukses. Konfirmimin e dërguam në {email}, ndërsa ekipi ynë do t’ju telefonojë së shpejti.',
    orderNo: 'Numri i porosisë',
    placedAt: 'Porositur më {date}',
    nextTitle: 'Çfarë *vijon*',
    n1: 'Thirrje konfirmimi',
    n1when: 'brenda 2 orëve',
    n1text: 'Ju telefonojmë në {phone} për të konfirmuar porosinë dhe orarin e dorëzimit.',
    pPrep: 'Përgatitja në depo',
    pPrepWhen: 'në të njëjtën ditë',
    pPrepWhenBank: 'pas pagesës',
    pPrepText: 'E paketojmë porosinë në depon tonë në Mitrovicë dhe kontrollojmë çdo artikull.',
    pProof: 'Logoja dhe prova',
    pProofWhen: '1 ditë pune',
    pProofText: 'Na dërgoni logon (PDF, AI ose PNG) në {email} — ju kthejmë provën digjitale mbi paketim.',
    pApprove: 'Miratimi juaj',
    pApproveWhen: 'kur ta konfirmoni',
    pApproveText: 'Kontrolloni ngjyrat, madhësinë dhe pozicionin — asgjë nuk printohet pa miratimin tuaj.',
    pPrint: 'Printimi',
    pPrintWhen: '7–10 ditë pune',
    pPrintText: 'Printojmë paketimin me logon tuaj; statusi i porosisë kalon në „Në printim“.',
    dDelivery: 'Dërgesë në adresë',
    dDeliveryText: 'Dërgojmë në {address}. Korrieri ju telefonon para se të vijë.',
    dPickup: 'Marrje në depo',
    dPickupText: 'Porosia ju pret në {place}: {address}. Do t’ju njoftojmë kur të jetë gati.',
    dWhenPickup: 'kur të jetë gati',
    preferred: 'Data e preferuar: {date}',
    bankTitle: 'Të dhënat për pagesë',
    bankText: 'Porosinë e nisim sapo të regjistrohet pagesa (zakonisht 1 ditë pune). Patjetër shënoni numrin e porosisë si referencë.',
    bankInvoice: 'Faturën me NUI {nui} e dërgojmë në {email}.',
    recipient: 'Përfituesi',
    bank: 'Banka',
    account: 'IBAN',
    amount: 'Shuma',
    reference: 'Referenca',
    purpose: 'Qëllimi i pagesës',
    purposeText: 'Pagesë për porosinë {n}',
    codNote: 'Përgatitni {amount} — paguani korrierit me para në dorë.',
    codNotePickup: 'Përgatitni {amount} — paguani në depo me para në dorë ose me kartelë.',
    cardNote: 'Pagesa me kartelë u miratua — shuma {amount} u pagua.',
    deliveryTo: 'Dërgesa',
    payment: 'Pagesa',
    contact: 'Kontakti',
    summary: 'Përmbledhja e porosisë',
    reorderTitle: 'Rifurnizim me një klik',
    reorderText: 'Ruajeni numrin {n} — kur t’ju mbarojë paketimi, i ktheni të njëjtat produkte në shportë me një klik ose na telefononi.',
    reorderCta: 'Shto sërish të njëjtat produkte',
    reordered: 'Produktet u shtuan sërish në shportë',
    continue: 'Vazhdo blerjen',
    home: 'Ballina',
    demo: 'Demo:',
    demoText: 'porosia sapo u shfaq në CMS.',
    demoLink: 'Shiko porosinë në CMS',
    nfTitle: 'Porosia nuk u gjet',
    nfText: 'Kontrolloni linkun nga konfirmimi ose na kontaktoni — me kënaqësi ju ndihmojmë.',
    contactUs: 'Na kontaktoni',
  },
  en: {
    pageTitle: 'Order received',
    eyebrow: 'Order received',
    thanks: 'Thank you, *{name}*!',
    lead: 'Your order has been received. We’ve sent the confirmation to {email} and our team will call you shortly.',
    orderNo: 'Order number',
    placedAt: 'Placed {date}',
    nextTitle: 'What happens *next*',
    n1: 'Confirmation call',
    n1when: 'within 2 h',
    n1text: 'We call you on {phone} to confirm the order and the delivery time.',
    pPrep: 'Packed at our warehouse',
    pPrepWhen: 'same day',
    pPrepWhenBank: 'once paid',
    pPrepText: 'We pack your order at our warehouse in Mitrovica and check every item.',
    pProof: 'Logo & proof',
    pProofWhen: '1 working day',
    pProofText: 'Send us your logo (PDF, AI or PNG) at {email} — we reply with a digital proof on the packaging.',
    pApprove: 'Your approval',
    pApproveWhen: 'once you confirm',
    pApproveText: 'Check colours, size and position — nothing is printed without your approval.',
    pPrint: 'Printing',
    pPrintWhen: '7–10 working days',
    pPrintText: 'We print the packaging with your logo; the order status moves to “In print”.',
    dDelivery: 'Delivery to your address',
    dDeliveryText: 'We deliver to {address}. The courier calls you before arriving.',
    dPickup: 'Warehouse pickup',
    dPickupText: 'Your order will be waiting at {place}: {address}. We’ll let you know when it’s ready.',
    dWhenPickup: 'when ready',
    preferred: 'Preferred date: {date}',
    bankTitle: 'Bank transfer details',
    bankText: 'We ship as soon as the payment is registered (usually 1 working day). Please quote your order number as the reference.',
    bankInvoice: 'We’ll send the invoice with NUI {nui} to {email}.',
    recipient: 'Recipient',
    bank: 'Bank',
    account: 'IBAN',
    amount: 'Amount',
    reference: 'Reference',
    purpose: 'Payment description',
    purposeText: 'Payment for order {n}',
    codNote: 'Please have {amount} ready — pay the courier in cash.',
    codNotePickup: 'Please have {amount} ready — pay at the warehouse in cash or by card.',
    cardNote: 'Card payment approved — {amount} has been charged.',
    deliveryTo: 'Delivery',
    payment: 'Payment',
    contact: 'Contact',
    summary: 'Order summary',
    reorderTitle: 'Restock in one click',
    reorderText: 'Keep order number {n} — when you run low, put the same products back in your cart with one click or just call us.',
    reorderCta: 'Add the same products again',
    reordered: 'Products added to your cart again',
    continue: 'Continue shopping',
    home: 'Home',
    demo: 'Demo:',
    demoText: 'the order has just landed in the CMS.',
    demoLink: 'View the order in the CMS',
    nfTitle: 'Order not found',
    nfText: 'Please check the link from your confirmation or get in touch — we’re happy to help.',
    contactUs: 'Contact us',
  },
});

function NotFoundState() {
  const t = useDict(T);
  usePageTitle(t('nfTitle'));
  return (
    <div className="container-x py-16 sm:py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border-2 border-dashed border-ink/15 bg-white px-6 py-16 text-center">
        <span className="grid h-16 w-16 rotate-[-4deg] place-items-center rounded-2xl bg-lime text-ink">
          <PackageSearch className="h-7 w-7" strokeWidth={1.7} />
        </span>
        <h1 className="display mt-6 text-[34px] leading-tight text-ink sm:text-[42px]">{t('nfTitle')}</h1>
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">{t('nfText')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/" icon={<Home className="h-4 w-4" />}>
            {t('home')}
          </ButtonLink>
          <ButtonLink to="/kontakti" variant="outline">
            {t('contactUs')}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

interface StepItem {
  icon: ComponentType<{ className?: string }>;
  title: string;
  when: string;
  text: string;
  tone?: 'logo';
}

function Step({ icon: Icon, title, when, text, tone, first, last }: StepItem & { first?: boolean; last?: boolean }) {
  return (
    <li className={cn('relative flex gap-4', !last && 'pb-7')}>
      {!last && <span aria-hidden className="absolute bottom-0 left-5 top-11 border-l border-dashed border-ink/20" />}
      <span
        className={cn(
          'relative grid h-10 w-10 shrink-0 place-items-center rounded-full',
          first ? 'bg-brand-600 text-white shadow-[0_8px_20px_-10px_var(--color-brand-700)]' : tone === 'logo' ? 'bg-pink-soft text-pink-ink' : 'bg-sand text-ink-soft',
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 pt-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3 className="text-[15.5px] font-semibold text-ink">{title}</h3>
          <Badge tone={first ? 'brand' : 'sand'} className={tone === 'logo' && !first ? 'bg-pink-soft! text-pink-ink!' : undefined}>
            {when}
          </Badge>
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{text}</p>
      </div>
    </li>
  );
}

function BankBox({ order }: { order: Order }) {
  const t = useDict(T);
  const tk = useDict(ck);
  const lang = useLang();
  const settings = useSettings();
  const copy = useCopy();
  const c = order.customer;
  const rows: { label: string; value: string; copy?: boolean; strong?: boolean }[] = [
    { label: t('recipient'), value: settings.legalName },
    { label: t('bank'), value: settings.bankName },
    { label: t('account'), value: settings.bankAccount, copy: true, strong: true },
    { label: t('amount'), value: money(order.total, lang), strong: true },
    { label: t('reference'), value: order.number, copy: true, strong: true },
    { label: t('purpose'), value: t('purposeText', { n: order.number }) },
  ];
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-700 p-6 text-white sm:p-8">
      <div className="bg-grain pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink">
            <Landmark className="h-5 w-5" />
          </span>
          <h2 className="display text-[26px] leading-tight text-white">{t('bankTitle')}</h2>
        </div>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/75">{t('bankText')}</p>
        {c.company && c.pib && <p className="mt-2 text-[13.5px] font-semibold text-lime">{t('bankInvoice', { nui: c.pib, email: c.email })}</p>}
        <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 bg-brand-800/70 px-4 py-3.5">
              <div className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">{r.label}</dt>
                <dd className={cn('mt-0.5 break-words text-[14.5px] tabular-nums', r.strong ? 'font-bold text-white' : 'font-medium text-white/85')}>{r.value}</dd>
              </div>
              {r.copy && (
                <button
                  type="button"
                  onClick={() => copy(r.value)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-lime hover:text-ink"
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
  const packs = usePacksLabel();
  const workDays = useWorkDays();
  const copy = useCopy();
  const view = useOrderTotalsView(order);
  const products = useDb((s) => s.products);
  const addToCart = useUi((s) => s.addToCart);
  const setCartOpen = useUi((s) => s.setCartOpen);
  usePageTitle(t('pageTitle'));

  const c = order.customer;
  const name = c.firstName.replace(/\*/g, '').trim() || c.lastName;
  const pickup = order.delivery.method === 'pickup';
  const hasLogo = order.items.some((i) => i.installation);
  const zone = zoneForCity(settings, c.city);
  const fullAddress = [c.address, c.city].filter(Boolean).join(', ');
  const pickupLoc = (settings.locations ?? []).find((x) => x.pickup && x.isDefault) ?? (settings.locations ?? []).find((x) => x.pickup);
  const pickupPlace = pickupLoc?.name ?? settings.companyName;
  const pickupAddress = pickupLoc ? [pickupLoc.address, pickupLoc.city].filter(Boolean).join(', ') : settings.pickupAddress;
  const preferred = order.delivery.date ? date(order.delivery.date, lang, { weekday: 'long', day: 'numeric', month: 'long' }) : null;
  const vatLine = c.note?.match(/Nr\. TVSH: (\d+)/)?.[1];

  const deliveryStep: StepItem = pickup
    ? { icon: Warehouse, title: t('dPickup'), when: preferred ?? t('dWhenPickup'), text: t('dPickupText', { place: pickupPlace, address: pickupAddress }) }
    : { icon: Truck, title: t('dDelivery'), when: preferred ?? workDays(zone?.days ?? '1–3'), text: t('dDeliveryText', { address: fullAddress }) };

  const steps: StepItem[] = [
    { icon: PhoneCall, title: t('n1'), when: t('n1when'), text: t('n1text', { phone: c.phone }) },
    ...(hasLogo
      ? [
          { icon: PenTool, title: t('pProof'), when: t('pProofWhen'), text: t('pProofText', { email: settings.email }), tone: 'logo' as const },
          { icon: BadgeCheck, title: t('pApprove'), when: t('pApproveWhen'), text: t('pApproveText'), tone: 'logo' as const },
          { icon: Stamp, title: t('pPrint'), when: t('pPrintWhen'), text: t('pPrintText'), tone: 'logo' as const },
        ]
      : [{ icon: PackageCheck, title: t('pPrep'), when: order.payment.method === 'bank' ? t('pPrepWhenBank') : t('pPrepWhen'), text: t('pPrepText') }]),
    deliveryStep,
  ];

  const PayIcon = { cod: Banknote, bank: Landmark, card: CreditCard }[order.payment.method];
  const payNote =
    order.payment.method === 'card'
      ? t('cardNote', { amount: money(order.total, lang) })
      : order.payment.method === 'cod'
        ? t(pickup ? 'codNotePickup' : 'codNote', { amount: money(order.total, lang) })
        : null;

  const reorder = () => {
    let added = 0;
    for (const it of order.items) {
      const p = products.find((x) => x.id === it.productId && x.status === 'active');
      if (!p || p.quoteOnly) continue;
      addToCart({ productId: p.id, qty: it.qty, options: {}, installation: it.installation && !!p.installation?.available });
      added++;
    }
    if (added) {
      toast.success(t('reordered'));
      setCartOpen(true);
    }
  };

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-white/80 to-paper">
        <Confetti />
        <div className="container-x relative flex flex-col items-center pb-14 pt-8 text-center sm:pb-16 sm:pt-10">
          <CheckoutSteps current={4} className="mb-10 sm:mb-12" />
          <SuccessCheck />
          <div className="eyebrow mt-7 animate-fade-up [animation-delay:250ms]">{t('eyebrow')}</div>
          <h1 className="display mt-3 animate-fade-up text-[42px] leading-[1.02] text-ink [animation-delay:320ms] sm:text-[64px]">
            <Accent text={t('thanks', { name })} />
          </h1>
          <p className="mt-4 max-w-xl animate-fade-up text-[16px] leading-relaxed text-muted [animation-delay:400ms] sm:text-[17px]">
            {t('lead')
              .split('{email}')
              .flatMap((part, i) => (i === 0 ? [part] : [<strong key={i} className="font-semibold text-ink">{c.email}</strong>, part]))}
          </p>
          <div className="mt-7 inline-flex animate-fade-up items-center gap-3 rounded-full border-2 border-dashed border-ink/20 bg-white py-1.5 pl-5 pr-1.5 shadow-[0_10px_30px_-18px_rgba(15,29,22,0.45)] [animation-delay:480ms]">
            <span className="text-[13px] text-muted">{t('orderNo')}</span>
            <span className="display text-[20px] tracking-wide text-ink">{order.number}</span>
            <button type="button" onClick={() => copy(order.number)} className="grid h-9 w-9 place-items-center rounded-full bg-lime text-ink transition-colors hover:bg-ink hover:text-lime" aria-label={tk('copy')} title={tk('copy')}>
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 animate-fade-up text-[12.5px] text-muted [animation-delay:520ms]">{t('placedAt', { date: dateTime(order.createdAt, lang) })}</p>
        </div>
      </section>

      <div className="container-x grid items-start gap-8 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12 xl:gap-16">
        <div className="min-w-0 space-y-6">
          {order.payment.method === 'bank' && <BankBox order={order} />}

          {/* What happens next */}
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

          {/* Delivery · payment · contact */}
          <section className="grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line sm:grid-cols-3">
            <div className="bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                {pickup ? <Warehouse className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                {t('deliveryTo')}
              </div>
              <p className="mt-2 text-[14px] font-semibold text-ink">{tc(`delivery_${order.delivery.method}`)}</p>
              <p className="mt-1 text-[13.5px] leading-snug text-muted">{pickup ? `${pickupPlace} · ${pickupAddress}` : fullAddress}</p>
              {preferred && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-soft">
                  <CalendarDays className="h-3.5 w-3.5 text-brand-600" />
                  {t('preferred', { date: preferred })}
                </p>
              )}
            </div>
            <div className="bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                <PayIcon className="h-3.5 w-3.5" />
                {t('payment')}
              </div>
              <p className="mt-2 text-[14px] font-semibold text-ink">{tc(`pay_${order.payment.method}`)}</p>
              <Badge tone={order.payment.status === 'paid' ? 'green' : order.payment.status === 'refunded' ? 'gray' : 'amber'} dot className="mt-2">
                {tc(`paystatus_${order.payment.status}`)}
              </Badge>
            </div>
            <div className="bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                <PhoneCall className="h-3.5 w-3.5" />
                {t('contact')}
              </div>
              <p className="mt-2 text-[14px] font-semibold text-ink">
                {c.firstName} {c.lastName}
              </p>
              <p className="mt-1 break-words text-[13.5px] leading-snug text-muted">
                {c.phone}
                <br />
                {c.email}
              </p>
              {c.company && (
                <p className="mt-2 break-words text-[12.5px] leading-snug text-ink-soft">
                  <span className="font-semibold">{c.company}</span>
                  {c.pib && <span className="block">NUI {c.pib}</span>}
                  {vatLine && <span className="block">Nr. TVSH {vatLine}</span>}
                </p>
              )}
            </div>
          </section>

          {payNote && (
            <p
              className={cn(
                'flex items-start gap-2.5 rounded-2xl px-4 py-3.5 text-[13.5px] leading-snug ring-1 ring-inset',
                order.payment.method === 'card' ? 'bg-lime-soft/70 text-ink ring-lime-ink/15' : 'bg-white text-ink-soft ring-line',
              )}
            >
              {order.payment.method === 'card' ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> : <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />}
              {payNote}
            </p>
          )}

          {/* Reorder */}
          <section className="flex flex-col gap-4 rounded-3xl border-2 border-dashed border-ink/15 bg-white/70 p-5 sm:flex-row sm:items-center sm:p-6">
            <span className="grid h-12 w-12 shrink-0 rotate-[-6deg] place-items-center rounded-2xl bg-lime text-ink">
              <Repeat className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15.5px] font-bold text-ink">{t('reorderTitle')}</h3>
              <p className="mt-0.5 text-[13.5px] leading-snug text-muted">{t('reorderText', { n: order.number })}</p>
            </div>
            <Button variant="dark" size="sm" icon={<Repeat className="h-3.5 w-3.5" />} onClick={reorder} className="self-start sm:self-center">
              {t('reorderCta')}
            </Button>
          </section>

          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink to="/produktet" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              {t('continue')}
            </ButtonLink>
            <ButtonLink to="/" size="lg" variant="outline" icon={<Home className="h-4 w-4" />}>
              {t('home')}
            </ButtonLink>
          </div>

          <Link
            to={`/admin/narudzbe/${order.id}`}
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
              <h2 className="text-[15px] font-bold text-ink">
                {t('summary')} <span className="font-medium text-muted">· {items(order.items.length)}</span>
              </h2>
              <span className="text-[13px] font-semibold text-muted">{order.number}</span>
            </div>
            <ul className="divide-y divide-dashed divide-line px-6">
              {order.items.map((it, i) => {
                const isPack = it.unit === 'pack' && !!it.packSize;
                const logo = it.installation ? Math.round(it.installationPrice * it.qty * 100) / 100 : 0;
                return (
                  <li key={i} className="flex gap-3.5 py-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand ring-1 ring-line">{it.image && <Img src={it.image} small alt="" className="h-full w-full object-cover" />}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">{it.name}</p>
                        <span className="shrink-0 text-[13.5px] font-semibold tabular-nums text-ink">{money(it.lineTotal, lang)}</span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {isPack ? `${packs(it.qty)} · ${pieces(it.qty * it.packSize!, lang)}` : `${it.qty} ${unitLabel(it.unit, lang)}`}
                        {isPack && <span className="text-muted/80"> · {tk('perPiece', { price: moneyPiece(it.unitPrice / it.packSize!, lang) })}</span>}
                        {it.options && <span className="block truncate">{it.options}</span>}
                      </p>
                      {(!!it.tierPct || logo > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {!!it.tierPct && <span className="rounded-md bg-lime px-1.5 py-0.5 text-[11px] font-bold text-ink">{tk('tierBadge', { pct: it.tierPct })}</span>}
                          {logo > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-pink-soft px-1.5 py-0.5 text-[11px] font-bold text-pink-ink">
                              <Stamp className="h-3 w-3" />
                              {tk('plusLogo', { amount: money(logo, lang) })}
                            </span>
                          )}
                        </div>
                      )}
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
