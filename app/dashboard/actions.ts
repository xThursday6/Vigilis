'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { Resend } from 'resend'

type SwitchState = { error: string | null }
type Result = { error: string | null }

// ── Check in ─────────────────────────────────────────────────────────────────

export async function checkIn(switchId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

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

  const gracePeriod = parseInt(formData.get('grace_period_minutes') as string, 10)
  const intervalHours = parseInt(formData.get('interval_hours') as string, 10)

  const personalMessage = (formData.get('personal_message') as string).trim()
  const contactName = (formData.get('contact_name') as string).trim()

  const { error } = await supabase.from('switches').insert({
    user_id: user.id,
    name: formData.get('name') as string,
    contact_email: formData.get('contact_email') as string,
    contact_name: contactName || null,
    check_in_time: formData.get('check_in_time') as string,
    grace_period_minutes: isNaN(gracePeriod) ? 60 : gracePeriod,
    interval_hours: isNaN(intervalHours) ? 24 : intervalHours,
    personal_message: personalMessage || null,
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { error: null }
}

// ── Update switch ─────────────────────────────────────────────────────────────

export async function updateSwitch(formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const switchId = formData.get('switch_id') as string
  const gracePeriod = parseInt(formData.get('grace_period_minutes') as string, 10)
  const intervalHours = parseInt(formData.get('interval_hours') as string, 10)

  const personalMessage = (formData.get('personal_message') as string).trim()
  const contactName = (formData.get('contact_name') as string).trim()

  const { error } = await supabase
    .from('switches')
    .update({
      name: formData.get('name') as string,
      contact_email: formData.get('contact_email') as string,
      contact_name: contactName || null,
      check_in_time: formData.get('check_in_time') as string,
      grace_period_minutes: isNaN(gracePeriod) ? 60 : gracePeriod,
      interval_hours: isNaN(intervalHours) ? 24 : intervalHours,
      personal_message: personalMessage || null,
    })
    .eq('id', switchId)
    .eq('user_id', user.id) // owner check

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { error: null }
}

// ── Delete switch ─────────────────────────────────────────────────────────────

export async function deleteSwitch(switchId: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Remove check-ins first (FK constraint), then the switch itself.
  // The .eq('user_id') on the switch delete acts as an ownership guard.
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

// ── Send test alert ───────────────────────────────────────────────────────────

export async function sendTestAlert(switchId: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: sw } = await supabase
    .from('switches')
    .select('name, contact_email')
    .eq('id', switchId)
    .eq('user_id', user.id)
    .single()

  if (!sw) return { error: 'Switch not found.' }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Vigilis <alerts@vigilis.app>',
    to: sw.contact_email,
    subject: 'Test alert from Vigilis',
    html: `
      <p>Hi,</p>
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
  })

  if (error) return { error: error.message }
  return { error: null }
}
