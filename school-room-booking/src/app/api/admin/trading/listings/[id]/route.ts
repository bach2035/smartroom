import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const [{ data: listing, error: listingError }, { data: relatedMatches }] = await Promise.all([
      supabaseAdmin
        .from('trade_listings')
        .select(`
          id, listing_type, status, notes, created_at, updated_at,
          user:users!trade_listings_user_id_fkey(id, full_name, username, email, student_class, student_id),
          courses:trade_listing_courses(id, course_name, course_code, section, schedule, credits, type)
        `)
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('trade_matches')
        .select(`
          id, status, initiated_by, created_at,
          listing_a:trade_listings!trade_matches_listing_a_id_fkey(id, user:users!trade_listings_user_id_fkey(full_name, username)),
          listing_b:trade_listings!trade_matches_listing_b_id_fkey(id, user:users!trade_listings_user_id_fkey(full_name, username))
        `)
        .or(`listing_a_id.eq.${id},listing_b_id.eq.${id}`)
        .order('created_at', { ascending: false }),
    ])

    if (listingError) throw listingError
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const user = listing.user as unknown as { id: string; full_name: string; username: string; email: string; student_class: string | null; student_id: string | null } | null
    const courses = (listing.courses || []) as unknown as { id: string; course_name: string; course_code: string; section: string | null; schedule: string | null; credits: number | null; type: string }[]

    const matches = (relatedMatches || []).map(m => {
      const la = m.listing_a as unknown as { id: string; user: { full_name: string; username: string } | null } | null
      const lb = m.listing_b as unknown as { id: string; user: { full_name: string; username: string } | null } | null
      return {
        id: m.id,
        status: m.status,
        initiatedBy: m.initiated_by,
        createdAt: m.created_at,
        userA: la?.user ? { fullName: la.user.full_name, username: la.user.username } : null,
        userB: lb?.user ? { fullName: lb.user.full_name, username: lb.user.username } : null,
      }
    })

    return NextResponse.json({
      id: listing.id,
      listingType: (listing.listing_type as string) || 'TRADE',
      status: listing.status,
      notes: listing.notes,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      user: user ? {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        studentClass: user.student_class,
        studentId: user.student_id,
      } : null,
      haveCourses: courses.filter(c => c.type === 'HAVE').map(c => ({
        id: c.id, courseName: c.course_name, courseCode: c.course_code,
        section: c.section, schedule: c.schedule, credits: c.credits, type: c.type,
      })),
      wantCourses: courses.filter(c => c.type === 'WANT').map(c => ({
        id: c.id, courseName: c.course_name, courseCode: c.course_code,
        section: c.section, schedule: c.schedule, credits: c.credits, type: c.type,
      })),
      matches,
    })
  } catch (error) {
    console.error('Error fetching listing detail:', error)
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Verify listing exists and is OPEN
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('trade_listings')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    if (listing.status !== 'OPEN') {
      return NextResponse.json({ error: 'Only OPEN listings can be cancelled' }, { status: 400 })
    }

    // Cancel listing and reject all PENDING matches
    const [{ error: cancelError }] = await Promise.all([
      supabaseAdmin
        .from('trade_listings')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('id', id),
      supabaseAdmin
        .from('trade_matches')
        .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
        .or(`listing_a_id.eq.${id},listing_b_id.eq.${id}`)
        .eq('status', 'PENDING'),
    ])

    if (cancelError) throw cancelError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling listing:', error)
    return NextResponse.json({ error: 'Failed to cancel listing' }, { status: 500 })
  }
}
