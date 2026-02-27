import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Run all queries in parallel
    const [
      { data: listings },
      { data: matches },
      { data: popularCourses },
      { data: recentListings },
      { data: recentMatches },
      { data: activeTraders },
    ] = await Promise.all([
      supabaseAdmin.from('trade_listings').select('id, status'),
      supabaseAdmin.from('trade_matches').select('id, status'),
      supabaseAdmin
        .from('trade_listing_courses')
        .select('course_code, course_name, type'),
      supabaseAdmin
        .from('trade_listings')
        .select('id, status, notes, created_at, user:users!trade_listings_user_id_fkey(full_name, username)')
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('trade_matches')
        .select(`
          id, status, initiated_by, created_at,
          listing_a:trade_listings!trade_matches_listing_a_id_fkey(user:users!trade_listings_user_id_fkey(full_name, username)),
          listing_b:trade_listings!trade_matches_listing_b_id_fkey(user:users!trade_listings_user_id_fkey(full_name, username))
        `)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('trade_listings')
        .select('user_id')
        .eq('status', 'OPEN'),
    ])

    // Count listings by status
    const listingCounts = { OPEN: 0, MATCHED: 0, COMPLETED: 0, CANCELLED: 0 }
    for (const l of listings || []) {
      if (l.status in listingCounts) listingCounts[l.status as keyof typeof listingCounts]++
    }

    // Count matches by status
    const matchCounts = { PENDING: 0, ACCEPTED: 0, REJECTED: 0, COMPLETED: 0 }
    for (const m of matches || []) {
      if (m.status in matchCounts) matchCounts[m.status as keyof typeof matchCounts]++
    }

    // Completion rate
    const totalMatches = (matches || []).length
    const completionRate = totalMatches > 0
      ? Math.round((matchCounts.COMPLETED / totalMatches) * 100)
      : 0

    // Active traders (distinct user_ids with OPEN listings)
    const uniqueTraders = new Set((activeTraders || []).map(t => t.user_id))

    // Popular courses aggregation
    const courseMap = new Map<string, { courseCode: string; courseName: string; haveCount: number; wantCount: number }>()
    for (const c of popularCourses || []) {
      const key = c.course_code
      if (!courseMap.has(key)) {
        courseMap.set(key, { courseCode: c.course_code, courseName: c.course_name, haveCount: 0, wantCount: 0 })
      }
      const entry = courseMap.get(key)!
      if (c.type === 'HAVE') entry.haveCount++
      else entry.wantCount++
    }
    const topCourses = Array.from(courseMap.values())
      .sort((a, b) => (b.haveCount + b.wantCount) - (a.haveCount + a.wantCount))
      .slice(0, 10)

    // Format recent activity
    const activity: { type: 'listing' | 'match'; description: string; userName: string; timestamp: string }[] = []

    for (const l of recentListings || []) {
      const user = l.user as unknown as { full_name: string; username: string } | null
      activity.push({
        type: 'listing',
        description: `Created a new ${l.status.toLowerCase()} listing`,
        userName: user?.full_name || 'Unknown',
        timestamp: l.created_at,
      })
    }

    for (const m of recentMatches || []) {
      const userA = (m.listing_a as unknown as { user: { full_name: string } | null } | null)?.user
      const userB = (m.listing_b as unknown as { user: { full_name: string } | null } | null)?.user
      activity.push({
        type: 'match',
        description: `${userA?.full_name || 'Unknown'} ↔ ${userB?.full_name || 'Unknown'} — ${m.status.toLowerCase()}`,
        userName: userA?.full_name || 'Unknown',
        timestamp: m.created_at,
      })
    }

    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      listingCounts,
      matchCounts,
      totalListings: (listings || []).length,
      totalMatches,
      completionRate,
      activeTraders: uniqueTraders.size,
      topCourses,
      recentActivity: activity.slice(0, 15),
    })
  } catch (error) {
    console.error('Error fetching trading stats:', error)
    return NextResponse.json({ error: 'Failed to fetch trading stats' }, { status: 500 })
  }
}
