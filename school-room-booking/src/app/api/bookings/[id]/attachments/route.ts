import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    const { data: attachments } = await supabaseAdmin
      .from('booking_attachments')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: false })

    // Generate signed URLs for each attachment
    const withUrls = await Promise.all(
      (attachments || []).map(async (att) => {
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from('booking_attachments')
          .createSignedUrl(att.file_path, 3600) // 1 hour

        return {
          ...att,
          url: signedUrlData?.signedUrl || null,
        }
      })
    )

    return NextResponse.json(withUrls)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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
        { error: 'Can only upload files for pending bookings' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage
    // Sanitize filename for storage path (keep original name in DB)
    const ext = file.name.split('.').pop() || 'bin'
    const filePath = `${id}/${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('booking_attachments')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Insert metadata row
    const { data: attachment, error: insertError } = await supabaseAdmin
      .from('booking_attachments')
      .insert({
        booking_id: id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || null,
        uploaded_by: session.user.id,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      message: 'File uploaded',
      attachment,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error uploading attachment:', msg, error)
    return NextResponse.json(
      { error: `Failed to upload file: ${msg}` },
      { status: 500 }
    )
  }
}
