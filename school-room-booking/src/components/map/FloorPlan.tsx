'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMapStore } from '@/store/mapStore'

interface RoomAvailability {
  roomId: string
  isBooked: boolean
}

interface FloorPlanProps {
  svgPath: string
  rooms: RoomAvailability[]
  onRoomClick?: (roomId: string) => void
}

export default function FloorPlan({ svgPath, rooms, onRoomClick }: FloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState<string>('')
  const router = useRouter()
  const { selectedRoomId, setSelectedRoomId } = useMapStore()

  useEffect(() => {
    fetch(svgPath)
      .then((res) => res.text())
      .then((content) => {
        setSvgContent(content)
      })
      .catch((err) => console.error('Error loading SVG:', err))
  }, [svgPath])

  useEffect(() => {
    if (!containerRef.current || !svgContent) return

    const container = containerRef.current
    const svgElement = container.querySelector('svg')
    if (!svgElement) return

    // Update room colors based on availability
    rooms.forEach(({ roomId, isBooked }) => {
      const roomElement = svgElement.querySelector(`[data-room-id="${roomId}"]`) as SVGElement | null
      if (roomElement) {
        if (selectedRoomId === roomId) {
          roomElement.setAttribute('fill', '#3B82F6') // Blue for selected
        } else if (isBooked) {
          roomElement.setAttribute('fill', '#EF4444') // Red for booked
        } else {
          roomElement.setAttribute('fill', '#D1D5DB') // Gray for available
        }

        // Add click handler
        roomElement.style.cursor = 'pointer'
        const handleClick = () => {
          setSelectedRoomId(roomId)
          if (onRoomClick) {
            onRoomClick(roomId)
          } else {
            router.push(`/room/${roomId}`)
          }
        }

        roomElement.removeEventListener('click', handleClick)
        roomElement.addEventListener('click', handleClick)
      }
    })

    return () => {
      rooms.forEach(({ roomId }) => {
        const roomElement = svgElement.querySelector(`[data-room-id="${roomId}"]`)
        if (roomElement) {
          roomElement.replaceWith(roomElement.cloneNode(true))
        }
      })
    }
  }, [svgContent, rooms, selectedRoomId, setSelectedRoomId, onRoomClick, router])

  return (
    <div className="bg-white rounded-lg shadow-md p-4 overflow-auto">
      <div
        ref={containerRef}
        className="min-h-[400px] flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  )
}
