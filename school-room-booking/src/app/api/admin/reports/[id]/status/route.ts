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
    const { status, adminNotes } = await request.json()

    const validStatuses = ['IN_PROGRESS', 'RESOLVED', 'CLOSED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const { data: report } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes
    }

    if (status === 'RESOLVED') {
      updateData.resolved_by = session.user.id
      updateData.resolved_at = new Date().toISOString()
    }

    const { data: updatedReport, error } = await supabaseAdmin
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      message: 'Report status updated',
      report: updatedReport,
    })
  } catch (error) {
    console.error('Error updating report status:', error)
    return NextResponse.json(
      { error: 'Failed to update report status' },
      { status: 500 }
    )
  }
}
