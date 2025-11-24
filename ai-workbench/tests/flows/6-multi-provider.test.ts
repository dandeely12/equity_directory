/**
 * FLOW 6: MULTI-PROVIDER
 * Tests switching between Anthropic/OpenAI/Local with same interface
 *
 * Test Models: gpt-4o-mini (OpenAI), claude-3-haiku (Anthropic), local-llm (Local)
 */

import { describe, test, expect } from '@jest/globals';

const API_BASE = 'http://localhost:3000';
const GPT_4O_MINI = 'gpt-4o-mini';
const CLAUDE_HAIKU = 'claude-3-haiku-20240307';
const LOCAL_LLM = 'local-llm';

describe('FLOW 6: Multi-Provider', () => {

  const testMessage = { role: 'user', content: 'Say exactly: "provider test passed"' };

  test('6.1 - Send message with GPT-4o Mini (OpenAI)', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GPT_4O_MINI,
        messages: [testMessage],
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toBeDefined();
    expect(data.model).toBe(GPT_4O_MINI);
    expect(data.provider).toBe('openai');
    expect(data.response.toLowerCase()).toContain('provider test passed');
  });

  test('6.2 - Send same message with Claude Haiku (Anthropic)', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CLAUDE_HAIKU,
        messages: [testMessage],
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toBeDefined();
    expect(data.model).toBe(CLAUDE_HAIKU);
    expect(data.provider).toBe('anthropic');
    expect(data.response.toLowerCase()).toContain('provider test passed');
  });

  test('6.3 - Send message with Local LLM (if available)', async () => {
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LOCAL_LLM,
        messages: [testMessage],
      }),
    });

    // Local LLM might not be configured, so accept either success or specific error
    if (response.status === 200) {
      const data = await response.json();
      expect(data.model).toBe(LOCAL_LLM);
      expect(data.provider).toBe('local');
      expect(data.response).toBeDefined();
    } else {
      const data = await response.json();
      expect(data.error).toMatch(/not configured|unavailable|connection/i);
    }
  });

  test('6.4 - Verify all return same schema', async () => {
    const models = [GPT_4O_MINI, CLAUDE_HAIKU];
    const responses = [];

    for (const model of models) {
      const response = await fetch(`${API_BASE}/api/chat/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Test schema' }],
        }),
      });

      const data = await response.json();
      responses.push(data);
    }

    // All should have same structure
    const requiredFields = ['response', 'model', 'provider', 'inputTokens', 'outputTokens', 'cost'];

    for (const response of responses) {
      for (const field of requiredFields) {
        expect(response[field]).toBeDefined();
      }
    }

    // All should have consistent types
    for (const response of responses) {
      expect(typeof response.response).toBe('string');
      expect(typeof response.model).toBe('string');
      expect(typeof response.provider).toBe('string');
      expect(typeof response.inputTokens).toBe('number');
      expect(typeof response.outputTokens).toBe('number');
      expect(typeof response.cost).toBe('number');
    }
  });

  test('6.5 - Test provider failover', async () => {
    // Try with invalid model first
    const response = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'invalid-model-xyz',
        messages: [testMessage],
        fallbackModel: GPT_4O_MINI, // Should fall back to this
      }),
    });

    const data = await response.json();

    // Should either error or use fallback
    if (response.status === 200) {
      expect(data.model).toBe(GPT_4O_MINI);
      expect(data.usedFallback).toBe(true);
    } else {
      expect(data.error).toBeDefined();
    }
  });

  test('6.6 - Verify cost calculated per provider', async () => {
    // OpenAI cost
    const openaiResponse = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GPT_4O_MINI,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    const openaiData = await openaiResponse.json();

    // Anthropic cost
    const anthropicResponse = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CLAUDE_HAIKU,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    const anthropicData = await anthropicResponse.json();

    // Both should have costs calculated
    expect(openaiData.cost).toBeGreaterThan(0);
    expect(anthropicData.cost).toBeGreaterThan(0);

    // Costs should be different (different pricing models)
    // But for very short messages they might be similar
    expect(openaiData.cost).toBeDefined();
    expect(anthropicData.cost).toBeDefined();

    // Verify pricing constants are correct
    // GPT-4o Mini: $0.00015 / $0.0006
    // Claude Haiku: $0.00025 / $0.00125
    const openaiExpected = (openaiData.inputTokens / 1000) * 0.00015 + (openaiData.outputTokens / 1000) * 0.0006;
    const anthropicExpected = (anthropicData.inputTokens / 1000) * 0.00025 + (anthropicData.outputTokens / 1000) * 0.00125;

    expect(openaiData.cost).toBeCloseTo(openaiExpected, 8);
    expect(anthropicData.cost).toBeCloseTo(anthropicExpected, 8);
  });
});
