import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getLimits, getUserPlan } from '@/utils/subscription'
import { logout } from '@/app/auth/actions'
import CreateSwitchForm from './CreateSwitchForm'
import SwitchesList, { type ContactSummary } from './SwitchesList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [plan, limits] = await Promise.all([getUserPlan(user.id), getLimits(user.id)])

  const { data: switches } = await supabase
    .from('switches')
    .select('id, name, check_in_time, grace_period_minutes, interval_hours, is_active, personal_message')
    .order('created_at', { ascending: false })

  const switchIds = (switches ?? []).map((sw) => sw.id)

  const [{ data: checkins }, { data: contacts }] = await Promise.all([
    switchIds.length
      ? supabase
          .from('checkins')
          .select('switch_id, checked_in_at')
          .in('switch_id', switchIds)
          .order('checked_in_at', { ascending: false })
      : Promise.resolve({ data: [] as { switch_id: string; checked_in_at: string }[] }),
    switchIds.length
      ? supabase
          .from('contacts')
          .select('id, switch_id, name, email, position, is_active')
          .in('switch_id', switchIds)
          .order('position', { ascending: true })
      : Promise.resolve({ data: [] as {
          id: string
          switch_id: string
          name: string | null
          email: string
          position: number
          is_active: boolean
        }[] }),
  ])

  const lastCheckin: Record<string, string> = {}
  for (const c of checkins ?? []) {
    if (!lastCheckin[c.switch_id]) {
      lastCheckin[c.switch_id] = c.checked_in_at
    }
  }

  const contactsBySwitchId: Record<string, ContactSummary> = {}
  for (const c of contacts ?? []) {
    if (!c.is_active) continue
    const existing = contactsBySwitchId[c.switch_id]
    if (!existing) {
      contactsBySwitchId[c.switch_id] = {
        activeCount: 1,
        primary: { email: c.email, name: c.name },
      }
    } else {
      existing.activeCount += 1
    }
  }

  const hasSwitches = switches && switches.length > 0

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#eeeee9]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[#1a1a17] font-semibold tracking-tight">Vigilis</span>
          <div className="flex items-center gap-6">
            <Link
              href="/account"
              className="text-sm text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
            >
              Account
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
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

        {hasSwitches ? (
          <>
            {/* Switches list */}
            <section className="mb-14">
              <h2 className="text-[11px] font-semibold tracking-widest uppercase text-[#b0b0a4] mb-5">
                Your switches
              </h2>
              <SwitchesList
                switches={switches!}
                lastCheckin={lastCheckin}
                contactsBySwitchId={contactsBySwitchId}
                plan={plan}
                limits={limits}
              />
            </section>

            {/* Add another switch, only if under the plan cap */}
            {switches!.length < limits.maxSwitches && (
              <section className="mb-16">
                <h2 className="text-[11px] font-semibold tracking-widest uppercase text-[#b0b0a4] mb-5">
                  Add a switch
                </h2>
                <CreateSwitchForm limits={limits} />
              </section>
            )}

            {/* Upgrade nudge (Free only) */}
            {plan === 'free' && (
              <p className="text-xs text-[#c0c0b4]">
                Want SMS backup alerts, more contacts, and a configurable grace period?{' '}
                <Link href="/account" className="text-[#9e9e92] hover:text-[#1a1a17] transition-colors">
                  Upgrade to Pro →
                </Link>
              </p>
            )}
          </>
        ) : (
          <>
            {/* First-time welcome */}
            <div className="mb-10">
              <h1 className="text-2xl font-semibold text-[#1a1a17] mb-3 tracking-tight">
                Welcome to Vigilis.
              </h1>
              <p className="text-sm text-[#9e9e92] leading-relaxed max-w-md">
                Let&apos;s set up your first check-in. Pick a time each day, add someone to notify,
                and you&apos;re done.
              </p>
            </div>
            <CreateSwitchForm limits={limits} />
          </>
        )}
      </div>
    </div>
  )
}
