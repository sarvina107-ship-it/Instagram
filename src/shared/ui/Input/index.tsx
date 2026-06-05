import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = ({ label, error, className = '', ...props }: InputProps) => {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      )}
      <input
        className={`w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-gray-400 focus:bg-white ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  )
}
