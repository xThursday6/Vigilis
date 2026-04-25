import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getLimits, getUserPlan } from '@/utils/subscription'
import ContactsManager from './ContactsManager'

type Params = { params: Promise<{ id: string }> }

export default async function SwitchDetailPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sw } = await supabase
    .from('switches')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sw) notFound()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name, email, phone, position, is_active')
    .eq('switch_id', id)
    .order('position', { ascending: true })

  const plan = await getUserPlan(user.id)
  const limits = await getLimits(user.id)

  const activeCount = (contacts ?? []).filter((c) => c.is_active).length

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#eeeee9]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-[#1a1a17] font-semibold tracking-tight">
            Vigilis
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-[#1a1a17] mb-1 tracking-tight">
          {sw.name}
        </h1>
        <p className="text-sm text-[#9e9e92] mb-10">Trusted contacts</p>

        <section>
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-[11px] font-semibold tracking-widest uppercase text-[#b0b0a4]">
              Contacts
            </h2>
            <p className="text-[11px] text-[#b0b0a4]">
              {activeCount} of {limits.maxContactsPerSwitch} used
              {plan === 'free' && (
                <>
                  {' · '}
                  <Link
                    href="/account"
                    className="text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
                  >
                    Upgrade for 5
                  </Link>
                </>
              )}
            </p>
          </div>

          <ContactsManager
            switchId={sw.id}
            contacts={contacts ?? []}
            plan={plan}
            maxContacts={limits.maxContactsPerSwitch}
            smsEnabled={limits.smsEnabled}
          />
        </section>
      </div>
    </div>
  )
}
