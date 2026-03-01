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

    let query = supabaseAdmin
      .from('trade_matches')
      .select(`
        id, status, initiated_by, created_at, updated_at,
        listing_a:trade_listings!trade_matches_listing_a_id_fkey(
          id, status, user:users!trade_listings_user_id_fkey(id, full_name, username),
          courses:trade_listing_courses(id, course_name, course_code, class_code, type)
        ),
        listing_b:trade_listings!trade_matches_listing_b_id_fkey(
          id, status, user:users!trade_listings_user_id_fkey(id, full_name, username),
          courses:trade_listing_courses(id, course_name, course_code, class_code, type)
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: matches, error } = await query
    if (error) throw error

    const result = (matches || []).map(m => {
      const la = m.listing_a as unknown as { id: string; status: string; user: { id: string; full_name: string; username: string } | null; courses: { id: string; course_name: string; course_code: string; class_code: string | null; type: string }[] } | null
      const lb = m.listing_b as unknown as { id: string; status: string; user: { id: string; full_name: string; username: string } | null; courses: { id: string; course_name: string; course_code: string; class_code: string | null; type: string }[] } | null

      const mapCourses = (courses: { id: string; course_name: string; course_code: string; class_code: string | null; type: string }[]) =>
        courses.map(c => ({ id: c.id, courseName: c.course_name, courseCode: c.course_code, classCode: c.class_code, type: c.type }))

      return {
        id: m.id,
        status: m.status,
        initiatedBy: m.initiated_by,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        listingA: la ? {
          id: la.id,
          status: la.status,
          userName: la.user?.full_name || 'Unknown',
          username: la.user?.username || '',
          userId: la.user?.id || '',
          haveCourses: mapCourses(la.courses.filter(c => c.type === 'HAVE')),
          wantCourses: mapCourses(la.courses.filter(c => c.type === 'WANT')),
        } : null,
        listingB: lb ? {
          id: lb.id,
          status: lb.status,
          userName: lb.user?.full_name || 'Unknown',
          username: lb.user?.username || '',
          userId: lb.user?.id || '',
          haveCourses: mapCourses(lb.courses.filter(c => c.type === 'HAVE')),
          wantCourses: mapCourses(lb.courses.filter(c => c.type === 'WANT')),
        } : null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching admin trading matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
