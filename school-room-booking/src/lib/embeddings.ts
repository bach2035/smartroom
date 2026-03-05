import { KNOWLEDGE_CHUNKS } from '@/lib/knowledge-base'

/**
 * Simple keyword-based search over knowledge chunks.
 * No external API needed — works offline and instantly.
 */
export function findRelevantChunks(query: string, maxResults = 4): string[] {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)

  const scored = KNOWLEDGE_CHUNKS.map((chunk) => {
    const text = `${chunk.topic} ${chunk.content}`.toLowerCase()
    let score = 0
    for (const word of queryWords) {
      if (text.includes(word)) score++
    }
    // Boost for topic match
    const topicText = chunk.topic.toLowerCase()
    for (const word of queryWords) {
      if (topicText.includes(word)) score += 2
    }
    return { content: chunk.content, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.content)
}
