/**
 * Qdrant Client and Utilities
 * Handles all vector database operations
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import {
  QdrantCollection,
  VectorChunk,
  RetrievalParams,
  RetrievalResult,
  DocumentMetadata,
} from '@/types';

/**
 * Get Qdrant client instance
 */
export function getQdrantClient(): QdrantClient {
  const url = process.env.QDRANT_URL || 'http://localhost:6333';
  const apiKey = process.env.QDRANT_API_KEY;

  return new QdrantClient({
    url,
    apiKey,
  });
}

/**
 * List all collections
 */
export async function listCollections(): Promise<QdrantCollection[]> {
  const client = getQdrantClient();

  try {
    const response = await client.getCollections();

    return response.collections.map(col => ({
      name: col.name,
      vectorSize: 0, // Will be populated from collection info
      distance: 'Cosine' as const,
      pointsCount: 0,
      status: 'green' as const,
    }));
  } catch (error) {
    console.error('Error listing collections:', error);
    return [];
  }
}

/**
 * Get collection info
 */
export async function getCollectionInfo(collectionName: string): Promise<QdrantCollection | null> {
  const client = getQdrantClient();

  try {
    const info = await client.getCollection(collectionName);

    return {
      name: collectionName,
      vectorSize: info.config.params.vectors.size || 0,
      distance: info.config.params.vectors.distance as 'Cosine' | 'Euclid' | 'Dot',
      pointsCount: info.points_count || 0,
      status: info.status as 'green' | 'yellow' | 'red',
    };
  } catch (error) {
    console.error(`Error getting collection info for ${collectionName}:`, error);
    return null;
  }
}

/**
 * Create a new collection
 */
export async function createCollection(
  collectionName: string,
  vectorSize: number,
  distance: 'Cosine' | 'Euclid' | 'Dot' = 'Cosine'
): Promise<boolean> {
  const client = getQdrantClient();

  try {
    await client.createCollection(collectionName, {
      vectors: {
        size: vectorSize,
        distance,
      },
    });

    return true;
  } catch (error) {
    console.error(`Error creating collection ${collectionName}:`, error);
    return false;
  }
}

/**
 * Upsert vectors into a collection
 */
export async function upsertVectors(
  collectionName: string,
  chunks: VectorChunk[]
): Promise<boolean> {
  const client = getQdrantClient();

  try {
    const points = chunks.map(chunk => ({
      id: chunk.id,
      vector: chunk.embedding!,
      payload: {
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        metadata: chunk.metadata,
      },
    }));

    await client.upsert(collectionName, {
      wait: true,
      points,
    });

    return true;
  } catch (error) {
    console.error(`Error upserting vectors to ${collectionName}:`, error);
    return false;
  }
}

/**
 * Search vectors (retrieve similar chunks)
 */
export async function searchVectors(
  params: RetrievalParams
): Promise<RetrievalResult[]> {
  const client = getQdrantClient();

  try {
    // Note: embedding would be generated from params.query by the caller
    // This function expects the embedding to be passed in via filters or handled externally
    // For now, we'll return an error since we need the embedding

    throw new Error('Search requires embedding - use vectorSearchTool instead');
  } catch (error) {
    console.error('Error searching vectors:', error);
    return [];
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(collectionName: string): Promise<boolean> {
  const client = getQdrantClient();

  try {
    await client.deleteCollection(collectionName);
    return true;
  } catch (error) {
    console.error(`Error deleting collection ${collectionName}:`, error);
    return false;
  }
}

/**
 * Delete specific points from a collection
 */
export async function deletePoints(
  collectionName: string,
  pointIds: string[]
): Promise<boolean> {
  const client = getQdrantClient();

  try {
    await client.delete(collectionName, {
      wait: true,
      points: pointIds,
    });

    return true;
  } catch (error) {
    console.error(`Error deleting points from ${collectionName}:`, error);
    return false;
  }
}

/**
 * Get points by document ID
 */
export async function getPointsByDocumentId(
  collectionName: string,
  documentId: string
): Promise<any[]> {
  const client = getQdrantClient();

  try {
    const result = await client.scroll(collectionName, {
      filter: {
        must: [
          {
            key: 'documentId',
            match: { value: documentId },
          },
        ],
      },
      limit: 100,
    });

    return result.points || [];
  } catch (error) {
    console.error(`Error getting points for document ${documentId}:`, error);
    return [];
  }
}

/**
 * Check if Qdrant is reachable
 */
export async function checkQdrantConnection(): Promise<boolean> {
  const client = getQdrantClient();

  try {
    await client.getCollections();
    return true;
  } catch (error) {
    console.error('Qdrant connection failed:', error);
    return false;
  }
}
