import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Banknote, Boxes, Check, CreditCard, FileCheck2, FileText, Gift, Landmark, MapPin, Package, Palette, PenTool,
  Phone, Printer, Receipt, Stamp, Store, Truck, Upload,
} from 'lucide-react';
import { Accent, Accordion, Img, Reveal } from '@/components/ui/misc';
import { Button, ButtonLink } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/brand/Social';
import { PageHero, SectionHeading } from '@/site/components/SectionHeading';
import { MeasureForm } from '@/site/components/MeasureForm';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { ACCENT_ON_DARK, C, IndustryStrip, Sticker } from '@/site/components/company/Blocks';
import { pad2, scrollToId, telHref, useHomeData, useStoreFacts, waHref } from '@/site/components/company/data';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { piecesPerUnit, tierPct, tiersOf, unitPrice } from '@/lib/pricing';
import { cartonLabel, money, moneyPiece, num, pieces, unitLabel } from '@/lib/format';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    eyebrow: 'Za biznis',
    title: 'Ambalaža koja radi *za vaš biznis*',
    subtitle: 'Štampa vašeg logotipa, veleprodajne cijene po pakovanju i kartonu, besplatni uzorci i brza dostava širom Kosova — sve na jednom mjestu.',
    heroFact1: 'Dostava za 24h u Mitrovici',
    heroFact2: 'Faktura sa NUI i PDV brojem',
    heroFact3: 'Besplatni uzorci za lokale',
    index: 'Usluge za biznis',
    s1: 'Štampa logotipa',
    s2: 'Veleprodajne cijene',
    s3: 'Besplatni uzorci',
    s4: 'Brza dostava',
    s5: 'Faktura za firme',
    // logo print
    p_title: 'Vaš logo na *svakoj čaši*',
    p_text: 'Čaša sa vašim logom putuje sa svakim kupcem — na ulicu, u kancelariju, na Instagram. Štampamo jednobojne i dvobojne logotipe na čašama i ambalaži, od jednog kartona.',
    p_s1: 'Pošaljite logo',
    p_s1x: 'PNG, PDF ili AI — i kakvu ambalažu želite.',
    p_s2: 'Probni dizajn',
    p_s2x: 'Šaljemo vizuelni prikaz na proizvodu.',
    p_s3: 'Odobrenje',
    p_s3x: 'Potvrđujete dizajn, količinu i cijenu.',
    p_s4: 'Izrada 7–10 dana',
    p_s4x: 'Radnih dana od odobrenja, zatim dostava.',
    p_moq: 'Minimalna količina',
    p_moqx: '1 karton po proizvodu — npr. {pieces} čaša F95.',
    p_on: 'Sa štampom',
    p_onReq: 'Na upit',
    p_onReqx: 'papirne čaše, kraft kutije, naljepnice',
    p_perPack: '+{price} / pak.',
    // wholesale
    w_title: 'Što više, *to jeftinije*',
    w_text: 'Sve prodajemo po pakovanju, a cijenu po komadu uvijek vidite. Popust za količinu se računa sam u korpi — po proizvodu, bez koda.',
    w_b1: 'Pakovanje',
    w_b1x: 'Najmanja jedinica — npr. 50 čaša.',
    w_b2: 'Karton',
    w_b2x: 'Puni karton iz magacina — najbolja cijena.',
    w_b3: 'Popust za količinu',
    w_b3x: 'Automatski u korpi, za svaku stavku.',
    w_example: 'Pravi primjer iz kataloga',
    w_qty: 'Količina',
    w_pack: 'Cijena / pak.',
    w_piece: 'Po komadu',
    w_total: 'Ukupno',
    w_carton: '1 karton ({n} pak.)',
    w_packs: '{n} pak.',
    w_pack1: '1 pakovanje',
    w_save: 'Ušteda {amount}',
    w_note: 'Cijene sa PDV-om. Za veće mjesečne količine pripremamo posebnu ponudu.',
    w_shop: 'Pogledaj čaše',
    // samples
    m_title: 'Probajte prije *nego naručite*',
    m_text: 'Provjerite kvalitet, zapreminu i da li poklopac dobro naliježe — prije nego naručite karton. Uzorke pripremamo besplatno za kafiće, restorane i ketering.',
    m_b1: 'Izaberite kategorije koje vas zanimaju',
    m_b2: 'Preuzmite ih u magacinu ili ih donosimo u lokal',
    m_b3: 'Bez obaveze kupovine',
    // delivery
    d_title: 'Brza dostava *širom Kosova*',
    d_text: 'Narudžbe pakujemo u našem magacinu u Mitrovici i šaljemo isti ili sljedeći dan. Cijena dostave zavisi od zone.',
    d_free: 'Besplatna dostava za narudžbe od {amount}',
    d_day1: 'u roku od 24h',
    d_days: '{d} radna dana',
    d_more: '+{n} mjesta',
    d_pickup: 'Preuzimanje u magacinu',
    d_pickupx: 'Besplatno — narudžba spremna za 2 sata.',
    d_region: 'Dostava i u Albaniju, Sjevernu Makedoniju i Crnu Goru — na upit.',
    d_fee: 'Dostava',
    // invoice
    f_title: 'Faktura sa *NUI i PDV-om*',
    f_text: 'Za svaku narudžbu firme izdajemo fakturu sa vašim NUI i PDV brojem — dovoljno ih je unijeti pri plaćanju. Cijene uključuju PDV {vat} %.',
    f_b1: 'Plaćanje pouzećem',
    f_b2: 'Bankovni transfer (predračun)',
    f_b3: 'Platna kartica',
    f_invoice: 'Faktura',
    f_seller: 'Prodavac',
    f_buyer: 'Kupac',
    f_buyerName: 'Vaš lokal d.o.o.',
    f_nui: 'NUI',
    f_vatNo: 'Br. PDV',
    f_vat: 'PDV {vat} %',
    f_total: 'Ukupno',
    f_sticker: 'NUI ✓ PDV ✓',
    // faq + form
    faqHelp: 'Imate pitanje koje nije na listi? Pozovite nas ili pišite na WhatsApp.',
    lead_eyebrow: 'Počnite ovdje',
    lead_title: 'Uzorci ili ponuda — *vi birate*',
    lead_samples: 'Besplatni uzorci',
    lead_quote: 'Veleprodaja / logo',
    lead_s1: 'Uzorak iz svake izabrane kategorije',
    lead_s2: 'Spremno za 1–2 radna dana',
    lead_s3: 'Preuzimanje u magacinu ili dostava',
    lead_q1: 'Ponuda u roku od 24 sata',
    lead_q2: 'Cijene po kartonu i mjesečnoj količini',
    lead_q3: 'Probni dizajn za štampu logotipa',
    preferPhone: 'Radije telefonom?',
    soon: 'Uskoro',
  },
  sq: {
    eyebrow: 'Për biznese',
    title: 'Paketim që punon *për biznesin tuaj*',
    subtitle: 'Printim me logon tuaj, çmime shumice me pako dhe karton, mostra falas dhe dërgesë e shpejtë në gjithë Kosovën — gjithçka në një vend.',
    heroFact1: 'Dërgesë 24h në Mitrovicë',
    heroFact2: 'Faturë me NUI dhe nr. TVSH',
    heroFact3: 'Mostra falas për lokale',
    index: 'Shërbimet për biznese',
    s1: 'Printim me logo',
    s2: 'Çmime shumice',
    s3: 'Mostra falas',
    s4: 'Dërgesë e shpejtë',
    s5: 'Faturë për biznese',
    p_title: 'Logoja juaj në *çdo gotë*',
    p_text: 'Gota me logon tuaj udhëton me çdo klient — në rrugë, në zyrë, në Instagram. Printojmë logo me një ose dy ngjyra në gota dhe paketime, që nga një karton.',
    p_s1: 'Dërgoni logon',
    p_s1x: 'PNG, PDF ose AI — dhe çfarë paketimi dëshironi.',
    p_s2: 'Dizajni provë',
    p_s2x: 'Ju dërgojmë pamjen vizuale mbi produkt.',
    p_s3: 'Aprovimi',
    p_s3x: 'Konfirmoni dizajnin, sasinë dhe çmimin.',
    p_s4: 'Prodhimi 7–10 ditë',
    p_s4x: 'Ditë pune nga aprovimi, pastaj dërgesa.',
    p_moq: 'Sasia minimale',
    p_moqx: '1 karton për produkt — p.sh. {pieces} gota F95.',
    p_on: 'Me printim',
    p_onReq: 'Me kërkesë',
    p_onReqx: 'gota letre, kuti kraft, etiketa',
    p_perPack: '+{price} / pako',
    w_title: 'Sa më shumë, *aq më lirë*',
    w_text: 'Gjithçka shitet me pako dhe çmimin për copë e shihni gjithmonë. Zbritja për sasi llogaritet vetë në shportë — për çdo produkt, pa kod.',
    w_b1: 'Pako',
    w_b1x: 'Njësia më e vogël — p.sh. 50 gota.',
    w_b2: 'Karton',
    w_b2x: 'Karton i plotë nga depoja — çmimi më i mirë.',
    w_b3: 'Zbritje për sasi',
    w_b3x: 'Automatikisht në shportë, për çdo rresht.',
    w_example: 'Shembull real nga katalogu',
    w_qty: 'Sasia',
    w_pack: 'Çmimi / pako',
    w_piece: 'Për copë',
    w_total: 'Totali',
    w_carton: '1 karton ({n} pako)',
    w_packs: '{n} pako',
    w_pack1: '1 pako',
    w_save: 'Kurseni {amount}',
    w_note: 'Çmimet me TVSH. Për sasi të mëdha mujore përgatisim ofertë të veçantë.',
    w_shop: 'Shiko gotat',
    m_title: 'Provojeni para *se ta porosisni*',
    m_text: 'Kontrolloni cilësinë, kapacitetin dhe a mbyllet mirë kapaku — para se të porosisni kartonin. Mostrat i përgatisim falas për kafiteri, restorante dhe catering.',
    m_b1: 'Zgjidhni kategoritë që ju interesojnë',
    m_b2: 'I merrni në depo ose ua sjellim në lokal',
    m_b3: 'Pa detyrim blerjeje',
    d_title: 'Dërgesë e shpejtë *në gjithë Kosovën*',
    d_text: 'Porositë i paketojmë në depon tonë në Mitrovicë dhe i nisim të njëjtën ditë ose të nesërmen. Çmimi i dërgesës varet nga zona.',
    d_free: 'Dërgesë falas për porosi mbi {amount}',
    d_day1: 'brenda 24 orëve',
    d_days: '{d} ditë pune',
    d_more: '+{n} vende',
    d_pickup: 'Marrje në depo',
    d_pickupx: 'Falas — porosia gati për 2 orë.',
    d_region: 'Shqipëri, Maqedoni e Veriut dhe Mal i Zi — me kërkesë.',
    d_fee: 'Dërgesa',
    f_title: 'Faturë me *NUI dhe TVSH*',
    f_text: 'Për çdo porosi biznesi lëshojmë faturë me NUI-n dhe numrin tuaj të TVSH-së — mjafton t’i shkruani në pagesë. Çmimet përfshijnë TVSH {vat} %.',
    f_b1: 'Para në dorë në dorëzim',
    f_b2: 'Transfer bankar (profaturë)',
    f_b3: 'Kartelë pagese',
    f_invoice: 'Faturë',
    f_seller: 'Shitësi',
    f_buyer: 'Blerësi',
    f_buyerName: 'Lokali juaj sh.p.k.',
    f_nui: 'NUI',
    f_vatNo: 'Nr. TVSH',
    f_vat: 'TVSH {vat} %',
    f_total: 'Totali',
    f_sticker: 'NUI ✓ TVSH ✓',
    faqHelp: 'Keni një pyetje që nuk është në listë? Na telefononi ose na shkruani në WhatsApp.',
    lead_eyebrow: 'Filloni këtu',
    lead_title: 'Mostra apo ofertë — *zgjidhni ju*',
    lead_samples: 'Mostra falas',
    lead_quote: 'Shumicë / logo',
    lead_s1: 'Mostër nga çdo kategori e zgjedhur',
    lead_s2: 'Gati brenda 1–2 ditësh pune',
    lead_s3: 'Marrje në depo ose me dërgesë',
    lead_q1: 'Oferta brenda 24 orëve',
    lead_q2: 'Çmime sipas kartonit dhe sasisë mujore',
    lead_q3: 'Dizajn provë për printimin me logo',
    preferPhone: 'Preferoni telefonin?',
    soon: 'Së shpejti',
  },
  en: {
    eyebrow: 'For business',
    title: 'Packaging that works *for your business*',
    subtitle: 'Your logo printed, wholesale prices by the pack and carton, free samples and fast delivery across Kosovo — all in one place.',
    heroFact1: '24h delivery in Mitrovica',
    heroFact2: 'Invoices with business & VAT no.',
    heroFact3: 'Free samples for venues',
    index: 'Services for business',
    s1: 'Logo print',
    s2: 'Wholesale prices',
    s3: 'Free samples',
    s4: 'Fast delivery',
    s5: 'Business invoices',
    p_title: 'Your logo on *every cup*',
    p_text: 'A cup with your logo travels with every customer — down the street, into the office, onto Instagram. We print one- and two-colour logos on cups and packaging, from a single carton.',
    p_s1: 'Send your logo',
    p_s1x: 'PNG, PDF or AI — plus the packaging you want.',
    p_s2: 'Proof',
    p_s2x: 'We send a visual of the design on the product.',
    p_s3: 'Approval',
    p_s3x: 'You confirm design, quantity and price.',
    p_s4: 'Production 7–10 days',
    p_s4x: 'Working days from approval, then delivery.',
    p_moq: 'Minimum order',
    p_moqx: '1 carton per product — e.g. {pieces} F95 cups.',
    p_on: 'Printable',
    p_onReq: 'On request',
    p_onReqx: 'paper cups, kraft boxes, labels',
    p_perPack: '+{price} / pack',
    w_title: 'The more you order, *the less you pay*',
    w_text: 'Everything is sold by the pack and you always see the price per piece. Volume discounts apply automatically in the cart — per product, no code needed.',
    w_b1: 'Pack',
    w_b1x: 'The smallest unit — e.g. 50 cups.',
    w_b2: 'Carton',
    w_b2x: 'A full carton from the warehouse — best price.',
    w_b3: 'Volume discount',
    w_b3x: 'Automatic in the cart, on every line.',
    w_example: 'A real example from the catalogue',
    w_qty: 'Quantity',
    w_pack: 'Price / pack',
    w_piece: 'Per piece',
    w_total: 'Total',
    w_carton: '1 carton ({n} packs)',
    w_packs: '{n} packs',
    w_pack1: '1 pack',
    w_save: 'You save {amount}',
    w_note: 'Prices incl. VAT. For large monthly volumes we prepare a custom quote.',
    w_shop: 'Shop cups',
    m_title: 'Try it before *you order*',
    m_text: 'Check the quality, the capacity and how well the lid fits — before you order a carton. Samples are free for cafés, restaurants and caterers.',
    m_b1: 'Pick the categories you’re interested in',
    m_b2: 'Collect them at the warehouse or we bring them over',
    m_b3: 'No obligation to buy',
    d_title: 'Fast delivery *across Kosovo*',
    d_text: 'Orders are packed in our warehouse in Mitrovica and dispatched the same or the next day. The delivery fee depends on the zone.',
    d_free: 'Free delivery on orders over {amount}',
    d_day1: 'within 24 hours',
    d_days: '{d} working days',
    d_more: '+{n} places',
    d_pickup: 'Warehouse pickup',
    d_pickupx: 'Free — your order is ready in 2 hours.',
    d_region: 'Albania, North Macedonia and Montenegro — on request.',
    d_fee: 'Delivery',
    f_title: 'Invoices with *business & VAT no.*',
    f_text: 'Every business order comes with an invoice showing your business number (NUI) and VAT number — just enter them at checkout. Prices include {vat}% VAT.',
    f_b1: 'Cash on delivery',
    f_b2: 'Bank transfer (pro-forma)',
    f_b3: 'Payment card',
    f_invoice: 'Invoice',
    f_seller: 'Seller',
    f_buyer: 'Buyer',
    f_buyerName: 'Your venue LLC',
    f_nui: 'Business no.',
    f_vatNo: 'VAT no.',
    f_vat: 'VAT {vat}%',
    f_total: 'Total',
    f_sticker: 'NUI ✓ VAT ✓',
    faqHelp: 'Got a question that isn’t listed? Call us or message us on WhatsApp.',
    lead_eyebrow: 'Start here',
    lead_title: 'Samples or a quote — *your call*',
    lead_samples: 'Free samples',
    lead_quote: 'Wholesale / logo',
    lead_s1: 'A sample from every category you pick',
    lead_s2: 'Ready within 1–2 working days',
    lead_s3: 'Warehouse pickup or delivery',
    lead_q1: 'A quote within 24 hours',
    lead_q2: 'Prices per carton and monthly volume',
    lead_q3: 'A proof for your logo print',
    preferPhone: 'Prefer to call?',
    soon: 'Coming soon',
  },
});

type Lead = 'measurement' | 'quote';

const SECTIONS = [
  { id: 'printim', key: 's1', icon: Printer },
  { id: 'shumice', key: 's2', icon: Boxes },
  { id: 'mostra-falas', key: 's3', icon: Gift },
  { id: 'dergesa', key: 's4', icon: Truck },
  { id: 'fatura', key: 's5', icon: Receipt },
] as const;

/** Section shell: big number, title, text, extras — with an optional photo column. */
function Row({ id, n, total, title, text, image, flip, children }: { id: string; n: number; total: number; title: string; text: string; image?: string; flip?: boolean; children?: ReactNode }) {
  const body = (
    <Reveal delay={image ? 120 : 0} className={cn(flip && image && 'lg:order-1')}>
      <div className="flex items-center gap-3">
        <span className="display text-[15px] text-brand-600">{pad2(n)}</span>
        <span className="h-px w-10 bg-brand-600/30" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
          {pad2(n)} / {pad2(total)}
        </span>
      </div>
      <h2 className="display mt-4 text-[34px] leading-[1.04] text-ink sm:text-[46px]">
        <Accent text={title} />
      </h2>
      <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-muted">{text}</p>
      {children}
    </Reveal>
  );
  if (!image) return <article id={id} className="scroll-mt-28">{body}</article>;
  return (
    <article id={id} className="grid scroll-mt-28 items-start gap-10 lg:grid-cols-2 lg:gap-20">
      <Reveal className={cn('relative lg:sticky lg:top-28', flip && 'lg:order-2')}>
        <div className={cn('absolute inset-0 rounded-[32px] border-2 border-dashed border-brand-600/25', flip ? '-translate-x-3 translate-y-3 sm:-translate-x-5 sm:translate-y-5' : 'translate-x-3 translate-y-3 sm:translate-x-5 sm:translate-y-5')} />
        <div className="group relative aspect-[4/3] overflow-hidden rounded-[28px] bg-sand-2 lg:aspect-[5/4]">
          <Img src={image} alt="" className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
        </div>
      </Reveal>
      {body}
    </article>
  );
}

function CheckList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((b) => (
        <li key={b} className="flex items-start gap-3 text-[15px] leading-snug text-ink-soft">
          <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          {b}
        </li>
      ))}
    </ul>
  );
}

/** The wholesale ladder for one real product: 1 pack → each volume tier, computed with the cart's own pricing. */
function TierExample({ product }: { product: Product }) {
  const t = useDict(T);
  const l = useL();
  const lang = useLang();
  const per = piecesPerUnit(product);
  const qtys = [1, ...tiersOf(product).map((x) => x.minQty)];
  const base = unitPrice(product, {}, 1);
  const rows = qtys.map((q) => {
    const unit = unitPrice(product, {}, q);
    return { q, unit, total: unit * q, piece: unit / per, pct: tierPct(product, q), save: (base - unit) * q };
  });
  return (
    <div className="mt-8 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
      <div className="flex items-center gap-4 border-b border-dashed border-line p-4 sm:p-5">
        <Link to={`/produkt/${product.slug}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-sand">
          <Img src={product.images[0]} small alt="" className="h-full w-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">{t('w_example')}</div>
          <Link to={`/produkt/${product.slug}`} className="mt-1 block truncate font-bold text-ink hover:text-brand-700">
            {l(product.name)}
          </Link>
          <div className="mt-0.5 text-[12.5px] text-muted">
            {product.sku} · {pieces(per, lang)} / {unitLabel(product.unit, lang)}
            {product.cartonPacks ? ` · ${cartonLabel(1, lang)}: ${pieces(product.cartonPacks * per, lang)}` : ''}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13.5px] sm:text-[14px]">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-bold sm:px-5">{t('w_qty')}</th>
              <th className="hidden px-3 py-3 text-right font-bold sm:table-cell">{t('w_pack')}</th>
              <th className="px-3 py-3 text-right font-bold">{t('w_piece')}</th>
              <th className="px-4 py-3 text-right font-bold sm:px-5">{t('w_total')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const last = i === rows.length - 1;
              return (
                <tr key={r.q} className={cn('border-t border-line', last && 'bg-lime-soft/60')}>
                  <td className="px-4 py-3.5 sm:px-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-ink">{product.cartonPacks && r.q === product.cartonPacks ? t('w_carton', { n: r.q }) : r.q === 1 ? t('w_pack1') : t('w_packs', { n: r.q })}</span>
                      {r.pct > 0 && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-extrabold text-lime">−{r.pct}%</span>}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">{pieces(r.q * per, lang)}</div>
                  </td>
                  <td className="hidden px-3 py-3.5 text-right tabular-nums text-ink-soft sm:table-cell">{money(r.unit, lang)}</td>
                  <td className={cn('px-3 py-3.5 text-right font-semibold tabular-nums', r.pct ? 'text-brand-700' : 'text-ink')}>{moneyPiece(r.piece, lang)}</td>
                  <td className="px-4 py-3.5 text-right sm:px-5">
                    <div className="font-bold tabular-nums text-ink">{money(r.total, lang)}</div>
                    {r.save > 0.004 && <div className="text-[12px] font-semibold text-brand-700">{t('w_save', { amount: money(r.save, lang) })}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line bg-paper/60 px-5 py-3 text-[12.5px] text-muted">{t('w_note')}</p>
    </div>
  );
}

export default function Services() {
  const ts = useDict(site);
  const t = useDict(T);
  const tc = useDict(C);
  const l = useL();
  const lang = useLang();
  const settings = useSettings();
  const products = useDb((s) => s.products);
  const categories = useDb((s) => s.categories);
  const facts = useStoreFacts();
  const faq = useHomeData('faq');
  usePageTitle(ts('nav_services'));

  const [lead, setLead] = useState<Lead>(() => (typeof window !== 'undefined' && window.location.hash === '#oferta' ? 'quote' : 'measurement'));
  const [logoPick, setLogoPick] = useState(false);
  const openLead = (type: Lead, logo = false) => {
    setLead(type);
    setLogoPick(logo);
    scrollToId('forma');
  };

  const example = useMemo(() => {
    const live = products.filter((p) => p.status === 'active' && !p.quoteOnly && p.unit === 'pack' && tiersOf(p).length > 0);
    return live.find((p) => p.id === 'p-gota-f95-400') ?? [...live].sort((a, b) => b.sold - a.sold)[0];
  }, [products]);
  const cupsCat = categories.find((c) => c.id === 'cat-gota');
  const moqCup = facts.logoProducts.find((p) => p.cartonPacks && p.packSize) ?? example;
  const moqPieces = moqCup?.cartonPacks && moqCup.packSize ? moqCup.cartonPacks * moqCup.packSize : 1000;
  const quoteCats = categories.filter((c) => facts.quoteProducts.some((p) => p.categoryId === c.id));
  const wa = waHref(settings.whatsapp);
  const pay = [
    settings.payments.cod && { icon: Banknote, label: t('f_b1') },
    settings.payments.bank && { icon: Landmark, label: t('f_b2') },
    settings.payments.card && { icon: CreditCard, label: t('f_b3') },
  ].filter(Boolean) as { icon: typeof Banknote; label: string }[];

  const pSteps = [
    { icon: Upload, title: t('p_s1'), text: t('p_s1x') },
    { icon: PenTool, title: t('p_s2'), text: t('p_s2x') },
    { icon: BadgeCheck, title: t('p_s3'), text: t('p_s3x') },
    { icon: Stamp, title: t('p_s4'), text: t('p_s4x') },
  ];

  return (
    <>
      <PageHero image="/images/hero/kraft.webp" crumbs={[{ label: ts('nav_services') }]} eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')}>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button size="lg" variant="lime" onClick={() => openLead('measurement')} icon={<Gift className="h-4 w-4" />}>
            {tc('bookFree')}
          </Button>
          <Button size="lg" variant="outlineLight" onClick={() => openLead('quote')} iconRight={<ArrowRight className="h-4 w-4" />}>
            {tc('getQuote')}
          </Button>
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[13.5px] font-medium text-paper/80">
          {[
            { icon: Truck, text: t('heroFact1') },
            { icon: FileCheck2, text: t('heroFact2') },
            { icon: Gift, text: t('heroFact3') },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="inline-flex items-center gap-2">
              <Icon className="h-4 w-4 text-lime" /> {text}
            </li>
          ))}
        </ul>
      </PageHero>

      {/* Index — quick jump to each service */}
      <div className="container-x relative z-10 -mt-8 sm:-mt-10">
        <nav aria-label={t('index')} className="no-scrollbar flex overflow-x-auto rounded-3xl bg-white shadow-[0_30px_70px_-40px_rgba(15,29,22,0.5)] ring-1 ring-line lg:grid lg:grid-cols-5 lg:overflow-visible">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToId(s.id)}
                className={cn('group flex min-w-[170px] flex-1 items-center gap-3 px-5 py-5 text-left transition-colors hover:bg-paper lg:min-w-0', i > 0 && 'border-l border-line', i === 0 && 'rounded-l-3xl', i === SECTIONS.length - 1 && 'rounded-r-3xl')}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="display block text-[12px] text-brand-600">{pad2(i + 1)}</span>
                  <span className="block text-[14px] font-semibold leading-snug text-ink">{t(s.key)}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <section className="py-20 sm:py-28">
        <div className="container-x space-y-24 sm:space-y-32">
          {/* 01 — Logo print */}
          <Row id="printim" n={1} total={5} title={t('p_title')} text={t('p_text')} image="/images/s/printim.webp">
            <ol className="relative mt-8 space-y-0">
              {pSteps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < pSteps.length - 1 && <span aria-hidden className="absolute bottom-0 left-[21px] top-11 border-l-2 border-dashed border-brand-600/25" />}
                    <span className={cn('relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl', i === pSteps.length - 1 ? 'bg-lime text-ink' : 'bg-brand-600 text-white')}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="pt-1">
                      <div className="font-bold text-ink">{s.title}</div>
                      <div className="mt-0.5 text-[14.5px] text-muted">{s.text}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-8 grid gap-3 rounded-3xl border border-line bg-white/70 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-5 sm:p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-soft text-pink-ink">
                <Package className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{t('p_moq')}</div>
                <div className="mt-1 font-semibold text-ink">{t('p_moqx', { pieces: num(moqPieces, lang, 0) })}</div>
              </div>
            </div>
            {facts.logoProducts.length > 0 && (
              <div className="mt-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{t('p_on')}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {facts.logoProducts.map((p) => (
                    <Link key={p.id} to={`/produkt/${p.slug}`} className="group flex items-center gap-2.5 rounded-2xl border border-line bg-white p-1.5 pr-3 transition hover:border-brand-600/40 hover:shadow-[0_14px_30px_-22px_rgba(15,29,22,0.5)]">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-sand">
                        <Img src={p.images[0]} small alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-[12.5px] font-semibold leading-tight text-ink">{l(p.name)}</span>
                        {p.installation && <span className="mt-0.5 block text-[11.5px] font-bold text-brand-700">{t('p_perPack', { price: money(p.installation.price, lang) })}</span>}
                      </span>
                    </Link>
                  ))}
                </div>
                {quoteCats.length > 0 && (
                  <p className="mt-4 text-[14px] text-muted">
                    <span className="font-semibold text-ink">{t('p_onReq')}:</span> {t('p_onReqx')} —{' '}
                    {quoteCats.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && ', '}
                        <Link to={`/produktet/${c.slug}`} className="font-semibold text-brand-700 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-600">
                          {l(c.name)}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => openLead('quote', true)} icon={<Palette className="h-4 w-4" />}>
                {tc('logoQuote')}
              </Button>
            </div>
          </Row>

          {/* 02 — Wholesale */}
          <Row id="shumice" n={2} total={5} title={t('w_title')} text={t('w_text')} image="/images/s/shumice.webp" flip>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Package, title: t('w_b1'), text: t('w_b1x') },
                { icon: Boxes, title: t('w_b2'), text: t('w_b2x') },
                { icon: BadgeCheck, title: t('w_b3'), text: t('w_b3x') },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-line bg-white/70 p-4">
                  <Icon className="h-5 w-5 text-brand-600" />
                  <div className="mt-3 font-bold text-ink">{title}</div>
                  <div className="mt-1 text-[13.5px] leading-snug text-muted">{text}</div>
                </div>
              ))}
            </div>
            {example && <TierExample product={example} />}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="dark" onClick={() => openLead('quote')} iconRight={<ArrowRight className="h-4 w-4" />}>
                {tc('getQuote')}
              </Button>
              {cupsCat && (
                <ButtonLink to={`/produktet/${cupsCat.slug}`} variant="outline">
                  {t('w_shop')}
                </ButtonLink>
              )}
            </div>
          </Row>

          {/* 03 — Free samples */}
          <Row id="mostra-falas" n={3} total={5} title={t('m_title')} text={t('m_text')} image="/images/s/mostra.webp">
            <CheckList className="mt-8" items={[t('m_b1'), t('m_b2'), t('m_b3')]} />
            <div className="mt-8">
              <Button variant="lime" size="lg" onClick={() => openLead('measurement')} icon={<Gift className="h-4 w-4" />}>
                {tc('bookFree')}
              </Button>
            </div>
          </Row>

          {/* 04 — Delivery */}
          <article id="dergesa" className="scroll-mt-28">
            <Reveal className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <span className="display text-[15px] text-brand-600">04</span>
                  <span className="h-px w-10 bg-brand-600/30" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">04 / 05</span>
                </div>
                <h2 className="display mt-4 text-[34px] leading-[1.04] text-ink sm:text-[46px]">
                  <Accent text={t('d_title')} />
                </h2>
                <p className="mt-5 max-w-2xl text-[16.5px] leading-relaxed text-muted">{t('d_text')}</p>
              </div>
              {facts.freeFrom > 0 && (
                <div className="inline-flex items-center gap-3 self-start rounded-full bg-lime py-2 pl-2 pr-5 text-[14px] font-bold text-ink lg:self-end">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-lime">
                    <Truck className="h-4 w-4" />
                  </span>
                  {t('d_free', { amount: money(facts.freeFrom, lang, { decimals: facts.freeFrom % 1 !== 0 }) })}
                </div>
              )}
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {facts.zones.map((z, i) => {
                const shown = z.cities.slice(0, 5);
                return (
                  <Reveal key={z.id} delay={i * 80} className="h-full">
                    <div className="flex h-full flex-col rounded-3xl bg-white p-6 ring-1 ring-line">
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                          <MapPin className="h-5 w-5" />
                        </span>
                        <span className="display text-[30px] leading-none text-ink">{money(z.fee, lang, { decimals: z.fee % 1 !== 0 })}</span>
                      </div>
                      <h3 className="mt-5 text-[17px] font-bold leading-snug text-ink">{z.name}</h3>
                      <div className="mt-1 text-[13.5px] font-semibold text-brand-700">{z.days.trim() === '1' ? t('d_day1') : t('d_days', { d: z.days })}</div>
                      <p className="mt-4 border-t border-dashed border-line pt-4 text-[13px] leading-relaxed text-muted">
                        {shown.join(', ')}
                        {z.cities.length > shown.length && <span className="font-semibold text-ink-soft"> {t('d_more', { n: z.cities.length - shown.length })}</span>}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
              <Reveal delay={facts.zones.length * 80} className="h-full">
                <div className="flex h-full flex-col rounded-3xl bg-brand-700 p-6 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-lime">
                      <Store className="h-5 w-5" />
                    </span>
                    <span className="display text-[30px] leading-none text-lime">0 €</span>
                  </div>
                  <h3 className="mt-5 text-[17px] font-bold leading-snug">{t('d_pickup')}</h3>
                  <div className="mt-1 text-[13.5px] font-semibold text-white/75">{t('d_pickupx')}</div>
                  <p className="mt-4 border-t border-dashed border-white/20 pt-4 text-[13px] leading-relaxed text-white/70">{facts.pickup ? `${facts.pickup.name} · ${facts.pickup.address}` : settings.pickupAddress}</p>
                </div>
              </Reveal>
            </div>
            <p className="mt-5 inline-flex items-center gap-2 text-[13.5px] text-muted">
              <ArrowUpRight className="h-4 w-4 text-brand-600" />
              {t('d_region')}
            </p>
          </article>

          {/* 05 — Invoice */}
          <Row id="fatura" n={5} total={5} title={t('f_title')} text={t('f_text', { vat: settings.vatRate })}>
            <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
              <div className="relative">
                <div className="relative rotate-[-1.2deg] rounded-[26px] bg-white p-6 shadow-[0_40px_70px_-45px_rgba(15,29,22,0.55)] ring-1 ring-line sm:p-8">
                  <div className="flex items-start justify-between gap-4 border-b border-dashed border-line pb-5">
                    <div>
                      <div className="display text-[26px] leading-none text-ink">{t('f_invoice')}</div>
                      <div className="mt-1.5 font-mono text-[12px] text-muted">{settings.orderPrefix}1042</div>
                    </div>
                    <FileText className="h-7 w-7 text-brand-600" />
                  </div>
                  <div className="grid gap-5 py-5 text-[13px] sm:grid-cols-2">
                    <div>
                      <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted">{t('f_seller')}</div>
                      <div className="mt-1 font-bold text-ink">{settings.legalName}</div>
                      <div className="text-muted">
                        {t('f_nui')}: {settings.pib}
                      </div>
                      <div className="text-muted">
                        {t('f_vatNo')}: {settings.pdv}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted">{t('f_buyer')}</div>
                      <div className="mt-1 font-bold text-ink">{t('f_buyerName')}</div>
                      <div className="text-muted">{t('f_nui')}: 81•••••••</div>
                      <div className="text-muted">{t('f_vatNo')}: 33•••••••</div>
                    </div>
                  </div>
                  {example && (
                    <div className="space-y-2 border-t border-line pt-4 text-[13px]">
                      <div className="flex justify-between gap-4">
                        <span className="truncate text-ink-soft">
                          {example.cartonPacks ?? 10} × {l(example.name)}
                        </span>
                        <span className="tabular-nums text-ink">{money(unitPrice(example, {}, example.cartonPacks ?? 10) * (example.cartonPacks ?? 10), lang)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-muted">
                        <span>{t('f_vat', { vat: settings.vatRate })}</span>
                        <span className="tabular-nums">
                          {money(
                            (unitPrice(example, {}, example.cartonPacks ?? 10) * (example.cartonPacks ?? 10) * settings.vatRate) / (100 + settings.vatRate),
                            lang,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 border-t border-dashed border-line pt-3 text-[15px] font-bold text-ink">
                        <span>{t('f_total')}</span>
                        <span className="tabular-nums">{money(unitPrice(example, {}, example.cartonPacks ?? 10) * (example.cartonPacks ?? 10), lang)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <Sticker className="absolute -right-2 -top-3 sm:-right-4">{t('f_sticker')}</Sticker>
              </div>
              <div>
                <ul className="space-y-3">
                  {pay.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-4 rounded-2xl border border-line bg-white/70 p-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="font-semibold text-ink">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Row>
        </div>
      </section>

      {/* Industries */}
      <section className="border-y border-line bg-sand/50 py-20 sm:py-24">
        <div className="container-x">
          <IndustryStrip />
        </div>
      </section>

      {/* FAQ */}
      {faq && faq.items.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <Reveal>
              <SectionHeading eyebrow={l(faq.eyebrow)} title={l(faq.title)} />
              <p className="mt-5 max-w-sm text-[15.5px] leading-relaxed text-muted">{t('faqHelp')}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <a href={telHref(settings.phone)} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-ink-soft">
                  <Phone className="h-4 w-4" /> {settings.phone}
                </a>
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/15 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink/35">
                    <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> WhatsApp
                  </a>
                )}
              </div>
            </Reveal>
            <Reveal delay={120}>
              <Accordion items={faq.items.map((it) => ({ title: l(it.q), content: l(it.a) }))} />
            </Reveal>
          </div>
        </section>
      )}

      {/* Lead forms: samples / wholesale + logo quote */}
      <section id="forma" className={cn('scroll-mt-24 pb-8', !(faq && faq.items.length > 0) && 'pt-20 sm:pt-28')}>
        <span id="oferta" className="block scroll-mt-24" />
        <div className="container-x">
          <Reveal>
            <div className="grid gap-4 rounded-[36px] bg-sand/80 p-3 sm:p-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden rounded-[28px] bg-brand-800 p-7 sm:p-10">
                <Img key={lead} src={lead === 'quote' ? '/images/s/printim.webp' : '/images/s/mostra.webp'} alt="" className="absolute inset-0 -z-10 h-full w-full animate-fade-in object-cover" />
                <div className="absolute inset-0 -z-10 bg-brand-800/85 lg:bg-transparent lg:bg-gradient-to-t lg:from-brand-800 lg:from-35% lg:via-brand-800/70 lg:via-55% lg:to-brand-800/0" />
                <div className="eyebrow text-lime">{t('lead_eyebrow')}</div>
                <h2 className="display mt-3 text-[34px] leading-[1.04] text-white sm:text-[44px]">
                  <Accent text={t('lead_title')} accentClassName={ACCENT_ON_DARK} />
                </h2>
                <ul className="mt-6 space-y-2.5">
                  {(lead === 'quote' ? [t('lead_q1'), t('lead_q2'), t('lead_q3')] : [t('lead_s1'), t('lead_s2'), t('lead_s3')]).map((b) => (
                    <li key={b} className="flex items-center gap-3 text-[15px] font-medium text-white">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime text-ink">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 border-t border-white/15 pt-6">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">{t('preferPhone')}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={telHref(settings.phone)} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink transition hover:bg-sand">
                      <Phone className="h-4 w-4" /> {settings.phone}
                    </a>
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                        <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 ring-1 ring-line" role="tablist">
                  {(['measurement', 'quote'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={lead === k}
                      onClick={() => setLead(k)}
                      className={cn('inline-flex h-11 items-center justify-center gap-2 rounded-full text-[14px] font-semibold transition-colors', lead === k ? 'bg-brand-600 text-white' : 'text-ink-soft hover:text-ink')}
                    >
                      {k === 'quote' ? <Stamp className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                      {k === 'quote' ? t('lead_quote') : t('lead_samples')}
                    </button>
                  ))}
                </div>
                <MeasureForm key={`${lead}-${logoPick}`} type={lead} defaultLogo={logoPick} className="flex-1 shadow-none ring-0 lg:p-9" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
