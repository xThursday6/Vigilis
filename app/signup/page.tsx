'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/auth/actions'

const initialState = { error: null }

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-6">Create account</h1>

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
              className="rounded-md border border-[var(--foreground)]/20 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]/60"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-[var(--foreground)]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
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
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-[var(--foreground)]/60">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--foreground)] underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
