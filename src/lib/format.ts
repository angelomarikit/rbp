export function formatPhp(cents: number): string {
  const pesos = cents / 100
  return `P${pesos.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatPhpLabel(cents: number): string {
  return `Php ${(cents / 100).toFixed(0)}`
}