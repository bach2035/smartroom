import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending bookings can be approved' },
        { status: 400 }
      )
    }

    const { data: updatedBooking, error } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'APPROVED',
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      message: 'Booking approved',
      booking: updatedBooking,
    })
  } catch (error) {
    console.error('Error approving booking:', error)
    return NextResponse.json(
      { error: 'Failed to approve booking' },
      { status: 500 }
    )
  }
}
