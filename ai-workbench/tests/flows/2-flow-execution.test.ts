/**
 * FLOW 2: FLOW EXECUTION
 * Tests creating and executing multi-step AI workflows with branches
 *
 * Test Model: gpt-4o-mini (cheapest)
 */

import { describe, test, expect } from '@jest/globals';

const TEST_MODEL = 'gpt-4o-mini';
const API_BASE = 'http://localhost:3000';

describe('FLOW 2: Flow Execution', () => {

  test('2.1 - Create basic 2-step flow', async () => {
    const flow = {
      name: 'Test 2-Step Flow',
      description: 'Simple flow with 2 steps',
      steps: [
        {
          id: 'step1',
          name: 'Step 1',
          type: 'llm',
          model: TEST_MODEL,
          prompt: 'Say "step 1 complete"',
        },
        {
          id: 'step2',
          name: 'Step 2',
          type: 'llm',
          model: TEST_MODEL,
          prompt: 'Say "step 2 complete"',
        },
      ],
    };

    const response = await fetch(`${API_BASE}/api/flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flow),
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.steps).toHaveLength(2);
  });

  test('2.2 - Execute flow end-to-end', async () => {
    // Create flow
    const createResponse = await fetch(`${API_BASE}/api/flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Execute Test Flow',
        steps: [
          {
            id: 'step1',
            type: 'llm',
            model: TEST_MODEL,
            prompt: 'Say "execution test passed"',
          },
        ],
      }),
    });

    const flow = await createResponse.json();

    // Execute flow
    const execResponse = await fetch(`${API_BASE}/api/flows/${flow.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const result = await execResponse.json();
    expect(execResponse.status).toBe(200);
    expect(result.status).toBe('completed');
    expect(result.results).toBeDefined();
  });

  test('2.3 - Test conditional branching (if/then)', async () => {
    const flow = {
      name: 'Conditional Flow',
      steps: [
        {
          id: 'check',
          type: 'llm',
          model: TEST_MODEL,
          prompt: 'Is 2+2=4? Answer only yes or no',
        },
        {
          id: 'true_branch',
          type: 'llm',
          model: TEST_MODEL,
          prompt: 'Say "correct"',
          condition: {
            stepId: 'check',
            operator: 'contains',
            value: 'yes',
          },
        },
        {
          id: 'false_branch',
          type: 'llm',
          model: TEST_MODEL,
          prompt: 'Say "incorrect"',
          condition: {
            stepId: 'check',
            operator: 'contains',
            value: 'no',
          },
        },
      ],
    };

    const createResponse = await fetch(`${API_BASE}/api/flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flow),
    });

    const created = await createResponse.json();
    const execResponse = await fetch(`${API_BASE}/api/flows/${created.id}/execute`, {
      method: 'POST',
    });

    const result = await execResponse.json();
    expect(result.status).toBe('completed');
    expect(result.stepsExecuted).toBeGreaterThan(1); // At least 2 steps executed
  });

  test('2.4 - Verify step outputs passed correctly', async () => {
    const flow = {
      name: 'Output Passing Flow',
      steps: [
        {
          id: 'step1',
          type: 'llm',
          model: TEST_MODEL,
          prompt: 'Return the number 42',
        },
        {
          id: 'step2',
          type: 'llm',
          model: TEST_MODEL,
          prompt: 'The previous step said: {{step1.output}}. Did it say 42? Answer yes or no.',
        },
      ],
    };

    const createResponse = await fetch(`${API_BASE}/api/flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flow),
    });

    const created = await createResponse.json();
    const execResponse = await fetch(`${API_BASE}/api/flows/${created.id}/execute`, {
      method: 'POST',
    });

    const result = await execResponse.json();
    expect(result.status).toBe('completed');
    expect(result.results.step2.output.toLowerCase()).toContain('yes');
  });

  test('2.5 - Test flow with tool calls', async () => {
    const flow = {
      name: 'Tool Flow',
      steps: [
        {
          id: 'with_tools',
          type: 'llm',
          model: TEST_MODEL,
          prompt: 'Search for documents about "testing"',
          tools: ['vectorSearch'],
        },
      ],
    };

    const createResponse = await fetch(`${API_BASE}/api/flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flow),
    });

    const created = await createResponse.json();
    expect(created.steps[0].tools).toContain('vectorSearch');
  });

  test('2.6 - Verify flow results stored', async () => {
    const createResponse = await fetch(`${API_BASE}/api/flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Storage Test Flow',
        steps: [
          {
            id: 'step1',
            type: 'llm',
            model: TEST_MODEL,
            prompt: 'Say "stored"',
          },
        ],
      }),
    });

    const flow = await createResponse.json();
    const execResponse = await fetch(`${API_BASE}/api/flows/${flow.id}/execute`, {
      method: 'POST',
    });

    const execResult = await execResponse.json();
    expect(execResult.logId).toBeDefined();

    // Verify stored in logs
    const logResponse = await fetch(`${API_BASE}/api/logs/${execResult.logId}`);
    const log = await logResponse.json();

    expect(log.type).toBe('flow');
    expect(log.flowId).toBe(flow.id);
  });

  test('2.7 - Test error recovery in flows', async () => {
    const flow = {
      name: 'Error Recovery Flow',
      steps: [
        {
          id: 'fail_step',
          type: 'llm',
          model: 'invalid-model-xyz', // This will fail
          prompt: 'This should fail',
        },
        {
          id: 'recovery_step',
          type: 'llm',
          model: TEST_MODEL,
          prompt: 'Say "recovered"',
          onError: 'continue', // Continue despite previous error
        },
      ],
    };

    const createResponse = await fetch(`${API_BASE}/api/flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flow),
    });

    const created = await createResponse.json();
    const execResponse = await fetch(`${API_BASE}/api/flows/${created.id}/execute`, {
      method: 'POST',
    });

    const result = await execResponse.json();
    // Should complete with partial success
    expect(result.status).toMatch(/completed|partial/);
    expect(result.errors).toBeDefined();
  });
});
