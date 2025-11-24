/**
 * Embedding Provider
 * Abstraction layer for different embedding models
 */

import OpenAI from 'openai';

export type EmbeddingProvider = 'openai' | 'local';

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  model: string;
  dimensions: number;
}

/**
 * Default embedding configurations
 */
export const EMBEDDING_CONFIGS: Record<string, EmbeddingConfig> = {
  'openai-large': {
    provider: 'openai',
    model: 'text-embedding-3-large',
    dimensions: 3072,
  },
  'openai-small': {
    provider: 'openai',
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
  'openai-ada': {
    provider: 'openai',
    model: 'text-embedding-ada-002',
    dimensions: 1536,
  },
  'local-nomic': {
    provider: 'local',
    model: 'nomic-embed-text',
    dimensions: 768,
  },
  'local-mxbai': {
    provider: 'local',
    model: 'mxbai-embed-large',
    dimensions: 1024,
  },
  'local-all-minilm': {
    provider: 'local',
    model: 'all-minilm',
    dimensions: 384,
  },
};

/**
 * Get default embedding config
 */
export function getDefaultEmbeddingConfig(): EmbeddingConfig {
  return EMBEDDING_CONFIGS['openai-large'];
}

/**
 * Generate embeddings using OpenAI
 */
async function generateOpenAIEmbedding(
  text: string,
  model: string
): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const client = new OpenAI({ apiKey });

  try {
    const response = await client.embeddings.create({
      model,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    throw new Error(`OpenAI embedding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings using local model (Ollama)
 * Ollama API compatible with OpenAI embeddings endpoint
 */
async function generateLocalEmbedding(
  text: string,
  model: string
): Promise<number[]> {
  const baseUrl = process.env.LOCAL_LLM_BASE_URL || 'http://localhost:11434';

  try {
    // Use Ollama's embeddings API
    const response = await fetch(`${baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'nomic-embed-text',
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.embedding) {
      throw new Error('No embedding returned from Ollama');
    }

    return data.embedding;
  } catch (error) {
    throw new Error(`Local embedding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embedding using configured provider
 */
export async function generateEmbedding(
  text: string,
  config?: EmbeddingConfig
): Promise<number[]> {
  const embeddingConfig = config || getDefaultEmbeddingConfig();

  switch (embeddingConfig.provider) {
    case 'openai':
      return generateOpenAIEmbedding(text, embeddingConfig.model);

    case 'local':
      return generateLocalEmbedding(text, embeddingConfig.model);

    default:
      throw new Error(`Unsupported embedding provider: ${embeddingConfig.provider}`);
  }
}

/**
 * Generate embeddings for multiple texts (batched)
 */
export async function generateEmbeddings(
  texts: string[],
  config?: EmbeddingConfig
): Promise<number[][]> {
  const embeddingConfig = config || getDefaultEmbeddingConfig();

  if (embeddingConfig.provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const client = new OpenAI({ apiKey });

    try {
      const response = await client.embeddings.create({
        model: embeddingConfig.model,
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      throw new Error(`OpenAI batch embedding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // For other providers, fall back to individual calls
  return Promise.all(texts.map(text => generateEmbedding(text, config)));
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
