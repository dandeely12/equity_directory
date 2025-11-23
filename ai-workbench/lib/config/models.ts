/**
 * Model Definitions and Provider Configurations
 * Central registry of available models
 */

import { ModelDefinition, ModelProviderConfig } from '@/types';

/**
 * Anthropic Models
 */
export const ANTHROPIC_MODELS: ModelDefinition[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 8192,
    supportsStreaming: true,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    supportsStreaming: true,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    supportsStreaming: true,
    costPer1kInput: 0.00025,
    costPer1kOutput: 0.00125,
  },
];

/**
 * OpenAI Models
 */
export const OPENAI_MODELS: ModelDefinition[] = [
  {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    maxTokens: 4096,
    supportsStreaming: true,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    contextWindow: 8192,
    maxTokens: 4096,
    supportsStreaming: true,
    costPer1kInput: 0.03,
    costPer1kOutput: 0.06,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 16385,
    maxTokens: 4096,
    supportsStreaming: true,
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015,
  },
];

/**
 * Local Models (LM Studio / Ollama)
 */
export const LOCAL_MODELS: ModelDefinition[] = [
  {
    id: 'local-llm',
    name: 'Local LLM (LM Studio)',
    provider: 'local',
    contextWindow: 8192,
    maxTokens: 4096,
    supportsStreaming: true,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
];

/**
 * All Models Combined
 */
export const ALL_MODELS: ModelDefinition[] = [
  ...ANTHROPIC_MODELS,
  ...OPENAI_MODELS,
  ...LOCAL_MODELS,
];

/**
 * Provider Configurations
 */
export function getProviderConfig(provider: 'anthropic' | 'openai' | 'local'): ModelProviderConfig {
  const configs = {
    anthropic: {
      provider: 'anthropic' as const,
      apiKey: process.env.ANTHROPIC_API_KEY,
      models: ANTHROPIC_MODELS,
    },
    openai: {
      provider: 'openai' as const,
      apiKey: process.env.OPENAI_API_KEY,
      models: OPENAI_MODELS,
    },
    local: {
      provider: 'local' as const,
      baseUrl: process.env.LOCAL_LLM_BASE_URL,
      apiKey: process.env.LOCAL_LLM_API_KEY || 'not-needed',
      models: LOCAL_MODELS,
    },
  };

  return configs[provider];
}

/**
 * Get model by ID
 */
export function getModelById(modelId: string): ModelDefinition | undefined {
  return ALL_MODELS.find(m => m.id === modelId);
}

/**
 * Calculate cost for a run
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelById(modelId);
  if (!model || !model.costPer1kInput || !model.costPer1kOutput) {
    return 0;
  }

  const inputCost = (inputTokens / 1000) * model.costPer1kInput;
  const outputCost = (outputTokens / 1000) * model.costPer1kOutput;

  return inputCost + outputCost;
}
