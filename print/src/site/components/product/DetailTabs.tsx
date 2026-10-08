import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BadgeCheck, Clock, FileCheck2, Layers, MapPin, Palette, PenTool, Ruler, ScanLine, Store, Truck, Type } from 'lucide-react';
import type { Category } from '@/lib/types';
import { Accordion, Accent, Img, Tabs } from '@/components/ui/misc';
import { useDict, useL, useLang } from '@/i18n';
import { useSettings } from '@/store/hooks';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CmykBar, Eyebrow } from '@/site/components/company/Print';
import { PD } from './dict';
import { qtyText, unitMoney } from './print';
import { TierTable } from './TierTable';
import type { Configurator } from './useConfigurator';

type Tab = 'desc' | 'specs' | 'prices' | 'artwork' | 'delivery' | 'faq';

export function DetailTabs({ cfg, category, onPickQty }: { cfg: Configurator; category?: Category; onPickQty: (qty: number) => void }) {
  const t = useDict(PD);
  const p = cfg.product;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'desc', label: t('tab_desc') },
    { id: 'specs', label: t('tab_specs') },
    ...(cfg.tiers.length > 1 ? [{ id: 'prices' as const, label: t('tab_prices') }] : []),
    ...(cfg.needsArtwork || p.quoteOnly ? [{ id: 'artwork' as const, label: t('tab_artwork') }] : []),
    { id: 'delivery', label: t('tab_delivery') },
    { id: 'faq', label: t('tab_faq') },
  ];
  const [tab, setTab] = useState<Tab>('desc');
  return (
    <section id="detajet" className="scroll-mt-28">
      <Tabs<Tab> value={tab} onChange={setTab} className="gap-2 sm:gap-6" tabs={tabs.map((x) => ({ id: x.id, label: <span className="text-[15px]">{x.label}</span> }))} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="pt-8 sm:pt-10">
          {tab === 'desc' && <Description cfg={cfg} />}
          {tab === 'specs' && <Specs cfg={cfg} category={category} />}
          {tab === 'prices' && <Prices cfg={cfg} onPickQty={onPickQty} />}
          {tab === 'artwork' && <ArtworkGuide />}
          {tab === 'delivery' && <Delivery cfg={cfg} />}
          {tab === 'faq' && <Faq cfg={cfg} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
function Description({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const p = cfg.product;
  const facts = [
    cfg.rules.min > 1 ? { icon: Layers, label: t('spec_moq'), value: t('pcsValue', { n: qtyText(cfg.rules.min, lang) }) } : null,
    p.leadDays ? { icon: Clock, label: t('spec_lead'), value: cfg.run || p.quoteOnly ? t('daysValue', { days: p.leadDays }) : t('shipsBy') } : null,
    cfg.needsArtwork || p.quoteOnly ? { icon: FileCheck2, label: t('spec_proof'), value: t('p1w') } : null,
    cfg.canDesign ? { icon: PenTool, label: t('spec_design'), value: money(cfg.designFeeUnit, lang, { decimals: false }) } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];
  const paragraphs = l(p.description).split(/\n{2,}/).filter(Boolean);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <p className="display text-[24px] leading-[1.25] text-ink sm:text-[28px]">{l(p.short)}</p>
        <div className="mt-6 space-y-4 text-[16px] leading-[1.75] text-ink-soft">
          {paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {p.specs.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {p.specs.slice(0, 4).map((s, i) => (
              <span key={i} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[13px]">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{l(s.label)}</span>
                <span className="font-semibold text-ink">{l(s.value)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="lg:col-span-5">
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
          {p.images[1] && (
            <div className="aspect-[16/10] overflow-hidden bg-white">
              <Img src={p.images[1]} small alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <CmykBar />
          <div className="p-5 sm:p-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{t('highlights')}</div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
              {facts.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[12px] text-muted">{f.label}</dt>
                      <dd className="text-[14px] font-semibold text-ink">{f.value}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Specs({ cfg, category }: { cfg: Configurator; category?: Category }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const p = cfg.product;
  const has = (re: RegExp) => p.specs.some((s) => re.test(`${s.label.sq} ${s.label.en}`));
  const rows: [string, string][] = [
    ...p.specs.map((s) => [l(s.label), l(s.value)] as [string, string]),
    ...(!has(/minimal|minimum/i) && cfg.rules.min > 1 ? [[t('spec_moq'), t('pcsValue', { n: qtyText(cfg.rules.min, lang) })] as [string, string]] : []),
    ...(cfg.run && cfg.rules.step > 1 ? [[t('spec_step'), t('pcsValue', { n: qtyText(cfg.rules.step, lang) })] as [string, string]] : []),
    ...(!has(/afati|production|ships/i) && p.leadDays ? [[t('spec_lead'), cfg.run ? t('daysAfterProof', { n: p.leadDays }) : t('shipsBy')] as [string, string]] : []),
    ...(cfg.needsArtwork ? [[t('spec_proof'), t('spec_proofValue')] as [string, string]] : []),
    ...(cfg.canDesign ? [[t('spec_design'), `${money(cfg.designFeeUnit, lang)} · ${t('perLine')}`] as [string, string]] : []),
    [t('spec_unit'), p.unit === 'set' ? t('unit_set') : t('unit_kom')],
    ...(category ? [[t('spec_category'), l(category.name)] as [string, string]] : []),
    [t('spec_sku'), p.sku],
  ];
  return (
    <div className="max-w-3xl">
      <dl className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        {rows.map(([k, v], i) => (
          <div key={i} className={cn('grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-5 py-3.5 text-[14.5px] sm:px-7', i > 0 && 'border-t border-line/70')}>
            <dt className="font-mono text-[11px] uppercase leading-6 tracking-[0.1em] text-muted">{k}</dt>
            <dd className={cn('font-semibold text-ink', k === t('spec_sku') && 'font-mono font-medium')}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Prices({ cfg, onPickQty }: { cfg: Configurator; onPickQty: (qty: number) => void }) {
  const t = useDict(PD);
  const lang = useLang();
  const last = cfg.tiers[cfg.tiers.length - 1];
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <TierTable cfg={cfg} onPick={onPickQty} />
      </div>
      <div className="lg:col-span-5">
        <Eyebrow>{t('tiersTitle')}</Eyebrow>
        <p className="display mt-4 text-[26px] leading-[1.2] text-ink sm:text-[30px]">
          {unitMoney(cfg.tiers[0].unit, lang)} → <span className="text-brand-600">{unitMoney(last.unit, lang)}</span>
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{t('faq2a', { min: qtyText(cfg.rules.min, lang), step: qtyText(cfg.rules.step, lang) })}</p>
        <div className="mt-6 rounded-2xl bg-ink p-5 text-paper">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/50">{t('tierSave')}</div>
          <div className="display mt-1 text-[40px] leading-none text-brand-300">−{last.save}%</div>
          <div className="mt-2 text-[13px] text-paper/60">{t('pcsValue', { n: qtyText(last.qty, lang) })}+</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function BleedDiagram() {
  const t = useDict(PD);
  return (
    <svg viewBox="0 0 320 220" className="w-full" role="img" aria-label={`${t('d_bleed')} · ${t('d_trim')} · ${t('d_safe')}`}>
      <rect x="10" y="10" width="300" height="200" rx="4" className="fill-brand-50" />
      <rect x="10" y="10" width="300" height="200" rx="4" fill="none" stroke="var(--color-magenta)" strokeDasharray="5 4" strokeWidth="1.2" />
      <rect x="28" y="28" width="264" height="164" className="fill-white" stroke="var(--color-ink)" strokeWidth="1.4" />
      <rect x="46" y="46" width="228" height="128" fill="none" stroke="var(--color-cyan)" strokeDasharray="3 3" strokeWidth="1.2" />
      {/* crop marks */}
      {[
        [28, 28, -1, -1],
        [292, 28, 1, -1],
        [28, 192, -1, 1],
        [292, 192, 1, 1],
      ].map(([x, y, dx, dy], i) => (
        <g key={i} stroke="var(--color-ink)" strokeWidth="0.8">
          <line x1={x + dx * 4} y1={y} x2={x + dx * 16} y2={y} />
          <line x1={x} y1={y + dy * 4} x2={x} y2={y + dy * 16} />
        </g>
      ))}
      <text x="160" y="104" textAnchor="middle" className="fill-ink font-mono text-[11px]">
        LOGO · TEXT
      </text>
      <text x="160" y="122" textAnchor="middle" className="fill-muted font-mono text-[9px]">
        CMYK · 300 dpi
      </text>
      <text x="16" y="24" className="font-mono text-[8.5px]" fill="var(--color-magenta)">
        {t('d_bleed')}
      </text>
      <text x="34" y="186" className="fill-ink font-mono text-[8.5px]">
        {t('d_trim')}
      </text>
      <text x="52" y="60" className="font-mono text-[8.5px]" fill="var(--color-cyan)">
        {t('d_safe')}
      </text>
    </svg>
  );
}

function ArtworkGuide() {
  const t = useDict(PD);
  const settings = useSettings();
  const rules = [
    { icon: ScanLine, title: t('g_bleed'), text: t('g_bleedText') },
    { icon: Ruler, title: t('g_safe'), text: t('g_safeText') },
    { icon: Palette, title: t('g_cmyk'), text: t('g_cmykText') },
    { icon: Layers, title: t('g_dpi'), text: t('g_dpiText') },
    { icon: Type, title: t('g_fonts'), text: t('g_fontsText') },
    { icon: FileCheck2, title: t('g_pdfx'), text: t('g_pdfxText') },
  ];
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-5">
        <Eyebrow>{t('guideEyebrow')}</Eyebrow>
        <h3 className="display mt-4 text-[30px] leading-[1.1] text-ink sm:text-[36px]">
          <Accent text={t('guideTitle')} />
        </h3>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{t('guideIntro')}</p>
        <div className="mt-6 rounded-3xl bg-white p-4 ring-1 ring-line">
          <BleedDiagram />
        </div>
      </div>
      <div className="lg:col-span-7">
        <ol className="grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line sm:grid-cols-2">
          {rules.map((r, i) => {
            const Icon = r.icon;
            return (
              <li key={i} className="bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="mt-4 text-[16px] font-semibold text-ink">{r.title}</div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{r.text}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-muted">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          {t('dieline', { email: settings.email })}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Delivery({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const settings = useSettings();
  const days = cfg.product.leadDays ?? 0;
  const steps = [
    { title: t('p1'), when: t('p1w') },
    { title: t('p2'), when: t('p2w') },
    { title: t('p3'), when: t('p3w', { n: days || '—' }) },
    { title: t('p4'), when: t('p4w') },
  ];
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <h3 className="display text-[26px] leading-tight text-ink">
          <Accent text={t('processTitle')} />
        </h3>
        <ol className="mt-6 space-y-0">
          {steps.map((s, i) => (
            <li key={i} className={cn('relative flex gap-4', i < steps.length - 1 && 'pb-6')}>
              {i < steps.length - 1 && <span aria-hidden className="absolute bottom-0 left-5 top-11 w-px bg-line" />}
              <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full font-mono text-[12px]', i === 0 ? 'bg-brand-600 text-white' : 'bg-white text-ink ring-1 ring-line')}>{String(i + 1).padStart(2, '0')}</span>
              <div className="pt-1.5">
                <div className="text-[15px] font-semibold text-ink">{s.title}</div>
                <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{s.when}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="flex items-center gap-2.5 text-[17px] font-semibold text-ink">
          <Truck className="h-5 w-5 text-brand-600" /> {t('zonesTitle')}
        </h3>
        <div className="mt-4 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
          {settings.shippingZones.map((z, i) => (
            <div key={z.id} className={cn('flex items-start justify-between gap-4 px-5 py-3.5 sm:px-6', i > 0 && 'border-t border-line/70')}>
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold text-ink">{z.name}</div>
                <div className="mt-0.5 line-clamp-1 text-[12.5px] text-muted">{z.cities.join(', ')}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-[14px] font-medium tabular-nums text-ink">{money(z.fee, lang)}</div>
                <div className="mt-0.5 text-[12px] text-muted">{t('daysValue', { days: z.days })}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-inset ring-brand-100">
          <div className="text-[14px] font-semibold text-brand-800">{t('freeOver', { amount: money(settings.freeShippingThreshold, lang, { decimals: false }) })}</div>
          <p className="mt-0.5 text-[13px] leading-snug text-brand-900/70">{t('freeOverText')}</p>
        </div>
        <div className="mt-3 flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
          <Store className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
          <div>
            <div className="text-[14px] font-semibold text-ink">{t('pickup')}</div>
            <p className="mt-0.5 flex items-start gap-1 text-[12.5px] leading-snug text-muted">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              {t('pickupText', { address: settings.pickupAddress })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Faq({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const vars = { min: qtyText(cfg.rules.min, lang), step: qtyText(cfg.rules.step, lang), days: cfg.product.leadDays ?? 7 };
  const items = (['1', '2', '3', '4', '5', '6'] as const)
    .filter((n) => cfg.run || n !== '2')
    .map((n) => ({ title: t(`faq${n}q`), content: t(`faq${n}a`, vars) }));
  return (
    <div className="max-w-3xl">
      <Accordion items={items} />
    </div>
  );
}
