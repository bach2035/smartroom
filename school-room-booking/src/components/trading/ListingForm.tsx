'use client'

import { useState } from 'react'

interface CourseRow {
  courseName: string
  courseCode: string
  section: string
  schedule: string
  credits: string
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

const emptyCourse: CourseRow = { courseName: '', courseCode: '', section: '', schedule: '', credits: '' }

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

    const validHave = haveCourses.filter((c) => c.courseName && c.courseCode)
    const validWant = wantCourses.filter((c) => c.courseName && c.courseCode)

    if (!validHave.length || !validWant.length) {
      setError('At least one HAVE course and one WANT course with name and code are required.')
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
          {courses.map((course, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
              <input
                className="form-input col-span-2 sm:col-span-2"
                placeholder="Course Name *"
                value={course.courseName}
                onChange={(e) => updateCourse(courses, setCourses, i, 'courseName', e.target.value)}
                required
              />
              <input
                className="form-input"
                placeholder="Code *"
                value={course.courseCode}
                onChange={(e) => updateCourse(courses, setCourses, i, 'courseCode', e.target.value)}
                required
              />
              <input
                className="form-input"
                placeholder="Section"
                value={course.section}
                onChange={(e) => updateCourse(courses, setCourses, i, 'section', e.target.value)}
              />
              <input
                className="form-input"
                placeholder="Schedule"
                value={course.schedule}
                onChange={(e) => updateCourse(courses, setCourses, i, 'schedule', e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="form-input w-20"
                  placeholder="Credits"
                  type="number"
                  value={course.credits}
                  onChange={(e) => updateCourse(courses, setCourses, i, 'credits', e.target.value)}
                />
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
            </div>
          ))}
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
