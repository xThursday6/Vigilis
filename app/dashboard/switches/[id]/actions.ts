'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getLimits } from '@/utils/subscription'

type Result = { error: string | null }

// E.164-ish check: +<1-15 digits>. Not exhaustive, just a sanity guard before
// Twilio sees it. Twilio does the final validation when sending.
const PHONE_RE = /^\+[1-9]\d{1,14}$/

async function ownsSwitch(switchId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('switches')
    .select('id')
    .eq('id', switchId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

// ── Add contact ──────────────────────────────────────────────────────────────

export async function addContact(formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const switchId = formData.get('switch_id') as string
  if (!switchId || !(await ownsSwitch(switchId, user.id))) {
    return { error: 'Switch not found.' }
  }

  const email = ((formData.get('email') as string) ?? '').trim()
  const name = ((formData.get('name') as string) ?? '').trim()
  const phone = ((formData.get('phone') as string) ?? '').trim()

  if (!email) return { error: 'Email is required.' }

  const limits = await getLimits(user.id)

  if (phone && !limits.smsEnabled) {
    return { error: 'SMS alerts are a Pro feature. Upgrade to add a phone number.' }
  }
  if (phone && !PHONE_RE.test(phone)) {
    return { error: 'Phone number must be in international format, e.g. +14155550123.' }
  }

  // Enforce per-switch contact cap.
  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('switch_id', switchId)
    .eq('is_active', true)

  if (count !== null && count >= limits.maxContactsPerSwitch) {
    return {
      error: `You've reached your contact limit (${limits.maxContactsPerSwitch}). ${
        limits.maxContactsPerSwitch < 5 ? 'Upgrade to Pro for up to 5 contacts.' : ''
      }`.trim(),
    }
  }

  // Next position = max(position)+1 (works with deactivated rows too).
  const { data: maxRow } = await supabase
    .from('contacts')
    .select('position')
    .eq('switch_id', switchId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPosition = (maxRow?.position ?? -1) + 1

  const { error } = await supabase.from('contacts').insert({
    switch_id: switchId,
    user_id: user.id,
    email,
    name: name || null,
    phone: phone || null,
    position: nextPosition,
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/switches/${switchId}`)
  return { error: null }
}

// ── Update contact ────────────────────────────────────────────────────────────

export async function updateContact(formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const contactId = formData.get('contact_id') as string
  const switchId = formData.get('switch_id') as string
  if (!contactId || !switchId) return { error: 'Missing identifiers.' }

  // Explicit ownership check — don't rely solely on the .eq('user_id') filter
  // below to silently no-op if the switch belongs to someone else.
  if (!(await ownsSwitch(switchId, user.id))) {
    return { error: 'Switch not found.' }
  }

  const email = ((formData.get('email') as string) ?? '').trim()
  const name = ((formData.get('name') as string) ?? '').trim()
  const phone = ((formData.get('phone') as string) ?? '').trim()

  if (!email) return { error: 'Email is required.' }

  const limits = await getLimits(user.id)

  if (phone && !limits.smsEnabled) {
    return { error: 'SMS alerts are a Pro feature. Upgrade to add a phone number.' }
  }
  if (phone && !PHONE_RE.test(phone)) {
    return { error: 'Phone number must be in international format, e.g. +14155550123.' }
  }

  const { error } = await supabase
    .from('contacts')
    .update({
      email,
      name: name || null,
      phone: phone || null,
    })
    .eq('id', contactId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/switches/${switchId}`)
  return { error: null }
}

// ── Toggle active (used when downgrading to stay under cap) ──────────────────

export async function setContactActive(
  contactId: string,
  switchId: string,
  active: boolean,
): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!(await ownsSwitch(switchId, user.id))) {
    return { error: 'Switch not found.' }
  }

  const limits = await getLimits(user.id)

  // If reactivating, verify we're not exceeding the active cap.
  if (active) {
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('switch_id', switchId)
      .eq('is_active', true)

    if (count !== null && count >= limits.maxContactsPerSwitch) {
      return { error: `Active contact limit reached (${limits.maxContactsPerSwitch}).` }
    }
  }

  const { error } = await supabase
    .from('contacts')
    .update({ is_active: active })
    .eq('id', contactId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/switches/${switchId}`)
  return { error: null }
}

// ── Delete contact ────────────────────────────────────────────────────────────

export async function deleteContact(
  contactId: string,
  switchId: string,
): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!(await ownsSwitch(switchId, user.id))) {
    return { error: 'Switch not found.' }
  }

  // Don't allow deleting the last active contact — the switch would become
  // useless and there'd be nothing to alert.
  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('switch_id', switchId)
    .eq('is_active', true)

  if (count !== null && count <= 1) {
    return {
      error: 'You need at least one active contact. Add another before removing this one.',
    }
  }

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/switches/${switchId}`)
  return { error: null }
}
