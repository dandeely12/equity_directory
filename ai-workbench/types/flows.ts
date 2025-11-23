/**
 * Flow Definition Types
 * DB-backed flow configurations to eliminate file explosion
 */

export type FlowStepType =
  | 'model_call'      // Call an LLM with a template
  | 'vector_search'   // Query Qdrant for relevant docs
  | 'document_read'   // Read a local/raw document
  | 'branch';         // Conditional branching (future feature)

/**
 * Base step interface - all steps extend this
 */
export interface BaseFlowStep {
  id: string;
  type: FlowStepType;
  name: string;
  description?: string;
}

/**
 * Model Call Step
 * Calls an LLM with a prompt template
 */
export interface ModelCallStep extends BaseFlowStep {
  type: 'model_call';
  modelId: string;
  promptTemplate: string;          // Template with {{variables}}
  systemPrompt?: string;
  settings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  outputVariable: string;          // Where to store the result
}

/**
 * Vector Search Step
 * Searches Qdrant for relevant documents
 */
export interface VectorSearchStep extends BaseFlowStep {
  type: 'vector_search';
  collectionName: string;
  queryTemplate: string;           // Template for search query
  limit?: number;
  scoreThreshold?: number;
  filters?: Record<string, any>;   // Metadata filters
  outputVariable: string;
}

/**
 * Document Read Step
 * Reads a local document (NOT from vector DB)
 */
export interface DocumentReadStep extends BaseFlowStep {
  type: 'document_read';
  documentPath: string;            // Path to local document
  outputVariable: string;
}

/**
 * Branch Step (Future Feature)
 * Conditional logic in flows
 */
export interface BranchStep extends BaseFlowStep {
  type: 'branch';
  condition: string;               // Expression to evaluate
  trueBranch: FlowStep[];
  falseBranch: FlowStep[];
}

export type FlowStep =
  | ModelCallStep
  | VectorSearchStep
  | DocumentReadStep
  | BranchStep;

/**
 * Flow Definition
 * Stored in DB, edited via UI
 */
export interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  inputVariables: string[];        // Required inputs to run the flow
  outputVariable: string;          // Final output variable name
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Flow Execution
 */
export interface FlowExecutionContext {
  flowId: string;
  variables: Record<string, any>;  // Runtime variables
  currentStepIndex: number;
}

export interface FlowStepRun {
  stepId: string;
  stepType: FlowStepType;
  stepName: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    cost?: number;
    retrievedChunks?: number;
    [key: string]: any;
  };
}

export interface FlowRun {
  id: string;
  flowId: string;
  flowName: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  steps: FlowStepRun[];
  error?: string;
  totalTokens?: number;
  totalCost?: number;
}
