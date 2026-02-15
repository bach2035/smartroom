import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface ReportData {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  admin_notes: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  user: { id: string; full_name: string; email: string }
  room: {
    name: string
    room_number: string
    floor: {
      name: string
      building: { name: string }
    }
  }
  resolver: { full_name: string } | null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('reports')
      .select(`
        id,
        title,
        description,
        category,
        status,
        admin_notes,
        created_at,
        updated_at,
        resolved_at,
        user:users!reports_user_id_fkey(id, full_name, email),
        room:rooms(
          name,
          room_number,
          floor:floors(
            name,
            building:buildings(name)
          )
        ),
        resolver:users!reports_resolved_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: reports, error } = await query

    if (error) throw error

    const typedReports = reports as unknown as ReportData[]

    return NextResponse.json(
      typedReports.map((report) => ({
        id: report.id,
        title: report.title,
        description: report.description,
        category: report.category,
        status: report.status,
        adminNotes: report.admin_notes,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        resolvedAt: report.resolved_at,
        reporter: {
          id: report.user?.id,
          name: report.user?.full_name,
          email: report.user?.email,
        },
        room: {
          name: report.room?.name,
          roomNumber: report.room?.room_number,
          floor: report.room?.floor?.name,
          building: report.room?.floor?.building?.name,
        },
        resolver: report.resolver?.full_name || null,
      }))
    )
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
