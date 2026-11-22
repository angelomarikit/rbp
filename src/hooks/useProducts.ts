import { useEffect, useState } from 'react'
import { PRODUCTS } from '../data/products.ts'
import type { Product as ProductType } from '../data/types.ts'
import { supabase } from '../lib/supabase.ts'

export function rowToProduct(row: Record<string, unknown>): ProductType {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    priceCents: Number(row.price_cents),
    category: String(row.category),
    material: String(row.material),
    imagePath: String(row.image_path),
    specs: row.specs as ProductType['specs'],
    description: row.description as string | undefined,
    reviewCount: row.review_count as number | undefined,
    rating: row.rating as number | undefined,
  }
}

export function useProducts() {
  const [products, setProducts] = useState<ProductType[]>(supabase ? [] : PRODUCTS)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    setLoading(true)
    void (async () => {
      const columns = 'id, slug, name, price_cents, category, material, image_path, specs, description, review_count, rating, status, published, created_at'
      let result = await supabase
        .from('products')
        .select(columns)
        .eq('status', 'active')
        .eq('published', true)
        .order('created_at', { ascending: false })
      if (result.error) {
        result = await supabase
          .from('products')
          .select(columns)
          .eq('status', 'active')
          .eq('published', true)
          .order('name')
      }
      if (!cancelled && !result.error) {
        setProducts((result.data ?? []).map((row) => rowToProduct(row as Record<string, unknown>)))
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { products, loading, source: supabase ? 'supabase' : 'local' as const }
}