import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEmbedding } from '@/lib/embeddings'
import Groq from 'groq-sdk'

const SYSTEM_PROMPT = `You are the support assistant for "Smart School" — a university web app.

IMPORTANT RULES:
- ONLY answer based on the CONTEXT provided below. Do NOT use outside knowledge.
- If the context does not contain the answer, say: "I'm not sure about that. Please contact your admin for help."
- NEVER invent or guess features, buttons, or pages that are not in the context.
- Match the user's language (Vietnamese or English).
- Keep answers short and clear. Use step-by-step format for "how to" questions.
- Be friendly and helpful.`

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

async function findRelevantContext(query: string): Promise<string> {
  try {
    const embedding = await getEmbedding(query)

    const { data, error } = await supabaseAdmin.rpc('match_support_knowledge', {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.3,
      match_count: 4,
    })

    if (error || !data?.length) {
      return ''
    }

    return data.map((d: { content: string }) => d.content).join('\n\n')
  } catch (error) {
    console.error('RAG search error:', error)
    return ''
  }
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

    // RAG: find relevant knowledge chunks
    const context = await findRelevantContext(message)

    const systemMessage = context
      ? `${SYSTEM_PROMPT}\n\nCONTEXT (use ONLY this to answer):\n${context}`
      : `${SYSTEM_PROMPT}\n\nNo relevant context found. Tell the user you're not sure and suggest contacting an admin.`

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
