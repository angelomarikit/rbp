import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.ts'
import { Card, Notice, PrimaryButton, TextArea, TextField } from './ui.tsx'

type Inquiry = { id: string; question: string; email: string; phone: string; status: string; response: string | null; source: string; created_at: string }
type Faq = { id: string; question: string; answer: string; keywords: string[] | null; published: boolean }

export function InquiriesAdmin() {
  const [rows, setRows] = useState<Inquiry[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [draft, setDraft] = useState({ question: '', answer: '', keywords: '' })
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const load = async () => {
    const [inquiryResult, faqResult] = await Promise.all([
      supabase!.from('inquiries').select('id, question, email, phone, status, response, source, created_at').order('created_at', { ascending: false }),
      supabase!.from('faqs').select('id, question, answer, keywords, published').order('sort_order'),
    ])
    if (inquiryResult.error || faqResult.error) setError(inquiryResult.error?.message || faqResult.error?.message || '')
    setRows((inquiryResult.data ?? []) as Inquiry[])
    setFaqs((faqResult.data ?? []) as Faq[])
  }

  useEffect(() => { void load() }, [])

  const openCount = rows.filter((row) => row.status === 'open').length

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">Inquiries</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">Piercing appointment requests and questions the chat could not answer land here. Answers you publish below are what the chat tries first.</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        <a href="#inbox" className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-sm hover:border-[#FF7900]">1. Questions{openCount ? ` · ${openCount} waiting` : ''}</a>
        <a href="#faqs" className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-sm hover:border-[#FF7900]">2. Saved answers</a>
      </nav>
      <Notice error={error} ok={ok} />
      <section id="inbox" className="scroll-mt-4 space-y-3">
        <div>
          <h2 className="text-base font-semibold">Inbox</h2>
          <p className="text-sm text-[#9a9a9a]">Each one includes an email and a phone number. Click a status, then write a reply.</p>
        </div>
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#444] px-4 py-8 text-sm text-[#9a9a9a]">
            Nothing is waiting. A piercing appointment request or an unanswered chat question shows up here.
          </div>
        )}
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#ffb067]">{row.source === 'appointment' ? 'Piercing appointment' : 'Chat'}</p>
                <p className="mt-1 whitespace-pre-line text-sm font-medium text-white">{row.question}</p>
              </div>
              <p className="text-xs text-[#8d8d8d]">{new Date(row.created_at).toLocaleDateString()}</p>
            </div>
            <p className="mt-1 text-xs text-[#9a9a9a]">{row.email} · {row.phone}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['open', 'replied', 'closed'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs ${row.status === status ? 'border-[#FF7900] bg-[#2a1608] text-white' : 'border-[#333] text-[#b5b5b5]'}`}
                  onClick={async () => {
                    await supabase?.from('inquiries').update({ status }).eq('id', row.id)
                    await load()
                  }}
                >
                  {status === 'open' ? 'Waiting' : status === 'replied' ? 'Replied' : 'Done'}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-xs text-[#9a9a9a]">
              Your reply
              <textarea
                className="mt-1.5 min-h-20 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                placeholder="Write the answer, then click outside to save it."
                defaultValue={row.response ?? ''}
                onBlur={async (event) => {
                  const response = event.target.value
                  await supabase?.from('inquiries').update({ response, status: response.trim() ? 'replied' : row.status }).eq('id', row.id)
                }}
              />
            </label>
          </article>
        ))}
      </section>
      <div id="faqs" className="grid scroll-mt-4 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Saved answers</h2>
            <p className="text-sm text-[#9a9a9a]">The chat offers these before it asks someone to leave their number.</p>
          </div>
          {faqs.map((faq) => (
            <article key={faq.id} className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4">
              <p className="font-medium">{faq.question}</p>
              <p className="mt-2 text-sm leading-6 text-[#c8c8c8]">{faq.answer}</p>
              {faq.keywords && faq.keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {faq.keywords.map((word) => (
                    <span key={word} className="rounded-full border border-[#333] px-2.5 py-0.5 text-xs text-[#cfcfcf]">{word}</span>
                  ))}
                </div>
              )}
              <button type="button" className="mt-3 text-xs text-[#ffb089]" onClick={async () => { await supabase?.from('faqs').delete().eq('id', faq.id); await load() }}>Remove</button>
            </article>
          ))}
        </div>
        <Card className="space-y-3 lg:sticky lg:top-4">
          <h2 className="text-base font-semibold">Add an answer</h2>
          <p className="text-sm text-[#9a9a9a]">Write it the way you would say it in the studio.</p>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault()
              if (!draft.question.trim() || !draft.answer.trim()) return
              setOk(null)
              const { error: insertError } = await supabase!.from('faqs').insert({
                question: draft.question.trim(),
                answer: draft.answer.trim(),
                keywords: draft.keywords.split(',').map((word) => word.trim()).filter(Boolean),
                published: true,
                sort_order: faqs.length + 1,
              })
              if (insertError) setError(insertError.message)
              else {
                setError(null)
                setDraft({ question: '', answer: '', keywords: '' })
                setOk('Answer saved.')
                await load()
              }
            }}
          >
            <TextField label="Question" hint="How a client might ask it." value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} />
            <TextArea label="Answer" hint="Short enough to read in the chat." value={draft.answer} onChange={(event) => setDraft({ ...draft, answer: event.target.value })} />
            <TextField label="Matching words" hint="Separate with commas. Example: book, appointment" value={draft.keywords} onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} />
            <PrimaryButton type="submit">Add answer</PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  )
}
