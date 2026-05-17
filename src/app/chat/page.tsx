'use client'
import Navbar from '@/components/Navbar'
import { useState, useRef, useEffect } from 'react'

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
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(question?: string) {
    const q = (question || input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      const answer  = data.answer || 'No answer returned.'
      const sources = (data.sources || [])
        .map((s: any) => s.title)
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
      setMessages(prev => [...prev, { role: 'assistant', content: answer, sources }])
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + e.message }])
    }
    setLoading(false)
  }

  return (
    <div className="mesh-bg min-h-screen flex flex-col">
      <Navbar active="chat" />

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6 py-6 gap-4">

        {/* Suggestions */}
        {messages.length === 0 && (
          <div className="animate-fade-up">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-3">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="glass px-4 py-2 rounded-full text-sm text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-16">
              <div className="text-5xl animate-float">💬</div>
              <h2 className="text-xl font-bold font-[var(--font-syne)] text-white">
                Ask anything about your meetings
              </h2>
              <p className="text-slate-500 text-sm max-w-sm">
                Query across all your recordings — action items, decisions, risks, and more.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex animate-fade-up ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-blue-500/20'
                    : 'glass text-slate-300 rounded-bl-sm'
                }`}>
                  {m.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br/>}</span>
                  ))}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <p className="text-xs text-slate-600 px-1">
                    📎 {m.sources.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass px-5 py-4 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'0ms'}} />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'150ms'}} />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'300ms'}} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="glass rounded-2xl flex gap-3 p-3 flex-shrink-0 animate-fade-up">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about your meetings..."
            disabled={loading}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:from-blue-400 hover:to-indigo-500 transition-all shadow-md shadow-blue-500/20">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}