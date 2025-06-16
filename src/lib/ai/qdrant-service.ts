import { QdrantClient } from '@qdrant/js-client-rest'
import { OpenAIEmbeddings } from '@langchain/openai'
import { QdrantVectorStore } from '@langchain/community/vectorstores/qdrant'
import { Document } from '@langchain/core/documents'

export interface ConversationDocument {
  id: string
  sessionId: string
  content: string
  metadata: {
    phase: string
    step: number
    role: 'user' | 'assistant'
    timestamp: string
    category: string
    extractedData?: Record<string, any>
  }
}

export interface SimilarityResult {
  document: ConversationDocument
  score: number
  sessionId: string
}

export class QdrantService {
  private client: QdrantClient
  private embeddings: OpenAIEmbeddings | null = null
  private vectorStore: QdrantVectorStore | null = null
  private readonly COLLECTION_NAME = 'scalemate_conversations'
  private readonly VECTOR_SIZE = 1536 // OpenAI text-embedding-3-small

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    })
  }

  private getEmbeddings(): OpenAIEmbeddings {
    if (!this.embeddings) {
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY!,
        modelName: 'text-embedding-3-small',
        dimensions: this.VECTOR_SIZE,
      })
    }
    return this.embeddings
  }

  async initialize(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections()
      const collectionExists = collections.collections.some(
        (col) => col.name === this.COLLECTION_NAME
      )

      if (!collectionExists) {
        await this.createCollection()
      }

      // Initialize vector store
      this.vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.getEmbeddings(),
        {
          client: this.client,
          collectionName: this.COLLECTION_NAME,
        }
      )

      console.log('✅ Qdrant service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Qdrant service:', error)
      throw error
    }
  }

  private async createCollection(): Promise<void> {
    await this.client.createCollection(this.COLLECTION_NAME, {
      vectors: {
        size: this.VECTOR_SIZE,
        distance: 'Cosine',
      },
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 1,
    })

    // Create payload indexes for efficient filtering
    await this.client.createPayloadIndex(this.COLLECTION_NAME, {
      field_name: 'sessionId',
      field_schema: 'keyword',
    })

    await this.client.createPayloadIndex(this.COLLECTION_NAME, {
      field_name: 'phase',
      field_schema: 'keyword',
    })

    await this.client.createPayloadIndex(this.COLLECTION_NAME, {
      field_name: 'category',
      field_schema: 'keyword',
    })

    console.log('✅ Qdrant collection created with indexes')
  }

  async addConversationDocument(doc: ConversationDocument): Promise<void> {
    if (!this.vectorStore) {
      await this.initialize()
    }

    const document = new Document({
      pageContent: doc.content,
      metadata: {
        id: doc.id,
        sessionId: doc.sessionId,
        ...doc.metadata,
      },
    })

    await this.vectorStore!.addDocuments([document])
  }

  async addConversationDocuments(docs: ConversationDocument[]): Promise<void> {
    if (!this.vectorStore) {
      await this.initialize()
    }

    const documents = docs.map(
      (doc) =>
        new Document({
          pageContent: doc.content,
          metadata: {
            id: doc.id,
            sessionId: doc.sessionId,
            ...doc.metadata,
          },
        })
    )

    await this.vectorStore!.addDocuments(documents)
  }

  async searchSimilarConversations(
    query: string,
    options: {
      limit?: number
      threshold?: number
      sessionId?: string
      phase?: string
      category?: string
      excludeSessionId?: string
    } = {}
  ): Promise<SimilarityResult[]> {
    if (!this.vectorStore) {
      await this.initialize()
    }

    const {
      limit = 10,
      threshold = 0.7,
      sessionId,
      phase,
      category,
      excludeSessionId,
    } = options

    // Build filter conditions
    const filter: any = {}
    
    if (sessionId) {
      filter.sessionId = sessionId
    }
    
    if (phase) {
      filter.phase = phase
    }
    
    if (category) {
      filter.category = category
    }

    if (excludeSessionId) {
      filter.sessionId = { $ne: excludeSessionId }
    }

    const results = await this.vectorStore!.similaritySearchWithScore(
      query,
      limit,
      Object.keys(filter).length > 0 ? filter : undefined
    )

    return results
      .filter(([, score]) => score >= threshold)
      .map(([doc, score]) => ({
        document: {
          id: doc.metadata.id,
          sessionId: doc.metadata.sessionId,
          content: doc.pageContent,
          metadata: doc.metadata,
        },
        score,
        sessionId: doc.metadata.sessionId,
      }))
  }

  async findSimilarSessions(
    query: string,
    excludeSessionId?: string,
    limit: number = 5
  ): Promise<Array<{ sessionId: string; similarity: number; matchingContent: string[] }>> {
    const results = await this.searchSimilarConversations(query, {
      limit: limit * 3,
      threshold: 0.6,
      excludeSessionId,
    })

    // Group by session and calculate average similarity
    const sessionGroups = new Map<string, { similarities: number[]; content: string[] }>()

    for (const result of results) {
      if (!sessionGroups.has(result.sessionId)) {
        sessionGroups.set(result.sessionId, { similarities: [], content: [] })
      }

      const group = sessionGroups.get(result.sessionId)!
      group.similarities.push(result.score)
      group.content.push(result.document.content)
    }

    return Array.from(sessionGroups.entries())
      .map(([sessionId, group]) => ({
        sessionId,
        similarity: group.similarities.reduce((a, b) => a + b, 0) / group.similarities.length,
        matchingContent: group.content.slice(0, 3),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  }

  async getConversationContext(
    sessionId: string,
    query: string,
    limit: number = 5
  ): Promise<SimilarityResult[]> {
    return await this.searchSimilarConversations(query, {
      sessionId,
      limit,
      threshold: 0.5,
    })
  }

  async clusterConversations(
    sessionId: string,
    threshold: number = 0.8
  ): Promise<Array<{ cluster: SimilarityResult[]; centroid: string }>> {
    // Get all documents for the session
    const allDocs = await this.searchSimilarConversations('', {
      sessionId,
      limit: 100,
      threshold: 0.0,
    })

    if (allDocs.length === 0) return []

    // Simple clustering algorithm
    const clusters: Array<{ cluster: SimilarityResult[]; centroid: string }> = []
    const processed = new Set<string>()

    for (const doc of allDocs) {
      if (processed.has(doc.document.id)) continue

      const cluster: SimilarityResult[] = [doc]
      processed.add(doc.document.id)

      // Find similar documents
      for (const otherDoc of allDocs) {
        if (processed.has(otherDoc.document.id)) continue

        const similarity = await this.calculateSimilarity(
          doc.document.content,
          otherDoc.document.content
        )

        if (similarity >= threshold) {
          cluster.push(otherDoc)
          processed.add(otherDoc.document.id)
        }
      }

      // Create centroid (most representative content)
      const centroid = cluster.reduce((longest, current) =>
        current.document.content.length > longest.document.content.length ? current : longest
      ).document.content

      clusters.push({ cluster, centroid })
    }

    return clusters.sort((a, b) => b.cluster.length - a.cluster.length)
  }

  private async calculateSimilarity(text1: string, text2: string): Promise<number> {
    const [embedding1, embedding2] = await Promise.all([
      this.embeddings.embedQuery(text1),
      this.embeddings.embedQuery(text2),
    ])

    return this.cosineSimilarity(embedding1, embedding2)
  }

  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
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

  async getCollectionInfo(): Promise<any> {
    try {
      return await this.client.getCollection(this.COLLECTION_NAME)
    } catch (error) {
      console.error('Failed to get collection info:', error)
      return null
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(this.COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'sessionId',
            match: { value: sessionId },
          },
        ],
      },
    })
  }
}

// Export singleton instance
export const qdrantService = new QdrantService() 