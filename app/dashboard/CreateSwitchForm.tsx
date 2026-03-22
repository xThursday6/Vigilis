'use client'

import { useActionState } from 'react'
import { createSwitch } from './actions'

const initialState = { error: null }

const inputClass =
  'rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-white/30 focus:outline-none transition-colors'

const labelClass = 'text-xs text-white/40'

export default function CreateSwitchForm() {
  const [state, formAction, isPending] = useActionState(createSwitch, initialState)

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-6 py-6">
      <form action={formAction} className="flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Daily check-in"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact_email" className={labelClass}>
              Contact email
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              required
              placeholder="contact@example.com"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="check_in_time" className={labelClass}>
              Check-in time (UTC)
            </label>
            <input
              id="check_in_time"
              name="check_in_time"
              type="time"
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="grace_period_minutes" className={labelClass}>
              Grace period (minutes)
            </label>
            <input
              id="grace_period_minutes"
              name="grace_period_minutes"
              type="number"
              required
              min="1"
              defaultValue={60}
              className={inputClass}
            />
          </div>
        </div>

        {state.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-white text-[#0e0e0e] px-5 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-40 transition-colors"
          >
            {isPending ? 'Creating…' : 'Create switch'}
          </button>
        </div>
      </form>
    </div>
  )
}
