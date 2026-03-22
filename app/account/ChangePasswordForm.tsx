'use client'

import { useActionState } from 'react'
import { changePassword } from './actions'

const initialState = { error: null, success: false }

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-white/30 focus:outline-none transition-colors'

const labelClass = 'text-[11px] text-white/30'

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState)

  if (state.success) {
    return (
      <p className="text-sm text-white/60">
        Your password has been updated.
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={labelClass}>
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className={labelClass}>
            Confirm new password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-white text-[#0e0e0e] px-5 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  )
}
