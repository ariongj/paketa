import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUp, Banknote, Clock, CreditCard, Landmark, Mail, MapPin, Phone, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '@/components/brand/Social';
import { useDict, useL } from '@/i18n';
import { site } from '@/i18n/site';
import { useCategories, useSettings } from '@/store/hooks';
import { useDb } from '@/store/db';
import { isPromo, type NavNode } from '@/admin/components/menus/links';
import { useNavMenu } from '@/admin/components/menus/useNav';
import type { CmsPage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { chrome } from './dict';

const headCls = 'mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-lime/80';
const linkCls = 'link-u text-paper/75 transition-colors hover:text-white';
const socialCls = 'grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] text-paper ring-1 ring-white/10 transition-colors hover:bg-lime hover:text-ink';

/** Published CMS pages flagged "show in footer" (terms, privacy, returns…). */
function useFooterPages() {
  const all = useDb((s) => s.pages);
  return useMemo(() => all.filter((p) => p.published && p.showInFooter), [all]);
}

export function Footer() {
  const t = useDict(site);
  const c = useDict(chrome);
  const l = useL();
  const settings = useSettings();
  const menu = useNavMenu('footer');
  const pages = useFooterPages();
  const [email, setEmail] = useState('');
  const year = new Date().getFullYear();
  const tel = settings.phone.replace(/\s/g, '');

  // With a CMS footer menu, policy pages that the menu doesn't link yet still get a spot in the bottom bar.
  const menuPaths = useMemo(() => new Set(menu.flatMap((n) => [n.to, ...n.children.map((x) => x.to)])), [menu]);
  const loosePages = menu.length ? pages.filter((p) => !menuPaths.has(`/faqe/${p.slug}`)) : [];

  const payments = [
    settings.payments.cod && { key: 'cod', icon: Banknote, label: c('pay_cod') },
    settings.payments.bank && { key: 'bank', icon: Landmark, label: c('pay_bank') },
    settings.payments.card && { key: 'card', icon: CreditCard, label: c('pay_card') },
  ].filter(Boolean) as { key: string; icon: typeof Banknote; label: string }[];

  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-700 text-paper">
      <div className="bg-grain pointer-events-none absolute inset-0 opacity-70" />
      <div className="container-x relative">
        {/* Newsletter — a lime "label" with a die-cut line */}
        <div className="pt-14 sm:pt-16">
          <div className="relative grid gap-7 overflow-hidden rounded-[30px] bg-lime p-7 text-ink sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:p-12">
            <div aria-hidden className="pointer-events-none absolute inset-2.5 rounded-[22px] border-2 border-dashed border-ink/15" />
            <div aria-hidden className="pointer-events-none absolute -right-6 -top-7 hidden rotate-[14deg] sm:block">
              <span className="grid h-28 w-28 place-items-center rounded-full bg-pink shadow-[0_14px_30px_-14px_rgba(15,29,22,0.6)]">
                <span className="flex flex-col items-center gap-1 pt-2">
                  <LogoMark className="h-8" />
                  <span className="font-display text-[11px] font-bold leading-none tracking-tight">{c('tagline')}</span>
                </span>
              </span>
            </div>
            <div className="relative">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-ink">{c('newsEyebrow')}</div>
              <h2 className="display mt-3 max-w-lg text-[30px] leading-[1.02] sm:text-[40px]">{t('newsTitle')}</h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink/70">{t('newsText')}</p>
            </div>
            <div className="relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!/^\S+@\S+\.\S+$/.test(email)) return;
                  toast.success(t('subscribed'));
                  setEmail('');
                }}
                className="flex w-full gap-2 rounded-full bg-white p-1.5 shadow-[0_18px_40px_-24px_rgba(15,29,22,0.55)] ring-1 ring-ink/10 focus-within:ring-ink/40"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('newsPlaceholder')}
                  aria-label={t('newsPlaceholder')}
                  className="min-w-0 flex-1 bg-transparent px-4 text-[15px] text-ink outline-none placeholder:text-muted"
                />
                <button type="submit" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-paper transition-colors hover:bg-brand-700">
                  <span className="hidden sm:inline">{t('subscribe')}</span> <ArrowRight className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-3 pl-4 text-[12.5px] font-medium text-ink/55">{c('newsNote')}</p>
            </div>
          </div>
        </div>

        {/* Columns */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4 lg:pr-6">
            <Logo tone="light" className="h-12" />
            <p className="mt-5 max-w-sm text-[14.5px] leading-relaxed text-paper/70">{t('footerAbout')}</p>
            <div className="mt-6 flex gap-2">
              {settings.instagram && (
                <a href={`https://www.instagram.com/${settings.instagram}/`} target="_blank" rel="noreferrer" className={socialCls} aria-label="Instagram">
                  <InstagramIcon className="h-[18px] w-[18px]" />
                </a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" className={socialCls} aria-label="Facebook">
                  <FacebookIcon className="h-[18px] w-[18px]" />
                </a>
              )}
              {settings.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className={socialCls} aria-label="WhatsApp">
                  <WhatsAppIcon className="h-[18px] w-[18px]" />
                </a>
              )}
            </div>
          </div>

          {menu.length ? <MenuColumns nodes={menu} /> : <DefaultColumns pages={pages} />}

          <div className="lg:col-span-4">
            <h3 className={headCls}>{t('footer_contact')}</h3>
            <ul className="space-y-3.5 text-[14.5px] text-paper/80">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                <a href={settings.mapUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                  {settings.address}
                  {settings.city && !settings.address.includes(settings.city) ? `, ${settings.city}` : ''}
                  <span className="mt-0.5 block text-[12.5px] text-paper/50">{c('pickup')}</span>
                </a>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                <a href={`tel:${tel}`} className="transition-colors hover:text-white">
                  {settings.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                <a href={`mailto:${settings.email}`} className="break-all transition-colors hover:text-white">
                  {settings.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                <span>
                  <span className="block text-[12.5px] text-paper/50">{t('hours')}</span>
                  {l(settings.hours)}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payments + delivery */}
        <div className="flex flex-col gap-5 border-t border-white/10 py-6 lg:flex-row lg:items-center lg:justify-between">
          {payments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.18em] text-paper/45">{c('payments')}</span>
              {payments.map((p) => (
                <span key={p.key} className="inline-flex h-8 items-center gap-2 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-semibold text-paper/85 ring-1 ring-white/10">
                  <p.icon className="h-3.5 w-3.5 text-lime" /> {p.label}
                </span>
              ))}
              {settings.payments.card && (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black italic tracking-tight text-[#1a1f71]">
                  VISA
                  <span className="relative ml-1 inline-flex h-3.5 w-6 not-italic" aria-label="Mastercard">
                    <span className="absolute left-0 h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
                    <span className="absolute right-0 h-3.5 w-3.5 rounded-full bg-[#f79e1b] mix-blend-multiply" />
                  </span>
                </span>
              )}
            </div>
          )}
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-paper/80">
            <Truck className="h-4 w-4 text-lime" />
            <span className="text-paper/50">{c('shipping')}:</span> {c('delivery')}
          </div>
        </div>

        {/* Oversized wordmark */}
        <div aria-hidden className="pointer-events-none -mb-[3.2%] select-none pt-2">
          <img src="/images/brand/wordmark-white.png" alt="" draggable={false} className="w-full opacity-[0.07]" />
        </div>
      </div>

      <div className="relative bg-brand-800/70">
        <div className="container-x flex flex-col gap-3 py-5 text-[12.5px] text-paper/55 md:flex-row md:items-center md:justify-between">
          <span>
            © {year} {settings.legalName || settings.companyName}
            {settings.pib ? ` · ${c('nui')} ${settings.pib}` : ''} · {t('rights')}
          </span>
          <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {loosePages.map((p) => (
              <Link key={p.id} to={`/faqe/${p.slug}`} className="transition-colors hover:text-white">
                {l(p.title)}
              </Link>
            ))}
            <Link to="/admin" className="transition-colors hover:text-white">
              {t('adminLink')}
            </Link>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
              {t('backToTop')} <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Link columns from the CMS footer menu (PDF p.36)                     */
/* ------------------------------------------------------------------ */
interface FooterGroup {
  id: string;
  heading: string;
  to: string;
  external: boolean;
  links: NavNode[];
}

/** Router link or external link with the footer styling. */
function FooterLink({ node, className, children }: { node: Pick<NavNode, 'to' | 'external'>; className: string; children: ReactNode }) {
  return node.external ? (
    <a href={node.to} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link to={node.to} className={className}>
      {children}
    </Link>
  );
}

/**
 * Top-level items with sub-links become columns (heading + links); loose top-level links share one column.
 * Columns fill the two middle slots of the grid (1 | 2 stacked for three columns).
 */
function MenuColumns({ nodes }: { nodes: NavNode[] }) {
  const l = useL();
  const groups = useMemo(() => {
    const out: FooterGroup[] = nodes.filter((n) => n.children.length).map((n) => ({ id: n.id, heading: l(n.label), to: n.to, external: n.external, links: n.children }));
    const loose = nodes.filter((n) => !n.children.length);
    if (loose.length) out.push({ id: 'loose', heading: '', to: '', external: false, links: loose });
    return out;
  }, [nodes, l]);
  const split = Math.floor(groups.length / 2);
  const slots = groups.length === 1 ? [groups] : [groups.slice(0, split), groups.slice(split)];
  return (
    <>
      {slots.map((slot, si) => (
        <div key={si} className={groups.length === 1 ? 'lg:col-span-4' : 'lg:col-span-2'}>
          {slot.map((g, gi) => (
            <div key={g.id}>
              {g.heading && (
                <h3 className={cn(headCls, gi > 0 && 'mt-8')}>
                  {g.to ? (
                    <FooterLink node={g} className="transition-colors hover:text-lime">
                      {g.heading}
                    </FooterLink>
                  ) : (
                    g.heading
                  )}
                </h3>
              )}
              <ul className={cn('space-y-2.5 text-[14.5px]', !g.heading && gi > 0 && 'mt-8')}>
                {g.links.map((n) => (
                  <li key={n.id}>
                    <FooterLink node={n} className={isPromo(n) ? 'link-u font-semibold text-pink hover:text-white' : linkCls}>
                      {l(n.label)}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

/** Built-in columns, shown while the footer menu has no visible links. */
function DefaultColumns({ pages }: { pages: CmsPage[] }) {
  const t = useDict(site);
  const c = useDict(chrome);
  const l = useL();
  const cats = useCategories();
  return (
    <>
      <div className="lg:col-span-2">
        <h3 className={headCls}>{t('footer_shop')}</h3>
        <ul className="space-y-2.5 text-[14.5px]">
          {cats.map((cat) => (
            <li key={cat.id} className="flex items-center gap-2">
              <Link to={`/produktet/${cat.slug}`} className={linkCls}>
                {l(cat.name)}
              </Link>
              {cat.soon && <span className="rounded-full border border-dashed border-white/25 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-paper/55">{c('soon')}</span>}
            </li>
          ))}
          <li>
            <Link to="/produktet?akcija=1" className="link-u font-semibold text-pink hover:text-white">
              {t('sale')}
            </Link>
          </li>
        </ul>
      </div>

      <div className="lg:col-span-2">
        <h3 className={headCls}>{t('footer_company')}</h3>
        <ul className="space-y-2.5 text-[14.5px]">
          {[
            ['/sherbimet', t('nav_services')],
            ['/referencat', t('nav_projects')],
            ['/rreth-nesh', t('nav_about')],
            ['/blog', t('nav_blog')],
            ['/kontakti', t('nav_contact')],
          ].map(([to, label]) => (
            <li key={to}>
              <Link to={to} className={linkCls}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
        {pages.length > 0 && (
          <>
            <h3 className={cn(headCls, 'mt-8')}>{t('footer_help')}</h3>
            <ul className="space-y-2.5 text-[14.5px]">
              {pages.map((p) => (
                <li key={p.id}>
                  <Link to={`/faqe/${p.slug}`} className={linkCls}>
                    {l(p.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
