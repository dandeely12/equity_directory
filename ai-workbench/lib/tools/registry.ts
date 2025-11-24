/**
 * Tool Registry
 * Manages available tools and their definitions
 */

import { ToolDefinition } from '@/types/tools';

/**
 * Available tool definitions for LLMs
 */
export const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  vector_search: {
    name: 'vector_search',
    description: 'Search a vector database collection for relevant documents using semantic similarity',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query text',
        },
        collectionName: {
          type: 'string',
          description: 'Name of the collection to search',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
        },
        scoreThreshold: {
          type: 'number',
          description: 'Minimum similarity score threshold (0-1, default: 0.7)',
        },
      },
      required: ['query', 'collectionName'],
    },
  },

  web_search: {
    name: 'web_search',
    description: 'Search the web for current information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (default: 5)',
        },
      },
      required: ['query'],
    },
  },

  read_file: {
    name: 'read_file',
    description: 'Read the contents of a file',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to read',
        },
      },
      required: ['path'],
    },
  },

  write_file: {
    name: 'write_file',
    description: 'Write content to a file',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to write',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },

  get_current_time: {
    name: 'get_current_time',
    description: 'Get the current date and time',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Timezone (e.g., "America/New_York", default: UTC)',
        },
      },
    },
  },

  calculator: {
    name: 'calculator',
    description: 'Evaluate a mathematical expression',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate (e.g., "2 + 2 * 3")',
        },
      },
      required: ['expression'],
    },
  },
};

/**
 * Get tool definitions as OpenAI format
 */
export function getOpenAITools(toolNames?: string[]): any[] {
  const tools = toolNames || Object.keys(TOOL_DEFINITIONS);

  return tools.map((name) => {
    const def = TOOL_DEFINITIONS[name];
    if (!def) return null;

    return {
      type: 'function',
      function: {
        name: def.name,
        description: def.description,
        parameters: def.parameters,
      },
    };
  }).filter(Boolean);
}

/**
 * Get tool definitions as Claude format
 */
export function getClaudeTools(toolNames?: string[]): any[] {
  const tools = toolNames || Object.keys(TOOL_DEFINITIONS);

  return tools.map((name) => {
    const def = TOOL_DEFINITIONS[name];
    if (!def) return null;

    return {
      name: def.name,
      description: def.description,
      input_schema: def.parameters,
    };
  }).filter(Boolean);
}

/**
 * Get all available tool names
 */
export function getAvailableTools(): string[] {
  return Object.keys(TOOL_DEFINITIONS);
}

/**
 * Check if a tool is available
 */
export function isToolAvailable(toolName: string): boolean {
  return toolName in TOOL_DEFINITIONS;
}
