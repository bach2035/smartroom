import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface RoomEquipmentRow {
  quantity: number
  equipment: { id: string; name: string; icon: string | null }
}

interface RoomRow {
  id: string
  name: string
  room_number: string
  capacity: number
  description: string | null
  floor: {
    id: string
    name: string
    level: number
    building: { id: string; name: string }
  }
  room_equipment: RoomEquipmentRow[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'date, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    // Build ISO range from date + time (GMT+7)
    const rangeStart = new Date(`${date}T${startTime}:00+07:00`).toISOString()
    const rangeEnd = new Date(`${date}T${endTime}:00+07:00`).toISOString()

    // 1. Fetch all active rooms with floor → building joins and equipment
    const { data: rooms, error: roomsError } = await supabaseAdmin
      .from('rooms')
      .select(`
        id,
        name,
        room_number,
        capacity,
        description,
        floor:floors!inner(
          id,
          name,
          level,
          building:buildings!inner(id, name)
        ),
        room_equipment(
          quantity,
          equipment(id, name, icon)
        )
      `)
      .eq('is_active', true)
      .eq('floors.is_active', true)
      .eq('floors.buildings.is_active', true)

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError)
      return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
    }

    const typedRooms = (rooms || []) as unknown as RoomRow[]
    const roomIds = typedRooms.map((r) => r.id)

    // 2. Fetch only APPROVED bookings that overlap the time range
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('room_id')
      .in('room_id', roomIds)
      .eq('status', 'APPROVED')
      .lt('start_time', rangeEnd)
      .gt('end_time', rangeStart)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    }

    // 3. Build set of booked room IDs
    const bookedRoomIds = new Set(bookings?.map((b) => b.room_id) || [])

    // 4. Filter to available rooms and sort by building → floor level → room number
    const availableRooms = typedRooms
      .filter((r) => !bookedRoomIds.has(r.id))
      .sort((a, b) => {
        const buildingCmp = a.floor.building.name.localeCompare(b.floor.building.name)
        if (buildingCmp !== 0) return buildingCmp
        const floorCmp = a.floor.level - b.floor.level
        if (floorCmp !== 0) return floorCmp
        return a.room_number.localeCompare(b.room_number)
      })
      .map((r) => ({
        id: r.id,
        name: r.name,
        roomNumber: r.room_number,
        capacity: r.capacity,
        description: r.description,
        building: r.floor.building,
        floor: { id: r.floor.id, name: r.floor.name, level: r.floor.level },
        equipment: r.room_equipment?.map((re) => ({
          id: re.equipment.id,
          name: re.equipment.name,
          icon: re.equipment.icon,
          quantity: re.quantity,
        })) || [],
      }))

    return NextResponse.json({
      rooms: availableRooms,
      availableCount: availableRooms.length,
      totalRooms: typedRooms.length,
    })
  } catch (error) {
    console.error('Error searching available rooms:', error)
    return NextResponse.json(
      { error: 'Failed to search available rooms' },
      { status: 500 }
    )
  }
}
