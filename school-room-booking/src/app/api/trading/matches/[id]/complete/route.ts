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
    if (listingA?.user_id !== session.user.id && listingB?.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const now = new Date().toISOString()

    // Mark match as COMPLETED
    await supabaseAdmin
      .from('trade_matches')
      .update({ status: 'COMPLETED', updated_at: now })
      .eq('id', id)

    // Mark both listings as COMPLETED
    await supabaseAdmin
      .from('trade_listings')
      .update({ status: 'COMPLETED', updated_at: now })
      .in('id', [match.listing_a_id, match.listing_b_id])

    return NextResponse.json({ message: 'Trade completed successfully' })
  } catch (error) {
    console.error('Error completing match:', error)
    return NextResponse.json({ error: 'Failed to complete match' }, { status: 500 })
  }
}
