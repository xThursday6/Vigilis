'use client'

import type { PlanLimits } from '@/utils/subscription'
import SwitchCard from './SwitchCard'

type Switch = {
  id: string
  name: string
  check_in_time: string
  grace_period_minutes: number
  interval_hours: number
  is_active: boolean
  personal_message: string | null
}

export type ContactSummary = {
  activeCount: number
  primary: { email: string; name: string | null } | null
}

type Props = {
  switches: Switch[]
  lastCheckin: Record<string, string>
  contactsBySwitchId: Record<string, ContactSummary>
  plan: 'free' | 'pro'
  limits: PlanLimits
}

export default function SwitchesList({
  switches,
  lastCheckin,
  contactsBySwitchId,
  plan,
  limits,
}: Props) {
  return (
    <ul className="flex flex-col gap-3">
      {switches.map((sw) => (
        <SwitchCard
          key={sw.id}
          sw={sw}
          lastCheckin={lastCheckin[sw.id] ?? null}
          contactSummary={contactsBySwitchId[sw.id] ?? { activeCount: 0, primary: null }}
          plan={plan}
          limits={limits}
        />
      ))}
    </ul>
  )
}
