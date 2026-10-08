import { Fragment, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, BellRing, Check, CheckCircle2, Clock } from 'lucide-react';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Img } from '@/components/ui/misc';
import { useDict, useL } from '@/i18n';
import { useDb } from '@/store/db';
import { T } from './dict';

/** "*accent*" → lime word, for headlines on dark backgrounds. */
function LimeAccent({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((p, i) =>
        p.startsWith('*') && p.endsWith('*') ? (
          <span key={i} className="text-lime">
            {p.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * "Së shpejti" range (Category.soon): announcement + notify-me form instead of an empty grid.
 * Sign-ups land in Admin → inbox as a contact inquiry.
 */
export function SoonPanel({ category, others }: { category: Category; others: Category[] }) {
  const t = useDict(T);
  const l = useL();
  const name = l(category.name);
  return (
    <section className="container-x pt-8 sm:pt-12">
      <div className="grid overflow-hidden rounded-[32px] bg-ink text-paper shadow-[0_40px_80px_-50px_rgb(15_29_22/0.7)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative isolate overflow-hidden p-7 sm:p-12 lg:p-14">
          <Img src={category.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20!" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ink via-ink/90 to-ink/60" />
          <span className="inline-flex h-8 rotate-[-3deg] items-center gap-1.5 rounded-full bg-lime px-3.5 font-display text-[14px] font-bold text-ink shadow-lg">
            <Clock className="h-4 w-4" /> {t('soonBadge')}
          </span>
          <h2 className="display mt-6 max-w-lg text-[36px] leading-[1.02] text-white sm:text-[52px]">
            <LimeAccent text={t('soonTitle', { name })} />
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-paper/75">{t('soonText')}</p>
          <ul className="mt-7 space-y-3">
            {[t('soonPoint1'), t('soonPoint2'), t('soonPoint3')].map((p) => (
              <li key={p} className="flex items-center gap-3 text-[15px] font-semibold">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime text-ink">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          {others.length > 0 && (
            <div className="mt-9 border-t border-white/10 pt-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-paper/50">{t('soonOther')}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {others.map((c) => (
                  <Link
                    key={c.id}
                    to={`/produktet/${c.slug}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 pl-1 pr-3.5 text-[13.5px] font-semibold text-white ring-1 ring-inset ring-white/10 transition-colors hover:bg-white hover:text-ink"
                  >
                    <Img src={c.image} small alt="" className="h-8 w-8 rounded-full object-cover" />
                    {l(c.name)}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-paper p-6 text-ink sm:p-10 lg:p-12">
          <NotifyForm category={category} />
        </div>
      </div>
    </section>
  );
}

function NotifyForm({ category }: { category: Category }) {
  const t = useDict(T);
  const l = useL();
  const addInquiry = useDb((s) => s.addInquiry);
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', qty: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cat = l(category.name);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = t('soonRequired');
    if (!form.phone.trim() && !form.email.trim()) err.phone = t('soonPhoneOrEmail');
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500));
    addInquiry({
      type: 'contact',
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      company: form.company.trim() || undefined,
      service: cat,
      message: [t('soonMsg', { cat }), form.qty.trim()].filter(Boolean).join(' — '),
    });
    setBusy(false);
    setSent(form.name.trim().split(' ')[0]);
  };

  if (sent) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-8 text-center">
        <span className="grid h-14 w-14 animate-pop place-items-center rounded-full bg-lime text-ink">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="display mt-5 text-[28px]">{t('soonThanksTitle', { name: sent })}</h3>
        <p className="mt-2 max-w-sm text-muted">{t('soonThanksText', { cat })}</p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setSent(null);
            setForm({ name: '', phone: '', email: '', company: '', qty: '' });
          }}
        >
          {t('soonAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-lime">
          <BellRing className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-[19px] font-bold text-ink">{t('soonFormTitle')}</h3>
          <p className="text-[13px] text-muted">{t('soonFormText')}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input label={t('soonName')} required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" wrapClassName="sm:col-span-2" />
        <Input label={t('soonPhone')} type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
        <Input label={t('soonEmail')} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
        <Input label={t('soonBusiness')} value={form.company} onChange={set('company')} autoComplete="organization" wrapClassName="sm:col-span-2" />
        <Input label={t('soonQty')} value={form.qty} onChange={set('qty')} placeholder={t('soonQtyPh')} wrapClassName="sm:col-span-2" />
      </div>
      <Button type="submit" size="lg" loading={busy} icon={<BellRing className="h-4 w-4" />} className="mt-6 w-full">
        {t('soonSubmit')}
      </Button>
    </form>
  );
}
