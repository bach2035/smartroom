import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import FilterBar from '@/components/map/FilterBar'
import Breadcrumb from '@/components/map/Breadcrumb'
import FloorPlanWrapper from './FloorPlanWrapper'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ buildingId: string; floorId: string }>
}

interface FloorData {
  id: string
  name: string
  level: number
  svg_path: string
  building_id: string
  building: { id: string; name: string }
  rooms: Array<{
    id: string
    name: string
    room_number: string
    capacity: number
    svg_element_id: string
  }>
}

export default async function FloorPage({ params }: Props) {
  const { buildingId, floorId } = await params

  const { data: floor } = await supabaseAdmin
    .from('floors')
    .select(`
      id,
      name,
      level,
      svg_path,
      building_id,
      building:buildings(id, name),
      rooms(
        id,
        name,
        room_number,
        capacity,
        svg_element_id
      )
    `)
    .eq('id', floorId)
    .eq('is_active', true)
    .single()

  if (!floor || floor.building_id !== buildingId) {
    notFound()
  }

  const floorData = floor as unknown as FloorData

  return (
    <div className="min-h-screen">
      <FilterBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: floorData.building.name, href: `/map/${floorData.building.id}` },
            { label: floorData.name },
          ]}
        />

        {/* Page header */}
        <div className="mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{floorData.building.name}</h1>
              <p className="text-sm text-slate-500">{floorData.name} - Level {floorData.level}</p>
            </div>
          </div>
        </div>

        <FloorPlanWrapper
          floorId={floorData.id}
          svgPath={floorData.svg_path}
          rooms={floorData.rooms?.map((r) => ({
            id: r.id,
            name: r.name,
            roomNumber: r.room_number,
            capacity: r.capacity,
            svgElementId: r.svg_element_id,
          })) || []}
        />
      </div>
    </div>
  )
}
