'use client'

import type { TradeCourseType } from '@/types'

interface CourseTagProps {
  courseCode: string
  courseName: string
  type: TradeCourseType
  section?: string | null
  schedule?: string | null
}

export default function CourseTag({ courseCode, courseName, type, section, schedule }: CourseTagProps) {
  const colors = type === 'HAVE'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-blue-100 text-blue-800 border-blue-200'

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${colors}`}>
      <span className="font-semibold">{courseCode}</span>
      <span className="text-xs opacity-75">- {courseName}</span>
      {section && <span className="text-xs opacity-60">({section})</span>}
      {schedule && <span className="text-xs opacity-60 hidden sm:inline">| {schedule}</span>}
    </div>
  )
}
