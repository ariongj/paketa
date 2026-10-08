import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { ArrowRight, ArrowUpRight, ChevronDown, FileText, Heart, Mail, Menu, Phone, Search, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import { LangSwitcher } from '@/components/LangSwitcher';
import { ButtonLink } from '@/components/ui/Button';
import { Img } from '@/components/ui/misc';
import { Drawer } from '@/components/ui/Overlay';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useUi } from '@/store/ui';
import { useDb } from '@/store/db';
import { useActiveProducts, useCategories, usePlacements, useSettings } from '@/store/hooks';
import { isPromo, type NavNode } from '@/admin/components/menus/links';
import { useNavMenu } from '@/admin/components/menus/useNav';
import { money } from '@/lib/format';
import type { L10n } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CmykDots, RegMark } from '@/site/sections/motifs';

const D = defineDict({
  sq: {
    shopAll: 'Të gjitha produktet',
    shopAllText: '{n} produkte në gjashtë kategori, me çmime sipas sasisë.',
    customTitle: 'Paketim me porosi?',
    customText: 'Përmasa, material dhe finishim sipas produktit tuaj — ofertë brenda 24 orësh.',
    sampleTitle: 'Paketa e mostrave',
    sampleText: 'Prekni materialet dhe finishimet para porosisë — {price}, e zbritur nga porosia e parë.',
    sampleCta: 'Porosit mostrat',
    quoteCta: 'Kërko ofertë',
    artwork: 'Udhëzuesi i skedarëve',
    count: '{n} produkte',
    open: 'Hap menynë',
  },
  en: {
    shopAll: 'All products',
    shopAllText: '{n} products in six categories, priced by quantity.',
    customTitle: 'Custom packaging?',
    customText: 'Size, material and finish built around your product — quote within 24 hours.',
    sampleTitle: 'Sample kit',
    sampleText: 'Feel the materials and finishes before you order — {price}, credited on your first order.',
    sampleCta: 'Order samples',
    quoteCta: 'Get a quote',
    artwork: 'Artwork guide',
    count: '{n} products',
    open: 'Open menu',
  },
});

const SAMPLE_KIT = 'p-mostra';

/* ------------------------------------------------------------------ */
/* Main menu (CMS → Menus "main"), with the built-in links as fallback  */
/* ------------------------------------------------------------------ */
/** A header link, already in the shopper's language. */
interface NavItem {
  id: string;
  label: string;
  /** Router path or absolute URL; '' = heading without a link */
  to: string;
  external: boolean;
  type: NavNode['type'];
  image?: string;
  sub?: string;
  children: NavItem[];
}

const toItem = (n: NavNode, l: (v: L10n) => string): NavItem => ({
  id: n.id,
  label: l(n.label),
  to: n.to,
  external: n.external,
  type: n.type,
  image: n.entity?.image,
  sub: n.entity?.subtitle ? l(n.entity.subtitle) || undefined : undefined,
  children: n.children.map((c) => toItem(c, l)),
});

const pathOf = (to: string) => to.split(/[?#]/)[0];
const isShopChild = (c: NavItem) => c.type === 'category' || c.type === 'collection' || c.type === 'product';
/** The "Products" entry: links to the catalogue or holds catalogue links. It always opens the mega menu. */
const isShop = (n: NavItem) => !n.external && (pathOf(n.to) === '/produktet' || n.children.some(isShopChild));

/** Header main menu: the CMS menu when it has visible links, otherwise the built-in PrintWorks navigation. */
function useMainNav(): NavItem[] {
  const nodes = useNavMenu('main');
  const l = useL();
  const t = useDict(site);
  return useMemo(() => {
    if (nodes.length) return nodes.map((n) => toItem(n, l));
    const link = (id: string, to: string, label: string): NavItem => ({ id, label, to, external: false, type: 'url', children: [] });
    return [
      link('nav-products', '/produktet', t('nav_products')),
      link('nav-industries', '/industrite', t('nav_industries')),
      link('nav-technology', '/teknologjia', t('nav_services')),
      link('nav-projects', '/projektet', t('nav_projects')),
      link('nav-about', '/rreth-nesh', t('nav_about')),
      link('nav-blog', '/blog', t('nav_blog')),
      link('nav-contact', '/kontakt', t('nav_contact')),
    ];
  }, [nodes, l, t]);
}

/** Category tiles for the mega menu: the menu's own catalogue links, or every category when it has none. */
function useShopTiles(item: NavItem | undefined): NavItem[] {
  const cats = useCategories();
  const l = useL();
  return useMemo(() => {
    const own = item?.children.filter((c) => isShopChild(c) && c.image) ?? [];
    if (own.length) return own;
    return cats.map((c) => ({ id: c.id, label: l(c.name), to: `/produktet/${c.slug}`, external: false, type: 'category' as const, image: c.image, sub: l(c.tagline), children: [] }));
  }, [item, cats, l]);
}

/** Highlight a top-level entry while the shopper is inside its section. */
function inSection(n: NavItem, pathname: string) {
  if (isShop(n) && (pathname.startsWith('/produkt') || pathname.startsWith('/koleksioni'))) return true;
  return [n, ...n.children].some((x) => {
    const p = pathOf(x.to);
    return !x.external && p.length > 1 && (pathname === p || pathname.startsWith(`${p}/`));
  });
}

/** Router link, external link or plain block (heading without a target). */
function NavTarget({ item, className, onClick, children }: { item: NavItem; className?: string; onClick?: () => void; children: ReactNode }) {
  if (!item.to) return <div className={className}>{children}</div>;
  if (item.external)
    return (
      <a href={item.to} target="_blank" rel="noreferrer" onClick={onClick} className={className}>
        {children}
      </a>
    );
  return (
    <Link to={item.to} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Announcement bar — live "bar" placements, settings as fallback       */
/* ------------------------------------------------------------------ */
function AnnouncementBar() {
  const settings = useSettings();
  const bar = usePlacements('bar');
  const l = useL();
  const [i, setI] = useState(0);
  const items = useMemo(() => {
    const live = bar.filter((p) => p.title.sq.trim()).map((p) => ({ id: p.id, text: p.title, href: p.cta?.href?.trim() ?? '' }));
    return live.length ? live : settings.announcements.filter((a) => a.sq.trim()).map((text, n) => ({ id: `a${n}`, text, href: '' }));
  }, [bar, settings.announcements]);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);
  if (!items.length) return null;
  const cur = items[i % items.length];
  const textCls = 'truncate';
  return (
    <div className="relative z-50 bg-[#09080a] text-white">
      <div className="container-x flex h-9 items-center justify-between gap-4 text-[12.5px]">
        <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="mono hidden shrink-0 items-center gap-1.5 text-[11.5px] text-white/60 transition-colors hover:text-white md:flex">
          <Phone className="h-3.5 w-3.5" /> {settings.phone}
        </a>
        <div className="relative h-full min-w-0 flex-1 overflow-hidden text-center md:max-w-[62%]">
          <AnimatePresence mode="wait">
            <motion.p
              key={cur.id}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex items-center justify-center gap-2 font-medium text-white/90"
            >
              <CmykDots className="shrink-0 max-sm:hidden" />
              {!cur.href ? (
                <span className={textCls}>{l(cur.text)}</span>
              ) : /^(?:https?:|mailto:|tel:)/i.test(cur.href) ? (
                <a href={cur.href} target="_blank" rel="noreferrer" className={cn(textCls, 'decoration-white/40 underline-offset-4 hover:underline')}>
                  {l(cur.text)}
                </a>
              ) : (
                <Link to={cur.href} className={cn(textCls, 'decoration-white/40 underline-offset-4 hover:underline')}>
                  {l(cur.text)}
                </Link>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
        <a href={`mailto:${settings.email}`} className="mono hidden shrink-0 items-center gap-1.5 text-[11.5px] text-white/60 transition-colors hover:text-white md:flex">
          <Mail className="h-3.5 w-3.5" /> {settings.email}
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mega menu (products) and simple dropdowns                           */
/* ------------------------------------------------------------------ */
const panelMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

function ShopMenu({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const d = useDict(D);
  const tiles = useShopTiles(item);
  const products = useActiveProducts();
  const sample = useDb((s) => s.products.find((p) => p.id === SAMPLE_KIT && p.status === 'active'));
  const lang = useLang();
  const cats = useCategories();
  const extras = item.children.filter((c) => !isShopChild(c));
  /** Products in the category a tile links to (0 for collections / products). */
  const count = (to: string) => {
    const cat = cats.find((c) => `/produktet/${c.slug}` === pathOf(to));
    return cat ? products.filter((p) => p.categoryId === cat.id).length : 0;
  };
  return (
    <motion.div {...panelMotion} className="absolute inset-x-0 top-full border-t border-line bg-white text-ink shadow-[0_40px_80px_-40px_rgba(18,16,20,0.45)]">
      <div className="container-x grid grid-cols-12 gap-8 py-8">
        <div className="col-span-9">
          <div className="grid grid-cols-3 gap-2">
            {tiles.map((c, i) => {
              const n = count(c.to);
              return (
                <NavTarget key={c.id} item={c} onClick={onClose} className="group flex items-center gap-4 rounded-2xl p-2.5 transition-colors hover:bg-paper">
                  <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-sand ring-1 ring-line">
                    {c.image && <Img src={c.image} small alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                  </div>
                  <div className="min-w-0">
                    <div className="mono text-[10px] uppercase tracking-[0.16em] text-muted">{String(i + 1).padStart(2, '0')}</div>
                    <div className="mt-0.5 font-semibold leading-snug text-ink group-hover:text-brand-700">{c.label}</div>
                    {c.sub && <div className="mt-0.5 line-clamp-1 text-[12.5px] leading-snug text-muted">{c.sub}</div>}
                    {n > 0 && <div className="mono mt-1 text-[10.5px] text-ink-soft">{d('count', { n })}</div>}
                  </div>
                </NavTarget>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 text-[13.5px]">
            <Link to="/produktet" onClick={onClose} className="group inline-flex items-center gap-2 font-semibold text-ink">
              {d('shopAll')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="text-muted">{d('shopAllText', { n: products.length })}</span>
            <span className="ml-auto flex items-center gap-5">
              {extras.map((c) => (
                <NavTarget key={c.id} item={c} onClick={onClose} className={cn('font-semibold', isPromo(c) ? 'text-brand-700' : 'text-ink-soft hover:text-ink')}>
                  {c.label}
                </NavTarget>
              ))}
              <Link to="/faqe/si-te-pergatisni-skedaret" onClick={onClose} className="inline-flex items-center gap-1.5 font-semibold text-ink-soft hover:text-ink">
                <FileText className="h-4 w-4" /> {d('artwork')}
              </Link>
            </span>
          </div>
        </div>
        <div className="col-span-3 flex flex-col gap-2">
          {sample ? (
            <Link to={`/produkt/${sample.slug}`} onClick={onClose} className="group relative flex min-h-[200px] flex-1 flex-col justify-end overflow-hidden rounded-2xl bg-ink p-5 text-white">
              <Img src={sample.images[0]} small alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/10" />
              <div className="relative">
                <div className="mono flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-brand-200">
                  <RegMark className="h-3.5 w-3.5" /> {d('sampleTitle')}
                </div>
                <p className="mt-2 text-[13.5px] leading-snug text-white/85">{d('sampleText', { price: money(sample.salePrice ?? sample.price, lang) })}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold">
                  {d('sampleCta')} <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ) : (
            <Link to="/kerko-oferte" onClick={onClose} className="group flex min-h-[200px] flex-1 flex-col justify-end rounded-2xl bg-ink p-5 text-white">
              <RegMark className="h-5 w-5 text-brand-300" />
              <div className="mt-auto text-[17px] font-semibold">{d('customTitle')}</div>
              <p className="mt-1 text-[13.5px] leading-snug text-white/70">{d('customText')}</p>
            </Link>
          )}
          <Link to="/kerko-oferte" onClick={onClose} className="flex items-center justify-between rounded-xl bg-paper px-4 py-3 text-[13.5px] font-semibold text-ink ring-1 ring-line transition hover:ring-ink/20">
            {d('customTitle')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function LinksMenu({ item, onClose }: { item: NavItem; onClose: () => void }) {
  return (
    <motion.div {...panelMotion} className="absolute inset-x-0 top-full border-t border-line bg-white text-ink shadow-[0_40px_80px_-40px_rgba(18,16,20,0.45)]">
      <div className="container-x grid grid-cols-4 gap-2 py-6">
        {item.children.map((c) => (
          <NavTarget key={c.id} item={c} onClick={onClose} className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-paper">
            {c.image ? (
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                <Img src={c.image} small alt="" className="h-full w-full object-cover" />
              </span>
            ) : (
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted group-hover:text-brand-700" />
            )}
            <span className="min-w-0">
              <span className={cn('block font-semibold', isPromo(c) ? 'text-brand-700' : 'text-ink')}>{c.label}</span>
              {c.sub && <span className="block truncate text-[12.5px] text-muted">{c.sub}</span>}
            </span>
          </NavTarget>
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */
export function Header({ transparentTop = false }: { transparentTop?: boolean }) {
  const t = useDict(site);
  const d = useDict(D);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const cartCount = useUi((s) => s.cart.length);
  const wishCount = useUi((s) => s.wishlist.length);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useMainNav();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setOpen(null);
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const openItem = open ? nav.find((n) => n.id === open && (isShop(n) || n.children.length)) : undefined;
  const solid = !transparentTop || scrolled || !!openItem;
  const tone = solid ? 'dark' : 'light';

  const linkCls = (active: boolean) =>
    cn(
      'relative inline-flex h-10 items-center gap-1 rounded-full px-3 text-[14px] font-semibold transition-colors xl:px-3.5',
      solid ? (active ? 'text-ink' : 'text-ink-soft hover:text-ink') : active ? 'text-white' : 'text-white/75 hover:text-white',
    );
  const activeBar = (active: boolean) => (
    <span aria-hidden className={cn('absolute inset-x-3 -bottom-[15px] h-[2px] rounded-full bg-brand-600 transition-opacity xl:inset-x-3.5', active ? 'opacity-100' : 'opacity-0')} />
  );
  const iconBtn = cn('relative grid h-10 w-10 place-items-center rounded-full transition-colors', solid ? 'text-ink hover:bg-ink/[0.06]' : 'text-white hover:bg-white/10');
  const badge = 'absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white';

  return (
    <>
      <AnnouncementBar />
      <header
        className={cn(
          'sticky top-0 z-40 transition-[background,box-shadow,border-color,color] duration-300',
          solid ? 'border-b border-line bg-white/95 shadow-[0_1px_0_rgb(18_16_20/0.02)] backdrop-blur-xl' : 'border-b border-white/10 bg-transparent',
          transparentTop && '-mb-[72px]',
        )}
        onMouseLeave={() => setOpen(null)}
      >
        <div className="container-x flex h-[72px] items-center gap-2">
          <button className={cn(iconBtn, '-ml-2 lg:hidden')} onClick={() => setMobileOpen(true)} aria-label={d('open')}>
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="shrink-0" aria-label="PrintWorks">
            <Logo tone={tone} className="h-7 xl:h-[30px]" />
          </Link>

          <nav className="ml-4 hidden items-center lg:flex xl:ml-8">
            {nav.map((n) => {
              const active = inSection(n, location.pathname);
              const dropdown = isShop(n) || n.children.length > 0;
              if (dropdown)
                return (
                  <button
                    key={n.id}
                    type="button"
                    onMouseEnter={() => setOpen(n.id)}
                    onClick={() => setOpen((m) => (m === n.id ? null : n.id))}
                    className={linkCls(active || open === n.id)}
                    aria-expanded={open === n.id}
                    aria-haspopup="true"
                  >
                    {n.label}
                    <ChevronDown className={cn('h-3.5 w-3.5 opacity-60 transition-transform', open === n.id && 'rotate-180')} />
                    {activeBar(active)}
                  </button>
                );
              if (n.external)
                return (
                  <a key={n.id} href={n.to} target="_blank" rel="noreferrer" onMouseEnter={() => setOpen(null)} className={linkCls(false)}>
                    {n.label}
                  </a>
                );
              if (!n.to) return null;
              return (
                <NavLink key={n.id} to={n.to} onMouseEnter={() => setOpen(null)} className={({ isActive }) => linkCls(isActive || active)}>
                  {({ isActive }) => (
                    <>
                      {n.label}
                      {activeBar(isActive || active)}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <button className={iconBtn} onClick={() => setSearchOpen(true)} aria-label={t('searchPlaceholder')}>
              <Search className="h-[19px] w-[19px]" />
            </button>
            <Link to="/te-preferuarat" className={cn(iconBtn, 'max-sm:hidden')} aria-label={t('wishlist')}>
              <Heart className="h-[19px] w-[19px]" />
              {wishCount > 0 && <span className={badge}>{wishCount}</span>}
            </Link>
            <button className={iconBtn} onClick={() => setCartOpen(true)} aria-label={t('cart')}>
              <ShoppingBag className="h-[19px] w-[19px]" />
              {cartCount > 0 && (
                <span key={cartCount} className={cn(badge, 'animate-pop')}>
                  {cartCount}
                </span>
              )}
            </button>
            <div className="hidden xl:block">
              <LangSwitcher tone={solid ? 'dark' : 'light'} compact />
            </div>
            <ButtonLink to="/kerko-oferte" size="sm" className="ml-2 h-10 px-5 max-sm:hidden" iconRight={<ArrowRight className="h-4 w-4" />}>
              {t('requestQuote')}
            </ButtonLink>
          </div>
        </div>
        <AnimatePresence>
          {openItem &&
            (isShop(openItem) ? (
              <ShopMenu key={openItem.id} item={openItem} onClose={() => setOpen(null)} />
            ) : (
              <LinksMenu key={openItem.id} item={openItem} onClose={() => setOpen(null)} />
            ))}
        </AnimatePresence>
      </header>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} nav={nav} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile drawer                                                       */
/* ------------------------------------------------------------------ */
function MobileMenu({ open, onClose, nav }: { open: boolean; onClose: () => void; nav: NavItem[] }) {
  const t = useDict(site);
  const d = useDict(D);
  const settings = useSettings();
  const location = useLocation();
  const shop = nav.find(isShop);
  const tiles = useShopTiles(shop);
  const rows = nav.filter((n) => n !== shop);
  const rowCls = (active: boolean) => cn('flex items-center justify-between border-b border-line py-3.5 text-[17px] font-semibold', active ? 'text-brand-700' : 'text-ink');
  return (
    <Drawer open={open} onClose={onClose} side="left" title={<Logo className="h-7" />} width="max-w-[400px]">
      <div className="px-5 pb-8 pt-5">
        <div className="mono mb-3 flex items-center justify-between text-[10.5px] uppercase tracking-[0.18em] text-muted">
          <span>{t('categories')}</span>
          <Link to="/produktet" onClick={onClose} className="inline-flex items-center gap-1 text-ink">
            {d('shopAll')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {tiles.map((c) => (
            <NavTarget key={c.id} item={c} onClick={onClose} className="group relative flex h-[104px] flex-col justify-end overflow-hidden rounded-xl bg-ink">
              {c.image && <Img src={c.image} small alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
              <span className="relative line-clamp-2 px-3 pb-2.5 text-[13.5px] font-semibold leading-tight text-white">{c.label}</span>
            </NavTarget>
          ))}
        </div>

        <nav className="mt-6 flex flex-col border-t border-line">
          {rows.map((n) => (
            <div key={n.id} className="flex flex-col">
              {!n.to ? (
                <span className={rowCls(false)}>{n.label}</span>
              ) : n.external ? (
                <a href={n.to} target="_blank" rel="noreferrer" onClick={onClose} className={rowCls(false)}>
                  {n.label} <ArrowUpRight className="h-4 w-4 text-muted" />
                </a>
              ) : (
                <Link to={n.to} onClick={onClose} className={rowCls(inSection(n, location.pathname))}>
                  {n.label} <ArrowRight className="h-4 w-4 text-ink/25" />
                </Link>
              )}
              {n.children.map((c) => (
                <NavTarget key={c.id} item={c} onClick={onClose} className={cn('border-b border-line py-3 pl-4 text-[15px]', isPromo(c) ? 'font-semibold text-brand-700' : 'font-medium text-ink-soft')}>
                  {c.label}
                </NavTarget>
              ))}
            </div>
          ))}
        </nav>

        <ButtonLink to="/kerko-oferte" onClick={onClose} className="mt-7 w-full" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
          {t('requestQuote')}
        </ButtonLink>

        <div className="mt-7 space-y-3 rounded-2xl bg-paper p-4 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <span className="mono text-[10.5px] uppercase tracking-[0.18em] text-muted">{t('language')}</span>
            <LangSwitcher align="right" compact />
          </div>
          <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="flex items-center gap-2.5 text-[14.5px] font-semibold text-ink">
            <Phone className="h-4 w-4 text-brand-600" /> <span className="mono">{settings.phone}</span>
          </a>
          <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 text-[14.5px] font-semibold text-ink">
            <Mail className="h-4 w-4 text-brand-600" /> {settings.email}
          </a>
        </div>
      </div>
    </Drawer>
  );
}
