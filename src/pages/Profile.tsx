import { useEffect, useState } from 'react'
import { Loader2, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { wipeLocalUserState } from '@/lib/storage'
import { Button } from '@/components/ui/button'

/** Profile: account section with the sign-out action (wipes local state). */
export default function Profile() {
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    document.title = 'SwellFit — Profile'
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      // Wipe this browser's SwellFit state BEFORE clearing the session, so the
      // next user of this device never inherits the previous one's streak,
      // rep logs or coach state.
      wipeLocalUserState()
      await signOut()
      // Wiping state already unmounted the app routes (session gate redirects
      // to /auth) — no navigation needed beyond what the gate renders.
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-xl font-bold tracking-tight">Profile</h1>

      <section
        aria-labelledby="account-heading"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h2
          id="account-heading"
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Account
        </h2>
        <p className="mt-2 truncate text-sm">{user?.email ?? 'Signed in'}</p>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <LogOut aria-hidden="true" />
          )}
          Sign out
        </Button>
      </section>

      <p className="text-sm text-muted-foreground">
        Surfer Profile &amp; Settings — coming in a later stage.
      </p>
    </div>
  )
}
