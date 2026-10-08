# PrintWorks — e-commerce + CMS

A complete, clickable rebuild of **printwor-ks.com** for **PrintWorks Solutions** (Kosovo) — a modern printing and
packaging company: product packaging, food packaging, labels & shrink sleeves, paper bags, promotional print and
specialty finishing. *Innovative Printing. Exceptional Packaging.*

- **Storefront** — homepage built from CMS sections, catalogue of 46 print products in 6 categories, a print
  **configurator** on every product (options, quantity price tiers, live unit price and total, artwork upload /
  "send later" / professional design service), cart and B2B checkout (company, NUI / VAT number, PO number, prices
  excl. VAT with 18 % VAT added), order confirmation with the proof → production → delivery timeline, a multi-step
  **request-a-quote** flow for custom packaging, industries, technology, projects, about, contact, blog, CMS pages,
  search and saved items.
- **CMS** (`/admin`) — dashboard, orders with a **prepress & proof** workflow (artwork per line, proof versions,
  approvals), printable invoices / pro-formas, draft orders, complaints, products with a **quantity-tier price
  editor**, collections, categories, inventory, purchasing, customers & segments, contacts inbox with structured
  quote requests, B2B quotes, appointments (consultations, press checks, factory visits), discounts, offers, slides
  & banners, homepage builder with live preview, pages, blog, projects, menus, media, markets, analytics,
  integrations, roles & permissions and settings.
- **Two languages everywhere** — Albanian (default) and English — on the site and in the CMS.

Everything runs in the browser (no backend needed for the demo). Data is stored in `localStorage` and every open tab
stays in sync, so an order placed on the storefront appears in the CMS instantly.

## Run it

Requirements: Node.js 20.19+ (tested with Node 24).

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3370 — the CMS is at http://localhost:3370/admin

**CMS demo login** (pre-filled on the login screen): `admin@printwor-ks.com` / `printworks2026`

Production build (static files in `dist/`):

```bash
npm run build
```

## Deploy a shareable link

It is a static single-page app:

- **Vercel** — import the folder/repo, framework "Vite"; `vercel.json` rewrites all routes to `index.html`.
- **Netlify** — build command `npm run build`, publish directory `dist`; `public/_redirects` handles routing.
- **GitHub Pages** — `.github/workflows/pages.yml` builds with `BASE_PATH=/PrintWorks/` on every push to `main`.

Each visitor's browser keeps its own copy of the demo data.

## What is placeholder

- Address, NUI / VAT number and bank account — samples in **CMS → Konfigurimet**, to be replaced with the real data.
  Phone (+383 49 732 700) and e-mail (hello@printwor-ks.com) are taken from the current website.
- Prices, quantity tiers, lead times and product texts — a realistic starting catalogue, all editable in the CMS.
- Orders, customers, quote requests and appointments — generated demo data (names/e-mails are fictional, `@example.com`).
- Card payment — simulated; no card data is collected. Uploaded artwork is kept as file name + small preview only.
- Photos and partner logos — PrintWorks' own material from printwor-ks.com.

## Path to production

| Demo | Production |
| --- | --- |
| `localStorage` data | Hosted database + API (e.g. Supabase/Postgres or a headless commerce backend) |
| Artwork metadata only | Real file storage (S3-compatible), preflight checks, proof PDFs sent by e-mail |
| Demo login | Real authentication with roles (owner, sales, prepress, marketing) |
| Simulated card payment | Kosovo bank e-commerce gateway; ATK fiscalisation |
| Client-side rendering | Server-side rendering / prerendering for SEO in both languages |
| — | Domain printwor-ks.com, transactional e-mail, Google Analytics, Meta pixel |

## Tech

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router 7 · Zustand · Motion · Recharts · Lucide icons ·
DM Sans + DM Mono (self-hosted).

```
src/
  App.tsx              routes (storefront + /admin, CMS is code-split)
  lib/                 types, pricing (tiers, VAT, shipping zones, discounts), orders, formatting, search
  i18n/                typed SQ/EN dictionaries
  data/                seed catalogue, settings, homepage sections, pages, posts, projects, demo data
  store/               zustand stores (db = CMS data, ui = cart/lang/session) + cross-tab sync
  components/          UI kit, logo, icons
  site/                storefront layout, sections, pages
  admin/               CMS layout, components, pages
public/images/         optimised WebP photos (+ -sm thumbnails), partner logos
```
