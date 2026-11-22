import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductCard } from '../components/commerce/ProductCard.tsx'
import { usePageSeo } from '../components/Seo.tsx'
import { OrangeButton } from '../components/ui/Buttons.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { LoadingScreen } from '../components/ui/LoadingScreen.tsx'
import { IconCart, IconChevron, IconHeart, IconShield } from '../components/ui/Icons.tsx'
import { QuantityStepper } from '../components/ui/QuantityStepper.tsx'
import { rbpPanel } from '../components/ui/panels.ts'
import { FEATURED_PRODUCT_SLUG, GEM_VARIANTS, getProductBySlug } from '../data/products.ts'
import type { GemVariant } from '../data/types.ts'
import { useCart } from '../features/cart/CartProvider.tsx'
import { rowToProduct, useProducts } from '../hooks/useProducts.ts'
import { formatPhp } from '../lib/format.ts'
import { publicMediaUrl } from '../lib/media.ts'
import { defaultChoiceFor } from '../lib/productChoices.ts'
import { supabase } from '../lib/supabase.ts'

const GALLERY = [
  'products/navel-barbell-hero.jpg',
  'products/navel-barbell-gallery-1.jpg',
  'products/navel-barbell-gallery-2.jpg',
  'products/navel-barbell-gallery-3.jpg',
]

const tabs = ['Description', 'Specifications', 'Reviews', 'Shipping & Returns'] as const

function colorChoice(label: string): GemVariant {
  const known = GEM_VARIANTS.find((item) => item.label.toLowerCase() === label.toLowerCase() || item.key === label.toLowerCase())
  if (known) return known
  const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'color'
  return { key, label, color: '#f2f2f2' }
}

type StoreVariant = { label: string; priceCents: number | null; options: Record<string, string> }
type ChoiceGroup = { key: string; name: string; values: string[] }

function splitMeasure(value: string) {
  const parts = value.split(/\s*(?:,|\/|\||·|;)\s*|\s+(?=\d)/).map((part) => part.trim()).filter(Boolean)
  const measure = /^\d+(?:\.\d+)?\s*(?:mm|g|ga|gauge)?$/i
  if (parts.length > 1 && parts.every((part) => measure.test(part))) return parts
  return [value]
}

function choiceValues(key: string, value: string) {
  if (key === 'length' || key === 'size' || key === 'gauge') return splitMeasure(value)
  return [value]
}

function variantChoices(version: StoreVariant) {
  const choices: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(version.options)) {
    const next = choiceValues(key, value)
    if (next.length) choices[key] = next
  }
  if (!Object.keys(choices).length && version.label.trim()) choices.version = [version.label.trim()]
  return choices
}

function choiceGroups(versions: StoreVariant[], names: Record<string, string>): ChoiceGroup[] {
  const order: string[] = []
  const values = new Map<string, string[]>()
  for (const version of versions) {
    for (const [key, list] of Object.entries(variantChoices(version))) {
      if (!values.has(key)) {
        order.push(key)
        values.set(key, [])
      }
      const current = values.get(key)!
      for (const value of list) if (!current.includes(value)) current.push(value)
    }
  }
  const preferred = ['length', 'size', 'gauge', 'color', 'material']
  order.sort((a, b) => {
    const aIndex = preferred.indexOf(a)
    const bIndex = preferred.indexOf(b)
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
  })
  return order.map((key) => ({
    key,
    name: names[key] || (key === 'version' ? 'Version' : key.charAt(0).toUpperCase() + key.slice(1).replace(/[-_]/g, ' ')),
    values: values.get(key) ?? [],
  }))
}

function firstSelection(versions: StoreVariant[], groups: ChoiceGroup[]) {
  const selected: Record<string, string> = {}
  const first = versions[0]
  const choices = first ? variantChoices(first) : {}
  for (const group of groups) selected[group.key] = choices[group.key]?.[0] || group.values[0] || ''
  return selected
}

function matchesVariant(version: StoreVariant, selected: Record<string, string>) {
  return Object.entries(variantChoices(version)).every(([key, values]) => values.includes(selected[key] ?? ''))
}

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { addProduct } = useCart()
  const { products } = useProducts()
  const [product, setProduct] = useState<ReturnType<typeof getProductBySlug>>(getProductBySlug(slug))
  const [gallery, setGallery] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [qty, setQty] = useState(1)
  const [variants, setVariants] = useState<StoreVariant[]>([])
  const [groups, setGroups] = useState<ChoiceGroup[]>([])
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Description')
  const [hero, setHero] = useState(0)
  usePageSeo(
    product
      ? { title: product.name, description: product.description, image: product.imagePath ? publicMediaUrl(product.imagePath) : '' }
      : ready
        ? { title: 'Product not found', noindex: true }
        : null,
  )

  useEffect(() => {
    let cancelled = false
    setHero(0)
    setQty(1)
    setVariants([])
    setGroups([])
    setSelected({})
    setActiveTab('Description')
    setReady(false)
    const known = getProductBySlug(slug)
    setProduct(known)
    setGallery(known ? (known.slug === FEATURED_PRODUCT_SLUG ? GALLERY : [known.imagePath]) : [])

    if (!supabase || !slug) {
      setReady(true)
      return
    }

    void (async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (cancelled) return
      if (!data || data.published !== true || data.status !== 'active') {
        if (!known) setProduct(undefined)
        setReady(true)
        return
      }
      const next = rowToProduct(data as Record<string, unknown>)
      const { data: pictures } = await supabase
        .from('product_images')
        .select('storage_path')
        .eq('product_id', data.id)
        .order('sort_order')
      if (cancelled) return
      const paths = (pictures ?? []).map((picture) => picture.storage_path as string).filter(Boolean)
      const [{ data: versions }, { data: optionNames }] = await Promise.all([
        supabase.from('product_variants').select('label, price_cents, options, sort_order').eq('product_id', data.id).eq('status', 'active').order('sort_order'),
        supabase.from('variation_options').select('key, name').order('sort_order'),
      ])
      if (cancelled) return
      const names = Object.fromEntries((optionNames ?? []).map((option) => [option.key as string, option.name as string]))
      const stored = (versions ?? []).map((version) => {
        const options = version.options as Record<string, string> | null
        const clean: Record<string, string> = {}
        for (const [key, value] of Object.entries(options ?? {})) if (value?.trim()) clean[key] = value.trim()
        return { label: (version.label as string) ?? '', priceCents: version.price_cents as number | null, options: clean }
      })
      const nextGroups = choiceGroups(stored, names)
      setProduct(next)
      setVariants(stored)
      setGroups(nextGroups)
      setSelected(firstSelection(stored, nextGroups))
      if (next.slug === FEATURED_PRODUCT_SLUG && paths.length <= 1) setGallery(GALLERY)
      else setGallery(paths.length ? paths : next.imagePath ? [next.imagePath] : [])
      setReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [slug])

  if (!ready && !product) {
    return <LoadingScreen label="Loading product" />
  }

  if (!product) {
    return (
      <div className="px-6 py-20 text-center">
        <GothicHeading as="h1" className="text-[3rem]">
          Product not found
        </GothicHeading>
        <Link to="/collections" className="mt-6 inline-block text-rbp-accent">
          Back to collections
        </Link>
      </div>
    )
  }

  const photos = gallery.length ? gallery : product.imagePath ? [product.imagePath] : []
  const description =
    product.description ??
    `${product.name} is made from ${product.material}. A polished piece for ${product.category.toLowerCase()}, finished for everyday wear.`
  const chosen = variants.find((version) => matchesVariant(version, selected))
  const priceCents = chosen?.priceCents ?? product.priceCents
  const pick = (key: string, value: string) => {
    const next = { ...selected, [key]: value }
    if (variants.some((version) => matchesVariant(version, next))) {
      setSelected(next)
      return
    }
    const fallback = variants.find((version) => variantChoices(version)[key]?.includes(value))
    if (!fallback) {
      setSelected(next)
      return
    }
    const allowed = variantChoices(fallback)
    const resolved: Record<string, string> = {}
    for (const group of groups) {
      const values = allowed[group.key]
      if (!values?.length) continue
      resolved[group.key] = values.includes(next[group.key] ?? '') ? next[group.key] : values[0]
    }
    setSelected(resolved)
  }
  const sizeLabel = groups.filter((group) => group.key !== 'material' && group.key !== 'color').map((group) => selected[group.key]).filter(Boolean).join(' / ')
  const choiceKey = groups.map((group) => `${group.key}:${selected[group.key] ?? ''}`).join('|')
  const addCurrent = async () => {
    if (!groups.length) {
      const choice = await defaultChoiceFor(product.id)
      addProduct(product, qty, choice ? { ...choice, material: choice.material || product.material } : undefined)
      return
    }
    addProduct(product, qty, {
      key: choiceKey,
      sizeLabel,
      color: selected.color,
      priceCents,
      material: selected.material || product.material,
      options: Object.fromEntries(Object.entries(selected).filter(([, value]) => value)),
    })
  }
  const specRows = product.specs
    ? [
        ['Material', selected.material || product.specs.material],
        ['Thickness (Gauge)', selected.gauge || product.specs.gauge],
        ['Bar Length', selected.length || product.specs.barLength],
        ['Gem', product.specs.gem],
        ['Color / Finish', selected.color || product.specs.finish],
      ]
    : [
        ['Material', selected.material || product.material],
        ['Category', product.category],
        ['Finish', selected.color || 'Polished'],
      ]
  const related = products.filter((item) => item.slug !== product.slug && item.slug !== FEATURED_PRODUCT_SLUG).slice(0, 4)

  return (
    <div className="w-full bg-black">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <nav className="flex flex-wrap items-center gap-2 text-[13px] text-white/55">
          <Link to="/" className="hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link to="/collections" className="hover:text-white">
            Collections
          </Link>
          <span>/</span>
          <Link to={`/collections?category=${encodeURIComponent(product.category)}`} className="hover:text-white">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-rbp-accent">{product.name}</span>
        </nav>

        <section className="mt-8 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex gap-4">
            {photos.length > 1 && (
              <div className="hidden w-[84px] shrink-0 flex-col gap-3 sm:flex">
                {photos.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setHero(i)}
                    className={`h-[84px] overflow-hidden rounded-rbp border bg-[#111] ${
                      hero === i ? 'border-rbp-accent' : 'border-rbp-border'
                    }`}
                  >
                    <img src={publicMediaUrl(src)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative aspect-square flex-1 overflow-hidden rounded-rbp border border-rbp-border bg-[#111]">
              {publicMediaUrl(photos[hero] ?? product.imagePath) ? (
                <img
                  src={publicMediaUrl(photos[hero] ?? product.imagePath)}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : null}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-rbp-border bg-black/70 text-rbp-accent"
                    onClick={() => setHero((n) => (n === 0 ? photos.length - 1 : n - 1))}
                  >
                    <IconChevron direction="left" size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-rbp-border bg-black/70 text-rbp-accent"
                    onClick={() => setHero((n) => (n + 1) % photos.length)}
                  >
                    <IconChevron direction="right" size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={`px-6 py-7 sm:px-8 ${rbpPanel}`}>
            <span className="inline-block rounded-full border border-rbp-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-rbp-accent">
              {product.category}
            </span>
            <GothicHeading as="h1" className="mt-4 text-[2.8rem] leading-[0.9] text-rbp-accent sm:text-[3.4rem]">
              {product.name}
            </GothicHeading>
            <div className="mt-4 flex items-center gap-2 text-[14px]">
              <span className="tracking-widest text-rbp-accent">★★★★★</span>
              <span className="text-white/70">({product.reviewCount ?? 28} Reviews)</span>
            </div>
            <p className="mt-4 text-[2.4rem] font-bold leading-none text-white">{formatPhp(priceCents)}</p>
            <p className="font-secondary mt-5 text-[15px] leading-relaxed text-white/80">{description}</p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {specRows.map(([label, value]) => (
                <div key={label} className="rounded-rbp border border-white/10 px-4 py-3">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</dt>
                  <dd className="mt-1 text-[14px] text-white">{value}</dd>
                </div>
              ))}
            </dl>

            {groups.length > 0 && (
              <div className="mt-6 space-y-4">
                {groups.map((group) => (
                  <div key={group.key}>
                    <p className="text-[13px] text-white/70">{group.name}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.values.map((value) => {
                        const active = selected[group.key] === value
                        if (group.key === 'color') {
                          const swatch = colorChoice(value)
                          return (
                            <button
                              key={value}
                              type="button"
                              aria-pressed={active}
                              onClick={() => pick(group.key, value)}
                              className={`text-[15px] font-semibold ${active ? 'underline decoration-2 underline-offset-4' : 'opacity-80 hover:opacity-100'}`}
                              style={{ color: swatch.key === 'black' ? '#f2f2f2' : swatch.color }}
                            >
                              {value}
                            </button>
                          )
                        }
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => pick(group.key, value)}
                            className={`rounded-full border px-3 py-1.5 text-[14px] font-semibold ${active ? 'border-rbp-accent text-rbp-accent' : 'border-white/20 text-white/80 hover:border-rbp-accent'}`}
                          >
                            {value}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mb-3 mt-6 text-[13px] text-white/70">Quantity</p>
            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper value={qty} onChange={setQty} size="lg" />
              <OrangeButton
                className="h-12 min-w-[160px] flex-1 font-semibold text-black"
                icon={<IconCart size={18} />}
                onClick={() => void addCurrent()}
              >
                Add to Cart
              </OrangeButton>
              <button
                type="button"
                onClick={() => {
                  void addCurrent().then(() => navigate('/checkout'))
                }}
                className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center rounded-rbp border border-[#ff9a17] bg-[#080808] px-5 text-sm font-semibold text-white hover:border-rbp-accent"
              >
                Buy Now
              </button>
              <button
                type="button"
                aria-label="Save"
                className="flex h-12 w-12 items-center justify-center rounded-rbp border border-rbp-border text-rbp-accent"
              >
                <IconHeart size={20} />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-[12px] text-white/75 sm:grid-cols-4">
              {[
                ['Hypoallergenic', 'Skin safe'],
                ['Premium', 'Quality'],
                ['Piercing', 'Support'],
                ['Secure', 'Shipping'],
              ].map(([title, detail]) => (
                <div key={title} className="flex items-center gap-2">
                  <IconShield size={18} />
                  <span>
                    {title}
                    <br />
                    {detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="border-t border-rbp-border/60 px-5 py-14 sm:px-8 lg:py-20">
        <div className={`mx-auto max-w-6xl p-6 sm:p-8 ${rbpPanel}`}>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-[13px] ${
                  activeTab === tab
                    ? 'bg-gradient-to-b from-[#ffb000] to-[#e85d00] font-semibold text-black'
                    : 'border border-rbp-border text-white/80 hover:border-rbp-accent'
                }`}
              >
                {tab === 'Reviews' ? `Reviews (${product.reviewCount ?? 28})` : tab}
              </button>
            ))}
          </div>
          <div className="mt-8 max-w-3xl text-[15px] leading-relaxed text-white/85">
            {activeTab === 'Description' && <p className="font-secondary">{description}</p>}
            {activeTab === 'Specifications' && (
              <ul className="space-y-3">
                {specRows.map(([label, value]) => (
                  <li key={label} className="flex justify-between gap-6 border-b border-white/10 pb-3">
                    <span className="text-white/55">{label}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            )}
            {activeTab === 'Reviews' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['The finish is clean and it sits comfortably.', 'Bianca T.'],
                  ['Exactly as shown, and the gem catches the light.', 'Mark R.'],
                ].map(([quote, name]) => (
                  <article key={name} className="rounded-rbp border border-white/10 px-4 py-4">
                    <p className="font-secondary">&ldquo;{quote}&rdquo;</p>
                    <p className="mt-3 tracking-widest text-rbp-accent">★★★★★</p>
                    <p className="mt-1 text-[13px] text-white/55">– {name}</p>
                  </article>
                ))}
              </div>
            )}
            {activeTab.startsWith('Shipping') && (
              <p className="font-secondary">Secure shipping across the Philippines. Unopened jewelry can be returned within 7 days.</p>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 lg:pb-24">
        <div className="mx-auto max-w-6xl">
          <GothicHeading className="text-center text-[2.6rem]">You May Also Like</GothicHeading>
          <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
