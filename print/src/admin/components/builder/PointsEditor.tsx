import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { L10n, Lang } from '@/lib/types';
import { Hint } from '@/components/ui/Field';
import { LANGS, useDict, useLang } from '@/i18n';
import { adm } from '@/admin/i18n';
import { cn } from '@/lib/utils';
import { B } from './i18n';
import { IconBtn, ctl } from './fields';

type Row = { sq: string; en: string };

const toRows = (v: L10n): Row[] => {
  const sq = v.sq.split('\n');
  const en = v.en.split('\n');
  const n = Math.max(sq.length, en.length, 1);
  return Array.from({ length: n }, (_, i) => ({ sq: sq[i] ?? '', en: en[i] ?? '' }));
};
const fromRows = (rows: Row[]): L10n => ({ sq: rows.map((r) => r.sq).join('\n'), en: rows.map((r) => r.en).join('\n') });

/**
 * Bullet list editor for a multi-line L10n field ("one point per line"): one row per point, add / remove /
 * reorder, with a language switch — the other language is shown as the placeholder for reference.
 */
export function PointsEditor({ value, onChange, max = 10 }: { value: L10n; onChange: (v: L10n) => void; max?: number }) {
  const t = useDict(B, 'admin');
  const ta = useDict(adm, 'admin');
  const adminLang = useLang('admin');
  const [lang, setLang] = useState<Lang>(adminLang);
  const rows = toRows(value);
  const other: Lang = lang === 'sq' ? 'en' : 'sq';
  const missing = (k: Lang) => rows.filter((r) => (r.sq.trim() || r.en.trim()) && !r[k].trim()).length;

  const commit = (next: Row[]) => onChange(fromRows(next.length ? next : [{ sq: '', en: '' }]));
  const edit = (i: number, v: string) => commit(rows.map((r, k) => (k === i ? { ...r, [lang]: v } : r)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink-soft">{t('points')}</span>
        <div className="flex rounded-md bg-[#F1F1F1] p-0.5" role="tablist" aria-label={t('points')}>
          {LANGS.map((lg) => (
            <button
              key={lg.code}
              type="button"
              role="tab"
              aria-selected={lang === lg.code}
              onClick={() => setLang(lg.code)}
              className={cn('relative h-6 rounded px-2 text-[10.5px] font-bold tracking-wide transition-colors', lang === lg.code ? 'bg-white text-ink shadow-[0_1px_2px_rgb(0_0_0/0.12)]' : 'text-muted hover:text-ink')}
            >
              {lg.short}
              {missing(lg.code) > 0 && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="!" />}
            </button>
          ))}
        </div>
      </div>
      <ol className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="w-5 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
            <input
              value={r[lang]}
              onChange={(e) => edit(i, e.target.value.replace(/\n/g, ' '))}
              placeholder={r[other] || t('points')}
              aria-label={`${t('points')} ${i + 1} (${lang.toUpperCase()})`}
              className={cn(ctl, 'h-9 min-w-0 flex-1 text-[13.5px]')}
            />
            <span className="flex shrink-0 items-center">
              <IconBtn label={t('moveUp')} disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label={t('moveDown')} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label={ta('remove')} disabled={rows.length <= 1 && !r.sq && !r.en} onClick={() => commit(rows.filter((_, k) => k !== i))} danger>
                <Trash2 className="h-3.5 w-3.5" />
              </IconBtn>
            </span>
          </li>
        ))}
      </ol>
      {rows.length < max && (
        <button
          type="button"
          onClick={() => commit([...rows, { sq: '', en: '' }])}
          className="ml-[26px] mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-ink-soft border border-dashed border-ink/20 transition hover:bg-ink/[0.04] hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" /> {t('addPoint')}
        </button>
      )}
      <Hint>{t('pointsHint')}</Hint>
    </div>
  );
}
