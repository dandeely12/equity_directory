/**
 * FLOW 7: TOOL EXECUTION
 * Tests AI calling tools/functions during execution
 *
 * Test Model: gpt-4o-mini (cheapest, supports function calling)
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

const API_BASE = 'http://localhost:3000';
const TEST_MODEL = 'gpt-4o-mini';
const TEST_COLLECTION = 'tool-test-collection';

describe('FLOW 7: Tool Execution', () => {

  beforeAll(async () => {
    // Setup: Create collection and add test documents for vector search
    await fetch(`${API_BASE}/api/qdrant/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TEST_COLLECTION,
        vectorSize: 1536,
      }),
    });

    // Add test document
    await fetch(`${API_BASE}/api/qdrant/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'This is a document about testing tools and functions',
        collection: TEST_COLLECTION,
      }),
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('7.1 - Simple tool call (vectorSearch)', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [
          {
            role: 'user',
            content: `Search the collection "${TEST_COLLECTION}" for documents about testing`,
          },
        ],
        tools: ['vectorSearch'],
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toBeDefined();

    // Should have made a tool call
    if (data.toolCalls) {
      expect(data.toolCalls.length).toBeGreaterThan(0);
      expect(data.toolCalls[0].name).toBe('vectorSearch');
    }
  });

  test('7.2 - Tool call with parameters', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [
          {
            role: 'user',
            content: 'Search for "testing" and return only 5 results',
          },
        ],
        tools: ['vectorSearch'],
      }),
    });

    const data = await response.json();

    if (data.toolCalls) {
      const toolCall = data.toolCalls[0];
      expect(toolCall.parameters).toBeDefined();
      expect(toolCall.parameters.query).toMatch(/testing/i);

      // Should respect the limit parameter
      if (toolCall.parameters.limit) {
        expect(toolCall.parameters.limit).toBeLessThanOrEqual(5);
      }
    }
  });

  test('7.3 - Multiple sequential tool calls', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [
          {
            role: 'user',
            content: 'First search for "testing", then search for "tools"',
          },
        ],
        tools: ['vectorSearch'],
        maxToolCalls: 5, // Allow multiple tool calls
      }),
    });

    const data = await response.json();

    // Should make multiple tool calls
    if (data.toolCalls) {
      expect(data.toolCalls.length).toBeGreaterThanOrEqual(1);
    }

    // Check execution log
    if (data.toolExecutions) {
      expect(Array.isArray(data.toolExecutions)).toBe(true);
    }
  });

  test('7.4 - Verify tool results passed back to model', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [
          {
            role: 'user',
            content: `Search "${TEST_COLLECTION}" for testing and tell me what you found`,
          },
        ],
        tools: ['vectorSearch'],
      }),
    });

    const data = await response.json();

    // Response should reference the tool results
    expect(data.response).toBeDefined();

    // If tool was called, response should incorporate results
    if (data.toolCalls && data.toolCalls.length > 0) {
      expect(data.response.length).toBeGreaterThan(50); // Should have substantial response
      expect(data.usedToolResults).toBe(true);
    }
  });

  test('7.5 - Test tool error handling', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [
          {
            role: 'user',
            content: 'Search the collection "nonexistent-collection-xyz" for anything',
          },
        ],
        tools: ['vectorSearch'],
      }),
    });

    const data = await response.json();

    // Should handle error gracefully
    expect(response.status).toBeLessThan(500);

    if (data.toolCalls) {
      const toolCall = data.toolCalls[0];

      // Tool execution should report error
      if (data.toolExecutions) {
        const execution = data.toolExecutions.find((e: any) => e.toolCallId === toolCall.id);
        expect(execution).toBeDefined();
        expect(execution.error || execution.status === 'error').toBeTruthy();
      }
    }
  });

  test('7.6 - Verify tool execution logged', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [
          {
            role: 'user',
            content: 'Search for testing',
          },
        ],
        tools: ['vectorSearch'],
      }),
    });

    const data = await response.json();
    expect(data.logId).toBeDefined();

    // Retrieve the log
    const logResponse = await fetch(`${API_BASE}/api/logs/${data.logId}`);
    const log = await logResponse.json();

    // Should have tool execution data
    if (data.toolCalls && data.toolCalls.length > 0) {
      expect(log.toolCalls).toBeDefined();
      expect(Array.isArray(log.toolCalls)).toBe(true);
      expect(log.toolCalls.length).toBeGreaterThan(0);
    }
  });
});
