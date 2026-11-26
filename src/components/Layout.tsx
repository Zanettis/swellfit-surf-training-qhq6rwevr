import React, { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'

export default function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const lastPath = useRef(pathname)

  // Hide tab bar during onboarding, paywall and active guided workout
  const hideTabBar =
    pathname === '/' ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/paywall') ||
    pathname.startsWith('/workout')

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    window.scrollTo({ top: 0, behavior: 'instant' })
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="min-h-dvh bg-[#070C11] text-[#F8FAFC] flex justify-center selection:bg-[#00D1B2]/30 selection:text-[#F8FAFC]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#141C24] focus:text-[#00D1B2] focus:px-4 focus:py-2 focus:ring-2 focus:ring-[#00D1B2]"
      >
        Skip to main content
      </a>

      {/* Centered mobile-first app shell (max-w-md on desktop, full viewport on mobile) */}
      <div className="w-full max-w-md min-h-dvh flex flex-col bg-[#0B1117] border-x border-[#1E293B]/50 relative shadow-2xl">
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 flex flex-col focus:outline-none"
        >
          <Outlet />
        </main>

        {!hideTabBar && <BottomTabBar />}
      </div>
    </div>
  )
}
