import { supabase } from './supabase.ts'

export type ProductChoice = {
  key: string
  material?: string
  sizeLabel?: string
  color?: string
  priceCents?: number
}

type VersionRow = { label?: string | null; price_cents?: number | null; options?: Record<string, string> | null }

const SIZE_KEYS = new Set(['length', 'size', 'gauge'])

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

export function choiceFromVersions(rows: VersionRow[]): ProductChoice | null {
  const groups = new Map<string, string[]>()
  let priceCents: number | null = null
  for (const row of rows) {
    if (priceCents == null && row.price_cents != null) priceCents = row.price_cents
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
  if (!groups.size) return null
  const selected = Object.fromEntries([...groups].map(([key, list]) => [key, list[0]]))
  const preferred = ['length', 'size', 'gauge']
  const sizeLabel = [...groups.keys()]
    .filter((key) => key !== 'material' && key !== 'color')
    .sort((a, b) => (preferred.indexOf(a) === -1 ? 99 : preferred.indexOf(a)) - (preferred.indexOf(b) === -1 ? 99 : preferred.indexOf(b)))
    .map((key) => selected[key])
    .filter(Boolean)
    .join(' / ')
  return {
    key: Object.entries(selected).map(([key, value]) => `${key}:${value}`).join('|'),
    material: selected.material,
    sizeLabel: sizeLabel || undefined,
    color: selected.color,
    priceCents: priceCents ?? undefined,
  }
}

export async function defaultChoiceFor(productId: string) {
  if (!supabase || !productId) return null
  const { data } = await supabase
    .from('product_variants')
    .select('label, price_cents, options')
    .eq('product_id', productId)
    .eq('status', 'active')
    .order('sort_order')
  return choiceFromVersions((data ?? []) as VersionRow[])
}
