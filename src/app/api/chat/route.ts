import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { embed } from '@/lib/ai'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question, meetingId } = await req.json()
  if (!question) return NextResponse.json({ error: 'No question' }, { status: 400 })

  const qVec = await embed(question)

  let query = `
    SELECT c.content, m.title, m.created_at,
           1 - (c.embedding <=> $1::vector) AS similarity
    FROM chunks c JOIN meetings m ON m.id = c.meeting_id
    WHERE c.user_id = $2
  `
  const params: any[] = [JSON.stringify(qVec), userId]

  if (meetingId) {
    query += ` AND c.meeting_id = $3`
    params.push(meetingId)
  }
  query += ` ORDER BY c.embedding <=> $1::vector LIMIT 6`

  const { rows } = await pool.query(query, params)

  const context = rows.map((r, i) =>
    `[${i+1}] From "${r.title}" (${new Date(r.created_at).toDateString()}):\n${r.content}`
  ).join('\n\n')

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are BriefBuddy, an expert meeting analyst.
Answer ONLY from the provided transcript excerpts. Never make up information.
Be specific and concrete. Always mention which meeting the info came from.
If the answer is not in the excerpts, say: "I couldn't find that in your meetings."`
      },
      {
        role: 'user',
        content: `Excerpts:\n${context}\n\nQuestion: ${question}`
      }
    ]
  })

  return NextResponse.json({
    answer: response.choices[0].message.content,
    sources: rows
  })
}