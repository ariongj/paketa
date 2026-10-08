import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight, Boxes, Clock, Layers, Leaf, Mail, MapPin, MousePointerClick, PackageCheck, Phone, ShieldCheck, Store, Tag, Truck, Zap } from 'lucide-react';
import { Accent, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { LogoMark } from '@/components/brand/Logo';
import { Breadcrumbs, SectionHeading } from '@/site/components/SectionHeading';
import { MapCard } from '@/site/components/content/MapCard';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { CtaBand, FactsBand, StepCards, Sticker } from '@/site/components/company/Blocks';
import { pad2, telHref, useStoreFacts } from '@/site/components/company/data';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    eyebrow: 'O nama',
    title: '*It’s packaging.* Iz Mitrovice, za lokale širom Kosova.',
    lead: 'Paketoje je ambalaža za hranu i piće za kafiće, restorane, brzu hranu, poslastičarnice i ketering — po veleprodajnim cijenama, sa dostavom širom Kosova.',
    shop: 'Pogledaj proizvode',
    business: 'Za biznis',
    country: 'Kosovo',
    floatSub: 'Mitrovica · Kosovo',
    ecoSticker: 'eko pravac',
    storyEyebrow: 'Naša priča',
    storyTitle: 'Bavimo se *jednom stvari*',
    story1: 'Paketoje je nastao u Mitrovici iz jednostavne potrebe: lokalima treba ambalaža koja ne curi, dobro izgleda i stiže na vrijeme — po cijeni koja ima smisla za mali biznis.',
    story2: 'Zato radimo samo jednu stvar — ambalažu. Čaše, poklopci, posude za hranu, desert, sosove, pribor i slamke biramo i testiramo prije nego uđu u magacin, a cijenu po komadu uvijek vidite.',
    story3: 'Snabdijevamo lokale širom Kosova, a na upit i u Albaniji, Sjevernoj Makedoniji i Crnoj Gori. Sljedeći korak je zelenija ponuda: kraft papir, karton i PLA ambalaža.',
    valuesEyebrow: 'Naše vrijednosti',
    valuesTitle: 'Ono u šta *vjerujemo*',
    valuesText: 'Četiri principa iza svake narudžbe — od jednog pakovanja do punog kamiona.',
    v1t: 'Provjeren kvalitet',
    v1: 'Svaki proizvod testiramo u praksi: da poklopac dobro naliježe, da posuda ne curi i da čaša izdrži led.',
    v2t: 'Jasne cijene',
    v2: 'Cijena po pakovanju i po komadu, popusti za količinu koji se računaju sami — bez skrivenih troškova.',
    v3t: 'Brzina',
    v3: 'Narudžbu pakujemo isti dan. U Mitrovici i okolini stiže za 24 sata, u ostatku Kosova za 1–3 dana.',
    v4t: 'Eko pravac',
    v4: 'Sve više kraft papira i kartona, a uskoro i kompostabilna PLA ambalaža za lokale koji žele zeleniju ponudu.',
    factsEyebrow: 'Paketoje u brojkama',
    factsTitle: 'Pravi podaci, *bez uljepšavanja*',
    f_products: 'proizvoda u katalogu, sa cijenom po komadu',
    f_categories: 'kategorija ambalaže — od čaša do pribora',
    f_kosovo: 'dana do bilo kog mjesta na Kosovu',
    f_fast: 'dostava u Mitrovici i okolini',
    f_free: 'besplatna dostava za narudžbe od tog iznosa',
    howEyebrow: 'Kako radimo',
    howTitle: 'Od narudžbe do *vašeg pulta*',
    h1t: 'Izaberite',
    h1: 'Naručite online po pakovanju ili kartonu — ili prvo zatražite besplatne uzorke.',
    h2t: 'Cijena se računa sama',
    h2: 'Popusti za količinu se primjenjuju automatski u korpi, za svaki proizvod.',
    h3t: 'Pakujemo u magacinu',
    h3: 'Narudžba se priprema isti dan u našem magacinu u Suhodolu, Mitrovica.',
    h4t: 'Dostava ili preuzimanje',
    h4: '24h u Mitrovici, 1–3 dana širom Kosova — ili besplatno preuzimanje u magacinu.',
    ecoEyebrow: 'Eko pravac',
    ecoTitle: 'Manje plastike, *više kartona*',
    ecoText: 'Ne obećavamo čuda — ali svake sezone dodajemo više ambalaže od papira i kartona. Kraft kutije i papirne čaše sa vašim logom već su dostupne, a PLA i aluminijum stižu uskoro.',
    soon: 'Uskoro',
    available: 'Dostupno',
    depotEyebrow: 'Magacin',
    depotTitle: 'Svratite u naš *magacin*',
    depotText: 'Naručite online i preuzmite besplatno, ili dođite da vidite i probate proizvode uživo.',
    address: 'Adresa',
    phone: 'Telefon',
    email: 'E-mail',
    pickup: 'Preuzimanje',
    pickupText: 'Besplatno — narudžba spremna za 2 sata',
  },
  sq: {
    eyebrow: 'Rreth nesh',
    title: '*It’s packaging.* Nga Mitrovica, për lokalet e gjithë Kosovës.',
    lead: 'Paketoje është paketim ushqimi dhe pijesh për kafiteri, restorante, fast food, pastiçeri dhe catering — me çmime shumice dhe dërgesë në gjithë Kosovën.',
    shop: 'Shiko produktet',
    business: 'Për biznese',
    country: 'Kosovë',
    floatSub: 'Mitrovicë · Kosovë',
    ecoSticker: 'drejtim eko',
    storyEyebrow: 'Historia jonë',
    storyTitle: 'Merremi me *një gjë*',
    story1: 'Paketoje lindi në Mitrovicë nga një nevojë e thjeshtë: lokalet kanë nevojë për paketim që nuk derdhet, duket bukur dhe vjen në kohë — me një çmim që ka kuptim për një biznes të vogël.',
    story2: 'Prandaj merremi vetëm me një gjë — paketimin. Gotat, kapakët, enët e ushqimit, ëmbëlsirave dhe salcave, takëmet dhe shkopinjtë i zgjedhim dhe i testojmë para se të hyjnë në depo, dhe çmimin për copë e shihni gjithmonë.',
    story3: 'Furnizojmë lokale në gjithë Kosovën, dhe me kërkesë edhe në Shqipëri, Maqedoni të Veriut dhe Mal të Zi. Hapi i radhës është një ofertë më e gjelbër: letër kraft, karton dhe paketim PLA.',
    valuesEyebrow: 'Vlerat tona',
    valuesTitle: 'Ajo në të cilën *besojmë*',
    valuesText: 'Katër parime pas çdo porosie — nga një pako deri te një kamion i plotë.',
    v1t: 'Cilësi e provuar',
    v1: 'Çdo produkt e testojmë në praktikë: që kapaku të mbyllet mirë, që ena të mos derdhet dhe që gota ta mbajë akullin.',
    v2t: 'Çmime të qarta',
    v2: 'Çmimi për pako dhe për copë, zbritje për sasi që llogariten vetë — pa kosto të fshehura.',
    v3t: 'Shpejtësi',
    v3: 'Porosinë e paketojmë të njëjtën ditë. Në Mitrovicë dhe rrethinë arrin për 24 orë, në pjesën tjetër të Kosovës për 1–3 ditë.',
    v4t: 'Drejtim eko',
    v4: 'Gjithnjë e më shumë letër kraft dhe karton, dhe së shpejti paketim PLA i kompostueshëm për lokalet që duan një ofertë më të gjelbër.',
    factsEyebrow: 'Paketoje në shifra',
    factsTitle: 'Të dhëna reale, *pa zbukurime*',
    f_products: 'produkte në katalog, me çmim për copë',
    f_categories: 'kategori paketimi — nga gotat te takëmet',
    f_kosovo: 'ditë deri në çdo vend të Kosovës',
    f_fast: 'dërgesë në Mitrovicë dhe rrethinë',
    f_free: 'dërgesë falas për porosi nga kjo shumë',
    howEyebrow: 'Si punojmë',
    howTitle: 'Nga porosia te *banaku juaj*',
    h1t: 'Zgjidhni',
    h1: 'Porosisni online me pako ose karton — ose kërkoni fillimisht mostra falas.',
    h2t: 'Çmimi llogaritet vetë',
    h2: 'Zbritjet për sasi aplikohen automatikisht në shportë, për çdo produkt.',
    h3t: 'Paketojmë në depo',
    h3: 'Porosia përgatitet të njëjtën ditë në depon tonë në Suhodoll, Mitrovicë.',
    h4t: 'Dërgesë ose marrje',
    h4: '24 orë në Mitrovicë, 1–3 ditë në gjithë Kosovën — ose marrje falas në depo.',
    ecoEyebrow: 'Drejtim eko',
    ecoTitle: 'Më pak plastikë, *më shumë karton*',
    ecoText: 'Nuk premtojmë mrekulli — por çdo sezon shtojmë më shumë paketim prej letre dhe kartoni. Kutitë kraft dhe gotat e letrës me logon tuaj janë tashmë në dispozicion, ndërsa PLA dhe alumini vijnë së shpejti.',
    soon: 'Së shpejti',
    available: 'Në dispozicion',
    depotEyebrow: 'Depoja',
    depotTitle: 'Na vizitoni në *depo*',
    depotText: 'Porosisni online dhe merreni falas, ose ejani t’i shihni dhe t’i provoni produktet nga afër.',
    address: 'Adresa',
    phone: 'Telefoni',
    email: 'Email',
    pickup: 'Marrje në depo',
    pickupText: 'Falas — porosia gati për 2 orë',
  },
  en: {
    eyebrow: 'About us',
    title: '*It’s packaging.* From Mitrovica, for venues across Kosovo.',
    lead: 'Paketoje is food and drink packaging for cafés, restaurants, fast food, pastry shops and caterers — at wholesale prices, delivered across Kosovo.',
    shop: 'Shop products',
    business: 'For business',
    country: 'Kosovo',
    floatSub: 'Mitrovica · Kosovo',
    ecoSticker: 'going eco',
    storyEyebrow: 'Our story',
    storyTitle: 'We do *one thing*',
    story1: 'Paketoje started in Mitrovica from a simple need: venues need packaging that doesn’t leak, looks good and arrives on time — at a price that makes sense for a small business.',
    story2: 'So we do one thing only — packaging. Cups, lids, food, dessert and sauce containers, cutlery and straws are picked and tested before they reach the warehouse, and you always see the price per piece.',
    story3: 'We supply venues across Kosovo, and on request in Albania, North Macedonia and Montenegro. The next step is a greener range: kraft paper, cardboard and PLA packaging.',
    valuesEyebrow: 'Our values',
    valuesTitle: 'What we *stand for*',
    valuesText: 'Four principles behind every order — from a single pack to a full truck.',
    v1t: 'Tested quality',
    v1: 'We test every product in practice: lids that close properly, containers that don’t leak, cups that handle ice.',
    v2t: 'Clear prices',
    v2: 'Price per pack and per piece, volume discounts that apply themselves — no hidden costs.',
    v3t: 'Speed',
    v3: 'Orders are packed the same day. Mitrovica and surroundings within 24 hours, the rest of Kosovo in 1–3 days.',
    v4t: 'Going eco',
    v4: 'More and more kraft paper and cardboard, and compostable PLA packaging coming soon for venues that want a greener offer.',
    factsEyebrow: 'Paketoje in numbers',
    factsTitle: 'Real figures, *no fluff*',
    f_products: 'products in the catalogue, priced per piece',
    f_categories: 'packaging categories — from cups to cutlery',
    f_kosovo: 'days to anywhere in Kosovo',
    f_fast: 'delivery in Mitrovica and surroundings',
    f_free: 'free delivery on orders from this amount',
    howEyebrow: 'How we work',
    howTitle: 'From order to *your counter*',
    h1t: 'Choose',
    h1: 'Order online by the pack or carton — or ask for free samples first.',
    h2t: 'The price works itself out',
    h2: 'Volume discounts apply automatically in the cart, for every product.',
    h3t: 'Packed at our warehouse',
    h3: 'Your order is prepared the same day at our warehouse in Suhodoll, Mitrovica.',
    h4t: 'Delivery or pickup',
    h4: '24 hours in Mitrovica, 1–3 days across Kosovo — or free warehouse pickup.',
    ecoEyebrow: 'Going eco',
    ecoTitle: 'Less plastic, *more cardboard*',
    ecoText: 'We don’t promise miracles — but every season we add more paper and cardboard packaging. Kraft boxes and paper cups with your logo are already available, with PLA and aluminium coming soon.',
    soon: 'Coming soon',
    available: 'Available',
    depotEyebrow: 'Warehouse',
    depotTitle: 'Visit our *warehouse*',
    depotText: 'Order online and collect for free, or come by to see and try the products in person.',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    pickup: 'Pickup',
    pickupText: 'Free — your order is ready in 2 hours',
  },
});

const VALUES = [
  { icon: ShieldCheck, title: 'v1t', text: 'v1' },
  { icon: Tag, title: 'v2t', text: 'v2' },
  { icon: Zap, title: 'v3t', text: 'v3' },
  { icon: Leaf, title: 'v4t', text: 'v4' },
] as const;

export default function About() {
  const ts = useDict(site);
  const t = useDict(T);
  const l = useL();
  const lang = useLang();
  const settings = useSettings();
  const facts = useStoreFacts();
  const categories = useDb((s) => s.categories);
  usePageTitle(ts('nav_about'));

  const hours = l(settings.hours)
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  const about = l(settings.about).trim();
  const ecoCats = [...categories.filter((c) => c.id === 'cat-karton'), ...facts.soonCategories];

  const contactRows = [
    { icon: MapPin, label: t('address'), value: [settings.address, settings.city].filter(Boolean).join(', '), href: settings.mapUrl, external: true },
    { icon: Clock, label: ts('hours'), value: hours, href: undefined, external: false },
    { icon: Phone, label: t('phone'), value: settings.phone, href: telHref(settings.phone), external: false },
    { icon: Mail, label: t('email'), value: settings.email, href: `mailto:${settings.email}`, external: false },
    { icon: Store, label: t('pickup'), value: t('pickupText'), href: undefined, external: false },
  ];

  const factItems = [
    { icon: Boxes, value: String(facts.products), label: t('f_products') },
    { icon: Layers, value: String(facts.categories), label: t('f_categories') },
    { icon: MapPin, value: facts.maxDays > 1 ? `1–${facts.maxDays}` : String(facts.maxDays || 1), label: t('f_kosovo') },
    facts.fastest?.days.trim() === '1'
      ? { icon: Truck, value: '24h', label: t('f_fast') }
      : { icon: Truck, value: money(facts.freeFrom, lang, { decimals: facts.freeFrom % 1 !== 0 }), label: t('f_free') },
  ];

  return (
    <>
      {/* Split hero */}
      <section className="overflow-hidden border-b border-line bg-paper">
        <div className="container-x grid items-center gap-14 pb-20 pt-10 sm:pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-24">
          <div className="animate-fade-up">
            <Breadcrumbs items={[{ label: ts('nav_about') }]} />
            <div className="eyebrow mb-4 mt-10">{t('eyebrow')}</div>
            <h1 className="display max-w-xl text-[42px] leading-[1.02] text-ink sm:text-[60px]">
              <Accent text={t('title')} />
            </h1>
            <p className="mt-7 max-w-xl text-[17.5px] leading-[1.7] text-ink-soft">{about || t('lead')}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/produktet" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                {t('shop')}
              </ButtonLink>
              <ButtonLink to="/sherbimet" variant="outline" size="lg">
                {t('business')}
              </ButtonLink>
            </div>
            <div className="mt-10 flex items-center gap-3 border-t border-dashed border-line pt-6 text-[13px] text-muted">
              <MapPin className="h-4 w-4 text-brand-600" />
              <span>
                <span className="font-semibold text-ink">{settings.legalName}</span> · {settings.city}, {t('country')}
              </span>
            </div>
          </div>
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="absolute -right-6 -top-6 hidden h-40 w-40 rounded-full bg-lime/50 blur-2xl lg:block" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-sand sm:aspect-[5/4] lg:aspect-[4/5]">
              <Img src="/images/misc/about.webp" eager alt={settings.companyName} className="h-full w-full object-cover" />
            </div>
            <Sticker tone="pink" className="absolute right-5 top-5 text-[13px]">
              <Leaf className="h-3.5 w-3.5" /> {t('ecoSticker')}
            </Sticker>
            <div className="absolute -bottom-8 left-4 right-4 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[0_30px_60px_-30px_rgba(15,29,22,0.45)] ring-1 ring-line sm:left-auto sm:right-8 sm:w-[340px] lg:-left-10 lg:right-auto">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-paper ring-1 ring-line">
                <LogoMark className="h-7" />
              </span>
              <div className="min-w-0">
                <div className="display text-[22px] leading-tight text-ink">{l(settings.tagline) || 'it’s packaging'}</div>
                <div className="mt-0.5 text-[12px] font-bold uppercase tracking-[0.16em] text-brand-700">{t('floatSub')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 sm:py-28">
        <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <SectionHeading eyebrow={t('storyEyebrow')} title={t('storyTitle')} />
          </Reveal>
          <Reveal delay={100} className="space-y-5 text-[17px] leading-[1.75] text-ink-soft">
            <p className="text-[19px] leading-[1.65] text-ink sm:text-[21px]">{t('story1')}</p>
            <p>{t('story2')}</p>
            <p>{t('story3')}</p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-line bg-sand/40 py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading eyebrow={t('valuesEyebrow')} title={t('valuesTitle')} subtitle={t('valuesText')} />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={(i % 2) * 110} className="h-full">
                  <div className={cn('h-full', i % 2 === 1 && 'sm:translate-y-12')}>
                    <div className="group flex h-full flex-col rounded-3xl bg-white p-7 ring-1 ring-line transition-[box-shadow,transform] duration-500 hover:-translate-y-1 hover:shadow-[0_28px_60px_-34px_rgba(15,29,22,0.4)] sm:p-8">
                      <div className="flex items-center justify-between">
                        <span className={cn('grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-500 group-hover:-rotate-6', i === 3 ? 'bg-lime text-ink' : 'bg-brand-600 text-white')}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="display text-[15px] text-muted">{pad2(i + 1)}</span>
                      </div>
                      <h3 className="display mt-10 text-[28px] leading-tight text-ink">{t(v.title)}</h3>
                      <p className="mt-3 text-[15px] leading-relaxed text-muted">{t(v.text)}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <FactsBand eyebrow={t('factsEyebrow')} title={t('factsTitle')} items={factItems} />

      {/* How we work */}
      <section className="py-20 sm:py-28">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow={t('howEyebrow')}
              title={t('howTitle')}
              action={
                <ButtonLink to="/sherbimet" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('business')}
                </ButtonLink>
              }
            />
          </Reveal>
          <StepCards
            className="mt-12"
            steps={[
              { icon: MousePointerClick, title: t('h1t'), text: t('h1') },
              { icon: Tag, title: t('h2t'), text: t('h2') },
              { icon: Boxes, title: t('h3t'), text: t('h3') },
              { icon: PackageCheck, title: t('h4t'), text: t('h4') },
            ]}
          />
        </div>
      </section>

      {/* Eco direction */}
      <section className="pb-20 sm:pb-28">
        <div className="container-x">
          <Reveal>
            <div className="grid overflow-hidden rounded-[36px] bg-[#e9dfcc] lg:grid-cols-2">
              <div className="relative min-h-[280px] sm:min-h-[360px]">
                <Img src="/images/misc/kraft-cups.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                <div className="eyebrow text-lime-ink">{t('ecoEyebrow')}</div>
                <h2 className="display mt-3 text-[34px] leading-[1.05] text-ink sm:text-[46px]">
                  <Accent text={t('ecoTitle')} />
                </h2>
                <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-soft">{t('ecoText')}</p>
                {ecoCats.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {ecoCats.map((c) => (
                      <Link key={c.id} to={`/produktet/${c.slug}`} className="group inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3.5 text-[13.5px] font-semibold text-ink ring-1 ring-black/5 transition hover:ring-brand-600/40">
                        <Img src={c.image} small alt="" className="h-8 w-8 rounded-full object-cover" />
                        {l(c.name)}
                        <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide', c.soon ? 'bg-pink-soft text-pink-ink' : 'bg-lime-soft text-lime-ink')}>{c.soon ? t('soon') : t('available')}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Depot */}
      <section className="border-t border-line bg-sand/40 py-20 sm:py-28">
        <div className="container-x grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          <Reveal className="h-full">
            <MapCard className="h-full" />
          </Reveal>
          <Reveal delay={100} className="h-full">
            <div className="flex h-full flex-col rounded-3xl bg-white p-7 ring-1 ring-line sm:p-10">
              <div className="eyebrow">{t('depotEyebrow')}</div>
              <h2 className="display mt-3 text-[34px] leading-[1.05] text-ink sm:text-[44px]">
                <Accent text={t('depotTitle')} />
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">{t('depotText')}</p>
              <ul className="mt-7 divide-y divide-line border-y border-line">
                {contactRows.map((r) => {
                  const Icon = r.icon;
                  const body = Array.isArray(r.value)
                    ? r.value.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))
                    : r.value;
                  return (
                    <li key={r.label} className="flex items-start gap-4 py-3.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{r.label}</div>
                        {r.href ? (
                          <a href={r.href} {...(r.external ? { target: '_blank', rel: 'noreferrer' } : {})} className="link-u mt-0.5 inline-flex items-center gap-1 break-words text-[15.5px] font-semibold text-ink">
                            {body}
                            {r.external && <ArrowUpRight className="h-3.5 w-3.5 text-muted" />}
                          </a>
                        ) : (
                          <div className="mt-0.5 text-[15.5px] font-semibold text-ink">{body}</div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand image="/images/hero/delivery.webp" />
    </>
  );
}
