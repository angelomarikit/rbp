export type HeaderVariant = 'home' | 'collections' | 'product' | 'checkout' | 'events' | 'book'

export type NavItem = {
  label: string
  to: string
  match?: string[]
}

export const NAV_HOME: NavItem[] = [
  { label: 'Home', to: '/', match: ['/'] },
  { label: 'Products', to: '/collections', match: ['/collections'] },
  { label: 'Piercing Appointment', to: '/book', match: ['/book'] },
  { label: 'Events', to: '/events', match: ['/events'] },
  { label: 'Association', to: '/association', match: ['/association'] },
  { label: 'Wholesalers', to: '/wholesaler/register', match: ['/wholesaler'] },
  { label: 'About', to: '/about', match: ['/about'] },
  { label: 'Contact', to: '/contact', match: ['/contact'] },
]

export const NAV_COLLECTIONS: NavItem[] = [
  { label: 'HOME', to: '/' },
  { label: 'Products', to: '/collections', match: ['/collections'] },
  { label: 'EVENTS', to: '/events' },
  { label: 'ABOUT', to: '/events' },
  { label: 'CONTACT', to: '/book', match: ['/contact'] },
]

export const NAV_PRODUCT: NavItem[] = [
  { label: 'HOME', to: '/' },
  { label: 'Products', to: '/collections', match: ['/collections'] },
  { label: 'Piercing Appointment', to: '/book', match: ['/book'] },
  { label: 'EVENTS', to: '/events' },
  { label: 'ABOUT', to: '/events' },
  { label: 'CONTACT', to: '/book', match: ['/contact'] },
]

export const NAV_CHECKOUT: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/collections' },
  { label: 'Events', to: '/events' },
  { label: 'About', to: '/events' },
  { label: 'Contact', to: '/book', match: ['/contact'] },
]

export const NAV_EVENTS: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/collections' },
  { label: 'Events', to: '/events', match: ['/events'] },
  { label: 'Client Showcase', to: '/events#showcase' },
  { label: 'About', to: '/events' },
  { label: 'Contact', to: '/book', match: ['/contact'] },
]

export function variantFromPath(pathname: string): HeaderVariant {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/collections')) return 'collections'
  if (pathname.startsWith('/products')) return 'product'
  if (pathname.startsWith('/checkout')) return 'checkout'
  if (pathname.startsWith('/events')) return 'events'
  if (pathname.startsWith('/book')) return 'book'
  return 'home'
}