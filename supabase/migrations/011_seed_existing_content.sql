-- 011 — Preserve the current catalog and copy live storefront content
-- Products already loaded by 002 are left in place (on conflict do nothing).
-- Prices are not overwritten.
-- No J&T rates are inserted.

insert into public.products (slug, name, price_cents, category, material, image_path, specs, description, review_count, rating, status, published)
values
  ('crystal-navel-barbell', 'Crystal Navel Barbell', 29500, 'Navel Jewelry', 'Surgical Stainless 316L', 'products/navel-barbell-hero.jpg',
    '{"material":"Surgical Stainless Steel 316L","gauge":"14G (1.6 mm)","barLength":"10 mm","gem":"Cubic Zirconia (High Grade)","finish":"Silver (Polished)"}'::jsonb,
    'This Crystal Navel Barbell is crafted from high-quality Surgical Stainless Steel 316L, known for its strength, corrosion resistance, and skin-friendly properties. It features a brilliant cubic zirconia gem that adds a clean, elegant look—perfect for daily wear or special occasions.',
    28, 5.0, 'active', true),
  ('classic-navel-barbell-gem', 'Classic Navel Barbell – Gem', 18500, 'Navel Jewelry', 'Surgical Stainless 316L', 'products/product-01.jpg', null, null, null, null, 'active', true),
  ('hinged-clicker-crystal', 'Hinged Clicker – Crystal', 25500, 'Hinged Clickers', 'Surgical Stainless 316L', 'products/product-02.jpg', null, null, null, null, 'active', true),
  ('circular-barbell-horseshoe', 'Circular Barbell – Horseshoe', 16500, 'Segment Rings', 'Surgical Stainless 316L', 'products/product-03.jpg', null, null, null, null, 'active', true),
  ('labret-stud-gem', 'Labret Stud – Gem', 19500, 'Labret / Lip', 'Surgical Stainless 316L', 'products/product-04.jpg', null, null, null, null, 'active', true),
  ('eyebrow-barbell-curve', 'Eyebrow Barbell – Curve', 16500, 'Eyebrow', 'Surgical Stainless 316L', 'products/product-05.jpg', null, null, null, null, 'active', true),
  ('segment-ring-classic', 'Segment Ring – Classic', 14500, 'Segment Rings', 'Titanium', 'products/product-06.jpg', null, null, null, null, 'active', true),
  ('tongue-barbell-classic', 'Tongue Barbell – Classic', 17500, 'Tongue Barbells', 'Surgical Stainless 316L', 'products/product-07.jpg', null, null, null, null, 'active', true),
  ('labret-triple-gem', 'Labret – Triple Gem', 29500, 'Labret / Lip', '14K Gold Plated', 'products/product-08.jpg', null, null, null, null, 'active', true),
  ('ear-hoop-classic-pair', 'Ear Hoop – Classic (Pair)', 22000, 'Ear Jewelry', 'Surgical Stainless 316L', 'products/product-09.jpg', null, null, null, null, 'active', true),
  ('navel-barbell-opal-flower', 'Navel Barbell – Opal Flower', 32000, 'Navel Jewelry', 'Titanium', 'products/product-10.jpg', null, null, null, null, 'active', true),
  ('labret-spike', 'Labret – Spike', 17500, 'Labret / Lip', 'Surgical Stainless 316L', 'products/product-11.jpg', null, null, null, null, 'active', true),
  ('ear-tunnel-stainless', 'Ear Tunnel – Stainless', 35000, 'Ear Jewelry', 'Surgical Stainless 316L', 'products/product-12.jpg', null, null, null, null, 'active', true)
on conflict (slug) do nothing;

insert into public.collections (name, featured, sort_order, image_path)
values
  ('Navel Jewelry', true, 1, 'products/product-01.jpg'),
  ('Tongue Barbells', true, 2, 'products/product-07.jpg'),
  ('Hinged Clickers', true, 3, 'products/product-02.jpg'),
  ('Segment Rings', true, 4, 'products/product-06.jpg'),
  ('Eyebrow', true, 5, 'products/product-05.jpg'),
  ('Ear Jewelry', true, 6, 'products/product-09.jpg'),
  ('Labret / Lip', false, 7, 'products/product-04.jpg')
on conflict (slug) do nothing;

insert into public.product_collections (product_id, collection_id)
select p.id, c.id
from public.products p
join public.collections c on c.name = p.category
on conflict do nothing;

insert into public.product_images (product_id, storage_path, sort_order)
select p.id, p.image_path, 0
from public.products p
where p.image_path is not null
  and not exists (
    select 1 from public.product_images i
    where i.product_id = p.id and i.storage_path = p.image_path
  );

insert into public.variation_options (key, name, sort_order)
values
  ('length', 'Length', 1),
  ('size', 'Size', 2),
  ('color', 'Color', 3),
  ('material', 'Material', 4),
  ('gauge', 'Gauge', 5)
on conflict (key) do nothing;

insert into public.variation_option_values (option_id, value, sort_order)
select o.id, v.value, v.sort_order
from public.variation_options o
join (
  values
    ('gauge', '14G (1.6 mm)', 1),
    ('gauge', '16G', 2),
    ('length', '8 mm', 1),
    ('length', '10 mm', 2),
    ('color', 'Clear', 1),
    ('color', 'Pink', 2),
    ('color', 'Purple', 3),
    ('color', 'Blue', 4),
    ('color', 'Red', 5),
    ('color', 'Black', 6),
    ('material', 'Surgical Stainless 316L', 1),
    ('material', 'Titanium', 2),
    ('material', '14K Gold Plated', 3)
) as v(option_key, value, sort_order) on v.option_key = o.key
on conflict (option_id, value) do nothing;

insert into public.events (slug, title, summary, body, image_path, event_date, location, kind, published, sort_order)
values
  ('philippine-tattoo-expo-2025', 'Philippine Tattoo Expo 2025',
    'Romell Body Piercing joins the Philippine Tattoo Expo with a studio booth, jewelry, and live piercing.',
    '["Romell Body Piercing is on the floor at the Philippine Tattoo Expo 2025, held at SMX Convention Center in Pasay from May 16 to 18.","The booth carries the studio jewelry selection and a place to talk through placements, aftercare, and what to expect before a piercing.","The expo brings tattoo artists, piercers, and collectors into one hall."]'::jsonb,
    'events/featured-event-1.jpg', 'May 16–18, 2025', 'SMX Convention Center, Pasay', 'featured', true, 1),
  ('rbp-body-piercing-seminar', 'RBP Body Piercing Seminar',
    'A one-day seminar in Quezon City on studio practice, jewelry, and client care.',
    '["The RBP Body Piercing Seminar is a one-day session in Quezon City on March 22, 2025.","The day covers consultation, jewelry selection, and how a client is walked through healing.","Seats are limited. The studio confirms the schedule after a booking request."]'::jsonb,
    'events/featured-event-2.jpg', 'Mar 22, 2025', 'Quezon City, Metro Manila', 'featured', true, 2),
  ('body-piercers-association-convention', 'Body Piercers Association Convention',
    'RBP takes part in the Body Piercers Association convention in Manila.',
    '["Romell Body Piercing joins the Body Piercers Association of the Philippines for its convention in Manila on February 8 and 9, 2025.","The convention is where member studios compare practice and standards."]'::jsonb,
    'events/featured-event-3.jpg', 'Feb 8–9, 2025', 'Manila, Philippines', 'featured', true, 3),
  ('pbf-tattoo-piercing-expo', 'PBF Tattoo & Piercing Expo',
    'RBP is scheduled for the PBF Tattoo & Piercing Expo in January 2026.',
    '["Romell Body Piercing is lined up for the PBF Tattoo & Piercing Expo, January 23 to 25, 2026.","Booth details will be added when the organizer confirms them."]'::jsonb,
    'events/events-hero.jpg', 'Jan 23–25, 2026', 'To be announced', 'upcoming', true, 4),
  ('rbp-piercing-workshop', 'RBP Piercing Workshop',
    'A hands-on workshop at the studio on February 14, 2026.',
    '["The RBP Piercing Workshop is set for February 14, 2026 in Quezon City.","It covers how the studio prepares a piercing, chooses jewelry, and talks through the days after."]'::jsonb,
    'events/featured-event-2.jpg', 'Feb 14, 2026', 'Quezon City, Metro Manila', 'upcoming', true, 5),
  ('manila-tattoo-convention', 'Manila Tattoo Convention',
    'RBP returns to a Manila convention floor from March 27 to 29, 2026.',
    '["Romell Body Piercing will be at the Manila Tattoo Convention from March 27 to 29, 2026.","Venue notes will be added when the organizer publishes them."]'::jsonb,
    'events/featured-event-1.jpg', 'Mar 27–29, 2026', 'Manila, Philippines', 'upcoming', true, 6)
on conflict (slug) do nothing;

insert into public.testimonials (customer_name, quote, rating, published, sort_order)
select v.customer_name, v.quote, 5, true, v.sort_order
from (
  values
    ('Bianca T.', 'Super professional and clean process. The piercing healed really well!', 1),
    ('Mark R.', 'The best piercing experience I have had. Highly recommended for quality and safety.', 2),
    ('Camille S.', 'Amazing service and wide selection of jewelry. Will definitely come back!', 3)
) as v(customer_name, quote, sort_order)
where not exists (
  select 1 from public.testimonials t where t.customer_name = v.customer_name and t.quote = v.quote
);

insert into public.faqs (question, answer, keywords, published, sort_order)
select v.question, v.answer, v.keywords, true, v.sort_order
from (
  values
    ('How do I book a piercing?',
      'Open Piercing Services and send a booking request with your name, email, and phone. That form is for appointments, not jewelry checkout.',
      array['book','booking','appointment','schedule'], 1),
    ('Where do I buy jewelry?',
      'Jewelry is in Collections. Add a piece to the cart, or use Buy Now to go to checkout.',
      array['buy','shop','jewelry','price','collection','cart'], 2),
    ('What materials do you use?',
      'Pieces are listed as Surgical Stainless 316L, titanium, or 14K gold plated.',
      array['material','titanium','steel','gold'], 3),
    ('How does shipping and returns work?',
      'Jewelry ships across the Philippines. Unopened jewelry can be returned within 7 days.',
      array['ship','shipping','return','refund'], 4),
    ('How can I pay?',
      'Checkout accepts GCash and Maya. Scan the QR shown at checkout and send the order total. The studio confirms the payment. It is not verified automatically.',
      array['pay','payment','gcash','maya','qr'], 5),
    ('Where are your events?',
      'Events are on the Events page. Each card opens its own event page.',
      array['event','expo','seminar','convention'], 6),
    ('Do you give aftercare guidance?',
      'Aftercare guidance is part of a booking and is covered when the appointment is confirmed.',
      array['aftercare','heal','healing','care'], 7)
) as v(question, answer, keywords, sort_order)
where not exists (select 1 from public.faqs f where f.question = v.question);

insert into public.content_sections (page, section_key, title, subtitle, body, media_path, buttons, visible, sort_order)
values
  ('home', 'hero', 'Professional Body Piercing & Jewelry', 'Romell Body Piercing',
    'Expert piercing services, premium body jewelry, and a trusted name in the Philippine piercing community.',
    'video/homepage-hero.mp4',
    '[{"label":"Book a Piercing","to":"/book"},{"label":"Shop Jewelry","to":"/collections"}]'::jsonb,
    true, 1),
  ('home', 'featured_collections', 'Featured Collections', null, null, null, '[]'::jsonb, true, 2),
  ('home', 'client_results', 'Client Results', null, null, null, '[]'::jsonb, true, 3),
  ('home', 'events', 'Events & Community', null, null, null, '[]'::jsonb, true, 4),
  ('events', 'hero', 'Client Showcase', 'Events &',
    'Take a closer look at our events, piercing work, and the community that continues to support the RBP movement.',
    'events/events-hero.jpg',
    '[{"label":"Book a Piercing","to":"/book"},{"label":"View Gallery","to":"/events#showcase"}]'::jsonb,
    true, 1),
  ('events', 'testimonials', 'What Our Clients Say', null, null, null, '[]'::jsonb, true, 2),
  ('about', 'main', 'About', null, null, null, '[]'::jsonb, true, 1),
  ('contact', 'main', 'Contact', null, null, null, '[]'::jsonb, true, 1),
  ('gallery', 'main', 'Gallery', null, null, null, '[]'::jsonb, true, 1)
on conflict (page, section_key) do nothing;

insert into public.showcase_items (storage_path, caption, placement, published, sort_order)
select v.path, null, 'both', true, v.sort_order
from (
  values
    ('showcase/client-nostril-septum.jpg', 1),
    ('showcase/client-ear-multiple-piercings.jpg', 2),
    ('showcase/client-eyebrow.jpg', 3),
    ('showcase/client-lip.jpg', 4),
    ('showcase/client-ear-tunnel.jpg', 5),
    ('showcase/event-client-result-1.jpg', 6),
    ('showcase/event-client-result-2.jpg', 7),
    ('showcase/event-client-result-3.jpg', 8),
    ('showcase/event-client-result-4.jpg', 9),
    ('showcase/event-client-result-5.jpg', 10),
    ('showcase/event-client-result-6.jpg', 11)
) as v(path, sort_order)
where not exists (
  select 1 from public.showcase_items s where s.storage_path = v.path
);
