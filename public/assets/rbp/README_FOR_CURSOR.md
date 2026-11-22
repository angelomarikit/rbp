# RBP — Cursor Website Asset Pack

This pack is sourced from the user-uploaded materials and the five approved website mockups.

## Folders
- `branding/`: RBP original logo and an association mark. Use `rbp-logo-original.png` as the primary brand logo.
- `romell/`: Romell portrait, original action photo, and seminar poster. Do NOT use Romell's portrait on every page.
- `products/`: Jewelry photography CROPPED FROM AI-GENERATED WEB MOCKUPS, not actual supplier product photos.
- `showcase/`: Piercing examples CROPPED FROM AI-GENERATED MOCKUPS; not verified photos of real clients.
- `events/`: Event imagery CROPPED FROM AI-GENERATED MOCKUPS; not documentation of actual attendance.
- `banners/`: Crops of mockup imagery for hero/banner sections.
- `catalogs/`: User-uploaded product sheets and price references, generally composite images.
- `references/`: Third-party / reference materials; NOT RBP branding.
- `design-references/`: The 5 complete approved mockup screenshots for visual fidelity.

## IMPORTANT USAGE RULES
1. Never treat a mockup crop as an original photo of a real client, event, or actual stock item. Use only as a temporary design placeholder until owner-approved authentic media is supplied.
2. Do not infer verified inventory, pricing, reviews, events, credentials, or material claims from AI-generated mockups. Confirm against actual catalogs and the owner.
3. Use the original uploaded RBP logo for the brand. Do not substitute the Arzey or association logo.
4. Use image paths relative to `public/assets/rbp/` if this pack is copied there.
5. For full-width website sections, use responsive `object-fit: cover` and meaningful focal points.
6. Keep text, buttons, cart interactions, pricing, product names, and checkout forms as real DOM/React components. Do not place full mockup images as website UI.
7. Font preference: Cloister Black or Old English Text MT for headings. No font binaries are included.
8. Preserve existing app routing, Supabase schema, cart logic, and payment flows.

## Example Cursor instruction
> Inspect `public/assets/rbp/README_FOR_CURSOR.md` and the five images in `design-references/`. Recreate the approved Figma website using real responsive React components. Use individual assets from branding, romell, banners, products, showcase, and events. Do not use full screenshots as page backgrounds or claim placeholder event/client images are authentic. Match black/orange Gothic brand styling. Keep existing functionality intact.
