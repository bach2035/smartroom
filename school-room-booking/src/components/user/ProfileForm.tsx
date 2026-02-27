'use client'

import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface Profile {
  username: string
  fullName: string
  email: string
  phone: string | null
  role: string
  studentClass: string | null
  studentId: string | null
}

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/users/profile')
      .then((res) => res.json())
      .then((data) => {
        setProfile(data)
        setFullName(data.fullName || '')
        setEmail(data.email || '')
        setPhone(data.phone || '')
        setStudentClass(data.studentClass || '')
        setStudentId(data.studentId || '')
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load profile' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, studentClass, studentId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
        return
      }

      setProfile(data)
      setMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <Input
        id="username"
        label="Username"
        value={profile?.username || ''}
        disabled
        className="bg-slate-50 text-slate-500"
      />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <input
          className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-slate-50 text-slate-500"
          value={profile?.role === 'ADMIN' ? 'Administrator' : 'Student'}
          disabled
        />
      </div>

      <Input
        id="fullName"
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />

      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        id="phone"
        label="Phone (optional)"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <Input
        id="studentClass"
        label="Class (optional)"
        value={studentClass}
        onChange={(e) => setStudentClass(e.target.value)}
        placeholder="e.g. Grade 11A"
      />

      <Input
        id="studentId"
        label="Student ID (optional)"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        placeholder="e.g. STU-2024-001"
      />

      <div className="pt-2">
        <Button type="submit" loading={saving}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}
