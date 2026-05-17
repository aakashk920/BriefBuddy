import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { pool, initDB } from '@/lib/db'
import { transcribe, summarise, embed, chunkText } from '@/lib/ai'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import fs from 'fs'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await initDB()

    const { rows } = await pool.query(
      `SELECT id, title, status, created_at, summary->>'overview' AS overview
       FROM meetings WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    )

    return NextResponse.json(rows)
  } catch (err: any) {
    console.error('GET /api/meetings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await initDB()

    // Parse form data using Next.js native API (no multer needed)
    let formData: FormData
    try {
      formData = await req.formData()
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 })
    }

    const title = (formData.get('title') as string) || 'Untitled Meeting'
    const file = formData.get('audio') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    console.log('Received file:', file.name, 'size:', file.size, 'type:', file.type)

    // Save file to uploads/
    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const ext = file.name.split('.').pop() || 'webm'
    const fileName = `${Date.now()}-${userId}.${ext}`
    const filePath = path.join(uploadsDir, fileName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    console.log('File saved to:', filePath)

    // Insert meeting row immediately and return ID
    const { rows } = await pool.query(
      `INSERT INTO meetings (user_id, title, audio_path, status)
       VALUES ($1, $2, $3, 'processing') RETURNING id`,
      [userId, title, filePath]
    )
    const meetingId = rows[0].id

    console.log('Meeting created with ID:', meetingId)

    // Process async — after response is sent
    setImmediate(async () => {
      try {
        console.log('Starting transcription for meeting:', meetingId)
        const transcript = await transcribe(filePath)
        console.log('Transcription done, length:', transcript.length)

        const summary = await summarise(transcript)
        console.log('Summary done')

        await pool.query(
          `UPDATE meetings SET transcript=$1, summary=$2, status='done' WHERE id=$3`,
          [transcript, JSON.stringify(summary), meetingId]
        )

        const chunks = chunkText(transcript)
        console.log('Embedding', chunks.length, 'chunks')

        for (let i = 0; i < chunks.length; i++) {
          const vector = await embed(chunks[i])
          await pool.query(
            `INSERT INTO chunks (meeting_id, user_id, content, embedding, chunk_index)
             VALUES ($1, $2, $3, $4::vector, $5)`,
            [meetingId, userId, chunks[i], JSON.stringify(vector), i]
          )
        }

        console.log(`Meeting ${meetingId} fully processed`)
      } catch (err) {
        console.error('Processing failed for meeting', meetingId, err)
        await pool.query(
          `UPDATE meetings SET status='failed' WHERE id=$1`,
          [meetingId]
        )
      }
    })

    // Return immediately with the meeting ID
    return NextResponse.json({ id: meetingId, status: 'processing' })

  } catch (err: any) {
    console.error('POST /api/meetings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}