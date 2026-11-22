import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterSidebar, type FilterState } from '../components/commerce/FilterSidebar.tsx'
import { ProductCard } from '../components/commerce/ProductCard.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { IconSearch } from '../components/ui/Icons.tsx'
import { rbpField } from '../components/ui/panels.ts'
import { CATEGORY_FILTERS, FEATURED_PRODUCT_SLUG } from '../data/products.ts'
import { useProducts } from '../hooks/useProducts.ts'
import { asset } from '../lib/assets.ts'

const PAGE_SIZE = 8

const categorySlug: Record<string, string> = {
  'Navel Jewelry': 'navel',
  'Tongue Barbells': 'tongue',
  'Hinged Clickers': 'hinged',
  'Segment Rings': 'segment',
  'Labret / Lip': 'labret',
  Eyebrow: 'eyebrow',
  'Ear Jewelry': 'ear',
}

export function CollectionsPage() {
  const { products } = useProducts()
  const [params] = useSearchParams()
  const initialCat = params.get('category')
  const initialQuery = params.get('q') ?? ''

  const [filters, setFilters] = useState<FilterState>({
    categories: initialCat ? [categorySlug[initialCat] ?? ''].filter(Boolean) : [],
    materials: [],
    barLength: 'all',
    gauge: 'all',
  })
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState('bestselling')
  const [page, setPage] = useState(1)

  const catalog = useMemo(() => products.filter((p) => p.slug !== FEATURED_PRODUCT_SLUG), [products])

  const filtered = useMemo(() => {
    let list = [...catalog]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (filters.categories.length) {
      list = list.filter((p) => {
        const id = categorySlug[p.category]
        return id && filters.categories.includes(id)
      })
    }
    if (filters.materials.length) {
      list = list.filter((p) => {
        if (filters.materials.includes('titanium') && p.material.includes('Titanium')) return true
        if (filters.materials.includes('316l') && p.material.includes('316')) return true
        if (filters.materials.includes('gold') && p.material.includes('Gold')) return true
        return false
      })
    }
    if (sort === 'price-asc') list.sort((a, b) => a.priceCents - b.priceCents)
    if (sort === 'price-desc') list.sort((a, b) => b.priceCents - a.priceCents)
    return list
  }, [catalog, filters, query, sort])

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
          <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-rbp-cream">Shop Our</p>
          <GothicHeading as="h1" className="mt-2 text-[4.2rem] leading-[0.85] text-rbp-accent sm:text-[5.4rem]">
            Collections
          </GothicHeading>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-white/90">
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
            onClick={() => setFilters({ ...filters, categories: [] })}
            className={`shrink-0 rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide ${
              filters.categories.length === 0
                ? 'border-rbp-accent bg-rbp-accent text-black'
                : 'border-rbp-border text-white hover:border-rbp-accent'
            }`}
          >
            All
          </button>
          {CATEGORY_FILTERS.map((category) => {
            const active = filters.categories.includes(category.id)
            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setFilters({
                    ...filters,
                    categories: active ? [] : [category.id],
                  })
                }
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
          <FilterSidebar filters={filters} onChange={setFilters} />
          <div className="min-w-0 flex-1">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-display text-[2.4rem] leading-none text-rbp-accent">All Collections</h2>
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
            {filtered.length === 0 ? (
              <p className="rounded-rbp border border-dashed border-rbp-border py-16 text-center text-white/60">
                No jewelry matches those filters.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
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