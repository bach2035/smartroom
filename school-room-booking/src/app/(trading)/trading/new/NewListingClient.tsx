'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ListingForm from '@/components/trading/ListingForm'

export default function NewListingClient() {
  const router = useRouter()

  async function handleSubmit(data: { notes: string; haveCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[]; wantCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[]; listingType?: string }) {
    const res = await fetch('/api/trading/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: data.notes,
        listingType: data.listingType || 'TRADE',
        haveCourses: data.haveCourses.map((c) => ({
          ...c,
          credits: c.credits ? parseInt(c.credits) : null,
        })),
        wantCourses: data.wantCourses.map((c) => ({
          ...c,
          credits: c.credits ? parseInt(c.credits) : null,
        })),
      }),
    })

    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Failed to create listing')
    }

    const d = await res.json()
    router.push(`/trading/${d.listingId}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/trading" className="text-sm text-slate-500 hover:text-slate-700">
          &larr; Back to Trading
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Create New Listing</h1>
        <p className="text-sm text-slate-500">
          List the courses you have and want to trade.
        </p>
      </div>
      <div className="card p-6">
        <ListingForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
