import { useEffect, useState } from 'react'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { affiliationFromRow, defaultAffiliation, type AffiliationContent } from '../../lib/affiliation.ts'
import {
  GALLERY_CATEGORIES,
  mediaKindForFile,
  type GalleryItem,
} from '../../lib/gallery.ts'
import { publicMediaUrl, uploadMedia } from '../../lib/media.ts'
import { supabase } from '../../lib/supabase.ts'
import { Card, Notice, PrimaryButton, TextField } from './ui.tsx'

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  return next
}

export function AssociationAdmin() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [affiliation, setAffiliation] = useState<AffiliationContent>(defaultAffiliation)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [savingCopy, setSavingCopy] = useState(false)

  const loadGallery = async () => {
    if (!supabase) return
    const { data, error: queryError } = await supabase
      .from('gallery_items')
      .select('id, storage_path, caption, category, published, sort_order, media_kind')
      .order('sort_order', { ascending: true })
    if (queryError) setError(queryError.message)
    else {
      setItems(
        (data ?? []).map((row) => ({
          ...(row as GalleryItem),
          media_kind: (row as { media_kind?: string }).media_kind === 'video' ? 'video' : 'image',
        })),
      )
    }
  }

  const loadCopy = async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('content_sections')
      .select('subtitle, title, body, extra')
      .eq('page', 'site')
      .eq('section_key', 'affiliation')
      .maybeSingle()
    if (data) setAffiliation(affiliationFromRow(data))
  }

  useEffect(() => {
    void loadGallery()
    void loadCopy()
  }, [])

  const savePageCopy = async () => {
    if (!supabase) return
    setSavingCopy(true)
    setError(null)
    setOk(null)
    const { error: saveError } = await supabase.from('content_sections').upsert(
      {
        page: 'site',
        section_key: 'affiliation',
        subtitle: affiliation.eyebrow,
        title: affiliation.title,
        body: affiliation.tagline,
        extra: { logos: affiliation.logos },
        visible: true,
        sort_order: 1,
      },
      { onConflict: 'page,section_key' },
    )
    setSavingCopy(false)
    if (saveError) setError(saveError.message)
    else setOk('Association page text saved.')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Association</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">
            Photos and videos for the public Association page. Upload several at once. The live page shows them in an
            Instagram-style grid — four across on desktop.
          </p>
        </div>
        <label className="cursor-pointer rounded-lg bg-[#FF7900] px-4 py-2 text-sm font-semibold text-black">
          {busy ? 'Uploading…' : 'Add photos or videos'}
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            multiple
            disabled={busy}
            onChange={async (event) => {
              const files = [...(event.target.files ?? [])]
              event.target.value = ''
              if (!supabase || files.length === 0) return
              setBusy(true)
              setError(null)
              setOk(null)
              try {
                for (const [index, file] of files.entries()) {
                  const path = await uploadMedia(file, 'gallery')
                  const kind = mediaKindForFile(file)
                  const { error: insertError } = await supabase.from('gallery_items').insert({
                    storage_path: path,
                    media_kind: kind,
                    published: true,
                    sort_order: items.length + index + 1,
                    category: kind === 'video' ? 'seminar' : 'general',
                  })
                  if (insertError) throw insertError
                }
                await loadGallery()
                setOk(`Added ${files.length} item${files.length === 1 ? '' : 's'}.`)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed')
              } finally {
                setBusy(false)
              }
            }}
          />
        </label>
      </div>

      {busy ? <LoadingScreen label="Uploading" full /> : null}
      <Notice error={error} ok={ok} />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Page heading</h2>
            <p className="mt-1 text-sm text-[#9a9a9a]">Title and tagline at the top of /association.</p>
          </div>
          <PrimaryButton type="button" disabled={savingCopy} onClick={() => void savePageCopy()}>
            {savingCopy ? 'Saving…' : 'Save heading'}
          </PrimaryButton>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <TextField
            label="Small orange line"
            value={affiliation.eyebrow}
            onChange={(event) => setAffiliation({ ...affiliation, eyebrow: event.target.value })}
          />
          <TextField
            label="Main name"
            value={affiliation.title}
            onChange={(event) => setAffiliation({ ...affiliation, title: event.target.value })}
          />
          <TextField
            label="Line under the name"
            value={affiliation.tagline}
            onChange={(event) => setAffiliation({ ...affiliation, tagline: event.target.value })}
          />
        </div>
      </Card>

      <p className="text-xs text-[#8d8d8d]">
        Best photos: square, at least 1080×1080. Videos: MP4 or WebM, under 50 MB. Pick a type for each tile (logo,
        members, seminar).
      </p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#444] px-4 py-16 text-center text-sm text-[#9a9a9a]">
          No media yet. Use &ldquo;Add photos or videos&rdquo; to build the grid.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <article key={item.id} className="group relative aspect-square overflow-hidden bg-[#111]">
              {item.media_kind === 'video' ? (
                <video
                  src={publicMediaUrl(item.storage_path)}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img src={publicMediaUrl(item.storage_path)} alt="" className="h-full w-full object-cover" />
              )}
              {item.media_kind === 'video' ? (
                <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Video
                </span>
              ) : null}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <select
                  className="mb-1 w-full rounded border border-[#444] bg-[#111] px-1.5 py-1 text-[11px] text-white"
                  value={item.category ?? 'general'}
                  onChange={async (event) => {
                    const category = event.target.value
                    setItems((current) =>
                      current.map((row) => (row.id === item.id ? { ...row, category } : row)),
                    )
                    await supabase?.from('gallery_items').update({ category }).eq('id', item.id)
                  }}
                >
                  {GALLERY_CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  className="mb-1 w-full rounded border border-[#444] bg-[#111] px-1.5 py-1 text-[11px] text-white"
                  placeholder="Caption"
                  defaultValue={item.caption ?? ''}
                  onBlur={async (event) => {
                    await supabase?.from('gallery_items').update({ caption: event.target.value }).eq('id', item.id)
                  }}
                />
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <button
                    type="button"
                    className="text-[#ffb067] disabled:opacity-30"
                    disabled={index === 0}
                    onClick={async () => {
                      const reordered = moveItem(items, index, -1)
                      setItems(reordered)
                      await Promise.all(
                        reordered.map((row, sortIndex) =>
                          supabase!.from('gallery_items').update({ sort_order: sortIndex + 1 }).eq('id', row.id),
                        ),
                      )
                    }}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="text-[#ffb067] disabled:opacity-30"
                    disabled={index === items.length - 1}
                    onClick={async () => {
                      const reordered = moveItem(items, index, 1)
                      setItems(reordered)
                      await Promise.all(
                        reordered.map((row, sortIndex) =>
                          supabase!.from('gallery_items').update({ sort_order: sortIndex + 1 }).eq('id', row.id),
                        ),
                      )
                    }}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="text-[#ffb089]"
                    onClick={async () => {
                      await supabase?.from('gallery_items').delete().eq('id', item.id)
                      await loadGallery()
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}