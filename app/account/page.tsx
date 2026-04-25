import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getUserPlan } from '@/utils/subscription'
import ChangePasswordForm from './ChangePasswordForm'
import DeleteAccountSection from './DeleteAccountSection'
import SubscriptionSection from './SubscriptionSection'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [plan, profileRow] = await Promise.all([
    getUserPlan(user.id),
    supabase
      .from('profiles')
      .select('subscription_status, subscription_renews_at, subscription_ends_at, lemonsqueezy_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then((r) => r.data),
  ])

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#eeeee9]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[#1a1a17] font-semibold tracking-tight">Vigilis</span>
          <Link
            href="/dashboard"
            className="text-sm text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-10">
          <p className="text-xs text-[#b0b0a4]">{user.email}</p>
          <span
            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-medium ${
              plan === 'pro'
                ? 'bg-[#f4ecfb] text-[#6b3fa0]'
                : 'bg-[#f4f4f0] text-[#9e9e92]'
            }`}
          >
            {plan}
          </span>
        </div>

        {/* Subscription */}
        <Suspense>
          <SubscriptionSection
            plan={plan}
            subscriptionStatus={profileRow?.subscription_status ?? null}
            renewsAt={profileRow?.subscription_renews_at ?? null}
            endsAt={profileRow?.subscription_ends_at ?? null}
            hasSubscriptionId={!!profileRow?.lemonsqueezy_subscription_id}
          />
        </Suspense>

        {/* Change password */}
        <section className="mb-12">
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-[#b0b0a4] mb-5">
            Change password
          </h2>
          <div className="rounded-2xl border border-[#e6e6df] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-6 py-7">
            <ChangePasswordForm />
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-red-400/70 mb-5">
            Danger zone
          </h2>
          <div className="rounded-2xl border border-red-100 bg-[#fff8f8] px-6 py-7">
            <DeleteAccountSection />
          </div>
        </section>
      </div>
    </div>
  )
}
