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
import { asset } from '../../lib/assets.ts'

const STORAGE_KEY = 'rbp_cart_v1'

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  subtotalCents: number
  addProduct: (
    product: Product,
    quantity?: number,
    variant?: { key: string; label: string },
  ) => void
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

  const addProduct = useCallback(
    (
      product: Product,
      quantity = 1,
      variant?: { key: string; label: string },
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
            productId: product.id,
            slug: product.slug,
            name: product.name,
            priceCents: product.priceCents,
            quantity,
            imagePath: product.imagePath,
            variantKey: variant?.key,
            variantLabel: variant?.label,
            material: product.specs?.material ?? product.material,
            sizeLabel: product.specs
              ? `${product.specs.barLength} (Bar) / 4mm (Gem)`
              : undefined,
          },
        ]
      })
    },
    [],
  )

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
      updateQuantity,
      removeLine,
      clearCart,
    }
  }, [lines, addProduct, updateQuantity, removeLine, clearCart])

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
  return asset(line.imagePath)
}