import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterSidebar, type FilterState } from '../components/commerce/FilterSidebar.tsx'
import { ProductCard } from '../components/commerce/ProductCard.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { IconSearch } from '../components/ui/Icons.tsx'
import { rbpField } from '../components/ui/panels.ts'
import { CATEGORY_FILTERS } from '../data/products.ts'
import { useProducts } from '../hooks/useProducts.ts'
import { asset } from '../lib/assets.ts'
import { supabase } from '../lib/supabase.ts'

const PAGE_SIZE = 12

const categorySlug: Record<string, string> = {
  'Navel Jewelry': 'navel',
  'Tongue Barbells': 'tongue',
  'Hinged Clickers': 'hinged',
  'Segment Rings': 'segment',
  'Labret / Lip': 'labret',
  Eyebrow: 'eyebrow',
  'Ear Jewelry': 'ear',
}

function categoryFromParam(value: string | null) {
  if (!value) return []
  if (categorySlug[value]) return [value]
  const name = Object.entries(categorySlug).find(([, slug]) => slug === value)?.[0]
  return [name ?? value]
}

function sameName(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function productInCollection(product: { id: string; category: string }, name: string, membership: Record<string, string[]>) {
  if (sameName(product.category, name)) return true
  const fromSlug = Object.entries(categorySlug).find(([, slug]) => slug === name)?.[0]
  if (fromSlug && sameName(product.category, fromSlug)) return true
  if (categorySlug[product.category] === name) return true
  return (membership[product.id] ?? []).some((group) => sameName(group, name) || (fromSlug ? sameName(group, fromSlug) : false))
}

export function CollectionsPage() {
  const { products, loading } = useProducts()
  const [params, setParams] = useSearchParams()
  const initialCat = params.get('category')
  const initialQuery = params.get('q') ?? ''
  const [shopCollections, setShopCollections] = useState<{ id: string; name: string }[] | null>(null)
  const [membership, setMembership] = useState<Record<string, string[]>>({})

  const [filters, setFilters] = useState<FilterState>({
    categories: categoryFromParam(initialCat),
  })
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState('bestselling')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setFilters((current) => ({ ...current, categories: categoryFromParam(params.get('category')) }))
    setQuery(params.get('q') ?? '')
  }, [params])

  useEffect(() => {
    if (!supabase) return
    let active = true
    void Promise.all([
      supabase.from('collections').select('id, name').eq('status', 'active').order('sort_order'),
      supabase.from('product_collections').select('product_id, collection_id'),
    ]).then(([collectionResult, linkResult]) => {
      if (!active) return
      const rows = (collectionResult.data ?? []) as { id: string; name: string }[]
      const seen = new Set<string>()
      const groups = rows.filter((group) => {
        if (seen.has(group.name)) return false
        seen.add(group.name)
        return true
      })
      if (!collectionResult.error && groups.length) setShopCollections(groups)
      const names = new Map(rows.map((group) => [group.id, group.name]))
      const next: Record<string, string[]> = {}
      for (const link of (linkResult.data ?? []) as { product_id: string; collection_id: string }[]) {
        const name = names.get(link.collection_id)
        if (!name) continue
        next[link.product_id] = [...(next[link.product_id] ?? []), name]
      }
      setMembership(next)
    })
    return () => {
      active = false
    }
  }, [])

  const catalog = products

  const collectionFilters = useMemo(() => {
    if (!shopCollections) return CATEGORY_FILTERS
    return shopCollections.map((group) => ({
      id: group.name,
      label: group.name,
      count: catalog.filter((product) => productInCollection(product, group.name, membership)).length,
    }))
  }, [catalog, membership, shopCollections])

  const filtered = useMemo(() => {
    let list = [...catalog]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (filters.categories.length) {
      list = list.filter((product) => filters.categories.some((name) => productInCollection(product, name, membership)))
    }
    if (sort === 'price-asc') list.sort((a, b) => a.priceCents - b.priceCents)
    if (sort === 'price-desc') list.sort((a, b) => b.priceCents - a.priceCents)
    return list
  }, [catalog, filters, membership, query, sort])

  useEffect(() => {
    setPage(1)
  }, [query, sort, filters])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  return (
    <div className="w-full bg-black">
      <section className="relative min-h-[380px] w-full overflow-hidden lg:min-h-[460px]">
        <img
          src={asset('banners/collections-hero.jpg')}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="relative z-10 flex min-h-[380px] max-w-3xl flex-col justify-center px-6 py-16 sm:px-12 lg:min-h-[460px] lg:px-16">
          <p className="font-secondary text-[12px] font-semibold uppercase tracking-[0.32em] text-rbp-cream">Shop Our</p>
          <GothicHeading as="h1" className="mt-2 text-[4.2rem] leading-[0.85] text-rbp-accent sm:text-[5.4rem]">
            Collections
          </GothicHeading>
          <p className="font-secondary mt-5 max-w-md text-[16px] leading-relaxed text-white/90">
            Premium body jewelry for every style, placement, and piercing.
          </p>
          <div className="mt-6 h-[3px] w-56 bg-gradient-to-r from-rbp-accent to-transparent" />
        </div>
        <div className="header-glow absolute bottom-0 left-0" />
      </section>

      <div className="border-b border-rbp-border/50 px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params)
              next.delete('category')
              setParams(next, { replace: true })
            }}
            className={`shrink-0 rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide ${
              filters.categories.length === 0
                ? 'border-rbp-accent bg-rbp-accent text-black'
                : 'border-rbp-border text-white hover:border-rbp-accent'
            }`}
          >
            All
          </button>
          {collectionFilters.map((category) => {
            const active = filters.categories.includes(category.id)
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(params)
                  if (active) next.delete('category')
                  else next.set('category', category.id)
                  setParams(next, { replace: true })
                }}
                className={`shrink-0 rounded-full border px-4 py-2 text-[12px] font-medium ${
                  active
                    ? 'border-rbp-accent bg-rbp-accent text-black'
                    : 'border-rbp-border text-white/85 hover:border-rbp-accent'
                }`}
              >
                {category.label}
              </button>
            )
          })}
        </div>
      </div>

      <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <FilterSidebar filters={filters} onChange={setFilters} categories={collectionFilters} />
          <div className="min-w-0 flex-1">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-display text-[2.4rem] leading-none text-rbp-accent">All Products</h2>
                <p className="mt-2 text-[13px] text-white/60">
                  {filtered.length === 0
                    ? '0 pieces'
                    : `Showing ${start + 1}–${start + visible.length} of ${filtered.length}`}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className={`flex h-11 items-center gap-2 px-3 ${rbpField}`}>
                  <IconSearch size={15} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search jewelry..."
                    className="min-w-[180px] flex-1 bg-transparent text-[13px] outline-none"
                  />
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className={`h-11 px-3 ${rbpField} text-[13px]`}
                >
                  <option value="bestselling">Best Selling</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
            {loading ? (
              <p className="rounded-rbp border border-dashed border-rbp-border py-16 text-center text-white/60">Loading jewelry…</p>
            ) : filtered.length === 0 ? (
              <p className="rounded-rbp border border-dashed border-rbp-border py-16 text-center text-white/60">
                No jewelry matches those filters.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {visible.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            {pageCount > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-10 rounded-full border border-rbp-border px-4 text-[13px] text-white disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`h-10 w-10 rounded-full text-[13px] font-semibold ${
                      n === currentPage ? 'bg-rbp-accent text-black' : 'border border-rbp-border text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                  className="h-10 rounded-full border border-rbp-border px-4 text-[13px] text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}