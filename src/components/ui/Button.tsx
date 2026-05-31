import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger'
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50'
  const variants = {
    primary: 'bg-[#5BA4CF] text-white hover:bg-[#4a8fb8]',
    outline: 'border border-[#5BA4CF] text-[#5BA4CF] hover:bg-[#5BA4CF] hover:text-white',
    danger: 'border border-red-400 text-red-400 hover:bg-red-400 hover:text-white',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
