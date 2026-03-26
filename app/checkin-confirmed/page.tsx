import Link from 'next/link'

const messages = {
  ok: {
    heading: "You're all set.",
    body: "Check-in recorded. Your contact won't hear from us today.",
  },
  used: {
    heading: 'Already checked in.',
    body: "This link has already been used. You're all set.",
  },
  expired: {
    heading: 'Link expired.',
    body: 'This check-in link is more than 24 hours old. Head to the dashboard to check in manually.',
  },
  invalid: {
    heading: 'Invalid link.',
    body: "We couldn't find that check-in link. It may have already been used or never existed.",
  },
}

export default async function CheckinConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const msg = messages[status as keyof typeof messages] ?? messages.invalid

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-white/20 mb-6">
          Vigilis
        </p>
        <h1 className="text-2xl font-semibold text-white/90 mb-3">{msg.heading}</h1>
        <p className="text-sm text-white/50 leading-relaxed mb-8">{msg.body}</p>
        <Link
          href="/dashboard"
          className="text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
