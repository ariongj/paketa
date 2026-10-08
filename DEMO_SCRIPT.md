# Paketoje — demo walkthrough (≈ 15 min)

Before the meeting: `npm run dev`, open http://localhost:3380 and http://localhost:3380/admin side by side
(two windows). Optional: CMS → Konfigurimet → Demo data → reset, so the dashboard shows today's activity.

## 1. Storefront (5 min)
1. **Homepage** — Paketoje brand (logo, green/lime/pink), hero slides, free delivery ≥ €50 bar, categories with
   "from €0.04 / piece", made-to-order (logo print) and "coming soon" (aluminium, PLA) ranges.
2. **Language switch** SQ → EN → SR in the top bar (whole site + product texts).
3. **Product: Gota plastike F95 – 400 ml** — price per pack **and** per piece, pack/carton sizes, "+1 karton",
   pieces calculator ("1.200 copë" → packs), volume tiers (10 packs −5 %, carton −10 %), "Përshtatet me" lids/straws,
   logo-print add-on (auto 1 carton, 7–10 days).
4. **Quote item** (Gota letre me logo) → request-a-quote form; **coming soon** category → notify form.
5. **Cart** — tier badges, "add 3 packs and save 5 %" nudge, codes `MIRESEERDHE` / `KAFE15`, free-delivery progress.
6. **Checkout** — "Blej si biznes" (company + NUI), Kosovo city by delivery zone, depot pickup in Suhodoll,
   cash on delivery / bank transfer / card (simulated) → place the order.

## 2. CMS (8 min)
1. **Live order** — the order you just placed appears instantly (notification + Porositë), status flow incl.
   "Në printim" for logo orders, printable Kosovo invoice (NUI, TVSH 18 %).
2. **Produktet** — edit F95 400 ml: pack size, carton, volume tiers, logo-print price, stock in packs.
3. **Zbritjet / Rritja** — the BXGY "4 packs cups → 1 pack lids free" rule, welcome code, scheduled Black Friday.
4. **Online Store → homepage builder** — edit a hero slide, preview, publish (versions kept).
5. **Kontaktet & Terminet** — free-sample requests, B2B quote builder (by carton), sample visits calendar.
6. **Konfigurimet** — delivery zones & fees, payments, languages, roles (switch role in the account menu).

## 3. Close (2 min)
What is real (37 products, photos, prices, address, phone, NUI, policies) vs. what to confirm
(pack/carton sizes, stock, VAT no., bank, delivery fees) — see README. Next steps: hosting + database,
bank card gateway, ATK fiscalisation, own photography, launch on paketoje.com.
