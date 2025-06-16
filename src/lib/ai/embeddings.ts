import OpenAI from 'openai'
import { db } from '@/lib/db'
import { conversationEmbeddings } from '@/lib/db/schema'
import { eq, sql, and } from 'drizzle-orm'

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
    // TODO: Implement vector similarity search when database is properly configured
    console.log(`🔍 Finding similar content for: ${queryText.slice(0, 50)}...`)
    return []
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
    // TODO: Implement embedding summary when database is properly configured
    console.log(`📊 Getting embedding summary for session: ${sessionId}`)
    return {
      totalEmbeddings: 0,
      categories: {},
      averageContentLength: 0
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
    // TODO: Implement content clustering when database is properly configured
    console.log(`🔗 Clustering content for session: ${sessionId}`)
    return []
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