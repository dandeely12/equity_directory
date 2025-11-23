/**
 * Models List API
 * GET: List all available models grouped by provider
 */

import { NextResponse } from 'next/server';
import { ALL_MODELS, ANTHROPIC_MODELS, OPENAI_MODELS, LOCAL_MODELS } from '@/lib/config/models';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        all: ALL_MODELS,
        byProvider: {
          anthropic: ANTHROPIC_MODELS,
          openai: OPENAI_MODELS,
          local: LOCAL_MODELS,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch models',
      },
      { status: 500 }
    );
  }
}
