'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  createCheckout,
  getCustomerPortalUrl,
} from '@/utils/lemonsqueezy'

type Result = { error: string | null; success: boolean }
type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export async function changePassword(
  _prevState: Result,
  formData: FormData
): Promise<Result> {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password !== confirm) {
    return { error: "Passwords don't match.", success: false }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.', success: false }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message, success: false }
  return { error: null, success: true }
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  // Delete all user data before removing the auth record
  const { data: switches } = await supabase
    .from('switches')
    .select('id')
    .eq('user_id', user.id)

  const switchIds = (switches ?? []).map((s) => s.id)

  if (switchIds.length > 0) {
    await supabase.from('checkins').delete().in('switch_id', switchIds)
    await supabase.from('switches').delete().eq('user_id', user.id)
  }

  // Deleting an auth user requires the service-role key
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  redirect('/login')
}

// ── Start a Lemon Squeezy checkout for the current user ─────────────────────

export async function startCheckout(): Promise<CheckoutResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!storeId || !variantId || !appUrl) {
    return {
      ok: false,
      error: 'Checkout is not fully configured yet.',
    }
  }

  // Don't start a new checkout if the user is already an active Pro.
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, subscription_status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile?.plan === 'pro' && profile.subscription_status === 'active') {
    return { ok: false, error: 'You already have an active Pro subscription.' }
  }

  try {
    const checkout = await createCheckout({
      storeId,
      variantId,
      userId: user.id,
      email: user.email ?? '',
      redirectUrl: `${appUrl}/account?upgraded=1`,
      testMode: process.env.LEMONSQUEEZY_TEST_MODE === '1',
    })
    return { ok: true, url: checkout.url }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to start checkout.',
    }
  }
}

// ── Get the Lemon Squeezy customer-portal URL for an existing subscriber ────

export async function getManageUrl(): Promise<CheckoutResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('lemonsqueezy_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.lemonsqueezy_subscription_id) {
    return { ok: false, error: 'No subscription found.' }
  }

  const url = await getCustomerPortalUrl(profile.lemonsqueezy_subscription_id)
  if (!url) return { ok: false, error: 'Could not load customer portal.' }
  return { ok: true, url }
}
