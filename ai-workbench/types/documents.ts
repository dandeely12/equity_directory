/**
 * Document and Vector Database Types
 * Handles vectorized documents and chunks in Qdrant
 */

export interface DocumentMetadata {
  // Core metadata
  title: string;
  fileName: string;
  uploadedAt: Date;

  // Custom categorization from your original prompt
  kb_category?: string;  // e.g., "lore", "rules", "character"
  realm?: string;        // Custom categorization
  characters?: string[]; // Associated characters
  doc_type?: string;     // Document type
  version?: string;      // Version tracking

  // Additional metadata
  source?: string;
  author?: string;
  tags?: string[];
  [key: string]: any;    // Allow custom metadata
}

export interface VectorChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  metadata: DocumentMetadata;
}

export interface VectorDocument {
  id: string;
  collectionName: string;
  metadata: DocumentMetadata;
  chunks: VectorChunk[];
  totalChunks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QdrantCollection {
  name: string;
  vectorSize: number;
  distance: 'Cosine' | 'Euclid' | 'Dot';
  pointsCount: number;
  status: 'green' | 'yellow' | 'red';
}

export interface RetrievalParams {
  query: string;
  collectionName: string;
  limit?: number;
  scoreThreshold?: number;
  filters?: Record<string, any>;
}

export interface RetrievalResult {
  id: string;
  score: number;
  content: string;
  metadata: DocumentMetadata;
  chunkIndex: number;
  documentId: string;
}

export interface ChunkingConfig {
  chunkSize: number;      // Characters per chunk
  chunkOverlap: number;   // Overlap between chunks
  separators?: string[];  // How to split (e.g., ['\n\n', '\n', '. '])
}

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ' '],
};
