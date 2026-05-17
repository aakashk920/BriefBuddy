import fs from 'fs'
import path from 'path'
import https from 'https'
import Groq from 'groq-sdk'
import { Client } from '@gradio/client'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

let hfClient: any = null

async function getHFClient() {
  if (!hfClient) {
    hfClient = await Client.connect('niharika65/briefBuddy')
  }
  return hfClient
}

// 1. TRANSCRIBE — HF Space first, Groq Whisper fallback
export async function transcribe(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath)
  const tempPath = absolutePath + '.mp3'
  fs.copyFileSync(absolutePath, tempPath)

  try {
    const client = await getHFClient()
    const fileBuffer = fs.readFileSync(tempPath)
    const blob = new Blob([fileBuffer], { type: 'audio/mpeg' })

    const result = await client.predict('/transcribe_audio', {
      audio_path: blob
    })

    const data: any = (result as any).data || result
    const text = data[0]

    const isError =
      typeof text !== 'string' ||
      text.length === 0 ||
      text === 'Error' ||
      text.toLowerCase().startsWith('an error occurred')

    if (!isError) {
      console.log('HF Space transcription done. Language:', data[1])
      fs.unlinkSync(tempPath)
      return text
    }

    console.log('HF Space returned error, switching to Groq Whisper...')
  } catch (err: any) {
    console.log('HF Space error:', err.message, '— switching to Groq Whisper...')
  }

  // Groq Whisper fallback
  try {
    const response = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-large-v3-turbo',
      response_format: 'text',
    })
    console.log('Groq Whisper transcription done')
    return typeof response === 'string' ? response : (response as any).text
  } finally {
    try { fs.unlinkSync(tempPath) } catch {}
  }
}

// 2. SUMMARISE — Groq Llama
export async function summarise(transcript: string) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `Analyse this meeting transcript and return ONLY valid JSON:
{
  "overview": "2-3 sentence summary",
  "action_items": [{"owner": "", "task": "", "deadline": ""}],
  "decisions": ["string"],
  "risks": ["string"],
  "next_steps": ["string"]
}

Transcript:
${transcript}`,
      },
    ],
  })
  return JSON.parse(response.choices[0].message.content!)
}

// 3. EMBED — HuggingFace free inference (384 dims)
export async function embed(text: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ inputs: text })
    const options = {
      hostname: 'router.huggingface.co',
      path: '/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          const vector = Array.isArray(parsed[0]) ? parsed[0] : parsed
          if (!Array.isArray(vector) || vector.length === 0) {
            reject(new Error('Unexpected HF response: ' + JSON.stringify(parsed).slice(0, 200)))
          } else {
            resolve(vector)
          }
        } catch (e) {
          reject(new Error('Failed to parse HF response: ' + data.slice(0, 200)))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// 4. CHUNK transcript into ~300 word pieces with 30-word overlap
export function chunkText(text: string, chunkSize = 300): string[] {
  const words = text.split(' ')
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += chunkSize - 30) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim()) chunks.push(chunk)
  }
  return chunks
}

export { groq }