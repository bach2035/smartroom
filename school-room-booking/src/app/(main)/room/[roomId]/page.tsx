import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Breadcrumb from '@/components/map/Breadcrumb'
import EquipmentList from '@/components/room/EquipmentList'
import BookingGuideInfo from '@/components/bookings/BookingGuideInfo'
import ApprovalTimeline from '@/components/bookings/ApprovalTimeline'
import RoomBookingClient from './RoomBookingClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params

  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select(`
      id,
      name,
      room_number,
      capacity,
      description,
      image_url,
      image_position,
      floor:floors(
        id,
        name,
        level,
        building:buildings(id, name)
      ),
      room_equipment(
        quantity,
        equipment(id, name, icon)
      )
    `)
    .eq('id', roomId)
    .eq('is_active', true)
    .single()

  if (!room) {
    notFound()
  }

  interface RoomEquipmentItem {
    quantity: number
    equipment: { id: string; name: string; icon: string | null }
  }

  const roomData = room as unknown as {
    id: string
    name: string
    room_number: string
    capacity: number
    description: string | null
    image_url: string | null
    image_position: string | null
    floor: {
      id: string
      name: string
      level: number
      building: { id: string; name: string }
    }
    room_equipment: RoomEquipmentItem[]
  }

  const equipmentData = roomData.room_equipment?.map((re) => ({
    id: re.equipment.id,
    name: re.equipment.name,
    icon: re.equipment.icon,
    quantity: re.quantity,
  })) || []

  // Fetch room booking guide
  const { data: guide } = await supabaseAdmin
    .from('room_booking_guides')
    .select('*')
    .eq('room_id', roomId)
    .single()

  const guideData = guide ? {
    instructions: guide.instructions as string | null,
    contactName: guide.contact_name as string | null,
    contactEmail: guide.contact_email as string | null,
    contactPhone: guide.contact_phone as string | null,
    approvalSteps: (guide.approval_steps || []) as { order: number; title: string; description: string; type: 'approval' | 'cc'; members: { name: string }[] }[],
    documentUrl: guide.document_url as string | null,
    documentName: guide.document_name as string | null,
  } : null

  // Fetch admin users as fallback contact info
  const { data: admins } = await supabaseAdmin
    .from('users')
    .select('full_name, email, phone')
    .eq('role', 'ADMIN')
    .order('created_at', { ascending: true })
    .limit(3)

  const adminContacts = (admins || []) as { full_name: string; email: string; phone: string | null }[]

  // Use guide contact if available, otherwise fall back to admin users
  const hasGuideContact = guideData && (guideData.contactName || guideData.contactEmail || guideData.contactPhone)

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: roomData.floor.building.name, href: `/map/${roomData.floor.building.id}` },
            { label: roomData.floor.name, href: `/map/${roomData.floor.building.id}/${roomData.floor.id}` },
            { label: roomData.room_number },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room header card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Header with room image or gradient fallback */}
              <div className="h-48 relative">
                {roomData.image_url ? (
                  <>
                    <img
                      src={roomData.image_url}
                      alt={roomData.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ objectPosition: roomData.image_position || 'center 50%' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-700 to-red-800">
                    <div className="absolute inset-0 opacity-10">
                      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="room-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#room-grid)" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-white">{roomData.name}</h1>
                      <p className="text-red-100 mt-1">Room {roomData.room_number}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-xl">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-white font-medium">{roomData.capacity} seats</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room details */}
              <div className="p-6">
                {roomData.description && (
                  <p className="text-slate-600 mb-6">{roomData.description}</p>
                )}

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Building</p>
                      <p className="font-medium text-slate-800">{roomData.floor.building.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Floor</p>
                      <p className="font-medium text-slate-800">{roomData.floor.name} (Level {roomData.floor.level})</p>
                    </div>
                  </div>
                </div>

                <EquipmentList equipment={equipmentData} />
              </div>
            </div>

            {/* Guide & Instructions */}
            {guideData && guideData.approvalSteps.length > 0 && (
              <ApprovalTimeline steps={guideData.approvalSteps} bookingStatus="" />
            )}

            <BookingGuideInfo
              instructions={guideData?.instructions ?? null}
              contactName={guideData?.contactName ?? null}
              contactEmail={guideData?.contactEmail ?? null}
              contactPhone={guideData?.contactPhone ?? null}
              documentUrl={guideData?.documentUrl ?? null}
              documentName={guideData?.documentName ?? null}
            />

            {/* Booking section */}
            <RoomBookingClient roomId={roomData.id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Room Information
              </h3>
              <dl className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <dt className="text-sm text-slate-500">Capacity</dt>
                  <dd className="font-medium text-slate-800">{roomData.capacity} people</dd>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <dt className="text-sm text-slate-500">Building</dt>
                  <dd className="font-medium text-slate-800">{roomData.floor.building.name}</dd>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <dt className="text-sm text-slate-500">Floor</dt>
                  <dd className="font-medium text-slate-800">{roomData.floor.name}</dd>
                </div>
                {equipmentData.length > 0 && (
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-sm text-slate-500">Equipment</dt>
                    <dd className="font-medium text-slate-800">{equipmentData.length} items</dd>
                  </div>
                )}
              </dl>

              {/* Manager Contact */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {hasGuideContact ? 'Room Manager' : 'Contact Admin'}
                </h4>
                {hasGuideContact ? (
                  <div className="space-y-2">
                    {guideData!.contactName && (
                      <p className="text-sm font-medium text-slate-700">{guideData!.contactName}</p>
                    )}
                    {guideData!.contactEmail && (
                      <a href={`mailto:${guideData!.contactEmail}`} className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 transition-colors">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {guideData!.contactEmail}
                      </a>
                    )}
                    {guideData!.contactPhone && (
                      <a href={`tel:${guideData!.contactPhone}`} className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 transition-colors">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {guideData!.contactPhone}
                      </a>
                    )}
                  </div>
                ) : adminContacts.length > 0 ? (
                  <div className="space-y-3">
                    {adminContacts.map((admin, i) => (
                      <div key={i} className={i > 0 ? 'pt-3 border-t border-slate-200' : ''}>
                        <p className="text-sm font-medium text-slate-700">{admin.full_name}</p>
                        <a href={`mailto:${admin.email}`} className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 transition-colors mt-1">
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {admin.email}
                        </a>
                        {admin.phone && (
                          <a href={`tel:${admin.phone}`} className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 transition-colors mt-1">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {admin.phone}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No contact information available</p>
                )}
              </div>

              {/* Quick tips */}
              <div className="mt-6 p-4 bg-red-50 rounded-xl">
                <h4 className="text-sm font-medium text-red-900 mb-2">Booking Tips</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>Select your preferred time slot below</li>
                  <li>Bookings require admin approval</li>
                  <li>Check your bookings page for status</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
