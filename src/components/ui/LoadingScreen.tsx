const LOGO = '/assets/rbp/branding/rbp-logo-nav.png'

export function LoadingScreen({ label = 'Loading', full = false, compact = false }: { label?: string; full?: boolean; compact?: boolean }) {
  const mark = (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <img src={LOGO} alt="" className={`${compact ? 'h-8 w-8' : 'h-16 w-16'} animate-pulse object-contain`} />
      <p className={compact ? 'text-xs text-[#d0d0d0]' : 'text-sm text-[#d0d0d0]'}>{label}</p>
    </div>
  )
  if (compact) return mark
  if (!full) return <div className="flex justify-center py-16">{mark}</div>
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85">{mark}</div>
}
