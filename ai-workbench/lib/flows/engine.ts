/**
 * Flow Execution Engine
 * Executes multi-step workflows with variable substitution
 */

import {
  FlowDefinition,
  FlowStep,
  FlowStepRun,
  FlowRun,
  ModelCallStep,
  VectorSearchStep,
  DocumentReadStep,
} from '@/types/flows';
import { callModel } from '@/lib/providers';
import { vectorSearchTool } from '@/lib/tools';
import { calculateCost } from '@/lib/config/models';
import { prisma, stringifyJson } from '@/lib/db';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * Template variable substitution
 * Replaces {{variable}} with values from context
 */
function substituteVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;

  // Replace all {{variable}} patterns
  const regex = /\{\{(\w+)\}\}/g;
  result = result.replace(regex, (match, varName) => {
    if (varName in variables) {
      const value = variables[varName];
      // Convert arrays and objects to readable strings
      if (Array.isArray(value)) {
        return value.map(item =>
          typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)
        ).join('\n\n');
      }
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    }
    return match; // Keep original if variable not found
  });

  return result;
}

/**
 * Execute a model call step
 */
async function executeModelCallStep(
  step: ModelCallStep,
  variables: Record<string, any>
): Promise<{ output: any; metadata: any }> {
  const prompt = substituteVariables(step.promptTemplate, variables);
  const systemPrompt = step.systemPrompt
    ? substituteVariables(step.systemPrompt, variables)
    : undefined;

  const modelCall = await callModel({
    modelId: step.modelId,
    systemPrompt,
    prompt,
    settings: step.settings || {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
    },
  });

  const cost = calculateCost(
    step.modelId,
    modelCall.usage.promptTokens,
    modelCall.usage.completionTokens
  );

  return {
    output: modelCall.response,
    metadata: {
      tokensUsed: modelCall.usage.totalTokens,
      cost,
      promptTokens: modelCall.usage.promptTokens,
      completionTokens: modelCall.usage.completionTokens,
      durationMs: modelCall.durationMs,
    },
  };
}

/**
 * Execute a vector search step
 */
async function executeVectorSearchStep(
  step: VectorSearchStep,
  variables: Record<string, any>
): Promise<{ output: any; metadata: any }> {
  const query = substituteVariables(step.queryTemplate, variables);

  const searchResult = await vectorSearchTool({
    query,
    collectionName: step.collectionName,
    limit: step.limit || 5,
    scoreThreshold: step.scoreThreshold || 0.7,
    filters: step.filters,
  });

  return {
    output: searchResult.results,
    metadata: {
      retrievedChunks: searchResult.results.length,
      durationMs: searchResult.durationMs,
    },
  };
}

/**
 * Execute a document read step
 */
async function executeDocumentReadStep(
  step: DocumentReadStep,
  variables: Record<string, any>
): Promise<{ output: any; metadata: any }> {
  const startTime = Date.now();
  const documentPath = substituteVariables(step.documentPath, variables);

  try {
    // Resolve path relative to project root
    const absolutePath = resolve(process.cwd(), documentPath);
    const content = await readFile(absolutePath, 'utf-8');

    const durationMs = Date.now() - startTime;

    return {
      output: content,
      metadata: {
        documentPath: absolutePath,
        contentLength: content.length,
        durationMs,
      },
    };
  } catch (error) {
    throw new Error(`Failed to read document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a single flow step
 */
async function executeStep(
  step: FlowStep,
  variables: Record<string, any>
): Promise<FlowStepRun> {
  const startTime = new Date();
  const inputs = { ...variables };

  try {
    let result: { output: any; metadata: any };

    switch (step.type) {
      case 'model_call':
        result = await executeModelCallStep(step as ModelCallStep, variables);
        break;

      case 'vector_search':
        result = await executeVectorSearchStep(step as VectorSearchStep, variables);
        break;

      case 'document_read':
        result = await executeDocumentReadStep(step as DocumentReadStep, variables);
        break;

      case 'branch':
        throw new Error('Branch steps are not yet implemented');

      default:
        throw new Error(`Unknown step type: ${(step as any).type}`);
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    return {
      stepId: step.id,
      stepType: step.type,
      stepName: step.name,
      startTime,
      endTime,
      durationMs,
      inputs,
      outputs: { [step.outputVariable]: result.output },
      metadata: result.metadata,
    };
  } catch (error) {
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    return {
      stepId: step.id,
      stepType: step.type,
      stepName: step.name,
      startTime,
      endTime,
      durationMs,
      inputs,
      outputs: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a complete flow
 */
export async function executeFlow(
  flow: FlowDefinition,
  inputs: Record<string, any>
): Promise<FlowRun> {
  const startTime = new Date();
  const variables: Record<string, any> = { ...inputs };
  const stepRuns: FlowStepRun[] = [];
  let totalTokens = 0;
  let totalCost = 0;
  let status: 'running' | 'completed' | 'failed' = 'running';
  let flowError: string | undefined;

  // Create initial flow run record
  const flowRun = await prisma.flowRun.create({
    data: {
      flowId: flow.id,
      flowName: flow.name,
      status: 'running',
      startTime,
      inputs: stringifyJson(inputs),
      outputs: stringifyJson({}),
      steps: stringifyJson([]),
    },
  });

  try {
    // Validate required inputs
    const missingInputs = flow.inputVariables.filter(
      (varName) => !(varName in inputs)
    );

    if (missingInputs.length > 0) {
      throw new Error(`Missing required inputs: ${missingInputs.join(', ')}`);
    }

    // Execute steps sequentially
    for (const step of flow.steps) {
      const stepRun = await executeStep(step, variables);
      stepRuns.push(stepRun);

      // If step failed, stop execution
      if (stepRun.error) {
        status = 'failed';
        flowError = `Step "${step.name}" failed: ${stepRun.error}`;
        break;
      }

      // Add step output to variables for next steps
      Object.assign(variables, stepRun.outputs);

      // Accumulate tokens and cost
      if (stepRun.metadata?.tokensUsed) {
        totalTokens += stepRun.metadata.tokensUsed;
      }
      if (stepRun.metadata?.cost) {
        totalCost += stepRun.metadata.cost;
      }

      // Update flow run in database with progress
      await prisma.flowRun.update({
        where: { id: flowRun.id },
        data: {
          steps: stringifyJson(stepRuns),
          totalTokens,
          totalCost,
        },
      });
    }

    // If all steps succeeded, mark as completed
    if (status === 'running') {
      status = 'completed';
    }
  } catch (error) {
    status = 'failed';
    flowError = error instanceof Error ? error.message : 'Unknown error';
  }

  const endTime = new Date();
  const durationMs = endTime.getTime() - startTime.getTime();

  // Get final output
  const finalOutput = flow.outputVariable in variables
    ? variables[flow.outputVariable]
    : null;

  // Update final flow run record
  await prisma.flowRun.update({
    where: { id: flowRun.id },
    data: {
      status,
      endTime,
      durationMs,
      outputs: stringifyJson({ [flow.outputVariable]: finalOutput }),
      steps: stringifyJson(stepRuns),
      error: flowError,
      totalTokens,
      totalCost,
    },
  });

  return {
    id: flowRun.id,
    flowId: flow.id,
    flowName: flow.name,
    status,
    startTime,
    endTime,
    durationMs,
    inputs,
    outputs: { [flow.outputVariable]: finalOutput },
    steps: stepRuns,
    error: flowError,
    totalTokens,
    totalCost,
  };
}

/**
 * Get flow by ID from database
 */
export async function getFlowById(flowId: string): Promise<FlowDefinition | null> {
  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
  });

  if (!flow) {
    return null;
  }

  return {
    id: flow.id,
    name: flow.name,
    description: flow.description,
    steps: JSON.parse(flow.steps),
    inputVariables: JSON.parse(flow.inputVariables),
    outputVariable: flow.outputVariable,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt,
  };
}
