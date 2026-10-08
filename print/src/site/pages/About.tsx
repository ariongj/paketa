import { Link } from 'react-router';
import { ArrowRight, Check } from 'lucide-react';
import { Accent, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { LogoMark } from '@/components/brand/Logo';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { BrandStrip, C, CtaBand, FactsBand, Heading } from '@/site/components/company/Blocks';
import { CmykBar, CropMarks, Eyebrow, MonoChip } from '@/site/components/company/Print';
import { FOUNDERS, WHY } from '@/site/components/company/tech';
import { pad2, QUOTE_HREF } from '@/site/components/company/data';
import { defineDict, useDict, useL } from '@/i18n';
import { site } from '@/i18n/site';
import { useCategories, useSettings } from '@/store/hooks';
import { cn, initials } from '@/lib/utils';

const T = defineDict({
  sq: {
    eyebrow: 'Rreth nesh',
    title: 'Printim inovativ. *Paketim i jashtëzakonshëm.*',
    lead: 'PrintWorks Solutions është kompani moderne e printimit dhe paketimit në Kosovë. Bashkojmë offset, digjital, flexo, HP Indigo, prerje me matricë, ngjitje kutish dhe finishing nën një çati — nga ideja deri te produkti final.',
    technology: 'Teknologjia jonë',
    storyEyebrow: 'Historia',
    storyTitle: 'Një kompani e re me *dekada përvojë* pas saj',
    story1: 'PrintWorks Solutions u themelua në vitin 2020 nga Visar Idrizi, Besian Zeneli dhe Edon Zeneli. Themeluesit sollën në kompani mbi 23 vite udhëheqje në industrinë e printimit dhe paketimit — dhe ekipi sot numëron mbi 25 vite përvojë reale.',
    story2: 'Që nga dita e parë, ideja ishte e thjeshtë: markat në Kosovë dhe në rajon meritojnë një partner që i bën të gjitha në një vend — kuti kartoni, paketime ushqimore, etiketa, shrink sleeve, qese letre, materiale promovuese dhe finishing special — me shpejtësi, fleksibilitet dhe cilësi të qëndrueshme.',
    founders: 'Themeluesit',
    founder: 'Bashkëthemelues',
    since: 'Që nga 2020',
    visionEyebrow: 'Vizioni',
    vision: 'Të jemi partneri i besuar dhe inovativ i printimit dhe paketimit për kompanitë lider që janë gati të rriten dhe të kenë sukses.',
    visionMeans: 'Për ne kjo do të thotë të udhëheqim me shpejtësi, fleksibilitet, integritet dhe teknologji të automatizuar.',
    missionEyebrow: 'Misioni',
    missionTitle: 'Mjeshtëri tradicionale, *teknologji moderne*',
    missionText: 'Misioni ynë është të bashkojmë zanatin e printimit me teknologjinë më të re, me fokus në:',
    m1: 'Produkte me cilësi premium',
    m2: 'Afate të shpejta prodhimi',
    m3: 'Praktika të qëndrueshme',
    m4: 'Shërbim i personalizuar për çdo klient',
    m5: 'Inovacion i vazhdueshëm',
    whyEyebrow: 'Pse PrintWorks?',
    whyTitle: 'Çfarë na *dallon*',
    whyText: 'Katër arsye pse markat na besojnë paketimin e tyre — nga porosia e parë te ripërsëritja e njëqindtë.',
    teamEyebrow: 'Ekipi ynë',
    teamTitle: 'Njerëzit pas *çdo kutie*',
    team1: 'Paketimi i shkëlqyer nuk krijohet vetëm nga makineritë. Pas çdo porosie qëndron një ekip me njohuri teknike dhe respekt për afatet — nga shitja dhe prepress-i te printimi, finishing-u, kontrolli i cilësisë dhe dorëzimi.',
    team2: 'Çdo hap kalon nëpër duar njerëzish që e njohin materialin, ngjyrën dhe makinën — dhe që e dinë sa i rëndësishëm është afati për markën tuaj.',
    d1: 'Shitja & këshillimi',
    d2: 'Prepress & dizajn',
    d3: 'Printimi',
    d4: 'Finishing',
    d5: 'Kontrolli i cilësisë',
    d6: 'Logjistika & dorëzimi',
    makeEyebrow: 'Çfarë prodhojmë',
    allProducts: 'Të gjitha produktet',
    brands: 'Pajisje dhe partnerë me të cilët punojmë',
  },
  en: {
    eyebrow: 'About us',
    title: 'Innovative printing. *Exceptional packaging.*',
    lead: 'PrintWorks Solutions is a modern printing and packaging company in Kosovo. We bring offset, digital, flexo, HP Indigo, die-cutting, folder gluing and finishing under one roof — from idea to finished product.',
    technology: 'Our technology',
    storyEyebrow: 'Our story',
    storyTitle: 'A young company with *decades of experience* behind it',
    story1: 'PrintWorks Solutions was founded in 2020 by Visar Idrizi, Besian Zeneli and Edon Zeneli. The founders brought more than 23 years of leadership in the printing and packaging industry — and the team today counts more than 25 years of real experience.',
    story2: 'From day one the idea was simple: brands in Kosovo and the region deserve a partner that does it all in one place — cartons, food packaging, labels, shrink sleeves, paper bags, promotional print and specialty finishing — with speed, flexibility and consistent quality.',
    founders: 'Founders',
    founder: 'Co-founder',
    since: 'Since 2020',
    visionEyebrow: 'Vision',
    vision: 'To be the trusted and innovative printing and packaging partner for leading companies ready to grow and succeed.',
    visionMeans: 'For us that means leading through speed, flexibility, integrity and automated technology.',
    missionEyebrow: 'Mission',
    missionTitle: 'Traditional craftsmanship, *modern technology*',
    missionText: 'Our mission is to combine the craft of printing with the latest technology, focused on:',
    m1: 'Premium-quality products',
    m2: 'Fast production turnaround',
    m3: 'Sustainable practices',
    m4: 'Personalised service for every client',
    m5: 'Continuous innovation',
    whyEyebrow: 'Why PrintWorks?',
    whyTitle: 'What makes us *different*',
    whyText: 'Four reasons brands trust us with their packaging — from the first order to the hundredth reorder.',
    teamEyebrow: 'Our team',
    teamTitle: 'The people behind *every box*',
    team1: 'Great packaging is not created by machines alone. Behind every order is a team with technical knowledge and respect for deadlines — from sales and prepress to printing, finishing, quality control and delivery.',
    team2: 'Every step passes through the hands of people who know the material, the colour and the press — and who know how much the deadline matters to your brand.',
    d1: 'Sales & advice',
    d2: 'Prepress & design',
    d3: 'Printing',
    d4: 'Finishing',
    d5: 'Quality control',
    d6: 'Logistics & delivery',
    makeEyebrow: 'What we make',
    allProducts: 'All products',
    brands: 'Equipment and partners we work with',
  },
});

const MISSION = ['m1', 'm2', 'm3', 'm4', 'm5'] as const;
const DEPTS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'] as const;

export default function About() {
  const ts = useDict(site);
  const t = useDict(T);
  const tc = useDict(C);
  const l = useL();
  const settings = useSettings();
  const cats = useCategories();
  usePageTitle(ts('nav_about'));

  const collage = cats.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="container-x grid items-center gap-14 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24">
          <div className="animate-fade-up">
            <Breadcrumbs items={[{ label: ts('nav_about') }]} />
            <Eyebrow className="mt-10">{t('eyebrow')}</Eyebrow>
            <h1 className="display mt-5 max-w-2xl text-[44px] leading-[1.0] text-ink sm:text-[66px]">
              <Accent text={t('title')} />
            </h1>
            <p className="mt-7 max-w-xl text-[17.5px] leading-[1.7] text-ink-soft">{t('lead')}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to={QUOTE_HREF} size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                {tc('quote')}
              </ButtonLink>
              <ButtonLink to="/teknologjia" variant="outline" size="lg">
                {t('technology')}
              </ButtonLink>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-6 font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted">
              <span className="text-ink">{settings.legalName}</span>
              <span>Est. 2020</span>
              <span>{l({ sq: 'Kosovë', en: 'Kosovo' })}</span>
            </div>
          </div>

          {/* Product collage on a "press sheet" */}
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="relative mx-auto max-w-[560px]">
              <CropMarks size={16} gap={10} />
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-3 ring-1 ring-line sm:gap-4 sm:p-4">
                {collage.map((c, i) => (
                  <Link key={c.id} to={`/produktet/${c.slug}`} className="group relative aspect-square overflow-hidden rounded-xl bg-sand">
                    <Img src={c.image} small eager alt={l(c.name)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink shadow-sm">
                      {pad2(i + 1)} · {l(c.name)}
                    </span>
                  </Link>
                ))}
              </div>
              <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-[0_24px_50px_-24px_rgba(18,16,20,0.6)] sm:left-auto sm:right-8">
                <LogoMark tone="light" className="h-5" />
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/80">Perfection Printed.</span>
              </div>
            </div>
          </div>
        </div>
        <CmykBar className="absolute inset-x-0 bottom-0" />
      </section>

      {/* Story + founders */}
      <section className="py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <Reveal>
            <Heading eyebrow={t('storyEyebrow')} title={t('storyTitle')} />
            <div className="mt-8 space-y-5 text-[16.5px] leading-[1.75] text-ink-soft">
              <p>{t('story1')}</p>
              <p>{t('story2')}</p>
            </div>
          </Reveal>
          <Reveal delay={100} className="lg:pt-6">
            <div className="rounded-2xl bg-white ring-1 ring-line">
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{t('founders')}</span>
                <MonoChip tone="brand">{t('since')}</MonoChip>
              </div>
              <ul className="divide-y divide-line">
                {FOUNDERS.map((name, i) => (
                  <li key={name} className="flex items-center gap-4 px-6 py-5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink font-mono text-[13px] text-white">{initials(name)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[17px] font-semibold text-ink">{name}</div>
                      <div className="text-[13.5px] text-muted">{t('founder')}</div>
                    </div>
                    <span className="font-mono text-[11px] text-muted">{pad2(i + 1)}</span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-2 border-t border-line">
                <div className="border-r border-line px-6 py-5">
                  <div className="display text-[40px] leading-none text-ink">23+</div>
                  <div className="mt-2 text-[13px] leading-snug text-muted">{l({ sq: 'vite udhëheqje në industri', en: 'years of industry leadership' })}</div>
                </div>
                <div className="px-6 py-5">
                  <div className="display text-[40px] leading-none text-ink">2020</div>
                  <div className="mt-2 text-[13px] leading-snug text-muted">{l({ sq: 'viti i themelimit të PrintWorks', en: 'PrintWorks founded' })}</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <FactsBand />

      {/* Vision & mission */}
      <section className="py-20 sm:py-28">
        <div className="container-x grid gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <div className="relative flex h-full flex-col rounded-2xl bg-brand-600 p-8 text-white sm:p-12">
              <Eyebrow tone="light" className="text-white/80!">{t('visionEyebrow')}</Eyebrow>
              <blockquote className="display mt-8 text-[30px] leading-[1.12] sm:text-[40px]">“{t('vision')}”</blockquote>
              <p className="mt-auto pt-10 text-[15.5px] leading-relaxed text-white/80">{t('visionMeans')}</p>
              <LogoMark tone="mono-light" className="absolute right-8 top-8 h-6 opacity-40" />
            </div>
          </Reveal>
          <Reveal delay={100} className="h-full">
            <div className="flex h-full flex-col rounded-2xl bg-white p-8 ring-1 ring-line sm:p-12">
              <Eyebrow>{t('missionEyebrow')}</Eyebrow>
              <h2 className="display mt-6 text-[30px] leading-[1.1] text-ink sm:text-[38px]">
                <Accent text={t('missionTitle')} />
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-muted">{t('missionText')}</p>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {MISSION.map((k, i) => (
                  <li key={k} className="flex items-center gap-4 py-3.5">
                    <span className="font-mono text-[11px] text-brand-600">{pad2(i + 1)}</span>
                    <span className="flex-1 text-[15.5px] font-semibold text-ink">{t(k)}</span>
                    <Check className="h-4 w-4 text-brand-600" />
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Why PrintWorks */}
      <section className="border-t border-line bg-white py-20 sm:py-28">
        <div className="container-x">
          <Reveal>
            <Heading eyebrow={t('whyEyebrow')} title={t('whyTitle')} text={t('whyText')} />
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w, i) => {
              const Icon = w.icon;
              return (
                <Reveal key={i} delay={i * 80} className="h-full">
                  <div className="group flex h-full flex-col bg-white p-7 transition-colors duration-300 hover:bg-paper sm:p-8">
                    <div className="flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-[11px] text-muted">{pad2(i + 1)}</span>
                    </div>
                    <h3 className="mt-10 text-[19px] font-semibold leading-snug text-ink">{l(w.title)}</h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{l(w.text)}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="relative isolate overflow-hidden bg-ink py-20 text-white sm:py-28">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Reveal className="relative">
            <div className="relative">
              <CropMarks tone="light" />
              <div className="aspect-[2/1] overflow-hidden rounded-2xl bg-ink-soft">
                <Img src="/images/misc/team.webp" alt={t('teamEyebrow')} className="h-full w-full object-cover" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <Heading eyebrow={t('teamEyebrow')} title={t('teamTitle')} tone="light" />
            <p className="mt-6 text-[16.5px] leading-[1.75] text-white/70">{t('team1')}</p>
            <p className="mt-4 text-[16.5px] leading-[1.75] text-white/70">{t('team2')}</p>
            <ol className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEPTS.map((d, i) => (
                <li key={d} className="rounded-lg bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10">
                  <span className="block font-mono text-[10px] text-brand-300">{pad2(i + 1)}</span>
                  <span className="mt-0.5 block text-[13.5px] font-medium leading-snug text-white/90">{t(d)}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* What we make */}
      <section className="py-20 sm:py-24">
        <div className="container-x">
          <Reveal>
            <Heading
              eyebrow={t('makeEyebrow')}
              title={l({ sq: 'Nga kutia te *etiketa*', en: 'From carton to *label*' })}
              action={
                <ButtonLink to="/produktet" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('allProducts')}
                </ButtonLink>
              }
            />
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
            {cats.map((c, i) => (
              <Reveal key={c.id} delay={(i % 6) * 60}>
                <Link to={`/produktet/${c.slug}`} className="group block">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-sand ring-1 ring-line/60">
                    <Img src={c.image} small alt={l(c.name)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <span className="text-[14.5px] font-semibold leading-snug text-ink group-hover:text-brand-700">{l(c.name)}</span>
                    <ArrowRight className={cn('mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600')} />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BrandStrip title={t('brands')} />

      <CtaBand />
    </>
  );
}
