import { useEffect, useState } from 'react'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { publicMediaUrl } from '../lib/media.ts'
import { supabase } from '../lib/supabase.ts'

export function GalleryPage() {
  const [items, setItems] = useState<{ id: string; storage_path: string; caption: string | null }[]>([])

  useEffect(() => {
    if (!supabase) return
    void supabase.from('gallery_items').select('id, storage_path, caption').eq('published', true).order('sort_order').then(({ data }) => {
      setItems((data ?? []) as { id: string; storage_path: string; caption: string | null }[])
    })
  }, [])

  return (
    <div className="bg-black px-5 py-14 sm:px-8">
      <GothicHeading as="h1" className="text-center text-[3rem]">Gallery</GothicHeading>
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <figure key={item.id}>
            <img src={publicMediaUrl(item.storage_path)} alt={item.caption ?? ''} className="aspect-square w-full rounded-rbp border border-rbp-border object-cover" />
            {item.caption && <figcaption className="font-secondary mt-2 text-center text-xs text-white/70">{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {items.length === 0 && <p className="mt-8 text-center text-sm text-white/70">Photos added in the admin gallery appear here.</p>}
    </div>
  )
}

export function AboutPage() {
  const [title, setTitle] = useState('About')
  const [body, setBody] = useState('')
  const [image, setImage] = useState('')
  const [video, setVideo] = useState('')

  useEffect(() => {
    if (!supabase) return
    void supabase.from('content_sections').select('title, body, media_path, extra').eq('page', 'about').eq('section_key', 'main').maybeSingle().then(({ data }) => {
      if (!data) return
      setTitle(data.title || 'About')
      setBody(data.body || '')
      setImage(data.media_path || '')
      setVideo((data.extra as { video_path?: string } | null)?.video_path || '')
    })
  }, [])

  return (
    <div className="mx-auto max-w-3xl bg-black px-5 py-14">
      <GothicHeading as="h1" className="text-[3rem]">{title}</GothicHeading>
      {image && <img src={publicMediaUrl(image)} alt="" className="mt-6 aspect-[4/5] w-full rounded-rbp border border-rbp-border object-cover" />}
      {video && <video src={publicMediaUrl(video)} className="mt-6 w-full rounded-rbp" controls />}
      <p className="font-secondary mt-6 whitespace-pre-line text-[15px] leading-relaxed text-white/80">{body}</p>
    </div>
  )
}

export function ContactPage() {
  const [title, setTitle] = useState('Contact')
  const [body, setBody] = useState('')
  const [details, setDetails] = useState({ phone: '', email: '', address: '', city: '' })

  useEffect(() => {
    if (!supabase) return
    void Promise.all([
      supabase.from('content_sections').select('title, body').eq('page', 'contact').eq('section_key', 'main').maybeSingle(),
      supabase.from('site_settings').select('phone, email, address, city').eq('id', 1).maybeSingle(),
    ]).then(([section, settings]) => {
      if (section.data) {
        setTitle(section.data.title || 'Contact')
        setBody(section.data.body || '')
      }
      if (settings.data) {
        setDetails({
          phone: settings.data.phone || '',
          email: settings.data.email || '',
          address: settings.data.address || '',
          city: settings.data.city || '',
        })
      }
    })
  }, [])

  return (
    <div className="mx-auto max-w-xl bg-black px-5 py-14 text-center">
      <GothicHeading as="h1" className="text-[3rem]">{title}</GothicHeading>
      <p className="font-secondary mt-4 text-[15px] text-white/80">{body}</p>
      <div className="mt-6 space-y-1 text-sm text-rbp-cream">
        {details.phone && <p>{details.phone}</p>}
        {details.email && <p>{details.email}</p>}
        {details.address && <p>{details.address}</p>}
        {details.city && <p>{details.city}</p>}
      </div>
    </div>
  )
}
