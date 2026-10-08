// One menu link: label (SQ/EN), what it points to and the destination picker (PDF p.36
// "Lidhje te faqe, produkt, koleksion, ofertë ose URL").
import { useMemo, useState } from 'react';
import { Check, CornerDownRight, Link2, Trash2, Wand2 } from 'lucide-react';
import { Drawer } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { FieldError, Hint, Input, Label } from '@/components/ui/Field';
import { L10nInput } from '@/admin/components/L10nInput';
import { SearchInput } from '@/admin/components/kit';
import { useDict, useL } from '@/i18n';
import { adm } from '@/admin/i18n';
import type { PageX } from '@/admin/components/editorial/meta';
import type { L10n, MenuItem, MenuItemType } from '@/lib/types';
import { fold } from '@/lib/search';
import { cn, thumb } from '@/lib/utils';
import { LINK_TYPES, resolveLink, type LinkSources, type ResolvedLink } from './links';
import { itemErrors } from './tree';
import { mn, TYPE_ICON } from './dict';
import { IssueChip, LiveChip, TypeIcon } from './ui';

export interface EditCtx {
  item: MenuItem;
  isNew: boolean;
  /** Label of the parent when this is a sub-link */
  parent?: L10n;
  childCount: number;
}

interface Opt {
  id: string;
  title: L10n;
  sub: string;
  image?: string;
  res: ResolvedLink;
}

const MAX_OPTS = 40;

type QuickKey = 'qp_products' | 'qp_sale' | 'qp_industries' | 'qp_technology' | 'qp_quote' | 'qp_projects' | 'qp_about' | 'qp_blog' | 'qp_contact';

/** Storefront routes (src/App.tsx) a free URL link usually points to. `?akcija=1` = the shop's "on offer" filter. */
const QUICK_PAGES: { path: string; key: QuickKey }[] = [
  { path: '/produktet', key: 'qp_products' },
  { path: '/produktet?akcija=1', key: 'qp_sale' },
  { path: '/industrite', key: 'qp_industries' },
  { path: '/teknologjia', key: 'qp_technology' },
  { path: '/kerko-oferte', key: 'qp_quote' },
  { path: '/projektet', key: 'qp_projects' },
  { path: '/rreth-nesh', key: 'qp_about' },
  { path: '/blog', key: 'qp_blog' },
  { path: '/kontakt', key: 'qp_contact' },
];

interface Quick {
  path: string;
  label: L10n;
}

function QuickChip({ q, on, onPick }: { q: Quick; on: boolean; onPick: (q: Quick) => void }) {
  const l = useL('admin');
  return (
    <button
      type="button"
      onClick={() => onPick(q)}
      aria-pressed={on}
      title={q.path}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold ring-1 ring-inset transition',
        on ? 'bg-ink text-white ring-ink' : 'bg-white text-ink-soft ring-line hover:bg-canvas hover:text-ink',
      )}
    >
      <span className="truncate">{l(q.label)}</span>
      <span className={cn('truncate font-mono text-[10.5px] font-medium', on ? 'text-white/65' : 'text-muted')}>{q.path}</span>
    </button>
  );
}

function optionsFor(type: MenuItemType, src: LinkSources): Opt[] {
  const res = (id: string) => resolveLink({ type, target: id }, src);
  switch (type) {
    case 'page':
      return (src.pages as PageX[]).map((p) => ({ id: p.id, title: p.title, sub: `/faqe/${p.slug}`, image: p.cover, res: res(p.id) }));
    case 'product':
      return src.products.map((p) => ({ id: p.id, title: p.name, sub: `${p.sku} · /produkt/${p.slug}`, image: p.images[0], res: res(p.id) }));
    case 'collection':
      return src.collections.map((c) => ({ id: c.id, title: c.title, sub: `/koleksioni/${c.slug}`, image: c.image, res: res(c.id) }));
    case 'category':
      return [...src.categories].sort((a, b) => a.order - b.order).map((c) => ({ id: c.id, title: c.name, sub: `/produktet/${c.slug}`, image: c.image, res: res(c.id) }));
    case 'offer':
      return src.offers.map((o) => ({ id: o.id, title: o.name, sub: `/oferta/${o.slug}`, image: o.image, res: res(o.id) }));
    default:
      return [];
  }
}

function Thumbnail({ src, type }: { src?: string; type: MenuItemType }) {
  if (!src) return <TypeIcon type={type} className="h-9! w-9!" />;
  return (
    <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-md bg-sand ring-1 ring-inset ring-line">
      <img src={thumb(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
    </span>
  );
}

const sameL10n = (a: L10n, b: L10n) => a.sq === b.sq && a.en === b.en;

export function LinkEditor({
  open,
  ctx,
  src,
  readOnly,
  onClose,
  onApply,
  onDelete,
}: {
  open: boolean;
  ctx: EditCtx | null;
  src: LinkSources;
  readOnly: boolean;
  onClose: () => void;
  onApply: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}) {
  const t = useDict(mn, 'admin');
  const ta = useDict(adm, 'admin');
  const l = useL('admin');
  const [draft, setDraft] = useState<MenuItem | null>(ctx?.item ?? null);
  const [tried, setTried] = useState(false);
  const [q, setQ] = useState('');

  const type = draft?.type;
  const options = useMemo(() => (type ? optionsFor(type, src) : []), [type, src]);
  const filtered = useMemo(() => {
    const needle = fold(q.trim());
    if (!needle) return options;
    return options.filter((o) => fold(`${o.title.sq} ${o.title.sq} ${o.title.en} ${o.sub}`).includes(needle));
  }, [options, q]);

  if (!ctx || !draft) return <Drawer open={false} onClose={onClose}>{null}</Drawer>;

  const resolved = resolveLink(draft, src);
  const errors = itemErrors(draft);
  const show = (e: (typeof errors)[number]) => tried && errors.includes(e);
  const selected = draft.type !== 'url' && draft.target ? options.find((o) => o.id === draft.target || o.res.to === resolved.to) : undefined;
  const entityTitle = resolved.entity?.title;

  const patch = (p: Partial<MenuItem>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const setType = (type: MenuItemType) => {
    if (type === draft.type) return;
    setQ('');
    patch({ type, target: '' });
  };
  const pick = (o: Opt) => {
    // Fill the label from the destination while it is still empty or follows the previous destination's name.
    const followsName = !draft.label.sq.trim() || (entityTitle && sameL10n(draft.label, entityTitle));
    patch({ target: o.id, ...(followsName ? { label: { ...o.title } } : {}) });
  };
  const apply = () => {
    if (readOnly) return;
    if (errors.length) {
      setTried(true);
      return;
    }
    onApply({ ...draft, target: draft.target.trim() });
  };

  const hidden = filtered.length - MAX_OPTS;

  // Quick paths: the storefront pages + one per product category (/produktet/<slug>)
  const quickPages: Quick[] = QUICK_PAGES.map((p) => ({ path: p.path, label: { sq: mn.sq[p.key], en: mn.en[p.key] } }));
  const quickCats: Quick[] = [...src.categories].sort((a, b) => a.order - b.order).map((c) => ({ path: `/produktet/${c.slug}`, label: c.name }));
  const pickQuick = (qp: Quick) => patch({ target: qp.path, ...(!draft.label.sq.trim() ? { label: { ...qp.label } } : {}) });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-[520px]"
      title={
        <div className="min-w-0">
          <div className="truncate text-[16px] font-bold text-ink">{ctx.isNew ? t('newLink') : t('editLink')}</div>
          <div className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] font-medium text-muted">
            {ctx.parent ? (
              <>
                <CornerDownRight className="h-3.5 w-3.5 shrink-0" /> {t('subOf', { name: l(ctx.parent) })}
              </>
            ) : (
              t('topLevel')
            )}
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          {!ctx.isNew && !readOnly ? (
            <Button variant="ghost" size="sm" shape="rounded" className="text-red-600 hover:bg-red-50 hover:text-red-700" icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(draft.id)}>
              {ta('delete')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" shape="rounded" onClick={onClose}>
              {ta('cancel')}
            </Button>
            {!readOnly && (
              <Button size="sm" shape="rounded" onClick={apply} icon={<Check className="h-4 w-4" />}>
                {ctx.isNew ? ta('add') : t('apply')}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <fieldset disabled={readOnly} className="space-y-4 px-5 py-5 sm:px-6">
        {/* Label */}
        <section className="rounded-xl border border-line/80 bg-white p-4">
          <L10nInput label={t('label')} required value={draft.label} onChange={(label) => patch({ label })} />
          {show('label') ? <FieldError>{t('labelRequired')}</FieldError> : <Hint>{t('labelHint')}</Hint>}
          {entityTitle && !sameL10n(draft.label, entityTitle) && (
            <button
              type="button"
              onClick={() => patch({ label: { ...entityTitle } })}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-semibold text-ink-soft ring-1 ring-inset ring-line transition hover:bg-canvas hover:text-ink"
            >
              <Wand2 className="h-3.5 w-3.5" /> {t('useEntityName')}: „{l(entityTitle)}“
            </button>
          )}
        </section>

        {/* Type + destination */}
        <section className="rounded-xl border border-line/80 bg-white p-4">
          <Label>{t('linkType')}</Label>
          <div role="radiogroup" className="grid grid-cols-3 gap-1.5">
            {LINK_TYPES.map((ty) => {
              const Icon = TYPE_ICON[ty];
              const on = draft.type === ty;
              return (
                <button
                  key={ty}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setType(ty)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12.5px] font-semibold ring-1 ring-inset transition-colors',
                    on ? 'bg-ink text-white ring-ink' : 'bg-white text-ink-soft ring-line hover:bg-canvas hover:text-ink',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t(`type_${ty}`)}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            {draft.type === 'url' ? (
              <>
                <Input
                  label={t('urlLabel')}
                  value={draft.target}
                  onChange={(e) => patch({ target: e.target.value })}
                  placeholder={t('urlPh')}
                  className="h-10! font-mono text-[13.5px]!"
                  leading={<Link2 className="h-4 w-4" />}
                  error={show('url') ? t('urlInvalid') : undefined}
                  hint={t('urlHint')}
                />
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t('quickPaths')}</span>
                  <span className="hidden truncate text-[11.5px] text-muted sm:block">{t('qpUseHint')}</span>
                </div>
                <div className="mt-2 text-[11.5px] font-medium text-muted">{t('qpPages')}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {quickPages.map((qp) => (
                    <QuickChip key={qp.path} q={qp} on={draft.target === qp.path} onPick={pickQuick} />
                  ))}
                </div>
                {quickCats.length > 0 && (
                  <>
                    <div className="mt-2.5 text-[11.5px] font-medium text-muted">{t('qpCategories')}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {quickCats.map((qp) => (
                        <QuickChip key={qp.path} q={qp} on={draft.target === qp.path} onPick={pickQuick} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <Label>{t('target')}</Label>
                {draft.target ? (
                  <div className="flex items-center gap-3 rounded-lg bg-canvas/70 p-2.5 ring-1 ring-inset ring-ink/10">
                    <Thumbnail src={selected?.image ?? resolved.entity?.image} type={draft.type} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-ink">{selected ? l(selected.title) : draft.target}</div>
                      <div className="truncate font-mono text-[11.5px] text-muted">{selected?.sub ?? '—'}</div>
                    </div>
                    {resolved.issue ? <IssueChip issue={resolved.issue} /> : <LiveChip />}
                  </div>
                ) : (
                  <div className={cn('rounded-lg border border-dashed px-3 py-2.5 text-[13px]', show('target') ? 'border-red-300 bg-red-50/60 text-red-700' : 'border-line text-muted')}>
                    {show('target') ? t('targetRequired') : t('noTarget')}
                  </div>
                )}
                <SearchInput value={q} onChange={setQ} placeholder={t('search')} className="mt-3" />
                <div className="mt-2 max-h-[300px] overflow-y-auto rounded-lg border border-line">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-8 text-center text-[13px] text-muted">{t('nothing')}</div>
                  ) : (
                    <ul className="divide-y divide-line/60 p-1">
                      {filtered.slice(0, MAX_OPTS).map((o) => {
                        const on = o.id === draft.target;
                        return (
                          <li key={o.id}>
                            <button
                              type="button"
                              onClick={() => pick(o)}
                              aria-pressed={on}
                              className={cn('flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors', on ? 'bg-ink/[0.06]' : 'hover:bg-canvas')}
                            >
                              <Thumbnail src={o.image} type={draft.type} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[13.5px] font-semibold text-ink">{l(o.title)}</div>
                                <div className="truncate font-mono text-[11.5px] text-muted">{o.sub}</div>
                              </div>
                              {o.res.issue && <IssueChip issue={o.res.issue} className="hidden sm:inline-flex" />}
                              <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full', on ? 'bg-ink text-white' : 'text-transparent')}>
                                <Check className="h-3 w-3" />
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {hidden > 0 && <div className="border-t border-line/60 px-3 py-2 text-[12px] text-muted">{t('moreResults', { n: hidden })}</div>}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Resolved address */}
        <section className="rounded-xl border border-line/80 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t('resolved')}</div>
              <div className="mt-1 break-all font-mono text-[13px] text-ink">{resolved.to || <span className="font-sans text-muted">{t('noLink')}</span>}</div>
            </div>
            {resolved.issue ? <IssueChip issue={resolved.issue} /> : resolved.to ? <LiveChip /> : null}
          </div>
          {ctx.childCount > 0 && <p className="mt-2 text-[12.5px] text-muted">{t('hasChildren', { n: ctx.childCount })}</p>}
        </section>
      </fieldset>
    </Drawer>
  );
}
