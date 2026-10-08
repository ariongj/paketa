import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Factory, Phone } from 'lucide-react';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { adm } from '@/admin/i18n';
import { dateTime } from '@/lib/format';
import { useDb } from '@/store/db';
import { useCategories, useCurrentStaff, useSettings } from '@/store/hooks';
import { allCities } from '@/lib/pricing';
import type { Inquiry, RfqSpecs } from '@/lib/types';
import { cx } from './i18n';
import { CInput, CSelect, CTextarea, Chip, Segmented } from './fields';
import { KIND_ICON } from './atoms';
import { KINDS, assignableStaff, findExisting, isoDayFromNow, type ContactKind, type InquiryX } from './model';
import { RFQ_PRODUCT } from './rfq';

const T = defineDict({
  sq: {
    title: 'Kërkesë manuale',
    subtitle: 'Regjistroni një kërkesë të marrë me telefon, e-mail ose në fabrikë — ndjek të njëjtin proces si kërkesat nga faqja.',
    kind: 'Lloji',
    source: 'Burimi',
    src_phone: 'Telefonatë',
    src_manual: 'Në fabrikë / e-mail',
    name: 'Emri dhe mbiemri',
    phone: 'Telefoni',
    email: 'E-mail',
    city: 'Qyteti',
    company: 'Kompania',
    service: 'Kategoria e produktit',
    serviceAny: 'Pa kategori',
    preferred: 'Data e dëshiruar',
    message: 'Mesazhi / përshkrimi i kërkesës',
    messagePh: 'P.sh. 3.000 kuti torte me logo, printim 1 ngjyrë, dorëzim para festave…',
    rfq: 'Specifikimet (opsionale)',
    rfqProduct: 'Lloji i produktit',
    rfqSize: 'Dimensionet',
    rfqSizePh: 'p.sh. 120 × 80 × 40 mm',
    rfqMaterial: 'Materiali',
    rfqMaterialPh: 'p.sh. GC2 350 g',
    rfqQty: 'Sasia (copë)',
    rfqColours: 'Printimi',
    rfqColoursPh: 'p.sh. CMYK + 1 Pantone',
    rfqDeadline: 'Afati i dorëzimit',
    assignee: 'Përgjegjësi',
    followUp: 'Afati i ndjekjes',
    noDue: 'Pa afat',
    today: 'Sot',
    tomorrow: 'Nesër',
    in3: 'Për 3 ditë',
    required: 'Fushë e detyrueshme',
    badPhone: 'Shkruani një numër të saktë (të paktën 8 shifra)',
    badEmail: 'E-maili nuk është i saktë',
    dupTitle: 'Ekziston tashmë një kërkesë e hapur për këtë kontakt',
    dupText: '{name} · {when}. Regjistrimi i ri do të shënohet si dyfish i mundshëm.',
    create: 'Krijo kërkesën',
    created: 'Kërkesa u krijua — {name}',
  },
  en: {
    title: 'Manual request',
    subtitle: 'Log a request received by phone, e-mail or at the factory — it follows the same flow as website requests.',
    kind: 'Type',
    source: 'Source',
    src_phone: 'Phone call',
    src_manual: 'At the factory / e-mail',
    name: 'Full name',
    phone: 'Phone',
    email: 'E-mail',
    city: 'City',
    company: 'Company',
    service: 'Product category',
    serviceAny: 'No category',
    preferred: 'Preferred date',
    message: 'Message / request details',
    messagePh: 'E.g. 3,000 cake boxes with a logo, 1-colour print, delivery before the holidays…',
    rfq: 'Specification (optional)',
    rfqProduct: 'Product type',
    rfqSize: 'Dimensions',
    rfqSizePh: 'e.g. 120 × 80 × 40 mm',
    rfqMaterial: 'Material',
    rfqMaterialPh: 'e.g. GC2 350 gsm',
    rfqQty: 'Quantity (pcs)',
    rfqColours: 'Print',
    rfqColoursPh: 'e.g. CMYK + 1 Pantone',
    rfqDeadline: 'Needed by',
    assignee: 'Assignee',
    followUp: 'Follow-up due',
    noDue: 'No due date',
    today: 'Today',
    tomorrow: 'Tomorrow',
    in3: 'In 3 days',
    required: 'Required',
    badPhone: 'Enter a valid number (at least 8 digits)',
    badEmail: 'E-mail is not valid',
    dupTitle: 'There is already an open request for this contact',
    dupText: '{name} · {when}. The new entry will be flagged as a possible duplicate.',
    create: 'Create request',
    created: 'Request created — {name}',
  },
});

/** Meeting requests keep the legacy inquiry type id `measurement` (shown everywhere as "Takim / konsultë"). */
const TYPE_FOR: Record<ContactKind, Inquiry['type']> = { contact: 'contact', meeting: 'measurement', b2b: 'quote' };
const TAG_FOR: Record<ContactKind, string> = { b2b: 'ofertë', contact: 'mesazh', meeting: 'takim' };
const EMPTY = { name: '', phone: '', email: '', city: '', company: '', service: '', date: '', message: '', product: 'box', size: '', material: '', qty: '', colours: '', deadline: '' };

export function ManualInquiryModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const t = useDict(T, 'admin');
  const tx = useDict(cx, 'admin');
  const ta = useDict(adm, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const settings = useSettings();
  const categories = useCategories();
  const staff = useDb((s) => s.staff);
  const inquiries = useDb((s) => s.inquiries);
  const me = useCurrentStaff();
  const assignable = useMemo(() => assignableStaff(staff), [staff]);

  const [kind, setKind] = useState<ContactKind>('b2b');
  const [source, setSource] = useState<'phone' | 'manual'>('phone');
  const [form, setForm] = useState(EMPTY);
  const [assignee, setAssignee] = useState<string>(() => (me && assignable.some((m) => m.id === me.id) ? me.id : ''));
  const [follow, setFollow] = useState<string>(() => isoDayFromNow(1));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const existing = useMemo(() => (form.phone.replace(/\D/g, '').length >= 6 || form.email.includes('@') ? findExisting(inquiries, form.phone, form.email)[0] : undefined), [inquiries, form.phone, form.email]);
  const cities = useMemo(() => allCities(settings), [settings]);

  const reset = () => {
    setKind('b2b');
    setSource('phone');
    setForm(EMPTY);
    setErrors({});
    setFollow(isoDayFromNow(1));
  };
  const close = () => {
    onClose();
    window.setTimeout(reset, 300);
  };

  const submit = () => {
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = t('required');
    if (!form.phone.trim()) err.phone = t('required');
    else if (form.phone.replace(/\D/g, '').length < 8) err.phone = t('badPhone');
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) err.email = t('badEmail');
    if (!form.message.trim() && !(kind === 'b2b' && (form.size.trim() || form.qty.trim()))) err.message = t('required');
    setErrors(err);
    if (Object.keys(err).length) return;

    const db = useDb.getState();
    const q = db.addInquiry({
      type: TYPE_FOR[kind],
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      city: form.city.trim() || undefined,
      service: form.service || undefined,
      message: form.message.trim(),
      preferredDate: kind === 'meeting' && form.date ? form.date : undefined,
      source,
      company: form.company.trim() || undefined,
    });
    const qty = Number(form.qty.replace(/\D/g, ''));
    const specs: RfqSpecs | undefined =
      kind === 'b2b'
        ? {
            product: form.product,
            ...(form.size.trim() ? { size: form.size.trim() } : {}),
            ...(form.material.trim() ? { material: form.material.trim() } : {}),
            ...(qty > 0 ? { quantity: qty } : {}),
            ...(form.colours.trim() ? { colours: form.colours.trim() } : {}),
            ...(form.deadline ? { deadline: form.deadline } : {}),
          }
        : undefined;
    const extra: Partial<InquiryX> = {
      seen: true,
      followUpAt: follow ? new Date(`${follow}T10:00`).toISOString() : undefined,
      tags: [TAG_FOR[kind], source === 'phone' ? 'telefon' : 'fabrikë', ...(form.company.trim() ? ['b2b'] : [])],
      ...(specs ? { specs } : {}),
      kind,
    };
    db.updateInquiry(q.id, extra);
    if (assignee) db.assignInquiry(q.id, assignee);
    db.logAudit({ action: 'create', object: 'inquiry', objectId: q.id, detail: `${q.name} (${tx(`src_${source}`)})` });
    toast.success(t('created', { name: q.name }));
    close();
    onCreated(q.id);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={t('title')}
      description={t('subtitle')}
      footer={
        <>
          <Button variant="outline" shape="rounded" size="sm" onClick={close}>
            {ta('cancel')}
          </Button>
          <Button variant="primary" shape="rounded" size="sm" onClick={submit}>
            {t('create')}
          </Button>
        </>
      }
    >
      <div className="space-y-5 px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-[12.5px] font-semibold text-ink-soft">{t('kind')}</span>
            <Segmented<ContactKind>
              value={kind}
              onChange={setKind}
              cols="grid-cols-3"
              options={KINDS.map((k) => {
                const I = KIND_ICON[k];
                return { id: k, label: tx(`kindShort_${k}`), title: tx(`kind_${k}`), icon: <I className="h-3.5 w-3.5 shrink-0" /> };
              })}
            />
          </div>
          <div>
            <span className="mb-1 block text-[12.5px] font-semibold text-ink-soft">{t('source')}</span>
            <Segmented<'phone' | 'manual'>
              value={source}
              onChange={setSource}
              options={[
                { id: 'phone', label: t('src_phone'), icon: <Phone className="h-3.5 w-3.5 shrink-0" /> },
                { id: 'manual', label: t('src_manual'), icon: <Factory className="h-3.5 w-3.5 shrink-0" /> },
              ]}
            />
          </div>
        </div>

        <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
          <CInput label={t('name')} required value={form.name} onChange={set('name')} error={errors.name} autoComplete="off" autoFocus />
          <CInput label={t('company')} value={form.company} onChange={set('company')} placeholder="SH.P.K. / L.L.C." />
          <CInput label={t('phone')} required type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="+383 4_ ___ ___" />
          <CInput label={t('email')} type="email" value={form.email} onChange={set('email')} error={errors.email} />
          <CInput label={t('city')} value={form.city} onChange={set('city')} list="manual-cities" />
          <datalist id="manual-cities">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {kind === 'meeting' ? (
            <CInput label={t('preferred')} type="date" min={isoDayFromNow(0)} value={form.date} onChange={set('date')} />
          ) : (
            <CSelect label={t('service')} value={form.service} onChange={set('service')}>
              <option value="">{t('serviceAny')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name.sq}>
                  {l(c.name)}
                </option>
              ))}
            </CSelect>
          )}
        </div>

        {kind === 'b2b' && (
          <fieldset className="rounded-xl border border-line px-4 pb-4 pt-2">
            <legend className="px-1 text-[12.5px] font-semibold text-ink-soft">{t('rfq')}</legend>
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
              <CSelect label={t('rfqProduct')} value={form.product} onChange={set('product')}>
                {Object.entries(RFQ_PRODUCT).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label[lang]}
                  </option>
                ))}
              </CSelect>
              <CInput label={t('rfqSize')} value={form.size} onChange={set('size')} placeholder={t('rfqSizePh')} />
              <CInput label={t('rfqMaterial')} value={form.material} onChange={set('material')} placeholder={t('rfqMaterialPh')} />
              <CInput label={t('rfqQty')} inputMode="numeric" value={form.qty} onChange={set('qty')} placeholder="5000" />
              <CInput label={t('rfqColours')} value={form.colours} onChange={set('colours')} placeholder={t('rfqColoursPh')} />
              <CInput label={t('rfqDeadline')} type="date" min={isoDayFromNow(0)} value={form.deadline} onChange={set('deadline')} />
            </div>
          </fieldset>
        )}

        <CTextarea label={t('message')} required={kind !== 'b2b'} rows={3} value={form.message} onChange={set('message')} error={errors.message} placeholder={t('messagePh')} />

        {existing && (
          <div className="flex gap-3 rounded-lg border border-amber-600/25 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">{t('dupTitle')}</div>
              <div className="mt-0.5 text-amber-900/80">{t('dupText', { name: existing.name, when: dateTime(existing.createdAt, lang) })}</div>
            </div>
          </div>
        )}

        <div className="grid gap-x-4 gap-y-3.5 border-t border-line pt-4 sm:grid-cols-2">
          <CSelect label={t('assignee')} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">{tx('unassigned')}</option>
            {assignable.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.title ? ` — ${l(m.title)}` : ''}
              </option>
            ))}
          </CSelect>
          <div>
            <CInput label={t('followUp')} type="date" value={follow} onChange={(e) => setFollow(e.target.value)} />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Chip on={follow === isoDayFromNow(0)} onClick={() => setFollow(isoDayFromNow(0))}>
                {t('today')}
              </Chip>
              <Chip on={follow === isoDayFromNow(1)} onClick={() => setFollow(isoDayFromNow(1))}>
                {t('tomorrow')}
              </Chip>
              <Chip on={follow === isoDayFromNow(3)} onClick={() => setFollow(isoDayFromNow(3))}>
                {t('in3')}
              </Chip>
              <Chip on={!follow} onClick={() => setFollow('')}>
                {t('noDue')}
              </Chip>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
