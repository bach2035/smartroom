import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: listing, error } = await supabaseAdmin
      .from('trade_listings')
      .select(`
        *,
        user:users(full_name, username, email, phone, student_class, student_id),
        courses:trade_listing_courses(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching listing:', error)
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const courses = listing.courses || []
    const user = listing.user as unknown as Record<string, unknown> | null

    return NextResponse.json({
      listing: {
        id: listing.id,
        userId: listing.user_id,
        listingType: (listing.listing_type as string) || 'TRADE',
        status: listing.status,
        notes: listing.notes,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        userName: (user?.full_name as string) || null,
        username: (user?.username as string) || null,
        contactEmail: (user?.email as string) || null,
        phone: (user?.phone as string) || null,
        studentClass: (user?.student_class as string) || null,
        studentId: (user?.student_id as string) || null,
        isOwn: listing.user_id === session.user.id,
        haveCourses: courses
          .filter((c: Record<string, unknown>) => c.type === 'HAVE')
          .map((c: Record<string, unknown>) => ({
            id: c.id,
            listingId: c.listing_id,
            courseName: c.course_name,
            courseCode: c.course_code,
            classCode: c.class_code,
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
            classCode: c.class_code,
            section: c.section,
            schedule: c.schedule,
            credits: c.credits,
            type: c.type,
          })),
      },
    })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('trade_listings')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 })
    }

    if (existing.status !== 'OPEN') {
      return NextResponse.json({ error: 'Can only edit OPEN listings' }, { status: 400 })
    }

    const { notes, haveCourses, wantCourses } = await request.json()

    if (!haveCourses?.length) {
      return NextResponse.json(
        { error: 'At least one HAVE course is required' },
        { status: 400 }
      )
    }

    // Update listing
    await supabaseAdmin
      .from('trade_listings')
      .update({ notes: notes || null, updated_at: new Date().toISOString() })
      .eq('id', id)

    // Replace courses
    await supabaseAdmin.from('trade_listing_courses').delete().eq('listing_id', id)

    const courseRows = [
      ...haveCourses.map((c: Record<string, unknown>) => ({
        listing_id: id,
        course_name: c.courseName,
        course_code: c.courseCode,
        class_code: c.classCode || null,
        section: c.section || null,
        schedule: c.schedule || null,
        credits: c.credits || null,
        type: 'HAVE' as const,
      })),
      ...(wantCourses || []).map((c: Record<string, unknown>) => ({
        listing_id: id,
        course_name: c.courseName,
        course_code: c.courseCode,
        class_code: c.classCode || null,
        section: c.section || null,
        schedule: c.schedule || null,
        credits: c.credits || null,
        type: 'WANT' as const,
      })),
    ]

    await supabaseAdmin.from('trade_listing_courses').insert(courseRows)

    return NextResponse.json({ message: 'Listing updated' })
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: existing } = await supabaseAdmin
      .from('trade_listings')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 })
    }

    if (existing.status !== 'OPEN') {
      return NextResponse.json({ error: 'Can only cancel OPEN listings' }, { status: 400 })
    }

    await supabaseAdmin
      .from('trade_listings')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ message: 'Listing cancelled' })
  } catch (error) {
    console.error('Error cancelling listing:', error)
    return NextResponse.json({ error: 'Failed to cancel listing' }, { status: 500 })
  }
}
