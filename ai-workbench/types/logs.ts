/**
 * Logging and Observability Types
 * Comprehensive run tracking for transparency
 */

import { FlowStepRun } from './flows';
import { RetrievalResult } from './documents';

export type RunType = 'chat' | 'flow';
export type ChatMode = 'direct' | 'vector_rag';

/**
 * Tool Call Log
 * Tracks individual tool invocations
 */
export interface ToolCall {
  id: string;
  toolName: 'vector_search' | 'document_read' | string;
  arguments: Record<string, any>;
  result: any;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  error?: string;
}

/**
 * Vector Search Log
 * Detailed logging for vector searches
 */
export interface VectorSearchLog {
  query: string;
  collection: string;
  filters?: Record<string, any>;
  limit: number;
  scoreThreshold?: number;
  results: RetrievalResult[];
  durationMs: number;
  embeddingDurationMs: number;
  searchDurationMs: number;
}

/**
 * Model Call Log
 * Tracks LLM API calls
 */
export interface ModelCallLog {
  modelId: string;
  provider: string;
  prompt: string;
  systemPrompt?: string;
  response: string;
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  durationMs: number;
  cached?: boolean;
}

/**
 * Run Event
 * Timeline event during execution
 */
export interface RunEvent {
  id: string;
  timestamp: Date;
  type: 'start' | 'tool_call' | 'model_call' | 'vector_search' | 'error' | 'end';
  description: string;
  data?: any;
  durationMs?: number;
}

/**
 * Chat Run Log
 * For single chat messages (direct or RAG)
 */
export interface ChatRunLog {
  id: string;
  type: 'chat';
  mode: ChatMode;
  userMessage: string;
  assistantMessage: string;
  modelCall: ModelCallLog;
  vectorSearch?: VectorSearchLog;
  toolCalls: ToolCall[];
  events: RunEvent[];
  startTime: Date;
  endTime: Date;
  durationMs: number;
  totalTokens: number;
  totalCost: number;
  error?: string;
}

/**
 * Flow Run Log
 * For multi-step flow executions
 */
export interface FlowRunLog {
  id: string;
  type: 'flow';
  flowId: string;
  flowName: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  steps: FlowStepRun[];
  events: RunEvent[];
  startTime: Date;
  endTime: Date;
  durationMs: number;
  totalTokens: number;
  totalCost: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

/**
 * Union type for all run logs
 */
export type RunLog = ChatRunLog | FlowRunLog;

/**
 * Observability Summary
 * Quick stats for displaying in UI
 */
export interface RunSummary {
  id: string;
  type: RunType;
  mode?: ChatMode;
  name: string;  // User message or flow name
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  durationMs: number;
  totalTokens: number;
  totalCost: number;
  error?: string;
}

/**
 * Performance Metrics
 * For tracking system performance
 */
export interface PerformanceMetrics {
  runId: string;
  embeddingTimeMs: number;
  vectorSearchTimeMs: number;
  modelCallTimeMs: number;
  totalTimeMs: number;
  tokensPerSecond?: number;
}
