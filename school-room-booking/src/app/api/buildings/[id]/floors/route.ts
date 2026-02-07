import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: building, error } = await supabaseAdmin
      .from('buildings')
      .select(`
        id,
        name,
        description,
        floors(
          id,
          name,
          level,
          rooms(id)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !building) {
      return NextResponse.json(
        { error: 'Building not found' },
        { status: 404 }
      )
    }

    const result = {
      id: building.id,
      name: building.name,
      description: building.description,
      floors: building.floors?.map((floor: { id: string; name: string; level: number; rooms?: { id: string }[] }) => ({
        id: floor.id,
        name: floor.name,
        level: floor.level,
        roomCount: floor.rooms?.length || 0,
      })).sort((a: { level: number }, b: { level: number }) => a.level - b.level) || [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching floors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch floors' },
      { status: 500 }
    )
  }
}
