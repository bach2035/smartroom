'use client'

import { useState, useRef, useEffect } from 'react'

interface SearchableSelectProps {
  options: string[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  required?: boolean
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  required,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const searchTerm = open ? query : value
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const showOverlay = !open && !value && required

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        className="form-input w-full"
        value={open ? query : value}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setQuery(value)
        }}
        placeholder={open ? placeholder : (required ? '' : placeholder)}
      />
      {showOverlay && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
          {placeholder.replace(/\s*\*\s*$/, '')} <span className="text-red-500">*</span>
        </span>
      )}
      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">No results</li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt}
                onMouseDown={() => {
                  onChange(opt)
                  setOpen(false)
                  setQuery('')
                }}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-red-50 hover:text-red-800 ${
                  opt === value ? 'bg-red-50 text-red-800 font-medium' : 'text-slate-700'
                }`}
              >
                {opt}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
