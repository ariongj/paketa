// CSV export of the current filter / selection (PDF p.09 "Eksport sipas filtrit dhe lejes").
// Headers follow the admin language and every column is understood by the importer, so an export can be
// edited in a spreadsheet and imported again (tiers "500:0,44|1000:0,39", MOQ, step, artwork, design service…).
import type { Category, L10n, Lang } from '@/lib/types';
import { download } from '@/lib/utils';
import { toCsv } from './csv';
import type { PdKey } from './dict';
import { formatTiers } from './importer';
import { isQuote, isTracked, pricingOf, type ProductX } from './model';

type T = (key: PdKey, vars?: Record<string, string | number>) => string;

/** Column headers — shared by the export and the empty import template. */
function headers(t: T, withCost: boolean) {
  return [
    t('fld_handle'), t('fld_sku'), t('fld_barcode'), t('fld_name_sq'), t('fld_name_en'), t('fld_category'), t('fld_vendor'), t('fld_tags'), t('fld_status'),
    t('fld_price'), t('fld_compareAt'), ...(withCost ? [t('fld_cost')] : []), t('fld_unit'), t('fld_tiers'), t('fld_moq'), t('fld_qtyStep'),
    t('fld_artwork'), t('fld_design'), t('fld_leadDays'), t('fld_stock'), t('fld_channels'), t('fld_template'), t('fld_image'),
  ];
}

export function exportProducts(products: ProductX[], opts: { t: T; l: (v: L10n) => string; lang: Lang; categories: Category[]; withCost: boolean }) {
  const { t, l, lang, categories, withCost } = opts;
  // SQ Excel expects ";" and decimal commas; EN gets the classic comma CSV.
  const comma = lang !== 'en';
  const delimiter = comma ? ';' : ',';
  // unit prices keep sub-cent precision (labels: 0,014)
  const dec = (v: number | null | undefined) => {
    if (v == null) return '';
    const s = Math.abs(v * 100 - Math.round(v * 100)) < 1e-9 ? v.toFixed(2) : String(Math.round(v * 10000) / 10000);
    return comma ? s.replace('.', ',') : s;
  };
  const cat = new Map(categories.map((c) => [c.id, c]));
  const status = { active: t('st_active'), draft: t('st_draft'), archived: t('st_archived') };

  const rows = products.map((p) => {
    const { price, compareAt } = pricingOf(p);
    const c = cat.get(p.categoryId);
    const ch = p.channels ?? ['online'];
    const design = p.installation?.available ? (p.installation.per === 'line' ? dec(p.installation.price) : `${dec(p.installation.price)} ${t('val_perPiece')}`) : t('val_no');
    return [
      p.slug, p.sku, p.barcode ?? '', p.name.sq, p.name.en, c ? l(c.name) : '', p.vendor ?? '', (p.tags ?? []).join(', '), status[p.status],
      dec(price), p.tiers?.length ? '' : dec(compareAt), ...(withCost ? [dec(p.cost)] : []), p.unit, formatTiers(p.tiers, comma), p.moq ?? '', p.qtyStep ?? '',
      p.artwork ? t('val_yes') : t('val_no'), design, p.leadDays ?? '', isTracked(p) ? p.stock : t('madeToOrder'),
      ch.length ? ch.map((x) => (x === 'online' ? t('ch_online') : t('ch_pos'))).join(' + ') : t('ch_none'),
      isQuote(p) ? t('tpl_quote') : t('tpl_standard'), p.images.join(' | '),
    ];
  });
  const stamp = new Date().toISOString().slice(0, 10);
  download(`printworks-produktet-${stamp}.csv`, `﻿${toCsv([headers(t, withCost), ...rows], delimiter)}`, 'text/csv;charset=utf-8');
  return rows.length;
}

/** Empty template with the same columns as the export (admin language). */
export function downloadTemplate(t: T, lang: Lang) {
  const delimiter = lang === 'en' ? ',' : ';';
  download('printworks-shablloni-produkteve.csv', `﻿${toCsv([headers(t, true)], delimiter)}`, 'text/csv;charset=utf-8');
}
