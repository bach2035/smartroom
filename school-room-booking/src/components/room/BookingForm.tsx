'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface BookingFormProps {
  roomId: string
  selectedDate: string
  selectedStart: string | null
  selectedEnd: string | null
}

export default function BookingForm({
  roomId,
  selectedDate,
  selectedStart,
  selectedEnd,
}: BookingFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedStart || !selectedEnd) {
      setError('Please select a time slot')
      return
    }

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          title,
          description,
          startTime: selectedStart,
          endTime: selectedEnd,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create booking')
        return
      }

      router.push('/bookings?success=true')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Date:</strong> {selectedDate}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Time:</strong>{' '}
          {selectedStart && selectedEnd
            ? `${formatTime(selectedStart)} - ${formatTime(selectedEnd)}`
            : 'Select time slots above'}
        </p>
      </div>

      <Input
        id="title"
        label="Booking Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Study Group Session"
        required
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any additional details..."
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <Button type="submit" loading={loading} disabled={!selectedStart || !selectedEnd} className="w-full">
        Submit Booking Request
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Your booking will be pending until approved by an admin.
      </p>
    </form>
  )
}
