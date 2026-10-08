import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUp, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/brand/Logo';
import { InstagramIcon, FacebookIcon, WhatsAppIcon } from '@/components/brand/Social';
import { defineDict, useDict, useL } from '@/i18n';
import { site } from '@/i18n/site';
import { useCategories, useSettings } from '@/store/hooks';
import { useDb } from '@/store/db';
import { isPromo, type NavNode } from '@/admin/components/menus/links';
import { useNavMenu } from '@/admin/components/menus/useNav';
import { cn } from '@/lib/utils';
import { ColorBar, ChevronTexture, RegMark } from '@/site/sections/motifs';

const F = defineDict({
  sq: {
    newsEyebrow: 'Buletini',
    payments: 'Pagesat',
    pay_bank: 'Transfertë bankare',
    pay_cod: 'Para në dorëzim',
    vatNote: 'Çmimet pa TVSH · TVSH 18% në faturë',
    quote: 'Kërko ofertë',
    artwork: 'Udhëzuesi i skedarëve',
    slogan: 'Innovative Printing. Exceptional Packaging.',
    invalidEmail: 'Shkruani një e-mail të vlefshëm',
  },
  en: {
    newsEyebrow: 'Newsletter',
    payments: 'Payments',
    pay_bank: 'Bank transfer',
    pay_cod: 'Cash on delivery',
    vatNote: 'Prices excl. VAT · 18% VAT on the invoice',
    quote: 'Get a quote',
    artwork: 'Artwork guide',
    slogan: 'Innovative Printing. Exceptional Packaging.',
    invalidEmail: 'Enter a valid e-mail',
  },
});

const headCls = 'mono mb-5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/40';
const linkCls = 'link-u text-white/75 transition-colors hover:text-white';

export function Footer() {
  const t = useDict(site);
  const f = useDict(F);
  const l = useL();
  const settings = useSettings();
  const menu = useNavMenu('footer');
  const [email, setEmail] = useState('');
  const year = new Date().getFullYear();
  const social = 'grid h-10 w-10 place-items-center rounded-full bg-white/[0.07] text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white hover:text-ink';
  const payments = [settings.payments.bank && f('pay_bank'), settings.payments.card && 'Visa', settings.payments.card && 'Mastercard', settings.payments.cod && f('pay_cod')].filter(Boolean) as string[];

  return (
    <footer className="relative isolate mt-24 overflow-hidden bg-ink text-white">
      <ColorBar className="h-1" />
      <ChevronTexture id="pw-footer-chev" />
      <div className="container-x relative">
        {/* Newsletter */}
        <div className="grid gap-8 border-b border-white/10 py-14 lg:grid-cols-2 lg:items-end">
          <div>
            <div className="mono flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-brand-300">
              <RegMark className="h-4 w-4" /> {f('newsEyebrow')}
            </div>
            <h2 className="display mt-4 max-w-lg text-[30px] leading-[1.08] text-white sm:text-[38px]">{t('newsTitle')}</h2>
            <p className="mt-3 max-w-md text-[15px] text-white/55">{t('newsText')}</p>
          </div>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\S+@\S+\.\S+$/.test(email)) {
                toast.error(f('invalidEmail'));
                return;
              }
              toast.success(t('subscribed'));
              setEmail('');
            }}
            className="flex w-full max-w-lg gap-2 rounded-full bg-white/[0.06] p-1.5 ring-1 ring-white/10 transition focus-within:ring-white/30 lg:justify-self-end"
          >
            <label htmlFor="pw-news" className="sr-only">
              {t('newsPlaceholder')}
            </label>
            <input
              id="pw-news"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('newsPlaceholder')}
              className="min-w-0 flex-1 bg-transparent px-4 text-[15px] text-white outline-none placeholder:text-white/35"
            />
            <button type="submit" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-brand-50">
              {t('subscribe')} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Columns */}
        <div className="grid gap-x-8 gap-y-12 py-14 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4">
            <Logo tone="light" className="h-8" />
            <p className="mt-6 max-w-sm text-[14.5px] leading-relaxed text-white/60">{t('footerAbout')}</p>
            <p className="mono mt-5 text-[10.5px] uppercase tracking-[0.16em] text-white/35">{f('slogan')}</p>
            <div className="mt-6 flex gap-2">
              {settings.instagram && (
                <a href={`https://www.instagram.com/${settings.instagram}/`} target="_blank" rel="noreferrer" className={social} aria-label="Instagram">
                  <InstagramIcon className="h-[18px] w-[18px]" />
                </a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" className={social} aria-label="Facebook">
                  <FacebookIcon className="h-[18px] w-[18px]" />
                </a>
              )}
              {settings.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className={social} aria-label="WhatsApp">
                  <WhatsAppIcon className="h-[18px] w-[18px]" />
                </a>
              )}
            </div>
          </div>

          {menu.length ? <MenuColumns nodes={menu} /> : <DefaultColumns />}

          <div className="lg:col-span-2">
            <h3 className={headCls}>{t('footer_contact')}</h3>
            <ul className="space-y-4 text-[14px] text-white/75">
              <li>
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="flex gap-3 hover:text-white">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                  <span className="mono text-[13px]">{settings.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className="flex gap-3 break-all hover:text-white">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                  {settings.email}
                </a>
              </li>
              <li>
                <a href={settings.mapUrl} target="_blank" rel="noreferrer" className="flex gap-3 hover:text-white">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                  <span>
                    {settings.address}
                    <br />
                    {settings.city}
                  </span>
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                <span>{l(settings.hours)}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payments */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono mr-2 text-[10.5px] uppercase tracking-[0.18em] text-white/40">{f('payments')}</span>
            {payments.map((p) => (
              <span key={p} className="rounded-md border border-white/15 px-2.5 py-1 text-[11.5px] font-semibold tracking-wide text-white/70">
                {p}
              </span>
            ))}
          </div>
          <span className="mono text-[11px] text-white/40">{f('vatNote')}</span>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-[12.5px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {settings.legalName} · {t('rights')}
          </span>
          <span className="flex items-center gap-5">
            <Link to="/admin" className="hover:text-white">
              {t('adminLink')}
            </Link>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex items-center gap-1.5 hover:text-white">
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

/** Top-level items with sub-links become columns (heading + links); loose top-level links share one column. */
function MenuColumns({ nodes }: { nodes: NavNode[] }) {
  const l = useL();
  const groups = useMemo(() => {
    const out: FooterGroup[] = nodes.filter((n) => n.children.length).map((n) => ({ id: n.id, heading: l(n.label), to: n.to, external: n.external, links: n.children }));
    const loose = nodes.filter((n) => !n.children.length);
    if (loose.length) out.push({ id: 'loose', heading: '', to: '', external: false, links: loose });
    return out.slice(0, 3);
  }, [nodes, l]);
  return (
    <>
      {groups.map((g) => (
        <div key={g.id} className="lg:col-span-2">
          {g.heading && (
            <h3 className={headCls}>
              {g.to ? (
                <FooterLink node={g} className="transition-colors hover:text-white/80">
                  {g.heading}
                </FooterLink>
              ) : (
                g.heading
              )}
            </h3>
          )}
          <ul className={cn('space-y-3 text-[14px]', !g.heading && 'lg:pt-[34px]')}>
            {g.links.map((n) => (
              <li key={n.id}>
                <FooterLink node={n} className={isPromo(n) ? 'link-u font-semibold text-brand-200 hover:text-white' : linkCls}>
                  {l(n.label)}
                </FooterLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {Array.from({ length: Math.max(0, 3 - groups.length) }, (_, i) => (
        <div key={`pad-${i}`} className="hidden lg:col-span-2 lg:block" />
      ))}
    </>
  );
}

/** Built-in columns, shown while the footer menu has no visible links. */
function DefaultColumns() {
  const t = useDict(site);
  const f = useDict(F);
  const l = useL();
  const cats = useCategories();
  const allPages = useDb((s) => s.pages);
  const pages = useMemo(() => allPages.filter((p) => p.published && p.showInFooter), [allPages]);
  const company: [string, string][] = [
    ['/rreth-nesh', t('nav_about')],
    ['/industrite', t('nav_industries')],
    ['/teknologjia', t('nav_services')],
    ['/projektet', t('nav_projects')],
    ['/blog', t('nav_blog')],
    ['/kontakt', t('nav_contact')],
    ['/kerko-oferte', f('quote')],
  ];
  return (
    <>
      <div className="lg:col-span-2">
        <h3 className={headCls}>{t('footer_shop')}</h3>
        <ul className="space-y-3 text-[14px]">
          {cats.map((c) => (
            <li key={c.id}>
              <Link to={`/produktet/${c.slug}`} className={linkCls}>
                {l(c.name)}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/produktet" className="link-u font-semibold text-white hover:text-brand-200">
              {t('allProducts')}
            </Link>
          </li>
        </ul>
      </div>

      <div className="lg:col-span-2">
        <h3 className={headCls}>{t('footer_company')}</h3>
        <ul className="space-y-3 text-[14px]">
          {company.map(([to, label]) => (
            <li key={to}>
              <Link to={to} className={linkCls}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-2">
        <h3 className={headCls}>{t('footer_help')}</h3>
        <ul className="space-y-3 text-[14px]">
          {pages.map((p) => (
            <li key={p.id}>
              <Link to={`/faqe/${p.slug}`} className={linkCls}>
                {l(p.title)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
