/**
 * FLOW 1: CHAT FLOW
 * Tests end-to-end conversation from user input to response
 *
 * Test Model: gpt-4o-mini (cheapest)
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

const TEST_MODEL = 'gpt-4o-mini'; // $0.00015 input / $0.0006 output per 1k tokens
const API_BASE = 'http://localhost:3000';

describe('FLOW 1: Chat Flow', () => {

  test('1.1 - Send simple message → Verify response generated', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [{ role: 'user', content: 'Say "test passed" and nothing else' }],
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.response).toBeDefined();
    expect(data.response.toLowerCase()).toContain('test passed');
  });

  test('1.2 - Verify conversation stored in database', async () => {
    const chatResponse = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [{ role: 'user', content: 'Hello database test' }],
      }),
    });

    const chatData = await chatResponse.json();
    expect(chatData.logId).toBeDefined();

    // Verify it was logged
    const logResponse = await fetch(`${API_BASE}/api/logs/${chatData.logId}`);
    const logData = await logResponse.json();

    expect(logResponse.status).toBe(200);
    expect(logData.model).toBe(TEST_MODEL);
    expect(logData.inputTokens).toBeGreaterThan(0);
  });

  test('1.3 - Test streaming response chunks', async () => {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [{ role: 'user', content: 'Count to 3' }],
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    let chunks = 0;
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        if (chunk.includes('data:')) chunks++;

        // Safety: don't read forever
        if (chunks > 50) break;
      }
    }

    expect(chunks).toBeGreaterThan(0);
  });

  test('1.4 - Verify token counting works', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    const data = await response.json();
    expect(data.inputTokens).toBeGreaterThan(0);
    expect(data.outputTokens).toBeGreaterThan(0);
    expect(data.totalTokens).toBe(data.inputTokens + data.outputTokens);
  });

  test('1.5 - Verify cost tracking accurate', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [{ role: 'user', content: 'Calculate 2+2' }],
      }),
    });

    const data = await response.json();

    // GPT-4o Mini: $0.00015 input / $0.0006 output per 1k tokens
    const expectedInputCost = (data.inputTokens / 1000) * 0.00015;
    const expectedOutputCost = (data.outputTokens / 1000) * 0.0006;
    const expectedTotal = expectedInputCost + expectedOutputCost;

    expect(data.cost).toBeCloseTo(expectedTotal, 6);
  });

  test('1.6 - Test error handling for invalid messages', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [], // Invalid: empty messages
      }),
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
