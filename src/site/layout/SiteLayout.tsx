import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { LayoutDashboard } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { SearchOverlay } from './SearchOverlay';
import { useDict, LANGS, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useSettings } from '@/store/hooks';

/** Floating "demo store" pill (CMS → Settings → demo banner). */
function DemoBadge() {
  const t = useDict(site);
  const settings = useSettings();
  if (!settings.demoBanner) return null;
  return (
    <Link
      to="/admin"
      className="group fixed bottom-4 left-4 z-30 flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full bg-ink/95 py-1.5 pl-1.5 pr-4 text-[12px] font-semibold text-paper shadow-[0_18px_40px_-18px_rgba(15,29,22,0.7)] ring-1 ring-white/10 backdrop-blur transition-all hover:bg-ink"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime text-ink">
        <LayoutDashboard className="h-3.5 w-3.5" />
      </span>
      <span className="hidden truncate sm:inline">{t('demoBanner')}</span>
      <span className="shrink-0 text-lime group-hover:text-white">{t('demoBannerCta')} →</span>
    </Link>
  );
}

export function SiteLayout() {
  const location = useLocation();
  const lang = useLang();

  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.code === lang)?.htmlLang ?? 'sq';
  }, [lang]);

  // Smooth-scroll to in-page anchors (/#… links) after navigation
  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(t);
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
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
