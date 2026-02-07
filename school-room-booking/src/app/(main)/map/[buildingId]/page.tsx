import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import FilterBar from '@/components/map/FilterBar'
import Breadcrumb from '@/components/map/Breadcrumb'
import BuildingView from '@/components/map/BuildingView'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ buildingId: string }>
}

export default async function BuildingPage({ params }: Props) {
  const { buildingId } = await params

  const { data: building } = await supabaseAdmin
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
    .eq('id', buildingId)
    .eq('is_active', true)
    .single()

  if (!building) {
    notFound()
  }

  const floors = building.floors?.map((f: { id: string; name: string; level: number; rooms?: { id: string }[] }) => ({
    id: f.id,
    name: f.name,
    level: f.level,
    roomCount: f.rooms?.length || 0,
  })).sort((a: { level: number }, b: { level: number }) => a.level - b.level) || []

  return (
    <div>
      <FilterBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: building.name },
          ]}
        />
        <BuildingView
          buildingId={building.id}
          buildingName={building.name}
          floors={floors}
        />
      </div>
    </div>
  )
}
