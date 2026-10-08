import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { ArrowRight, ArrowUpRight, ChevronDown, Heart, Menu, PackageOpen, Percent, Phone, Search, ShoppingBag, Truck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import { LangSwitcher } from '@/components/LangSwitcher';
import { Accent, Img } from '@/components/ui/misc';
import { Drawer } from '@/components/ui/Overlay';
import { useDict, useL } from '@/i18n';
import { site } from '@/i18n/site';
import { useUi } from '@/store/ui';
import { useActiveProducts, useCategories, usePlacements, useSettings } from '@/store/hooks';
import { isPromo, type NavNode } from '@/admin/components/menus/links';
import { useNavMenu } from '@/admin/components/menus/useNav';
import { useMeasureHref } from '@/site/components/company/data';
import type { L10n } from '@/lib/types';
import { cn } from '@/lib/utils';
import { chrome } from './dict';

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

/** Image tile in the mega menu / mobile grid (category, collection, product, offer). */
const isTile = (n: NavItem) => !!n.image && n.type !== 'url' && n.type !== 'page' && !isPromo(n);

const pathOf = (to: string) => to.split(/[?#]/)[0];

/** The catalogue entry ("Produktet") — gets the category mega menu even when the CMS item has no sub-links. */
const isShop = (n: NavItem) => n.children.some(isTile) || pathOf(n.to) === '/produktet';

/** Header main menu: the CMS menu when it has visible links, otherwise the built-in navigation. */
function useMainNav(): NavItem[] {
  const nodes = useNavMenu('main');
  const cats = useCategories();
  const l = useL();
  const t = useDict(site);
  return useMemo(() => {
    if (nodes.length) return nodes.map((n) => toItem(n, l));
    const link = (id: string, to: string, label: string): NavItem => ({ id, label, to, external: false, type: 'url', children: [] });
    return [
      {
        ...link('nav-products', '/produktet', t('nav_products')),
        children: [
          ...cats.map((c): NavItem => ({ id: c.id, label: l(c.name), to: `/produktet/${c.slug}`, external: false, type: 'category', image: c.image, sub: l(c.tagline), children: [] })),
          link('nav-sale', '/produktet?akcija=1', t('sale')),
        ],
      },
      link('nav-services', '/sherbimet', t('nav_services')),
      link('nav-projects', '/referencat', t('nav_projects')),
      link('nav-blog', '/blog', t('nav_blog')),
      link('nav-contact', '/kontakti', t('nav_contact')),
    ];
  }, [nodes, cats, l, t]);
}

/* ------------------------------------------------------------------ */
/* Category tiles for the mega menu / mobile menu                       */
/* ------------------------------------------------------------------ */
type TileKind = 'stock' | 'quote' | 'soon';
interface ShopTile extends NavItem {
  kind: TileKind;
  /** Products that can be bought straight away */
  count: number;
}

/**
 * Tiles of the shop menu: its image children, or — when the CMS item has none — every category.
 * Categories are classified as stocked, made-to-order (only quote items) or "coming soon".
 */
function useShopTiles(item: NavItem | undefined): ShopTile[] {
  const cats = useCategories();
  const products = useActiveProducts();
  const l = useL();
  return useMemo(() => {
    if (!item) return [];
    let tiles = item.children.filter(isTile);
    if (!tiles.length && pathOf(item.to) === '/produktet')
      tiles = cats.map((c) => ({ id: c.id, label: l(c.name), to: `/produktet/${c.slug}`, external: false, type: 'category' as const, image: c.image, sub: l(c.tagline), children: [] }));
    return tiles.map((n) => {
      const cat = n.type === 'category' ? cats.find((c) => `/produktet/${c.slug}` === pathOf(n.to)) : undefined;
      const own = cat ? products.filter((p) => p.categoryId === cat.id) : [];
      const count = own.filter((p) => !p.quoteOnly).length;
      const kind: TileKind = cat?.soon ? 'soon' : cat && own.length > 0 && count === 0 ? 'quote' : 'stock';
      return { ...n, kind, count };
    });
  }, [item, cats, products, l]);
}

/** Highlight a dropdown parent while the shopper is inside its section. */
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

/** Lime marker swipe behind the active nav label (same gesture as the <Accent> headline words). */
const MARKER = 'bg-[linear-gradient(transparent_60%,var(--color-lime)_60%,var(--color-lime)_92%,transparent_92%)]';

/* ------------------------------------------------------------------ */
/* Announcement bar — live "bar" placements, settings as fallback       */
/* ------------------------------------------------------------------ */
function AnnouncementBar() {
  const settings = useSettings();
  const bar = usePlacements('bar');
  const l = useL();
  const c = useDict(chrome);
  const [i, setI] = useState(0);
  const items = useMemo(() => {
    const live = bar.filter((p) => p.title.me.trim() || p.title.sq.trim()).map((p) => ({ id: p.id, text: p.title, href: p.cta?.href?.trim() ?? '' }));
    return live.length ? live : settings.announcements.map((text, n) => ({ id: `a${n}`, text, href: '' }));
  }, [bar, settings.announcements]);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);
  if (!items.length) return null;
  const cur = items[i % items.length];
  const textCls = 'truncate font-semibold decoration-lime/60 underline-offset-4 hover:underline';
  return (
    <div className="relative z-50 bg-ink text-paper">
      <div className="container-x flex h-9 items-center justify-between gap-4 text-[12.5px]">
        <div className="hidden min-w-0 flex-1 items-center gap-5 text-paper/70 lg:flex">
          <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
            <Phone className="h-3.5 w-3.5" /> {settings.phone}
          </a>
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-lime" /> {c('delivery')}
          </span>
        </div>
        <div className="relative h-full min-w-0 flex-1 overflow-hidden text-center lg:max-w-[46%]">
          <AnimatePresence mode="wait">
            <motion.p
              key={cur.id}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex items-center justify-center gap-2 truncate font-semibold"
            >
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
              {!cur.href ? (
                <span className="truncate">{l(cur.text)}</span>
              ) : /^(?:https?:|mailto:|tel:)/i.test(cur.href) ? (
                <a href={cur.href} target="_blank" rel="noreferrer" className={textCls}>
                  {l(cur.text)}
                </a>
              ) : (
                <Link to={cur.href} className={textCls}>
                  {l(cur.text)}
                </Link>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="hidden flex-1 justify-end md:flex">
          <LangSwitcher tone="light" variant="segmented" compact />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mega menu                                                           */
/* ------------------------------------------------------------------ */
function MegaTile({ tile, onClose }: { tile: ShopTile; onClose: () => void }) {
  const c = useDict(chrome);
  return (
    <NavTarget item={tile} onClick={onClose} className="group flex items-center gap-3.5 rounded-2xl p-2 transition-colors hover:bg-white hover:shadow-[0_10px_30px_-22px_rgba(15,29,22,0.5)]">
      <span className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-xl bg-sand ring-1 ring-ink/5">
        {tile.image && <Img src={tile.image} small alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[14.5px] font-bold leading-tight text-ink">
          <span className="truncate">{tile.label}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 -translate-x-1 text-brand-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
        {tile.sub && <span className="mt-0.5 block truncate text-[12.5px] text-muted">{tile.sub}</span>}
        {tile.kind === 'quote' ? (
          <span className="mt-1 inline-flex rounded-full bg-pink-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-pink-ink">{c('madeToOrder')}</span>
        ) : tile.count > 0 ? (
          <span className="mt-1 block text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-700">{c('productsN', { n: tile.count })}</span>
        ) : null}
      </span>
    </NavTarget>
  );
}

function SoonChip({ tile, onClick, className }: { tile: NavItem; onClick?: () => void; className?: string }) {
  return (
    <NavTarget
      item={tile}
      onClick={onClick}
      className={cn('inline-flex h-8 items-center gap-2 rounded-full border border-dashed border-ink/25 bg-white/50 pl-1 pr-3 text-[12.5px] font-semibold text-ink-soft transition-colors hover:border-ink/50 hover:text-ink', className)}
    >
      <span className="h-6 w-6 overflow-hidden rounded-full bg-sand">{tile.image && <Img src={tile.image} small alt="" className="h-full w-full object-cover" />}</span>
      {tile.label}
    </NavTarget>
  );
}

function MegaMenu({ item, tiles, samplesHref, onClose }: { item: NavItem; tiles: ShopTile[]; samplesHref: string; onClose: () => void }) {
  const t = useDict(site);
  const c = useDict(chrome);
  const main = tiles.filter((x) => x.kind !== 'soon');
  const soon = tiles.filter((x) => x.kind === 'soon');
  const promos = item.children.filter((x) => isPromo(x));
  const links = item.children.filter((x) => !isTile(x) && !isPromo(x));
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="absolute inset-x-0 top-full border-t border-line bg-paper shadow-[0_40px_80px_-40px_rgba(15,29,22,0.45)]"
    >
      <div className="container-x grid gap-8 py-7 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{t('categories')}</span>
            <Link to={item.to || '/produktet'} onClick={onClose} className="group inline-flex items-center gap-1.5 text-[13.5px] font-bold text-ink hover:text-brand-700">
              {c('browseAll')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {main.map((x) => (
              <MegaTile key={x.id} tile={x} onClose={onClose} />
            ))}
          </div>
          {(soon.length > 0 || promos.length > 0 || links.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-ink/15 px-2 pt-4">
              {promos.map((p) => (
                <NavTarget key={p.id} item={p} onClick={onClose} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-pink-soft px-3 text-[12.5px] font-bold text-pink-ink transition-colors hover:bg-pink hover:text-ink">
                  <Percent className="h-3.5 w-3.5" /> {p.label}
                </NavTarget>
              ))}
              {links.map((p) => (
                <NavTarget key={p.id} item={p} onClick={onClose} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[12.5px] font-semibold text-ink-soft hover:border-ink/30 hover:text-ink">
                  {p.label}
                </NavTarget>
              ))}
              {soon.length > 0 && (
                <span className="ml-auto flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{c('soon')}</span>
                  {soon.map((s) => (
                    <SoonChip key={s.id} tile={s} onClick={onClose} />
                  ))}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/sherbimet" onClick={onClose} className="group relative isolate flex min-h-[214px] flex-1 flex-col overflow-hidden rounded-3xl bg-brand-700 p-6 text-white">
            <div className="bg-grain pointer-events-none absolute inset-0 -z-10 opacity-70" />
            <div className="absolute -bottom-10 -right-8 -z-10 h-44 w-36 rotate-[8deg] overflow-hidden rounded-2xl border-4 border-white/90 shadow-2xl transition-transform duration-700 group-hover:rotate-[4deg] group-hover:scale-105">
              <Img src="/images/s/printim.webp" small alt="" className="h-full w-full object-cover" />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-lime">{c('printEyebrow')}</span>
            <span className="display mt-2 max-w-[190px] text-[28px] leading-[1.02]">
              <Accent text={c('printTitle')} accentClassName="text-lime [background-image:none]!" />
            </span>
            <span className="mt-2 max-w-[180px] text-[12.5px] leading-snug text-white/75">{c('printText')}</span>
            <span className="mt-auto inline-flex h-9 items-center gap-1.5 self-start rounded-full bg-lime px-4 text-[12.5px] font-bold text-ink transition-colors group-hover:bg-white">
              {c('printCta')} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
          <Link to={samplesHref} onClick={onClose} className="group flex items-center gap-3 rounded-2xl border border-dashed border-ink/20 bg-white/60 p-3 transition-colors hover:border-ink/40 hover:bg-white">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime text-ink">
              <PackageOpen className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-bold text-ink">{t('freeMeasure')}</span>
              <span className="block truncate text-[12px] text-muted">{c('samplesText')}</span>
            </span>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-ink/40 transition-colors group-hover:text-ink" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */
export function Header() {
  const t = useDict(site);
  const c = useDict(chrome);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState<string | null>(null);
  const cartCount = useUi((s) => s.cart.length);
  const wishCount = useUi((s) => s.wishlist.length);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useMainNav();
  const shop = nav.find(isShop);
  const tiles = useShopTiles(shop);
  const samplesHref = useMeasureHref();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setMega(null);
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // "/" opens the search (unless the shopper is typing somewhere)
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [setSearchOpen]);

  const megaItem = mega ? nav.find((n) => n.id === mega && n === shop) : undefined;

  const linkCls = (active: boolean) =>
    cn(
      'relative inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-[14.5px] font-semibold transition-colors',
      active ? 'text-ink' : 'text-ink-soft hover:bg-ink/[0.05] hover:text-ink',
    );
  const label = (text: string, active: boolean) => <span className={cn('px-0.5', active && MARKER)}>{text}</span>;
  const iconBtn = 'relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]';

  return (
    <>
      <AnnouncementBar />
      <header
        className={cn(
          'sticky top-0 z-40 border-b bg-paper/85 backdrop-blur-xl transition-[box-shadow,border-color] duration-300',
          scrolled || megaItem ? 'border-line shadow-[0_12px_32px_-24px_rgba(15,29,22,0.45)]' : 'border-line/70',
        )}
        onMouseLeave={() => setMega(null)}
      >
        <div className="container-x flex h-16 items-center gap-1.5 lg:h-[76px]">
          <button className={cn(iconBtn, '-ml-2 lg:hidden')} onClick={() => setMobileOpen(true)} aria-label={t('menu')}>
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="shrink-0 rounded-lg" aria-label="Paketoje">
            <Logo className="h-[34px] lg:h-[40px]" />
          </Link>

          <nav className="ml-8 hidden items-center gap-0.5 lg:flex xl:ml-10">
            {nav.map((n) =>
              n === shop ? (
                <button
                  key={n.id}
                  type="button"
                  onMouseEnter={() => setMega(n.id)}
                  onClick={() => setMega((m) => (m === n.id ? null : n.id))}
                  className={linkCls(inSection(n, location.pathname) || mega === n.id)}
                  aria-expanded={mega === n.id}
                  aria-haspopup="true"
                >
                  {label(n.label, inSection(n, location.pathname))}
                  <ChevronDown className={cn('h-4 w-4 opacity-60 transition-transform duration-300', mega === n.id && 'rotate-180')} />
                </button>
              ) : n.external ? (
                <a key={n.id} href={n.to} target="_blank" rel="noreferrer" onMouseEnter={() => setMega(null)} className={linkCls(false)}>
                  {n.label}
                </a>
              ) : n.to ? (
                <NavLink key={n.id} to={n.to} onMouseEnter={() => setMega(null)} className={({ isActive }) => linkCls(isActive || inSection(n, location.pathname))}>
                  {({ isActive }) => label(n.label, isActive || inSection(n, location.pathname))}
                </NavLink>
              ) : null,
            )}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="mr-1 hidden h-10 w-[230px] items-center gap-2.5 rounded-full border border-line bg-white/70 pl-4 pr-1.5 text-left text-[13.5px] text-muted transition-colors hover:border-ink/25 hover:bg-white xl:flex"
              aria-label={c('openSearch')}
              title={c('pressSlash')}
            >
              <Search className="h-4 w-4 shrink-0 text-ink" />
              <span className="min-w-0 flex-1 truncate">{c('searchShort')}</span>
              <kbd className="grid h-7 w-7 place-items-center rounded-full bg-sand font-sans text-[12px] font-bold text-ink-soft">/</kbd>
            </button>
            <button className={cn(iconBtn, 'xl:hidden')} onClick={() => setSearchOpen(true)} aria-label={c('openSearch')}>
              <Search className="h-[19px] w-[19px]" />
            </button>
            <Link to="/te-preferuarat" className={cn(iconBtn, 'hidden sm:grid')} aria-label={t('wishlist')}>
              <Heart className="h-[19px] w-[19px]" />
              {wishCount > 0 && <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-paper">{wishCount}</span>}
            </Link>
            <button className={iconBtn} onClick={() => setCartOpen(true)} aria-label={t('cart')}>
              <ShoppingBag className="h-[19px] w-[19px]" />
              {cartCount > 0 && (
                <span key={cartCount} className="absolute right-0 top-0 grid h-[19px] min-w-[19px] animate-pop place-items-center rounded-full bg-pink px-1 text-[10.5px] font-extrabold text-ink ring-2 ring-paper">
                  {cartCount}
                </span>
              )}
            </button>
            <Link
              to={samplesHref}
              className="ml-2 hidden h-10 items-center gap-2 rounded-full bg-lime pl-3.5 pr-4 text-[13.5px] font-bold text-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)] transition-colors hover:bg-ink hover:text-lime md:inline-flex"
            >
              <PackageOpen className="h-4 w-4" />
              {t('freeMeasure')}
            </Link>
          </div>
        </div>
        <AnimatePresence>
          {megaItem && (
            <>
              <motion.div
                key="scrim"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 top-full -z-10 h-screen bg-ink/25"
              />
              <MegaMenu key={megaItem.id} item={megaItem} tiles={tiles} samplesHref={samplesHref} onClose={() => setMega(null)} />
            </>
          )}
        </AnimatePresence>
      </header>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} nav={nav} shop={shop} tiles={tiles} samplesHref={samplesHref} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile menu                                                         */
/* ------------------------------------------------------------------ */
function MobileMenu({ open, onClose, nav, shop, tiles, samplesHref }: { open: boolean; onClose: () => void; nav: NavItem[]; shop?: NavItem; tiles: ShopTile[]; samplesHref: string }) {
  const t = useDict(site);
  const c = useDict(chrome);
  const settings = useSettings();
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const main = tiles.filter((x) => x.kind !== 'soon');
  const soon = tiles.filter((x) => x.kind === 'soon');
  const extra = shop ? shop.children.filter((x) => !isTile(x)) : [];
  const rows = nav.filter((n) => n !== shop);
  const rowCls = 'flex items-center justify-between border-b border-line py-3.5 font-display text-[22px] font-bold tracking-[-0.02em]';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="left"
      title={<Logo className="h-8" />}
      width="max-w-[400px]"
      footer={
        <div className="space-y-3">
          <Link to={samplesHref} onClick={onClose} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime text-[15px] font-bold text-ink">
            <PackageOpen className="h-4 w-4" /> {t('bookMeasure')}
          </Link>
          <div className="flex items-center justify-between gap-3">
            <LangSwitcher variant="segmented" />
            <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink">
              <Phone className="h-4 w-4" /> {settings.phone}
            </a>
          </div>
        </div>
      }
    >
      <div className="px-5 pb-6 pt-4">
        <button
          onClick={() => {
            onClose();
            setSearchOpen(true);
          }}
          className="flex h-12 w-full items-center gap-3 rounded-full border border-line bg-white px-4 text-left text-[14.5px] text-muted"
        >
          <Search className="h-4 w-4 text-ink" /> <span className="truncate">{t('searchPlaceholder')}</span>
        </button>

        {main.length > 0 && (
          <>
            <div className="mb-2.5 mt-6 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{t('categories')}</span>
              <Link to={shop?.to || '/produktet'} onClick={onClose} className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-700">
                {c('browseAll')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {main.map((x) => (
                <NavTarget key={x.id} item={x} onClick={onClose} className="group flex min-w-0 items-center gap-2.5 rounded-2xl bg-white p-1.5 pr-2 ring-1 ring-line active:bg-sand">
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-sand">
                    {x.image && <Img src={x.image} small alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[13px] font-bold leading-tight text-ink">{x.label}</span>
                    {x.kind === 'quote' && <span className="mt-0.5 block text-[10px] font-extrabold uppercase tracking-wide text-pink-ink">{c('madeToOrder')}</span>}
                  </span>
                </NavTarget>
              ))}
            </div>
            {(soon.length > 0 || extra.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {extra.map((x) => (
                  <NavTarget
                    key={x.id}
                    item={x}
                    onClick={onClose}
                    className={cn('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold', isPromo(x) ? 'bg-pink-soft text-pink-ink' : 'border border-line bg-white text-ink-soft')}
                  >
                    {isPromo(x) && <Percent className="h-3.5 w-3.5" />} {x.label}
                  </NavTarget>
                ))}
                {soon.length > 0 && <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted">{c('soon')}</span>}
                {soon.map((s) => (
                  <SoonChip key={s.id} tile={s} onClick={onClose} />
                ))}
              </div>
            )}
          </>
        )}

        <nav className="mt-6 flex flex-col border-t border-line">
          {rows.map((n) => (
            <div key={n.id} className="flex flex-col">
              {!n.to ? (
                <span className={cn(rowCls, 'text-ink')}>{n.label}</span>
              ) : n.external ? (
                <a href={n.to} target="_blank" rel="noreferrer" onClick={onClose} className={cn(rowCls, 'text-ink')}>
                  {n.label} <ArrowUpRight className="h-5 w-5 text-ink/30" />
                </a>
              ) : (
                <NavLink to={n.to} end onClick={onClose} className={({ isActive }) => cn(rowCls, isActive ? 'text-brand-700' : 'text-ink')}>
                  {n.label} <ArrowRight className="h-5 w-5 text-ink/25" />
                </NavLink>
              )}
              {n.children.map((x) => (
                <NavTarget key={x.id} item={x} onClick={onClose} className={cn('border-b border-line py-3 pl-4 text-[15px]', isPromo(x) ? 'font-semibold text-pink-ink' : 'font-medium text-ink-soft')}>
                  {x.label}
                </NavTarget>
              ))}
            </div>
          ))}
          <Link to="/te-preferuarat" onClick={onClose} className={cn(rowCls, 'text-ink sm:hidden')}>
            {t('wishlist')} <Heart className="h-5 w-5 text-ink/25" />
          </Link>
        </nav>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-sand/70 p-4 text-[13px] text-ink-soft">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
          <span>
            <span className="block font-bold text-ink">{c('shipping')}</span>
            {c('delivery')}
          </span>
        </div>
      </div>
    </Drawer>
  );
}
