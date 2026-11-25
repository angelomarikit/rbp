import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'

const input = process.argv[2]
const output = process.argv[3]
if (!input || !output) {
  console.error('Usage: node mask-association-logo.mjs <input.png> <output.png>')
  process.exit(1)
}

const img = sharp(input)
const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info
const out = Buffer.from(data)

const isBackground = (i) => {
  const r = out[i]
  const g = out[i + 1]
  const b = out[i + 2]
  // Off-white page export around the logo
  if (r >= 238 && g >= 238 && b >= 238) return true
  // Light grey matte sometimes on exports
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max >= 230 && max - min <= 12
}

const visited = new Uint8Array(width * height)
const queue = []

const pushIfBg = (x, y) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return
  const p = y * width + x
  if (visited[p]) return
  const i = p * channels
  if (!isBackground(i)) return
  visited[p] = 1
  queue.push(p)
}

for (let x = 0; x < width; x++) {
  pushIfBg(x, 0)
  pushIfBg(x, height - 1)
}
for (let y = 0; y < height; y++) {
  pushIfBg(0, y)
  pushIfBg(width - 1, y)
}

while (queue.length) {
  const p = queue.pop()
  const x = p % width
  const y = (p - x) / width
  const i = p * channels
  out[i + 3] = 0
  pushIfBg(x - 1, y)
  pushIfBg(x + 1, y)
  pushIfBg(x, y - 1)
  pushIfBg(x, y + 1)
}

await sharp(out, { raw: { width, height, channels } }).png().toFile(output)
console.log('Wrote', output, `${width}x${height}`)