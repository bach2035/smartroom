import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createNotification } from '@/lib/notifications'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all my listing IDs
    const { data: myListings } = await supabaseAdmin
      .from('trade_listings')
      .select('id')
      .eq('user_id', session.user.id)

    if (!myListings?.length) {
      return NextResponse.json({ matches: [] })
    }

    const myListingIds = myListings.map((l) => l.id)

    // Get matches where my listing is either A or B
    const { data: matches, error } = await supabaseAdmin
      .from('trade_matches')
      .select(`
        *,
        listing_a:trade_listings!listing_a_id(
          *,
          user:users(full_name),
          courses:trade_listing_courses(*)
        ),
        listing_b:trade_listings!listing_b_id(
          *,
          user:users(full_name),
          courses:trade_listing_courses(*)
        )
      `)
      .or(`listing_a_id.in.(${myListingIds.join(',')}),listing_b_id.in.(${myListingIds.join(',')})`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching matches:', error)
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
    }

    const result = (matches || []).map((match) => {
      const isA = myListingIds.includes(match.listing_a_id)
      const otherListing = isA ? match.listing_b : match.listing_a
      const other = otherListing as unknown as Record<string, unknown>
      const otherUser = other?.user as unknown as Record<string, unknown> | null
      const courses = (other?.courses as unknown as Record<string, unknown>[]) || []

      return {
        id: match.id,
        listingAId: match.listing_a_id,
        listingBId: match.listing_b_id,
        initiatedBy: match.initiated_by,
        status: match.status,
        createdAt: match.created_at,
        updatedAt: match.updated_at,
        otherUserName: (otherUser?.full_name as string) || 'Unknown',
        otherListing: {
          id: other?.id,
          userId: other?.user_id,
          status: other?.status,
          notes: other?.notes,
          haveCourses: courses
            .filter((c) => c.type === 'HAVE')
            .map((c) => ({
              id: c.id, listingId: c.listing_id, courseName: c.course_name,
              courseCode: c.course_code, classCode: c.class_code, section: c.section,
              schedule: c.schedule, credits: c.credits, type: c.type,
            })),
          wantCourses: courses
            .filter((c) => c.type === 'WANT')
            .map((c) => ({
              id: c.id, listingId: c.listing_id, courseName: c.course_name,
              courseCode: c.course_code, classCode: c.class_code, section: c.section,
              schedule: c.schedule, credits: c.credits, type: c.type,
            })),
        },
      }
    })

    return NextResponse.json({ matches: result })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { myListingId, theirListingId, message } = await request.json()

    if (!myListingId || !theirListingId) {
      return NextResponse.json({ error: 'Both listing IDs are required' }, { status: 400 })
    }

    // Verify my listing ownership
    const { data: myListing } = await supabaseAdmin
      .from('trade_listings')
      .select('user_id, status')
      .eq('id', myListingId)
      .single()

    if (!myListing || myListing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Invalid listing' }, { status: 400 })
    }

    if (myListing.status !== 'OPEN') {
      return NextResponse.json({ error: 'Your listing is not open' }, { status: 400 })
    }

    // Verify other listing is OPEN
    const { data: theirListing } = await supabaseAdmin
      .from('trade_listings')
      .select('user_id, status')
      .eq('id', theirListingId)
      .single()

    if (!theirListing || theirListing.status !== 'OPEN') {
      return NextResponse.json({ error: 'Other listing is not available' }, { status: 400 })
    }

    // Ensure consistent ordering (smaller UUID first) to prevent duplicate reverse matches
    const [listingAId, listingBId] =
      myListingId < theirListingId ? [myListingId, theirListingId] : [theirListingId, myListingId]

    const { data: match, error } = await supabaseAdmin
      .from('trade_matches')
      .insert({
        listing_a_id: listingAId,
        listing_b_id: listingBId,
        initiated_by: session.user.id,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A match already exists between these listings' }, { status: 409 })
      }
      console.error('Error creating match:', error)
      return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
    }

    // Send initial message if provided
    if (message?.trim() && match.id) {
      await supabaseAdmin.from('trade_messages').insert({
        match_id: match.id,
        sender_id: session.user.id,
        content: message.trim(),
      })
    }

    // Notify the other party
    createNotification({
      userId: theirListing.user_id,
      type: 'TRADE_PROPOSAL_RECEIVED',
      title: 'New trade proposal',
      message: `${session.user.name || 'Someone'} wants to trade courses with you.`,
      link: `/trading/matches/${match.id}`,
    })

    return NextResponse.json({ message: 'Match proposed', matchId: match.id }, { status: 201 })
  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
  }
}
