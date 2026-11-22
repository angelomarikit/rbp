# Design Differences Fixed (Recovery Pass)

Compared against approved Figma frames and `qa/figma-comparison/figma-reference-*.png`.

## Global

| Area | Before | After |
|------|--------|-------|
| Full-width layout | Generic padded containers | `figma-container`, reduced arbitrary max-width; hero uses Figma column ratios |
| Gothic headings | Unifraktur only | Stack: Cloister Black → Old English → Unifraktur (loaded in `index.html`) |
| Mobile nav | Wrapped links only | `MobileNav` drawer on all header variants |
| Booking CTAs | Routed to `/events` or `/checkout` | `/book` appointment form |
| Overflow | Possible horizontal scroll | `overflow-x-hidden` on root |

## Homepage (`3:2`)

- Rebuilt hero: 127px ambience strip, copy column, full-height ear banner, 176px benefits panel.
- Gothic headline colors `#ff8610` / `#edceb1` per Figma.
- Six-across collection row at `xl` grid.
- Client results use Figma-width classes (129–113px).
- Events block proportions aligned (417px card + 150px stack).

**Remaining visual gap:** Footer skull ornaments not in asset pack — CSS gradient stand-ins only.

## Collections (`3:8`)

- Hero split (copy + `homepage-studio-sign` banner).
- Sidebar fixed ~187px; product grid `xl:grid-cols-6`.
- Filters/search/sort retained and styled closer to frame.

**Remaining:** Wordmark still typography-based, not Figma raster wordmark asset.

## Product (`3:12`)

- Removed fabricated star rating and review count.
- Reviews tab shows CMS placeholder copy.
- Two-column gallery + specs layout tightened.

**Remaining:** Spec row icons and exact 541×461 hero box need pixel tuning.

## Checkout (`3:17`)

- Two-panel layout proportions (`687px` / `522px` targets).
- Hero split with checkout jewelry banner.

**Remaining:** Cart table column alignment vs Figma; checkout stepper styling partial.

## Events (`3:21`)

- 799px-oriented hero split.
- Featured events marked `[CMS — verify with owner]`.
- Testimonials removed; CMS placeholder panel.
- Upcoming list labeled placeholder.
- Book CTAs → `/book`.

## Comparison artifacts

| Page | Figma baseline | App capture |
|------|----------------|-------------|
| Home | `figma-reference-home.png` | `app-home-1268.png` |
| Collections | `figma-reference-collections.png` | `app-collections-1260.png` |
| Product | `figma-reference-product.png` | `app-product-1262.png` |
| Checkout | `figma-reference-checkout.png` | `app-checkout-1302.png` |
| Events | `figma-reference-events.png` | `app-events-799.png` |

See `qa/figma-comparison/COMPARISON_NOTES.md` for per-page delta notes.