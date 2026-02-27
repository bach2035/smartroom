import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('trade_listings')
      .select(`
        id, status, notes, created_at, updated_at,
        user:users!trade_listings_user_id_fkey(id, full_name, username, email, student_class, student_id),
        courses:trade_listing_courses(id, course_name, course_code, section, schedule, credits, type)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: listings, error } = await query

    if (error) throw error

    // Transform to camelCase and apply search filter
    const result = (listings || [])
      .map((l) => {
        const user = l.user as unknown as { id: string; full_name: string; username: string; email: string; student_class: string | null; student_id: string | null } | null
        const courses = (l.courses || []) as unknown as { id: string; course_name: string; course_code: string; section: string | null; schedule: string | null; credits: number | null; type: string }[]
        return {
          id: l.id,
          status: l.status,
          notes: l.notes,
          createdAt: l.created_at,
          updatedAt: l.updated_at,
          user: user ? {
            id: user.id,
            fullName: user.full_name,
            username: user.username,
            email: user.email,
            studentClass: user.student_class,
            studentId: user.student_id,
          } : null,
          haveCourses: courses.filter(c => c.type === 'HAVE').map(c => ({
            id: c.id,
            courseName: c.course_name,
            courseCode: c.course_code,
            section: c.section,
            schedule: c.schedule,
            credits: c.credits,
            type: c.type,
          })),
          wantCourses: courses.filter(c => c.type === 'WANT').map(c => ({
            id: c.id,
            courseName: c.course_name,
            courseCode: c.course_code,
            section: c.section,
            schedule: c.schedule,
            credits: c.credits,
            type: c.type,
          })),
        }
      })
      .filter((l) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          l.user?.fullName.toLowerCase().includes(q) ||
          l.user?.username.toLowerCase().includes(q) ||
          l.haveCourses.some(c => c.courseCode.toLowerCase().includes(q) || c.courseName.toLowerCase().includes(q)) ||
          l.wantCourses.some(c => c.courseCode.toLowerCase().includes(q) || c.courseName.toLowerCase().includes(q))
        )
      })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching admin trading listings:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}
