const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'
const HF_API_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${EMBEDDING_MODEL}`

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(HF_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Embedding API error: ${res.status} ${error}`)
  }

  const embedding = await res.json()
  return embedding as number[]
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await fetch(HF_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Embedding API error: ${res.status} ${error}`)
  }

  return await res.json()
}

export const EMBEDDING_DIMENSIONS = 384
