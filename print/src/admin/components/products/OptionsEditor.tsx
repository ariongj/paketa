import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Palette, Plus, RectangleHorizontal, Trash2, X } from 'lucide-react';
import { Card } from '@/admin/components/kit';
import { useDict, useL, useLang } from '@/i18n';
import type { L10n, Lang, ProductOption, ProductOptionValue } from '@/lib/types';
import { cn, uid } from '@/lib/utils';
import { pd } from './dict';
import { IconBtn, LangTabs, MiniL10n, NumInput, Segmented, missingCounts } from './parts';

const L = (sq: string, en: string): L10n => ({ sq, en });
const empty = (): L10n => ({ sq: '', en: '' });

type Val = [id: string, sq: string, en: string, delta?: number, swatch?: string];
const opt = (id: string, name: L10n, type: ProductOption['type'], values: Val[]): ProductOption => ({
  id,
  name,
  type,
  values: values.map(([vid, sq, en, priceDelta, swatch]) => ({ id: vid, label: L(sq, en), ...(priceDelta ? { priceDelta } : {}), ...(swatch ? { swatch } : {}) })),
});

/** One-click print options with typical values and per-piece surcharges (SQ / EN). */
const PRESETS: { key: string; make: () => ProductOption }[] = [
  {
    key: 'size',
    make: () =>
      opt('size', L('Madhësia', 'Size'), 'button', [
        ['a5', 'A5 · 148 × 210 mm', 'A5 · 148 × 210 mm'],
        ['a4', 'A4 · 210 × 297 mm', 'A4 · 210 × 297 mm', 0.05],
        ['a3', 'A3 · 297 × 420 mm', 'A3 · 297 × 420 mm', 0.12],
      ]),
  },
  {
    key: 'board',
    make: () =>
      opt('board', L('Kartoni', 'Board'), 'button', [
        ['gc1', 'GC1 300 g (i bardhë)', 'GC1 300 gsm (white)'],
        ['gc2', 'GC2 350 g (më i fortë)', 'GC2 350 gsm (stiffer)', 0.03],
        ['kraft', 'Kraft natyral 350 g', 'Natural kraft 350 gsm', 0.02],
        ['eflute', 'Mikrovalë E (e valëzuar)', 'E-flute micro-corrugated', 0.09],
      ]),
  },
  {
    key: 'finish',
    make: () =>
      opt('finish', L('Finishing', 'Finish'), 'button', [
        ['matte', 'Laminim mat', 'Matte lamination'],
        ['gloss', 'Laminim me shkëlqim', 'Gloss lamination'],
        ['softtouch', 'Soft-touch', 'Soft-touch', 0.06],
        ['spotuv', 'Mat + llak UV selektiv', 'Matte + spot UV', 0.05],
        ['foil', 'Mat + stampim me folje ari', 'Matte + gold foil', 0.09],
      ]),
  },
  {
    key: 'material',
    make: () =>
      opt('material', L('Materiali', 'Material'), 'swatch', [
        ['paper', 'Letër semi-gloss', 'Semi-gloss paper', 0, '#f4f1ea'],
        ['ppwhite', 'PP e bardhë (rezistente ndaj ujit)', 'White PP (water-resistant)', 0.008, '#ffffff'],
        ['ppclear', 'PP transparente', 'Clear PP', 0.011, '#e4ebef'],
        ['ppsilver', 'PP metalike argjendi', 'Metallic silver PP', 0.017, '#b9bec3'],
      ]),
  },
  {
    key: 'lam',
    make: () =>
      opt('lam', L('Laminimi', 'Lamination'), 'button', [
        ['none', 'Pa laminim', 'No lamination'],
        ['matte', 'Mat', 'Matte', 0.02],
        ['gloss', 'Me shkëlqim', 'Gloss', 0.02],
        ['soft', 'Soft-touch', 'Soft-touch', 0.05],
      ]),
  },
  {
    key: 'sides',
    make: () =>
      opt('sides', L('Ngjyrat (anët)', 'Colours (sides)'), 'button', [
        ['40', '4/0 · CMYK një anë', '4/0 · CMYK one side'],
        ['44', '4/4 · CMYK dy anë', '4/4 · CMYK both sides', 0.04],
        ['10', '1/0 · një ngjyrë Pantone', '1/0 · one Pantone colour', -0.01],
      ]),
  },
  {
    key: 'paper',
    make: () =>
      opt('paper', L('Letra', 'Paper'), 'swatch', [
        ['art170', 'Art letër 170 g mat', 'Matte art paper 170 gsm', 0, '#ffffff'],
        ['art300', 'Art letër 300 g', 'Art board 300 gsm', 0.04, '#f7f7f5'],
        ['kraft', 'Kraft kafe 120 g', 'Brown kraft 120 gsm', -0.02, '#b98b5d'],
        ['recycled', 'Letër e ricikluar 120 g', 'Recycled paper 120 gsm', 0.01, '#e9e4d8'],
      ]),
  },
];

const move = <T,>(list: T[], from: number, to: number) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
};

function ValueRow({
  value,
  type,
  lang,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  value: ProductOptionValue;
  type: ProductOption['type'];
  lang: Lang;
  index: number;
  count: number;
  onChange: (v: ProductOptionValue) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const t = useDict(pd, 'admin');
  return (
    <motion.div layout="position" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="group/v flex items-center gap-2">
      {/* reorder */}
      <div className="flex w-5 shrink-0 flex-col items-center text-muted">
        <button type="button" aria-label={t('moveUp')} disabled={index === 0} onClick={() => onMove(-1)} className="grid h-4 w-5 place-items-center rounded hover:text-ink disabled:opacity-25">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label={t('moveDown')} disabled={index === count - 1} onClick={() => onMove(1)} className="grid h-4 w-5 place-items-center rounded hover:text-ink disabled:opacity-25">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* swatch / button marker */}
      {type === 'swatch' ? (
        <label title={t('pickColor')} className="relative grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-line bg-white transition hover:border-ink/30">
          <span className="h-6 w-6 rounded-full ring-1 ring-inset ring-ink/15" style={{ background: value.swatch || '#ffffff' }} />
          <input type="color" value={value.swatch || '#ffffff'} onChange={(e) => onChange({ ...value, swatch: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" aria-label={t('pickColor')} />
        </label>
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-dashed border-line text-[11px] font-bold tabular-nums text-muted">{index + 1}</span>
      )}
      <MiniL10n value={value.label} lang={lang} onChange={(label) => onChange({ ...value, label })} placeholder={t('valueLabel')} className="flex-1" />
      <NumInput
        size="sm"
        zeroAsEmpty
        value={value.priceDelta ?? null}
        onChange={(n) => onChange({ ...value, priceDelta: n || undefined })}
        prefix="+"
        suffix="€"
        placeholder="0"
        wrapClassName="w-[92px] shrink-0 sm:w-[104px]"
        aria-label={t('priceDelta')}
      />
      <IconBtn label={t('remove')} onClick={onRemove} danger className="h-9 w-8">
        <X className="h-4 w-4" />
      </IconBtn>
    </motion.div>
  );
}

export function OptionsEditor({ value, onChange }: { value: ProductOption[]; onChange: (v: ProductOption[]) => void }) {
  const t = useDict(pd, 'admin');
  const adminLang = useLang('admin');
  const [lang, setLang] = useState<Lang>(adminLang);
  const missing = useMemo(() => missingCounts(value.flatMap((o) => [o.name, ...o.values.map((v) => v.label)])), [value]);
  return (
    <Card title={t('c_options')} description={t('c_options_d')} actions={value.length > 0 && <LangTabs value={lang} onChange={setLang} missing={missing} title={t('langHint')} />} padded={false}>
      <OptionsFields value={value} onChange={onChange} lang={lang} />
    </Card>
  );
}

/** Options list + "add option" footer, without a card — embedded in "Variantet & inventari". */
export function OptionsFields({ value, onChange, lang }: { value: ProductOption[]; onChange: (v: ProductOption[]) => void; lang: Lang }) {
  const t = useDict(pd, 'admin');
  const l = useL('admin');

  const update = (i: number, patch: Partial<ProductOption>) => onChange(value.map((o, k) => (k === i ? { ...o, ...patch } : o)));
  const setValues = (i: number, values: ProductOptionValue[]) => update(i, { values });
  const addOption = () => onChange([...value, { id: uid('opt'), name: empty(), type: 'button', values: [{ id: uid('v'), label: empty() }] }]);
  const presets = PRESETS.filter((p) => {
    const name = p.make().name.sq.toLowerCase();
    return !value.some((o) => o.name.sq.trim().toLowerCase() === name);
  });

  return (
    <>
      <div className="space-y-3 p-4 sm:p-5">
        {value.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-4 text-[13px] text-muted">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-ink-soft ring-1 ring-line">
              <Palette className="h-4 w-4" />
            </span>
            {t('noOptions')}
          </div>
        )}
        <AnimatePresence initial={false}>
          {value.map((o, i) => (
            <motion.div key={o.id} layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="overflow-hidden rounded-xl border border-line bg-white">
              {/* Option header */}
              <div className="flex flex-wrap items-center gap-2 border-b border-line/70 bg-canvas/50 px-3 py-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink text-[11px] font-bold text-paper">{i + 1}</span>
                <MiniL10n value={o.name} lang={lang} onChange={(name) => update(i, { name })} placeholder={t('optionName')} className="min-w-[160px] flex-1" />
                <div className="flex items-center gap-1">
                  <Segmented
                    size="sm"
                    value={o.type}
                    onChange={(type) => update(i, { type, values: type === 'swatch' ? o.values.map((v) => ({ ...v, swatch: v.swatch || '#d9cfc2' })) : o.values })}
                    options={[
                      { id: 'swatch', label: t('type_swatch'), icon: <Palette className="h-3.5 w-3.5" /> },
                      { id: 'button', label: t('type_button'), icon: <RectangleHorizontal className="h-3.5 w-3.5" /> },
                    ]}
                  />
                  <span className="mx-0.5 h-5 w-px bg-line" />
                  <IconBtn label={t('moveUp')} onClick={() => onChange(move(value, i, i - 1))} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label={t('moveDown')} onClick={() => onChange(move(value, i, i + 1))} disabled={i === value.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label={t('remove')} onClick={() => onChange(value.filter((_, k) => k !== i))} danger>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </div>
              {/* Values */}
              <div className="space-y-2 px-3 py-3">
                <div className="flex items-center gap-2 pl-7 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted max-sm:hidden">
                  <span className="w-9" />
                  <span className="flex-1">{t('valueLabel')}</span>
                  <span className="w-[104px]">{t('priceDelta')}</span>
                  <span className="w-8" />
                </div>
                <AnimatePresence initial={false}>
                  {o.values.map((v, k) => (
                    <ValueRow
                      key={v.id}
                      value={v}
                      type={o.type}
                      lang={lang}
                      index={k}
                      count={o.values.length}
                      onChange={(nv) => setValues(i, o.values.map((x, j) => (j === k ? nv : x)))}
                      onMove={(d) => setValues(i, move(o.values, k, k + d))}
                      onRemove={() => setValues(i, o.values.filter((_, j) => j !== k))}
                    />
                  ))}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => setValues(i, [...o.values, { id: uid('v'), label: empty(), ...(o.type === 'swatch' ? { swatch: '#d9cfc2' } : {}) }])}
                  className="ml-7 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  <Plus className="h-3.5 w-3.5" /> {t('addValue')}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line/70 px-4 py-3 sm:px-5">
        <button type="button" onClick={addOption} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-[12.5px] font-semibold text-paper transition hover:bg-ink-soft">
          <Plus className="h-3.5 w-3.5" /> {t('addOption')}
        </button>
        {presets.length > 0 && (
          <>
            <span className="ml-1 text-[12px] font-medium text-muted">{t('quickAdd')}:</span>
            {presets.map((p) => {
              const sample = p.make();
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    const o = p.make();
                    // keep the semantic id ("size", "board"…) unless another option already uses it
                    onChange([...value, value.some((x) => x.id === o.id) ? { ...o, id: uid('opt') } : o]);
                  }}
                  className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[12.5px] font-semibold text-ink-soft transition hover:border-ink/30 hover:text-ink')}
                >
                  {sample.type === 'swatch' ? (
                    <span className="flex -space-x-1">
                      {sample.values.map((v) => (
                        <span key={v.id} className="h-3 w-3 rounded-full ring-1 ring-ink/15" style={{ background: v.swatch }} />
                      ))}
                    </span>
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-muted" />
                  )}
                  {l(sample.name)}
                </button>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
