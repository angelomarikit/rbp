import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductCard } from '../components/commerce/ProductCard.tsx'
import { OrangeButton } from '../components/ui/Buttons.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { IconCart, IconChevron, IconHeart, IconShield } from '../components/ui/Icons.tsx'
import { QuantityStepper } from '../components/ui/QuantityStepper.tsx'
import { rbpPanel } from '../components/ui/panels.ts'
import { FEATURED_PRODUCT_SLUG, GEM_VARIANTS, getProductBySlug } from '../data/products.ts'
import { useCart } from '../features/cart/CartProvider.tsx'
import { rowToProduct, useProducts } from '../hooks/useProducts.ts'
import { formatPhp } from '../lib/format.ts'
import { publicMediaUrl } from '../lib/media.ts'
import { supabase } from '../lib/supabase.ts'

const GALLERY = [
  'products/navel-barbell-hero.jpg',
  'products/navel-barbell-gallery-1.jpg',
  'products/navel-barbell-gallery-2.jpg',
  'products/navel-barbell-gallery-3.jpg',
]

const tabs = ['Description', 'Specifications', 'Reviews', 'Shipping & Returns'] as const

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { addProduct } = useCart()
  const { products } = useProducts()
  const [product, setProduct] = useState<ReturnType<typeof getProductBySlug>>(getProductBySlug(slug))
  const [gallery, setGallery] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [qty, setQty] = useState(1)
  const [gem, setGem] = useState(GEM_VARIANTS[0])
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Description')
  const [hero, setHero] = useState(0)

  useEffect(() => {
    let cancelled = false
    setHero(0)
    setQty(1)
    setGem(GEM_VARIANTS[0])
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
      setProduct(next)
      if (next.slug === FEATURED_PRODUCT_SLUG && paths.length <= 1) setGallery(GALLERY)
      else setGallery(paths.length ? paths : next.imagePath ? [next.imagePath] : [])
      setReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [slug])

  if (!ready && !product) {
    return <div className="px-6 py-20 text-center text-sm text-white/60">Loading product…</div>
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
  const specRows = product.specs
    ? [
        ['Material', product.specs.material],
        ['Thickness (Gauge)', product.specs.gauge],
        ['Bar Length', product.specs.barLength],
        ['Gem', product.specs.gem],
        ['Color / Finish', product.specs.finish],
      ]
    : [
        ['Material', product.material],
        ['Category', product.category],
        ['Finish', 'Polished'],
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
            <p className="mt-4 text-[2.4rem] font-bold leading-none text-white">{formatPhp(product.priceCents)}</p>
            <p className="mt-5 text-[15px] leading-relaxed text-white/80">{description}</p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {specRows.map(([label, value]) => (
                <div key={label} className="rounded-rbp border border-white/10 px-4 py-3">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</dt>
                  <dd className="mt-1 text-[14px] text-white">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6">
              <p className="text-[13px] text-white/70">Gem color</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {GEM_VARIANTS.map((variant) => (
                  <button
                    key={variant.key}
                    type="button"
                    onClick={() => setGem(variant)}
                    className={`text-[15px] font-semibold ${gem.key === variant.key ? 'underline decoration-2 underline-offset-4' : 'opacity-80 hover:opacity-100'}`}
                    style={{ color: variant.key === 'black' ? '#f2f2f2' : variant.color }}
                  >
                    {variant.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mb-3 mt-6 text-[13px] text-white/70">Quantity</p>
            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper value={qty} onChange={setQty} size="lg" />
              <OrangeButton
                className="h-12 min-w-[160px] flex-1 font-semibold text-black"
                icon={<IconCart size={18} />}
                onClick={() => addProduct(product, qty, { key: gem.key, label: gem.label })}
              >
                Add to Cart
              </OrangeButton>
              <button
                type="button"
                onClick={() => {
                  addProduct(product, qty, { key: gem.key, label: gem.label })
                  navigate('/checkout')
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
            {activeTab === 'Description' && <p>{description}</p>}
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
                    <p>&ldquo;{quote}&rdquo;</p>
                    <p className="mt-3 tracking-widest text-rbp-accent">★★★★★</p>
                    <p className="mt-1 text-[13px] text-white/55">– {name}</p>
                  </article>
                ))}
              </div>
            )}
            {activeTab.startsWith('Shipping') && (
              <p>Secure shipping across the Philippines. Unopened jewelry can be returned within 7 days.</p>
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
