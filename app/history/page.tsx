import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getLimits, getUserPlan } from '@/utils/subscription'

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [plan, limits] = await Promise.all([getUserPlan(user.id), getLimits(user.id)])

  // Build an oldest-allowed cutoff for the Free tier.
  let query = supabase
    .from('alert_deliveries')
    .select('id, switch_id, contact_id, channel, status, recipient, error, sent_at')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(200)

  if (limits.auditHistoryDays !== null) {
    const cutoff = new Date(Date.now() - limits.auditHistoryDays * 24 * 60 * 60 * 1000)
    query = query.gte('sent_at', cutoff.toISOString())
  }

  const { data: deliveries } = await query

  // Resolve switch names and contact names for display.
  const switchIds = Array.from(new Set((deliveries ?? []).map((d) => d.switch_id)))
  const contactIds = Array.from(
    new Set((deliveries ?? []).map((d) => d.contact_id).filter(Boolean) as string[]),
  )

  const [{ data: switches }, { data: contacts }] = await Promise.all([
    switchIds.length
      ? supabase.from('switches').select('id, name').in('id', switchIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    contactIds.length
      ? supabase.from('contacts').select('id, name, email').in('id', contactIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null; email: string }[] }),
  ])

  const switchNameById = new Map((switches ?? []).map((s) => [s.id, s.name]))
  const contactById = new Map((contacts ?? []).map((c) => [c.id, c]))

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
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
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-[#1a1a17] mb-1 tracking-tight">
              Alert history
            </h1>
            <p className="text-sm text-[#9e9e92]">
              Every alert Vigilis has attempted on your behalf.
            </p>
          </div>
          {plan === 'free' && limits.auditHistoryDays && (
            <p className="text-[11px] text-[#b0b0a4] text-right">
              Showing last {limits.auditHistoryDays} days · {' '}
              <Link href="/account" className="underline underline-offset-2 hover:text-[#1a1a17]">
                Upgrade for full history
              </Link>
            </p>
          )}
        </div>

        {(!deliveries || deliveries.length === 0) ? (
          <div className="rounded-2xl border border-[#e6e6df] bg-white px-6 py-10 text-center">
            <p className="text-sm text-[#6b6b5e]">
              No alerts yet — that&apos;s a good thing.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {deliveries.map((d) => {
              const switchName = switchNameById.get(d.switch_id) ?? 'Unknown switch'
              const contact = d.contact_id ? contactById.get(d.contact_id) : null
              const contactLabel = contact?.name || contact?.email || d.recipient
              return (
                <li
                  key={d.id}
                  className="rounded-xl border border-[#e6e6df] bg-white px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-[#1a1a17] truncate">
                        {switchName}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                          d.channel === 'email'
                            ? 'bg-[#edf2fb] text-[#3a5aa1]'
                            : 'bg-[#f4ecfb] text-[#6b3fa0]'
                        }`}
                      >
                        {d.channel}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          d.status === 'sent'
                            ? 'bg-[#edfaf3] text-[#2d7a4f]'
                            : 'bg-[#fbe9e9] text-[#c13a3a]'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#9e9e92] truncate">
                      to {contactLabel}
                      {d.error && (
                        <>
                          {' · '}
                          <span className="text-red-500/80">{d.error}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <p className="text-[11px] text-[#b0b0a4] shrink-0">
                    {new Date(d.sent_at).toLocaleString()}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
