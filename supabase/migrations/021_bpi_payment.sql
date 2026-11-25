-- Checkout's second payment method is BPI. Existing databases still have the Maya answer.
update public.faqs
set
  answer = 'Checkout accepts GCash and BPI. Scan the QR shown at checkout and send the order total. The studio confirms the payment. It is not verified automatically.',
  keywords = array['pay','payment','gcash','bpi','qr']
where question = 'How can I pay?';
