import PendingTriage from '@/components/admin/PendingTriage'

export default function PendingPage() {
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 shrink-0">Pending Requests</h1>
      <div className="flex-1 min-h-0">
        <PendingTriage />
      </div>
    </div>
  )
}
