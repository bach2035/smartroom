import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createNotification } from '@/lib/notifications'

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

    const { data: match, error } = await supabaseAdmin
      .from('trade_matches')
      .select(`
        *,
        listing_a:trade_listings!listing_a_id(
          *,
          user:users(full_name, email, student_class),
          courses:trade_listing_courses(*)
        ),
        listing_b:trade_listings!listing_b_id(
          *,
          user:users(full_name, email, student_class),
          courses:trade_listing_courses(*)
        ),
        initiator:users!initiated_by(full_name, email, student_class)
      `)
      .eq('id', id)
      .single()

    if (error || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const listingA = match.listing_a as unknown as Record<string, unknown>
    const listingB = match.listing_b as unknown as Record<string, unknown> | null
    const isGiveawayRequest = !match.listing_b_id

    // Verify user is a party to this match
    const isParty =
      listingA?.user_id === session.user.id ||
      listingB?.user_id === session.user.id ||
      match.initiated_by === session.user.id

    if (!isParty) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    function transformSide(listing: Record<string, unknown>) {
      const user = listing.user as unknown as Record<string, unknown> | null
      const courses = (listing.courses as unknown as Record<string, unknown>[]) || []
      return {
        id: listing.id,
        userId: listing.user_id,
        listingType: (listing.listing_type as string) || 'TRADE',
        status: listing.status,
        notes: listing.notes,
        userName: (user?.full_name as string) || null,
        contactEmail: (user?.email as string) || null,
        studentClass: (user?.student_class as string) || null,
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
      }
    }

    if (isGiveawayRequest) {
      // Giveaway request: listing_a is the giveaway, no listing_b
      const iAmOwner = listingA?.user_id === session.user.id
      const initiator = match.initiator as unknown as Record<string, unknown> | null

      return NextResponse.json({
        match: {
          id: match.id,
          status: match.status,
          initiatedBy: match.initiated_by,
          isGiveawayRequest: true,
          createdAt: match.created_at,
          updatedAt: match.updated_at,
          isInitiator: match.initiated_by === session.user.id,
          completedByMe: iAmOwner ? !!match.completed_by_a : !!match.completed_by_b,
          completedByOther: iAmOwner ? !!match.completed_by_b : !!match.completed_by_a,
          myListing: iAmOwner ? transformSide(listingA) : null,
          otherListing: iAmOwner ? null : transformSide(listingA),
          requesterName: (initiator?.full_name as string) || null,
          requesterEmail: (initiator?.email as string) || null,
          requesterClass: (initiator?.student_class as string) || null,
        },
      })
    }

    const isA = listingA?.user_id === session.user.id

    return NextResponse.json({
      match: {
        id: match.id,
        status: match.status,
        initiatedBy: match.initiated_by,
        isGiveawayRequest: false,
        createdAt: match.created_at,
        updatedAt: match.updated_at,
        isInitiator: match.initiated_by === session.user.id,
        completedByMe: isA ? !!match.completed_by_a : !!match.completed_by_b,
        completedByOther: isA ? !!match.completed_by_b : !!match.completed_by_a,
        myListing: isA ? transformSide(listingA) : transformSide(listingB!),
        otherListing: isA ? transformSide(listingB!) : transformSide(listingA),
      },
    })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
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
    const { action } = await request.json()

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: match } = await supabaseAdmin
      .from('trade_matches')
      .select(`
        *,
        listing_a:trade_listings!listing_a_id(user_id),
        listing_b:trade_listings!listing_b_id(user_id)
      `)
      .eq('id', id)
      .single()

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'PENDING') {
      return NextResponse.json({ error: 'Match is not pending' }, { status: 400 })
    }

    // Only the non-initiator can accept/reject
    if (match.initiated_by === session.user.id) {
      return NextResponse.json({ error: 'Cannot accept/reject your own proposal' }, { status: 403 })
    }

    // Verify user is a party
    const listingA = match.listing_a as unknown as Record<string, unknown>
    const listingB = match.listing_b as unknown as Record<string, unknown> | null
    const isParty = listingA?.user_id === session.user.id || listingB?.user_id === session.user.id
    if (!isParty) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED'

    await supabaseAdmin
      .from('trade_matches')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    // If accepted, update listings to MATCHED (only existing ones)
    if (action === 'accept') {
      const listingIds = [match.listing_a_id, match.listing_b_id].filter(Boolean)
      await supabaseAdmin
        .from('trade_listings')
        .update({ status: 'MATCHED', updated_at: new Date().toISOString() })
        .in('id', listingIds)
    }

    const isGiveaway = !match.listing_b_id

    // Notify the initiator
    const notifType = action === 'accept' ? 'TRADE_PROPOSAL_ACCEPTED' : 'TRADE_PROPOSAL_REJECTED'
    createNotification({
      userId: match.initiated_by,
      type: notifType,
      title: action === 'accept'
        ? (isGiveaway ? 'Course request accepted!' : 'Trade proposal accepted!')
        : (isGiveaway ? 'Course request rejected' : 'Trade proposal rejected'),
      message: action === 'accept'
        ? `${session.user.name || 'The other party'} accepted your ${isGiveaway ? 'course request' : 'trade proposal'}. Start chatting now!`
        : `${session.user.name || 'The other party'} rejected your ${isGiveaway ? 'course request' : 'trade proposal'}.`,
      link: `/trading/matches/${id}`,
    })

    return NextResponse.json({ message: `Match ${newStatus.toLowerCase()}` })
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}
