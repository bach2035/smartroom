'use client'

import Link from 'next/link'

interface Building {
  id: string
  name: string
  description: string | null
  floorCount: number
}

interface CampusViewProps {
  buildings: Building[]
}

export default function CampusView({ buildings }: CampusViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {buildings.map((building, index) => (
        <Link
          key={building.id}
          href={`/map/${building.id}`}
          className="group block bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Building visual */}
          <div className="h-44 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id={`grid-${building.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#grid-${building.id})`} />
              </svg>
            </div>

            {/* Building icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>

            {/* Floor count badge */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-sm font-medium text-slate-700 shadow-sm">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {building.floorCount} {building.floorCount === 1 ? 'Floor' : 'Floors'}
              </span>
            </div>
          </div>

          {/* Building info */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {building.name}
                </h3>
                {building.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{building.description}</p>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
