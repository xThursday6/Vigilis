'use client'

import { useActionState } from 'react'
import { changePassword } from './actions'

const initialState = { error: null, success: false }

const inputClass =
  'w-full rounded-lg border border-[#deded6] bg-white px-3 py-2.5 text-sm text-[#1a1a17] placeholder:text-[#c0c0b4] focus:border-[#b0b0a4] focus:outline-none transition-colors'

const labelClass = 'text-xs font-medium text-[#6b6b5e]'

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState)

  if (state.success) {
    return (
      <p className="text-sm text-[#6b6b5e]">Your password has been updated.</p>
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

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#1a1a17] text-[#f5f5f0] px-5 py-2.5 text-sm font-medium hover:bg-[#2e2e2a] disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  )
}
