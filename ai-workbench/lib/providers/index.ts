/**
 * Unified Model Provider Interface
 * Routes calls to the appropriate provider
 */

import { ModelSettings, ModelCallLog } from '@/types';
import { getModelById } from '@/lib/config/models';
import { callAnthropic } from './anthropic';
import { callOpenAI } from './openai';
import { callLocal } from './local';

export interface CallModelParams {
  modelId: string;
  systemPrompt?: string;
  prompt: string;
  settings: ModelSettings;
}

/**
 * Call any model by routing to the appropriate provider
 */
export async function callModel(params: CallModelParams): Promise<ModelCallLog> {
  const model = getModelById(params.modelId);

  if (!model) {
    throw new Error(`Model not found: ${params.modelId}`);
  }

  switch (model.provider) {
    case 'anthropic':
      return callAnthropic(params);

    case 'openai':
      return callOpenAI(params);

    case 'local':
      return callLocal(params);

    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
}

export { callAnthropic } from './anthropic';
export { callOpenAI } from './openai';
export { callLocal } from './local';
