'use client'

import SwitchCard from './SwitchCard'

type Switch = {
  id: string
  name: string
  contact_email: string
  contact_name: string | null
  check_in_time: string
  grace_period_minutes: number
  interval_hours: number
  is_active: boolean
  personal_message: string | null
}

type Props = {
  switches: Switch[]
  lastCheckin: Record<string, string>
}

export default function SwitchesList({ switches, lastCheckin }: Props) {
  return (
    <ul className="flex flex-col gap-3">
      {switches.map((sw) => (
        <SwitchCard
          key={sw.id}
          sw={sw}
          lastCheckin={lastCheckin[sw.id] ?? null}
        />
      ))}
    </ul>
  )
}
