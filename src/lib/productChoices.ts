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

type VersionRow = { label?: string | null; price_cents?: number | null; options?: Record<string, string> | null }

const SIZE_KEYS = new Set(['length', 'size', 'gauge'])
const ORDER = ['length', 'size', 'gauge', 'color', 'material']

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
    if (!options.length && row.label?.trim()) {
      const current = groups.get('version') ?? []
      if (!current.includes(row.label.trim())) groups.set('version', [...current, row.label.trim()])
    }
    for (const [key, value] of options) {
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
      name: key === 'length' && hasSize ? 'Length' : key === 'length' ? 'Size' : key === 'gauge' ? 'Gauge' : key === 'color' ? 'Color' : key === 'material' ? 'Material' : key === 'size' ? 'Size' : key.charAt(0).toUpperCase() + key.slice(1),
      values: groups.get(key) ?? [],
    }))
    .filter((group) => group.values.length > 0)
}

function versionAllows(row: VersionRow, selected: Record<string, string>) {
  const options = Object.entries(row.options ?? {}).filter(([, value]) => value?.trim())
  if (!options.length) return false
  return options.every(([key, value]) => {
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

export async function defaultChoiceFor(productId: string) {
  return choiceFromVersions(await versionRows(productId))
}

export async function optionGroupsFor(productId: string) {
  const rows = await versionRows(productId)
  return { groups: groupsFromVersions(rows), rows }
}
