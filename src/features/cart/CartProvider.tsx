import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartLine, Product } from '../../data/types.ts'
import { publicMediaUrl } from '../../lib/media.ts'
import { defaultChoiceFor, type ProductChoice } from '../../lib/productChoices.ts'
import { supabase } from '../../lib/supabase.ts'

const STORAGE_KEY = 'rbp_cart_v1'

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  subtotalCents: number
  addProduct: (
    product: Product,
    quantity?: number,
    variant?: { key: string; label?: string; priceCents?: number; material?: string; sizeLabel?: string; color?: string; options?: Record<string, string>; sizes?: string[]; imagePath?: string },
  ) => void
  updateLine: (lineId: string, patch: Partial<CartLine>) => void
  updateQuantity: (lineId: string, quantity: number) => void
  removeLine: (lineId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function makeLineId(slug: string, variantKey?: string) {
  return `${slug}::${variantKey ?? 'default'}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as CartLine[]
    } catch {
      /* ignore */
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])

  useEffect(() => {
    if (!supabase) return
    const pending = lines.filter((line) => !line.variantKey && !line.sizeLabel && !line.color)
    if (!pending.length) return
    let cancelled = false
    void (async () => {
      const choices = new Map<string, ProductChoice | null>()
      await Promise.all(pending.map(async (line) => {
        if (choices.has(line.productId)) return
        choices.set(line.productId, await defaultChoiceFor(line.productId))
      }))
      if (cancelled) return
      setLines((current) => current.map((line) => {
        if (line.variantKey || line.sizeLabel || line.color) return line
        const choice = choices.get(line.productId)
        if (!choice) return { ...line, variantKey: 'default' }
        return {
          ...line,
          variantKey: choice.key || 'default',
          material: choice.material || line.material,
          sizeLabel: choice.sizeLabel,
          color: choice.color,
          options: choice.options,
          priceCents: choice.priceCents ?? line.priceCents,
        }
      }))
    })()
    return () => {
      cancelled = true
    }
  }, [lines])

  const addProduct = useCallback(
    (
      product: Product,
      quantity = 1,
      variant?: { key: string; label?: string; priceCents?: number; material?: string; sizeLabel?: string; color?: string; options?: Record<string, string>; sizes?: string[]; imagePath?: string },
    ) => {
      const lineId = makeLineId(product.slug, variant?.key)
      setLines((prev) => {
        const existing = prev.find((l) => l.lineId === lineId)
        if (existing) {
          return prev.map((l) =>
            l.lineId === lineId
              ? { ...l, quantity: l.quantity + quantity }
              : l,
          )
        }
        return [
          ...prev,
          {
            lineId,
            cartId: lineId,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            priceCents: variant?.priceCents ?? product.priceCents,
            quantity,
            imagePath: variant?.imagePath || product.imagePath,
            variantKey: variant?.key,
            variantLabel: variant?.sizeLabel || variant?.label,
            material: variant?.material || product.specs?.material || product.material,
            sizeLabel: variant?.sizeLabel || variant?.label,
            color: variant?.color,
            options: variant?.options,
            sizes: variant?.sizes,
          },
        ]
      })
    },
    [],
  )

  const updateLine = useCallback((lineId: string, patch: Partial<CartLine>) => {
    setLines((prev) => {
      const current = prev.find((line) => line.lineId === lineId)
      if (!current) return prev
      const next = { ...current, ...patch, cartId: current.cartId ?? lineId, lineId: makeLineId(current.slug, patch.variantKey ?? current.variantKey) }
      const duplicate = prev.find((line) => line.lineId === next.lineId && line.lineId !== lineId)
      if (duplicate) {
        return prev
          .filter((line) => line.lineId !== lineId)
          .map((line) => (line.lineId === next.lineId ? { ...line, quantity: line.quantity + next.quantity } : line))
      }
      return prev.map((line) => (line.lineId === lineId ? next : line))
    })
  }, [])

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity < 1) return
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
    )
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId))
  }, [])

  const clearCart = useCallback(() => setLines([]), [])

  const value = useMemo(() => {
    const itemCount = lines.reduce((n, l) => n + l.quantity, 0)
    const subtotalCents = lines.reduce(
      (n, l) => n + l.priceCents * l.quantity,
      0,
    )
    return {
      lines,
      itemCount,
      subtotalCents,
      addProduct,
      updateLine,
      updateQuantity,
      removeLine,
      clearCart,
    }
  }, [lines, addProduct, updateLine, updateQuantity, removeLine, clearCart])

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function cartLineImage(line: CartLine) {
  return publicMediaUrl(line.imagePath)
}