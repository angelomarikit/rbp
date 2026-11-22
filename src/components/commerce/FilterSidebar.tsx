import { CATEGORY_FILTERS } from '../../data/products.ts'

export type FilterState = {
  categories: string[]
}

type FilterOption = { id: string; label: string; count: number }

type Props = {
  filters: FilterState
  onChange: (next: FilterState) => void
  categories?: FilterOption[]
}

export function FilterSidebar({ filters, onChange, categories = CATEGORY_FILTERS }: Props) {
  const toggle = (id: string) => {
    const set = new Set(filters.categories)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange({ ...filters, categories: [...set] })
  }

  return (
    <aside className="w-full shrink-0 rounded-rbp border border-rbp-border/70 bg-[#070707] p-5 lg:sticky lg:top-6 lg:w-[240px] lg:self-start">
      <p className="mb-3 text-[16px] font-bold text-rbp-text">Collections</p>
      <ul className="space-y-2.5 text-[13px] text-[#c5c0bb]">
        {categories.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={filters.categories.includes(c.id)}
              onChange={() => toggle(c.id)}
              className="mt-0.5 accent-rbp-accent"
            />
            <span>
              {c.label} ({c.count})
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}