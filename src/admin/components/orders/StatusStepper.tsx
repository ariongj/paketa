import { Check, ClipboardCheck, House, Inbox, PackageOpen, Printer, Truck, type LucideIcon } from 'lucide-react';
import { useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { date } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';
import { flowFor } from './helpers';

const ICON: Record<OrderStatus, LucideIcon> = {
  new: Inbox,
  confirmed: ClipboardCheck,
  processing: PackageOpen,
  installation: Printer,
  shipped: Truck,
  completed: House,
  cancelled: Inbox,
};

/** Index of the furthest step the order reached in its own flow (also for cancelled orders, from the timeline). */
export function reachedIndex(order: Order, flow: OrderStatus[] = flowFor(order)) {
  if (order.status !== 'cancelled') return Math.max(0, flow.indexOf(order.status));
  return order.timeline.reduce((m, e) => Math.max(m, flow.indexOf(e.status as OrderStatus)), 0);
}

/** Horizontal new → completed stepper with the date each step was reached; "Në printim" only for logo-print orders. */
export function StatusStepper({ order }: { order: Order }) {
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const flow = flowFor(order);
  const cancelled = order.status === 'cancelled';
  const current = reachedIndex(order, flow);

  const reachedAt = (s: OrderStatus) => {
    for (let i = order.timeline.length - 1; i >= 0; i--) if (order.timeline[i].status === s) return order.timeline[i].at;
    return s === 'new' ? order.createdAt : undefined;
  };

  return (
    <ol className={cn('grid', flow.length === 6 ? 'grid-cols-6' : 'grid-cols-5')}>
      {flow.map((s, i) => {
        const Icon = ICON[s];
        const done = i < current || (i === current && s === 'completed');
        const active = i === current && !done && !cancelled;
        const at = i <= current ? reachedAt(s) : undefined;
        return (
          <li key={s} className="relative flex flex-col items-center px-0.5 text-center">
            {i < flow.length - 1 && (
              <span aria-hidden className="absolute left-1/2 top-[15px] h-0.5 w-full sm:top-[17px]">
                <span className="absolute inset-0 rounded-full bg-line" />
                <span className={cn('absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out', cancelled ? 'bg-ink/25' : 'bg-ink')} style={{ width: i < current ? '100%' : '0%' }} />
              </span>
            )}
            <span
              className={cn(
                'relative z-10 grid h-8 w-8 place-items-center rounded-full transition-all duration-300 sm:h-9 sm:w-9',
                done && (cancelled ? 'bg-ink/30 text-white' : 'bg-ink text-paper'),
                active && 'bg-brand-600 text-white shadow-[0_0_0_5px_var(--color-brand-100)]',
                !done && !active && 'bg-white text-muted ring-1 ring-line',
                i === current && cancelled && 'bg-ink/30 text-white ring-0',
              )}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={2.6} /> : <Icon className="h-4 w-4" />}
            </span>
            <span className={cn('mt-2 text-[11px] font-semibold leading-tight sm:text-[12.5px]', active ? 'text-brand-700' : i <= current ? 'text-ink' : 'text-muted', i !== current && 'max-sm:sr-only')}>{tc(`status_${s}`)}</span>
            <span className="mt-0.5 hidden text-[11px] tabular-nums text-muted sm:block">{at ? date(at, lang, { day: 'numeric', month: 'short' }) : ' '}</span>
          </li>
        );
      })}
    </ol>
  );
}
