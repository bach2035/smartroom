import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KNOWLEDGE_CHUNKS } from '@/lib/knowledge-base'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      message: `Knowledge base has ${KNOWLEDGE_CHUNKS.length} chunks (loaded from code, no seeding needed)`,
    })
  } catch (error) {
    console.error('Error checking KB:', error)
    return NextResponse.json({ error: 'Failed to check knowledge base' }, { status: 500 })
  }
}
