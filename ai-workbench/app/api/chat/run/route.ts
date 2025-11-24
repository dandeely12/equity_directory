/**
 * Chat API (PLACEHOLDER)
 * POST: Run a chat interaction (direct or RAG mode)
 */

import { NextRequest, NextResponse } from 'next/server';
import { callModel } from '@/lib/providers';
import { vectorSearchTool } from '@/lib/tools';
import { DEFAULT_MODEL_SETTINGS } from '@/types';
import { prisma, stringifyJson } from '@/lib/db';
import { calculateCost } from '@/lib/config/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      messages,
      modelId,
      model,
      systemPrompt,
      mode = 'direct',
      collectionName,
      settings = DEFAULT_MODEL_SETTINGS,
    } = body;

    // Support both formats: message or messages array
    const finalModelId = modelId || model;
    let userMessage = message;

    if (!userMessage && messages && Array.isArray(messages)) {
      // Extract message from messages array (OpenAI format)
      const userMsg = messages.find((m: any) => m.role === 'user');
      if (userMsg) {
        userMessage = userMsg.content;
      }
    }

    if (!userMessage || !finalModelId) {
      return NextResponse.json(
        { success: false, error: 'Message and model ID are required' },
        { status: 400 }
      );
    }

    const startTime = new Date();
    let vectorSearchLog = null;
    let finalPrompt = userMessage;

    // If RAG mode, perform vector search first
    if (mode === 'vector_rag' && collectionName) {
      vectorSearchLog = await vectorSearchTool({
        query: userMessage,
        collectionName,
        limit: 5,
        scoreThreshold: 0.7,
      });

      // Build context from retrieved chunks
      const context = vectorSearchLog.results
        .map((r, idx) => `[${idx + 1}] ${r.content}`)
        .join('\n\n');

      // Augment prompt with context
      finalPrompt = `Context from knowledge base:\n\n${context}\n\n---\n\nUser question: ${userMessage}`;
    }

    // Call the model
    const modelCall = await callModel({
      modelId: finalModelId,
      systemPrompt,
      prompt: finalPrompt,
      settings,
    });

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    // Calculate cost
    const cost = calculateCost(
      finalModelId,
      modelCall.usage.promptTokens,
      modelCall.usage.completionTokens
    );

    // Save to database
    const chatRun = await prisma.chatRun.create({
      data: {
        mode,
        userMessage,
        assistantMessage: modelCall.response,
        modelCall: stringifyJson(modelCall),
        vectorSearch: vectorSearchLog ? stringifyJson(vectorSearchLog) : null,
        toolCalls: stringifyJson([]),
        events: stringifyJson([]),
        startTime,
        endTime,
        durationMs,
        totalTokens: modelCall.usage.totalTokens,
        totalCost: cost,
      },
    });

    return NextResponse.json({
      success: true,
      logId: chatRun.id,
      runId: chatRun.id,
      response: modelCall.response,
      message: modelCall.response,
      inputTokens: modelCall.usage.promptTokens,
      outputTokens: modelCall.usage.completionTokens,
      totalTokens: modelCall.usage.totalTokens,
      usage: modelCall.usage,
      cost,
      durationMs,
      vectorSearch: vectorSearchLog,
    });
  } catch (error) {
    console.error('Error running chat:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run chat',
      },
      { status: 500 }
    );
  }
}
