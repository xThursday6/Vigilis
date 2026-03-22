'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { checkIn } from './actions'

export default function CheckInButton({ switchId }: { switchId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await checkIn(switchId)
          router.refresh()
        })
      }
      className="shrink-0 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 transition-colors"
    >
      {isPending ? 'Checking in…' : 'Check in'}
    </button>
  )
}
