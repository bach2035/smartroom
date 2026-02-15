'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok',
    })
  }

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const validFiles: File[] = []
    for (const file of Array.from(newFiles)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported file type.`)
        return
      }
      if (file.size > MAX_SIZE) {
        setError(`"${file.name}" exceeds 10MB limit.`)
        return
      }
      validFiles.push(file)
    }
    setError('')
    setFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Create stable preview URLs for image files
  const previewUrls = useMemo(() => {
    return files.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    )
  }, [files])

  // Revoke old URLs on change
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => { if (url) URL.revokeObjectURL(url) })
    }
  }, [previewUrls])

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
      // 1. Create booking
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

      const bookingId = data.booking.id

      // 2. Upload files if any
      const failedUploads: string[] = []
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`Uploading file ${i + 1} of ${files.length}...`)
          const formData = new FormData()
          formData.append('file', files[i])

          try {
            const uploadRes = await fetch(`/api/bookings/${bookingId}/attachments`, {
              method: 'POST',
              body: formData,
            })

            if (!uploadRes.ok) {
              const uploadData = await uploadRes.json().catch(() => ({}))
              console.error(`Failed to upload ${files[i].name}:`, uploadData.error)
              failedUploads.push(`${files[i].name} (${uploadData.error || uploadRes.status})`)
            }
          } catch (uploadErr) {
            console.error(`Failed to upload ${files[i].name}:`, uploadErr)
            failedUploads.push(files[i].name)
          }
        }
      }

      if (failedUploads.length > 0) {
        setError(`Booking created, but failed to upload: ${failedUploads.join(', ')}`)
        setLoading(false)
        setUploadProgress('')
        return
      }

      router.push('/bookings?success=true')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
      setUploadProgress('')
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
          <strong>Date:</strong> {(() => {
            const d = new Date(selectedDate + 'T12:00:00+07:00')
            const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' })
            const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d)
            return `${weekday}, ${parts}`
          })()}
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
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attachments (optional)
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-red-400 hover:bg-slate-50 rounded-xl p-5 text-center cursor-pointer transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
            multiple
            onChange={(e) => {
              addFiles(e.target.files)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-1">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-slate-600">Click to add files</p>
            <p className="text-xs text-slate-400">PDF, Images, Word (max 10MB each)</p>
          </div>
        </div>

        {/* Selected files list */}
        {files.length > 0 && (
          <div className="mt-3 space-y-3">
            {/* Non-image files */}
            {files.map((file, index) =>
              !previewUrls[index] ? (
                <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-slate-700 truncate">{file.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 ml-2 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : null
            )}

            {/* Image files grid */}
            {previewUrls.some(Boolean) && (
              <div className="grid grid-cols-3 gap-2">
                {files.map((file, index) =>
                  previewUrls[index] ? (
                    <div key={index} className="relative group rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrls[index]!}
                        alt={file.name}
                        onClick={() => setLightboxUrl(previewUrls[index]!)}
                        className="w-full aspect-square object-cover cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-slate-600 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Button type="submit" loading={loading} disabled={!selectedStart || !selectedEnd} className="w-full">
        {uploadProgress || 'Submit Booking Request'}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Your booking will be pending until approved by an admin.
      </p>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </form>
  )
}
