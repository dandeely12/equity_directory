/**
 * Tools Index
 * Clear separation between vector search and document reading
 *
 * IMPORTANT:
 * - vectorSearchTool: Use ONLY for searching vectorized documents in Qdrant
 * - docReadTool: Use ONLY for reading local/raw documents from filesystem
 *
 * Never confuse these two tools!
 */

export { vectorSearchTool, batchVectorSearch, type VectorSearchParams } from './vectorSearchTool';
export { docReadTool, batchDocRead, listDocuments, isSupportedFile, SUPPORTED_EXTENSIONS, type DocReadParams, type DocReadResult } from './docReadTool';
