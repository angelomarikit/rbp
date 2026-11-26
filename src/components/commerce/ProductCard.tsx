import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Product } from '../../data/types.ts'
import { useCart } from '../../features/cart/CartProvider.tsx'
import { defaultChoiceFor } from '../../lib/productChoices.ts'
import { publicMediaUrl } from '../../lib/media.ts'

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { addProduct } = useCart()
  const [buying, setBuying] = useState(false)

  const buyNow = async () => {
    setBuying(true)
    try {
      const choice = await defaultChoiceFor(product.id)
      addProduct(
        product,
        1,
        choice ? { ...choice, material: choice.material || product.material } : undefined,
      )
      navigate('/checkout')
    } finally {
      setBuying(false)
    }
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-rbp border border-rbp-border/80 bg-[#0a0a0a] transition duration-300 hover:-translate-y-1 hover:border-rbp-accent hover:shadow-[0_12px_32px_rgba(255,121,0,0.16)]">
      <button
        type="button"
        disabled={buying}
        onClick={() => void buyNow()}
        aria-label={`Buy ${product.name} now`}
        className="relative flex aspect-[5/4] w-full cursor-pointer items-center justify-center overflow-hidden bg-[#111] disabled:cursor-wait disabled:opacity-90"
      >
        {publicMediaUrl(product.imagePath) ? (
          <img
            src={publicMediaUrl(product.imagePath)}
            alt=""
            width={764}
            height={612}
            decoding="async"
            className="pointer-events-none h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
          />
        ) : null}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full border border-rbp-accent/70 bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-rbp-accent">
          {product.category}
        </span>
      </button>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <Link
          to={`/products/${product.slug}`}
          className="line-clamp-2 min-h-[2.6em] text-[16px] font-medium leading-snug text-white hover:text-rbp-accent"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-[12px] text-white/50">{product.material}</p>
        <button
          type="button"
          disabled={buying}
          onClick={() => void buyNow()}
          className="mt-4 flex h-10 w-full items-center justify-center whitespace-nowrap rounded-md bg-gradient-to-b from-[#ffb000] to-[#e85d00] px-3 text-[13px] font-semibold leading-none tracking-normal text-black disabled:opacity-70"
        >
          {buying ? 'Adding…' : 'Buy Now'}
        </button>
      </div>
    </article>
  )
}
