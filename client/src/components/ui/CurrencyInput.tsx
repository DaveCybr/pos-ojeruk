import { useRef } from 'react'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  autoFocus?: boolean
}

export function CurrencyInput({ value, onChange, className, placeholder = '0', autoFocus }: CurrencyInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    onChange(raw ? parseInt(raw, 10) : 0)
  }

  const display = value > 0 ? value.toLocaleString('id-ID') : ''

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={className}
    />
  )
}
