# Functional QA Report

**Build:** `npm run build` — pass (2026-03-22 recovery pass)  
**Preview:** `npm run preview` @ `127.0.0.1:4173` — smoke-tested in browser automation

## Routes

| Route | Loads | Notes |
|-------|-------|-------|
| `/` | Yes | |
| `/collections` | Yes | Filters, search, sort exercised in browser snapshot |
| `/products/crystal-navel-barbell` | Yes | Variants, qty, ATC present |
| `/checkout` | Yes | Empty cart state verified |
| `/events` | Yes | |
| `/book` | Yes | New booking flow |

## Commerce

| Feature | Status | Evidence |
|---------|--------|----------|
| Add to cart | Pass | Collections page buttons in a11y tree |
| Cart badge | Pass | Reflects count on header |
| Cart persistence | Pass | `localStorage` key `rbp_cart_v1` |
| Qty update | Pass | Stepper on PDP & checkout rows |
| Remove line | Pass | Trash control wired |
| Shipping selection | Pass | Updates totals when cart non-empty |
| Empty cart checkout | Pass | Submit disabled; shipping total 0 when empty |
| Field validation | Pass | All required customer/shipping fields in `useCheckout.validate` |
| Duplicate submit guard | Pass | `submitLock` ref |
| Fake local order IDs | **Removed** | No success without Supabase + RPC |
| Cart clear timing | Pass | Only after successful RPC |
| Payment confirmation | Pass | UI states `payment_pending`; no auto-confirm |
| Atomic order write | Pass (when migrated) | `create_order_with_items` RPC in `003_create_order_rpc.sql` |

## Supabase (requires your project)

1. Apply `supabase/migrations/001`–`004` including RPC.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`.
3. **Not run in this session:** live insert against your database (no credentials in workspace).

Until configured, checkout and booking show explicit configuration errors — **not** fake success.

## Security

| Item | Status |
|------|--------|
| Direct anon insert orders/items | Dropped in migration 003 (use RPC) |
| RLS on products | Public read |
| Booking insert | Anon insert allowed (tighten per your policy) |

## Responsive (spot check)

| Width | Check |
|-------|-------|
| 1268 / 1260 / 1302 / 799 | Captured desktop comparison PNGs |
| 375 | Mobile nav via Menu button (manual follow-up recommended) |

## Console / TypeScript

- TypeScript build: **0 errors**
- Browser console on preview: not fully logged this pass — recommend owner spot-check

## Not claimed as tested

- End-to-end Supabase order insert on production project
- Payment provider webhooks
- Automated pixel-diff CI