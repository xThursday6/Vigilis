'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { PlanLimits } from '@/utils/subscription'
import { createSwitch } from './actions'

const initialState = { error: null }

const inputClass =
  'w-full rounded-lg border border-[#deded6] bg-white px-3 py-2.5 text-sm text-[#1a1a17] placeholder:text-[#c0c0b4] focus:border-[#b0b0a4] focus:outline-none transition-colors disabled:bg-[#f7f7f2] disabled:text-[#b0b0a4]'

const labelClass = 'text-xs font-medium text-[#6b6b5e]'

function formatGrace(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
}

type Props = {
  limits: PlanLimits
}

export default function CreateSwitchForm({ limits }: Props) {
  const [state, formAction, isPending] = useActionState(createSwitch, initialState)

  return (
    <div className="rounded-2xl border border-[#e6e6df] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-6 py-7">
      <form action={formAction} className="flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className={labelClass}>
              Your name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Alex Johnson"
              className={inputClass}
            />
            <p className="text-[11px] text-[#b0b0a4]">
              This is the name your contact will see in any alert they receive.
            </p>
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
            <p className="text-[11px] text-[#b0b0a4]">
              You can add more contacts after creating the switch.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="contact_name" className={labelClass}>
              Contact&apos;s name{' '}
              <span className="text-[#c0c0b4] font-normal">(optional)</span>
            </label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              placeholder="e.g. Sarah"
              className={inputClass}
            />
            <p className="text-[11px] text-[#b0b0a4]">
              Used to personalise the alert email they receive.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="interval_hours" className={labelClass}>
              Check-in interval
            </label>
            <select
              id="interval_hours"
              name="interval_hours"
              defaultValue={24}
              className={inputClass}
            >
              <option value={24}>Every 24 hours</option>
              <option value={48}>Every 48 hours</option>
              <option value={72}>Every 72 hours</option>
            </select>
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

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="grace_period_minutes" className={labelClass}>
              Grace period (minutes){' '}
              {!limits.graceConfigurable && (
                <span className="text-[#c0c0b4] font-normal">
                  fixed at {formatGrace(limits.gracePeriodDefaultMinutes)} on Free
                </span>
              )}
              {limits.graceConfigurable && (
                <span className="text-[#c0c0b4] font-normal">
                  {limits.gracePeriodMinMinutes}–{limits.gracePeriodMaxMinutes} minutes
                </span>
              )}
            </label>
            <input
              id="grace_period_minutes"
              name="grace_period_minutes"
              type="number"
              required
              min={limits.gracePeriodMinMinutes}
              max={limits.gracePeriodMaxMinutes}
              step={5}
              disabled={!limits.graceConfigurable}
              defaultValue={limits.gracePeriodDefaultMinutes}
              className={inputClass}
            />
            {!limits.graceConfigurable && (
              <p className="text-[11px] text-[#b0b0a4]">
                <Link
                  href="/account"
                  className="underline underline-offset-2 hover:text-[#1a1a17]"
                >
                  Upgrade to Pro
                </Link>{' '}
                for a configurable grace period (30 min – 12h).
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="personal_message" className={labelClass}>
            Personal message{' '}
            <span className="text-[#c0c0b4] font-normal">(optional)</span>
          </label>
          <textarea
            id="personal_message"
            name="personal_message"
            rows={3}
            placeholder="Leave a message for your contact…"
            className="w-full rounded-lg border border-[#deded6] bg-white px-3 py-2.5 text-sm text-[#1a1a17] placeholder:text-[#c0c0b4] focus:border-[#b0b0a4] focus:outline-none transition-colors resize-none"
          />
          <ul className="flex flex-col gap-1 mt-0.5">
            {[
              "If you don't hear from me, please try calling.",
              "I'm traveling alone — if this arrives, please check on me.",
              'Nothing dramatic, just give me a call if you get this.',
              "I'm okay most days. If this reached you, today might be different.",
            ].map((hint) => (
              <li key={hint} className="text-[11px] text-[#c0c0b4] leading-relaxed">
                &ldquo;{hint}&rdquo;
              </li>
            ))}
          </ul>
        </div>

        {state.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-[#1a1a17] text-[#f5f5f0] px-5 py-2.5 text-sm font-medium hover:bg-[#2e2e2a] disabled:opacity-40 transition-colors"
          >
            {isPending ? 'Creating…' : 'Create switch'}
          </button>
        </div>
      </form>
    </div>
  )
}
