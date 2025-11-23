/**
 * Document Chunking Utilities
 * Splits documents into manageable chunks for vectorization
 */

import { ChunkingConfig, DEFAULT_CHUNKING_CONFIG, VectorChunk, DocumentMetadata } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chunk text into smaller pieces with overlap
 */
export function chunkText(
  text: string,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): string[] {
  const { chunkSize, chunkOverlap, separators = ['\n\n', '\n', '. ', ' '] } = config;

  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, '\n');

  // Try to split by separators in order of preference
  for (const separator of separators) {
    const chunks = splitBySeparator(normalizedText, separator, chunkSize, chunkOverlap);
    if (chunks.length > 1) {
      return chunks;
    }
  }

  // Fallback: split by character count
  return splitByCharacterCount(normalizedText, chunkSize, chunkOverlap);
}

/**
 * Split text by a specific separator
 */
function splitBySeparator(
  text: string,
  separator: string,
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const chunks: string[] = [];
  const parts = text.split(separator);

  let currentChunk = '';

  for (const part of parts) {
    const potentialChunk = currentChunk + (currentChunk ? separator : '') + part;

    if (potentialChunk.length <= chunkSize) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);

        // Add overlap
        const overlapText = currentChunk.slice(-chunkOverlap);
        currentChunk = overlapText + separator + part;
      } else {
        // Part is larger than chunk size, add it anyway
        chunks.push(part);
        currentChunk = '';
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Split by character count (fallback)
 */
function splitByCharacterCount(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - chunkOverlap;

    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Create VectorChunk objects from text chunks
 */
export function createVectorChunks(
  documentId: string,
  collectionName: string,
  textChunks: string[],
  metadata: DocumentMetadata
): VectorChunk[] {
  return textChunks.map((content, index) => ({
    id: uuidv4(),
    documentId,
    chunkIndex: index,
    content,
    metadata: {
      ...metadata,
      // Add chunk-specific metadata if needed
    },
  }));
}

/**
 * Estimate token count (rough approximation)
 * 1 token ≈ 4 characters for English text
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get optimal chunk size for a model's context window
 */
export function getOptimalChunkSize(contextWindow: number): number {
  // Use ~20% of context window for chunks, leaving room for prompts
  const maxChunkTokens = Math.floor(contextWindow * 0.2);
  return maxChunkTokens * 4; // Convert tokens to characters
}
