# Figma vs App — Comparison Notes

Viewports match Figma artboard widths where noted.

## Home (1268px)

**Match:** Black/orange palette, logo placement, hero ear photo, benefits column, six collection cards, client strip + events card structure, bottom CTA strip.

**Gaps:** Left studio strip visibility depends on `lg` breakpoint; skull/footer ornaments absent; nav vertical alignment vs overlapping 132px logo needs minor offset tuning.

## Collections (1260px)

**Match:** Hero typography, orange Gothic title, sidebar + grid pattern.

**Gaps:** Product grid may wrap to fewer columns below `xl`; wordmark is live text not Figma image asset.

## Product (1262px)

**Match:** Breadcrumb, thumb column, hero image, spec list, gem swatches, orange ATC.

**Gaps:** Header two-tier spacing; search bar alignment; tab underline weights.

## Checkout (1302px)

**Match:** Split hero with jewelry photo, two-column cart/form, payment method tiles, GCash default.

**Gaps:** Cart panel border radii; progress step visual (numbered circles) simplified; table gutters.

## Events (799px)

**Match:** Narrow layout, hero expo image, four-column featured row + upcoming panel, process section, showcase row, booking card.

**Gaps:** Decorative flourishes around section titles; carousel dot styling.

## Method

1. Baseline: exported approved mockups in `figma-reference-*.png`
2. App: `app-*.png` from `npm run preview` + browser screenshots at matching widths
3. Manual visual review (not automated pixel diff)