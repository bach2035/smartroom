import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, username, full_name, email, phone, role, student_class, student_id')
      .eq('id', session.user.id)
      .single()

    if (error) throw error

    return NextResponse.json({
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      studentClass: user.student_class,
      studentId: user.student_id,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, email, phone, studentClass, studentId } = body

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check email uniqueness
    if (email) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', session.user.id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 409 }
        )
      }
    }

    const updates: Record<string, string | null> = {}
    if (fullName !== undefined) updates.full_name = fullName
    if (email !== undefined) updates.email = email
    if (phone !== undefined) updates.phone = phone || null
    if (studentClass !== undefined) updates.student_class = studentClass || null
    if (studentId !== undefined) updates.student_id = studentId || null

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', session.user.id)
      .select('username, full_name, email, phone, role, student_class, student_id')
      .single()

    if (error) throw error

    return NextResponse.json({
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      studentClass: user.student_class,
      studentId: user.student_id,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
