import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, title, description, category } = await request.json()

    if (!roomId || !title || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const validCategories = ['EQUIPMENT_MALFUNCTION', 'DEVICE_MISSING', 'FURNITURE_DAMAGE', 'CLEANLINESS', 'OTHER']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Check if room exists
    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .eq('is_active', true)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .insert({
        room_id: roomId,
        user_id: session.user.id,
        title,
        description: description || null,
        category,
      })
      .select(`
        id,
        title,
        category,
        status,
        created_at,
        room:rooms(name, room_number)
      `)
      .single()

    if (error) {
      console.error('Error creating report:', error)
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Report submitted',
        report: {
          id: report.id,
          title: report.title,
          category: report.category,
          status: report.status,
          createdAt: report.created_at,
          room: report.room,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}
