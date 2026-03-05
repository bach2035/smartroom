import Header from '@/components/layout/Header'
import WelcomeModal from '@/components/onboarding/WelcomeModal'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
      <WelcomeModal />
    </div>
  )
}
