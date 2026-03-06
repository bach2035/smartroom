import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('id, image_url')
      .eq('id', id)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image must be under 5MB' },
        { status: 400 }
      )
    }

    // Delete old image if exists
    if (room.image_url) {
      const oldPath = extractStoragePath(room.image_url)
      if (oldPath) {
        await supabaseAdmin.storage.from('room-images').remove([oldPath])
      }
    }

    // Upload new image
    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `${id}/${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('room-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('room-images')
      .getPublicUrl(filePath)

    const imageUrl = urlData.publicUrl

    // Update room record
    const { error: updateError } = await supabaseAdmin
      .from('rooms')
      .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error uploading room image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

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
    const { position } = await request.json()

    if (!position || typeof position !== 'string') {
      return NextResponse.json({ error: 'Invalid position' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('rooms')
      .update({ image_position: position, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ position })
  } catch (error) {
    console.error('Error updating image position:', error)
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('id, image_url')
      .eq('id', id)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.image_url) {
      const oldPath = extractStoragePath(room.image_url)
      if (oldPath) {
        await supabaseAdmin.storage.from('room-images').remove([oldPath])
      }
    }

    await supabaseAdmin
      .from('rooms')
      .update({ image_url: null, updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ message: 'Image removed' })
  } catch (error) {
    console.error('Error removing room image:', error)
    return NextResponse.json(
      { error: 'Failed to remove image' },
      { status: 500 }
    )
  }
}

function extractStoragePath(publicUrl: string): string | null {
  const marker = '/storage/v1/object/public/room-images/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.slice(idx + marker.length)
}
