'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { Resend } from 'resend'
import { getLimits } from '@/utils/subscription'

type SwitchState = { error: string | null }
type Result = { error: string | null }

// ── Ownership helper ──────────────────────────────────────────────────────────

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

// ── Check in ─────────────────────────────────────────────────────────────────

export async function checkIn(switchId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return
  if (!switchId || !(await ownsSwitch(switchId, user.id))) return

  await supabase.from('checkins').insert({
    switch_id: switchId,
    user_id: user.id,
    checked_in_at: new Date().toISOString(),
  })

  revalidatePath('/dashboard')
}

// ── Create switch ─────────────────────────────────────────────────────────────

export async function createSwitch(
  _prevState: SwitchState,
  formData: FormData
): Promise<SwitchState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const limits = await getLimits(user.id)

  // Enforce switch cap (Free and Pro both = 1, but future-proof).
  const { count: switchCount } = await supabase
    .from('switches')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (switchCount !== null && switchCount >= limits.maxSwitches) {
    return {
      error: `You've reached your switch limit (${limits.maxSwitches}). Upgrade or delete an existing switch.`,
    }
  }

  const intervalHours = parseInt(formData.get('interval_hours') as string, 10)

  // Grace period — clamp to plan range.
  const rawGrace = parseInt(formData.get('grace_period_minutes') as string, 10)
  const gracePeriod = limits.graceConfigurable
    ? Math.min(
        Math.max(isNaN(rawGrace) ? limits.gracePeriodDefaultMinutes : rawGrace, limits.gracePeriodMinMinutes),
        limits.gracePeriodMaxMinutes,
      )
    : limits.gracePeriodDefaultMinutes

  const personalMessage = (formData.get('personal_message') as string).trim()
  const contactName = (formData.get('contact_name') as string).trim()
  const contactEmail = (formData.get('contact_email') as string).trim()

  if (!contactEmail) {
    return { error: 'At least one contact email is required.' }
  }

  // Create the switch first…
  const { data: newSwitch, error: switchError } = await supabase
    .from('switches')
    .insert({
      user_id: user.id,
      name: formData.get('name') as string,
      check_in_time: formData.get('check_in_time') as string,
      grace_period_minutes: gracePeriod,
      interval_hours: isNaN(intervalHours) ? 24 : intervalHours,
      personal_message: personalMessage || null,
      is_active: true,
    })
    .select('id')
    .single()

  if (switchError || !newSwitch) {
    return { error: switchError?.message ?? 'Failed to create switch.' }
  }

  // …then the first contact for it.
  const { error: contactError } = await supabase.from('contacts').insert({
    switch_id: newSwitch.id,
    user_id: user.id,
    name: contactName || null,
    email: contactEmail,
    position: 0,
    is_active: true,
  })

  if (contactError) {
    // Roll back the switch so we don't leave an orphaned one.
    await supabase.from('switches').delete().eq('id', newSwitch.id)
    return { error: contactError.message }
  }

  revalidatePath('/dashboard')
  return { error: null }
}

// ── Update switch (fields only — contacts are managed on the detail page) ────

export async function updateSwitch(formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const limits = await getLimits(user.id)

  const switchId = formData.get('switch_id') as string
  const intervalHours = parseInt(formData.get('interval_hours') as string, 10)

  const rawGrace = parseInt(formData.get('grace_period_minutes') as string, 10)
  const gracePeriod = limits.graceConfigurable
    ? Math.min(
        Math.max(isNaN(rawGrace) ? limits.gracePeriodDefaultMinutes : rawGrace, limits.gracePeriodMinMinutes),
        limits.gracePeriodMaxMinutes,
      )
    : limits.gracePeriodDefaultMinutes

  const personalMessage = (formData.get('personal_message') as string).trim()

  const { error } = await supabase
    .from('switches')
    .update({
      name: formData.get('name') as string,
      check_in_time: formData.get('check_in_time') as string,
      grace_period_minutes: gracePeriod,
      interval_hours: isNaN(intervalHours) ? 24 : intervalHours,
      personal_message: personalMessage || null,
    })
    .eq('id', switchId)
    .eq('user_id', user.id) // owner check

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/switches/${switchId}`)
  return { error: null }
}

// ── Delete switch ─────────────────────────────────────────────────────────────

export async function deleteSwitch(switchId: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Contacts and alert_deliveries cascade via FK. Check-ins do not.
  const { error: checkinError } = await supabase
    .from('checkins')
    .delete()
    .eq('switch_id', switchId)

  if (checkinError) return { error: checkinError.message }

  const { error: switchError } = await supabase
    .from('switches')
    .delete()
    .eq('id', switchId)
    .eq('user_id', user.id)

  if (switchError) return { error: switchError.message }

  revalidatePath('/dashboard')
  return { error: null }
}

// ── Send test alert (to all active contacts) ─────────────────────────────────

export async function sendTestAlert(switchId: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: sw } = await supabase
    .from('switches')
    .select('name')
    .eq('id', switchId)
    .eq('user_id', user.id)
    .single()

  if (!sw) return { error: 'Switch not found.' }

  const { data: contacts } = await supabase
    .from('contacts')
    .select('email, name')
    .eq('switch_id', switchId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (!contacts || contacts.length === 0) {
    return { error: 'Add at least one contact before sending a test.' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  // Send in parallel, collect first error if any.
  const results = await Promise.all(
    contacts.map((c) =>
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'Vigilis <alerts@vigilis.app>',
        to: c.email,
        subject: 'Test alert from Vigilis',
        html: `
          <p>${c.name ? `Hi ${c.name},` : 'Hi,'}</p>
          <p>
            This is a test alert from Vigilis — no need to worry.
            <strong>${sw.name}</strong> is making sure alert emails reach you correctly.
          </p>
          <p>
            If you receive a real alert in the future it will look similar to this,
            and will let you know that ${sw.name} missed their daily check-in.
            No action is needed from you right now.
          </p>
          <p>— Vigilis</p>
        `,
      }),
    ),
  )

  const firstError = results.find((r) => r.error)?.error
  if (firstError) return { error: firstError.message }
  return { error: null }
}
