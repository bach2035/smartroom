import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: listings, error } = await supabaseAdmin
      .from('trade_listings')
      .select(`
        *,
        courses:trade_listing_courses(*)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching my listings:', error)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    const result = (listings || []).map((listing) => {
      const courses = listing.courses || []
      return {
        id: listing.id,
        userId: listing.user_id,
        status: listing.status,
        notes: listing.notes,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        haveCourses: courses
          .filter((c: Record<string, unknown>) => c.type === 'HAVE')
          .map((c: Record<string, unknown>) => ({
            id: c.id,
            listingId: c.listing_id,
            courseName: c.course_name,
            courseCode: c.course_code,
            section: c.section,
            schedule: c.schedule,
            credits: c.credits,
            type: c.type,
          })),
        wantCourses: courses
          .filter((c: Record<string, unknown>) => c.type === 'WANT')
          .map((c: Record<string, unknown>) => ({
            id: c.id,
            listingId: c.listing_id,
            courseName: c.course_name,
            courseCode: c.course_code,
            section: c.section,
            schedule: c.schedule,
            credits: c.credits,
            type: c.type,
          })),
      }
    })

    return NextResponse.json({ listings: result })
  } catch (error) {
    console.error('Error fetching my listings:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}
