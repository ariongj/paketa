# Paketoje rebuild — shared brief for parallel agents

Project root: `C:\Users\A\Documents\paketoje` (Windows; Bash is Git Bash, PowerShell also available).
We are rebuilding **paketoje.com** — a food-packaging shop in **Mitrovicë, Kosovo** ("Paketoje — it's packaging") — as a
proper e-commerce site + CMS. The codebase is a copy of our SELCA platform (Vite/React SPA, client-side "db" in
localStorage, full Shopify-style CMS under `/admin`). Your job is to turn SELCA-specific (home-improvement, Montenegro)
code and copy into Paketoje (food packaging, Kosovo) and make it look **finished and premium** for a client demo.

## The business (real data — use it)
- Paketoje sells disposable food & drink packaging to **businesses** (cafés/bars, restaurants, fast food, pastry &
  ice-cream shops, sushi, catering) and to individuals. Ships in Kosovo; serves Albania, North Macedonia and Montenegro on request.
- Real address: **Sylyshaj, Suhodoll, Mitrovicë** (returns also go there). Real email: **refund@paketoje.com**
  (use `info@paketoje.com` as the general address — placeholder). Phone/NUI/bank are placeholders (see Settings).
- Real catalogue (37 products, SKUs PAK-101…604, photos) imported from their Shopify — see `src/data/catalog.ts`.
- Real return policy: 5 days after receipt, unused, original packaging, contact refund@paketoje.com.
- Brand: logo = extruded "P" box mark (forest green `#00723a`, lime `#c1ff72`, pink `#ff66c4`) + rounded "paketoje"
  wordmark, tagline "it's packaging". The current site header is bright green `#00bf63`.

## Domain mapping (SELCA concept → Paketoje) — apply everywhere you touch
| SELCA platform | Paketoje meaning | UI wording (sq / en / sr) |
|---|---|---|
| unit `'m2'` (area, packs of m²) | **removed** → unit `'pack'` | pako / pack / pak. |
| `packSize` (m² per pack) | **pieces per pack**; `price` is **per pack** | "50 copë/pako", per-piece price shown |
| — | `cartonPacks` packs per carton | "Karton: 20 pako · 1.000 copë" |
| — | `tiers` volume pricing per cart line | "Çmime shumice": 10+ pako −5 %, 1 karton −10 % |
| m² calculator | **pieces calculator**: "Sa copë ju duhen?" → packs = ceil(pieces/packSize) | |
| `installation` add-on (per unit) | **Printim me logo** (custom logo print) add-on, priced per pack; min. 1 carton, 7–10 working days; does NOT make delivery free | Printim me logo / Logo print / Štampa logotipa |
| order status `'installation'` | **"Në printim"** (in print production) — comes **before** shipped | Në printim / In print / U štampi |
| inquiry type `'measurement'` | **free samples request** | Mostra falas / Free samples / Besplatni uzorci |
| inquiry type `'quote'` | wholesale / logo-print quote | Kërkesë për ofertë (shumicë / logo) |
| services: measurement, consultation, installation | `sv-mostra` (sample visit at your venue), `sv-dizajn` (logo-print design consultation), `sv-takim` (B2B wholesale meeting) | |
| showroom / salon | **depo** (warehouse) in Mitrovicë — pickup point | Marrje në depo / Warehouse pickup |
| projects ("Realizacije") | **Referencat** — examples of custom-printed packaging for venues (placeholders, generic venue types, no fake brand names) | |
| PIB / PDV | **NUI** (business number) / **Nr. TVSH** (VAT no.) | |
| VAT 21 % | **TVSH 18 %** (prices incl. VAT) | |
| Montenegro cities/zones | **Kosovo** zones (see Settings) | |
| `SC-1042` order numbers | `PK-1042` | |
| "Kuhinje po mjeri", doors, tiles… | cups, lids, containers, desserts, sauce cups, cutlery, straws | |

## Languages
Three languages everywhere: **sq Albanian (DEFAULT)**, **en English**, and the internal key **`me` now = Serbian (Latin)**
for North Mitrovica / regional clients (label "Srpski", short "SR"). Type `L10n = { me, sq, en }` is unchanged.
- Order in every language switcher / tab strip: **SQ, EN, SR** (`LANGS` from `@/i18n` is already in that order — use it;
  replace local hard-coded `['me','sq','en']` lists with `sq, en, me` and label `me` as "SR").
- Serbian text: Latin script; ijekavian forms are fine (keeps the existing platform strings consistent).
- `lt()` falls back sq → en → me. The admin defaults to Albanian (`adminLang: 'sq'`), the storefront to `lang: 'sq'`.
- Dictionaries: `const T = defineDict({ me: {...}, sq: {...}, en: {...} })` + `useDict(T)` (site) / `useDict(T, 'admin')`.
  TypeScript enforces identical keys. Shared dicts: `common` (`@/i18n/common`), `site` (`@/i18n/site`), `adm` (`@/admin/i18n`)
  — these are already converted for Paketoje (read them; e.g. `common.installation` = "Printim me logo").

## Stack (unchanged from SELCA)
Vite 8, React 19, TypeScript (strict, `noUnusedLocals`), Tailwind CSS v4 (CSS-first config in `src/index.css`; important
modifier at the END: `opacity-0!`), react-router 7 (`import { Link, useNavigate, useParams, useSearchParams } from 'react-router'`),
zustand 5, motion 12 (`motion/react`), lucide-react icons, recharts 3, sonner (`toast`). Alias `@/` → `src/`. Pages = default export.
- **zustand v5 rule:** selectors must return stable references — never `useDb(s => s.orders.filter(...))`; select raw slices and `useMemo`.
- `cn()` is plain clsx (no tailwind-merge).
- Never hard-code absolute URLs in raw `<a href>`/`window.open`/`location.href` — use `href('/…')` from `@/lib/paths`.
  `<Link>`/`navigate` handle the base. Image strings `/images/...` in ts/tsx are rewritten at build time.

## Core API changes already made (foundation — do not redo, do not edit these files)
- `src/lib/types.ts`: `Unit = 'kom' | 'pack' | 'm' | 'set'`; `Product.packSize` (pieces/pack), `cartonPacks`, `tiers: PriceTier[]`
  (`{minQty, pct}`); `Category.soon?: boolean` ("Së shpejti" range — show a notify/quote form instead of a grid); `OrderLine.tierPct`.
- `src/lib/pricing.ts`: prices are per selling unit (`qtyUnits(p, qty) === qty`). New: `packsForPieces(pieces, packSize)`,
  `piecesPerUnit(p)`, `piecesFor(p, qty)`, `piecePrice(p, options?, qty?)`, `tiersOf(p)`, `tierPct(p, qty)`, `nextTier(p, qty)`.
  `unitPrice(p, options, qty)` applies the volume tier for that line qty. `PricedLine.tierPct`; `Totals.pieces`.
  Printing (`installation`) no longer gives free shipping. `packsForArea`/`WASTE` are deprecated shims — **remove their use**.
- `src/lib/orders.ts`: `orderLineUnits(l) === l.qty`; new `orderLinePieces(l)`.
- `src/lib/format.ts`: default lang `sq`; `unitLabel('pack')` = pako/pack/pak.; new `moneyPiece(v, lang)` (2–4 decimals for
  sub-cent piece prices), `piecesLabel(lang)`, `pieces(n, lang)` ("1.000 copë"), `cartonLabel(n, lang)`.
- `src/lib/color.ts`: `DEFAULT_BRAND = '#00723a'`; the CMS stays neutral black/grey/white (unchanged behaviour).
- `src/components/brand/Logo.tsx`: `Logo` (mark + wordmark lockup, `tone="light"` for dark backgrounds, size via height class),
  `LogoMark`, `Wordmark`. Assets in `public/images/brand/`.
- `src/components/ui/misc.tsx` `Accent`: `*word*` → brand-green word with a lime marker swipe (no italics/serif any more).
- Storage keys `paketoje-db` / `paketoje-ui`. Dev server: **http://localhost:3380** (already running — do NOT start another,
  do NOT run `vite build`).

## Storefront routes (Albanian — already renamed everywhere)
`/` · `/produktet` · `/produktet/:category` · `/produkt/:slug` · `/koleksioni/:slug` · `/oferta/:slug` · `/shporta` ·
`/pagesa` (checkout) · `/porosia/:id` (order success) · `/sherbimet` (For business: logo print, wholesale, samples) ·
`/referencat` (projects) · `/rreth-nesh` · `/kontakti` · `/blog` · `/blog/:slug` · `/faqe/:slug` (CMS pages) · `/kerko` ·
`/te-preferuarat` (wishlist). Admin routes are unchanged (`/admin/narudzbe`, `/admin/proizvodi`, … see `src/App.tsx`).

## Data contract (ids other files rely on)
**Categories:** `cat-gota` (Gota/Cups), `cat-kapake` (Kapakë/Lids), `cat-ene` (Enë ushqimi/Food containers),
`cat-embelsira` (Ëmbëlsira & akullore), `cat-salca` (Gota për salca/Sauce cups), `cat-takem` (Takëm & sete/Cutlery),
`cat-shkopinj` (Shkopinj & lugë kafeje/Straws & stirrers), `cat-karton` (Letër & karton — custom-print quote items),
`cat-etiketa` (Rrotulla & etiketa — quote), `cat-alumini` (soon), `cat-pla` (soon).
**Products** (id · SKU · price per pack · pieces/pack · packs/carton):
- Cups: `p-gota-f95-250` PAK-101 2.00·50·20 · `p-gota-f95-300` PAK-102 2.50 · `p-gota-f95-350` PAK-103 2.50 · `p-gota-f95-400` PAK-104 2.50 (bestseller) · `p-gota-f95-500` PAK-105 3.00 — all 50/20, logo print +1.50/pack
- Lids (100/10): `p-kapak-sheshte` PAK-201 2.00 · `p-kapak-kupole` PAK-202 2.00 · `p-kapak-clip` PAK-203 2.00 (bestseller) · `p-kapak-bodega` PAK-204 3.00
- Containers (50/pk): `p-kuti-dy-ndarje` PAK-301 9.00 · `p-ene-mikrovale-500` PAK-302 9.00 · `p-ene-mikrovale-750` PAK-303 9.50→sale 8.50 · `p-ene-sushi-mesme` PAK-304 4.50 · `p-ene-sushi-500` PAK-305 3.00 · `p-ene-sallate-750` PAK-309 6.00 · `p-ene-sallate-1000` PAK-310 6.00
- Desserts: `p-gote-venus` PAK-106 6.00 · `p-gote-ps` PAK-107 6.00 · `p-gote-bodega-250` PAK-108 7.00 (logo print) · `p-kuti-torte-230` PAK-306 7.00/25 (low stock 9) · `p-ene-torte-kupole` PAK-307 3.00/25 · `p-kuti-trekendeshe-gold` PAK-308 4.50 · `p-luge-akullore-roze` PAK-509 1.50/100 · `p-luge-akullore-lux` PAK-510 10.00/500 (out of stock)
- Sauce cups (100/25): `p-salce-1oz` PAK-401 2.00 (bestseller) · `p-salce-2oz` PAK-402 3.00
- Cutlery: `p-set-ps-zi` PAK-501 8.00/100 sets · `p-set-ps-bardhe` PAK-502 8.00 · `p-set-pp-zi` PAK-503 9.00 · `p-set-lux-zi` PAK-504 12.00→sale 10.80 · `p-pirun-bardhe` PAK-506 0.50/50 · `p-thike-bardhe` PAK-507 0.50/50 · `p-luge-bardhe` PAK-508 0.50/50
- Straws & stirrers: `p-shkop-22` PAK-601 5.00/500 · `p-shkop-24` PAK-602 5.00/500 · `p-luge-kafe-standard` PAK-603 3.00/1000 · `p-luge-kafe-gjate` PAK-604 4.00/1000
- Archived: `p-pirun-bardhe-100` PAK-505 (old 100-pack, archived by `ARCHIVED_PRODUCT` in cms.ts)
- Quote-only custom print (unit 'kom', price 0, `quoteOnly`, template 'quote'): `p-gote-letre-logo` PAK-701, `p-kuti-burger-logo` PAK-702 (cat-karton), `p-etiketa-logo` PAK-801 (cat-etiketa)

**Images** (`public/images/…webp`, each with a `-sm.webp` 720px variant; `<Img small>` uses it):
products `p/pak-101-1.webp` …; `hero/{kraft,smoothie,meal,delivery,iced}`; `cat/{gota,kapake,ene,embelsira,salca,takem,shkopinj,karton,alumini,pla,etiketa}`;
`s/{printim,shumice,dergesa,mostra,konsulence,magazina}`; `projects/{kafiteri,smoothie-bar,burger,pasticeri,akullore,kuti,qese,sushi}`;
`misc/{about,restaurant,restaurant-top,sushi,fries,sauce,bowls,drinks,burger,donuts,icecream,bag,bag2,cookies,cups,kraft-cups,sleeve,alu,alu2,smoothie,iced,box,noodles,delivery,salad,mealprep}`;
brand `brand/{logo,mark,wordmark,wordmark-white}.png`. Look at an image (Read tool) before using it somewhere.

**Home hero** (content.ts → buildHome): exactly 3 slides with ids `s1` (eco / kraft — `hero/kraft`), `s2` (cold drinks, cups & lids — `hero/smoothie`), `s3` (take-away containers — `hero/meal`). cms.ts derives placements `pl-s1…s3` from them.
**Staff ids:** `st-driton` (owner), `st-teuta` (manager), `st-blerta` (marketing), `st-ardita` (reception/sales), `st-valon` (orders/warehouse), `st-elira` (editor).
**Services:** `sv-mostra`, `sv-dizajn`, `sv-takim`. **Locations:** `loc-depo` (Depo Suhodoll, Mitrovicë — pickup, default), `loc-pr` (Pikë marrjeje Prishtinë — placeholder, pickup off).
**Shipping zones** (`settings.shippingZones`): `z1` Mitrovicë & rrethina (Mitrovicë, Vushtrri, Skenderaj, Zveçan) €2 · 1 day;
`z2` Prishtinë & qendra (Prishtinë, Fushë Kosovë, Obiliq, Podujevë, Lipjan, Drenas, Graçanicë) €3 · 1–2 days;
`z3` Pjesa tjetër e Kosovës (Pejë, Prizren, Gjakovë, Ferizaj, Gjilan, Istog, Klinë, Deçan, Rahovec, Suharekë, Malishevë, Kamenicë, Viti, Kaçanik, Shtime, Dragash, Junik, Leposaviq, Zubin Potok, Novobërdë, Shtërpcë, Hani i Elezit, Mamushë, Kllokot, Ranillug, Partesh) €4 · 1–3 days.
Free delivery: automatic shipping discount `d-dergesa50` (orders ≥ €50).
**Discount codes:** `MIRESEERDHE` (−10 % first order ≥ €30), `KAFE15` (−15 % on the café collection), auto BXGY "4 pako gota F95 → 1 pako kapakë falas", `BLACKFRIDAY` (scheduled), `VERA10` (expired), VIP draft.

## Design direction — storefront ("it's packaging")
Fresh, confident, B2B-friendly but playful. Think premium packaging brand, not a generic Shopify theme.
- Colours: brand green scale (`brand-50…900`, 600 = `#00723a`), accents `lime` / `lime-soft` / `lime-ink`, `pink` / `pink-soft` /
  `pink-ink`, `signal` (#00bf63). Neutrals: `paper` #f6f4ee (kraft-tinted page bg), `sand`, `sand-2`, `line`, `kraft` (#c9a26f),
  `ink` #0f1d16 (green-black), `ink-soft`, `muted`. Use lime and pink sparingly as accents (stickers, highlights, badges), green
  for primary actions, white cards on paper.
- Type: `font-display` = Bricolage Grotesque (use the `.display` class — bold, tight); `font-sans` = Manrope. Headlines with
  `*accent*` words via `<Accent>` (green + lime marker).
- Motifs you may use: die-cut/dashed "cut line" borders, kraft paper tones, rounded-3xl cards, pill buttons, sticker-style
  rotated badges ("−10 %", "E re"), per-piece price chips ("0,05 €/copë"). Product photos vary (dark studio + bright AI
  lifestyle) — show them in consistent square/4:5 frames with `object-cover` on a neutral background.
- B2B UX: always show **price per pack + per piece + pack size**, carton shortcut, volume tiers, stock in packs, "Kërko ofertë"
  for wholesale/logo print, free samples CTA, delivery promise (Mitrovicë 24h, Kosovo 1–3 days).
- Admin stays NEUTRAL (black/grey/white) exactly as in SELCA CMS v2 — never green/lime/pink inside `/admin` except a storefront
  preview card (`style={brandVars(settings.brandColor)}`).

## Rules
0. **Shell note:** the Bash tool's PATH may miss Git's coreutils. Start EVERY Bash command with `export PATH="/usr/bin:$PATH";`
   (or use Read/Grep/Glob tools).
1. Only edit the files listed in YOUR task (plus new files inside your own sub-folder). Do not modify shared/foundation files
   (`src/lib/*`, `src/store/*`, `src/i18n/*`, `src/App.tsx`, `src/index.css`, `src/components/ui/*`, `src/components/brand/Logo.tsx`,
   `src/admin/components/{kit,media}.tsx`) unless your task lists them. If you need something shared, write a local helper and say so
   in your report.
2. **Type-check** through the shared semaphore (RAM is tight; NEVER run tsc directly):

       export PATH="/usr/bin:$PATH"; cd "C:/Users/A/Documents/paketoje" && MSYS_NO_PATHCONV=1 node "C:/Users/A/AppData/Local/Temp/claude/C--Users-A-Documents-paketoje/6125fcc1-b4da-4aaf-b849-1fd5d3069213/scratchpad/imgtools/run.mjs" node node_modules/typescript/bin/tsc --noEmit

   It must show no errors in YOUR files (others work in parallel — ignore theirs).
3. **Visual QA (required for UI work).** Screenshot tool (through the semaphore; keep `MSYS_NO_PATHCONV=1`):

       export PATH="/usr/bin:$PATH"; cd "C:/Users/A/AppData/Local/Temp/claude/C--Users-A-Documents-paketoje/6125fcc1-b4da-4aaf-b849-1fd5d3069213/scratchpad/imgtools" && MSYS_NO_PATHCONV=1 node run.mjs node shot.mjs <path> <name> [width=1440] [height=900] [viewport|segments|full] [nSegments] [--pre "<js>"] [--post "<js>"] [--wait ms]

   → writes `../shots/<name>.png` (segments: `<name>-1.png`…). Open it with the Read tool and fix what looks off. Every run is a
   fresh browser profile, so the demo data is re-seeded from the current source. Presets (pass as `--pre "$(cat auth.js)"`):
   `auth.js` (CMS logged in, Albanian), `auth-en.js`, `auth-sr.js`, `cart.js` (Albanian, 4 cart lines incl. a logo-print line,
   wishlist, recently viewed), `cart-en.js`. Prefix screenshot names with your agent id. Check desktop 1440×900 AND mobile
   390×844, and at least one screen in English and one in Serbian.
4. Quality bar: real-client demo. Real data from the store, no lorem ipsum, no leftover SELCA / Montenegro / doors / m² /
   installation wording, consistent spacing, hover/empty states, responsive to 390px. Match the surrounding code style.
5. Final report (≤ 300 words): files changed, notable decisions, shared-code issues found, anything incomplete.
