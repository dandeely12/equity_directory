'use client';

import { useState, useEffect } from 'react';
import { FlowDefinition, FlowRun } from '@/types/flows';
import FlowEditor, { FlowEditorData } from './FlowEditor';

interface FlowInterfaceProps {
  onRunSelected: (runId: string) => void;
}

export default function FlowInterface({ onRunSelected }: FlowInterfaceProps) {
  const [flows, setFlows] = useState<FlowDefinition[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<FlowDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [lastRun, setLastRun] = useState<FlowRun | null>(null);
  const [view, setView] = useState<'list' | 'execute' | 'editor'>('list');

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/flows');
      const data = await response.json();
      if (data.success) {
        setFlows(data.data);
      }
    } catch (error) {
      console.error('Error fetching flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteFlow = async () => {
    if (!selectedFlow) return;

    setExecuting(true);
    try {
      const response = await fetch(`/api/flows/${selectedFlow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs }),
      });

      const data = await response.json();

      if (data.success) {
        setLastRun(data.data);
        alert('Flow executed successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error executing flow:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleSelectFlow = (flow: FlowDefinition) => {
    setSelectedFlow(flow);
    setView('execute');
    // Initialize inputs with empty strings
    const initialInputs: Record<string, string> = {};
    flow.inputVariables.forEach((varName) => {
      initialInputs[varName] = '';
    });
    setInputs(initialInputs);
    setLastRun(null);
  };

  const handleSaveFlow = async (flowData: FlowEditorData) => {
    try {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });

      const data = await response.json();

      if (data.success) {
        alert('Flow created successfully!');
        fetchFlows();
        setView('list');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving flow:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (view === 'editor') {
    return (
      <FlowEditor
        onSave={handleSaveFlow}
        onCancel={() => setView('list')}
      />
    );
  }

  if (view === 'execute' && selectedFlow) {
    return (
      <div className="h-full flex flex-col p-6 overflow-y-auto">
        <div className="mb-6">
          <button
            onClick={() => setView('list')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to flows
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {selectedFlow.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{selectedFlow.description}</p>
        </div>

        {/* Steps Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Flow Steps ({selectedFlow.steps.length})
          </h3>
          <div className="space-y-2">
            {selectedFlow.steps.map((step, idx) => (
              <div
                key={step.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {idx + 1}.
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    {step.type}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {step.name}
                  </span>
                </div>
                {step.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                    {step.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Variables */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Input Variables
          </h3>
          <div className="space-y-3">
            {selectedFlow.inputVariables.map((varName) => (
              <div key={varName}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {varName}
                </label>
                <textarea
                  value={inputs[varName] || ''}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [varName]: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={`Enter ${varName}...`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecuteFlow}
          disabled={executing}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {executing ? 'Executing...' : 'Execute Flow'}
        </button>

        {/* Last Run Results */}
        {lastRun && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Execution Results
            </h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                      lastRun.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : lastRun.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}
                  >
                    {lastRun.status}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Duration:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                    {lastRun.durationMs}ms
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Tokens:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                    {lastRun.totalTokens || 0}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Cost:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                    ${(lastRun.totalCost || 0).toFixed(4)}
                  </span>
                </div>
              </div>

              {lastRun.error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-sm text-red-800 dark:text-red-200">{lastRun.error}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Final Output:
                </h4>
                <pre className="p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-sm overflow-x-auto">
                  {JSON.stringify(lastRun.outputs, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => onRunSelected(lastRun.id)}
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View detailed logs →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Flows</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Multi-step workflows for complex AI tasks
          </p>
        </div>
        <button
          onClick={() => setView('editor')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
        >
          <span>+</span>
          <span>Create Flow</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-500 dark:text-gray-400">Loading flows...</p>
        </div>
      ) : flows.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
              No flows yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 mb-4">
              Create your first workflow to get started
            </p>
            <button
              onClick={() => setView('editor')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create Your First Flow
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer"
              onClick={() => handleSelectFlow(flow)}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {flow.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {flow.description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{flow.steps.length} steps</span>
                <span>
                  {flow.inputVariables.length} input
                  {flow.inputVariables.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
