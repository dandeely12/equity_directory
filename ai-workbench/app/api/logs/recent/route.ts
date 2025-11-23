/**
 * Recent Logs API
 * GET: List recent chat and flow runs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, parseJson } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // 'chat' or 'flow' or null for all

    // Fetch chat runs
    const chatRuns = type === 'flow' ? [] : await prisma.chatRun.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        mode: true,
        userMessage: true,
        startTime: true,
        durationMs: true,
        totalTokens: true,
        totalCost: true,
        error: true,
      },
    });

    // Fetch flow runs
    const flowRuns = type === 'chat' ? [] : await prisma.flowRun.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        flowName: true,
        status: true,
        startTime: true,
        durationMs: true,
        totalTokens: true,
        totalCost: true,
        error: true,
      },
    });

    // Combine and sort
    const allRuns = [
      ...chatRuns.map(run => ({
        id: run.id,
        type: 'chat' as const,
        name: run.userMessage.slice(0, 60) + (run.userMessage.length > 60 ? '...' : ''),
        mode: run.mode,
        status: run.error ? 'failed' : 'completed',
        startTime: run.startTime,
        durationMs: run.durationMs,
        totalTokens: run.totalTokens,
        totalCost: run.totalCost,
        error: run.error,
      })),
      ...flowRuns.map(run => ({
        id: run.id,
        type: 'flow' as const,
        name: run.flowName,
        status: run.status,
        startTime: run.startTime,
        durationMs: run.durationMs || 0,
        totalTokens: run.totalTokens || 0,
        totalCost: run.totalCost || 0,
        error: run.error,
      })),
    ].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
     .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: allRuns,
    });
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch logs',
      },
      { status: 500 }
    );
  }
}
