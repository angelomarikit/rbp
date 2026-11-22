type IconProps = { className?: string; size?: number }

export function IconSearch({ className = '', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconUser({ className = '', size = 21 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconCart({ className = '', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 6h2l2.5 10h9l2.5-8H8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="10" cy="19" r="1.5" fill="currentColor" />
      <circle cx="16" cy="19" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function IconCalendar({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#050505" strokeWidth="2" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="#050505" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconCalendarLight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#FF7900" strokeWidth="2" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="#FF7900" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconPin({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 22s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" stroke="#FF7900" strokeWidth="2" />
      <circle cx="12" cy="11" r="2.5" fill="#FF7900" />
    </svg>
  )
}

export function IconShield({ size = 31 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l7 3v6c0 4.5-3 8.5-7 9-4-.5-7-4.5-7-9V6l7-3z" stroke="#FF7900" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

export function IconGem({ size = 31 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 9l4-6h8l4 6-8 12L4 9z" stroke="#FF7900" strokeWidth="1.5" />
    </svg>
  )
}

export function IconAward({ size = 31 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="5" stroke="#FF7900" strokeWidth="1.5" />
      <path d="M8 14l-2 7 6-3 6 3-2-7" stroke="#FF7900" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function IconPeople({ size = 31 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="3" stroke="#FF7900" strokeWidth="1.5" />
      <circle cx="17" cy="10" r="2.5" stroke="#FF7900" strokeWidth="1.5" />
      <path d="M3 20c0-3 2.5-5.5 6-5.5M14 20c0-2.5 2-4 4-4" stroke="#FF7900" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconTrash({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M9 7V5h6v2M8 7v12h8V7" stroke="#FF7900" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconHeart({ size = 19, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#FF7900' : 'none'} aria-hidden>
      <path
        d="M12 21s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.6-7 10-7 10z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function IconChevron({ direction = 'right', size = 13 }: { direction?: 'left' | 'right'; size?: number }) {
  const d = direction === 'left' ? 'M14 4L6 12l8 8' : 'M10 4l8 8-8 8'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={d} stroke="#FF7900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}