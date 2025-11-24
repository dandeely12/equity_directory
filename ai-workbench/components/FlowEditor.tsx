'use client';

import { useState, useEffect } from 'react';
import { FlowStep, FlowStepType } from '@/types/flows';

interface FlowEditorProps {
  onSave: (flowData: FlowEditorData) => void;
  onCancel: () => void;
  initialData?: FlowEditorData;
}

export interface FlowEditorData {
  name: string;
  description: string;
  inputVariables: string[];
  outputVariable: string;
  steps: FlowStep[];
}

export default function FlowEditor({ onSave, onCancel, initialData }: FlowEditorProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [inputVariables, setInputVariables] = useState<string[]>(
    initialData?.inputVariables || []
  );
  const [outputVariable, setOutputVariable] = useState(initialData?.outputVariable || '');
  const [steps, setSteps] = useState<FlowStep[]>(initialData?.steps || []);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [newInputVar, setNewInputVar] = useState('');

  const [models, setModels] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    fetchModels();
    fetchCollections();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models/list');
      const data = await response.json();
      if (data.success) {
        setModels(data.data);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/qdrant/collections');
      const data = await response.json();
      if (data.success) {
        setCollections(data.data);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const addStep = (type: FlowStepType) => {
    const stepId = `step${steps.length + 1}`;
    let newStep: FlowStep;

    switch (type) {
      case 'model_call':
        newStep = {
          id: stepId,
          type: 'model_call',
          name: 'Model Call',
          modelId: models[0]?.id || 'gpt-4-turbo',
          promptTemplate: '',
          outputVariable: 'result',
        };
        break;

      case 'vector_search':
        newStep = {
          id: stepId,
          type: 'vector_search',
          name: 'Vector Search',
          collectionName: collections[0]?.name || 'docs',
          queryTemplate: '',
          outputVariable: 'context',
        };
        break;

      case 'document_read':
        newStep = {
          id: stepId,
          type: 'document_read',
          name: 'Read Document',
          documentPath: '',
          outputVariable: 'content',
        };
        break;

      case 'branch':
        newStep = {
          id: stepId,
          type: 'branch',
          name: 'Conditional Branch',
          condition: '',
          trueBranch: [],
          falseBranch: [],
        };
        break;

      default:
        return;
    }

    setSteps([...steps, newStep]);
    setEditingStep(steps.length);
  };

  const updateStep = (index: number, updatedStep: FlowStep) => {
    const newSteps = [...steps];
    newSteps[index] = updatedStep;
    setSteps(newSteps);
  };

  const deleteStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    if (editingStep === index) {
      setEditingStep(null);
    }
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);

    if (editingStep === index) {
      setEditingStep(targetIndex);
    } else if (editingStep === targetIndex) {
      setEditingStep(index);
    }
  };

  const addInputVariable = () => {
    if (newInputVar && !inputVariables.includes(newInputVar)) {
      setInputVariables([...inputVariables, newInputVar]);
      setNewInputVar('');
    }
  };

  const removeInputVariable = (varName: string) => {
    setInputVariables(inputVariables.filter((v) => v !== varName));
  };

  const handleSave = () => {
    if (!name || !description || !outputVariable || steps.length === 0) {
      alert('Please fill in all required fields and add at least one step');
      return;
    }

    onSave({
      name,
      description,
      inputVariables,
      outputVariable,
      steps,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {initialData ? 'Edit Flow' : 'Create New Flow'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Flow Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="My AI Workflow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="What does this flow do?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Input Variables
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newInputVar}
                  onChange={(e) => setNewInputVar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addInputVariable()}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  placeholder="variableName"
                />
                <button
                  onClick={addInputVariable}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {inputVariables.map((varName) => (
                  <span
                    key={varName}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm flex items-center space-x-1"
                  >
                    <span>{varName}</span>
                    <button
                      onClick={() => removeInputVariable(varName)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Output Variable *
              </label>
              <input
                type="text"
                value={outputVariable}
                onChange={(e) => setOutputVariable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="finalResult"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content area: Steps + Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Steps list */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Steps ({steps.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addStep('model_call')}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                + Model Call
              </button>
              <button
                onClick={() => addStep('vector_search')}
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
              >
                + Vector Search
              </button>
              <button
                onClick={() => addStep('document_read')}
                className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
              >
                + Read Doc
              </button>
              <button
                onClick={() => addStep('branch')}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
              >
                + Branch
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  editingStep === idx
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setEditingStep(idx)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {idx + 1}. {step.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStep(idx, 'up');
                      }}
                      disabled={idx === 0}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStep(idx, 'down');
                      }}
                      disabled={idx === steps.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteStep(idx);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {step.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {editingStep !== null && steps[editingStep] ? (
            <StepEditor
              step={steps[editingStep]}
              models={models}
              collections={collections}
              onChange={(updatedStep) => updateStep(editingStep, updatedStep)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">No step selected</p>
                <p className="text-sm mt-1">Add a step or select one to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Save Flow
        </button>
      </div>
    </div>
  );
}

interface StepEditorProps {
  step: FlowStep;
  models: any[];
  collections: any[];
  onChange: (step: FlowStep) => void;
}

function StepEditor({ step, models, collections, onChange }: StepEditorProps) {
  switch (step.type) {
    case 'model_call':
      return <ModelCallEditor step={step} models={models} onChange={onChange} />;
    case 'vector_search':
      return <VectorSearchEditor step={step} collections={collections} onChange={onChange} />;
    case 'document_read':
      return <DocumentReadEditor step={step} onChange={onChange} />;
    case 'branch':
      return <BranchEditor step={step} onChange={onChange} />;
    default:
      return <div>Unknown step type</div>;
  }
}

function ModelCallEditor({ step, models, onChange }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Model Call Step</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Step Name
        </label>
        <input
          type="text"
          value={step.name}
          onChange={(e) => onChange({ ...step, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Model
        </label>
        <select
          value={step.modelId}
          onChange={(e) => onChange({ ...step, modelId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          System Prompt (optional)
        </label>
        <textarea
          value={step.systemPrompt || ''}
          onChange={(e) => onChange({ ...step, systemPrompt: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
          placeholder="You are a helpful assistant..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Prompt Template (use {'{'}{'{'} variable{'}'}{'}'}  syntax)
        </label>
        <textarea
          value={step.promptTemplate}
          onChange={(e) => onChange({ ...step, promptTemplate: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
          placeholder="Analyze this: {{input}}"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Output Variable
        </label>
        <input
          type="text"
          value={step.outputVariable}
          onChange={(e) => onChange({ ...step, outputVariable: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
}

function VectorSearchEditor({ step, collections, onChange }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vector Search Step</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Step Name
        </label>
        <input
          type="text"
          value={step.name}
          onChange={(e) => onChange({ ...step, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Collection
        </label>
        <select
          value={step.collectionName}
          onChange={(e) => onChange({ ...step, collectionName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {collections.map((col: any) => (
            <option key={col.name} value={col.name}>
              {col.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Query Template
        </label>
        <textarea
          value={step.queryTemplate}
          onChange={(e) => onChange({ ...step, queryTemplate: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
          placeholder="{{question}}"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Limit
          </label>
          <input
            type="number"
            value={step.limit || 5}
            onChange={(e) => onChange({ ...step, limit: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Score Threshold
          </label>
          <input
            type="number"
            step="0.1"
            value={step.scoreThreshold || 0.7}
            onChange={(e) => onChange({ ...step, scoreThreshold: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Output Variable
        </label>
        <input
          type="text"
          value={step.outputVariable}
          onChange={(e) => onChange({ ...step, outputVariable: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
}

function DocumentReadEditor({ step, onChange }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Read Step</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Step Name
        </label>
        <input
          type="text"
          value={step.name}
          onChange={(e) => onChange({ ...step, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Document Path
        </label>
        <input
          type="text"
          value={step.documentPath}
          onChange={(e) => onChange({ ...step, documentPath: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
          placeholder="path/to/{{filename}}.txt"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Output Variable
        </label>
        <input
          type="text"
          value={step.outputVariable}
          onChange={(e) => onChange({ ...step, outputVariable: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
}

function BranchEditor({ step, onChange }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Branch Step</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Conditional logic based on variables. Supports: ==, !=, &gt;, &lt;, &gt;=, &lt;=, contains, !contains
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Step Name
        </label>
        <input
          type="text"
          value={step.name}
          onChange={(e) => onChange({ ...step, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Condition
        </label>
        <input
          type="text"
          value={step.condition}
          onChange={(e) => onChange({ ...step, condition: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
          placeholder="{{status}} == 'success'"
        />
      </div>

      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> Branch sub-steps are not yet editable in this UI. Use the API to create complex branching flows.
        </p>
      </div>
    </div>
  );
}
