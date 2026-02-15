'use client'

import { forwardRef } from 'react'

interface TimePickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  step?: number
  error?: string
  className?: string
}

const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ label, value, onChange, min, max, step = 1800, error, className = '' }, ref) => {
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
          }`}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

TimePicker.displayName = 'TimePicker'

export default TimePicker
