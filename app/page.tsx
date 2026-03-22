import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0e0e0e] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto w-full">
        <span className="text-white/90 font-medium tracking-tight">Vigilis</span>
        <Link
          href="/login"
          className="text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <p className="text-xs font-medium tracking-widest uppercase text-white/30 mb-8">
          Simple. Reliable. Human.
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white/90 leading-tight max-w-2xl mb-6 tracking-tight">
          The simplest way to let someone know you're okay.
        </h1>
        <p className="text-lg text-white/50 max-w-md mb-12 leading-relaxed">
          Vigilis sends a gentle alert to someone you trust if you miss a daily
          check-in. Simple, reliable, human.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-white text-[#0e0e0e] text-sm font-medium px-7 py-3 rounded-lg hover:bg-white/90 transition-colors"
        >
          Get started free
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-32">
        <div className="grid sm:grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden">
          {[
            {
              step: '01',
              title: 'Set a daily check-in time',
              body: 'Pick a time each day to check in. A single tap is all it takes.',
            },
            {
              step: '02',
              title: 'Add a trusted contact',
              body: 'Choose someone who should hear from us if you go quiet.',
            },
            {
              step: '03',
              title: "We'll handle the rest",
              body: 'If your check-in is missed, we send a calm, human note — no panic, just a heads-up.',
            },
          ].map(({ step, title, body }) => (
            <div
              key={step}
              className="bg-[#0e0e0e] px-8 py-14 flex flex-col gap-4"
            >
              <span className="text-xs font-medium tabular-nums text-white/20">
                {step}
              </span>
              <h3 className="text-white/80 font-medium text-base leading-snug">
                {title}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-6">
        <p className="text-center text-xs text-white/20">
          © {new Date().getFullYear()} Vigilis
        </p>
      </footer>
    </main>
  )
}
