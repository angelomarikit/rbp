import { PRODUCTS } from '../data/products.ts'
import type { Product } from '../data/types.ts'
import { rowToProduct } from '../hooks/useProducts.ts'
import { supabase } from '../lib/supabase.ts'

function sameName(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function localProductForCollection(collectionName: string): Product | null {
  const byName = PRODUCTS.find((p) => sameName(p.name, collectionName))
  if (byName) return byName
  return PRODUCTS.find((p) => sameName(p.category, collectionName)) ?? null
}

const productColumns =
  'id, slug, name, price_cents, category, material, image_path, specs, description, review_count, rating'

/** First active product linked to a shop collection (homepage category tile). */
export async function productForCollectionName(collectionName: string): Promise<Product | null> {
  if (!supabase) return localProductForCollection(collectionName)

  const { data: collection } = await supabase
    .from('collections')
    .select('id')
    .eq('name', collectionName)
    .eq('status', 'active')
    .maybeSingle()

  if (collection?.id) {
    const { data: link } = await supabase
      .from('product_collections')
      .select('product_id')
      .eq('collection_id', collection.id)
      .limit(1)
      .maybeSingle()
    if (link?.product_id) {
      const { data: row } = await supabase
        .from('products')
        .select(productColumns)
        .eq('id', link.product_id)
        .eq('status', 'active')
        .eq('published', true)
        .maybeSingle()
      if (row) return rowToProduct(row as Record<string, unknown>)
    }
  }

  const { data: byProductName } = await supabase
    .from('products')
    .select(productColumns)
    .eq('status', 'active')
    .eq('published', true)
    .ilike('name', collectionName)
    .limit(1)
    .maybeSingle()
  if (byProductName) return rowToProduct(byProductName as Record<string, unknown>)

  const { data: byCategory } = await supabase
    .from('products')
    .select(productColumns)
    .eq('status', 'active')
    .eq('published', true)
    .ilike('category', collectionName)
    .limit(1)
    .maybeSingle()
  if (byCategory) return rowToProduct(byCategory as Record<string, unknown>)

  return localProductForCollection(collectionName)
}