/**
 * Run Details API
 * GET: Get detailed information about a specific run
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, parseJson } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Try to find as chat run first
    const chatRun = await prisma.chatRun.findUnique({
      where: { id },
    });

    if (chatRun) {
      return NextResponse.json({
        success: true,
        data: {
          id: chatRun.id,
          type: 'chat',
          mode: chatRun.mode,
          userMessage: chatRun.userMessage,
          assistantMessage: chatRun.assistantMessage,
          modelCall: parseJson(chatRun.modelCall, {}),
          vectorSearch: chatRun.vectorSearch ? parseJson(chatRun.vectorSearch, null) : null,
          toolCalls: parseJson(chatRun.toolCalls, []),
          events: parseJson(chatRun.events, []),
          startTime: chatRun.startTime,
          endTime: chatRun.endTime,
          durationMs: chatRun.durationMs,
          totalTokens: chatRun.totalTokens,
          totalCost: chatRun.totalCost,
          error: chatRun.error,
        },
      });
    }

    // Try to find as flow run
    const flowRun = await prisma.flowRun.findUnique({
      where: { id },
    });

    if (flowRun) {
      return NextResponse.json({
        success: true,
        data: {
          id: flowRun.id,
          type: 'flow',
          flowId: flowRun.flowId,
          flowName: flowRun.flowName,
          status: flowRun.status,
          inputs: parseJson(flowRun.inputs, {}),
          outputs: parseJson(flowRun.outputs, {}),
          steps: parseJson(flowRun.steps, []),
          startTime: flowRun.startTime,
          endTime: flowRun.endTime,
          durationMs: flowRun.durationMs,
          totalTokens: flowRun.totalTokens,
          totalCost: flowRun.totalCost,
          error: flowRun.error,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Run not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching run details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch run details',
      },
      { status: 500 }
    );
  }
}
