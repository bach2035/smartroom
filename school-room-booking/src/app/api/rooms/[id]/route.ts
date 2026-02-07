import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface RoomData {
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
  room_equipment: Array<{
    quantity: number
    equipment: { id: string; name: string; icon: string | null }
  }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .select(`
        id,
        name,
        room_number,
        capacity,
        description,
        floor:floors(
          id,
          name,
          level,
          building:buildings(id, name)
        ),
        room_equipment(
          quantity,
          equipment(id, name, icon)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const typedRoom = room as unknown as RoomData

    return NextResponse.json({
      id: typedRoom.id,
      name: typedRoom.name,
      roomNumber: typedRoom.room_number,
      capacity: typedRoom.capacity,
      description: typedRoom.description,
      floor: {
        id: typedRoom.floor.id,
        name: typedRoom.floor.name,
        level: typedRoom.floor.level,
      },
      building: typedRoom.floor.building,
      equipment: typedRoom.room_equipment?.map((re) => ({
        id: re.equipment.id,
        name: re.equipment.name,
        icon: re.equipment.icon,
        quantity: re.quantity,
      })) || [],
    })
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    )
  }
}
