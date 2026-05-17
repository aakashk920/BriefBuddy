'use client'
import Navbar from '@/components/Navbar'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface ActionItem { owner: string; task: string; deadline: string }
interface Summary {
  overview?: string
  action_items?: ActionItem[]
  decisions?: string[]
  risks?: string[]
  next_steps?: string[]
}
interface Meeting {
  id: number; title: string; status: string
  created_at: string; transcript: string; summary: Summary
}

function Section({ title, color, items, renderItem }: {
  title: string; color: string; items: any[]; renderItem: (item: any, i: number) => React.ReactNode
}) {
  return (
    <div className="glass rounded-2xl p-6 card-hover">
      <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${color}`}>{title}</h3>
      {items.length === 0
        ? <p className="text-sm text-slate-600">None identified</p>
        : <div className="flex flex-col gap-2">{items.map((item, i) => renderItem(item, i))}</div>
      }
    </div>
  )
}

export default function MeetingDetail() {
  const { id } = useParams() as { id: string }
  const [meeting, setMeeting]         = useState<Meeting|null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string|null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/meetings/${id}`)
      .then(async r => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then(data => { setMeeting(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="mesh-bg min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-4">
        {[1,2,3].map(i => <div key={i} className="glass rounded-2xl p-6 animate-pulse h-32" />)}
      </div>
    </div>
  )

  if (error || !meeting) return (
    <div className="mesh-bg min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10 text-center">
        <p className="text-red-400 mb-4">{error || 'Meeting not found'}</p>
        <Link href="/dashboard" className="text-blue-400 hover:underline">← Back to meetings</Link>
      </div>
    </div>
  )

  const s: Summary = typeof meeting.summary === 'string'
    ? JSON.parse(meeting.summary)
    : (meeting.summary || {})

  return (
    <div className="mesh-bg min-h-screen">
      <Navbar active="dashboard" />
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Back */}
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-400 transition-colors mb-6 group animate-fade-up">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to meetings
        </Link>

        {/* Title */}
        <div className="animate-fade-up stagger-1 mb-8">
          <h1 className="text-3xl font-extrabold font-[var(--font-syne)] text-white mb-2">
            {meeting.title}
          </h1>
          <p className="text-slate-500 text-sm">{new Date(meeting.created_at).toLocaleString()}</p>
        </div>

        {/* Overview */}
        {s.overview && (
          <div className="animate-fade-up stagger-2 glass-blue rounded-2xl p-6 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">📋 Overview</h3>
            <p className="text-slate-300 leading-relaxed">{s.overview}</p>
          </div>
        )}

        {/* Grid */}
        <div className="animate-fade-up stagger-3 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Section
            title="✅ Action Items"
            color="text-emerald-400"
            items={s.action_items || []}
            renderItem={(a, i) => (
              <div key={i} className="border-b border-white/5 py-3 last:border-0">
                <p className="text-sm text-slate-300">{a.task}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {a.owner && `Owner: ${a.owner}`}{a.deadline && ` · Due: ${a.deadline}`}
                </p>
              </div>
            )}
          />
          <Section
            title="🏛 Decisions"
            color="text-blue-400"
            items={s.decisions || []}
            renderItem={(d, i) => (
              <div key={i} className="flex gap-2 py-2 border-b border-white/5 last:border-0">
                <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                <p className="text-sm text-slate-300">{d}</p>
              </div>
            )}
          />
          <Section
            title="⚠️ Risks"
            color="text-red-400"
            items={s.risks || []}
            renderItem={(r, i) => (
              <div key={i} className="flex gap-2 py-2 border-b border-white/5 last:border-0">
                <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
                <p className="text-sm text-slate-300">{r}</p>
              </div>
            )}
          />
          <Section
            title="→ Next Steps"
            color="text-amber-400"
            items={s.next_steps || []}
            renderItem={(n, i) => (
              <div key={i} className="flex gap-2 py-2 border-b border-white/5 last:border-0">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span>
                <p className="text-sm text-slate-300">{n}</p>
              </div>
            )}
          />
        </div>

        {/* Transcript */}
        <div className="animate-fade-up stagger-4 glass rounded-2xl mb-6 overflow-hidden">
          <button onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <span>📝 Transcript</span>
            <span className="text-blue-400">{showTranscript ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showTranscript && (
            <div className="border-t border-white/5 px-6 pb-6 pt-4">
              <div className="max-h-80 overflow-y-auto text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                {meeting.transcript || 'No transcript available.'}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="animate-fade-up stagger-5">
          <Link href="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20">
            Ask AI about this meeting →
          </Link>
        </div>
      </div>
    </div>
  )
}