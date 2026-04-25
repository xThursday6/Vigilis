import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

// Service-role client (RLS bypass). Webhook writes to profiles.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

type LSEvent = {
  meta: {
    event_name: string
    custom_data?: { user_id?: string }
  }
  data: {
    id: string
    type: string
    attributes: {
      store_id: number
      customer_id: number
      variant_id?: number
      status?: string
      renews_at?: string | null
      ends_at?: string | null
      urls?: { update_payment_method?: string; customer_portal?: string }
      subscription_id?: number
      user_email?: string
    }
  }
}

/**
 * Verify Lemon Squeezy webhook signature.
 * Docs: https://docs.lemonsqueezy.com/guides/developer-guide/webhooks#signing-requests
 */
function verifySignature(rawBody: string, header: string | null): boolean {
  if (!header) return false
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) return false

  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  const a = Buffer.from(header, 'utf8')
  const b = Buffer.from(computed, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest): Promise<Response> {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature')

  if (!verifySignature(rawBody, signature)) {
    return new Response('Invalid signature', { status: 401 })
  }

  let event: LSEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const eventName = event.meta.event_name
  const userId = event.meta.custom_data?.user_id

  if (!userId) {
    // No user_id in custom data — we can't attribute this. Return 200 so
    // Lemon Squeezy stops retrying.
    return new Response('ok (no user_id, ignored)', { status: 200 })
  }

  // We only care about subscription_* events. Others (orders, etc.) are acked.
  if (!eventName.startsWith('subscription_')) {
    return new Response('ok (ignored)', { status: 200 })
  }

  const supabase = adminClient()
  const attrs = event.data.attributes
  const subscriptionId = event.data.type === 'subscriptions' ? event.data.id : null

  // Build profile update based on event + current attributes.
  const patch: Record<string, unknown> = {
    lemonsqueezy_customer_id: String(attrs.customer_id),
    subscription_status: attrs.status ?? null,
    subscription_renews_at: attrs.renews_at ?? null,
    subscription_ends_at: attrs.ends_at ?? null,
    updated_at: new Date().toISOString(),
  }

  if (subscriptionId) {
    patch.lemonsqueezy_subscription_id = subscriptionId
  }
  if (attrs.variant_id) {
    patch.lemonsqueezy_variant_id = String(attrs.variant_id)
  }

  // Determine effective plan.
  switch (eventName) {
    case 'subscription_created':
    case 'subscription_resumed':
    case 'subscription_unpaused':
    case 'subscription_updated':
      patch.plan = attrs.status === 'active' || attrs.status === 'on_trial' ? 'pro' : 'free'
      break
    case 'subscription_cancelled':
      // Cancelled but still active until ends_at. Keep Pro until then — the
      // read-side helper in utils/subscription.ts downgrades once ends_at
      // passes.
      patch.plan = 'pro'
      break
    case 'subscription_expired':
      patch.plan = 'free'
      break
    case 'subscription_paused':
      patch.plan = 'free'
      break
    case 'subscription_payment_failed':
    case 'subscription_payment_success':
    case 'subscription_payment_refunded':
    case 'subscription_payment_recovered':
      // Status field on these events reflects current sub state. Keep plan
      // in sync with that rather than inferring from the event.
      patch.plan = attrs.status === 'active' || attrs.status === 'on_trial' ? 'pro' : 'free'
      break
    default:
      // Unknown subscription_* event — still persist what we have.
      break
  }

  const { error } = await supabase.from('profiles').update(patch).eq('user_id', userId)

  if (error) {
    console.error('[lemonsqueezy webhook] profile update failed', {
      userId,
      eventName,
      error: error.message,
    })
    // Return 500 so Lemon Squeezy retries.
    return new Response('Database error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
}
