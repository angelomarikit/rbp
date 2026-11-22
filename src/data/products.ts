import type { GemVariant, Product } from './types.ts'

export const FEATURED_PRODUCT_SLUG = 'crystal-navel-barbell'

export const GEM_VARIANTS: GemVariant[] = [
  { key: 'clear', label: 'Clear', color: '#e8e8e8' },
  { key: 'rose-gold', label: 'Rose Gold', color: '#b76e79' },
  { key: 'gold', label: 'Gold', color: '#d4af37' },
  { key: 'black', label: 'Black', color: '#2a2a2a' },
  { key: 'multicolor', label: 'Multicolor', color: '#e85d9c' },
  { key: 'green', label: 'Green', color: '#3d9a5f' },
  { key: 'blue', label: 'Blue', color: '#5a9fd4' },
  { key: 'pink', label: 'Pink', color: '#e87ab8' },
  { key: 'red', label: 'Red', color: '#c44545' },
  { key: 'purple', label: 'Purple', color: '#9b6fd4' },
]

export const PRODUCTS: Product[] = [
  {
    id: '1',
    slug: 'classic-navel-barbell-gem',
    name: 'Classic Navel Barbell – Gem',
    priceCents: 18500,
    category: 'Navel Jewelry',
    material: 'Surgical Stainless 316L',
    imagePath: 'products/product-01.jpg',
  },
  {
    id: '2',
    slug: 'hinged-clicker-crystal',
    name: 'Hinged Clicker – Crystal',
    priceCents: 25500,
    category: 'Hinged Clickers',
    material: 'Surgical Stainless 316L',
    imagePath: 'products/product-02.jpg',
  },
  {
    id: '3',
    slug: 'circular-barbell-horseshoe',
    name: 'Circular Barbell – Horseshoe',
    priceCents: 16500,
    category: 'Segment Rings',
    material: 'Surgical Stainless 316L',
    imagePath: 'products/product-03.jpg',
  },
  {
    id: '4',
    slug: 'labret-stud-gem',
    name: 'Labret Stud – Gem',
    priceCents: 19500,
    category: 'Labret / Lip',
    material: 'Surgical Stainless 316L',
    imagePath: 'products/product-04.jpg',
  },
  {
    id: '5',
    slug: 'eyebrow-barbell-curve',
    name: 'Eyebrow Barbell – Curve',
    priceCents: 16500,
    category: 'Eyebrow',
    material: 'Surgical Stainless 316L',
    imagePath: 'products/product-05.jpg',
  },
  {
    id: '6',
    slug: 'segment-ring-classic',
    name: 'Segment Ring – Classic',
    priceCents: 14500,
    category: 'Segment Rings',
    material: 'Titanium',
    imagePath: 'products/product-06.jpg',
  },
  {
    id: '7',
    slug: 'tongue-barbell-classic',
    name: 'Tongue Barbell – Classic',
    priceCents: 17500,
    category: 'Tongue Barbells',
    material: 'Surgical Stainless 316L',
    imagePath: 'products/product-07.jpg',
  },
  {
    id: '8',
    slug: 'labret-triple-gem',
    name: 'Labret – Triple Gem',
    priceCents: 29500,
    category: 'Labret / Lip',
    material: '14K Gold Plated',
    imagePath: 'products/product-08.jpg',
  },
  {
    id: '9',
    slug: 'ear-hoop-classic-pair',
    name: 'Ear Hoop – Classic (Pair)',
    priceCents: 22000,
    category: 'Ear Jewelry',
    material: 'Surgical Stainless 316L',
    imagePath: 'products/product-09.jpg',
  },
  {
    id: '10',
    slug: 'navel-barbell-opal-flower',
    name: 'Navel Barbell – Opal Flower',
    priceCents: 32000,
    category: 'Navel Jewelry',
    material: 'Titanium',
    imagePath: 'products/product-10.jpg',
  },
  {
    id: '11',
    slug: 'labret-spike',
    name: 'Labret – Spike',
    priceCents: 17500,
    category: 'Labret / Lip',
    material: 'Surgical Stainless 316L',
    imagePath: 'products/product-11.jpg',
  },
  {
    id: '12',
    slug: 'ear-tunnel-stainless',
    name: 'Ear Tunnel – Stainless',
    priceCents: 35000,
    category: 'Ear Jewelry',
    material: 'Surgical Stainless 316L',
    imagePath: 'products/product-12.jpg',
  },
  {
    id: 'featured',
    slug: FEATURED_PRODUCT_SLUG,
    name: 'Crystal Navel Barbell',
    priceCents: 29500,
    category: 'Navel Jewelry',
    material: 'Surgical Stainless 316L',
    imagePath: 'products/navel-barbell-hero.jpg',
    reviewCount: 28,
    rating: 5,
    specs: {
      material: 'Surgical Stainless Steel 316L',
      gauge: '14G (1.6 mm)',
      barLength: '10 mm',
      gem: 'Cubic Zirconia (High Grade)',
      finish: 'Silver (Polished)',
    },
    description:
      'This Crystal Navel Barbell is crafted from high-quality Surgical Stainless Steel 316L, known for its strength, corrosion resistance, and skin-friendly properties. It features a brilliant cubic zirconia gem that adds a clean, elegant look—perfect for daily wear or special occasions.',
  },
]

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug)
}

export const CATEGORY_FILTERS = [
  { id: 'navel', label: 'Navel Jewelry', count: 48 },
  { id: 'tongue', label: 'Tongue Barbells', count: 26 },
  { id: 'hinged', label: 'Hinged Clickers', count: 36 },
  { id: 'segment', label: 'Segment Rings', count: 28 },
  { id: 'labret', label: 'Labret / Lip', count: 40 },
  { id: 'eyebrow', label: 'Eyebrow', count: 18 },
  { id: 'ear', label: 'Ear Jewelry', count: 52 },
  { id: 'accessories', label: 'Accessories', count: 12 },
]

export const MATERIAL_FILTERS = [
  { id: '316l', label: 'Surgical Stainless 316L', count: 93 },
  { id: 'titanium', label: 'Titanium', count: 27 },
  { id: 'gold', label: '14K Gold Plated', count: 18 },
  { id: 'anodized', label: 'Anodized', count: 15 },
]