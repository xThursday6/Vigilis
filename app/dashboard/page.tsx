import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/auth/actions'
import CreateSwitchForm from './CreateSwitchForm'
import SwitchesList from './SwitchesList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: switches } = await supabase
    .from('switches')
    .select('*')
    .order('created_at', { ascending: false })

  const switchIds = (switches ?? []).map((sw) => sw.id)
  const { data: checkins } = switchIds.length
    ? await supabase
        .from('checkins')
        .select('switch_id, checked_in_at')
        .in('switch_id', switchIds)
        .order('checked_in_at', { ascending: false })
    : { data: [] }

  const lastCheckin: Record<string, string> = {}
  for (const c of checkins ?? []) {
    if (!lastCheckin[c.switch_id]) {
      lastCheckin[c.switch_id] = c.checked_in_at
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
        <p className="text-xs text-[#b0b0a4] mb-10">{user.email}</p>

        {hasSwitches ? (
          <>
            {/* Switches list */}
            <section className="mb-14">
              <h2 className="text-[11px] font-semibold tracking-widest uppercase text-[#b0b0a4] mb-5">
                Your switches
              </h2>
              <SwitchesList switches={switches!} lastCheckin={lastCheckin} />
            </section>

            {/* Add another switch */}
            <section className="mb-16">
              <h2 className="text-[11px] font-semibold tracking-widest uppercase text-[#b0b0a4] mb-5">
                Add a switch
              </h2>
              <CreateSwitchForm />
            </section>

            {/* Upgrade nudge */}
            <p className="text-xs text-[#c0c0b4]">
              Want SMS backup alerts and more?{' '}
              <Link href="/pricing" className="text-[#9e9e92] hover:text-[#1a1a17] transition-colors">
                Upgrade to Pro →
              </Link>
            </p>
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
            <CreateSwitchForm />
          </>
        )}
      </div>
    </div>
  )
}
