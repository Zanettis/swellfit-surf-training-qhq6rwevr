import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Waves } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { claimAnonymousHistory } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SignUpConfirmation } from '@/components/auth/SignUpConfirmation'

const authSchema = z.object({
  email: z.string().email('Enter a valid email, like name@example.com'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type AuthFormValues = z.infer<typeof authSchema>

/** The /auth gate: email + password sign in, with a tab to create an account. */
export default function Auth() {
  const navigate = useNavigate()
  const { user, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [serverError, setServerError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  // Set after a sign-up that needs email confirmation: shows the "check your inbox" state.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })
  const { isSubmitting } = form.formState

  // Already signed in (e.g. a restored session): the gate has nothing to show.
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  // The auth screen is a full-height takeover: clear the page title for it.
  useEffect(() => {
    document.title = mode === 'signin' ? 'SwellFit — Sign in' : 'SwellFit — Create account'
  }, [mode])

  async function onSubmit(values: AuthFormValues) {
    setServerError(null)
    if (mode === 'signup') {
      const { error, needsConfirmation } = await signUp(values.email, values.password)
      if (error) {
        setServerError(error)
        return
      }
      if (needsConfirmation) {
        // Confirmation is on: no session yet, so stay on this screen and wait for the email link.
        form.resetField('password')
        setPendingEmail(values.email)
        return
      }
      // Confirmation is off: the sign-up carries a session right away — claim the anonymous device's history.
      const claimed = await claimAnonymousHistory()
      if (claimed) {
        // Reload the coach state so the migrated sessions show immediately.
        window.location.replace('/')
        return
      }
      navigate('/', { replace: true })
      return
    }

    const { error } = await signIn(values.email, values.password)
    if (error) {
      setServerError(error)
      return
    }
    await claimAnonymousHistory()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col justify-center gap-8 px-5 pb-10 pt-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary"
        >
          <Waves className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">SwellFit</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your surf training coach — sign in to keep your sessions, streak and progress in sync.
        </p>
      </div>

      {pendingEmail ? (
        <SignUpConfirmation
          email={pendingEmail}
          onBackToSignIn={() => {
            setPendingEmail(null)
            setMode('signin')
            setServerError(null)
          }}
        />
      ) : (
        <Card>
          <CardHeader className="space-y-1">
            <div
              className="flex flex-col gap-1"
              role="tablist"
              aria-label="Sign in or create account"
            >
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={mode === 'signin' ? 'secondary' : 'ghost'}
                  role="tab"
                  aria-selected={mode === 'signin'}
                  onClick={() => {
                    setMode('signin')
                    setServerError(null)
                  }}
                >
                  Sign in
                </Button>
                <Button
                  type="button"
                  variant={mode === 'signup' ? 'secondary' : 'ghost'}
                  role="tab"
                  aria-selected={mode === 'signup'}
                  onClick={() => {
                    setMode('signup')
                    setServerError(null)
                  }}
                >
                  Create account
                </Button>
              </div>
            </div>
            <CardTitle className="sr-only">
              {mode === 'signin' ? 'Sign in to SwellFit' : 'Create your SwellFit account'}
            </CardTitle>
            <CardDescription>
              {mode === 'signin'
                ? 'Welcome back — enter your email and password.'
                : 'Create an account — your existing sessions on this device come with you.'}
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form
              noValidate
              onSubmit={(e) => (isSubmitting ? e.preventDefault() : form.handleSubmit(onSubmit)(e))}
            >
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="username"
                          spellCheck={false}
                          enterKeyHint="next"
                          required
                          aria-invalid={!!form.formState.errors.email}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={visible ? 'text' : 'password'}
                            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                            enterKeyHint="done"
                            required
                            className="pr-10"
                            aria-invalid={!!form.formState.errors.password}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          aria-label={visible ? 'Hide password' : 'Show password'}
                          aria-pressed={visible}
                          onClick={() => setVisible((v) => !v)}
                        >
                          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {serverError && (
                  <p
                    className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {serverError}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" aria-disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {isSubmitting
                    ? mode === 'signin'
                      ? 'Signing in…'
                      : 'Creating account…'
                    : mode === 'signin'
                      ? 'Sign in'
                      : 'Create account'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {mode === 'signin'
                    ? "New here? Switch to 'Create account' above."
                    : 'Already have an account? Switch to Sign in above.'}
                </p>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}
    </div>
  )
}
