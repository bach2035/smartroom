import BookingTable from '@/components/admin/BookingTable'

export default function AdminBookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Bookings</h1>
      <BookingTable />
    </div>
  )
}
