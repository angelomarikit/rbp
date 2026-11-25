import sharp from 'sharp'

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

const idx = (p) => p * channels

const isPageWhite = (i) => {
  const r = out[i]
  const g = out[i + 1]
  const b = out[i + 2]
  if (r >= 238 && g >= 238 && b >= 238) return true
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max >= 230 && max - min <= 12
}

const floodFromEdges = (matches) => {
  const visited = new Uint8Array(width * height)
  const queue = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const p = y * width + x
    if (visited[p]) return
    const i = idx(p)
    if (!matches(i)) return
    visited[p] = 1
    queue.push(p)
  }
  for (let x = 0; x < width; x++) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    push(0, y)
    push(width - 1, y)
  }
  while (queue.length) {
    const p = queue.pop()
    const x = p % width
    const y = (p - x) / width
    out[idx(p) + 3] = 0
    push(x - 1, y)
    push(x + 1, y)
    push(x, y - 1)
    push(x, y + 1)
  }
}

// 1) Remove white export background
floodFromEdges(isPageWhite)

const isBrandColor = (r, g, b) => {
  if (r > 130 && g > 55 && b < 110 && r >= g) return true
  if (b > 90 && b > r + 15 && b > g + 10) return true
  if (r > 120 && r > g + 25 && r > b + 25) return true
  if (r > 150 && g > 120 && b < 110) return true
  return false
}

// 2) Peel white / gray halo from edges inward (keeps flag + letter colors)
const isOuterHalo = (i) => {
  if (out[i + 3] === 0) return true
  const r = out[i]
  const g = out[i + 1]
  const b = out[i + 2]
  if (isBrandColor(r, g, b)) return false
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const spread = max - min
  const avg = (r + g + b) / 3
  if (avg >= 200 && spread <= 32) return true
  if (avg >= 155 && spread <= 28) return true
  if (avg >= 95 && spread <= 18) return true
  return false
}

const peeled = new Uint8Array(width * height)
const peelQueue = []
for (let p = 0; p < width * height; p++) {
  if (out[idx(p) + 3] === 0) peelQueue.push(p)
}

while (peelQueue.length) {
  const p = peelQueue.pop()
  const x = p % width
  const y = (p - x) / width
  for (const [nx, ny] of [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ]) {
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
    const np = ny * width + nx
    if (peeled[np]) continue
    const i = idx(np)
    if (out[i + 3] === 0) continue
    if (!isOuterHalo(i)) continue
    peeled[np] = 1
    out[i + 3] = 0
    peelQueue.push(np)
  }
}

// 3) Remove leftover detached light rim pixels (white outline ring)
for (let p = 0; p < width * height; p++) {
  const i = idx(p)
  if (out[i + 3] === 0) continue
  const r = out[i]
  const g = out[i + 1]
  const b = out[i + 2]
  if (isBrandColor(r, g, b)) continue
  const avg = (r + g + b) / 3
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  if (avg >= 125 && spread <= 42) out[i + 3] = 0
}

// 4) Soften any remaining light fringe on the outer silhouette only
for (let p = 0; p < width * height; p++) {
  const i = idx(p)
  if (out[i + 3] === 0) continue
  const x = p % width
  const y = (p - x) / width
  let touchesTransparency = false
  for (const [nx, ny] of [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ]) {
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
      touchesTransparency = true
      break
    }
    if (out[idx(ny * width + nx) + 3] === 0) {
      touchesTransparency = true
      break
    }
  }
  if (!touchesTransparency) continue
  const r = out[i]
  const g = out[i + 1]
  const b = out[i + 2]
  if (isBrandColor(r, g, b)) continue
  const avg = (r + g + b) / 3
  if (avg >= 60) out[i + 3] = 0
}

await sharp(out, { raw: { width, height, channels } }).png().toFile(output)
console.log('Wrote', output, `${width}x${height}`)