/**
 * FLOW 4: VECTOR SEARCH
 * Tests searching documents by semantic similarity
 *
 * Uses local embeddings (free) if available, otherwise cheapest option
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

const API_BASE = 'http://localhost:3000';
const TEST_COLLECTION = 'search-test-collection';

describe('FLOW 4: Vector Search', () => {

  beforeAll(async () => {
    // Setup: Create collection and add test documents
    await fetch(`${API_BASE}/api/qdrant/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TEST_COLLECTION,
        vectorSize: 1536,
      }),
    });

    // Add some test documents
    const testDocs = [
      { content: 'Python is a programming language', metadata: { topic: 'programming' } },
      { content: 'JavaScript is used for web development', metadata: { topic: 'programming' } },
      { content: 'Machine learning uses neural networks', metadata: { topic: 'AI' } },
      { content: 'Cats are popular pets', metadata: { topic: 'animals' } },
    ];

    for (const doc of testDocs) {
      await fetch(`${API_BASE}/api/qdrant/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...doc,
          collection: TEST_COLLECTION,
        }),
      });
    }

    // Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('4.1 - Simple search query', async () => {
    const response = await fetch(`${API_BASE}/api/qdrant/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'programming languages',
        collection: TEST_COLLECTION,
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test('4.2 - Verify top-k results returned', async () => {
    const response = await fetch(`${API_BASE}/api/qdrant/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'coding',
        collection: TEST_COLLECTION,
        limit: 2, // Request top 2
      }),
    });

    const data = await response.json();
    expect(data.results.length).toBeLessThanOrEqual(2);
  });

  test('4.3 - Test relevance scores', async () => {
    const response = await fetch(`${API_BASE}/api/qdrant/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Python programming',
        collection: TEST_COLLECTION,
      }),
    });

    const data = await response.json();

    // Verify each result has a score
    for (const result of data.results) {
      expect(result.score).toBeDefined();
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1);
    }

    // Verify results are sorted by score (highest first)
    for (let i = 0; i < data.results.length - 1; i++) {
      expect(data.results[i].score).toBeGreaterThanOrEqual(data.results[i + 1].score);
    }
  });

  test('4.4 - Test filtering by metadata', async () => {
    const response = await fetch(`${API_BASE}/api/qdrant/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'anything',
        collection: TEST_COLLECTION,
        filter: {
          topic: 'programming',
        },
      }),
    });

    const data = await response.json();

    // All results should have topic: 'programming'
    for (const result of data.results) {
      expect(result.metadata?.topic).toBe('programming');
    }
  });

  test('4.5 - Test empty result handling', async () => {
    const response = await fetch(`${API_BASE}/api/qdrant/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'quantum physics cosmology astrophysics',
        collection: TEST_COLLECTION,
        limit: 10,
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(200);

    // Should return empty array or low-scoring results
    expect(Array.isArray(data.results)).toBe(true);

    if (data.results.length > 0) {
      // If results exist, scores should be low (not very relevant)
      expect(data.results[0].score).toBeLessThan(0.7);
    }
  });

  test('4.6 - Verify search performance (< 500ms)', async () => {
    const startTime = Date.now();

    const response = await fetch(`${API_BASE}/api/qdrant/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'test query',
        collection: TEST_COLLECTION,
      }),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500); // Should be fast

    const data = await response.json();
    expect(data.searchTime).toBeDefined();
    expect(data.searchTime).toBeLessThan(500);
  });
});
