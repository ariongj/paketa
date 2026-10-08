// Complaints (Reklamacione) as seen from the orders area. The flow lives in components/returns — this module keeps
// the older orders-area API (`ReturnDrawer({ ret })`, `CreateReturnDrawer`, `RT`) so any caller gets the same
// print wording: reasons, reprint / refund / credit note, restocking off for custom-printed goods.
import type { ReturnRequest } from '@/lib/types';
import { ReturnDrawer as ComplaintDrawer } from '@/admin/components/returns/ReturnDrawer';
import { rd } from '@/admin/components/returns/dict';

export { CreateReturnDrawer } from '@/admin/components/returns/CreateReturnDrawer';
export { ComplaintBadge, ResolutionChip } from '@/admin/components/returns/ComplaintBadge';

/** Complaint strings (SQ / EN). */
export const RT = rd;

/** Detail drawer for one complaint. */
export function ReturnDrawer({ ret, onClose }: { ret: ReturnRequest | null; onClose: () => void }) {
  return <ComplaintDrawer id={ret?.id ?? null} onClose={onClose} />;
}
