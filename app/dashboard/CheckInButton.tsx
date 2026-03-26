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
      className="shrink-0 rounded-lg bg-[#f0faf4] border border-[#c6eed6] px-3.5 py-1.5 text-xs font-medium text-[#2d7a4f] hover:bg-[#e4f7ec] disabled:opacity-40 transition-colors"
    >
      {isPending ? 'Checking in…' : 'Check in'}
    </button>
  )
}
