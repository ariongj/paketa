import { useRef, useState, type DragEvent } from 'react';
import { FileUp, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ArtworkRef } from '@/lib/types';
import { useDict, useLang } from '@/i18n';
import { cn } from '@/lib/utils';
import { PD } from './dict';
import { ARTWORK_ACCEPT, ARTWORK_MAX_BYTES, artworkFromFile, fileExt, fileSize, isArtworkFile } from './print';

/** Validates and reads an artwork file → ArtworkRef (metadata + preview); toasts on a bad file. */
export function useArtworkReader() {
  const t = useDict(PD);
  const [busy, setBusy] = useState(false);
  const read = async (file: File | undefined | null): Promise<ArtworkRef | null> => {
    if (!file) return null;
    if (!isArtworkFile(file.name)) {
      toast.error(t('fileBadType', { ext: fileExt(file.name) || '?' }));
      return null;
    }
    if (file.size > ARTWORK_MAX_BYTES) {
      toast.error(t('fileTooBig'));
      return null;
    }
    setBusy(true);
    try {
      return await artworkFromFile(file);
    } finally {
      setBusy(false);
    }
  };
  return { read, busy };
}

/** Drag & drop zone (+ click to browse) for one print file. */
export function FileDrop({ onFile, compact, className }: { onFile: (a: ArtworkRef) => void; compact?: boolean; className?: string }) {
  const t = useDict(PD);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const { read, busy } = useArtworkReader();

  const take = async (file: File | undefined | null) => {
    const a = await read(file);
    if (a) onFile(a);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void take(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => input.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input.current?.click())}
      className={cn(
        'group/drop relative flex cursor-pointer items-center gap-3.5 rounded-xl border border-dashed text-left transition-colors outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
        compact ? 'px-3 py-2.5' : 'flex-col justify-center px-4 py-6 text-center sm:py-7',
        over ? 'border-brand-600 bg-brand-50/70' : 'border-ink/25 bg-paper/60 hover:border-ink/50 hover:bg-white',
        className,
      )}
    >
      <input ref={input} type="file" accept={ARTWORK_ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => void take(e.target.files?.[0]).then(() => (e.target.value = ''))} />
      <span className={cn('grid shrink-0 place-items-center rounded-full bg-white text-brand-600 shadow-sm ring-1 ring-line', compact ? 'h-9 w-9' : 'h-11 w-11')}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className={compact ? 'h-4 w-4' : 'h-5 w-5'} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink">
          {busy ? t('fileReading') : over ? t('dropActive') : t('drop')}
          {!busy && !over && (
            <>
              {' '}
              <span className="font-normal text-muted">{t('dropOr')}</span> <span className="text-brand-700 underline decoration-brand-700/30 underline-offset-2 group-hover/drop:decoration-brand-700">{t('dropBrowse')}</span>
            </>
          )}
        </span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.06em] text-muted">{t('dropTypes')}</span>
      </span>
    </div>
  );
}

/** Image preview or a file-type tile ("PDF", "AI"…). */
export function ArtworkThumb({ art, className }: { art: ArtworkRef; className?: string }) {
  const ext = art.name ? fileExt(art.name).toUpperCase() : '';
  if (art.thumb) return <img src={art.thumb} alt="" className={cn('rounded-lg bg-white object-cover ring-1 ring-line', className)} />;
  return (
    <span className={cn('relative grid place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-line', className)}>
      <span className="absolute right-0 top-0 h-3 w-3 bg-gradient-to-bl from-sand to-sand-2" />
      <span className="font-mono text-[10px] font-medium tracking-[0.06em] text-brand-700">{ext || 'FILE'}</span>
    </span>
  );
}

/** Uploaded file card with replace / remove. */
export function ArtworkFileCard({ art, onRemove, onReplace, className }: { art: ArtworkRef; onRemove?: () => void; onReplace?: (a: ArtworkRef) => void; className?: string }) {
  const t = useDict(PD);
  const lang = useLang();
  const input = useRef<HTMLInputElement>(null);
  const { read, busy } = useArtworkReader();
  return (
    <div className={cn('flex items-center gap-3 rounded-xl bg-white p-2.5 pr-2 ring-1 ring-line', className)}>
      <ArtworkThumb art={art} className="h-12 w-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-ink">{art.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted">
          <span className="font-mono tabular-nums">{fileSize(art.size, lang)}</span>
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('fileReady')}
          </span>
        </div>
      </div>
      {onReplace && (
        <>
          <input
            ref={input}
            type="file"
            accept={ARTWORK_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            onChange={async (e) => {
              const a = await read(e.target.files?.[0]);
              e.target.value = '';
              if (a) onReplace(a);
            }}
          />
          <button type="button" onClick={() => input.current?.click()} title={t('fileReplace')} aria-label={t('fileReplace')} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} title={t('fileRemove')} aria-label={t('fileRemove')} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
