import { useMemo, useState } from 'react';
import { Calculator, FileCheck2, Globe2, Plug, Receipt } from 'lucide-react';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { money, num } from '@/lib/format';
import { tierPrice } from '@/lib/pricing';
import { cn, round2 } from '@/lib/utils';
import { useDb } from '@/store/db';
import { T } from './i18n';
import { S } from './strings';
import { NumberField, ToggleRow } from './fields';
import type { SecProps } from './model';
import { Block, LinkRow, Note, Panel, Segmented } from './ui';

const X = defineDict({
  sq: {
    rate: 'TVSH',
    rate_h: 'Vlen për të gjitha produktet dhe shërbimet në katalog (kuti, etiketa, qese, shtyp, dizajn & prepress, transport).',
    rateBad: 'Vendosni një vlerë nga 0 deri në 100',
    display: 'Çmimet në katalog',
    net: 'Çmimet në katalog janë pa TVSH',
    net_d: 'Si te shumica e shtypshkronjave B2B: çmimet sipas sasisë shfaqen neto, me shënimin „pa TVSH“; TVSH-ja shtohet në arkë dhe në faturë.',
    netOn: 'Neto — TVSH shtohet në arkë',
    grossOn: 'Bruto — çmimet përfshijnë TVSH-në',
    example: 'Shembull llogaritjeje',
    example_h: 'Me produktin dhe çmimet reale nga katalogu — ndryshon menjëherë kur ndërroni normën ose mënyrën.',
    qty: 'Sasia',
    unitPrice: '{qty} {pcs} × {price}',
    lineNet: 'Totali pa TVSH',
    lineVat: 'TVSH {rate}%',
    lineTotal: 'Totali për pagesë',
    inclNote: 'Çmimi në katalog përfshin TVSH-në: {vat} nga totali është TVSH.',
    storedNote: 'Te porositë ruhet totali me TVSH; raportet e Analitikës nxjerrin TVSH-në si totali × {rate}/{base} dhe shfaqin të ardhurat neto.',
    numbers: 'Numrat tatimorë',
    numbers_d: 'NUI dhe numri i TVSH-së shtypen në faturë dhe në pro-formë · {nui} · {vatNo}',
    openGeneral: 'Te Të përgjithshmet',
    export: 'Eksporti',
    export_d: 'Shitjet jashtë Kosovës (BE, rajoni) zakonisht faturohen me TVSH 0% me dokumentet doganore — rregulli përfundimtar caktohet me kontabilistin, sipas tregut.',
    openMarkets: 'Hap Tregjet',
    fiscal: 'Fiskalizimi (ATK)',
    fiscal_d: 'Lidhja me sistemin e fiskalizimit të Administratës Tatimore të Kosovës është e planifikuar për fazën 2. CMS nuk zëvendëson pajisjen fiskale.',
    openIntegrations: 'Hap Integrimet',
  },
  en: {
    rate: 'VAT',
    rate_h: 'Applies to every product and service in the catalogue (boxes, labels, bags, print, design & prepress, delivery).',
    rateBad: 'Enter a value from 0 to 100',
    display: 'Catalogue prices',
    net: 'Catalogue prices exclude VAT',
    net_d: 'As with most B2B printers: quantity prices are shown net, labelled “excl. VAT”; VAT is added at checkout and on the invoice.',
    netOn: 'Net — VAT added at checkout',
    grossOn: 'Gross — prices include VAT',
    example: 'Worked example',
    example_h: 'With a real product and real catalogue prices — updates instantly when you change the rate or mode.',
    qty: 'Quantity',
    unitPrice: '{qty} {pcs} × {price}',
    lineNet: 'Total excl. VAT',
    lineVat: 'VAT {rate}%',
    lineTotal: 'Total to pay',
    inclNote: 'The catalogue price includes VAT: {vat} of the total is VAT.',
    storedNote: 'Orders store the total incl. VAT; Analytics derives VAT as total × {rate}/{base} and shows net revenue.',
    numbers: 'Tax numbers',
    numbers_d: 'The business no. (NUI) and VAT number are printed on invoices and pro-formas · {nui} · {vatNo}',
    openGeneral: 'Go to General',
    export: 'Export',
    export_d: 'Sales outside Kosovo (EU, the region) are usually invoiced at 0% VAT with customs documents — the final rule is set with the accountant, per market.',
    openMarkets: 'Open Markets',
    fiscal: 'Fiscalisation (ATK)',
    fiscal_d: 'The connection to the Kosovo Tax Administration’s fiscal system is planned for phase 2. The CMS does not replace the fiscal device.',
    openIntegrations: 'Open Integrations',
  },
});

/** Prefer a tiered print product for the worked example (pizza boxes, then any tiered product). */
const EXAMPLE_IDS = ['p-kuti-pice', 'p-etiketa-ushqimore', 'p-kartevizita'];

export function TaxesSection({ s, set, errors, readOnly }: SecProps) {
  const t = useDict(X, 'admin');
  const tl = useDict(T, 'admin');
  const ts = useDict(S, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const products = useDb((st) => st.products);
  const net = s.pricesIncludeVat === false;
  const rate = s.vatRate;
  const rateOk = Number.isFinite(rate) && rate >= 0 && rate <= 100;

  const product = useMemo(() => {
    const active = products.filter((p) => p.status === 'active' && !p.quoteOnly);
    return EXAMPLE_IDS.map((id) => active.find((p) => p.id === id)).find(Boolean) ?? active.find((p) => p.tiers?.length) ?? active[0];
  }, [products]);
  const qtys = useMemo(() => {
    const tiers = product?.tiers?.map((x) => x.qty) ?? [];
    return (tiers.length ? tiers : [1, 10, 100]).slice(0, 4);
  }, [product]);
  const [pick, setPick] = useState<number | null>(null);
  const qty = pick != null && qtys.includes(pick) ? pick : (qtys[1] ?? qtys[0]);

  const calc = useMemo(() => {
    if (!product) return null;
    const unit = tierPrice(product, qty);
    const line = round2(unit * qty);
    const r = rateOk ? rate / 100 : 0;
    if (net) {
      const vat = round2(line * r);
      return { unit, net: line, vat, total: round2(line + vat) };
    }
    const vat = round2(line - line / (1 + r));
    return { unit, net: round2(line - vat), vat, total: line };
  }, [product, qty, net, rate, rateOk]);

  return (
    <div className="space-y-5">
      <Panel
        lead
        title={ts('sec_taxes')}
        description={ts('sec_taxes_d')}
        footnote={
          <>
            <Receipt className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t('storedNote', { rate: rateOk ? rate : 18, base: 100 + (rateOk ? rate : 18) })}</span>
          </>
        }
      >
        <Block title={t('rate')} hint={t('rate_h')}>
          <div className="max-w-[220px]">
            <NumberField
              label={tl('vatRate')}
              hint={tl('vatRate_h')}
              value={rate}
              onChange={(n) => set('vatRate', n)}
              trailing="%"
              error={errors.vatRate ?? (!rateOk ? t('rateBad') : undefined)}
            />
          </div>
        </Block>

        <Block title={t('display')}>
          <ToggleRow
            icon={<Calculator className="h-[18px] w-[18px]" />}
            title={t('net')}
            description={t('net_d')}
            checked={net}
            disabled={readOnly}
            onChange={(v) => set('pricesIncludeVat', !v)}
          />
        </Block>

        {product && calc && (
          <Block title={t('example')} hint={t('example_h')}>
            <div className="grid gap-4 rounded-lg border border-line p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-6">
              <div className="flex min-w-0 items-start gap-3.5">
                <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f3f3f3] ring-1 ring-black/[0.06]">
                  {product.images[0] && <img src={product.images[0].replace(/\.webp$/, '-sm.webp')} alt="" className="h-full w-full object-cover" />}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-ink">{l(product.name)}</div>
                  <div className="mt-0.5 font-mono text-[11.5px] text-muted">{product.sku}</div>
                  <div className="mt-3 text-[12px] font-medium text-muted">{t('qty')}</div>
                  <Segmented
                    label={t('qty')}
                    className="mt-1.5"
                    value={String(qty)}
                    onChange={(v) => setPick(Number(v))}
                    options={qtys.map((q) => ({ id: String(q), label: <span className="font-mono text-[12px]">{num(q, lang)}</span> }))}
                  />
                </div>
              </div>
              <dl className="space-y-1.5 text-[13px] md:border-l md:border-line/70 md:pl-6">
                <div className="flex justify-between gap-4 text-muted">
                  <dt>{t('unitPrice', { qty: num(qty, lang), pcs: lang === 'sq' ? 'copë' : 'pcs', price: money(calc.unit, lang, { decimals: true }) })}</dt>
                  <dd className="font-mono tabular-nums text-ink-soft">{money(round2(calc.unit * qty), lang, { decimals: true })}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line/70 pt-1.5">
                  <dt className="text-ink-soft">{t('lineNet')}</dt>
                  <dd className="font-mono tabular-nums text-ink">{money(calc.net, lang, { decimals: true })}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">{t('lineVat', { rate: rateOk ? rate : 0 })}</dt>
                  <dd className="font-mono tabular-nums text-ink">{money(calc.vat, lang, { decimals: true })}</dd>
                </div>
                <div className={cn('flex justify-between gap-4 border-t border-ink/15 pt-1.5 text-[14px] font-semibold text-ink')}>
                  <dt>{t('lineTotal')}</dt>
                  <dd className="font-mono tabular-nums">{money(calc.total, lang, { decimals: true })}</dd>
                </div>
                <p className="pt-1 text-[12px] text-muted">{net ? t('netOn') : t('inclNote', { vat: money(calc.vat, lang, { decimals: true }) })}</p>
              </dl>
            </div>
          </Block>
        )}
      </Panel>

      <Panel title={t('numbers')}>
        <div className="divide-y divide-line/70">
          <LinkRow icon={FileCheck2} title={t('numbers')} text={t('numbers_d', { nui: s.pib || '—', vatNo: s.pdv || '—' })} to="/admin/konfigurimet" cta={t('openGeneral')} />
          <LinkRow icon={Globe2} title={t('export')} text={t('export_d')} to="/admin/tregjet" cta={t('openMarkets')} />
          <LinkRow icon={Plug} title={t('fiscal')} text={t('fiscal_d')} to="/admin/integrimet" cta={t('openIntegrations')} />
        </div>
      </Panel>

      {!net && (
        <Note icon={Calculator}>
          {t('grossOn')}
        </Note>
      )}
    </div>
  );
}
