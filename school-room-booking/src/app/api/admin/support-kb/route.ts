import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEmbeddings } from '@/lib/embeddings'
import { KNOWLEDGE_CHUNKS } from '@/lib/knowledge-base'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear existing knowledge base
    await supabaseAdmin.from('support_knowledge').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Generate embeddings for all chunks
    const texts = KNOWLEDGE_CHUNKS.map((c) => c.content)
    const embeddings = await getEmbeddings(texts)

    // Insert chunks with embeddings
    const rows = KNOWLEDGE_CHUNKS.map((chunk, i) => ({
      topic: chunk.topic,
      content: chunk.content,
      embedding: JSON.stringify(embeddings[i]),
    }))

    const { error } = await supabaseAdmin.from('support_knowledge').insert(rows)

    if (error) {
      console.error('Error seeding knowledge base:', error)
      return NextResponse.json({ error: 'Failed to seed knowledge base' }, { status: 500 })
    }

    return NextResponse.json({ message: `Seeded ${rows.length} knowledge chunks` })
  } catch (error) {
    console.error('Error seeding KB:', error)
    return NextResponse.json({ error: 'Failed to seed knowledge base' }, { status: 500 })
  }
}
