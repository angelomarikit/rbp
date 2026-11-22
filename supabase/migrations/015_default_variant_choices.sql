-- 015 — Default color and material choices for new product versions
insert into public.variation_option_values (option_id, value, sort_order)
select o.id, v.value, v.sort_order
from public.variation_options o
join (
  values
    ('color', 'Gold color', 11),
    ('color', 'Steel color', 12),
    ('material', 'Titanium G23', 4),
    ('material', 'Stainless 316L', 5)
) as v(option_key, value, sort_order) on v.option_key = o.key
on conflict (option_id, value) do update set sort_order = excluded.sort_order;
