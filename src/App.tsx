import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Coach from './pages/Coach'
import Explore from './pages/Explore'
import Profile from './pages/Profile'
import Auth from './pages/Auth'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

/**
 * Route guards (login is MANDATORY — there is no anonymous mode).
 * Two separate <Routes> trees so /auth always resolves to a real screen:
 *  - no session → /auth renders the Auth page and every other path falls back
 *    to /auth (a bare <Navigate> outside any <Routes> renders nothing, which
 *    is the black screen);
 *  - session → the app routes, with /auth redirecting back to /.
 * While the persisted session is being restored, a neutral loading shell keeps
 * the gate from flashing the sign-in screen over the coach.
 */
function SessionGate() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-dvh flex-1 items-center justify-center bg-background text-muted-foreground"
      >
        Loading…
      </div>
    )
  }

  // No session: /auth must render the actual Auth page — a bare <Navigate>
  // outside <Routes> matches nothing and leaves a blank screen.
  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Coach />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/auth" element={<Navigate to="/" replace />} />
      {/* Player and CheckIn are fixed overlays driven by Coach state (Coach.tsx),
          not routes: they render full-screen above everything with their own
          props. Unknown paths fall through to NotFound. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SessionGate />
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
