import CourseManagement from '@/components/admin/CourseManagement'

export default function TradingAdminCoursesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Course Catalog</h1>
      <CourseManagement />
    </div>
  )
}
