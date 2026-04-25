'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import { startCheckout, getManageUrl } from './actions'

// Lemon.js global (loaded from Script tag below).
declare global {
  interface Window {
    LemonSqueezy?: {
      Setup: (opts: { eventHandler?: (e: { event: string }) => void }) => void
      Url: { Open: (url: string) => void; Close: () => void }
    }
    createLemonSqueezy?: () => void
  }
}

type Props = {
  plan: 'free' | 'pro'
  subscriptionStatus: string | null
  renewsAt: string | null
  endsAt: string | null
  hasSubscriptionId: boolean
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function SubscriptionSection(props: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const justUpgraded = params.get('upgraded') === '1'

  // Configure Lemon.js for overlay checkouts and refresh the page when the
  // checkout closes so the webhook-updated profile re-renders.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const setup = () => {
      window.LemonSqueezy?.Setup({
        eventHandler: (ev) => {
          if (ev.event === 'Checkout.Success' || ev.event === 'Checkout.ContactUs') {
            // Give the webhook a moment to land, then refresh.
            setTimeout(() => router.refresh(), 1500)
          }
        },
      })
    }
    if (window.LemonSqueezy) setup()
    else window.createLemonSqueezy = setup
  }, [router])

  // If we got redirected back with ?upgraded=1, poll briefly so the new plan
  // shows up even if the webhook was a second or two late.
  useEffect(() => {
    if (!justUpgraded || props.plan === 'pro') return
    const t = setTimeout(() => router.refresh(), 2000)
    return () => clearTimeout(t)
  }, [justUpgraded, props.plan, router])

  async function handleUpgrade() {
    setError(null)
    startTransition(async () => {
      const res = await startCheckout()
      if (!res.ok) {
        setError(res.error)
        return
      }
      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(res.url)
      } else {
        // Fallback: full-page redirect if Lemon.js failed to load.
        window.location.href = res.url
      }
    })
  }

  async function handleManage() {
    setError(null)
    startTransition(async () => {
      const res = await getManageUrl()
      if (!res.ok) {
        setError(res.error)
        return
      }
      window.location.href = res.url
    })
  }

  const renews = formatDate(props.renewsAt)
  const ends = formatDate(props.endsAt)
  const isCancelled = props.subscriptionStatus === 'cancelled'
  const isPastDue = props.subscriptionStatus === 'past_due'

  return (
    <>
      <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="afterInteractive" />

      <section className="mb-12">
        <h2 className="text-[11px] font-semibold tracking-widest uppercase text-[#b0b0a4] mb-5">
          Subscription
        </h2>
        <div className="rounded-2xl border border-[#e6e6df] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-6 py-7">
          {props.plan === 'pro' ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#1a1a17]">Pro</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f4ecfb] text-[#6b3fa0] font-medium">
                  {props.subscriptionStatus ?? 'active'}
                </span>
              </div>

              {isCancelled && ends && (
                <p className="text-sm text-[#6b6b5e]">
                  Your subscription is cancelled and will end on <strong>{ends}</strong>.
                  You&apos;ll keep Pro features until then.
                </p>
              )}
              {!isCancelled && renews && (
                <p className="text-sm text-[#6b6b5e]">
                  Renews on <strong>{renews}</strong>.
                </p>
              )}
              {isPastDue && (
                <p className="text-sm text-amber-600">
                  Your last payment failed. Update your payment method to keep Pro.
                </p>
              )}

              {props.hasSubscriptionId && (
                <div>
                  <button
                    onClick={handleManage}
                    disabled={isPending}
                    className="text-sm font-medium text-[#1a1a17] hover:text-[#2e2e2a] disabled:opacity-40 transition-colors"
                  >
                    {isPending ? 'Loading…' : 'Manage subscription'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#1a1a17]">Free</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f4f4f0] text-[#9e9e92]">
                  current plan
                </span>
              </div>

              {justUpgraded && (
                <p className="text-sm text-[#2d7a4f]">
                  Payment received — Pro is being activated. This page will refresh shortly.
                </p>
              )}

              <div className="text-sm text-[#6b6b5e] leading-relaxed">
                <p className="mb-2">Upgrade to <strong className="text-[#1a1a17]">Pro</strong> for $6/month:</p>
                <ul className="list-disc list-inside text-[#6b6b5e] space-y-1">
                  <li>SMS backup delivery</li>
                  <li>Up to 5 trusted contacts</li>
                  <li>Configurable grace period (30 min – 12 h)</li>
                  <li>Full alert history</li>
                </ul>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={handleUpgrade}
                  disabled={isPending}
                  className="rounded-lg bg-[#1a1a17] text-[#f5f5f0] px-5 py-2.5 text-sm font-medium hover:bg-[#2e2e2a] disabled:opacity-40 transition-colors"
                >
                  {isPending ? 'Loading…' : 'Upgrade to Pro'}
                </button>
                <Link
                  href="/history"
                  className="text-xs text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
                >
                  View alert history
                </Link>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>
      </section>
    </>
  )
}
