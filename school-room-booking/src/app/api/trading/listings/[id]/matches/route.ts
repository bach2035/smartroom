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

    // Fetch current listing with its type and courses
    const { data: myListing } = await supabaseAdmin
      .from('trade_listings')
      .select('user_id, listing_type')
      .eq('id', id)
      .single()

    if (!myListing) {
      return NextResponse.json({ matches: [] })
    }

    const isGiveaway = myListing.listing_type === 'GIVEAWAY'

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

    // Giveaways don't use matching — they appear on the browse page directly
    if (isGiveaway) {
      return NextResponse.json({ matches: [] })
    }

    // Fetch all other OPEN TRADE listings with courses (exclude own + giveaways)
    let listingsQuery = supabaseAdmin
      .from('trade_listings')
      .select(`
        *,
        user:users(full_name),
        courses:trade_listing_courses(*)
      `)
      .eq('status', 'OPEN')
      .eq('listing_type', 'TRADE')
      .neq('id', id)
      .neq('user_id', myListing.user_id)

    if (excludeListingIds.length > 0) {
      listingsQuery = listingsQuery.not('id', 'in', `(${excludeListingIds.join(',')})`)
    }

    const { data: allListings } = await listingsQuery

    if (!allListings?.length) {
      return NextResponse.json({ matches: [] })
    }

    function transformCourses(courses: Record<string, unknown>[], type: string) {
      return courses
        .filter((c) => c.type === type)
        .map((c) => ({
          id: c.id,
          listingId: c.listing_id,
          courseName: c.course_name,
          courseCode: c.course_code,
          classCode: c.class_code,
          section: c.section,
          schedule: c.schedule,
          credits: c.credits,
          type: c.type,
        }))
    }

    // Giveaway: any user can request, no course matching needed
    // Trade: listing B has a HAVE matching my WANT AND B has a WANT matching my HAVE
    const matched = allListings
      .map((listing) => {
        const courses = (listing.courses || []) as Record<string, unknown>[]
        const user = listing.user as unknown as Record<string, unknown> | null
        let matchScore = 1

        if (!isGiveaway) {
          const theirHaveCodes = courses
            .filter((c) => c.type === 'HAVE')
            .map((c) => (c.course_code as string).toLowerCase())
          const theirWantCodes = courses
            .filter((c) => c.type === 'WANT')
            .map((c) => (c.course_code as string).toLowerCase())

          const iWantTheyHave = myWantCodes.filter((code) => theirHaveCodes.includes(code)).length
          const theyWantIHave = myHaveCodes.filter((code) => theirWantCodes.includes(code)).length

          if (iWantTheyHave === 0 || theyWantIHave === 0) return null
          matchScore = iWantTheyHave + theyWantIHave
        }

        return {
          id: listing.id,
          userId: listing.user_id,
          listingType: (listing.listing_type as string) || 'TRADE',
          status: listing.status,
          notes: listing.notes,
          createdAt: listing.created_at,
          updatedAt: listing.updated_at,
          userName: user?.full_name || null,
          matchScore,
          haveCourses: transformCourses(courses, 'HAVE'),
          wantCourses: transformCourses(courses, 'WANT'),
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
