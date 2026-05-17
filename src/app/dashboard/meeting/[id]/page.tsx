'use client'
import { UserButton } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface ActionItem {
  owner: string
  task: string
  deadline: string
}

interface Summary {
  overview?: string
  action_items?: ActionItem[]
  decisions?: string[]
  risks?: string[]
  next_steps?: string[]
}

interface Meeting {
  id: number
  title: string
  status: string
  created_at: string
  transcript: string
  summary: Summary
}

export default function MeetingDetail() {
  const params = useParams()
  const id = params.id as string
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/meetings/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text()
          throw new Error(`API error ${r.status}: ${text}`)
        }
        return r.json()
      })
      .then((data) => {
        setMeeting(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-400">Loading meeting...</p>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center flex-col gap-4">
        <p className="text-red-500">{error || 'Meeting not found'}</p>
        <Link href="/dashboard" className="text-green-600 hover:underline">← Back to meetings</Link>
      </div>
    )
  }

  const s: Summary = typeof meeting.summary === 'string'
    ? JSON.parse(meeting.summary)
    : (meeting.summary || {})

  return (
    <div className="min-h-screen bg-green-50">
      <nav className="bg-green-600 text-white px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold">🧠 BriefBuddy</Link>
        <div className="flex items-center gap-6">
          <Link href="/record" className="text-sm opacity-85 hover:opacity-100">+ New</Link>
          <Link href="/chat" className="text-sm opacity-85 hover:opacity-100">Ask AI</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        <Link href="/dashboard" className="text-green-600 text-sm mb-4 inline-block hover:underline">
          ← Back to meetings
        </Link>

        <h2 className="text-3xl font-bold text-green-800 mb-1">{meeting.title}</h2>
        <p className="text-sm text-gray-400 mb-8">
          {new Date(meeting.created_at).toLocaleString()}
        </p>

        {/* Overview */}
        {s.overview && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
            <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3">
              📋 Overview
            </h3>
            <p className="text-gray-700 leading-relaxed">{s.overview}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Action Items */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3">
              ✅ Action Items
            </h3>
            {!s.action_items?.length
              ? <p className="text-sm text-gray-400">None identified</p>
              : s.action_items.map((a, i) => (
                <div key={i} className="border-b border-gray-50 py-3 last:border-0">
                  <p className="text-sm text-gray-800">{a.task}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {a.owner && `Owner: ${a.owner}`}
                    {a.deadline && ` · Due: ${a.deadline}`}
                  </p>
                </div>
              ))
            }
          </div>

          {/* Decisions */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3">
              🏛 Decisions
            </h3>
            {!s.decisions?.length
              ? <p className="text-sm text-gray-400">None identified</p>
              : s.decisions.map((d, i) => (
                <div key={i} className="flex gap-2 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                  <p className="text-sm text-gray-700">{d}</p>
                </div>
              ))
            }
          </div>

          {/* Risks */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">
              ⚠️ Risks
            </h3>
            {!s.risks?.length
              ? <p className="text-sm text-gray-400">None identified</p>
              : s.risks.map((r, i) => (
                <div key={i} className="flex gap-2 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                  <p className="text-sm text-gray-700">{r}</p>
                </div>
              ))
            }
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-3">
              → Next Steps
            </h3>
            {!s.next_steps?.length
              ? <p className="text-sm text-gray-400">None identified</p>
              : s.next_steps.map((n, i) => (
                <div key={i} className="flex gap-2 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                  <p className="text-sm text-gray-700">{n}</p>
                </div>
              ))
            }
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center justify-between w-full text-xs font-semibold text-green-600 uppercase tracking-wide"
          >
            <span>📝 Transcript</span>
            <span>{showTranscript ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showTranscript && (
            <div className="mt-4 max-h-80 overflow-y-auto bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {meeting.transcript || 'No transcript available.'}
            </div>
          )}
        </div>

        <Link
          href="/chat"
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
        >
          Ask AI about this meeting →
        </Link>
      </div>
    </div>
  )
}