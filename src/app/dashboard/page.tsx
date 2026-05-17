'use client'
import { UserButton } from '@clerk/nextjs'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/meetings')

      if (!res.ok) {
        const text = await res.text()
        console.error('API error response:', text)
        setError(`API error ${res.status}: ${text}`)
        setLoading(false)
        return
      }

      const data = await res.json()

      // Guard: make sure it's an array before setting state
      if (!Array.isArray(data)) {
        console.error('Expected array, got:', data)
        setError('Unexpected response from server: ' + JSON.stringify(data))
        setLoading(false)
        return
      }

      setMeetings(data)
      setError(null)
    } catch (err: any) {
      console.error('Fetch failed:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Auto-refresh when any meeting is still processing
  useEffect(() => {
    const hasProcessing = meetings.some(m => m.status === 'processing')
    if (!hasProcessing) return
    const interval = setInterval(load, 8000)
    return () => clearInterval(interval)
  }, [meetings])

  return (
    <div className="min-h-screen bg-green-50">
      <nav className="bg-green-600 text-white px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🧠 BriefBuddy</h1>
        <div className="flex items-center gap-6">
          <Link href="/record" className="text-sm opacity-85 hover:opacity-100">
            + New Meeting
          </Link>
          <Link href="/chat" className="text-sm opacity-85 hover:opacity-100">
            Ask AI
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-2xl font-bold text-green-800 mb-6">My Meetings</h2>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-gray-400">
            <p>Loading your meetings...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            <p className="font-medium mb-1">Something went wrong</p>
            <p className="text-sm font-mono">{error}</p>
            <button
              onClick={load}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && meetings.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">🎙</p>
            <p className="text-lg mb-2">No meetings yet</p>
            <p className="text-sm mb-6">Record or upload your first meeting to get started</p>
            <Link
              href="/record"
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
            >
              + New Meeting
            </Link>
          </div>
        )}

        {/* Meetings list */}
        {!loading && !error && meetings.length > 0 && (
          <div className="flex flex-col gap-4">
            {meetings.map(m => (
              <div
                key={m.id}
                className="bg-white rounded-xl p-6 shadow-sm flex justify-between items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{m.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      m.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : m.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {m.status === 'processing' ? '⏳ processing' : m.status === 'done' ? '✅ done' : '❌ failed'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                  {m.overview && (
                    <p className="text-sm text-gray-600 leading-relaxed">{m.overview}</p>
                  )}
                  {m.status === 'processing' && (
                    <p className="text-sm text-yellow-600 mt-1">
                      Transcribing and summarising... this takes 1-2 min
                    </p>
                  )}
                </div>

                {m.status === 'done' && (
                  <Link
                    href={`/dashboard/meeting/${m.id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm whitespace-nowrap hover:bg-green-700 flex-shrink-0"
                  >
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}