import { useEffect, useRef } from 'react'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface SignUpConfirmationProps {
  email: string
  onBackToSignIn: () => void
}

/** Shown after a sign-up that needs email confirmation (no session returned). */
export function SignUpConfirmation({ email, onBackToSignIn }: SignUpConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Move focus to the message so screen readers announce the new state.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <Card>
      <CardHeader className="items-center space-y-3 text-center">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"
        >
          <MailCheck className="h-6 w-6" />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          Account created
        </h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-sm text-muted-foreground" role="status">
          Your account was created. We sent a confirmation email to{' '}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Open the link in that email to confirm your address. Don't see it? Check your spam or junk
          folder.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          After confirming, come back here and sign in with your email and password.
        </p>
        <Button type="button" className="w-full" onClick={onBackToSignIn}>
          Back to sign in
        </Button>
      </CardContent>
    </Card>
  )
}
