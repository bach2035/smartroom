import { NextResponse } from 'next/server'
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
  room: {
    name: string
    room_number: string
    floor: {
      name: string
      building: { name: string }
    }
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: reports, error } = await supabaseAdmin
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
        room:rooms(
          name,
          room_number,
          floor:floors(
            name,
            building:buildings(name)
          )
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

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
        room: {
          name: report.room?.name,
          roomNumber: report.room?.room_number,
          floor: report.room?.floor?.name,
          building: report.room?.floor?.building?.name,
        },
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
