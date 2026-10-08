import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/brand/Logo';
import { defineDict, useDict, useLang } from '@/i18n';
import { useSettings } from '@/store/hooks';
import { brandVars } from '@/lib/color';
import { date, money } from '@/lib/format';
import type { Lang, Staff } from '@/lib/types';
import { cn } from '@/lib/utils';
import { lineAmount, quoteTotals, unitMoney, withTerms, type QuoteX } from './model';
import { qd, termRows } from './quoteDoc';

const T = defineDict({
  sq: { title: 'Parapamja e ofertës', desc: 'Kështu e sheh klienti ofertën — printojeni ose ruajeni si PDF.', print: 'Printo / PDF', docLang: 'Gjuha e dokumentit', close: 'Mbyll' },
  en: { title: 'Quote preview', desc: 'This is what the customer sees — print it or save it as a PDF.', print: 'Print / PDF', docLang: 'Document language', close: 'Close' },
});

/** Print only the sheet: every other child of <body> (the app, this modal) is hidden while printing. */
const PRINT_CSS = `
.pw-quote-print { display: none; }
@media print {
  @page { size: A4; margin: 0; }
  html, body { background: #fff !important; }
  body > *:not(.pw-quote-print) { display: none !important; }
  .pw-quote-print { display: block !important; }
  .pw-quote-print * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/** Printable B2B quote on the PrintWorks letterhead (preview modal + clean A4 print). */
export function QuotePrintModal({ open, onClose, quote, owner }: { open: boolean; onClose: () => void; quote: QuoteX; owner?: Staff }) {
  const t = useDict(T, 'admin');
  const adminLang = useLang('admin');
  const [docLang, setDocLang] = useState<Lang>(adminLang);
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={t('title')}
      description={t('desc')}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <span className="inline-flex rounded-lg bg-ink/[0.05] p-0.5" role="radiogroup" aria-label={t('docLang')}>
            {(['sq', 'en'] as const).map((x) => (
              <button
                key={x}
                type="button"
                role="radio"
                aria-checked={docLang === x}
                onClick={() => setDocLang(x)}
                className={cn('h-8 rounded-md px-3 text-[12px] font-bold uppercase tracking-wide transition-colors', docLang === x ? 'bg-white text-ink shadow-[0_1px_2px_rgb(0_0_0/0.12)]' : 'text-muted hover:text-ink')}
              >
                {x}
              </button>
            ))}
          </span>
          <span className="flex gap-2">
            <Button variant="outline" shape="rounded" size="sm" onClick={onClose}>
              {t('close')}
            </Button>
            <Button shape="rounded" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
              {t('print')}
            </Button>
          </span>
        </div>
      }
    >
      <div className="bg-canvas px-3 py-5 sm:px-6">
        <QuoteSheet quote={quote} owner={owner} lang={docLang} className="shadow-[0_1px_2px_rgb(0_0_0/0.06),0_24px_60px_-28px_rgb(0_0_0/0.35)] ring-1 ring-line/70" />
      </div>
      {open &&
        createPortal(
          <div className="pw-quote-print">
            <style>{PRINT_CSS}</style>
            <QuoteSheet quote={quote} owner={owner} lang={docLang} print />
          </div>,
          document.body,
        )}
    </Modal>
  );
}

export function QuoteSheet({ quote, owner, lang, className, print }: { quote: QuoteX; owner?: Staff; lang: Lang; className?: string; print?: boolean }) {
  const s = useSettings();
  const q = withTerms(quote);
  const totals = quoteTotals(q.lines, s);
  const d = (iso: string) => date(iso, lang, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const issued = q.createdAt || new Date().toISOString();
  const lines = q.lines.filter((l) => l.title.trim());
  const greeting = q.customer.name.trim() || q.customer.company.trim();

  return (
    <article
      style={brandVars(s.brandColor)}
      className={cn(
        'relative mx-auto w-full max-w-[210mm] bg-white text-[11.5px] leading-normal text-ink',
        print ? 'min-h-[297mm] px-[14mm] py-[12mm]' : 'px-5 py-7 sm:min-h-[297mm] sm:px-[14mm] sm:py-[12mm]',
        className,
      )}
    >
      {/* brand rule + CMYK registration bar */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-brand-600" />
      <div aria-hidden className="absolute right-[14mm] top-3 flex gap-0.5">
        {['#00AEEF', '#EC008C', '#FFF200', '#121014'].map((c) => (
          <span key={c} className="h-1.5 w-4" style={{ background: c }} />
        ))}
      </div>

      <header className="grid gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
        <div>
          <Logo className="h-[46px] overflow-visible" />
          <div className="mt-3 space-y-px text-[10.5px] text-ink-soft">
            <p className="text-[12px] font-bold text-ink">{s.legalName}</p>
            <p>
              {s.address}, {s.city}, {qd(lang, 'country')}
            </p>
            <p>
              {s.pib} · {s.pdv}
            </p>
            <p>
              {s.phone} · {s.email} · printwor-ks.com
            </p>
          </div>
        </div>
        <div className="sm:text-right">
          <h1 className="text-[26px] font-semibold uppercase leading-tight tracking-[-0.02em] text-ink">{qd(lang, 'docTitle')}</h1>
          <p className="mt-0.5 font-mono text-[13px] font-semibold text-brand-700">
            {qd(lang, 'docNo', { n: q.number })} · {qd(lang, 'version', { v: q.version })}
          </p>
          <dl className="mt-3 grid grid-cols-[auto_auto] justify-start gap-x-4 gap-y-0.5 text-[10.5px] sm:justify-end">
            <dt className="text-muted">{qd(lang, 'issued')}</dt>
            <dd className="font-semibold tabular-nums">{d(issued)}</dd>
            <dt className="text-muted">{qd(lang, 'validUntil')}</dt>
            <dd className="font-semibold tabular-nums">{d(q.validUntil)}</dd>
            {owner && (
              <>
                <dt className="text-muted">{qd(lang, 'preparedBy')}</dt>
                <dd className="font-semibold">{owner.name}</dd>
              </>
            )}
          </dl>
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
        <div className="rounded-lg bg-[#f5f4f6] px-4 py-3">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">{qd(lang, 'to')}</p>
          <p className="mt-1 text-[13px] font-bold text-ink">{q.customer.company || q.customer.name || '—'}</p>
          {q.nui && (
            <p className="text-ink-soft">
              {qd(lang, 'nui')}: {q.nui}
            </p>
          )}
          {q.customer.company && q.customer.name && (
            <p className="text-ink-soft">
              {qd(lang, 'contact')}: {q.customer.name}
            </p>
          )}
          <p className="text-ink-soft">{[q.customer.phone, q.customer.email].filter(Boolean).join(' · ')}</p>
        </div>
        <p className="self-center text-[11.5px] leading-relaxed text-ink-soft">{qd(lang, 'intro', { name: greeting || '—' })}</p>
      </section>

      <table className="mt-6 w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-ink font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            <th className="w-7 py-2 pr-2 font-semibold">{qd(lang, 'col_no')}</th>
            <th className="py-2 pr-3 font-semibold">{qd(lang, 'col_desc')}</th>
            <th className="py-2 pr-3 text-right font-semibold">{qd(lang, 'col_qty')}</th>
            <th className="whitespace-nowrap py-2 pr-3 text-right font-semibold">{qd(lang, 'col_price')}</th>
            <th className="py-2 text-right font-semibold">{qd(lang, 'col_amount')}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-line align-top">
              <td className="py-2 pr-2 tabular-nums text-muted">{i + 1}.</td>
              <td className="py-2 pr-3 font-semibold leading-snug text-ink">{l.title}</td>
              <td className="whitespace-nowrap py-2 pr-3 text-right font-mono tabular-nums">{new Intl.NumberFormat(lang === 'sq' ? 'de-DE' : 'en-IE').format(l.qty)}</td>
              <td className="whitespace-nowrap py-2 pr-3 text-right font-mono tabular-nums">{unitMoney(l.price, lang)}</td>
              <td className="whitespace-nowrap py-2 text-right font-mono font-semibold tabular-nums">{money(lineAmount(l), lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex justify-end">
        <dl className="w-full max-w-[78mm] space-y-1 text-[11.5px]">
          {totals.netPricing ? (
            <>
              <Row label={qd(lang, 'net')} value={money(totals.net, lang)} />
              <Row label={qd(lang, 'vat', { rate: s.vatRate })} value={money(totals.vat, lang)} />
              <div className="flex items-baseline justify-between border-t-2 border-ink pt-1.5 text-[14px] font-bold">
                <dt>{qd(lang, 'total')}</dt>
                <dd className="font-mono tabular-nums">{money(totals.total, lang)}</dd>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between border-t-2 border-ink pt-1.5 text-[14px] font-bold">
                <dt>{qd(lang, 'totalGross')}</dt>
                <dd className="font-mono tabular-nums">{money(totals.total, lang)}</dd>
              </div>
              <Row label={qd(lang, 'vatIncl', { rate: s.vatRate })} value={money(totals.vat, lang)} />
            </>
          )}
          <p className="pt-1 text-right text-[9.5px] text-muted">{qd(lang, totals.netPricing ? 'prices' : 'pricesGross', { rate: s.vatRate })}</p>
        </dl>
      </div>

      <section className="mt-6 break-inside-avoid">
        <h2 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">{qd(lang, 'terms')}</h2>
        <dl className="mt-2 divide-y divide-line border-y border-line">
          {termRows(q, lang, d(q.validUntil)).map((r) => (
            <div key={r.label} className="grid grid-cols-[34mm_1fr] gap-3 py-1.5">
              <dt className="font-semibold text-ink">{r.label}</dt>
              <dd className="text-ink-soft">{r.text}</dd>
            </div>
          ))}
          {quote.terms && (quote.terms[lang]?.trim() || quote.terms.sq?.trim()) && (
            <div className="grid grid-cols-[34mm_1fr] gap-3 py-1.5">
              <dt className="font-semibold text-ink">{qd(lang, 'l_notes')}</dt>
              <dd className="whitespace-pre-line text-ink-soft">{quote.terms[lang]?.trim() || quote.terms.sq}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="mt-6 grid break-inside-avoid gap-4 sm:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">{qd(lang, 'accept')}</h2>
          <p className="mt-1.5 text-[10.5px] text-ink-soft">{qd(lang, 'acceptText')}</p>
        </div>
        <div className="flex flex-col justify-end">
          <div className="h-12 border-b border-ink/60" />
          <p className="mt-1 text-[9.5px] text-muted">{qd(lang, 'sign')}</p>
        </div>
      </section>

      <footer className={cn('flex items-end justify-between gap-4 border-t border-line pt-3 text-[9.5px] text-muted', print ? 'absolute inset-x-[14mm] bottom-[10mm]' : 'mt-10 sm:absolute sm:inset-x-[14mm] sm:bottom-[10mm]')}>
        <span>
          <span className="font-semibold text-ink">{qd(lang, 'thanks')}</span> {qd(lang, 'slogan')}
        </span>
        <span className="font-mono">{q.number}</span>
      </footer>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-ink-soft">
      <dt>{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}

