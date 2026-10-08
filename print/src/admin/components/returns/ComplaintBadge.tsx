// Complaint status + resolution chips (PDF p.07: text + symbol, never colour alone).
import { Banknote, ReceiptText, RotateCcw } from 'lucide-react';
import { useDict } from '@/i18n';
import { cn } from '@/lib/utils';
import type { ReturnRequest, ReturnStatus } from '@/lib/types';
import { StatusPill, type Glyph, type PillTone } from '@/admin/components/orders/status';
import { rd } from './dict';
import { resolutionOf, type Resolution } from './helpers';

const PILL: Record<ReturnStatus, [PillTone, Glyph]> = {
  requested: ['attention', 'ring'],
  approved: ['attention', 'half'],
  received: ['outline', 'dot'],
  refunded: ['neutral', 'check'],
  rejected: ['subtle', 'cross'],
};

/** Status in complaint wording; a closed complaint says how it was settled (refund / credit note / reprint). */
export function ComplaintBadge({ ret, className }: { ret: ReturnRequest; className?: string }) {
  const t = useDict(rd, 'admin');
  const [tone, glyph] = PILL[ret.status] ?? PILL.requested;
  const res = resolutionOf(ret);
  const label = ret.status === 'refunded' ? (res === 'reprint' ? t('st_reprint') : res === 'credit' ? t('st_credit') : t('st_refunded')) : t(`st_${ret.status}`);
  return (
    <StatusPill tone={tone} glyph={glyph} className={className}>
      {label}
    </StatusPill>
  );
}

export const RESOLUTION_ICON: Record<Resolution, typeof RotateCcw> = { reprint: RotateCcw, refund: Banknote, credit: ReceiptText };

/** Small outline chip: ↻ Ribotim / ▭ Rimbursim / ▤ Notë krediti. */
export function ResolutionChip({ resolution, className }: { resolution: Resolution; className?: string }) {
  const t = useDict(rd, 'admin');
  const Icon = RESOLUTION_ICON[resolution];
  return (
    <span className={cn('inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-white px-1.5 text-[12px] font-semibold text-ink-soft', className)}>
      <Icon className="h-3.5 w-3.5" />
      {t(`res_${resolution}`)}
    </span>
  );
}
