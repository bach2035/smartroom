import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface RoomData {
  id: string
  name: string
  room_number: string
  capacity: number
  description: string | null
  is_active: boolean
  floor_id: string
  floor: {
    name: string
    building_id: string
    building: { name: string }
  }
  room_equipment: Array<{
    quantity: number
    equipment: { id: string; name: string }
  }>
  bookings: Array<{ id: string }>
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: rooms, error } = await supabaseAdmin
      .from('rooms')
      .select(`
        id,
        name,
        room_number,
        capacity,
        description,
        is_active,
        floor_id,
        floor:floors(
          name,
          building_id,
          building:buildings(name)
        ),
        room_equipment(
          quantity,
          equipment(id, name)
        ),
        bookings(id)
      `)
      .order('room_number')

    if (error) throw error

    const typedRooms = rooms as unknown as RoomData[]

    return NextResponse.json(
      typedRooms.map((room) => ({
        id: room.id,
        name: room.name,
        roomNumber: room.room_number,
        capacity: room.capacity,
        description: room.description,
        isActive: room.is_active,
        floor: room.floor?.name,
        building: room.floor?.building?.name,
        floorId: room.floor_id,
        buildingId: room.floor?.building_id,
        equipment: room.room_equipment?.map((re) => ({
          id: re.equipment.id,
          name: re.equipment.name,
          quantity: re.quantity,
        })) || [],
        bookingCount: room.bookings?.length || 0,
      }))
    )
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, roomNumber, capacity, description, floorId, svgElementId } = await request.json()

    if (!name || !roomNumber || !capacity || !floorId || !svgElementId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: floor } = await supabaseAdmin
      .from('floors')
      .select('id')
      .eq('id', floorId)
      .single()

    if (!floor) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 })
    }

    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .insert({
        name,
        room_number: roomNumber,
        capacity,
        description,
        floor_id: floorId,
        svg_element_id: svgElementId,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: 'Room created', room }, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
