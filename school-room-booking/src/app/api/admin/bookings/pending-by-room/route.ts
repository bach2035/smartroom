import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all PENDING bookings with room → floor → building and user info
    const { data: pendingBookings, error: pendingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, title, description, start_time, end_time, status, created_at,
        user:users!bookings_user_id_fkey(full_name, username),
        room:rooms!bookings_room_id_fkey(
          id, name, room_number, capacity,
          floor:floors!rooms_floor_id_fkey(
            name,
            building:buildings!floors_building_id_fkey(name)
          )
        )
      `)
      .eq('status', 'PENDING')
      .order('start_time', { ascending: true })

    if (pendingError) throw pendingError

    if (!pendingBookings || pendingBookings.length === 0) {
      return NextResponse.json({ rooms: [], totalPending: 0 })
    }

    // Group pending bookings by room
    const roomMap = new Map<string, {
      roomId: string
      roomName: string
      roomNumber: string
      capacity: number
      building: string
      floor: string
      pendingDates: Set<string>
      pendingBookings: typeof pendingBookings
    }>()

    for (const booking of pendingBookings) {
      const room = booking.room as any
      if (!room) continue

      const roomId = room.id
      const dateStr = new Date(booking.start_time).toISOString().split('T')[0]

      if (!roomMap.has(roomId)) {
        roomMap.set(roomId, {
          roomId,
          roomName: room.name,
          roomNumber: room.room_number,
          capacity: room.capacity,
          building: room.floor?.building?.name || '',
          floor: room.floor?.name || '',
          pendingDates: new Set([dateStr]),
          pendingBookings: [booking],
        })
      } else {
        const entry = roomMap.get(roomId)!
        entry.pendingDates.add(dateStr)
        entry.pendingBookings.push(booking)
      }
    }

    // For each room, fetch APPROVED bookings on the same dates for context
    const rooms = []
    for (const [, roomData] of roomMap) {
      const dates = Array.from(roomData.pendingDates)

      // Build OR filter for each date range
      let approvedBookings: any[] = []
      for (const date of dates) {
        const dayStart = `${date}T00:00:00.000Z`
        const dayEnd = `${date}T23:59:59.999Z`

        const { data } = await supabaseAdmin
          .from('bookings')
          .select(`
            id, title, description, start_time, end_time, status, created_at,
            user:users!bookings_user_id_fkey(full_name, username)
          `)
          .eq('room_id', roomData.roomId)
          .eq('status', 'APPROVED')
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd)
          .order('start_time', { ascending: true })

        if (data) approvedBookings = approvedBookings.concat(data)
      }

      // Combine all bookings for this room
      const allBookings = [
        ...roomData.pendingBookings.map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          startTime: b.start_time,
          endTime: b.end_time,
          status: b.status,
          userName: b.user?.full_name || '',
          userUsername: b.user?.username || '',
          createdAt: b.created_at,
        })),
        ...approvedBookings.map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          startTime: b.start_time,
          endTime: b.end_time,
          status: b.status,
          userName: b.user?.full_name || '',
          userUsername: b.user?.username || '',
          createdAt: b.created_at,
        })),
      ]

      rooms.push({
        roomId: roomData.roomId,
        roomName: roomData.roomName,
        roomNumber: roomData.roomNumber,
        capacity: roomData.capacity,
        building: roomData.building,
        floor: roomData.floor,
        pendingCount: roomData.pendingBookings.length,
        pendingDates: dates.sort(),
        bookings: allBookings,
      })
    }

    // Sort rooms by building name, then room number
    rooms.sort((a, b) => {
      if (a.building !== b.building) return a.building.localeCompare(b.building)
      return a.roomNumber.localeCompare(b.roomNumber)
    })

    return NextResponse.json({
      rooms,
      totalPending: pendingBookings.length,
    })
  } catch (error) {
    console.error('Error fetching pending bookings by room:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending bookings' },
      { status: 500 }
    )
  }
}
