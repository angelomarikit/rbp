# Romell Body Piercing Website

React + TypeScript + Tailwind storefront matching the approved Figma design.

## Setup

```bash
npm install
cp .env.example .env.local
# Add your Supabase URL and anon key
npm run dev
```

Apply SQL migrations in `supabase/migrations/` to your Supabase project for live catalog and checkout persistence.

## Gothic fonts

Headlines use Cloister Black / Old English Text MT when installed locally, with UnifrakturMaguntia (Google Fonts) as fallback.

## Assets

Brand and page imagery live under `public/assets/rbp/`. See `public/assets/rbp/README_FOR_CURSOR.md` for usage rules.