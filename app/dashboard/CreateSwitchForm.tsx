'use client'

import { useActionState } from 'react'
import { createSwitch } from './actions'

const initialState = { error: null }

export default function CreateSwitchForm() {
  const [state, formAction, isPending] = useActionState(createSwitch, initialState)

  return (
    <div className="rounded-lg border border-[var(--foreground)]/10 p-6 mb-6">
      <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">Create a switch</h2>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-[var(--foreground)]/60">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="My switch"
            className="rounded-md border border-[var(--foreground)]/20 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)]/60 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="contact_email" className="text-sm text-[var(--foreground)]/60">
            Contact email
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            required
            placeholder="contact@example.com"
            className="rounded-md border border-[var(--foreground)]/20 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)]/60 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="check_in_time" className="text-sm text-[var(--foreground)]/60">
            Check-in time
          </label>
          <input
            id="check_in_time"
            name="check_in_time"
            type="time"
            required
            className="rounded-md border border-[var(--foreground)]/20 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--foreground)]/60 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="grace_period_minutes" className="text-sm text-[var(--foreground)]/60">
            Grace period (minutes)
          </label>
          <input
            id="grace_period_minutes"
            name="grace_period_minutes"
            type="number"
            required
            min="1"
            defaultValue={60}
            className="rounded-md border border-[var(--foreground)]/20 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--foreground)]/60 focus:outline-none"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[var(--foreground)] px-4 py-2 text-sm text-[var(--background)] hover:opacity-80 disabled:opacity-40"
        >
          {isPending ? 'Creating...' : 'Create switch'}
        </button>
      </form>
    </div>
  )
}
