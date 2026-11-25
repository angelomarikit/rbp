import { useEffect, useState } from 'react'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { affiliationFromRow, defaultAffiliation } from '../lib/affiliation.ts'
import { publicMediaUrl } from '../lib/media.ts'
import { supabase } from '../lib/supabase.ts'

export function AssociationPage() {
  const [content, setContent] = useState(defaultAffiliation)

  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('content_sections')
      .select('subtitle, title, body, extra')
      .eq('page', 'site')
      .eq('section_key', 'affiliation')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContent(affiliationFromRow(data))
      })
  }, [])

  const mark = content.logos.find((logo) => logo.alt.trim().toLowerCase() === content.title.trim().toLowerCase()) ?? content.logos[0]

  return (
    <div className="bg-black px-5 py-16 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-4xl text-center">
        {content.eyebrow && (
          <p className="font-secondary text-[12px] font-semibold uppercase tracking-[0.32em] text-rbp-cream">{content.eyebrow}</p>
        )}
        <GothicHeading as="h1" className="mt-3 text-[2.6rem] leading-[0.9] sm:text-[3.6rem]">
          {content.title}
        </GothicHeading>
        <div className="mx-auto mt-6 h-[3px] w-48 bg-gradient-to-r from-transparent via-rbp-accent to-transparent" />
        {content.tagline && (
          <p className="font-secondary mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-white/85">{content.tagline}</p>
        )}
        {mark && (
          <img
            src={publicMediaUrl(mark.path)}
            alt={mark.alt || content.title}
            className="mx-auto mt-10 h-40 w-40 object-contain"
          />
        )}
      </div>
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
