/**
 * FLOW 5: TOKEN & COST TRACKING
 * Tests accurate token counting and cost calculation
 *
 * Test Models: gpt-4o-mini & claude-3-haiku-20240307 (both cheap)
 */

import { describe, test, expect } from '@jest/globals';

const API_BASE = 'http://localhost:3000';
const GPT_4O_MINI = 'gpt-4o-mini';
const CLAUDE_HAIKU = 'claude-3-haiku-20240307';

// Pricing constants
const GPT_4O_MINI_INPUT = 0.00015;  // per 1k tokens
const GPT_4O_MINI_OUTPUT = 0.0006;  // per 1k tokens
const CLAUDE_HAIKU_INPUT = 0.00025; // per 1k tokens
const CLAUDE_HAIKU_OUTPUT = 0.00125; // per 1k tokens

describe('FLOW 5: Token & Cost Tracking', () => {

  test('5.1 - Count tokens for simple message', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GPT_4O_MINI,
        messages: [{ role: 'user', content: 'Hello world' }],
      }),
    });

    const data = await response.json();

    expect(data.inputTokens).toBeDefined();
    expect(data.outputTokens).toBeDefined();
    expect(data.totalTokens).toBe(data.inputTokens + data.outputTokens);

    // Simple message should be < 100 tokens
    expect(data.inputTokens).toBeLessThan(100);
    expect(data.outputTokens).toBeGreaterThan(0);
  });

  test('5.2 - Count tokens with tool calls', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GPT_4O_MINI,
        messages: [{ role: 'user', content: 'Search for documents about testing' }],
        tools: ['vectorSearch'],
      }),
    });

    const data = await response.json();

    // Tool definitions add to input tokens
    expect(data.inputTokens).toBeGreaterThan(10);

    // Should have tool call metadata
    if (data.toolCalls) {
      expect(data.toolCallTokens).toBeDefined();
      expect(data.totalTokens).toBeGreaterThan(data.inputTokens + data.outputTokens);
    }
  });

  test('5.3 - Calculate cost for GPT-4o Mini', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GPT_4O_MINI,
        messages: [{ role: 'user', content: 'Say exactly: "test"' }],
      }),
    });

    const data = await response.json();

    const expectedInputCost = (data.inputTokens / 1000) * GPT_4O_MINI_INPUT;
    const expectedOutputCost = (data.outputTokens / 1000) * GPT_4O_MINI_OUTPUT;
    const expectedTotal = expectedInputCost + expectedOutputCost;

    expect(data.cost).toBeCloseTo(expectedTotal, 8);
    expect(data.model).toBe(GPT_4O_MINI);
  });

  test('5.4 - Calculate cost for Claude Haiku', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CLAUDE_HAIKU,
        messages: [{ role: 'user', content: 'Say exactly: "test"' }],
      }),
    });

    const data = await response.json();

    const expectedInputCost = (data.inputTokens / 1000) * CLAUDE_HAIKU_INPUT;
    const expectedOutputCost = (data.outputTokens / 1000) * CLAUDE_HAIKU_OUTPUT;
    const expectedTotal = expectedInputCost + expectedOutputCost;

    expect(data.cost).toBeCloseTo(expectedTotal, 8);
    expect(data.model).toBe(CLAUDE_HAIKU);
  });

  test('5.5 - Verify cumulative cost tracking', async () => {
    // Make multiple requests and track cumulative cost
    let totalCost = 0;

    for (let i = 0; i < 3; i++) {
      const response = await fetch(`${API_BASE}/api/chat/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GPT_4O_MINI,
          messages: [{ role: 'user', content: `Count to ${i + 1}` }],
        }),
      });

      const data = await response.json();
      totalCost += data.cost;
    }

    // Get recent logs to verify cumulative tracking
    const logsResponse = await fetch(`${API_BASE}/api/logs/recent?limit=3`);
    const logs = await logsResponse.json();

    const loggedCost = logs.reduce((sum: number, log: any) => sum + (log.cost || 0), 0);

    expect(loggedCost).toBeCloseTo(totalCost, 6);
  });

  test('5.6 - Test cost logging to database', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GPT_4O_MINI,
        messages: [{ role: 'user', content: 'Test cost logging' }],
      }),
    });

    const data = await response.json();
    expect(data.logId).toBeDefined();

    // Retrieve the log
    const logResponse = await fetch(`${API_BASE}/api/logs/${data.logId}`);
    const log = await logResponse.json();

    // Verify cost fields are logged
    expect(log.inputTokens).toBe(data.inputTokens);
    expect(log.outputTokens).toBe(data.outputTokens);
    expect(log.totalTokens).toBe(data.totalTokens);
    expect(log.cost).toBe(data.cost);
    expect(log.model).toBe(GPT_4O_MINI);
  });
});
