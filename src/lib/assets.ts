/** Public asset paths under /assets/rbp/ */
export const asset = (path: string) => `/assets/rbp/${path.replace(/^\//, '')}`

export const LOGO = asset('branding/rbp-logo-nav.png')