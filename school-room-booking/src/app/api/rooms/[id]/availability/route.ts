import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface BookingData {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  user: { full_name: string }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        title,
        start_time,
        end_time,
        status,
        user:users!bookings_user_id_fkey(full_name)
      `)
      .eq('room_id', id)
      .in('status', ['PENDING', 'APPROVED'])
      .gte('start_time', startOfDay)
      .lte('end_time', endOfDay)
      .order('start_time')

    const typedBookings = bookings as unknown as BookingData[]

    // Generate 30-minute time slots from 7:00 to 22:00
    const slots = []
    for (let hour = 7; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(`${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`)
        const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000)

        const booking = typedBookings?.find(
          (b) => new Date(b.start_time) <= slotStart && new Date(b.end_time) > slotStart
        )

        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          isAvailable: !booking,
          booking: booking
            ? {
                id: booking.id,
                title: booking.title,
                status: booking.status,
                userName: booking.user?.full_name || 'Unknown',
              }
            : null,
        })
      }
    }

    return NextResponse.json({ date, slots })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
