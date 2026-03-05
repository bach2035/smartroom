'use client'

import Header from '@/components/layout/Header'
import WelcomeModal from '@/components/onboarding/WelcomeModal'
import SupportChat from '@/components/support/SupportChat'
import { ToastProvider } from '@/components/ui/Toast'

export default function TradingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 overflow-auto">{children}</main>
        <WelcomeModal />
        <SupportChat />
      </div>
    </ToastProvider>
  )
}
