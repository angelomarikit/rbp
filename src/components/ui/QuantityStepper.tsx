type Props = {
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 min-w-[86px] text-base',
  md: 'h-10 min-w-[151px] text-xl',
  lg: 'h-12 min-w-[151px] text-xl',
}

export function QuantityStepper({ value, onChange, size = 'md' }: Props) {
  return (
    <div
      className={`flex items-center justify-between rounded-rbp border border-rbp-border bg-rbp-surface px-3 ${sizeClasses[size]}`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        className="text-rbp-accent hover:text-white"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        −
      </button>
      <span className="font-body text-rbp-text">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className="text-rbp-accent hover:text-white"
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}