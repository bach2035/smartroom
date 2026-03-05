'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Step, CallBackProps } from 'react-joyride'
import { STATUS, ACTIONS, EVENTS } from 'react-joyride'

const JoyRide = dynamic(() => import('react-joyride'), { ssr: false })

const PHASE_KEY = 'smart-school-tour-phase'

const bookingSteps: Step[] = [
  {
    target: '[data-tour="product-switcher"]',
    content: 'This is your product switcher. You can switch between Room Booking and Course Trading anytime.',
    title: 'Welcome to Smart School!',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-book"]',
    content: 'Click here to browse the interactive floor map and find available rooms to book.',
    title: 'Browse Rooms',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-my-bookings"]',
    content: 'Track all your booking requests here — see which are pending, approved, or rejected.',
    title: 'My Bookings',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-my-reports"]',
    content: 'Report room issues like broken equipment or cleanliness problems here.',
    title: 'My Reports',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    content: 'You\'ll receive notifications here when your bookings are approved, trades are proposed, and more.',
    title: 'Notifications',
    disableBeacon: true,
    placement: 'bottom-end',
  },
  {
    target: '[data-tour="product-switcher"]',
    content: 'Now let\'s explore Course Trading! Click this switcher and select "Course Trading" to continue the tour.',
    title: 'Next: Course Trading',
    disableBeacon: true,
    placement: 'bottom',
    spotlightClicks: true,
  },
]

const tradingSteps: Step[] = [
  {
    target: '[data-tour="nav-browse"]',
    content: 'Browse all available course trade listings from other students. You\'ll also see suggested matches here.',
    title: 'Browse Listings',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-my-listings"]',
    content: 'Create and manage your own trade listings — list the courses you have and want.',
    title: 'My Listings',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-my-matches"]',
    content: 'Once you propose or receive a trade, it appears here. Chat with your match and complete the swap.',
    title: 'My Matches',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    content: 'Stay updated with trade proposals, new messages, and booking approvals — all in one place. You\'re all set!',
    title: 'Notifications',
    disableBeacon: true,
    placement: 'bottom-end',
  },
]

const joyrideStyles = {
  options: {
    primaryColor: '#b11a1e',
    zIndex: 10000,
    arrowColor: '#fff',
    backgroundColor: '#fff',
    textColor: '#1e293b',
  },
  tooltip: {
    borderRadius: '12px',
    padding: '20px',
    fontSize: '14px',
  },
  tooltipTitle: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  tooltipContent: {
    padding: '8px 0 0',
    lineHeight: '1.6',
  },
  buttonNext: {
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
  },
  buttonBack: {
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748b',
  },
  buttonSkip: {
    color: '#94a3b8',
    fontSize: '13px',
  },
  spotlight: {
    borderRadius: '12px',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
}

function markOnboardingComplete() {
  fetch('/api/users/onboarding', { method: 'PATCH' })
  sessionStorage.removeItem(PHASE_KEY)
}

export default function WelcomeModal() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [run, setRun] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const [phase, setPhase] = useState<'pending' | 'booking' | 'trading' | 'done'>('done')
  const [needsTour, setNeedsTour] = useState(false)

  const isTrading = pathname.startsWith('/trading')

  // Check onboarding status from API (once per session)
  useEffect(() => {
    if (!session || session.user.role === 'ADMIN') return

    async function check() {
      try {
        const res = await fetch('/api/users/onboarding')
        if (!res.ok) return
        const data = await res.json()
        if (!data.onboardingCompleted) {
          setNeedsTour(true)
          setPhase('pending')
        }
      } catch {
        // Fail silently
      }
    }
    check()
  }, [session])

  // Start booking tour on booking pages
  useEffect(() => {
    if (!needsTour || phase !== 'pending') return
    if (isTrading) return

    const timer = setTimeout(() => {
      setPhase('booking')
      setSteps(bookingSteps)
      setRun(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [needsTour, phase, isTrading])

  // Start trading tour when arriving at trading page after booking phase
  useEffect(() => {
    if (!needsTour) return
    if (!isTrading) return

    const bookingPhaseDone = sessionStorage.getItem(PHASE_KEY) === 'booking-done'
    if (bookingPhaseDone) {
      const timer = setTimeout(() => {
        setPhase('trading')
        setSteps(tradingSteps)
        setRun(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [needsTour, isTrading])

  const handleCallback = useCallback((data: CallBackProps) => {
    if (data.status === STATUS.SKIPPED) {
      markOnboardingComplete()
      setRun(false)
      setPhase('done')
      return
    }

    if (data.status === STATUS.FINISHED) {
      if (phase === 'booking') {
        sessionStorage.setItem(PHASE_KEY, 'booking-done')
        setRun(false)
        router.push('/trading')
      } else if (phase === 'trading') {
        markOnboardingComplete()
        setRun(false)
        setPhase('done')
      }
      return
    }

    // Last booking step — redirect to trading
    if (phase === 'booking' && data.action === ACTIONS.NEXT && data.type === EVENTS.STEP_AFTER && data.index === bookingSteps.length - 1) {
      sessionStorage.setItem(PHASE_KEY, 'booking-done')
      setRun(false)
      router.push('/trading')
    }
  }, [phase, router])

  if (!run || steps.length === 0) return null

  return (
    <JoyRide
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      disableOverlayClose
      spotlightClicks
      styles={joyrideStyles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Got it!',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  )
}
