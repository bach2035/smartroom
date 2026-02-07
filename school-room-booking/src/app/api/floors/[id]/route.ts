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
    const date = searchParams.get('date')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')

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

    // Get room availability if date/time filters are provided
    let roomAvailability: Record<string, boolean> = {}
    if (date && startTime && endTime) {
      const startDateTime = `${date}T${startTime}:00`
      const endDateTime = `${date}T${endTime}:00`

      const roomIds = typedFloor.rooms?.map((r) => r.id) || []

      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('room_id')
        .in('room_id', roomIds)
        .in('status', ['PENDING', 'APPROVED'])
        .lt('start_time', endDateTime)
        .gt('end_time', startDateTime)

      const bookedRoomIds = new Set(bookings?.map((b) => b.room_id) || [])
      typedFloor.rooms?.forEach((room) => {
        roomAvailability[room.id] = bookedRoomIds.has(room.id)
      })
    }

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
        isBooked: roomAvailability[room.id] || false,
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
