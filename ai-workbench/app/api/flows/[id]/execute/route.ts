/**
 * Flow Execution API
 * POST: Execute a flow with given inputs
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeFlow, getFlowById } from '@/lib/flows/engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { inputs } = await request.json();

    if (!inputs || typeof inputs !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Inputs must be an object' },
        { status: 400 }
      );
    }

    // Get flow definition
    const { id } = await params;
    const flow = await getFlowById(id);

    if (!flow) {
      return NextResponse.json(
        { success: false, error: 'Flow not found' },
        { status: 404 }
      );
    }

    // Execute flow
    const flowRun = await executeFlow(flow, inputs);

    return NextResponse.json({
      success: true,
      data: flowRun,
    });
  } catch (error) {
    console.error('Error executing flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute flow',
      },
      { status: 500 }
    );
  }
}
