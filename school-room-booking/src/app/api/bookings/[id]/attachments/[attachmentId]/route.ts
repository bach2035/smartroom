import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, attachmentId } = await params

    // Verify booking ownership or admin
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.user_id !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get attachment metadata
    const { data: attachment } = await supabaseAdmin
      .from('booking_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('booking_id', id)
      .single()

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Download from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('booking_attachments')
      .download(attachment.file_path)

    if (downloadError) throw downloadError

    const arrayBuffer = await fileData.arrayBuffer()

    const isImage = attachment.mime_type?.startsWith('image/')
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': attachment.mime_type || 'application/octet-stream',
        'Content-Disposition': `${isImage ? 'inline' : 'attachment'}; filename="${attachment.file_name}"`,
        ...(isImage ? { 'Cache-Control': 'public, max-age=3600' } : {}),
      },
    })
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, attachmentId } = await params

    // Verify booking ownership and status
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.user_id !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only delete files for pending bookings' },
        { status: 400 }
      )
    }

    // Get attachment metadata
    const { data: attachment } = await supabaseAdmin
      .from('booking_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('booking_id', id)
      .single()

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('booking_attachments')
      .remove([attachment.file_path])

    if (storageError) throw storageError

    // Delete metadata row
    const { error: deleteError } = await supabaseAdmin
      .from('booking_attachments')
      .delete()
      .eq('id', attachmentId)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: 'Attachment deleted' })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}
