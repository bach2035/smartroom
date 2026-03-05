import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KNOWLEDGE_CHUNKS } from '@/lib/knowledge-base'
import Groq from 'groq-sdk'

const SYSTEM_PROMPT = `You are the support assistant for "Smart School" — a university web app.

IMPORTANT RULES:
- ONLY answer based on the CONTEXT provided below. Do NOT use outside knowledge.
- If the context does not contain the answer, say: "I'm not sure about that. Please contact your admin for help."
- NEVER invent or guess features, buttons, or pages that are not in the context.
- Match the user's language (Vietnamese or English).
- Keep answers short and clear.
- For "how to" questions, use numbered steps (1. 2. 3.).
- Use **bold** for button names, page names, and important terms.
- Use bullet points (- ) for listing multiple items.
- Be friendly and helpful.`

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

function getAllContext(): string {
  return KNOWLEDGE_CHUNKS.map((c) => c.content).join('\n\n')
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Support chat is not configured' }, { status: 503 })
    }

    const { message, history } = await request.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const context = getAllContext()
    const systemMessage = `${SYSTEM_PROMPT}\n\nCONTEXT (use ONLY this to answer):\n${context}`

    const messages = [
      { role: 'system' as const, content: systemMessage },
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 500,
      temperature: 0.3,
    })

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Support chat error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
