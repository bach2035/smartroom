'use client'

import Link from 'next/link'

interface Floor {
  id: string
  name: string
  level: number
  roomCount: number
}

interface BuildingViewProps {
  buildingId: string
  buildingName: string
  floors: Floor[]
}

export default function BuildingView({ buildingId, buildingName, floors }: BuildingViewProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{buildingName}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {floors
          .sort((a, b) => a.level - b.level)
          .map((floor) => (
            <Link
              key={floor.id}
              href={`/map/${buildingId}/${floor.id}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{floor.name}</h3>
                  <p className="text-sm text-gray-500">Level {floor.level}</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <span className="text-xl font-bold text-blue-600">{floor.level}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                {floor.roomCount} room{floor.roomCount !== 1 ? 's' : ''} available
              </p>
            </Link>
          ))}
      </div>
    </div>
  )
}
