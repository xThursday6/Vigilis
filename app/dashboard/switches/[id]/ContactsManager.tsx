'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  addContact,
  deleteContact,
  setContactActive,
  updateContact,
} from './actions'

type Contact = {
  id: string
  name: string | null
  email: string
  phone: string | null
  position: number
  is_active: boolean
}

type Props = {
  switchId: string
  contacts: Contact[]
  plan: 'free' | 'pro'
  maxContacts: number
  smsEnabled: boolean
}

const inputClass =
  'w-full rounded-lg border border-[#deded6] bg-white px-3 py-2.5 text-sm text-[#1a1a17] placeholder:text-[#c0c0b4] focus:border-[#b0b0a4] focus:outline-none transition-colors disabled:bg-[#f7f7f2] disabled:text-[#b0b0a4]'

const labelClass = 'text-[11px] font-medium text-[#9e9e92]'

export default function ContactsManager({
  switchId,
  contacts,
  plan,
  maxContacts,
  smsEnabled,
}: Props) {
  const activeCount = contacts.filter((c) => c.is_active).length
  const canAddMore = activeCount < maxContacts

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-3">
        {contacts.map((c) => (
          <ContactRow
            key={c.id}
            contact={c}
            switchId={switchId}
            smsEnabled={smsEnabled}
            canReactivate={canAddMore}
          />
        ))}
      </ul>

      {canAddMore ? (
        <AddContactForm
          switchId={switchId}
          smsEnabled={smsEnabled}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-[#e0e0d8] bg-[#faf8f3] px-6 py-5 text-sm text-[#6b6b5e]">
          You&apos;ve reached your contact limit ({maxContacts}).{' '}
          {plan === 'free' && (
            <Link href="/account" className="text-[#1a1a17] underline underline-offset-2">
              Upgrade to Pro
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ── Individual contact row ───────────────────────────────────────────────────

function ContactRow({
  contact,
  switchId,
  smsEnabled,
  canReactivate,
}: {
  contact: Contact
  switchId: string
  smsEnabled: boolean
  canReactivate: boolean
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('contact_id', contact.id)
    fd.set('switch_id', switchId)
    startTransition(async () => {
      const result = await updateContact(fd)
      if (result.error) setError(result.error)
      else {
        setMode('view')
        router.refresh()
      }
    })
  }

  async function handleToggle() {
    setError(null)
    startTransition(async () => {
      const result = await setContactActive(contact.id, switchId, !contact.is_active)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  async function handleDelete() {
    if (!confirm('Remove this contact? They will no longer receive alerts.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteContact(contact.id, switchId)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <li className="rounded-2xl border border-[#e6e6df] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-5 py-4">
      {mode === 'view' ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[#1a1a17] truncate">
                {contact.name || contact.email}
              </p>
              {!contact.is_active && (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-[#f4f4f0] text-[#9e9e92]">
                  Inactive
                </span>
              )}
            </div>
            {contact.name && (
              <p className="text-xs text-[#9e9e92] truncate">{contact.email}</p>
            )}
            {contact.phone && (
              <p className="text-xs text-[#9e9e92] mt-0.5">SMS: {contact.phone}</p>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setMode('edit')}
              className="text-xs text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleToggle}
              disabled={isPending || (!contact.is_active && !canReactivate)}
              title={
                !contact.is_active && !canReactivate
                  ? 'Contact limit reached'
                  : undefined
              }
              className="text-xs text-[#9e9e92] hover:text-[#1a1a17] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {contact.is_active ? 'Deactivate' : 'Reactivate'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-red-400/60 hover:text-red-500 transition-colors disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Name (optional)</label>
              <input
                name="name"
                type="text"
                defaultValue={contact.name ?? ''}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Email</label>
              <input
                name="email"
                type="email"
                required
                defaultValue={contact.email}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={labelClass}>
                Phone (SMS backup){' '}
                {smsEnabled ? (
                  <span className="text-[#c0c0b4] font-normal">e.g. +14155550123</span>
                ) : (
                  <span className="text-[#c0c0b4] font-normal">Pro only</span>
                )}
              </label>
              <input
                name="phone"
                type="tel"
                placeholder={smsEnabled ? '+14155550123' : 'Upgrade to Pro for SMS alerts'}
                defaultValue={contact.phone ?? ''}
                disabled={!smsEnabled}
                className={inputClass}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isPending}
              className="text-sm font-medium text-[#1a1a17] hover:text-[#2e2e2a] disabled:opacity-40 transition-colors"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('view'); setError(null) }}
              disabled={isPending}
              className="text-sm text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {mode === 'view' && error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </li>
  )
}

// ── Add contact form ─────────────────────────────────────────────────────────

function AddContactForm({
  switchId,
  smsEnabled,
}: {
  switchId: string
  smsEnabled: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('switch_id', switchId)
    startTransition(async () => {
      const result = await addContact(fd)
      if (result.error) setError(result.error)
      else {
        form.reset()
        router.refresh()
      }
    })
  }

  return (
    <form
      onSubmit={handleAdd}
      className="rounded-2xl border border-[#e6e6df] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-5 py-5 flex flex-col gap-4"
    >
      <p className="text-[11px] font-semibold tracking-widest uppercase text-[#b0b0a4]">
        Add contact
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Name (optional)</label>
          <input name="name" type="text" placeholder="e.g. Sarah" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="contact@example.com"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass}>
            Phone (SMS backup){' '}
            {smsEnabled ? (
              <span className="text-[#c0c0b4] font-normal">optional, e.g. +14155550123</span>
            ) : (
              <span className="text-[#c0c0b4] font-normal">Pro only</span>
            )}
          </label>
          <input
            name="phone"
            type="tel"
            placeholder={smsEnabled ? '+14155550123' : 'Upgrade to Pro for SMS alerts'}
            disabled={!smsEnabled}
            className={inputClass}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#1a1a17] text-[#f5f5f0] px-5 py-2.5 text-sm font-medium hover:bg-[#2e2e2a] disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Adding…' : 'Add contact'}
        </button>
      </div>
    </form>
  )
}
