'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/app/auth/actions'

const initialState = { error: null, sent: false }

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPassword, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Reset your password
        </h1>

        {state.sent ? (
          <>
            <p className="text-sm text-[var(--foreground)]/60 mb-6">
              If that address is in our system, you'll receive a reset link
              shortly. Check your inbox.
            </p>
            <Link
              href="/login"
              className="text-sm text-[var(--foreground)] underline underline-offset-2"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--foreground)]/60 mb-6">
              Enter your email and we'll send you a link to choose a new password.
            </p>

            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm text-[var(--foreground)]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  className="rounded-md border border-[var(--foreground)]/20 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]/60"
                />
              </div>

              {state.error && (
                <p className="text-sm text-red-500">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-50"
              >
                {pending ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-4 text-sm text-[var(--foreground)]/60">
              Remember it?{' '}
              <Link
                href="/login"
                className="text-[var(--foreground)] underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
