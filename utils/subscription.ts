/**
 * Single source of truth for plan limits and feature gating.
 * Every cap, range, or feature flag in the app reads from here.
 */

import { createClient } from '@/utils/supabase/server'

export type Plan = 'free' | 'pro'

export type PlanLimits = {
  maxContactsPerSwitch: number
  maxSwitches: number
  gracePeriodMinMinutes: number
  gracePeriodMaxMinutes: number
  gracePeriodDefaultMinutes: number
  graceConfigurable: boolean
  smsEnabled: boolean
  auditHistoryDays: number | null // null = unlimited
}

export const LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxContactsPerSwitch: 2,
    maxSwitches: 1,
    gracePeriodMinMinutes: 120,
    gracePeriodMaxMinutes: 120,
    gracePeriodDefaultMinutes: 120,
    graceConfigurable: false,
    smsEnabled: false,
    auditHistoryDays: 7,
  },
  pro: {
    maxContactsPerSwitch: 5,
    maxSwitches: 1,
    gracePeriodMinMinutes: 30,
    gracePeriodMaxMinutes: 720, // 12h
    gracePeriodDefaultMinutes: 120,
    graceConfigurable: true,
    smsEnabled: true,
    auditHistoryDays: null,
  },
}

/**
 * Resolve the active plan for a user. Returns 'free' if no profile row exists
 * or if the user is not signed in.
 */
export async function getUserPlan(userId?: string): Promise<Plan> {
  const supabase = await createClient()

  let resolvedUserId = userId
  if (!resolvedUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 'free'
    resolvedUserId = user.id
  }

  const { data } = await supabase
    .from('profiles')
    .select('plan, subscription_status, subscription_ends_at')
    .eq('user_id', resolvedUserId)
    .maybeSingle()

  if (!data) return 'free'

  // If the user cancelled and the period already ended, treat as free.
  if (
    data.subscription_ends_at &&
    new Date(data.subscription_ends_at) < new Date() &&
    data.subscription_status !== 'active'
  ) {
    return 'free'
  }

  return data.plan === 'pro' ? 'pro' : 'free'
}

export async function getLimits(userId?: string): Promise<PlanLimits> {
  const plan = await getUserPlan(userId)
  return LIMITS[plan]
}
