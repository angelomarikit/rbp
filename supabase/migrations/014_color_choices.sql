-- 014 — Color choices for product versions
insert into public.variation_option_values (option_id, value, sort_order)
select o.id, v.value, v.sort_order
from public.variation_options o
join (
  values
    ('color', 'Clear', 1),
    ('color', 'Rose Gold', 2),
    ('color', 'Gold', 3),
    ('color', 'Black', 4),
    ('color', 'Multicolor', 5),
    ('color', 'Green', 6),
    ('color', 'Blue', 7),
    ('color', 'Pink', 8),
    ('color', 'Red', 9),
    ('color', 'Purple', 10),
    ('color', 'Gold color', 11),
    ('color', 'Steel color', 12)
) as v(option_key, value, sort_order) on v.option_key = o.key
on conflict (option_id, value) do update set sort_order = excluded.sort_order;
