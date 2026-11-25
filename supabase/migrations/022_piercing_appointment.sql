-- The booking page is labeled Piercing Appointment.
update public.faqs
set answer = replace(answer, 'Piercing Services', 'Piercing Appointment')
where answer like '%Piercing Services%';
