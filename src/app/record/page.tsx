'use client'
import { UserButton } from '@clerk/nextjs'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RecordPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record')
  const [recording, setRecording] = useState(false)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info')
  const [uploading, setUploading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function pad(n: number) {
    return String(n).padStart(2, '0')
  }

  function formatTime(s: number) {
    return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
  }

  async function toggleRecord() {
    if (!recording) {
      // Start
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecordingBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setSeconds(0)
      setRecording(true)
      setRecordingBlob(null)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      // Stop
      mediaRecorderRef.current?.stop()
      if (timerRef.current) clearInterval(timerRef.current)
      setRecording(false)
    }
  }

  async function processFile(file: File) {
    if (!file) return
    setUploading(true)
    setStatus('Uploading...')
    setStatusType('info')

    try {
      const fd = new FormData()
      fd.append('audio', file)
      fd.append('title', title || 'Untitled Meeting')

      const res = await fetch('/api/meetings', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      const { id } = await res.json()
      if (!id) throw new Error('No meeting ID returned')

      setStatus(`Processing meeting #${id}... Whisper is transcribing, this takes 1-2 min.`)

      const interval = setInterval(async () => {
        try {
          const r = await fetch(`/api/meetings/${id}/status`)
          const { status: s } = await r.json()
          if (s === 'done') {
            clearInterval(interval)
            setStatus('Done! Redirecting to your meeting...')
            setStatusType('success')
            setUploading(false)
            setTimeout(() => router.push(`/dashboard/meeting/${id}`), 1500)
          } else if (s === 'failed') {
            clearInterval(interval)
            setStatus('Processing failed — check server logs')
            setStatusType('error')
            setUploading(false)
          }
        } catch {}
      }, 5000)
    } catch (err: any) {
      setStatus('Error: ' + err.message)
      setStatusType('error')
      setUploading(false)
    }
  }

  async function submitRecording() {
    if (!recordingBlob) return
    const file = new File([recordingBlob], 'recording.webm', { type: 'audio/webm' })
    await processFile(file)
  }

  async function submitUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await processFile(file)
  }

  return (
    <div className="min-h-screen bg-green-50">
      <nav className="bg-green-600 text-white px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold">🧠 BriefBuddy</Link>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm opacity-85 hover:opacity-100">Meetings</Link>
          <Link href="/chat" className="text-sm opacity-85 hover:opacity-100">Ask AI</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="max-w-lg mx-auto p-8">
        <h2 className="text-2xl font-bold text-green-800 mb-6">New Meeting</h2>

        {/* Title */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
          <label className="block text-sm text-gray-500 mb-2">Meeting Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q3 Planning Call"
            className="w-full px-4 py-2 border border-green-200 rounded-lg text-sm outline-none focus:border-green-500"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="flex border-b border-gray-100">
            {(['record', 'upload'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === tab
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'record' ? '🎙 Record' : '📁 Upload File'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'record' && (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={toggleRecord}
                  disabled={uploading}
                  className={`w-24 h-24 rounded-full text-4xl flex items-center justify-center border-none cursor-pointer transition-all ${
                    recording
                      ? 'bg-red-100 text-red-500 animate-pulse'
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {recording ? '⏹' : '🎙'}
                </button>

                <div className="text-3xl font-bold text-green-800 tracking-widest">
                  {formatTime(seconds)}
                </div>

                <p className="text-sm text-gray-400">
                  {recording
                    ? 'Recording... click to stop'
                    : recordingBlob
                    ? 'Recording ready — click Process below'
                    : 'Click to start recording'}
                </p>

                {recordingBlob && !recording && (
                  <button
                    onClick={submitRecording}
                    disabled={uploading}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300"
                  >
                    {uploading ? 'Processing...' : 'Process Recording'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="flex flex-col gap-4">
                <label className="block text-sm text-gray-500">Audio or Video File</label>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  disabled={uploading}
                  onChange={submitUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        {status && (
          <div className={`p-4 rounded-xl text-sm ${
            statusType === 'success' ? 'bg-green-100 text-green-800' :
            statusType === 'error'   ? 'bg-red-100 text-red-800' :
                                       'bg-yellow-50 text-yellow-800'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  )
}