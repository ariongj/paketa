import { defineDict } from '@/i18n';
import type { Lang } from '@/lib/types';

/** Strings shared by the cart drawer → cart page → checkout → confirmation flow (sq default, en, me = Serbian). */
export const ck = defineDict({
  me: {
    step_cart: 'Korpa',
    step_details: 'Podaci',
    step_payment: 'Plaćanje',
    step_done: 'Potvrda',
    stepsLabel: 'Koraci kupovine',
    items_one: '{n} proizvod',
    items_few: '{n} proizvoda',
    items_many: '{n} proizvoda',
    packs_one: '{n} pakovanje',
    packs_few: '{n} pakovanja',
    packs_many: '{n} pakovanja',

    /* cart line */
    perPiece: '{price}/kom',
    perPack: '{price} / pak.',
    packSize: '{n} kom/pak.',
    tierBadge: 'Veleprodajna cijena −{pct} %',
    nudge: 'Dodajte još {packs} i uštedite {pct} %',
    nudgeCarton: 'Dodajte još {packs} (pun karton) i uštedite {pct} %',
    nudgeBtn: 'Dodaj',
    addCarton: '+1 karton',
    addCartonTitle: 'Dodaj karton: {packs} · {pieces}',
    logoPerPack: '+{price} / pak.',
    logoNote: 'Rok izrade 7–10 radnih dana. Nakon narudžbe tražimo vaš logotip (PDF, AI ili PNG) i šaljemo probni prikaz na odobrenje.',
    logoAdd: 'Dodajte štampu vašeg logotipa',
    logoMin: 'Štampa logotipa: najmanje 1 karton ({packs})',
    logoFill: 'Dopuni karton',
    removeLine: 'Ukloni iz korpe',

    /* free delivery */
    shipLeft: 'Još {amount} do besplatne dostave',
    shipReached: 'Dostava je besplatna za ovu narudžbu!',
    shipPromise: 'Mitrovica 24 h · Kosovo 1–3 dana',
    shipRule: 'Besplatna dostava za narudžbe od {amount}',

    /* discount codes */
    couponLabel: 'Kodovi za popust',
    couponHave: 'Imate kod za popust?',
    couponPh: 'Unesite kod',
    couponApply: 'Primijeni',
    couponRemove: 'Ukloni kod {code}',
    couponApplied: 'Primijenjen',
    couponMulti: 'Možete unijeti više kodova — kombinujemo ih kada pravila to dozvoljavaju.',
    couponTry: 'Probajte:',
    couponDup: 'Kod „{code}“ je već unijet.',
    err_notfound: 'Kod „{code}“ ne postoji — provjerite da li je ispravno unijet.',
    err_inactive: 'Kod „{code}“ trenutno nije aktivan.',
    err_expired: 'Kod „{code}“ je istekao.',
    err_min: 'Važi za narudžbe od {amount} — dodajte još {left}.',
    err_minQty: 'Važi uz najmanje {amount} pak. — dodajte još {left}.',
    err_scheduled: 'Kod „{code}“ još ne važi.',
    err_notCombinable: 'Ne kombinuje se sa „{other}“ — zadržali smo povoljniji popust.',
    err_notEligible: 'Kod „{code}“ ne važi za proizvode u korpi.',
    err_notEligibleFor: 'Važi samo za: {what} — takvih proizvoda nema u korpi.',
    err_usageLimit: 'Kod „{code}“ je iskorišćen do kraja.',
    err_audience: 'Kod „{code}“ važi samo za odabrane kupce.',

    /* totals */
    free: 'Besplatno',
    from: 'od {amount}',
    shippingCalc: 'Tačan iznos nakon izbora grada',
    free_threshold: 'narudžba od {amount}',
    zoneNote: '{zone} · {days}',
    workDays_one: '{days} radni dan',
    workDays_many: '{days} radna dana',
    vatNote: 'TVSH {rate} % uračunat · {amount}',
    piecesTotal: 'Ukupno komada',
    discountFallback: 'Popust',

    /* trust */
    trust_secure: 'Sigurno plaćanje',
    trust_secureText: 'Pouzećem, uplatom na račun ili karticom — bez skrivenih troškova.',
    trust_fast: 'Brza dostava',
    trust_fastText: 'Mitrovica u roku od 24 h, cijelo Kosovo za 1–3 radna dana.',
    trust_invoice: 'Faktura za firme',
    trust_invoiceText: 'Faktura sa NUI brojem i TVSH-om, veleprodajne cijene po kartonu.',

    /* compact line */
    plusLogo: '+ logo {amount}',
    copied: 'Kopirano',
    copy: 'Kopiraj',
  },
  sq: {
    step_cart: 'Shporta',
    step_details: 'Të dhënat',
    step_payment: 'Pagesa',
    step_done: 'Konfirmimi',
    stepsLabel: 'Hapat e blerjes',
    items_one: '{n} produkt',
    items_few: '{n} produkte',
    items_many: '{n} produkte',
    packs_one: '{n} pako',
    packs_few: '{n} pako',
    packs_many: '{n} pako',

    perPiece: '{price}/copë',
    perPack: '{price} / pako',
    packSize: '{n} copë/pako',
    tierBadge: 'Çmim shumice −{pct} %',
    nudge: 'Shto {packs} dhe kurse {pct} %',
    nudgeCarton: 'Shto {packs} (karton i plotë) dhe kurse {pct} %',
    nudgeBtn: 'Shto',
    addCarton: '+1 karton',
    addCartonTitle: 'Shto një karton: {packs} · {pieces}',
    logoPerPack: '+{price} / pako',
    logoNote: 'Afati 7–10 ditë pune. Pas porosisë ju kërkojmë skedarin e logos (PDF, AI ose PNG) dhe ju dërgojmë provën për miratim.',
    logoAdd: 'Shto printimin e logos suaj',
    logoMin: 'Printimi me logo: minimumi 1 karton ({packs})',
    logoFill: 'Plotëso kartonin',
    removeLine: 'Hiqe nga shporta',

    shipLeft: 'Edhe {amount} deri te transporti falas',
    shipReached: 'Transporti për këtë porosi është falas!',
    shipPromise: 'Mitrovicë 24 orë · Kosovë 1–3 ditë',
    shipRule: 'Transport falas për porosi nga {amount}',

    couponLabel: 'Kodet e zbritjes',
    couponHave: 'Keni kod zbritjeje?',
    couponPh: 'Shkruani kodin',
    couponApply: 'Apliko',
    couponRemove: 'Hiq kodin {code}',
    couponApplied: 'U aplikua',
    couponMulti: 'Mund të shtoni disa kode — i kombinojmë kur rregullat e lejojnë.',
    couponTry: 'Provoni:',
    couponDup: 'Kodi „{code}“ është shtuar tashmë.',
    err_notfound: 'Kodi „{code}“ nuk ekziston — kontrolloni nëse është shkruar saktë.',
    err_inactive: 'Kodi „{code}“ aktualisht nuk është aktiv.',
    err_expired: 'Kodi „{code}“ ka skaduar.',
    err_min: 'Vlen për porosi nga {amount} — shtoni edhe {left}.',
    err_minQty: 'Vlen me të paktën {amount} pako — shtoni edhe {left}.',
    err_scheduled: 'Kodi „{code}“ ende nuk vlen.',
    err_notCombinable: 'Nuk kombinohet me „{other}“ — ruajtëm zbritjen më të leverdishme.',
    err_notEligible: 'Kodi „{code}“ nuk vlen për produktet në shportë.',
    err_notEligibleFor: 'Vlen vetëm për: {what} — nuk ka produkte të tilla në shportë.',
    err_usageLimit: 'Kodi „{code}“ është përdorur deri në fund.',
    err_audience: 'Kodi „{code}“ vlen vetëm për klientë të caktuar.',

    free: 'Falas',
    from: 'nga {amount}',
    shippingCalc: 'Shuma e saktë pasi të zgjidhni qytetin',
    free_threshold: 'porosi nga {amount}',
    zoneNote: '{zone} · {days}',
    workDays_one: '{days} ditë pune',
    workDays_many: '{days} ditë pune',
    vatNote: 'TVSH {rate} % e përfshirë · {amount}',
    piecesTotal: 'Gjithsej copë',
    discountFallback: 'Zbritje',

    trust_secure: 'Pagesë e sigurt',
    trust_secureText: 'Në dorëzim, me transfertë bankare ose me kartelë — pa kosto të fshehura.',
    trust_fast: 'Dërgesë e shpejtë',
    trust_fastText: 'Mitrovicë brenda 24 orëve, gjithë Kosova për 1–3 ditë pune.',
    trust_invoice: 'Faturë për biznese',
    trust_invoiceText: 'Faturë me NUI dhe TVSH, çmime shumice me karton.',

    plusLogo: '+ logo {amount}',
    copied: 'U kopjua',
    copy: 'Kopjo',
  },
  en: {
    step_cart: 'Cart',
    step_details: 'Details',
    step_payment: 'Payment',
    step_done: 'Confirmation',
    stepsLabel: 'Checkout steps',
    items_one: '{n} product',
    items_few: '{n} products',
    items_many: '{n} products',
    packs_one: '{n} pack',
    packs_few: '{n} packs',
    packs_many: '{n} packs',

    perPiece: '{price}/pc',
    perPack: '{price} / pack',
    packSize: '{n} pcs/pack',
    tierBadge: 'Wholesale price −{pct} %',
    nudge: 'Add {packs} and save {pct} %',
    nudgeCarton: 'Add {packs} to fill a carton and save {pct} %',
    nudgeBtn: 'Add',
    addCarton: '+1 carton',
    addCartonTitle: 'Add a carton: {packs} · {pieces}',
    logoPerPack: '+{price} / pack',
    logoNote: 'Lead time 7–10 working days. After you order we’ll ask for your logo file (PDF, AI or PNG) and send a proof for approval.',
    logoAdd: 'Add your logo print',
    logoMin: 'Logo print: minimum 1 carton ({packs})',
    logoFill: 'Fill the carton',
    removeLine: 'Remove from cart',

    shipLeft: '{amount} away from free delivery',
    shipReached: 'Delivery is free for this order!',
    shipPromise: 'Mitrovica 24 h · Kosovo 1–3 days',
    shipRule: 'Free delivery on orders from {amount}',

    couponLabel: 'Discount codes',
    couponHave: 'Have a discount code?',
    couponPh: 'Enter code',
    couponApply: 'Apply',
    couponRemove: 'Remove code {code}',
    couponApplied: 'Applied',
    couponMulti: 'You can add several codes — we combine them when the rules allow.',
    couponTry: 'Try:',
    couponDup: 'Code “{code}” is already added.',
    err_notfound: 'Code “{code}” doesn’t exist — please check the spelling.',
    err_inactive: 'Code “{code}” is not active at the moment.',
    err_expired: 'Code “{code}” has expired.',
    err_min: 'Valid on orders from {amount} — add {left} more.',
    err_minQty: 'Needs at least {amount} packs — add {left} more.',
    err_scheduled: 'Code “{code}” is not valid yet.',
    err_notCombinable: 'Can’t be combined with “{other}” — we kept the better deal.',
    err_notEligible: 'Code “{code}” doesn’t apply to the items in your cart.',
    err_notEligibleFor: 'Only valid for: {what} — none of those are in your cart.',
    err_usageLimit: 'Code “{code}” has been fully used.',
    err_audience: 'Code “{code}” is only for selected customers.',

    free: 'Free',
    from: 'from {amount}',
    shippingCalc: 'Exact amount once you pick a city',
    free_threshold: 'order from {amount}',
    zoneNote: '{zone} · {days}',
    workDays_one: '{days} working day',
    workDays_many: '{days} working days',
    vatNote: 'VAT {rate} % included · {amount}',
    piecesTotal: 'Total pieces',
    discountFallback: 'Discount',

    trust_secure: 'Secure payment',
    trust_secureText: 'Cash on delivery, bank transfer or card — no hidden costs.',
    trust_fast: 'Fast delivery',
    trust_fastText: 'Mitrovica within 24 hours, all of Kosovo in 1–3 working days.',
    trust_invoice: 'Business invoice',
    trust_invoiceText: 'Invoice with your NUI and VAT, wholesale prices by the carton.',

    plusLogo: '+ logo {amount}',
    copied: 'Copied',
    copy: 'Copy',
  },
});

type Plural = 'one' | 'few' | 'many';

/** Plural category (Serbian has one / few / many; Albanian and English one / many). */
export function plural(n: number, lang: Lang): Plural {
  if (lang === 'me') {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'one';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'few';
    return 'many';
  }
  return n === 1 ? 'one' : 'many';
}

/** Plural key for product (cart line) counts. */
export function pluralKey(n: number, lang: Lang): 'items_one' | 'items_few' | 'items_many' {
  return `items_${plural(n, lang)}`;
}

/** Plural key for pack counts. */
export function packsKey(n: number, lang: Lang): 'packs_one' | 'packs_few' | 'packs_many' {
  return `packs_${plural(n, lang)}`;
}
