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
- **Studio 3D** (`/studio-3d`) — a paper bag the shopper builds and prints on in 3D: kraft or art paper in any brand
  colour, four sizes, matte / gloss / soft-touch laminate, rope, twisted-paper, flat-paper or satin-ribbon handles, and
  logo, text and QR code on both sides (gold and silver foil included), plus all-over patterns and colour blocks.
  Fourteen ready-made examples: the six paper bags of the catalogue as they are photographed, and eight ideas by
  industry. The design is priced from the catalogue's own quantity tiers and added to the cart with a picture of the bag
  and a prepress note, which then show on the order in the CMS; it is kept for the browser tab, so a visitor who goes to
  the cart and comes back finds it again. The homepage opens with a showcase right under the hero: a live, turning 3D
  bag with examples to switch between. Also linked from the paper-bag category, every paper-bag product page and the
  header.
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

## Studio 3D

The studio is its own page, `studio.html` + `src/studio/studio.js` (three.js, plain JavaScript), built as a second Vite
entry so the storefront only downloads three.js when a visitor opens it. `src/site/pages/Studio3D.tsx` shows it in an
iframe, listens for its `pw-studio` messages and maps the design to a catalogue product in
`src/site/components/studio/model.ts` (kraft → kraft bag, XL → large shopping bag, otherwise the premium rope-handle
bag). Sizes, papers, handles and finishes in `studio.js` use the same ids as the bag options in `src/data/catalog.ts`;
change them in both places. `studio.html?embed=1` shows only the turning bag; the homepage showcase
(`src/site/components/studio/StudioShowcase.tsx`) loads it when the section is about to scroll into view and pauses it
while off screen. The picture `public/images/studio/studio-bags.webp` (category banner, and the stand-in until the live
bag is ready) is a render of three studio examples.

## Tech

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router 7 · Zustand · Motion · Recharts · Lucide icons ·
three.js (3D studio) · DM Sans + DM Mono (self-hosted).

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
