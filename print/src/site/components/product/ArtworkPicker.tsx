import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Clock3, PenTool, Upload } from 'lucide-react';
import { useDict, useLang } from '@/i18n';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PD } from './dict';
import { ArtworkFileCard, FileDrop } from './ArtworkDrop';
import type { ArtMode, Configurator } from './useConfigurator';

const reveal = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
};

function Choice({ on, onSelect, icon, title, text, aside }: { on: boolean; onSelect: () => void; icon: ReactNode; title: string; text: string; aside?: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border bg-white p-3.5 text-left transition-all duration-200',
        on ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line hover:border-ink/35',
      )}
    >
      <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors', on ? 'border-ink' : 'border-ink/25')}>
        <span className={cn('h-2.5 w-2.5 rounded-full bg-ink transition-transform', on ? 'scale-100' : 'scale-0')} />
      </span>
      <span className={cn('mt-0.5 shrink-0', on ? 'text-brand-600' : 'text-ink-soft')}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-[14px] font-semibold text-ink">{title}</span>
          {aside}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{text}</span>
      </span>
    </button>
  );
}

/** Artwork step: upload now (drag & drop) · send later · professional design (+ fee). */
export function ArtworkPicker({ cfg, showError }: { cfg: Configurator; showError?: boolean }) {
  const t = useDict(PD);
  const lang = useLang();
  const set = (m: ArtMode) => cfg.setArtMode(m);

  return (
    <div className="space-y-2" role="radiogroup" aria-label={t('step_art')}>
      <Choice on={cfg.artMode === 'upload'} onSelect={() => set('upload')} icon={<Upload className="h-4 w-4" />} title={t('art_upload')} text={t('art_uploadText')} />
      <AnimatePresence initial={false}>
        {cfg.artMode === 'upload' && (
          <motion.div {...reveal} className="overflow-hidden">
            <div className="pb-1 pl-0 pt-1 sm:pl-8">
              {cfg.file ? (
                <ArtworkFileCard art={cfg.file} onRemove={() => cfg.setFile(null)} onReplace={(a) => cfg.setFile(a)} />
              ) : (
                <FileDrop onFile={(a) => cfg.setFile(a)} error={showError} />
              )}
              {showError && !cfg.file && (
                <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-amber-800" role="alert">
                  <AlertCircle className="h-3.5 w-3.5" /> {t('needFile')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Choice on={cfg.artMode === 'later'} onSelect={() => set('later')} icon={<Clock3 className="h-4 w-4" />} title={t('art_later')} text={t('art_laterText')} />
      {cfg.canDesign && (
        <Choice
          on={cfg.artMode === 'design'}
          onSelect={() => set('design')}
          icon={<PenTool className="h-4 w-4" />}
          title={t('art_design')}
          text={t('art_designText')}
          aside={
            <span className="font-mono text-[12px] font-medium tabular-nums text-brand-700">
              +{money(cfg.designFeeUnit, lang, { decimals: cfg.designFeeUnit % 1 !== 0 })} <span className="text-muted">· {t('perLine')}</span>
            </span>
          }
        />
      )}
      <label className="block pt-2">
        <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">
          {t('noteLabel')} <span className="font-normal text-muted">({t('optional')})</span>
        </span>
        <textarea
          rows={2}
          value={cfg.note}
          onChange={(e) => cfg.setNote(e.target.value)}
          placeholder={t('notePh')}
          className="w-full resize-y rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
        />
      </label>
    </div>
  );
}
