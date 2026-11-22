export function OrangeDivider({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-rbp-divider ${className}`} />
}

export function OrangeBorderDivider({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-rbp-border-light ${className}`} />
}