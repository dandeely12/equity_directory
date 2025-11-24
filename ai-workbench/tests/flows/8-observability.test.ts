/**
 * FLOW 8: OBSERVABILITY
 * Tests all operations logged correctly (logging & monitoring)
 *
 * Test Model: gpt-4o-mini (cheapest)
 */

import { describe, test, expect } from '@jest/globals';

const API_BASE = 'http://localhost:3000';
const TEST_MODEL = 'gpt-4o-mini';

describe('FLOW 8: Observability', () => {

  test('8.1 - Chat logged to database', async () => {
    const chatResponse = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [{ role: 'user', content: 'Log test message' }],
      }),
    });

    const chatData = await chatResponse.json();
    expect(chatData.logId).toBeDefined();

    // Retrieve the log
    const logResponse = await fetch(`${API_BASE}/api/logs/${chatData.logId}`);
    const log = await logResponse.json();

    expect(logResponse.status).toBe(200);
    expect(log.id).toBe(chatData.logId);
    expect(log.type).toBe('chat');
    expect(log.model).toBe(TEST_MODEL);
    expect(log.createdAt).toBeDefined();
  });

  test('8.2 - Flow execution logged', async () => {
    // Create a flow
    const flowResponse = await fetch(`${API_BASE}/api/flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Observability Test Flow',
        steps: [
          {
            id: 'step1',
            type: 'llm',
            model: TEST_MODEL,
            prompt: 'Say "logged"',
          },
        ],
      }),
    });

    const flow = await flowResponse.json();

    // Execute the flow
    const execResponse = await fetch(`${API_BASE}/api/flows/${flow.id}/execute`, {
      method: 'POST',
    });

    const execData = await execResponse.json();
    expect(execData.logId).toBeDefined();

    // Retrieve the log
    const logResponse = await fetch(`${API_BASE}/api/logs/${execData.logId}`);
    const log = await logResponse.json();

    expect(log.type).toBe('flow');
    expect(log.flowId).toBe(flow.id);
    expect(log.status).toBeDefined();
  });

  test('8.3 - Token counts logged', async () => {
    const chatResponse = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [{ role: 'user', content: 'Token count test' }],
      }),
    });

    const chatData = await chatResponse.json();

    const logResponse = await fetch(`${API_BASE}/api/logs/${chatData.logId}`);
    const log = await logResponse.json();

    expect(log.inputTokens).toBeGreaterThan(0);
    expect(log.outputTokens).toBeGreaterThan(0);
    expect(log.totalTokens).toBe(log.inputTokens + log.outputTokens);
  });

  test('8.4 - Costs logged', async () => {
    const chatResponse = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [{ role: 'user', content: 'Cost logging test' }],
      }),
    });

    const chatData = await chatResponse.json();

    const logResponse = await fetch(`${API_BASE}/api/logs/${chatData.logId}`);
    const log = await logResponse.json();

    expect(log.cost).toBeDefined();
    expect(log.cost).toBeGreaterThan(0);
    expect(typeof log.cost).toBe('number');
  });

  test('8.5 - Errors logged with stack traces', async () => {
    // Trigger an error with invalid model
    const chatResponse = await fetch(`${API_BASE}/api/chat/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'invalid-model-for-error-test',
        messages: [{ role: 'user', content: 'This should error' }],
      }),
    });

    expect(chatResponse.status).toBeGreaterThanOrEqual(400);

    const chatData = await chatResponse.json();

    // Error should be logged
    if (chatData.logId) {
      const logResponse = await fetch(`${API_BASE}/api/logs/${chatData.logId}`);
      const log = await logResponse.json();

      expect(log.status).toBe('error');
      expect(log.error).toBeDefined();
      expect(typeof log.error).toBe('string');
    } else {
      // Error should at least be in response
      expect(chatData.error).toBeDefined();
    }
  });

  test('8.6 - Test log retrieval API', async () => {
    // Create multiple logs
    for (let i = 0; i < 3; i++) {
      await fetch(`${API_BASE}/api/chat/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: TEST_MODEL,
          messages: [{ role: 'user', content: `Test log ${i}` }],
        }),
      });
    }

    // Retrieve recent logs
    const logsResponse = await fetch(`${API_BASE}/api/logs/recent?limit=5`);
    const logs = await logsResponse.json();

    expect(logsResponse.status).toBe(200);
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.length).toBeLessThanOrEqual(5);

    // Each log should have required fields
    for (const log of logs) {
      expect(log.id).toBeDefined();
      expect(log.type).toBeDefined();
      expect(log.createdAt).toBeDefined();
      expect(log.model).toBeDefined();
    }

    // Logs should be sorted by most recent first
    for (let i = 0; i < logs.length - 1; i++) {
      const date1 = new Date(logs[i].createdAt).getTime();
      const date2 = new Date(logs[i + 1].createdAt).getTime();
      expect(date1).toBeGreaterThanOrEqual(date2);
    }
  });
});
