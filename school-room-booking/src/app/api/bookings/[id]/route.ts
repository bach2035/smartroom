import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface BookingData {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  status: string
  reject_reason: string | null
  created_at: string
  room: {
    id: string
    name: string
    room_number: string
    capacity: number
    floor: {
      name: string
      building: { name: string }
    }
  }
  booking_attachments: {
    id: string
    file_name: string
    file_size: number
    mime_type: string | null
    created_at: string
  }[]
}

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

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        status,
        reject_reason,
        created_at,
        room:rooms(
          id,
          name,
          room_number,
          capacity,
          floor:floors(
            name,
            building:buildings(name)
          )
        ),
        booking_attachments(
          id,
          file_name,
          file_size,
          mime_type,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const typed = booking as unknown as BookingData

    // Only allow owner or admin
    const { data: rawBooking } = await supabaseAdmin
      .from('bookings')
      .select('user_id')
      .eq('id', id)
      .single()

    if (rawBooking?.user_id !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      id: typed.id,
      title: typed.title,
      description: typed.description,
      startTime: typed.start_time,
      endTime: typed.end_time,
      status: typed.status,
      rejectReason: typed.reject_reason,
      createdAt: typed.created_at,
      room: {
        id: typed.room?.id,
        name: typed.room?.name,
        roomNumber: typed.room?.room_number,
        capacity: typed.room?.capacity,
        floor: typed.room?.floor?.name,
        building: typed.room?.floor?.building?.name,
      },
      attachments: await Promise.all(
        (typed.booking_attachments || []).map(async (a) => {
          const { data: att } = await supabaseAdmin
            .from('booking_attachments')
            .select('file_path')
            .eq('id', a.id)
            .single()

          let url: string | null = null
          if (att?.file_path) {
            const { data: signedUrlData } = await supabaseAdmin.storage
              .from('booking_attachments')
              .createSignedUrl(att.file_path, 3600)
            url = signedUrlData?.signedUrl || null
          }

          return {
            id: a.id,
            fileName: a.file_name,
            fileSize: a.file_size,
            mimeType: a.mime_type,
            createdAt: a.created_at,
            url,
          }
        })
      ),
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}
