// "How it works" + terms for an offer: code to copy, automatic discount, buy-X-get-Y gift, or an editorial offer.
import { Copy, Gift, ListChecks, MousePointerClick, Package, PackagePlus, PiggyBank, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { Reveal } from '@/components/ui/misc';
import { SectionHeading } from '@/site/components/SectionHeading';
import { StepCards } from '@/site/components/company/Blocks';
import { useLang } from '@/i18n';
import { money } from '@/lib/format';
import type { Discount, Offer } from '@/lib/types';
import { longDate } from './model';
import { useOT } from './i18n';

export function HowItWorks({ offer, discount, value }: { offer: Offer; discount?: Discount; value: string | null }) {
  const t = useOT();
  const lang = useLang();
  const v = value ?? '';

  const steps = !discount
    ? [
        { icon: Sparkles, title: t('e1_t'), text: t('e1_x') },
        { icon: Gift, title: t('e2_t'), text: t('e2_x') },
        { icon: Package, title: t('e3_t'), text: t('e3_x') },
      ]
    : discount.kind === 'bxgy' && discount.bxgy
      ? [
          { icon: ShoppingBag, title: t('b1_t', { n: discount.bxgy.buyQty }), text: t('b1_x') },
          { icon: PackagePlus, title: t('b2_t'), text: t('b2_x', { n: discount.bxgy.getQty }) },
          { icon: Gift, title: t('b3_t'), text: t('b3_x', { max: discount.bxgy.maxUses || 1 }) },
        ]
      : discount.method === 'code'
        ? [
            { icon: Copy, title: t('c1_t'), text: t('c1_x') },
            { icon: ShoppingBag, title: t('c2_t'), text: t('c2_x') },
            { icon: PiggyBank, title: t('c3_t', { value: v.replace(/^−/, '') || v }), text: t('c3_x') },
          ]
        : [
            { icon: MousePointerClick, title: t('a1_t'), text: t('a1_x') },
            { icon: ShoppingBag, title: t('a2_t'), text: t('a2_x') },
            { icon: discount.kind === 'shipping' ? Truck : PiggyBank, title: t('a3_t'), text: t('a3_x', { value: v }) },
          ];

  const terms: string[] = [];
  terms.push(offer.endsAt ? t('t_valid', { from: longDate(offer.startsAt, lang), to: longDate(offer.endsAt, lang) }) : t('t_validOpen', { from: longDate(offer.startsAt, lang) }));
  if (discount) {
    if (discount.minimum.type === 'amount' && discount.minimum.value > 0) terms.push(t('t_min', { sum: money(discount.minimum.value, lang) }));
    if (discount.minimum.type === 'qty' && discount.minimum.value > 0) terms.push(t('t_minQty', { n: discount.minimum.value }));
    terms.push(discount.method === 'code' && discount.code ? t('t_code', { code: discount.code }) : t('t_auto'));
    const list = [discount.combines.products && t('cl_products'), discount.combines.order && t('cl_order'), discount.combines.shipping && t('cl_shipping')].filter(Boolean) as string[];
    terms.push(list.length ? t('t_combines', { list: list.join(', ') }) : t('t_noCombine'));
    if (discount.oncePerCustomer) terms.push(t('t_once'));
    if (discount.usageLimit) terms.push(t('t_limited'));
  } else terms.push(t('t_editorial'));
  terms.push(t('t_tiers'));

  return (
    <section className="py-20 sm:py-24">
      <div className="container-x">
        <Reveal>
          <SectionHeading eyebrow={t('how_eyebrow')} title={discount ? t('how_title') : t('how_title_ed')} />
        </Reveal>
        <StepCards className="mt-12" steps={steps} />
        <Reveal className="mt-5">
          <div className="rounded-3xl border-2 border-dashed border-brand-600/25 bg-white/60 p-6 sm:p-8">
            <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              <ListChecks className="h-4 w-4 text-brand-600" /> {t('terms')}
            </div>
            <ul className="mt-4 grid gap-x-8 gap-y-2.5 text-[14.5px] text-ink-soft sm:grid-cols-2">
              {terms.map((x) => (
                <li key={x} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
