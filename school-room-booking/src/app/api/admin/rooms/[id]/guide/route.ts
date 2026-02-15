import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const { data: guide } = await supabaseAdmin
      .from('room_booking_guides')
      .select('*')
      .eq('room_id', id)
      .single()

    return NextResponse.json(guide || null)
  } catch (error) {
    console.error('Error fetching room guide:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room guide' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const { data: guide, error } = await supabaseAdmin
      .from('room_booking_guides')
      .upsert(
        {
          room_id: id,
          instructions: body.instructions || null,
          contact_name: body.contactName || null,
          contact_email: body.contactEmail || null,
          contact_phone: body.contactPhone || null,
          approval_steps: body.approvalSteps || [],
          document_url: body.documentUrl || null,
          document_name: body.documentName || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'room_id' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      message: 'Guide saved',
      guide,
    })
  } catch (error) {
    console.error('Error saving room guide:', error)
    return NextResponse.json(
      { error: 'Failed to save room guide' },
      { status: 500 }
    )
  }
}
