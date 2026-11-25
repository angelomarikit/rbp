import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../features/cart/CartProvider.tsx'
import { asset } from '../../lib/assets.ts'
import { productForCollectionName } from '../../lib/collectionCheckout.ts'
import { defaultChoiceFor } from '../../lib/productChoices.ts'

type Props = {
  title: string
  image: string
  category: string
}

export function CollectionCard({ title, image, category }: Props) {
  const navigate = useNavigate()
  const { addProduct } = useCart()
  const [buying, setBuying] = useState(false)

  const buyNow = async () => {
    setBuying(true)
    try {
      const product = await productForCollectionName(category)
      if (!product) {
        navigate(`/collections?category=${encodeURIComponent(category)}`)
        return
      }
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
    <button
      type="button"
      disabled={buying}
      onClick={() => void buyNow()}
      className="group flex w-full flex-col overflow-hidden rounded-rbp border border-rbp-border bg-black text-left transition hover:shadow-[0_0_16px_rgba(255,122,0,0.28)] disabled:opacity-80"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-[#111]">
        {image ? (
          <img
            src={image.startsWith('http') || image.startsWith('/') ? image : asset(image)}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : null}
      </div>
      <div className="px-3 py-4 text-center">
        <p className="text-[15px] font-medium text-white">{title}</p>
        <p className="text-[12px] font-semibold text-rbp-accent-gold">{buying ? 'Adding…' : 'Buy Now →'}</p>
      </div>
    </button>
  )
}