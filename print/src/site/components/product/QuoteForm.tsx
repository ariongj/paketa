import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CheckCircle2, FileText, Send } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { useDict, useL, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { optionsLabel } from '@/lib/pricing';
import { PD } from './dict';
import { qtyRules, qtyText } from './print';
import { EMAIL_RE, kindOf, phoneOk } from '@/site/components/quote/kinds';

type Field = 'name' | 'email' | 'phone' | 'qty';

/** Compact RFQ for quote-only products — creates a 'quote' inquiry (with RFQ specs) in the CMS. */
export function QuoteForm({ product, options }: { product: Product; options: Record<string, string> }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const addInquiry = useDb((s) => s.addInquiry);
  const updateInquiry = useDb((s) => s.updateInquiry);
  const min = qtyRules(product).min;
  const [f, setF] = useState({ qty: String(Math.max(min, 1000)), name: '', company: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState<{ name: string; email: string } | null>(null);

  const errors: Partial<Record<Field, string>> = {};
  if (!f.name.trim()) errors.name = t('rfq_required');
  if (!f.email.trim()) errors.email = t('rfq_required');
  else if (!EMAIL_RE.test(f.email.trim())) errors.email = t('rfq_email_bad');
  if (!f.phone.trim()) errors.phone = t('rfq_required');
  else if (!phoneOk(f.phone)) errors.phone = t('rfq_phone_bad');
  if (!(parseInt(f.qty, 10) > 0)) errors.qty = t('rfq_required');
  const err = (k: Field) => (submitted ? errors[k] : undefined);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    const qty = parseInt(f.qty, 10);
    const opts = optionsLabel(product, options, lang);
    const name = l(product.name);
    const message = [f.message.trim() || t('rfq_msgDefault', { name }), opts ? `(${opts})` : ''].filter(Boolean).join(' ');
    const inq = addInquiry({
      type: 'quote',
      source: 'quote',
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      company: f.company.trim() || undefined,
      productId: product.id,
      service: name,
      message,
    });
    updateInquiry(inq.id, { specs: { product: kindOf(product), quantity: qty, ...(opts ? { material: opts } : {}) } });
    setDone({ name: f.name.trim().split(/\s+/)[0], email: f.email.trim() });
  };

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div key="ok" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="mt-3 text-[18px] font-semibold text-ink">{t('rfq_okTitle', { name: done.name })}</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted">{t('rfq_okText', { product: l(product.name), email: done.email })}</p>
            <button
              type="button"
              onClick={() => {
                setDone(null);
                setSubmitted(false);
                setF((s) => ({ ...s, message: '' }));
              }}
              className="mt-4 text-[13px] font-semibold text-brand-700 hover:underline"
            >
              {t('rfq_new')}
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" noValidate onSubmit={submit} initial={false} exit={{ opacity: 0 }}>
            <div className="mb-4 flex items-center gap-2 text-[14.5px] font-semibold text-ink">
              <FileText className="h-4 w-4 text-brand-600" /> {t('rfq_title')}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label={t('rfq_qty')} inputMode="numeric" value={f.qty} onChange={(e) => setF((s) => ({ ...s, qty: e.target.value.replace(/[^\d]/g, '') }))} hint={`min. ${qtyText(min, lang)}`} error={err('qty')} required />
              <Input label={t('rfq_company')} value={f.company} onChange={set('company')} autoComplete="organization" />
              <Input label={t('rfq_name')} value={f.name} onChange={set('name')} autoComplete="name" error={err('name')} required />
              <Input label={t('rfq_phone')} type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="+383 4_ ___ ___" error={err('phone')} required />
              <Input label={t('rfq_email')} type="email" value={f.email} onChange={set('email')} autoComplete="email" error={err('email')} required wrapClassName="sm:col-span-2" />
              <Textarea label={t('rfq_msg')} rows={3} value={f.message} onChange={set('message')} placeholder={t('rfq_msgDefault', { name: l(product.name) })} wrapClassName="sm:col-span-2" />
            </div>
            <Button type="submit" size="lg" className="mt-4 w-full" icon={<Send className="h-4 w-4" />}>
              {t('rfq_send')}
            </Button>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
              <span>{t('rfq_privacy')}</span>
              <Link to={`/kerko-oferte?produkt=${product.slug}`} className="inline-flex items-center gap-1 font-semibold text-ink hover:text-brand-700">
                {t('rfq_detailed')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
