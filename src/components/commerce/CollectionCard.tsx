import { Link } from 'react-router-dom'
import { asset } from '../../lib/assets.ts'

type Props = {
  title: string
  image: string
  category: string
}

export function CollectionCard({ title, image, category }: Props) {
  return (
    <Link
      to={`/collections?category=${encodeURIComponent(category)}`}
      className="group flex flex-col overflow-hidden rounded-rbp border border-rbp-border bg-black transition hover:shadow-[0_0_16px_rgba(255,122,0,0.28)]"
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
        <p className="text-[12px] font-semibold text-rbp-accent-gold">Shop Now →</p>
      </div>
    </Link>
  )
}