/**
 * Flows API
 * GET: List all flows
 * POST: Create a new flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, stringifyJson } from '@/lib/db';

export async function GET() {
  try {
    const flows = await prisma.flow.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { runs: true },
        },
      },
    });

    const flowsWithParsedData = flows.map((flow) => ({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      steps: JSON.parse(flow.steps),
      inputVariables: JSON.parse(flow.inputVariables),
      outputVariable: flow.outputVariable,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
      runCount: flow._count.runs,
    }));

    return NextResponse.json({
      success: true,
      data: flowsWithParsedData,
    });
  } catch (error) {
    console.error('Error fetching flows:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch flows',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, steps, inputVariables, outputVariable } =
      await request.json();

    // Validate required fields
    if (!name || !description || !steps || !inputVariables || !outputVariable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, description, steps, inputVariables, and outputVariable are required',
        },
        { status: 400 }
      );
    }

    // Validate steps array
    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Steps must be a non-empty array' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.flow.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Flow with this name already exists' },
        { status: 409 }
      );
    }

    // Create flow
    const flow = await prisma.flow.create({
      data: {
        name,
        description,
        steps: stringifyJson(steps),
        inputVariables: stringifyJson(inputVariables),
        outputVariable,
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
    console.error('Error creating flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create flow',
      },
      { status: 500 }
    );
  }
}
