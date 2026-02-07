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
    const { reason } = await request.json()

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
        { error: 'Only pending bookings can be rejected' },
        { status: 400 }
      )
    }

    const { data: updatedBooking, error } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'REJECTED',
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
        reject_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      message: 'Booking rejected',
      booking: updatedBooking,
    })
  } catch (error) {
    console.error('Error rejecting booking:', error)
    return NextResponse.json(
      { error: 'Failed to reject booking' },
      { status: 500 }
    )
  }
}
