'use client'
import { UserButton } from '@clerk/nextjs'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

const SUGGESTIONS = [
  'What were the action items?',
  'What decisions were made?',
  'What are the key risks?',
  'What are the next steps?',
  'Summarise all my meetings',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(question?: string) {
    const q = (question || input).trim()
    if (!q || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })

      const data = await res.json()
      const answer = data.answer || 'No answer returned.'
      const sources = (data.sources || [])
        .map((s: any) => s.title)
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: answer, sources },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error: ' + err.message },
      ])
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <nav className="bg-green-600 text-white px-8 py-4 flex justify-between items-center flex-shrink-0">
        <Link href="/dashboard" className="text-xl font-bold">🧠 BriefBuddy</Link>
        <div className="flex items-center gap-6">
          <Link href="/record" className="text-sm opacity-85 hover:opacity-100">+ New</Link>
          <Link href="/dashboard" className="text-sm opacity-85 hover:opacity-100">Meetings</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto p-6 gap-4">

        {/* Suggestions */}
        {messages.length === 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-3">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-2 bg-white border border-green-200 rounded-full text-sm text-green-700 hover:bg-green-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-300 text-lg">Ask anything about your meetings</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                }`}>
                  {m.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br/>}</span>
                  ))}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <p className="text-xs text-gray-400 px-1">
                    📎 {m.sources.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl shadow-sm flex gap-3 p-3 flex-shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about your meetings..."
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm outline-none text-gray-800 placeholder-gray-300"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}