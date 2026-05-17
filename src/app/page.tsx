import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div className="mesh-bg min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden relative">

      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="animate-fade-up stagger-1 flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25 animate-float">
          🧠
        </div>
        <span className="text-2xl font-bold font-[var(--font-syne)] gradient-text">BriefBuddy</span>
      </div>

      {/* Headline */}
      <div className="animate-fade-up stagger-2 text-center mb-6 max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-extrabold font-[var(--font-syne)] leading-tight mb-4">
          <span className="text-white">Your meetings,</span>
          <br />
          <span className="shimmer-text">intelligently captured.</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
          Record, transcribe, and query every conversation with AI. Never lose a decision or action item again.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="animate-fade-up stagger-3 flex gap-4 mb-16">
        <Link href="/sign-up"
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transform">
          Get Started Free
        </Link>
        <Link href="/sign-in"
          className="px-8 py-4 rounded-2xl glass text-slate-300 font-semibold text-lg hover:text-white hover:border-blue-500/40 transition-all">
          Sign In
        </Link>
      </div>

      {/* Feature pills */}
      <div className="animate-fade-up stagger-4 flex flex-wrap gap-3 justify-center">
        {[
          { icon: '🎙', label: 'Browser Recording' },
          { icon: '⚡', label: 'Instant Transcription' },
          { icon: '🤖', label: 'AI Summaries' },
          { icon: '💬', label: 'Ask Anything' },
        ].map((f) => (
          <div key={f.label} className="glass px-4 py-2 rounded-full flex items-center gap-2 text-sm text-slate-300">
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}