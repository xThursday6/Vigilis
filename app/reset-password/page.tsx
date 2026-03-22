'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

// Inner component — reads the code param and handles the full flow
function ResetPasswordForm() {
  const searchParams = useSearchParams()

  // 'verifying' → exchanging the code | 'ready' → show form | 'done' | 'error'
  const [stage, setStage] = useState<'verifying' | 'ready' | 'done' | 'error'>('verifying')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('Invalid or expired reset link. Please request a new one.')
      setStage('error')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError('This link has expired or has already been used. Please request a new one.')
        setStage('error')
      } else {
        setStage('ready')
      }
    })
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value

    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setPending(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setPending(false)
    } else {
      setStage('done')
    }
  }

  if (stage === 'verifying') {
    return (
      <p className="text-sm text-[var(--foreground)]/50">Verifying your link…</p>
    )
  }

  if (stage === 'done') {
    return (
      <>
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Password updated
        </h1>
        <p className="text-sm text-[var(--foreground)]/60 mb-6">
          Your password has been changed. You can sign in with it now.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)]"
        >
          Sign in
        </Link>
      </>
    )
  }

  if (stage === 'error') {
    return (
      <>
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Link unavailable
        </h1>
        <p className="text-sm text-[var(--foreground)]/60 mb-6">{error}</p>
        <Link
          href="/forgot-password"
          className="text-sm text-[var(--foreground)] underline underline-offset-2"
        >
          Request a new link
        </Link>
      </>
    )
  }

  // stage === 'ready'
  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
        Choose a new password
      </h1>
      <p className="text-sm text-[var(--foreground)]/60 mb-6">
        Pick something strong. You won't need to remember the old one.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-[var(--foreground)]">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            autoFocus
            className="rounded-md border border-[var(--foreground)]/20 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]/60"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirm" className="text-sm text-[var(--foreground)]">
            Confirm new password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-md border border-[var(--foreground)]/20 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]/60"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-50"
        >
          {pending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <p className="text-sm text-[var(--foreground)]/50">Loading…</p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
