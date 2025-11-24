/**
 * Individual Flow API
 * GET: Get a specific flow
 * PUT: Update a flow
 * DELETE: Delete a flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, stringifyJson } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flow = await prisma.flow.findUnique({
      where: { id: params.id },
      include: {
        runs: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
      },
    });

    if (!flow) {
      return NextResponse.json(
        { success: false, error: 'Flow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        steps: JSON.parse(flow.steps),
        inputVariables: JSON.parse(flow.inputVariables),
        outputVariable: flow.outputVariable,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
        recentRuns: flow.runs.map((run) => ({
          id: run.id,
          status: run.status,
          startTime: run.startTime,
          endTime: run.endTime,
          durationMs: run.durationMs,
          totalTokens: run.totalTokens,
          totalCost: run.totalCost,
          error: run.error,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch flow',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, steps, inputVariables, outputVariable } =
      await request.json();

    // Check if flow exists
    const existing = await prisma.flow.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Flow not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check for conflicts
    if (name && name !== existing.name) {
      const nameConflict = await prisma.flow.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'Flow with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update flow
    const flow = await prisma.flow.update({
      where: { id: params.id },
      data: {
        name: name || existing.name,
        description: description || existing.description,
        steps: steps ? stringifyJson(steps) : existing.steps,
        inputVariables: inputVariables
          ? stringifyJson(inputVariables)
          : existing.inputVariables,
        outputVariable: outputVariable || existing.outputVariable,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        steps: JSON.parse(flow.steps),
        inputVariables: JSON.parse(flow.inputVariables),
        outputVariable: flow.outputVariable,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update flow',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if flow exists
    const flow = await prisma.flow.findUnique({
      where: { id: params.id },
    });

    if (!flow) {
      return NextResponse.json(
        { success: false, error: 'Flow not found' },
        { status: 404 }
      );
    }

    // Delete flow (cascade will delete associated runs)
    await prisma.flow.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Flow deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete flow',
      },
      { status: 500 }
    );
  }
}
