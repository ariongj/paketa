// Request a quote for custom packaging (/kerko-oferte, ?produkt=<slug> prefills the product) — a five-step RFQ
// that creates a 'quote' inquiry with structured RFQ specs in the CMS.
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, FileCheck2, Home, Package, Send, Timer, X } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Accent, Img } from '@/components/ui/misc';
import { useDict, useL } from '@/i18n';
import { useDb } from '@/store/db';
import { useProduct } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { Breadcrumbs } from '@/site/components/SectionHeading';
import { ChevronTexture, CmykBar, Eyebrow } from '@/site/components/company/Print';
import { SuccessCheck } from '@/site/components/checkout/Celebrate';
import { qtyRules } from '@/site/components/product/print';
import { QT } from '@/site/components/quote/dict';
import { EMAIL_RE, kindOf, phoneOk } from '@/site/components/quote/kinds';
import { COLOUR_TEXT, EMPTY_RFQ, KIND_ICON, sizeText, type RfqForm } from '@/site/components/quote/model';
import { StepContact, StepFiles, StepHead, StepKind, StepSpecs, SummaryCard, useSpecRows, type RfqErrors } from '@/site/components/quote/Steps';

const STEPS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

export default function QuoteRequest() {
  const t = useDict(QT);
  const l = useL();
  const [params, setParams] = useSearchParams();
  const product = useProduct(params.get('produkt') ?? undefined);
  const addInquiry = useDb((s) => s.addInquiry);
  const updateInquiry = useDb((s) => s.updateInquiry);
  usePageTitle(t('pageTitle'));

  const [form, setForm] = useState<RfqForm>(() =>
    product
      ? {
          ...EMPTY_RFQ,
          kind: kindOf(product),
          qty: String(Math.max(qtyRules(product).min, 1000)),
          message: '',
        }
      : EMPTY_RFQ,
  );
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [tried, setTried] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState<{ id: string; name: string; email: string; kind: string } | null>(null);
  const patch = (p: Partial<RfqForm>) => setForm((f) => ({ ...f, ...p }));

  const errors = useMemo(() => {
    const e: RfqErrors = {};
    if (!form.kind) e.kind = t('required');
    if (!(Number(form.qty) > 0)) e.qty = t('quantityErr');
    if (!form.name.trim()) e.name = t('required');
    if (!form.email.trim()) e.email = t('required');
    else if (!EMAIL_RE.test(form.email.trim())) e.email = t('emailBad');
    if (!form.phone.trim()) e.phone = t('required');
    else if (!phoneOk(form.phone)) e.phone = t('phoneBad');
    return e;
  }, [form, t]);
  const stepFields: (keyof RfqErrors)[][] = [['kind'], ['qty'], [], ['name', 'email', 'phone'], []];
  const stepOk = (i: number) => stepFields[i].every((k) => !errors[k]);
  const shown = (i: number): RfqErrors => (tried[i] ? Object.fromEntries(stepFields[i].map((k) => [k, errors[k]])) : {});

  const go = (i: number) => {
    setDir(i > step ? 1 : -1);
    setStep(i);
    window.scrollTo({ top: Math.min(window.scrollY, 280), behavior: 'smooth' });
  };
  const next = () => {
    if (!stepOk(step)) {
      setTried((s) => ({ ...s, [step]: true }));
      return;
    }
    go(step + 1);
  };

  const kindLabel = form.kind ? t(`k_${form.kind}`) : '';
  const submit = () => {
    const firstBad = stepFields.findIndex((_, i) => !stepOk(i));
    if (firstBad >= 0) {
      setTried((s) => ({ ...s, [firstBad]: true }));
      go(firstBad);
      return;
    }
    const pantone = form.pantone.trim() && (form.colours === 'cmykPantone' || form.colours === 'pantone') ? t('msgPantone', { codes: form.pantone.trim() }) : '';
    const message = [
      form.message.trim() || t('msgDefault', { kind: product ? `${kindLabel} — ${l(product.name)}` : kindLabel }),
      form.design ? t('msgDesign') : '',
      form.sample ? t('msgSample') : '',
      pantone,
      form.flexible ? t('msgFlexible') : '',
    ]
      .filter(Boolean)
      .join(' ');
    const inq = addInquiry({
      type: 'quote',
      source: 'quote',
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city || undefined,
      company: form.company.trim() || undefined,
      productId: product?.id,
      service: product ? l(product.name) : kindLabel,
      message,
    });
    updateInquiry(inq.id, {
      specs: {
        product: form.kind!,
        ...(sizeText(form) ? { size: sizeText(form) } : {}),
        ...(form.material ? { material: form.material } : {}),
        quantity: Number(form.qty),
        colours: COLOUR_TEXT[form.colours] + (pantone ? ` (${form.pantone.trim()})` : ''),
        ...(form.finishes.length ? { finishes: form.finishes.map((f) => t(`f_${f}`)) } : {}),
        ...(form.deadline ? { deadline: form.deadline } : {}),
        ...(form.files.length ? { files: form.files } : {}),
      },
    });
    setDone({ id: inq.id, name: form.name.trim().split(/\s+/)[0], email: form.email.trim(), kind: kindLabel.toLowerCase() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setDone(null);
    setForm(EMPTY_RFQ);
    setTried({});
    setStep(0);
    if (params.get('produkt')) setParams({}, { replace: true });
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <section className="relative isolate overflow-hidden bg-ink text-paper">
        <ChevronTexture />
        <div className="pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-brand-600/35 blur-[120px]" />
        <div className="container-x relative pb-12 pt-7 sm:pb-16 sm:pt-9">
          <Breadcrumbs tone="light" items={[{ label: t('pageTitle') }]} />
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl animate-fade-up">
              <Eyebrow tone="light">{t('eyebrow')}</Eyebrow>
              <h1 className="display mt-4 text-[40px] leading-[1.02] text-white sm:text-[60px]">
                <Accent text={done ? t('okEyebrow') : t('title')} accentClassName="text-brand-300" />
              </h1>
              {!done && <p className="mt-4 text-[16px] leading-relaxed text-paper/65 sm:text-[17px]">{t('subtitle')}</p>}
            </div>
            <ul className="flex flex-col gap-2.5 animate-fade-up [animation-delay:120ms]">
              {[
                { icon: Timer, text: t('promise1') },
                { icon: FileCheck2, text: t('promise2') },
                { icon: Package, text: t('promise3') },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[14.5px] text-paper/85">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-brand-300 ring-1 ring-white/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <CmykBar />
      </section>

      <div className="container-x pt-8 sm:pt-12">
        {done ? (
          <Success done={done} form={form} onNew={reset} />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 xl:gap-14">
            <div className="min-w-0">
              {product && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-white p-2.5 pr-4 ring-1 ring-line">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line">
                    <Img src={product.images[0]} small alt="" className="h-full w-full object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{t('forProduct')}</div>
                    <Link to={`/produkt/${product.slug}`} className="block truncate text-[15px] font-semibold text-ink hover:text-brand-700">
                      {l(product.name)}
                    </Link>
                  </div>
                  <button type="button" onClick={() => setParams({}, { replace: true })} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink" aria-label={t('change')} title={t('change')}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Stepper */}
              <nav aria-label={t('pageTitle')} className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <ol className="flex min-w-max items-center gap-2">
                  {STEPS.map((key, i) => {
                    const isDone = i < step;
                    const active = i === step;
                    const reachable = i <= step || STEPS.slice(0, i).every((_, k) => stepOk(k));
                    return (
                      <Fragment key={key}>
                        {i > 0 && <li aria-hidden className={cn('h-px w-5 sm:w-8', i <= step ? 'bg-ink/50' : 'bg-ink/15')} />}
                        <li>
                          <button
                            type="button"
                            disabled={!reachable}
                            onClick={() => go(i)}
                            aria-current={active ? 'step' : undefined}
                            className={cn('flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors disabled:cursor-default', active ? 'bg-white ring-1 ring-line' : 'enabled:hover:bg-white/70')}
                          >
                            <span className={cn('grid h-7 w-7 place-items-center rounded-full font-mono text-[11px]', isDone ? 'bg-ink text-paper' : active ? 'bg-brand-600 text-white' : 'border border-ink/20 bg-white text-muted')}>
                              {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : `0${i + 1}`}
                            </span>
                            <span className={cn('text-[13px] font-semibold', active ? 'text-ink' : isDone ? 'text-ink-soft' : 'text-muted', !active && 'max-sm:hidden')}>{t(key)}</span>
                          </button>
                        </li>
                      </Fragment>
                    );
                  })}
                </ol>
              </nav>

              <div className="mt-5 overflow-hidden rounded-3xl bg-white p-5 ring-1 ring-line sm:p-8">
                <div className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{t('stepOf', { n: step + 1, total: STEPS.length })}</div>
                <AnimatePresence mode="wait" initial={false} custom={dir}>
                  <motion.div key={step} initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -24 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
                    {step === 0 && <StepKind form={form} patch={patch} error={shown(0).kind} />}
                    {step === 1 && <StepSpecs form={form} patch={patch} errors={shown(1)} />}
                    {step === 2 && <StepFiles form={form} patch={patch} />}
                    {step === 3 && <StepContact form={form} patch={patch} errors={shown(3)} />}
                    {step === 4 && <Review form={form} onEdit={go} productName={product ? l(product.name) : undefined} />}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
                  {step > 0 ? (
                    <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => go(step - 1)}>
                      {t('back')}
                    </Button>
                  ) : (
                    <span />
                  )}
                  {step < STEPS.length - 1 ? (
                    <Button variant="dark" size="lg" iconRight={<ArrowRight className="h-4 w-4" />} onClick={next}>
                      {t('next')}
                    </Button>
                  ) : (
                    <Button size="lg" icon={<Send className="h-4 w-4" />} onClick={submit}>
                      {t('send')}
                    </Button>
                  )}
                </div>
                {step === STEPS.length - 1 && <p className="mt-3 text-right text-[12px] text-muted">{t('privacy')}</p>}
              </div>
            </div>

            <aside className="lg:sticky lg:top-[100px]">
              <SummaryCard form={form} kindLabel={product ? l(product.name) : undefined} />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Review({ form, onEdit, productName }: { form: RfqForm; onEdit: (i: number) => void; productName?: string }) {
  const t = useDict(QT);
  const rows = useSpecRows(form);
  const Icon = form.kind ? KIND_ICON[form.kind] : Package;
  const block = (title: string, i: number, body: ReactNode) => (
    <div className="rounded-2xl bg-paper/70 p-4 ring-1 ring-inset ring-line sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{title}</span>
        <button type="button" onClick={() => onEdit(i)} className="text-[12.5px] font-semibold text-brand-700 hover:underline">
          {t('edit')}
        </button>
      </div>
      {body}
    </div>
  );
  return (
    <div>
      <StepHead title={t('q5')} text={t('q5d')} />
      <div className="grid gap-3">
        {block(
          t('r_product'),
          0,
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[15px] font-semibold text-ink">{form.kind ? t(`k_${form.kind}`) : '—'}</div>
              {productName && <div className="text-[13px] text-muted">{productName}</div>}
            </div>
          </div>,
        )}
        {block(
          t('r_specs'),
          1,
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="text-[13.5px]">
                <dt className="text-muted">{k}</dt>
                <dd className="font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>,
        )}
        {block(
          t('r_files'),
          2,
          <div className="text-[13.5px] text-ink">
            {form.files.length ? (
              <ul className="space-y-1">
                {form.files.map((f) => (
                  <li key={f.name} className="truncate font-mono text-[12.5px]">
                    {f.name}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-muted">{t('filesNone')}</span>
            )}
            {(form.design || form.sample) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.design && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-medium text-brand-700">{t('needDesign')}</span>}
                {form.sample && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-medium text-brand-700">{t('needSample')}</span>}
              </div>
            )}
          </div>,
        )}
        {block(
          t('r_contact'),
          3,
          <div className="text-[13.5px] leading-relaxed text-ink">
            {form.company && <div className="font-semibold">{form.company}</div>}
            <div>{form.name}</div>
            <div className="text-muted">
              {form.email} · {form.phone}
              {form.city && ` · ${form.city}`}
            </div>
            {form.message && <p className="mt-2 text-muted">„{form.message}“</p>}
          </div>,
        )}
      </div>
    </div>
  );
}

function Success({ done, form, onNew }: { done: { id: string; name: string; email: string; kind: string }; form: RfqForm; onNew: () => void }) {
  const t = useDict(QT);
  const text = t('okText', { kind: done.kind, email: '{email}' });
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 xl:gap-14">
      <div className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-10">
        <SuccessCheck />
        <h2 className="display mt-6 text-[34px] leading-[1.05] text-ink sm:text-[44px]">
          <Accent text={t('okTitle', { name: done.name })} />
        </h2>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
          {text.split('{email}').flatMap((part, i) => (i === 0 ? [part] : [<strong key={i} className="font-semibold text-ink">{done.email}</strong>, part]))}
        </p>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-paper py-1.5 pl-4 pr-4 ring-1 ring-line">
          <span className="text-[12.5px] text-muted">{t('okRef')}</span>
          <span className="font-mono text-[14px] text-ink">{done.id.replace(/^inq_/, 'RFQ-').toUpperCase()}</span>
        </div>
        <ol className="mt-8 space-y-4">
          {[t('okNext1'), t('okNext2'), t('okNext3')].map((s, i) => (
            <li key={s} className="flex items-center gap-3.5">
              <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-[11px]', i === 0 ? 'bg-brand-600 text-white' : 'bg-white text-ink ring-1 ring-line')}>0{i + 1}</span>
              <span className="text-[15px] font-medium text-ink">{s}</span>
            </li>
          ))}
        </ol>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink to="/produktet" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
            {t('okShop')}
          </ButtonLink>
          <Button size="lg" variant="outline" onClick={onNew}>
            {t('okNew')}
          </Button>
          <ButtonLink to="/" size="lg" variant="ghost" icon={<Home className="h-4 w-4" />}>
            {t('okHome')}
          </ButtonLink>
        </div>
      </div>
      <SummaryCard form={form} />
    </div>
  );
}
