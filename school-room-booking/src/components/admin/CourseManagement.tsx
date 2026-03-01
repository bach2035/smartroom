'use client'

import { useState, useEffect } from 'react'

interface Course {
  id: string
  name: string
  code: string
  created_at: string
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchCourses() {
    try {
      const res = await fetch('/api/admin/courses')
      if (!res.ok) throw new Error('Failed to fetch')
      setCourses(await res.json())
    } catch {
      setError('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCourses() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newCode.trim()) return
    setError('')

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), code: newCode.trim() }),
      })
      if (res.status === 409) {
        setError('Course already exists')
        return
      }
      if (!res.ok) throw new Error('Failed to add')
      const course = await res.json()
      setCourses((prev) => [...prev, course].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewCode('')
    } catch {
      setError('Failed to add course')
    }
  }

  async function handleDelete(id: string) {
    setError('')
    try {
      const res = await fetch(`/api/admin/courses?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setCourses((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setError('Failed to delete course')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          className="form-input flex-1"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Course name..."
        />
        <input
          className="form-input w-32"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="Code..."
        />
        <button type="submit" className="btn btn-primary whitespace-nowrap">
          Add Course
        </button>
      </form>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th className="w-32">Code</th>
              <th className="w-24 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-slate-400 py-8">
                  No courses yet
                </td>
              </tr>
            ) : (
              courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="font-mono text-sm">{c.code}</td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
