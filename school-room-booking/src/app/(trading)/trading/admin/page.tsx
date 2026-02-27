import TradingDashboard from '@/components/admin/TradingDashboard'

export default function TradingAdminPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Trading Overview</h1>
      <TradingDashboard />
    </div>
  )
}
