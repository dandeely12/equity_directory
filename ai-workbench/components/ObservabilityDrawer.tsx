'use client';

import { useState, useEffect } from 'react';

interface ObservabilityDrawerProps {
  runId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface RunDetails {
  id: string;
  type: 'chat' | 'flow';
  mode?: string;
  userMessage?: string;
  assistantMessage?: string;
  modelCall?: any;
  vectorSearch?: any;
  toolCalls?: any[];
  events?: any[];
  steps?: any[];
  startTime: string;
  endTime: string;
  durationMs: number;
  totalTokens: number;
  totalCost: number;
  error?: string;
}

export default function ObservabilityDrawer({ runId, isOpen, onClose }: ObservabilityDrawerProps) {
  const [runDetails, setRunDetails] = useState<RunDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'prompt' | 'chunks' | 'raw'>('timeline');

  useEffect(() => {
    if (runId && isOpen) {
      fetchRunDetails();
    }
  }, [runId, isOpen]);

  const fetchRunDetails = async () => {
    if (!runId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/logs/${runId}`);
      const data = await response.json();
      if (data.success) {
        setRunDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching run details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Run Inspector
          </h3>
          {runId && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {runDetails?.type === 'chat' ? 'Chat Run' : 'Flow Run'} • {runId.slice(0, 8)}...
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      {runDetails && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}
          >
            Timeline
          </button>
          {runDetails.type === 'chat' && (
            <>
              <button
                onClick={() => setActiveTab('prompt')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                  activeTab === 'prompt'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                Prompt/Response
              </button>
              {runDetails.vectorSearch && (
                <button
                  onClick={() => setActiveTab('chunks')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === 'chunks'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Retrieved Chunks
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'raw'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}
          >
            Raw Data
          </button>
        </div>
      )}

      {/* Content */}
      <div className="h-96 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        ) : runDetails ? (
          <>
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                {/* Metrics */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Metrics
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {runDetails.durationMs}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tokens</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {runDetails.totalTokens}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cost</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${runDetails.totalCost.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <p className={`text-sm font-semibold ${runDetails.error ? 'text-red-600' : 'text-green-600'}`}>
                        {runDetails.error ? 'Failed' : 'Success'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Execution Timeline
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">Start</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(runDetails.startTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {runDetails.type === 'chat' && runDetails.vectorSearch && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-purple-500"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">Vector Search</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {runDetails.vectorSearch.durationMs}ms • {runDetails.vectorSearch.results?.length || 0} chunks retrieved
                          </p>
                        </div>
                      </div>
                    )}

                    {runDetails.type === 'chat' && runDetails.modelCall && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">Model Call</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {runDetails.modelCall.durationMs}ms • {runDetails.modelCall.modelId}
                          </p>
                        </div>
                      </div>
                    )}

                    {runDetails.type === 'flow' && runDetails.steps && runDetails.steps.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 mt-1.5 rounded-full ${step.error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">{step.stepName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {step.durationMs}ms • {step.stepType}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${runDetails.error ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">End</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(runDetails.endTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'prompt' && runDetails.type === 'chat' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Message</h4>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {runDetails.userMessage}
                  </div>
                </div>

                {runDetails.modelCall?.systemPrompt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System Prompt</h4>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {runDetails.modelCall.systemPrompt}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Final Prompt (sent to model)</h4>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {runDetails.modelCall?.prompt}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assistant Response</h4>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {runDetails.assistantMessage}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chunks' && runDetails.vectorSearch && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Retrieved Chunks ({runDetails.vectorSearch.results?.length || 0})
                  </h4>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Collection: {runDetails.vectorSearch.collection}
                  </div>
                </div>

                {runDetails.vectorSearch.results?.map((chunk: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Chunk #{idx + 1} • Score: {chunk.score.toFixed(3)}
                      </span>
                      {chunk.metadata?.kb_category && (
                        <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                          {chunk.metadata.kb_category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {chunk.content.slice(0, 300)}
                      {chunk.content.length > 300 && '...'}
                    </p>
                    {chunk.metadata?.title && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        From: {chunk.metadata.title}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'raw' && (
              <div>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-gray-900 dark:text-white">
                  {JSON.stringify(runDetails, null, 2)}
                </pre>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <p className="text-sm">Select a run to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
