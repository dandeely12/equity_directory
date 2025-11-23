/**
 * Anthropic Provider
 * Handles Claude API calls
 */

import Anthropic from '@anthropic-ai/sdk';
import { ModelSettings, ModelCallLog } from '@/types';

export interface AnthropicCallParams {
  modelId: string;
  systemPrompt?: string;
  prompt: string;
  settings: ModelSettings;
}

export async function callAnthropic(
  params: AnthropicCallParams
): Promise<ModelCallLog> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey });
  const startTime = Date.now();

  try {
    const response = await client.messages.create({
      model: params.modelId,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.prompt }],
      max_tokens: params.settings.maxTokens,
      temperature: params.settings.temperature,
      top_p: params.settings.topP,
      stop_sequences: params.settings.stopSequences,
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Extract text content
    const content = response.content.find(c => c.type === 'text');
    const responseText = content && content.type === 'text' ? content.text : '';

    return {
      modelId: params.modelId,
      provider: 'anthropic',
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      response: responseText,
      settings: {
        temperature: params.settings.temperature,
        maxTokens: params.settings.maxTokens,
        topP: params.settings.topP,
      },
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      durationMs,
    };
  } catch (error) {
    throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
