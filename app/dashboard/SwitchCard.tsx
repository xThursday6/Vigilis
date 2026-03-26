'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CheckInButton from './CheckInButton'
import { deleteSwitch, updateSwitch, sendTestAlert } from './actions'

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
  sw: Switch
  lastCheckin: string | null
}

const inputClass =
  'w-full rounded-lg border border-[#deded6] bg-white px-3 py-2.5 text-sm text-[#1a1a17] placeholder:text-[#c0c0b4] focus:border-[#b0b0a4] focus:outline-none transition-colors'

const labelClass = 'text-[11px] font-medium text-[#9e9e92]'

export default function SwitchCard({ sw, lastCheckin }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'view' | 'edit' | 'delete-confirm'>('view')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testState, setTestState] = useState<'idle' | 'sent' | 'error'>('idle')
  const [testError, setTestError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteSwitch(sw.id)
    if (result.error) {
      setDeleteError(result.error)
      setDeleting(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleTest() {
    setTestState('idle')
    setTestError(null)
    const result = await sendTestAlert(sw.id)
    if (result.error) {
      setTestState('error')
      setTestError(result.error)
    } else {
      setTestState('sent')
      setTimeout(() => setTestState('idle'), 4000)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setEditError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('switch_id', sw.id)
    const result = await updateSwitch(formData)
    setSaving(false)
    if (result.error) {
      setEditError(result.error)
    } else {
      setMode('view')
      router.refresh()
    }
  }

  return (
    <li className="rounded-2xl border border-[#e6e6df] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-6 py-5">
      {/* Header row — always visible */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-base font-semibold text-[#1a1a17] truncate tracking-tight">
            {sw.name}
          </span>
          <span
            className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium ${
              sw.is_active
                ? 'bg-[#edfaf3] text-[#2d7a4f]'
                : 'bg-[#f4f4f0] text-[#9e9e92]'
            }`}
          >
            {sw.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <CheckInButton switchId={sw.id} />
      </div>

      {/* ── View mode ─────────────────────────────────────────────────── */}
      {mode === 'view' && (
        <>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mb-5">
            <div>
              <dt className="text-[11px] text-[#b0b0a4] mb-0.5">Contact</dt>
              <dd className="text-sm text-[#6b6b5e] truncate">{sw.contact_email}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#b0b0a4] mb-0.5">Interval</dt>
              <dd className="text-sm text-[#6b6b5e]">Every {sw.interval_hours}h</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#b0b0a4] mb-0.5">Check-in time</dt>
              <dd className="text-sm text-[#6b6b5e]">{sw.check_in_time} UTC</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#b0b0a4] mb-0.5">Grace period</dt>
              <dd className="text-sm text-[#6b6b5e]">{sw.grace_period_minutes} min</dd>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-[11px] text-[#b0b0a4] mb-0.5">Last check-in</dt>
              <dd className="text-sm text-[#6b6b5e]">
                {lastCheckin ? new Date(lastCheckin).toUTCString() : 'Never'}
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-5 border-t border-[#f0f0ea] pt-4">
            <button
              onClick={() => { setEditError(null); setMode('edit') }}
              className="text-xs text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleTest}
              className="text-xs text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
            >
              {testState === 'sent' ? 'Test sent ✓' : 'Test alert'}
            </button>
            {testState === 'error' && (
              <span className="text-xs text-red-500">{testError}</span>
            )}
            <button
              onClick={() => setMode('delete-confirm')}
              className="text-xs text-red-400/60 hover:text-red-500 transition-colors ml-auto"
            >
              Delete
            </button>
          </div>
        </>
      )}

      {/* ── Delete confirmation ────────────────────────────────────────── */}
      {mode === 'delete-confirm' && (
        <div className="border-t border-[#f0f0ea] pt-4">
          <p className="text-sm text-[#6b6b5e] mb-4">
            Are you sure? This will permanently delete this switch and all its
            check-in history. This cannot be undone.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-500 hover:text-red-600 disabled:opacity-40 transition-colors"
            >
              {deleting ? 'Deleting…' : 'Yes, delete it'}
            </button>
            <button
              onClick={() => { setMode('view'); setDeleteError(null) }}
              disabled={deleting}
              className="text-sm text-[#9e9e92] hover:text-[#1a1a17] disabled:opacity-40 transition-colors"
            >
              Cancel
            </button>
          </div>
          {deleteError && (
            <p className="text-sm text-red-500 mt-3">{deleteError}</p>
          )}
        </div>
      )}

      {/* ── Edit mode ─────────────────────────────────────────────────── */}
      {mode === 'edit' && (
        <form onSubmit={handleSave} className="border-t border-[#f0f0ea] pt-5">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Your name</label>
              <input
                name="name"
                type="text"
                required
                defaultValue={sw.name}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Contact email</label>
              <input
                name="contact_email"
                type="email"
                required
                defaultValue={sw.contact_email}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={labelClass}>
                Contact&apos;s name{' '}
                <span className="text-[#c0c0b4] font-normal">(optional)</span>
              </label>
              <input
                name="contact_name"
                type="text"
                placeholder="e.g. Sarah"
                defaultValue={sw.contact_name ?? ''}
                className={inputClass}
              />
              <p className="text-[11px] text-[#b0b0a4]">
                Used to personalise the alert email they receive.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Check-in interval</label>
              <select
                name="interval_hours"
                defaultValue={sw.interval_hours}
                className={inputClass}
              >
                <option value={24}>Every 24 hours</option>
                <option value={48}>Every 48 hours</option>
                <option value={72}>Every 72 hours</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Check-in time (UTC)</label>
              <input
                name="check_in_time"
                type="time"
                required
                defaultValue={sw.check_in_time}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Grace period (minutes)</label>
              <input
                name="grace_period_minutes"
                type="number"
                required
                min="1"
                defaultValue={sw.grace_period_minutes}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-5">
            <label className={labelClass}>
              Personal message{' '}
              <span className="text-[#c0c0b4] font-normal">(optional)</span>
            </label>
            <textarea
              name="personal_message"
              rows={3}
              defaultValue={sw.personal_message ?? ''}
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

          {editError && <p className="text-sm text-red-500 mb-3">{editError}</p>}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="text-sm font-medium text-[#1a1a17] hover:text-[#2e2e2a] disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('view'); setEditError(null) }}
              disabled={saving}
              className="text-sm text-[#9e9e92] hover:text-[#1a1a17] disabled:opacity-40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  )
}
