/**
 * OpenAI Provider
 * Handles GPT API calls
 */

import OpenAI from 'openai';
import { ModelSettings, ModelCallLog } from '@/types';

export interface OpenAICallParams {
  modelId: string;
  systemPrompt?: string;
  prompt: string;
  settings: ModelSettings;
}

export async function callOpenAI(
  params: OpenAICallParams
): Promise<ModelCallLog> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const client = new OpenAI({ apiKey });
  const startTime = Date.now();

  try {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }

    messages.push({ role: 'user', content: params.prompt });

    const response = await client.chat.completions.create({
      model: params.modelId,
      messages,
      max_tokens: params.settings.maxTokens,
      temperature: params.settings.temperature,
      top_p: params.settings.topP,
      frequency_penalty: params.settings.frequencyPenalty || 0,
      presence_penalty: params.settings.presencePenalty || 0,
      stop: params.settings.stopSequences,
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const responseText = response.choices[0]?.message?.content || '';

    return {
      modelId: params.modelId,
      provider: 'openai',
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      response: responseText,
      settings: {
        temperature: params.settings.temperature,
        maxTokens: params.settings.maxTokens,
        topP: params.settings.topP,
      },
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      durationMs,
    };
  } catch (error) {
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
