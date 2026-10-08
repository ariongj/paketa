import type { ComponentType, ReactNode } from 'react';
import { AlertTriangle, BookOpen, CalendarClock, CupSoda, FileText, Layers, Package, Paintbrush, Paperclip, Ruler, Shapes, ShoppingBag, Sparkles, Tag, UtensilsCrossed } from 'lucide-react';
import { Thumb } from '@/admin/components/kit';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { longDate } from '@/admin/components/appointments/dates';
import type { Product, RfqSpecs } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TYPICAL_LEAD_DAYS, daysUntil, deadlineState, fileSize, finishLabel, normSize, pcs, rfqProductLabel, type DeadlineState } from './rfq';

const T = defineDict({
  sq: {
    title: 'Specifikimet e kërkesës',
    type: 'Lloji i produktit',
    size: 'Dimensionet',
    material: 'Materiali',
    quantity: 'Sasia (tirazhi)',
    colours: 'Printimi',
    finishes: 'Finishing',
    deadline: 'Afati i dorëzimit',
    files: 'Skedarët e bashkëngjitur',
    noFiles: 'Pa skedar printimi — kërkojeni në përgjigje (PDF me 3 mm bleed) ose ofroni dizajnin.',
    none: '—',
    left: 'edhe {n} ditë',
    left1: 'nesër',
    today: 'sot',
    passed: 'kaloi para {n} ditësh',
    tight: 'Afat i ngushtë — prodhimi zgjat rreth {n} ditë pune pas aprovimit të provës.',
    inCatalogue: 'Nga faqja e produktit',
    filesN: '{n} skedarë',
    file1: '1 skedar',
  },
  en: {
    title: 'Request specification',
    type: 'Product type',
    size: 'Dimensions',
    material: 'Material',
    quantity: 'Quantity (print run)',
    colours: 'Print',
    finishes: 'Finishing',
    deadline: 'Needed by',
    files: 'Attached files',
    noFiles: 'No print file — ask for one in your reply (PDF with 3 mm bleed) or offer the design service.',
    none: '—',
    left: '{n} days left',
    left1: 'tomorrow',
    today: 'today',
    passed: '{n} days ago',
    tight: 'Tight deadline — production takes about {n} working days after proof approval.',
    inCatalogue: 'From the product page',
    filesN: '{n} files',
    file1: '1 file',
  },
});

type Icon = ComponentType<{ className?: string }>;

/** "2026-11-12" → local midnight (an ISO date-time is used as is). */
const parseIsoDay = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
};
export const RFQ_ICON: Record<string, Icon> = { box: Package, food: UtensilsCrossed, label: Tag, sleeve: CupSoda, bag: ShoppingBag, print: BookOpen, other: Shapes };
export const rfqIcon = (id?: string): Icon => (id && RFQ_ICON[id]) || Shapes;

function useDeadlineText() {
  const t = useDict(T, 'admin');
  return (days: number) => (days < 0 ? t('passed', { n: -days }) : days === 0 ? t('today') : days === 1 ? t('left1') : t('left', { n: days }));
}

const DEADLINE_TONE: Record<DeadlineState, string> = {
  passed: 'text-red-700',
  tight: 'text-amber-800',
  ok: 'text-ink-soft',
};

/** Compact spec chips for a list row: product · size · quantity · deadline · files. */
export function RfqInline({ specs, product, now, className }: { specs: RfqSpecs; product?: Product; now: number; className?: string }) {
  const lang = useLang('admin');
  const l = useL('admin');
  const t = useDict(T, 'admin');
  const deadlineText = useDeadlineText();
  const I = rfqIcon(specs.product);
  const days = specs.deadline ? daysUntil(specs.deadline, now) : null;
  const state = days == null ? null : deadlineState(days, product?.leadDays ?? TYPICAL_LEAD_DAYS);
  const files = specs.files?.length ?? 0;
  return (
    <span className={cn('flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-[12px] text-ink-soft', className)}>
      <Chip strong fluid className="max-w-[46%]">
        <I className="h-3 w-3 shrink-0 text-muted" />
        <span className="truncate">{product ? l(product.name) : rfqProductLabel(specs.product, lang)}</span>
      </Chip>
      {specs.quantity ? <Chip mono>{pcs(specs.quantity, lang)}</Chip> : null}
      {days != null && state && (
        <Chip className={DEADLINE_TONE[state]} title={`${t('deadline')}: ${longDate(parseIsoDay(specs.deadline!), lang)}`}>
          {state === 'ok' ? <CalendarClock className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />}
          {deadlineText(days)}
        </Chip>
      )}
      {files > 0 && (
        <Chip title={specs.files!.map((f) => f.name).join('\n')}>
          <Paperclip className="h-3 w-3 shrink-0 text-muted" />
          {files}
        </Chip>
      )}
      {specs.size && (
        <Chip mono fluid title={normSize(specs.size)}>
          <span className="truncate">{normSize(specs.size)}</span>
        </Chip>
      )}
    </span>
  );
}

function Chip({ children, strong, mono, fluid, className, title }: { children: ReactNode; strong?: boolean; mono?: boolean; fluid?: boolean; className?: string; title?: string }) {
  return (
    <span title={title} className={cn('inline-flex items-center gap-1 rounded-md bg-ink/[0.05] px-1.5 py-0.5 leading-4', fluid ? 'min-w-0 shrink' : 'shrink-0', strong && 'font-semibold text-ink', mono && 'font-mono text-[11.5px]', className)}>
      {children}
    </span>
  );
}

/** The structured RFQ in the inquiry drawer — every field the quote-request form collected. */
export function RfqSpecCard({ specs, product, now }: { specs: RfqSpecs; product?: Product; now: number }) {
  const t = useDict(T, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const deadlineText = useDeadlineText();
  const I = rfqIcon(specs.product);
  const lead = product?.leadDays ?? TYPICAL_LEAD_DAYS;
  const days = specs.deadline ? daysUntil(specs.deadline, now) : null;
  const state = days == null ? null : deadlineState(days, lead);
  const files = specs.files ?? [];
  const finishes = (specs.finishes ?? []).filter(Boolean);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {/* product */}
      <div className="flex items-center gap-3 border-b border-line/70 bg-canvas/40 px-4 py-3">
        {product?.images[0] ? (
          <Thumb src={product.images[0]} className="h-11 w-11 rounded-lg" />
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-ink-soft ring-1 ring-line">
            <I className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-ink">{product ? l(product.name) : rfqProductLabel(specs.product, lang)}</div>
          <div className="truncate text-[12px] text-muted">
            {t('type')}: {rfqProductLabel(specs.product, lang)}
            {product && ` · ${t('inCatalogue')}`}
          </div>
        </div>
        {specs.quantity ? (
          <div className="shrink-0 text-right">
            <div className="font-mono text-[15px] font-semibold tabular-nums text-ink">{pcs(specs.quantity, lang)}</div>
          </div>
        ) : null}
      </div>

      {/* spec grid */}
      <dl className="grid sm:grid-cols-2">
        <Spec icon={<Ruler className="h-3.5 w-3.5" />} label={t('size')} value={specs.size ? <span className="font-mono">{normSize(specs.size)}</span> : null} empty={t('none')} />
        <Spec icon={<Layers className="h-3.5 w-3.5" />} label={t('material')} value={specs.material} empty={t('none')} />
        <Spec icon={<Paintbrush className="h-3.5 w-3.5" />} label={t('colours')} value={specs.colours} empty={t('none')} />
        <Spec icon={<Package className="h-3.5 w-3.5" />} label={t('quantity')} value={specs.quantity ? <span className="font-mono">{pcs(specs.quantity, lang)}</span> : null} empty={t('none')} />
        <div className="border-t border-line/70 px-4 py-2.5 sm:col-span-2">
          <dt className="flex items-center gap-1.5 text-[11.5px] text-muted">
            <Sparkles className="h-3.5 w-3.5" /> {t('finishes')}
          </dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {finishes.length ? (
              finishes.map((f) => (
                <span key={f} className="inline-flex h-6 items-center rounded-md border border-line bg-white px-2 text-[12px] font-semibold text-ink">
                  {finishLabel(f, lang)}
                </span>
              ))
            ) : (
              <span className="text-[13px] text-muted">{t('none')}</span>
            )}
          </dd>
        </div>
        <div className="border-t border-line/70 px-4 py-2.5 sm:col-span-2">
          <dt className="flex items-center gap-1.5 text-[11.5px] text-muted">
            <CalendarClock className="h-3.5 w-3.5" /> {t('deadline')}
          </dt>
          <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-[13.5px]">
            {specs.deadline && days != null && state ? (
              <>
                <span className="font-semibold text-ink">{longDate(parseIsoDay(specs.deadline), lang)}</span>
                <span className={cn('inline-flex items-center gap-1 text-[12.5px] font-semibold', DEADLINE_TONE[state])}>
                  {state !== 'ok' && <AlertTriangle className="h-3.5 w-3.5 self-center" />}
                  {deadlineText(days)}
                </span>
              </>
            ) : (
              <span className="text-muted">{t('none')}</span>
            )}
          </dd>
          {state === 'tight' && <p className="mt-1 text-[12px] text-amber-800">{t('tight', { n: lead })}</p>}
        </div>
        <div className="border-t border-line/70 px-4 py-2.5 sm:col-span-2">
          <dt className="flex items-center gap-1.5 text-[11.5px] text-muted">
            <Paperclip className="h-3.5 w-3.5" /> {t('files')}
            {files.length > 0 && <span className="text-muted">· {files.length === 1 ? t('file1') : t('filesN', { n: files.length })}</span>}
          </dt>
          {files.length ? (
            <ul className="mt-1.5 space-y-1">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg bg-canvas/60 px-2.5 py-1.5 text-[13px]">
                  <FileText className="h-4 w-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{f.name}</span>
                  <span className="shrink-0 font-mono text-[11.5px] text-muted">{fileSize(f.size, lang)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12.5px] text-muted">{t('noFiles')}</p>
          )}
        </div>
      </dl>
    </div>
  );
}

function Spec({ icon, label, value, empty }: { icon: ReactNode; label: ReactNode; value?: ReactNode; empty: string }) {
  return (
    <div className="border-t border-line/70 px-4 py-2.5 first:border-t-0 sm:[&:nth-child(2)]:border-t-0 sm:odd:border-r sm:odd:border-r-line/70">
      <dt className="flex items-center gap-1.5 text-[11.5px] text-muted">
        {icon} {label}
      </dt>
      <dd className={cn('mt-0.5 text-[13.5px]', value ? 'font-semibold text-ink' : 'text-muted')}>{value || empty}</dd>
    </div>
  );
}
