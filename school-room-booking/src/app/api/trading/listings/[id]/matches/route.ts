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

    // Fetch current listing's courses
    const { data: myCourses } = await supabaseAdmin
      .from('trade_listing_courses')
      .select('course_code, type')
      .eq('listing_id', id)

    if (!myCourses?.length) {
      return NextResponse.json({ matches: [] })
    }

    const myHaveCodes = myCourses
      .filter((c) => c.type === 'HAVE')
      .map((c) => c.course_code.toLowerCase())
    const myWantCodes = myCourses
      .filter((c) => c.type === 'WANT')
      .map((c) => c.course_code.toLowerCase())

    // Get the listing owner's ID to find all their listings
    const { data: myListing } = await supabaseAdmin
      .from('trade_listings')
      .select('user_id')
      .eq('id', id)
      .single()

    // Find listing IDs already in active matches with this user
    let excludeListingIds: string[] = []
    if (myListing) {
      const { data: userListings } = await supabaseAdmin
        .from('trade_listings')
        .select('id')
        .eq('user_id', myListing.user_id)

      const userListingIds = (userListings || []).map((l) => l.id)
      if (userListingIds.length > 0) {
        const { data: activeMatches } = await supabaseAdmin
          .from('trade_matches')
          .select('listing_a_id, listing_b_id')
          .in('status', ['PENDING', 'ACCEPTED'])
          .or(`listing_a_id.in.(${userListingIds.join(',')}),listing_b_id.in.(${userListingIds.join(',')})`)

        if (activeMatches) {
          const matched = new Set<string>()
          for (const m of activeMatches) {
            if (userListingIds.includes(m.listing_a_id)) matched.add(m.listing_b_id)
            if (userListingIds.includes(m.listing_b_id)) matched.add(m.listing_a_id)
          }
          excludeListingIds = Array.from(matched)
        }
      }
    }

    // Fetch all other OPEN listings with courses
    let listingsQuery = supabaseAdmin
      .from('trade_listings')
      .select(`
        *,
        user:users(full_name),
        courses:trade_listing_courses(*)
      `)
      .eq('status', 'OPEN')
      .neq('id', id)

    if (excludeListingIds.length > 0) {
      listingsQuery = listingsQuery.not('id', 'in', `(${excludeListingIds.join(',')})`)
    }

    const { data: allListings } = await listingsQuery

    if (!allListings?.length) {
      return NextResponse.json({ matches: [] })
    }

    // Match: listing B has a HAVE that matches my WANT, AND B has a WANT that matches my HAVE
    const matched = allListings
      .map((listing) => {
        const courses = listing.courses || []
        const theirHaveCodes = courses
          .filter((c: Record<string, unknown>) => c.type === 'HAVE')
          .map((c: Record<string, unknown>) => (c.course_code as string).toLowerCase())
        const theirWantCodes = courses
          .filter((c: Record<string, unknown>) => c.type === 'WANT')
          .map((c: Record<string, unknown>) => (c.course_code as string).toLowerCase())

        const iWantTheyHave = myWantCodes.filter((code) => theirHaveCodes.includes(code)).length
        const theyWantIHave = myHaveCodes.filter((code) => theirWantCodes.includes(code)).length

        if (iWantTheyHave === 0 || theyWantIHave === 0) return null

        const user = listing.user as unknown as Record<string, unknown> | null

        return {
          id: listing.id,
          userId: listing.user_id,
          status: listing.status,
          notes: listing.notes,
          createdAt: listing.created_at,
          updatedAt: listing.updated_at,
          userName: user?.full_name || null,
          matchScore: iWantTheyHave + theyWantIHave,
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
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b!.matchScore ?? 0) - (a!.matchScore ?? 0))

    return NextResponse.json({ matches: matched })
  } catch (error) {
    console.error('Error finding matches:', error)
    return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 })
  }
}
