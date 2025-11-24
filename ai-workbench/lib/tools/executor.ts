/**
 * Tool Executor
 * Executes tool calls requested by LLMs
 */

import { ToolCall, ToolResult, ToolExecutionContext } from '@/types/tools';
import { vectorSearchTool } from '@/lib/tools';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { evaluate } from 'mathjs';

/**
 * Execute vector search tool
 */
async function executeVectorSearch(
  args: Record<string, any>,
  context: ToolExecutionContext
): Promise<any> {
  const { query, collectionName, limit = 5, scoreThreshold = 0.7 } = args;

  const result = await vectorSearchTool({
    query,
    collectionName: collectionName || context.collectionName || 'docs',
    limit,
    scoreThreshold,
  });

  return {
    results: result.results.map((r) => ({
      content: r.content,
      score: r.score,
      metadata: r.metadata,
    })),
    count: result.results.length,
  };
}

/**
 * Execute web search tool
 */
async function executeWebSearch(args: Record<string, any>): Promise<any> {
  // Placeholder for web search implementation
  // You could integrate with SerpAPI, Brave Search, etc.
  return {
    results: [],
    message: 'Web search not yet implemented. Integrate with a search API.',
  };
}

/**
 * Execute read file tool
 */
async function executeReadFile(
  args: Record<string, any>,
  context: ToolExecutionContext
): Promise<any> {
  const { path } = args;
  const basePath = context.workingDirectory || process.cwd();
  const absolutePath = resolve(basePath, path);

  try {
    const content = await readFile(absolutePath, 'utf-8');
    return {
      content,
      path: absolutePath,
      size: content.length,
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute write file tool
 */
async function executeWriteFile(
  args: Record<string, any>,
  context: ToolExecutionContext
): Promise<any> {
  if (!context.allowFileWrite) {
    throw new Error('File writing is not allowed in this context');
  }

  const { path, content } = args;
  const basePath = context.workingDirectory || process.cwd();
  const absolutePath = resolve(basePath, path);

  try {
    await writeFile(absolutePath, content, 'utf-8');
    return {
      success: true,
      path: absolutePath,
      bytesWritten: content.length,
    };
  } catch (error) {
    throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute get current time tool
 */
async function executeGetCurrentTime(args: Record<string, any>): Promise<any> {
  const { timezone = 'UTC' } = args;

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    return {
      datetime: now.toISOString(),
      formatted: formatter.format(now),
      timezone,
      timestamp: now.getTime(),
    };
  } catch (error) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
}

/**
 * Execute calculator tool
 */
async function executeCalculator(args: Record<string, any>): Promise<any> {
  const { expression } = args;

  try {
    const result = evaluate(expression);
    return {
      expression,
      result,
      type: typeof result,
    };
  } catch (error) {
    throw new Error(`Failed to evaluate expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a single tool call
 */
export async function executeTool(
  toolCall: ToolCall,
  context: ToolExecutionContext = {}
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    let result: any;

    switch (toolCall.name) {
      case 'vector_search':
        result = await executeVectorSearch(toolCall.arguments, context);
        break;

      case 'web_search':
        result = await executeWebSearch(toolCall.arguments);
        break;

      case 'read_file':
        result = await executeReadFile(toolCall.arguments, context);
        break;

      case 'write_file':
        result = await executeWriteFile(toolCall.arguments, context);
        break;

      case 'get_current_time':
        result = await executeGetCurrentTime(toolCall.arguments);
        break;

      case 'calculator':
        result = await executeCalculator(toolCall.arguments);
        break;

      default:
        throw new Error(`Unknown tool: ${toolCall.name}`);
    }

    const durationMs = Date.now() - startTime;

    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      result,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs,
    };
  }
}

/**
 * Execute multiple tool calls in parallel
 */
export async function executeTools(
  toolCalls: ToolCall[],
  context: ToolExecutionContext = {}
): Promise<ToolResult[]> {
  return Promise.all(
    toolCalls.map((toolCall) => executeTool(toolCall, context))
  );
}
