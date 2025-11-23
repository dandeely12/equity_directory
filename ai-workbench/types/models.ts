/**
 * Model Provider Types
 * Defines the different LLM providers and their configurations
 */

export type ModelProvider = 'anthropic' | 'openai' | 'local';

export interface ModelDefinition {
  id: string;
  name: string;
  provider: ModelProvider;
  contextWindow: number;
  maxTokens: number;
  supportsStreaming: boolean;
  costPer1kInput?: number;  // USD
  costPer1kOutput?: number; // USD
}

export interface ModelSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface ModelProfile {
  id: string;
  name: string;
  description?: string;
  modelId: string;
  systemPrompt: string;
  settings: ModelSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelProviderConfig {
  provider: ModelProvider;
  apiKey?: string;
  baseUrl?: string;
  models: ModelDefinition[];
}

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
};
