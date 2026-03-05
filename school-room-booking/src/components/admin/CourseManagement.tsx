'use client'

import { useState, useEffect, useMemo } from 'react'

interface Course {
  id: string
  name: string
  code: string
  created_at: string
}

const inputClass = 'min-w-0 px-4 py-3 text-sm border border-slate-200 rounded-lg bg-white focus:border-red-700 focus:ring-2 focus:ring-red-700/10 outline-none transition-all placeholder:text-slate-400'

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
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

  const filtered = useMemo(() => {
    if (!search.trim()) return courses
    const q = search.toLowerCase()
    return courses.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [courses, search])

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
      if (res.status === 409) { setError('Course already exists'); return }
      if (!res.ok) throw new Error('Failed to add')
      const course = await res.json()
      setCourses((prev) => [...prev, course].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewCode('')
    } catch {
      setError('Failed to add course')
    }
  }

  function startEdit(c: Course) {
    setEditingId(c.id)
    setEditName(c.name)
    setEditCode(c.code)
    setError('')
  }

  async function handleSave(id: string) {
    if (!editName.trim() || !editCode.trim()) return
    setError('')

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName.trim(), code: editCode.trim() }),
      })
      if (res.status === 409) { setError('Course name or code already exists'); return }
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setCourses((prev) => prev.map((c) => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingId(null)
    } catch {
      setError('Failed to update course')
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
          className={`flex-1 ${inputClass}`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Course name..."
        />
        <input
          className={`w-40 ${inputClass}`}
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="Code..."
        />
        <button type="submit" className="btn btn-primary whitespace-nowrap">
          Add Course
        </button>
      </form>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className={`w-full pl-10 ${inputClass}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses by name or code..."
        />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th className="w-40">Code</th>
              <th className="w-44 !text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-slate-400 py-8">
                  {search ? 'No courses match your search' : 'No courses yet'}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  {editingId === c.id ? (
                    <>
                      <td>
                        <input
                          className={`w-full ${inputClass} !py-1.5`}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                      </td>
                      <td>
                        <input
                          className={`w-full font-mono ${inputClass} !py-1.5`}
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSave(c.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{c.name}</td>
                      <td className="font-mono text-sm">{c.code}</td>
                      <td>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => startEdit(c)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
