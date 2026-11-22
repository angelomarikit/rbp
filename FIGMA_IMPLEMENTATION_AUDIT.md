# Figma Implementation Audit — Romell Body Piercing

**Date:** 2026-03-22  
**Figma file:** `PmekHMSVy1la8jbcWWEQds`  
**Frames:** Home `3:2`, Collections `3:8`, Product `3:12`, Checkout `3:17`, Events `3:21`

## Executive summary

The initial build delivers routable pages and basic cart logic but **does not reproduce the approved Figma compositions**. Layouts were implemented as responsive Tailwind grids with approximate content, not measured frame structure. Several **functional defects** violate e-commerce integrity (fake order confirmation, cart cleared without persistence, booking routed to checkout/events). **Fabricated marketing content** (reviews, testimonials, unverified events) must be removed or labeled as CMS placeholders.

---

## Global / design system

| Issue | Severity | Figma expectation | Current code | Correction |
|-------|----------|-------------------|--------------|------------|
| Gothic display font | High | Cloister Black / Old English for headlines | `UnifrakturMaguntia` only via Google Fonts | Load OFL Gothic with documented fallback chain; verify computed `font-family` in browser |
| Page max-width / padding | High | Full-width 1260–1302px artboards, minimal gutters | `sm:px-8`, flex-wrap header, `max-w-sm` on copy | Remove arbitrary max-width on desktop sections; use Figma ratio columns |
| Background / accent tokens | Medium | `#010101`, `#ff8500`, `#bd6e00` borders, cream labels | Mostly aligned in `tailwind.config.js` | Tune hero/header to match screenshots |
| Orange dividers | Medium | 1px `#bc6000` / `#d56b00` full bleed | Partial | Full-bleed dividers per section |
| Generic sections vs compositions | **Critical** | Layered hero (127px strip + copy + 756px photo + 176px benefits) | Simplified 2-column grid | Rebuild hero per frame metadata |
| Romell portrait overuse | Low | Logo only in header; portrait not on every page | Compliant | Keep portrait only on Events process if needed |

---

## Header & navigation

| Issue | Severity | Figma | Current | Correction |
|-------|----------|-------|---------|------------|
| Home header height | High | 54px bar; logo 130×132 overlapping at (40,4) | `min-h-[132px]`, logo in flow | Absolute logo; 54px nav row offset |
| Per-page header variants | High | Distinct layouts (collections 111px, product 133px two-tier, etc.) | Single component, approximate | Variant layouts matching metadata |
| Wordmark | Medium | Image/wordmark in collections (530×47), not plain text | Text `font-display` | Wordmark from logo asset or styled per Figma |
| Mobile navigation | **Critical** | Functional nav at 375px | Wrapped links, no menu | Hamburger + drawer, focus trap |
| Active states | Medium | Orange underline (2px) or 8px collections tab | Partial | Match per variant |
| Book / Shop links | High | Book → booking flow | `/events`, `/checkout` | `/book` appointment form |

---

## Homepage (`3:2`)

| Issue | Severity | Correction |
|-------|----------|------------|
| Hero composition | **Critical** | Restore left ambience strip, fixed hero height 309px, ear photo right 60%, benefits panel 176×220 |
| Studio sign / dual banner | Medium | Use `homepage-studio-sign.jpg` in left strip; ear banner for main photo |
| Gothic headline scale | High | Match ~67px / 61px / 75px line sizes from Figma |
| Featured collections | High | Six cards ~194×126, single row desktop, `border #bd6e00` |
| Client results | Medium | Five fixed-aspect columns, not equal flex |
| Events block | Medium | 417×166 featured card + 150px trophy/group stack |
| Bottom CTA | Medium | Skull ornaments + centered tagline + gradient button |
| Book CTA | High | Route to `/book` |

---

## Collections (`3:8`)

| Issue | Severity | Correction |
|-------|----------|------------|
| Hero split | High | Copy left ~478px image right 782×199 |
| Sidebar width | Medium | 187px filter panel |
| Product grid | High | 6 columns × 2 rows, cards ~169×217 | `xl:grid-cols-6`, fixed image 135px |
| Filters | Medium | Category/material/length/gauge | Wire length/gauge to product specs |
| Search / sort | Low | Functional but unstyled vs Figma | Match control heights 32px |

---

## Product details (`3:12`)

| Issue | Severity | Correction |
|-------|----------|------------|
| Layout | High | Thumbs 93px column + 541×461 main + spec column | Grid from metadata |
| **Fake reviews** | **Critical** | `★★★★★ (28 Reviews)` tab | Remove counts; tab “Reviews” with empty/CMS state |
| Gem variants | Medium | Affect cart `variant_key` | Already partial; ensure label in line item |
| Breadcrumb | Low | Icon + path | Add home icon |

---

## Checkout (`3:17`)

| Issue | Severity | Correction |
|-------|----------|------------|
| Two-panel layout | High | ~687px cart + 522px form | `lg:grid-cols-[minmax(0,687px)_522px]` |
| **Fake local orders** | **Critical** | `local-${Date.now()}` success without DB | Block checkout if Supabase not configured |
| **Non-atomic insert** | **Critical** | Order then items (two calls) | `create_order_with_items` RPC |
| Cart cleared early | **Critical** | `clearCart()` on any `ok` | Clear only after verified RPC success |
| Validation | High | All address fields required | Full validation + duplicate submit guard |
| Payment UX | High | Manual GCash/Maya/etc. | Confirmation = **payment pending**, not paid |
| Responsive table | Medium | Columns Product/Price/Qty/Total | Preserve on desktop; stack mobile |

---

## Events (`3:21`)

| Issue | Severity | Correction |
|-------|----------|------------|
| **Invented testimonials** | **Critical** | Named quotes | Remove or `[CMS PLACEHOLDER]` |
| **Unverified upcoming dates** | High | 2025/2026 events | Label verified vs placeholder |
| Book CTA | High | → `/book` | Fix routes |
| Carousel | Medium | 6 tiles + arrows + dots | Keep; match heights 111px |
| Piercing process | Medium | Image sequence | Use `romell-piercing-client-action-original.png` |

---

## Assets (`public/assets/rbp/`)

| Finding | Action |
|---------|--------|
| Product/showcase/event JPGs are mockup crops per `README_FOR_CURSOR.md` | Accept as placeholders; do not claim authenticity |
| `catalogs/*.png` are full sheets | **Do not** use as product heroes |
| Logo `branding/rbp-logo-original.png` | Correct primary logo |
| `design-references/*.png` | Use for QA comparison baselines |
| Missing: wordmark-only export, skull ornaments, ornamental dividers | Document in unresolved list; approximate with CSS gradients |

---

## Supabase

| Issue | Severity | Correction |
|-------|----------|------------|
| RLS insert orders/items wide open | High | RPC `security definer` + validated insert only |
| No booking table | Medium | Optional `booking_requests` insert on `/book` |
| `product_id` text on order_items | Low | Accept for slug/id flexibility |
| Seed duplicates featured product | Low | Document run order |

---

## Routing

| Route | Status |
|-------|--------|
| `/` | OK |
| `/collections` | OK |
| `/products/:slug` | OK |
| `/checkout` | OK |
| `/events` | OK |
| `/book` | **Missing** — required for booking CTAs |

---

## Proposed implementation order

1. Checkout integrity + RPC + booking route  
2. Global header + fonts + full-width shell  
3. Homepage → Collections → PDP → Checkout layout → Events  
4. QA screenshots at 1268/1302/799 widths + mobile  
5. Deliverable markdown reports  

---

## Unresolved / missing assets (initial)

- Figma ornamental skull/footer graphics (use CSS placeholder until owner supplies SVG/PNG)
- Horizontal wordmark asset (using logo + typography interim)
- Verified event calendar CMS feed
- Licensed Cloister Black webfont files (owner to supply if required instead of Unifraktur)
- High-resolution hero source beyond mockup crops