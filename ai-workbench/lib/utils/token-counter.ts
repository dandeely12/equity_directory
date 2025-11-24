/**
 * Token Counter and Cost Analysis Utility
 * Provides detailed cost tracking and analysis for AI API calls
 */

import { ModelCallLog, ChatRunLog, FlowRunLog } from '@/types';
import { getModelById } from '@/lib/config/models';

export interface CostBreakdown {
  modelId: string;
  modelName: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  durationMs: number;
  tokensPerSecond?: number;
}

export interface AggregateCostAnalysis {
  totalCalls: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCost: number;
  totalDurationMs: number;
  averageTokensPerCall: number;
  averageCostPerCall: number;
  byModel: Record<string, {
    calls: number;
    tokens: number;
    cost: number;
  }>;
  byProvider: Record<string, {
    calls: number;
    tokens: number;
    cost: number;
  }>;
}

/**
 * Calculate detailed cost breakdown for a single model call
 */
export function calculateCostBreakdown(log: ModelCallLog): CostBreakdown {
  const model = getModelById(log.modelId);

  const inputCost = model?.costPer1kInput
    ? (log.usage.promptTokens / 1000) * model.costPer1kInput
    : 0;

  const outputCost = model?.costPer1kOutput
    ? (log.usage.completionTokens / 1000) * model.costPer1kOutput
    : 0;

  const tokensPerSecond = log.durationMs > 0
    ? (log.usage.totalTokens / log.durationMs) * 1000
    : undefined;

  return {
    modelId: log.modelId,
    modelName: model?.name || log.modelId,
    provider: log.provider,
    promptTokens: log.usage.promptTokens,
    completionTokens: log.usage.completionTokens,
    totalTokens: log.usage.totalTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    durationMs: log.durationMs,
    tokensPerSecond,
  };
}

/**
 * Aggregate cost analysis across multiple calls
 */
export function aggregateCostAnalysis(logs: ModelCallLog[]): AggregateCostAnalysis {
  const byModel: Record<string, { calls: number; tokens: number; cost: number }> = {};
  const byProvider: Record<string, { calls: number; tokens: number; cost: number }> = {};

  let totalTokens = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalCost = 0;
  let totalDurationMs = 0;

  for (const log of logs) {
    const breakdown = calculateCostBreakdown(log);

    totalTokens += breakdown.totalTokens;
    totalPromptTokens += breakdown.promptTokens;
    totalCompletionTokens += breakdown.completionTokens;
    totalCost += breakdown.totalCost;
    totalDurationMs += breakdown.durationMs;

    // By model
    if (!byModel[log.modelId]) {
      byModel[log.modelId] = { calls: 0, tokens: 0, cost: 0 };
    }
    byModel[log.modelId].calls++;
    byModel[log.modelId].tokens += breakdown.totalTokens;
    byModel[log.modelId].cost += breakdown.totalCost;

    // By provider
    if (!byProvider[log.provider]) {
      byProvider[log.provider] = { calls: 0, tokens: 0, cost: 0 };
    }
    byProvider[log.provider].calls++;
    byProvider[log.provider].tokens += breakdown.totalTokens;
    byProvider[log.provider].cost += breakdown.totalCost;
  }

  return {
    totalCalls: logs.length,
    totalTokens,
    totalPromptTokens,
    totalCompletionTokens,
    totalCost,
    totalDurationMs,
    averageTokensPerCall: logs.length > 0 ? totalTokens / logs.length : 0,
    averageCostPerCall: logs.length > 0 ? totalCost / logs.length : 0,
    byModel,
    byProvider,
  };
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.001) return `$${cost.toFixed(6)}`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Format tokens with commas for readability
 */
export function formatTokens(tokens: number): string {
  return tokens.toLocaleString();
}

/**
 * Format duration in human-readable form
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Generate a detailed cost report for a chat run
 */
export function generateChatRunReport(log: ChatRunLog): string {
  const breakdown = calculateCostBreakdown(log.modelCall);

  return `
=== Chat Run Cost Report ===
Model: ${breakdown.modelName}
Provider: ${breakdown.provider}

Tokens:
  Input:  ${formatTokens(breakdown.promptTokens)}
  Output: ${formatTokens(breakdown.completionTokens)}
  Total:  ${formatTokens(breakdown.totalTokens)}

Cost:
  Input:  ${formatCost(breakdown.inputCost)}
  Output: ${formatCost(breakdown.outputCost)}
  Total:  ${formatCost(breakdown.totalCost)}

Performance:
  Duration: ${formatDuration(breakdown.durationMs)}
  ${breakdown.tokensPerSecond ? `Speed: ${breakdown.tokensPerSecond.toFixed(0)} tokens/sec` : ''}
${log.vectorSearch ? `
Vector Search:
  Duration: ${formatDuration(log.vectorSearch.durationMs)}
  Results: ${log.vectorSearch.results.length}` : ''}
`.trim();
}

/**
 * Generate a detailed cost report for a flow run
 */
export function generateFlowRunReport(log: FlowRunLog): string {
  const modelCalls = log.steps.flatMap(step =>
    step.modelCalls || []
  );

  const analysis = aggregateCostAnalysis(modelCalls);

  let report = `
=== Flow Run Cost Report ===
Flow: ${log.flowName}
Status: ${log.status}

Summary:
  Total API Calls: ${analysis.totalCalls}
  Total Tokens:    ${formatTokens(analysis.totalTokens)}
    - Input:  ${formatTokens(analysis.totalPromptTokens)}
    - Output: ${formatTokens(analysis.totalCompletionTokens)}
  Total Cost:      ${formatCost(analysis.totalCost)}
  Duration:        ${formatDuration(log.durationMs)}

Average per Call:
  Tokens: ${formatTokens(Math.round(analysis.averageTokensPerCall))}
  Cost:   ${formatCost(analysis.averageCostPerCall)}
`;

  // Breakdown by model
  if (Object.keys(analysis.byModel).length > 0) {
    report += '\n\nBy Model:';
    for (const [modelId, stats] of Object.entries(analysis.byModel)) {
      const model = getModelById(modelId);
      report += `\n  ${model?.name || modelId}:`;
      report += `\n    Calls:  ${stats.calls}`;
      report += `\n    Tokens: ${formatTokens(stats.tokens)}`;
      report += `\n    Cost:   ${formatCost(stats.cost)}`;
    }
  }

  // Breakdown by provider
  if (Object.keys(analysis.byProvider).length > 1) {
    report += '\n\nBy Provider:';
    for (const [provider, stats] of Object.entries(analysis.byProvider)) {
      report += `\n  ${provider}:`;
      report += `\n    Calls:  ${stats.calls}`;
      report += `\n    Tokens: ${formatTokens(stats.tokens)}`;
      report += `\n    Cost:   ${formatCost(stats.cost)}`;
    }
  }

  return report.trim();
}

/**
 * Generate a summary report for multiple runs
 */
export function generateSummaryReport(
  chatRuns: ChatRunLog[],
  flowRuns: FlowRunLog[]
): string {
  const allModelCalls = [
    ...chatRuns.map(r => r.modelCall),
    ...flowRuns.flatMap(f => f.steps.flatMap(s => s.modelCalls || [])),
  ];

  const analysis = aggregateCostAnalysis(allModelCalls);

  let report = `
=== Overall Cost Summary ===
Total Runs: ${chatRuns.length + flowRuns.length}
  - Chat Runs: ${chatRuns.length}
  - Flow Runs: ${flowRuns.length}

Total API Calls: ${analysis.totalCalls}
Total Tokens:    ${formatTokens(analysis.totalTokens)}
  - Input:  ${formatTokens(analysis.totalPromptTokens)}
  - Output: ${formatTokens(analysis.totalCompletionTokens)}

Total Cost: ${formatCost(analysis.totalCost)}

Average per Run:
  Tokens: ${formatTokens(Math.round(analysis.totalTokens / (chatRuns.length + flowRuns.length)))}
  Cost:   ${formatCost(analysis.totalCost / (chatRuns.length + flowRuns.length))}
`;

  // Cost by provider
  report += '\n\nBy Provider:';
  for (const [provider, stats] of Object.entries(analysis.byProvider)) {
    report += `\n  ${provider}:`;
    report += `\n    Cost:   ${formatCost(stats.cost)} (${((stats.cost / analysis.totalCost) * 100).toFixed(1)}%)`;
    report += `\n    Tokens: ${formatTokens(stats.tokens)}`;
    report += `\n    Calls:  ${stats.calls}`;
  }

  return report.trim();
}
