/**
 * Local LLM Provider
 * Handles LM Studio / Ollama compatible endpoints
 */

import OpenAI from 'openai';
import { ModelSettings, ModelCallLog } from '@/types';

export interface LocalCallParams {
  modelId: string;
  systemPrompt?: string;
  prompt: string;
  settings: ModelSettings;
}

export async function callLocal(
  params: LocalCallParams
): Promise<ModelCallLog> {
  const baseUrl = process.env.LOCAL_LLM_BASE_URL;
  if (!baseUrl) {
    throw new Error('LOCAL_LLM_BASE_URL not configured');
  }

  // Use OpenAI client with custom base URL for compatibility
  const client = new OpenAI({
    apiKey: process.env.LOCAL_LLM_API_KEY || 'not-needed',
    baseURL: baseUrl,
  });

  const startTime = Date.now();

  try {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }

    messages.push({ role: 'user', content: params.prompt });

    const response = await client.chat.completions.create({
      model: 'local-model', // LM Studio doesn't require specific model name
      messages,
      max_tokens: params.settings.maxTokens,
      temperature: params.settings.temperature,
      top_p: params.settings.topP,
      stop: params.settings.stopSequences,
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const responseText = response.choices[0]?.message?.content || '';

    return {
      modelId: params.modelId,
      provider: 'local',
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
    throw new Error(`Local LLM error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Stream Local LLM responses
 * Returns an async generator that yields text chunks
 */
export async function* streamLocal(
  params: LocalCallParams
): AsyncGenerator<string, ModelCallLog, undefined> {
  const baseUrl = process.env.LOCAL_LLM_BASE_URL;
  if (!baseUrl) {
    throw new Error('LOCAL_LLM_BASE_URL not configured');
  }

  // Use OpenAI client with custom base URL for compatibility
  const client = new OpenAI({
    apiKey: process.env.LOCAL_LLM_API_KEY || 'not-needed',
    baseURL: baseUrl,
  });

  const startTime = Date.now();

  try {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }

    messages.push({ role: 'user', content: params.prompt });

    const stream = await client.chat.completions.create({
      model: 'local-model', // LM Studio doesn't require specific model name
      messages,
      max_tokens: params.settings.maxTokens,
      temperature: params.settings.temperature,
      top_p: params.settings.topP,
      stop: params.settings.stopSequences,
      stream: true,
    });

    let fullResponse = '';
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullResponse += delta;
        yield delta;
      }

      // Capture usage info if available
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens || 0;
        completionTokens = chunk.usage.completion_tokens || 0;
      }
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Return final metadata
    return {
      modelId: params.modelId,
      provider: 'local',
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      response: fullResponse,
      settings: {
        temperature: params.settings.temperature,
        maxTokens: params.settings.maxTokens,
        topP: params.settings.topP,
      },
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      durationMs,
    };
  } catch (error) {
    throw new Error(`Local LLM error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
