import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createNotification } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const after = request.nextUrl.searchParams.get('after')

    // Verify user is a party to this match
    const { data: match } = await supabaseAdmin
      .from('trade_matches')
      .select(`
        listing_a:trade_listings!listing_a_id(user_id),
        listing_b:trade_listings!listing_b_id(user_id)
      `)
      .eq('id', id)
      .single()

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const listingA = match.listing_a as unknown as Record<string, unknown>
    const listingB = match.listing_b as unknown as Record<string, unknown>
    if (listingA?.user_id !== session.user.id && listingB?.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    let query = supabaseAdmin
      .from('trade_messages')
      .select(`
        *,
        sender:users(full_name)
      `)
      .eq('match_id', id)
      .order('created_at', { ascending: true })

    if (after) {
      query = query.gt('created_at', after)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    const result = (messages || []).map((msg) => {
      const sender = msg.sender as unknown as Record<string, unknown> | null
      return {
        id: msg.id,
        matchId: msg.match_id,
        senderId: msg.sender_id,
        content: msg.content,
        createdAt: msg.created_at,
        senderName: sender?.full_name || 'Unknown',
        isOwn: msg.sender_id === session.user.id,
      }
    })

    return NextResponse.json({ messages: result })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Verify match exists and is ACCEPTED
    const { data: match } = await supabaseAdmin
      .from('trade_matches')
      .select(`
        status,
        listing_a:trade_listings!listing_a_id(user_id),
        listing_b:trade_listings!listing_b_id(user_id)
      `)
      .eq('id', id)
      .single()

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'ACCEPTED' && match.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Chat is only available for accepted matches' }, { status: 400 })
    }

    const listingA = match.listing_a as unknown as Record<string, unknown>
    const listingB = match.listing_b as unknown as Record<string, unknown>
    if (listingA?.user_id !== session.user.id && listingB?.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { data: message, error } = await supabaseAdmin
      .from('trade_messages')
      .insert({
        match_id: id,
        sender_id: session.user.id,
        content: content.trim(),
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Notify the other party (throttled — skip if recent notification exists)
    const otherUserId = listingA?.user_id === session.user.id
      ? listingB?.user_id as string
      : listingA?.user_id as string

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', otherUserId)
      .eq('type', 'TRADE_NEW_MESSAGE')
      .eq('link', `/trading/matches/${id}`)
      .gt('created_at', fiveMinAgo)

    if (!recentCount) {
      createNotification({
        userId: otherUserId,
        type: 'TRADE_NEW_MESSAGE',
        title: 'New message',
        message: `${session.user.name || 'Someone'}: ${content.trim().slice(0, 100)}`,
        link: `/trading/matches/${id}`,
      })
    }

    return NextResponse.json({
      message: {
        id: message.id,
        matchId: message.match_id,
        senderId: message.sender_id,
        content: message.content,
        createdAt: message.created_at,
        senderName: session.user.name || 'You',
        isOwn: true,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
