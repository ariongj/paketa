import { useEffect } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { LayoutDashboard } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { SearchOverlay } from './SearchOverlay';
import { useDict, LANGS, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useSettings } from '@/store/hooks';
import { useDb } from '@/store/db';
import { cn } from '@/lib/utils';

/** Routes where the pill would sit on top of forms, cart lines or the sticky buy bar. */
const NO_BADGE = /^\/(shporta|pagesa|porosia|kerko-oferte)(\/|$)/;
const NO_BADGE_MOBILE = /^\/produkt\//;

/**
 * Floating "demo store → open the CMS" pill (Settings → demo banner). Hidden inside the builder preview and on the
 * checkout flow; a compact icon that expands on hover, so it never hides content.
 */
function DemoBadge() {
  const t = useDict(site);
  const settings = useSettings();
  const { pathname } = useLocation();
  if (!settings.demoBanner || NO_BADGE.test(pathname)) return null;
  return (
    <Link
      to="/admin"
      aria-label={`${t('demoBanner')} ${t('demoBannerCta')}`}
      title={t('demoBanner')}
      className={cn(
        'group fixed bottom-4 left-4 z-30 flex items-center rounded-full bg-ink/90 p-1.5 text-[12px] font-semibold text-paper shadow-xl ring-1 ring-white/10 backdrop-blur transition-all hover:bg-ink hover:pr-4',
        NO_BADGE_MOBILE.test(pathname) && 'max-sm:hidden',
      )}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600">
        <LayoutDashboard className="h-3.5 w-3.5" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2.5 group-hover:max-w-[420px] group-hover:opacity-100 group-focus-visible:ml-2.5 group-focus-visible:max-w-[420px] group-focus-visible:opacity-100">
        {t('demoBanner')} <span className="text-brand-200">{t('demoBannerCta')} →</span>
      </span>
    </Link>
  );
}

export function SiteLayout() {
  const location = useLocation();
  const [params] = useSearchParams();
  const lang = useLang();
  const isHome = location.pathname === '/';
  const preview = params.get('preview') === '1';
  // The header sits transparently on the dark hero when the (previewed) homepage starts with one.
  const heroFirst = useDb((s) => ((preview ? s.homeDraft : null) ?? s.home).find((h) => h.enabled)?.type === 'hero');

  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.code === lang)?.htmlLang ?? 'sq';
  }, [lang]);

  // Smooth-scroll to in-page anchors like /#oferta after navigation
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(t);
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header transparentTop={isHome && heroFirst} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <DemoBadge />
    </div>
  );
}

/** Page title helper for storefront pages. */
export function usePageTitle(title: string | undefined) {
  const settings = useSettings();
  useEffect(() => {
    document.title = title ? `${title} — ${settings.companyName}` : settings.seo.title;
  }, [title, settings.companyName, settings.seo.title]);
}
