import { CATEGORY_FILTERS, MATERIAL_FILTERS } from '../../data/products.ts'
import { rbpField } from '../ui/panels.ts'

export type FilterState = {
  categories: string[]
  materials: string[]
  barLength: string
  gauge: string
}

type Props = {
  filters: FilterState
  onChange: (next: FilterState) => void
}

export function FilterSidebar({ filters, onChange }: Props) {
  const toggle = (key: 'categories' | 'materials', id: string) => {
    const set = new Set(filters[key])
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange({ ...filters, [key]: [...set] })
  }

  return (
    <aside className="w-full shrink-0 rounded-rbp border border-rbp-border/70 bg-[#070707] p-5 lg:sticky lg:top-6 lg:w-[240px] lg:self-start">
      <p className="mb-3 text-[16px] font-bold text-rbp-text">Collections</p>
      <ul className="space-y-2.5 text-[13px] text-[#c5c0bb]">
        {CATEGORY_FILTERS.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={filters.categories.includes(c.id)}
              onChange={() => toggle('categories', c.id)}
              className="mt-0.5 accent-rbp-accent"
            />
            <span>
              {c.label} ({c.count})
            </span>
          </li>
        ))}
      </ul>
      <div className="my-4 h-px bg-rbp-border" />
      <p className="mb-3 text-[16px] font-bold text-rbp-text">Material</p>
      <ul className="space-y-2.5 text-[13px] text-[#c5c0bb]">
        {MATERIAL_FILTERS.map((m) => (
          <li key={m.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={filters.materials.includes(m.id)}
              onChange={() => toggle('materials', m.id)}
              className="mt-0.5 accent-rbp-accent"
            />
            <span>
              {m.label} ({m.count})
            </span>
          </li>
        ))}
      </ul>
      <div className="my-4 h-px bg-rbp-border" />
      <p className="mb-2 text-[16px] font-bold text-rbp-text">Size</p>
      <p className="mb-1 text-[14px] text-rbp-text">Bar Length</p>
      <select
        value={filters.barLength}
        onChange={(e) => onChange({ ...filters, barLength: e.target.value })}
        className={`mb-3 ${rbpField} text-[13px]`}
      >
        <option value="all">All Lengths</option>
        <option value="8mm">8 mm</option>
        <option value="10mm">10 mm</option>
      </select>
      <p className="mb-1 text-[14px] text-rbp-text">Gauge (Thickness)</p>
      <select
        value={filters.gauge}
        onChange={(e) => onChange({ ...filters, gauge: e.target.value })}
        className={`${rbpField} text-[13px]`}
      >
        <option value="all">All Gauges</option>
        <option value="14g">14G</option>
        <option value="16g">16G</option>
      </select>
    </aside>
  )
}