import { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-2 bg-gray-100 rounded border border-transparent focus:outline-none focus:border-[#5BA4CF] text-sm ${className}`}
      {...props}
    />
  )
}
