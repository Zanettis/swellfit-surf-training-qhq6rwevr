import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'

export default function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const lastPath = useRef(pathname)

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    window.scrollTo({ top: 0, behavior: 'instant' })
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="flex min-h-dvh justify-center bg-background text-foreground selection:bg-primary/30">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-muted focus:px-4 focus:py-2 focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      {/* Centered mobile-first shell: full width on phones, max-w-md on desktop */}
      <div className="relative flex min-h-dvh w-full max-w-md flex-col border-x border-border bg-background">
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex flex-1 flex-col focus:outline-none"
        >
          <Outlet />
        </main>

        <BottomTabBar />
      </div>
    </div>
  )
}
