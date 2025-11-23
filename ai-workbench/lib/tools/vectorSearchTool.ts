/**
 * Vector Search Tool
 * ONLY for searching vectorized documents in Qdrant
 * DO NOT use this for reading local/raw documents
 */

import { getQdrantClient } from '../qdrant';
import { generateEmbedding } from '../embeddings';
import { RetrievalResult, VectorSearchLog } from '@/types';

export interface VectorSearchParams {
  query: string;
  collectionName: string;
  limit?: number;
  scoreThreshold?: number;
  filters?: Record<string, any>;
}

/**
 * Search for similar documents in Qdrant
 * This tool ONLY works with vectorized documents
 */
export async function vectorSearchTool(
  params: VectorSearchParams
): Promise<VectorSearchLog> {
  const { query, collectionName, limit = 5, scoreThreshold = 0.7, filters } = params;

  const startTime = Date.now();

  try {
    // Step 1: Generate embedding for the query
    const embeddingStart = Date.now();
    const queryEmbedding = await generateEmbedding(query);
    const embeddingDurationMs = Date.now() - embeddingStart;

    // Step 2: Search Qdrant
    const searchStart = Date.now();
    const client = getQdrantClient();

    const searchParams: any = {
      vector: queryEmbedding,
      limit,
      score_threshold: scoreThreshold,
    };

    // Add filters if provided
    if (filters && Object.keys(filters).length > 0) {
      searchParams.filter = {
        must: Object.entries(filters).map(([key, value]) => ({
          key,
          match: { value },
        })),
      };
    }

    const searchResult = await client.search(collectionName, searchParams);
    const searchDurationMs = Date.now() - searchStart;

    // Step 3: Format results
    const results: RetrievalResult[] = searchResult.map(point => ({
      id: String(point.id),
      score: point.score || 0,
      content: point.payload?.content as string || '',
      metadata: point.payload?.metadata as any || {},
      chunkIndex: point.payload?.chunkIndex as number || 0,
      documentId: point.payload?.documentId as string || '',
    }));

    const totalDurationMs = Date.now() - startTime;

    return {
      query,
      collection: collectionName,
      filters,
      limit,
      scoreThreshold,
      results,
      durationMs: totalDurationMs,
      embeddingDurationMs,
      searchDurationMs,
    };
  } catch (error) {
    console.error('Vector search error:', error);

    return {
      query,
      collection: collectionName,
      filters,
      limit,
      scoreThreshold,
      results: [],
      durationMs: Date.now() - startTime,
      embeddingDurationMs: 0,
      searchDurationMs: 0,
    };
  }
}

/**
 * Batch vector search for multiple queries
 */
export async function batchVectorSearch(
  queries: string[],
  collectionName: string,
  options?: {
    limit?: number;
    scoreThreshold?: number;
    filters?: Record<string, any>;
  }
): Promise<VectorSearchLog[]> {
  return Promise.all(
    queries.map(query =>
      vectorSearchTool({
        query,
        collectionName,
        ...options,
      })
    )
  );
}
