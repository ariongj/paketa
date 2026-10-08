import { Fragment, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Banknote, Boxes, CalendarCheck, Check, Coins, Layers, Mail, MapPin, Package, RotateCcw, Stamp, Store, Truck } from 'lucide-react';
import type { Category, Product } from '@/lib/types';
import { Accordion, Img, Tabs } from '@/components/ui/misc';
import { useDict, useL, useLang } from '@/i18n';
import { useCart, useSettings } from '@/store/hooks';
import { basePrice, piecePrice, tiersOf } from '@/lib/pricing';
import { cartonLabel, money, moneyPiece, num, pieces, unitLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { isPackProduct } from '@/site/components/Price';
import { PD } from './dict';

type Tab = 'desc' | 'specs' | 'shipping' | 'faq';

/** Real returns mailbox of Paketoje (return policy: 5 days, unused, original packaging). */
export const RETURNS_EMAIL = 'refund@paketoje.com';

export function DetailTabs({ product, category }: { product: Product; category?: Category }) {
  const t = useDict(PD);
  const [tab, setTab] = useState<Tab>('desc');
  return (
    <section id="detajet" className="scroll-mt-28">
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        className="no-scrollbar gap-5 overflow-x-auto sm:gap-8"
        tabs={[
          { id: 'desc', label: <span className="whitespace-nowrap text-[15px] sm:text-base">{t('tab_desc')}</span> },
          { id: 'specs', label: <span className="whitespace-nowrap text-[15px] sm:text-base">{t('tab_specs')}</span> },
          { id: 'shipping', label: <span className="whitespace-nowrap text-[15px] sm:text-base">{t('tab_shipping')}</span> },
          { id: 'faq', label: <span className="whitespace-nowrap text-[15px] sm:text-base">{t('tab_faq')}</span> },
        ]}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="pt-8 sm:pt-10">
          {tab === 'desc' && <Description product={product} category={category} />}
          {tab === 'specs' && <Specs product={product} category={category} />}
          {tab === 'shipping' && <Shipping product={product} />}
          {tab === 'faq' && <Faq product={product} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Description: paragraphs; lines starting with ✔ become a checklist   */
/* ------------------------------------------------------------------ */
const CHECK = /^\s*[✔✓☑•✅]\s*/;

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  let firstPara = true;
  return (
    <div className={cn('space-y-5', className)}>
      {blocks.map((block, bi) => {
        // group consecutive checklist lines; everything else is paragraph text
        const groups: { list: boolean; lines: string[] }[] = [];
        for (const line of block.split('\n').map((x) => x.trim()).filter(Boolean)) {
          const list = CHECK.test(line);
          const last = groups[groups.length - 1];
          if (last && last.list === list) last.lines.push(list ? line.replace(CHECK, '') : line);
          else groups.push({ list, lines: [list ? line.replace(CHECK, '') : line] });
        }
        return (
          <Fragment key={bi}>
            {groups.map((g, gi) => {
              if (g.list)
                return (
                  <ul key={gi} className="grid gap-2.5 rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
                    {g.lines.map((li, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] leading-snug text-ink">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime text-ink">
                          <Check className="h-3 w-3" strokeWidth={3.2} />
                        </span>
                        {li}
                      </li>
                    ))}
                  </ul>
                );
              const lead = firstPara;
              firstPara = false;
              return (
                <p key={gi} className={lead ? 'text-[17px] leading-[1.65] text-ink sm:text-[18px]' : 'text-[15.5px] leading-[1.75] text-ink-soft'}>
                  {g.lines.join(' ')}
                </p>
              );
            })}
          </Fragment>
        );
      })}
    </div>
  );
}

type Fact = { icon: typeof Boxes; label: string; value: string };

function useFacts(p: Product): Fact[] {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const pack = isPackProduct(p);
  const tiers = tiersOf(p);
  const facts: (Fact | null)[] = pack
    ? [
        { icon: Package, label: t('spec_pack'), value: pieces(p.packSize ?? 1, lang) },
        p.cartonPacks ? { icon: Boxes, label: t('spec_carton'), value: `${p.cartonPacks} ${unitLabel('pack', lang)} · ${pieces(p.cartonPacks * (p.packSize ?? 1), lang)}` } : null,
        { icon: Coins, label: t('spec_piecePrice'), value: moneyPiece(piecePrice(p), lang) },
        tiers.length ? { icon: Layers, label: t('spec_tiers'), value: tiers.map((x) => `${x.minQty}+ −${x.pct}%`).join(' · ') } : null,
        p.installation?.available ? { icon: Stamp, label: t('spec_logo'), value: `+${money(p.installation.price, lang)} ${t('perPack')}` } : null,
        p.leadDays ? { icon: Truck, label: t('spec_lead'), value: t('daysApprox', { n: p.leadDays }) } : null,
      ]
    : [...p.specs.slice(0, 4).map((s) => ({ icon: Check, label: l(s.label), value: l(s.value) })), p.leadDays ? { icon: Truck, label: t('leadTime'), value: t('leadValue', { n: p.leadDays }) } : null];
  return facts.filter(Boolean).slice(0, 6) as Fact[];
}

function Description({ product: p }: { product: Product; category?: Category }) {
  const t = useDict(PD);
  const l = useL();
  const facts = useFacts(p);
  const text = l(p.description) || l(p.short);
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="max-w-3xl lg:col-span-7">
        <RichText text={text} />
      </div>
      <div className="lg:col-span-5">
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line lg:sticky lg:top-[100px]">
          {p.images[1] && (
            <div className="aspect-[16/10] overflow-hidden bg-sand">
              <Img src={p.images[1]} small alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-5 sm:p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{t('highlights')}</div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
              {facts.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand text-ink">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[12px] text-muted">{f.label}</dt>
                      <dd className="text-[14px] font-bold leading-snug text-ink">{f.value}</dd>
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
const PACK_LABELS = ['pack', 'carton'];

function Specs({ product: p, category }: { product: Product; category?: Category }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const pack = isPackProduct(p);
  const size = p.packSize ?? 1;
  const tiers = tiersOf(p);
  const hasLogoSpec = p.specs.some((s) => /logo/i.test(s.label.en));
  const unitText = pack ? t('unit_pack', { n: num(size, lang, 0) }) : p.unit === 'm' ? t('unit_m') : p.unit === 'set' ? t('unit_set') : t('unit_kom');

  const rows: [string, ReactNode][] = [];
  rows.push([t('spec_unit'), unitText]);
  if (pack) {
    rows.push([t('spec_pack'), pieces(size, lang)]);
    if (p.cartonPacks) {
      rows.push([t('spec_carton'), `${p.cartonPacks} ${unitLabel('pack', lang)}`]);
      rows.push([t('spec_cartonPieces'), pieces(p.cartonPacks * size, lang)]);
    }
  }
  // catalogue specs, minus the pack/carton rows we already render from the product fields
  for (const s of p.specs) if (!(pack && PACK_LABELS.includes(s.label.en.trim().toLowerCase()))) rows.push([l(s.label), l(s.value)]);
  if (!p.quoteOnly) {
    if (pack) {
      rows.push([t('spec_packPrice'), money(basePrice(p), lang)]);
      rows.push([t('spec_piecePrice'), moneyPiece(piecePrice(p), lang)]);
    }
    if (tiers.length)
      rows.push([
        t('spec_tiers'),
        tiers
          .map((x) => {
            const cartons = p.cartonPacks && x.minQty % p.cartonPacks === 0 ? x.minQty / p.cartonPacks : 0;
            const qty = cartons ? `${cartons} ${cartonLabel(cartons, lang)}` : `${x.minQty}+ ${unitLabel(p.unit, lang)}`;
            return t('tierLine', { qty, pct: x.pct });
          })
          .join(' · '),
      ]);
    if (!hasLogoSpec) rows.push([t('spec_logo'), p.installation?.available ? t('spec_logoValue', { price: money(p.installation.price, lang) }) : t('spec_logoNo')]);
  }
  if (p.leadDays) rows.push([p.quoteOnly ? t('leadTime') : t('spec_lead'), p.quoteOnly ? t('leadValue', { n: p.leadDays }) : t('daysApprox', { n: p.leadDays })]);
  if (category) rows.push([t('spec_category'), l(category.name)]);
  rows.push([t('spec_sku'), p.sku]);

  return (
    <div className="max-w-3xl">
      <dl className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        {rows.map(([k, v], i) => (
          <div key={i} className={cn('grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-5 py-3.5 text-[14.5px] sm:px-7 sm:py-4', i % 2 === 1 && 'bg-paper/60', i > 0 && 'border-t border-line/70')}>
            <dt className="text-muted">{k}</dt>
            <dd className="font-semibold tabular-nums text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function returnAddress(address: string, city: string) {
  if (!city || address.toLowerCase().includes(city.toLowerCase())) return address;
  return [address, city].filter(Boolean).join(', ');
}

function Shipping({ product: p }: { product: Product }) {
  const t = useDict(PD);
  const lang = useLang();
  const settings = useSettings();
  const cart = useCart();
  const threshold = cart.freeShippingThreshold ?? settings.freeShippingThreshold;
  const returns = [t('returns1'), t('returns2'), t('returns3')];
  const [returnsBefore, returnsAfter = ''] = t('returnsText').split('{email}');
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <h3 className="flex items-center gap-2.5 text-lg font-bold text-ink">
          <Truck className="h-5 w-5 text-brand-600" /> {t('zonesTitle')}
        </h3>
        <div className="mt-4 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
          {settings.shippingZones.map((z, i) => (
            <div key={z.id} className={cn('flex items-start justify-between gap-4 px-5 py-4 sm:px-6', i > 0 && 'border-t border-line/70')}>
              <div className="min-w-0">
                <div className="text-[14.5px] font-bold text-ink">{z.name}</div>
                <div className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted">{z.cities.join(', ')}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[15px] font-bold tabular-nums text-ink">{money(z.fee, lang)}</div>
                <div className="mt-0.5 text-[12px] text-muted">{t('daysValue', { days: z.days })}</div>
              </div>
            </div>
          ))}
        </div>
        {threshold > 0 && (
          <div className="mt-4 flex gap-3 rounded-2xl bg-lime-soft p-4 ring-1 ring-inset ring-lime-ink/10">
            <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-lime-ink" />
            <div>
              <div className="text-[14px] font-bold text-ink">{t('freeOver', { amount: money(threshold, lang, { decimals: threshold % 1 !== 0 }) })}</div>
              <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{t('freeOverText')}</p>
            </div>
          </div>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
            <div>
              <div className="text-[14px] font-bold text-ink">{t('pickup')}</div>
              <p className="mt-0.5 flex items-start gap-1 text-[12.5px] leading-snug text-muted">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                {t('pickupText', { address: settings.pickupAddress })}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
            <div>
              <div className="text-[14px] font-bold text-ink">{t('payTitle')}</div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{t('payText')}</p>
            </div>
          </div>
          {p.installation?.available && (
            <div className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-line sm:col-span-2">
              <Stamp className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
              <div>
                <div className="text-[14px] font-bold text-ink">{t('logoShipTitle')}</div>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{t('logoShipText')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="flex items-center gap-2.5 text-lg font-bold text-ink">
          <RotateCcw className="h-5 w-5 text-brand-600" /> {t('returnsTitle')}
        </h3>
        <div className="mt-4 rounded-3xl bg-ink p-6 text-paper sm:p-7">
          <ol className="space-y-4">
            {returns.map((s, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-lg text-lime">{i + 1}</span>
                <span className="pt-2 text-[15px] font-semibold leading-snug">{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 space-y-2 border-t border-white/10 pt-5 text-[14px] leading-relaxed text-paper/75">
            <p className="flex items-start gap-2">
              <Mail className="mt-1 h-4 w-4 shrink-0 text-lime" />
              <span>
                {returnsBefore}
                <a href={`mailto:${RETURNS_EMAIL}`} className="font-bold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                  {RETURNS_EMAIL}
                </a>
                {returnsAfter}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-lime" />
              {t('returnsAddress', { address: returnAddress(settings.address, settings.city) })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Faq({ product: p }: { product: Product }) {
  const t = useDict(PD);
  const lang = useLang();
  const settings = useSettings();
  const cart = useCart();
  const threshold = cart.freeShippingThreshold ?? settings.freeShippingThreshold;
  const pack = isPackProduct(p);
  const tiers = tiersOf(p);
  const tierText = tiers.map((x) => `${x.minQty}+ ${unitLabel(p.unit, lang)} −${x.pct}%`).join(', ');
  const items = [
    { q: t('faq1q'), a: pack ? t('faq1a', { n: num(p.packSize ?? 1, lang, 0), price: moneyPiece(piecePrice(p), lang) }) : t('faq1aUnit') },
    { q: t('faq2q'), a: tiers.length ? t('faq2a', { tiers: tierText }) : t('faq2aNone') },
    { q: t('faq3q'), a: t('faq3a', { amount: money(threshold, lang, { decimals: threshold % 1 !== 0 }) }) },
    { q: t('faq4q'), a: p.installation?.available ? t('faq4a', { price: money(p.installation.price, lang) }) : t('faq4aNo') },
    { q: t('faq5q'), a: t('faq5a') },
    { q: t('faq6q'), a: t('faq6a', { email: RETURNS_EMAIL }) },
  ];
  return (
    <div className="max-w-3xl">
      <Accordion
        defaultOpen={0}
        items={items.map((it) => ({
          title: <span className="text-[15.5px] font-bold text-ink">{it.q}</span>,
          content: <p className="text-[15px] leading-relaxed text-ink-soft">{it.a}</p>,
        }))}
      />
    </div>
  );
}
