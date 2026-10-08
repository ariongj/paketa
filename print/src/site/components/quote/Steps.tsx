import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Check, FilePlus2, FileText, Paperclip, PenTool, Phone, Shapes, Trash2 } from 'lucide-react';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Field';
import { useDict, useL, useLang } from '@/i18n';
import { useSettings } from '@/store/hooks';
import { allCities } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { fileExt, fileSize, qtyText } from '@/site/components/product/print';
import { QT } from './dict';
import { RFQ_KINDS, type RfqKind } from './kinds';
import { COLOURS, FINISHES, KIND_ICON, MATERIALS, QTY_PRESETS, RFQ_FILE_EXT, SIZE_MODE, sizeText, type RfqForm } from './model';

type Patch = (p: Partial<RfqForm>) => void;
export type RfqErrors = Partial<Record<'kind' | 'qty' | 'name' | 'email' | 'phone', string>>;

export function StepHead({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[22px] font-semibold leading-tight text-ink sm:text-[26px]">{title}</h2>
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1 — product type                                                     */
/* ------------------------------------------------------------------ */
export function StepKind({ form, patch, error }: { form: RfqForm; patch: Patch; error?: string }) {
  const t = useDict(QT);
  return (
    <div>
      <StepHead title={t('q1')} text={t('q1d')} />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4" role="radiogroup">
        {RFQ_KINDS.map((k) => {
          const Icon = KIND_ICON[k];
          const on = form.kind === k;
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => patch({ kind: k, material: form.kind === k ? form.material : '' })}
              className={cn(
                'group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200',
                on ? 'border-ink bg-ink text-paper shadow-[0_18px_34px_-20px_rgb(18_16_20/0.8)]' : 'border-line bg-white hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_18px_34px_-26px_rgb(18_16_20/0.5)]',
              )}
            >
              <span className={cn('grid h-11 w-11 place-items-center rounded-xl transition-colors', on ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700')}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="mt-4 text-[15px] font-semibold leading-tight">{t(`k_${k}`)}</span>
              <span className={cn('mt-1 text-[12.5px] leading-snug', on ? 'text-paper/65' : 'text-muted')}>{t(`k_${k}D`)}</span>
              <span className={cn('absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full transition-all', on ? 'bg-white text-ink' : 'border border-ink/15')}>{on && <Check className="h-3 w-3" strokeWidth={3} />}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-3 text-[13px] font-medium text-red-600">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 — specifications                                                   */
/* ------------------------------------------------------------------ */
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn('inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13.5px] font-medium transition-all', on ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-ink-soft hover:border-ink/35 hover:text-ink')}
    >
      {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {children}
    </button>
  );
}

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
      <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink">{children}</span>
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </div>
  );
}

export function StepSpecs({ form, patch, errors }: { form: RfqForm; patch: Patch; errors: RfqErrors }) {
  const t = useDict(QT);
  const l = useL();
  const lang = useLang();
  const kind = form.kind ?? 'other';
  const mode = SIZE_MODE[kind];
  const materials = MATERIALS[kind];
  const today = new Date();
  today.setDate(today.getDate() + 5);
  const minDate = today.toISOString().slice(0, 10);
  const dim = (k: 'len' | 'wid' | 'hei', label: string) => (
    <Input inputMode="numeric" aria-label={label} placeholder={label} value={form[k]} onChange={(e) => patch({ [k]: e.target.value.replace(/[^\d.,]/g, '').slice(0, 5) })} trailing="mm" className="font-mono" />
  );

  return (
    <div>
      <StepHead title={t('q2')} text={t('q2d')} />
      <div className="space-y-7">
        <div>
          <Label hint={mode === 'box' ? t('sizeBox') : mode === 'flat' ? t('sizeFlat') : undefined}>{mode === 'free' ? t('sizeFree') : t('size')}</Label>
          {mode === 'free' ? (
            <Input value={form.sizeText} onChange={(e) => patch({ sizeText: e.target.value })} placeholder={t('sizeFreePh')} />
          ) : (
            <div className={cn('grid gap-2.5', mode === 'box' ? 'grid-cols-3' : 'grid-cols-2 sm:max-w-md')}>
              {mode === 'box' && dim('len', t('len'))}
              {dim('wid', t('wid'))}
              {dim('hei', t('hei'))}
            </div>
          )}
        </div>

        <div>
          <Label>{t('quantity')}</Label>
          <div className="flex flex-wrap items-start gap-2.5">
            <Input
              inputMode="numeric"
              value={form.qty ? qtyText(Number(form.qty), lang) : ''}
              onChange={(e) => patch({ qty: e.target.value.replace(/[^\d]/g, '').slice(0, 8) })}
              placeholder="5.000"
              className="font-mono"
              wrapClassName="w-36"
              error={errors.qty}
            />
            {QTY_PRESETS[kind].map((q) => (
              <Chip key={q} on={Number(form.qty) === q} onClick={() => patch({ qty: String(q) })}>
                {qtyText(q, lang)}
              </Chip>
            ))}
          </div>
        </div>

        {materials.length > 0 ? (
          <div>
            <Label>{t('material')}</Label>
            <div className="flex flex-wrap gap-2">
              {materials.map((m) => (
                <Chip key={m.sq} on={form.material === l(m)} onClick={() => patch({ material: form.material === l(m) ? '' : l(m) })}>
                  {l(m)}
                </Chip>
              ))}
              <Chip on={form.material === t('materialAdvise')} onClick={() => patch({ material: form.material === t('materialAdvise') ? '' : t('materialAdvise') })}>
                {t('materialAdvise')}
              </Chip>
            </div>
          </div>
        ) : (
          <Input label={t('material')} value={form.material} onChange={(e) => patch({ material: e.target.value })} />
        )}

        <div>
          <Label>{t('colours')}</Label>
          <div className="flex flex-wrap gap-2">
            {COLOURS.map((c) => (
              <Chip key={c} on={form.colours === c} onClick={() => patch({ colours: c })}>
                {c === 'cmyk' && <span className="flex gap-0.5" aria-hidden>{['bg-cyan', 'bg-magenta', 'bg-yellow', 'bg-key'].map((x) => <span key={x} className={cn('h-2.5 w-1.5 rounded-[1px]', x)} />)}</span>}
                {t(`c_${c}`)}
              </Chip>
            ))}
          </div>
          {(form.colours === 'cmykPantone' || form.colours === 'pantone') && (
            <Input wrapClassName="mt-3 sm:max-w-sm" label={t('pantoneCodes')} placeholder={t('pantonePh')} value={form.pantone} onChange={(e) => patch({ pantone: e.target.value })} className="font-mono" />
          )}
        </div>

        <div>
          <Label hint={t('finishesHint')}>{t('finishes')}</Label>
          <div className="flex flex-wrap gap-2">
            {FINISHES.map((f) => (
              <Chip key={f} on={form.finishes.includes(f)} onClick={() => patch({ finishes: form.finishes.includes(f) ? form.finishes.filter((x) => x !== f) : [...form.finishes, f] })}>
                {t(`f_${f}`)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <Input type="date" label={t('deadline')} min={minDate} value={form.deadline} onChange={(e) => patch({ deadline: e.target.value })} className="font-mono" />
          <Checkbox checked={form.flexible} onChange={(v) => patch({ flexible: v })} label={t('deadlineFlexible')} className="pb-3" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 — files (metadata only)                                            */
/* ------------------------------------------------------------------ */
export function StepFiles({ form, patch }: { form: RfqForm; patch: Patch }) {
  const t = useDict(QT);
  const lang = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const add = (list: FileList | null | undefined) => {
    if (!list?.length) return;
    const next = [...form.files];
    for (const f of Array.from(list)) {
      if (!RFQ_FILE_EXT.includes(fileExt(f.name))) {
        toast.error(t('fileBad', { ext: fileExt(f.name) || '?' }));
        continue;
      }
      if (next.length >= 10 || next.some((x) => x.name === f.name && x.size === f.size)) continue;
      next.push({ name: f.name, size: f.size });
    }
    patch({ files: next });
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    add(e.dataTransfer.files);
  };

  return (
    <div>
      <StepHead title={t('q3')} text={t('q3d')} />
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input.current?.click())}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn('flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition-colors outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15', over ? 'border-brand-600 bg-brand-50/70' : 'border-ink/25 bg-paper/60 hover:border-ink/50 hover:bg-white')}
      >
        <input ref={input} type="file" multiple className="sr-only" tabIndex={-1} onChange={(e) => (add(e.target.files), (e.target.value = ''))} />
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-600 shadow-sm ring-1 ring-line">
          <FilePlus2 className="h-5 w-5" />
        </span>
        <p className="mt-4 text-[14.5px] font-semibold text-ink">
          {t('filesDrop')} <span className="font-normal text-muted">{t('filesOr')}</span> <span className="text-brand-700 underline decoration-brand-700/30 underline-offset-2">{t('filesBrowse')}</span>
        </p>
        <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">{t('filesTypes')}</p>
      </div>
      {form.files.length > 0 ? (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          {form.files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 font-mono text-[9.5px] font-medium uppercase text-brand-700">{fileExt(f.name).slice(0, 4)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">{f.name}</span>
                <span className="font-mono text-[11px] text-muted">{fileSize(f.size, lang)}</span>
              </span>
              <button type="button" onClick={() => patch({ files: form.files.filter((_, k) => k !== i) })} aria-label="×" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
          <Paperclip className="h-3.5 w-3.5" /> {t('filesNone')}
        </p>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className={cn('flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors', form.design ? 'border-ink bg-white shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line bg-white hover:border-ink/30')}>
          <Checkbox checked={form.design} onChange={(v) => patch({ design: v })} label={<span className="inline-flex items-center gap-1.5"><PenTool className="h-3.5 w-3.5 text-brand-600" /> {t('needDesign')}</span>} description={t('needDesignD')} />
        </label>
        <label className={cn('flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors', form.sample ? 'border-ink bg-white shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line bg-white hover:border-ink/30')}>
          <Checkbox checked={form.sample} onChange={(v) => patch({ sample: v })} label={<span className="inline-flex items-center gap-1.5"><Shapes className="h-3.5 w-3.5 text-brand-600" /> {t('needSample')}</span>} description={t('needSampleD')} />
        </label>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4 — contact                                                          */
/* ------------------------------------------------------------------ */
export function StepContact({ form, patch, errors }: { form: RfqForm; patch: Patch; errors: RfqErrors }) {
  const t = useDict(QT);
  const settings = useSettings();
  const cities = allCities(settings);
  return (
    <div>
      <StepHead title={t('q4')} text={t('q4d')} />
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Input label={t('company')} autoComplete="organization" value={form.company} onChange={(e) => patch({ company: e.target.value })} />
        <Input id="rfq-name" label={t('name')} required autoComplete="name" value={form.name} onChange={(e) => patch({ name: e.target.value })} error={errors.name} />
        <Input id="rfq-email" label={t('email')} required type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} error={errors.email} />
        <Input id="rfq-phone" label={t('phone')} required type="tel" inputMode="tel" autoComplete="tel" placeholder="+383 4_ ___ ___" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} error={errors.phone} />
        <Select label={t('city')} value={form.city} onChange={(e) => patch({ city: e.target.value })} wrapClassName="sm:col-span-2">
          <option value="">—</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Textarea label={t('message')} rows={4} placeholder={t('messagePh')} value={form.message} onChange={(e) => patch({ message: e.target.value })} wrapClassName="sm:col-span-2" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review rows + live summary                                           */
/* ------------------------------------------------------------------ */
export function useSpecRows(form: RfqForm) {
  const t = useDict(QT);
  const lang = useLang();
  const rows: [string, string][] = [];
  const size = sizeText(form);
  if (size) rows.push([t('size'), size]);
  if (form.qty) rows.push([t('quantity'), t('pcs', { n: qtyText(Number(form.qty), lang) })]);
  if (form.material) rows.push([t('material'), form.material]);
  rows.push([t('colours'), `${t(`c_${form.colours}`)}${form.pantone.trim() && form.colours !== 'cmyk' && form.colours !== 'none' ? ` · ${form.pantone.trim()}` : ''}`]);
  if (form.finishes.length) rows.push([t('finishes'), form.finishes.map((f) => t(`f_${f}`)).join(', ')]);
  if (form.deadline || form.flexible) rows.push([t('deadline'), [form.deadline ? new Date(form.deadline).toLocaleDateString(lang === 'sq' ? 'de-DE' : 'en-GB') : '', form.flexible ? t('deadlineFlexible').toLowerCase() : ''].filter(Boolean).join(' · ')]);
  return rows;
}

export function SummaryCard({ form, kindLabel, className }: { form: RfqForm; kindLabel?: string; className?: string }) {
  const t = useDict(QT);
  const settings = useSettings();
  const rows = useSpecRows(form);
  const Icon = form.kind ? KIND_ICON[form.kind as RfqKind] : FileText;
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{t('sideTitle')}</div>
            <div className="truncate text-[15px] font-semibold text-ink">{kindLabel ?? (form.kind ? t(`k_${form.kind}`) : '—')}</div>
          </div>
        </div>
        {form.kind ? (
          <dl className="divide-y divide-line/70 px-5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 text-[13px]">
                <dt className="shrink-0 text-muted">{k}</dt>
                <dd className="text-right font-medium text-ink">{v}</dd>
              </div>
            ))}
            {form.files.length > 0 && (
              <div className="flex justify-between gap-4 py-2.5 text-[13px]">
                <dt className="text-muted">{t('r_files')}</dt>
                <dd className="font-medium text-ink">{form.files.length === 1 ? t('filesCountOne') : t('filesCount', { n: form.files.length })}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="px-5 py-6 text-[13px] text-muted">{t('sideEmpty')}</p>
        )}
      </div>
      <div className="mt-4 rounded-3xl bg-ink p-5 text-paper">
        <div className="text-[14px] font-semibold">{t('sideCall')}</div>
        <p className="mt-0.5 text-[12.5px] text-paper/60">{t('sideCallText')}</p>
        <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 font-mono text-[13px] text-white transition-colors hover:bg-white/20">
          <Phone className="h-4 w-4" /> {settings.phone}
        </a>
      </div>
    </div>
  );
}
