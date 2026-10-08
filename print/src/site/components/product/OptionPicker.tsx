import { Check } from 'lucide-react';
import type { ProductOption } from '@/lib/types';
import { useDict, useL, useLang } from '@/i18n';
import { cn } from '@/lib/utils';
import { PD } from './dict';
import { deltaMoney } from './print';

/** Swatch circles / button tiles for every product option; deltas are shown per piece. */
export function OptionPicker({
  options,
  value,
  onChange,
  perPiece = true,
}: {
  options: ProductOption[];
  value: Record<string, string>;
  onChange: (optionId: string, valueId: string) => void;
  perPiece?: boolean;
}) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  if (!options.length) return null;
  const delta = (v?: number) => (v ? `${deltaMoney(v, lang)}${perPiece ? ` ${t('perPiece')}` : ''}` : null);

  return (
    <div className="space-y-5">
      {options.map((o) => {
        const selected = o.values.find((v) => v.id === value[o.id]);
        return (
          <fieldset key={o.id}>
            <legend className="mb-2.5 flex w-full flex-wrap items-baseline gap-x-1.5 text-[13px]">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{l(o.name)}</span>
              <span className="font-semibold text-ink">{selected ? l(selected.label) : '—'}</span>
            </legend>
            {o.type === 'swatch' ? (
              <div className="flex flex-wrap gap-2">
                {o.values.map((v) => {
                  const on = v.id === value[o.id];
                  const vd = delta(v.priceDelta);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onChange(o.id, v.id)}
                      aria-pressed={on}
                      title={l(v.label)}
                      className={cn(
                        'group/sw inline-flex min-h-12 items-center gap-2.5 rounded-xl border bg-white py-1.5 pl-1.5 pr-3.5 text-left transition-all duration-200',
                        on ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line hover:border-ink/35',
                      )}
                    >
                      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset ring-ink/10" style={{ background: v.swatch }}>
                        <Check className={cn('h-4 w-4 text-ink transition-all duration-200', on ? 'scale-100 opacity-100' : 'scale-50 opacity-0')} strokeWidth={3} />
                      </span>
                      <span className="min-w-0">
                        <span className={cn('block text-[13px] font-semibold leading-tight', on ? 'text-ink' : 'text-ink-soft')}>{l(v.label)}</span>
                        {vd && <span className="mt-0.5 block font-mono text-[10.5px] tabular-nums text-muted">{vd}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {o.values.map((v) => {
                  const on = v.id === value[o.id];
                  const vd = delta(v.priceDelta);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onChange(o.id, v.id)}
                      aria-pressed={on}
                      className={cn(
                        'inline-flex min-h-11 flex-col items-start justify-center rounded-xl border px-3.5 py-2 text-left transition-all duration-200',
                        on ? 'border-ink bg-ink text-paper shadow-[0_10px_22px_-14px_rgb(18_16_20/0.8)]' : 'border-line bg-white text-ink-soft hover:border-ink/35 hover:text-ink',
                      )}
                    >
                      <span className="text-[13px] font-semibold leading-tight">{l(v.label)}</span>
                      {vd && <span className={cn('mt-0.5 font-mono text-[10.5px] tabular-nums', on ? 'text-paper/60' : 'text-muted')}>{vd}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
