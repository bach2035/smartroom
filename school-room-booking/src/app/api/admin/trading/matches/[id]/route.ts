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

    const [{ data: match, error: matchError }, { data: messages }] = await Promise.all([
      supabaseAdmin
        .from('trade_matches')
        .select(`
          id, status, initiated_by, created_at, updated_at,
          listing_a:trade_listings!trade_matches_listing_a_id_fkey(
            id, status, notes, created_at,
            user:users!trade_listings_user_id_fkey(id, full_name, username, email),
            courses:trade_listing_courses(id, course_name, course_code, section, schedule, credits, type)
          ),
          listing_b:trade_listings!trade_matches_listing_b_id_fkey(
            id, status, notes, created_at,
            user:users!trade_listings_user_id_fkey(id, full_name, username, email),
            courses:trade_listing_courses(id, course_name, course_code, section, schedule, credits, type)
          )
        `)
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('trade_messages')
        .select('id, content, created_at, sender:users!trade_messages_sender_id_fkey(full_name, username)')
        .eq('match_id', id)
        .order('created_at', { ascending: true }),
    ])

    if (matchError) throw matchError
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const transformListing = (listing: Record<string, unknown> | null) => {
      if (!listing) return null
      const user = listing.user as unknown as { id: string; full_name: string; username: string; email: string } | null
      const courses = (listing.courses || []) as unknown as { id: string; course_name: string; course_code: string; section: string | null; schedule: string | null; credits: number | null; type: string }[]
      return {
        id: listing.id,
        status: listing.status,
        notes: listing.notes,
        createdAt: listing.created_at,
        user: user ? { id: user.id, fullName: user.full_name, username: user.username, email: user.email } : null,
        haveCourses: courses.filter(c => c.type === 'HAVE').map(c => ({
          id: c.id, courseName: c.course_name, courseCode: c.course_code,
          section: c.section, schedule: c.schedule, credits: c.credits, type: c.type,
        })),
        wantCourses: courses.filter(c => c.type === 'WANT').map(c => ({
          id: c.id, courseName: c.course_name, courseCode: c.course_code,
          section: c.section, schedule: c.schedule, credits: c.credits, type: c.type,
        })),
      }
    }

    const chatMessages = (messages || []).map(m => {
      const sender = m.sender as unknown as { full_name: string; username: string } | null
      return {
        id: m.id,
        content: m.content,
        createdAt: m.created_at,
        senderName: sender?.full_name || 'Unknown',
        senderUsername: sender?.username || '',
      }
    })

    return NextResponse.json({
      id: match.id,
      status: match.status,
      initiatedBy: match.initiated_by,
      createdAt: match.created_at,
      updatedAt: match.updated_at,
      listingA: transformListing(match.listing_a as unknown as Record<string, unknown> | null),
      listingB: transformListing(match.listing_b as unknown as Record<string, unknown> | null),
      messages: chatMessages,
    })
  } catch (error) {
    console.error('Error fetching match detail:', error)
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}
