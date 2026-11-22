import { unzip } from './unzip.ts'

const DISPLAY_FAMILY = 'RBP Display Font'
const BODY_FAMILY = 'RBP Body Font'
const FONT_EXTENSIONS = new Set(['ttf', 'otf', 'woff', 'woff2'])

export type SiteFontFile = {
  weight: number
  style: 'normal' | 'italic'
  format: 'truetype' | 'opentype' | 'woff' | 'woff2'
  data: string
}

export type SiteFont = {
  family: string
  files: SiteFontFile[]
}

export type SiteFontSet = {
  primary: SiteFont
  secondary: SiteFont
}

export function siteFontFromExtra(title: string | null | undefined, extra: unknown): SiteFontSet | null {
  if (!extra || typeof extra !== 'object') return null
  const row = extra as { files?: unknown; primary?: unknown; secondary?: unknown }
  const primary = fontFromStored(row.primary)
  const secondary = fontFromStored(row.secondary)
  if (primary || secondary) {
    const first = primary ?? secondary
    if (!first) return null
    return { primary: first, secondary: secondary ?? first }
  }
  const legacy = fontFromStored({ family: title, files: row.files })
  if (!legacy) return null
  return { primary: legacy, secondary: legacy }
}

export async function fontFromZip(file: File): Promise<SiteFontSet> {
  if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('Add a .zip file.')
  if (file.size > 8_000_000) throw new Error('That zip is too large. Keep it under 8 MB.')
  const entries = await unzip(await file.arrayBuffer())
  const fonts = entries.filter((entry) => FONT_EXTENSIONS.has(extension(entry.name)))
  if (!fonts.length) throw new Error('That zip does not contain a font. Use TTF, OTF, WOFF, or WOFF2.')
  if (fonts.length > 8) throw new Error('That zip has too many font files. Keep it to eight or fewer.')
  const total = fonts.reduce((sum, entry) => sum + entry.data.length, 0)
  if (total > 2_500_000) throw new Error('Those font files are too large to store.')

  const groups = new Map<string, SiteFontFile[]>()
  const order: string[] = []
  for (const entry of fonts) {
    const family = familyName(entry.name)
    if (!groups.has(family)) {
      groups.set(family, [])
      order.push(family)
    }
    groups.get(family)?.push({
      weight: weightFromName(entry.name),
      style: /italic|oblique/i.test(entry.name) ? 'italic' : 'normal',
      format: formatFor(extension(entry.name)),
      data: toBase64(entry.data),
    })
  }
  const primary = toFont(order[0] ?? 'Custom font', groups)
  const secondary = order[1] ? toFont(order[1], groups) : primary
  return { primary, secondary }
}

export function applySiteFont(fonts: SiteFontSet | null) {
  document.getElementById('site-font')?.remove()
  const root = document.documentElement
  if (!fonts) {
    root.style.removeProperty('--rbp-font-display')
    root.style.removeProperty('--rbp-font-body')
    return
  }
  const shared = sameFiles(fonts.primary, fonts.secondary)
  const bodyFamily = shared ? DISPLAY_FAMILY : BODY_FAMILY
  const style = document.createElement('style')
  style.id = 'site-font'
  style.textContent = [
    faceRules(DISPLAY_FAMILY, fonts.primary),
    shared ? '' : faceRules(bodyFamily, fonts.secondary),
  ].filter(Boolean).join('\n')
  document.head.appendChild(style)
  root.style.setProperty('--rbp-font-display', `'${DISPLAY_FAMILY}', sans-serif`)
  root.style.setProperty('--rbp-font-body', `'${bodyFamily}', sans-serif`)
}

function fontFromStored(value: unknown): SiteFont | null {
  if (!value || typeof value !== 'object') return null
  const row = value as { family?: unknown; files?: unknown }
  const files = parseFiles(row.files)
  if (!files.length) return null
  return { family: typeof row.family === 'string' && row.family.trim() ? row.family.trim() : 'Custom font', files }
}

function parseFiles(value: unknown): SiteFontFile[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((file) => {
    if (!file || typeof file !== 'object') return []
    const row = file as Partial<SiteFontFile>
    if (!row.data || !row.format) return []
    return [{
      weight: Number(row.weight) || 400,
      style: row.style === 'italic' ? 'italic' as const : 'normal' as const,
      format: row.format,
      data: row.data,
    }]
  })
}

function toFont(family: string, groups: Map<string, SiteFontFile[]>): SiteFont {
  return { family, files: groups.get(family) ?? [] }
}

function sameFiles(primary: SiteFont, secondary: SiteFont) {
  return primary.files.length === secondary.files.length
    && primary.files.every((file, index) => file.data === secondary.files[index]?.data)
}

function faceRules(cssFamily: string, font: SiteFont) {
  const single = font.files.length === 1
  return font.files.map((file) => faceRule(cssFamily, file, single ? '100 900' : String(file.weight))).join('\n')
}

function faceRule(cssFamily: string, file: SiteFontFile, weight: string) {
  const mime = file.format === 'woff2' ? 'font/woff2' : file.format === 'woff' ? 'font/woff' : file.format === 'opentype' ? 'font/otf' : 'font/ttf'
  return `@font-face { font-family: '${cssFamily}'; src: url('data:${mime};base64,${file.data}') format('${file.format}'); font-weight: ${weight}; font-style: ${file.style}; font-display: swap; }`
}

function extension(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function formatFor(ext: string): SiteFontFile['format'] {
  if (ext === 'otf') return 'opentype'
  if (ext === 'woff') return 'woff'
  if (ext === 'woff2') return 'woff2'
  return 'truetype'
}

function weightFromName(name: string) {
  const text = name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  const has = (word: string) => new RegExp(`(^|[-_\\s])${word}($|[-_\\s])`, 'i').test(text)
  if (has('thin') || has('hairline')) return 100
  if (has('extralight') || has('ultralight')) return 200
  if (has('light')) return 300
  if (has('medium')) return 500
  if (has('semibold') || has('semi-bold') || has('demibold')) return 600
  if (has('extrabold') || has('extra-bold') || has('ultrabold') || has('black') || has('heavy')) return 800
  if (has('bold')) return 700
  return 400
}

function familyName(name: string) {
  const base = (name.split('/').pop() ?? 'Custom font').replace(/\.[^.]+$/, '')
  const spaced = base.replace(/([a-z])([A-Z])/g, '$1 $2')
  const cleaned = spaced
    .replace(/(^|[-_\s])(thin|hairline|extralight|ultralight|light|regular|medium|semibold|semi-bold|demibold|extrabold|extra-bold|ultrabold|bold|black|heavy|italic|oblique)(?=$|[-_\s])/gi, ' ')
    .replace(/[-_][a-z0-9]{4}$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || 'Custom font'
}

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192))
  }
  return btoa(binary)
}
