import { supabase } from './supabase.ts'

export type ProductChoice = {
  key: string
  material?: string
  sizeLabel?: string
  color?: string
  priceCents?: number
  options: Record<string, string>
}

export type ChoiceGroup = { key: string; name: string; values: string[] }

export type StoreDesign = { name: string; image: string }

const HIDDEN_KEYS = new Set(['design', 'design_image', 'version'])

type VersionRow = { label?: string | null; price_cents?: number | null; options?: Record<string, string> | null }

const SIZE_KEYS = new Set(['length', 'size', 'gauge'])
const ORDER = ['length', 'size', 'gauge', 'design', 'color', 'material']

function measures(value: string) {
  const parts = value.split(/\s*(?:,|\/|\||·|;)\s*|\s+(?=\d)/).map((part) => part.trim()).filter(Boolean)
  const measure = /^\d+(?:\.\d+)?\s*(?:mm|g|ga|gauge)?$/i
  if (parts.length > 1 && parts.every((part) => measure.test(part))) return parts
  return [value]
}

function valuesFor(key: string, value: string) {
  if (SIZE_KEYS.has(key)) return measures(value)
  return [value]
}

export function groupsFromVersions(rows: VersionRow[]): ChoiceGroup[] {
  const groups = new Map<string, string[]>()
  for (const row of rows) {
    const options = Object.entries(row.options ?? {}).filter(([, value]) => value?.trim())
    const choices = options.filter(([key]) => !HIDDEN_KEYS.has(key))
    for (const [key, value] of choices) {
      const current = groups.get(key) ?? []
      for (const part of valuesFor(key, value.trim())) {
        if (!current.includes(part)) current.push(part)
      }
      if (current.length) groups.set(key, current)
    }
  }
  const hasSize = groups.has('size')
  return [...groups.keys()]
    .sort((a, b) => (ORDER.indexOf(a) === -1 ? 99 : ORDER.indexOf(a)) - (ORDER.indexOf(b) === -1 ? 99 : ORDER.indexOf(b)))
    .map((key) => ({
      key,
      name: key === 'length' && hasSize ? 'Length' : key === 'length' ? 'Size' : key === 'gauge' ? 'Gauge' : key === 'design' ? 'Design' : key === 'color' ? 'Color' : key === 'material' ? 'Material' : key === 'size' ? 'Size' : key.charAt(0).toUpperCase() + key.slice(1),
      values: groups.get(key) ?? [],
    }))
    .filter((group) => group.values.length > 0)
}

function versionAllows(row: VersionRow, selected: Record<string, string>) {
  const options = Object.entries(row.options ?? {}).filter(([, value]) => value?.trim())
  if (!options.length) return false
  return options.every(([key, value]) => {
    if (HIDDEN_KEYS.has(key)) return true
    const choices = valuesFor(key, value.trim())
    return !selected[key] || choices.includes(selected[key])
  })
}

export function describeSelection(selected: Record<string, string>, rows: VersionRow[] = []): ProductChoice {
  const sizeLabel = ['length', 'size', 'gauge']
    .map((key) => selected[key])
    .filter(Boolean)
    .join(' / ')
  const priced = rows.find((row) => row.price_cents != null && versionAllows(row, selected))
  return {
    key: Object.entries(selected).filter(([, value]) => value).map(([key, value]) => `${key}:${value}`).join('|') || 'default',
    material: selected.material,
    sizeLabel: sizeLabel || undefined,
    color: selected.color,
    priceCents: priced?.price_cents ?? undefined,
    options: selected,
  }
}

export function designsFromSpecs(specs: unknown): StoreDesign[] {
  const list = specs && typeof specs === 'object' ? (specs as { designs?: unknown }).designs : null
  if (!Array.isArray(list)) return []
  return list.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const name = String((item as { name?: unknown }).name ?? '').trim()
    const image = String((item as { image?: unknown }).image ?? '').trim()
    return name ? [{ name, image }] : []
  })
}

export function designsFromVersions(rows: VersionRow[]): StoreDesign[] {
  const designs: StoreDesign[] = []
  for (const row of rows) {
    const name = row.options?.design?.trim()
    if (!name || designs.some((design) => design.name === name)) continue
    designs.push({ name, image: row.options?.design_image?.trim() || '' })
  }
  return designs
}

export function productDesigns(specs: unknown, rows: VersionRow[] = []): StoreDesign[] {
  const saved = designsFromSpecs(specs)
  return saved.length ? saved : designsFromVersions(rows)
}

export function imageForDesign(designs: StoreDesign[], design: string) {
  return designs.find((item) => item.name === design.trim())?.image || ''
}

export function choiceFromVersions(rows: VersionRow[]): ProductChoice | null {
  const groups = groupsFromVersions(rows)
  if (!groups.length) return null
  const selected = Object.fromEntries(groups.map((group) => [group.key, group.values[0]]))
  return describeSelection(selected, rows)
}

async function versionRows(productId: string) {
  if (!supabase || !productId) return []
  const { data } = await supabase
    .from('product_variants')
    .select('label, price_cents, options')
    .eq('product_id', productId)
    .eq('status', 'active')
    .order('sort_order')
  return (data ?? []) as VersionRow[]
}

function rowsFromProduct(product: { material?: string | null; specs?: { material?: string; gauge?: string; barLength?: string; gem?: string; finish?: string } | null }) {
  const options: Record<string, string> = {}
  const material = product.specs?.material?.trim() || product.material?.trim()
  if (material) options.material = material
  if (product.specs?.gauge?.trim()) options.gauge = product.specs.gauge.trim()
  if (product.specs?.barLength?.trim()) options.length = product.specs.barLength.trim()
  if (product.specs?.finish?.trim()) options.finish = product.specs.finish.trim()
  if (product.specs?.gem?.trim()) options.gem = product.specs.gem.trim()
  return Object.keys(options).length ? [{ options }] : []
}

export async function optionGroupsFor(productId: string) {
  const versions = await versionRows(productId)
  let rows = versions
  let specs: unknown = null
  if (supabase && productId) {
    const { data } = await supabase.from('products').select('material, specs').eq('id', productId).maybeSingle()
    specs = data?.specs
    if (!groupsFromVersions(rows).length && data) rows = rowsFromProduct(data)
  }
  return { groups: groupsFromVersions(rows), rows, designs: productDesigns(specs, rows) }
}

export async function defaultChoiceFor(productId: string) {
  const { rows, designs } = await optionGroupsFor(productId)
  const choice = choiceFromVersions(rows)
  if (!choice) return null
  const design = designs[0]?.name?.trim()
  if (design) {
    choice.options = { ...choice.options, design }
  }
  return choice
}
