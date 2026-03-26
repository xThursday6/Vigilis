import Link from 'next/link'

// ── Inline SVG components ──────────────────────────────────────────────────────

function LogoMark() {
  return (
    <svg
      width="18"
      height="13"
      viewBox="0 0 20 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#888880]"
      aria-hidden="true"
    >
      {/* Eye outline — almond path */}
      <path d="M1 7 Q10 1 19 7 Q10 13 1 7 Z" />
      {/* Iris */}
      <circle cx="10" cy="7" r="2.4" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#9a8b6a]"
      aria-hidden="true"
    >
      <circle cx="13" cy="13" r="9" />
      <polyline points="13,8 13,13 16.5,15.5" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#9a8b6a]"
      aria-hidden="true"
    >
      <circle cx="13" cy="9" r="3.5" />
      <path d="M5 23c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#9a8b6a]"
      aria-hidden="true"
    >
      <path d="M13 3 L21 6.5 V13 C21 17.6 17.5 21.2 13 23 C8.5 21.2 5 17.6 5 13 V6.5 Z" />
      <polyline points="9.5,13 12,15.5 17,10" />
    </svg>
  )
}

// ── Feature card data ──────────────────────────────────────────────────────────

const features = [
  {
    step: '01',
    icon: <ClockIcon />,
    title: 'Set a daily check-in time',
    body: 'Pick a time each day to check in. A single tap is all it takes.',
  },
  {
    step: '02',
    icon: <PersonIcon />,
    title: 'Add a trusted contact',
    body: 'Choose someone who should hear from us if you go quiet.',
  },
  {
    step: '03',
    icon: <ShieldIcon />,
    title: "We'll handle the rest",
    body: 'If your check-in is missed, we send a calm, human note — no panic, just a heads-up.',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="min-h-screen bg-[#111110] flex flex-col relative overflow-hidden">

      {/* Nav */}
      <nav className="relative border-b border-[#1e1e1c]">
        <div className="flex items-center justify-between px-8 h-14 max-w-5xl mx-auto w-full">
          <span className="flex items-center gap-2.5 text-[#f5f5f0] font-semibold tracking-tight">
            <LogoMark />
            Vigilis
          </span>
          <Link
            href="/login"
            className="text-sm text-[#888880] hover:text-[#c8c8c0] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 text-center py-28 sm:py-36">
        {/* Warm radial glow behind the headline */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 720px 480px at 50% 55%, rgba(175, 145, 75, 0.065) 0%, transparent 70%)',
          }}
        />

        <p className="relative text-xs font-medium tracking-[0.2em] uppercase text-[#555550] mb-10">
          Simple. Reliable. Human.
        </p>
        <h1 className="relative text-4xl sm:text-5xl md:text-[3.75rem] font-semibold text-[#f5f5f0] leading-[1.15] max-w-2xl mb-7 tracking-[-0.02em]">
          The simplest way to let someone know you&apos;re okay.
        </h1>
        <p className="relative text-lg text-[#777770] max-w-sm mb-14 leading-relaxed">
          A daily check-in. A trusted contact. A quiet alert if you go silent.
        </p>
        <Link
          href="/signup"
          className="relative inline-block bg-[#f5f5f0] text-[#111110] text-sm font-medium px-8 py-3.5 rounded-xl hover:bg-white transition-colors"
        >
          Get started free
        </Link>
      </section>

      {/* Features */}
      <section className="relative max-w-4xl mx-auto w-full px-6 pb-36">
        <div className="grid sm:grid-cols-3 gap-4">
          {features.map(({ step, icon, title, body }) => (
            <div
              key={step}
              className="rounded-2xl border border-[#242420] px-7 py-9 flex flex-col gap-4"
            >
              {/* Icon */}
              <div className="mb-1">{icon}</div>
              <span className="text-xs font-medium tabular-nums text-[#444440]">
                {step}
              </span>
              <h3 className="text-[#d8d8d0] font-medium text-base leading-snug">
                {title}
              </h3>
              <p className="text-sm text-[#666660] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[#1e1e1c] px-8 py-7">
        <p className="text-center text-xs text-[#444440]">
          © {new Date().getFullYear()} Vigilis
        </p>
      </footer>
    </main>
  )
}
