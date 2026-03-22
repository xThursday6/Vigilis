'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from './actions'

export default function DeleteAccountSection() {
  const [confirmed, setConfirmed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount()
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <p className="text-sm text-white/50 mb-1">Delete account</p>
      <p className="text-xs text-white/30 mb-5">
        Permanently removes your account and all switches and check-in history.
        This cannot be undone.
      </p>

      {!confirmed ? (
        <button
          onClick={() => setConfirmed(true)}
          className="text-sm text-red-500/60 hover:text-red-400 transition-colors"
        >
          Delete my account
        </button>
      ) : (
        <div>
          <p className="text-sm text-white/60 mb-4">
            Are you sure? This will immediately and permanently delete everything.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
            >
              {isPending ? 'Deleting…' : 'Yes, delete everything'}
            </button>
            <button
              onClick={() => { setConfirmed(false); setError(null) }}
              disabled={isPending}
              className="text-sm text-white/40 hover:text-white/70 disabled:opacity-40 transition-colors"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </div>
      )}
    </div>
  )
}
