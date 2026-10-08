// Reply templates for the contacts inbox — PrintWorks tone: short, warm, concrete next step.
// Placeholders: {name} first name · {product} · {quote} quote number · {staff} · {phone}.
import type { Lang } from '@/lib/types';

export type TemplateId = 'ack' | 'files' | 'meeting' | 'followUp';

export const REPLY_TEMPLATES: Record<TemplateId, Record<Lang, string>> = {
  ack: {
    sq: 'Përshëndetje {name},\n\nFaleminderit për kërkesën — oferta vjen brenda 24 orësh. Ekipi ynë po i shqyrton specifikimet{productFor} dhe ju kontakton vetëm nëse na duhet ndonjë detaj shtesë.\n\nMe respekt,\n{staff}\nPrintWorks · {phone}',
    en: 'Hello {name},\n\nThank you for your request — your quote will follow within 24 hours. Our team is reviewing the specification{productFor} and will only get back to you if we need any further details.\n\nKind regards,\n{staff}\nPrintWorks · {phone}',
  },
  files: {
    sq: 'Përshëndetje {name},\n\nPër ofertën e saktë{productFor} na nevojitet skedari i printimit në PDF (me 3 mm bleed dhe shkronjat e konvertuara në vija) ose dieline-i i kutisë. Nëse nuk keni dizajn, ekipi ynë i prepress-it e përgatit për ju — prova digjitale vjen brenda 24 orësh.\n\nMe respekt,\n{staff}\nPrintWorks · {phone}',
    en: 'Hello {name},\n\nTo give you an exact quote{productFor} we need the print file as a PDF (3 mm bleed, fonts outlined) or the box dieline. If you have no artwork yet, our prepress team can design it for you — the digital proof follows within 24 hours.\n\nKind regards,\n{staff}\nPrintWorks · {phone}',
  },
  meeting: {
    sq: 'Përshëndetje {name},\n\nJu ftojmë në fabrikën tonë në Prishtinë për t’i parë nga afër mostrat e kartonit dhe finishimet — stampim me folje, reliev dhe llak UV selektiv. Na tregoni ditën që ju përshtatet; takimi zgjat rreth 45 minuta.\n\nMe respekt,\n{staff}\nPrintWorks · {phone}',
    en: 'Hello {name},\n\nWe would like to invite you to our factory in Prishtina to see board samples and finishes up close — hot-foil stamping, embossing and spot UV. Let us know which day suits you; the meeting takes about 45 minutes.\n\nKind regards,\n{staff}\nPrintWorks · {phone}',
  },
  followUp: {
    sq: 'Përshëndetje {name},\n\nA keni pasur mundësi ta shqyrtoni ofertën{quoteNo}? Pas aprovimit tuaj, prova digjitale dërgohet brenda 24 orësh dhe prodhimi nis menjëherë pas aprovimit të provës.\n\nMe respekt,\n{staff}\nPrintWorks · {phone}',
    en: 'Hello {name},\n\nHave you had a chance to review our quote{quoteNo}? Once you confirm, the digital proof follows within 24 hours and production starts as soon as the proof is approved.\n\nKind regards,\n{staff}\nPrintWorks · {phone}',
  },
};

export function fillTemplate(text: string, v: { name: string; staff?: string; product?: string; quote?: string; phone?: string; lang: Lang }) {
  const first = v.name.trim().split(/\s+/)[0] || v.name;
  const productFor = v.product ? (v.lang === 'sq' ? ` për ${v.product.toLowerCase()}` : ` for ${v.product.toLowerCase()}`) : '';
  return text
    .replace(/\{name\}/g, first)
    .replace(/\{staff\}/g, v.staff || (v.lang === 'sq' ? 'Ekipi i PrintWorks' : 'The PrintWorks team'))
    .replace(/\{productFor\}/g, productFor)
    .replace(/\{quoteNo\}/g, v.quote ? ` ${v.quote}` : '')
    .replace(/\{phone\}/g, v.phone || '+383 49 732 700');
}
