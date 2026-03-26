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
      <p className="text-sm font-medium text-[#1a1a17] mb-1">Delete account</p>
      <p className="text-xs text-[#9e9e92] mb-5">
        Permanently removes your account and all switches and check-in history.
        This cannot be undone.
      </p>

      {!confirmed ? (
        <button
          onClick={() => setConfirmed(true)}
          className="text-sm text-red-400 hover:text-red-500 transition-colors"
        >
          Delete my account
        </button>
      ) : (
        <div>
          <p className="text-sm text-[#6b6b5e] mb-4">
            Are you sure? This will immediately and permanently delete everything.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-sm text-red-500 hover:text-red-600 disabled:opacity-40 transition-colors"
            >
              {isPending ? 'Deleting…' : 'Yes, delete everything'}
            </button>
            <button
              onClick={() => { setConfirmed(false); setError(null) }}
              disabled={isPending}
              className="text-sm text-[#9e9e92] hover:text-[#1a1a17] disabled:opacity-40 transition-colors"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>
      )}
    </div>
  )
}
