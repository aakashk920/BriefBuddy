'use client'
import Navbar from '@/components/Navbar'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function RecordPage() {
  const router = useRouter()
  const [title, setTitle]               = useState('')
  const [tab, setTab]                   = useState<'record'|'upload'>('record')
  const [recording, setRecording]       = useState(false)
  const [recordingBlob, setRecordingBlob] = useState<Blob|null>(null)
  const [seconds, setSeconds]           = useState(0)
  const [status, setStatus]             = useState<string|null>(null)
  const [statusType, setStatusType]     = useState<'info'|'success'|'error'>('info')
  const [uploading, setUploading]       = useState(false)

  const mrRef    = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout|null>(null)

  const fmt = (s: number) =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  async function toggleRecord() {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        setRecordingBlob(new Blob(chunksRef.current, { type: 'audio/webm' }))
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mrRef.current = mr
      setSeconds(0)
      setRecording(true)
      setRecordingBlob(null)
      timerRef.current = setInterval(() => setSeconds(s => s+1), 1000)
    } else {
      mrRef.current?.stop()
      if (timerRef.current) clearInterval(timerRef.current)
      setRecording(false)
    }
  }

  async function processFile(file: File) {
    setUploading(true)
    setStatus('Uploading...')
    setStatusType('info')
    try {
      const fd = new FormData()
      fd.append('audio', file)
      fd.append('title', title || 'Untitled Meeting')
      const res = await fetch('/api/meetings', { method: 'POST', body: fd })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Upload failed') }
      const { id } = await res.json()
      if (!id) throw new Error('No meeting ID returned')
      setStatus('Transcribing with Whisper AI...')
      const interval = setInterval(async () => {
        try {
          const r = await fetch(`/api/meetings/${id}/status`)
          const { status: s } = await r.json()
          if (s === 'done') {
            clearInterval(interval)
            setStatus('Complete! Redirecting...')
            setStatusType('success')
            setUploading(false)
            setTimeout(() => router.push(`/dashboard/meeting/${id}`), 1200)
          } else if (s === 'failed') {
            clearInterval(interval)
            setStatus('Processing failed — check server logs')
            setStatusType('error')
            setUploading(false)
          }
        } catch {}
      }, 5000)
    } catch (e: any) {
      setStatus('Error: ' + e.message)
      setStatusType('error')
      setUploading(false)
    }
  }

  return (
    <div className="mesh-bg min-h-screen">
      <Navbar active="record" />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="animate-fade-up mb-8">
          <h1 className="text-3xl font-extrabold font-[var(--font-syne)] text-white mb-1">New Meeting</h1>
          <p className="text-slate-500 text-sm">Record directly in your browser or upload an audio file</p>
        </div>

        {/* Title input */}
        <div className="animate-fade-up stagger-1 glass rounded-2xl p-6 mb-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Meeting Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Q3 Planning Call"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="animate-fade-up stagger-2 glass rounded-2xl overflow-hidden mb-4">
          <div className="flex border-b border-white/5">
            {(['record','upload'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                  tab === t
                    ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}>
                {t === 'record' ? '🎙 Record' : '📁 Upload File'}
              </button>
            ))}
          </div>

          <div className="p-8">
            {tab === 'record' && (
              <div className="flex flex-col items-center gap-5">
                {/* Record button */}
                <button onClick={toggleRecord} disabled={uploading}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all border-2 ${
                    recording
                      ? 'bg-red-500/10 border-red-500/40 text-red-400 animate-record'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50'
                  } disabled:opacity-50`}>
                  {recording ? '⏹' : '🎙'}
                </button>

                <div className={`text-4xl font-bold font-[var(--font-syne)] tracking-widest ${
                  recording ? 'text-red-400' : 'text-white'
                }`}>
                  {fmt(seconds)}
                </div>

                <p className="text-sm text-slate-500">
                  {recording ? 'Recording — click to stop'
                    : recordingBlob ? '✓ Recording ready'
                    : 'Click to start recording'}
                </p>

                {recordingBlob && !recording && (
                  <button onClick={() => processFile(new File([recordingBlob], 'recording.webm', {type:'audio/webm'}))}
                    disabled={uploading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-400 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
                    {uploading ? 'Processing...' : 'Process Recording'}
                  </button>
                )}
              </div>
            )}

            {tab === 'upload' && (
              <div className="flex flex-col gap-4">
                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/10 rounded-2xl p-10 cursor-pointer hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
                  <span className="text-4xl group-hover:animate-float">📁</span>
                  <span className="text-sm text-slate-400 text-center">
                    Drop your audio or video file here<br/>
                    <span className="text-slate-600 text-xs">MP3, MP4, WAV, WEBM, M4A supported</span>
                  </span>
                  <input type="file" accept="audio/*,video/*" className="hidden"
                    disabled={uploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        {status && (
          <div className={`animate-fade-in rounded-2xl p-4 text-sm flex items-start gap-3 ${
            statusType === 'success' ? 'glass-blue text-emerald-400 border border-emerald-500/20' :
            statusType === 'error'   ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                       'glass-blue text-blue-300'
          }`}>
            <span className="text-lg mt-0.5">
              {statusType === 'success' ? '✅' : statusType === 'error' ? '❌' : '⏳'}
            </span>
            <div>
              <p>{status}</p>
              {statusType === 'info' && uploading && (
                <p className="text-xs text-slate-500 mt-1">This takes 1–3 min per hour of audio</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}