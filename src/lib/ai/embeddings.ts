import OpenAI from 'openai'
import { db } from '@/lib/db'
import { conversationEmbeddings } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface EmbeddingResult {
  content: string
  embedding: number[]
  similarity: number
  category: string
  sessionId: string
}

export interface SimilaritySearchOptions {
  threshold?: number
  limit?: number
  categories?: string[]
  sessionId?: string
}

export class EmbeddingService {
  private readonly MODEL = 'text-embedding-3-small'
  private readonly DIMENSIONS = 1536
  private readonly DEFAULT_THRESHOLD = 0.7
  private readonly DEFAULT_LIMIT = 10

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.MODEL,
        input: text,
        dimensions: this.DIMENSIONS
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Failed to generate embedding:', error)
      throw new Error('Embedding generation failed')
    }
  }

  async storeEmbedding(
    sessionId: string,
    content: string,
    category: string,
    messageId?: string,
    tags?: Record<string, any>
  ): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(content)
      
      await db.insert(conversationEmbeddings).values({
        sessionId,
        messageId,
        content,
        embedding: JSON.stringify(embedding),
        embeddingModel: this.MODEL,
        dimensions: this.DIMENSIONS,
        category,
        tags
      })
    } catch (error) {
      console.error('Failed to store embedding:', error)
      throw new Error('Embedding storage failed')
    }
  }

  async findSimilarContent(
    queryText: string,
    options: SimilaritySearchOptions = {}
  ): Promise<EmbeddingResult[]> {
    const {
      threshold = this.DEFAULT_THRESHOLD,
      limit = this.DEFAULT_LIMIT,
      categories,
      sessionId
    } = options

    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(queryText)
      
      // Build SQL query for cosine similarity
      let query = db
        .select({
          content: conversationEmbeddings.content,
          embedding: conversationEmbeddings.embedding,
          category: conversationEmbeddings.category,
          sessionId: conversationEmbeddings.sessionId,
          similarity: sql<number>`1 - (${conversationEmbeddings.embedding}::vector <=> ${JSON.stringify(queryEmbedding)}::vector)`
        })
        .from(conversationEmbeddings)

      // Add filters
      const conditions = []
      
      if (sessionId) {
        conditions.push(eq(conversationEmbeddings.sessionId, sessionId))
      }
      
      if (categories && categories.length > 0) {
        conditions.push(sql`${conversationEmbeddings.category} = ANY(${categories})`)
      }

      if (conditions.length > 0) {
        query = query.where(sql`${conditions.join(' AND ')}`)
      }

      // Add similarity threshold and ordering
      query = query
        .where(sql`1 - (${conversationEmbeddings.embedding}::vector <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}`)
        .orderBy(sql`1 - (${conversationEmbeddings.embedding}::vector <=> ${JSON.stringify(queryEmbedding)}::vector) DESC`)
        .limit(limit)

      const results = await query

      return results.map(result => ({
        content: result.content,
        embedding: JSON.parse(result.embedding),
        similarity: result.similarity,
        category: result.category,
        sessionId: result.sessionId
      }))
    } catch (error) {
      console.error('Similarity search failed:', error)
      return []
    }
  }

  async findSimilarSessions(
    queryText: string,
    excludeSessionId?: string,
    limit: number = 5
  ): Promise<{ sessionId: string; similarity: number; matchingContent: string[] }[]> {
    try {
      const similarContent = await this.findSimilarContent(queryText, {
        threshold: 0.6,
        limit: limit * 3 // Get more results to group by session
      })

      // Group by session and calculate average similarity
      const sessionGroups = new Map<string, { similarities: number[]; content: string[] }>()

      for (const result of similarContent) {
        if (excludeSessionId && result.sessionId === excludeSessionId) continue

        if (!sessionGroups.has(result.sessionId)) {
          sessionGroups.set(result.sessionId, { similarities: [], content: [] })
        }

        const group = sessionGroups.get(result.sessionId)!
        group.similarities.push(result.similarity)
        group.content.push(result.content)
      }

      // Calculate average similarity and sort
      const sessionResults = Array.from(sessionGroups.entries())
        .map(([sessionId, group]) => ({
          sessionId,
          similarity: group.similarities.reduce((a, b) => a + b, 0) / group.similarities.length,
          matchingContent: group.content.slice(0, 3) // Top 3 matching pieces of content
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)

      return sessionResults
    } catch (error) {
      console.error('Failed to find similar sessions:', error)
      return []
    }
  }

  async getSessionEmbeddingSummary(sessionId: string): Promise<{
    totalEmbeddings: number
    categories: Record<string, number>
    averageContentLength: number
  }> {
    try {
      const embeddings = await db.query.conversationEmbeddings.findMany({
        where: eq(conversationEmbeddings.sessionId, sessionId)
      })

      const categories: Record<string, number> = {}
      let totalContentLength = 0

      for (const embedding of embeddings) {
        categories[embedding.category] = (categories[embedding.category] || 0) + 1
        totalContentLength += embedding.content.length
      }

      return {
        totalEmbeddings: embeddings.length,
        categories,
        averageContentLength: embeddings.length > 0 ? totalContentLength / embeddings.length : 0
      }
    } catch (error) {
      console.error('Failed to get embedding summary:', error)
      return {
        totalEmbeddings: 0,
        categories: {},
        averageContentLength: 0
      }
    }
  }

  async searchConversationHistory(
    query: string,
    sessionId: string,
    options: {
      phases?: string[]
      messageTypes?: string[]
      limit?: number
    } = {}
  ): Promise<EmbeddingResult[]> {
    const { phases, messageTypes, limit = 5 } = options

    const categories = phases || ['discovery', 'role_specification', 'qualification', 'quote_generation']

    return await this.findSimilarContent(query, {
      sessionId,
      categories,
      limit,
      threshold: 0.5
    })
  }

  async clusterSimilarContent(
    sessionId: string,
    threshold: number = 0.8
  ): Promise<Array<{ cluster: EmbeddingResult[]; centroid: string }>> {
    try {
      const embeddings = await db.query.conversationEmbeddings.findMany({
        where: eq(conversationEmbeddings.sessionId, sessionId)
      })

      if (embeddings.length === 0) return []

      // Simple clustering algorithm
      const clusters: Array<{ cluster: EmbeddingResult[]; centroid: string }> = []
      const processed = new Set<string>()

      for (const embedding of embeddings) {
        if (processed.has(embedding.id)) continue

        const cluster: EmbeddingResult[] = [{
          content: embedding.content,
          embedding: JSON.parse(embedding.embedding),
          similarity: 1.0,
          category: embedding.category,
          sessionId: embedding.sessionId
        }]

        processed.add(embedding.id)

        // Find similar embeddings
        for (const otherEmbedding of embeddings) {
          if (processed.has(otherEmbedding.id)) continue

          const similarity = this.calculateCosineSimilarity(
            JSON.parse(embedding.embedding),
            JSON.parse(otherEmbedding.embedding)
          )

          if (similarity >= threshold) {
            cluster.push({
              content: otherEmbedding.content,
              embedding: JSON.parse(otherEmbedding.embedding),
              similarity,
              category: otherEmbedding.category,
              sessionId: otherEmbedding.sessionId
            })
            processed.add(otherEmbedding.id)
          }
        }

        // Create centroid (most representative content)
        const centroid = cluster.reduce((longest, current) => 
          current.content.length > longest.content.length ? current : longest
        ).content

        clusters.push({ cluster, centroid })
      }

      return clusters.sort((a, b) => b.cluster.length - a.cluster.length)
    } catch (error) {
      console.error('Failed to cluster content:', error)
      return []
    }
  }

  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i]
      normA += vectorA[i] * vectorA[i]
      normB += vectorB[i] * vectorB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService()

// Export convenience function
export const generateEmbedding = (text: string) => embeddingService.generateEmbedding(text) 