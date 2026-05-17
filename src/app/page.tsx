import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()

  // Already signed in → go straight to dashboard
  if (userId) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-green-800 mb-3">🧠 BriefBuddy</h1>
        <p className="text-gray-500 text-lg">Your AI-powered meeting assistant</p>
        <p className="text-gray-400 text-sm mt-1">Record · Transcribe · Summarise · Ask</p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-xl font-medium hover:bg-green-50 transition-colors"
        >
          Sign Up Free
        </Link>
      </div>

      <div className="flex gap-8 text-sm text-gray-400 mt-4">
        <span>✅ Browser recording</span>
        <span>✅ AI summaries</span>
        <span>✅ Ask questions</span>
      </div>
    </div>
  )
}