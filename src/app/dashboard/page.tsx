'use client'
import Navbar from '@/components/Navbar'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Meeting {
  id: number
  title: string
  status: string
  created_at: string
  overview: string | null
}

export default function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  async function load() {
    try {
      const res  = await fetch('/api/meetings')
      if (!res.ok) { setError(await res.text()); setLoading(false); return }
      const data = await res.json()
      if (!Array.isArray(data)) { setError(JSON.stringify(data)); setLoading(false); return }
      setMeetings(data)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const hasProcessing = meetings.some(m => m.status === 'processing')
    if (!hasProcessing) return
    const t = setInterval(load, 8000)
    return () => clearInterval(t)
  }, [meetings])

  return (
    <div className="mesh-bg min-h-screen">
      <Navbar active="dashboard" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="animate-fade-up flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-[var(--font-syne)] text-white mb-1">
              My Meetings
            </h1>
            <p className="text-slate-500 text-sm">
              {meetings.length > 0 ? `${meetings.length} recording${meetings.length !== 1 ? 's' : ''}` : 'No recordings yet'}
            </p>
          </div>
          <Link href="/record"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transform">
            + New Meeting
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-5 w-1/3 bg-white/5 rounded-lg mb-3" />
                <div className="h-3 w-1/5 bg-white/5 rounded-lg mb-4" />
                <div className="h-3 w-2/3 bg-white/5 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="glass-blue rounded-2xl p-6 text-red-400 text-sm font-mono">
            <p className="font-semibold mb-2 text-red-300">Error loading meetings</p>
            <p>{error}</p>
            <button onClick={load} className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-sm hover:bg-red-500/30 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && meetings.length === 0 && (
          <div className="text-center py-24 animate-fade-up">
            <div className="text-6xl mb-4 animate-float inline-block">🎙</div>
            <h2 className="text-xl font-bold text-white font-[var(--font-syne)] mb-2">No meetings yet</h2>
            <p className="text-slate-500 mb-8">Record or upload your first meeting to get started</p>
            <Link href="/record"
              className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20">
              Start Recording
            </Link>
          </div>
        )}

        {/* Meetings list */}
        {!loading && !error && meetings.length > 0 && (
          <div className="flex flex-col gap-3">
            {meetings.map((m, i) => (
              <div key={m.id}
                className={`glass rounded-2xl p-6 card-hover animate-fade-up stagger-${Math.min(i + 1, 5)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white truncate">{m.title}</h3>
                      <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium border ${
                        m.status === 'done'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : m.status === 'processing'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {m.status === 'processing' ? '⏳ Processing' : m.status === 'done' ? '✓ Done' : '✕ Failed'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                    {m.overview && (
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{m.overview}</p>
                    )}
                    {m.status === 'processing' && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'0ms'}} />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'150ms'}} />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'300ms'}} />
                        </div>
                        <span className="text-xs text-blue-400">Transcribing...</span>
                      </div>
                    )}
                  </div>
                  {m.status === 'done' && (
                    <Link href={`/dashboard/meeting/${m.id}`}
                      className="flex-shrink-0 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 hover:text-blue-300 transition-all whitespace-nowrap">
                      View →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}