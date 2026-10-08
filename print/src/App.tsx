import { lazy, Suspense, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, ScrollRestoration, useLocation, type RouteObject } from 'react-router';
import { BASENAME } from '@/lib/paths';
import { Toaster, toast } from 'sonner';
import { SiteLayout } from '@/site/layout/SiteLayout';
import { useDb } from '@/store/db';
import { useUi } from '@/store/ui';
import { applyBrand, setAdminTheme } from '@/lib/color';
import { startCrossTabSync } from '@/store/sync';
import { RequirePerm } from '@/admin/layout/RequirePerm';
import type { Action, Module } from '@/lib/permissions';

// Storefront pages (eager — instant navigation)
import Home from '@/site/pages/Home';
import Shop from '@/site/pages/Shop';
import ProductPage from '@/site/pages/ProductPage';
import CartPage from '@/site/pages/CartPage';
import Checkout from '@/site/pages/Checkout';
import OrderSuccess from '@/site/pages/OrderSuccess';
import Services from '@/site/pages/Services';
import Projects from '@/site/pages/Projects';
import About from '@/site/pages/About';
import Contact from '@/site/pages/Contact';
import Blog from '@/site/pages/Blog';
import PostPage from '@/site/pages/PostPage';
import CmsPageView from '@/site/pages/CmsPageView';
import SearchPage from '@/site/pages/SearchPage';
import Wishlist from '@/site/pages/Wishlist';
import CollectionPage from '@/site/pages/CollectionPage';
import OfferPage from '@/site/pages/OfferPage';
import NotFound from '@/site/pages/NotFound';
import Industries from '@/site/pages/Industries';
import QuoteRequest from '@/site/pages/QuoteRequest';

// CMS (lazy — separate bundle)
const AdminLayout = lazy(() => import('@/admin/layout/AdminLayout'));
const Login = lazy(() => import('@/admin/pages/Login'));
const Invoice = lazy(() => import('@/admin/pages/Invoice'));
// Overview, orders
const Dashboard = lazy(() => import('@/admin/pages/Dashboard'));
const Orders = lazy(() => import('@/admin/pages/Orders'));
const OrderDetail = lazy(() => import('@/admin/pages/OrderDetail'));
const DraftOrders = lazy(() => import('@/admin/pages/DraftOrders'));
const DraftOrderEdit = lazy(() => import('@/admin/pages/DraftOrderEdit'));
const Returns = lazy(() => import('@/admin/pages/Returns'));
// Products
const Products = lazy(() => import('@/admin/pages/Products'));
const ProductEdit = lazy(() => import('@/admin/pages/ProductEdit'));
const Collections = lazy(() => import('@/admin/pages/Collections'));
const CollectionEdit = lazy(() => import('@/admin/pages/CollectionEdit'));
const Categories = lazy(() => import('@/admin/pages/Categories'));
const Inventory = lazy(() => import('@/admin/pages/Inventory'));
const PurchaseOrders = lazy(() => import('@/admin/pages/PurchaseOrders'));
// Customers, growth, discounts
const Customers = lazy(() => import('@/admin/pages/Customers'));
const Segments = lazy(() => import('@/admin/pages/Segments'));
const Offers = lazy(() => import('@/admin/pages/Offers'));
const OfferEdit = lazy(() => import('@/admin/pages/OfferEdit'));
const Discounts = lazy(() => import('@/admin/pages/Discounts'));
const DiscountEdit = lazy(() => import('@/admin/pages/DiscountEdit'));
// Content
const Pages = lazy(() => import('@/admin/pages/Pages'));
const PageEdit = lazy(() => import('@/admin/pages/PageEdit'));
const Posts = lazy(() => import('@/admin/pages/Posts'));
const PostEdit = lazy(() => import('@/admin/pages/PostEdit'));
const ProjectsAdmin = lazy(() => import('@/admin/pages/ProjectsAdmin'));
const Menus = lazy(() => import('@/admin/pages/Menus'));
const ContentModels = lazy(() => import('@/admin/pages/ContentModels'));
const Media = lazy(() => import('@/admin/pages/Media'));
// Markets, analytics, contacts, appointments
const Markets = lazy(() => import('@/admin/pages/Markets'));
const Analytics = lazy(() => import('@/admin/pages/Analytics'));
const Inquiries = lazy(() => import('@/admin/pages/Inquiries'));
const Quotes = lazy(() => import('@/admin/pages/Quotes'));
const Appointments = lazy(() => import('@/admin/pages/Appointments'));
const AppointmentServices = lazy(() => import('@/admin/pages/AppointmentServices'));
// Sales channels, settings
const OnlineStore = lazy(() => import('@/admin/pages/OnlineStore'));
const ContentEditor = lazy(() => import('@/admin/pages/ContentEditor'));
const Slides = lazy(() => import('@/admin/pages/Slides'));
const SlideEdit = lazy(() => import('@/admin/pages/SlideEdit'));
const Integrations = lazy(() => import('@/admin/pages/Integrations'));
const SettingsPage = lazy(() => import('@/admin/pages/SettingsPage'));
const ModuleMap = lazy(() => import('@/admin/pages/ModuleMap'));

function Loader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-brand-600" />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const authed = useUi((s) => s.adminAuthed);
  if (!authed) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function Root() {
  const brand = useDb((s) => s.settings.brandColor);
  const { pathname } = useLocation();
  const admin = pathname === '/admin' || pathname.startsWith('/admin/');
  // Neutral CMS theme under /admin (PDF p.07); the storefront (and the builder's preview iframe) keeps the PrintWorks purple.
  useLayoutEffect(() => setAdminTheme(admin), [admin]);
  useEffect(() => applyBrand(brand), [brand]);
  useEffect(() => startCrossTabSync(), []);
  useEffect(() => {
    const fn = () => toast.error('Hapësira për të dhënat demo është plot — fshini disa imazhe të ngarkuara ose rivendosni demon.');
    window.addEventListener('pw:storage-full', fn);
    return () => window.removeEventListener('pw:storage-full', fn);
  }, []);
  return (
    <>
      <ScrollRestoration />
      <Suspense fallback={<Loader />}>
        <Outlet />
      </Suspense>
      <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: 'font-sans' }} />
    </>
  );
}

/** CMS screen guarded by roles & permissions (PDF p.42): `module` + optional `action` (default view). */
const screen = (path: string, module: Module | null, element: ReactNode, action?: Action): RouteObject => ({
  path,
  element: module ? (
    <RequirePerm module={module} action={action}>
      {element}
    </RequirePerm>
  ) : (
    element
  ),
});

// Route map — keep in sync with src/admin/layout/nav.ts (sidebar) and AGENT_BRIEF.md ("CMS v2 route map").
const adminRoutes: RouteObject[] = [
  { index: true, element: <RequirePerm module="overview"><Dashboard /></RequirePerm> },
  // Porositë
  screen('porosite', 'orders', <Orders />),
  screen('porosite/:id', 'orders', <OrderDetail />),
  screen('draftet', 'drafts', <DraftOrders />),
  screen('draftet/:id', 'drafts', <DraftOrderEdit />), // 'i-ri' = new draft
  screen('kthimet', 'returns', <Returns />),
  // Produktet
  screen('produktet', 'products', <Products />),
  screen('produktet/i-ri', 'products', <ProductEdit />),
  screen('produktet/:id', 'products', <ProductEdit />),
  screen('koleksionet', 'collections', <Collections />),
  screen('koleksionet/:id', 'collections', <CollectionEdit />),
  screen('kategorite', 'products', <Categories />),
  screen('inventari', 'inventory', <Inventory />),
  screen('furnizimet', 'purchasing', <PurchaseOrders />),
  // Klientët
  screen('klientet', 'customers', <Customers />),
  screen('segmentet', 'segments', <Segments />),
  // Rritja · Zbritjet
  screen('ofertat', 'offers', <Offers />),
  screen('ofertat/:id', 'offers', <OfferEdit />),
  screen('zbritjet', 'discounts', <Discounts />),
  screen('zbritjet/:id', 'discounts', <DiscountEdit />),
  // Përmbajtja
  screen('faqet', 'content', <Pages />),
  screen('faqet/:id', 'content', <PageEdit />),
  screen('blog', 'content', <Posts />),
  screen('blog/:id', 'content', <PostEdit />),
  screen('projektet', 'content', <ProjectsAdmin />),
  screen('menyte', 'content', <Menus />),
  screen('modelet', 'content', <ContentModels />),
  screen('media', 'content', <Media />),
  // Tregjet · Analitika
  screen('tregjet', 'markets', <Markets />),
  screen('analitika', 'analytics', <Analytics />),
  // Kontaktet · Terminet
  screen('kontaktet', 'contacts', <Inquiries />),
  screen('kontaktet/oferta-b2b', 'quotes', <Quotes />),
  screen('terminet', 'appointments', <Appointments />),
  screen('terminet/sherbimet', 'appointments', <AppointmentServices />),
  // Kanale shitjeje
  screen('dyqani', 'onlineStore', <OnlineStore />),
  screen('dyqani/editor', 'onlineStore', <ContentEditor />),
  screen('dyqani/sllajdet', 'onlineStore', <Slides />),
  screen('dyqani/sllajdet/:id', 'onlineStore', <SlideEdit />),
  screen('integrimet', 'integrations', <Integrations />),
  // Konfigurimet · Harta e moduleve
  screen('konfigurimet', 'settings', <SettingsPage />),
  screen('konfigurimet/:section', 'settings', <SettingsPage />),
  screen('modulet', null, <ModuleMap />),
  { path: '*', element: <Navigate to="/admin" replace /> },
];

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'produktet', element: <Shop /> },
          { path: 'produktet/:category', element: <Shop /> },
          { path: 'produkt/:slug', element: <ProductPage /> },
          { path: 'koleksioni/:slug', element: <CollectionPage /> },
          { path: 'oferta/:slug', element: <OfferPage /> },
          { path: 'shporta', element: <CartPage /> },
          { path: 'pagesa', element: <Checkout /> },
          { path: 'porosia/:id', element: <OrderSuccess /> },
          { path: 'teknologjia', element: <Services /> },
          { path: 'sherbimet', element: <Navigate to="/teknologjia" replace /> },
          { path: 'industrite', element: <Industries /> },
          { path: 'industrite/:slug', element: <Industries /> },
          { path: 'kerko-oferte', element: <QuoteRequest /> },
          { path: 'projektet', element: <Projects /> },
          { path: 'rreth-nesh', element: <About /> },
          { path: 'kontakt', element: <Contact /> },
          { path: 'blog', element: <Blog /> },
          { path: 'blog/:slug', element: <PostPage /> },
          { path: 'faqe/:slug', element: <CmsPageView /> },
          { path: 'kerko', element: <SearchPage /> },
          { path: 'te-preferuarat', element: <Wishlist /> },
          { path: '*', element: <NotFound /> },
        ],
      },
      { path: 'admin/login', element: <Login /> },
      {
        // Printable invoice — outside the CMS shell
        path: 'admin/fatura/:id',
        element: (
          <RequireAuth>
            <Invoice />
          </RequireAuth>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        ),
        children: adminRoutes,
      },
    ],
  },
], { basename: BASENAME });

export default function App() {
  return <RouterProvider router={router} />;
}
