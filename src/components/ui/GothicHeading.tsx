import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  accent?: boolean
}

export function GothicHeading({
  children,
  as: Tag = 'h2',
  className = '',
  accent = true,
}: Props) {
  return (
    <Tag
      className={`font-display leading-tight ${accent ? 'text-rbp-accent' : 'text-rbp-pierce'} ${className}`}
    >
      {children}
    </Tag>
  )
}