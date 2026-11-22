-- Checkout payment answers now mention GCash and Maya only.
update public.faqs
set
  answer = 'Checkout accepts GCash and Maya. Scan the QR shown at checkout and send the order total. The studio confirms the payment. It is not verified automatically.',
  keywords = array['pay','payment','gcash','maya','qr']
where question = 'How can I pay?';
