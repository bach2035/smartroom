import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    if (match.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Match must be accepted before completing' }, { status: 400 })
    }

    const listingA = match.listing_a as unknown as Record<string, unknown>
    const listingB = match.listing_b as unknown as Record<string, unknown>
    const isA = listingA?.user_id === session.user.id
    const isB = listingB?.user_id === session.user.id

    if (!isA && !isB) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if already confirmed by this party
    if ((isA && match.completed_by_a) || (isB && match.completed_by_b)) {
      return NextResponse.json({ error: 'You have already confirmed completion' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const update: Record<string, unknown> = { updated_at: now }
    if (isA) update.completed_by_a = true
    if (isB) update.completed_by_b = true

    // Check if both parties will have confirmed after this update
    const bothConfirmed = (isA && match.completed_by_b) || (isB && match.completed_by_a)

    if (bothConfirmed) {
      update.status = 'COMPLETED'
    }

    await supabaseAdmin
      .from('trade_matches')
      .update(update)
      .eq('id', id)

    if (bothConfirmed) {
      await supabaseAdmin
        .from('trade_listings')
        .update({ status: 'COMPLETED', updated_at: now })
        .in('id', [match.listing_a_id, match.listing_b_id])

      return NextResponse.json({ message: 'Trade completed successfully' })
    }

    return NextResponse.json({ message: 'Marked as completed. Waiting for the other party to confirm.' })
  } catch (error) {
    console.error('Error completing match:', error)
    return NextResponse.json({ error: 'Failed to complete match' }, { status: 500 })
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

    if (match.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Can only cancel completion for accepted matches' }, { status: 400 })
    }

    const listingA = match.listing_a as unknown as Record<string, unknown>
    const listingB = match.listing_b as unknown as Record<string, unknown>
    const isA = listingA?.user_id === session.user.id
    const isB = listingB?.user_id === session.user.id

    if (!isA && !isB) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if ((isA && !match.completed_by_a) || (isB && !match.completed_by_b)) {
      return NextResponse.json({ error: 'You have not confirmed completion' }, { status: 400 })
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (isA) update.completed_by_a = false
    if (isB) update.completed_by_b = false

    await supabaseAdmin
      .from('trade_matches')
      .update(update)
      .eq('id', id)

    return NextResponse.json({ message: 'Completion cancelled' })
  } catch (error) {
    console.error('Error cancelling completion:', error)
    return NextResponse.json({ error: 'Failed to cancel completion' }, { status: 500 })
  }
}
