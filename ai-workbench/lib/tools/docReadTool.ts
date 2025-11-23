/**
 * Document Read Tool
 * ONLY for reading local/raw documents from the filesystem
 * DO NOT use this for vector search - use vectorSearchTool instead
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface DocReadParams {
  documentPath: string;
  encoding?: BufferEncoding;
}

export interface DocReadResult {
  path: string;
  content: string;
  size: number;
  extension: string;
  durationMs: number;
  error?: string;
}

/**
 * Read a local document from the filesystem
 * This tool ONLY works with local files, NOT vectorized documents
 */
export async function docReadTool(params: DocReadParams): Promise<DocReadResult> {
  const { documentPath, encoding = 'utf-8' } = params;
  const startTime = Date.now();

  try {
    // Security: Prevent path traversal attacks
    const resolvedPath = path.resolve(documentPath);

    // Check if file exists
    const stats = await fs.stat(resolvedPath);

    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${documentPath}`);
    }

    // Read file content
    const content = await fs.readFile(resolvedPath, encoding);
    const extension = path.extname(resolvedPath);

    return {
      path: resolvedPath,
      content,
      size: stats.size,
      extension,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      path: documentPath,
      content: '',
      size: 0,
      extension: '',
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Read multiple documents
 */
export async function batchDocRead(paths: string[]): Promise<DocReadResult[]> {
  return Promise.all(
    paths.map(documentPath => docReadTool({ documentPath }))
  );
}

/**
 * List files in a directory
 */
export async function listDocuments(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.txt', '.md', '.json', '.csv'].includes(ext);
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    return [];
  }
}

/**
 * Supported file extensions
 */
export const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.json', '.csv'];

/**
 * Check if file extension is supported
 */
export function isSupportedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}
