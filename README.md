# Paketoje — e-commerce + CMS

A complete rebuild of **paketoje.com** — food & drink packaging for cafés, restaurants, fast food and pastry shops,
based in **Mitrovicë, Kosovo** ("Paketoje — it's packaging").

- **Storefront** (Albanian by default, plus English and Serbian) — homepage, catalogue with filters, product pages built
  for B2B packaging (price per pack **and** per piece, pack/carton sizes, volume prices, pieces calculator, "+1 carton",
  compatible lids/cups, logo-print add-on), quote-only custom-print items, "coming soon" ranges, cart and checkout
  (business purchase with NUI, Kosovo delivery zones, depot pickup, cash on delivery / bank transfer / card), order
  confirmation, "For business" (logo print, wholesale, free samples), references, about, contact, blog, policy pages,
  campaign landing pages, search, favourites.
- **CMS** (`/admin`) — the full Shopify-style CMS of our platform: dashboard, orders (status flow incl. "Në printim"),
  draft orders, returns, printable invoices (NUI / TVSH 18 %), products (packs, cartons, volume tiers, logo print),
  collections, categories, inventory & purchase orders, customers & segments, offers, discounts (codes, automatic,
  buy-X-get-Y, free delivery), slideshow/banners/announcement bar, homepage builder with drafts & versions, pages, blog,
  references, menus, media, markets, analytics, contacts inbox & B2B quotes, appointments (sample visits, design
  consultations), roles & permissions, integrations, settings.

Everything runs in the browser for the demo (data in `localStorage`, synced across tabs — an order placed on the
storefront appears in the CMS instantly).

## Run it

Requirements: Node.js 20.19+ (tested with Node 24).

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3380 — the CMS is at http://localhost:3380/admin

**CMS demo login** (pre-filled): `admin@paketoje.com` / `paketoje2026`

Production build (static files in `dist/`):

```bash
npm run build
```

## Real vs. placeholder data

| Real (from paketoje.com) | Placeholder — confirm with Paketoje |
|---|---|
| 37 products: names, descriptions (sq/en), SKUs PAK-101…604, prices, photos | Pack and carton sizes, stock levels, volume tiers |
| Paketoje SH.P.K, Sylyshaj, Mitrovicë; +383 48 400 061; info@ / refund@paketoje.com; NUI 812224632 | VAT no., bank/IBAN, opening hours, WhatsApp, Instagram |
| Return policy (5 days), terms, privacy (condensed) | Delivery fees per zone, free delivery ≥ €50 |
| Logo and brand colours | Logo-print prices/minimums, custom-print (quote) items |
| Categories incl. "coming soon" ranges (aluminium, PLA) | References (illustrative examples), blog posts, demo orders/customers |

Prices: the Shopify store sells most items per piece (e.g. €0.05 per cup). Here everything is sold **per pack** at the
same per-piece price (e.g. 50 cups = €2.50), and the per-piece price is shown next to every pack price.

Lifestyle photography is from Unsplash (see `CREDITS.md`) — replace with Paketoje's own photos before launch.

## Path to production

| Demo | Production |
|---|---|
| `localStorage` data | Hosted database + API (e.g. Supabase/Postgres) or a headless commerce backend |
| Demo login | Real authentication with roles (owner, manager, warehouse, sales, editor, marketing) |
| Simulated card payment | A Kosovo bank e-commerce gateway |
| Client-side rendering | Prerendering/SSR for SEO (product pages in 3 languages) |
| — | Domain paketoje.com, transactional e-mail, ATK fiscalisation, GA4 / Meta pixel |

## Deploy a shareable link

Static single-page app:
- **Vercel** — framework "Vite"; `vercel.json` rewrites all routes to `index.html`.
- **Netlify** — build `npm run build`, publish `dist`; `public/_redirects` handles routing.
- **GitHub Pages** — `.github/workflows/pages.yml` builds with `BASE_PATH=/Paketoje/` on push to `main`.

## Tech

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router 7 · Zustand · Motion · Recharts · Lucide icons ·
Bricolage Grotesque + Manrope (self-hosted).

```
src/
  App.tsx              routes (storefront in Albanian URLs + /admin; CMS is code-split)
  lib/                 types, pricing (packs, tiers, VAT, zones), discount engine, inventory, formatting, search
  i18n/                typed SQ/EN/SR dictionaries (the `me` key holds Serbian)
  data/                catalogue (from paketoje.com), content, CMS seed data, demo-order generator
  store/               zustand stores (db = CMS data, ui = cart/lang/session) + cross-tab sync
  components/          UI kit, logo
  site/                storefront layout, sections, pages
  admin/               CMS layout, components, pages
public/images/         WebP images (+ -sm thumbnails): products, heroes, categories, services, references
```
