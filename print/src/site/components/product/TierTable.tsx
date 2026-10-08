import { useDict, useLang } from '@/i18n';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PD } from './dict';
import { qtyText, unitMoney } from './print';
import type { Configurator } from './useConfigurator';

/** Quantity → unit price → total table for the chosen options; the active break is highlighted. */
export function TierTable({ cfg, compact, className, onPick }: { cfg: Configurator; compact?: boolean; className?: string; onPick?: (qty: number) => void }) {
  const t = useDict(PD);
  const lang = useLang();
  if (!cfg.tiers.length) return null;
  const cell = compact ? 'px-3 py-2.5' : 'px-4 py-3.5 sm:px-6';
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-paper/70 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              <th className={cn(cell, 'font-medium')}>{t('tierQty')}</th>
              <th className={cn(cell, 'text-right font-medium')}>{t('tierUnit')}</th>
              <th className={cn(cell, 'text-right font-medium')}>{t('tierTotal')}</th>
              <th className={cn(cell, 'text-right font-medium max-sm:hidden')}>{t('tierSave')}</th>
            </tr>
          </thead>
          <tbody>
            {cfg.tiers.map((row, i) => {
              const on = i === cfg.tierIndex;
              return (
                <tr
                  key={row.qty}
                  onClick={onPick ? () => onPick(row.qty) : undefined}
                  className={cn('border-b border-line/70 font-mono tabular-nums transition-colors last:border-b-0', onPick && 'cursor-pointer hover:bg-paper', on && 'bg-brand-50/70 hover:bg-brand-50')}
                >
                  <td className={cn(cell, compact ? 'text-[13px]' : 'text-[14px]', 'font-medium text-ink')}>
                    <span className="inline-flex items-center gap-2">
                      <span className={cn('h-1.5 w-1.5 rounded-full', on ? 'bg-brand-600' : 'bg-transparent')} />
                      {qtyText(row.qty, lang)}+
                    </span>
                  </td>
                  <td className={cn(cell, compact ? 'text-[13px]' : 'text-[14px]', 'text-right text-ink')}>{unitMoney(row.unit, lang)}</td>
                  <td className={cn(cell, compact ? 'text-[13px]' : 'text-[14px]', 'text-right text-ink-soft')}>{money(row.total, lang)}</td>
                  <td className={cn(cell, 'text-right text-[12px] max-sm:hidden', row.save ? 'text-brand-700' : 'text-muted')}>{row.save ? `−${row.save}%` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11.5px] leading-snug text-muted">{t('tableNote')}</p>
    </div>
  );
}
