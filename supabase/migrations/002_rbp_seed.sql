-- Seed mirrors src/data/products.ts (run after 001)
insert into products (slug, name, price_cents, category, material, image_path, specs, description, review_count, rating)
values
  ('crystal-navel-barbell', 'Crystal Navel Barbell', 29500, 'Navel Jewelry', 'Surgical Stainless 316L', 'products/navel-barbell-hero.jpg',
    '{"material":"Surgical Stainless Steel 316L","gauge":"14G (1.6 mm)","barLength":"10 mm","gem":"Cubic Zirconia (High Grade)","finish":"Silver (Polished)"}'::jsonb,
    'This Crystal Navel Barbell is crafted from high-quality Surgical Stainless Steel 316L.', 28, 5.0),
  ('classic-navel-barbell-gem', 'Classic Navel Barbell – Gem', 18500, 'Navel Jewelry', 'Surgical Stainless 316L', 'products/product-01.jpg', null, null, null, null),
  ('hinged-clicker-crystal', 'Hinged Clicker – Crystal', 25500, 'Hinged Clickers', 'Surgical Stainless 316L', 'products/product-02.jpg', null, null, null, null),
  ('circular-barbell-horseshoe', 'Circular Barbell – Horseshoe', 16500, 'Segment Rings', 'Surgical Stainless 316L', 'products/product-03.jpg', null, null, null, null),
  ('labret-stud-gem', 'Labret Stud – Gem', 19500, 'Labret / Lip', 'Surgical Stainless 316L', 'products/product-04.jpg', null, null, null, null),
  ('eyebrow-barbell-curve', 'Eyebrow Barbell – Curve', 16500, 'Eyebrow', 'Surgical Stainless 316L', 'products/product-05.jpg', null, null, null, null),
  ('segment-ring-classic', 'Segment Ring – Classic', 14500, 'Segment Rings', 'Titanium', 'products/product-06.jpg', null, null, null, null),
  ('tongue-barbell-classic', 'Tongue Barbell – Classic', 17500, 'Tongue Barbells', 'Surgical Stainless 316L', 'products/product-07.jpg', null, null, null, null),
  ('labret-triple-gem', 'Labret – Triple Gem', 29500, 'Labret / Lip', '14K Gold Plated', 'products/product-08.jpg', null, null, null, null),
  ('ear-hoop-classic-pair', 'Ear Hoop – Classic (Pair)', 22000, 'Ear Jewelry', 'Surgical Stainless 316L', 'products/product-09.jpg', null, null, null, null),
  ('navel-barbell-opal-flower', 'Navel Barbell – Opal Flower', 32000, 'Navel Jewelry', 'Titanium', 'products/product-10.jpg', null, null, null, null),
  ('labret-spike', 'Labret – Spike', 17500, 'Labret / Lip', 'Surgical Stainless 316L', 'products/product-11.jpg', null, null, null, null),
  ('ear-tunnel-stainless', 'Ear Tunnel – Stainless', 35000, 'Ear Jewelry', 'Surgical Stainless 316L', 'products/product-12.jpg', null, null, null, null)
on conflict (slug) do nothing;