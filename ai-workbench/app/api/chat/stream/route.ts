/**
 * Streaming Chat API
 * POST: Run a chat interaction with streaming responses (SSE)
 */

import { NextRequest } from 'next/server';
import { streamModel } from '@/lib/providers';
import { vectorSearchTool } from '@/lib/tools';
import { DEFAULT_MODEL_SETTINGS } from '@/types';
import { prisma, stringifyJson } from '@/lib/db';
import { calculateCost } from '@/lib/config/models';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const {
    message,
    modelId,
    systemPrompt,
    mode = 'direct',
    collectionName,
    settings = DEFAULT_MODEL_SETTINGS,
  } = await request.json();

  if (!message || !modelId) {
    return new Response('Message and model ID are required', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const startTime = new Date();
        let vectorSearchLog = null;
        let finalPrompt = message;

        // If RAG mode, perform vector search first
        if (mode === 'vector_rag' && collectionName) {
          // Send status event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Searching knowledge base...' })}\n\n`)
          );

          vectorSearchLog = await vectorSearchTool({
            query: message,
            collectionName,
            limit: 5,
            scoreThreshold: 0.7,
          });

          // Send vector search results
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'vector_search', data: vectorSearchLog })}\n\n`)
          );

          // Build context from retrieved chunks
          const context = vectorSearchLog.results
            .map((r, idx) => `[${idx + 1}] ${r.content}`)
            .join('\n\n');

          // Augment prompt with context
          finalPrompt = `Context from knowledge base:\n\n${context}\n\n---\n\nUser question: ${message}`;
        }

        // Send status event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Generating response...' })}\n\n`)
        );

        // Stream the model response
        const generator = streamModel({
          modelId,
          systemPrompt,
          prompt: finalPrompt,
          settings,
        });

        let lastChunk: string | undefined;
        for await (const chunk of generator) {
          lastChunk = chunk;
          // Send text chunk
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
          );
        }

        // The generator returns the final metadata when done
        const modelCall = lastChunk !== undefined ? await generator.next() : { value: undefined };
        const finalMetadata = modelCall.value;

        if (!finalMetadata) {
          throw new Error('Failed to get model response metadata');
        }

        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();

        // Calculate cost
        const cost = calculateCost(
          modelId,
          finalMetadata.usage.promptTokens,
          finalMetadata.usage.completionTokens
        );

        // Save to database
        const chatRun = await prisma.chatRun.create({
          data: {
            mode,
            userMessage: message,
            assistantMessage: finalMetadata.response,
            modelCall: stringifyJson(finalMetadata),
            vectorSearch: vectorSearchLog ? stringifyJson(vectorSearchLog) : null,
            toolCalls: stringifyJson([]),
            events: stringifyJson([]),
            startTime,
            endTime,
            durationMs,
            totalTokens: finalMetadata.usage.totalTokens,
            totalCost: cost,
          },
        });

        // Send completion event with metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              data: {
                runId: chatRun.id,
                usage: finalMetadata.usage,
                cost,
                durationMs,
              },
            })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Failed to stream chat',
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
