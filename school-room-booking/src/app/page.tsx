import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-700">School Tools</h1>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Smart School Platform
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Tools to help students manage rooms and course schedules — all in one place.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Smart Room Booking */}
          <Link href="/map" className="group">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-transparent hover:border-red-200">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Room Booking</h3>
              <p className="text-gray-600 mb-4">
                Browse interactive maps, view room availability in real time, and submit booking requests easily.
              </p>
              <span className="inline-flex items-center text-red-700 font-medium group-hover:gap-2 transition-all">
                Browse Rooms
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>

          {/* Smart Course Trading */}
          <Link href="/trading" className="group">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-transparent hover:border-blue-200">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Course Trading</h3>
              <p className="text-gray-600 mb-4">
                Post courses you have and want, get matched with other students, and swap course sections.
              </p>
              <span className="inline-flex items-center text-blue-700 font-medium group-hover:gap-2 transition-all">
                Start Trading
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      </main>

      <footer className="bg-gray-50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">
          <p>Smart School Platform</p>
        </div>
      </footer>
    </div>
  )
}
