/**
 * FLOW 3: DOCUMENT MANAGEMENT
 * Tests uploading documents → chunking → embedding → storage (RAG pipeline)
 *
 * Test Model: gpt-4o-mini (cheapest) - for embeddings use local if available
 */

import { describe, test, expect } from '@jest/globals';

const API_BASE = 'http://localhost:3000';
const TEST_COLLECTION = 'test-documents';

describe('FLOW 3: Document Management', () => {

  test('3.1 - Upload single document', async () => {
    const doc = {
      content: 'This is a test document about AI and machine learning.',
      metadata: {
        source: 'test',
        type: 'article',
      },
      collection: TEST_COLLECTION,
    };

    const response = await fetch(`${API_BASE}/api/qdrant/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.success).toBe(true);
  });

  test('3.2 - Verify chunking works (500/1000/2000 char chunks)', async () => {
    const longText = 'A'.repeat(3000); // 3000 chars

    // Test 500 char chunks
    const response500 = await fetch(`${API_BASE}/api/qdrant/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: longText,
        collection: TEST_COLLECTION,
        chunkSize: 500,
      }),
    });

    const data500 = await response500.json();
    expect(data500.chunksCreated).toBeGreaterThanOrEqual(6); // 3000/500 = 6

    // Test 1000 char chunks
    const response1000 = await fetch(`${API_BASE}/api/qdrant/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: longText,
        collection: TEST_COLLECTION,
        chunkSize: 1000,
      }),
    });

    const data1000 = await response1000.json();
    expect(data1000.chunksCreated).toBeGreaterThanOrEqual(3); // 3000/1000 = 3

    // Test 2000 char chunks
    const response2000 = await fetch(`${API_BASE}/api/qdrant/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: longText,
        collection: TEST_COLLECTION,
        chunkSize: 2000,
      }),
    });

    const data2000 = await response2000.json();
    expect(data2000.chunksCreated).toBeGreaterThanOrEqual(2); // 3000/2000 = 1.5, rounds to 2
  });

  test('3.3 - Generate embeddings for chunks', async () => {
    const response = await fetch(`${API_BASE}/api/qdrant/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Test embedding generation',
        collection: TEST_COLLECTION,
        generateEmbeddings: true,
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.embeddingsGenerated).toBe(true);
    expect(data.vectorDimension).toBeGreaterThan(0); // Should have vector dimension
  });

  test('3.4 - Store in Qdrant collection', async () => {
    // First, ensure collection exists
    const collectionResponse = await fetch(`${API_BASE}/api/qdrant/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TEST_COLLECTION,
        vectorSize: 1536, // OpenAI embedding size
      }),
    });

    expect(collectionResponse.status).toBeLessThan(400);

    // Upload document
    const docResponse = await fetch(`${API_BASE}/api/qdrant/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Document stored in Qdrant',
        collection: TEST_COLLECTION,
      }),
    });

    const data = await docResponse.json();
    expect(data.success).toBe(true);
    expect(data.collection).toBe(TEST_COLLECTION);
  });

  test('3.5 - Verify metadata attached correctly', async () => {
    const metadata = {
      title: 'Test Document',
      author: 'Test User',
      date: '2025-01-01',
      tags: ['test', 'metadata'],
    };

    const response = await fetch(`${API_BASE}/api/qdrant/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Document with metadata',
        collection: TEST_COLLECTION,
        metadata,
      }),
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.metadata).toMatchObject(metadata);
  });

  test('3.6 - Test duplicate document handling', async () => {
    const doc = {
      content: 'Unique document for duplicate test',
      collection: TEST_COLLECTION,
      metadata: { uniqueId: 'duplicate-test-123' },
    };

    // Upload first time
    const response1 = await fetch(`${API_BASE}/api/qdrant/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });

    const data1 = await response1.json();
    expect(data1.success).toBe(true);

    // Upload second time (duplicate)
    const response2 = await fetch(`${API_BASE}/api/qdrant/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });

    const data2 = await response2.json();

    // Should either:
    // 1. Reject duplicate
    // 2. Update existing
    // 3. Create new with same content
    expect(response2.status).toBeLessThan(500); // Should handle gracefully
    expect(data2.duplicate || data2.updated || data2.success).toBeTruthy();
  });
});
