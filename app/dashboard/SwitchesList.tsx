'use client'

import { useState } from 'react'
import SwitchCard from './SwitchCard'

type Switch = {
  id: string
  name: string
  contact_email: string
  check_in_time: string
  grace_period_minutes: number
  is_active: boolean
  personal_message: string | null
}

type Props = {
  switches: Switch[]
  lastCheckin: Record<string, string>
}

export default function SwitchesList({ switches, lastCheckin }: Props) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(
    () => new Set(switches.map((sw) => sw.id))
  )

  function handleDeleted(id: string) {
    setVisibleIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const visible = switches.filter((sw) => visibleIds.has(sw.id))

  if (visible.length === 0) return null

  return (
    <ul className="flex flex-col gap-3">
      {visible.map((sw) => (
        <SwitchCard
          key={sw.id}
          sw={sw}
          lastCheckin={lastCheckin[sw.id] ?? null}
          onDeleted={handleDeleted}
        />
      ))}
    </ul>
  )
}
