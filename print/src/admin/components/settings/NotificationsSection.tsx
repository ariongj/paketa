import { useMemo, useState } from 'react';
import { Eye, FileCheck2, Mail, MessageSquareText, Send, TriangleAlert, UserRound, Users } from 'lucide-react';
import { adm } from '@/admin/i18n';
import { common } from '@/i18n/common';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Overlay';
import { LANGS, defineDict, interpolate, useDict, useLang } from '@/i18n';
import { dateTime, money, timeAgo } from '@/lib/format';
import type { Lang, NotificationEvent, NotificationTemplate } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useDb } from '@/store/db';
import { S } from './strings';
import { TextField } from './fields';
import type { SecProps } from './model';
import { Block, Code, Note, Panel, Segmented, StateText } from './ui';

const N = defineDict({
  sq: {
    sender: 'Dërguesi dhe marrësi i stafit',
    sender_h: 'Nga dërgohen email-et dhe kush në ekip i merr njoftimet.',
    from: 'Dërguesi',
    staffEmail: 'Email-i i stafit për njoftime',
    staffEmail_h: 'Merr porositë, kërkesat për ofertë dhe reklamacionet e reja; përdoret edhe për hyrjen e administratorit.',
    customers: 'Për klientët',
    staff: 'Për stafin',
    r_customer: 'Klienti',
    r_staff: 'Stafi',
    preview: 'Parapamje',
    enabledN: 'Aktive: {n} nga {total}',
    ev_order_placed: 'Porosia u pranua',
    ev_order_confirmed: 'Porosia u konfirmua',
    ev_payment_received: 'Pagesa u regjistrua',
    ev_order_shipped: 'Porosia u dërgua',
    ev_return_requested: 'Reklamacion / kthim',
    ev_return_refunded: 'Rimbursimi',
    ev_contact_received: 'Kërkesa u pranua',
    ev_booking_confirmed: 'Takimi u konfirmua',
    ev_booking_reminder: 'Kujtesë për takimin',
    ev_staff_new_order: 'Porosi e re',
    ev_staff_new_inquiry: 'Kërkesë e re për ofertë',
    tr_order_placed: 'Menjëherë pas checkout-it',
    tr_order_confirmed: 'Kur ekipi e konfirmon porosinë',
    tr_payment_received: 'Kur pagesa regjistrohet',
    tr_order_shipped: 'Kur porosia dërgohet',
    tr_return_requested: 'Kur klienti hap një reklamacion',
    tr_return_refunded: 'Kur kryhet rimbursimi',
    tr_contact_received: 'Pas formularit të kontaktit ose të kërkesës për ofertë',
    tr_booking_confirmed: 'Kur takimi konfirmohet',
    tr_booking_reminder: '24 orë para takimit',
    tr_staff_new_order: 'Çdo porosi e re',
    tr_staff_new_inquiry: 'Çdo kërkesë e re për ofertë ose mesazh',
    b_order_placed: 'Faleminderit për porosinë {number}. Totali: {total} (me TVSH). Ekipi i prepress-it po kontrollon skedarët — prova digjitale vjen brenda 24 orësh.',
    b_order_confirmed: 'Porosia juaj {number} u konfirmua. Do të merrni provën digjitale për aprovim; prodhimi nis menjëherë pas aprovimit.',
    b_payment_received: 'Regjistruam pagesën prej {total} për porosinë {number}. Faleminderit!',
    b_order_shipped: 'Porosia {number} është në rrugë. Numri i gjurmimit: {tracking}.',
    b_return_requested: 'Klienti {name} hapi një reklamacion për porosinë {number}.',
    b_return_refunded: 'Rimbursimi për porosinë {number} u krye.',
    b_contact_received: 'Faleminderit për kërkesën! Oferta me çmimet sipas sasisë dhe afatin e prodhimit vjen brenda 24 orësh.',
    b_booking_confirmed: 'Takimi „{service}“ u konfirmua për {date} në orën {time}.',
    b_booking_reminder: 'Ju kujtojmë takimin „{service}“ nesër në orën {time}.',
    b_staff_new_order: 'Porosi e re {number} nga klienti {name}, totali {total}.',
    b_staff_new_inquiry: 'Kërkesë e re për ofertë nga {name} pret përgjigje te Kontaktet.',
    hello: 'I/E nderuar {name},',
    helloStaff: 'Përshëndetje,',
    regards: 'Me respekt,',
    subject: 'Titulli (subject)',
    variables: 'Variablat e lejuara',
    variables_h: 'Klikoni për t’i shtuar në titull.',
    unknownVar: 'Variabël e panjohur: {vars}',
    to: 'Për',
    lang: 'Gjuha',
    apply: 'Apliko',
    emptySubject: 'Titulli nuk mund të jetë bosh',
    log: 'Ditari i dërgimit',
    log_h: 'Email-et e fundit të dërguara. Dërgimet e dështuara riprovohen automatikisht deri në 3 herë.',
    logEvent: 'Ngjarja',
    logTo: 'Marrësi',
    logWhen: 'Koha',
    logStatus: 'Statusi',
    sent: 'Dërguar',
    logEmpty: 'Ende nuk ka email-e të dërguara.',
    smsNote: 'SMS/WhatsApp kërkojnë ofrues dhe konfigurim të veçantë.',
    proofs: 'Prova digjitale (prepress)',
    proofs_h: 'Dërgohen nga karta „Prepress & provë“ te porosia, me lidhjen për aprovim — gjithmonë aktive.',
    pr_awaiting_files: 'Na mungon skedari i printimit për porosinë {number}',
    pr_sent: 'Prova v{version} për porosinë {number} — ju lutem aprovojeni',
    pr_approved: 'Prova u aprovua — porosia {number} kalon në prodhim',
    pr_changes: 'Morëm ndryshimet tuaja — versioni i ri i provës për {number} vjen së shpejti',
    fromOrder: 'Nga porosia',
  },
  en: {
    sender: 'Sender & staff recipient',
    sender_h: 'Where e-mails are sent from and who in the team gets notified.',
    from: 'Sender',
    staffEmail: 'Staff notification e-mail',
    staffEmail_h: 'Receives new orders, quote requests and complaints; also used for the administrator sign-in.',
    customers: 'For customers',
    staff: 'For staff',
    r_customer: 'Customer',
    r_staff: 'Staff',
    preview: 'Preview',
    enabledN: 'On: {n} of {total}',
    ev_order_placed: 'Order received',
    ev_order_confirmed: 'Order confirmed',
    ev_payment_received: 'Payment received',
    ev_order_shipped: 'Order shipped',
    ev_return_requested: 'Complaint / return',
    ev_return_refunded: 'Refund issued',
    ev_contact_received: 'Request received',
    ev_booking_confirmed: 'Meeting confirmed',
    ev_booking_reminder: 'Meeting reminder',
    ev_staff_new_order: 'New order',
    ev_staff_new_inquiry: 'New quote request',
    tr_order_placed: 'Right after checkout',
    tr_order_confirmed: 'When the team confirms the order',
    tr_payment_received: 'When the payment is recorded',
    tr_order_shipped: 'When the order ships',
    tr_return_requested: 'When a customer opens a complaint',
    tr_return_refunded: 'When the refund is issued',
    tr_contact_received: 'After a contact form or quote request',
    tr_booking_confirmed: 'When the meeting is confirmed',
    tr_booking_reminder: '24 h before the meeting',
    tr_staff_new_order: 'Every new order',
    tr_staff_new_inquiry: 'Every new quote request or message',
    b_order_placed: 'Thank you for order {number}. Total: {total} (incl. VAT). Our prepress team is checking your files — the digital proof follows within 24 hours.',
    b_order_confirmed: 'Your order {number} is confirmed. You will receive the digital proof for approval; production starts as soon as you approve it.',
    b_payment_received: 'We’ve recorded your payment of {total} for order {number}. Thank you!',
    b_order_shipped: 'Order {number} is on its way. Tracking number: {tracking}.',
    b_return_requested: 'Customer {name} opened a complaint for order {number}.',
    b_return_refunded: 'The refund for order {number} has been issued.',
    b_contact_received: 'Thank you for your request! Your quote with quantity prices and the production lead time follows within 24 hours.',
    b_booking_confirmed: 'Your “{service}” meeting is confirmed for {date} at {time}.',
    b_booking_reminder: 'A reminder of your “{service}” meeting tomorrow at {time}.',
    b_staff_new_order: 'New order {number} from {name}, total {total}.',
    b_staff_new_inquiry: 'A new quote request from {name} is waiting in Contacts.',
    hello: 'Dear {name},',
    helloStaff: 'Hello,',
    regards: 'Kind regards,',
    subject: 'Subject',
    variables: 'Allowed variables',
    variables_h: 'Click to add to the subject.',
    unknownVar: 'Unknown variable: {vars}',
    to: 'To',
    lang: 'Language',
    apply: 'Apply',
    emptySubject: 'The subject can’t be empty',
    log: 'Delivery log',
    log_h: 'The latest e-mails sent. Failed deliveries are retried automatically up to 3 times.',
    logEvent: 'Event',
    logTo: 'Recipient',
    logWhen: 'Time',
    logStatus: 'Status',
    sent: 'Sent',
    logEmpty: 'No e-mails sent yet.',
    smsNote: 'SMS and WhatsApp need a separate provider and setup.',
    proofs: 'Digital proof (prepress)',
    proofs_h: 'Sent from the “Prepress & proof” card on the order, with the approval link — always on.',
    pr_awaiting_files: 'We are missing the print file for order {number}',
    pr_sent: 'Proof v{version} for order {number} — please approve it',
    pr_approved: 'Proof approved — order {number} goes into production',
    pr_changes: 'We received your changes — the new proof for {number} follows shortly',
    fromOrder: 'From the order',
  },
});
type NKey = keyof typeof N.sq;

/** Variables each event may use (PDF p.40 "variabla të lejuara"). */
const VARS: Record<NotificationEvent, string[]> = {
  order_placed: ['number', 'total', 'name'],
  order_confirmed: ['number', 'total', 'name'],
  payment_received: ['number', 'total', 'name'],
  order_shipped: ['number', 'name', 'tracking'],
  return_requested: ['number', 'name'],
  return_refunded: ['number', 'name'],
  contact_received: ['name'],
  booking_confirmed: ['date', 'time', 'name', 'service'],
  booking_reminder: ['date', 'time', 'name', 'service'],
  staff_new_order: ['number', 'total', 'name'],
  staff_new_inquiry: ['name'],
};

/** Proof e-mails sent from the order's prepress card (print workflow). */
const PROOF_MAILS = ['awaiting_files', 'sent', 'approved', 'changes'] as const;

const varsIn = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

/** Subject with {variables} shown as small chips. */
function Subject({ text }: { text: string }) {
  const parts = text.split(/(\{\w+\})/g).filter(Boolean);
  return (
    <span className="leading-relaxed">
      {parts.map((p, i) =>
        /^\{\w+\}$/.test(p) ? (
          <span key={i} className="mx-px rounded bg-[#efefef] px-1 py-px font-mono text-[11.5px] text-ink-soft">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}

function useSamples(lang: Lang) {
  const orders = useDb((s) => s.orders);
  const inquiries = useDb((s) => s.inquiries);
  const bookings = useDb((s) => s.bookings);
  const services = useDb((s) => s.services);
  return useMemo(() => {
    const o = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const q = [...inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const now = Date.now();
    const b = [...bookings].filter((x) => new Date(x.start).getTime() >= now).sort((x, y) => x.start.localeCompare(y.start))[0] ?? bookings[0];
    const svc = services.find((s) => s.id === b?.serviceId);
    const start = b ? new Date(b.start) : new Date();
    const locale = lang === 'sq' ? 'sq-AL' : 'en-GB';
    return {
      order: {
        number: o?.number ?? 'PW-1042',
        total: money(o?.total ?? 249, lang),
        name: o ? `${o.customer.firstName} ${o.customer.lastName}` : 'Arta Krasniqi',
        email: o?.customer.email ?? 'klienti@example.com',
        tracking: 'XK-48213',
      },
      inquiry: { name: q?.name ?? 'Blerim Gashi', email: q?.email ?? 'klienti@example.com' },
      booking: {
        name: b?.customerName ?? 'Driton Berisha',
        email: b?.email ?? 'klienti@example.com',
        date: start.toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
        time: start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
        service: svc ? svc.name[lang] || svc.name.sq : lang === 'sq' ? 'Konsultë për paketim' : 'Packaging consultation',
      },
    };
  }, [orders, inquiries, bookings, services, lang]);
}

function sampleVars(ev: NotificationEvent, sm: ReturnType<typeof useSamples>): Record<string, string> {
  if (ev === 'contact_received' || ev === 'staff_new_inquiry') return { name: sm.inquiry.name };
  if (ev === 'booking_confirmed' || ev === 'booking_reminder') return { ...sm.booking };
  return { ...sm.order };
}

function sampleTo(tpl: NotificationTemplate, sm: ReturnType<typeof useSamples>, staffEmail: string) {
  if (tpl.recipients === 'staff') return staffEmail;
  if (tpl.event === 'contact_received') return sm.inquiry.email;
  if (tpl.event.startsWith('booking')) return sm.booking.email;
  return sm.order.email;
}

/* ------------------------------------------------------------------ */
/* Template editor + preview                                           */
/* ------------------------------------------------------------------ */
function TemplateModal({ open, tpl, onClose, onApply, sender, staffEmail, company, phone, readOnly }: { open: boolean; tpl: NotificationTemplate; onClose: () => void; onApply: (t: NotificationTemplate) => void; sender: string; staffEmail: string; company: string; phone: string; readOnly: boolean }) {
  const ta = useDict(adm, 'admin');
  const adminLang = useLang('admin');
  const [lang, setLang] = useState<Lang>(adminLang);
  const [subject, setSubject] = useState(tpl.subject);
  const t = (k: NKey, vars?: Record<string, string | number>) => interpolate(N[lang][k], vars);
  const tAdmin = useDict(N, 'admin');
  const sm = useSamples(lang);
  const vars = sampleVars(tpl.event, sm);
  const allowed = VARS[tpl.event];
  const unknown = [...new Set(varsIn(subject[lang]).filter((v) => !allowed.includes(v)))];
  const name = vars.name ?? '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={tAdmin(`ev_${tpl.event}` as NKey)}
      description={tAdmin(`tr_${tpl.event}` as NKey)}
      footer={
        <>
          <Button variant="outline" size="sm" shape="rounded" onClick={onClose}>
            {readOnly ? ta('close') : ta('cancel')}
          </Button>
          {!readOnly && (
            <Button size="sm" shape="rounded" disabled={!subject.sq.trim()} onClick={() => onApply({ ...tpl, subject })}>
              {tAdmin('apply')}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented label={tAdmin('lang')} value={lang} onChange={setLang} options={LANGS.map((l) => ({ id: l.code, label: l.short }))} />
          <StateText tone={tpl.recipients === 'staff' ? 'info' : 'ok'}>{tAdmin(tpl.recipients === 'staff' ? 'r_staff' : 'r_customer')}</StateText>
        </div>

        <div>
          <TextField
            label={`${tAdmin('subject')} · ${lang.toUpperCase()}`}
            value={subject[lang]}
            onChange={(v) => setSubject({ ...subject, [lang]: v })}
            readOnly={readOnly}
            error={!subject.sq.trim() ? tAdmin('emptySubject') : unknown.length ? tAdmin('unknownVar', { vars: unknown.map((u) => `{${u}}`).join(', ') }) : undefined}
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] text-muted">{tAdmin('variables')}:</span>
            {allowed.map((v) => (
              <Code key={v} title={readOnly ? undefined : tAdmin('variables_h')} onClick={readOnly ? undefined : () => setSubject({ ...subject, [lang]: `${subject[lang]}${subject[lang].endsWith(' ') || !subject[lang] ? '' : ' '}{${v}}` })}>
                {`{${v}}`}
              </Code>
            ))}
          </div>
        </div>

        {/* Rendered e-mail */}
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="space-y-1 border-b border-line bg-[#f7f7f7] px-4 py-3 text-[12.5px]">
            <div className="flex gap-2">
              <span className="w-14 shrink-0 text-muted">{t('from')}</span>
              <span className="min-w-0 truncate text-ink-soft">
                {company} &lt;{sender}&gt;
              </span>
            </div>
            <div className="flex gap-2">
              <span className="w-14 shrink-0 text-muted">{t('to')}</span>
              <span className="min-w-0 truncate text-ink-soft">{sampleTo(tpl, sm, staffEmail)}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-14 shrink-0 text-muted">Subject</span>
              <span className="min-w-0 font-semibold text-ink">{interpolate(subject[lang] || subject.sq, vars)}</span>
            </div>
          </div>
          <div className="bg-white px-5 py-5 text-[13.5px] leading-relaxed text-ink-soft">
            <div className="mb-4 text-[15px] font-extrabold tracking-tight text-ink">{company}</div>
            <p>{tpl.recipients === 'staff' ? t('helloStaff') : t('hello', { name })}</p>
            <p className="mt-2">{interpolate(N[lang][`b_${tpl.event}` as NKey], vars)}</p>
            <p className="mt-4">
              {t('regards')}
              <br />
              <span className="font-semibold text-ink">{company}</span>
              <span className="text-muted"> · {phone}</span>
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */
interface LogRow {
  id: string;
  at: string;
  event: NotificationEvent;
  to: string;
}

export function NotificationsSection({ s, set, errors, readOnly }: SecProps) {
  const t = useDict(N, 'admin');
  const tc = useDict(common, 'admin');
  const ts = useDict(S, 'admin');
  const lang = useLang('admin');
  const orders = useDb((st) => st.orders);
  const inquiries = useDb((st) => st.inquiries);
  const bookings = useDb((st) => st.bookings);
  const [editing, setEditing] = useState<{ tpl: NotificationTemplate; key: number } | null>(null);
  const [open, setOpen] = useState(false);

  const list = s.notifications;
  // Transactional e-mail goes out from the public address (SMTP integration: hello@printwor-ks.com)
  const sender = s.email?.includes('@') ? s.email : `hello@${s.ext.domain || 'printwor-ks.com'}`;
  const on = (ev: NotificationEvent) => list.find((n) => n.event === ev)?.enabled ?? false;
  const patch = (id: string, p: Partial<NotificationTemplate>) => set('notifications', list.map((n) => (n.id === id ? { ...n, ...p } : n)));

  // Derived delivery log from real store activity (only for enabled templates).
  const log = useMemo(() => {
    const rows: LogRow[] = [];
    for (const o of orders) {
      if (on('order_placed') && o.customer.email) rows.push({ id: `o-${o.id}`, at: o.createdAt, event: 'order_placed', to: o.customer.email });
      if (on('staff_new_order')) rows.push({ id: `so-${o.id}`, at: o.createdAt, event: 'staff_new_order', to: s.adminEmail });
    }
    for (const q of inquiries) {
      if (on('contact_received') && q.email) rows.push({ id: `q-${q.id}`, at: q.createdAt, event: 'contact_received', to: q.email });
      if (on('staff_new_inquiry')) rows.push({ id: `sq-${q.id}`, at: q.createdAt, event: 'staff_new_inquiry', to: s.adminEmail });
    }
    for (const b of bookings) if (on('booking_confirmed') && b.email && b.status === 'confirmed') rows.push({ id: `b-${b.id}`, at: b.createdAt, event: 'booking_confirmed', to: b.email });
    return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [orders, inquiries, bookings, list, s.adminEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEditor = (tpl: NotificationTemplate) => {
    setEditing({ tpl, key: Date.now() });
    setOpen(true);
  };

  const group = (recipients: NotificationTemplate['recipients']) => {
    const rows = list.filter((n) => n.recipients === recipients);
    return (
      <div className="overflow-hidden rounded-lg border border-line">
        <ul className="divide-y divide-line/60">
          {rows.map((n) => (
            <li key={n.id} className={cn('flex flex-col gap-2.5 px-4 py-3 transition-colors hover:bg-[#fafafa] md:flex-row md:items-center md:gap-4', !n.enabled && 'bg-[#fcfcfc]')}>
              <div className="flex min-w-0 items-start gap-3 md:w-[38%] md:shrink-0">
                <span className="pt-0.5">
                  <Switch size="sm" checked={n.enabled} disabled={readOnly} onChange={(v) => patch(n.id, { enabled: v })} label={<span className="sr-only">{t(`ev_${n.event}` as NKey)}</span>} />
                </span>
                <div className="min-w-0">
                  <div className={cn('text-[13.5px] font-semibold', n.enabled ? 'text-ink' : 'text-muted')}>{t(`ev_${n.event}` as NKey)}</div>
                  <div className="text-[12px] text-muted">{t(`tr_${n.event}` as NKey)}</div>
                </div>
              </div>
              <div className={cn('min-w-0 flex-1 pl-12 text-[13px] md:pl-0', n.enabled ? 'text-ink-soft' : 'text-muted')}>
                <Subject text={n.subject[lang] || n.subject.sq} />
              </div>
              <div className="flex shrink-0 items-center gap-3 pl-12 md:pl-0">
                <StateText tone={n.enabled ? 'ok' : 'off'} className="w-[72px]">
                  {n.enabled ? ts('statusOn') : ts('statusOff')}
                </StateText>
                <Button variant="outline" size="xs" shape="rounded" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => openEditor(n)}>
                  {t('preview')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const customers = list.filter((n) => n.recipients === 'customer');
  const staffList = list.filter((n) => n.recipients === 'staff');

  return (
    <div className="space-y-5">
      <Panel
        lead
        title={ts('sec_notifications')}
        description={ts('sec_notifications_d')}
        footnote={
          <>
            <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t('smsNote')}</span>
          </>
        }
      >
        <Block title={t('sender')} hint={t('sender_h')}>
          <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
            <TextField label={t('from')} value={`${s.companyName} <${sender}>`} onChange={() => undefined} readOnly leading={<Send className="h-4 w-4" />} inputClassName="bg-[#f6f6f6] text-ink-soft" />
            <TextField label={t('staffEmail')} hint={t('staffEmail_h')} type="email" value={s.adminEmail} onChange={(v) => set('adminEmail', v.trim())} readOnly={readOnly} leading={<Mail className="h-4 w-4" />} error={errors.adminEmail} />
          </div>
        </Block>

        <Block
          title={
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4 text-muted" /> {t('customers')}
            </span>
          }
          aside={<span className="text-[12px] text-muted">{t('enabledN', { n: customers.filter((n) => n.enabled).length, total: customers.length })}</span>}
        >
          {group('customer')}
        </Block>

        <Block
          title={
            <span className="inline-flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-muted" /> {t('proofs')}
            </span>
          }
          hint={t('proofs_h')}
        >
          <div className="overflow-hidden rounded-lg border border-line">
            <ul className="divide-y divide-line/60">
              {PROOF_MAILS.map((p) => (
                <li key={p} className="flex flex-col gap-1.5 px-4 py-3 md:flex-row md:items-center md:gap-4">
                  <div className="text-[13.5px] font-semibold text-ink md:w-[38%] md:shrink-0">{tc(`proof_${p}`)}</div>
                  <div className="min-w-0 flex-1 text-[13px] text-ink-soft">
                    <Subject text={t(`pr_${p}` as NKey)} />
                  </div>
                  <StateText tone="ok" className="shrink-0">
                    {t('fromOrder')}
                  </StateText>
                </li>
              ))}
            </ul>
          </div>
        </Block>

        <Block
          title={
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-muted" /> {t('staff')}
            </span>
          }
          aside={<span className="text-[12px] text-muted">{t('enabledN', { n: staffList.filter((n) => n.enabled).length, total: staffList.length })}</span>}
        >
          {group('staff')}
        </Block>
      </Panel>

      <Panel title={t('log')} description={t('log_h')} flush>
        {log.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-muted">{t('logEmpty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-[13px]">
              <thead>
                <tr>
                  {[t('logEvent'), t('logTo'), t('logWhen'), t('logStatus')].map((h) => (
                    <th key={h} className="whitespace-nowrap border-b border-line bg-[#f7f7f7] px-3 py-2.5 text-[12px] font-semibold text-muted first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-[#fafafa]">
                    <td className="border-b border-line/60 py-2.5 pl-5 pr-3 font-medium text-ink sm:pl-6">{t(`ev_${r.event}` as NKey)}</td>
                    <td className="max-w-[240px] truncate border-b border-line/60 px-3 py-2.5 text-ink-soft">{r.to}</td>
                    <td className="whitespace-nowrap border-b border-line/60 px-3 py-2.5 text-muted" title={dateTime(r.at, lang)}>
                      {timeAgo(r.at, lang)}
                    </td>
                    <td className="border-b border-line/60 py-2.5 pl-3 pr-5 sm:pr-6">
                      <StateText tone="ok">{t('sent')}</StateText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {list.some((n) => !n.subject.sq.trim()) && (
        <Note tone="amber" icon={TriangleAlert}>
          {t('emptySubject')}
        </Note>
      )}

      {editing && (
        <TemplateModal
          key={editing.key}
          open={open}
          tpl={editing.tpl}
          readOnly={readOnly}
          onClose={() => setOpen(false)}
          onApply={(tpl) => {
            patch(tpl.id, { subject: tpl.subject });
            setOpen(false);
          }}
          sender={sender}
          staffEmail={s.adminEmail}
          company={s.companyName}
          phone={s.phone}
        />
      )}
    </div>
  );
}
