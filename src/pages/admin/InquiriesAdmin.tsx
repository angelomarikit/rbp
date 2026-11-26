import { useEffect, useState } from 'react'
import {
  BOOK_PAGE_DEFAULT_PRICE_LIST,
  BOOK_PAGE_DEFAULT_STUDIO,
  BOOK_PAGE_PRICE_LIST_SPEC,
  BOOK_PAGE_STUDIO_SPEC,
} from '../../lib/bookPageMedia.ts'
import { publicMediaUrl } from '../../lib/media.ts'
import { supabase } from '../../lib/supabase.ts'
import { Card, MediaField, Notice, PrimaryButton, TextArea, TextField } from './ui.tsx'

function imageSpecLine(spec: { width: number; height: number; aspect: string; formats: string; notes: string }) {
  return `Recommended ${spec.width}×${spec.height} px (${spec.aspect}). ${spec.formats}. ${spec.notes}`
}

type Inquiry = { id: string; question: string; email: string; phone: string; status: string; response: string | null; source: string; created_at: string }
type Faq = { id: string; question: string; answer: string; keywords: string[] | null; published: boolean }

export function InquiriesAdmin() {
  const [rows, setRows] = useState<Inquiry[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [draft, setDraft] = useState({ question: '', answer: '', keywords: '' })
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [priceListImage, setPriceListImage] = useState('')
  const [studioImage, setStudioImage] = useState('')
  const [savingBookImages, setSavingBookImages] = useState(false)

  const load = async () => {
    const [inquiryResult, faqResult] = await Promise.all([
      supabase!.from('inquiries').select('id, question, email, phone, status, response, source, created_at').order('created_at', { ascending: false }),
      supabase!.from('faqs').select('id, question, answer, keywords, published').order('sort_order'),
    ])
    if (inquiryResult.error || faqResult.error) setError(inquiryResult.error?.message || faqResult.error?.message || '')
    setRows((inquiryResult.data ?? []) as Inquiry[])
    setFaqs((faqResult.data ?? []) as Faq[])
  }

  const loadBookImages = async () => {
    if (!supabase) return
    const { data, error: queryError } = await supabase
      .from('content_sections')
      .select('section_key, media_path')
      .eq('page', 'book')
      .in('section_key', ['price_list', 'studio_photo'])
    if (queryError) setError(queryError.message)
    else {
      for (const row of (data ?? []) as { section_key: string; media_path: string | null }[]) {
        if (row.section_key === 'price_list') setPriceListImage(row.media_path ?? '')
        if (row.section_key === 'studio_photo') setStudioImage(row.media_path ?? '')
      }
    }
  }

  const saveBookSection = async (sectionKey: 'price_list' | 'studio_photo', mediaPath: string) => {
    if (!supabase) return
    setSavingBookImages(true)
    setOk(null)
    const { error: saveError } = await supabase.from('content_sections').upsert(
      {
        page: 'book',
        section_key: sectionKey,
        media_path: mediaPath.trim() || null,
        visible: true,
        sort_order: sectionKey === 'price_list' ? 1 : 2,
      },
      { onConflict: 'page,section_key' },
    )
    setSavingBookImages(false)
    if (saveError) setError(saveError.message)
    else {
      setError(null)
      setOk(sectionKey === 'price_list' ? 'Price list image saved for /book.' : 'Studio photo saved for /book.')
    }
  }

  useEffect(() => {
    void load()
    void loadBookImages()
  }, [])

  const openCount = rows.filter((row) => row.status === 'open').length

  const removeInquiry = async (row: Inquiry) => {
    if (!supabase) return
    const label = row.source === 'appointment' ? 'this appointment request' : 'this inquiry'
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return
    setOk(null)
    const { error: deleteError } = await supabase.from('inquiries').delete().eq('id', row.id)
    if (deleteError) setError(deleteError.message)
    else {
      setError(null)
      setOk('Inquiry deleted.')
      await load()
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">Inquiries</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">
          Piercing appointment requests, the public <span className="text-[#cfcfcf]">/book</span> page images, and chat answers you publish here.
        </p>
      </div>
      <nav className="flex flex-wrap gap-2">
        <a href="#book-images" className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-sm hover:border-[#FF7900]">
          1. Book page images
        </a>
        <a href="#inbox" className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-sm hover:border-[#FF7900]">
          2. Questions{openCount ? ` · ${openCount} waiting` : ''}
        </a>
        <a href="#faqs" className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-sm hover:border-[#FF7900]">3. Saved answers</a>
      </nav>
      <Notice error={error} ok={ok} />
      <section id="book-images" className="scroll-mt-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Piercing appointment page images</h2>
          <p className="mt-1 text-sm text-[#9a9a9a]">
            These appear on the live booking page (<span className="text-[#cfcfcf]">/book</span>). Upload replaces the file; remove to fall back to the bundled default.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3">
            <p className="text-sm font-semibold text-white">{BOOK_PAGE_PRICE_LIST_SPEC.title}</p>
            <p className="text-xs leading-relaxed text-[#9a9a9a]">{imageSpecLine(BOOK_PAGE_PRICE_LIST_SPEC)}</p>
            <MediaField
              label="Upload price list"
              hint={`${BOOK_PAGE_PRICE_LIST_SPEC.width}×${BOOK_PAGE_PRICE_LIST_SPEC.height} px recommended.`}
              folder="book"
              accept="image/jpeg,image/png,image/webp"
              value={priceListImage}
              previewSrc={publicMediaUrl(priceListImage) || publicMediaUrl(BOOK_PAGE_DEFAULT_PRICE_LIST)}
              previewClassName="mt-3 max-h-[280px] w-full rounded-lg object-contain bg-[#111]"
              onChange={(path) => {
                setPriceListImage(path)
                void saveBookSection('price_list', path)
              }}
            />
            {savingBookImages ? <p className="text-xs text-[#9a9a9a]">Saving…</p> : null}
          </Card>
          <Card className="space-y-3">
            <p className="text-sm font-semibold text-white">{BOOK_PAGE_STUDIO_SPEC.title}</p>
            <p className="text-xs leading-relaxed text-[#9a9a9a]">{imageSpecLine(BOOK_PAGE_STUDIO_SPEC)}</p>
            <MediaField
              label="Upload studio photo"
              hint={`${BOOK_PAGE_STUDIO_SPEC.width}×${BOOK_PAGE_STUDIO_SPEC.height} px recommended.`}
              folder="book"
              accept="image/jpeg,image/png,image/webp"
              value={studioImage}
              previewSrc={publicMediaUrl(studioImage) || publicMediaUrl(BOOK_PAGE_DEFAULT_STUDIO)}
              previewClassName="mt-3 max-h-[280px] w-full rounded-lg object-cover bg-[#111]"
              onChange={(path) => {
                setStudioImage(path)
                void saveBookSection('studio_photo', path)
              }}
            />
          </Card>
        </div>
      </section>
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
              <div className="flex flex-col items-end gap-2">
                <p className="text-xs text-[#8d8d8d]">{new Date(row.created_at).toLocaleDateString()}</p>
                <button type="button" className="text-xs font-semibold text-[#ffb089] hover:text-[#ffc9a8]" onClick={() => void removeInquiry(row)}>
                  Delete
                </button>
              </div>
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
