import { useRef } from 'react';
import { toast } from 'sonner';
import { Clock3, FileCheck2, Loader2, Paperclip, PenTool } from 'lucide-react';
import type { ArtworkRef, Product } from '@/lib/types';
import { useDict, useLang } from '@/i18n';
import { cartKey, useUi } from '@/store/ui';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useArtworkReader, ArtworkThumb } from '@/site/components/product/ArtworkDrop';
import { ARTWORK_ACCEPT, fileSize, hasDesign } from '@/site/components/product/print';
import { ck } from './dict';

/* ------------------------------------------------------------------ */
/* Cart-line artwork updates                                           */
/* ------------------------------------------------------------------ */
export function setLineArtwork(key: string, artwork: ArtworkRef) {
  useUi.getState().setLineArtwork(key, artwork);
}

/** Toggle the design service on a cart line; the artwork status follows (design ↔ file later). */
export function switchDesign(key: string, on: boolean) {
  const ui = useUi.getState();
  const line = ui.cart.find((c) => c.key === key);
  if (!line) return;
  ui.setInstallation(key, on);
  const note = line.artwork?.note ? { note: line.artwork.note } : {};
  setLineArtwork(cartKey(line.productId, line.options, on, line.artwork), on ? { status: 'design', ...note } : { status: 'later', ...note });
}

/* ------------------------------------------------------------------ */
/* Status chip                                                          */
/* ------------------------------------------------------------------ */
export function ArtworkChip({ art, size = 'md', className }: { art: ArtworkRef; size?: 'sm' | 'md'; className?: string }) {
  const t = useDict(ck);
  const base = cn('inline-flex max-w-full items-center gap-1.5 rounded-full font-medium', size === 'sm' ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-[12px]', className);
  if (art.status === 'uploaded')
    return (
      <span className={cn(base, 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/15')} title={art.name}>
        <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{art.name ?? t('art_uploaded')}</span>
      </span>
    );
  if (art.status === 'design')
    return (
      <span className={cn(base, 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100')}>
        <PenTool className="h-3.5 w-3.5 shrink-0" />
        {t('art_design')}
      </span>
    );
  return (
    <span className={cn(base, 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20')}>
      <Clock3 className="h-3.5 w-3.5 shrink-0" />
      {t('art_later')}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* "Attach file" button (hidden input + drop target)                    */
/* ------------------------------------------------------------------ */
export function AttachButton({ onFile, label, className, solid, ghost }: { onFile: (a: ArtworkRef) => void; label?: string; className?: string; solid?: boolean; ghost?: boolean }) {
  const t = useDict(ck);
  const input = useRef<HTMLInputElement>(null);
  const { read, busy } = useArtworkReader();
  const take = async (f: File | undefined | null) => {
    const a = await read(f);
    if (a) {
      onFile(a);
      toast.success(t('art_attached'), { description: a.name });
    }
  };
  return (
    <>
      <input ref={input} type="file" accept={ARTWORK_ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => void take(e.target.files?.[0]).then(() => (e.target.value = ''))} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void take(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full text-[12px] font-semibold transition-colors',
          solid ? 'h-8 bg-ink px-3.5 text-paper hover:bg-brand-600' : ghost ? 'h-7 px-1.5 text-muted hover:text-ink' : 'h-7 border border-dashed border-ink/30 bg-white px-2.5 text-ink hover:border-brand-600 hover:text-brand-700',
          className,
        )}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
        {label ?? t('art_attach')}
      </button>
    </>
  );
}

/** Artwork row of a cart line: status + attach a file to a "later" line, or switch the design service. */
export function LineArtwork({ itemKey, art, product, compact }: { itemKey: string; art: ArtworkRef | undefined; product: Product; compact?: boolean }) {
  const t = useDict(ck);
  const lang = useLang();
  if (!art) return null;
  const design = hasDesign(product);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {art.status === 'uploaded' && art.thumb && !compact && <ArtworkThumb art={art} className="h-7 w-7" />}
      <ArtworkChip art={art} size={compact ? 'sm' : 'md'} />
      {art.status === 'uploaded' && art.size && !compact && <span className="font-mono text-[10.5px] text-muted">{fileSize(art.size, lang)}</span>}
      {art.status === 'later' && (
        <>
          <AttachButton onFile={(a) => setLineArtwork(itemKey, { ...a, ...(art.note ? { note: art.note } : {}) })} />
          {design && !compact && (
            <button type="button" onClick={() => switchDesign(itemKey, true)} className="text-[12px] font-medium text-muted underline decoration-dotted underline-offset-2 hover:text-brand-700">
              {t('art_orDesign', { price: money(product.installation!.price, lang, { decimals: false }) })}
            </button>
          )}
        </>
      )}
      {art.status === 'uploaded' && !compact && <AttachButton onFile={(a) => setLineArtwork(itemKey, { ...a, ...(art.note ? { note: art.note } : {}) })} label={t('art_replace')} ghost />}
      {art.status === 'design' && !compact && (
        <button type="button" onClick={() => switchDesign(itemKey, false)} className="text-[12px] font-medium text-muted underline decoration-dotted underline-offset-2 hover:text-ink">
          {t('art_removeDesign')}
        </button>
      )}
    </div>
  );
}
