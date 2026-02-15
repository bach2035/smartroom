import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface RoomEquipment {
  quantity: number
  equipment: { id: string; name: string; icon: string | null }
}

interface RoomData {
  id: string
  name: string
  room_number: string
  capacity: number
  description: string | null
  svg_element_id: string
  room_equipment: RoomEquipment[]
}

interface FloorData {
  id: string
  name: string
  level: number
  svg_path: string
  building: { id: string; name: string }
  rooms: RoomData[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const rangeStart = searchParams.get('rangeStart')
    const rangeEnd = searchParams.get('rangeEnd')

    const { data: floor, error } = await supabaseAdmin
      .from('floors')
      .select(`
        id,
        name,
        level,
        svg_path,
        building:buildings(id, name),
        rooms(
          id,
          name,
          room_number,
          capacity,
          description,
          svg_element_id,
          room_equipment(
            quantity,
            equipment(id, name, icon)
          )
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !floor) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 })
    }

    const typedFloor = floor as unknown as FloorData

    // Get bookings that overlap with the selected time window
    const roomIds = typedFloor.rooms?.map((r) => r.id) || []

    // rangeStart/rangeEnd are full ISO strings with timezone from the client
    // Default to today 08:00–18:00 in GMT+7
    const todayGMT7 = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())
    const todayStart = new Date(`${todayGMT7}T08:00:00+07:00`).toISOString()
    const todayEnd = new Date(`${todayGMT7}T18:00:00+07:00`).toISOString()
    const filterStart = rangeStart || todayStart
    const filterEnd = rangeEnd || todayEnd

    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, room_id, title, start_time, end_time, status, users!bookings_user_id_fkey(full_name)')
      .in('room_id', roomIds)
      .in('status', ['PENDING', 'APPROVED'])
      .lt('start_time', filterEnd)
      .gt('end_time', filterStart)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    }

    const roomBookings: Record<string, { id: string; title: string; startTime: string; endTime: string; status: string; userName: string }[]> = {}
    bookings?.forEach((b) => {
      if (!roomBookings[b.room_id]) roomBookings[b.room_id] = []
      const user = (b as Record<string, unknown>).users as { full_name: string } | null
      roomBookings[b.room_id].push({
        id: b.id,
        title: b.title,
        startTime: b.start_time,
        endTime: b.end_time,
        status: b.status,
        userName: user?.full_name || 'Unknown',
      })
    })

    return NextResponse.json({
      id: typedFloor.id,
      name: typedFloor.name,
      level: typedFloor.level,
      svgPath: typedFloor.svg_path,
      building: typedFloor.building,
      rooms: typedFloor.rooms?.map((room) => ({
        id: room.id,
        name: room.name,
        roomNumber: room.room_number,
        capacity: room.capacity,
        description: room.description,
        svgElementId: room.svg_element_id,
        isBooked: (roomBookings[room.id]?.length || 0) > 0,
        bookings: roomBookings[room.id] || [],
        equipment: room.room_equipment?.map((re) => ({
          id: re.equipment.id,
          name: re.equipment.name,
          quantity: re.quantity,
        })) || [],
      })) || [],
    })
  } catch (error) {
    console.error('Error fetching floor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch floor' },
      { status: 500 }
    )
  }
}
