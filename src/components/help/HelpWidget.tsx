import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { rbpField } from '../ui/panels.ts'
import { supabase, supabaseConfigured } from '../../lib/supabase.ts'

type Faq = {
  question: string
  keywords: string[]
  answer: string
}

const FAQS: Faq[] = [
  {
    question: 'How do I book a piercing?',
    keywords: ['book', 'booking', 'appointment', 'schedule', 'reserve', 'piercing service'],
    answer:
      'Open Piercing Services and send a booking request with your name, email, and phone. That form is for appointments, not jewelry checkout. The studio confirms the time with you.',
  },
  {
    question: 'Where do I buy jewelry?',
    keywords: ['buy', 'shop', 'jewelry', 'jewellery', 'price', 'collection', 'product', 'cart'],
    answer:
      'Jewelry is in Collections. Add a piece to your cart, or use Buy Now to go straight to checkout. Prices are shown in pesos.',
  },
  {
    question: 'What materials do you use?',
    keywords: ['material', 'titanium', 'steel', '316', 'gold', 'hypoallergenic', 'metal'],
    answer:
      'Pieces are listed as Surgical Stainless 316L, titanium, or 14K gold plated. The material is on each product card and on the product page.',
  },
  {
    question: 'How does shipping and returns work?',
    keywords: ['ship', 'shipping', 'deliver', 'return', 'refund', 'exchange'],
    answer:
      'Jewelry ships across the Philippines. Unopened jewelry can be returned within 7 days. Checkout also asks for your delivery address.',
  },
  {
    question: 'How can I pay?',
    keywords: ['pay', 'payment', 'gcash', 'maya', 'gotyme', 'bank', 'cash'],
    answer:
      'Checkout accepts GCash, Maya, GoTyme, and bank transfer. The studio confirms the payment. It is not verified automatically.',
  },
  {
    question: 'Where are your events?',
    keywords: ['event', 'expo', 'seminar', 'convention', 'workshop', 'schedule'],
    answer:
      'Events are listed on the Events page. Open a card to read that event on its own page, including the date and location.',
  },
  {
    question: 'Do you give aftercare guidance?',
    keywords: ['aftercare', 'heal', 'healing', 'clean', 'care'],
    answer:
      'Yes. Aftercare guidance is part of a booking. The studio goes over it when your appointment is confirmed.',
  },
]

function matchFaq(question: string, faqs: Faq[]): Faq | null {
  const text = question.toLowerCase()
  let best: Faq | null = null
  let score = 0
  for (const faq of faqs) {
    const hits = faq.keywords.filter((word) => text.includes(word)).length
    if (hits > score) {
      score = hits
      best = faq
    }
  }
  return score > 0 ? best : null
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function HelpWidget() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [needsContact, setNeedsContact] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [faqs, setFaqs] = useState<Faq[]>(FAQS)

  useEffect(() => {
    if (!open || !supabase) return
    void supabase
      .from('faqs')
      .select('question, answer, keywords')
      .eq('published', true)
      .order('sort_order')
      .then(({ data }) => {
        if (!data?.length) return
        setFaqs(data.map((row) => ({
          question: row.question as string,
          answer: row.answer as string,
          keywords: (row.keywords as string[] | null) ?? [],
        })))
      })
  }, [open])

  const ask = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setQuestion(trimmed)
    setError(null)
    setSent(false)
    const faq = matchFaq(trimmed, faqs)
    if (faq) {
      setAnswer(faq.answer)
      setNeedsContact(false)
      return
    }
    setAnswer(null)
    setNeedsContact(true)
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!phone.trim() || !validEmail(email.trim())) {
      setError('A phone number and a valid email are required.')
      return
    }
    if (!supabaseConfigured || !supabase) {
      setError('The studio inbox is not connected yet. Please use the booking page.')
      return
    }
    setSending(true)
    try {
      const { error: dbError } = await supabase.from('inquiries').insert({
        question,
        email: email.trim(),
        phone: phone.trim(),
        status: 'open',
        source: 'widget',
      })
      if (dbError) throw dbError
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your question.')
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setQuestion('')
    setAnswer(null)
    setNeedsContact(false)
    setPhone('')
    setEmail('')
    setError(null)
    setSent(false)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <section
          className="w-[min(100vw-2.5rem,360px)] rounded-rbp border border-rbp-border bg-[#080808] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
          aria-label="Questions"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[15px] font-semibold leading-snug text-white">You have any questions? Ask us now</p>
            <button type="button" className="text-white/60 hover:text-white" onClick={() => setOpen(false)} aria-label="Close questions">
              ✕
            </button>
          </div>

          {!needsContact && !answer && (
            <div className="mt-4 space-y-2">
              {faqs.slice(0, 4).map((faq) => (
                <button
                  key={faq.question}
                  type="button"
                  onClick={() => ask(faq.question)}
                  className="block w-full rounded-rbp border border-white/10 px-3 py-2 text-left text-[13px] text-white/80 hover:border-rbp-accent"
                >
                  {faq.question}
                </button>
              ))}
            </div>
          )}

          {answer && (
            <div className="mt-4 rounded-rbp border border-white/10 px-3 py-3 text-[13px] leading-relaxed text-white/85">
              <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-rbp-accent">Answer</p>
              {answer}
            </div>
          )}

          {needsContact && !sent && (
            <form onSubmit={send} className="mt-4 space-y-3">
              <p className="text-[13px] leading-relaxed text-white/75">
                That question is not in the FAQ. Leave your number and email and the studio will reply.
              </p>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className={`${rbpField} h-11`}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={`${rbpField} h-11`}
              />
              {error && <p className="text-[12px] text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="h-10 w-full rounded-md bg-gradient-to-b from-[#ffb000] to-[#e85d00] text-[13px] font-semibold text-black disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send my details'}
              </button>
            </form>
          )}

          {sent && (
            <p className="mt-4 text-[13px] leading-relaxed text-white/80">
              Received. The studio will reach you at {email} or {phone}.
            </p>
          )}

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              ask(question)
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question"
              className={`${rbpField} h-11`}
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-md bg-rbp-accent px-3 text-[13px] font-semibold text-black"
            >
              Ask
            </button>
          </form>

          {(answer || needsContact || sent) && (
            <button type="button" onClick={reset} className="mt-3 text-[12px] text-rbp-accent">
              Ask another question
            </button>
          )}

          <p className="mt-3 text-[12px] text-white/45">
            Prefer to book? <Link to="/book" className="text-rbp-accent">Piercing Services</Link>
          </p>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-rbp-accent bg-black px-4 py-3 text-left text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(255,121,0,0.25)]"
      >
        You have any questions? Ask us now
      </button>
    </div>
  )
}
