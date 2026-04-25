/**
 * Thin Lemon Squeezy API wrapper.
 * Uses raw fetch rather than the official SDK to keep the dependency footprint
 * small and to avoid CJS/ESM interop issues inside Next.js server actions.
 *
 * Docs: https://docs.lemonsqueezy.com/api
 */

const API_BASE = 'https://api.lemonsqueezy.com/v1'

type CreateCheckoutOptions = {
  storeId: string
  variantId: string
  /** Supabase auth user id — echoed back in webhook payloads so we can resolve the subscriber. */
  userId: string
  email: string
  /** Where Lemon Squeezy sends the customer after a successful payment. */
  redirectUrl: string
  /** Creates a *test-mode* checkout when true. Only works if the API key is a test-mode key. */
  testMode?: boolean
}

export type CheckoutResult = {
  url: string
  id: string
}

function apiKey(): string {
  const key = process.env.LEMONSQUEEZY_API_KEY
  if (!key) throw new Error('LEMONSQUEEZY_API_KEY is not set')
  return key
}

async function lsFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey()}`,
      ...(init.headers ?? {}),
    },
  })
  return res
}

/**
 * Create a hosted checkout session for a specific user. The returned URL can
 * be opened directly (redirect) or in the overlay via `window.LemonSqueezy.Url.Open(url)`.
 *
 * custom.user_id on the checkout is critical — the webhook uses it to resolve
 * the subscription back to a profile row.
 */
export async function createCheckout(
  opts: CreateCheckoutOptions,
): Promise<CheckoutResult> {
  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: opts.email,
          custom: { user_id: opts.userId },
        },
        product_options: {
          redirect_url: opts.redirectUrl,
          receipt_button_text: 'Return to Vigilis',
          receipt_thank_you_note: 'Thanks for upgrading — your Pro features are now active.',
        },
        checkout_options: {
          embed: true, // allow overlay
          media: false,
          logo: true,
          dark: false,
        },
        ...(opts.testMode ? { test_mode: true } : {}),
      },
      relationships: {
        store: { data: { type: 'stores', id: String(opts.storeId) } },
        variant: { data: { type: 'variants', id: String(opts.variantId) } },
      },
    },
  }

  const res = await lsFetch('/checkouts', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Lemon Squeezy checkout creation failed (${res.status}): ${errorBody}`)
  }

  const json = (await res.json()) as {
    data: { id: string; attributes: { url: string } }
  }

  return { url: json.data.attributes.url, id: json.data.id }
}

/**
 * Fetch the customer portal URL so an existing subscriber can manage or cancel
 * their subscription without us owning that UI.
 */
export async function getCustomerPortalUrl(
  subscriptionId: string,
): Promise<string | null> {
  const res = await lsFetch(`/subscriptions/${subscriptionId}`)
  if (!res.ok) return null

  const json = (await res.json()) as {
    data: { attributes: { urls: { customer_portal?: string; update_payment_method?: string } } }
  }

  return json.data.attributes.urls.customer_portal ?? null
}
