import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  icon?: ReactNode
  disabled?: boolean
}

export function OrangeButton({
  children,
  onClick,
  type = 'button',
  className = '',
  icon,
  disabled,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-rbp border border-[#ff9a17] bg-gradient-to-b from-[#ffab00] to-[#e85a00] px-5 py-2 text-sm text-[#050505] transition hover:brightness-110 disabled:opacity-50 ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}

export function OutlineButton({
  children,
  onClick,
  className = '',
  icon,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-rbp border border-[#ff9a17] bg-[#080808] px-5 py-2 text-sm text-rbp-text transition hover:border-rbp-accent ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}

export function OrangeLink({
  to,
  children,
  className = '',
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center rounded-rbp border border-[#ff9a17] bg-gradient-to-b from-[#ffab00] to-[#e85a00] px-5 py-2 text-sm text-[#050505] ${className}`}
    >
      {children}
    </Link>
  )
}