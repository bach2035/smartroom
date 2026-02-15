import PendingTriage from '@/components/admin/PendingTriage'

export default function PendingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Requests</h1>
      <PendingTriage />
    </div>
  )
}
