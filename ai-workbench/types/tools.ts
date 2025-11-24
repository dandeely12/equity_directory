/**
 * Tool/Function Calling Types
 * Unified interface for OpenAI and Claude tool use
 */

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: any;
  error?: string;
  durationMs: number;
}

/**
 * Built-in tool implementations
 */
export type BuiltInTool =
  | 'vector_search'
  | 'web_search'
  | 'read_file'
  | 'write_file'
  | 'execute_code'
  | 'get_current_time'
  | 'calculator';

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  collectionName?: string;
  workingDirectory?: string;
  allowFileWrite?: boolean;
  allowCodeExecution?: boolean;
  maxSearchResults?: number;
}
