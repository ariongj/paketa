// "Prepress & provë" — print files per order line and the digital-proof state machine:
//   awaiting_files → checking → sent (v n) → approved | changes → sent (v n+1) …
// Every step writes order.proof / line.artwork (updateOrder), a timeline note (addOrderNote, prefixed so the
// timeline labels it "Prepress & provë") and an audit entry.
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Check, CheckCircle2, FileText, Inbox, Mail, MessageSquareWarning, Paperclip, PenLine, ScanSearch, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/admin/components/kit';
import { defineDict, useDict, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { useCan } from '@/store/hooks';
import { date, dateTime, num, unitLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ArtworkRef, Lang, Order, OrderProof, ProofStatus } from '@/lib/types';
import { localizeLine } from './helpers';
import { PREPRESS_NOTE, artworkOf, artworkSummary, fileExt, fileSize, isPrepressNote, prepressNoteOf, proofOf, type PrepressArtwork } from './print';
import { ArtworkBadge, ProofBadge, StatusGlyph } from './status';
import { Eyebrow, TextArea, Tip } from './ui';

const T = defineDict({
  sq: {
    title: 'Prepress & provë',
    description: 'Skedarët e printimit për çdo artikull dhe aprovimi i provës digjitale para prodhimit.',
    files: 'Skedarët e printimit',
    noFile: 'Ende pa skedar',
    designNote: 'Dizajni përgatitet nga ekipi i PrintWorks',
    receivedOutside: 'Marrë jashtë platformës (e-mail / WeTransfer)',
    customerNote: 'Klienti: „{note}“',
    prepressNote: 'Prepress: {note}',
    markReceived: 'Shëno si të marrë',
    attach: 'Bashkëngjit skedar',
    replace: 'Zëvendëso',
    note: 'Shënim',
    notePh: 'Shënim për prepress, p.sh. „logo në vektor, bleed 3 mm“',
    saveNote: 'Ruaj shënimin',
    preview: 'Parapamja e skedarit {name}',
    proof: 'Prova digjitale',
    step_files: 'Skedarët',
    step_check: 'Kontrolli',
    step_sent: 'Prova te klienti',
    step_approved: 'Aprovimi',
    st_new: 'Konfirmoni porosinë që prepress-i të nisë kontrollin e skedarëve.',
    st_missing_one: 'Mungon 1 skedar printimi. Kontrolli nis sapo të vijnë të gjithë skedarët.',
    st_missing_many: 'Mungojnë {n} skedarë printimi. Kontrolli nis sapo të vijnë të gjithë skedarët.',
    st_ready: 'Të gjithë skedarët janë gati — mund të nisni kontrollin prepress.',
    st_checking: 'Prepress kontrollon rezolucionin, bleed-in 3 mm, ngjyrat CMYK / Pantone dhe linjat e prerjes me matricë.',
    st_sent: 'Prova v{v} u dërgua më {date}. Në pritje të aprovimit nga klienti.',
    st_changes: 'Klienti kërkoi ndryshime në provën v{v}. Përgatitni versionin e ri.',
    st_approved: 'Prova v{v} u aprovua më {date} — gati për prodhim.',
    st_approvedPlain: 'Prova u aprovua — gati për prodhim.',
    st_locked: 'Porosia është në prodhim ose më tej — prova është e mbyllur.',
    changesAsked: 'Kërkesa e klientit',
    remind: 'Kujto klientin',
    remindSubject: 'Skedarët e printimit për porosinë #{n}',
    remindBody:
      'Përshëndetje,\n\npër të nisur prodhimin e porosisë #{n} na duhen skedarët e printimit (PDF me bleed 3 mm, ngjyra CMYK, fontet të konvertuara). Mund t’i dërgoni si përgjigje në këtë e-mail.\n\nFaleminderit,\nPrintWorks',
    startCheck: 'Nis kontrollin prepress',
    startCheckTip: 'Prisni të gjithë skedarët ose shënojini si të marrë',
    sendProof: 'Dërgo provën v{v}',
    approve: 'Klienti aprovoi',
    requestChanges: 'Kërkohen ndryshime',
    changesPh: 'Çfarë kërkoi klienti? p.sh. „logo pak më e madhe, ngjyra më e ngrohtë“',
    recordChanges: 'Regjistro ndryshimet',
    cancel: 'Anulo',
    version: 'Versioni',
    sentAt: 'Dërguar',
    approvedAt: 'Aprovuar',
    activity: 'Aktiviteti i prepress-it',
    log_received: 'Skedari për „{line}“ u shënua si i marrë',
    log_attached: 'U bashkëngjit {file} për „{line}“',
    log_note: 'Shënim për „{line}“: {note}',
    log_reminded: 'Klientit iu kujtua të dërgojë skedarët',
    log_check: 'Kontrolli prepress filloi',
    log_sent: 'Prova v{v} u dërgua te klienti',
    log_approved: 'Klienti aprovoi provën v{v}',
    log_changes: 'Klienti kërkoi ndryshime në provën v{v}: {note}',
    log_changesPlain: 'Klienti kërkoi ndryshime në provën v{v}',
  },
  en: {
    title: 'Prepress & proof',
    description: 'Print files per item and the digital proof approval before production.',
    files: 'Print files',
    noFile: 'No file yet',
    designNote: 'Artwork is prepared by the PrintWorks team',
    receivedOutside: 'Received outside the platform (e-mail / WeTransfer)',
    customerNote: 'Customer: “{note}”',
    prepressNote: 'Prepress: {note}',
    markReceived: 'Mark as received',
    attach: 'Attach file',
    replace: 'Replace',
    note: 'Note',
    notePh: 'Prepress note, e.g. “vector logo, 3 mm bleed”',
    saveNote: 'Save note',
    preview: 'Preview of {name}',
    proof: 'Digital proof',
    step_files: 'Files',
    step_check: 'Check',
    step_sent: 'Proof with customer',
    step_approved: 'Approval',
    st_new: 'Confirm the order so prepress can start checking the files.',
    st_missing_one: '1 print file is missing. The check starts as soon as all files are in.',
    st_missing_many: '{n} print files are missing. The check starts as soon as all files are in.',
    st_ready: 'All files are in — you can start the prepress check.',
    st_checking: 'Prepress checks resolution, 3 mm bleed, CMYK / Pantone colours and die-cut lines.',
    st_sent: 'Proof v{v} sent on {date}. Waiting for the customer’s approval.',
    st_changes: 'The customer asked for changes to proof v{v}. Prepare the next version.',
    st_approved: 'Proof v{v} approved on {date} — ready for production.',
    st_approvedPlain: 'Proof approved — ready for production.',
    st_locked: 'The order is in production or beyond — the proof is closed.',
    changesAsked: 'Customer request',
    remind: 'Remind customer',
    remindSubject: 'Print files for order #{n}',
    remindBody:
      'Hello,\n\nto start production of order #{n} we need your print files (PDF with 3 mm bleed, CMYK colours, fonts outlined). You can simply reply to this e-mail with the files.\n\nThank you,\nPrintWorks',
    startCheck: 'Start prepress check',
    startCheckTip: 'Wait for all files or mark them as received',
    sendProof: 'Send proof v{v}',
    approve: 'Customer approved',
    requestChanges: 'Changes requested',
    changesPh: 'What did the customer ask for? e.g. “slightly bigger logo, warmer colour”',
    recordChanges: 'Record changes',
    cancel: 'Cancel',
    version: 'Version',
    sentAt: 'Sent',
    approvedAt: 'Approved',
    activity: 'Prepress activity',
    log_received: 'File for “{line}” marked as received',
    log_attached: 'Attached {file} for “{line}”',
    log_note: 'Note for “{line}”: {note}',
    log_reminded: 'Customer reminded to send the files',
    log_check: 'Prepress check started',
    log_sent: 'Proof v{v} sent to the customer',
    log_approved: 'Customer approved proof v{v}',
    log_changes: 'Customer asked for changes to proof v{v}: {note}',
    log_changesPlain: 'Customer asked for changes to proof v{v}',
  },
});

/** Small image preview (data-URL, ≤ 160 px) for uploaded image files — PDFs/AI keep metadata only. */
function imageThumb(file: File, max = 160): Promise<string | undefined> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/webp', 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    img.src = url;
  });
}

const STEP_OF: Record<ProofStatus, number> = { awaiting_files: 0, checking: 1, sent: 2, changes: 2, approved: 3 };

export function PrepressCard({ order }: { order: Order }) {
  const t = useDict(T, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const products = useDb((s) => s.products);
  const updateOrder = useDb((s) => s.updateOrder);
  const addOrderNote = useDb((s) => s.addOrderNote);
  const setOrderStatus = useDb((s) => s.setOrderStatus);
  const logAudit = useDb((s) => s.logAudit);

  const proof = proofOf(order, products);
  const art = useMemo(() => artworkSummary(order, products), [order, products]);
  const lines = useMemo(
    () => order.items.map((l, i) => ({ l, i, a: artworkOf(l, products), name: localizeLine(l, products.find((p) => p.id === l.productId), order.lang, lang).name })).filter((x) => x.a),
    [order, products, lang],
  );
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesNote, setChangesNote] = useState('');

  const s = order.status;
  const editable = can('orders', 'edit');
  const proofEditable = editable && (s === 'confirmed' || s === 'proof');
  const artEditable = editable && (s === 'new' || s === 'confirmed' || s === 'proof');
  const locked = s === 'processing' || s === 'shipped' || s === 'completed';

  if (!proof || !lines.length || s === 'cancelled') return null;

  const log = (note: string) => addOrderNote(order.id, PREPRESS_NOTE + note);

  /* ---------------- artwork ---------------- */
  const setArtwork = (index: number, a: ArtworkRef, note: string) => {
    updateOrder(order.id, { items: order.items.map((l, i) => (i === index ? { ...l, artwork: a } : l)) });
    log(note);
    toast.success(note);
  };

  /* ---------------- proof state machine ---------------- */
  const setProof = (next: OrderProof, note: string) => {
    if (s === 'confirmed') setOrderStatus(order.id, 'proof');
    updateOrder(order.id, { proof: next });
    log(note);
    logAudit({ action: 'status', object: 'order', objectId: order.id, detail: `${order.number}: proof → ${next.status}${next.version ? ` v${next.version}` : ''}` });
    toast.success(note);
  };
  const now = () => new Date().toISOString();
  const startCheck = () => setProof({ ...proof, status: 'checking' }, t('log_check'));
  const sendProof = () => {
    const v = proof.version + 1;
    setProof({ status: 'sent', version: v, sentAt: now() }, t('log_sent', { v }));
  };
  const approve = () => setProof({ ...proof, status: 'approved', approvedAt: now() }, t('log_approved', { v: proof.version }));
  const recordChanges = () => {
    const note = changesNote.trim();
    setProof({ ...proof, status: 'changes', ...(note ? { note } : {}) }, note ? t('log_changes', { v: proof.version, note }) : t('log_changesPlain', { v: proof.version }));
    setChangesOpen(false);
    setChangesNote('');
  };
  const remind = () => {
    log(t('log_reminded'));
    toast.success(t('log_reminded'));
  };

  const step = STEP_OF[proof.status];
  const statusText =
    s === 'new'
      ? t('st_new')
      : proof.status === 'awaiting_files'
        ? art.missing === 0
          ? t('st_ready')
          : art.missing === 1
            ? t('st_missing_one')
            : t('st_missing_many', { n: art.missing })
        : proof.status === 'checking'
          ? t('st_checking')
          : proof.status === 'sent'
            ? t('st_sent', { v: proof.version, date: proof.sentAt ? dateTime(proof.sentAt, lang) : '—' })
            : proof.status === 'changes'
              ? t('st_changes', { v: proof.version })
              : proof.approvedAt && proof.version
                ? t('st_approved', { v: proof.version, date: date(proof.approvedAt, lang, { day: 'numeric', month: 'short', year: 'numeric' }) })
                : t('st_approvedPlain');

  const activity = order.timeline.filter(isPrepressNote).slice(-4).reverse();
  const mailto = order.customer.email
    ? `mailto:${order.customer.email}?subject=${encodeURIComponent(t('remindSubject', { n: order.number }))}&body=${encodeURIComponent(t('remindBody', { n: order.number }))}`
    : null;

  return (
    <Card
      title={
        <span className="flex flex-wrap items-center gap-2">
          {t('title')}
          <ProofBadge proof={proof} />
        </span>
      }
      description={t('description')}
      padded={false}
    >
      {/* ---------------- files per line ---------------- */}
      <div className="px-4 pt-4 sm:px-5">
        <Eyebrow>{t('files')}</Eyebrow>
      </div>
      <ul className="mt-2 divide-y divide-line/70 border-y border-line/70">
        {lines.map(({ l, i, a, name }) => (
          <ArtworkRow
            key={i}
            name={name}
            qty={`${num(l.qty, lang)} ${unitLabel(l.unit, lang)}`}
            art={a!}
            editable={artEditable}
            t={t}
            onReceived={() => setArtwork(i, { ...a!, status: 'uploaded' }, t('log_received', { line: name }))}
            onFile={async (file) => {
              const thumb = await imageThumb(file);
              setArtwork(i, { status: 'uploaded', name: file.name, size: file.size, ...(thumb ? { thumb } : {}), ...(a!.note ? { note: a!.note } : {}) }, t('log_attached', { file: file.name, line: name }));
            }}
            onNote={(note) => {
              updateOrder(order.id, { items: order.items.map((x, k) => (k === i ? { ...x, artwork: { ...a!, prepressNote: note || undefined } as PrepressArtwork } : x)) });
              if (note) log(t('log_note', { line: name, note }));
              toast.success(t('saveNote'));
            }}
            lang={lang}
          />
        ))}
      </ul>

      {/* ---------------- proof ---------------- */}
      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>{t('proof')}</Eyebrow>
          {proof.version > 0 && (
            <span className="text-[12px] text-muted">
              {t('version')} <span className="font-mono font-semibold text-ink">v{proof.version}</span>
              {proof.sentAt && <> · {t('sentAt')} {date(proof.sentAt, lang, { day: 'numeric', month: 'short' })}</>}
              {proof.approvedAt && proof.status === 'approved' && <> · {t('approvedAt')} {date(proof.approvedAt, lang, { day: 'numeric', month: 'short' })}</>}
            </span>
          )}
        </div>

        {/* mini state machine */}
        <ol className="mt-3 grid grid-cols-4 gap-1.5" aria-label={t('proof')}>
          {(['step_files', 'step_check', 'step_sent', 'step_approved'] as const).map((k, idx) => {
            const done = idx < step || (idx === 3 && proof.status === 'approved');
            const current = idx === step && !done;
            const changes = idx === 2 && proof.status === 'changes';
            return (
              <li key={k} className="min-w-0">
                <span className={cn('block h-1 rounded-full', done ? 'bg-ink' : current ? (changes ? 'bg-[#B42318]' : 'bg-ink/45') : 'bg-line')} />
                <span className={cn('mt-1.5 flex items-center gap-1 text-[11.5px] font-semibold leading-tight', done || current ? 'text-ink' : 'text-muted')}>
                  {done ? <Check className="h-3 w-3 shrink-0" strokeWidth={3} /> : changes ? <StatusGlyph glyph="cross" className="text-[#B42318]" /> : null}
                  <span className="truncate">{t(k)}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <p className={cn('mt-3 text-[13.5px] leading-relaxed', proof.status === 'changes' ? 'text-ink' : 'text-ink-soft')}>{locked && proof.status !== 'approved' ? t('st_locked') : statusText}</p>
        {proof.status === 'changes' && proof.note && (
          <div className="mt-2 rounded-lg bg-[#FDE3DF]/50 px-3 py-2 text-[13px] text-ink ring-1 ring-[#F3C1B8]">
            <span className="mr-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#8A1B0A]">
              <MessageSquareWarning className="h-3.5 w-3.5" /> {t('changesAsked')}
            </span>
            {proof.note}
          </div>
        )}

        {changesOpen && (
          <div className="mt-3">
            <TextArea autoFocus rows={2} value={changesNote} onChange={(e) => setChangesNote(e.target.value)} placeholder={t('changesPh')} aria-label={t('requestChanges')} />
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="ghost" size="xs" shape="rounded" onClick={() => setChangesOpen(false)}>
                {t('cancel')}
              </Button>
              <Button size="xs" shape="rounded" variant="dark" icon={<MessageSquareWarning className="h-3.5 w-3.5" />} onClick={recordChanges}>
                {t('recordChanges')}
              </Button>
            </div>
          </div>
        )}

        {proofEditable && !changesOpen && (
          <div className="mt-3 flex flex-wrap gap-2">
            {proof.status === 'awaiting_files' && (
              <>
                {art.missing > 0 &&
                  (mailto ? (
                    <a href={mailto} onClick={remind} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/15 bg-white px-3 text-xs font-semibold text-ink transition-colors hover:border-ink/35">
                      <Mail className="h-3.5 w-3.5" /> {t('remind')}
                    </a>
                  ) : (
                    <Button variant="outline" size="xs" shape="rounded" icon={<Mail className="h-3.5 w-3.5" />} onClick={remind}>
                      {t('remind')}
                    </Button>
                  ))}
                <Tip tip={art.missing > 0 && t('startCheckTip')}>
                  <Button size="xs" shape="rounded" variant="dark" icon={<ScanSearch className="h-3.5 w-3.5" />} onClick={startCheck} disabled={art.missing > 0}>
                    {t('startCheck')}
                  </Button>
                </Tip>
              </>
            )}
            {(proof.status === 'checking' || proof.status === 'changes') && (
              <Button size="xs" shape="rounded" variant="dark" icon={<Send className="h-3.5 w-3.5" />} onClick={sendProof}>
                {t('sendProof', { v: proof.version + 1 })}
              </Button>
            )}
            {proof.status === 'sent' && (
              <>
                <Button size="xs" shape="rounded" variant="dark" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={approve}>
                  {t('approve')}
                </Button>
                <Button variant="outline" size="xs" shape="rounded" icon={<MessageSquareWarning className="h-3.5 w-3.5" />} onClick={() => setChangesOpen(true)}>
                  {t('requestChanges')}
                </Button>
              </>
            )}
          </div>
        )}

        {activity.length > 0 && (
          <div className="mt-4 border-t border-line/70 pt-3">
            <Eyebrow>{t('activity')}</Eyebrow>
            <ul className="mt-2 space-y-1.5">
              {activity.map((e, k) => (
                <li key={`${e.at}-${k}`} className="flex gap-2 text-[12.5px]">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink/40" />
                  <span className="min-w-0 flex-1 text-ink-soft">{e.note!.slice(PREPRESS_NOTE.length)}</span>
                  <span className="shrink-0 tabular-nums text-muted">{date(e.at, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* One line's print file                                               */
/* ------------------------------------------------------------------ */
type Dict = ReturnType<typeof useDict<(typeof T)['sq']>>;

function ArtworkRow({
  name, qty, art, editable, onReceived, onFile, onNote, t, lang,
}: {
  name: string;
  qty: string;
  art: ArtworkRef;
  editable: boolean;
  onReceived: () => void;
  onFile: (f: File) => void;
  onNote: (note: string) => void;
  t: Dict;
  lang: Lang;
}) {
  const input = useRef<HTMLInputElement>(null);
  const prepressNote = prepressNoteOf(art);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(prepressNote);
  const ext = fileExt(art.name);

  let sub: ReactNode;
  if (art.status === 'design') sub = t('designNote');
  else if (art.status === 'later') sub = <span className="text-[#7A5B00]">{t('noFile')}</span>;
  else if (art.name)
    sub = (
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <span className="truncate font-medium text-ink">{art.name}</span>
        {art.size ? <span className="shrink-0 tabular-nums">· {fileSize(art.size, lang)}</span> : null}
      </span>
    );
  else sub = t('receivedOutside');

  return (
    <li className="flex gap-3 px-4 py-3 sm:px-5">
      {/* preview */}
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F3F3F3] ring-1 ring-line">
        {art.thumb ? (
          <img src={art.thumb} alt={t('preview', { name: art.name ?? name })} className="h-full w-full object-cover" />
        ) : art.status === 'uploaded' ? (
          <span className="flex flex-col items-center text-ink-soft">
            <FileText className="h-4.5 w-4.5" />
            {ext && <span className="mt-0.5 font-mono text-[9px] font-semibold leading-none">{ext}</span>}
          </span>
        ) : art.status === 'design' ? (
          <PenLine className="h-4.5 w-4.5 text-ink-soft" />
        ) : (
          <Inbox className="h-4.5 w-4.5 text-[#7A5B00]" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold text-ink">
              {name} <span className="font-normal text-muted">· {qty}</span>
            </p>
            <p className="mt-0.5 flex min-w-0 text-[12.5px] text-muted">{sub}</p>
          </div>
          <ArtworkBadge status={art.status} className="self-start" />
        </div>
        {art.note && <p className="mt-1 text-[12.5px] italic text-ink-soft">{t('customerNote', { note: art.note })}</p>}
        {prepressNote && !noteOpen && <p className="mt-1 text-[12.5px] text-ink-soft">{t('prepressNote', { note: prepressNote })}</p>}

        {noteOpen && (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onNote(note.trim());
                  setNoteOpen(false);
                }
              }}
              placeholder={t('notePh')}
              aria-label={t('note')}
              className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-white px-2.5 text-[13px] outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
            />
            <span className="flex gap-1.5">
              <button type="button" aria-label={t('cancel')} onClick={() => setNoteOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink">
                <X className="h-4 w-4" />
              </button>
              <Button
                size="xs"
                shape="rounded"
                variant="dark"
                onClick={() => {
                  onNote(note.trim());
                  setNoteOpen(false);
                }}
              >
                {t('saveNote')}
              </Button>
            </span>
          </div>
        )}

        {editable && !noteOpen && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {art.status === 'later' && (
              <RowButton icon={<Check className="h-3.5 w-3.5" />} onClick={onReceived}>
                {t('markReceived')}
              </RowButton>
            )}
            <RowButton icon={<Paperclip className="h-3.5 w-3.5" />} onClick={() => input.current?.click()}>
              {art.status === 'uploaded' ? t('replace') : t('attach')}
            </RowButton>
            <RowButton icon={<PenLine className="h-3.5 w-3.5" />} onClick={() => setNoteOpen(true)}>
              {t('note')}
            </RowButton>
            <input
              ref={input}
              type="file"
              className="hidden"
              accept=".pdf,.ai,.eps,.svg,.tif,.tiff,.jpg,.jpeg,.png,.webp,.zip,application/pdf,image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = '';
              }}
            />
          </div>
        )}
      </div>
    </li>
  );
}

function RowButton({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-ink/12 bg-white px-2.5 text-[12.5px] font-semibold text-ink-soft transition-colors hover:border-ink/30 hover:text-ink">
      {icon}
      {children}
    </button>
  );
}
