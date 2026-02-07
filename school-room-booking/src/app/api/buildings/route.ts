import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: buildings, error } = await supabaseAdmin
      .from('buildings')
      .select(`
        id,
        name,
        description,
        floors(id)
      `)
      .eq('is_active', true)
      .order('name')

    if (error) throw error

    const result = buildings.map((building) => ({
      id: building.id,
      name: building.name,
      description: building.description,
      floorCount: building.floors?.length || 0,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching buildings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buildings' },
      { status: 500 }
    )
  }
}
