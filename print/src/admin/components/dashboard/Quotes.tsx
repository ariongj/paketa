import { Link } from 'react-router';
import { FileText, Plus } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/admin/components/kit';
import { StatusGlyph, StatusPill, type Glyph, type PillTone } from '@/admin/components/orders/status';
import { useDict, useLang } from '@/i18n';
import { useCan } from '@/store/hooks';
import { money, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { daysUntil, openQuoteState, quoteValue, type OpenQuoteState, type OpenQuotes } from './data';
import { fmtDate } from './dates';
import { D, pluralKey } from './i18n';
import { CardLink, Empty } from './lists';

const QUOTES = '/admin/kontaktet/oferta-b2b';

const STATE: Record<OpenQuoteState, [PillTone, Glyph]> = {
  draft: ['outline', 'dash'],
  sent: ['neutral', 'half'],
  expired: ['attention', 'ring'],
};

/** "Ofertat B2B të hapura" — drafts and quotes sent to business customers, with value (excl. VAT) and validity. */
export function QuotesCard({ data, now, className }: { data: OpenQuotes; now: Date; className?: string }) {
  const t = useDict(D, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const n = data.list.length;

  return (
    <Card
      className={cn('flex flex-col', className)}
      title={t('q_title')}
      description={n ? t(n === 1 ? 'q_desc_1' : 'q_desc', { v: money(data.value, lang, { decimals: false }), n }) : undefined}
      actions={<CardLink to={QUOTES}>{t('all_quotes')}</CardLink>}
      padded={false}
      bodyClassName="flex flex-1 flex-col"
    >
      {n === 0 ? (
        <Empty
          icon={<FileText className="h-5 w-5" />}
          title={t('q_empty')}
          text={t('q_empty_text')}
          action={
            can('quotes', 'edit') && (
              <ButtonLink to={`${QUOTES}?id=new`} size="sm" shape="rounded" icon={<Plus className="h-4 w-4" />}>
                {t('q_new')}
              </ButtonLink>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-line/70">
          {data.list.slice(0, 5).map((q) => {
            const state = openQuoteState(q, now);
            const [tone, glyph] = STATE[state];
            const d = daysUntil(new Date(q.validUntil), now);
            const when = d <= 0 ? t('when_today') : d === 1 ? t('when_tomorrow') : t('when_days', { n: d });
            const meta =
              state === 'draft'
                ? t('q_created', { ago: timeAgo(q.createdAt, lang) })
                : state === 'expired'
                  ? t('q_expired_on', { date: fmtDate(new Date(q.validUntil), lang, { day: 'numeric', month: 'short' }) })
                  : t('q_until', { when });
            const who = q.customer.company || q.customer.name;
            return (
              <li key={q.id}>
                <Link to={`${QUOTES}?id=${q.id}`} className="block px-5 py-3 transition-colors hover:bg-[#f7f7f7] focus-visible:bg-[#f7f7f7] focus-visible:outline-none">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[13.5px] font-medium text-ink" title={who}>
                      {who}
                    </span>
                    <span className="shrink-0 text-[13.5px] font-semibold tabular-nums text-ink">{money(quoteValue(q), lang, { decimals: false })}</span>
                  </span>
                  <span className="mt-1.5 flex min-w-0 items-center gap-2 text-[12px] text-muted">
                    <StatusPill tone={tone} glyph={glyph} className="h-5 shrink-0 px-1.5 text-[11.5px]">
                      {t(`q_${state}`)}
                    </StatusPill>
                    <span className="truncate" title={t(`q_lines_${pluralKey(lang, q.lines.length)}`, { n: q.lines.length })}>
                      <span className="font-mono text-[11.5px]">
                        {q.number}
                        {q.version > 1 && ` v${q.version}`}
                      </span>{' '}
                      · {meta}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {n > 0 && (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line/70 px-5 py-3 text-[12.5px] text-muted">
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {data.sent > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <StatusGlyph glyph="half" />
                {t('q_sent_n', { n: data.sent })}
              </span>
            )}
            {data.drafts > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <StatusGlyph glyph="dash" />
                {t('q_drafts_n', { n: data.drafts })}
              </span>
            )}
            {data.expired > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <StatusGlyph glyph="ring" />
                {t('q_expired_n', { n: data.expired })}
              </span>
            )}
          </span>
          {can('quotes', 'edit') && (
            <Link to={`${QUOTES}?id=new`} className="inline-flex items-center gap-1 font-semibold text-ink hover:underline hover:underline-offset-4">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t('q_new')}
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
