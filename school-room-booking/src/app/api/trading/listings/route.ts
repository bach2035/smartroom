import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

function transformListing(listing: Record<string, unknown>) {
  const courses = (listing.courses as unknown as Record<string, unknown>[]) || []
  return {
    id: listing.id as string,
    userId: listing.user_id as string,
    status: listing.status as string,
    notes: listing.notes as string | null,
    createdAt: listing.created_at as string,
    updatedAt: listing.updated_at as string,
    userName: ((listing.user as unknown as Record<string, unknown>)?.full_name as string) || null,
    haveCourses: courses
      .filter((c) => c.type === 'HAVE')
      .map((c) => ({
        id: c.id as string,
        listingId: c.listing_id as string,
        courseName: c.course_name as string,
        courseCode: c.course_code as string,
        section: c.section as string | null,
        schedule: c.schedule as string | null,
        credits: c.credits as number | null,
        type: c.type as string,
      })),
    wantCourses: courses
      .filter((c) => c.type === 'WANT')
      .map((c) => ({
        id: c.id as string,
        listingId: c.listing_id as string,
        courseName: c.course_name as string,
        courseCode: c.course_code as string,
        section: c.section as string | null,
        schedule: c.schedule as string | null,
        credits: c.credits as number | null,
        type: c.type as string,
      })),
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const courseCode = searchParams.get('courseCode')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('trade_listings')
      .select(`
        *,
        user:users(full_name),
        courses:trade_listing_courses(*)
      `)
      .eq('status', 'OPEN')
      .neq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (courseCode) {
      const { data: listingIds } = await supabaseAdmin
        .from('trade_listing_courses')
        .select('listing_id')
        .ilike('course_code', courseCode)

      if (listingIds && listingIds.length > 0) {
        query = query.in('id', listingIds.map((l) => l.listing_id))
      } else {
        return NextResponse.json({ listings: [] })
      }
    }

    const { data: listings, error } = await query

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    let result = (listings || []).map(transformListing)

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.notes?.toLowerCase().includes(q) ||
          l.userName?.toLowerCase().includes(q) ||
          l.haveCourses.some(
            (c) => c.courseName.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q)
          ) ||
          l.wantCourses.some(
            (c) => c.courseName.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q)
          )
      )
    }

    return NextResponse.json({ listings: result })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notes, haveCourses, wantCourses } = await request.json()

    if (!haveCourses?.length || !wantCourses?.length) {
      return NextResponse.json(
        { error: 'At least one HAVE course and one WANT course are required' },
        { status: 400 }
      )
    }

    // Create listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('trade_listings')
      .insert({ user_id: session.user.id, notes: notes || null })
      .select('*')
      .single()

    if (listingError) {
      console.error('Error creating listing:', listingError)
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
    }

    // Insert courses
    const courseRows = [
      ...haveCourses.map((c: Record<string, unknown>) => ({
        listing_id: listing.id,
        course_name: c.courseName,
        course_code: c.courseCode,
        section: c.section || null,
        schedule: c.schedule || null,
        credits: c.credits || null,
        type: 'HAVE' as const,
      })),
      ...wantCourses.map((c: Record<string, unknown>) => ({
        listing_id: listing.id,
        course_name: c.courseName,
        course_code: c.courseCode,
        section: c.section || null,
        schedule: c.schedule || null,
        credits: c.credits || null,
        type: 'WANT' as const,
      })),
    ]

    const { error: coursesError } = await supabaseAdmin
      .from('trade_listing_courses')
      .insert(courseRows)

    if (coursesError) {
      console.error('Error inserting courses:', coursesError)
      // Clean up the listing
      await supabaseAdmin.from('trade_listings').delete().eq('id', listing.id)
      return NextResponse.json({ error: 'Failed to create listing courses' }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Listing created', listingId: listing.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}
