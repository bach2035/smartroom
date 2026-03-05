'use client'

import Header from '@/components/layout/Header'
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
        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
    </ToastProvider>
  )
}
