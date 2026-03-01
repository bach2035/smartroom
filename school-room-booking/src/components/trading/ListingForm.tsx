'use client'

import { useState, useEffect } from 'react'
import SearchableSelect from '@/components/ui/SearchableSelect'

interface CourseRow {
  courseName: string
  courseCode: string
  classCode: string
  section: string
  schedule: string
  credits: string
}

interface CatalogCourse {
  name: string
  code: string
}

interface ListingFormProps {
  initialNotes?: string
  initialHaveCourses?: CourseRow[]
  initialWantCourses?: CourseRow[]
  onSubmit: (data: {
    notes: string
    haveCourses: CourseRow[]
    wantCourses: CourseRow[]
  }) => Promise<void>
  submitLabel?: string
}

const emptyCourse: CourseRow = { courseName: '', courseCode: '', classCode: '', section: '', schedule: '', credits: '' }

export default function ListingForm({
  initialNotes = '',
  initialHaveCourses,
  initialWantCourses,
  onSubmit,
  submitLabel = 'Create Listing',
}: ListingFormProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [haveCourses, setHaveCourses] = useState<CourseRow[]>(
    initialHaveCourses?.length ? initialHaveCourses : [{ ...emptyCourse }]
  )
  const [wantCourses, setWantCourses] = useState<CourseRow[]>(
    initialWantCourses?.length ? initialWantCourses : [{ ...emptyCourse }]
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [catalog, setCatalog] = useState<CatalogCourse[]>([])

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCatalog(data.map((c: { name: string; code: string }) => ({ name: c.name, code: c.code })))
      })
      .catch(console.error)
  }, [])

  // Build display label "Name (CODE)" for dropdown
  const catalogOptions = catalog.map((c) => `${c.name} (${c.code})`)

  function selectCourse(
    list: CourseRow[],
    setList: (rows: CourseRow[]) => void,
    index: number,
    displayValue: string
  ) {
    const updated = [...list]
    const match = catalog.find((c) => `${c.name} (${c.code})` === displayValue)
    if (match) {
      updated[index] = { ...updated[index], courseName: match.name, courseCode: match.code }
    }
    setList(updated)
  }

  function updateCourse(
    list: CourseRow[],
    setList: (rows: CourseRow[]) => void,
    index: number,
    field: keyof CourseRow,
    value: string
  ) {
    const updated = [...list]
    updated[index] = { ...updated[index], [field]: value }
    setList(updated)
  }

  function removeCourse(list: CourseRow[], setList: (rows: CourseRow[]) => void, index: number) {
    if (list.length <= 1) return
    setList(list.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validHave = haveCourses.filter((c) => c.courseName && c.courseCode && c.classCode)
    const validWant = wantCourses.filter((c) => c.courseName && c.courseCode && c.classCode)

    if (!validHave.length || !validWant.length) {
      setError('At least one HAVE course and one WANT course with class code are required.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({ notes, haveCourses: validHave, wantCourses: validWant })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function renderCourseRows(
    label: string,
    courses: CourseRow[],
    setCourses: (rows: CourseRow[]) => void,
    colorClass: string
  ) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-sm font-semibold ${colorClass}`}>{label}</h3>
          <button
            type="button"
            onClick={() => setCourses([...courses, { ...emptyCourse }])}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Course
          </button>
        </div>
        <div className="space-y-3">
          {courses.map((course, i) => {
            const displayValue = course.courseName && course.courseCode
              ? `${course.courseName} (${course.courseCode})`
              : ''
            return (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <SearchableSelect
                    options={catalogOptions}
                    value={displayValue}
                    onChange={(val) => selectCourse(courses, setCourses, i, val)}
                    placeholder="Course *"
                    required
                  />
                </div>
                <div className="w-28 relative">
                  <input
                    className="form-input w-full"
                    value={course.classCode}
                    onChange={(e) => updateCourse(courses, setCourses, i, 'classCode', e.target.value)}
                    required
                  />
                  {!course.classCode && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                      Class Code <span className="text-red-500">*</span>
                    </span>
                  )}
                </div>
                {courses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCourse(courses, setCourses, i)}
                    className="text-red-500 hover:text-red-700 text-sm px-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {renderCourseRows('Courses I HAVE (to trade away)', haveCourses, setHaveCourses, 'text-green-700')}
      {renderCourseRows('Courses I WANT (to receive)', wantCourses, setWantCourses, 'text-blue-700')}

      <p className="text-xs text-slate-400 italic">
        <span className="text-red-500 not-italic">*</span> indicates compulsory fields
      </p>

      <div>
        <label className="form-label">Notes (optional)</label>
        <textarea
          className="form-input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any preferences or details about the trade..."
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
