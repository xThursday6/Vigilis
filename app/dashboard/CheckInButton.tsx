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
      className="rounded-md border border-green-500/40 px-3 py-1 text-xs text-green-500 hover:bg-green-500/10 disabled:opacity-40"
    >
      {isPending ? 'Checking in...' : 'Check in'}
    </button>
  )
}
